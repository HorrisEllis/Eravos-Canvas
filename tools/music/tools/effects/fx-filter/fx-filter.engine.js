/* eravos.fx-filter 1.0.0 — Filter (P10 · W-01) · spec eravos.organism.fx-filter · inherits STD.fx
 * drive (tanh) → 1 or 2 biquads (12 / 24 dB; 24 dB = Butterworth-staggered Q) LP/HP/BP/notch.
 * Three cutoff drivers summed in cents on .detune: manual cutoff · tempo LFO · envelope follower
 * (AudioWorklet, separate attack/release; symmetric biquad smoother if worklets are unavailable). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const LFO_DIVS = ['1/1', '1/2', '1/4', '1/8', '1/16', '1/4t', '1/8t'];
  const ENV_WORKLET = `
class EravosEnv extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'attack', defaultValue: 0.01, minValue: 0.0005, maxValue: 1 }, { name: 'release', defaultValue: 0.15, minValue: 0.005, maxValue: 2 }]; }
  constructor() { super(); this.e = 0; }
  process(inputs, outputs, p) {
    const inp = inputs[0], out = outputs[0][0]; if (!out) return true;
    const a = Math.exp(-1 / (p.attack[0] * sampleRate)), r = Math.exp(-1 / (p.release[0] * sampleRate));
    for (let i = 0; i < out.length; i++) {
      let x = 0; for (let c = 0; c < inp.length; c++) x = Math.max(x, Math.abs(inp[c][i] || 0));
      this.e = x > this.e ? a * this.e + (1 - a) * x : r * this.e + (1 - r) * x; out[i] = this.e;
    }
    return true;
  }
}
registerProcessor('eravos-env', EravosEnv);`;
  OrganismFactory.define({
    id: 'eravos.fx-filter', domain: 'music', version: '1.0.0', label: 'Filter', icon: '⌇', accent: '#00ffaa', phase: 'P10',
    category: 'Effects', blurb: 'Auto-filter, wah and build sweeps on one sound — manual, tempo LFO and envelope, summed.',
    size: { w: 460, h: 480 }, minSize: { w: 360, h: 360 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([S.mod_in('filt.hook.mod_cutoff', 'cutoff'), S.mod_in('filt.hook.mod_res', 'res')]),
    config: [
      { key: 'type', type: 'enum', options: ['LP', 'HP', 'BP', 'notch'], default: 'LP', label: 'Type', group: 'FILTER' },
      { key: 'slope', type: 'enum', options: [12, 24], default: 24, label: 'dB/oct', group: 'FILTER' },
      { key: 'cutoff', type: 'number', default: 1200, min: 20, max: 20000, step: 1, unit: 'Hz', label: 'Cutoff', group: 'FILTER' },
      { key: 'res', type: 'number', default: 2, min: 0.5, max: 20, step: 0.01, label: 'Reso', group: 'FILTER', hint: '0.71 = flat (Butterworth)' },
      { key: 'drive', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'FILTER' },
      { key: 'lfoAmt', type: 'number', default: 0, min: -4, max: 4, step: 0.01, unit: 'oct', label: 'LFO amt', group: 'LFO' },
      { key: 'lfoShape', type: 'enum', options: ['sine', 'triangle', 'sawtooth', 'square'], default: 'sine', label: 'Shape', group: 'LFO' },
      { key: 'lfoSync', type: 'boolean', default: true, label: 'Sync', group: 'LFO' },
      { key: 'lfoDiv', type: 'enum', options: LFO_DIVS, default: '1/4', label: 'Rate', group: 'LFO' },
      { key: 'lfoRate', type: 'number', default: 1, min: 0.05, max: 20, step: 0.01, unit: 'Hz', label: 'Hz', group: 'LFO' },
      { key: 'envAmt', type: 'number', default: 0, min: -4, max: 4, step: 0.01, unit: 'oct', label: 'Env amt', group: 'ENV' },
      { key: 'envAttack', type: 'number', default: 10, min: 1, max: 200, step: 1, unit: 'ms', label: 'Attack', group: 'ENV' },
      { key: 'envRelease', type: 'number', default: 150, min: 10, max: 1000, step: 1, unit: 'ms', label: 'Release', group: 'ENV' },
    ].concat(SDK.STD_FX_CONFIG),
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const fx = SDK.fxShell(ctx);
      const pre = ac.createGain(), sh = ac.createWaveShaper(), post = ac.createGain(), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
      sh.oversample = '2x';
      fx.wetIn.connect(pre); pre.connect(sh); sh.connect(post);
      // drivers → detune (cents)
      const cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 }), resMod = ctx.modBus('res', { min: -10, max: 10 });
      const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.connect(lfoG); lfo.start();
      const envG = ac.createGain(); let envNode = null;
      [f1, f2].forEach(f => { cutMod.connect(f.detune); lfoG.connect(f.detune); envG.connect(f.detune); resMod.connect(f.Q); });
      [pre, sh, post, f1, f2, lfo, lfoG, envG].forEach(n => ctx.track(n));
      const fallbackEnv = () => { const r = ac.createWaveShaper(); r.curve = dsp.curve('abs'); const sm = ac.createBiquadFilter(); sm.type = 'lowpass'; fx.wetIn.connect(r); r.connect(sm); sm.connect(envG); ctx.track(r); ctx.track(sm); return { sm, fallback: true }; };
      ctx.ready = ctx.loadWorklet('eravos-env', ENV_WORKLET).then(() => {
        const n = new AudioWorkletNode(ac, 'eravos-env', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
        fx.wetIn.connect(n); n.connect(envG); ctx.track(n); envNode = { n }; applyEnv();
      }).catch(() => { envNode = fallbackEnv(); applyEnv(); ctx.emitUI('notice', { text: 'envelope follower: worklets unavailable — using a symmetric smoother' }); });
      function applyEnv() {
        if (!envNode) return; const t = ac.currentTime;
        if (envNode.n) { envNode.n.parameters.get('attack').setValueAtTime(P.get('envAttack') / 1000, t); envNode.n.parameters.get('release').setValueAtTime(P.get('envRelease') / 1000, t); }
        else envNode.sm.frequency.setValueAtTime(1 / (2 * Math.PI * ((P.get('envAttack') + P.get('envRelease')) / 2000)), t);
        envG.gain.setTargetAtTime(P.get('envAmt') * 1200 * 2, t, 0.01); // full-scale envelope ≈ 0.5 → amt in octaves
      }
      let chainKey = '';
      function rechain() {
        const k = P.get('slope') + P.get('type'); if (k === chainKey) return; chainKey = k;
        [post, f1, f2].forEach(n => { try { n.disconnect(); } catch (e) {} });
        post.connect(f1); if (+P.get('slope') === 24) { f1.connect(f2); f2.connect(fx.wetOut); } else f1.connect(fx.wetOut);
      }
      const TYPES = { LP: 'lowpass', HP: 'highpass', BP: 'bandpass', notch: 'notch' };
      function qFor(stage) { // res is a linear Q; LP/HP biquads take Q in dB
        const t = P.get('type'), r = P.get('res'), four = +P.get('slope') === 24;
        // 3.37 (QA RCA: in 24 dB mode BOTH stages resonated and their peaks multiplied — Reso 6 = ≈ +34 dB at the cutoff,
        // "Wobble 1/8 LP" peaked at +20 dBFS): stage 1 stays Butterworth, only stage 2 carries the resonance
        const lin = four && (t === 'LP' || t === 'HP') ? (stage ? 1.3066 * Math.max(1, r / Math.SQRT1_2) : 0.5412) : r;
        return t === 'LP' || t === 'HP' ? 20 * Math.log10(lin) : lin;
      }
      function apply(now) {
        const t = ac.currentTime, set = (prm, v) => now ? prm.setValueAtTime(v, t) : prm.setTargetAtTime(v, t, 0.01);
        rechain();
        [f1, f2].forEach((f, i) => { f.type = TYPES[P.get('type')]; set(f.frequency, P.get('cutoff')); set(f.Q, qFor(i)); });
        // resonance compensation: the passband drops as the peak rises (as analog ladders do) — Reso changes tone, not loudness
        const rq = Math.max(1, P.get('res') / Math.SQRT1_2), comp = 1 / Math.sqrt(rq);
        const dr = P.get('drive'); sh.curve = dr > 0.001 ? dsp.curve('soft', dr) : null; pre.gain.value = 1; post.gain.value = (dr > 0.001 ? 1 / (1 + dr) : 1) * comp;
        lfo.type = P.get('lfoShape'); set(lfo.frequency, P.get('lfoSync') ? 1 / MT.divisionSec(P.get('lfoDiv'), ctx.bpm) : P.get('lfoRate'));
        set(lfoG.gain, P.get('lfoAmt') * 1200);
        applyEnv();
      }
      apply(true);
      ['type', 'slope', 'cutoff', 'res', 'drive', 'lfoAmt', 'lfoShape', 'lfoSync', 'lfoDiv', 'lfoRate'].forEach(k => P.onChange(k, () => apply(false)));
      ['envAmt', 'envAttack', 'envRelease'].forEach(k => P.onChange(k, applyEnv));
      ctx.onBpm(() => apply(false));
      ctx.internals = { f1, f2 };
      return { unmount() {} };
    },
  });
})();
