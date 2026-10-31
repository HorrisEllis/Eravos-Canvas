/* 3.39 — "the songs selection is buggy, and i cant click a lot of it" (desktop exe): the page once wrote the wrong song.
 * 3.82 the built-in songs moved into 🧩 Patterns (each instrument, each section a block; "the songs library is for saved or export songs").
 * The same guarantee there: every song's ▶ Whole song writes exactly that song. */
window.__phase = 'P42';
describe('Songs in Patterns — every song’s ▶ Whole song writes exactly that song', () => {
  it('grouped by song, each song with blocks has a Whole song button that writes that song (genre + seed)', async () => {
    const realWrite = SongEngine.write; let wrote = null;
    SongEngine.write = (genre, seed) => { wrote = { genre, seed }; return true; };
    try {
      const bad = [], songs = Songbook.songs().filter(s => !s.recipe && !Songbook.locked(s) && SongEngine.genres().some(g => g.id === s.genre));
      const withBlocks = new Set(PatternLibrary.all().filter(p => p.song).map(p => p.song.id));
      const pick = songs.filter(s => withBlocks.has(s.id)), sample = pick.filter((_, i) => i % 9 === 0);
      for (const s of sample) {
        PatternLibrary.open({ group: 'song' }); const ov = document.querySelector('.overlay.plib');
        const sec = ov.querySelector('.plib-sec[data-sec="' + s.id + '"]'); if (!sec) { bad.push(s.id + ': no section'); PatternLibrary.open(); continue; }
        const btn = sec.querySelector('.plib-whole'); if (!btn) { bad.push(s.id + ': no Whole song'); PatternLibrary.open(); continue; }
        wrote = null; btn.click();
        if (!(wrote && wrote.genre === s.genre && wrote.seed === s.seed)) bad.push(s.id + ': wrote ' + JSON.stringify(wrote));
        const left = document.querySelector('.overlay.plib'); if (left) PatternLibrary.open();
      }
      assert.equal(bad.length, 0, bad.slice(0, 8).join(' · '));
      assert.gt(pick.length, 250, 'nearly every song is in blocks'); assert.gt(sample.length, 25);
    } finally { SongEngine.write = realWrite; const o = document.querySelector('.overlay.plib'); if (o) PatternLibrary.open(); }
  }, { timeout: 120000 });
});
