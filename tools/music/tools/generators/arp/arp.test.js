/* Arp (eravos.arp) — tests that travel with the tool. The contract is shared (tests/harness.js TH.toolContract):
 * spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is
 * obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.arp');

// 3.61 — "make arp more adjustable. i love it": every control from one side to the other; the defaults play exactly as 1.0
window.__phase = 'P61';
describe('Arp 2.0 — every move adjustable', () => {
  const ctxOf = (id) => OrganismFactory.handle(id).ctx;
  function rig(params, extra) {
    const U = TH.universe(0.2, { bpm: 120 }), a = TH.spawn(U, 'eravos.arp'), ss = TH.spawn(U, 'eravos.supersaw'), c = ctxOf(a);
    c.params.setMany(Object.assign({ order: 'up', div: '1/16', octaves: 1, gate: 0.5 }, params || {})); if (extra) c.loadExtra(extra);
    const w = U.K.wires.register({ src: { instanceId: a, hookId: 'arp.hook.note_out' }, dst: { instanceId: ss, hookId: 'saw.hook.note_in' } }); assert.ok(w.ok);
    const got = []; U.K.bus.subscribe('note:trigger', (p) => { if (p._from === a) got.push(p); }, 'test');
    return { U, a, c, got, hold: (notes) => notes.forEach(n => U.K.bus.publish('note:trigger', { target: a, note: n, velocity: 0.8, time: 0, duration: 8 })), play: (n) => U.T.renderTicks(0, n, 0) };
  }
  const seqOf = (params, notes) => ctxOf(rig(params).a).sequence(notes || [60, 64, 67, 72]);
  it('the new orders: down-up, converge, diverge, pinky, thumb', () => {
    assert.deepEqual(seqOf({ order: 'down-up' }), [72, 67, 64, 60, 64, 67]);
    assert.deepEqual(seqOf({ order: 'converge' }), [60, 72, 64, 67]); assert.deepEqual(seqOf({ order: 'diverge' }), [67, 64, 72, 60]);
    assert.deepEqual(seqOf({ order: 'pinky' }), [60, 72, 64, 72, 67, 72]); assert.deepEqual(seqOf({ order: 'thumb' }), [60, 64, 60, 67, 60, 72]);
  });
  it('octaves go up, down or centred; scale runs up the song’s key', () => {
    assert.deepEqual(seqOf({ octaves: 2, octDir: 'down' }, [60, 64]), [48, 52, 60, 64]);
    assert.deepEqual(seqOf({ octaves: 3, octDir: 'center' }, [60]), [48, 60, 72]);
    const r = rig({ order: 'scale', octaves: 1 }); r.U.K.music.key = { root: 0, scale: 'major' }; assert.deepEqual(r.c.sequence([60, 67]), [60, 62, 64, 65, 67, 69, 71, 72]);
  });
  it('repeat plays each note N times; length loops the first N notes', () => {
    const a = rig({ repeat: 2 }); a.hold([60, 64, 67]); a.play(6); assert.deepEqual(a.got.map(p => p.note), [60, 60, 64, 64, 67, 67]);
    const b = rig({ length: 2 }); b.hold([60, 64, 67]); b.play(6); assert.deepEqual(b.got.map(p => p.note), [60, 64, 60, 64, 60, 64]);
  });
  it('the step lane: a 0 step is a rest, its octave shifts the note, its level scales the velocity', () => {
    const vel = new Array(32).fill(1); vel[1] = 0; vel[3] = 0.5; const oct = new Array(32).fill(0); oct[2] = 1;
    const r = rig({ steps: 4, velocity: 0.8 }, { lane: { vel, oct } }); r.hold([60, 64, 67, 71]); r.play(8);
    assert.equal(r.got.length, 6, 'two rests in 8 steps'); assert.equal(r.got[1].note, 67 + 12, 'step 3 an octave up'); assert.near(r.got[2].velocity, 0.4, 0.01, 'step 4 at half level');
  });
  it('slides glide in from the last note (a bend on the note) — from the lane, or by chance', () => {
    const slide = new Array(32).fill(false); slide[1] = true;
    const r = rig({ steps: 4 }, { lane: { slide } }); r.hold([60, 67]); r.play(4);
    assert.equal(r.got[0].bend, undefined); assert.deepEqual(r.got[1].bend, { from: -7, to: 0, shape: 'early', at: 0 }, 'G slides up from C');
    const all = rig({ slide: 1 }); all.hold([60, 64, 67]); all.play(6); assert.equal(all.got.filter(p => p.bend).length, 5, 'every note after the first');
  });
  it('stack plays the octave / fifth with each note; chord plays them all at once', () => {
    const s = rig({ stack: '+oct+5th' }); s.hold([60]); s.play(1); assert.deepEqual(s.got.map(p => p.note).sort((x, y) => x - y), [60, 67, 72]);
    const c = rig({ order: 'chord' }); c.hold([60, 64, 67]); c.play(2); assert.equal(c.got.length, 6); assert.equal(c.got[0].time, c.got[2].time);
  });
  it('chance 0 plays nothing, 0.5 about half (the seed decides — the same every time); swing pushes the off-steps late', () => {
    const z = rig({ chance: 0 }); z.hold([60, 64]); z.play(16); assert.equal(z.got.length, 0);
    const h1 = rig({ chance: 0.5, seed: 11 }), h2 = rig({ chance: 0.5, seed: 11 }); [h1, h2].forEach(r => { r.hold([60, 64]); r.play(32); });
    assert.ok(h1.got.length > 8 && h1.got.length < 24); assert.equal(h1.got.map(p => p.note + '@' + p.time).join(), h2.got.map(p => p.note + '@' + p.time).join(), 'same seed, same take');
    const sw = rig({ swing: 0.5 }); sw.hold([60]); sw.play(2); assert.near(sw.got[1].time - sw.got[0].time, 0.125 * (1 + 0.33), 1e-6, 'the second 16th a third late');
  });
  it('restart on every bar puts the pattern back at its first note', () => {
    const r = rig({ restart: 'bar' }); r.hold([60, 64, 67]); r.play(20); assert.equal(r.got[16].note, 60, 'bar 2 starts on the first note again');
  });
  it('the lane travels with presets and projects; lane shapes fill it', () => {
    const r = rig(); r.c.presets.load('Trance Gate 1/16'); assert.equal(r.c.internals.lane.vel[2], 0, 'the trance gate: step 3 rests');
    const s = r.c.serialize(); assert.ok(s.extra && s.extra.lane, 'saved'); r.U.K.bus.publish('ui:lane_shape:' + r.a, { shape: 'offbeats' }); assert.equal(r.c.internals.lane.vel[0], 0); assert.equal(r.c.internals.lane.vel[1], 1);
    r.c.loadExtra(s.extra); assert.equal(r.c.internals.lane.vel[2], 0, 'and back');
  });
});
