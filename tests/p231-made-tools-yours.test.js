/* P231 — a made tool is his: rename it, open it in the Workshop and edit it fully, delete it (3.231). His words, 2026-11-26: "need to be able to
 * delete custom tools. rename them. open them in workshop and edit them fully." The test makes a tool the way ERAVOS does, then acts as he would. */
window.__phase = 'P231';
describe('P231 made tools: rename, Workshop, delete', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const novelty = () => new Promise(res => { if (window.MusicNovelty) return res(window.MusicNovelty); const s = document.createElement('script'); s.src = (window.ERAVOS_TOOLS || '../tools/') + 'music/compat/novelty.js'; s.onload = () => res(window.MusicNovelty); document.head.appendChild(s); });
  it('renamed everywhere, edited fully in the Workshop (kept and heard at once), deleted whole', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []); let id = null, inst = null;
    try {
      const N = await novelty(), P = Object.assign(AssembledTool.defaults(), { cutoff: 700, reso: 0.6, rate: '1/16', lfoShape: 'square', drive: 'bitcrusher', dCrushBits: 6 });
      const m = AssembledTool.make('P231 Tool', P, 120, N, ['Wobble Bass']); assert.ok(m.ok, 'made: ' + (m.why || '')); id = m.id;
      inst = OrganismFactory.spawn(id, { x: 20, y: 20 }); await TH.sleep(400); const H = OrganismFactory.handle(inst), win = CanvasWM.windowOf(inst);
      // its face offers all three
      ['Workshop', 'Rename', 'Delete tool'].forEach(t => assert.ok([...win.querySelectorAll('button')].some(b => b.textContent.includes(t)), 'a ' + t + ' button'));
      // rename
      H.view.emit('rename_tool', { name: 'Night Engine' }); await TH.sleep(50);
      assert.equal(OrganismFactory.def(id).label, 'Night Engine', 'its name'); assert.equal(AssembledTool.get(id).name, 'Night Engine', 'kept');
      assert.equal(win.querySelector('.wm-title').textContent, 'Night Engine', 'its window says so'); assert.equal(AssembledTool.get(id).id, id, 'the same tool (its id stays)');
      // the Workshop: every place a layer; a part swapped brings its own fields; each edit kept and reaching the open window
      H.view.emit('edit_workshop', {}); await TH.sleep(200); const ws = Workshop.current; assert.ok(ws, 'the Workshop is open');
      const layers = AssembledTool.KIND.layers(ws.doc()); assert.deepEqual(layers.map(l => l.id), ['tool', 'voice', 'wobble', 'drive', 'mouth', 'fx', 'out'], 'every place a layer');
      assert.ok(layers.find(l => l.id === 'drive').fields.some(f => f.key === 'dCrushBits'), "the drive's part brings its own fields");
      ws.set('cutoff', 1500); await TH.sleep(80); assert.equal(AssembledTool.get(id).settings.cutoff, 1500, 'kept with the tool'); assert.equal(H.ctx.params.get('cutoff'), 1500, 'the open window follows');
      ws.set('mouth', 'filter-ladder'); await TH.sleep(80); assert.ok(AssembledTool.KIND.layers(ws.doc()).find(l => l.id === 'mouth').fields.some(f => f.key === 'mLadDrive'), 'a part swapped: its fields');
      assert.equal(H.ctx.params.get('mouth'), 'filter-ladder', 'and the window swaps it'); ws.set('name', 'Night Engine II'); await TH.sleep(50); assert.equal(OrganismFactory.def(id).label, 'Night Engine II', 'renamed from the Workshop');
      ws.undo(); await TH.sleep(50); assert.equal(OrganismFactory.def(id).label, 'Night Engine', 'one undo step'); ws.close();
      // delete: every window closes, the record and the catalog entry go
      H.view.emit('delete_tool', {}); await TH.sleep(150);
      assert.ok(!OrganismFactory.handle(inst), 'its window closed'); assert.ok(!AssembledTool.get(id), 'its record gone'); assert.ok(!OrganismFactory.def(id), 'gone from ＋ Add'); id = null;
    } finally { if (Workshop.current) Workshop.current.close(); if (id) { AssembledTool.remove(id); } MadeTools.save(AssembledTool.MADE_KEY, keep); }
  });
});
