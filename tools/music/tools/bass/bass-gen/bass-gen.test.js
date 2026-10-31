/* Bassline (eravos.bass-gen) — tests that travel with the tool. The contract is shared (tests/harness.js TH.toolContract):
 * spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is
 * obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.bass-gen');

describe('Bassline 1.1 · feel, steps, motion (3.79)', () => {
  const ctxOf = (id) => OrganismFactory.handle(id).ctx;
  function rig(params) {
    const U = TH.universe(0.2, { bpm: 120 }), b = TH.spawn(U, 'eravos.bass-gen'), r = TH.spawn(U, 'eravos.reese-bass'), c = ctxOf(b);
    U.K.wires.register({ src: { instanceId: b, hookId: 'bassg.hook.note_out' }, dst: { instanceId: r, hookId: 'reese.hook.note_in' } });
    c.params.setMany(Object.assign({ rhythm: 'eighths', energy: 0.5 }, params || {}));
    const notes = []; U.K.bus.subscribe('note:trigger', (p) => { if (p._from === b) notes.push(p); }, 'test');
    return { U, b, c, notes, play: (n) => U.T.renderTicks(0, (n || 2) * 16, 0.05) };
  }
  const stepOf = (n) => Math.round((n.time - 0.05) / 0.125) % 16;
  const sig = (ns) => ns.map(n => n.note + '@' + n.time.toFixed(4) + ':' + n.velocity.toFixed(4) + ':' + n.duration.toFixed(4) + (n.slide ? 's' : '')).join(' ');
  it('everything new at its default: the very notes 1.0 played (on its steps, its velocity, slides off the beat)', () => {
    const a = rig(); a.play(2); assert.equal(a.notes.length, 16);
    a.notes.forEach(n => { assert.equal(stepOf(n) % 2, 0); assert.near(n.velocity, 0.85, 1e-9); assert.equal(n.slide, stepOf(n) % 4 !== 0); assert.near(n.duration, 0.125 * 2.5, 1e-9); });
    const b = rig({ slides: 1, ghosts: 0, jumps: 0, move: 0, humanize: 0, accent: 0, follow: 1 }); b.play(2); assert.equal(sig(a.notes), sig(b.notes));
  });
  it('ghosts: quiet short notes in the gaps, the same each play; follow 0: only the first of each bar', () => {
    const g = rig({ ghosts: 1 }); g.play(4); const gh = g.notes.filter(n => n.velocity < 0.45);
    assert.gt(gh.length, 2); gh.forEach(n => { assert.equal(stepOf(n) % 2, 1, 'in a gap'); assert.equal(n.slide, false); });
    const g2 = rig({ ghosts: 1 }); g2.play(4); assert.equal(sig(g.notes), sig(g2.notes));
    const f = rig({ follow: 0 }); f.play(4); assert.equal(f.notes.length, 4); f.notes.forEach(n => assert.equal(stepOf(n), 0));
  });
  it('jumps put some off-beat notes an octave up; movement plays other notes of the scale; the downbeat stays the root', () => {
    const a = rig(); a.play(4); const j = rig({ jumps: 1 }); j.play(4);
    const up = j.notes.filter((n, i) => n.note === a.notes[i].note + 12); assert.gt(up.length, 0); up.forEach(n => assert.ok(stepOf(n) % 4 !== 0));
    const m = rig({ move: 1 }); m.play(4); const K = m.c.key, MT = window.MusicTheory;
    const moved = m.notes.filter((n, i) => n.note !== a.notes[i].note); assert.gt(moved.length, 0);
    moved.forEach(n => { assert.ok(stepOf(n) % 8 !== 0, 'not on the half-bar'); assert.equal(MT.quantize(n.note, K.root, K.scale), n.note, 'in the scale'); });
  });
  it('the step lanes: level, octave and slide on one step; step_set from the page; Reset clears them', () => {
    const a = rig(); a.play(1);
    const s = rig(); s.c.params.set('steps', { vel: [0, 0, 1], oct: [0, 0, 0, 0, 0, 0, -1], slide: [0, 0, -1, 0, 1] }); s.play(1);
    const at = (ns, st) => ns.find(n => stepOf(n) === st);
    assert.near(at(s.notes, 2).velocity, Math.min(1, at(a.notes, 2).velocity * 1.5), 1e-9); assert.equal(at(s.notes, 2).slide, false, 'slide off');
    assert.equal(at(s.notes, 4).slide, true, 'slide on (on the beat)'); assert.equal(at(s.notes, 6).note, at(a.notes, 6).note - 12);
    s.U.K.bus.publish('ui:step_set:' + s.b, { step: 3, oct: 1 }); assert.equal(s.c.params.get('steps').oct[3], 1, 'from the page'); assert.equal(s.c.params.get('steps').vel[2], 1, 'the rest kept');
    s.U.K.bus.publish('ui:step_set:' + s.b, { step: 0, all: { vel: 0, oct: 0, slide: 0 } }); assert.equal(s.c.params.get('steps').vel.concat(s.c.params.get('steps').oct).filter(Boolean).length, 0, 'reset');
    const St = s.c.internals.cleanSteps({ vel: [9], oct: [3], slide: [-4] }); assert.equal(St.vel[0], 1); assert.equal(St.oct[0], 1); assert.equal(St.slide[0], -1); assert.equal(St.vel.length, 16);
  });
  it('accent: the beats harder, the in-betweens softer; humanize moves notes a little, seeded', () => {
    const a = rig(); a.play(2); const ac = rig({ accent: 1 }); ac.play(2);
    ac.notes.forEach((n, i) => { if (stepOf(n) % 4 === 0) assert.gt(n.velocity, a.notes[i].velocity); else assert.lt(n.velocity, a.notes[i].velocity); });
    const h = rig({ humanize: 1 }); h.play(2); const h2 = rig({ humanize: 1 }); h2.play(2);
    const dt = h.notes.map((n, i) => Math.abs(n.time - a.notes[i].time)); assert.gt(Math.max(...dt), 0.001); assert.lt(Math.max(...dt), 0.0101);
    assert.equal(sig(h.notes), sig(h2.notes));
  });
  it('performs: four macros and the Motion / Perform settings; a macro turns ENERGY', async () => {
    const d = OrganismFactory.def('eravos.bass-gen'); ['m1', 'm2', 'm3', 'm4', '_motion', '_perform'].forEach(k => assert.ok(d.config.some(c => c.key === k), k));
    assert.ok(window.MusicMotion.performs(d));
    const r = rig({ energy: 0.2 }); r.c.params.set('_perform', { names: ['Push', 'Macro 2', 'Macro 3', 'Macro 4'], map: [{ energy: 0.5 }, {}, {}, {}], xy: { x: 0, y: 1 } });
    r.c.params.set('m1', 1); await TH.sleep(5); r.play(1); assert.near(r.c.params.get('energy'), 0.7, 1e-6); assert.equal(r.c.params.base('energy'), 0.2);
    assert.gt(r.notes[0].velocity, 0.7 + 0.3 * 0.2 + 0.1, 'and it plays harder');
  });
});
