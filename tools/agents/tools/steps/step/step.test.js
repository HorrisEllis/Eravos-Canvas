/* Step (eravos.agents.step) — tests that travel with the tool. The contract is shared (tests/harness.js TH.toolContract):
 * spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is
 * obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.agents.step');

// 2026-11-08 — step.spec's acceptance. James: "i want the tools compatable with eravos independantly. eravos is the build surface for nexus."
window.__phase = 'P152';
describe('Step — one step of a pipeline, data only', () => {
  const ctxOf = (a) => OrganismFactory.handle(a).ctx;
  const STEP = { id: 'pricing', kind: 'pipeline', ref: 'pricing-table', hooks: { in: ['in'], out: ['out'] }, contract: { requires: ['overview'], gives: ['output'] }, gate: { notEmpty: true }, args: { task: { id: 'pricing' } } };
  const KINDS = ['gate', 'system', 'agent', 'macro', 'pipeline', 'procedure', 'tool', 'build'];
  function opened(U) {
    const a = TH.spawn(U, 'eravos.agents.step'); const c = ctxOf(a);
    c.params.setMany({ kind: 'pipeline', ref: 'pricing-table', step: 'pricing', state: 'running' }); c.loadExtra({ box: STEP, kinds: KINDS }); return { a, c };
  }
  it('opened with a step: its kind, ref, step and whole box are what it was given', () => {
    const U = TH.universe(0.2), { c } = opened(U);
    assert.equal(c.params.get('kind'), 'pipeline'); assert.equal(c.params.get('ref'), 'pricing-table'); assert.deepEqual(c.stateExtra().box, STEP);
    assert.deepEqual(c.stateExtra().kinds, KINDS);
  });
  it('a value on in goes out once as { step, kind, ref, value }', async () => {
    const U = TH.universe(0.2), { a } = opened(U)
    const src = TH.spawn(U, 'eravos.agents.step'), dst = TH.spawn(U, 'eravos.agents.step');
    U.K.wires.register({ src: { instanceId: a, hookId: 'step.hook.out' }, dst: { instanceId: dst, hookId: 'step.hook.in' } });
    U.K.wires.register({ src: { instanceId: src, hookId: 'step.hook.out' }, dst: { instanceId: a, hookId: 'step.hook.in' } });
    U.K.data.send(src, 'out', { hello: 1 }); await new Promise(r => setTimeout(r, 20));
    const last = ctxOf(dst).stateExtra().last;
    assert.equal(last.step, 'pricing'); assert.equal(last.kind, 'pipeline'); assert.equal(last.ref, 'pricing-table'); assert.deepEqual(last.value, { hello: 1 });
  });
  it('save → load keeps the whole step and the kinds (the .erv round trip)', () => {
    const U = TH.universe(0.2), { c } = opened(U); const saved = JSON.parse(JSON.stringify(c.saveExtra()));
    const b = TH.spawn(U, 'eravos.agents.step'); ctxOf(b).loadExtra(saved); assert.deepEqual(ctxOf(b).saveExtra(), saved);
  });
});

// 2026-11-08 — the step on the Workshop. James: "maybe it edits steps, like it does a note, or pattern." · "okay the workshop it to edit. the
// canvas are for the tools."
window.__phase = 'P153';
describe('Step — a step opened on the Workshop, edited live', () => {
  const ctxOf = (a) => OrganismFactory.handle(a).ctx;
  const STEP = { id: 'pricing', kind: 'pipeline', ref: 'pricing-table', hooks: { in: ['in'], out: ['out'] }, contract: { requires: ['overview'], gives: ['output'] },
    gate: { notEmpty: true }, args: { task: { id: 'pricing', step: { type: 'pipeline', config: { pipeline: 'pricing-table', retries: 2 } } } } };
  const KINDS = ['gate', 'system', 'agent', 'macro', 'pipeline', 'procedure', 'tool', 'build'];
  it('the kind is accepted by the Workshop, and its layers are read from the step itself (no field is fixed)', () => {
    const K = window.EravosStepKind; assert.ok(K, 'the Box offers its kind');
    const DOC = { kind: 'pipeline', ref: 'pricing-table', step: 'pricing', state: '', kinds: KINDS, box: STEP, last: null }, KIND_GET = (k) => K.get(DOC, k); assert.deepEqual(Workshop.check(K), [], 'a whole kind');
    const L = K.layers({ kind: 'pipeline', ref: 'pricing-table', step: 'pricing', state: '', kinds: KINDS, box: STEP, last: null });
    // 2026-11-08, his "The ui is meant to dynamically change in relation to the kind." · "Yes. Follow the spec.": what it carries is IN PLAY,
    // most first; what it does not is NOT IN PLAY with the reason
    assert.deepEqual(L.filter(l => l.group === 'IN PLAY').map(l => l.id), ['settings', 'gate', 'step', 'contract'], 'in play, most first: ' + L.map(l => l.id + ':' + l.group).join(' '));
    assert.deepEqual(L.filter(l => l.group === 'NOT IN PLAY').map(l => [l.id, l.sub]), [['last', 'nothing has passed through it yet']]);
    assert.deepEqual(L.find(l => l.id === 'gate').fields.map(f => f.key), ['gate.notEmpty'], 'the gate\'s own keys');
    assert.ok(L.find(l => l.id === 'settings').fields.every(f => !/\./.test(f.label)), 'a setting is named by its own last word');
    assert.ok(!L.find(l => l.id === 'settings').fields.some(f => KIND_GET(f.key) === 'pricing'), 'what another layer shows is not repeated');
    assert.ok(L.find(l => l.id === 'settings').fields.some(f => f.key === 'arg.task.step.config.retries' && f.type === 'number'), 'every leaf of its settings, typed');
    assert.ok(!L.some(l => (l.fields || []).some(f => f.key === 'kind')) && !/pipeline/i.test(L[1].sub), 'no kind shown (his, 2026-11-08: "no need to show kinds in the ui")');
  });
  it('opened from the Box: an edit in the Workshop reaches the tool at once, and undo takes it back', async () => {
    if (!Workshop.kinds().includes('agents.step')) assert.ok(Workshop.addKind(window.EravosStepKind).ok, 'registered as the Box\'s window does');
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.agents.step'), c = ctxOf(a);
    c.params.setMany({ kind: 'pipeline', ref: 'pricing-table', step: 'pricing' }); c.loadExtra({ box: STEP, kinds: KINDS });
    const send = (x) => U.K.bus.publish('ui:step_set:' + a, x);
    const ws = Workshop.open('agents.step', { kind: 'pipeline', ref: 'pricing-table', step: 'pricing', state: '', kinds: KINDS, box: STEP, last: null },
      { onChange: (d) => send({ params: { kind: d.kind, ref: d.ref, step: d.step, state: d.state }, box: d.box }) });
    ws.set('arg.task.step.config.retries', '4', 'retries'); await TH.sleep(10);
    assert.equal(c.stateExtra().box.args.task.step.config.retries, 4, 'a setting changed on the tool, typed');
    ws.set('ref', 'pricing-v2', 'Names'); await TH.sleep(10); assert.equal(c.params.get('ref'), 'pricing-v2', 'what it names changed on the tool');
    ws.undo(); await TH.sleep(10); assert.equal(c.params.get('ref'), 'pricing-table', 'undo reached the tool');
    ws.set('gate.notEmpty', 'false', 'gate'); await TH.sleep(10); assert.ok(c.stateExtra().box.gate.notEmpty === false, 'the gate edited, as a boolean');
    ws.close();
  });
});
