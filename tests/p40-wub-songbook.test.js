/* P40 · Wub & Reese songbook — nine bass genres built on the bass tools, and the songs shelved in them.
 * Each genre's song is generated, then run as a recipe in an offline universe: everything mounts, every preset named exists,
 * the Wub rig is wired (Wub Rate → Wub Filter "wub"), and no fault is raised. */
window.__phase = 'P40';
describe('P40 · Wub & Reese songbook', () => {
  const GENRES = ['wub-rig', 'dancehall-dubstep', 'brostep-wub', 'talker', 'melodic-wub', 'reese-roller', 'halftime-reese', 'wub-neuro', 'reese-vs-wub'];
  it('the nine genres are registered, and every preset they name exists on its tool', () => {
    const all = SongEngine.genres(), missing = [];
    GENRES.forEach(id => {
      const G = all.find(g => g.id === id); if (!G) return missing.push('genre ' + id);
      const check = (org, presets) => [].concat(presets || []).forEach(p => { const d = OrganismFactory.def(org); if (!d) missing.push(id + ': no tool ' + org); else if (!(d.presets || {})[p]) missing.push(id + ': ' + org + ' has no preset “' + p + '”'); });
      Object.values(G.parts).forEach(P => check(P.organism, P.preset)); (G.fx || []).forEach(f => check(f.organism, f.preset)); (G.mods || []).forEach(m => check(m.organism, m.preset));
    });
    assert.equal(missing.join(' · '), '');
  });
  it('the same genre + seed writes the same song; mods only appear in genres that ask for them', () => {
    assert.equal(JSON.stringify(SongEngine.generate('wub-rig', 7)), JSON.stringify(SongEngine.generate('wub-rig', 7)));
    assert.ok(SongEngine.generate('wub-rig', 7).some(s => s.op === 'modulate'), 'the rig wires Wub Rate');
    assert.ok(!SongEngine.generate('dubstep', 7).some(s => s.op === 'modulate' || /^mod\d/.test(s.as || '')), 'older genres untouched');
  });
  GENRES.forEach((id, i) => it(`${id}: the song builds in an offline universe with no faults`, async () => {
    const U = TH.universe(0.3, { bpm: 140 }), n0 = U.K.faults.list().length, rid = 'test.p40.' + id;
    Recipes.register({ id: rid, label: rid, steps: SongEngine.generate(id, 100 + i) });
    const r = await Recipes.run(rid, { K: U.K, headless: true });
    assert.ok(r, 'ran'); assert.equal(U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | '), '', 'faults');
    const G = SongEngine.genres().find(g => g.id === id);
    Object.values(G.parts).concat(G.fx || [], G.mods || []).forEach(p => assert.ok(U.K.registry.byOrganism(p.organism).length >= 1, 'mounted ' + p.organism));
    if ((G.mods || []).some(m => m.to)) {
      const rate = U.K.registry.byOrganism('eravos.wub-rate')[0].instance_id, filt = U.K.registry.byOrganism('eravos.wub-filter')[0].instance_id;
      assert.ok(U.K.wires.list().some(w => w.src.instanceId === rate && w.dst.instanceId === filt && w.dst.hookId === 'wubf.hook.mod_wub'), 'Wub Rate → Wub Filter “wub”');
      assert.ok(U.K.wires.list().some(w => w.dst.instanceId === filt && w.dst.hookId === 'fx.hook.audio_in'), 'Wub Osc → Wub Filter');
    }
  }, { timeout: 30000 }));
  it('the shelf: 91 songs, each in a genre that exists, ids unique', () => {
    const ids = WubSongbook.songs, all = Songbook.songs(), gs = new Set(SongEngine.genres().map(g => g.id));
    assert.equal(ids.length, 91, 'songs on the shelf');
    ids.forEach(id => { const s = all.find(x => x.id === id); assert.ok(s, id); assert.ok(gs.has(s.genre), id + ' → ' + s.genre); assert.ok(s.listen && s.drop && s.voice, id + ' has notes'); });
    assert.equal(new Set(all.map(s => s.id)).size, all.length, 'no duplicate song ids');
  });
});
