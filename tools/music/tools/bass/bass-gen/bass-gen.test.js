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

describe('Bassline 2.0 · time, notes, locks and rests (3.186)', () => {
  // his words (2026-11-13): "I love the bassline, needs more depth and control. like tempo and the cord tool." · "The bassline tool. Way more depth."
  const ctxOf = (id) => OrganismFactory.handle(id).ctx;
  function rig(params) {
    const U = TH.universe(0.2, { bpm: 120 }), b = TH.spawn(U, 'eravos.bass-gen'), r = TH.spawn(U, 'eravos.reese-bass'), c = ctxOf(b);
    U.K.wires.register({ src: { instanceId: b, hookId: 'bassg.hook.note_out' }, dst: { instanceId: r, hookId: 'reese.hook.note_in' } });
    c.params.setMany(Object.assign({ rhythm: 'eighths', energy: 0.5 }, params || {}));
    const notes = []; U.K.bus.subscribe('note:trigger', (p) => { if (p._from === b) notes.push(p); }, 'test');
    return { U, b, c, notes, play: (n) => U.T.renderTicks(0, (n || 2) * 16, 0.05) };
  }
  const SD = 0.125, pos = (n) => Math.round((n.time - 0.05) / SD), stepOf = (n) => pos(n) % 16, barOf = (n) => Math.floor(pos(n) / 16);
  const sig = (ns) => ns.map(n => n.note + '@' + n.time.toFixed(4) + ':' + n.velocity.toFixed(4) + ':' + n.duration.toFixed(4) + (n.slide ? 's' : '')).join(' ');
  const key = (c) => c.key || { root: 9, scale: 'minor' };
  it('every 2.0 control at its default: the very notes 1.1 played', () => {
    const a = rig(); a.play(4);
    const b = rig({ feel: 'normal', swing: 0, phrase: 2, answer: 0, pool: 'root', tension: 0, span: 3, anticipate: 0 }); b.play(4); assert.equal(sig(a.notes), sig(b.notes));
    const c = rig({ pool: 'scale', tension: 0, answer: 0 }); c.play(4); assert.equal(sig(a.notes), sig(c.notes), 'a pool with no tension changes nothing');
  });
  it('feel: double plays its rhythm twice a bar, half once over two bars', () => {
    const n = rig({ rhythm: 'every beat' }); n.play(2); const d = rig({ rhythm: 'every beat', feel: 'double' }); d.play(2); const h = rig({ rhythm: 'every beat', feel: 'half' }); h.play(2);
    assert.equal(n.notes.length, 8); assert.equal(d.notes.length, 16); assert.equal(h.notes.length, 4);
    assert.deepEqual(d.notes.slice(0, 8).map(stepOf), [0, 2, 4, 6, 8, 10, 12, 14]); assert.deepEqual(h.notes.map(pos), [0, 8, 16, 24]);
  });
  it('swing: the 16ths between the 8ths land late — a third of a step at 1; the 8ths stay put', () => {
    const s = rig({ rhythm: 'eighths', feel: 'double', swing: 1 }); s.play(1);
    const late = s.notes.filter(n => stepOf(n) % 2 === 1 || Math.abs((n.time - 0.05) / SD - pos(n)) > 1e-6);
    s.notes.forEach(n => { const off = (n.time - 0.05) - Math.round((n.time - 0.05) / SD) * SD; const x = (n.time - 0.05) / SD; if (Math.abs(x - Math.round(x)) < 1e-6) return; assert.near(x - Math.floor(x), 1 / 3, 1e-6, 'a third of a step'); });
    assert.gt(s.notes.filter(n => { const x = (n.time - 0.05) / SD; return Math.abs(x - Math.round(x)) > 1e-6; }).length, 0, 'some notes swung');
  });
  it('notes: Tension leaves the root for the pool (fifth only), always in key; the first of the bar stays the root', () => {
    const a = rig(); a.play(4); const t = rig({ pool: 'root + fifth', tension: 1 }); t.play(4); const k = key(t.c);
    t.notes.forEach((n, i) => { assert.ok(MusicTheory.inScale(n.note, k.root, k.scale), n.note + ' in key'); if (stepOf(n) === 0) assert.equal(n.note, a.notes[i].note, 'the downbeat stays'); });
    assert.gt(t.notes.filter((n, i) => n.note !== a.notes[i].note).length, 3, 'it leaves the root');
    const w = rig({ pool: 'walking', tension: 1, rhythm: 'every beat' }); w.play(4); w.notes.forEach(n => assert.ok(MusicTheory.inScale(n.note, k.root, k.scale)));
  });
  it('a locked step plays its lock (the 5th on step 4); a rest never plays (step 2)', () => {
    const a = rig(); a.play(2); const l = rig(); l.c.params.set('steps', Object.assign(l.c.internals.STEPS0(), { lock: [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], rest: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })); l.play(2);
    const k = key(l.c), oct = l.c.params.get('octave');
    assert.equal(l.notes.filter(n => stepOf(n) === 2).length, 0, 'the rest');
    const at4 = l.notes.filter(n => stepOf(n) === 4); assert.equal(at4.length, 2, 'step 4 in both bars');
    at4.forEach(n => { const root = a.notes.find(x => barOf(x) === barOf(n) && stepOf(x) === 0).note;
      let d = 0; while (d < 21 && MusicTheory.degreeToMidi(d, oct, k.root, k.scale) !== root) d++;   // the bar's chord degree, from its root
      assert.equal(n.note, MusicTheory.degreeToMidi(d + 4, oct, k.root, k.scale), 'step 4 plays the chord\u2019s fifth'); });
  });
  it('range: one octave folds the jumps back down — no note above the octave it was given', () => {
    const j = rig({ jumps: 1, span: 1 }); j.play(4); const k = key(j.c), floor = MusicTheory.degreeToMidi(0, j.c.params.get('octave'), k.root, k.scale);
    j.notes.forEach(n => assert.lt(n.note, floor + 24, n.note + ' under ' + (floor + 24)));
  });
  it('anticipation: an 8th before the bar it plays the next chord’s root', () => {
    const a = rig({ rhythm: 'every beat', anticipate: 1 }); a.play(4);
    const early = a.notes.filter(n => stepOf(n) === 14); assert.gt(early.length, 0, 'notes an 8th early');
    early.forEach(n => { const next = a.notes.find(x => barOf(x) === barOf(n) + 1 && stepOf(x) === 0); if (next) assert.equal(n.note % 12, next.note % 12, 'the next chord’s root'); });
  });
  it('answer: the second half of each phrase moves its notes; the first half stays', () => {
    const a = rig(); a.play(4); const x = rig({ answer: 1, phrase: 2 }); x.play(4);
    x.notes.forEach((n, i) => { if (barOf(n) % 2 === 0 || stepOf(n) === 0) assert.equal(n.note, a.notes[i].note); });
    assert.gt(x.notes.filter((n, i) => barOf(n) % 2 === 1 && n.note !== a.notes[i].note).length, 3, 'the answer moves');
  });
});
