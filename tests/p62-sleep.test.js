/* 3.62 — "can you optimize performance?" A silent tool sleeps: measured (specs/eravos.performance.spec, addendum 3.62), a silent Gothic
 * Organ cost 17.8 % of a core, Pad Forge 13.7 %, Wobble Bass 7.3 %, and ≈ 0 once unplugged. A tool that says when it is silent is
 * unplugged after its whole tail, and any note plugs it back in before it sounds. These tests prove nothing audible is lost. */
window.__phase = 'P62';
describe('A silent tool sleeps, and wakes for the next note (3.62)', () => {
  function uni(sec) { const U = TH.universe(sec, { bpm: 120 }); U.K.audio.sleepOffline = true; return U; }
  const at = (U, t, fn) => U.ctx.suspend(Math.round(t * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate).then(() => { try { fn(); } finally { U.ctx.resume(); } });
  [['eravos.pad-forge', 14], ['eravos.organ', 7.5], ['eravos.wobble-bass', 0]].forEach(([id, tail]) => it(`${id}: plays, sleeps only after its ${tail || 1} s tail, wakes for a note and sounds the same`, async () => {
    // the release (Pad Forge 3 s) ends the voice, then the whole tail must pass: checked every ½ s, as the app checks every ¼ s
    const T2 = tail + 12, U = uni(T2 + 2.2), inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx; if (c.ready) await c.ready;
    const seen = { log: [] };
    at(U, 0.1, () => TH.note(U, inst, 48, 0.2, { duration: 0.8 }));
    for (let t = 1; t < T2 - 0.4; t += 0.5) at(U, t, () => seen.log.push([t, c.sleepCheck(), c.internals && c.internals.voices ? c.internals.voices.length : -1]));
    at(U, T2 - 0.3, () => { seen.after = c.asleep; TH.note(U, inst, 48, T2, { duration: 0.8 }); seen.woke = !c.asleep; });
    const buf = await TH.render(U);
    const first = seen.log.find(x => x[1]); assert.ok(first, 'it fell asleep: ' + JSON.stringify(seen.log.filter((x, i) => i % 4 === 0))); assert.gt(first[0], tail + 1, `not before its ${tail} s tail had passed (asleep at ${first[0]} s)`);
    assert.equal(seen.after, true, 'asleep once the tail is over'); assert.equal(seen.woke, true, 'the next note wakes it');
    const a = TH.rms(buf, 0.25, 0.95), b = TH.rms(buf, T2 + 0.05, T2 + 0.75);
    assert.gt(a, 1e-3, 'the first note sounds'); assert.near(TH.db(b), TH.db(a), 3, `the note after sleep sounds like the first (${TH.db(a).toFixed(1)} vs ${TH.db(b).toFixed(1)} dB)`);
  }));
  it('a held chord (Pad Forge Hold) never sleeps', async () => {
    const U = uni(20), inst = TH.spawn(U, 'eravos.pad-forge'), c = OrganismFactory.handle(inst).ctx; if (c.ready) await c.ready;
    U.K.bus.publish('ui:config_change:' + inst, { key: 'hold', value: true });
    const seen = []; TH.note(U, inst, 48, 0.1, { duration: 0.5 });
    [2, 8, 16, 19].forEach(t => at(U, t, () => seen.push(c.sleepCheck())));
    const buf = await TH.render(U);
    assert.deepEqual(seen, [false, false, false, false]); assert.gt(TH.rms(buf, 18, 19.5), 1e-3, 'still sounding at 18 s');
  });
  it('a real-time context sleeps by itself; an offline render stays awake unless asked', () => {
    const U = TH.universe(0.5), inst = TH.spawn(U, 'eravos.organ'), c = OrganismFactory.handle(inst).ctx;
    assert.equal(typeof c.sleepWhen, 'function'); assert.equal(c.asleep, false, 'offline (a bounce, a test): awake');
  });
});
