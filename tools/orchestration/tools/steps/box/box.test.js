/* Box (eravos.orchestration.box) — tests that travel with the tool. The contract is shared (tests/harness.js TH.toolContract):
 * spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is
 * obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.orchestration.box');

// 2026-11-08 — box.spec's acceptance. James: "i want the tools compatable with eravos independantly. eravos is the build surface for nexus."
window.__phase = 'P152';
describe('Box — one step of a pipeline, data only', () => {
  const ctxOf = (a) => OrganismFactory.handle(a).ctx;
  const STEP = { id: 'pricing', kind: 'pipeline', ref: 'pricing-table', hooks: { in: ['in'], out: ['out'] }, contract: { requires: ['overview'], gives: ['output'] }, gate: { notEmpty: true }, args: { task: { id: 'pricing' } } };
  const KINDS = ['gate', 'system', 'agent', 'macro', 'pipeline', 'procedure', 'tool', 'build'];
  function opened(U) {
    const a = TH.spawn(U, 'eravos.orchestration.box'); const c = ctxOf(a);
    c.params.setMany({ kind: 'pipeline', ref: 'pricing-table', step: 'pricing', state: 'running' }); c.loadExtra({ box: STEP, kinds: KINDS }); return { a, c };
  }
  it('opened with a step: its kind, ref, step and whole box are what it was given', () => {
    const U = TH.universe(0.2), { c } = opened(U);
    assert.equal(c.params.get('kind'), 'pipeline'); assert.equal(c.params.get('ref'), 'pricing-table'); assert.deepEqual(c.stateExtra().box, STEP);
    assert.deepEqual(c.stateExtra().kinds, KINDS);
  });
  it('a value on in goes out once as { step, kind, ref, value }', async () => {
    const U = TH.universe(0.2), { a } = opened(U)
    const src = TH.spawn(U, 'eravos.orchestration.box'), dst = TH.spawn(U, 'eravos.orchestration.box');
    U.K.wires.register({ src: { instanceId: a, hookId: 'box.hook.out' }, dst: { instanceId: dst, hookId: 'box.hook.in' } });
    U.K.wires.register({ src: { instanceId: src, hookId: 'box.hook.out' }, dst: { instanceId: a, hookId: 'box.hook.in' } });
    U.K.data.send(src, 'out', { hello: 1 }); await new Promise(r => setTimeout(r, 20));
    const last = ctxOf(dst).stateExtra().last;
    assert.equal(last.step, 'pricing'); assert.equal(last.kind, 'pipeline'); assert.equal(last.ref, 'pricing-table'); assert.deepEqual(last.value, { hello: 1 });
  });
  it('save → load keeps the whole step and the kinds (the .erv round trip)', () => {
    const U = TH.universe(0.2), { c } = opened(U); const saved = JSON.parse(JSON.stringify(c.saveExtra()));
    const b = TH.spawn(U, 'eravos.orchestration.box'); ctxOf(b).loadExtra(saved); assert.deepEqual(ctxOf(b).saveExtra(), saved);
  });
});

// 2026-11-08 — the step on the Workshop. James: "maybe it edits steps, like it does a note, or pattern." · "okay the workshop it to edit. the
// canvas are for the tools."
window.__phase = 'P153';
describe('Box — a step opened on the Workshop, edited live', () => {
  const ctxOf = (a) => OrganismFactory.handle(a).ctx;
  const STEP = { id: 'pricing', kind: 'pipeline', ref: 'pricing-table', hooks: { in: ['in'], out: ['out'] }, contract: { requires: ['overview'], gives: ['output'] },
    gate: { notEmpty: true }, args: { task: { id: 'pricing', step: { type: 'pipeline', config: { pipeline: 'pricing-table', retries: 2 } } } } };
  const KINDS = ['gate', 'system', 'agent', 'macro', 'pipeline', 'procedure', 'tool', 'build'];
  it('the kind is accepted by the Workshop, and its layers are read from the step itself (no field is fixed)', () => {
    const K = window.EravosStepKind; assert.ok(K, 'the Box offers its kind'); assert.deepEqual(Workshop.check(K), [], 'a whole kind');
    const L = K.layers({ kind: 'pipeline', ref: 'pricing-table', step: 'pricing', state: '', kinds: KINDS, box: STEP, last: null });
    assert.deepEqual(L.map(l => [l.id, l.type]), [['gate', 'constraint'], ['step', 'value'], ['settings', 'value'], ['contract', 'value'], ['last', 'emergent']]);
    assert.deepEqual(L[0].fields.map(f => f.key), ['gate.notEmpty'], 'the gate\'s own keys');
    assert.ok(L[2].fields.some(f => f.key === 'arg.task.step.config.retries' && f.type === 'number'), 'every leaf of its settings, typed');
    assert.deepEqual(L[1].fields[0].options, KINDS, 'the kinds it was given');
  });
  it('opened from the Box: an edit in the Workshop reaches the tool at once, and undo takes it back', async () => {
    if (!Workshop.kinds().includes('orchestration.step')) assert.ok(Workshop.addKind(window.EravosStepKind).ok, 'registered as the Box\'s window does');
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.orchestration.box'), c = ctxOf(a);
    c.params.setMany({ kind: 'pipeline', ref: 'pricing-table', step: 'pricing' }); c.loadExtra({ box: STEP, kinds: KINDS });
    const send = (x) => U.K.bus.publish('ui:step_set:' + a, x);
    const ws = Workshop.open('orchestration.step', { kind: 'pipeline', ref: 'pricing-table', step: 'pricing', state: '', kinds: KINDS, box: STEP, last: null },
      { onChange: (d) => send({ params: { kind: d.kind, ref: d.ref, step: d.step, state: d.state }, box: d.box }) });
    ws.set('arg.task.step.config.retries', '4', 'retries'); await TH.sleep(10);
    assert.equal(c.stateExtra().box.args.task.step.config.retries, 4, 'a setting changed on the tool, typed');
    ws.set('kind', 'build', 'Kind'); await TH.sleep(10); assert.equal(c.params.get('kind'), 'build', 'the kind changed on the tool');
    ws.undo(); await TH.sleep(10); assert.equal(c.params.get('kind'), 'pipeline', 'undo reached the tool');
    ws.set('gate.notEmpty', 'false', 'gate'); await TH.sleep(10); assert.ok(c.stateExtra().box.gate.notEmpty === false, 'the gate edited, as a boolean');
    ws.close();
  });
});
