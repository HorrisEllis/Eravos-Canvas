/* Gothic Organ (eravos.organ) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.organ');
describe('Gothic Organ — a held note sustains (3.41)', () => {
  // the chiff burst and perc used to be the voice's cleanup anchor: when their buffer ran out mid-note the whole voice was
  // disconnected. Suspend mid-note so every onended that is due has fired, then the note must still be sounding.
  it('Cathedral Full (chiff on) still sounds after its chiff and perc have ended', async () => {
    const U = TH.universe(3), inst = TH.spawn(U, 'eravos.organ'), c = OrganismFactory.handle(inst).ctx;
    c.presets.load('Cathedral Full'); c.params.set('space', 0); c.params.set('perc', 0.4);
    U.K.bus.publish('note:trigger', { target: inst, note: 60, velocity: 0.8, time: 0.1, duration: 2.8 });
    U.ctx.suspend(2.2).then(() => setTimeout(() => U.ctx.resume(), 150));
    const buf = await TH.render(U), early = TH.rms(buf, 0.6, 1.6), late = TH.rms(buf, 2.3, 2.8);
    assert.gt(TH.db(late), TH.db(early) - 6, `held note fell from ${TH.db(early).toFixed(1)} to ${TH.db(late).toFixed(1)} dB`);
  });
});
