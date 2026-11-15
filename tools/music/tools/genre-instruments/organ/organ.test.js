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
describe('Gothic Organ — irrational ranks (3.187)', () => {
  // James, 2026-11-15: "like the hangining tree … the beginning irrational freqeuncies". Each partial sits at its irrational ratio of the
  // note; at Irrational 0 every irrational pipe is silent (gain exactly 0), so the organ is today's organ.
  const goertzel = (d, a, n, hz, sr) => { const w = 2 * Math.PI * hz / sr, cw = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let j = a; j < a + n; j++) { const s0 = d[j] * (0.5 - 0.5 * Math.cos(2 * Math.PI * (j - a) / n)) + cw * s1 - s2; s2 = s1; s1 = s0; } return Math.sqrt(s1 * s1 + s2 * s2 - cw * s1 * s2); };
  async function play(set) {
    const U = TH.universe(2), inst = TH.spawn(U, 'eravos.organ'), c = OrganismFactory.handle(inst).ctx;
    for (let i = 0; i < 9; i++) c.params.set('d' + i, 0);
    Object.entries(Object.assign({ pedal: false, space: 0, wind: 0, chiff: 0, perc: 0, celeste: 0, tremDepth: 0, breathDepth: 0, drive: 0, rotary: 0, pulse: 0, irrDrift: 0 }, set)).forEach(([k, v]) => c.params.set(k, v));
    U.K.bus.publish('note:trigger', { target: inst, note: 57, velocity: 0.8, time: 0.05, duration: 1.6 });
    const buf = await TH.render(U); return { d: buf.getChannelData(0), sr: buf.sampleRate, c };
  }
  it('Irrational 1, hanging: a partial at 220·√2 Hz, well over the octave and over 30 cents off', async () => {
    const r = await play({ irr: 1, irrSet: 'hanging' }), a = Math.floor(0.4 * r.sr), n = Math.floor(1.0 * r.sr);
    const at = goertzel(r.d, a, n, 220 * Math.SQRT2, r.sr), oct = goertzel(r.d, a, n, 440, r.sr), near = goertzel(r.d, a, n, 220 * Math.SQRT2 * Math.pow(2, 30 / 1200), r.sr);
    assert.gt(TH.db(at) - TH.db(oct), 20, '√2 partial over the octave by ' + (TH.db(at) - TH.db(oct)).toFixed(1) + ' dB');
    assert.gt(TH.db(at) - TH.db(near), 12, 'the peak is at √2, not 30 cents off');
  });
  it('Irrational 0: the √2 partial is gone (≥ 40 dB under Irrational 1)', async () => {
    const one = await play({ irr: 1 }), zero = await play({ irr: 0 }), a = Math.floor(0.4 * one.sr), n = Math.floor(1.0 * one.sr), hz = 220 * Math.SQRT2;
    const d = TH.db(goertzel(one.d, a, n, hz, one.sr)) - TH.db(goertzel(zero.d, a, n, hz, zero.sr));
    assert.gt(d, 40, 'dropped by ' + d.toFixed(1) + ' dB');
  });
  it('Irrational 0: every irrational pipe of a sounding note has gain exactly 0 (adds nothing)', async () => {
    const U = TH.universe(2), inst = TH.spawn(U, 'eravos.organ'), c = OrganismFactory.handle(inst).ctx;
    c.presets.load('Hanging Tree'); c.params.set('irr', 0);
    U.K.bus.publish('note:trigger', { target: inst, note: 57, velocity: 0.8, time: 0.05, duration: 1.4 });
    await TH.render(U);
    const pipes = c.internals.voices.flatMap(v => v.nodes || []).filter(n => n._irr !== undefined);
    assert.gt(pipes.length, 0, 'the note has irrational pipes'); pipes.forEach(g => assert.equal(g.gain.value, 0, 'pipe ' + g._irr));
  });
});
