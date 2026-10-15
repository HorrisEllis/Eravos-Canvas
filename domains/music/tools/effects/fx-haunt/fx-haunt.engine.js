/* eravos.fx-haunt 1.0.0 — Haunt · spec eravos.organism.fx-haunt · inherits STD.fx
 * Make anything sound like a memory that is going wrong: SCREW (pitch down, chopped-and-screwed), cassette WARBLE
 * (wow + flutter on a single moving tap — pitch wobble, no echo), TONE (open · underwater · radio · telephone ·
 * séance), CRUSH (bit depth), VINYL (generated crackle + hiss riding the signal's level), and GHOST — a reverse-swell
 * reverb: the impulse response is time-reversed so every sound is preceded by its own rising tail. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  OrganismFactory.define({
    id: 'eravos.fx-haunt', domain: 'music', version: '1.0.0', label: 'Haunt', icon: '👁', accent: '#9b8cff', phase: 'P14',
    category: 'Effects', blurb: 'Screw it down, warble it like old tape, crackle it like vinyl, swell a reversed ghost into it. Witch house in one plug.',
    size: { w: 480, h: 520 }, minSize: { w: 380, h: 400 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    needs: { works_with: ['eravos.coven', 'eravos.organ', 'eravos.sample-player', 'eravos.pad-forge'] },
    hooks: SDK.fxHooks([S.mod_in('haunt.hook.mod_warble', 'warble'), S.mod_in('haunt.hook.mod_ghost', 'ghost')]),
    config: [
      { key: 'screw', type: 'number', default: 0, min: 0, max: 12, step: 0.1, unit: 'st', label: 'Screw', group: 'TIME' },
      { key: 'warble', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Warble', group: 'TIME' },
      { key: 'wowRate', type: 'number', default: 0.55, min: 0.1, max: 3, step: 0.01, unit: 'Hz', label: 'Wow', group: 'TIME' },
      { key: 'tone', type: 'enum', options: ['open', 'underwater', 'radio', 'telephone', 'séance'], default: 'open', label: 'Tone', group: 'COLOUR' },
      { key: 'crush', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Crush', group: 'COLOUR' },
      { key: 'vinyl', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Vinyl', group: 'COLOUR' },
      { key: 'ghost', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Ghost', group: 'GHOST', hint: 'reverse-swell reverb' },
      { key: 'ghostLen', type: 'number', default: 2.2, min: 0.4, max: 6, step: 0.01, unit: 's', label: 'Ghost length', group: 'GHOST' },
    ].concat(SDK.STD_FX_CONFIG.map(c => c.key === 'mix' ? Object.assign({}, c, { default: 0.8 }) : c)),
    defaultPreset: 'Haunted Cassette',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, node = (n) => { ctx.track(n); return n; };
      const fx = SDK.fxShell(ctx);
      // screw (pitch worklet; until it loads the path is a plain wire)
      const screwIn = node(ac.createGain()), screwOut = node(ac.createGain()); fx.wetIn.connect(screwIn); screwIn.connect(screwOut);
      let pitch = null;
      ctx.loadWorklet('eravos-pitch', dsp.PITCH_WORKLET).then(() => { if (ctx.disposed) return; pitch = node(new AudioWorkletNode(ac, 'eravos-pitch', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] })); pitch.parameters.get('window').value = 0.06; applyScrew(); }).catch((e) => ctx.K.fault('RUNTIME_003', { instance_id: ctx.id, message: 'Haunt pitch unavailable — ' + e.message, quiet: !ac.audioWorklet }));
      function applyScrew() { const st = P.get('screw'); try { screwIn.disconnect(); } catch (e) {} if (pitch && st > 0.05) { pitch.parameters.get('ratio').setTargetAtTime(Math.pow(2, -st / 12), ac.currentTime, 0.05); screwIn.connect(pitch); try { pitch.disconnect(); } catch (e) {} pitch.connect(screwOut); fx.setLatency(0.03); } else { screwIn.connect(screwOut); fx.setLatency(0); } }
      // warble: one moving tap
      const wd = node(ac.createDelay(0.1)), wow = node(ac.createOscillator()), flu = node(ac.createOscillator()), wowG = node(ac.createGain()), fluG = node(ac.createGain()); wd.delayTime.value = 0.012;
      wow.connect(wowG); flu.connect(fluG); wowG.connect(wd.delayTime); fluG.connect(wd.delayTime); flu.frequency.value = 6.7; wow.start(); flu.start();
      const warbleMod = ctx.modBus('warble', { min: -0.004, max: 0.004 }); warbleMod.connect(wd.delayTime);
      screwOut.connect(wd);
      // tone
      const f1 = node(ac.createBiquadFilter()), f2 = node(ac.createBiquadFilter()); wd.connect(f1); f1.connect(f2);
      // crush
      const cr = node(ac.createWaveShaper()); f2.connect(cr);
      const pre = node(ac.createGain()); cr.connect(pre); pre.connect(fx.wetOut);
      // ghost: reversed IR
      const gConv = node(ac.createConvolver()), gSend = node(ac.createGain()), gOut = node(ac.createGain()); cr.connect(gSend); gSend.connect(gConv); gConv.connect(gOut); gOut.connect(fx.wetOut);
      const ghostMod = ctx.modBus('ghost', { min: -1, max: 1 }); ghostMod.connect(gSend.gain);
      let irLen = 0;
      function ghostIR() { const L = P.get('ghostLen'); if (Math.abs(L - irLen) < 0.02) return; irLen = L; const n = Math.floor(ac.sampleRate * L), b = ac.createBuffer(2, n, ac.sampleRate), r = dsp.mulberry32(13); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) { const t = i / n; d[n - 1 - i] = (r() * 2 - 1) * Math.pow(1 - t, 2.5); } } gConv.buffer = b; }
      // vinyl: crackle + hiss, gated by the input level (so silence stays silent-ish)
      const vBuf = (() => { const n = ac.sampleRate * 3, b = ac.createBuffer(2, n, ac.sampleRate), r = dsp.mulberry32(78); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) { d[i] = (r() * 2 - 1) * 0.04; if (r() < 0.0009) { const a = (r() * 2 - 1) * (0.4 + r() * 0.6); for (let k = 0; k < 24 && i + k < n; k++) d[i + k] += a * Math.exp(-k / 4); } } } return b; })();
      const vSrc = node(ac.createBufferSource()); vSrc.buffer = vBuf; vSrc.loop = true; const vHP = node(ac.createBiquadFilter()); vHP.type = 'highpass'; vHP.frequency.value = 700; const vG = node(ac.createGain()); vG.gain.value = 0;
      const follow = node(ac.createGain()), rect = node(ac.createWaveShaper()), lpF = node(ac.createBiquadFilter()); rect.curve = dsp.curve('abs'); lpF.type = 'lowpass'; lpF.frequency.value = 6; fx.wetIn.connect(follow); follow.connect(rect); rect.connect(lpF); lpF.connect(vG.gain);
      vSrc.connect(vHP); vHP.connect(vG); vG.connect(fx.wetOut); vSrc.start();
      function apply() {
        const t = ac.currentTime, w = P.get('warble');
        wow.frequency.setTargetAtTime(P.get('wowRate'), t, 0.05); wowG.gain.setTargetAtTime(w * 0.0035, t, 0.05); fluG.gain.setTargetAtTime(w * 0.00025, t, 0.05);
        const tone = P.get('tone'), T = { open: [['lowpass', 18000, 0.5], ['highpass', 20, 0.5]], underwater: [['lowpass', 520, 1.4], ['highpass', 40, 0.5]], radio: [['bandpass', 1500, 0.9], ['highpass', 300, 0.7]], telephone: [['bandpass', 1800, 1.6], ['highpass', 500, 1]], 'séance': [['bandpass', 900, 3], ['lowpass', 2500, 0.7]] }[tone];
        f1.type = T[0][0]; f1.frequency.setTargetAtTime(T[0][1], t, 0.05); f1.Q.value = T[0][2]; f2.type = T[1][0]; f2.frequency.setTargetAtTime(T[1][1], t, 0.05); f2.Q.value = T[1][2];
        pre.gain.setTargetAtTime(tone === 'open' ? 1 : tone === 'underwater' ? 1.6 : 2.2, t, 0.05);
        const c = P.get('crush'); cr.curve = c > 0 ? dsp.curve('crush', Math.max(2, Math.round(12 - c * 9))) : null;
        follow.gain.setTargetAtTime(P.get('vinyl') * 6, t, 0.05);
        ghostIR(); dsp.setSmooth(gSend.gain, P.get('ghost') * 0.7, ac); dsp.setSmooth(gOut.gain, 0.9, ac);
      }
      ['warble', 'wowRate', 'tone', 'crush', 'vinyl', 'ghost', 'ghostLen'].forEach(k => P.onChange(k, apply)); P.onChange('screw', applyScrew);
      apply(); applyScrew();
      ctx.internals = { f1, f2, wd, get pitch() { return pitch; } };
      return {};
    },
  });
})();
