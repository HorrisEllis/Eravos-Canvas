/* P160 — the Workshop: navigate, pick the instrument, a note's speed, the note library (W3f, specs/eravos.workshop.spec ADDENDUM 2026-11-09 (4)).
 * His words, 2026-11-09: "The top half of the canvas should be able to collapse … make that like a mini piano roll preview so you can edit one at a
 * time … the mod section drop down menus not 1 million buttons … the top left … replace it with a drop-down menu to change to tool." · "Any tool
 * the piano roll can play. Also a note library, inside of the patterns library. Have 2 tabs. One for notes, the other for patterns. Agnostic note.
 * Also the tempo and speed it plays. Like have the tool speed up for a single note. Way more depth." */
window.__phase = 'P160';
describe('P160 navigate, the instrument, a note\'s speed, the note library', () => {
  const key = (k, o) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o || {})));
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make(notes, withInst) {
    host(); const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); let inst = null; if (withInst) { inst = OrganismFactory.spawn('eravos.wobble-bass', { x: 40, y: 700 }); await TH.sleep(120); }
    pub('lane_add', Object.assign({ kind: 'inst', name: 'Lead' }, inst ? { target: inst } : {})); await TH.sleep(80); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes }); await TH.sleep(80);
    const H = OrganismFactory.handle(id), clipOf = () => H.ctx.internals.clips.find(c => c.kind === 'notes'), laneOf = () => H.ctx.internals.lanes.find(l => l.kind === 'inst' && l.name === 'Lead'); H.view.openClip(clipOf().id); await TH.sleep(300);
    const done = () => { if (window.ContextMenu) ContextMenu.close(); if (window.PatternLibrary) { const pl = document.querySelector('.plib'); if (pl) PatternLibrary.open(); } if (window.Workshop && Workshop.current) Workshop.current.close(); OrganismFactory.close(id); if (inst) OrganismFactory.close(inst); CanvasWM.view = view0; CanvasWM.applyView(); };
    return { id, inst, H, roll: H.view.roll, clipOf, laneOf, done, pub };
  }
  const NOTES = [{ s: 0, l: 4, n: 60, v: 0.8 }, { s: 4, l: 4, n: 64, v: 0.7 }, { s: 8, l: 8, n: 67, v: 0.9 }];
  it('the navigator: a mini piano roll — a click opens a note, [ and ] step, it folds; choices are dropdowns; no label up top', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, WK = EravosTimelineWorkshop, cv = document.querySelector('.ws-app .ws-canvas'), r = cv.getBoundingClientRect();
      const G = WK.navGeom(ws.doc(), r.width, WK.navTop(r.height)), n2 = NOTES[2];
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + G.X(n2.s + 2), clientY: r.top + G.Y(n2.n) + G.rh / 2, pointerId: 1 }));
      cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.left + G.X(n2.s + 2), clientY: r.top + G.Y(n2.n) + G.rh / 2, pointerId: 1 })); await TH.sleep(20);
      assert.equal(ws.doc().sel, 2, 'a click on G4 in the navigator opens it');
      key('['); await TH.sleep(10); assert.equal(ws.doc().sel, 1, '[ = the previous note'); key(']'); await TH.sleep(10); assert.equal(ws.doc().sel, 2, '] = the next');
      const open0 = WK.navOpen, top0 = WK.navTop(r.height); key('n'); await TH.sleep(10); assert.equal(WK.navOpen, !open0, 'N folds it'); assert.ok(WK.navTop(r.height) < top0, 'the shaping view gets the room'); key('n');
      ws.select('chord'); await TH.sleep(10); assert.ok(document.querySelector('.ws-props select') && !Array.from(document.querySelectorAll('.ws-props .ws-chip')).some(c => /minor 9/.test(c.textContent)), 'the chord is a dropdown, not a wall of buttons');
      ws.set('add', 'Pitch'); ws.action('＋ MOD'); ws.select('m:0'); await TH.sleep(10); assert.ok(Array.from(document.querySelectorAll('.ws-props select')).some(s => Array.from(s.options).some(o => o.value === 'triangle')), 'the wave too');
      assert.ok(!/MOD 1/.test(document.querySelector('.ws-opts').textContent), 'the options bar no longer repeats what is selected');
    } finally { t.done(); }
  });
  it('the instrument: any tool the roll can play, picked up top; a new one is added; the lane follows, and undo puts it back', async () => {
    const t = await make(NOTES, true);
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, sel = document.querySelector('.ws-opts .ws-picker');
      assert.ok(sel && sel.querySelectorAll('optgroup').length === 2, 'a dropdown: on the canvas · add one'); assert.equal(sel.value, t.inst, 'showing the lane\'s instrument');
      const nw = Array.from(sel.querySelectorAll('option')).find(o => /^new:/.test(o.value) && o.value !== 'new:eravos.wobble-bass'); assert.ok(nw, 'and the instruments that can be added');
      const before = new Set(Kernel.registry.list().map(r => r.instance_id)); ws.set('instrument', nw.value, 'Plays'); await TH.sleep(150);
      const added = Kernel.registry.list().map(r => r.instance_id).filter(x => !before.has(x)); assert.equal(added.length, 1, 'a new instrument was added');
      assert.equal(t.laneOf().target, added[0], 'the lane plays it now'); assert.ok(Array.isArray(ws.doc().knobs), 'its knobs are the ones to shape');
      ws.undo(); await TH.sleep(80); assert.equal(t.laneOf().target, t.inst, 'undo: the lane plays the first one again');
      added.forEach(x => OrganismFactory.close(x));
    } finally { t.done(); }
  });
  it('a note\'s speed: the Timeline sends it; the tool runs that many times faster for that note, then comes back', async () => {
    const t = await make(NOTES, true);
    try {
      t.roll.openWorkshop(1); await TH.sleep(40); const ws = Workshop.current; ws.set('x.tempo', '2 ×'); await TH.sleep(20);
      assert.equal(t.clipOf().notes[1].x.tempo, 2, 'kept on the note');
      const ctx = new OfflineAudioContext(1, 8000, 8000), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot();
      const tl = OrganismFactory.spawn('eravos.timeline', { K, headless: true }), wb = OrganismFactory.spawn('eravos.wobble-bass', { K, headless: true });
      K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: wb, name: 'B' }); K.bus.publish('ui:clip_add:' + tl, { kind: 'notes', target: wb, startBar: 1, bars: 1, notes: [{ s: 0, l: 4, n: 40, v: 0.9, x: { tempo: 2 } }] });
      const sent = []; K.bus.subscribe('note:trigger', (p) => { if (p.target === wb) sent.push(p); }); T.renderTicks(0, 16, 0.1); assert.equal(sent[0].tempo, 2, 'the trigger carries the speed');
      const tool = OrganismFactory.handle(t.inst).ctx, bpm0 = tool.bpm, ac = Kernel.audio.ctx, heard = []; const off = tool.onBpm ? tool.onBpm(b => heard.push(b)) : null;
      Kernel.bus.publish('note:trigger', { target: t.inst, note: 40, velocity: 0.8, time: ac.currentTime, duration: 0.15, tempo: 2 });
      assert.near(tool.bpm, bpm0 * 2, 1e-9, 'while it plays, the tool runs at twice the tempo (' + tool.bpm + ')');
      await TH.sleep(500); assert.near(tool.bpm, bpm0, 1e-9, 'after it, the tool\'s own tempo again'); void off; void heard;
    } finally { t.done(); }
  });
  it('the note library: Ctrl+S keeps a note; it fits another note (and says what an instrument lacks); Patterns has a Notes tab that applies it', async () => {
    const t = await make(NOTES);
    const mine = []; const before = new Set(NoteLibrary.all().map(s => s.id));
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current;
      ws.set('add', 'Pitch'); ws.action('＋ MOD'); ws.set('m.0.depth', 1.5); ws.action('▴ UP'); ws.set('x.chord', 'major'); await TH.sleep(10);
      key('s', { ctrlKey: true }); await TH.sleep(20); NoteLibrary.all().filter(s => !before.has(s.id)).forEach(s => mine.push(s.id));
      assert.equal(mine.length, 1, 'Ctrl+S saved it'); const sv = NoteLibrary.get(mine[0]); assert.ok(sv.note.sh && sv.note.x && sv.note.n === undefined && sv.note.s === undefined, 'kept without its place or pitch');
      const r = NoteLibrary.applyTo({ s: 4, n: 50, l: 2, v: 0.5, }, Object.assign({}, sv, { note: Object.assign({}, sv.note, { p: { cutoff: 900 } }) }), ['drive']);
      assert.ok(r.note.s === 4 && r.note.n === 50 && r.note.sh.t.pitch && r.note.x.iv, 'it fits another note: its place and pitch stay'); assert.deepEqual(r.dropped, ['cutoff'], 'a knob this instrument does not have is said, not hidden');
      key(']'); await TH.sleep(10); ws.set('libApply', mine[0]); await TH.sleep(20); assert.ok(t.clipOf().notes[1].sh && t.clipOf().notes[1].x.iv, 'From the library puts it on the open note');
      PatternLibrary.open({ tab: 'notes' }); await TH.sleep(80); const pl = document.querySelector('.plib');
      assert.ok(pl && pl.querySelectorAll('.plib-tab').length === 2, 'Patterns has two tabs: Patterns · Notes');
      const card = Array.from(pl.querySelectorAll('.nlib-card')).find(c => c.textContent.includes(sv.name)); assert.ok(card, 'the saved note is on the Notes tab');
      key(']'); await TH.sleep(10); const apply = Array.from(card.querySelectorAll('button')).find(b => b.textContent === 'Apply'); assert.ok(apply && !apply.disabled, 'Apply is there while a note is open'); apply.click(); await TH.sleep(30);
      assert.ok(t.clipOf().notes[2].sh && t.clipOf().notes[2].x.iv, 'Apply put it on the note open in the Workshop');
    } finally { mine.forEach(id => NoteLibrary.remove(id)); t.done(); }
  });
});
