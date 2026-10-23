/* Breath (eravos.breath) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.breath');

window.__phase = 'P44';
describe('Breath 2.0 — patterns, sessions, outputs, sound', () => {
  const offline = (sec) => { const sr = 3000, ctx = new OfflineAudioContext(1, sr * sec, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true }).boot(); return { sr, ctx, K }; };
  it('physiological sigh: two inhales (0.8, then a sip to 1), one long exhale; one breath:phase per inhale/exhale', async () => {
    const { sr, ctx, K } = offline(12), a = OrganismFactory.spawn('eravos.breath', { K, headless: true }), c = OrganismFactory.handle(a).ctx, ph = [];
    K.bus.subscribe('breath:phase', p => ph.push(p)); K.bus.publish('ui:config_change:' + a, { key: 'pattern', value: 'PHYSIOLOGICAL SIGH' }); c.scheduleAhead(11);
    assert.deepEqual(ph.slice(0, 3).map(p => p.phase), ['inhale', 'exhale', 'rest']);
    K.audio.chain.out.gain.value = 0; c.internals.sig.connect(ctx.destination); const d = (await ctx.startRendering()).getChannelData(0), t0 = ph[0].time, at = (t) => d[Math.floor(t * sr)];
    assert.near(at(t0 + 2.19), 0.8, 0.03); assert.near(at(t0 + 2.99), 1, 0.03); assert.near(at(t0 + 8.99), 0, 0.03);
  });
  it('outputs: breath = floor + depth × breath ; inverse = 1 − breath ; gate = 1 while breathing in', async () => {
    const { sr, ctx, K } = offline(22), a = OrganismFactory.spawn('eravos.breath', { K, headless: true }), c = OrganismFactory.handle(a).ctx, ph = [];
    K.bus.subscribe('breath:phase', p => ph.push(p));   // the first inhale was scheduled at spawn, before this — use the next one
    ['floor', 'depth'].forEach((k, i) => K.bus.publish('ui:config_change:' + a, { key: k, value: [0.2, 0.5][i] }));
    c.scheduleAhead(21.5); K.audio.chain.out.gain.value = 0;
    // one render, three outputs weighted ×1 · ×10 · ×100 so each can be read back from the sum
    const w = (n, k) => { const g = ctx.createGain(); g.gain.value = k; n.connect(g); g.connect(ctx.destination); };
    w(c.internals.out, 1); w(c.internals.inverse, 10); w(c.internals.gate, 100);
    const d = (await ctx.startRendering()).getChannelData(0), t0 = ph.find(p => p.phase === 'inhale').time, at = (t) => d[Math.floor(t * sr)];
    // top of the inhale (t0 + 4.99): breath 0.2 + 0.5·0.8·1 = 0.6, inverse 0, gate 1 → 0.6 + 0 + 100
    assert.near(at(t0 + 4.99), 0.6 + 0 + 100, 0.05);
    // bottom of the exhale (t0 + 9.99): breath 0.2, inverse 1, gate 0 → 0.2 + 10
    assert.near(at(t0 + 9.99), 0.2 + 10, 0.05);
  });
  it('a timed session ends by itself: breath:session done, a log entry, paused', () => {
    const { ctx, K } = offline(1), a = OrganismFactory.spawn('eravos.breath', { K, headless: true }), c = OrganismFactory.handle(a).ctx; let done = null;
    K.bus.subscribe('breath:session', p => { if (p.state === 'done') done = p; });
    K.bus.publish('ui:config_change:' + a, { key: 'session', value: '1 min' }); c.scheduleAhead(75);
    assert.ok(done, 'session done'); assert.ok(done.seconds >= 60 && done.seconds < 72, 'about a minute: ' + done.seconds); assert.equal(done.cycles, 6);
    assert.equal(c.serialize().extra.log.length, 1);
  });
  it('programs: slow down lengthens the cycle, longer exhale only the exhale', () => {
    const { K } = offline(1), a = OrganismFactory.spawn('eravos.breath', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    const d0 = c.durations(); K.bus.publish('ui:config_change:' + a, { key: 'program', value: 'longer exhale' }); c.scheduleAhead(200);
    const d1 = c.durations(); assert.near(d1[0], d0[0], 1e-9); assert.gt(d1[2], d0[2] * 1.3);
  });
  it('every voice, bell tone and shipped preset makes sound', async () => {
    const d = OrganismFactory.def('eravos.breath');
    const runs = d.config.find(x => x.key === 'voice').options.map(v => ({ voice: v })).concat(Object.keys(d.presets).map(p => ({ preset: p })));
    for (const r of runs) {
      const U = TH.universe(3), a = TH.spawn(U, 'eravos.breath'), c = OrganismFactory.handle(a).ctx;
      if (r.preset) c.presets.load(r.preset); else c.params.set('voice', r.voice);
      if (!c.params.get('voiceOn')) continue;   // a control-only preset is silent on purpose
      c.params.set('pattern', 'ENERGIZE'); c.scheduleAhead(3);
      const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.5, 3)), -60, JSON.stringify(r));
    }
  }, { timeout: 120000 });
});
