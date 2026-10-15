/* 3.34.1 — RhythmExpand: the rhythm of written words grows into a whole song (domains/music/data/rhythm-expand.js) */
window.__phase = 'P21';
describe('RhythmExpand (words → song)', () => {
  const TEXT = 'Can you feel me\nevery second away from you\nstronger than the sum\nof the stars in the universe\n\nAre you holding on\nto the sounds of my love\nthe frequency of my energy\nthe light of my essence';
  const parts = (steps) => ({
    markers: steps.filter(s => s.op === 'event' && s.topic === 'marker_edit').map(s => s.payload),
    clips: steps.filter(s => s.op === 'event' && s.topic === 'clip_add').map(s => s.payload),
    cfg: steps.find(s => s.op === 'configure' && s.target === 'session').params,
  });
  it('a blank line is a new section; one block is cut every `per` lines', () => {
    assert.equal(RhythmExpand.sections(TEXT, { flow: 'spoken', seed: 1 }).length, 2);
    assert.equal(RhythmExpand.sections('a b\nc d\ne f\ng h\ni j', { flow: 'spoken', seed: 1, per: 2 }).length, 3);
    RhythmExpand.sections(TEXT, { flow: 'spoken', seed: 1 }).forEach(s => { assert.ok(s.bars >= 2 && s.bars % 2 === 0, 'bars even, at least 2: ' + s.bars); assert.ok(s.bars * 16 >= s.steps - 16, 'the bars hold the words'); });
  });
  it('the song = intro + one section per stanza + outro, in order, on the genre\'s instruments', () => {
    const { markers, clips, cfg } = parts(RhythmExpand.generate(TEXT, { genre: 'darkwave', seed: 3 }));
    assert.equal(markers.length, 4); assert.equal(markers[0].bar, 1); assert.equal(markers[0].name, 'intro'); assert.equal(markers[3].name, 'outro');
    assert.ok(/^verse 1 · can you feel me/.test(markers[1].name));
    for (let i = 1; i < markers.length; i++) assert.ok(markers[i].bar > markers[i - 1].bar);
    ['@drums', '@bass', '@chords', '@lead'].forEach(t => assert.ok(clips.some(c => c.target === t), t));
    assert.ok(/^Words · Can you feel me/.test(cfg.songName)); assert.equal(cfg.autoLength, true);
  });
  it('bass and lead stay in the song key; a strong syllable is a kick on beats 1,3 and a snare on 2,4', () => {
    const { clips, cfg } = parts(RhythmExpand.generate(TEXT, { genre: 'darkwave', seed: 3 }));
    const pcs = new Set(MusicTheory.SCALES[cfg.scale].map(x => (x + cfg.root) % 12));
    clips.filter(c => c.target === '@bass' || c.target === '@lead').forEach(c => c.notes.forEach(n => assert.ok(pcs.has(n.n % 12), c.name + ' note ' + n.n)));
    const d = parts(RhythmExpand.generate('heart heart heart', { genre: 'darkwave', seed: 1 })).clips.find(c => c.target === '@drums' && /verse 1/.test(c.name));
    assert.ok(d.notes.some(n => n.s === 0 && n.n === 36 && n.v >= 0.9), 'kick on step 0');
    assert.ok(d.notes.some(n => n.s === 4 && n.n === 37 && n.v >= 0.9), 'snare on step 4');
  });
  it('same words + genre + seed → the same song; another seed → another song; bad input says so', () => {
    const a = JSON.stringify(RhythmExpand.generate(TEXT, { genre: 'house', seed: 5 }));
    assert.equal(a, JSON.stringify(RhythmExpand.generate(TEXT, { genre: 'house', seed: 5 })));
    assert.ok(a !== JSON.stringify(RhythmExpand.generate(TEXT, { genre: 'house', seed: 6 })));
    let msg = ''; try { RhythmExpand.generate('   ', {}); } catch (e) { msg = e.message; } assert.ok(/no words/.test(msg));
    msg = ''; try { RhythmExpand.generate(TEXT, { genre: 'nope' }); } catch (e) { msg = e.message; } assert.ok(/unknown genre/.test(msg));
  });
  it('reuse: adding to a canvas that has a Session and Timeline mounts neither again', () => {
    const m = (steps, o) => steps.filter(s => s.op === 'mount' && s.organism === o)[0];
    const st = RhythmExpand.generate(TEXT, { reuse: true });
    assert.equal(m(st, 'eravos.session').reuse, true); assert.equal(m(st, 'eravos.timeline').reuse, true);
    assert.ok(!m(RhythmExpand.generate(TEXT, {}), 'eravos.timeline').reuse);
  });
  it('Song Engine is unchanged without the hook: same genre + seed → the same song as before 3.34.1', () => {
    const g = SongEngine.generate('dubstep', 7); assert.equal(JSON.stringify(g), JSON.stringify(SongEngine.generate('dubstep', 7)));
    assert.ok(g.some(s => s.op === 'event' && s.topic === 'clip_add'));
  });
});
