/* P232 — tension, his words brought in, deeper patterns (3.232). His words, 2026-11-26: "Can you add contrasting rhythm or a bunch with tension?" ·
 * "Did you create extremely deep patterns?" · "I am a good writer. It would be cool to be able to import my words." The test gives words (its own,
 * not his); ERAVOS finds who speaks, pushes the answer off the beat, brings it home, and carries depth into the patterns. */
window.__phase = 'P232';
describe('P232 tension, your words, deeper patterns', () => {
  const TEXT = 'hold on\n\nI gave you every night I had, every hour I could carry. You gave me the morning after and the silence.\nI wanted the storm and the calm and the whole sky. You wanted the weather to choose for you.\nIn the end we stood in the rain together.';
  const gen = (o) => RhythmExpand.generate(TEXT, Object.assign({ genre: 'darkwave', seed: 3, shape: 'contrast' }, o)).filter(s => s.topic === 'clip_add').map(s => s.payload);
  it('the answer falls off the beat, three against four under it, the last line lands home with an arrival — 0 is as before', () => {
    const secs = RhythmExpand.sections(TEXT, { flow: 'spoken', seed: 3, shape: 'contrast', tension: 1 }), plain = RhythmExpand.sections(TEXT, { flow: 'spoken', seed: 3, shape: 'contrast' });
    const s2 = secs[1], p2 = plain[1]; assert.ok(s2.tension, 'the second stanza is a dialogue');
    const tense = s2.notes.filter(n => n.tense); assert.ok(tense.length > 0, 'its answer is marked');
    tense.forEach(n => { const was = p2.notes.find(q => q.line === n.line && q.wi === n.wi && q.si === n.si); assert.ok(was && n.s - was.s === 2, 'pushed half a beat at tension 1'); });
    assert.ok(s2.notes.filter(n => n.line === 2).every(n => !n.tense), 'the last line is not pushed (home)');
    assert.ok(s2.kind !== 'break', 'it has drums: ' + s2.kind);
    const d = gen({ tension: 1 }).find(c => c.target === '@drums' && /2 · /.test(c.name)); assert.ok(d.notes.some(n => Math.abs(n.s % 16 - 16 / 3) < 0.01), 'three against four under the answer');
    assert.ok(d.notes.some(n => n.n === 36 + SongEngine.helpers.PAD.crash), 'the arrival');
    assert.equal(JSON.stringify(gen({ tension: 0 })), JSON.stringify(gen({})), 'tension 0 = as before');
  });
  it('your words come in: .txt, .md (a Notion page: its heading, its id gone, an index of links skipped), kept as written', async () => {
    const keep = localStorage.getItem(WordsShelf.KEY); localStorage.removeItem(WordsShelf.KEY);
    try {
      const md = new File(['# Night Song:\n\nfirst line of it\nsecond **line** of it\n\n[a link](x.md) after'], 'Night Song 0123456789abcdef0123456789abcdef.md'), txt = new File(['just words\n\nand more'], 'Plain.txt');
      const index = new File(['# Index\n\n[a](a.md)\n\n[b](b.md)\n\n[c](c.md)'], 'Index 0123456789abcdef0123456789abcdef.md'), pic = new File(['x'], 'cover.png');
      const r = await WordsShelf.importFiles([md, txt, index, pic]); assert.deepEqual(r.added.sort(), ['Night Song', 'Plain'], 'two pieces: ' + r.added);
      assert.equal(r.skipped.length, 2, 'the index and the picture skipped');
      const ns = WordsShelf.list().find(x => x.title === 'Night Song'); assert.equal(ns.text, 'first line of it\nsecond line of it\n\na link after', 'kept as written, marks removed, the stanza break kept');
      await WordsShelf.importFiles([txt]); assert.equal(WordsShelf.list().filter(x => x.title === 'Plain').length, 1, 'the same piece twice is kept once');
    } finally { if (keep === null) localStorage.removeItem(WordsShelf.KEY); else localStorage.setItem(WordsShelf.KEY, keep); }
  });
  it('deep patterns: accents ratchet, weak syllables are ghosts, the answer lags, the pendulum returns every other pass', async () => {
    const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const LIB = MusicParts.PF_LIB, before = LIB.readSaved().length, id = OrganismFactory.spawn('eravos.lyric-rhythm', { x: 20, y: 20 });
    try { await TH.sleep(200); const H = OrganismFactory.handle(id); H.view.emit('config_change', { key: 'text', value: 'I gave you EVERY night! You gave me the morning after.\nIn the end we stood in the rain.' }); await TH.sleep(200);
      H.view.emit('make_patterns', {}); await TH.sleep(200); const made = LIB.readSaved().slice(before), all = made.flatMap(p => p.notes);
      assert.ok(all.some(n => n.rt === 3 && n.x && n.x.rs === 'accel'), 'an accent ratchets'); assert.ok(all.some(n => n.pr === 0.7 && n.x && n.x.hv), 'a ghost');
      assert.ok(all.some(n => n.mt === 0.25), 'the answer lags'); assert.ok(made.find(p => /pendulum$/.test(p.name)).notes.some(n => n.x && n.x.cond && n.x.cond.every === 2), 'the return every other pass');
    } finally { const a = LIB.readSaved(); if (a.length > before) { localStorage.setItem(LIB.SAVED, JSON.stringify(a.slice(0, before))); PatternLibrary.rebuild(); } OrganismFactory.close(id); }
  });
});
