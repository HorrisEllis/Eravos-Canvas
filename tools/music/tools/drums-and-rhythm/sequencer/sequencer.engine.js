/* eravos.sequencer 2.1.0 (+A-4 paint view · 3.36 automation, conditions, evolve) — Step sequencer (P4) · resolves F-07, F-08, F-15(seq)
 * 3.36 — the Sequencer drives the whole canvas to the beat:
 *   · AUTO lanes: any knob of any tool (wobble rate, filter, FX mix …), a value per step, hold or glide to the next step
 *   · step LOCKS on note lanes: a step sets knobs of its own instrument for that hit, the knob returns after it
 *   · CONDITIONS per step: 1:2 · 2:2 · 1:4 … 4:4 (which pass of the pattern) · fill / not fill · first / not first
 *   · FILL (a switch, MIDI-mappable, a pad action) · EVOLVE per lane: from the 2nd pass notes wander in key, drums grow
 *     ghost notes — seeded, so the same every playback · HUMANIZE: timing + velocity
 *   All of it is pattern data: slots, chain, presets, packs and JSON carry it.
 * Follows transport:tick only (no own clock, no Space, BPM change never restarts).
 * Drum lanes fire pads (note 36+i); melodic lanes play SCALE DEGREES → every note is in key.
 * 8 slots A..H, cued switches at the next bar, chain (song mode), MIDI import/export. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const SLOTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const WDIV = { '2': '1/2', '4': '1/4', '4t': '1/4t', '8': '1/8', '8t': '1/8t', '16': '1/16', '16t': '1/16t', '32': '1/32', '1': '1/1' };
  const COLORS = ['#ff2266', '#ffaa00', '#ff66aa', '#ffdd00', '#ddff44', '#aa44ff', '#ff8844', '#44ccff', '#88ffee', '#00ff88', '#ccff99', '#ffcc66', '#00d4ff', '#b066ff', '#ff4488', '#66eeff'];
  const STEP_SCHEMA = { type: 'object', properties: { on: { type: 'boolean' }, vel: { type: 'number', minimum: 0, maximum: 1 }, prob: { type: 'number', minimum: 0, maximum: 1 }, degree: { type: 'integer', minimum: 1, maximum: 14 }, octave: { type: 'integer', minimum: -2, maximum: 2 }, gate: { type: 'number', minimum: 0.1, maximum: 4 }, accent: { type: 'boolean' }, slide: { type: 'boolean' }, ratchet: { type: 'integer', minimum: 1, maximum: 4 }, val: { type: 'number', minimum: 0, maximum: 1 }, cond: { type: 'string' }, locks: { type: ['object', 'null'] } } };
  const CONDS = ['', '1:2', '2:2', '1:3', '2:3', '3:3', '1:4', '2:4', '3:4', '4:4', 'fill', '!fill', 'first', '!first'];
  // deterministic noise for evolve / humanize: the same pass of the same step always does the same thing
  const hash = (...a) => { let h = 2166136261; a.forEach(x => { const s = String(x); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= 124; }); return ((h >>> 0) % 100000) / 100000; };

  function emptyStep() { return { on: false, vel: 0.8, prob: 1, degree: 1, octave: 0, gate: 1, accent: false, slide: false, ratchet: 1, wobbleDiv: null, val: 0.5, cond: '', locks: null }; }
  function mkTrack(o) { return Object.assign({ name: 'track', kind: 'drum', target: null, drumNote: 36, color: '#00d4ff', mute: false, solo: false, vol: 1, lengthOverride: 0, transpose: 0, role: null, param: null, mode: 'hold', evolve: 0 }, o || {}); }
  function mkPattern(len, tracks) { return { name: '', length: len || 16, steps: tracks.map(() => Array.from({ length: 64 }, emptyStep)) }; }

  function parseDrum(str, len) {
    const s = String(str).replace(/[|\s]/g, ''); const out = [];
    for (let i = 0; i < len; i++) { const c = s[i] || '.'; const st = emptyStep(); if (c !== '.' && c !== '-') { st.on = true; st.vel = c === 'X' ? 1 : c === 'o' ? 0.45 : 0.8; st.accent = c === 'X'; } out.push(st); }
    return out;
  }
  function parseMelodic(str, len) {
    const toks = String(str).trim().split(/\s+/); const out = [];
    for (let i = 0; i < len; i++) {
      const t = toks[i] || '.'; const st = emptyStep();
      const m = /^(\d+)([+-]*)(?:g(\d+(?:\.\d+)?))?(?:w(\d+t?))?(?:v(\d+))?(s)?(a)?$/.exec(t);
      if (m) {
        st.on = true; st.degree = Math.max(1, Math.min(14, +m[1]));
        st.octave = (m[2].match(/\+/g) || []).length - (m[2].match(/-/g) || []).length;
        if (m[3]) st.gate = Math.max(0.1, Math.min(4, +m[3]));
        if (m[3] && +m[3] > 4) st.gate = 4, st.longGate = +m[3];
        if (m[4]) st.wobbleDiv = WDIV[m[4]] || null;
        st.slide = !!m[6]; st.accent = !!m[7]; st.vel = m[5] ? Math.max(0.05, Math.min(1, +m[5] / 100)) : (st.accent ? 1 : 0.85);
      }
      out.push(st);
    }
    return out;
  }

  // 3.36 automation lane string: one char per step — '0'…'9' = value 0…1 (9 = top), 'm' = exactly the middle, '.' = no change. Spaces / | ignored.
  function parseAuto(str, len) {
    const s = String(str).replace(/[|\s]/g, ''); const out = [];
    for (let i = 0; i < len; i++) { const c = s[i] || '.', st = emptyStep(); if (/[0-9]/.test(c)) { st.on = true; st.val = +c / 9; } else if (c === 'm') { st.on = true; st.val = 0.5; } out.push(st); }
    return out;
  }
  // 3.36 compact pattern sets (Sequencer packs): lanes declared once, a step string per lane per slot, plus conditions
  // and knob locks by step. Instruments are named by tool (organism) or role, never by instance — a pack plays on any canvas.
  // { lanes:[{ name, kind:'drum'|'melodic'|'auto', organism?, role?, drumNote?, param?, mode?, evolve?, transpose?, color? }],
  //   slots:{ A:{ name, length, steps:{ lane: '…' }, conds?:{ lane:{ step: cond } }, locks?:{ lane:{ step:{ key: value } } } } },
  //   chain:[{ slot, repeats }] }
  function expandCompact(x) {
    const tracks = x.lanes.map((l, i) => mkTrack(Object.assign({ color: COLORS[i % COLORS.length] }, l, { target: null })));
    const patterns = {};
    SLOTS.forEach(sl => {
      const d = x.slots[sl], len = d ? d.length || 16 : 16, pat = mkPattern(len, tracks); pat.name = d && d.name || '';
      if (d) tracks.forEach((t, ti) => {
        const str = d.steps && d.steps[t.name]; if (str === undefined) return;
        const row = t.kind === 'auto' ? parseAuto(str, len) : t.kind === 'melodic' ? parseMelodic(str, len) : parseDrum(str, len);
        row.forEach((st, i) => { pat.steps[ti][i] = st; });
        const cs = d.conds && d.conds[t.name]; if (cs) Object.keys(cs).forEach(i => { if (pat.steps[ti][+i]) pat.steps[ti][+i].cond = cs[i]; });
        const lk = d.locks && d.locks[t.name]; if (lk) Object.keys(lk).forEach(i => { if (pat.steps[ti][+i]) pat.steps[ti][+i].locks = Object.assign({}, lk[i]); });
      });
      patterns[sl] = pat;
    });
    return { tracks, patterns, chain: x.chain || [{ slot: 'A', repeats: 1 }] };
  }

  OrganismFactory.define({
    id: 'eravos.sequencer', domain: 'music', version: '2.1.0', label: 'Sequencer', icon: '⬛', accent: '#00d4ff', phase: 'P4',
    category: 'Drums & rhythm', blurb: 'Step grid that plays any instrument. Melodic lanes use scale degrees — every note is in key.',
    size: { w: 780, h: 470 }, minSize: { w: 560, h: 320 },
    permissions: ['bus_publish', 'bus_subscribe', 'filesystem_read', 'registry_read'],
    provides: ['capability.sequencer', 'capability.pattern_store'],
    requires: [],
    hooks: [
      S.note_out('seq.hook.note_out'),
      S.event('seq.hook.fire_out', 'out', 'seq:fire', { type: 'object', required: ['track', 'step', 'sound', 'timestamp'] }, '1.0.0'),
      S.transport_in('seq.hook.transport_in'),
      S.theory_in('seq.hook.theory_in'),
      S.event('seq.hook.bank_in', 'in', 'pad:bank-change', { type: 'object', required: ['bank', 'pads'] }, '1.0.0'),
      Object.assign(S.event('seq.hook.record_in', 'in', 'pad:trigger|note:trigger', { type: 'object' }, '2.0.0'), { rail: false }),
      S.event('seq.hook.suggest_in', 'in', 'seq:pattern_suggest', { type: 'object', required: ['target', 'track', 'steps'] }, '1.0.0'),
      S.event('seq.hook.cue_in', 'in', 'seq:pattern_cue', { type: 'object', required: ['target', 'slot'] }, '1.0.0'),
      S.event('seq.hook.pattern_out', 'out', 'seq:pattern_changed', { type: 'object', required: ['slot', 'bar'] }, '1.0.0'),
      Object.assign(S.event('seq.hook.transport_out', 'out', 'ui:transport-play|ui:transport-bpm|ui:transport-stop', { type: 'object' }, '1.0.0'), { rail: false }),
      Object.assign(S.event('seq.hook.auto_out', 'out', 'ui:config_change', { type: 'object', required: ['key', 'value'] }, '1.0.0'), { rail: false, intent: 'automation lanes + step locks: set any tool’s knob on the beat' }),
    ],
    config: [
      { key: 'length', type: 'enum', options: [8, 12, 16, 24, 32, 48, 64], default: 16, label: 'Length', group: 'PATTERN' },
      { key: 'swing', type: 'number', default: 0, min: 0, max: 0.75, step: 0.01, label: 'Swing', group: 'PATTERN' },
      { key: 'slot', type: 'enum', options: SLOTS, default: 'A', label: 'Slot', group: 'PATTERN' },
      { key: 'chainOn', type: 'boolean', default: false, label: 'Song mode', group: 'PATTERN', hint: 'play the chain of slots in order' },
      { key: 'recordMode', type: 'enum', options: ['off', 'overdub', 'replace'], default: 'off', label: 'Record', group: 'PATTERN' },
      { key: 'view', type: 'enum', options: ['grid', 'paint'], default: 'grid', label: 'View', group: 'PATTERN' },
      { key: 'fill', type: 'boolean', default: false, label: 'Fill', group: 'PLAY', hint: 'steps set to “fill” play only while this is on (map it to a pad); “!fill” steps rest' },
      { key: 'humanize', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Humanize', group: 'PLAY', hint: 'a little timing and velocity life (repeatable)' },
      { key: 'seed', type: 'integer', default: 1, min: 1, max: 9999, label: 'Evolve seed', group: 'PLAY', hint: 'another number = another (repeatable) way the lanes evolve' },
    ],
    ui_hooks: ['transport_play', 'bpm_change', 'step_edit', 'track_edit', 'track_add', 'track_remove', 'slot_select', 'slot_cue', 'slot_copy', 'chain_edit', 'starter_load', 'import', 'export', 'clear_pattern', 'lock_set'],
    restoreTwice: true,
    engine(ctx) {
      const P = ctx.params, MT = window.MusicTheory, K = ctx.K, ac = ctx.ac;
      let tracks = [mkTrack({ name: 'kick', drumNote: 36, color: COLORS[0] }), mkTrack({ name: 'snare', drumNote: 37, color: COLORS[1] }), mkTrack({ name: 'clap', drumNote: 38, color: COLORS[2] }), mkTrack({ name: 'hat', drumNote: 39, color: COLORS[3] })];
      const patterns = {}; SLOTS.forEach(s => { patterns[s] = mkPattern(16, tracks); });
      let chain = [{ slot: 'A', repeats: 1 }];
      let cued = null, slotStart = 0, playing = false, lastTickStep = -1;
      const lastTick = { time: 0, step16: 0, stepDur: 0.125 };
      const missingLogged = new Set();
      const cur = () => patterns[P.get('slot')];

      // default target: first pads instance
      function autoTarget() {
        const pads = K.registry.byOrganism('eravos.pads')[0];
        tracks.forEach(t => { if (t.kind === 'drum' && !t.target && pads) t.target = pads.instance_id; });
      }
      autoTarget();

      function resolveRole(role) {
        const pref = role === 'bass' ? ['eravos.wobble-bass', 'eravos.reese-bass', 'eravos.acid-synth', 'eravos.supersaw'] : role === 'lead' ? ['eravos.supersaw', 'eravos.waveform-lab', 'eravos.acid-synth'] : ['eravos.supersaw', 'eravos.organ'];
        for (const id of pref) { const r = K.registry.byOrganism(id)[0]; if (r) return r.instance_id; }
        return null;
      }
      function noteFor(t, st) {
        if (t.kind === 'drum') return t.drumNote;
        const k = ctx.key;
        return MT.degreeToMidi(st.degree, 4 + st.octave + (t.transpose || 0), k.root, k.scale);
      }
      ctx.noteFor = noteFor;

      function fireStep(ti, t, st, localStep, time, stepDur) {
        if (!t.target) return;
        if (!K.registry.has(t.target)) { if (!missingLogged.has(t.target)) { missingLogged.add(t.target); ctx.fault('RUNTIME_003', `track ${t.name}: target ${t.target} not mounted — "no target"`); ctx.syncUI(); } return; }
        const n = st.ratchet || 1, d = stepDur / n;
        const baseGate = st.longGate || st.gate || 1;
        for (let r = 0; r < n; r++) {
          const payload = { target: t.target, note: noteFor(t, st), velocity: Math.max(0, Math.min(1, st.vel * (r ? 0.85 : 1) * (t.vol === undefined ? 1 : t.vol))), time: time + r * d, duration: n > 1 ? d * 0.8 : baseGate * stepDur, accent: !!st.accent, slide: !!st.slide };
          if (st.wobbleDiv) payload.wobbleDiv = st.wobbleDiv;
          ctx.emit('note:trigger', payload);
        }
        if (t.kind === 'drum') ctx.emit('seq:fire', { track: ti, step: localStep, sound: t.name, timestamp: time, target: t.target, index: t.drumNote - 36 });
      }

      // ---- 3.36 automation: one place turns a 0..1 lane value / a lock into a target knob change, at the step's audio time
      function cfgOf(target, key) { const r = K.registry.get(target); return r ? (r.descriptor.config || []).find(c => c.key === key) : null; }
      function denorm(c, u) {
        u = Math.max(0, Math.min(1, u));
        if (c.type === 'boolean') return u >= 0.5;
        if (c.type === 'enum') return c.options[Math.round(u * (c.options.length - 1))];
        let v = c.min + u * (c.max - c.min); if (c.step) v = Math.round(v / c.step) * c.step; if (c.type === 'integer') v = Math.round(v); return v;
      }
      ctx.denorm = denorm;
      const setKnob = (target, key, value, time) => { const go = () => { if (K.registry.has(target)) ctx.emit('ui:config_change:' + target, { key, value, _auto: true, _from_seq: true }); }; if (time > ac.currentTime + 0.004) ctx.atAudioTime(time, go); else go(); };
      function fireAuto(t, st, ls, pat, time, stepDur) {
        if (!t.target || !t.param || !K.registry.has(t.target)) return;
        const c = cfgOf(t.target, t.param); if (!c) return;
        setKnob(t.target, t.param, denorm(c, st.val), time);
        if (t.mode === 'glide' && typeof c.min === 'number') {
          const len = t.lengthOverride || pat.length, row = pat.steps[tracks.indexOf(t)]; let d = 1;
          while (d < len && !row[(ls + d) % len].on) d++;
          const nx = row[(ls + d) % len]; if (!nx || !nx.on) return;
          const n = Math.min(32, d * 4); for (let k = 1; k < n; k++) setKnob(t.target, t.param, denorm(c, st.val + (nx.val - st.val) * k / n), time + k * d * stepDur / n);
        }
      }
      // locks: base values are read once, restored on the lane's next hit that does not lock that knob
      const lockBase = new Map();   // trackIndex → { key: base }
      function applyLocks(ti, t, st, time) {
        if (!t.target || !K.registry.has(t.target)) return;
        const base = lockBase.get(ti) || {}, locks = st.locks || {};
        Object.keys(base).forEach(k => { if (!(k in locks)) { setKnob(t.target, k, base[k], time); delete base[k]; } });
        Object.keys(locks).forEach(k => { const c = cfgOf(t.target, k); if (!c) return; if (!(k in base)) base[k] = K.registry.readParam(ctx.id, t.target, k); setKnob(t.target, k, locks[k], time); });
        lockBase.set(ti, base);
      }
      function restoreLocks() { lockBase.forEach((base, ti) => { const t = tracks[ti]; if (t && t.target) Object.keys(base).forEach(k => setKnob(t.target, k, base[k], ac.currentTime)); }); lockBase.clear(); }
      ctx.restoreLocks = restoreLocks;
      function condOK(c, pass) {
        if (!c) return true;
        if (c === 'fill') return !!P.get('fill'); if (c === '!fill') return !P.get('fill');
        if (c === 'first') return pass === 0; if (c === '!first') return pass > 0;
        const m = /^(\d):(\d)$/.exec(c); return m ? pass % +m[2] === +m[1] - 1 : true;
      }
      ctx.condOK = condOK;
      function slotForBar(bar) { // chain / song mode
        let total = 0; const lens = chain.map(c => ({ c, bars: Math.max(1, patterns[c.slot].length / 16) * c.repeats }));
        const all = lens.reduce((a, x) => a + x.bars, 0); if (!all) return null;
        let b = bar % all;
        for (const x of lens) { if (b < x.bars) return { slot: x.c.slot, start: total }; b -= x.bars; total += x.bars; }
        return null;
      }

      function onTick(tk) {
        playing = true; lastTickStep = tk.step16; Object.assign(lastTick, tk);
        if (tk.step16 % 16 === 0) { // bar boundary: cue / chain
          let changed = null;
          if (P.get('chainOn')) { const s = slotForBar(Math.floor(tk.step16 / 16)); if (s && (s.slot !== P.get('slot') || tk.step16 === 0)) { changed = s.slot; slotStart = tk.step16; } }
          if (cued && cued.atStep === undefined && (!cued.atBar || tk.bar >= cued.atBar) && (cued.atBar || tk.step16 > cued.after)) { changed = cued.slot; cued = null; slotStart = tk.step16; }
          if (changed) { if (changed !== P.get('slot')) P.set('slot', changed); ctx.emit('seq:pattern_changed', { slot: changed, bar: tk.bar }); ctx.syncUI(); }
        }
        // exact-step cues (conductor: drop builder sections may start off the bar line)
        if (cued && cued.atStep !== undefined && tk.step16 >= cued.atStep) { const sl = cued.slot; cued = null; slotStart = tk.step16; if (sl !== P.get('slot')) P.set('slot', sl); ctx.emit('seq:pattern_changed', { slot: sl, bar: tk.bar }); ctx.syncUI(); }
        const pat = cur();
        const soloOn = tracks.some(t => t.solo);
        const hum = P.get('humanize') || 0, seed = P.get('seed') || 1, slot = P.get('slot');
        tracks.forEach((t, ti) => {
          if (t.mute || (soloOn && !t.solo)) return;
          const len = t.lengthOverride || pat.length;
          const rel = tk.step16 - slotStart, ls = ((rel % len) + len) % len, pass = Math.max(0, Math.floor(rel / len));
          let st = pat.steps[ti] && pat.steps[ti][ls];
          if (!st) return;
          const swingOff = (ls % 2 === 1) ? P.get('swing') * tk.stepDur : 0;
          if (t.kind === 'auto') { if (st.on && condOK(st.cond, pass)) fireAuto(t, st, ls, pat, tk.time + swingOff, tk.stepDur); return; }
          // evolve (from the 2nd pass): melodic notes wander in key, a few rest; drum lanes grow ghost notes on empty offbeats
          const ev = t.evolve || 0, r = ev && pass > 0 ? hash(seed, slot, ti, ls, pass) : 1;
          if (!st.on) { if (t.kind === 'drum' && r < ev * 0.09 && ls % 2 === 1) st = Object.assign(emptyStep(), { on: true, vel: 0.3 + 0.2 * hash(seed, ls, pass, 'g') }); else return; }
          else if (r < ev * 0.1) return;
          else if (t.kind === 'melodic' && r < ev * 0.45) { const d = hash(seed, ti, ls, pass, 'd') < 0.5 ? -1 : 1, mag = hash(seed, ls, 'm') < 0.7 ? 1 : 2; st = Object.assign({}, st, { degree: Math.max(1, Math.min(14, st.degree + d * mag)) }); }
          if (!condOK(st.cond, pass)) return;
          if (st.prob < 1 && Math.random() >= st.prob) return;
          let tt = tk.time + swingOff;
          if (hum) { tt += (hash(seed, ti, ls, pass, 'h') - 0.5) * hum * 0.022; st = Object.assign({}, st, { vel: Math.max(0.05, Math.min(1, st.vel * (1 - hum * 0.25 * hash(seed, ls, pass, 'v')))) }); tt = Math.max(tk.time, tt); }
          if (t.kind === 'melodic' || t.kind === 'drum') applyLocks(ti, t, st, tt);
          fireStep(ti, t, st, ls, tt, tk.stepDur);
        });
        const ls = ((tk.step16 - slotStart) % pat.length + pat.length) % pat.length;
        ctx.emitUI('step_cursor', { step: ls, bar: tk.bar, time: tk.time });
      }
      ctx.onTick(onTick);
      ctx.onStop(() => { playing = false; restoreLocks(); ctx.emitUI('step_cursor', { step: -1, bar: 0, time: 0 }); });
      const replaced = new Set();
      ctx.onPlay(() => { slotStart = 0; replaced.clear(); });
      ctx.on('transport:loop', null, (p) => { if (p && typeof p.toStep16 === 'number' && p.seek) slotStart = 0; });

      // ---- edits
      function syncGrid() {
        const pat = cur();
        ctx.emitUI('grid_sync', {
          slot: P.get('slot'), length: pat.length, cued: cued ? cued.slot : null, chain, slotStart,
          tracks: tracks.map((t, i) => Object.assign({}, t, { params: t.target && K.registry.get(t.target) ? (K.registry.get(t.target).descriptor.config || []).filter(c => !c.hidden && ['number', 'integer', 'enum', 'boolean'].includes(c.type)).map(c => ({ key: c.key, label: c.label || c.key, type: c.type, min: c.min, max: c.max, step: c.step, options: c.options })) : [], paramLabel: t.param && t.target && cfgOf(t.target, t.param) ? (cfgOf(t.target, t.param).label || t.param) : null, missing: !!(t.target && !K.registry.has(t.target)), targetLabel: t.target && K.registry.get(t.target) ? K.registry.get(t.target).descriptor.label : null, steps: pat.steps[i].slice(0, t.lengthOverride || pat.length), notes: pat.steps[i].slice(0, t.lengthOverride || pat.length).map(st => t.kind === 'melodic' ? MT.noteName(noteFor(t, st)) : '') })),
          slotsUsed: SLOTS.filter(s => patterns[s].steps.some(r => r.some(x => x.on))),
          names: Object.fromEntries(SLOTS.map(s => [s, patterns[s].name || ''])),
        });
      }
      ctx.syncGrid = syncGrid;
      ctx.stateExtra = () => { setTimeout(syncGrid, 0); return {}; };
      P.onChange('slot', () => { syncGrid(); P.set('length', cur().length, { silent: true }); });
      P.onChange('length', (v) => { cur().length = +v; syncGrid(); });
      ctx.onKey(() => syncGrid());

      ctx.onUI('step_edit', { type: 'object', required: ['track', 'step', 'patch'], properties: { track: { type: 'integer', minimum: 0 }, step: { type: 'integer', minimum: 0, maximum: 63 }, patch: STEP_SCHEMA } }, (p) => {
        const row = cur().steps[p.track]; if (!row) return ctx.fault('RUNTIME_002', 'step_edit: no track ' + p.track);
        if (p.patch.cond !== undefined && !CONDS.includes(p.patch.cond)) return ctx.fault('RUNTIME_002', 'step_edit: condition ' + p.patch.cond);
        Object.assign(row[p.step], p.patch); if (p.patch.gate !== undefined) delete row[p.step].longGate; syncGrid();
      });
      ctx.onUI('track_edit', { type: 'object', required: ['track', 'patch'] }, (p) => {
        const t = tracks[p.track]; if (!t) return ctx.fault('RUNTIME_002', 'track_edit: no track ' + p.track);
        const allowed = ['name', 'kind', 'target', 'drumNote', 'color', 'mute', 'solo', 'vol', 'lengthOverride', 'transpose', 'param', 'mode', 'evolve'];
        // 3.37: each lane has its own volume (scales its notes' velocity, 0–1) — saved with the pattern set
        if (p.patch.vol !== undefined) { const v = Number(p.patch.vol); if (!Number.isFinite(v)) return ctx.fault('RUNTIME_002', 'lane volume must be a number'); p.patch.vol = Math.max(0, Math.min(1, v)); }
        Object.keys(p.patch).forEach(k => { if (allowed.includes(k)) t[k] = p.patch[k]; else ctx.fault('RUNTIME_002', 'track_edit: key ' + k); });
        if (p.patch.target) missingLogged.delete(p.patch.target);
        syncGrid();
      });
      function addTrack(o) {
        o = o || {};
        const t = mkTrack(Object.assign({ color: COLORS[tracks.length % COLORS.length] }, o));
        if (t.kind === 'drum' && !o.drumNote) t.drumNote = 36 + Math.min(15, tracks.filter(x => x.kind === 'drum').length);
        tracks.push(t); SLOTS.forEach(s => patterns[s].steps.push(Array.from({ length: 64 }, emptyStep)));
        return tracks.length - 1;
      }
      ctx.addTrack = addTrack;
      ctx.onUI('track_add', { type: 'object' }, (p) => { addTrack(p || {}); syncGrid(); });
      ctx.onUI('track_remove', { type: 'object', required: ['track'] }, (p) => { if (!tracks[p.track]) return; tracks.splice(p.track, 1); SLOTS.forEach(s => patterns[s].steps.splice(p.track, 1)); syncGrid(); });
      ctx.onUI('slot_select', { type: 'object', required: ['slot'] }, (p) => P.set('slot', p.slot));
      ctx.onUI('lock_set', { type: 'object', required: ['track', 'step', 'key'] }, (p) => {
        const row = cur().steps[p.track], t = tracks[p.track]; if (!row || !row[p.step] || !t) return;
        const st = row[p.step]; st.locks = Object.assign({}, st.locks || {});
        if (p.value === null || p.value === undefined) delete st.locks[p.key]; else st.locks[p.key] = p.value;
        if (!Object.keys(st.locks).length) st.locks = null; syncGrid();
      });
      ctx.onUI('slot_cue', { type: 'object', required: ['slot'] }, (p) => { if (!playing) P.set('slot', p.slot); else cued = { slot: p.slot, after: lastTickStep }; syncGrid(); });
      ctx.onUI('slot_copy', { type: 'object', required: ['from', 'to'] }, (p) => { patterns[p.to] = JSON.parse(JSON.stringify(patterns[p.from])); syncGrid(); });
      ctx.onUI('chain_edit', { type: 'object', required: ['chain'] }, (p) => { chain = p.chain.filter(c => SLOTS.includes(c.slot)).map(c => ({ slot: c.slot, repeats: Math.max(1, Math.min(64, c.repeats | 0 || 1)) })); syncGrid(); });
      ctx.onUI('clear_pattern', null, () => { cur().steps.forEach(r => r.forEach((s, i) => { r[i] = emptyStep(); })); syncGrid(); });
      ctx.onUI('transport_play', null, () => ctx.emit('ui:transport-play', { toggle: true }));
      ctx.onUI('bpm_change', { type: 'object', required: ['bpm'] }, (p) => ctx.emit('ui:transport-bpm', { bpm: p.bpm }));

      // ---- starters (data/patterns)
      function loadStarter(name) {
        const d = (window.ERAVOS_DATA.patterns || {})[name];
        if (!d) return ctx.fault('MOUNT_005', 'starter ' + name + ' not found');
        const lanes = [];
        Object.values(d.slots).forEach(sl => sl.lanes.forEach(l => { if (!lanes.find(x => x.name === l.name)) lanes.push(l); }));
        const pads = K.registry.byOrganism('eravos.pads')[0];
        tracks = lanes.map((l, i) => l.pad !== undefined
          ? mkTrack({ name: l.name, kind: 'drum', drumNote: 36 + l.pad, target: pads ? pads.instance_id : null, color: COLORS[l.pad % 16] })
          : mkTrack({ name: l.name, kind: 'melodic', role: l.role, target: resolveRole(l.role), color: l.role === 'bass' ? '#ff2266' : '#00d4ff', transpose: l.octave || 0 }));
        SLOTS.forEach(s => { patterns[s] = mkPattern(16, tracks); });
        Object.keys(d.slots).forEach(s => {
          const sl = d.slots[s], pat = patterns[s]; pat.length = sl.length; pat.name = sl.name || '';
          sl.lanes.forEach(l => { const ti = tracks.findIndex(t => t.name === l.name); const row = l.pad !== undefined ? parseDrum(l.steps, sl.length) : parseMelodic(l.steps, sl.length); row.forEach((st, i) => { pat.steps[ti][i] = st; }); });
        });
        if (d.swing !== undefined) P.set('swing', d.swing);
        chain = d.song ? [{ slot: 'A', repeats: 2 }, { slot: 'B', repeats: 2 }, { slot: 'C', repeats: 4 }, { slot: 'D', repeats: 2 }] : [{ slot: 'A', repeats: 1 }];
        P.set('slot', 'A'); P.set('length', patterns.A.length, { silent: true });
        if (d.bpm) ctx.emit('ui:transport-bpm', { bpm: d.bpm });
        if (pads && d.bank !== undefined) K.bus.publish('ui:bank_select:' + pads.instance_id, { bank: d.bank });
        ctx.currentStarter = name;
        syncGrid(); ctx.syncUI();
      }
      ctx.loadStarter = loadStarter;
      ctx.onUI('starter_load', { type: 'object', required: ['name'] }, (p) => loadStarter(p.name));
      // re-resolve role lanes when an instrument appears
      ctx.on('kernel:organism-mounted', null, () => { let ch = false; tracks.forEach(t => { if ((t.role || t.organism) && !t.target) { t.target = resolveLane(t); ch = ch || !!t.target; } if (t.kind === 'drum' && !t.target && !t.organism) { const pd = K.registry.byOrganism('eravos.pads')[0]; if (pd) { t.target = pd.instance_id; ch = true; } } }); if (ch) syncGrid(); });
      ctx.on('kernel:organism-unmounted', null, (p) => { if (tracks.some(t => t.target === p.instanceId)) syncGrid(); });

      // wire drag seq.note_out → instrument: add a lane for it (or retarget an empty one)
      ctx.on('kernel:wire-registered', null, (w) => {
        if (w.src.instanceId !== ctx.id || w.src.hookId !== 'seq.hook.note_out') return;
        const r = K.registry.get(w.dst.instanceId); if (!r) return;
        if (tracks.some(t => t.target === w.dst.instanceId)) return;
        const isDrum = (r.descriptor.provides || []).includes('capability.pad_trigger');
        if (isDrum) tracks.forEach(t => { if (t.kind === 'drum') t.target = w.dst.instanceId; });
        else addTrack({ name: r.descriptor.label.toLowerCase(), kind: 'melodic', target: w.dst.instanceId, color: r.descriptor.accent, transpose: /bass/i.test(r.descriptor.label) ? -2 : 0 });
        syncGrid();
      });

      // ---- pattern suggestions (acid generator, EDM Lab print, euclid, orbit)
      ctx.on('seq:pattern_suggest', { type: 'object', required: ['target', 'track', 'steps'] }, (p) => {
        if (p.target !== ctx.id) return;
        let ti = typeof p.track === 'number' ? p.track : tracks.findIndex(t => t.name === p.track);
        const melodic = p.steps.some(s => s.degree !== undefined) && !p.drumNote;
        if (ti < 0 || !tracks[ti]) ti = addTrack({ name: String(p.track), kind: melodic ? 'melodic' : 'drum', target: p.instrument || null, drumNote: p.drumNote || 36, transpose: p.transpose || 0 });
        else if (p.instrument) tracks[ti].target = p.instrument;
        const pat = p.slot && patterns[p.slot] ? patterns[p.slot] : cur();
        if (p.length) pat.length = p.length;
        p.steps.slice(0, 64).forEach((s, i) => { pat.steps[ti][i] = Object.assign(emptyStep(), { on: !!s.on, degree: s.degree || 1, octave: s.octave || 0, accent: !!s.accent, slide: !!s.slide, vel: s.vel !== undefined ? s.vel : (s.accent ? 1 : 0.8), gate: s.gate || (s.slide ? 1.2 : 1), prob: s.prob !== undefined ? s.prob : 1 }); });
        if (!p.length && p.steps.length > pat.length && [8, 12, 16, 24, 32, 48, 64].includes(p.steps.length)) pat.length = p.steps.length;
        syncGrid(); ctx.syncUI();
      });
      ctx.on('seq:pattern_cue', { type: 'object', required: ['target', 'slot'] }, (p) => {
        if (p.target !== ctx.id || !SLOTS.includes(p.slot)) return;
        if (!playing && typeof p.step !== 'number') { P.set('slot', p.slot); slotStart = 0; } else cued = { slot: p.slot, atBar: typeof p.bar === 'number' ? p.bar : null, atStep: typeof p.step === 'number' ? p.step : undefined, after: lastTickStep };
        syncGrid();
      });
      ctx.on('pad:bank-change', { type: 'object', required: ['bank', 'pads'] }, (p) => {
        let ch = false; tracks.forEach(t => { if (t.kind === 'drum' && (t.target === p._from || (!t.target && p.kind !== 'sfx'))) { const pd = p.pads[t.drumNote - 36]; if (pd && !t.userNamed) { t.padName = pd.name; ch = true; } } });
        if (ch) syncGrid();
      });
      // ---- live record (quantized to current step)
      ['pad:trigger', 'note:trigger'].forEach(topic => ctx.on(topic, { type: 'object' }, (p) => {
        const mode = P.get('recordMode'); if (mode === 'off' || !playing || p._from === ctx.id) return;
        const src = p.source === 'pads' ? p._from : p.target;
        const time = typeof p.time === 'number' ? p.time : ac.currentTime;
        const rel = Math.round((time - lastTick.time) / lastTick.stepDur);
        const pat = cur(); const abs = lastTickStep + rel; const ls = ((abs - slotStart) % pat.length + pat.length) % pat.length;
        let ti;
        if (topic === 'pad:trigger') ti = tracks.findIndex(t => t.kind === 'drum' && t.drumNote === 36 + p.index);
        else ti = tracks.findIndex(t => t.kind === 'melodic' && t.target === src);
        if (ti < 0) return;
        if (mode === 'replace' && !replaced.has(ti)) { replaced.add(ti); pat.steps[ti].forEach((x, i) => { pat.steps[ti][i] = emptyStep(); }); }
        const st = pat.steps[ti][ls]; st.on = true; st.vel = p.velocity || 0.8;
        if (topic === 'note:trigger') { const k = ctx.key; const dg = MT.degreeOf(p.note, k.root, k.scale); st.degree = dg.degree; st.octave = Math.max(-2, Math.min(2, dg.octave - 4 - (tracks[ti].transpose || 0))); }
        syncGrid();
      }));

      // ---- MIDI / JSON
      ctx.onUI('export', { type: 'object', required: ['format'] }, (p) => {
        const pat = cur();
        if (p.format === 'json') { ctx.emitUI('export_ready', { name: 'pattern-' + P.get('slot') + '.json', mime: 'application/json', data: JSON.stringify({ eravos_pattern: 1, tracks, patterns, chain }) }); return; }
        const ppq = 96, sdt = ppq / 4;
        const song = { ppq, tempo: ctx.bpm, tracks: tracks.map((t, ti) => ({ name: t.name, events: pat.steps[ti].slice(0, t.lengthOverride || pat.length).map((st, i) => st.on ? { tick: i * sdt, note: noteFor(t, st), vel: st.vel, dur: Math.round((st.longGate || st.gate) * sdt) } : null).filter(Boolean) })).filter((x, ti) => tracks[ti].kind !== 'auto') };
        ctx.emitUI('export_ready', { name: 'pattern-' + P.get('slot') + '.mid', mime: 'audio/midi', data: MT.midi.write(song) });
      });
      ctx.exportMidi = () => { let got = null; const un = K.bus.subscribe('org:export_ready:' + ctx.id, (x) => { got = x; }); K.bus.publish('ui:export:' + ctx.id, { format: 'mid' }); un(); return got && got.data; };
      ctx.onUI('import', { type: 'object', required: ['arrayBuffer'] }, (p) => {
        const txt = (() => { try { return new TextDecoder().decode(p.arrayBuffer); } catch (e) { return ''; } })();
        if (/^\s*\{/.test(txt)) { try { const j = JSON.parse(txt); if (!j.eravos_pattern) throw new Error('not a pattern'); tracks = j.tracks; Object.assign(patterns, j.patterns); chain = j.chain || chain; syncGrid(); } catch (e) { ctx.fault('MOUNT_005', 'bad pattern data: ' + e.message); } return; }
        let song; try { song = MT.midi.parse(p.arrayBuffer); } catch (e) { return ctx.fault('ASSET_002', 'bad MIDI: ' + e.message); }
        const sdt = song.ppq / 4;
        let maxStep = 0; song.tracks.forEach(tr => tr.events.forEach(e => { maxStep = Math.max(maxStep, Math.round(e.tick / sdt) + 1); }));
        const len = [8, 12, 16, 24, 32, 48, 64].find(l => l >= maxStep) || 64;
        const pads = K.registry.byOrganism('eravos.pads')[0];
        const k = ctx.key;
        tracks = song.tracks.map((tr, i) => {
          const drum = tr.events.every(e => e.note >= 36 && e.note <= 51) && new Set(tr.events.map(e => e.note)).size === 1;
          return mkTrack({ name: tr.name, kind: drum ? 'drum' : 'melodic', drumNote: drum ? tr.events[0].note : 36, target: drum && pads ? pads.instance_id : resolveRole('bass'), color: COLORS[i % 16], transpose: 0 });
        });
        const pat = mkPattern(len, tracks);
        song.tracks.forEach((tr, ti) => tr.events.forEach(e => {
          const i = Math.round(e.tick / sdt); if (i >= 64) return;
          const st = pat.steps[ti][i]; st.on = true; st.vel = e.vel; st.gate = Math.max(0.1, Math.min(4, e.dur / sdt));
          if (tracks[ti].kind === 'melodic') { const dg = MT.degreeOf(e.note, k.root, k.scale); st.degree = dg.degree; st.octave = Math.max(-2, Math.min(2, dg.octave - 4)); if (dg.octave - 4 < -2 || dg.octave - 4 > 2) tracks[ti].transpose = dg.octave - 4 - st.octave; }
        }));
        patterns[P.get('slot')] = pat; P.set('length', len, { silent: true });
        if (song.tempo) ctx.emit('ui:transport-bpm', { bpm: Math.round(song.tempo) });
        syncGrid();
      });

      ctx.saveExtra = () => ({ tracks, patterns, chain, starter: ctx.currentStarter || null });
      // a lane names its instrument by tool (organism, 3.36) or role; resolved now and again whenever a tool appears
      function resolveLane(t) {
        if (t.organism) { const r = K.registry.byOrganism(t.organism)[0]; if (r) return r.instance_id; return t.role ? resolveRole(t.role) : null; }   // a named tool that is absent: wait for it (never another tool's pads)
        if (t.role) return resolveRole(t.role);
        if (t.kind === 'drum') { const pd = K.registry.byOrganism('eravos.pads')[0]; return pd ? pd.instance_id : null; }
        return null;
      }
      ctx.loadExtra = (x) => {
        if (x && Array.isArray(x.lanes) && x.slots) x = expandCompact(x);
        if (!x || !Array.isArray(x.tracks) || !x.patterns) return ctx.fault('MOUNT_005', 'sequencer: bad pattern data');
        tracks = x.tracks.map(t => mkTrack(t));
        tracks.forEach(t => { if (!t.target) t.target = resolveLane(t); });
        // 3.26: a saved pattern set (user preset) points at instruments that may be gone — re-aim it at what is on the canvas now
        tracks.forEach(t => { if (t.target && !K.registry.has(t.target)) t.target = resolveLane(t); });
        SLOTS.forEach(s => { patterns[s] = x.patterns[s] || mkPattern(16, tracks); });
        chain = x.chain || chain; ctx.currentStarter = x.starter || null; syncGrid();
      };
      ctx.internals = { CONDS, expandCompact, parseAuto, get tracks() { return tracks; }, patterns, get chain() { return chain; }, get cued() { return cued; }, parseMelodic, parseDrum };
      setTimeout(syncGrid, 0);
      return {};
    },
  });
})();
