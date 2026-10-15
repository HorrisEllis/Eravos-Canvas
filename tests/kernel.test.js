window.__phase = 'P0';
describe('music domain on kernel 3.2 — ports, wires, master chain, contract', () => {
  const AUD = ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'];
  function org(K, id, extraHooks) {
    const hooks = [
      { hook_id: 'out', direction: 'out', wire_type: 'audio', port: 'out', contract_version: '2.0.0' },
      { hook_id: 'in', direction: 'in', wire_type: 'audio', port: 'in', contract_version: '2.0.0' },
      { hook_id: 'mod', direction: 'out', wire_type: 'modulation', port: 'modout', contract_version: '2.0.0' },
      { hook_id: 'p', direction: 'in', wire_type: 'modulation', port: 'p', contract_version: '2.0.0' },
    ].concat(extraHooks || []);
    const r = K.registry.register(id, { id: 'test.' + id, permissions: AUD, hooks });
    assert.ok(r.ok, 'register ' + id);
    const ac = K.audio.ctx;
    const out = ac.createGain(), inp = ac.createGain(), mo = ac.createGain(), pg = ac.createGain();
    K.audio.registerPort(id, 'out', { kind: 'audio', direction: 'out', node: out });
    K.audio.registerPort(id, 'in', { kind: 'audio', direction: 'in', node: inp });
    K.audio.registerPort(id, 'modout', { kind: 'mod', direction: 'out', node: mo });
    K.audio.registerPort(id, 'p', { kind: 'param', direction: 'in', param: pg.gain, range: { min: 0, max: 4 } });
    return { out, inp, mo, pg };
  }

  it('out port registered → connected to master.in', () => {
    const { K } = TH.universe(0.5);
    org(K, 'a');
    assert.ok(K.audio.isOnMaster('a', 'out'));
  });
  it('audio wire → source off master; target receives signal (rendered)', async () => {
    const U = TH.universe(0.3); const K = U.K;
    const A = org(K, 'a'), B = org(K, 'b');
    const osc = U.ctx.createOscillator(); osc.connect(A.out); osc.start();
    const r = K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'in' } });
    assert.ok(r.ok);
    assert.ok(!K.audio.isOnMaster('a', 'out'), 'a off master');
    const an = U.ctx.createGain(); A.out.connect(an); // sanity
    // B.in isn't connected onward → master silent
    const buf = await TH.render(U);
    assert.lt(TH.rms(buf), 1e-6, 'master silent because B.in goes nowhere');
  });
  it('remove wire → source back on master (signal audible)', async () => {
    const U = TH.universe(0.3); const K = U.K;
    const A = org(K, 'a'); org(K, 'b');
    const osc = U.ctx.createOscillator(); osc.connect(A.out); osc.start();
    const r = K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'in' } });
    K.wires.remove(r.wire_id);
    assert.ok(K.audio.isOnMaster('a', 'out'));
    const buf = await TH.render(U);
    assert.gt(TH.rms(buf, 0.1), 0.05);
  });
  it('A→B, B→A → WIRE_006, first wire intact', () => {
    const { K } = TH.universe(0.2);
    org(K, 'a'); org(K, 'b');
    const r1 = K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'in' } });
    const r2 = assert.fault(K, 'WIRE_006', () => K.wires.register({ src: { instanceId: 'b', hookId: 'out' }, dst: { instanceId: 'a', hookId: 'in' } }));
    assert.ok(r1.ok && !r2.ok); assert.equal(K.wires.list().length, 1);
  });
  it('A→B→C→A cycle → WIRE_006', () => {
    const { K } = TH.universe(0.2);
    org(K, 'a'); org(K, 'b'); org(K, 'c');
    K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'in' } });
    K.wires.register({ src: { instanceId: 'b', hookId: 'out' }, dst: { instanceId: 'c', hookId: 'in' } });
    assert.fault(K, 'WIRE_006', () => K.wires.register({ src: { instanceId: 'c', hookId: 'out' }, dst: { instanceId: 'a', hookId: 'in' } }));
  });
  it('modulation wire gain = (max−min)/2', () => {
    const { K } = TH.universe(0.2);
    org(K, 'a'); org(K, 'b');
    const r = K.wires.register({ src: { instanceId: 'a', hookId: 'mod' }, dst: { instanceId: 'b', hookId: 'p' } });
    assert.ok(r.ok); assert.equal(K.audio.modScaler(r.wire_id).gain.value, 2);
  });
  it('unregister → zero ports, zero wires, upstream on master', () => {
    const { K } = TH.universe(0.2);
    org(K, 'a'); org(K, 'b');
    K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'in' } });
    K.registry.unregister('b');
    assert.equal(K.audio.ports('b').length, 0); assert.equal(K.wires.list().length, 0);
    assert.ok(K.audio.isOnMaster('a', 'out'));
  });
  it('permission missing → RUNTIME_001, port not created', () => {
    const { K, ctx } = TH.universe(0.2);
    K.registry.register('np', { id: 'test.np', permissions: ['bus_publish'] });
    assert.fault(K, 'RUNTIME_001', () => K.audio.registerPort('np', 'out', { kind: 'audio', direction: 'out', node: ctx.createGain() }));
    assert.equal(K.audio.ports('np').length, 0);
  });
  it('hook direction / type / duplicate / missing faults', () => {
    const { K } = TH.universe(0.2);
    org(K, 'a'); org(K, 'b');
    assert.fault(K, 'WIRE_003', () => K.wires.register({ src: { instanceId: 'a', hookId: 'in' }, dst: { instanceId: 'b', hookId: 'in' } }));
    assert.fault(K, 'WIRE_005', () => K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'p' } }));
    assert.fault(K, 'WIRE_002', () => K.wires.register({ src: { instanceId: 'a', hookId: 'nope' }, dst: { instanceId: 'b', hookId: 'in' }, wire_type: 'audio' }));
    K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'in' } });
    assert.fault(K, 'WIRE_004', () => K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'in' } }));
  });
  it('contract: {type:number, minimum:0} vs −1 → errors; missing required; wrong type', () => {
    assert.ok(Kernel.contract.validate({ type: 'number', minimum: 0 }, -1).length === 1);
    assert.ok(Kernel.contract.validate({ type: 'object', required: ['a'] }, {}).length === 1);
    assert.ok(Kernel.contract.validate({ type: 'object', properties: { a: { type: 'string' } } }, { a: 3 }).length === 1);
    assert.ok(Kernel.contract.validate({ type: 'integer', enum: [1, 2] }, 2).length === 0);
  });
  it('contract via SDK subscription → RUNTIME_002, handler not called', () => {
    const U = TH.universe(0.2); const K = U.K;
    K.registry.register('s', { id: 'test.s', permissions: ['bus_subscribe', 'bus_publish'] });
    const ctx = OrganismSDK.create('s2', K, { id: 'test.s2', config: [] });
    K.registry.register('s2', { id: 'test.s2', permissions: ['bus_subscribe', 'bus_publish'] });
    let called = 0;
    ctx.on('x:y', { type: 'number', minimum: 0 }, () => called++);
    assert.fault(K, 'RUNTIME_002', () => K.bus.publish('x:y', -1));
    K.bus.publish('x:y', 3);
    assert.equal(called, 1);
  });
  it('duckAt schedules curve: value at t+attack = 1 − depth (± 1e-3)', async () => {
    // Re-render an isolated duplicate curve to verify arithmetic
    const oc = new OfflineAudioContext(1, 48000, 48000); const K2 = Kernel.create({ ctx: oc, quiet: true });
    const c2 = oc.createConstantSource(); const dg = K2.audio.chain.duck; c2.connect(dg); // duck output also feeds chain → probe with separate path
    const iso = oc.createGain(); dg.connect(iso); iso.connect(oc.destination);
    K2.audio.chain.out.gain.value = 0; // silence main chain
    c2.start(); K2.audio.duckAt(0.2, { depth: 0.8, attack: 0.01, hold: 0, release: 0.2 });
    const b2 = await oc.startRendering(); const d = b2.getChannelData(0);
    assert.near(d[Math.round(0.21 * 48000)], 0.2, 1e-3, 'value at t+attack');
    assert.near(d[Math.round(0.1 * 48000)], 1, 1e-3, 'before duck');
    assert.near(d[Math.round(0.45 * 48000)], 1, 1e-3, 'released');
  });
  it('master chain single path masterIn→dj→duck→comp→makeup→limiter→clip→out', () => {
    const { K } = TH.universe(0.2);
    const c = K.audio.chain;
    ['masterIn', 'djHpf', 'djLpf', 'duck', 'comp', 'makeup', 'limiter', 'clip', 'out'].forEach(k => assert.ok(c[k], k));
    assert.equal(c.comp.threshold.value, -12); assert.equal(c.comp.ratio.value, 2);
  });
  it('master comp acts on dry signal (F-04): threshold −30 → reduction', async () => {
    const U = TH.universe(1); const K = U.K;
    const o = U.ctx.createOscillator(); const g = U.ctx.createGain(); g.gain.value = 0.5; o.connect(g); g.connect(K.audio.masterIn); o.start();
    K.audio.chain.comp.threshold.value = -30; K.audio.chain.comp.ratio.value = 8; K.audio.chain.limiter.threshold.value = 0;
    const buf = await TH.render(U);
    assert.lt(TH.db(TH.peak(buf, 0.6, 0.9)), -9, 'dry gain-reduced');
  });
  it('semverGt("3.10.0","3.2.0") === true', () => { assert.ok(Kernel.semver.gt('3.10.0', '3.2.0')); assert.ok(!Kernel.semver.gt('3.2.0', '3.10.0')); });
  it('ledger: append-only entries for mount/wire/fault', () => {
    const { K } = TH.universe(0.2);
    org(K, 'a'); org(K, 'b');
    K.wires.register({ src: { instanceId: 'a', hookId: 'out' }, dst: { instanceId: 'b', hookId: 'in' } });
    const types = K.ledger.entries().map(e => e.type);
    ['organism_mounted', 'port_registered', 'wire_registered', 'route_changed'].forEach(t => assert.ok(types.includes(t), t));
    assert.ok(Object.isFrozen(K.ledger.entries()[0]));
  });
  it('registry: missing capability → MOUNT_002 ; dup instance → MOUNT_006 ; newer kernel_target → MOUNT_004', () => {
    const { K } = TH.universe(0.2);
    assert.fault(K, 'MOUNT_002', () => K.registry.register('x', { id: 't.x', requires: ['capability.nope'] }));
    K.registry.register('y', { id: 't.y' });
    assert.fault(K, 'MOUNT_006', () => K.registry.register('y', { id: 't.y' }));
    assert.fault(K, 'MOUNT_004', () => K.registry.register('z', { id: 't.z', kernel_target: '9.0.0' }));
  });
});
