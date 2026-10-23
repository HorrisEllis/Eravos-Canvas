/* eravos.wub-filter 1.0.0 — Wub Filter · spec wub-filter.spec · inherits STD.fx (in · out · mix · bypass)
 * The mouth of a wobble, and nothing else: a sound comes in, a filter shapes it, and one number — "wub", 0 = closed,
 * 1 = open — says how far the mouth is open. Wire Wub Rate (or any violet output) into "wub"; turn Position for a
 * fixed opening. No clock of its own: the rhythm comes from what is wired in.
 *   lowpass (12/24 dB) · bandpass · notch → the wub opens the cutoff by Range octaves (in cents, on .detune)
 *   vowel  → three formant bands glide from Vowel A (closed) to Vowel B (open): the talking "yoi"
 *   comb   → a tuned feed-forward comb sweeps from Cutoff up by Range: metallic, robotic wubs (feed-forward: no
 *            feedback loop, so it tunes above the 128-sample minimum a looped delay has)
 * Polarity: Invert flips the mouth (wub 1 = closed). Drive saturates before the filter, so resonance growls. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const VOWELS = {
    OO: { f: [300, 870, 2240], g: [0, -10, -24] },
    OH: { f: [450, 800, 2830], g: [0, -6, -20] },
    AH: { f: [730, 1090, 2440], g: [0, -4, -14] },
    AE: { f: [660, 1720, 2410], g: [0, -6, -12] },
    EH: { f: [530, 1840, 2480], g: [0, -8, -12] },
    EE: { f: [270, 2290, 3010], g: [0, -12, -10] },
    YOI: { f: [380, 1400, 2600], g: [0, -5, -12] },
  };
  const MODES = ['lowpass', 'bandpass', 'notch', 'vowel', 'comb'];
  OrganismFactory.define({
    id: 'eravos.wub-filter', domain: 'music', version: '1.0.0', label: 'Wub Filter', icon: '👄', accent: '#ff2266',
    category: 'Wubs', blurb: 'The wobble’s mouth: lowpass, vowel “yoi”, comb or notch — opened by whatever is wired into its wub input.',
    size: { w: 520, h: 520 }, minSize: { w: 400, h: 360 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx', 'capability.wub_filter'],
    slots: [{ id: 'after', label: 'after the mouth', wire_type: 'audio', hint: 'empty — a Destroyer here growls every vowel' }],
    face: ['mode', 'cutoff', 'range', 'res', 'position', 'drive'],
    links: [{ with: 'eravos.wub-rate', dir: 'in', face: ['stepLen', 'shape', 'smooth', 'depth', 'polarity'], hint: 'the rhythm opening this mouth' },
            { with: 'eravos.wub-osc', dir: 'in', face: ['wave', 'octave', 'index', 'voices', 'spread'], hint: 'the tone going in' }],
    hooks: SDK.fxHooks([
      Object.assign(S.mod_in('wubf.hook.mod_wub', 'wub'), { intent: 'how far the mouth is open: 0 closed → 1 open (wire Wub Rate here)' }),
      S.mod_in('wubf.hook.mod_cutoff', 'cutoff'),
      S.mod_in('wubf.hook.mod_res', 'res'),
    ]),
    config: [
      { key: 'mode', type: 'enum', options: MODES, default: 'lowpass', label: 'Mouth', group: 'FILTER' },
      { key: 'slope', type: 'enum', options: [12, 24], default: 24, label: 'dB/oct', group: 'FILTER' },
      { key: 'cutoff', type: 'number', default: 160, min: 20, max: 12000, step: 1, unit: 'Hz', label: 'Closed at', group: 'FILTER', hint: 'where the mouth sits when the wub is 0' },
      { key: 'range', type: 'number', default: 4.5, min: 0, max: 8, step: 0.01, unit: 'oct', label: 'Range', group: 'FILTER', hint: 'how far it opens when the wub is 1' },
      { key: 'res', type: 'number', default: 6, min: 0.5, max: 20, step: 0.1, label: 'Reso', group: 'FILTER' },
      { key: 'position', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Position', group: 'WUB', hint: 'a fixed opening, added to what is wired in — automate it or move it by hand' },
      { key: 'invert', type: 'boolean', default: false, label: 'Invert', group: 'WUB', hint: 'polarity: wub 1 = closed' },
      { key: 'drive', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'TONE' },
      { key: 'vowelA', type: 'enum', options: Object.keys(VOWELS), default: 'OO', label: 'Vowel closed', group: 'VOWEL' },
      { key: 'vowelB', type: 'enum', options: Object.keys(VOWELS), default: 'AH', label: 'Vowel open', group: 'VOWEL' },
      { key: 'formant', type: 'number', default: 0, min: -24, max: 24, step: 0.1, unit: 'st', label: 'Formant', group: 'VOWEL' },
      { key: 'comb', type: 'number', default: 0.85, min: -1, max: 1, step: 0.01, label: 'Comb', group: 'COMB', hint: '+ = peaks at the tuned note and its harmonics, − = hollow notches' },
    ].concat(SDK.STD_FX_CONFIG),
    defaultPreset: 'Classic LP Wub',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp;
      const fx = SDK.fxShell(ctx);
      fx.setLatency(dsp.osLatency(ac, '4x'));   // 3.39: the blended dry waits for the 4x shaper
      // ---- drive
      const pre = ac.createGain(), sh = ac.createWaveShaper(); sh.oversample = '4x';
      fx.wetIn.connect(pre); pre.connect(sh);
      // ---- the wub position (0..1, may overshoot): position knob + wired wub, polarity applied
      const posK = ac.createConstantSource(); posK.start();
      const wubBus = ctx.modBus('wub', { min: -1, max: 1 });          // ±1 passes straight through (scaler = 1)
      const wubPol = ac.createGain(); wubBus.connect(wubPol);
      const pos = ac.createGain(); posK.connect(pos); wubPol.connect(pos);
      const cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 }), resMod = ctx.modBus('res', { min: -10, max: 10 });
      // ---- lowpass / bandpass / notch: two biquads (24 dB = Butterworth-staggered), opened in cents
      const f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
      const cents = ac.createGain(); pos.connect(cents);
      [f1, f2].forEach(f => { cents.connect(f.detune); cutMod.connect(f.detune); resMod.connect(f.Q); });
      const biqOut = ac.createGain(); sh.connect(f1); f1.connect(f2); f2.connect(biqOut);
      const one = ac.createGain(); f1.connect(one);                  // 12 dB tap
      // ---- vowel bank: band freq = A + pos·(B−A), band gain = gA + pos·(gB−gA)
      const vIn = ac.createGain(), vOut = ac.createGain(); sh.connect(vIn);
      const bands = [0, 1, 2].map(() => {
        const b = ac.createBiquadFilter(); b.type = 'bandpass'; const g = ac.createGain(); vIn.connect(b); b.connect(g); g.connect(vOut);
        const fScale = ac.createGain(), gScale = ac.createGain(); pos.connect(fScale); fScale.connect(b.frequency); pos.connect(gScale); gScale.connect(g.gain);
        cutMod.connect(b.detune); return { b, g, fScale, gScale };
      });
      // ---- comb: y = x + a·x(t − d), d tuned to Cutoff and swept up by Range (delay shrinks as the mouth opens)
      const cIn = ac.createGain(), delay = ac.createDelay(0.05), fb = ac.createGain(), damp = ac.createBiquadFilter(), cOut = ac.createGain();
      damp.type = 'lowpass'; damp.frequency.value = 9000;
      sh.connect(cIn); cIn.connect(cOut); cIn.connect(delay); delay.connect(damp); damp.connect(fb); fb.connect(cOut);
      const delayScale = ac.createGain(); pos.connect(delayScale); delayScale.connect(delay.delayTime);
      // ---- mode select (equal-ish loudness per mode) → wet out
      const gLP = ac.createGain(), g12 = ac.createGain(), gV = ac.createGain(), gC = ac.createGain();
      biqOut.connect(gLP); one.connect(g12); vOut.connect(gV); cOut.connect(gC);
      const sel = ac.createGain(); [gLP, g12, gV, gC].forEach(g => g.connect(sel));
      const dcBlock = ac.createBiquadFilter(); dcBlock.type = 'highpass'; dcBlock.frequency.value = 18; sel.connect(dcBlock); ctx.slot('after', dcBlock, { label: 'after the mouth', onLatency: fx.addLatency }).connect(fx.wetOut);
      [pre, sh, posK, wubPol, pos, f1, f2, cents, biqOut, one, vIn, vOut, cIn, delay, fb, damp, cOut, delayScale, gLP, g12, gV, gC, sel, dcBlock].forEach(n => ctx.track(n));
      bands.forEach(bd => [bd.b, bd.g, bd.fScale, bd.gScale].forEach(n => ctx.track(n)));

      function apply() {
        const now = ac.currentTime, mode = P.get('mode'), c = P.get('cutoff'), rng = P.get('range'), q = P.get('res'), inv = P.get('invert');
        // polarity: pos = position + wub, or (1 − wub) + position when inverted
        wubPol.gain.setTargetAtTime(inv ? -1 : 1, now, 0.005);
        posK.offset.setTargetAtTime(P.get('position') + (inv ? 1 : 0), now, 0.005);
        pre.gain.setTargetAtTime(0.8 + P.get('drive') * 1.2, now, 0.01);
        sh.curve = dsp.curve('tanh', P.get('drive') * 0.6);
        // biquads
        const type = mode === 'bandpass' ? 'bandpass' : mode === 'notch' ? 'notch' : 'lowpass';
        f1.type = f2.type = type;
        f1.frequency.setTargetAtTime(c, now, 0.01); f2.frequency.setTargetAtTime(c, now, 0.01);
        f1.Q.value = mode === 'lowpass' ? q : Math.max(0.7, q * 0.8); f2.Q.value = mode === 'lowpass' ? Math.min(q, 3) * 0.5 : Math.max(0.7, q * 0.5);
        cents.gain.setTargetAtTime(rng * 1200, now, 0.01);
        // vowels (formant shift scales every band)
        const A = VOWELS[P.get('vowelA')] || VOWELS.OO, B = VOWELS[P.get('vowelB')] || VOWELS.AH, fs = Math.pow(2, P.get('formant') / 12);
        bands.forEach((bd, i) => {
          bd.b.frequency.value = A.f[i] * fs; bd.b.Q.value = 4 + q * 0.9;
          bd.fScale.gain.value = (B.f[i] - A.f[i]) * fs;
          const ga = dsp.dbToGain(A.g[i]), gb = dsp.dbToGain(B.g[i]); bd.g.gain.value = ga; bd.gScale.gain.value = gb - ga;
        });
        // comb: delay = 1/cutoff at closed, 1/(cutoff·2^range) at open (linear in delay between them)
        const d0 = 1 / c, d1 = 1 / Math.min(ac.sampleRate / 4, c * Math.pow(2, rng));
        delay.delayTime.setTargetAtTime(Math.min(0.049, d0), now, 0.005); delayScale.gain.setTargetAtTime(d1 - d0, now, 0.005);
        fb.gain.setTargetAtTime(P.get('comb'), now, 0.01);
        // the mode's own make-up so switching modes doesn't jump in level
        const on = (m) => mode === m;
        gLP.gain.setTargetAtTime((on('lowpass') && +P.get('slope') === 24) || on('bandpass') || on('notch') ? (on('bandpass') ? 2.2 : 1) : 0, now, 0.005);
        g12.gain.setTargetAtTime(on('lowpass') && +P.get('slope') === 12 ? 1 : 0, now, 0.005);
        gV.gain.setTargetAtTime(on('vowel') ? 2.4 + q * 0.12 : 0, now, 0.005);
        gC.gain.setTargetAtTime(on('comb') ? 1 / (1 + Math.abs(P.get('comb'))) : 0, now, 0.005);
      }
      apply();
      ['mode', 'slope', 'cutoff', 'range', 'res', 'position', 'invert', 'drive', 'vowelA', 'vowelB', 'formant', 'comb'].forEach(k => P.onChange(k, apply));
      ctx.stateExtra = () => ({ vowels: VOWELS });
      ctx.internals = { f1, f2, bands, delay, pos, wubPol, posK, sel };
      return {};
    },
  });
})();
