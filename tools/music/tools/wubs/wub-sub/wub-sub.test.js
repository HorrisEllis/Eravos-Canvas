/* Wub Sub (eravos.wub-sub) — tests that travel with the tool: the shared contract, then its own. */
TH.toolContract('eravos.wub-sub');
describe('tool · Wub Sub — the low end', () => {
  function rig(sec, follow) {
    const U = TH.universe(sec || 1, { bpm: 120 }), osc = TH.spawn(U, 'eravos.wub-osc'), sub = TH.spawn(U, 'eravos.wub-sub');
    OrganismFactory.handle(osc).ctx.params.set('level', 0);      // hear only the sub
    OrganismFactory.handle(sub).ctx.params.set('follow', follow !== false);
    return { U, osc, sub, sc: OrganismFactory.handle(sub).ctx };
  }
  it('follows a note sent to a Wub Osc, two octaves down (A2 → 27.5 Hz)', async () => {
    const { U, osc } = rig(1); TH.note(U, osc, 45, 0.05, { duration: 0.8 });
    const b = await TH.render(U); assert.gt(TH.rms(b, 0.3, 0.7), 0.01, 'sounds');
    assert.near(TH.acFreq(b, 0.3, 0.75, 15, 200), 27.5, 1, 'pitch');
  });
  it('stays silent when Follow is off; a note sent to it plays', async () => {
    let r = rig(0.6, false); TH.note(r.U, r.osc, 45, 0.05, { duration: 0.4 });
    assert.lt(TH.rms(await TH.render(r.U), 0.1, 0.45), 1e-4, 'no follow');
    r = rig(0.6, false); TH.note(r.U, r.sub, 57, 0.05, { duration: 0.4 });
    assert.gt(TH.rms(await TH.render(r.U), 0.15, 0.45), 0.01, 'own note');
  });
  it('a Wub Rate wired into "level" ducks it on the beat (unipolar− saw down = pump)', async () => {
    const { U, osc, sub } = rig(1.2), r = TH.spawn(U, 'eravos.wub-rate'), rc = OrganismFactory.handle(r).ctx;
    rc.presets.load('Sub Pump (to Wub Sub level)'); rc.params.set('steps', Array(16).fill('1/4'));
    assert.ok(U.K.wires.register({ src: { instanceId: r, hookId: 'wubrate.hook.mod_out' }, dst: { instanceId: sub, hookId: 'wubs.hook.mod_level' } }).ok, 'wired');
    TH.note(U, osc, 45, 0.02, { duration: 1.1 });
    const b = await TH.render(U);
    assert.lt(TH.rms(b, 0.5, 0.58), TH.rms(b, 0.86, 0.98) * 0.6, 'quiet on the beat, back by its end');
  });
});
