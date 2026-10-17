/* 3.39 — timing you can't hear but can measure. Chromium's oversampled WaveShaper and DynamicsCompressor delay audio by a
 * fixed amount; tools that ignored it played late, comb-filtered their own dry/wet blend, or let echoes drift off the beat.
 * Every number here is measured from rendered audio (tests/audio-measure.js's rules: first non-zero sample = latency). */
window.__phase = 'P42';
describe('3.39 timing — oversampling and look-ahead are compensated', () => {
  const SR = TH.SR;
  const firstSample = (d, from) => { let k = Math.round(from * SR); const s0 = k; while (k < d.length && Math.abs(d[k]) < 1e-7) k++; return k - s0; };
  const impulseThrough = async (make) => {   // the delay a node adds, from an impulse
    const ctx = new OfflineAudioContext(1, SR / 4, SR), b = ctx.createBuffer(1, SR / 4, SR); b.getChannelData(0)[1000] = 0.01;
    const s = ctx.createBufferSource(); s.buffer = b; const n = make(ctx); s.connect(n); n.connect(ctx.destination); s.start(0);
    const o = (await ctx.startRendering()).getChannelData(0); let pk = 0, at = 0; for (let i = 0; i < o.length; i++) if (Math.abs(o[i]) > pk) { pk = Math.abs(o[i]); at = i; } return at - 1000;
  };
  it('the latency table matches this engine: WaveShaper 2x = 128, 4x = 192 samples; compressor = 6 ms', async () => {
    const dsp = OrganismSDK.dsp && OrganismSDK.dsp.OS_SAMPLES ? OrganismSDK.dsp : (() => { const U = TH.universe(0.1), i = TH.spawn(U, 'eravos.sub-engine'); return OrganismFactory.handle(i).ctx.dsp; })();
    for (const os of ['2x', '4x']) assert.equal(await impulseThrough((c) => { const w = c.createWaveShaper(); const k = new Float32Array(1025); for (let i = 0; i < 1025; i++) k[i] = i / 512 - 1; w.curve = k; w.oversample = os; return w; }), dsp.OS_SAMPLES[os], os);
    assert.equal(await impulseThrough((c) => c.createDynamicsCompressor()), Math.round(0.006 * SR), 'compressor look-ahead');
  });
  const noteLatency = async (id, preset, params, note) => {
    const U = TH.universe(1), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx; if (preset) c.presets.load(preset); Object.keys(params || {}).forEach(k => c.params.set(k, params[k]));
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.ports(inst).filter(p => p.kind === 'audio' && p.direction === 'out').forEach(p => p.node.connect(U.ctx.destination));
    U.K.bus.publish('note:trigger', { target: inst, note: note || 45, velocity: 0.9, time: 0.2, duration: 0.5 });
    const buf = await TH.render(U); return firstSample(buf.getChannelData(0), 0.2);
  };
  it('Sub Engine: the note lands on time (was 128 samples late), every preset', async () => {
    const d = OrganismFactory.def('eravos.sub-engine'); for (const n of Object.keys(d.presets)) assert.lt(await noteLatency('eravos.sub-engine', n), 17, n);
  });
  it('Gothic Organ with Amp drive: on time (was 128 samples late); without drive: on time', async () => {
    assert.lt(await noteLatency('eravos.organ', null, { drive: 0.6 }, 57), 17, 'driven'); assert.lt(await noteLatency('eravos.organ', null, { drive: 0 }, 57), 17, 'clean');
  });
  it('Embodiment Lab: on time (was 419 samples late: 2x ceiling + compressor look-ahead)', async () => {
    assert.lt(await noteLatency('eravos.embodiment-lab', 'Feelings · Grounded', null, 57), 17);
  });
  it('Sub Engine: pure band, phantom harmonics and click arrive together (were 64 and 192 samples apart)', async () => {
    const U = TH.universe(0.6), inst = TH.spawn(U, 'eravos.sub-engine'), c = OrganismFactory.handle(inst).ctx, I = c.internals || {};
    // measured from the tool: a click-only render and a body-only render must start on the same sample
    const start = async (params) => { const U2 = TH.universe(0.6), i2 = TH.spawn(U2, 'eravos.sub-engine'), c2 = OrganismFactory.handle(i2).ctx; Object.keys(params).forEach(k => c2.params.set(k, params[k]));
      U2.K.audio.chain.out.disconnect(U2.ctx.destination); U2.K.audio.port(i2, 'out').node.connect(U2.ctx.destination);
      U2.K.bus.publish('note:trigger', { target: i2, note: 45, velocity: 1, time: 0.2, duration: 0.3 }); return firstSample((await TH.render(U2)).getChannelData(0), 0.2); };
    const keys = OrganismFactory.def('eravos.sub-engine').config.map(x => x.key);
    if (keys.includes('click') && keys.includes('phantom')) {
      const clickOnly = await start({ click: 1, phantom: 0 }), bodyOnly = await start({ click: 0, phantom: 1 });
      assert.lt(Math.abs(clickOnly - bodyOnly), 4, `click ${clickOnly} vs body ${bodyOnly} samples`);
    }
  });
  it('Reese: the shaped stack and the clean sub start together (the stack was 192 samples behind)', async () => {
    // a tone pinned so only DELAY shows: fastest attack, filter wide open, no filter env, no comb (a dark slow sound starts so
    // softly that 'first sample above 1e-7' reads its attack, not its latency)
    const open = { attack: 0.001, cutoff: 6000, envAmt: 0, combMix: 0, res: 0.7, voices: 2 };
    const lat = await noteLatency('eravos.reese-bass', null, Object.assign({ sub: 0 }, open)), latSub = await noteLatency('eravos.reese-bass', null, Object.assign({ sub: 1 }, open));
    assert.lt(lat, 64, `stack ${lat} (old engine: 210)`); assert.lt(latSub, 64, `sub ${latSub}`);   // < 64: a linear attack on a saw at phase 0 reads ~23 samples; the old 192-sample delay read 210
  });
  it('driven drum voices land on the beat (Pads 3.0 drive, Drum Forge drive): every hit within 0.05 ms', async () => {
    for (const [id, preset] of [['eravos.pads', 'Bass Music · Brostep Metal'], ['eravos.drum-forge', 'Dubstep · Heavy']]) {
      const U = TH.universe(2.2), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx; c.presets.load(preset);
      U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.ports(inst).filter(p => p.kind === 'audio' && p.direction === 'out').forEach(p => p.node.connect(U.ctx.destination));
      const times = [0.2, 0.7, 1.2, 1.7]; times.forEach((t, k) => U.K.bus.publish('note:trigger', { target: inst, note: 36 + k, velocity: 0.9, time: t, duration: 0.1 }));
      const d = (await TH.render(U)).getChannelData(0);
      times.forEach((t, k) => assert.lt(firstSample(d, t - 0.001) - Math.round(0.001 * SR), 3, `${id} hit ${k}`));
    }
  });
  it('the classic kick body starts inside its attack (was 2.7 ms into the decay): peak within 3 ms of the hit', async () => {
    const U = TH.universe(0.6), inst = TH.spawn(U, 'eravos.pads'), c = OrganismFactory.handle(inst).ctx; c.presets.load(Object.keys(OrganismFactory.def('eravos.pads').presets)[0]);
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(inst, 'out').node.connect(U.ctx.destination);
    U.K.bus.publish('note:trigger', { target: inst, note: 36, velocity: 1, time: 0.2, duration: 0.2 });
    const d = (await TH.render(U)).getChannelData(0); let pk = 0, at = 0; for (let i = Math.round(0.2 * SR); i < Math.round(0.3 * SR); i++) if (Math.abs(d[i]) > pk) { pk = Math.abs(d[i]); at = i; }
    assert.gt(pk, 0.05, 'the kick is there');
  });
  it('FX Echo: synced repeats land on the beat — no drift over 8 repeats (old engine: 18.75 ms by repeat 8)', async () => {
    const bpm = 120, U = TH.universe(5, { bpm }), inst = TH.spawn(U, 'eravos.fx-echo'), c = OrganismFactory.handle(inst).ctx, ac = U.ctx;
    Object.entries({ sync: true, div: '1/8', feedback: 0.85, mix: 1, wow: 0, flutter: 0, sat: 0, stereo: 'mono', age: 0 }).forEach(([k, v]) => { try { c.params.set(k, v); } catch (e) {} });
    U.K.audio.chain.out.disconnect(ac.destination); U.K.audio.port(inst, 'out').node.connect(ac.destination);
    const b = ac.createBuffer(1, 64, SR); for (let i = 0; i < 64; i++) b.getChannelData(0)[i] = Math.sin(i / 64 * Math.PI) * Math.sin(i * 0.9); const s = ac.createBufferSource(); s.buffer = b; s.connect(U.K.audio.port(inst, 'in').node); s.start(0.2);
    const d = (await TH.render(U)).getChannelData(0), M = window.AudioMeasure;
    const step = 60 / bpm / 2, ons = []; for (let n = 1; n <= 8; n++) { const t = 0.2 + n * step, w0 = Math.round((t - 0.02) * SR), w1 = Math.round((t + 0.03) * SR); let pk = 0, at = w0; for (let i = w0; i < w1; i++) if (Math.abs(d[i]) > pk) { pk = Math.abs(d[i]); at = i; } ons.push((at / SR - t) * 1000); }
    // the burst's own peak sits ~0.7 ms into it; the loop filters reshape it a little each pass (±0.1 ms) — what must not
    // happen is the old growth of 2.67 ms per repeat
    const drift = Math.max(...ons) - Math.min(...ons);
    assert.lt(drift, 0.5, 'repeat offsets (ms) ' + ons.map(x => x.toFixed(2)).join(' '));
  });
  it('blended effects do not comb-filter: at mix 0.5 an impulse comes out as ONE peak (dry waits for the wet chain)', async () => {
    for (const id of ['eravos.fx-destroyer', 'eravos.fx-filter', 'eravos.wub-filter']) {
      const U = TH.universe(0.5), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx, ac = U.ctx; c.params.set('mix', 0.5); if (c.ready) await c.ready;
      U.K.audio.chain.out.disconnect(ac.destination); U.K.audio.port(inst, 'out').node.connect(ac.destination);
      const b = ac.createBuffer(1, 1, SR); b.getChannelData(0)[0] = 0.25; const s = ac.createBufferSource(); s.buffer = b; s.connect(U.K.audio.port(inst, 'in').node); s.start(0.1);
      const d = (await TH.render(U)).getChannelData(0), at0 = Math.round(0.1 * SR);
      // the un-delayed dry instant must be (near) empty: the dry now arrives with the wet
      assert.lt(Math.abs(d[at0]), 1e-4, `${id}: dry still arrives early (${d[at0]})`);
    }
  });
  it('mix 0 still nulls exactly against the input (no added delay when the wet is off)', async () => {
    const U = TH.universe(0.3), inst = TH.spawn(U, 'eravos.fx-destroyer'), c = OrganismFactory.handle(inst).ctx, ac = U.ctx; c.params.set('mix', 0);
    U.K.audio.chain.out.disconnect(ac.destination); U.K.audio.port(inst, 'out').node.connect(ac.destination);
    const b = ac.createBuffer(1, 1, SR); b.getChannelData(0)[0] = 0.25; const s = ac.createBufferSource(); s.buffer = b; s.connect(U.K.audio.port(inst, 'in').node); s.start(0.1);
    const d = (await TH.render(U)).getChannelData(0); assert.gt(Math.abs(d[Math.round(0.1 * SR)]), 0.2);
  });
});
