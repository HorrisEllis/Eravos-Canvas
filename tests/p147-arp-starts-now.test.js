/* P147 — the arp starts on the next step (his words, 2026-11-07: "same with arp"). Ticks are dealt out ~100 ms ahead of the clock; a
 * key pressed after a step was dealt used to wait for the next step dealt after it — up to a step + 100 ms. Now the steps already
 * dealt are kept and played for the key. Offline: steps are dealt for 0.125…0.375 s, then the key goes down at 0 s with no step dealt
 * after it — the old code stayed silent; now the first note sounds on the first step. */
window.__phase = 'P147';
describe('P147 the arp starts on the next step, not a lookahead later', () => {
  it('a key pressed after steps were dealt plays on those steps (Retro Poly arp)', async () => {
    const U = TH.universe(0.6), a = TH.spawn(U, 'eravos.retro-poly'), c = OrganismFactory.handle(a).ctx;
    c.params.set('arp', 'up'); c.params.set('arpDiv', '1/16'); c.params.set('attack', 0.002);
    U.K.audio.chain.out.gain.value = 0; U.K.audio.ports(a).find(x => x.kind === 'audio' && x.direction === 'out').node.connect(U.ctx.destination);
    const sd = 0.125;   // 120 BPM: a 16th
    for (let s = 1; s <= 3; s++) U.K.bus.publish('transport:tick', { step16: s, time: s * sd, bar: 1, beat: 1, sixteenth: s + 1, stepDur: sd, bpm: 120 });
    c.audition({ note: 60, velocity: 0.9 });
    const b = await TH.render(U), first = TH.firstAbove(b, 0.01) / b.sampleRate;
    assert.ok(first > 0, 'it sounds (the old code was silent here: no step was dealt after the key)');
    assert.lt(Math.abs(first - sd), 0.02, 'the first note on the first step dealt (' + (first * 1000).toFixed(0) + ' ms, the step at 125 ms)');
  });
});
