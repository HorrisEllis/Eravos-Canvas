/* AI Step (eravos.agents.ai-step) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.agents.ai-step');

// 3.55 — the session trace (after the CFR kernel's context synthesizer): opt-in, bounded, names only
window.__phase = 'P55';
describe('AI Step — Session trace: the model can see what happened, only when you say so', () => {
  const ctxOf = (a) => OrganismFactory.handle(a).ctx;
  async function ask(U, a, prompt) { U.K.bus.publish('ui:prompt_edit:' + a, { prompt }); await ctxOf(a).run('test'); return ctxOf(a).internals.answer.text; }
  function setup() { const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.agents.ai-step'); ctxOf(a).params.set('provider', 'echo'); return { U, a }; }
  it('off by default: {{session}} is empty and nothing is appended', async () => {
    const { U, a } = setup(); TH.spawn(U, 'eravos.coding.code-cell');
    assert.equal(ctxOf(a).params.get('trace'), 'off'); assert.equal(await ask(U, a, 'A[{{session}}]B'), 'A[]B');
    assert.equal(ctxOf(a).stateExtra().trace, null, 'the UI is told nothing either');
  });
  it('where-written: {{session}} becomes one plain line per event — tools added, wires, problems', async () => {
    const { U, a } = setup(); ctxOf(a).params.set('trace', 'where-written');
    const c = TH.spawn(U, 'eravos.coding.code-cell'); U.K.wires.register({ src: { instanceId: c, hookId: 'code.hook.out' }, dst: { instanceId: a, hookId: 'ai.hook.in' } });
    U.K.faults.raise ? U.K.faults.raise('RUNTIME_002', { instance_id: c, organism_id: 'eravos.coding.code-cell', message: 'something broke' }) : ctxOf(c).fault('RUNTIME_002', 'something broke');
    const t = await ask(U, a, 'Session:\n{{session}}\nEnd');
    assert.ok(/added AI Step/.test(t), t); assert.ok(/added Code Cell|added Code/.test(t), t); assert.ok(/wired Code[^\n]*→ AI Step/.test(t), t); assert.ok(/problem RUNTIME_002[^\n]*something broke/.test(t), t);
    assert.ok(/^\+\d+\.\ds /m.test(t), 'times are relative to the start'); assert.ok(/\nEnd$/.test(t));
  });
  it('append: added to the end of every prompt, under a heading — once, even if the template also has {{session}}', async () => {
    const { U, a } = setup(); ctxOf(a).params.set('trace', 'append');
    const t = await ask(U, a, 'Hello'); assert.ok(/^Hello\n\n### What happened in this session \(oldest first\)\n\+/.test(t), t);
    const t2 = await ask(U, a, 'X {{session}}'); assert.equal(t2.split('### What happened').length, 1, 'not twice');
  });
  it('bounded: Trace size events at most, and never more than 4000 characters', async () => {
    const { U, a } = setup(); ctxOf(a).params.setMany({ trace: 'where-written', traceSize: 5 });
    for (let i = 0; i < 12; i++) TH.spawn(U, 'eravos.coding.code-cell');
    assert.equal((await ask(U, a, '{{session}}')).split('\n').length, 5);
    ctxOf(a).params.set('traceSize', 200); for (let i = 0; i < 150; i++) ctxOf(a).fault('RUNTIME_002', 'problem number ' + i + ' with a fairly long explanation attached to it');
    const t = await ask(U, a, '{{session}}'); assert.ok(t.length <= 4000, t.length); assert.ok(/problem number 149/.test(t), 'the newest are kept');
  });
  it('names only: a key-like string in an event is hidden, a saved key and the settings never appear', async () => {
    const { U, a } = setup(); ctxOf(a).params.set('trace', 'where-written'); ctxOf(a).params.set('model', 'my-private-model-name');
    U.K.bus.publish('ui:key_set:' + a, { key: 'sk-SECRET-key-0123456789' }); ctxOf(a).fault('RUNTIME_002', 'sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij');
    const t = await ask(U, a, '{{session}}'); assert.ok(!/sk-/.test(t), t); assert.ok(/\[hidden\]/.test(t)); assert.ok(!/my-private-model-name/.test(t));
    try { localStorage.removeItem('eravos.secret.eravos.agents.ai-step.key.echo'); } catch (e) {}
  });
  it('the ledger is read through the kernel: with ledger_read withdrawn there is no trace, and the refusal is logged', async () => {
    const { U, a } = setup(); ctxOf(a).params.set('trace', 'where-written'); U.K.permissions.revoke('ledger_read');
    assert.equal(await ask(U, a, '[{{session}}]'), '[]'); assert.ok(U.K.ledger.entries({ type: 'permission_denied', permission: 'ledger_read' }).length > 0);
  });
});
