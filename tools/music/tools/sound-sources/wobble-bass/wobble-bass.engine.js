/* eravos.wobble-bass 3.1.0 — Wobble Bass (P2) · resolves F-11(wobble) · Wub Lab stage 1 (P38)
 * Dubstep wobble/talking bass: tempo-division LFO that retriggers per note (phase reset),
 * 24 dB lowpass OR formant (vowel) filter bank, monophonic legato with glide.
 * Sub sine is summed after the filter (low-end safety — surfaced decision, see CHANGELOG).
 * 2.1 (3.26): free-rate LFO, retrigger on/off, LFO start phase, pitch dive, vibrato, formant shift, unison spread +
 * stereo width, noise, sub octave, LFO→volume (tremolo wub), output level.
 * 3.0 (Wub Lab stage 1): DRAW — your own wobble shape (points + a bend per segment, ≤ 32 points) · WUB SEQ — a rate roll:
 * every step of 1–16 steps picks its own rate (1/1 … 1/32), shape, HOLD (keep going) or STOP (freeze shut); while it is on
 * the sequence owns the wobble's phase on the bar grid and notes only play pitch · 4 more vowels (UH, AE, IH, ER).
 * 3.1: the sub plays at the wub's own pitch by default (Sub oct 0; it sat an octave under it, 27.5 Hz for an A2) · Grit
 * type (fold = growl, hard, asym, soft) after the filter · Depth to 8 oct so the mouth opens all the way (Cutoff stays 40–8000: saved automation lanes map onto it) ·
 * the Square layer plays at the saw's pitch by default (Square oct 0; it sat an octave under, 27.5 Hz under an A2).
 * 3.4 (toward the Make It Bun Dem growl): what a lowpass/vowel wobble can't do —
 *   FM: a sine modulator (Ratio × the note) bends the saws/square, FM index × the note's frequency so it stays in tune;
 *       FM WUB lets the wobble itself open the FM — the talking growl moves its harmonics, not just a filter over them
 *   SQUASH: 3-band OTT-style squash on the whole output — each band driven into a soft limiter (the growl's mids most):
 *       quiet detail comes up, peaks flatten, the growl comes forward. No look-ahead, so no latency
 *   All default to off: every older preset sounds exactly as before.
 * 3.5 (more power, control, fluidity): RATE BEND (×¼…×4, smooth, between the grid rates) and RATE GLIDE (rate changes swoop;
 *   wub-seq steps glide on instead of restarting) · PITCH WUB to 2400 c (an octave-scream screech; was 100 c) · Octave +2 ·
 *   three new inputs — rate, FM, pitch — so an Envelope / LFO / Wub Rate can move the speed, the growl and the pitch. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const DIVS = ['1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  const SUBK = { '0': 1, '-1': 0.5, '-2': 0.25 };   // 3.1: sub against the wub's pitch (0 = same; was −1 by default → 27.5 Hz under A2)
  // vowel formants F1/F2/F3 (Hz) + band gains (dB)
  const VOWELS = {
    OO: { f: [300, 870, 2240], g: [0, -10, -24] },
    OH: { f: [450, 800, 2830], g: [0, -6, -20] },
    AH: { f: [730, 1090, 2440], g: [0, -4, -14] },
    EH: { f: [530, 1840, 2480], g: [0, -8, -12] },
    EE: { f: [270, 2290, 3010], g: [0, -12, -10] },
    UH: { f: [640, 1190, 2390], g: [0, -5, -18] },
    AE: { f: [660, 1720, 2410], g: [0, -6, -14] },
    IH: { f: [390, 1990, 2550], g: [0, -10, -12] },
    ER: { f: [490, 1350, 1690], g: [0, -6, -10] },
  };
  const SHAPES = ['sine', 'sawdown', 'square', 'yoy', 'draw'];
  const STEPS = { '1/16': 1, '1/8': 2, '1/4': 4, '1/2': 8, '1/1': 16 };   // wub-seq step length in 16ths
  const MAXPTS = 32;
  // a drawn shape: [[x, y, bend], …] — x 0..1 rising, first x = 0; y −1..1; bend −1..1 curves the segment to the NEXT point
  // (the last segment wraps to the first point at x = 1). Pure: same points → same curve.
  function cleanPts(pts) {
    if (!Array.isArray(pts)) return null;
    const out = pts.filter(q => Array.isArray(q) && q.length >= 2 && isFinite(q[0]) && isFinite(q[1])).slice(0, MAXPTS)
      .map(q => [Math.max(0, Math.min(1, +q[0])), Math.max(-1, Math.min(1, +q[1])), Math.max(-1, Math.min(1, +q[2] || 0))]);
    out.sort((a, b) => a[0] - b[0]); if (out.length < 2) return null; out[0][0] = 0;
    return out.map(q => q.map(v => Math.round(v * 1000) / 1000));
  }
  function drawFn(pts) {
    return (x) => {
      let i = pts.length - 1; while (i > 0 && pts[i][0] > x) i--;
      const a = pts[i], b = i + 1 < pts.length ? pts[i + 1] : [1, pts[0][1]], w = Math.max(1e-6, b[0] - a[0]);
      let u = Math.max(0, Math.min(1, (x - a[0]) / w)); const k = a[2] || 0, e = 1 + 4 * Math.abs(k);
      if (k > 0) u = Math.pow(u, e); else if (k < 0) u = 1 - Math.pow(1 - u, e);
      return a[1] + (b[1] - a[1]) * u;
    };
  }
  // drawn shape → PeriodicWave: 64 harmonics with Lanczos σ (sharp corners without ringing past the drawn line)
  function drawWave(ac, pts, phase) {
    const f = drawFn(pts), M = 1024, N = 64, y = new Float32Array(M), re = new Float32Array(N), im = new Float32Array(N);
    for (let i = 0; i < M; i++) y[i] = f(((i / M) + (phase || 0)) % 1);
    for (let n = 1; n < N; n++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const w = 2 * Math.PI * n * i / M; a += y[i] * Math.cos(w); b += y[i] * Math.sin(w); }
      const sg = Math.sin(Math.PI * n / N) / (Math.PI * n / N); re[n] = 2 * a / M * sg; im[n] = 2 * b / M * sg; }
    let dc = 0; for (let i = 0; i < M; i++) dc += y[i];
    return { wave: ac.createPeriodicWave(re, im, { disableNormalization: true }), dc: dc / M };
  }
  // a wub-seq cell: '1/8' · '1/8:yoy' (rate + its own shape) · 'x' (stop: wobble frozen shut) · '' (hold: keep going)
  function parseCell(c) { c = String(c || ''); if (c === 'x') return { stop: true }; const [d, sh] = c.split(':'); return DIVS.includes(d) ? { div: d, shape: SHAPES.includes(sh) ? sh : null } : null; }

  function lfoWave(ac, shape, phase) {
    // all shapes built so that value at phase 0 is the shape's start point (closed filter for sine/yoy)
    const N = 33, re = new Float32Array(N), im = new Float32Array(N);
    if (shape === 'sine') { re[1] = -1; }                                                 // −cos: starts at −1
    else if (shape === 'sawdown') { for (let n = 1; n < N; n++) im[n] = 2 / (Math.PI * n); } // falls from +1 → −1
    else if (shape === 'square') { for (let n = 1; n < N; n += 2) im[n] = 4 / (Math.PI * n); }
    else { // 'yoy': fast rise to open (25 %), talking dip, slower close — DFT of the drawn shape
      const M = 512, y = new Float32Array(M);
      for (let i = 0; i < M; i++) {
        const t = i / M;
        let v;
        if (t < 0.22) v = -1 + 2 * Math.sin((t / 0.22) * Math.PI / 2);
        else if (t < 0.45) v = 1 - 0.9 * Math.sin(((t - 0.22) / 0.23) * Math.PI / 2);
        else if (t < 0.6) v = 0.1 + 0.5 * Math.sin(((t - 0.45) / 0.15) * Math.PI);
        else v = 0.1 - 1.1 * ((t - 0.6) / 0.4);
        y[i] = v;
      }
      for (let n = 1; n < N; n++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const w = 2 * Math.PI * n * i / M; a += y[i] * Math.cos(w); b += y[i] * Math.sin(w); } re[n] = 2 * a / M; im[n] = 2 * b / M; }
    }
    // start phase φ (0..1): x(t + φT) — rotate every harmonic by 2πnφ
    if (phase) for (let n = 1; n < N; n++) { const th = 2 * Math.PI * n * phase, c = Math.cos(th), sn = Math.sin(th), a = re[n], b = im[n]; re[n] = a * c + b * sn; im[n] = -a * sn + b * c; }
    return ac.createPeriodicWave(re, im, { disableNormalization: true });
  }

  OrganismFactory.define({
    id: 'eravos.wobble-bass', preview: 'bass', domain: 'music', version: '3.5.0', label: 'Wobble Bass', icon: '🔊', accent: '#ff2266', phase: 'P2',
    category: 'Sound sources', blurb: 'Dubstep wobble / talking "yoi" bass locked to the tempo. The drop.',
    size: { w: 560, h: 600 }, minSize: { w: 420, h: 380 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.lead_voice'],
    hooks: [
      S.audio_out('wobble.hook.audio_out'), S.note_in('wobble.hook.note_in'), S.midi_in('wobble.hook.midi_in'),
      S.theory_in('wobble.hook.theory_in'), S.transport_in('wobble.hook.transport_in'),
      S.mod_in('wobble.hook.mod_cutoff', 'cutoff'), S.mod_in('wobble.hook.mod_depth', 'depth'), S.mod_in('wobble.hook.mod_drive', 'drive'),
      // 3.5: the wobble's speed, the growl's FM and the pitch — any LFO / Envelope / Wub Rate can drive them
      S.mod_in('wobble.hook.mod_rate', 'rate'), S.mod_in('wobble.hook.mod_fm', 'fm'), S.mod_in('wobble.hook.mod_pitch', 'pitch'),
    ],
    config: [
      { key: 'div', type: 'enum', options: DIVS, default: '1/8', label: 'Wobble rate', group: 'WOBBLE' },
      { key: 'lfoShape', type: 'enum', options: SHAPES, default: 'sine', label: 'Shape', group: 'WOBBLE' },
      { key: 'shapePts', type: 'array', default: [[0, -1, 0.5], [0.2, 1, 0], [0.42, 0.15, -0.4], [0.55, 0.55, 0.3], [0.62, 0.1, 0]], label: 'Drawn shape', group: 'WOBBLE', hidden: true },
      { key: 'depth', type: 'number', default: 3, min: 0, max: 8, step: 0.01, unit: 'oct', label: 'Depth', group: 'WOBBLE' },
      { key: 'lfoSync', type: 'boolean', default: true, label: 'Sync', group: 'WOBBLE' },
      { key: 'lfoHz', type: 'number', default: 4, min: 0.1, max: 24, step: 0.01, unit: 'Hz', label: 'Free rate', group: 'WOBBLE' },
      { key: 'retrig', type: 'boolean', default: true, label: 'Retrig', group: 'WOBBLE' },
      { key: 'lfoPhase', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Phase', group: 'WOBBLE' },
      { key: 'ampMod', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Vol wub', group: 'WOBBLE' },
      { key: 'vibrato', type: 'number', default: 0, min: 0, max: 2400, step: 1, unit: 'c', label: 'Pitch wub', group: 'WOBBLE', hint: 'the wobble bends the pitch too: up to 100 c a wobble, 1200 c an octave scream (the screech)' },
      { key: 'rateBend', type: 'number', default: 1, min: 0.25, max: 4, step: 0.001, unit: '×', label: 'Rate bend', group: 'WOBBLE', hint: 'speeds the wobble up or slows it down smoothly, between the grid rates (×2 = one rate faster)' },
      { key: 'rateGlide', type: 'number', default: 0, min: 0, max: 2, step: 0.001, unit: 's', label: 'Rate glide', group: 'WOBBLE', hint: 'rate changes swoop instead of jumping — Rate bend, the rate ladder and the wub-seq steps (which then glide on without restarting)' },
      { key: 'wubOn', type: 'boolean', default: false, label: 'Wub seq', group: 'WUB SEQ' },
      { key: 'wubLen', type: 'integer', default: 8, min: 1, max: 16, label: 'Steps', group: 'WUB SEQ' },
      { key: 'wubStep', type: 'enum', options: Object.keys(STEPS), default: '1/4', label: 'Step', group: 'WUB SEQ' },
      { key: 'wubSeq', type: 'array', default: ['1/8', '', '1/16', '', '1/4t', 'x', '1/32', '1/8:yoy', '', '', '', '', '', '', '', ''], label: 'Wub steps', group: 'WUB SEQ', hidden: true },
      { key: 'filterMode', type: 'enum', options: ['lowpass', 'formant'], default: 'lowpass', label: 'Filter', group: 'FILTER' },
      { key: 'vowelA', type: 'enum', options: Object.keys(VOWELS), default: 'OO', label: 'Vowel A', group: 'FILTER' },
      { key: 'vowelB', type: 'enum', options: Object.keys(VOWELS), default: 'AH', label: 'Vowel B', group: 'FILTER' },
      { key: 'formantShift', type: 'number', default: 0, min: -12, max: 12, step: 0.1, unit: 'st', label: 'Formant', group: 'FILTER' },
      { key: 'cutoff', type: 'number', default: 300, min: 40, max: 8000, step: 1, unit: 'Hz', label: 'Cutoff', group: 'FILTER' },
      { key: 'res', type: 'number', default: 6, min: 0.5, max: 20, step: 0.1, label: 'Reso', group: 'FILTER' },
      { key: 'fmIndex', type: 'number', default: 0, min: 0, max: 12, step: 0.01, label: 'FM', group: 'GROWL', hint: 'a sine bends the saws: 2–5 growls, more screams (0 = off)' },
      { key: 'fmRatio', type: 'enum', options: ['0.5', '1', '1.5', '2', '3'], default: '1', label: 'FM ratio', group: 'GROWL', hint: '1 and 2 growl in tune, 0.5 is a thick sub-growl, 1.5 / 3 go metallic' },
      { key: 'fmWub', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'FM wub', group: 'GROWL', hint: 'how much the wobble opens the FM too — the talking growl' },
      { key: 'squash', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Squash', group: 'GROWL', hint: '3-band OTT-style squash: fizz up front, everything loud (0 = off)' },
      { key: 'osc2', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Square', group: 'TONE' },
      { key: 'sub', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Sub', group: 'TONE' },
      { key: 'drive', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'TONE' },
      { key: 'shaper', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Grit', group: 'TONE' },
      { key: 'gritMode', type: 'enum', options: ['auto', 'soft', 'asym', 'fold', 'hard'], default: 'auto', label: 'Grit type', group: 'TONE', hint: 'after the filter: fold = growl (harmonics that move with the wobble), hard = clipped and loud, auto = soft, asym above 0.6' },
      { key: 'octave', type: 'integer', default: -1, min: -2, max: 2, label: 'Octave', group: 'TONE', hint: '+1 / +2 = the screech register' },
      { key: 'spread', type: 'number', default: 9, min: 0, max: 50, step: 0.1, unit: 'c', label: 'Unison', group: 'TONE' },
      { key: 'width', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Width', group: 'TONE' },
      { key: 'noise', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Noise', group: 'TONE' },
      { key: 'sqOct', type: 'enum', options: ['0', '-1'], default: '0', label: 'Square oct', group: 'TONE', hint: 'the Square layer against the saw: 0 = same pitch, −1 = an octave under (thick, but 27.5 Hz under an A2 is rumble you feel more than hear)' },
      { key: 'subOct', type: 'enum', options: ['0', '-1', '-2'], default: '0', label: 'Sub oct', group: 'TONE', hint: 'the sub against the wub: 0 = same pitch (the usual), −1 / −2 = deeper (−2 is below most speakers)' },
      { key: 'subAlign', type: 'boolean', default: false, label: 'Sub in phase', group: 'TONE', hint: 'line the clean sub up with the wub layer (it reaches the output 8 ms later through the grit): a more even low end from note to note; off = the original sound' },
      { key: 'level', type: 'number', default: 1, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'TONE' },
      { key: 'glide', type: 'number', default: 0.06, min: 0, max: 0.5, step: 0.001, unit: 's', label: 'Glide', group: 'ENV' },
      { key: 'attack', type: 'number', default: 0.005, min: 0.001, max: 1, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'release', type: 'number', default: 0.12, min: 0.01, max: 2, step: 0.001, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'pitchDive', type: 'number', default: 0, min: -24, max: 24, step: 0.1, unit: 'st', label: 'Dive', group: 'ENV' },
      { key: 'diveTime', type: 'number', default: 0.08, min: 0.005, max: 1, step: 0.001, unit: 's', label: 'Dive time', group: 'ENV' },
    ],
    ui_hooks: ['shape_pts', 'wub_seq'],
    lib: { drawFn, cleanPts, parseCell, DIVS, SHAPES },   // shared with the window (same folder) so the drawing IS the sound
    defaultPreset: 'Classic Wub 1/8',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      // --- oscillators (persistent — mono)
      const saw = ac.createOscillator(); saw.type = 'sawtooth';
      const sq = ac.createOscillator(); sq.type = 'square';
      const sub = ac.createOscillator(); sub.type = 'sine';
      const saw2 = ac.createOscillator(); saw2.type = 'sawtooth'; saw2.detune.value = P.get('spread'); // unison partner (2.1: Unison knob)
      const oscSum = ac.createGain(), sqG = ac.createGain(), subG = ac.createGain(), sawG = ac.createGain(), saw2G = ac.createGain();
      sawG.gain.value = 0.5; saw2G.gain.value = 0.3;
      // 2.1 width: the two saws pan apart (stereo through the filters; the sub stays mono)
      const panA = ac.createStereoPanner(), panB = ac.createStereoPanner();
      saw.connect(sawG); saw2.connect(saw2G); sq.connect(sqG); sawG.connect(panA); saw2G.connect(panB); panA.connect(oscSum); panB.connect(oscSum); sqG.connect(oscSum);
      // 2.1 noise layer (pre-filter, so it wobbles too)
      const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nr = dsp.mulberry32(911), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = nr() * 2 - 1;
      const noiseSrc = ac.createBufferSource(); noiseSrc.buffer = nb; noiseSrc.loop = true; noiseSrc.start(); ctx.track(noiseSrc);
      const noiseG = ac.createGain(); noiseG.gain.value = 0; noiseSrc.connect(noiseG); noiseG.connect(oscSum);
      [panA, panB].forEach(n => ctx.track(n));
      sub.connect(subG);
      [saw, sq, sub, saw2].forEach(o => { o.frequency.value = 55; o.start(); ctx.track(o); });
      // pre-drive
      const pre = ac.createGain(), preSh = ac.createWaveShaper(); preSh.oversample = '4x';
      oscSum.connect(pre); pre.connect(preSh);
      const driveMod = ctx.modBus('drive', { min: 0, max: 1 }); const driveModG = ac.createGain(); driveModG.gain.value = 4; driveMod.connect(driveModG); driveModG.connect(pre.gain);
      // lowpass path
      const lp1 = ac.createBiquadFilter(), lp2 = ac.createBiquadFilter(); lp1.type = lp2.type = 'lowpass';
      preSh.connect(lp1); lp1.connect(lp2);
      const lpOut = ac.createGain(); lp2.connect(lpOut);
      // formant path
      const formIn = ac.createGain(), formOut = ac.createGain(); preSh.connect(formIn);
      const bands = [0, 1, 2].map(() => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; const g = ac.createGain(); formIn.connect(b); b.connect(g); g.connect(formOut); return { b, g }; });
      const formMakeup = ac.createGain(); formOut.connect(formMakeup);
      const filtSel = ac.createGain(); lpOut.connect(filtSel); formMakeup.connect(filtSel);
      // 3.4 FM: sine at Ratio × note → depth = note Hz × (index·(1 − wub) + index·wub·wobble) → the saws' and square's frequency
      const fmOsc = ac.createOscillator(); fmOsc.type = 'sine'; fmOsc.frequency.value = 55; fmOsc.start();
      const fHz = ac.createConstantSource(); fHz.offset.value = 55; fHz.start();
      const fmVca = ac.createGain(); fmVca.gain.value = 0; fmOsc.connect(fmVca);
      const fmStatic = ac.createGain(); fmStatic.gain.value = 0; fHz.connect(fmStatic); fmStatic.connect(fmVca.gain);
      const fmWubVca = ac.createGain(); fmWubVca.gain.value = 0; fHz.connect(fmWubVca); fmWubVca.connect(fmVca.gain);
      const fmWubDepth = ac.createGain(); fmWubDepth.gain.value = 0; fmWubDepth.connect(fmWubVca.gain);
      [saw, saw2, sq].forEach(o => fmVca.connect(o.frequency));
      // 3.5 FM input: (index added by what is wired) × note Hz → the FM depth
      const fmMod = ctx.modBus('fm', { min: -6, max: 6 }); const fmModVca = ac.createGain(); fmModVca.gain.value = 0; fHz.connect(fmModVca); fmMod.connect(fmModVca.gain); fmModVca.connect(fmVca.gain); ctx.track(fmModVca);
      // 3.5 pitch input (cents): the wub layer bends (Envelope = dives, LFO = screams); the clean sub stays on the note
      const pitchMod = ctx.modBus('pitch', { min: -2400, max: 2400 }); [saw, saw2, sq].forEach(o => pitchMod.connect(o.detune));
      [fmOsc, fHz, fmVca, fmStatic, fmWubVca, fmWubDepth].forEach(n => ctx.track(n));
      // post shaper → amp
      // P14 fix ("blown speaker"): only the filtered mid layer is distorted. The sub joins AFTER the shaper, clean;
      // the distorted layer is DC-blocked + high-passed so it never fights the sub, and its fizz is rolled off.
      const post = ac.createWaveShaper(); post.oversample = '4x';
      const postIn = ac.createGain(); filtSel.connect(postIn); postIn.connect(post);
      const dcBlock = ac.createBiquadFilter(); dcBlock.type = 'highpass'; dcBlock.frequency.value = 85; dcBlock.Q.value = 0.6;
      const fizz = ac.createBiquadFilter(); fizz.type = 'lowpass'; fizz.frequency.value = 9500; fizz.Q.value = 0.5;
      const amp = ac.createGain(); amp.gain.value = 0;
      const trem = ac.createGain(); trem.gain.value = 1;   // 2.1: LFO → volume ("Vol wub")
      const level = ac.createGain(); level.gain.value = 0.3;
      const subLP = ac.createBiquadFilter(); subLP.type = 'lowpass'; subLP.frequency.value = 140; subG.connect(subLP);
      // 3.39 timing (Chromium: a 4x shaper delays 192 samples). The mid layer's oscillators reach amp through BOTH shapers (384
      // samples); the filter / formant wobble through the post shaper only (192). So: mid-layer pitch is scheduled 384 early (no
      // 8 ms of the old note when the gate opens), the LFO restarts 192 early (its volume-wub path delayed 192 to match) so the
      // wobble is heard ON the grid, and the amp gate stays exactly on the note. The clean sub is untouched — its phase against
      // the mid layer (and so every preset's low end) is exactly as before; aligning it is a separate, measured choice
      // (specs: wobble-bass.spec § 3.2 timing). Vibrato (oscillator detune) still lands 192 behind the filter.
      const OS4 = dsp.osLatency(ac, '4x'), OSC_LAT = 2 * OS4, FILT_LAT = OS4;
      // Sub in phase (3.41, off by default): the clean sub waits OSC_LAT and its pitch leaves OSC_LAT early, like the wub layer
      const subAl = ac.createDelay(0.05); subAl.delayTime.value = P.get('subAlign') ? OSC_LAT : 0; ctx.track(subAl);
      P.onChange('subAlign', (v) => subAl.delayTime.setValueAtTime(v ? OSC_LAT : 0, ac.currentTime));
      post.connect(dcBlock); dcBlock.connect(fizz); fizz.connect(amp); subLP.connect(subAl); subAl.connect(amp); amp.connect(trem);
      // 3.4 SQUASH (OTT-style): trem → [straight] or [3 bands, each driven into a soft limiter and brought back up] → level.
      // Each band is pushed into tanh by its own amount (highs most), so quiet detail comes up and peaks flatten — the dense,
      // loud, fizzy growl — with no look-ahead (zero latency) and no compressor pumping. Switched, never blended.
      const sqDry = ac.createGain(), sqWet = ac.createGain(), sqTop = ac.createBiquadFilter(); sqDry.gain.value = 1; sqWet.gain.value = 0;
      sqTop.type = 'lowpass'; sqTop.frequency.value = 12000; sqTop.Q.value = 0.5;   // anything the limiters fold up high goes
      trem.connect(sqDry); sqDry.connect(level); sqWet.connect(sqTop); sqTop.connect(level);
      const tanh = new Float32Array(2049); for (let i = 0; i < 2049; i++) { const x = (i / 2048) * 2 - 1; tanh[i] = Math.tanh(1.5 * x) / Math.tanh(1.5); } tanh[1024] = 0;
      const bandDefs = [['lowpass', 180, null], ['bandpass', 180, 2400], ['highpass', 2400, null]];
      const sqBands = bandDefs.map(([type, f1, f2]) => {
        const a = ac.createBiquadFilter(); a.type = type === 'bandpass' ? 'highpass' : type; a.frequency.value = f1; a.Q.value = 0.5;
        let tail = a; if (f2) { const b = ac.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f2; b.Q.value = 0.5; a.connect(b); tail = b; ctx.track(b); }
        const drv = ac.createGain(), sh = ac.createWaveShaper(), mk = ac.createGain(); sh.curve = tanh;
        trem.connect(a); tail.connect(drv); drv.connect(sh); sh.connect(mk); mk.connect(sqWet); [a, drv, sh, mk].forEach(n => ctx.track(n)); return { drv, mk };
      });
      [sqDry, sqWet, sqTop].forEach(n => ctx.track(n));
      const postLat = 0;   // (kept for the wobble timing below: squash adds no delay)
      function applySquash() {
        const x = P.get('squash'), on = x > 0.001, t = ac.currentTime;
        sqDry.gain.setTargetAtTime(on ? 0 : 1, t, 0.004); sqWet.gain.setTargetAtTime(on ? 1 : 0, t, 0.004);
        // drive into the limiter: lows gently, the growl's mids most, highs a little, each made up to sit level
        // the lows (the sub) pass clean at unity (driven so low the curve is straight, made back up exactly) — only the growl
        // above 180 Hz is squashed: mids most, highs a little
        sqBands.forEach((b, i) => { if (i === 0) { b.drv.gain.setTargetAtTime(0.25, t, 0.01); b.mk.gain.setTargetAtTime(Math.tanh(1.5) / 1.5 / 0.25, t, 0.01); return; } const d = 1 + x * [0, 5, 3][i]; b.drv.gain.setTargetAtTime(d, t, 0.01); b.mk.gain.setTargetAtTime([0, 0.75, 0.5][i] / (0.6 + 0.4 * Math.sqrt(d)), t, 0.01); });
      }
      [dcBlock, fizz, subLP].forEach(n => ctx.track(n));
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'wobble' });

      // --- LFO → wobble (unipolar 0..1 from bipolar osc) → lowpass detune + formant freqs
      const lfoBus = ac.createGain(); lfoBus.gain.value = 0.5;               // −1..1 → −0.5..0.5
      const lfoOffset = ac.createConstantSource(); lfoOffset.offset.value = 0.5; lfoOffset.start(); ctx.track(lfoOffset);
      const uni = ac.createGain(); lfoBus.connect(uni); lfoOffset.connect(uni); // uni = 0..1
      const depthG = ac.createGain(); uni.connect(depthG); depthG.connect(lp1.detune); depthG.connect(lp2.detune);
      const depthMod = ctx.modBus('depth', { min: 0, max: 7200 }); depthMod.connect(depthG.gain);
      const cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 }); cutMod.connect(lp1.detune); cutMod.connect(lp2.detune);
      // 2.1: tremolo + vibrato ride the same LFO
      const tremDepth = ac.createGain(), tremAl = ac.createDelay(0.05); tremDepth.gain.value = 0; tremAl.delayTime.value = FILT_LAT; uni.connect(tremDepth); tremDepth.connect(tremAl); tremAl.connect(trem.gain); ctx.track(tremAl);
      const vibG = ac.createGain(); vibG.gain.value = 0; lfoBus.connect(vibG); [saw, saw2, sq].forEach(o => vibG.connect(o.detune));
      const bandScale = bands.map(bd => { const f = ac.createGain(), gg = ac.createGain(); uni.connect(f); f.connect(bd.b.frequency); uni.connect(gg); gg.connect(bd.g.gain); return { f, gg }; });
      let lfo = null;
      const waves = {};
      // drawn shapes carry a DC term the oscillator cannot (PeriodicWave drops n = 0) → a ConstantSource adds it back
      const drawDc = ac.createConstantSource(); drawDc.offset.value = 0; drawDc.connect(lfoBus); drawDc.start(); ctx.track(drawDc);
      const wave = (s, ph) => {
        if (s === 'draw') { const pts = cleanPts(P.get('shapePts')) || [[0, -1, 0], [0.5, 1, 0]], k = 'draw@' + JSON.stringify(pts) + (ph || 0).toFixed(2); return waves[k] || (waves[k] = drawWave(ac, pts, ph || 0)); }
        const k = s + '@' + (ph || 0).toFixed(2); return waves[k] || (waves[k] = { wave: lfoWave(ac, s, ph || 0), dc: 0 });
      };
      let seqShape = null;                                  // the wub-seq step's own shape (null = the tool's Shape)
      const curWave = () => wave(seqShape || P.get('lfoShape'), P.get('lfoPhase'));
      let curDiv = P.get('div'), frozen = false;
      const lfoLog = [];                                    // [{t, div, shape, stop}] last 64 restarts — the tests read it
      function lfoFreq(div) { return P.get('lfoSync') ? 1 / MT.divisionSec(div, ctx.bpm) : P.get('lfoHz'); }
      function setWave(w, t) { lfo.setPeriodicWave(w.wave); drawDc.offset.setValueAtTime(w.dc, t === undefined ? ac.currentTime : t); }
      // 3.5 the wobble's speed beyond the grid: Rate bend (glided) + the rate input, both in cents on every LFO's detune
      const rateBus = ac.createConstantSource(); rateBus.offset.value = 1200 * Math.log2(P.get('rateBend') || 1); rateBus.start(); ctx.track(rateBus);
      const rateMod = ctx.modBus('rate', { min: -2400, max: 2400 });
      const glideTau = () => Math.max(0.004, P.get('rateGlide') / 3);
      function startLfo(t, div, o) {
        o = o || {};
        const heard = t; t = Math.max(ac.currentTime, t - FILT_LAT);   // 3.39: restart early so the wobble is HEARD at `heard`
        if (lfo) { try { lfo.stop(t); } catch (e) {} const old = lfo; old.onended = () => { try { old.disconnect(); rateBus.disconnect(old.detune); rateMod.disconnect(old.detune); } catch (e) {} ctx.untrack(old); }; }
        lfo = ac.createOscillator(); setWave(curWave(), t);
        curDiv = div || P.get('div'); frozen = !!o.stop;
        const f = frozen ? 1e-4 : lfoFreq(curDiv);          // STOP = the shape's start point, held (shut for the built-in shapes)
        lfo.frequency.value = f; lfo.frequency.setValueAtTime(f, t);
        lfo.connect(lfoBus); rateBus.connect(lfo.detune); rateMod.connect(lfo.detune); lfo.start(t);
        ctx.track(lfo);
        lfoLog.push({ t: heard, at: t, div: curDiv, shape: seqShape || P.get('lfoShape'), stop: frozen }); if (lfoLog.length > 64) lfoLog.shift();
      }
      startLfo(ac.currentTime, P.get('div'));

      function applyTone() {
        const now = ac.currentTime;
        dsp.setSmooth(sqG.gain, P.get('osc2') * 0.55, ac); dsp.setSmooth(subG.gain, P.get('sub') * 0.55, ac);
        preSh.curve = dsp.curve('tanh', 0.1 + P.get('drive') * 0.9); pre.gain.setTargetAtTime(0.8 + P.get('drive') * 1.5, now, 0.01);
        const gm = P.get('gritMode'), kind = gm === 'auto' ? (P.get('shaper') > 0.6 ? 'asym' : 'soft') : gm;
        post.curve = dsp.curve(kind, P.get('shaper') * (kind === 'fold' ? 1 : kind === 'hard' ? 0.5 : 0.75));
        const comp = 1 / (0.6 + dsp.curveRms(post.curve) * 0.8);
        dsp.setSmooth(level.gain, 0.45 * comp * P.get('level'), ac);
        saw2.detune.setTargetAtTime(P.get('spread'), now, 0.02);
        const w = P.get('width'); panA.pan.setTargetAtTime(-w, now, 0.02); panB.pan.setTargetAtTime(w, now, 0.02);
        dsp.setSmooth(noiseG.gain, P.get('noise') * 0.35, ac);
        const am = P.get('ampMod'); trem.gain.setTargetAtTime(1 - am, now, 0.01); tremDepth.gain.setTargetAtTime(am, now, 0.01);
        vibG.gain.setTargetAtTime(P.get('vibrato') * 2, now, 0.01); // lfoBus is ±0.5 → ±cents
      }
      function applyFilter() {
        const mode = P.get('filterMode'), c = P.get('cutoff'), q = P.get('res'), d = P.get('depth');
        lp1.frequency.setTargetAtTime(c, ac.currentTime, 0.01); lp2.frequency.setTargetAtTime(c, ac.currentTime, 0.01);
        lp1.Q.value = q; lp2.Q.value = Math.min(q, 3) * 0.5;
        depthG.gain.setTargetAtTime(d * 1200, ac.currentTime, 0.01);
        const A = VOWELS[P.get('vowelA')], B = VOWELS[P.get('vowelB')], fs = Math.pow(2, P.get('formantShift') / 12);
        bands.forEach((bd, i) => {
          bd.b.frequency.value = Math.min(18000, A.f[i] * fs); bd.b.Q.value = 4 + q * 0.9;
          bandScale[i].f.gain.value = (B.f[i] - A.f[i]) * fs;
          const ga = dsp.dbToGain(A.g[i]), gb = dsp.dbToGain(B.g[i]);
          bd.g.gain.value = ga; bandScale[i].gg.gain.value = gb - ga;
        });
        formMakeup.gain.value = 2.2 + q * 0.12;
        lpOut.gain.setTargetAtTime(mode === 'lowpass' ? 1 : 0, ac.currentTime, 0.005);
        formMakeup.gain.setTargetAtTime(mode === 'formant' ? 2.2 + q * 0.12 : 0, ac.currentTime, 0.005);
      }
      function applyFm(t) {
        t = t === undefined ? ac.currentTime : t;
        const idx = P.get('fmIndex'), w = P.get('fmWub');
        fmStatic.gain.setTargetAtTime(idx * (1 - w), t, 0.01); fmWubDepth.gain.setTargetAtTime(idx * w, t, 0.01);
      }
      uni.connect(fmWubDepth);   // the wobble (0..1) opens the FM
      applyTone(); applyFilter(); applyFm(); applySquash();
      ['fmIndex', 'fmWub'].forEach(k => P.onChange(k, () => applyFm()));
      P.onChange('fmRatio', () => fmOsc.frequency.setTargetAtTime(curF * (+P.get('fmRatio') || 1), ac.currentTime, 0.01));
      P.onChange('squash', applySquash);
      ['osc2', 'sub', 'drive', 'shaper', 'gritMode', 'level', 'spread', 'width', 'noise', 'ampMod', 'vibrato'].forEach(k => P.onChange(k, applyTone));
      ['filterMode', 'cutoff', 'res', 'depth', 'vowelA', 'vowelB', 'formantShift'].forEach(k => P.onChange(k, applyFilter));
      ['lfoShape', 'lfoPhase', 'shapePts'].forEach(k => P.onChange(k, () => { if (lfo) setWave(curWave()); }));
      const retime = () => {
        if (!lfo || frozen) return; const t = ac.currentTime, f = lfoFreq(curDiv), g = P.get('rateGlide');
        lfo.frequency.cancelScheduledValues(t); if (g > 0) { lfo.frequency.setValueAtTime(lfo.frequency.value, t); lfo.frequency.exponentialRampToValueAtTime(f, t + g); } else lfo.frequency.value = f;
      };
      P.onChange('rateBend', (v) => rateBus.offset.setTargetAtTime(1200 * Math.log2(v || 1), ac.currentTime, glideTau()));
      P.onChange('div', (v) => { curDiv = v; retime(); }); P.onChange('lfoSync', retime); P.onChange('lfoHz', retime);
      let pendingBpm = false;
      ctx.onBpm(() => { pendingBpm = true; });
      ctx.onTick((t) => {
        if (pendingBpm && lfo && !frozen) { lfo.frequency.setValueAtTime(lfoFreq(curDiv), t.time); pendingBpm = false; }
        // WUB SEQ: on each step boundary of the bar grid the step's cell restarts the wobble (phase 0) at its own rate/shape
        if (!P.get('wubOn')) return;
        const len = STEPS[P.get('wubStep')] || 4; if (t.step16 % len) return;
        const n = Math.max(1, Math.min(16, P.get('wubLen'))), cell = parseCell((P.get('wubSeq') || [])[Math.floor(t.step16 / len) % n]);
        if (!cell) return;                                  // hold: the wobble keeps rolling
        if (cell.stop) { seqShape = null; startLfo(t.time, curDiv, { stop: true }); return; }
        // 3.5 Rate glide on: the step glides the running wobble to its rate (no restart) — a rate ramp, not a jump
        if (P.get('rateGlide') > 0 && lfo && !frozen) {
          const at = Math.max(ac.currentTime, t.time - FILT_LAT), f = lfoFreq(cell.div); curDiv = cell.div;
          lfo.frequency.cancelScheduledValues(at); lfo.frequency.setValueAtTime(lfo.frequency.value, at); lfo.frequency.exponentialRampToValueAtTime(f, at + P.get('rateGlide'));
          if (cell.shape !== seqShape) { seqShape = cell.shape; setWave(curWave(), at); }
          lfoLog.push({ t: t.time, at, div: curDiv, shape: seqShape || P.get('lfoShape'), stop: false, glide: true }); if (lfoLog.length > 64) lfoLog.shift();
          return;
        }
        seqShape = cell.shape; startLfo(t.time, cell.div);
      });
      P.onChange('wubOn', (on) => { if (!on) { seqShape = null; if (frozen) startLfo(ac.currentTime, P.get('div')); } });

      // --- notes (mono legato)
      let held = null; // {note, off}
      let curF = 55;
      function setFreq(f, t0, glide, fromHz) {
        const from = fromHz || curF, subK = SUBK[P.get('subOct')] || 1;
        [[saw, 1, true], [sq, P.get('sqOct') === '-1' ? 0.5 : 1, true], [saw2, 1, true], [sub, subK, false], [fmOsc, +P.get('fmRatio') || 1, true], [{ frequency: fHz.offset }, 1, true]].forEach(([o, k, shaped]) => {
          const t = (shaped || P.get('subAlign')) ? Math.max(ac.currentTime, t0 - OSC_LAT) : t0;   // 3.39: the shaped layer's pitch leaves early; the sub's too when it is in phase
          o.frequency.cancelScheduledValues(t);
          if (glide > 0) { o.frequency.setValueAtTime(from * k, t); o.frequency.exponentialRampToValueAtTime(f * k, t + glide); }
          else o.frequency.setValueAtTime(f * k, t);
        });
        curF = f;
      }
      function noteOn(note, vel, t, o) {
        o = o || {};
        t = Math.max(t, ac.currentTime);
        const n = note + 12 * P.get('octave');
        const f = MT.hz(Math.max(12, n));
        const legato = held && held.off > t - 1e-4;
        const slide = !!o.slide && legato;
        if (slide) { setFreq(f, t, Math.max(0.005, P.get('glide'))); }
        else {
          const dive = P.get('pitchDive');
          if (dive && !legato) setFreq(f, t, P.get('diveTime'), f * Math.pow(2, dive / 12)); // 2.1: pitch dive into the note
          else setFreq(f, t, legato ? Math.max(0.003, P.get('glide') * 0.5) : 0);
          if (P.get('wubOn')) { /* the wub sequence owns the wobble's phase and rate; notes play pitch only */ }
          else if (P.get('retrig') || !lfo) startLfo(t, o.wobbleDiv || P.get('div'), { fromNote: true });   // phase reset per non-slide note
          else if (o.wobbleDiv && o.wobbleDiv !== curDiv) { curDiv = o.wobbleDiv; lfo.frequency.setValueAtTime(lfoFreq(curDiv), t); }
          const g = amp.gain; g.cancelScheduledValues(t);
          if (!legato) { g.setValueAtTime(0, t); }
          g.linearRampToValueAtTime((0.08 + 0.92 * Math.pow(vel, 1.5)), t + P.get('attack'));
        }
        const off = o.duration !== undefined ? t + o.duration : Infinity;
        held = { note, off, t };
        if (off !== Infinity) {
          amp.gain.setValueAtTime((0.08 + 0.92 * Math.pow(vel, 1.5)), off);
          amp.gain.setTargetAtTime(0, off, P.get('release') / 4);
        }
        ctx.lastNote = { note, n, f, t, slide };
      }
      function noteOff(note, t) {
        if (!held || held.note !== note) return;
        t = Math.max(t || ac.currentTime, ac.currentTime);
        if (typeof amp.gain.cancelAndHoldAtTime === 'function') amp.gain.cancelAndHoldAtTime(t); else amp.gain.cancelScheduledValues(t);
        amp.gain.setTargetAtTime(0, t, P.get('release') / 4); held.off = t;
      }
      P.onChange('sqOct', () => { sq.frequency.setTargetAtTime(curF * (P.get('sqOct') === '-1' ? 0.5 : 1), ac.currentTime, 0.01); });
      P.onChange('subOct', () => { sub.frequency.setTargetAtTime(curF * (SUBK[P.get('subOct')] || 1), ac.currentTime, 0.01); });
      ctx.noteOn = noteOn;
      ctx.onNote((p) => {
        const o = { duration: p.duration, slide: p.slide, wobbleDiv: p.wobbleDiv && DIVS.includes(p.wobbleDiv) ? p.wobbleDiv : undefined };
        noteOn(p.note, p.velocity * (p.accent ? 1 : 0.9), p.time, o);
      });
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note, ac.currentTime); });
      ctx.onKey(() => ctx.syncUI());
      ctx.audition = (p) => noteOn(p.note || 45, p.velocity || 0.9, ac.currentTime, { duration: p.duration || 1.2 });
      ctx.auditionOff = (p) => noteOff(p.note || 45);
      ctx.onUI('shape_pts', { type: 'object', required: ['points'] }, (p) => {
        const pts = cleanPts(p.points); if (!pts) return ctx.fault('RUNTIME_002', 'a drawn shape needs 2–32 points [x, y, bend]');
        P.set('shapePts', pts); if (P.get('lfoShape') !== 'draw') P.set('lfoShape', 'draw');
      });
      ctx.onUI('wub_seq', { type: 'object', required: ['cells'] }, (p) => {
        if (!Array.isArray(p.cells)) return ctx.fault('RUNTIME_002', 'wub_seq needs cells[]');
        const cells = Array.from({ length: 16 }, (_, i) => { const c = String(p.cells[i] || ''); return c === 'x' || parseCell(c) ? c : ''; });
        P.set('wubSeq', cells); if (p.on !== undefined) P.set('wubOn', !!p.on);
      });
      ctx.shapeAt = (x) => drawFn(cleanPts(P.get('shapePts')) || [[0, -1, 0], [0.5, 1, 0]])(((x % 1) + 1) % 1);
      ctx.stateExtra = () => ({ vowels: VOWELS, key: ctx.key, divs: DIVS, shapes: SHAPES });
      ctx.internals = { lp1, lp2, bands, lfoBus, amp, uni, trem, vibG, noiseG, panA, panB, saw2, sub, drawDc, lfoLog, get lfo() { return lfo; }, get frozen() { return frozen; } };
      return {};
    },
  });
})();
