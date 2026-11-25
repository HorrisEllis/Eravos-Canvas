/* P228 — music with contrast from the words (3.228). His words, 2026-11-25: "continue making more tools for eravos. i want to make music with
 * contrast. thats my rhytm" · "i want to learn how to make music from my lyrics. that is the point of the rhythm tool".
 * The lyric-shape component reads each stanza; ♫ Make a song gives each the part its words already are, with contrast between them and
 * inside a stanza that holds opposites; Lyrics → Rhythm shows the SHAPE and why. The test only gives words; ERAVOS shapes the song. */
window.__phase = 'P228';
describe('P228 music with contrast from the words', () => {
  const TEXT = ['Every night I run through every street of the city', 'every light is burning stronger than the fire in me', 'and I never stop and I never sleep at all', '',
    'quiet now', '', 'still', '', 'you were the light', 'and I was the dark', 'your peaks, my valleys', '', 'Hold me close tonight', 'you were the light'].join('\n');
  const parts = (steps) => ({ markers: steps.filter(s => s.topic === 'marker_edit').map(s => s.payload), clips: steps.filter(s => s.topic === 'clip_add').map(s => s.payload) });
  const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  it('each stanza becomes the part its words are; a break is space; a drop is full', () => {
    const sh = RhythmExpand.shape(TEXT, {}); assert.deepEqual(sh.arc, ['drop', 'break', 'chorus', 'chorus'], 'the arc: ' + sh.arc + ' (the last stanza brings the light back: a chorus)');
    const { markers, clips } = parts(RhythmExpand.generate(TEXT, { genre: 'darkwave', seed: 2, shape: 'contrast' }));
    assert.deepEqual(markers.map(m => m.name.split(' · ')[0]), ['intro', 'drop 1', 'break 2', 'chorus 3', 'chorus 4', 'outro']);
    const of = (re, t) => clips.filter(c => c.target === t && re.test(c.name));
    assert.equal(of(/break 2/, '@drums').length + of(/break 2/, '@bass').length, 0, 'the break: no drums, no bass');
    assert.ok(of(/break 2/, '@chords').length, 'the break keeps its chords');
    const vDrop = mean(of(/drop 1/, '@drums')[0].notes.map(n => n.v)), vCh = mean(of(/chorus 4/, '@drums')[0].notes.map(n => n.v));
    assert.ok(vDrop > vCh, 'the drop hits harder than a chorus: ' + vDrop.toFixed(2) + ' > ' + vCh.toFixed(2));
    const plain = parts(RhythmExpand.generate(TEXT, { genre: 'darkwave', seed: 2 })).clips.filter(c => c.target === '@drums' && /verse/.test(c.name)).map(c => mean(c.notes.map(n => n.v)));
    assert.ok(Math.max(...plain) - Math.min(...plain) < vDrop - mean(of(/chorus 3/, '@drums')[0].notes.map(n => n.v)) + 0.2, 'contrast: the parts differ more than every-verse does');
  });
  it('a stanza with opposites turns line by line: the dark line sung lower and bare, the light line higher and full', () => {
    const secs = RhythmExpand.sections(TEXT, { flow: 'spoken', seed: 2, shape: 'contrast' }), ch = secs[2];
    assert.ok(ch.split && ch.lineValence[0] > 0 && ch.lineValence[1] < 0, 'the chorus splits: light line, dark line');
    const { clips } = parts(RhythmExpand.generate(TEXT, { genre: 'darkwave', seed: 2, shape: 'contrast' }));
    const lead = clips.find(c => c.target === '@lead' && /chorus 3/.test(c.name)), drums = clips.find(c => c.target === '@drums' && /chorus 3/.test(c.name));
    const barOf = (line) => Math.floor(ch.notes.find(n => n.line === line).s / 16);
    const pitch = (b) => mean(lead.notes.filter(n => Math.floor(n.s / 16) === b).map(n => n.n));
    if (barOf(0) !== barOf(1)) { assert.ok(pitch(barOf(1)) < pitch(barOf(0)), 'the dark line is lower: ' + pitch(barOf(1)) + ' < ' + pitch(barOf(0)));
      const hats = (b) => drums.notes.filter(n => Math.floor(n.s / 16) === b && n.n === 36 + 3).length; assert.equal(hats(barOf(1)), 0, 'no hats under the dark line'); }
  });
  it('as before when asked: contrast 0, or every stanza a verse (the default of the API)', () => {
    assert.equal(JSON.stringify(RhythmExpand.generate(TEXT, { genre: 'house', seed: 4 })), JSON.stringify(RhythmExpand.generate(TEXT, { genre: 'house', seed: 4, shape: 'verses' })));
    assert.ok(RhythmExpand.shape(TEXT, { contrast: 0 }).arc.every(k => k === 'verse'));
  });
  it('Lyrics → Rhythm shows the SHAPE and how words become music', async () => {
    const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const id = OrganismFactory.spawn('eravos.lyric-rhythm', { x: 20, y: 20 });
    try { await TH.sleep(200); OrganismFactory.handle(id).view.emit('config_change', { key: 'text', value: TEXT }); await TH.sleep(400);
      const win = CanvasWM.windowOf(id), rows = win.querySelectorAll('.lyr-st'); assert.equal(rows.length, 4, 'one row per stanza');
      assert.ok(/DROP/.test(rows[0].textContent) && /BREAK/.test(rows[1].textContent) && /CHORUS ⇅/.test(rows[2].textContent), 'each part named, the split marked');
      assert.ok(rows[2].querySelector('small').textContent.length > 20, 'with why'); assert.ok(win.querySelector('.lyr-lesson p'), 'and the lesson');
      OrganismFactory.handle(id).view.emit('config_change', { key: 'songShape', value: 'every stanza a verse' }); await TH.sleep(200);
      assert.ok([...win.querySelectorAll('.lyr-st')].every(r => /VERSE/.test(r.textContent)), 'every stanza a verse when asked');
    } finally { OrganismFactory.close(id); }
  });
});
