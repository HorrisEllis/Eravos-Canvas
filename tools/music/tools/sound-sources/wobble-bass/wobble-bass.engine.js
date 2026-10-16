/* eravos.wobble-bass 3.0.0 — Wobble Bass (P2) · resolves F-11(wobble) · Wub Lab stage 1 (P38)
 * Dubstep wobble/talking bass: tempo-division LFO that retriggers per note (phase reset),
 * 24 dB lowpass OR formant (vowel) filter bank, monophonic legato with glide.
 * Sub sine is summed after the filter (low-end safety — surfaced decision, see CHANGELOG).
 * 2.1 (3.26): free-rate LFO, retrigger on/off, LFO start phase, pitch dive, vibrato, formant shift, unison spread +
 * stereo width, noise, sub octave, LFO→volume (tremolo wub), output level.
 * 3.0 (Wub Lab stage 1): DRAW — your own wobble shape (points + a bend per segment, ≤ 32 points) · WUB SEQ — a rate roll:
 * every step of 1–16 steps picks its own rate (1/1 … 1/32), shape, HOLD (keep going) or STOP (freeze shut); while it is on
 * the sequence owns the wobble's phase on the bar grid and notes only play pitch · 4 more vowels (UH, AE, IH, ER). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const DIVS = ['1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
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
    id: 'eravos.wobble-bass', preview: 'bass', domain: 'music', version: '3.0.0', label: 'Wobble Bass', icon: '🔊', accent: '#ff2266', phase: 'P2',
    category: 'Sound sources', blurb: 'Dubstep wobble / talking "yoi" bass locked to the tempo. The drop.',
    size: { w: 560, h: 600 }, minSize: { w: 420, h: 380 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.lead_voice'],
    hooks: [
      S.audio_out('wobble.hook.audio_out'), S.note_in('wobble.hook.note_in'), S.midi_in('wobble.hook.midi_in'),
      S.theory_in('wobble.hook.theory_in'), S.transport_in('wobble.hook.transport_in'),
      S.mod_in('wobble.hook.mod_cutoff', 'cutoff'), S.mod_in('wobble.hook.mod_depth', 'depth'), S.mod_in('wobble.hook.mod_drive', 'drive'),
    ],
    config: [
      { key: 'div', type: 'enum', options: DIVS, default: '1/8', label: 'Wobble rate', group: 'WOBBLE' },
      { key: 'lfoShape', type: 'enum', options: SHAPES, default: 'sine', label: 'Shape', group: 'WOBBLE' },
      { key: 'shapePts', type: 'array', default: [[0, -1, 0.5], [0.2, 1, 0], [0.42, 0.15, -0.4], [0.55, 0.55, 0.3], [0.62, 0.1, 0]], label: 'Drawn shape', group: 'WOBBLE', hidden: true },
      { key: 'depth', type: 'number', default: 3, min: 0, max: 6, step: 0.01, unit: 'oct', label: 'Depth', group: 'WOBBLE' },
      { key: 'lfoSync', type: 'boolean', default: true, label: 'Sync', group: 'WOBBLE' },
      { key: 'lfoHz', type: 'number', default: 4, min: 0.1, max: 24, step: 0.01, unit: 'Hz', label: 'Free rate', group: 'WOBBLE' },
      { key: 'retrig', type: 'boolean', default: true, label: 'Retrig', group: 'WOBBLE' },
      { key: 'lfoPhase', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Phase', group: 'WOBBLE' },
      { key: 'ampMod', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Vol wub', group: 'WOBBLE' },
      { key: 'vibrato', type: 'number', default: 0, min: 0, max: 100, step: 1, unit: 'c', label: 'Pitch wub', group: 'WOBBLE' },
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
      { key: 'osc2', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Square', group: 'TONE' },
      { key: 'sub', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Sub', group: 'TONE' },
      { key: 'drive', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'TONE' },
      { key: 'shaper', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Grit', group: 'TONE' },
      { key: 'octave', type: 'integer', default: -1, min: -2, max: 1, label: 'Octave', group: 'TONE' },
      { key: 'spread', type: 'number', default: 9, min: 0, max: 50, step: 0.1, unit: 'c', label: 'Unison', group: 'TONE' },
      { key: 'width', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Width', group: 'TONE' },
      { key: 'noise', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Noise', group: 'TONE' },
      { key: 'subOct', type: 'enum', options: ['-1', '-2'], default: '-1', label: 'Sub oct', group: 'TONE' },
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
      post.connect(dcBlock); dcBlock.connect(fizz); fizz.connect(amp); subLP.connect(amp); amp.connect(trem); trem.connect(level);
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
      const tremDepth = ac.createGain(); tremDepth.gain.value = 0; uni.connect(tremDepth); tremDepth.connect(trem.gain);
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
      function startLfo(t, div, o) {
        o = o || {};
        if (lfo) { try { lfo.stop(t); } catch (e) {} const old = lfo; old.onended = () => { try { old.disconnect(); } catch (e) {} ctx.untrack(old); }; }
        lfo = ac.createOscillator(); setWave(curWave(), t);
        curDiv = div || P.get('div'); frozen = !!o.stop;
        const f = frozen ? 1e-4 : lfoFreq(curDiv);          // STOP = the shape's start point, held (shut for the built-in shapes)
        lfo.frequency.value = f; lfo.frequency.setValueAtTime(f, t);
        lfo.connect(lfoBus); lfo.start(t);
        ctx.track(lfo);
        lfoLog.push({ t, div: curDiv, shape: seqShape || P.get('lfoShape'), stop: frozen }); if (lfoLog.length > 64) lfoLog.shift();
      }
      startLfo(ac.currentTime, P.get('div'));

      function applyTone() {
        const now = ac.currentTime;
        dsp.setSmooth(sqG.gain, P.get('osc2') * 0.55, ac); dsp.setSmooth(subG.gain, P.get('sub') * 0.55, ac);
        preSh.curve = dsp.curve('tanh', 0.1 + P.get('drive') * 0.9); pre.gain.setTargetAtTime(0.8 + P.get('drive') * 1.5, now, 0.01);
        post.curve = dsp.curve(P.get('shaper') > 0.6 ? 'asym' : 'soft', P.get('shaper') * 0.75);
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
      applyTone(); applyFilter();
      ['osc2', 'sub', 'drive', 'shaper', 'level', 'spread', 'width', 'noise', 'ampMod', 'vibrato'].forEach(k => P.onChange(k, applyTone));
      ['filterMode', 'cutoff', 'res', 'depth', 'vowelA', 'vowelB', 'formantShift'].forEach(k => P.onChange(k, applyFilter));
      ['lfoShape', 'lfoPhase', 'shapePts'].forEach(k => P.onChange(k, () => { if (lfo) setWave(curWave()); }));
      const retime = () => { if (lfo && !frozen) { lfo.frequency.cancelScheduledValues(ac.currentTime); lfo.frequency.value = lfoFreq(curDiv); } };
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
        seqShape = cell.shape; startLfo(t.time, cell.div);
      });
      P.onChange('wubOn', (on) => { if (!on) { seqShape = null; if (frozen) startLfo(ac.currentTime, P.get('div')); } });

      // --- notes (mono legato)
      let held = null; // {note, off}
      let curF = 55;
      function setFreq(f, t, glide, fromHz) {
        const from = fromHz || curF, subK = P.get('subOct') === '-2' ? 0.25 : 0.5;
        [[saw, 1], [sq, 0.5], [saw2, 1], [sub, subK]].forEach(([o, k]) => {
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
          else if (P.get('retrig') || !lfo) startLfo(t, o.wobbleDiv || P.get('div'));   // phase reset per non-slide note
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
      P.onChange('subOct', () => { sub.frequency.setTargetAtTime(curF * (P.get('subOct') === '-2' ? 0.25 : 0.5), ac.currentTime, 0.01); });
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
