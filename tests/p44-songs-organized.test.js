/* 3.44 — "can we sort and organize the songs by category?" · "add songs that show off and test the tools. the synthesis tools
 * are all new" · "make it bun dem … kind of higher and slower". Checks: every song sits on exactly one shelf and nothing falls
 * in "More"; the Synthesis showcase uses every Synthesis tool and writes without a fault; Key / Tempo on a song moves every
 * pitched note by exactly that many semitones (drums stay on their pads) and scales the BPM. */
window.__phase = 'P44';
describe('Songs — shelved by category, the Synthesis showcase, key & tempo', () => {
  it('every song has one shelf, every shelf on the page has songs, none land in "More"', () => {
    const all = Songbook.all(), ids = Songbook.categories().map(c => c.id);
    const stray = all.filter(s => !ids.includes(Songbook.categoryOf(s)) || Songbook.categoryOf(s) === 'more').map(s => s.id + ' (' + s.genre + ')');
    assert.equal(stray.join(', '), '');
    assert.gt(new Set(all.map(Songbook.categoryOf)).size, 10);
  });
  it('the page groups by shelf, the rail counts add up, search narrows, sort A→Z is alphabetical', () => {
    Songbook.open(); const ov = document.querySelector('.overlay.sbk');
    try {
      const rail = [...ov.querySelectorAll('.sbk-rail-item')], total = +rail[0].querySelector('small').textContent;
      assert.equal(total, Songbook.all().length);
      assert.equal(rail.slice(1).reduce((n, b) => n + +b.querySelector('small').textContent, 0), total);
      assert.gt(ov.querySelectorAll('.sbk-sec').length, 10);
      const q = ov.querySelector('.sbk-search'); q.value = 'synthesis'; q.dispatchEvent(new Event('input'));
      assert.equal(ov.querySelectorAll('.sbk-card').length, window.SynthesisSongbook.songs.length);
      q.value = ''; q.dispatchEvent(new Event('input'));
      const so = ov.querySelector('.sbk-sort'); so.value = 'az'; so.dispatchEvent(new Event('change'));
      const t = [...ov.querySelectorAll('.sbk-card b')].map(b => b.textContent.toLowerCase());
      assert.equal(ov.querySelectorAll('.sbk-sec').length, 0);
      assert.ok(t.every((x, i) => !i || t[i - 1] <= x), 'sorted');
    } finally { ov.remove(); }
  });
  it('the Synthesis showcase plays every Synthesis tool, and each genre writes with no fault', async () => {
    const SB = window.SynthesisSongbook, gs = SongEngine.genres().filter(g => SB.genres.includes(g.id)), used = new Set();
    gs.forEach(G => [].concat(Object.values(G.parts), G.fx || [], G.mods || []).forEach(p => used.add(p.organism)));
    ['eravos.syn-osc', 'eravos.syn-env', 'eravos.syn-partials', 'eravos.granular'].forEach(id => assert.ok(used.has(id), id + ' shown off'));
    const bad = []; gs.forEach(G => [].concat(Object.values(G.parts), G.fx || [], G.mods || []).forEach(p => { const d = OrganismFactory.def(p.organism); [].concat(p.preset || []).forEach(n => { if (!d || !(d.presets || {})[n]) bad.push(G.id + ': ' + p.organism + ' "' + n + '"'); }); }));
    assert.equal(bad.join(' · '), '');
    for (const G of gs) {
      const U = TH.universe(0.2, { bpm: 120 }), n0 = U.K.faults.list().length;
      const rec = Recipes.get('eravos.recipe.engine.' + G.id); rec._pinned = 7;
      await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
      assert.equal(U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | '), '', G.id);
    }
  }, { timeout: 60000 });
  it('Key +5 · Tempo 85 %: every pitched note 5 semitones up, drums untouched, BPM × 0.85, key moves with it', () => {
    const rec = Recipes.get('eravos.recipe.engine.reggae'); rec._seed = 75; rec._shift = null;
    const a = rec.steps; rec._shift = { semis: 5, tempo: 0.85 }; const b = rec.steps; rec._shift = null;
    assert.equal(b.find(s => s.op === 'bpm').bpm, Math.round(a.find(s => s.op === 'bpm').bpm * 0.85));
    const sa = a.find(s => s.op === 'configure' && s.target === 'session').params, sb = b.find(s => s.op === 'configure' && s.target === 'session').params;
    assert.equal(sb.root, (sa.root + 5) % 12);
    const clips = (st) => st.filter(s => s.op === 'event' && s.topic === 'clip_add');
    clips(a).forEach((c, i) => {
      const d = clips(b)[i], drums = c.payload.target === '@drums';
      c.payload.notes.forEach((n, j) => assert.equal(d.payload.notes[j].n, drums ? n.n : n.n + 5, c.payload.name));
    });
  });
});
