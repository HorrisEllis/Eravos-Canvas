/* Pitch → Notes (eravos.pitch-notes) — the shared contract, then its own (pitch-notes.spec acceptance), measured offline. */
TH.toolContract('eravos.pitch-notes');
window.__pnWas = window.__phase; window.__phase = 'P246';
describe('Pitch → Notes — one tool’s pitch plays another tool', () => {
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // a line: [[midi or null (silence), from, to], …] as a sine (or a sung vowel)
  const line = (steps, vowel) => (ctx, node) => steps.forEach(([m, a, b]) => { if (m == null) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz(m);
    if (vowel) { o.type = 'sawtooth'; const f1 = ctx.createBiquadFilter(); f1.type = 'peaking'; f1.frequency.value = 730; f1.gain.value = 12; f1.Q.value = 4; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500; o.connect(f1); f1.connect(lp); lp.connect(g); } else o.connect(g);
    g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(0.4, a + 0.01); g.gain.setValueAtTime(0.4, b - 0.01); g.gain.linearRampToValueAtTime(0, b); g.connect(node); o.start(a); o.stop(b); });
  async function run(params, sec, src) {
    const U = TH.universe(sec), id = TH.spawn(U, 'eravos.pitch-notes'), c = OrganismFactory.handle(id).ctx; Object.entries(params).forEach(([k, v]) => c.params.set(k, v)); await c.ready;
    const rip = TH.spawn(U, 'eravos.ripple'), got = []; U.K.bus.subscribe('note:trigger', (p) => { if (p.target === rip) got.push(p); }, 'test');
    assert.ok(U.K.wires.register({ src: { instanceId: id, hookId: 'pn.hook.note_out' }, dst: { instanceId: rip, hookId: 'ripple.hook.note_in' } }).ok, 'Notes → Ripple');
    U.K.audio.chain.out.gain.value = 0; src(U.ctx, U.K.audio.ports(id).find(x => x.kind === 'audio' && x.direction === 'in').node);
    await TH.render(U);
    for (let k = 0, n = -1; k < 20 && got.length !== n; k++) { n = got.length; await TH.sleep(50); }   // until the messages stop arriving (up to 1 s)
    return { c, got };
  }
  const steps = [[57, 0.1, 0.6], [60, 0.6, 1.1], [64, 1.1, 1.6], [null, 1.6, 2.0], [69, 2.0, 2.5]];
  it('a line A3 · C4 · E4 · silence · A4 → those 4 notes, each booked within 80 ms of its start (the tracker must hear most of one 43 ms frame of a new note to name it)', async () => {
    const r = await run({ inKey: false, octave: 0, settle: 30 }, 2.8, line(steps));
    assert.deepEqual(r.got.map(x => x.note), [57, 60, 64, 69], 'notes ' + r.got.map(x => x.note).join(' '));
    r.got.forEach((x, i) => { const want = steps.filter(s => s[0] != null)[i][1]; assert.lt(Math.abs(x.time - want), 0.08, `note ${x.note} at ${x.time.toFixed(3)} (sung from ${want})`); });
  });
  it('In key snaps an off-key note; Octave −1 moves the notes down', async () => {
    const k = await run({ inKey: true, octave: 0 }, 1, line([[61, 0.1, 0.8]])); assert.equal(k.got.length, 1, 'one note'); assert.ok(k.got[0].note !== 61, 'C#4 snapped: ' + k.got[0].note); assert.lt(Math.abs(k.got[0].note - 61), 2, 'to a neighbour');
    const o = await run({ inKey: false, octave: -1 }, 1, line([[64, 0.1, 0.8]])); assert.equal(o.got[0].note, 52, 'E4 played as E3');
  });
  it('a sung vowel (a buzz through a formant) reads its note', async () => {
    const r = await run({ inKey: false, octave: 0 }, 1.2, line([[55, 0.1, 1.0]], true)); assert.equal(r.got.length, 1, 'one note: ' + r.got.map(x => x.note).join(' ')); assert.equal(r.got[0].note, 55, 'G3');
  });
  it('a sound wired into it still plays where it played (it only listens)', () => {
    const U = TH.universe(0.2), src = TH.spawn(U, 'eravos.ripple'), me = TH.spawn(U, 'eravos.pitch-notes');
    const w = U.K.wires.register({ src: { instanceId: src, hookId: 'ripple.hook.audio_out' }, dst: { instanceId: me, hookId: 'pn.hook.audio_in' } }); assert.ok(w.ok && U.K.audio.isOnMaster(src, 'out'));
  });
});
window.__phase = window.__pnWas;
