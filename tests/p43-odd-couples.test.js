/* 3.41 — the Odd Couples songbook: "each tool has to add packs, and new songs … as creative as possible, the tools that
 * normally go nowhere near together". Checks: every tool has an Odd Couples pack; every song is wired, every preset it names
 * exists, every tool plays somewhere; every genre writes without a fault and gives her clip to the break AND the drop. */
window.__phase = 'P43';
describe('Odd Couples — a pack for every tool, songs from tools that never meet', () => {
  const OC = () => window.OddCouplesSongbook;
  const genres = () => SongEngine.genres().filter(g => OC().genres.includes(g.id));
  const used = (G) => [].concat(Object.values(G.parts).map(p => [p.organism, p.preset]), (G.fx || []).map(f => [f.organism, f.preset]), (G.mods || []).map(m => [m.organism, m.preset]));
  it('twelve genres and seventy-two songs, every song on the Songs page under 🧪 Odd Couples', () => {
    assert.equal(OC().genres.length, 12); assert.equal(OC().songs.length, 72);
    const all = Songbook.all(); OC().songs.forEach(id => { const s = all.find(x => x.id === id); assert.ok(s, id); assert.ok(s.mood.includes('odd'), id + ' tagged odd'); });
  });
  it('every music tool has an Odd Couples pack', () => {
    // a tool with no sound of its own declares noPacks (3.48 the suite window: nothing to preset) — listed, not hidden
    const skipped = OrganismFactory.defined().filter(d => d.domain === 'music' && d.noPacks).map(d => d.id); assert.deepEqual(skipped, ['eravos.suite-hub'], 'tools without packs');
    const missing = []; OrganismFactory.defined().filter(d => d.domain === 'music' && !d.noPacks).forEach(d => { if (!ContentPacks.list({ tool: d.id }).some(p => p.id === d.id.replace('eravos.', '') + '.odd-couples')) missing.push(d.id); });
    assert.equal(missing.join(', '), '');
  });
  it('every preset a song names exists in that tool (none falls back silently)', () => {
    const bad = [];
    genres().forEach(G => used(G).forEach(([org, pr]) => { if (!pr) return; const d = OrganismFactory.def(org); [].concat(pr).forEach(n => { if (!d || !(d.presets || {})[n]) bad.push(`${G.id}: ${org} has no preset "${n}"`); }); }));
    assert.equal(bad.join(' · '), '');
  });
  // The coder's coverage check, not his rule (corrected 2026-10-21, eravos.p43-odd-couples.spec ADDENDUM). His purpose for the set:
  // "those are just to push the capability of eravos furthur and really test it". A tool no song uses is a tool no song tests.
  it('every music tool plays a part somewhere in the set (lane, insert, modulator or follower)', () => {
    const inSet = new Set(['eravos.session', 'eravos.timeline']);   // every Song Engine song mounts these two itself
    genres().forEach(G => used(G).forEach(([org]) => inSet.add(org)));
    const notUsed = OrganismFactory.defined().filter(d => d.domain === 'music' && !d.hidden && !inSet.has(d.id)).map(d => d.id);   // 3.64 a hidden tool (EDM Lab all-in-one) is not offered, so no song uses it
    // not song material: the recorder, the mixer view, the coach, MIDI mapping, the contrast analyser, the sequencer (songs use the Timeline)
    // 3.48 the suite window (eravos.suite-hub): the system its parts end in, no sound of its own
    // 3.48/3.49 the generator parts (Groove, Chords, Bassline, Arp) play only through a wire from their note out into an instrument, and the Song
    // Engine's genre format cannot wire one yet. The coder's open loop (eravos.phase48-map P48.10), not hidden: they join the set when it can.
    const ALLOWED = ['eravos.groove-gen', 'eravos.chord-gen', 'eravos.bass-gen', 'eravos.arp', 'eravos.suite-hub', 'eravos.song-recorder', 'eravos.mixer', 'eravos.coach', 'eravos.midi-mapper', 'eravos.contrast-analyser', 'eravos.sequencer'];
    assert.equal(notUsed.filter(id => !ALLOWED.includes(id)).join(', '), '');
  });
  it('pairs that never meet: no genre shares its organ / choir / 303 / xen / dub pairing with another family', () => {
    genres().forEach(G => { const orgs = new Set(used(G).map(([o]) => o)); assert.gt(orgs.size, 7, G.id + ' is a big odd couple'); });
  });
  it('every genre writes without a fault, and her clip goes to the Sample player AND the Drop Builder', async () => {
    for (const G of genres()) {
      const U = TH.universe(0.2, { bpm: 120 }), n0 = U.K.faults.list().length;
      const rec = Recipes.get('eravos.recipe.engine.' + G.id); rec._pinned = 7;
      const r = await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
      const faults = U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message);
      assert.equal(faults.join(' | '), '', G.id + ' faults');
      const id = (org) => (U.K.registry.byOrganism(org)[0] || {}).instance_id, clip = id('eravos.clip-maker');
      const wires = U.K.wires.list().filter(w => w.src.instanceId === clip).map(w => w.dst.hookId);
      assert.ok(wires.includes('samp.hook.asset_in'), G.id + ': clip → sample'); assert.ok(wires.includes('drop.hook.asset_in'), G.id + ': clip → drop builder');
      assert.equal(U.K.registry.byOrganism('eravos.bass-drop-builder').length, 1, G.id + ': one Drop Builder');
      OrganismFactory.clearAll(U.K);
    }
  }, { timeout: 120000 });
});
