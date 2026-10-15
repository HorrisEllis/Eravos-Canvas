/* eravos.fx-moddelay 1.0.0 — Mod Delay (P10 · W-01) · spec eravos.organism.fx-moddelay · inherits STD.fx
 * The same circuit at two delay ranges (as in hardware): chorus = 3 LFO-modulated lines (phases 0/120/240°,
 * panned L/C/R, no feedback); flanger = 1 line, short base, deep modulation, ± feedback (negative = hollow). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const DIVS = ['1/1', '1/2', '1/4', '1/8', '1/16'];
  OrganismFactory.define({
    id: 'eravos.fx-moddelay', domain: 'music', version: '1.0.0', label: 'Mod Delay', icon: '≋', accent: '#33ddff', phase: 'P10',
    category: 'Effects', blurb: 'Chorus for width, flanger for jet sweeps. Makes pads and plucks huge.',
    size: { w: 440, h: 440 }, minSize: { w: 340, h: 340 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([S.mod_in('md.hook.mod_rate', 'rate'), S.mod_in('md.hook.mod_depth', 'depth')]),
    config: [
      { key: 'mode', type: 'enum', options: ['chorus', 'flanger'], default: 'chorus', label: 'Mode', group: 'MODE' },
      { key: 'rate', type: 'number', default: 0.6, min: 0.02, max: 10, step: 0.01, unit: 'Hz', label: 'Rate', group: 'LFO' },
      { key: 'sync', type: 'boolean', default: false, label: 'Sync', group: 'LFO' },
      { key: 'div', type: 'enum', options: DIVS, default: '1/2', label: 'Every', group: 'LFO' },
      { key: 'depth', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Depth', group: 'LFO' },
      { key: 'base', type: 'number', default: 12, min: 0.2, max: 25, step: 0.1, unit: 'ms', label: 'Base', group: 'DELAY', hint: 'chorus 7–25 ms · flanger 0.2–8 ms' },
      { key: 'feedback', type: 'number', default: 0, min: -0.95, max: 0.95, step: 0.01, label: 'Feedback', group: 'DELAY', hint: 'flanger only; negative = hollow' },
      { key: 'spread', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Width', group: 'DELAY' },
    ].concat(SDK.STD_FX_CONFIG.map(c => c.key === 'mix' ? Object.assign({}, c, { default: 0.5 }) : c)),
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const fx = SDK.fxShell(ctx);
      const mono = ac.createGain(); mono.channelCount = 1; mono.channelCountMode = 'explicit'; mono.channelInterpretation = 'speakers';
      fx.wetIn.connect(mono);
      const rateMod = ctx.modBus('rate', { min: -5, max: 5 }), depthMod = ctx.modBus('depth', { min: -1, max: 1 });
      const fbG = ac.createGain(); ctx.track(mono); ctx.track(fbG);
      const phaseWave = (deg) => { const r = deg * Math.PI / 180; return ac.createPeriodicWave(new Float32Array([0, Math.sin(r)]), new Float32Array([0, Math.cos(r)]), { disableNormalization: true }); };
      const voices = [0, 120, 240].map((deg, i) => {
        const d = ac.createDelay(0.1), lfo = ac.createOscillator(), dep = ac.createGain(), pan = ac.createStereoPanner(), vg = ac.createGain(), depScale = ac.createGain();
        lfo.setPeriodicWave(phaseWave(deg)); lfo.connect(dep); dep.connect(d.delayTime); rateMod.connect(lfo.frequency);
        depthMod.connect(depScale); depScale.connect(dep.gain);
        mono.connect(d); d.connect(vg); vg.connect(pan); pan.connect(fx.wetOut); lfo.start();
        [d, lfo, dep, pan, vg, depScale].forEach(n => ctx.track(n));
        return { d, lfo, dep, pan, vg, depScale, side: i === 0 ? 0 : i === 1 ? -1 : 1 };
      });
      voices[0].d.connect(fbG); fbG.connect(voices[0].d);
      function apply(now) {
        const t = ac.currentTime, set = (prm, v) => now ? prm.setValueAtTime(v, t) : prm.setTargetAtTime(v, t, 0.02);
        const fl = P.get('mode') === 'flanger', dep = P.get('depth'), sp = P.get('spread');
        const base = (fl ? Math.min(8, P.get('base')) : Math.max(7, P.get('base'))) / 1000;
        const swing = fl ? base * 0.95 * dep : Math.min(base * 0.9, (0.0005 + 0.0075 * dep)); // seconds, never through zero
        const rate = P.get('sync') ? 1 / MT.divisionSec(P.get('div'), ctx.bpm) : P.get('rate');
        voices.forEach((v, i) => {
          set(v.d.delayTime, base); set(v.dep.gain, swing); set(v.depScale.gain, fl ? base * 0.95 : 0.0075); set(v.lfo.frequency, rate);
          set(v.vg.gain, fl ? (i === 0 ? 1 : 0) : 0.62); set(v.pan.pan, fl ? 0 : v.side * sp);
        });
        set(fbG.gain, fl ? P.get('feedback') : 0);
      }
      apply(true);
      ['mode', 'rate', 'sync', 'div', 'depth', 'base', 'feedback', 'spread'].forEach(k => P.onChange(k, () => apply(false)));
      ctx.onBpm(() => apply(false));
      ctx.internals = { voices };
      return { unmount() {} };
    },
  });
})();
