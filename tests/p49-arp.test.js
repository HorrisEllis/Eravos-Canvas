/* P49.4a · the Arp as a part (map eravos.phase49-map P49.4a · spec arp.spec). James, 2026-10-22: "each ;arge tool rebuilt as parts
 * if it can be used by another suite or tool". */
window.__phase = 'P49';
describe('P49.4a · Arp — the arpeggiator as a part any instrument can use', () => {
  const F = () => OrganismFactory, ctxOf = (id) => F().handle(id).ctx;
  const wire = (U, a, ah, b, bh) => { const r = U.K.wires.register({ src: { instanceId: a, hookId: ah }, dst: { instanceId: b, hookId: bh } }); assert.ok(r.ok, `${ah} → ${bh}`); };
  function rig(params) {
    const U = TH.universe(0.2, { bpm: 120 }), a = TH.spawn(U, 'eravos.arp'), ss = TH.spawn(U, 'eravos.supersaw'), other = TH.spawn(U, 'eravos.supersaw');
    ctxOf(a).params.setMany(Object.assign({ order: 'up', div: '1/16', octaves: 1, gate: 0.5 }, params || {})); wire(U, a, 'arp.hook.note_out', ss, 'saw.hook.note_in');
    const got = []; U.K.bus.subscribe('note:trigger', (p) => { if (p._from === a) got.push(p); }, 'test');
    return { U, a, ss, other, got, hold: (notes, dur) => notes.forEach(n => U.K.bus.publish('note:trigger', { target: a, note: n, velocity: 0.8, time: 0, duration: dur || 8 })) };
  }
  it('a held triad at 1/16 up steps C E G C E G, to the wired instrument only', () => {
    const r = rig(); r.hold([60, 64, 67]); r.U.T.renderTicks(0, 6, 0);
    assert.deepEqual(r.got.map(p => p.note), [60, 64, 67, 60, 64, 67]); assert.ok(r.got.every(p => p.target === r.ss));
  });
  it('octaves, down, up-down (no repeated ends), random stays in the held notes', () => {
    assert.deepEqual(ctxOf(rig({ octaves: 2 }).a).sequence([60, 64, 67]), [60, 64, 67, 72, 76, 79]);
    assert.deepEqual(ctxOf(rig({ order: 'down' }).a).sequence([60, 64, 67]), [67, 64, 60]);
    assert.deepEqual(ctxOf(rig({ order: 'up-down' }).a).sequence([60, 64, 67, 72]), [60, 64, 67, 72, 67, 64]);
    const r = rig({ order: 'random' }); r.hold([60, 64, 67]); r.U.T.renderTicks(0, 16, 0); assert.ok(r.got.length === 16 && r.got.every(p => [60, 64, 67].includes(p.note)));
  });
  it('1/8t gives 12 notes a bar, at triplet times', () => {
    const r = rig({ div: '1/8t' }); r.hold([60, 64, 67]); r.U.T.renderTicks(0, 16, 0);
    assert.equal(r.got.length, 12); const beat = 60 / 120, t = r.got.map(p => p.time);
    for (let i = 1; i < t.length; i++) assert.lt(Math.abs(t[i] - t[i - 1] - beat / 3), 1e-6, 'a third of a beat apart');
  });
  it('fed by a wired Chords, it plays that chord; latch keeps playing after the notes end', () => {
    const r = rig(), c = TH.spawn(r.U, 'eravos.chord-gen'); ctxOf(c).params.setMany({ tension: 0.1, chordBars: 1 });
    wire(r.U, c, 'chordg.hook.chord_out', r.a, 'arp.hook.chord_in');
    let chord = null; r.U.K.bus.subscribe('harmony:chord', (p) => { if (p._from === c) chord = p; }, 'test');
    r.U.T.renderTicks(0, 8, 0);
    assert.ok(chord && r.got.length === 8 && r.got.every(p => chord.notes.includes(p.note)), 'every step is a note of the chord: ' + r.got.map(p => p.note).join(' '));
    const l = rig({ latch: true }); l.hold([60, 64], 0.2); l.U.T.renderTicks(0, 8, 0);
    assert.equal(l.got.length, 8, 'still stepping after the notes ended (0.2 s)');
  });
});
describe('P49.4b · an all-in-one tool points at its parts', () => {
  it('Wobble Bass and EDM Lab (all-in-one): their 📘 pages offer “As parts”, and the parts’ pages say what they are part of', () => {
    assert.equal(Suites.get('music.wub-lab').allInOne, 'eravos.wobble-bass'); assert.ok(!Suites.get('music.edm-lab').allInOne, '3.64: no all-in-one — the suite is EDM Lab');
    try {
      let el = ToolPage.open('eravos.wobble-bass', { K: Kernel }); assert.ok(/As parts: Wub Lab/.test(el.querySelector('.tp-asparts').textContent));
      el = ToolPage.open('eravos.wub-filter', { K: Kernel }); assert.ok(Array.from(el.querySelectorAll('.tp-partof')).some(b => /Wub Lab/.test(b.textContent)), 'Wub Filter: Part of Wub Lab');
      el = ToolPage.open('eravos.chord-gen', { K: Kernel }); assert.ok(Array.from(el.querySelectorAll('.tp-partof')).some(b => /EDM Lab/.test(b.textContent)));
    } finally { ToolPage.close(); }
  });
});
