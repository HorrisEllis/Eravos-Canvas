/* P116 · Empty canvas = every tool empty of presets — his words, 2026-11-06: "Can you when picking empty canvas have every tool
 * empty of presets?"
 *   · after Start › Empty canvas (OrganismFactory.blankStart(true)) a tool added opens on its own plain settings: no preset loaded
 *   · a non-empty start turns it off: tools open on their default preset, as before
 *   · a saved tool (state) and a preview (ephemeral) are not touched */
window.__phase = 'P116';
describe('P116 · Empty canvas: tools start blank', () => {
  const withPreset = () => OrganismFactory.defined().filter(d => d.defaultPreset && d.presets && d.presets[d.defaultPreset] && !d.singleton);
  it('blank start: no tool loads its default preset; off again: every one does', () => {
    const was = OrganismFactory.blankStart(), defs = withPreset();
    assert.gt(defs.length, 5, 'tools with a default preset are defined');
    try {
      OrganismFactory.blankStart(true);
      const U = TH.universe(0.2);
      defs.forEach(d => { const c = OrganismFactory.handle(TH.spawn(U, d.id)).ctx; assert.ok(!c.currentPreset, d.id + ' opened on ' + c.currentPreset); });
      OrganismFactory.blankStart(false);
      const V = TH.universe(0.2);
      defs.forEach(d => { const c = OrganismFactory.handle(TH.spawn(V, d.id)).ctx; assert.equal(c.currentPreset, d.defaultPreset, d.id); });
    } finally { OrganismFactory.blankStart(was); }
  });
  it('remembered across restarts; previews still sound like the tool', () => {
    const was = OrganismFactory.blankStart(), d = withPreset()[0];
    try {
      OrganismFactory.blankStart(true); assert.equal(localStorage.getItem('eravos.blankStart'), '1', 'kept');
      const U = TH.universe(0.2), c = OrganismFactory.handle(TH.spawn(U, d.id, { ephemeral: true })).ctx;
      assert.equal(c.currentPreset, d.defaultPreset, 'a preview loads its preset');
      OrganismFactory.blankStart(false); assert.equal(localStorage.getItem('eravos.blankStart'), null, 'cleared');
    } finally { OrganismFactory.blankStart(was); }
  });
});
