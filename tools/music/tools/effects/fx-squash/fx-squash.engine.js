/* eravos.fx-squash 1.0.0 — Squash · spec fx-squash.spec · inherits STD.fx
 * "A multiband squash" — the Wobble Bass's 3.4 SQUASH as a tool of its own, for any sound: the input is split into three bands
 * (low · mid · high, crossovers you set), each band driven into a soft limiter (tanh) and brought back up, so quiet detail comes
 * up and peaks flatten — the dense, loud, fizzy growl of an OTT, with no look-ahead (zero latency) and no compressor pumping.
 *   SQUASH turns all three bands at once; LOW / MID / HIGH say how much each band takes (the growl's mids most by default).
 *   LOWS CLEAN (on by default) passes the low band straight — the sub stays round and in phase — and MONO LOWS sums it to mono,
 *   so the low end stays solid on a club system. Each band has its own level after the squash. Mix blends the dry signal back in.
 * The drive → makeup law: every band rests at drive 0.25 — the limiter's straight part, made back up to exactly 1 — so Squash 0 is
 * the input untouched. Squash pushes the drive up to 0.25 × (1 + share × K); the makeup is set so quiet material comes up by
 * (d / 0.25)^0.55 while the loudest peaks are held near where they were. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  OrganismFactory.define({
    id: 'eravos.fx-squash', domain: 'music', version: '1.0.0', label: 'Squash', icon: '▤', accent: '#ff5533',
    category: 'Effects', blurb: 'Three-band OTT-style squash: quiet detail up, peaks flat, the growl up front — lows kept clean (and mono if you like). Zero latency.',
    size: { w: 560, h: 520 }, minSize: { w: 420, h: 400 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    face: ['amount', 'mid', 'high', 'mix'],
    hooks: SDK.fxHooks([S.mod_in('sq.hook.mod_amount', 'amount')]),
    config: [
      { key: 'amount', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Squash', group: 'SQUASH', hint: 'how hard every band is pushed into its limiter (0 = untouched)' },
      { key: 'low', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Low', group: 'BANDS', hint: 'how much the low band takes (with Lows clean on, the low band is not squashed at all)' },
      { key: 'mid', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Mid', group: 'BANDS', hint: 'how much the mids take — the growl lives here' },
      { key: 'high', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'High', group: 'BANDS', hint: 'how much the highs take — the fizz' },
      { key: 'xLo', type: 'number', default: 180, min: 60, max: 600, step: 1, unit: 'Hz', label: 'Low / mid', group: 'SPLIT', hint: 'where the low band ends' },
      { key: 'xHi', type: 'number', default: 2400, min: 1000, max: 8000, step: 1, unit: 'Hz', label: 'Mid / high', group: 'SPLIT', hint: 'where the high band starts' },
      { key: 'lowClean', type: 'boolean', default: true, label: 'Lows clean', group: 'LOW END', hint: 'the low band passes straight through — the sub is never squashed' },
      { key: 'monoLow', type: 'boolean', default: false, label: 'Mono lows', group: 'LOW END', hint: 'the low band in mono — a solid low end on any system' },
      { key: 'lowGain', type: 'number', default: 0, min: -12, max: 12, step: 0.1, unit: 'dB', label: 'Low level', group: 'LEVELS' },
      { key: 'midGain', type: 'number', default: 0, min: -12, max: 12, step: 0.1, unit: 'dB', label: 'Mid level', group: 'LEVELS' },
      { key: 'highGain', type: 'number', default: 0, min: -12, max: 12, step: 0.1, unit: 'dB', label: 'High level', group: 'LEVELS' },
    ].concat(SDK.STD_FX_CONFIG),
    ui_hooks: ['want_meter'],
    defaultPreset: 'OTT Growl',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const fx = SDK.fxShell(ctx);
      const tanh = new Float32Array(2049); for (let i = 0; i < 2049; i++) { const x = (i / 2048) * 2 - 1; tanh[i] = Math.tanh(1.5 * x) / Math.tanh(1.5); } tanh[1024] = 0;
      const SMALL = 1.5 / Math.tanh(1.5);   // the curve's slope at 0
      const top = ac.createBiquadFilter(); top.type = 'lowpass'; top.frequency.value = 14000; top.Q.value = 20 * Math.log10(Math.SQRT1_2);   // what the limiters fold up high goes
      const sum = ac.createGain(); sum.connect(top); top.connect(fx.wetOut);
      const amtMod = ctx.modBus('amount', { min: -1, max: 1 });
      // Butterworth sections: Web Audio takes a lowpass / highpass Q in dB (−3.01 dB = 1/√2) and an allpass Q as a plain ratio
      const mk = (type, f) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = type === 'allpass' ? Math.SQRT1_2 : 20 * Math.log10(Math.SQRT1_2); ctx.track(b); return b; };
      const lr4 = (type, f) => { const a = mk(type, f), b = mk(type, f); a.connect(b); return { in: a, out: b, fs: [a, b] }; };
      // the split: Linkwitz–Riley 24 dB/oct. low = LP(xLo) · rest = HP(xLo) → mid = LP(xHi) · high = HP(xHi); the low band goes through
      // the allpass the rest gets from its split at xHi, so at Squash 0 the three bands sum back flat. Steep enough that a mono low
      // band really is the whole low end (a 12 dB/oct split left a tenth of a 50 Hz sub in the stereo mids).
      const lowF = lr4('lowpass', 180), rest = lr4('highpass', 180), midF = lr4('lowpass', 2400), highF = lr4('highpass', 2400), lowAP = mk('allpass', 2400);
      fx.wetIn.connect(lowF.in); lowF.out.connect(lowAP); fx.wetIn.connect(rest.in); rest.out.connect(midF.in); rest.out.connect(highF.in);
      const band = (src, name) => {
        const drv = ac.createGain(), sh = ac.createWaveShaper(), make = ac.createGain(), lvl = ac.createGain(), pre = ac.createAnalyser(), post = ac.createAnalyser();
        sh.curve = tanh; pre.fftSize = post.fftSize = 1024;
        src.connect(drv); drv.connect(sh); sh.connect(make); make.connect(lvl); src.connect(pre); lvl.connect(post);
        [drv, sh, make, lvl, pre, post].forEach(n => ctx.track(n)); return { name, src, drv, make, lvl, pre, post, buf: new Float32Array(1024) };
      };
      const B = [band(lowAP, 'low'), band(midF.out, 'mid'), band(highF.out, 'high')];
      // the low band's way out: straight (stereo) or summed to mono
      const lowSt = ac.createGain(), lowMono = ac.createGain(); lowMono.channelCount = 1; lowMono.channelCountMode = 'explicit'; lowMono.channelInterpretation = 'speakers';
      B[0].lvl.connect(lowSt); B[0].lvl.connect(lowMono); lowSt.connect(sum); lowMono.connect(sum); B[1].lvl.connect(sum); B[2].lvl.connect(sum);
      [top, sum, lowSt, lowMono].forEach(n => ctx.track(n));
      const K = [10, 24, 18];   // how far each band can be driven at full Squash (×0.25)
      function apply(now) {
        const t = ac.currentTime, set = (prm, v) => now ? prm.setValueAtTime(v, t) : prm.setTargetAtTime(v, t, 0.01);
        const lo = Math.max(60, Math.min(600, P.get('xLo'))), hi = Math.max(lo * 2, Math.min(8000, P.get('xHi')));
        lowF.fs.concat(rest.fs).forEach(f => set(f.frequency, lo)); midF.fs.concat(highF.fs, [lowAP]).forEach(f => set(f.frequency, hi));
        const a = P.get('amount'), share = [P.get('low'), P.get('mid'), P.get('high')], gains = [P.get('lowGain'), P.get('midGain'), P.get('highGain')];
        B.forEach((b, i) => {
          const x = i === 0 && P.get('lowClean') ? 0 : a * share[i];   // lows clean: never driven past the straight part
          const d = 0.25 * (1 + x * K[i]), m = Math.pow(d / 0.25, 0.55) / (SMALL * d);
          set(b.drv.gain, d); set(b.make.gain, m); set(b.lvl.gain, Math.pow(10, gains[i] / 20));
        });
        const mono = !!P.get('monoLow'); set(lowSt.gain, mono ? 0 : 1); set(lowMono.gain, mono ? 1 : 0);
      }
      apply(true);
      ['amount', 'low', 'mid', 'high', 'xLo', 'xHi', 'lowClean', 'monoLow', 'lowGain', 'midGain', 'highGain'].forEach(k => P.onChange(k, () => apply(false)));
      // the amount input moves all three drives (a modulator turns the squash up and down)
      B.forEach((b, i) => { const g = ac.createGain(); g.gain.value = 0.25 * K[i] * (i === 0 ? 0 : 1); amtMod.connect(g); g.connect(b.drv.gain); ctx.track(g); });
      // meters: each band's level in and out (dB), asked for by the window while it is open
      const rms = (an, buf) => { an.getFloatTimeDomainData(buf); let q = 0; for (let i = 0; i < buf.length; i++) q += buf[i] * buf[i]; return Math.max(-90, 20 * Math.log10(Math.sqrt(q / buf.length) + 1e-9)); };
      ctx.onUI('want_meter', null, () => ctx.emitUI('meter', { bands: B.map(b => ({ name: b.name, in: +rms(b.pre, b.buf).toFixed(1), out: +rms(b.post, b.buf).toFixed(1) })) }));
      ctx.internals = { bands: B, lowSt, lowMono, sum };
      return { unmount() {} };
    },
  });
})();
