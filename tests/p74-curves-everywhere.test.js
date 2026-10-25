/* 3.74 — James, 2026-10-25: "why doesn't the pattern library have more curves? like floor falls." */
window.__phase = 'P74';
describe('📈 Curves in every genre: Floor Falls’ moves on the whole library (3.74)', () => {
  const L = () => PatternLibrary.all();
  it('curves from every genre, not three: curved versions of the bass, wobble and lead lines, and curve shapes per tool', () => {
    const bent = L().filter(p => p.notes && p.notes.some(n => n.b)), genres = new Set(bent.map(p => p.genre));
    assert.gt(genres.size, 60, genres.size + ' genres with curved lines (was 4)');
    assert.gt(L().filter(p => p.curve).length, 60, L().filter(p => p.curve).length + ' curve patterns (was 16)');
    const lines = L().filter(p => p.notes && !p.drums && ['bass', 'wobble', 'lead'].includes(p.type) && p.move !== 'curved');
    const curvedOf = new Set(L().filter(p => p.move === 'curved').map(p => p.name.replace(/ · curved$/, '') + '|' + p.genre));
    assert.gt(lines.filter(p => curvedOf.has(p.name + '|' + p.genre)).length / lines.length, 0.6, 'most lines have a curved version');
  });
  it('the moves are Floor Falls’: a slide in from a 4th above, a dive at the phrase’s end (never under ~18 Hz), a wobble that speeds up into its turn', () => {
    const cv = L().filter(p => p.move === 'curved');
    const wob = cv.filter(p => p.type === 'wobble'); assert.ok(wob.some(p => p.notes.some(n => n.b && n.b.osc && n.b.osc.rateTo === '1/32')), 'the speed-up');
    assert.ok(wob.every(p => p.notes.every(n => n.p && n.p.div)), 'a rate per note');
    assert.ok(cv.some(p => p.notes[0].b && p.notes[0].b.from === 5), 'the slide in');
    const low = cv.filter(p => p.type !== 'lead').flatMap(p => p.notes).filter(n => n.b && n.r + Math.min(0, n.b.from, n.b.to) < 14); assert.equal(low.length, 0, 'no dive under ~18 Hz');
    assert.ok(cv.filter(p => p.type === 'lead').some(p => p.notes.some(n => n.b && n.b.osc && n.b.osc.rate === 5.5)), 'a lead blooms a vibrato');
  });
  it('a curve shape set per tool: riser, freefall, ripples — and filter / depth where the tool has them', () => {
    const sh = L().filter(p => p.move === 'curve-shape'), by = (tool) => sh.filter(p => p.tool === tool).map(p => p.name.split(':')[0].split(' (')[0]);
    const w = by('eravos.wobble-bass'); ['Riser', 'Freefall', 'Ripples', 'Filter opens over 8 bars', 'Depth swing through the drop'].forEach(n => assert.ok(w.includes(n), 'Wobble: ' + n + ' in ' + w.join(', ')));
    sh.filter(p => p.curve.key === 'cutoff').forEach(p => { const k = OrganismFactory.def(p.tool).config.find(c => c.key === 'cutoff'); p.curve.points.forEach(q => assert.ok(q[1] >= k.min && q[1] <= k.max, p.name + ' in range')); });
  });
  it('a curved wobble line renders to sound, off the canvas', async () => {
    const p = L().find(x => x.move === 'curved' && x.type === 'wobble'), r = await PatternLibrary.render(p); assert.ok(r && !r.silent, p.name);
  });
});
