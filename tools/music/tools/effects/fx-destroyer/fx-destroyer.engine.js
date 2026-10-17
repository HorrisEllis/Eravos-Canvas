/* eravos.fx-destroyer 1.0.0 — Destroyer (P10 · W-01) · spec eravos.organism.fx-destroyer · inherits STD.fx
 * tilt EQ → SHAPER (soft | hard | tube | fold, 4× oversampled, auto-levelled by the curve's sine RMS) →
 * CRUSHER AudioWorklet (bits 1..16 mid-rise quantiser, sample-hold downsample 1..64) → post LP → mix.
 * If AudioWorklet is unavailable: WaveShaper quantiser, downsample disabled, a fault says so (§1.2). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const CRUSH = `
class EravosCrush extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'bits', defaultValue: 16, minValue: 1, maxValue: 16 }, { name: 'down', defaultValue: 1, minValue: 1, maxValue: 64 }]; }
  constructor() { super(); this.h = [0, 0]; this.n = 0; }
  process(inputs, outputs, p) {
    const inp = inputs[0], out = outputs[0]; const bits = Math.round(p.bits[0]), down = Math.max(1, Math.round(p.down[0]));
    const L = Math.pow(2, bits - 1);
    for (let i = 0; i < out[0].length; i++) {
      if (this.n <= 0) { for (let c = 0; c < out.length; c++) { const x = (inp[c] || inp[0] || [])[i] || 0; this.h[c] = bits >= 16 || Math.abs(x) < 1e-5 ? (Math.abs(x) < 1e-5 ? 0 : x) : Math.max(-1, Math.min(1, (Math.floor(x * L) + 0.5) / L)); /* 3.28: silence stays silence — the mid-rise step turned 0 into a constant DC level (−24 dB at 4 bits) forever */ } this.n = down; }
      this.n--;
      for (let c = 0; c < out.length; c++) out[c][i] = this.h[c];
    }
    return true;
  }
}
registerProcessor('eravos-crush', EravosCrush);`;
  OrganismFactory.define({
    id: 'eravos.fx-destroyer', domain: 'music', version: '1.0.0', label: 'Destroyer', icon: '👾', accent: '#aaff00', phase: 'P10',
    category: 'Effects', blurb: 'Warm tape, grit, fold growl, 8-bit crunch. From a little colour to total destruction.',
    size: { w: 440, h: 440 }, minSize: { w: 340, h: 340 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([S.mod_in('dst.hook.mod_drive', 'drive'), S.mod_in('dst.hook.mod_bits', 'bits'), S.mod_in('dst.hook.mod_down', 'downsample')]),
    config: [
      { key: 'shape', type: 'enum', options: ['soft', 'hard', 'tube', 'fold'], default: 'soft', label: 'Shape', group: 'SHAPER' },
      { key: 'drive', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'SHAPER' },
      { key: 'bits', type: 'integer', default: 16, min: 1, max: 16, label: 'Bits', group: 'CRUSH' },
      { key: 'downsample', type: 'integer', default: 1, min: 1, max: 64, label: 'Downsample', group: 'CRUSH' },
      { key: 'tilt', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Tilt', group: 'TONE', hint: '− darker in · + brighter in' },
      { key: 'postLP', type: 'number', default: 16000, min: 1000, max: 20000, step: 1, unit: 'Hz', label: 'Tame', group: 'TONE' },
    ].concat(SDK.STD_FX_CONFIG),
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp;
      const fx = SDK.fxShell(ctx);
      fx.setLatency(dsp.osLatency(ac, '4x'));   // 3.39: the blended dry waits for the 4x shaper (no comb filter at partial mix)
      const lo = ac.createBiquadFilter(), hi = ac.createBiquadFilter(), sh = ac.createWaveShaper(), lvl = ac.createGain(), lp = ac.createBiquadFilter(), crushIn = ac.createGain();
      lo.type = 'lowshelf'; hi.type = 'highshelf'; lo.frequency.value = hi.frequency.value = 800; sh.oversample = '4x'; lp.type = 'lowpass'; lp.Q.value = 0;
      const dcb = ac.createBiquadFilter(); dcb.type = 'highpass'; dcb.frequency.value = 5; dcb.Q.value = 0.5; ctx.track(dcb); // 3.37: tube/fold are asymmetric → DC; removed in the wet chain only
      fx.wetIn.connect(lo); lo.connect(hi); hi.connect(sh); sh.connect(lvl); lvl.connect(crushIn); lp.connect(dcb); dcb.connect(fx.wetOut);
      const driveMod = ctx.modBus('drive', { min: -1, max: 1 }); const pre = ac.createGain(); hi.disconnect(); hi.connect(pre); pre.connect(sh); driveMod.connect(pre.gain);
      [lo, hi, sh, lvl, lp, crushIn, pre].forEach(n => ctx.track(n));
      let crush = null, quant = null;
      crushIn.connect(lp); // until the worklet is ready (or if it never is)
      const bitsMod = ctx.modBus('bits', { min: -15, max: 15 }), downMod = ctx.modBus('downsample', { min: -63, max: 63 });
      ctx.ready = ctx.loadWorklet('eravos-crush', CRUSH).then(() => {
        crush = new AudioWorkletNode(ac, 'eravos-crush', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); ctx.track(crush);
        crushIn.disconnect(); crushIn.connect(crush); crush.connect(lp);
        bitsMod.connect(crush.parameters.get('bits')); downMod.connect(crush.parameters.get('down')); applyCrush(true);
      }).catch(() => {
        quant = ac.createWaveShaper(); ctx.track(quant); crushIn.disconnect(); crushIn.connect(quant); quant.connect(lp); applyCrush(true);
        ctx.fault('RUNTIME_003', 'Destroyer: AudioWorklet unavailable — bit reduction via WaveShaper, downsample disabled');
      });
      function quantCurve(bits) { if (bits >= 16) return null; const n = 4096, c = new Float32Array(n), L = Math.pow(2, bits - 1); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.max(-1, Math.min(1, (Math.floor(x * L) + 0.5) / L)); } return c; }
      function applyCrush(now) {
        const t = ac.currentTime;
        if (crush) { const b = crush.parameters.get('bits'), d = crush.parameters.get('down'); if (now) { b.setValueAtTime(P.get('bits'), t); d.setValueAtTime(P.get('downsample'), t); } else { b.setTargetAtTime(P.get('bits'), t, 0.005); d.setTargetAtTime(P.get('downsample'), t, 0.005); } }
        if (quant) quant.curve = quantCurve(P.get('bits'));
      }
      const KINDS = { soft: 'soft', hard: 'hard', tube: 'tube', fold: 'fold' };
      function applyShape() {
        const t = ac.currentTime, dr = P.get('drive'), c = dsp.curve(KINDS[P.get('shape')], dr);
        sh.curve = c; lvl.gain.setTargetAtTime(Math.min(4, Math.SQRT1_2 / Math.max(0.05, dsp.curveRms(c))) * 0.5, t, 0.01);
        lo.gain.setTargetAtTime(-P.get('tilt') * 6, t, 0.01); hi.gain.setTargetAtTime(P.get('tilt') * 6, t, 0.01);
        lp.frequency.setTargetAtTime(P.get('postLP'), t, 0.01);
      }
      applyShape(); lp.frequency.value = P.get('postLP');
      ['shape', 'drive', 'tilt', 'postLP'].forEach(k => P.onChange(k, applyShape));
      ['bits', 'downsample'].forEach(k => P.onChange(k, () => applyCrush(false)));
      ctx.internals = { get crush() { return crush; }, get quant() { return quant; }, lp, crushIn };
      return { unmount() {} };
    },
  });
})();
