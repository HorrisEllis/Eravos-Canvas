/* eravos.master-fx 2.0.0 (+A-5) — Master section (P3) · resolves F-04, F-17
 * Control surface for the kernel master chain + shared returns (via kernel setters only) and the
 * metering a finished track needs: peak, RMS, momentary/short-term/integrated LUFS (BS.1770 K-weighting),
 * gain reduction. Singleton: a second instance mounts read-only (MOUNT_006 warning, non-blocking). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const DDIVS = ['1/4', '1/8', '1/8.', '1/16', '3/16', '1/4t'];
  OrganismFactory.define({
    id: 'eravos.master-fx', tempo: false, domain: 'music', version: '2.1.0', label: 'Master', icon: '✦', accent: '#aa44ff', phase: 'P3', singleton: 'readonly',
    category: 'Mix', blurb: 'Reverb, echo, glue compressor, limiter, DJ filter — and a loudness meter that says “too quiet / on target”.',
    size: { w: 640, h: 440 }, minSize: { w: 520, h: 360 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.master_fx_control', 'capability.master_bus'],
    hooks: [
      Object.assign(S.audio_in('mfx.hook.audio_in', 'in'), { intent: 'the master bus — wire a sound here to route it to the mix explicitly (unwired sounds already go here)' }),
      S.transport_in('mfx.hook.transport_in'),
      S.mod_in('mfx.hook.mod_dj', 'djFilter'), S.mod_in('mfx.hook.mod_revmix', 'reverbMix'),
      S.event('mfx.hook.loudness_out', 'out', 'master:loudness', { type: 'object', required: ['momentary', 'shortTerm', 'integrated', 'truePeakDb'] }, '1.0.0'),
    ],
    config: [
      { key: 'reverbMix', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Amount', group: 'SPACE' },
      { key: 'size', type: 'number', default: 2.2, min: 0.3, max: 8, step: 0.01, unit: 's', label: 'Size', group: 'SPACE' },
      { key: 'decay', type: 'number', default: 3, min: 1, max: 8, step: 0.01, label: 'Decay', group: 'SPACE' },
      { key: 'predelay', type: 'number', default: 0.02, min: 0, max: 0.2, step: 0.001, unit: 's', label: 'Pre-delay', group: 'SPACE' },
      { key: 'damping', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Damping', group: 'SPACE' },
      { key: 'freeze', type: 'boolean', default: false, label: 'Freeze', group: 'SPACE', hint: 'hold the reverb tail forever (new input muted)' },
      { key: 'shimmer', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Shimmer', group: 'SPACE', hint: '+12 st in the reverb feedback — angelic' },
      { key: 'delayMix', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Amount', group: 'ECHO' },
      { key: 'delayDiv', type: 'enum', options: DDIVS, default: '1/8.', label: 'Time', group: 'ECHO' },
      { key: 'feedback', type: 'number', default: 0.35, min: 0, max: 0.95, step: 0.01, label: 'Feedback', group: 'ECHO' },
      { key: 'tone', type: 'number', default: 4000, min: 500, max: 12000, step: 1, unit: 'Hz', label: 'Tone', group: 'ECHO' },
      { key: 'width', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Width', group: 'ECHO' },
      { key: 'compThresh', type: 'number', default: -12, min: -40, max: 0, step: 0.1, unit: 'dB', label: 'Thresh', group: 'GLUE' },
      { key: 'compRatio', type: 'number', default: 2, min: 1, max: 20, step: 0.1, label: 'Ratio', group: 'GLUE' },
      { key: 'compAttack', type: 'number', default: 0.01, min: 0.001, max: 0.1, step: 0.001, unit: 's', label: 'Attack', group: 'GLUE' },
      { key: 'compRelease', type: 'number', default: 0.2, min: 0.02, max: 1, step: 0.01, unit: 's', label: 'Release', group: 'GLUE' },
      { key: 'makeup', type: 'number', default: 0, min: 0, max: 12, step: 0.1, unit: 'dB', label: 'Makeup', group: 'GLUE' },
      { key: 'ceiling', type: 'number', default: -1, min: -6, max: 0, step: 0.1, unit: 'dB', label: 'Ceiling', group: 'OUT' },
      { key: 'djFilter', type: 'number', default: 0, min: -1, max: 1, step: 0.001, label: 'DJ FILTER', group: 'OUT', hint: 'left = low-pass (muffled), right = high-pass (thin)' },
      { key: 'outGain', type: 'number', default: 0, min: -24, max: 6, step: 0.1, unit: 'dB', label: 'Out', group: 'OUT' },
      { key: 'target', type: 'enum', options: ['-14', '-8', 'custom'], default: '-14', label: 'Target', group: 'OUT', hint: '−14 LUFS = streaming · −8 = club' },
      { key: 'customTarget', type: 'number', default: -10, min: -30, max: -4, step: 0.5, unit: 'LUFS', label: 'Custom', group: 'OUT' },
    ],
    ui_hooks: ['loudness_reset'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, A = ctx.K.audio, MT = window.MusicTheory, ro = !!ctx.readOnly;
      // modulation ports: kernel-owned inputs
      if (!ro) {
        // P10 · W-02: the master bus as a visible input (own gain → kernel master in; removing the port only drops this gain)
        const busIn = ac.createGain(); busIn.connect(A.masterIn); ctx.track(busIn);
        ctx.port('in', { kind: 'audio', direction: 'in', node: busIn, label: 'master in' });
        ctx.port('mod.djFilter', { kind: 'param', direction: 'in', param: (() => { const cs = ac.createConstantSource(); cs.offset.value = 0; cs.start(); ctx.track(cs); cs.connect(A.djModInput()); return cs.offset; })(), range: { min: -1, max: 1 }, label: 'DJ filter' });
        ctx.port('mod.reverbMix', { kind: 'param', direction: 'in', param: A.revMixModInput(), range: { min: 0, max: 1 }, label: 'reverb mix' });
      }
      let shim = null;
      async function applyShimmer() {
        if (ro) return;
        const v = P.get('shimmer');
        if (v > 0 && !shim) {
          try { await ctx.loadWorklet('eravos-pitch', OrganismSDK.dsp.PITCH_WORKLET); shim = new AudioWorkletNode(ac, 'eravos-pitch', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); shim.parameters.get('ratio').value = 2; shim.parameters.get('window').value = 0.06; A.setReverbShimmer(shim); ctx.track(shim); }
          catch (e) { ctx.fault('RUNTIME_003', 'shimmer worklet: ' + e.message); }
        }
        A.setReverb({ shimmer: v, freeze: P.get('freeze') });
      }
      function apply(k) {
        if (ro) return;
        const g = (x) => P.get(x);
        if (!k || ['reverbMix', 'size', 'decay', 'predelay', 'damping'].includes(k)) A.setReverb({ mix: g('reverbMix'), size: g('size'), decay: g('decay'), predelay: g('predelay'), damping: g('damping') });
        if (!k || k === 'freeze' || k === 'shimmer') applyShimmer();
        if (!k || ['delayMix', 'delayDiv', 'feedback', 'tone', 'width'].includes(k)) A.setDelay({ mix: g('delayMix'), time: MT.divisionSec(g('delayDiv'), ctx.bpm), feedback: g('feedback'), tone: g('tone'), width: g('width') });
        if (!k || k.startsWith('comp') || k === 'makeup') A.setCompressor({ threshold: g('compThresh'), ratio: g('compRatio'), attack: g('compAttack'), release: g('compRelease'), makeup: g('makeup') });
        if (!k || k === 'ceiling') A.setLimiter({ ceiling: g('ceiling') });
        if (!k || k === 'djFilter') A.setDJFilter({ value: g('djFilter') });
        if (!k || k === 'outGain') A.setOutGain(g('outGain'));
      }
      ctx.apply = apply;
      apply();
      P.onChange('*', (v, prev, k) => apply(k));
      ctx.onBpm(() => apply('delayDiv'));

      // ---- loudness (BS.1770): K-weighting on a read-only tap of the master output
      const split = ac.createChannelSplitter(2);
      const chans = [0, 1].map(i => {
        const shelf = ac.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 1681; shelf.gain.value = 4;
        const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38; hp.Q.value = 0.5;
        const an = ac.createAnalyser(); an.fftSize = 16384; const raw = ac.createAnalyser(); raw.fftSize = 2048;
        split.connect(shelf, i); shelf.connect(hp); hp.connect(an); split.connect(raw, i);
        [shelf, hp, an, raw].forEach(n => ctx.track(n));
        return { an, raw, buf: new Float32Array(16384), rbuf: new Float32Array(2048) };
      });
      A.output.connect(split); ctx.track(split);
      ctx.onDispose(() => { try { A.output.disconnect(split); } catch (e) {} });
      const blocks = []; // 100 ms mean-square sums (L+R)
      let gated = [];    // momentary block energies while playing
      let playing = false, truePeak = -120;
      ctx.onPlay(() => { playing = true; }); ctx.onStop(() => { playing = false; });
      const lufs = (ms) => -0.691 + 10 * Math.log10(ms + 1e-20);
      function measure() {
        const n = Math.round(0.1 * ac.sampleRate);
        let sum = 0, pk = 0;
        chans.forEach(c => {
          c.an.getFloatTimeDomainData(c.buf); let s = 0; for (let i = c.buf.length - n; i < c.buf.length; i++) s += c.buf[i] * c.buf[i]; sum += s / n;
          c.raw.getFloatTimeDomainData(c.rbuf); for (let i = 0; i < c.rbuf.length; i++) pk = Math.max(pk, Math.abs(c.rbuf[i]));
        });
        blocks.push(sum); if (blocks.length > 30) blocks.shift();
        const mean = (arr) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
        const mom = mean(blocks.slice(-4)), st = mean(blocks);
        truePeak = Math.max(truePeak - 0.3, 20 * Math.log10(pk + 1e-12));
        if (playing && blocks.length >= 4) gated.push(mom);
        const abs = gated.filter(e => lufs(e) > -70);
        let integ = -Infinity;
        if (abs.length) { const rel = lufs(mean(abs)) - 10; const g2 = abs.filter(e => lufs(e) > rel); if (g2.length) integ = lufs(mean(g2)); }
        const out = { momentary: lufs(mom), shortTerm: lufs(st), integrated: Number.isFinite(integ) ? integ : -70, truePeakDb: truePeak, gr: A.compressorReduction(), limiterGr: A.chain.limiter.reduction };
        return out;
      }
      ctx.measureLoudness = measure;
      ctx.interval(() => {
        const m = measure();
        const tgt = P.get('target') === 'custom' ? P.get('customTarget') : +P.get('target');
        const ref = m.shortTerm;
        m.status = ref < -60 ? 'silent' : ref > tgt + 1.5 ? 'too loud' : ref < tgt - 3 ? 'quiet' : 'on target';
        m.target = tgt;
        ctx.emitUI('loudness', m);
        ctx.emit('master:loudness', { momentary: m.momentary, shortTerm: m.shortTerm, integrated: m.integrated, truePeakDb: m.truePeakDb });
      }, 100);
      ctx.onUI('loudness_reset', null, () => { gated = []; truePeak = -120; });
      ctx.stateExtra = () => ({ readOnly: ro });
      return { unmount() { if (!ro) { A.setReverbShimmer(null); A.setReverb({ freeze: false, shimmer: 0 }); A.setDJFilter({ value: 0 }); } } };
    },
  });
})();
