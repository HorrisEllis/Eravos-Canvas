/* P41 · "Lost Love" songbook — the families of the playlist as nine genres (specs/eravos.p39-her-song.spec §1.1), each song
 * built for her voice: generated, run offline, Clip Maker wired into a Sample player, every preset named exists. */
window.__phase = 'P41';
describe('P41 · Lost Love songbook', () => {
  const GENRES = ['ll-deep', 'll-prog', 'll-drive', 'll-ruin', 'll-flaws', 'll-lullaby', 'll-raven', 'll-heartbeat', 'll-last-light'];
  it('the nine genres exist, every preset they name exists, and they sit in her keys (C# / D# / G# minor)', () => {
    const missing = [];
    GENRES.forEach(id => {
      const G = SongEngine.genres().find(g => g.id === id); if (!G) return missing.push('genre ' + id);
      const check = (org, presets) => [].concat(presets || []).forEach(p => { const d = OrganismFactory.def(org); if (!d) missing.push(id + ': no tool ' + org); else if (!(d.presets || {})[p]) missing.push(id + ': ' + org + ' has no preset “' + p + '”'); });
      Object.values(G.parts).forEach(P => check(P.organism, P.preset)); (G.fx || []).forEach(f => check(f.organism, f.preset)); (G.mods || []).forEach(m => check(m.organism, m.preset));
      G.roots.forEach(r => { if (![1, 3, 8].includes(r)) missing.push(id + ': root ' + r); });
    });
    assert.equal(missing.join(' · '), '');
  });
  GENRES.forEach((id, i) => it(`${id}: builds offline with no faults; her Clip Maker is wired into a Sample player`, async () => {
    const U = TH.universe(0.3, { bpm: 120 }), n0 = U.K.faults.list().length, rid = 'test.p41.' + id;
    Recipes.register({ id: rid, label: rid, steps: SongEngine.generate(id, 300 + i) });
    assert.ok(await Recipes.run(rid, { K: U.K, headless: true }), 'ran');
    assert.equal(U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | '), '', 'faults');
    const clip = U.K.registry.byOrganism('eravos.clip-maker')[0], samp = U.K.registry.byOrganism('eravos.sample-player')[0];
    assert.ok(clip && samp, 'Clip Maker + Sample mounted');
    assert.ok(U.K.wires.list().some(w => w.src.instanceId === clip.instance_id && w.dst.instanceId === samp.instance_id && w.dst.hookId === 'samp.hook.asset_in'), 'clips → Sample');
  }, { timeout: 30000 }));
  it('the shelf: LL1–LL10 by name, 55 songs in all, every one with a voice note and a genre that exists', () => {
    const all = Songbook.songs(), gs = new Set(SongEngine.genres().map(g => g.id));
    assert.equal(LostLoveSongbook.songs.length, 55);
    ['Sunrise Under Water', 'Heaven Takes the Long Way', 'Fly Back to Me', 'Sweet Ruin', 'Flaws', 'More Than You Knew', 'Antichrist Lullaby', 'Raven Drop', 'Heartbeat Only', 'Last Light']
      .forEach((t, i) => assert.equal((all.find(s => s.id === 'll' + (i + 1)) || {}).title, t));
    LostLoveSongbook.songs.forEach(id => { const s = all.find(x => x.id === id); assert.ok(s && gs.has(s.genre) && /Clip Maker/.test(s.voice), id); });
    assert.equal(new Set(all.map(s => s.id)).size, all.length, 'no duplicate ids');
  });
});
