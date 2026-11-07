/* P151 — patterns in the browser and on the Timeline (his words, 2026-11-07: "patterns need to be in the timeline or in the pattern
 * browser."). The Pattern tool's Factory presets are blocks in the pattern browser; a structure saved from the Workshop is one too; To the
 * Timeline puts exactly the notes that emerged on the instrument's track, in the song's key. */
window.__phase = 'P151';
describe('P151 patterns from structure — in the browser, on the Timeline', () => {
  it('every Pattern preset is a block in the browser, its notes the ones that emerge (as semitones from the root)', () => {
    const lib = PatternLibrary.rebuild(), mine = lib.filter(p => p.genre === 'shapes' && p.source === 'Pattern · Factory'), d = OrganismFactory.def('eravos.pattern-field');
    assert.equal(mine.length, Object.keys(d.presets).length, 'one block per preset (' + mine.map(p => p.name).join(', ') + ')');
    const one = mine.find(p => /Rising Line/.test(p.name)), r = MusicParts.PF.emerge(MusicParts.PF_TOOL.toStructure((k) => one.shape[k], { root: 9, scale: 'minor' }));
    assert.deepEqual(one.notes.map(n => n.s + ':' + (n.r + 9)), r.notes.map(x => x.s + ':' + x.n), 'its notes are what emerges from its structure');
    assert.ok(['bass', 'lead'].includes(one.type) && one.tool, 'sorted as ' + one.type + ', played by ' + one.tool);
  });
  it('Save to Patterns keeps a structure as a block; To the Timeline writes the emerged notes as a clip', async () => {
    const was = localStorage.getItem(MusicParts.PF_LIB.SAVED);
    try {
      localStorage.removeItem(MusicParts.PF_LIB.SAVED);
      const doc = Object.assign({}, MusicParts.PF_LIB.readSaved()[0] || {}, { bars: 2, densStart: 1, densEnd: 1, densShape: 'hold', seed: 9 });
      const nm = MusicParts.PF_LIB.saveShape(doc, 'Test Shape'); assert.equal(nm, 'Test Shape', 'saved');
      const blk = PatternLibrary.all().find(p => p.name === '▦ Test Shape'); assert.ok(blk && blk.source === 'your shape', 'it is a block in the browser');
      const U = TH.universe(0.2), res = PatternLibrary.send(blk, { K: U.K, headless: true }); assert.ok(res && res.tl, 'sent');
      const T = OrganismFactory.handle(res.tl).ctx, clip = T.internals.clips.find(c => c.name === blk.name); assert.ok(clip, 'a clip named after it is on the Timeline');
      const root = T.key ? +T.key.root || 0 : 0; assert.deepEqual(clip.notes.map(n => n.s + ':' + n.n).sort(), blk.notes.map(n => n.s + ':' + (n.r + root)).sort(), 'with exactly the notes that emerged, in the song\'s key');
    } finally { if (was === null) localStorage.removeItem(MusicParts.PF_LIB.SAVED); else localStorage.setItem(MusicParts.PF_LIB.SAVED, was); PatternLibrary.rebuild(); }
  });
});
