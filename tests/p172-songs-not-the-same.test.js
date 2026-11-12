/* P172 — the songs library lists no song twice. His words, 2026-11-12: "can you also remove duplicate songs in the songs library, a lot of the
 * same songs". The measure (data/songbook-same.js): a song's notes, key and tempo taken out, against every earlier song of its genre. */
window.__phase = 'P172';
describe('P172 no song twice in the library', () => {
  function notesOf(s) {
    const st = SongEngine.generate(s.genre, s.seed, s); if (!st) return null;
    const root = (st.find(x => x.op === 'configure' && x.params && x.params.root !== undefined) || { params: { root: 0 } }).params.root, out = new Set();
    st.filter(x => x.op === 'event' && x.topic === 'clip_add').forEach(x => { const P = x.payload, lane = P.lane || P.laneIndex || P.target || '';
      (P.notes || []).forEach(n => out.add(lane + '|' + ((P.startBar || 1) * 16 + n.s) + '|' + (((n.n - root) % 12) + 12) % 12)); });
    return out;
  }
  const J = (a, b) => { let i = 0; a.forEach(x => { if (b.has(x)) i++; }); const u = a.size + b.size - i; return u ? i / u : 1; };
  it('no two listed songs of a genre share 80 % of their notes; the hidden ones are kept, each with what it repeats', () => {
    const shown = Songbook.all(), every = Songbook.all({ same: true }), same = Songbook.same();
    assert.equal(every.length - shown.length, same.length, 'hidden = the list'); assert.gt(same.length, 30, same.length + ' songs repeat another');
    assert.ok(same.every(x => shown.some(s => s.id === x.ofId)), 'what each repeats is still listed');
    assert.ok(Songbook.songs().length >= every.length - SongEngine.genres().length, 'nothing deleted from the songbooks');
    const byG = {}; shown.filter(s => s.genre && s.seed !== undefined).forEach(s => (byG[s.genre] = byG[s.genre] || []).push(s));
    const bad = [];
    Object.values(byG).forEach(a => { const F = a.map(s => [s, notesOf(s)]).filter(q => q[1] && q[1].size);
      for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) { const v = J(F[i][1], F[j][1]); if (v >= 0.8) bad.push(F[i][0].title + ' ≈ ' + F[j][0].title + ' ' + v.toFixed(2)); } });
    assert.equal(bad.length, 0, 'still the same: ' + bad.slice(0, 6).join(' | '));
  });
});
