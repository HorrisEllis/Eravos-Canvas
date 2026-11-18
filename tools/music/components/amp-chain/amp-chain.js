/* eravos.component.amp-chain 1.0.0 — the growl through an amp, the sub kept clean and centered. Extracted (WD1, 2026-11-16) from
 * eravos.wobble-bass 4.2 (its AMP stage), unchanged: the same nodes, the same connections, the same values — proved by the null render on
 * every Wobble Bass factory preset (tests/null-baseline, 34 presets) and by amp-chain.test.mjs (the graph it builds, in order).
 * His words (2026-11-15): "I was saying his sounded centered. Ours rough. … Like I want to make it sound exactly like that."
 *   MusicParts.ampChain(ac, input, track) → { out, mod, set(p, t), nodes }
 *     input   any AudioNode — the sound to put through the amp (it is connected to the straight path and to the amp)
 *     out     the stage's output: [straight, its switch at exactly 1] or [the amp, at exactly 1] — off nulls to the input
 *     mod     a gain node: connect an LFO (±0.5) to it and the Wow filter rides ±2 octaves with it
 *     set(p, t)  p = { on, character 0…1, drive dB, split Hz, wow 0…1, mudCut dB, presence dB, glue 0…1 } at time t
 *   The chain: LR4 split at `split` — lows folded to mono, untouched | highs: drive (4× oversampled; Character blends an arctan-round curve
 *   into a pushed tanh) → Wow (peaking, rides `mod`) → mud cut (300 Hz) → presence (2.2–4 kHz) → de-fizz low-pass → high-pass at the split
 *   again → glue compressor → make-up → limiter → a safety knee (straight to 0.85, never past 0.99).
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function ampChain(ac, input, track) {
    track = track || (() => {});
    // 4.2 AMP: level → [straight, its switch at exactly 1] or [sub split clean+mono | mids: drive (4x) → wow → mud cut → presence → de-fizz] → glue → limiter → ampOut
    const ampOut = ac.createGain(), amDry = ac.createGain(), amWet = ac.createGain(); ampOut.gain.value = 1; amDry.gain.value = 1; amWet.gain.value = 0;
    input.connect(amDry); amDry.connect(ampOut);
    const bq = (type, f, q, g) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q == null ? 0.707 : q; if (g != null) b.gain.value = g; track(b); return b; };
    const amHc1 = bq('highpass', 140), amHc2 = bq('highpass', 140);   // the drive's own low by-products (difference tones of the wide voices) taken out again: the low end stays the clean sub
    const amLo1 = bq('lowpass', 140), amLo2 = bq('lowpass', 140), amHi1 = bq('highpass', 140), amHi2 = bq('highpass', 140);   // Linkwitz–Riley 4: the two bands sum flat
    const amMono = ac.createGain(); amMono.channelCount = 1; amMono.channelCountMode = 'explicit'; amMono.channelInterpretation = 'speakers';   // the sub folded to the center
    const amPre = ac.createGain(), amSh = ac.createWaveShaper(), amPost = ac.createGain(); amSh.oversample = '4x';
    const amWow = bq('peaking', 900, 2.5, 0), amMud = bq('peaking', 300, 1.1, 0), amPres = bq('peaking', 2800, 0.9, 0), amAir = bq('lowpass', 11000, 0.6);
    const amSum = ac.createGain(), amComp = ac.createDynamicsCompressor(), amLim = ac.createDynamicsCompressor(), amMk = ac.createGain();
    amLim.threshold.value = -1.5; amLim.knee.value = 0; amLim.ratio.value = 20; amLim.attack.value = 0.001; amLim.release.value = 0.06;
    // the limiter's own overshoot caught: straight up to 0.85, then a smooth knee that never passes 0.99
    const amSafe = ac.createWaveShaper(); amSafe.oversample = 'none';   // no oversampling here: its anti-alias filter would ring past the knee
    { const n = 4097, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 4 - 2, a = Math.abs(x); c[i] = Math.sign(x) * (a <= 0.85 ? a : 0.85 + 0.14 * Math.tanh((a - 0.85) / 0.14)); } amSafe.curve = c; }
    track(amSafe);
    input.connect(amLo1); amLo1.connect(amLo2); amLo2.connect(amMono); amMono.connect(amSum);
    input.connect(amHi1); amHi1.connect(amHi2); amHi2.connect(amPre); amPre.connect(amSh); amSh.connect(amPost); amPost.connect(amWow); amWow.connect(amMud); amMud.connect(amPres); amPres.connect(amAir); amAir.connect(amHc1); amHc1.connect(amHc2); amHc2.connect(amSum);
    amSum.connect(amComp); amComp.connect(amMk); amMk.connect(amLim); amLim.connect(amSafe); amSafe.connect(amWet); amWet.connect(ampOut);
    const amWowDepth = ac.createGain(); amWowDepth.gain.value = 0; amWowDepth.connect(amWow.detune);
    [ampOut, amDry, amWet, amMono, amPre, amSh, amPost, amSum, amComp, amLim, amMk, amWowDepth].forEach(n => track(n));
    let amCurveK = -1;
    function ampCurve(ch) {   // soft: arctan-round · gainy: tanh pushed toward a rounded square — always odd-symmetric (no DC, no fizz from asymmetry)
      const k = 1 + 7 * ch * ch; if (Math.abs(k - amCurveK) < 1e-3) return; amCurveK = k;
      const n = 4097, c = new Float32Array(n), soft = 1 - ch;
      for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = soft * (Math.atan(2 * x) / Math.atan(2)) + (1 - soft) * (Math.tanh(k * x) / Math.tanh(k)); }
      amSh.curve = c;
    }
    function set(p, t) {
      const on = !!p.on, ch = p.character, f = p.split, dr = Math.pow(10, p.drive / 20) * (0.6 + 0.8 * ch), g = p.glue;
      amDry.gain.setTargetAtTime(on ? 0 : 1, t, 0.004); amWet.gain.setTargetAtTime(on ? 1 : 0, t, 0.004);
      [amLo1, amLo2, amHi1, amHi2, amHc1, amHc2].forEach(b => b.frequency.setTargetAtTime(f, t, 0.01));
      ampCurve(ch);
      amPre.gain.setTargetAtTime(dr, t, 0.01); amPost.gain.setTargetAtTime(0.5 / Math.min(1, Math.tanh(dr * 0.5) + 0.25), t, 0.01);   // made up so drive moves tone, not level
      amWow.gain.setTargetAtTime(p.wow * 12, t, 0.01); amWowDepth.gain.setTargetAtTime(p.wow * 4800, t, 0.01);   // lfoBus ±0.5 → ±2 octaves
      amMud.gain.setTargetAtTime(-p.mudCut, t, 0.01);
      amPres.gain.setTargetAtTime(p.presence * (0.5 + ch), t, 0.01); amPres.frequency.setTargetAtTime(2200 + 1800 * ch, t, 0.01);
      amAir.frequency.setTargetAtTime(9000 + 5000 * (1 - ch * 0.5), t, 0.01);   // gainy: the fizz above ~11.5 kHz rolled off
      amComp.threshold.setTargetAtTime(-6 - 22 * g, t, 0.01); amComp.ratio.setTargetAtTime(1.5 + 4.5 * g, t, 0.01); amComp.attack.setTargetAtTime(0.01, t, 0.01); amComp.release.setTargetAtTime(0.12, t, 0.01); amComp.knee.setTargetAtTime(12, t, 0.01);
      amMk.gain.setTargetAtTime(Math.pow(10, (6 * g) / 20), t, 0.01);
    }
    return { out: ampOut, mod: amWowDepth, set, nodes: { ampOut, amDry, amWet, amMono, amLo1, amLo2, amHi1, amHi2, amHc1, amHc2, amPre, amSh, amPost, amWow, amMud, amPres, amAir, amSum, amComp, amLim, amMk, amSafe, amWowDepth } };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { ampChain });
  if (typeof module !== 'undefined' && module.exports) module.exports = { ampChain };
})(typeof window !== 'undefined' ? window : globalThis);
