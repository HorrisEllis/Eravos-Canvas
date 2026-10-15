/* eravos.channel 2.0.0 — Channel Strip (P3) · resolves F-09
 * in → trim → HPF(18 dB: 2nd-order biquad + 1st-order IIR) → EQ[lowshelf 120, peak, highshelf 8k] → drive → pan → fader → mute → out
 * post-fader sends → kernel reverbSend / delaySend ; post-fader tap → splitter → L/R analysers (true dBFS)
 * solo-in-place across instances via bus mixer:solo. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const faderLaw = { // dB −inf..+6 with 0 dB at 75 % travel
    toN: (db) => db <= -60 ? 0 : db <= 0 ? 0.75 * Math.pow((db + 60) / 60, 2) : 0.75 + (db / 6) * 0.25,
    fromN: (n) => n <= 0.001 ? -60 : n <= 0.75 ? +(Math.sqrt(n / 0.75) * 60 - 60).toFixed(1) : +(((n - 0.75) / 0.25) * 6).toFixed(1),
  };
  OrganismFactory.define({
    id: 'eravos.channel', domain: 'music', version: '2.0.0', label: 'Channel', icon: '🎚', accent: '#6a88a8', phase: 'P3',
    category: 'Mix', blurb: 'A real mixer channel: wire any sound into it for volume, EQ, pan, reverb/echo send, meter.',
    size: { w: 280, h: 600 }, minSize: { w: 220, h: 440 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.channel_strip', 'capability.audio_out', 'capability.audio_in'],
    hooks: [
      Object.assign(S.audio_in('ch.hook.audio_in', 'in'), { contract_version: '2.0.0' }),
      S.audio_out('ch.hook.audio_out'),
      S.event('ch.hook.solo_io', 'inout', 'mixer:solo', { type: 'object', required: ['instanceId', 'on'] }, '1.0.0'),
      S.mod_in('ch.hook.mod_pan', 'pan'), S.mod_in('ch.hook.mod_fader', 'fader'),
    ],
    config: [
      { key: 'name', type: 'string', default: 'CH', label: 'Name', group: 'CH' },
      { key: 'trim', type: 'number', default: 0, min: -24, max: 24, step: 0.1, unit: 'dB', label: 'Trim', group: 'IN' },
      { key: 'hpf', type: 'number', default: 0, min: 0, max: 400, step: 1, unit: 'Hz', label: 'Low cut', group: 'IN', curve: 'lin' },
      { key: 'phase', type: 'boolean', default: false, label: 'Ø', hint: 'phase invert — flips the waveform upside down', group: 'IN' },
      { key: 'low', type: 'number', default: 0, min: -15, max: 15, step: 0.1, unit: 'dB', label: 'Low', group: 'EQ' },
      { key: 'midFreq', type: 'number', default: 1000, min: 200, max: 6000, step: 1, unit: 'Hz', label: 'Mid Hz', group: 'EQ' },
      { key: 'midQ', type: 'number', default: 1, min: 0.3, max: 6, step: 0.01, label: 'Mid Q', group: 'EQ' },
      { key: 'mid', type: 'number', default: 0, min: -15, max: 15, step: 0.1, unit: 'dB', label: 'Mid', group: 'EQ' },
      { key: 'high', type: 'number', default: 0, min: -15, max: 15, step: 0.1, unit: 'dB', label: 'High', group: 'EQ' },
      { key: 'drive', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'SEND' },
      { key: 'sendRev', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Reverb', group: 'SEND' },
      { key: 'sendDel', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Echo', group: 'SEND' },
      { key: 'pan', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Pan', group: 'OUT' },
      { key: 'fader', type: 'number', default: 0, min: -60, max: 6, step: 0.1, unit: 'dB', label: 'Fader', group: 'OUT' },
      { key: 'mute', type: 'boolean', default: false, label: 'M', group: 'OUT' },
      { key: 'solo', type: 'boolean', default: false, label: 'S', group: 'OUT' },
    ],
    ui_hooks: ['clip_reset', 'request_source'],
    faderLaw,
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp;
      if (P.get('name') === 'CH') P.set('name', 'CH ' + (ctx.K.registry.byOrganism('eravos.channel').length), { noEcho: true });
      const inp = ac.createGain(), trim = ac.createGain();
      inp.channelCount = 2; inp.channelCountMode = 'explicit'; inp.channelInterpretation = 'speakers'; // mono sources → L=R (0 dB centre pan law)
      const hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.Q.value = 0.707;
      let hp1 = null; const hpWrap = ac.createGain();
      const low = ac.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 120;
      const mid = ac.createBiquadFilter(); mid.type = 'peaking';
      const high = ac.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 8000;
      const drv = ac.createWaveShaper(), drvIn = ac.createGain(), drvOut = ac.createGain();
      const pan = ac.createStereoPanner(), fader = ac.createGain(), muteG = ac.createGain(), out = ac.createGain();
      inp.connect(trim); trim.connect(hp2); hp2.connect(hpWrap);
      function buildHp1() {
        // 1st-order section (6 dB) completing the 18 dB slope; IIR coefficients depend on fc → rebuild
        const f = P.get('hpf');
        if (hp1) { try { hpWrap.disconnect(hp1); hp1.disconnect(); } catch (e) {} } else { try { hpWrap.disconnect(); } catch (e) {} }
        if (f <= 0) { hp1 = null; hpWrap.connect(low); hp2.frequency.value = 1; return; }
        hp2.frequency.value = f;
        const K = Math.tan(Math.PI * f / ac.sampleRate), a0 = 1 + K;
        hp1 = ac.createIIRFilter([1 / a0, -1 / a0], [1, (K - 1) / a0]);
        hpWrap.connect(hp1); hp1.connect(low);
      }
      low.connect(mid); mid.connect(high); high.connect(drvIn); drvIn.connect(drv); drv.connect(drvOut); drvOut.connect(pan); pan.connect(fader); fader.connect(muteG); muteG.connect(out);
      const sR = ac.createGain(), sD = ac.createGain(); muteG.connect(sR); muteG.connect(sD);
      sR.connect(ctx.K.audio.reverbSend); sD.connect(ctx.K.audio.delaySend);
      const split = ac.createChannelSplitter(2), anL = ac.createAnalyser(), anR = ac.createAnalyser(); anL.fftSize = anR.fftSize = 1024;
      muteG.connect(split); split.connect(anL, 0); split.connect(anR, 1);
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, label: 'input' });
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'channel' });
      const panMod = ctx.modBus('pan', { min: -1, max: 1 }); panMod.connect(pan.pan);
      const fadMod = ctx.modBus('fader', { min: 0, max: 2 }); fadMod.connect(fader.gain);
      [inp, trim, hp2, hpWrap, low, mid, high, drv, drvIn, drvOut, pan, fader, muteG, out, sR, sD, split, anL, anR].forEach(n => ctx.track(n));
      const soloSet = new Set();
      function effMute() { return P.get('mute') || (soloSet.size > 0 && !soloSet.has(ctx.id)); }
      function apply() {
        const t = ac.currentTime, sm = (p, v) => p.setTargetAtTime(v, t, 0.01);
        sm(trim.gain, dsp.dbToGain(P.get('trim')) * (P.get('phase') ? -1 : 1));
        low.gain.setTargetAtTime(P.get('low'), t, 0.01); mid.gain.setTargetAtTime(P.get('mid'), t, 0.01); high.gain.setTargetAtTime(P.get('high'), t, 0.01);
        mid.frequency.setTargetAtTime(P.get('midFreq'), t, 0.01); mid.Q.value = P.get('midQ');
        const d = P.get('drive'); drv.curve = d > 0 ? dsp.curve('tanh', d) : null; drvIn.gain.value = 1; drvOut.gain.value = d > 0 ? 1 / (0.6 + 0.4 * dsp.curveRms(drv.curve) / 0.707) : 1;
        sm(pan.pan, P.get('pan'));
        const fd = P.get('fader'); sm(fader.gain, fd <= -60 ? 0 : dsp.dbToGain(fd));
        sm(muteG.gain, effMute() ? 0 : 1);
        sm(sR.gain, P.get('sendRev')); sm(sD.gain, P.get('sendDel'));
      }
      buildHp1(); apply();
      P.onChange('hpf', buildHp1);
      P.onChange('*', (v, prev, k) => { if (k !== 'hpf' && k !== 'name' && k !== 'solo') apply(); });
      P.onChange('solo', (on) => { ctx.emit('mixer:solo', { instanceId: ctx.id, on: !!on }); });
      ctx.on('mixer:solo', { type: 'object', required: ['instanceId', 'on'] }, (p) => { if (p.on) soloSet.add(p.instanceId); else soloSet.delete(p.instanceId); apply(); ctx.syncUI(); });
      ctx.on('kernel:organism-unmounted', null, (p) => { if (soloSet.delete(p.instanceId)) apply(); });
      // meter (true dBFS, peak hold 1.5 s, clip latch ≥ −0.1 dBFS)
      const bl = new Float32Array(1024), br = new Float32Array(1024);
      const rmsWin = []; let holdL = -120, holdR = -120, holdT = 0, clip = false;
      function measure() {
        anL.getFloatTimeDomainData(bl); anR.getFloatTimeDomainData(br);
        let pL = 0, pR = 0, sL = 0, sRr = 0;
        for (let i = 0; i < 1024; i++) { const a = Math.abs(bl[i]), b = Math.abs(br[i]); if (a > pL) pL = a; if (b > pR) pR = b; sL += bl[i] * bl[i]; sRr += br[i] * br[i]; }
        rmsWin.push([sL / 1024, sRr / 1024]); if (rmsWin.length > 9) rmsWin.shift(); // ≈300 ms at 33 ms
        const mL = rmsWin.reduce((a, x) => a + x[0], 0) / rmsWin.length, mR = rmsWin.reduce((a, x) => a + x[1], 0) / rmsWin.length;
        const peakL = 20 * Math.log10(pL + 1e-12), peakR = 20 * Math.log10(pR + 1e-12);
        const now = ac.currentTime;
        if (peakL > holdL || peakR > holdR || now - holdT > 1.5) { holdL = Math.max(peakL, now - holdT > 1.5 ? -120 : holdL); holdR = Math.max(peakR, now - holdT > 1.5 ? -120 : holdR); holdT = now; }
        if (peakL >= -0.1 || peakR >= -0.1) clip = true;
        return { peakL, peakR, rmsL: 10 * Math.log10(mL + 1e-24), rmsR: 10 * Math.log10(mR + 1e-24), holdL, holdR, clip };
      }
      ctx.measure = measure;
      ctx.interval(() => ctx.emitUI('meter', measure()), 33);
      ctx.onUI('clip_reset', null, () => { clip = false; });
      // colour/label follow the first wired source
      function source() {
        const w = ctx.K.wires.list().find(w => w.dst.instanceId === ctx.id && w.wire_type === 'audio');
        const r = w && ctx.K.registry.get(w.src.instanceId);
        ctx.emitUI('source', r ? { label: (r.descriptor.icon || '') + ' ' + r.descriptor.label, accent: r.descriptor.accent || '#6a88a8' } : { label: 'no input — wire a sound in', accent: '#6a88a8' });
      }
      ctx.on('kernel:wire-registered', null, (w) => { if (w.dst.instanceId === ctx.id) source(); });
      ctx.on('kernel:wire-removed', null, (w) => { if (w.dst && w.dst.instanceId === ctx.id) source(); });
      ctx.stateExtra = () => ({ soloActive: soloSet.size > 0, effMute: effMute() });
      ctx.onUI('request_source', null, source);
      setTimeout(source, 0);
      return { unmount() { if (P.get('solo')) ctx.emit('mixer:solo', { instanceId: ctx.id, on: false }); } };
    },
  });
})();
