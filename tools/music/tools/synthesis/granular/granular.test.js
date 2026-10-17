/* Granular (eravos.granular) — the shared contract, then its own: live cloud, freeze, pitch, clip mode, as a mod */
TH.toolContract('eravos.granular');
describe('tool · Granular — any sound into grains', () => {
  const SR = TH.SR;
  async function cloud(params, sec, feed, prep) {
    const U = TH.universe(sec || 1.6), g = TH.spawn(U, 'eravos.granular'), c = OrganismFactory.handle(g).ctx;
    c.params.setMany(Object.assign({ mix: 1, position: 0.8, spray: 0.05, size: 0.08, density: 40, pitch: 0, pitchSpray: 0, reverse: 0, feedback: 0, freeze: false, keys: false, sync: 'off', memory: 1 }, params || {}));
    await c.ready; if (prep) await prep(U, g, c);
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(g, 'out').node.connect(U.ctx.destination);
    if (feed !== false) { const o = U.ctx.createOscillator(), a = U.ctx.createGain(); o.frequency.value = 220; a.gain.value = 0.4; o.connect(a); a.connect(U.K.audio.port(g, 'in').node); o.start(0); o.stop(feed || 0.7); }
    return { b: await TH.render(U), U, g, c };
  }
  it('makes a cloud of what is wired in, at the input’s pitch', async () => {
    const { b } = await cloud({ density: 12, size: 0.08 }); assert.gt(TH.db(TH.rms(b, 0.4, 0.7)), -36, 'heard');   // ~1 grain at a time: a clean period to measure
    const hz = TH.acFreq(b, 0.4, 0.65, 80, 1000); assert.lt(Math.abs(1200 * Math.log2(hz / 220)), 20, hz.toFixed(1) + ' Hz');
  });
  it('without Freeze the cloud fades when the input stops; with Freeze it keeps sounding', async () => {
    const a = await cloud({ freeze: false, memory: 0.4 }, 2.2, 0.6);
    assert.lt(TH.db(TH.rms(a.b, 1.6, 2.1)), -50, 'the memory emptied out');
    const f = await cloud({ memory: 0.4 }, 2.2, 0.9, async (U, g, c) => { U.ctx.suspend(0.7).then(() => { c.params.set('freeze', true); U.ctx.resume(); }); });
    assert.gt(TH.db(TH.rms(f.b, 1.6, 2.1)), -30, 'frozen cloud still sounding a second after the input stopped');
  });
  it('pitch +12 plays the cloud an octave up', async () => {
    const { b } = await cloud({ pitch: 12, size: 0.06 }); const hz = TH.acFreq(b, 0.4, 0.65, 80, 2000);
    assert.lt(Math.abs(1200 * Math.log2(hz / 440)), 25, hz.toFixed(1) + ' Hz');
  });
  it('grains start and end at zero — no clicks even with dense tiny grains', async () => {
    const { b } = await cloud({ size: 0.01, density: 300, shape: 0.2 }); const d = b.getChannelData(0); let jump = 0;
    for (let i = Math.round(0.3 * SR); i < Math.round(0.65 * SR); i++) jump = Math.max(jump, Math.abs(d[i] - d[i - 1]));
    assert.lt(jump, 0.12, 'largest sample step ' + jump.toFixed(3));
  });
  it('clip mode: a loaded clip plays as a cloud with nothing wired in', async () => {
    const { b } = await cloud({ position: 0.5, spray: 0.3 }, 1.2, false, async (U, g, c) => {
      const buf = new AudioBuffer({ numberOfChannels: 1, length: SR, sampleRate: SR }), x = buf.getChannelData(0); for (let i = 0; i < SR; i++) x[i] = 0.5 * Math.sin(2 * Math.PI * 330 * i / SR);
      const a = U.K.audio.putBuffer(buf, { name: 'tone.wav' }); U.K.bus.publish('asset:ready', { target: g, hash: a.hash, name: 'tone.wav' }); await TH.sleep(80);
    });
    assert.gt(TH.db(TH.rms(b, 0.4, 1.0)), -30, 'the clip is heard'); const hz = TH.acFreq(b, 0.4, 0.8, 80, 1000); assert.lt(Math.abs(1200 * Math.log2(hz / 330)), 25, hz.toFixed(1));
  });
  it('works as a mod: inside the Destroyer it clouds what the Destroyer hears', async () => {
    const U = TH.universe(1.4), d = TH.spawn(U, 'eravos.fx-destroyer'), dc = OrganismFactory.handle(d).ctx; dc.params.setMany({ drive: 0.1 }); await dc.ready;
    const kid = Mods.childOf(d, Mods.add(d, 'after', 'eravos.granular')), kc = OrganismFactory.handle(kid).ctx; kc.params.setMany({ mix: 1, freeze: false, memory: 0.5, position: 0.8, density: 40 }); await kc.ready;
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(d, 'out').node.connect(U.ctx.destination);
    const o = U.ctx.createOscillator(), a = U.ctx.createGain(); o.frequency.value = 220; a.gain.value = 0.3; o.connect(a); a.connect(U.K.audio.port(d, 'in').node); o.start(0); o.stop(0.6);
    const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.62, 0.9)), -45, 'the cloud rings on after the input stopped (memory 0.5 s)');
  });
});
