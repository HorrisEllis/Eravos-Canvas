/* eravos.feelings 0.1.0 — Feelings · spec feelings.spec (from tools/music/planned/feeling-song.spec, ADDENDA 2026-11-13).
 * His words (2026-11-13): "a actual tool for irrational frequencies, and unconvential harmonic data, like dragging around … like feelings or
 * emotions as frequencies" · "a full drag on a tool and have it play the sounds like a four way grid" · "i want love, anger which is low
 * irratating pitch, sadness, like hanging tree or bite the hand that feeds you" · "all one feeling" · "no capture button or return".
 * One feeling fills the pad. Drag and it sounds; the dot's place moves the sound four ways: up = more of the feeling (louder, brighter,
 * higher — arousal, heard across species: Filippi 2017), across = the feeling's own colour (below). Let go and it fades as the feeling does.
 *   LOVE     tender and close (Juslin & Laukka 2003; Morton 1977: friendly = higher, tonal): mid register, pure partials, soft onset,
 *            a gentle vibrato; across = from one pure voice to a fuller, warmer, wider one
 *   ANGER    "low irritating pitch" (Morton 1977: hostile = LOW and HARSH; Arnal 2015: irritation = roughness, loudness wobbling 30–150 Hz):
 *            a low buzzing growl 55–73 Hz, pressed, its loudness wobbling — across = that wobble from 30 Hz to 150 Hz
 *   SADNESS  like Hanging Tree (the Gothic Organ's slow swell, detuned, a cathedral): low, heavy, dark; the pitch sags and bends (Huron 2014:
 *            pitch-bending predicted sadness); across = near and steady → far, wide and bending
 * Harmonics: each feeling's partials from a ratio set (components/ratio-set) — irrational by default for Anger (√2) and Sadness (φ golden).
 * Live: every value is an AudioParam moved with setTargetAtTime — dragging, automating x / y, changing the feeling, all while it sounds.
 * Output through a compressor and a soft ceiling (≤ 0.72). No claims: sound that carries a feeling, nothing more. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, CEIL = 0.72, N = 6;
  const R = () => (window.MusicParts && window.MusicParts.RATIOS);
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12), db = (d) => Math.pow(10, d / 20), lerp = (a, b, t) => a + (b - a) * t;
  // the three feelings as data: what each sounds like at (x, y); x 0 = left, y 0 = bottom (1 = top: more of the feeling)
  const FEEL = {
    love: { root: 57, set: 'harmonic', attack: 0.22, release: 1.4,
      at: (x, y) => ({ semis: 7 * y, amps: [1, 0.12 + 0.3 * x, 0.04 + 0.16 * x, 0.02 + 0.08 * x, 0.04 * x, 0.02 * x], growl: 0, drive: 0, rough: 0, roughHz: 0,
        celeste: 1.5 + 6 * x, vib: 5, vibHz: 4.8, sag: 0, cutoff: 900 + 3200 * y, wet: 0.2 + 0.12 * x, width: 0.15 + 0.55 * x, levelDb: lerp(-34, -5, y) }) },
    anger: { root: 33, set: '√2', attack: 0.012, release: 0.22,
      at: (x, y) => ({ semis: 5 * y, amps: [1, 0.75, 0.6, 0.45, 0.35, 0.28], growl: 0.55 + 0.45 * y, drive: 0.35 + 0.65 * y, rough: 0.45 + 0.5 * y, roughHz: lerp(30, 150, x),
        celeste: 9, vib: 0, vibHz: 0, sag: 0, cutoff: 260 + 1900 * y, wet: 0.05, width: 0.1, levelDb: lerp(-32, -4, y) }) },
    sadness: { root: 38, set: 'φ golden', attack: 0.6, release: 2.8,
      at: (x, y) => ({ semis: -5 * (1 - y), amps: [1, 0.42, 0.24, 0.12, 0.06, 0.03], growl: 0, drive: 0.05, rough: 0, roughHz: 0,
        celeste: 4 + 10 * x, vib: 10 + 70 * x, vibHz: 0.07 + 0.05 * x, sag: -(15 + 45 * x), cutoff: 320 + 1500 * y, wet: 0.3 + 0.55 * x, width: 0.3 + 0.6 * x, levelDb: lerp(-36, -7, y) }) },
  };
  const FEELINGS = Object.keys(FEEL);
  OrganismFactory.define({
    id: 'eravos.feelings', domain: 'music', version: '0.1.0', label: 'Feelings', icon: '◇', accent: '#7fb8ff',
    category: 'Xenharmonic', blurb: 'One feeling fills the pad — drag to play it: love, anger, sadness.',
    size: { w: 900, h: 820 }, minSize: { w: 420, h: 420 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe'],
    hooks: [S.audio_out('feel.hook.audio_out'), S.note_in('feel.hook.note_in'), S.transport_in('feel.hook.transport_in')],
    config: [
      { key: 'feeling', type: 'enum', options: FEELINGS, default: 'love', label: 'Feeling', group: 'FEELING', element: 'own:feeling' },
      { key: 'x', type: 'number', default: 0.5, min: 0, max: 1, step: 0.001, label: 'Across', group: 'PAD', hint: 'left → right on the pad: the feeling’s own colour', element: 'own:pad' },
      { key: 'y', type: 'number', default: 0.5, min: 0, max: 1, step: 0.001, label: 'Up', group: 'PAD', hint: 'bottom → top on the pad: more of the feeling (louder, brighter, higher)', element: 'own:pad' },
      { key: 'speed', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Speed', group: 'PAD', hint: 'how fast the drag moves: a little brighter and louder', element: 'own:pad' },
      { key: 'harmonics', type: 'enum', options: ['auto', 'harmonic', 'φ golden', '√2', '√3', 'π/2', 'e/2', '2^(1/φ)', 'golden stack', 'φ series', 'primes', 'stretched string', 'membrane'], default: 'auto', label: 'Harmonics', group: 'SOUND', hint: 'auto = the feeling’s own (Love harmonic, Anger √2, Sadness φ) — or any irrational set', element: 'ratio-set' },
      { key: 'root', type: 'integer', default: 0, min: -12, max: 12, label: 'Pitch', group: 'SOUND', hint: 'semitones from the feeling’s own register', element: 'own:feeling' },
      { key: 'hold', type: 'boolean', default: false, label: 'Hold', group: 'SOUND', hint: 'keep sounding when you let go (and when x / y are automated)', element: 'own:pad' },
      { key: 'level', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Level', group: 'SOUND', element: 'own:feeling' },
    ],
    ui_hooks: ['touch'],
    elementWords: { 'own:feeling': 'FEELING', 'own:pad': 'PAD', 'ratio-set': 'HARMONICS' },
    presets: {},
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, node = (n) => { ctx.track(n); return n; };
      // ---------------------------------------------------------------- the chain
      // partials (sine pairs, celeste) + growl (saw) → drive → rough (AM) → lp → gate → dry + space → level → comp → ceiling → out
      const bus = node(ac.createGain()), driveIn = node(ac.createGain()), shaper = node(ac.createWaveShaper()), driveOut = node(ac.createGain()), driveDry = node(ac.createGain());
      shaper.curve = Float32Array.from({ length: 2049 }, (_, i) => Math.tanh(3 * (i / 1024 - 1))); shaper.oversample = '2x';
      bus.connect(driveDry); bus.connect(driveIn); driveIn.connect(shaper); shaper.connect(driveOut);
      const rough = node(ac.createGain()), roughOsc = node(ac.createOscillator()), roughDepth = node(ac.createGain()); roughOsc.frequency.value = 60; roughDepth.gain.value = 0;
      roughOsc.connect(roughDepth); roughDepth.connect(rough.gain); roughOsc.start(); driveDry.connect(rough); driveOut.connect(rough);
      const lp = node(ac.createBiquadFilter()); lp.type = 'lowpass'; lp.Q.value = 0.6; rough.connect(lp);
      const gate = node(ac.createGain()); gate.gain.value = 0; lp.connect(gate);
      const dry = node(ac.createGain()), pre = node(ac.createDelay(0.2)), conv = node(ac.createConvolver()), wet = node(ac.createGain()), sum = node(ac.createGain());
      pre.delayTime.value = 0.035; gate.connect(dry); dry.connect(sum); gate.connect(pre); pre.connect(conv); conv.connect(wet); wet.connect(sum);
      { const n = Math.floor(ac.sampleRate * 4.5), b = ac.createBuffer(2, n, ac.sampleRate), r = dsp.mulberry32(7381);
        for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let l = 0; for (let i = 0; i < n; i++) { const t = i / ac.sampleRate; l = 0.75 * l + 0.25 * (r() * 2 - 1); d[i] = l * Math.exp(-t * 1.25) * (t < 0.01 ? t / 0.01 : 1); } }
        conv.buffer = b; }
      const level = node(ac.createGain()), comp = node(ac.createDynamicsCompressor()), ceil = node(ac.createWaveShaper()), out = node(ac.createGain());
      comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.008; comp.release.value = 0.35;
      ceil.curve = Float32Array.from({ length: 4097 }, (_, i) => { const x = i / 2048 - 1; return CEIL * Math.tanh(x / CEIL); }); ceil.oversample = '2x';
      sum.connect(level); level.connect(comp); comp.connect(ceil); ceil.connect(out);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'Feelings', tail: 4 });
      // the voice: N partials, each a pair of sines a celeste apart, panned; a saw growl one octave down from the first; one pitch bus (cents)
      const pitch = node(ac.createConstantSource()); pitch.offset.value = 0; pitch.start();
      const vib = node(ac.createOscillator()), vibD = node(ac.createGain()); vib.frequency.value = 4.8; vibD.gain.value = 0; vib.connect(vibD); vib.start();
      const parts = [];
      for (let i = 0; i < N; i++) {
        const g = node(ac.createGain()), pan = node(ac.createStereoPanner()); g.gain.value = 0; g.connect(pan); pan.connect(bus);
        const pair = [-1, 1].map(sgn => { const o = node(ac.createOscillator()), og = node(ac.createGain()); og.gain.value = 0.5; o.connect(og); og.connect(g); pitch.connect(o.detune); vibD.connect(o.detune); o.start(); return o; });
        parts.push({ g, pan, pair });
      }
      const growl = node(ac.createOscillator()), growlG = node(ac.createGain()); growl.type = 'sawtooth'; growlG.gain.value = 0; growl.connect(growlG); growlG.connect(bus); pitch.connect(growl.detune); growl.start();
      // ---------------------------------------------------------------- the feeling at the dot → every param
      const feel = () => FEEL[P.get('feeling')] || FEEL.love;
      const setName = () => { const h = P.get('harmonics'); return h === 'auto' ? feel().set : h; };
      let touching = false, noteHeld = 0, noteSemis = null;
      function apply(tau) {
        const t = ac.currentTime, f = feel(), x = P.get('x'), y = P.get('y'), sp = P.get('speed'), c = f.at(x, y), T = tau == null ? 0.04 : tau;
        const base = hz(f.root + P.get('root') + (noteSemis == null ? 0 : noteSemis) + c.semis), rs = R() ? R().ratios(setName(), N) : Array.from({ length: N }, (_, i) => [i + 1, 1 / (i + 1)]);
        let tot = 0; parts.forEach((p, i) => { tot += c.amps[i] * rs[i][1]; }); const norm = 0.28 / Math.max(0.4, tot);
        parts.forEach((p, i) => { const fr = Math.min(ac.sampleRate * 0.45, base * rs[i][0]), a = c.amps[i] * rs[i][1] * norm * (fr < ac.sampleRate * 0.44 ? 1 : 0);
          p.pair.forEach((o, k) => { o.frequency.setTargetAtTime(fr, t, T); o.detune.setTargetAtTime((k ? 1 : -1) * c.celeste * 0.5, t, T); });
          p.g.gain.setTargetAtTime(a, t, T); p.pan.pan.setTargetAtTime(i === 0 ? 0 : (i % 2 ? -1 : 1) * Math.min(1, c.width * (0.4 + 0.15 * i)), t, T); });
        growl.frequency.setTargetAtTime(base, t, T); growlG.gain.setTargetAtTime(0.22 * c.growl, t, T);
        driveIn.gain.setTargetAtTime(c.drive * 2.2, t, T); driveOut.gain.setTargetAtTime(c.drive * 0.55, t, T); driveDry.gain.setTargetAtTime(1 - 0.7 * c.drive, t, T);
        rough.gain.setTargetAtTime(1 - 0.5 * c.rough, t, T); roughDepth.gain.setTargetAtTime(0.5 * c.rough, t, T); roughOsc.frequency.setTargetAtTime(Math.max(1, c.roughHz), t, T);
        vibD.gain.setTargetAtTime(c.vib, t, T); vib.frequency.setTargetAtTime(Math.max(0.01, c.vibHz), t, 0.2); pitch.offset.setTargetAtTime(c.sag * (0.4 + 0.6 * x), t, f === FEEL.sadness ? 0.6 : T);
        lp.frequency.setTargetAtTime(Math.min(16000, c.cutoff * (1 + 0.8 * sp)), t, T);
        wet.gain.setTargetAtTime(c.wet, t, 0.15); dry.gain.setTargetAtTime(1 - 0.45 * c.wet, t, 0.15);
        level.gain.setTargetAtTime(db(c.levelDb + 3 * sp) * P.get('level') * 3.2, t, T);
      }
      function sound(on, at, how) {
        const t = Math.max(at || 0, ac.currentTime), f = feel(), g = gate.gain;
        if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); }
        g.setTargetAtTime(on ? 1 : 0, t, (on ? f.attack : (how === 'hard' ? 0.03 : f.release)) / 3);
      }
      const shouldSound = () => touching || noteHeld > 0 || P.get('hold');
      const refresh = (at) => sound(shouldSound(), at);
      ctx.touch = (on, at) => { touching = !!on; refresh(at); };
      ctx.onUI('touch', null, (p) => ctx.touch(!!(p && p.on)));
      // notes: a note plays the feeling at that pitch (relative to its register's own root note), for the note's length
      ctx.onNote((p) => { const t = typeof p.time === 'number' ? p.time : ac.currentTime, dur = Math.max(0.05, p.duration || 0.5);
        noteSemis = ((p.note - feel().root) % 12 + 12) % 12; if (noteSemis > 6) noteSemis -= 12; apply(); noteHeld++; refresh(t);
        ctx.atAudioTime(t + dur, () => { noteHeld = Math.max(0, noteHeld - 1); if (!noteHeld) { refresh(); } }); });
      ctx.audition = (p) => { ctx.touch(true); ctx.timeout(() => ctx.touch(false), 900); };
      ctx.onSilence((p) => { touching = false; noteHeld = 0; sound(false, p && p.time, 'hard'); });
      ['x', 'y', 'speed', 'root', 'level', 'harmonics'].forEach(k => P.onChange(k, () => apply()));
      P.onChange('feeling', () => apply(0.25)); P.onChange('hold', () => refresh());
      ctx.latency = dsp.osLatency(ac, '2x') * 2 + 0.008;
      apply(0.001); refresh();
      ctx.internals = { gate, level, roughOsc, roughDepth, growl, parts, FEEL, apply, get sounding() { return shouldSound(); } };
      return {};
    },
  });
  if (typeof window !== 'undefined') window.FeelingsData = { FEEL };
})();
