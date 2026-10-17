/* 3.39 — "the songs selection is buggy, and i cant click a lot of it" (desktop exe).
 * Reproduced in Electron 44 (the exe's engine) with real mouse clicks: 39 of 189 cards ignored the click. allSongs() makes
 * NEW objects for genre cards and EDM-tagged songs on every call; the page held the selection as an object, so the next
 * paint could not find it and snapped back to the first song — and "Write this song" then wrote THAT song. */
window.__phase = 'P42';
describe('Songs page — every card selects, and Write writes the card you picked', () => {
  it('clicking each card selects it, shows it, and Write this song writes exactly that song', async () => {
    const hadGoals = window.Goals; if (!window.Goals || !window.Goals.EDM) window.Goals = Object.assign({}, window.Goals || {}, { EDM: SongEngine.genres().filter(g => g.family === 'EDM').map(g => g.id).concat(['dubstep', 'riddim']) });
    const realWrite = SongEngine.write, R = window.Recipes, realRun = R.run; let wrote = null;
    SongEngine.write = (genre, seed) => { wrote = { genre, seed }; return true; }; R.run = (id) => { wrote = { recipe: id }; return true; };
    try {
      const bad = [];
      const all = Songbook.all().filter(s => !Songbook.locked(s));
      for (const s of all) {
        Songbook.open(); const ov = document.querySelector('.overlay.sbk');
        const name = (c) => c.querySelector('b').textContent.replace(/ 🎤$/, '');   // songs that sing with her carry a 🎤
        const card = [...ov.querySelectorAll('.sbk-card')].find(c => name(c) === s.title);
        if (!card) { bad.push(s.id + ': no card'); ov.remove(); continue; }
        card.click();
        const selCard = ov.querySelector('.sbk-card.sel'), shown = ov.querySelector('.sbk-detail h3').textContent;
        if (!selCard || name(selCard) !== s.title || shown !== s.title) bad.push(`${s.id}: selected "${selCard && name(selCard)}", shown "${shown}"`);
        wrote = null; ov.querySelector('.sbk-go').click();
        const ok = s.recipe ? wrote && wrote.recipe === s.recipe : wrote && wrote.genre === s.genre && wrote.seed === s.seed;
        if (!ok) bad.push(`${s.id}: Write wrote ${JSON.stringify(wrote)}`);
        const left = document.querySelector('.overlay.sbk'); if (left) left.remove();
      }
      assert.equal(bad.length, 0, bad.slice(0, 8).join(' · '));
      assert.gt(all.length, 150);
    } finally { SongEngine.write = realWrite; R.run = realRun; if (!hadGoals) delete window.Goals; else window.Goals = hadGoals; }
  }, { timeout: 120000 });
});
