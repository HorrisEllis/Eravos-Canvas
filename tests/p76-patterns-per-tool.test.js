/* 3.76 — James, 2026-10-30: "I need patterns per tool for the timeline. I want it to be easier to make and understand music … I get
 * overwhelmed by too much information or clutter." ♪ on every instrument track: what fits that tool, one kind and five at a time. */
window.__phase = 'P76';
describe('♪ Patterns per tool on the Timeline (3.76)', () => {
  function host() { const host = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('forTool: a tool with its own patterns gets only those; a tool with none gets the kinds it can play, each kind said in one line', () => {
    const wob = PatternLibrary.all().find(p => p.type === 'wobble').tool, F = PatternLibrary.forTool(wob);
    assert.ok(F.exact, 'the wobble tool has its own'); assert.ok(F.list().every(p => p.tool === wob), 'only its own');
    assert.ok(F.kinds.every(k => k.about.length > 10 && k.n > 0), 'every kind explained and not empty');
    const drums = PatternLibrary.forTool('eravos.no-such-kit', { drums: true });
    assert.ok(!drums.exact); assert.equal(drums.kinds[0].id, 'drums', 'a kit gets drum grooves first'); assert.ok(drums.list('drums').length > 20);
  });
  it('♪ patterns on a track: five rows, sorted by genre with a picker (3.77b), ↻ shows five others, ＋ add puts it on THIS track after its last clip', async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 }), syn = OrganismFactory.spawn('eravos.supersaw', { x: 900, y: 10 });
    try {
      await TH.sleep(30); const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p), I = OrganismFactory.handle(tl).ctx.internals, root = OrganismFactory.handle(tl).view.root;
      pub('lane_add', { kind: 'inst', target: syn, name: 'Keys' }); pub('clip_add', { kind: 'notes', target: syn, startBar: 1, bars: 2, notes: [{ s: 0, l: 4, n: 60, v: 1 }] }); await TH.sleep(40);
      const b = root.querySelector('button[aria-label="Patterns for this track"]'); assert.ok(b, 'a ♪ on the track'); b.click(); await TH.sleep(20);
      const pp = document.querySelector('.tl-patp'); assert.ok(pp, 'the panel opens');
      assert.equal(pp.querySelectorAll('.tl-patp-row').length, 5, 'five at a time'); assert.ok(pp.querySelector('.tl-patp-about').textContent.length > 10, 'what this kind is, in a line');
      const first = pp.querySelector('.tl-patp-txt span').textContent;
      [...pp.querySelectorAll('button')].find(x => /5 others/.test(x.textContent)).click(); await TH.sleep(10);
      assert.ok(document.querySelector('.tl-patp .tl-patp-txt span').textContent !== first, 'five others');
      const lane = I.lanes.find(l => l.name === 'Keys'), n0 = I.clips.filter(c => c.lane === lane.id).length;
      document.querySelector('.tl-patp .tl-patp-row .uk-btn.primary').click(); await TH.sleep(30);
      const mine = I.clips.filter(c => c.lane === lane.id).sort((x, y) => x.startBar - y.startBar);
      assert.equal(mine.length, n0 + 1, 'one more clip on this track'); assert.equal(mine.at(-1).startBar, 3, 'after the 2-bar clip');
      assert.equal(I.lanes.filter(l => l.kind === 'inst').length, 1, 'no new track');
      assert.ok(/added at bar 3/.test(document.querySelector('.tl-patp-said').textContent), 'it says where');
      const gsel = document.querySelector('.tl-patp-genre'); assert.ok(gsel && gsel.options.length > 2, 'a genre picker');
      const heads = [...document.querySelectorAll('.tl-patp-g')].map(e => e.textContent); assert.deepEqual(heads, heads.slice().sort((a, b) => a.localeCompare(b)), 'A–Z by genre');
      gsel.value = gsel.options[2].value; gsel.dispatchEvent(new Event('change')); await TH.sleep(10);
      assert.equal(new Set([...document.querySelectorAll('.tl-patp-g')].map(e => e.textContent)).size, 1, 'one genre picked → one genre shown');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await TH.sleep(10); assert.ok(!document.querySelector('.tl-patp'), 'Esc closes');
    } finally { document.querySelectorAll('.tl-patp').forEach(e => e.remove()); OrganismFactory.close(tl); OrganismFactory.close(syn); }
  });
});
/* 3.85 — James, 2026-11-01, on the Patterns page: "can you clean up the pattern ui, sort it by tool instead? its overwhelming." */
describe('🧩 Patterns page by tool (3.85)', () => {
  it('opens on one tool, not the wall; the tools down the left; picking one shows only its patterns, by kind; the other filters fold away', () => {
    try { localStorage.removeItem('eravos.patterns.page'); } catch (e) {} PatternLibrary.forget();   // a first open
    if (document.querySelector('.plib')) PatternLibrary.open(); const pg = PatternLibrary.open(), ov = document.querySelector('.plib');
    try {
      const rail = [...ov.querySelectorAll('.plib-rt')]; assert.gt(rail.length, 5, 'a list of tools — every tool, even with a filter left on'); assert.ok(rail.some(b => b.dataset.tool === ''), 'and Every tool');
      assert.ok(ov.querySelector('.plib-adv').hidden, 'the other filters are folded away'); assert.ok(ov.querySelector('.plib-fam').closest('[hidden]'), 'genre chips not on show');
      const on = ov.querySelector('.plib-rt.on'); assert.ok(on && on.dataset.tool, 'one tool chosen');
      const pick = rail.find(b => b.dataset.tool && b.dataset.tool !== on.dataset.tool); pick.click();
      const id = pick.dataset.tool, want = PatternLibrary.all().filter(p => p.tool === id && p.type !== 'chain').length;
      assert.ok(new RegExp('^' + want + ' shown').test(ov.querySelector('.plib-top-row .sbk-sub').textContent), 'only its ' + want + ' patterns');
      assert.ok(ov.querySelector('.plib-tname').textContent.includes(OrganismFactory.def(id).label), 'its name on top');
      const g = ov.querySelector('.plib-gsel'); assert.gt(g.options.length, 1, 'one genre menu');
      ov.querySelector('.plib-morebtn').click(); assert.ok(!ov.querySelector('.plib-adv').hidden, '⚙ More filters opens them');
      ov.querySelector('.plib-morebtn').click();
    } finally { pg.close(); }
  });
});
