/* Wub Sub (eravos.wub-sub) — tests that travel with the tool: the shared contract, then its own. */
TH.toolContract('eravos.wub-sub');
describe('tool · Wub Sub — the low end', () => {
  function rig(sec, follow) {
    const U = TH.universe(sec || 1, { bpm: 120 }), osc = TH.spawn(U, 'eravos.wub-osc'), sub = TH.spawn(U, 'eravos.wub-sub');
    OrganismFactory.handle(osc).ctx.params.set('level', 0);      // hear only the sub
    OrganismFactory.handle(sub).ctx.params.set('follow', follow !== false);
    return { U, osc, sub, sc: OrganismFactory.handle(sub).ctx };
  }
  it('follows a note sent to a Wub Osc, at the Wub Osc’s own pitch (A2 → 55 Hz)', async () => {
    const { U, osc } = rig(1); TH.note(U, osc, 45, 0.05, { duration: 0.8 });
    const b = await TH.render(U); assert.gt(TH.rms(b, 0.3, 0.7), 0.01, 'sounds');
    assert.near(TH.acFreq(b, 0.3, 0.75, 35, 200), 55, 1.5, 'pitch');
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

describe('tool · Wub Sub — Pitch (3.50)', () => {
  it('Pitch −12 st takes the sub an octave lower (A2 at octave 0 → 110 Hz, −12 st → 55 Hz)', async () => {
    const U = TH.universe(1.2), sub = TH.spawn(U, 'eravos.wub-sub'), c = OrganismFactory.handle(sub).ctx;
    c.params.set('octave', 0); c.params.set('transpose', -12);
    TH.note(U, sub, 45, 0.05, { duration: 1 });
    assert.near(TH.acFreq(await TH.render(U), 0.3, 0.95, 40, 75), 55, 2, 'A2 at octave 0 = 110 Hz, down 12 st = 55 Hz');
  });
});

describe('tool · Wub Sub — Harmonics (3.51)', () => {
  it('Harmonics adds overtones (3rd harmonic of a 55 Hz sub at 165 Hz) that a plain sine does not have', async () => {
    const third = async (hm) => {
      const U = TH.universe(1.2), sub = TH.spawn(U, 'eravos.wub-sub'), c = OrganismFactory.handle(sub).ctx;
      c.params.set('octave', -1); c.params.set('cut', 400); c.params.set('harmonics', hm); TH.note(U, sub, 45, 0.05, { duration: 1 });
      const b = await TH.render(U), d = b.getChannelData(0), sr = b.sampleRate, a = Math.floor(0.3 * sr), n = Math.floor(0.6 * sr);
      let re = 0, im = 0; for (let i = 0; i < n; i++) { const ph = 2 * Math.PI * 165 * (a + i) / sr; re += d[a + i] * Math.cos(ph); im += d[a + i] * Math.sin(ph); }
      return Math.hypot(re, im) / n;
    };
    const plain = await third(0), rich = await third(1);
    assert.gt(rich, plain * 8 + 1e-4, `3rd harmonic ${plain.toExponential(2)} → ${rich.toExponential(2)}`);
  });
  it('Deep Sub (heard on small speakers) loads and sounds', async () => {
    const U = TH.universe(1), sub = TH.spawn(U, 'eravos.wub-sub'), c = OrganismFactory.handle(sub).ctx; c.presets.load('Deep Sub (heard on small speakers)');
    TH.note(U, sub, 45, 0.05, { duration: 0.8 }); assert.gt(TH.rms(await TH.render(U), 0.3, 0.8), 0.005);
  });
});
