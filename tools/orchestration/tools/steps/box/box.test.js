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
