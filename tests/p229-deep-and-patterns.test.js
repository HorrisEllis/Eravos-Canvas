/* P229 — deep as hell, and patterns from the words (3.229). His words, 2026-11-25: "How does it sound? Like I want it deep as hell. More of
 * my rhythm. Make patterns." Depth lowers the song (lead, chords, held bass, heavier kick, a boom on 1 in the drop); ⇢ Patterns makes four
 * patterns per stanza in the rhythm library (words · mirror · shadow · pendulum). The test gives words; ERAVOS makes the rest. */
window.__phase = 'P229';
describe('P229 deep, and patterns from the words', () => {
  const TEXT = 'Every night I run through every street of the city\nevery light is burning stronger than the fire in me\n\nquiet now\n\nstill\n\nyou were the light\nand I was the dark\nyour peaks, my valleys';
  const clips = (o) => RhythmExpand.generate(TEXT, Object.assign({ genre: 'darkwave', seed: 2, shape: 'contrast' }, o)).filter(s => s.topic === 'clip_add').map(s => s.payload);
  const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), all = (cs, t) => cs.filter(c => c.target === t).flatMap(c => c.notes);
  it('depth: the lead and chords sit lower, the bass is held longer, the kick hits harder — 0 is the song as before', () => {
    const a = clips({ depth: 0 }), b = clips({ depth: 1 });
    assert.equal(JSON.stringify(a), JSON.stringify(clips({})), 'depth 0 = no depth');
    assert.ok(mean(all(b, '@lead').map(n => n.n)) <= mean(all(a, '@lead').map(n => n.n)) - 18, 'the lead two octaves down');
    assert.ok(mean(all(b, '@chords').map(n => n.n)) < mean(all(a, '@chords').map(n => n.n)) - 6, 'the chords lower');
    const len = (cs) => all(cs, '@bass').reduce((x, n) => x + n.l, 0); assert.ok(len(b) > len(a), 'the bass held longer: ' + len(b) + ' > ' + len(a));
    const kick = (cs) => mean(all(cs, '@drums').filter(n => n.n === 36).map(n => n.v)); assert.ok(kick(b) > kick(a), 'a heavier kick');
  });
  it('⇢ Patterns: every stanza → words, mirror, shadow and pendulum in the rhythm library (Yours)', async () => {
    const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const LIB = MusicParts.PF_LIB, before = LIB.readSaved().length, id = OrganismFactory.spawn('eravos.lyric-rhythm', { x: 20, y: 20 });
    try {
      await TH.sleep(200); const H = OrganismFactory.handle(id); H.view.emit('config_change', { key: 'text', value: TEXT }); await TH.sleep(300);
      H.view.emit('make_patterns', {}); await TH.sleep(200);
      const made = LIB.readSaved().slice(before), stanzas = RhythmExpand.sections(TEXT, { flow: 'spoken', seed: 1, shape: 'contrast' }).length;
      assert.ok(made.length >= stanzas * 3, made.length + ' patterns for ' + stanzas + ' stanzas');
      ['words', 'mirror', 'shadow', 'pendulum'].forEach(k => assert.ok(made.some(p => new RegExp('· ' + k + '$').test(p.name)), 'a ' + k + ' pattern'));
      assert.ok(made.every(p => p.drums && p.notes.length), 'drums, with notes (Plays as: drums)');
      assert.ok(PatternLibrary.rebuild().some(p => p.genre === 'yours' && /· mirror$/.test(p.name)), 'in Patterns › Yours');
    } finally { const a = LIB.readSaved(); if (a.length > before) { localStorage.setItem(LIB.SAVED, JSON.stringify(a.slice(0, before))); PatternLibrary.rebuild(); } OrganismFactory.close(id); }
  });
});
