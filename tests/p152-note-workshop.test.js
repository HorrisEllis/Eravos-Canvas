/* W2a · James, 2026-11-08: "When you right click on edit note. Does it open the workshop?" · "do that. editing a note, whether in the
 * pattern menu or in the timeline." — notes open in the Workshop from the Timeline and from Patterns; every edit reaches the clip live */
window.__phase = 'P152';
describe('P152 · editing notes in the Workshop (Timeline and Patterns)', () => {
  const host = () => { if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } };
  const rig = async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 }), syn = OrganismFactory.spawn('eravos.supersaw', { x: 900, y: 10 });
    await TH.sleep(30); const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p), I = OrganismFactory.handle(tl).ctx.internals;
    pub('lane_add', { kind: 'inst', target: syn, name: 'Keys' }); pub('clip_add', { kind: 'notes', target: syn, startBar: 1, bars: 2, notes: [{ s: 0, l: 4, n: 60, v: 0.8 }, { s: 8, l: 2, n: 64, v: 0.6 }] }); await TH.sleep(40);
    return { tl, syn, I, clip: () => I.clips.find(c => c.kind === 'notes') };
  };
  const done = (r) => { if (Workshop.current) Workshop.current.close(); OrganismFactory.close(r.tl); OrganismFactory.close(r.syn); };
  it('from the Timeline: the clip opens in the Workshop; a note edit, an add, a per-note knob and a delete reach the clip live; undo puts it back', async () => {
    const r = await rig();
    try {
      const ws = NoteWorkshop.open({ tl: r.tl, clip: r.clip().id }); assert.ok(ws && Workshop.current === ws && ws.kind === 'music.notes', 'the Workshop, on the notes kind');
      assert.equal(ws.doc().notes.length, 2, 'the clip’s notes');
      ws.set('sel', 0); ws.set('n', 62, 'Pitch'); await TH.sleep(10); assert.equal(r.clip().notes[0].n, 62, 'pitch reached the clip');
      ws.set('l', 6, 'Length'); ws.set('b.to', -12, 'To'); await TH.sleep(10); assert.equal(r.clip().notes[0].l, 6); assert.equal(r.clip().notes[0].b.to, -12, 'the bend');
      const knob = ws.doc().knobs[0]; assert.ok(knob, 'the instrument’s knobs are offered'); ws.set('p.' + knob.key, knob.min, knob.label); await TH.sleep(10);
      assert.equal(r.clip().notes[0].p[knob.key], knob.min, 'this note’s own knob');
      ws.set('add', { s: 20, n: 67 }, 'ADD'); await TH.sleep(10); assert.equal(r.clip().notes.length, 3, 'a note added'); assert.ok(r.clip().notes.some(n => n.n === 67 && n.s === 20));
      const del = Array.from(ws.el.querySelectorAll('.ws-btn')).find(b => b.textContent === 'DELETE NOTE'); assert.ok(del, 'DELETE NOTE in the bar'); del.click(); await TH.sleep(10);
      assert.equal(r.clip().notes.length, 2, 'deleted (an action that edits)');
      ws.undo(); await TH.sleep(10); assert.equal(r.clip().notes.length, 3, 'undo brings it back');
      while (ws.undo()) {} await TH.sleep(10); assert.deepEqual(r.clip().notes.map(n => [n.s, n.l, n.n]), [[0, 4, 60], [8, 2, 64]], 'all the way back');
      const pr = Array.from(ws.el.querySelectorAll('.ws-btn')).find(b => b.textContent === 'PIANO ROLL'); pr.click(); await TH.sleep(10);
      assert.ok(!Workshop.current, 'the piano roll instead: the Workshop closed');
    } finally { done(r); }
  });
  it('a click on the roll selects a note or adds one; from Patterns, ✎ Edit notes opens the Workshop on the new clip', async () => {
    const r = await rig();
    try {
      const ws = NoteWorkshop.open({ tl: r.tl, clip: r.clip().id }), d = ws.doc(), W = 600, H = 300, G = NoteWorkshop.KIND.geom(d, W, H);
      const at = (s, n) => [G.padL + (s + 0.5) * G.sx, 8 + (G.hi - n + 0.5) * G.rh];
      assert.deepEqual(NoteWorkshop.KIND.pick(d, ...at(1, 60), W, H), { key: 'sel', value: 0, label: 'SELECT C4' }, 'on a note: select');
      const p = NoteWorkshop.KIND.pick(d, ...at(12, 62), W, H); assert.equal(p.key, 'add'); assert.deepEqual(p.value, { s: 12, n: 62 }, 'on an empty spot: add there');
      ws.close();
      const pat = PatternLibrary.all().find(x => x.notes && x.notes.length && x.type === 'lead'); assert.ok(pat, 'a lead pattern');
      const res = PatternLibrary.edit(pat, { K: Kernel }); await TH.sleep(120);
      assert.ok(res && res.clip, 'it went to the Timeline'); assert.ok(Workshop.current && Workshop.current.kind === 'music.notes', 'and opened in the Workshop');
      assert.equal(Workshop.current.doc().clip, res.clip, 'on that clip'); Workshop.current.close(); OrganismFactory.close(res.tool);
    } finally { done(r); Kernel.registry.byOrganism('eravos.timeline').forEach(t => OrganismFactory.close(t.instance_id)); }
  });
});
