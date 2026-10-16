/* eravos.pads 3.0.0 — Drum Machine (P2) · resolves F-11(drums), F-15 · P39 R1 (pads.spec PLANNED 3.0)
 * 16 velocity-sensitive pads × 4 banks (D = future/Monstercat, P9); each pad a synthesised voice or a loaded sample.
 * Per-pad voice graphs, choke groups, internal per-pad mixer → one audio port.
 * 3.0: every voice has MODELS — different synthesis graphs, not re-tunes (kick 909/808/punch/tearout/thump/hardstyle/
 * rumble/zap, snare 909/808/crack/slam/rimshot/brush/electro/lofi …) — and every pad has sound-design keys: model ·
 * tone (tilt EQ) · snap (transient) · sweep (pitch drop, st) · body (tone vs noise) · drive + driveType (soft hard asym
 * fold crush). 'classic' = the 2.0 recipe, byte-identical, so every 2.0 kit and project sounds exactly as before.
 * Presets can carry a whole kit (extra.kit = 16 pads → the current bank): the factory presets ARE kits now. */
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
  // 3.0 models per voice — [name, defaults]; the first is always 'classic' (the 2.0 recipe)
  const MODELS = {
    kick: { classic: {}, '909': { decay: 0.28, sweep: 30, snap: 0.9, tone: 0.3 }, '808': { decay: 0.9, sweep: 10, snap: 0.15 }, punch: { decay: 0.24, sweep: 30, snap: 0.8, drive: 0.35, driveType: 'hard' },
      tearout: { decay: 0.32, sweep: 36, snap: 0.7, drive: 0.85, driveType: 'asym' }, thump: { decay: 0.5, sweep: 7, snap: 0, tone: -0.6 }, hardstyle: { decay: 0.6, sweep: 40, snap: 0.9, drive: 0.95, driveType: 'hard' },
      rumble: { decay: 0.38, sweep: 22, snap: 0.5, body: 0.6 }, zap: { decay: 0.35, sweep: 48, snap: 0.2 } },
    snare: { classic: {}, '909': { decay: 0.24, body: 0.45, snap: 0.6 }, '808': { decay: 0.2, body: 0.6, snap: 0.3 }, crack: { decay: 0.12, body: 0.15, snap: 0.9, tone: 0.4 },
      slam: { decay: 0.4, body: 0.55, snap: 0.7, drive: 0.4, driveType: 'asym' }, rimshot: { decay: 0.14, body: 0.5, snap: 1 }, brush: { decay: 0.3, body: 0.1, snap: 0, tone: -0.3 },
      electro: { decay: 0.28, body: 0.2, snap: 0.5 }, lofi: { decay: 0.16, body: 0.7, snap: 0.2, drive: 0.85, driveType: 'crush', tone: -0.9 } },
    clap: { classic: {}, stacked: { decay: 0.45, snap: 0.6 }, snap: { decay: 0.08, snap: 1 }, '808': { decay: 0.6, snap: 0.4 } },
    hat: { classic: {}, '909': { decay: 0.06, body: 0.5 }, tick: { decay: 0.022, body: 0.1, tone: 0.5 }, fm: { decay: 0.07, body: 0.8 }, lofi: { decay: 0.05, drive: 0.9, driveType: 'crush', tone: -0.9 } },
    openhat: { classic: {}, '909': { decay: 0.26, body: 0.25, tone: 0.4 }, fm: { decay: 0.8, body: 1, tune: -5 }, lofi: { decay: 0.17, drive: 0.9, driveType: 'crush', tone: -0.9 } },
    '808': { classic: {}, dist: { decay: 1.3, drive: 0.8, driveType: 'asym' }, reese: { decay: 1.5, body: 0.6 }, sub: { decay: 1.6, snap: 0 } },
    tom: { classic: {}, electro: { decay: 0.45, sweep: 24 }, conga: { decay: 0.3, sweep: 4, snap: 0.7 }, tabla: { decay: 0.5, sweep: 5, body: 0.6 } },
    crash: { classic: {}, ride: { decay: 3, body: 1 }, china: { decay: 1.1, drive: 0.5, driveType: 'asym' }, swell: { decay: 1.2 } },
    perc: { classic: {}, wood: { decay: 0.12 }, clang: { decay: 0.8, body: 0.7 }, laser: { decay: 0.4, sweep: 36 } },
    rim: { classic: {} }, shaker: { classic: {} }, cowbell: { classic: {} }, sample: { classic: {} },
  };
  const DRIVE_TYPES = ['soft', 'hard', 'asym', 'fold', 'crush'];
  const SD = { model: 'classic', tone: 0, snap: 0.5, sweep: 24, body: 0.5, driveType: 'soft' };   // sound-design defaults
  function pad(voice, o) { const q = Object.assign({ voice, tune: 0, decay: VOICE_DEFAULTS[voice].decay, level: 1, pan: 0, drive: 0, choke: VOICE_DEFAULTS[voice].choke || 0, color: VOICE_DEFAULTS[voice].color, sample: null }, SD, o || {}); if (!MODELS[voice][q.model]) q.model = 'classic'; if (!DRIVE_TYPES.includes(q.driveType)) q.driveType = 'soft'; return q; }
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
    id: 'eravos.pads', preview: 'kit', domain: 'music', version: '3.0.0', label: 'Drum Machine', icon: '🥁', accent: '#00ff88', phase: 'P2',
    category: 'Drums & rhythm', blurb: '16 pads · every drum has several synthesis models and its own sound design · kits for every genre — or drop any sound on a pad.',
    lib: { MODELS, DRIVE_TYPES },
    size: { w: 580, h: 680 }, minSize: { w: 420, h: 420 },
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

      // ---- 3.0 helpers
      const R = (st) => Math.pow(2, st / 12);
      function sweepOsc(type, f, p, t, end, time) { const o = osc(type, f * R(p.sweep || 0), t, end); o.frequency.exponentialRampToValueAtTime(Math.max(20, f), t + (time || 0.03)); return o; }
      function nburst(dst, t, dur, peak, f, q, type, color) { const n = noise(t, t + dur + 0.02, color), b = ac.createBiquadFilter(); b.type = type || 'bandpass'; b.frequency.value = f; b.Q.value = q || 0.8; const g = ac.createGain(); env(g, t, peak, dur); n.connect(b); b.connect(g); g.connect(dst); return g; }
      function click(dst, t, peak, f) { if (peak <= 0.001) return; const o = osc('sine', f || 3200, t, t + 0.01), g = ac.createGain(); env(g, t, peak, 0.004); o.connect(g); g.connect(dst); }
      function ampOut(dst, t, vel, dec, attack) { const a = ac.createGain(); env(a, t, vel, dec, attack); a.connect(dst); return a; }
      function partials(dst, t, end, base, ratios, decs, peak) { ratios.forEach((k, i) => { const o = osc('sine', base * k, t, end), g = ac.createGain(); env(g, t, peak / ratios.length * (1 - i * 0.12), decs[i] || decs[decs.length - 1]); o.connect(g); g.connect(dst); }); }
      // M[voice][model](dst, t, p, vel) → {amp, end}: real graphs, each audibly its own instrument
      const M = {
        kick: {
          '909'(dst, t, p, vel) { const f = 52 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec, 0.0015);
            const o = sweepOsc('sine', f, p, t, end, 0.035); o.frequency.exponentialRampToValueAtTime(f * 0.92, t + dec); o.connect(a);
            nburst(a, t, 0.012, 0.6 * p.snap, 4500, 0.7, 'highpass'); click(a, t, 0.35 * p.snap, 2600); return { amp: a, end }; },
          '808'(dst, t, p, vel) { const f = 47 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ac.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(vel, t + 0.002); a.gain.setTargetAtTime(0, t + 0.02, dec / 4); a.connect(dst);
            const o = sweepOsc('sine', f, p, t, end, 0.06); o.connect(a); click(a, t, 0.15 * p.snap, 1800); return { amp: a, end }; },
          punch(dst, t, p, vel) { const f = 60 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec, 0.001);
            const o = sweepOsc('triangle', f, p, t, end, 0.018), s = ac.createGain(); s.gain.value = 1.4; o.connect(s); s.connect(a);
            const sub = osc('sine', f * 0.5, t, end), sg = ac.createGain(); env(sg, t, 0.5, dec * 0.8); sub.connect(sg); sg.connect(a);
            click(a, t, 0.6 * p.snap, 4200); nburst(a, t, 0.006, 0.4 * p.snap, 6000, 0.7, 'highpass'); return { amp: a, end }; },
          tearout(dst, t, p, vel) { const f = 50 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ac.createGain(); a.connect(dst);
            a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(vel, t + 0.001); a.gain.setValueAtTime(vel * 0.8, t + dec * 0.7); a.gain.linearRampToValueAtTime(0, t + dec);   // gated tail
            const o = sweepOsc('sine', f, p, t, end, 0.025); o.connect(a);
            const knock = ac.createBiquadFilter(); knock.type = 'bandpass'; knock.frequency.value = 160 * R(p.tune); knock.Q.value = 3; const kg = ac.createGain(); env(kg, t, 1.6, 0.06); o.connect(knock); knock.connect(kg); kg.connect(a);
            nburst(a, t, 0.015, 0.7 * p.snap, 3000, 1.2); return { amp: a, end }; },
          thump(dst, t, p, vel) { const f = 44 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec, 0.004);
            const o = sweepOsc('sine', f, p, t, end, 0.05), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; o.connect(lp); lp.connect(a); return { amp: a, end }; },
          hardstyle(dst, t, p, vel) { const f = 55 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ac.createGain(); a.connect(dst);
            a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(vel, t + 0.001); a.gain.setValueAtTime(vel, t + dec * 0.55); a.gain.exponentialRampToValueAtTime(0.0001, t + dec);   // tonal sustain, then out
            const o = sweepOsc('sine', f, p, t, end, 0.012); const pre = ac.createGain(); pre.gain.value = 3; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
            o.connect(pre); pre.connect(lp); lp.connect(a); click(a, t, 0.5 * p.snap, 3500); return { amp: a, end }; },
          rumble(dst, t, p, vel) { const r = M.kick['909'](dst, t, Object.assign({}, p, { decay: Math.min(p.decay, 0.35) }), vel), dec = p.decay * 3.2, end = t + dec + 0.1;
            const n = noise(t + 0.04, end, 'brown'), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 110 * R(p.tune); lp.Q.value = 6;
            const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 1.6 * p.body, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); n.connect(lp); lp.connect(g); g.connect(dst);
            return { amp: g, end }; },
          zap(dst, t, p, vel) { const f = 45 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec, 0.001);
            const o = osc('sine', Math.min(9000, f * R(p.sweep + 24)), t, end); o.frequency.exponentialRampToValueAtTime(f, t + dec * 0.45); o.connect(a);
            const sq = osc('square', Math.min(9000, f * R(p.sweep + 24)), t, end), sg = ac.createGain(); env(sg, t, 0.12, dec * 0.3); sq.frequency.exponentialRampToValueAtTime(f, t + dec * 0.45); sq.connect(sg); sg.connect(a); return { amp: a, end }; },
        },
        snare: {
          '909'(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.1, a = ac.createGain(); a.gain.value = vel; a.connect(dst);
            const tone = ac.createGain(); env(tone, t, 0.9 * p.body, dec * 0.4); [185, 330].forEach(f => { const o = osc('triangle', f * r, t, end); o.frequency.exponentialRampToValueAtTime(f * r * 0.85, t + 0.05); o.connect(tone); }); tone.connect(a);
            nburst(a, t, dec, 0.9 * (1 - p.body * 0.5), 4200 * r, 0.6); nburst(a, t, 0.01, 0.6 * p.snap, 7000, 0.7, 'highpass'); return { amp: a, end }; },
          '808'(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.1, a = ac.createGain(); a.gain.value = vel; a.connect(dst);
            [238, 476].forEach((f, i) => { const o = osc('triangle', f * r, t, end), g = ac.createGain(); env(g, t, 0.5 * p.body * (i ? 0.6 : 1), dec * 0.7); o.connect(g); g.connect(a); });
            nburst(a, t, dec * 0.8, 0.7 * (1 - p.body * 0.4), 6500 * r, 0.7, 'highpass'); click(a, t, 0.2 * p.snap, 2000); return { amp: a, end }; },
          crack(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ac.createGain(); a.gain.value = vel; a.connect(dst);
            nburst(a, t, dec, 1.1, 2400 * r, 0.5, 'highpass'); nburst(a, t, 0.008, 0.9 * p.snap, 5200 * r, 2); const o = osc('triangle', 220 * r, t, end), g = ac.createGain(); env(g, t, 0.5 * p.body, 0.04); o.connect(g); g.connect(a); return { amp: a, end }; },
          slam(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.2, a = ac.createGain(); a.gain.value = vel; a.connect(dst);
            const o = osc('sine', 180 * r * R(12), t, end), og = ac.createGain(); o.frequency.exponentialRampToValueAtTime(180 * r, t + 0.03); env(og, t, 0.9 * p.body, dec * 0.35); o.connect(og); og.connect(a);
            nburst(a, t, dec, 1, 1800 * r, 0.4); nburst(a, t, dec * 0.6, 0.5, 6000, 0.5, 'highpass');
            [0.011, 0.023, 0.037].forEach((d, i) => nburst(a, t + d, dec * 0.9, 0.35 / (i + 1), 2500, 0.5));   // early reflections: a room, no convolver
            click(a, t, 0.5 * p.snap, 3000); return { amp: a, end }; },
          rimshot(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ac.createGain(); a.gain.value = vel; a.connect(dst);
            nburst(a, t, 0.03, 2.2 * p.snap, 1750 * r, 10); const o = osc('triangle', 420 * r, t, end), g = ac.createGain(); env(g, t, 0.7, 0.03); o.connect(g); g.connect(a);
            nburst(a, t, dec, 0.6 * (1 - p.body * 0.4), 3500 * r, 0.6); const b = osc('triangle', 200 * r, t, end), bg = ac.createGain(); env(bg, t, 0.5 * p.body, dec * 0.4); b.connect(bg); bg.connect(a); return { amp: a, end }; },
          brush(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.1, n = noise(t, end, 'pink'), b = bp(3000 * r, 0.6), a = ac.createGain();
            a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(vel * 0.9, t + 0.035); a.gain.exponentialRampToValueAtTime(0.0001, t + dec); n.connect(b); b.connect(a); a.connect(dst); return { amp: a, end }; },
          electro(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, n = noise(t, end), b = ac.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = 6;
            b.frequency.setValueAtTime(3200 * r, t); b.frequency.exponentialRampToValueAtTime(700 * r, t + dec); const a = ampOut(dst, t, vel * 1.4, dec); n.connect(b); b.connect(a);
            const o = osc('sine', 260 * r, t, end), g = ac.createGain(); env(g, t, 0.4 * p.body, 0.06); o.connect(g); g.connect(a); click(a, t, 0.3 * p.snap); return { amp: a, end }; },
          lofi(dst, t, p, vel) { return M.snare['808'](dst, t, p, vel); },
        },
        clap: {
          stacked(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + 0.05 + dec + 0.1, a = ac.createGain(); a.gain.value = vel; a.connect(dst);
            [[1050, 0], [1500, 0.007]].forEach(([f, off]) => { const n = noise(t, end), b = bp(f * r, 1.4), g = ac.createGain(); n.connect(b); b.connect(g); g.connect(a); g.gain.setValueAtTime(0, t);
              for (let i = 0; i < 4; i++) { const ti = t + off + i * 0.011; g.gain.setValueAtTime(0.8, ti); g.gain.exponentialRampToValueAtTime(0.06, ti + 0.009); } g.gain.setValueAtTime(0.6, t + off + 0.044); g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.044 + dec); });
            [0.019, 0.041].forEach((d, i) => nburst(a, t + d, dec, 0.25 / (i + 1), 1800, 0.5)); return { amp: a, end }; },
          snap(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel * 1.3, dec, 0.0008); nburst(a, t, dec, 1, 2600 * r, 3); click(a, t, 0.4 * p.snap, 5000); return { amp: a, end }; },
          '808'(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + 0.04 + dec + 0.1, a = ac.createGain(); a.gain.value = vel; a.connect(dst);
            const n = noise(t, end), b = bp(1000 * r, 1), g = ac.createGain(); n.connect(b); b.connect(g); g.connect(a); g.gain.setValueAtTime(0, t);
            for (let i = 0; i < 3; i++) { const ti = t + i * 0.013; g.gain.setValueAtTime(0.9, ti); g.gain.exponentialRampToValueAtTime(0.1, ti + 0.011); } g.gain.setValueAtTime(0.5, t + 0.039); g.gain.setTargetAtTime(0, t + 0.039, dec / 3); return { amp: a, end }; },
        },
        hat: {
          '909'(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, src = ac.createGain(), a = ampOut(dst, t, vel * 0.9, dec);
            const mg = ac.createGain(); mg.gain.value = p.body; metal(t, end, r * 1.12, mg); mg.connect(src); nburst(src, t, dec, 0.9 * (1 - p.body * 0.6), 9000 * r, 0.5, 'highpass'); const hh = hp(7500); src.connect(hh); hh.connect(a); return { amp: a, end }; },
          tick(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.03, a = ampOut(dst, t, vel, dec, 0.0005); nburst(a, t, dec, 1.2, 9500 * r, 0.6, 'highpass'); click(a, t, 0.2, 11000); return { amp: a, end }; },
          fm(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel * 0.7, dec);
            const car = osc('square', 6200 * r, t, end), mod = osc('square', 6200 * r * 1.4142, t, end), mg = ac.createGain(); mg.gain.value = 6200 * r * (0.5 + p.body * 2); mod.connect(mg); mg.connect(car.frequency);
            const hh = hp(6000); car.connect(hh); hh.connect(a); return { amp: a, end }; },
          lofi(dst, t, p, vel) { return M.hat['909'](dst, t, p, vel); },
        },
        '808': {
          dist(dst, t, p, vel) { return V['808'](dst, t, Object.assign({}, p, { drive: 0.2 }), vel); },
          reese(dst, t, p, vel) { const f = 55 * R(p.tune - 5) * R(p._note || 0), dec = p.decay, end = t + dec + 0.05, a = ac.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(vel, t + 0.004); a.gain.setTargetAtTime(0, t + 0.05, dec / 3.5); a.connect(dst);
            const s = osc('sine', f, t, end); s.connect(a); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 3; const sg = ac.createGain(); sg.gain.value = 1.1 * p.body; lp.connect(sg); sg.connect(a);
            [-14, 14].forEach(c => { const o = osc('sawtooth', f * 2, t, end); o.detune.value = c; o.connect(lp); }); return { amp: a, end }; },
          sub(dst, t, p, vel) { const f = 55 * R(p.tune - 5) * R(p._note || 0), dec = p.decay, end = t + dec + 0.05, a = ac.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(vel, t + 0.006); a.gain.setTargetAtTime(0, t + 0.05, dec / 3.5); a.connect(dst);
            const s = osc('sine', f, t, end); s.connect(a); return { amp: a, end }; },
        },
        tom: {
          electro(dst, t, p, vel) { const f = 95 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec); const o = sweepOsc('sine', f, p, t, end, dec * 0.6); o.connect(a); return { amp: a, end }; },
          conga(dst, t, p, vel) { const f = 210 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec); const o = sweepOsc('sine', f, p, t, end, 0.02); o.connect(a); nburst(a, t, 0.02, 0.6 * p.snap, 1800, 2); return { amp: a, end }; },
          tabla(dst, t, p, vel) { const f = 180 * R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec);
            const car = osc('sine', f, t, end); car.frequency.setValueAtTime(f, t + 0.03); car.frequency.linearRampToValueAtTime(f * R(p.sweep > 0 ? Math.min(7, p.sweep) : 3), t + dec * 0.6);   // the bend UP after the strike
            const mod = osc('sine', f * 2, t, end), mg = ac.createGain(); mg.gain.setValueAtTime(f * 1.5 * p.body, t); mg.gain.exponentialRampToValueAtTime(1, t + dec * 0.5); mod.connect(mg); mg.connect(car.frequency); car.connect(a); return { amp: a, end }; },
        },
        crash: {
          ride(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel * 0.6, dec, 0.001); const src = ac.createGain(); metal(t, end, r * 1.6, src); const hh = hp(7000), mg = ac.createGain(); mg.gain.value = 0.25; src.connect(hh); hh.connect(mg); mg.connect(a);
            partials(a, t, end, 520 * r, [1, 2.43, 3.17, 5.21], [dec * 0.5, dec * 0.35, dec * 0.25, dec * 0.15], 2.2 * p.body); return { amp: a, end }; },
          china(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, src = ac.createGain(); metal(t, end, r * 0.93, src); metal(t, end, r * 1.07, src);   // two detuned metals beat = trash
            const b = bp(3400 * r, 0.9), a = ampOut(dst, t, vel * 0.8, dec, 0.0015); src.connect(b); b.connect(a); nburst(a, t, dec * 0.5, 0.5, 5000, 0.7, 'highpass'); return { amp: a, end }; },
          swell(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, src = ac.createGain(); metal(t, end, r * 1.3, src); const n = noise(t, end), ng = ac.createGain(); ng.gain.value = 0.6; n.connect(ng); ng.connect(src);
            const hh = hp(4000), a = ac.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(vel * 0.7, t + dec * 0.97); a.gain.linearRampToValueAtTime(0, t + dec); src.connect(hh); hh.connect(a); a.connect(dst); return { amp: a, end }; },
        },
        perc: {
          wood(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec, 0.0006); nburst(a, t, dec * 0.6, 1.5, 900 * r, 8); const o = osc('sine', 620 * r, t, end), g = ac.createGain(); env(g, t, 0.6, dec); o.connect(g); g.connect(a); return { amp: a, end }; },
          clang(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel, dec, 0.0008); partials(a, t, end, 310 * r, [1, 2.76, 5.4, 8.93, 13.34], [dec, dec * 0.7, dec * 0.5, dec * 0.3, dec * 0.2], 1.4 * (0.5 + p.body * 0.5)); return { amp: a, end }; },
          laser(dst, t, p, vel) { const r = R(p.tune), dec = p.decay, end = t + dec + 0.05, a = ampOut(dst, t, vel * 0.7, dec, 0.0008); const f0 = Math.min(9000, 220 * r * R(p.sweep));
            ['sine', 'square'].forEach((ty, i) => { const o = osc(ty, f0 * (i ? 0.5 : 1), t, end), g = ac.createGain(); g.gain.value = i ? 0.25 : 1; o.frequency.exponentialRampToValueAtTime(220 * r * (i ? 0.5 : 1), t + dec * 0.6); o.connect(g); g.connect(a); }); return { amp: a, end }; },
        },
      };
      // drive type curves for the 3.0 post stage (crush = a stepped curve: bit reduction by amount)
      const curveCache = {};
      function driveCurve(type, amt) { const k = type + (Math.round(amt * 20) / 20); if (curveCache[k]) return curveCache[k];
        let c; if (type === 'crush') { const steps = Math.max(3, Math.round(64 - amt * 58)); c = new Float32Array(4096); for (let i = 0; i < 4096; i++) { const x = i / 4095 * 2 - 1; c[i] = Math.round(x * steps) / steps; } }
        else c = dsp.curve(type === 'soft' ? 'tanh' : type, amt);
        return (curveCache[k] = c); }

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
        // 3.0 post stage (only when a 3.0 key asks for it — classic pads with tone 0 build exactly the 2.0 graph)
        const fresh = p.model && p.model !== 'classic', fn = fresh && M[p.voice] && M[p.voice][p.model];
        let into = chain;
        if (p.tone) { const sh = ac.createBiquadFilter(); sh.type = 'highshelf'; sh.frequency.value = 2500; sh.gain.value = p.tone * 12; const ls = ac.createBiquadFilter(); ls.type = 'lowshelf'; ls.frequency.value = 250; ls.gain.value = -p.tone * 6; sh.connect(ls); ls.connect(into); into = sh; }
        if (fresh && p.drive > 0) { const ws = ac.createWaveShaper(); ws.curve = driveCurve(p.driveType, p.drive); ws.oversample = p.driveType === 'crush' ? 'none' : '2x'; const mk = ac.createGain(); mk.gain.value = 1 / (1 + p.drive * (p.driveType === 'hard' || p.driveType === 'fold' ? 1.4 : 0.6)); ws.connect(mk); mk.connect(into); into = ws; }
        let r;
        try { r = fn ? fn(into, t, p, vel) : V[p.voice](into, t, p, vel); } catch (e) { ctx.fault('RUNTIME_003', `voice ${p.voice}/${p.model}: ${e.message}`); }
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
      const PAD_KEYS = { voice: VOICES, tune: [-24, 24], decay: [0.02, 4], level: [0, 1.5], pan: [-1, 1], drive: [0, 1], choke: [0, 4], tone: [-1, 1], snap: [0, 1], sweep: [0, 48], body: [0, 1] };
      ctx.onUI('pad_edit', { type: 'object', required: ['index', 'key'] }, (p) => {
        const pd = banks[ctx.params.get('bank')][p.index];
        if (!pd) return ctx.fault('RUNTIME_002', 'pad_edit: bad index');
        if (p.key === 'color') { pd.color = String(p.value); }
        else if (p.key === 'voice') { if (!VOICES.includes(p.value)) return ctx.fault('RUNTIME_002', 'pad_edit: voice ' + p.value); pd.voice = p.value; pd.decay = VOICE_DEFAULTS[p.value].decay; pd.color = VOICE_DEFAULTS[p.value].color; pd.choke = VOICE_DEFAULTS[p.value].choke || 0; Object.assign(pd, SD); }
        else if (p.key === 'model') { const md = MODELS[pd.voice][p.value]; if (!md) return ctx.fault('RUNTIME_002', `pad_edit: ${pd.voice} has no model ${p.value}`); Object.assign(pd, SD, { model: p.value, decay: VOICE_DEFAULTS[pd.voice].decay, drive: 0 }, md); }
        else if (p.key === 'driveType') { if (!DRIVE_TYPES.includes(p.value)) return ctx.fault('RUNTIME_002', 'pad_edit: drive type ' + p.value); pd.driveType = p.value; }
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
      function cleanPad(x) { if (!x || !VOICES.includes(x.voice)) return null; const q = pad(x.voice, Object.assign({}, x.model && MODELS[x.voice][x.model] || {}, x)); if (q.voice === 'sample' && !(q.sample && ctx.K.assets.get(q.sample.hash))) q.sample = null; Object.keys(PAD_KEYS).forEach(k => { if (k !== 'voice' && typeof q[k] === 'number') q[k] = Math.max(PAD_KEYS[k][0], Math.min(PAD_KEYS[k][1], q[k])); }); return q; }
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
      ctx.stateExtra = () => ({ banks: banks.map(b => b.map(p => Object.assign({}, p, { sample: p.sample ? Object.assign({}, p.sample) : null }))), voices: VOICES, models: Object.fromEntries(VOICES.map(v => [v, Object.keys(MODELS[v])])), driveTypes: DRIVE_TYPES });
      ctx.models = M;
      ctx.saveExtra = () => ({ banks });
      ctx.loadExtra = async (x) => {
        if (x && Array.isArray(x.kit)) {   // 3.0 kit preset: 16 pads into the current bank (presets carry kits)
          if (x.kit.length !== 16) return ctx.fault('RUNTIME_002', 'kit preset: 16 pads required');
          const ps = x.kit.map(cleanPad); if (ps.some(q => !q)) return ctx.fault('RUNTIME_002', 'kit preset: unknown voice');
          banks[ctx.params.get('bank')] = ps; ctx.syncUI(); publishBank(); return;
        }
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
