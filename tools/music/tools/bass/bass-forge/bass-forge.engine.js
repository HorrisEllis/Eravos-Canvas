/* eravos.bass-forge 1.0.0 — Bass Forge · spec eravos.organism.bass-forge
 * Growls, riddim, neuro, screech, tearout — FM-based, not filter-based (the Wobble Bass is filter-based, the Reese is
 * detune-based; this is the third, different way). Chain: 2 carriers (unison) frequency-modulated by a sine at ANY
 * ratio (incl. irrational φ, √2, π/2) → wavefolder → vowel formant morph → pitch-tracked comb → riddim notch →
 * low-pass → drive / bit-crush → 3-band upward-ish OTT squash → clean sub added last.
 * ONE tempo LFO (retriggered per note) moves FM index, fold, formant, comb, notch and cutoff together — each with
 * its own depth — so a single gesture talks. Pitch envelope for zaps / lasers.
 * MATCH (recursive): drop a reference bass clip → it is measured (centroid, flatness, sub/brightness balance,
 * modulation rate + depth) → the forge renders itself offline, measures the render, nudges its knobs (coordinate
 * descent, step halving) and loops until the distance stops shrinking. Same graph code live and offline. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, dsp = OrganismSDK.dsp;
  const DIVS = ['1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  const SHAPES = ['sine', 'saw', 'square', 'stair', 'talk'];
  const RATIOS = { '1': 1, '2': 2, '0.5': 0.5, '1.5': 1.5, '3': 3, 'φ 1.618': 1.6180339887, '√2 1.414': Math.SQRT2, 'π/2 1.571': Math.PI / 2, 'e/2 1.359': Math.E / 2, '7/4': 1.75 };
  const VOW = { OO: [300, 870], OH: [450, 800], AH: [730, 1090], EH: [530, 1840], EE: [270, 2290] };
  function lfoWave(A, shape) {
    const N = 33, re = new Float32Array(N), im = new Float32Array(N);
    const draw = (fn) => { const M = 512; for (let n = 1; n < N; n++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const y = fn(i / M), w = 2 * Math.PI * n * i / M; a += y * Math.cos(w); b += y * Math.sin(w); } re[n] = 2 * a / M; im[n] = 2 * b / M; } };
    if (shape === 'sine') re[1] = -1;
    else if (shape === 'saw') draw(t => 1 - 2 * t);
    else if (shape === 'square') draw(t => t < 0.5 ? 1 : -1);
    else if (shape === 'stair') draw(t => [-1, 0.33, -0.33, 1][Math.floor(t * 4)]);
    else draw(t => t < 0.18 ? -1 + 2 * (t / 0.18) : t < 0.5 ? 1 - 1.4 * ((t - 0.18) / 0.32) : t < 0.62 ? -0.4 + 0.9 * Math.sin((t - 0.5) / 0.12 * Math.PI) : -0.4 - 0.6 * ((t - 0.62) / 0.38));
    return A.createPeriodicWave(re, im, { disableNormalization: true });
  }
  // ---- the graph: one builder for the live engine and for offline renders (match)
  function build(A, get, bpm, MT) {
    const nodes = [], n = (x) => { nodes.push(x); return x; };
    const c1 = n(A.createOscillator()), c2 = n(A.createOscillator()), mod = n(A.createOscillator()), modG = n(A.createGain()), sub = n(A.createOscillator());
    sub.type = 'sine'; mod.connect(modG); modG.connect(c1.frequency); modG.connect(c2.frequency);
    const cSum = n(A.createGain()); c1.connect(cSum); c2.connect(cSum);
    const foldPre = n(A.createGain()), fold = n(A.createWaveShaper()); fold.oversample = '4x'; fold.curve = dsp.curve('sinfold', 3); cSum.connect(foldPre); foldPre.connect(fold);
    const foldMix = n(A.createGain()), dryMix = n(A.createGain()), stage1 = n(A.createGain()); fold.connect(foldMix); cSum.connect(dryMix); foldMix.connect(stage1); dryMix.connect(stage1);
    const fA = n(A.createBiquadFilter()), fB = n(A.createBiquadFilter()), formG = n(A.createGain()), formDry = n(A.createGain()), stage2 = n(A.createGain()); fA.type = fB.type = 'bandpass'; fA.Q.value = 6; fB.Q.value = 8;
    stage1.connect(fA); stage1.connect(fB); fA.connect(formG); fB.connect(formG); stage1.connect(formDry); formG.connect(stage2); formDry.connect(stage2);
    const comb = n(A.createDelay(0.1)), combFb = n(A.createGain()), combOut = n(A.createGain()), stage3 = n(A.createGain()); stage2.connect(stage3); stage2.connect(comb); comb.connect(combFb); combFb.connect(comb); comb.connect(combOut); combOut.connect(stage3);
    const notch = n(A.createBiquadFilter()); notch.type = 'notch'; notch.Q.value = 2.5; stage3.connect(notch);
    const lp = n(A.createBiquadFilter()); lp.type = 'lowpass'; lp.Q.value = 2; notch.connect(lp);
    const drv = n(A.createWaveShaper()), drvPre = n(A.createGain()), crush = n(A.createWaveShaper()); drv.oversample = '2x'; lp.connect(drvPre); drvPre.connect(drv); drv.connect(crush);
    const hpMid = n(A.createBiquadFilter()); hpMid.type = 'highpass'; hpMid.frequency.value = 90; crush.connect(hpMid);
    // OTT-style 3-band squash
    const bands = [['lowpass', 220], ['bandpass', 900], ['highpass', 2600]].map(([t, f]) => { const b = n(A.createBiquadFilter()); b.type = t; b.frequency.value = f; if (t === 'bandpass') b.Q.value = 0.5; const c = n(A.createDynamicsCompressor()); c.threshold.value = -38; c.ratio.value = 8; c.attack.value = 0.003; c.release.value = 0.08; c.knee.value = 6; const mk = n(A.createGain()); mk.gain.value = 3.2; hpMid.connect(b); b.connect(c); c.connect(mk); return mk; });
    const ottWet = n(A.createGain()), ottDry = n(A.createGain()), amp = n(A.createGain()), subG = n(A.createGain()), subLP = n(A.createBiquadFilter()), out = n(A.createGain());
    bands.forEach(b => b.connect(ottWet)); hpMid.connect(ottDry); ottWet.connect(amp); ottDry.connect(amp);
    subLP.type = 'lowpass'; subLP.frequency.value = 120; sub.connect(subG); subG.connect(subLP); subLP.connect(amp);
    amp.gain.value = 0; amp.connect(out);
    // LFO → unipolar 0..1 → destinations
    const lfoBus = n(A.createGain()); lfoBus.gain.value = 0.5; const off = n(A.createConstantSource()); off.offset.value = 0.5; const uni = n(A.createGain()); lfoBus.connect(uni); off.connect(uni);
    const dFM = n(A.createGain()), dFold = n(A.createGain()), dForm = n(A.createGain()), dFormB = n(A.createGain()), dComb = n(A.createGain()), dNotch = n(A.createGain()), dCut = n(A.createGain());
    uni.connect(dFM); dFM.connect(modG.gain); uni.connect(dFold); dFold.connect(foldPre.gain); uni.connect(dForm); dForm.connect(fA.frequency); uni.connect(dFormB); dFormB.connect(fB.frequency);
    uni.connect(dComb); dComb.connect(combFb.gain); uni.connect(dNotch); dNotch.connect(notch.detune); uni.connect(dCut); dCut.connect(lp.detune);
    [c1, c2, mod, sub, off].forEach(o => { o.frequency && (o.frequency.value = 55); o.start(); });
    let lfo = null, curF = 55; const waves = {};
    const wave = (s) => waves[s] || (waves[s] = lfoWave(A, s));
    function startLfo(t) {
      if (lfo) { try { lfo.stop(t); } catch (e) {} const old = lfo; old.onended = () => { try { old.disconnect(); } catch (e) {} }; }
      lfo = A.createOscillator(); lfo.setPeriodicWave(wave(get('lfoShape'))); lfo.frequency.value = 1 / MT.divisionSec(get('lfoDiv'), bpm()); lfo.connect(lfoBus); lfo.start(t);
    }
    function apply() {
      const t = A.currentTime, set = (p, v) => p.setTargetAtTime(v, t, 0.01);
      c1.type = c2.type = get('wave'); c2.detune.value = get('spread'); c1.detune.value = -get('spread') * 0.5;
      const f = curF; set(modG.gain, get('fm') * f); mod.frequency.setValueAtTime(f * RATIOS[get('ratio')], t);
      set(dFM.gain, get('lfoFM') * get('fm') * f * 1.5);
      set(foldPre.gain, 0.6 + get('fold') * 3); set(dFold.gain, get('lfoFold') * 4); set(foldMix.gain, Math.min(1, get('fold') * 1.6)); set(dryMix.gain, 1 - Math.min(1, get('fold') * 1.2) * 0.8);
      const A0 = VOW[get('vowelA')], B0 = VOW[get('vowelB')], fm = get('lfoFormant');
      fA.frequency.setValueAtTime(A0[0], t); fB.frequency.setValueAtTime(A0[1], t); set(dForm.gain, (B0[0] - A0[0]) * fm); set(dFormB.gain, (B0[1] - A0[1]) * fm);
      set(formG.gain, get('formant') * 2.4); set(formDry.gain, 1 - get('formant') * 0.85);
      comb.delayTime.setValueAtTime(Math.min(0.1, 1 / (f * get('combPitch'))), t); set(combFb.gain, get('comb') * 0.9); set(dComb.gain, get('lfoComb') * 0.3); set(combOut.gain, get('comb'));
      notch.frequency.setValueAtTime(get('notch') > 0 ? 300 + get('notch') * 2500 : 18000, t); set(dNotch.gain, get('lfoNotch') * 3600);
      set(lp.frequency, get('cutoff')); set(dCut.gain, get('lfoCut') * 4800); lp.Q.value = get('res');
      drv.curve = dsp.curve('asym', get('drive')); set(drvPre.gain, 0.6 + get('drive') * 2.2);
      crush.curve = get('crush') > 0 ? dsp.curve('crush', Math.max(2, Math.round(12 - get('crush') * 9))) : dsp.curve('soft', 0.05);
      set(ottWet.gain, get('ott') * 0.55); set(ottDry.gain, 1 - get('ott') * 0.7);
      set(subG.gain, get('sub') * 0.6); set(out.gain, get('level') * 0.34);
    }
    function setFreq(f, t, glide, pe) {
      [c1, c2, sub].forEach((o, i) => { const k = i === 2 ? 1 : 1; o.frequency.cancelScheduledValues(t); if (pe) { o.frequency.setValueAtTime(f * k * Math.pow(2, pe / 12), t); o.frequency.exponentialRampToValueAtTime(f * k, t + get('pitchTime')); } else if (glide > 0) { o.frequency.setValueAtTime(curF * k, t); o.frequency.exponentialRampToValueAtTime(f * k, t + glide); } else o.frequency.setValueAtTime(f * k, t); });
      curF = f; mod.frequency.setValueAtTime(f * RATIOS[get('ratio')], t);
      modG.gain.setValueAtTime(get('fm') * f, t); dFM.gain.setValueAtTime(get('lfoFM') * get('fm') * f * 1.5, t);
      comb.delayTime.setValueAtTime(Math.min(0.1, 1 / (f * get('combPitch'))), t);
    }
    return { nodes, out, amp, startLfo, apply, setFreq, get curF() { return curF; }, get lfo() { return lfo; } };
  }
  const CFG = [
    { key: 'wave', type: 'enum', options: ['sawtooth', 'square', 'triangle', 'sine'], default: 'sawtooth', label: 'Carrier', group: 'FM' },
    { key: 'ratio', type: 'enum', options: Object.keys(RATIOS), default: '1', label: 'Ratio', group: 'FM' },
    { key: 'fm', type: 'number', default: 1.2, min: 0, max: 20, step: 0.01, label: 'FM index', group: 'FM' },
    { key: 'spread', type: 'number', default: 12, min: 0, max: 60, step: 0.1, unit: '¢', label: 'Unison', group: 'FM' },
    { key: 'fold', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Fold', group: 'SHAPE' },
    { key: 'formant', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Formant', group: 'SHAPE' },
    { key: 'vowelA', type: 'enum', options: Object.keys(VOW), default: 'OO', label: 'Vowel A', group: 'SHAPE' },
    { key: 'vowelB', type: 'enum', options: Object.keys(VOW), default: 'AH', label: 'Vowel B', group: 'SHAPE' },
    { key: 'comb', type: 'number', default: 0.15, min: 0, max: 0.95, step: 0.01, label: 'Comb', group: 'SHAPE' },
    { key: 'combPitch', type: 'number', default: 2, min: 0.5, max: 8, step: 0.01, label: 'Comb ×', group: 'SHAPE' },
    { key: 'notch', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Notch', group: 'SHAPE' },
    { key: 'cutoff', type: 'number', default: 2600, min: 80, max: 16000, step: 1, unit: 'Hz', label: 'Cutoff', group: 'FILTER' },
    { key: 'res', type: 'number', default: 2, min: 0.3, max: 18, step: 0.1, label: 'Reso', group: 'FILTER' },
    { key: 'drive', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'FILTER' },
    { key: 'crush', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Crush', group: 'FILTER' },
    { key: 'ott', type: 'number', default: 0.45, min: 0, max: 1, step: 0.01, label: 'OTT', group: 'FILTER' },
    { key: 'lfoDiv', type: 'enum', options: DIVS, default: '1/8', label: 'LFO rate', group: 'LFO' },
    { key: 'lfoShape', type: 'enum', options: SHAPES, default: 'talk', label: 'LFO shape', group: 'LFO' },
    { key: 'lfoFM', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: '→ FM', group: 'LFO' },
    { key: 'lfoFold', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: '→ Fold', group: 'LFO' },
    { key: 'lfoFormant', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: '→ Vowel', group: 'LFO' },
    { key: 'lfoComb', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: '→ Comb', group: 'LFO' },
    { key: 'lfoNotch', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: '→ Notch', group: 'LFO' },
    { key: 'lfoCut', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: '→ Cutoff', group: 'LFO' },
    { key: 'pitchEnv', type: 'number', default: 0, min: -48, max: 48, step: 0.5, unit: 'st', label: 'Pitch env', group: 'PITCH' },
    { key: 'pitchTime', type: 'number', default: 0.08, min: 0.005, max: 1.5, step: 0.001, unit: 's', label: 'Pitch time', group: 'PITCH' },
    { key: 'glide', type: 'number', default: 0.04, min: 0, max: 2, step: 0.001, unit: 's', label: 'Glide', group: 'PITCH' },
    { key: 'octave', type: 'integer', default: -1, min: -3, max: 3, label: 'Octave', group: 'PITCH' },
    { key: 'keepRange', type: 'boolean', default: true, label: 'Keep in range', group: 'PITCH', hint: 'never under 25 Hz — a note that would be is lifted by octaves, so it is heard (3.77 sound audit)' },
    { key: 'sub', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Sub', group: 'OUT' },
    { key: 'attack', type: 'number', default: 0.004, min: 0.001, max: 4, step: 0.001, unit: 's', label: 'Attack', group: 'OUT' },
    { key: 'release', type: 'number', default: 0.1, min: 0.01, max: 8, step: 0.001, unit: 's', label: 'Release', group: 'OUT' },
    { key: 'level', type: 'number', default: 0.8, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
  ];
  // ---- features for MATCH
  function features(buf, bpm) {
    const sr = buf.sampleRate, d = buf.getChannelData(0), N = 4096, win = dsp.hann(N), re = new Float32Array(N), im = new Float32Array(N), P = new Float64Array(N / 2);
    let frames = 0; const cents = [];
    for (let s = Math.floor(sr * 0.02); s + N <= d.length; s += N / 4) {
      for (let i = 0; i < N; i++) { re[i] = d[s + i] * win[i]; im[i] = 0; } dsp.fft(re, im);
      let num = 0, den = 0; for (let k = 1; k < N / 2; k++) { const p = re[k] * re[k] + im[k] * im[k]; P[k] += p; num += p * k; den += p; }
      cents.push(den > 1e-12 ? num / den * sr / N : 0); frames++;
    }
    if (!frames) return null;
    const hz = (k) => k * sr / N; let tot = 0, subE = 0, hi = 0, lg = 0, ar = 0, cnt = 0, cen = 0;
    for (let k = 1; k < N / 2; k++) { const p = P[k] / frames, f = hz(k); tot += p; cen += p * f; if (f < 100) subE += p; if (f > 2000) hi += p; if (f > 50 && f < 8000) { lg += Math.log(p + 1e-20); ar += p; cnt++; } }
    const flat = Math.exp(lg / cnt) / (ar / cnt + 1e-20);
    // modulation: autocorrelation of the per-frame centroid, 0.5–16 Hz
    const fps = sr / (N / 4), m = cents.reduce((a, b) => a + b, 0) / cents.length, cc = cents.map(x => x - m); let best = 0, rate = 0;
    for (let L = Math.max(1, Math.floor(fps / 16)); L <= Math.min(cc.length - 2, Math.ceil(fps / 0.5)); L++) { let c = 0, e = 0; for (let i = 0; i + L < cc.length; i++) { c += cc[i] * cc[i + L]; e += cc[i] * cc[i]; } const r = e ? c / e : 0; if (r > best) { best = r; rate = fps / L; } }
    const sd = Math.sqrt(cc.reduce((a, b) => a + b * b, 0) / cc.length);
    return { centroid: cen / (tot + 1e-20), flat, sub: subE / (tot + 1e-20), bright: hi / (tot + 1e-20), rate: best > 0.3 ? rate : 0, depth: m ? sd / m : 0 };
  }
  function distance(a, b) {
    const L = (x, y) => Math.abs(Math.log((x + 1) / (y + 1)));
    return 2 * L(a.centroid, b.centroid) + 3 * Math.abs(a.flat - b.flat) + 2 * Math.abs(a.sub - b.sub) + 2.5 * Math.abs(a.bright - b.bright) + 0.8 * L(a.rate, b.rate) + 1.5 * Math.abs(Math.min(1, a.depth) - Math.min(1, b.depth));
  }

  OrganismFactory.define({
    id: 'eravos.bass-forge', preview: 'bass', domain: 'music', version: '1.0.0', label: 'Bass Forge', icon: '🜂', accent: '#ff3d00', phase: 'P14',
    category: 'Bass', blurb: 'FM growls, riddim, neuro, screech — one LFO talks through FM, fold, vowel, comb, notch. MATCH learns a reference bass recursively.',
    size: { w: 620, h: 660 }, minSize: { w: 480, h: 480 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe', 'filesystem_read'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.lead_voice', 'capability.bass'],
    needs: { notes: ['MATCH analyses a clip you own (drop a bass sample on it) and steers its knobs towards it.'], works_with: ['eravos.sequencer', 'eravos.timeline', 'eravos.sub-engine', 'eravos.harmonic-analyzer'] },
    hooks: [S.audio_out('bf.hook.audio_out'), S.note_in('bf.hook.note_in'), S.midi_in('bf.hook.midi_in'), S.theory_in('bf.hook.theory_in'), S.transport_in('bf.hook.transport_in'), S.asset_in('bf.hook.asset_in'),
      S.mod_in('bf.hook.mod_level', 'level')],
    config: CFG,
    ui_hooks: ['match', 'match_stop'],
    defaultPreset: 'Brostep Growl',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory, K = ctx.K;
      const g = build(ac, (k) => P.get(k), () => ctx.bpm, MT);
      g.nodes.forEach(x => ctx.track(x));
      const level = ac.createGain(); g.out.connect(level); ctx.track(level);
      const levMod = ctx.modBus('level', { min: 0, max: 1.5 }); levMod.connect(level.gain);
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'bass forge' });
      g.apply(); g.startLfo(ac.currentTime);
      P.onChange('*', (v, prev, k) => { if (k === 'lfoShape' || k === 'lfoDiv') { if (g.lfo) { if (k === 'lfoShape') g.startLfo(ac.currentTime); else g.lfo.frequency.setTargetAtTime(1 / MT.divisionSec(P.get('lfoDiv'), ctx.bpm), ac.currentTime, 0.01); } } else g.apply(); });
      ctx.onBpm(() => { if (g.lfo) g.lfo.frequency.setTargetAtTime(1 / MT.divisionSec(P.get('lfoDiv'), ctx.bpm), ac.currentTime, 0.01); });
      let held = null;
      function noteOn(note, vel, t, dur, slide) {
        t = Math.max(t || ac.currentTime, ac.currentTime);
        const f0 = MT.hz(Math.max(12, note + 12 * P.get('octave'))), f = P.get('keepRange') !== false ? ctx.dsp.keepRange(f0, 25) : f0, legato = held && held.off > t - 1e-4;   // 3.77 never under 25 Hz
        g.setFreq(f, t, legato ? P.get('glide') : 0, legato ? 0 : P.get('pitchEnv'));
        if (!legato || !slide) { g.startLfo(t); const a = g.amp.gain; a.cancelScheduledValues(t); if (!legato) a.setValueAtTime(0, t); a.linearRampToValueAtTime(0.1 + 0.9 * Math.pow(vel, 1.4), t + P.get('attack')); }
        held = { note, off: dur !== undefined ? t + dur : Infinity };
        if (dur !== undefined) ctx.dsp.release(g.amp.gain, t + dur, P.get('release'));
      }
      function noteOff(note) { if (!held || held.note !== note) return; held.off = ac.currentTime; ctx.dsp.release(g.amp.gain, ac.currentTime, P.get('release')); }
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration, p.slide));
      ctx.onMidi((p) => p.on ? noteOn(p.note, p.velocity) : noteOff(p.note));
      ctx.audition = (p) => noteOn(p.note || 45, p.velocity || 0.9, ac.currentTime, p.duration || 1.6);
      ctx.auditionOff = (p) => noteOff(p.note || 45);
      // ---- MATCH: recursive render → measure → nudge → repeat
      async function renderWith(vals, f0, sec) {
        const sr = 22050, A = new OfflineAudioContext(1, Math.ceil(sr * sec), sr), get = (k) => (k in vals ? vals[k] : P.get(k));
        const gg = build(A, get, () => ctx.bpm, MT); gg.out.connect(A.destination); gg.apply(); gg.setFreq(f0, 0, 0, get('pitchEnv')); gg.startLfo(0);
        gg.amp.gain.setValueAtTime(0, 0); gg.amp.gain.linearRampToValueAtTime(1, get('attack')); gg.amp.gain.setValueAtTime(1, sec - 0.05); gg.amp.gain.linearRampToValueAtTime(0, sec);
        return A.startRendering();
      }
      ctx.renderWith = renderWith;
      const KNOBS = [['fm', 0, 10, 1.5], ['fold', 0, 1, 0.25], ['formant', 0, 1, 0.25], ['comb', 0, 0.95, 0.25], ['cutoff', 80, 16000, 0, 'log'], ['drive', 0, 1, 0.25], ['lfoFM', 0, 1, 0.3], ['lfoCut', 0, 1, 0.3], ['sub', 0, 1, 0.25], ['notch', 0, 1, 0.3]];
      let matchJob = null;
      async function match(buf, o) {
        o = o || {}; const job = { stop: false }; matchJob = job;
        const target = features(buf, ctx.bpm); if (!target) throw new Error('reference too short');
        // pitch of the reference (XenTheory peak picking on a long FFT) → render at the same note
        let f0 = 55; try { const N = 16384, d = buf.getChannelData(0), s0 = Math.max(0, Math.floor(d.length / 2 - N / 2)); const re = new Float32Array(N), im = new Float32Array(N), w = dsp.hann(N); for (let i = 0; i < N && s0 + i < d.length; i++) re[i] = d[s0 + i] * w[i]; dsp.fft(re, im); const db = new Float32Array(N / 2); for (let k = 0; k < N / 2; k++) db[k] = 10 * Math.log10(re[k] * re[k] + im[k] * im[k] + 1e-20); const pk = window.XenTheory.peaks(db, buf.sampleRate, N, { max: 16, rel: 50, minHz: 25 }); const e = window.XenTheory.estimateF0(pk, { max: 400 }); if (e) f0 = e; } catch (e) {}
        // tempo-match the LFO: choose the division closest to the measured modulation rate
        const vals = {}; KNOBS.forEach(([k]) => { vals[k] = P.get(k); });
        if (target.rate > 0) { let best = null; DIVS.forEach(dv => { const r = 1 / MT.divisionSec(dv, ctx.bpm), e = Math.abs(Math.log(r / target.rate)); if (!best || e < best.e) best = { dv, e }; }); vals.lfoDiv = best.dv; }
        const sec = Math.min(2, Math.max(0.6, buf.duration));
        const measure = async (v) => features(await renderWith(v, f0, sec), ctx.bpm);
        let bestD = distance(await measure(vals), target), iter = 0; const steps = Object.fromEntries(KNOBS.map(([k, , , st]) => [k, st]));
        ctx.emitUI('match', { iter, dist: bestD, f0, target });
        for (let round = 0; round < (o.rounds || 4) && !job.stop; round++) {
          let improved = false;
          for (const [k, mn, mx, , scale] of KNOBS) {
            if (job.stop) break;
            for (const dir of [1, -1]) {
              const v = Object.assign({}, vals);
              v[k] = scale === 'log' ? Math.max(mn, Math.min(mx, vals[k] * Math.pow(2, dir * (1.5 / (round + 1))))) : Math.max(mn, Math.min(mx, vals[k] + dir * steps[k]));
              if (v[k] === vals[k]) continue;
              const dd = distance(await measure(v), target); iter++;
              if (dd < bestD - 1e-4) { bestD = dd; vals[k] = v[k]; improved = true; ctx.emitUI('match', { iter, dist: bestD, f0, vals }); break; }
            }
          }
          KNOBS.forEach(([k]) => { steps[k] *= improved ? 0.7 : 0.5; });
          ctx.emitUI('match', { iter, dist: bestD, round: round + 1, f0, vals });
        }
        P.setMany(vals); ctx.syncUI();
        ctx.emitUI('match', { done: true, iter, dist: bestD, f0, vals, note: Math.round(69 + 12 * Math.log2(f0 / 440)) });
        matchJob = null; return { dist: bestD, vals, f0, iter };
      }
      ctx.match = match; ctx.features = features; ctx.distance = distance;
      async function fromAB(ab, name) { const a = K.assets.register(ab, { name: name || 'reference' }); const b = await K.assets.decode(a.hash); if (!b) return ctx.fault('ASSET_001', 'could not decode reference'); try { await match(b); } catch (e) { ctx.emitUI('match', { error: e.message }); } }
      ctx.onUI('match', { type: 'object', required: ['arrayBuffer'] }, (p) => fromAB(p.arrayBuffer, p.name));
      ctx.onUI('match_stop', null, () => { if (matchJob) matchJob.stop = true; });
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, async (p) => { if (p.target !== ctx.id) return; const a = K.assets.get(p.hash); if (!a) return; const b = a.decoded || await K.assets.decode(p.hash); if (b) match(b).catch(e => ctx.emitUI('match', { error: e.message })); });
      ctx.internals = g;
      return {};
    },
  });
})();
