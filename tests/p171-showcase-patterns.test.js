/* P171 — showcase patterns for Lofi, Synthwave and Wobble Bass, using the new tools and features. His words, 2026-11-12: "also can you
 * make some patterns testing all the new tools and features. lofi, synthwave, and wobblebass?" — and what they found: a library pattern
 * placed on the Timeline (and a pattern saved from the Workshop) kept only a note's knobs and bend; its shape, how it plays, chance and
 * ratchet were dropped. */
window.__phase = 'P171';
describe('P171 showcase patterns: lofi, synthwave, wobble bass', () => {
  const L = () => PatternLibrary.all().filter(p => /-showcase$/.test(p.genre) && p.source === 'hand-made · 3.171');   // the curve transform adds its own curves to these genres too
  const named = (tool, name) => { const all = []; ['presets', 'kits'].forEach(k => ContentPacks.items(tool, k).forEach(x => all.push(x.name, (x.packLabel || '') + ' · ' + x.name))); return all.includes(name); };
  it('thirteen patterns in three genres, on the new tools, every preset there, every feature used', () => {
    const P = L(); assert.equal(P.length, 13, P.length + ': ' + P.map(p => p.name.slice(0, 18) + '/' + p.type).join(' | ').slice(-400));
    assert.deepEqual([...new Set(P.map(p => p.genre))].sort(), ['lofi-showcase', 'synthwave-showcase', 'wub-showcase']);
    ['eravos.retro-dco', 'eravos.swarm-oscillator', 'eravos.wobble-bass', 'eravos.retro-poly', 'eravos.pads', 'eravos.sub-engine'].forEach(t => assert.ok(P.some(p => p.tool === t), 'a pattern on ' + t));
    P.forEach(p => { assert.ok(OrganismFactory.def(p.tool), p.tool + ' exists'); assert.ok(named(p.tool, p.preset), p.name + ': the preset “' + p.preset + '” is on ' + p.tool); });
    const N = P.flatMap(p => p.notes), has = (f) => N.some(f);
    assert.ok(has(n => n.sh && n.sh.t && n.sh.t.pitch && n.b && n.b.shape === 'path'), 'a pitch shape, compiled into what plays');
    assert.ok(has(n => n.c && Object.keys(n.c).length && n.sh && Object.keys(n.sh.t).some(t => t.startsWith('k:'))), 'a knob shaped over a note (c)');
    assert.ok(has(n => n.sh && Object.values(n.sh.t).some(s => (s.mods || []).some(m => (m.rate.mods || []).length || (m.depth.mods || []).length))), 'a modulator with a modulator (fractal)');
    assert.ok(has(n => n.x && n.x.iv && n.x.strum), 'a chord from one note, strummed');
    assert.ok(has(n => n.x && n.x.cond && n.x.cond.skip) && has(n => n.x && n.x.cond && !n.x.cond.skip), 'plays / skips on a pass');
    assert.ok(has(n => n.rt > 1 && n.x && n.x.rs === 'accel') && has(n => n.rt > 1 && n.x && n.x.rs === 'decel'), 'ratchets that speed up and slow down');
    assert.ok(has(n => n.x && n.x.tempo === 2), 'a note at double speed');
    assert.ok(has(n => n.x && (n.x.ht || n.x.hv)), 'humanize'); assert.ok(has(n => n.pr && n.pr < 1), 'chance'); assert.ok(has(n => n.mt), 'microtiming');
    assert.ok(has(n => n.p && n.p.vowelA) && has(n => n.p && n.p.div), 'a knob for one note');
    assert.ok(has(n => n.b && n.b.osc), 'oscillate');
  });
  it('placed on the Timeline, a pattern keeps everything its notes carry', async () => {
    const K = Kernel, p = L().find(x => /Lofi keys/.test(x.name)), r = PatternLibrary.send(p, { K, headless: true }); await TH.sleep(60);
    try {
      const T = OrganismFactory.handle(r.tl).ctx, clip = T.internals.clips.filter(c => c.lane === r.lane.id).pop(), n0 = clip.notes[0];
      assert.ok(n0.x && n0.x.iv && n0.x.iv.length === 4 && n0.x.strum, 'its chord and strum: ' + JSON.stringify(n0.x));
      assert.ok(n0.sh && n0.sh.t && n0.sh.t.pitch && n0.sh.t['k:cutoff'], 'its shape (it opens in the Workshop as it was made)');
      assert.ok(n0.c && n0.c.cutoff && n0.c.cutoff.length > 10, 'its filter curve plays'); assert.ok(n0.b && n0.b.shape === 'path', 'its pitch drift plays');
      const d = L().find(x => /Lofi drums/.test(x.name)), r2 = PatternLibrary.send(d, { K, headless: true }); await TH.sleep(60);
      const c2 = T.internals.clips.filter(c => c.lane === r2.lane.id).pop();
      assert.ok(c2.notes.some(n => n.pr) && c2.notes.some(n => n.rt > 1) && c2.notes.some(n => n.mt), 'drums keep chance, ratchet, microtiming');
    } finally { OrganismFactory.close(r.tl); }
  });
  it('a pattern saved from the Workshop keeps its shapes', () => {
    const PF = MusicParts.PF_LIB, before = PF.readSaved().length;
    const nm = PF.saveNotes('P171 saved', [{ s: 0, l: 8, n: 60, v: 0.8, x: { iv: [4, 7] }, pr: 0.5, rt: 3, sh: { t: { pitch: { base: [[0, 0], [1, 2]], mods: [] } } }, b: { from: 0, to: 2, shape: 'path', at: 0, path: [[0, 0], [1, 2]] } }], {});
    try { const s = PF.readSaved().find(q => q.name === nm), n = s.notes[0];
      assert.ok(n.x && n.x.iv && n.pr === 0.5 && n.rt === 3 && n.sh && n.sh.t.pitch, 'kept: ' + JSON.stringify(n).slice(0, 200));
    } finally { localStorage.setItem(PF.SAVED, JSON.stringify(PF.readSaved().filter(q => q.name !== nm))); assert.equal(PF.readSaved().length, before, 'cleaned up'); }
  });
  it('the curve transform gives these genres their curves too', () => { const c = PatternLibrary.all().filter(p => /-showcase$/.test(p.genre) && p.source !== 'hand-made · 3.171'); assert.gt(c.length, 5, c.length + ' curves'); });
  for (let i = 0; i < 13; i++) it('showcase pattern ' + (i + 1) + ' sounds (rendered off the canvas)', async () => {
    const p = L()[i]; const r = await PatternLibrary.render(p); assert.ok(r && !r.silent, p.name + ' is silent');
  });
});
