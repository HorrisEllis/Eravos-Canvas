/* Groove (eravos.groove-gen) — tests that travel with the tool. The contract is shared (tests/harness.js TH.toolContract):
 * spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is
 * obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.groove-gen');

describe('Groove 1.1 · feel and rows (3.71)', () => {
  const ctxOf = (id) => OrganismFactory.handle(id).ctx;
  function rig(params, bars) {
    const U = TH.universe(0.2, { bpm: 120 }), g = TH.spawn(U, 'eravos.groove-gen'), pads = TH.spawn(U, 'eravos.pads'), c = ctxOf(g);
    U.K.wires.register({ src: { instanceId: g, hookId: 'groove.hook.note_out' }, dst: { instanceId: pads, hookId: OrganismFactory.def('eravos.pads').hooks.find(h => h.event_type === 'note:trigger' && h.direction === 'in').hook_id } });
    c.params.setMany(Object.assign({ swing: 0, energy: 0.8 }, params || {}));
    const notes = []; U.K.bus.subscribe('note:trigger', (p) => { if (p._from === g) notes.push(p); }, 'test');
    return { U, g, c, notes, play: (n) => U.T.renderTicks(0, (n || 2) * 16, 0.05) };
  }
  const sig = (ns) => ns.map(n => n.note + '@' + n.time.toFixed(4) + ':' + n.velocity.toFixed(4)).join(' ');
  it('everything new at its default: the very same notes as 1.0 (an old song plays as it did)', () => {
    const a = rig(); a.play(4); const b = rig({ humanize: 0, accent: 0, rolls: 0, fill: 'off', evolve: 'off', loop: '2 bars' }); b.play(4);
    assert.gt(a.notes.length, 10); assert.equal(sig(a.notes), sig(b.notes));
  });
  it('mute and solo a row; pad sends a row to another pad; level scales its velocity', () => {
    const base = rig(); base.play(2); const kicks = base.notes.filter(n => n.note === 36);
    const m = rig({ rows: { mute: [true] } }); m.play(2); assert.equal(m.notes.filter(n => n.note === 36).length, 0, 'kick muted'); assert.gt(m.notes.length, 0, 'the rest plays');
    const s = rig({ rows: { solo: [false, false, false, true] } }); s.play(2); assert.ok(s.notes.length && s.notes.every(n => n.note === 36 + 3), 'only the hats');
    const p = rig({ rows: { pad: [5], level: [0.5] } }); p.play(2); const k2 = p.notes.filter(n => n.note === 41);
    assert.equal(k2.length, kicks.length, 'kicks on pad 6 now'); k2.forEach((n, i) => assert.near(n.velocity, kicks[i].velocity * 0.5, 1e-6));
  });
  it('humanize moves hits a little in time and level (same each play: it is seeded); accent: beats harder, off-beats softer', () => {
    const a = rig(); a.play(2); const h = rig({ humanize: 1 }); h.play(2); const h2 = rig({ humanize: 1 }); h2.play(2);
    assert.equal(h.notes.length, a.notes.length); const dt = h.notes.map((n, i) => Math.abs(n.time - a.notes[i].time)); assert.gt(Math.max(...dt), 0.002); assert.lt(Math.max(...dt), 0.0121);
    assert.equal(sig(h.notes), sig(h2.notes), 'the same each time');
    const ac = rig({ accent: 1 }); ac.play(2); const on = (ns) => ns.filter(n => Math.round((n.time - 0.05) / 0.125) % 4 === 0);
    on(ac.notes).forEach((n, i) => assert.ok(n.velocity >= on(a.notes)[i].velocity - 1e-9, 'beats no softer'));
    assert.ok(on(ac.notes).some((n, i) => n.velocity > on(a.notes)[i].velocity + 0.01), 'and some harder');
  });
  it('rolls: hats sometimes play 2–4 quick hits in a step; fill: the half-bar before every 2nd bar gets busier', () => {
    const a = rig({ energy: 1 }); a.play(4); const r = rig({ energy: 1, rolls: 1 }); r.play(4);
    const hat = (ns) => ns.filter(n => n.note === 39).length; assert.gt(hat(r.notes), hat(a.notes), 'more hat hits');
    const f = rig({ energy: 0.4, fill: '2' }); f.play(4); const plain = rig({ energy: 0.4 }); plain.play(4);
    const lateBar2 = (ns) => ns.filter(n => n.time >= 0.05 + 24 * 0.125 - 1e-6 && n.time < 0.05 + 32 * 0.125).length;
    assert.gt(lateBar2(f.notes), lateBar2(plain.notes), 'bar 2, second half: busier');
    assert.equal(f.notes.filter(n => n.time < 0.05 + 8 * 0.125).length, plain.notes.filter(n => n.time < 0.05 + 8 * 0.125).length, 'bar 1 first half: the same');
  });
  it('evolve: bar 3 differs from bar 1 though the painting is the same; loop 1 bar plays the first bar twice', () => {
    const e = rig({ evolve: '2', energy: 0.5 }); e.play(4);
    const bar = (ns, b) => ns.filter(n => n.time >= 0.05 + b * 2 - 1e-6 && n.time < 0.05 + (b + 1) * 2 - 1e-6).map(n => n.note + '@' + ((n.time - 0.05) % 2).toFixed(3)).join(' ');
    assert.ok(bar(e.notes, 0) !== bar(e.notes, 2), 'evolved');
    const l = rig({ loop: '1 bar', energy: 1, seed: 7 }); l.c.internals.map = l.c.internals.styleMap('house'); l.play(2);
    const steps = (ns, b) => ns.filter(n => n.time >= 0.05 + b * 2 - 1e-6 && n.time < 0.05 + (b + 1) * 2 - 1e-6 && n.note === 36).length;
    assert.equal(steps(l.notes, 1), 4, 'house kicks in bar 2: 4 (from bar 1 of the painting)');
  });
});
