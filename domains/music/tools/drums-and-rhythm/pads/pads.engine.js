/* eravos.pads 2.0.0 — Drum Machine (P2) · resolves F-11(drums), F-15
 * 16 velocity-sensitive pads × 4 banks (D = future/Monstercat, P9); each pad a synthesised voice or a loaded sample.
 * Per-pad voice graphs, choke groups, internal per-pad mixer → one audio port. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const VOICES = ['kick', 'snare', 'hat', 'openhat', 'clap', '808', 'rim', 'tom', 'crash', 'perc', 'shaker', 'cowbell', 'sample'];
  const VOICE_DEFAULTS = {
    kick: { decay: 0.45, color: '#ff2266' }, snare: { decay: 0.22, color: '#ffaa00' }, hat: { decay: 0.05, color: '#ffdd00' },
    openhat: { decay: 0.4, color: '#ddff44', choke: 1 }, clap: { decay: 0.25, color: '#ff66aa' }, '808': { decay: 1.4, color: '#aa44ff' },
    rim: { decay: 0.08, color: '#ff8844' }, tom: { decay: 0.4, color: '#44ccff' }, crash: { decay: 1.8, color: '#88ffee' },
    perc: { decay: 0.18, color: '#00ff88' }, shaker: { decay: 0.12, color: '#ccff99' }, cowbell: { decay: 0.3, color: '#ffcc66' }, sample: { decay: 4, color: '#aa44ff' },
  };
  function pad(voice, o) { return Object.assign({ voice, tune: 0, decay: VOICE_DEFAULTS[voice].decay, level: 1, pan: 0, drive: 0, choke: VOICE_DEFAULTS[voice].choke || 0, color: VOICE_DEFAULTS[voice].color, sample: null }, o || {}); }
  function defaultBanks() {
    return [
      // A — EDM core kit
      [pad('kick'), pad('snare'), pad('clap'), pad('hat'), pad('openhat'), pad('808'), pad('rim'), pad('tom'),
       pad('crash'), pad('perc'), pad('shaker'), pad('cowbell'), pad('tom', { tune: 7 }), pad('snare', { tune: 5, decay: 0.12, level: 0.8 }), pad('kick', { tune: -5, decay: 0.9, drive: 0.6 }), pad('sample', { level: 1 })],
      // B — heavy (dubstep / trap)
      [pad('kick', { drive: 0.7, decay: 0.55, tune: -2 }), pad('snare', { tune: -3, decay: 0.35, drive: 0.3 }), pad('clap', { decay: 0.4 }), pad('hat', { decay: 0.035 }), pad('openhat', { decay: 0.6 }), pad('808', { tune: -2, decay: 2, drive: 0.4 }), pad('rim', { tune: 3 }), pad('tom', { tune: -5 }),
       pad('crash', { decay: 3 }), pad('perc', { tune: 12 }), pad('shaker', { decay: 0.2 }), pad('cowbell', { tune: -7 }), pad('tom', { tune: 12 }), pad('snare', { tune: 12, decay: 0.08 }), pad('808', { tune: 5, decay: 0.8 }), pad('sample', { level: 1 })],
      // C — breaks / world (A-6: 'break' sample slot fed by clip-maker)
      [pad('kick', { decay: 0.3, tune: 3 }), pad('snare', { tune: 2, decay: 0.18 }), pad('rim'), pad('hat', { tune: 5 }), pad('openhat', { tune: 5 }), pad('perc', { tune: -5 }), pad('perc', { tune: 2 }), pad('perc', { tune: 7 }),
       pad('shaker'), pad('cowbell'), pad('tom', { tune: -7 }), pad('tom'), pad('tom', { tune: 7 }), pad('clap', { decay: 0.15 }), pad('sample', { level: 1, color: '#00ff88' }), pad('sample', { level: 1, color: '#00d4ff' })],
      futureBank(),
    ];
  }
  // D — future bass / Monstercat (P9): punchy kick, big layered clap-snare, tight hats, long 808, fills
  function futureBank() {
    return [pad('kick', { tune: 2, decay: 0.42, drive: 0.35 }), pad('snare', { tune: 1, decay: 0.3, drive: 0.15 }), pad('clap', { tune: 2, decay: 0.45 }), pad('hat', { tune: 3, decay: 0.03 }),
     pad('openhat', { tune: 2, decay: 0.35 }), pad('808', { tune: 0, decay: 1.6, drive: 0.25 }), pad('rim', { tune: 5 }), pad('tom', { tune: 5, decay: 0.25 }),
     pad('crash', { decay: 2.4 }), pad('perc', { tune: 9 }), pad('shaker', { decay: 0.1 }), pad('snare', { tune: 7, decay: 0.16, level: 0.85 }),
     pad('clap', { tune: -2, decay: 0.6, level: 0.8 }), pad('kick', { tune: -4, decay: 0.75, drive: 0.5 }), pad('crash', { tune: 7, decay: 1.2, level: 0.7 }), pad('sample', { level: 1, color: '#ff66cc' })];
  }

  OrganismFactory.define({
    id: 'eravos.pads', preview: 'kit', domain: 'music', version: '2.0.0', label: 'Drum Machine', icon: '🥁', accent: '#00ff88', phase: 'P2',
    category: 'Drums & rhythm', blurb: '16 pads, 3 banks of synthesized drums — or drop any sound on a pad.',
    size: { w: 470, h: 470 }, minSize: { w: 360, h: 360 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe', 'filesystem_read'],
    provides: ['capability.pad_trigger', 'capability.audio_out', 'capability.bank_select', 'capability.note_in'],
    requires: ['capability.audio_context'],
    constraints: [{ constraint_id: 'pads.C-2', predicate: 'banks.length === 4 && every bank has 16 pads', failure_mode: 'CONSTRAINT_001', blocking: false, check: () => true }],
    hooks: [
      S.audio_out('pads.hook.audio_out'),
      S.event('pads.hook.pad_trigger_out', 'out', 'pad:trigger', { type: 'object', required: ['index', 'sound', 'velocity', 'bank', 'time', 'source'] }, '2.0.0'),
      S.event('pads.hook.bank_change_out', 'out', 'pad:bank-change', { type: 'object', required: ['bank', 'pads'] }, '1.0.0'),
      S.note_in('pads.hook.note_in'),
      S.midi_in('pads.hook.midi_in'),
      S.event('pads.hook.seq_fire_in', 'in', 'seq:fire', { type: 'object' }, '1.0.0'),
      S.mod_in('pads.hook.mod_level', 'level'),
    ],
    config: [
      { key: 'bank', type: 'enum', options: [0, 1, 2, 3], default: 0, label: 'Bank', group: 'KIT' },
      { key: 'volume', type: 'number', default: 0.9, min: 0, max: 1.5, step: 0.01, label: 'Volume', group: 'KIT' },
      { key: 'swingVel', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Humanize', group: 'KIT', hint: 'random velocity variation' },
      { key: 'keymap', type: 'boolean', default: true, label: 'Keys', group: 'KIT', hint: 'QWERTY plays pads while this window is focused' },
    ],
    ui_hooks: ['pad_press', 'bank_select', 'pad_edit', 'pad_load', 'pad_clear_sample', 'kit_load', 'pad_set'],
    engine(ctx) {
      const ac = ctx.ac, dsp = ctx.dsp;
      let banks = defaultBanks();
      const buffers = new Map(); // hash → {buf, rev}
      const mix = ac.createGain(); mix.gain.value = ctx.params.get('volume');
      const levelMod = ctx.modBus('level', { min: 0, max: 1.5 });
      levelMod.connect(mix.gain);
      ctx.port('out', { kind: 'audio', direction: 'out', node: mix, label: 'drums' });
      const active = []; // {amp, choke, end}
      const last808 = { freq: 0, t: 0 };

      function env(g, t, peak, dec, attack) {
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + (attack || 0.001));
        g.gain.exponentialRampToValueAtTime(0.0001, t + (attack || 0.001) + dec);
      }
      function osc(type, f, t, end) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end + 0.05); return o; }
      function noise(t, end, color) { const n = dsp.noiseSource(ac, color); n.start(t, Math.random() * 1.5); n.stop(end + 0.05); return n; }
      function bp(f, q) { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; return b; }
      function hp(f) { const b = ac.createBiquadFilter(); b.type = 'highpass'; b.frequency.value = f; return b; }
      function metal(t, end, tuneRatio, dst) { // six squares at the TR-808 cymbal frequencies + a little noise sizzle
        [205.3, 304.4, 369.6, 522.7, 540, 800].forEach(f => { const o = osc('square', f * tuneRatio, t, end); const g = ac.createGain(); g.gain.value = 0.3; o.connect(g); g.connect(dst); });
        const n = noise(t, end), ng = ac.createGain(); ng.gain.value = 0.35; n.connect(ng); ng.connect(dst);
      }

      // each returns {amp, end}
      const V = {
        kick(dst, t, p, vel) {
          const r = Math.pow(2, p.tune / 12), f0 = 50 * r, dec = p.decay, end = t + dec + 0.05;
          const o = osc('sine', f0 * 4, t, end);
          const pd = 0.03 + dec * 0.06;
          o.frequency.exponentialRampToValueAtTime(f0, t + pd);
          o.frequency.exponentialRampToValueAtTime(f0 * 0.85, t + dec);
          const amp = ac.createGain(); env(amp, t, vel, dec, 0.001);
          const sh = ac.createWaveShaper(); sh.curve = dsp.curve('tanh', 0.15 + p.drive * 0.8); sh.oversample = '2x';
          o.connect(sh); sh.connect(amp);
          const n = noise(t, t + 0.01), nh = hp(3000), ng = ac.createGain(); env(ng, t, 0.5 * vel, 0.003);
          n.connect(nh); nh.connect(ng); ng.connect(amp);
          amp.connect(dst); return { amp, end };
        },
        snare(dst, t, p, vel) {
          const r = Math.pow(2, p.tune / 12), dec = p.decay, end = t + dec + 0.1;
          const amp = ac.createGain(); amp.gain.value = vel; amp.connect(dst);
          const tone = ac.createGain(); env(tone, t, 0.55, dec * 0.45);
          [180, 330].forEach(f => { const o = osc('triangle', f * r, t, end); o.frequency.exponentialRampToValueAtTime(f * r * 0.8, t + 0.08); o.connect(tone); });
          const n = noise(t, end), nb = bp(2600 * r, 0.7), nh = hp(1200), ng = ac.createGain(); env(ng, t, 0.9, dec);
          n.connect(nb); nb.connect(nh); nh.connect(ng);
          const sh = ac.createWaveShaper(); sh.curve = dsp.curve('tanh', p.drive * 0.8); tone.connect(sh); ng.connect(sh); sh.connect(amp);
          return { amp, end };
        },
        hat(dst, t, p, vel, open) {
          const r = Math.pow(2, p.tune / 12), dec = p.decay, end = t + dec + 0.05;
          const src = ac.createGain(); metal(t, end, r, src);
          const b = bp(10000, 1), hh = hp(7000), amp = ac.createGain(); env(amp, t, vel * 0.9, dec);
          src.connect(b); b.connect(hh); hh.connect(amp); amp.connect(dst);
          return { amp, end };
        },
        openhat(dst, t, p, vel) { return V.hat(dst, t, p, vel, true); },
        clap(dst, t, p, vel) {
          const r = Math.pow(2, p.tune / 12), dec = p.decay, end = t + 0.03 + dec + 0.05;
          const amp = ac.createGain(); amp.gain.value = vel; amp.connect(dst);
          const n = noise(t, end), b = bp(1200 * r, 1.2), g = ac.createGain();
          n.connect(b); b.connect(g); g.connect(amp);
          g.gain.setValueAtTime(0, t);
          for (let i = 0; i < 4; i++) { const ti = t + i * 0.01; g.gain.setValueAtTime(0.9, ti); g.gain.exponentialRampToValueAtTime(0.08, ti + 0.009); }
          g.gain.setValueAtTime(0.7, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.max(0.05, dec * 0.5));
          return { amp, end };
        },
        '808'(dst, t, p, vel) {
          const f = 55 * Math.pow(2, (p.tune - 5) / 12) * Math.pow(2, (p._note || 0) / 12), dec = p.decay, end = t + dec + 0.05;
          const from = last808.freq && t - last808.t < 0.5 ? last808.freq : f;
          last808.freq = f; last808.t = t;
          const o = osc('sine', from, t, end); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
          const sh = ac.createWaveShaper(); sh.curve = dsp.curve('tanh', 0.3 + p.drive * 0.7);
          const amp = ac.createGain(); amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(vel, t + 0.004); amp.gain.setTargetAtTime(0, t + 0.05, dec / 3.5);
          o.connect(sh); sh.connect(amp); amp.connect(dst);
          const k = osc('sine', f * 3, t, t + 0.03), kg = ac.createGain(); env(kg, t, 0.3 * vel, 0.02); k.frequency.exponentialRampToValueAtTime(f, t + 0.02); k.connect(kg); kg.connect(amp);
          return { amp, end };
        },
        rim(dst, t, p, vel) {
          const r = Math.pow(2, p.tune / 12), end = t + p.decay + 0.05;
          const amp = ac.createGain(); env(amp, t, vel, p.decay); amp.connect(dst);
          const n = noise(t, end), b = bp(1700 * r, 12); n.connect(b); const bg = ac.createGain(); bg.gain.value = 3; b.connect(bg); bg.connect(amp);
          const o = osc('triangle', 400 * r, t, end), og = ac.createGain(); env(og, t, 0.6, 0.012); o.connect(og); og.connect(amp);
          return { amp, end };
        },
        tom(dst, t, p, vel) {
          const f = 110 * Math.pow(2, p.tune / 12), dec = p.decay, end = t + dec + 0.05;
          const o = osc('sine', f * 1.6, t, end); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + dec);
          const amp = ac.createGain(); env(amp, t, vel, dec); o.connect(amp); amp.connect(dst);
          const n = noise(t, t + 0.02), ng = ac.createGain(); env(ng, t, 0.2, 0.01); n.connect(ng); ng.connect(amp);
          return { amp, end };
        },
        crash(dst, t, p, vel) {
          const r = Math.pow(2, p.tune / 12), dec = p.decay, end = t + dec + 0.05;
          const src = ac.createGain(); metal(t, end, r * 1.3, src);
          const n = noise(t, end), ng = ac.createGain(); ng.gain.value = 0.6; n.connect(ng); ng.connect(src);
          const hh = hp(5000), amp = ac.createGain(); env(amp, t, vel * 0.7, dec, 0.002);
          src.connect(hh); hh.connect(amp); amp.connect(dst);
          return { amp, end };
        },
        perc(dst, t, p, vel) {
          const f = 440 * Math.pow(2, p.tune / 12), dec = p.decay, end = t + dec + 0.05;
          const car = osc('sine', f, t, end), mod = osc('sine', f * 1.41, t, end), mg = ac.createGain();
          mg.gain.setValueAtTime(f * 3, t); mg.gain.exponentialRampToValueAtTime(1, t + dec);
          mod.connect(mg); mg.connect(car.frequency);
          const amp = ac.createGain(); env(amp, t, vel * 0.8, dec); car.connect(amp); amp.connect(dst);
          return { amp, end };
        },
        shaker(dst, t, p, vel) {
          const dec = p.decay, end = t + dec + 0.05;
          const n = noise(t, end), hh = hp(6000 * Math.pow(2, p.tune / 24)), amp = ac.createGain();
          amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(vel * 0.5, t + dec * 0.3); amp.gain.exponentialRampToValueAtTime(0.0001, t + dec);
          n.connect(hh); hh.connect(amp); amp.connect(dst);
          return { amp, end };
        },
        cowbell(dst, t, p, vel) {
          const r = Math.pow(2, p.tune / 12), dec = p.decay, end = t + dec + 0.05;
          const src = ac.createGain();
          [540, 800].forEach(f => { const o = osc('square', f * r, t, end); o.connect(src); });
          const b = bp(800 * r, 2), amp = ac.createGain();
          amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(vel * 0.5, t + 0.001); amp.gain.exponentialRampToValueAtTime(vel * 0.15, t + 0.03); amp.gain.exponentialRampToValueAtTime(0.0001, t + dec);
          src.connect(b); b.connect(amp); amp.connect(dst);
          return { amp, end };
        },
        sample(dst, t, p, vel) {
          const s = p.sample && buffers.get(p.sample.hash);
          if (!s) return null;
          const buf = p.sample.reverse ? s.rev : s.buf;
          const src = ac.createBufferSource(); src.buffer = buf; src.playbackRate.value = Math.pow(2, p.tune / 12);
          const st = (p.sample.start || 0) * buf.duration, en = (p.sample.end === undefined ? 1 : p.sample.end) * buf.duration;
          const dur = Math.max(0.005, Math.min(en - st, p.decay * src.playbackRate.value)) / src.playbackRate.value;
          const amp = ac.createGain(); amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(vel, t + 0.002);
          amp.gain.setValueAtTime(vel, t + Math.max(0.003, dur - 0.01)); amp.gain.linearRampToValueAtTime(0, t + dur);
          src.connect(amp); amp.connect(dst); src.start(t, st); src.stop(t + dur + 0.02);
          return { amp, end: t + dur };
        },
      };

      function trigger(index, velocity, time, source) {
        const bank = ctx.params.get('bank');
        const p = banks[bank][index];
        if (!p) return;
        const t = Math.max(time || 0, ac.currentTime);
        let vel = Math.max(0, Math.min(1, velocity));
        const hv = ctx.params.get('swingVel'); if (hv) vel *= 1 - hv * Math.random() * 0.35;
        // choke: cut other voices in same group (≥ −60 dB within 5 ms)
        if (p.choke) active.forEach(a => { if (a.choke === p.choke && a.end > t) { const g = a.chain.gain; g.cancelScheduledValues(t); g.setValueAtTime(a.level, t); g.setTargetAtTime(0, t, 0.0006); a.end = t; } });
        const chain = ac.createGain(); chain.gain.value = p.level;
        const pan = ac.createStereoPanner(); pan.pan.value = p.pan;
        chain.connect(pan); pan.connect(mix);
        let r;
        try { r = V[p.voice](chain, t, p, vel); } catch (e) { ctx.fault('RUNTIME_003', `voice ${p.voice}: ${e.message}`); }
        ctx.emit('pad:trigger', { index, sound: p.voice, velocity: vel, bank, time: t, source: 'pads', target: ctx.id });
        ctx.emitUI('pad_lit', { index, color: p.color, time: t, velocity: vel });
        if (!r) { chain.disconnect(); pan.disconnect(); return; }
        const rec = { amp: r.amp, chain, level: p.level, choke: p.choke, end: r.end };
        active.push(rec);
        ctx.atAudioTime(r.end + 0.2, () => { const i = active.indexOf(rec); if (i >= 0) active.splice(i, 1); try { chain.disconnect(); pan.disconnect(); r.amp.disconnect(); } catch (e) {} });
      }
      ctx.trigger = trigger;

      function bankPayload() { const b = ctx.params.get('bank'); return { bank: b, pads: banks[b].map((p, i) => ({ sound: p.voice, color: p.color, note: 36 + i, name: p.sample ? p.sample.name : p.voice })) }; }
      function publishBank() { ctx.emit('pad:bank-change', bankPayload()); }

      ctx.onNote((p) => { const i = p.note - 36; if (i >= 0 && i < 16) trigger(i, p.velocity, p.time, 'note'); });
      ctx.onMidi((p) => { if (p.on && p.note >= 36 && p.note <= 51) trigger(p.note - 36, p.velocity, ac.currentTime, 'midi'); });
      ctx.on('seq:fire', { type: 'object' }, (p) => { if (p.target === ctx.id && typeof p.index === 'number') ctx.emitUI('pad_lit', { index: p.index, color: banks[ctx.params.get('bank')][p.index].color, time: p.timestamp || ac.currentTime }); });
      ctx.params.onChange('volume', (v) => dsp.setSmooth(mix.gain, v, ac));
      ctx.params.onChange('bank', () => { publishBank(); ctx.syncUI(); });

      ctx.onUI('pad_press', { type: 'object', required: ['index'], properties: { index: { type: 'integer', minimum: 0, maximum: 15 }, velocity: { type: 'number', minimum: 0, maximum: 1 } } }, (p) => trigger(p.index, p.velocity === undefined ? 0.9 : p.velocity, ac.currentTime, 'ui'));
      ctx.onUI('bank_select', { type: 'object', required: ['bank'] }, (p) => ctx.params.set('bank', p.bank));
      const PAD_KEYS = { voice: VOICES, tune: [-24, 24], decay: [0.02, 4], level: [0, 1.5], pan: [-1, 1], drive: [0, 1], choke: [0, 4] };
      ctx.onUI('pad_edit', { type: 'object', required: ['index', 'key'] }, (p) => {
        const pd = banks[ctx.params.get('bank')][p.index];
        if (!pd) return ctx.fault('RUNTIME_002', 'pad_edit: bad index');
        if (p.key === 'color') { pd.color = String(p.value); }
        else if (p.key === 'voice') { if (!VOICES.includes(p.value)) return ctx.fault('RUNTIME_002', 'pad_edit: voice ' + p.value); pd.voice = p.value; pd.decay = VOICE_DEFAULTS[p.value].decay; pd.color = VOICE_DEFAULTS[p.value].color; pd.choke = VOICE_DEFAULTS[p.value].choke || 0; }
        else if (p.key === 'reverse' || p.key === 'start' || p.key === 'end') { if (pd.sample) pd.sample[p.key] = p.key === 'reverse' ? !!p.value : Math.max(0, Math.min(1, +p.value)); }
        else if (PAD_KEYS[p.key]) { if (typeof p.value !== 'number') return ctx.fault('RUNTIME_002', `pad_edit ${p.key}: number required`); const [lo, hi] = PAD_KEYS[p.key]; pd[p.key] = Math.max(lo, Math.min(hi, p.value)); if (p.key === 'choke') pd.choke = Math.round(pd.choke); }
        else return ctx.fault('RUNTIME_002', 'pad_edit: unknown key ' + p.key);
        ctx.syncUI(); publishBank();
      });
      async function loadSample(index, ab, name, bank) {
        const asset = ctx.K.assets.register(ab, { name, mime: 'audio/*' });
        const buf = await ctx.K.assets.decode(asset.hash);
        if (!buf) return false; // ASSET_002 raised by kernel
        buffers.set(asset.hash, { buf, rev: dsp.reverseBuffer(ac, buf) });
        const b = bank === undefined ? ctx.params.get('bank') : bank;
        banks[b][index] = Object.assign(banks[b][index], { voice: 'sample', sample: { hash: asset.hash, name, start: 0, end: 1, reverse: false }, decay: Math.min(4, buf.duration + 0.05) });
        ctx.syncUI(); publishBank();
        return true;
      }
      ctx.onUI('pad_load', { type: 'object', required: ['index', 'arrayBuffer'] }, (p) => loadSample(p.index, p.arrayBuffer, p.name || 'sample'));
      // 3.30 kits: load a whole kit into the current bank, or one pad from anywhere (mix & match) — data from kit packs
      function cleanPad(x) { if (!x || !VOICES.includes(x.voice)) return null; const q = pad(x.voice, x); if (q.voice === 'sample' && !(q.sample && ctx.K.assets.get(q.sample.hash))) q.sample = null; Object.keys(PAD_KEYS).forEach(k => { if (k !== 'voice' && typeof q[k] === 'number') q[k] = Math.max(PAD_KEYS[k][0], Math.min(PAD_KEYS[k][1], q[k])); }); return q; }
      ctx.onUI('kit_load', { type: 'object', required: ['pads'] }, async (p) => {
        if (!Array.isArray(p.pads) || p.pads.length !== 16) return ctx.fault('RUNTIME_002', 'kit_load: 16 pads required');
        const b = typeof p.bank === 'number' ? p.bank : ctx.params.get('bank'), ps = p.pads.map(cleanPad); if (ps.some(x => !x)) return ctx.fault('RUNTIME_002', 'kit_load: unknown voice');
        banks[b] = ps; for (const q of ps) if (q.sample && !buffers.has(q.sample.hash)) { const buf = await ctx.K.assets.decode(q.sample.hash); if (buf) buffers.set(q.sample.hash, { buf, rev: dsp.reverseBuffer(ac, buf) }); }
        ctx.syncUI(); publishBank();
      });
      ctx.onUI('pad_set', { type: 'object', required: ['index', 'pad'] }, (p) => {
        const q = cleanPad(p.pad), b = ctx.params.get('bank'); if (!q || !(p.index >= 0 && p.index < 16)) return ctx.fault('RUNTIME_002', 'pad_set: bad pad');
        banks[b][p.index] = q; ctx.syncUI(); publishBank();
      });
      ctx.kitOf = (b) => banks[b === undefined ? ctx.params.get('bank') : b].map(x => Object.assign({}, x, { sample: x.sample ? Object.assign({}, x.sample) : null }));
      ctx.onUI('pad_clear_sample', { type: 'object', required: ['index'] }, (p) => { const pd = banks[ctx.params.get('bank')][p.index]; pd.sample = null; ctx.syncUI(); });
      // clip-maker / sample-player assets addressed to this drum machine (A-6 break slot)
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, async (p) => {
        if (p.target !== ctx.id) return;
        const a = ctx.K.assets.get(p.hash); if (!a) return ctx.fault('ASSET_001', 'asset ' + p.hash + ' missing');
        const b = ctx.params.get('bank');
        const idx = typeof p.pad === 'number' ? p.pad : banks[b].findIndex(x => x.voice === 'sample' && !x.sample);
        const buf = a.decoded || await ctx.K.assets.decode(p.hash); if (!buf) return;
        buffers.set(p.hash, { buf, rev: dsp.reverseBuffer(ac, buf) });
        banks[b][idx < 0 ? 15 : idx] = Object.assign(banks[b][idx < 0 ? 15 : idx], { voice: 'sample', sample: { hash: p.hash, name: p.name || a.source, start: 0, end: 1, reverse: false }, decay: Math.min(4, buf.duration + 0.05) });
        ctx.syncUI(); publishBank();
      });

      ctx.audition = (p) => trigger(typeof p.index === 'number' ? p.index : 0, p.velocity || 0.9, ac.currentTime);
      ctx.stateExtra = () => ({ banks: banks.map(b => b.map(p => Object.assign({}, p, { sample: p.sample ? Object.assign({}, p.sample) : null }))), voices: VOICES });
      ctx.saveExtra = () => ({ banks });
      ctx.loadExtra = async (x) => {
        if (!x || !Array.isArray(x.banks) || (x.banks.length !== 3 && x.banks.length !== 4)) return ctx.fault('MOUNT_005', 'pads: bank data invalid');
        banks = x.banks.map(b => b.map(p => pad(p.voice || 'kick', p)));
        if (banks.length === 3) banks.push(futureBank()); // 3.19 snapshots: bank D appended, saved banks untouched
        for (const b of banks) for (const p of b) if (p.sample && !buffers.has(p.sample.hash)) {
          const buf = await ctx.K.assets.decode(p.sample.hash);
          if (buf) buffers.set(p.sample.hash, { buf, rev: dsp.reverseBuffer(ac, buf) });
        }
        ctx.syncUI(); publishBank();
      };
      publishBank();
      ctx.on('kernel:organism-mounted', null, () => publishBank());
      return { unmount() { active.length = 0; } };
    },
  });
})();
