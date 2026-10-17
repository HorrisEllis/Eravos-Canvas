/* eravos.fx-phaser 1.0.0 — Phaser (P10 · W-01) · spec eravos.organism.fx-phaser · inherits STD.fx
 * Per channel: N all-pass stages (even: 2..12) at a shared centre, swept together by one LFO on .detune
 * (log sweep minHz..maxHz); feedback last stage → first; right-channel LFO phase-offset by 'stereo' degrees. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const DIVS = ['1/1', '1/2', '1/4', '1/8', '1/16'];
  OrganismFactory.define({
    id: 'eravos.fx-phaser', domain: 'music', version: '1.0.0', label: 'Phaser', icon: '◈', accent: '#5533ff', phase: 'P10',
    category: 'Effects', blurb: 'Sweeping notches — the classic swirl on pads, bass and vocals.',
    size: { w: 440, h: 440 }, minSize: { w: 340, h: 340 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([S.mod_in('ph.hook.mod_rate', 'rate'), S.mod_in('ph.hook.mod_feedback', 'feedback')]),
    config: [
      { key: 'stages', type: 'enum', options: [2, 4, 6, 8, 12], default: 6, label: 'Stages', group: 'PHASER' },
      { key: 'rate', type: 'number', default: 0.3, min: 0.005, max: 20, step: 0.01, unit: 'Hz', label: 'Rate', group: 'LFO' },
      { key: 'sync', type: 'boolean', default: false, label: 'Sync', group: 'LFO' },
      { key: 'div', type: 'enum', options: DIVS, default: '1/4', label: 'Every', group: 'LFO' },
      { key: 'minHz', type: 'number', default: 300, min: 20, max: 4000, step: 1, unit: 'Hz', label: 'From', group: 'SWEEP' },
      { key: 'maxHz', type: 'number', default: 3000, min: 200, max: 18000, step: 1, unit: 'Hz', label: 'To', group: 'SWEEP' },
      { key: 'feedback', type: 'number', default: 0.5, min: 0, max: 0.97, step: 0.01, label: 'Feedback', group: 'SWEEP' },
      { key: 'stereo', type: 'number', default: 90, min: 0, max: 180, step: 1, unit: '°', label: 'Stereo', group: 'SWEEP' },
      { key: 'Q', type: 'number', default: 0.7, min: 0.3, max: 12, step: 0.01, label: 'Q', group: 'SWEEP' },
    ].concat(SDK.STD_FX_CONFIG.map(c => c.key === 'mix' ? Object.assign({}, c, { default: 0.5 }) : c)),
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const fx = SDK.fxShell(ctx);
      const split = ac.createChannelSplitter(2), merge = ac.createChannelMerger(2), up = ac.createGain();
      up.channelCount = 2; up.channelCountMode = 'explicit'; up.channelInterpretation = 'speakers';
      fx.wetIn.connect(up); up.connect(split); merge.connect(fx.wetOut);
      const rateMod = ctx.modBus('rate', { min: -4, max: 4 }), fbMod = ctx.modBus('feedback', { min: -0.9, max: 0.9 });
      const phaseWave = (deg) => { const r = deg * Math.PI / 180; return ac.createPeriodicWave(new Float32Array([0, Math.sin(r)]), new Float32Array([0, Math.cos(r)]), { disableNormalization: true }); };
      const chans = [0, 1].map((c) => {
        const sum = ac.createGain(), fb = ac.createGain(), lfo = ac.createOscillator(), dep = ac.createGain();
        const stages = Array.from({ length: 12 }, () => { const a = ac.createBiquadFilter(); a.type = 'allpass'; dep.connect(a.detune); ctx.track(a); return a; });
        split.connect(sum, c); lfo.connect(dep); rateMod.connect(lfo.frequency); fbMod.connect(fb.gain); lfo.start();
        [sum, fb, lfo, dep].forEach(n => ctx.track(n));
        return { c, sum, fb, lfo, dep, stages };
      });
      [split, merge, up].forEach(n => ctx.track(n));
      let built = 0, phaseDeg = -1;
      function rebuild() {
        const n = +P.get('stages'); if (n === built) return; built = n;
        chans.forEach(ch => {
          [ch.sum].concat(ch.stages).forEach(x => { try { x.disconnect(); } catch (e) {} });
          ch.stages.forEach(a => ch.dep.connect(a.detune));
          let prev = ch.sum; for (let i = 0; i < n; i++) { prev.connect(ch.stages[i]); prev = ch.stages[i]; }
          prev.connect(merge, 0, ch.c); prev.connect(ch.fb); ch.fb.connect(ch.sum);
        });
      }
      function apply(now) {
        const t = ac.currentTime, set = (prm, v) => now ? prm.setValueAtTime(v, t) : prm.setTargetAtTime(v, t, 0.02);
        rebuild();
        const lo = P.get('minHz'), hi = Math.max(lo * 1.05, P.get('maxHz')), centre = Math.sqrt(lo * hi), span = 1200 * Math.log2(hi / lo) / 2;
        const rate = P.get('sync') ? 1 / MT.divisionSec(P.get('div'), ctx.bpm) : P.get('rate');
        if (P.get('stereo') !== phaseDeg) { phaseDeg = P.get('stereo'); chans[0].lfo.setPeriodicWave(phaseWave(0)); chans[1].lfo.setPeriodicWave(phaseWave(phaseDeg)); }
        chans.forEach(ch => { set(ch.lfo.frequency, rate); set(ch.dep.gain, span); set(ch.fb.gain, P.get('feedback')); ch.stages.forEach(a => { set(a.frequency, centre); set(a.Q, P.get('Q')); }); });
      }
      apply(true);
      ['stages', 'rate', 'sync', 'div', 'minHz', 'maxHz', 'feedback', 'stereo', 'Q'].forEach(k => P.onChange(k, () => apply(false)));
      ctx.onBpm(() => apply(false));
      ctx.internals = { chans };
      return { unmount() {} };
    },
  });
})();
