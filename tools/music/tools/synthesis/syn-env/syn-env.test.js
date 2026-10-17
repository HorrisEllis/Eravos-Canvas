/* Envelope (eravos.syn-env) — the shared contract, then its own: shape, loop, FOLLOW (moves on the notes of what it is wired into) */
TH.toolContract('eravos.syn-env');
describe('tool · Envelope — wire it into any knob', () => {
  const SR = TH.SR;
  async function shapeOf(params, fire) {
    const U = TH.universe(2), e = TH.spawn(U, 'eravos.syn-env'), c = OrganismFactory.handle(e).ctx; c.params.setMany(params || {});
    U.K.audio.chain.out.gain.value = 0; c.internals.out.connect(U.ctx.destination);
    if (fire) fire(U, e); else TH.note(U, e, 60, 0.1, { duration: 1 });
    return (await TH.render(U)).getChannelData(0);
  }
  const at = (d, t) => d[Math.round(t * SR)];
  it('peak after the attack, sustain after the decay, zero after the release', async () => {
    const d = await shapeOf({ attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.1, velocity: 0 });
    assert.near(at(d, 0.2), 1, 0.02, 'peak'); assert.near(at(d, 0.8), 0.5, 0.03, 'sustain'); assert.lt(Math.abs(at(d, 1.8)), 0.01, 'released');
  });
  it('polarity − closes and bipolar swings through zero', async () => {
    const n = await shapeOf({ attack: 0.1, decay: 0.2, sustain: 0.5, polarity: '−', velocity: 0 }), b = await shapeOf({ attack: 0.1, decay: 0.2, sustain: 0.5, polarity: 'bipolar', velocity: 0 });
    assert.near(at(n, 0.2), -1, 0.02); assert.near(at(b, 0.05), -1, 0.02, 'bipolar rests at −1'); assert.near(at(b, 0.2), 1, 0.02);
  });
  it('loop repeats attack → decay while held', async () => {
    const d = await shapeOf({ attack: 0.05, decay: 0.05, sustain: 0, loop: true, velocity: 0 });
    let peaks = 0; for (let t = 0.1; t < 1.05; t += 0.01) if (at(d, t) > 0.9) { peaks++; t += 0.06; }
    assert.gt(peaks, 7, 'cycles: ' + peaks);
  });
  it('FOLLOW: wired into a tool’s knob, it moves on the notes sent to that tool', async () => {
    const d = await shapeOf({ attack: 0.05, decay: 0.1, sustain: 0.6, velocity: 0 }, (U, e) => {
      const f = TH.spawn(U, 'eravos.wub-filter');
      const w = U.K.wires.register({ src: { instanceId: e, hookId: 'env.hook.mod_out' }, dst: { instanceId: f, hookId: 'wubf.hook.mod_wub' } }); assert.ok(w.ok, 'wired ' + JSON.stringify(w.fault));
      U.K.bus.publish('note:trigger', { target: f, note: 45, velocity: 0.9, time: 0.3, duration: 0.6 });
    });
    assert.lt(Math.abs(at(d, 0.2)), 0.01, 'still before the note'); assert.near(at(d, 0.7), 0.6, 0.03, 'moving with the filter’s note');
  });
});
