/* eravos.fx-destroyer 2.1.0 — Destroyer (P10 · W-01) · spec eravos.organism.fx-destroyer · inherits STD.fx
 * tilt EQ → TIGHT high-pass → LOW KEEP crossover (LR4: lows bypass the damage, delayed to stay in phase) →
 * SHAPER (soft | hard | tube | fold | tape | fuzz | rectify, own curves, 4× oversampled, ASYM bias for even harmonics) →
 * makeup gain matched across −6…−24 dBFS (real mix levels, not full scale) → DC block →
 * CRUSHER AudioWorklet (fractional bits + fractional sample-hold, optional TPDF dither) between an anti-alias and an
 * anti-image filter set by ALIAS (0 clean … 1 raw 8-bit fold-over) → TAME low-pass that also follows the drive → DC block → mix.
 * 2.0 (sounded harsh): drive used to add up to +13 dB on quiet input (levelled at full scale), the hard and fold curves
 * were brick-walls (fizz), the crusher's downsample folded every partial back as inharmonic hash (alias louder than the
 * signal on Total Destruction), and bass went through the shaper full-band (mud). All four are fixed here.
 * If AudioWorklet is unavailable: WaveShaper quantiser, downsample disabled, a fault says so (§1.2).
 * 2.1 (3.77, "too deep … sounds like a blown speaker" + "performance optimization"): measured with a loud 50 Hz + a quiet 1 kHz,
 * the default put the sub through the shaper and the bass then gated everything above it — intermodulation at −1.6 dB (as loud as
 * the music); with the sub kept clean it is −24.7 dB (no shaper at all: −25.6). So LOW KEEP is on by default (100 Hz: the sub
 * goes around the damage, in phase) and TIGHT starts at 40 Hz. Speed: stages that change nothing are taken out of the path —
 * the crusher worklet and its anti-alias / anti-image filters when nothing is crushed (16 bits, no downsample, no wired mod),
 * the crossover when Low keep is off, the tilt shelves when flat. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const CRUSH = `
class EravosCrush2 extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'bits', defaultValue: 16, minValue: 1, maxValue: 16 }, { name: 'down', defaultValue: 1, minValue: 1, maxValue: 64 }, { name: 'dither', defaultValue: 0, minValue: 0, maxValue: 1 }]; }
  constructor() { super(); this.h = [0, 0]; this.ph = 0; this.seed = 22222; }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  process(inputs, outputs, p) {
    const inp = inputs[0], out = outputs[0], n = out[0].length;
    for (let i = 0; i < n; i++) {
      const bits = p.bits.length > 1 ? p.bits[i] : p.bits[0], down = Math.max(1, p.down.length > 1 ? p.down[i] : p.down[0]), dth = p.dither[0];
      // fractional hold: a phase accumulator — integer settings hold exactly N samples, in-between values glide smoothly
      if (this.ph <= 0) {
        const L = Math.pow(2, Math.max(0, bits - 1));
        for (let c = 0; c < out.length; c++) {
          const x = (inp[c] || inp[0] || [])[i] || 0;
          if (bits >= 15.99 || Math.abs(x) < 1e-5) { this.h[c] = Math.abs(x) < 1e-5 ? 0 : x; continue; }   // silence stays silence (no DC step, no dither hiss)
          const d = dth > 0 ? (this.rnd() - this.rnd()) * dth / L : 0;
          this.h[c] = Math.max(-1, Math.min(1, (Math.floor((x + d) * L) + 0.5) / L));
        }
        this.ph += down;
      }
      this.ph -= 1;
      for (let c = 0; c < out.length; c++) out[c][i] = this.h[c];
    }
    return true;
  }
}
registerProcessor('eravos-crush2', EravosCrush2);`;

  const SHAPES = ['soft', 'hard', 'tube', 'fold', 'tape', 'fuzz', 'rectify'];
  const BW = -3.0103;   // Web Audio low/high-pass Q is in dB: −3.01 dB = Butterworth (no bump at the corner)
  // the Destroyer's own transfer curves. Odd length so input 0 lands exactly on the centre sample (silence stays silence);
  // every curve passes through 0, peaks at ±1, and drive only adds gain into a smooth knee — no brick walls.
  function shapeCurve(kind, drive, asym, n) {
    n = n || 8193; const c = new Float32Array(n), k = Math.max(0, Math.min(1, drive)), b = (asym || 0) * 0.35;
    const knee = (u) => { const a = Math.abs(u), kn = 0.35; const y = a < 1 - kn ? a : a < 1 + kn ? 1 - (1 + kn - a) * (1 + kn - a) / (4 * kn) : 1; return Math.sign(u) * y; };
    let f;
    switch (kind) {
      case 'hard': { const g = 1 + k * 14; f = (x) => knee(x * g); break; }
      case 'tube': { const g = 1 + k * 9; f = (x) => { const u = x * g; return u >= 0 ? Math.tanh(u) : Math.tanh(u * 0.7) / 0.85; }; break; }
      case 'fold': { const g = 1 + k * 4.5; f = (x) => 0.8 * Math.sin(Math.PI / 2 * g * x) + 0.2 * Math.tanh(2 * g * x); break; }
      case 'tape': { const g = 1 + k * 7; f = (x) => Math.atan(g * x); break; }
      case 'fuzz': { const g = 1 + k * 30; f = (x) => { const u = x * g; return u >= 0 ? knee(u) : Math.tanh(u * 0.5) * 0.8; }; break; }
      case 'rectify': { const g = 1 + k * 8; f = (x) => { const s = Math.tanh(g * x); return 0.65 * Math.abs(s) + 0.35 * s; }; break; }
      default: { const g = 1 + k * 15; f = (x) => Math.tanh(g * x); }
    }
    const f0 = f(b); let pk = 1e-9;
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = f(x + b) - f0; pk = Math.max(pk, Math.abs(c[i])); }
    for (let i = 0; i < n; i++) c[i] /= pk;
    c[(n - 1) / 2] = 0;
    return c;
  }
  // makeup gain: sines at −6, −12, −18 and −24 dBFS (where music actually arrives, not full scale) each brought back to their
  // own level, averaged in dB — switching the Destroyer on changes the colour, not the volume (1.x added up to +13 dB on quiet parts)
  function makeup(curve) {
    const N = 720, L = curve.length - 1; let acc = 0;
    [0.5, 0.25, 0.125, 0.0625].forEach(A => {
      let s = 0, m = 0;
      for (let i = 0; i < N; i++) { const x = A * Math.sin(2 * Math.PI * i / N), p = (x + 1) / 2 * L, j = Math.floor(p), fr = p - j, y = curve[j] + (curve[Math.min(L, j + 1)] - curve[j]) * fr; s += y * y; m += y; }
      m /= N; acc += Math.log((A / Math.SQRT2) / Math.sqrt(Math.max(1e-12, s / N - m * m)));
    });
    return Math.max(0.05, Math.min(4, Math.exp(acc / 4)));
  }
  OrganismFactory.define({
    id: 'eravos.fx-destroyer', domain: 'music', version: '2.1.0', label: 'Destroyer', icon: '👾', accent: '#aaff00', phase: 'P10',
    category: 'Effects', blurb: 'Warm tape, grit, fold growl, 8-bit crunch. From a little colour to total destruction.',
    size: { w: 460, h: 520 }, minSize: { w: 340, h: 380 },
    // its suite (canvas/runtime/tool-page.js)
    suite: { label: 'Talking grit', blurb: 'A Wub Filter inside the damage (mixed by Mix) and an LFO pushing the drive in time.',
      members: [
        { tool: 'eravos.wub-filter', as: 'mod', slot: 'after', preset: 'Bandpass Yap', why: 'the grit talks — inside, so Mix blends it' },
        { tool: 'eravos.lfo', as: 'linked', preset: 'Wobble 1/8', wire: { from: ['self', 'lfo.hook.mod_out'], to: ['host', 'dst.hook.mod_drive'] }, why: 'the drive breathes on the 1/8' },
      ] },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    curves: { shapeCurve, makeup },
    slots: [{ id: 'after', label: 'after the damage', wire_type: 'audio', hint: 'empty — put a Wub Filter, Echo or Phaser here and it is mixed by Mix' }],   // 3.42 mods: any effect can live inside (canvas/runtime/mods.js)
    face: ['shape', 'drive', 'asym', 'lowKeep', 'bits', 'downsample'],   // what this shows on the tools it is wired to
    links: [{ dir: 'in', category: 'Wubs', hint: 'a wub feeds this — Low keep around 100 Hz keeps its sub clean under the grit' },
            { dir: 'in', category: 'Sound Sources', hint: 'a bass feeds this — Low keep keeps the sub clean' }],
   // the UI draws the exact curve the engine plays
    hooks: SDK.fxHooks([S.mod_in('dst.hook.mod_drive', 'drive'), S.mod_in('dst.hook.mod_bits', 'bits'), S.mod_in('dst.hook.mod_down', 'downsample')]),
    config: [
      { key: 'shape', type: 'enum', options: SHAPES, default: 'soft', label: 'Shape', group: 'SHAPER' },
      { key: 'drive', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'SHAPER' },
      { key: 'asym', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Asym', group: 'SHAPER', hint: 'bias → even harmonics (warmer, fatter)' },
      { key: 'autoGain', type: 'boolean', default: true, label: 'Auto gain', group: 'SHAPER', hint: 'louder drive, same volume' },
      { key: 'tight', type: 'number', default: 40, min: 10, max: 600, step: 1, unit: 'Hz', label: 'Tight', group: 'TONE', hint: 'low cut before the shaper — less mud' },
      { key: 'lowKeep', type: 'number', default: 100, min: 0, max: 400, step: 1, unit: 'Hz', label: 'Low keep', group: 'TONE', hint: 'lows under this stay clean (0 = off) — distort the bass, keep the sub' },
      { key: 'bits', type: 'integer', default: 16, min: 1, max: 16, label: 'Bits', group: 'CRUSH' },
      { key: 'downsample', type: 'integer', default: 1, min: 1, max: 64, label: 'Downsample', group: 'CRUSH' },
      { key: 'alias', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Alias', group: 'CRUSH', hint: '0 clean lo-fi · 1 raw 8-bit fold-over' },
      { key: 'dither', type: 'boolean', default: false, label: 'Dither', group: 'CRUSH', hint: 'smooth hiss instead of buzzing steps on quiet tails' },
      { key: 'tilt', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Tilt', group: 'TONE', hint: '− darker in · + brighter in' },
      { key: 'postLP', type: 'number', default: 16000, min: 1000, max: 20000, step: 1, unit: 'Hz', label: 'Tame', group: 'TONE' },
      { key: 'autoTame', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Auto tame', group: 'TONE', hint: 'the harder the drive, the more fizz is rolled off' },
    ].concat(SDK.STD_FX_CONFIG),
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, sr = ac.sampleRate, nyq = sr / 2;
      const fx = SDK.fxShell(ctx), OS = dsp.osLatency(ac, '4x');
      fx.setLatency(OS);   // 3.39: the blended dry waits for the 4x shaper (no comb filter at partial mix)
      const T = (n) => { ctx.track(n); return n; }, bq = (type, f, q) => { const b = T(ac.createBiquadFilter()); b.type = type; b.frequency.value = f; if (q !== undefined) b.Q.value = q; return b; };
      const lo = bq('lowshelf', 800), hi = bq('highshelf', 800), tight = bq('highpass', P.get('tight'), BW);
      // LOW KEEP: Linkwitz-Riley 4 (two Butterworths each side) — LP + HP sum flat, so the split itself is inaudible
      const xLP1 = bq('lowpass', 100, BW), xLP2 = bq('lowpass', 100, BW), xHP1 = bq('highpass', 100, BW), xHP2 = bq('highpass', 100, BW);
      const lowDly = T(ac.createDelay(0.05)), lowG = T(ac.createGain()); lowDly.delayTime.value = OS; lowG.gain.value = 0;
      const pre = T(ac.createGain()), sh = T(ac.createWaveShaper()), lvl = T(ac.createGain()), dcb = bq('highpass', 5, BW);
      const aa = bq('lowpass', 20000, BW), crushIn = T(ac.createGain()), img1 = bq('lowpass', 20000, BW), img2 = bq('lowpass', 20000, BW), tame = bq('lowpass', P.get('postLP'), BW), dcb2 = bq('highpass', 5, BW), sum = T(ac.createGain());
      sh.oversample = '4x';
      pre.connect(sh); sh.connect(lvl); lvl.connect(dcb);
      img1.connect(img2); img2.connect(dcb2); dcb2.connect(tame); tame.connect(sum);   // a coarse quantiser makes DC of its own
      xLP1.connect(xLP2); xLP2.connect(lowDly); lowDly.connect(lowG); lowG.connect(sum); xHP1.connect(xHP2);
      // 2.1 the path is rebuilt only from the stages that do something (a stage at its neutral setting is skipped, not computed)
      const route = { tilt: null, keep: null, crush: null };
      const link = (a, bs) => { try { a.disconnect(); } catch (e) {} bs.forEach(b => a.connect(b)); };
      function routeTilt(on) { if (route.tilt === on) return; route.tilt = on; link(fx.wetIn, [on ? lo : tight]); if (on) { link(lo, [hi]); link(hi, [tight]); } routeKeep(route.keep, true); }
      function routeKeep(on, force) {
        if (route.keep === on && !force) return; route.keep = on; const src = route.tilt ? hi : fx.wetIn;
        link(tight, [on ? xHP1 : pre]); if (on) link(xHP2, [pre]);
        if (route.tilt) link(hi, on ? [tight, xLP1] : [tight]); else link(fx.wetIn, on ? [tight, xLP1] : [tight]);   // lows skip TIGHT too: kept means kept
        void src;
      }
      const crushing = () => P.get('bits') < 16 || P.get('downsample') > 1 || ctx.modWired('bits') || ctx.modWired('downsample');
      function routeCrush() {
        const on = !!crushing(); if (route.crush === on) return; route.crush = on;
        link(dcb, [on ? aa : tame]); if (on) { link(aa, [crushIn]); link(crushIn, [crush || quant || img1]); if (crush || quant) link(crush || quant, [img1]); }
      }
      ctx.routing = () => Object.assign({}, route);
      ctx.slot('after', sum, { label: 'after the damage', onLatency: fx.addLatency }).connect(fx.wetOut);   // its mods, inside the wet path
      const driveMod = ctx.modBus('drive', { min: -1, max: 1 }); driveMod.connect(pre.gain);
      let crush = null, quant = null;
      // until the worklet is ready (or if it never is) the crush path goes straight to the anti-image filters
      const bitsMod = ctx.modBus('bits', { min: -15, max: 15 }), downMod = ctx.modBus('downsample', { min: -63, max: 63 });
      ctx.ready = ctx.loadWorklet('eravos-crush2', CRUSH).then(() => {
        crush = new AudioWorkletNode(ac, 'eravos-crush2', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); ctx.track(crush);
        bitsMod.connect(crush.parameters.get('bits')); downMod.connect(crush.parameters.get('down')); route.crush = null; applyCrush(true);
      }).catch(() => {
        quant = T(ac.createWaveShaper()); route.crush = null; applyCrush(true);
        ctx.fault('RUNTIME_003', 'Destroyer: AudioWorklet unavailable — bit reduction via WaveShaper, downsample disabled');
      });
      function quantCurve(bits) { if (bits >= 16) return null; const n = 4097, c = new Float32Array(n), L = Math.pow(2, bits - 1); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.max(-1, Math.min(1, (Math.floor(x * L) + 0.5) / L)); } c[(n - 1) / 2] = 0; return c; }
      const set = (param, v, now) => { if (now) param.setValueAtTime(v, ac.currentTime); else param.setTargetAtTime(v, ac.currentTime, 0.01); };
      // ALIAS: the held signal's Nyquist is sr / (2·down). 0 → filtered on both sides (a clean low-rate sampler), 1 → raw fold-over
      function crushFilters(now) {
        const down = crush ? Math.max(1, P.get('downsample')) : 1, a = P.get('alias'), fN = nyq / down;
        const cap = (f) => Math.min(nyq * 0.92, f);
        set(aa.frequency, cap(fN * 0.9 * Math.pow(2, a * 4)), now);
        set(img1.frequency, cap(fN * 0.9 * Math.pow(2, a * 3)), now); set(img2.frequency, cap(fN * 0.9 * Math.pow(2, a * 3)), now);
      }
      function applyCrush(now) {
        const t = ac.currentTime;
        if (crush) {
          const b = crush.parameters.get('bits'), d = crush.parameters.get('down'), di = crush.parameters.get('dither');
          if (now) { b.setValueAtTime(P.get('bits'), t); d.setValueAtTime(P.get('downsample'), t); } else { b.setTargetAtTime(P.get('bits'), t, 0.005); d.setTargetAtTime(P.get('downsample'), t, 0.005); }
          di.setValueAtTime(P.get('dither') ? 1 : 0, t);
        }
        if (quant) quant.curve = quantCurve(P.get('bits'));
        crushFilters(now); routeCrush();
      }
      function applyShape(now) {
        const dr = P.get('drive'), c = shapeCurve(P.get('shape'), dr, P.get('asym'));
        sh.curve = c; set(lvl.gain, P.get('autoGain') ? makeup(c) : 1, now);
        set(lo.gain, -P.get('tilt') * 6, now); set(hi.gain, P.get('tilt') * 6, now);
        set(tight.frequency, P.get('tight'), now);
        const kf = P.get('lowKeep'), on = kf >= 20; [xLP1, xLP2, xHP1, xHP2].forEach(f => set(f.frequency, on ? kf : 10, now)); set(lowG.gain, on ? 1 : 0, now);
        routeTilt(Math.abs(P.get('tilt')) > 0.001); routeKeep(on);
        set(tame.frequency, Math.max(1000, Math.min(P.get('postLP'), 20000 * Math.pow(2, -dr * P.get('autoTame') * 2))), now);
      }
      applyShape(true); applyCrush(true);   // the crush path exists from the start (straight through until the worklet is in)
      ['shape', 'drive', 'asym', 'autoGain', 'tight', 'lowKeep', 'tilt', 'postLP', 'autoTame'].forEach(k => P.onChange(k, () => applyShape(false)));
      ['bits', 'downsample', 'dither', 'alias'].forEach(k => P.onChange(k, () => applyCrush(false)));
      ['kernel:wire-registered', 'kernel:wire-removed'].forEach(tp => ctx.on(tp, null, (w) => { if (w && w.dst && w.dst.instanceId === ctx.id) routeCrush(); }));   // a mod wired to Bits / Downsample needs the crusher in
      ctx.internals = { get crush() { return crush; }, get quant() { return quant; }, tame, aa, img: [img1, img2], crushIn, shapeCurve, makeup };
      return { unmount() {} };
    },
  });
})();
