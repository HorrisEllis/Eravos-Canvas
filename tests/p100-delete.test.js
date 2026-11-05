/* 3.101 — James, 2026-11-04: "i want to be able to delete packs, patterns … I don't need them brought back. some of them suck and i want
 * to clean them up. some of them dont sound good, or are blown." Delete is for good: a shipped pack, one shipped preset (or kit, or any
 * item a pack holds), or one pattern — gone from every list, and still gone after a restart (kept in this machine's storage). */
window.__phase = 'P100';
describe('🗑 delete packs, presets and patterns for good (3.101)', () => {
  const KEYS = ['eravos.contentpacks.deleted.v1', 'eravos.patterns.deleted.v1'];
  let saved; const snap = () => { saved = KEYS.map(k => localStorage.getItem(k)); }, back = () => KEYS.forEach((k, i) => saved[i] === null ? localStorage.removeItem(k) : localStorage.setItem(k, saved[i]));
  it('a shipped pack: gone, its presets leave the tool, and adding it again (a restart) does nothing', () => {
    snap(); const p = ContentPacks.list({ kind: 'presets' }).find(x => !x.user && x.enabled), pk = ContentPacks.get(p.id), tool = p.for[0];
    const key = Object.keys(OrganismFactory.def(tool).presets).find(k => Object.keys(pk.items[tool].presets).some(n => k.endsWith(n)));
    try {
      assert.ok(ContentPacks.discard(p.id)); assert.ok(!ContentPacks.get(p.id), 'gone from the registry');
      assert.ok(!(key in (OrganismFactory.def(tool).presets || {})), 'its presets left the menu');
      assert.equal(ContentPacks.add(pk), false, 'registering it again (a restart) is refused'); assert.ok(!ContentPacks.get(p.id));
      assert.ok(ContentPacks.deleted().packs[p.id], 'kept in storage');
    } finally { back(); ContentPacks.add(pk); }
  });
  it('one shipped preset: the rest of its pack stays, and it stays out when the pack loads again', () => {
    snap(); const p = ContentPacks.list({ kind: 'presets' }).find(x => !x.user && x.enabled && x.count > 2), pk = ContentPacks.get(p.id), tool = p.for.find(t => pk.items[t].presets);
    const names = Object.keys(pk.items[tool].presets), gone = names[0];
    try {
      assert.ok(ContentPacks.discardPreset(p.id, tool, gone));
      const now = Object.keys(ContentPacks.get(p.id).items[tool].presets); assert.equal(now.length, names.length - 1); assert.ok(!now.includes(gone));
      assert.ok(!Object.keys(OrganismFactory.def(tool).presets).some(k => k === gone || k.endsWith(' · ' + gone)), 'out of the menu');
      ContentPacks.add(pk); assert.ok(!(gone in ContentPacks.get(p.id).items[tool].presets), 'still out after the pack loads again');
      assert.ok(gone in pk.items[tool].presets, 'the shipped data itself is not changed (only filtered)');
    } finally { back(); ContentPacks.add(pk); }
  });
  it('a pattern: gone from the library and from its tool, and still gone after the library is built again', () => {
    snap(); const lib = PatternLibrary.all(), p = lib.find(x => x.notes && x.type !== 'chain'), n = lib.length, tool = p.tool;
    try {
      PatternLibrary.discard(p);
      const sig = (x) => x.name + '|' + x.tool + '|' + JSON.stringify(x.notes);
      assert.equal(PatternLibrary.all().length, n - 1); assert.ok(!PatternLibrary.all().some(x => sig(x) === sig(p)));
      assert.ok(!PatternLibrary.forTool(tool).list().some(x => sig(x) === sig(p)), 'not offered to its tool');
      assert.ok(!PatternLibrary.rebuild().some(x => sig(x) === sig(p)), 'built again: still gone'); assert.equal(PatternLibrary.deleted().length, 1 + JSON.parse(saved[1] || '[]').length);
    } finally { back(); PatternLibrary.rebuild(); }
  });
});
