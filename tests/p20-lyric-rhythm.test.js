/* eravos.lyric-rhythm — spec domains/music/tools/voice-and-words/lyric-rhythm/lyric-rhythm.spec */
window.__phase = 'P20';
describe('eravos.lyric-rhythm (Lyrics → Rhythm)', () => {
  it('syllable counts on a fixed word list', () => {
    const N = (w) => LyricRhythm.syllables(w).length;
    const want = { beautiful: 3, everything: 3, "you're": 1, love: 1, heart: 1, shake: 1, believe: 2, remember: 3, tonight: 2, together: 3, little: 2, people: 2, darkness: 2, waiting: 2, loved: 1, wanted: 2, kisses: 2, morning: 2, happy: 2, ocean: 2, nation: 2, golden: 2, crying: 2, music: 2 };
    Object.keys(want).forEach(w => assert.equal(N(w), want[w], w));
    assert.ok([1, 2].includes(N('fire')));
  });
  it('3.34.1 silent-e compounds, suffixes and -ity stress (the words the first example text got wrong)', () => {
    const syl = (w) => LyricRhythm.syllables(w), N = (w) => syl(w).length, st = (w) => syl(w).map(s => s.stress);
    const want = { completely: 3, perfectly: 3, countlessly: 3, somehow: 2, restored: 2, emerge: 2, universe: 3, luminosity: 5, lovely: 2, statement: 2, careless: 2, darkness: 2, badly: 2, everywhere: 3 };
    Object.keys(want).forEach(w => assert.equal(N(w), want[w], w));
    assert.deepEqual(syl('completely').map(s => s.text), ['com', 'plete', 'ly']);
    assert.deepEqual(syl('perfectly').map(s => s.text), ['per', 'fect', 'ly']);
    assert.deepEqual(st('luminosity'), [0, 0, 1, 0, 0]); assert.deepEqual(st('universe'), [1, 0, 0]); assert.deepEqual(st('emerge'), [0, 1]);
    assert.deepEqual(st('completely'), [0, 1, 0]); assert.deepEqual(st('perfectly'), [1, 0, 0]); assert.deepEqual(st('somehow'), [1, 0]);
    assert.deepEqual(st('likely'), [1, 0]);   // "like" alone is a weak word; inside a longer word one syllable must still lead
  });
  it('stress: content words strong, function words weak, prefixes shift it, CAPS and ! accent', () => {
    const st = (w) => LyricRhythm.syllables(w).map(s => s.stress);
    assert.deepEqual(st('heart'), [1]); assert.deepEqual(st('the'), [0]); assert.deepEqual(st('believe'), [0, 1]); assert.deepEqual(st('morning'), [1, 0]);
    const a = LyricRhythm.analyse('I LOVE you!'); assert.equal(a.find(s => s.text === 'love').stress, 2); assert.equal(a[a.length - 1].stress, 2);
  });
  it('same words + flow + vary → the same grid; strong syllables of "spoken" land on 8ths', () => {
    const a = LyricRhythm.analyse('Give your head a shake\nfire in my heart');
    const x = JSON.stringify(LyricRhythm.place(a, 'spoken', 0)), y = JSON.stringify(LyricRhythm.place(a, 'spoken', 0)); assert.equal(x, y);
    LyricRhythm.place(a, 'spoken', 0).notes.filter(n => n.stress).forEach(n => assert.equal(n.s % 2, 0, n.text));
    LyricRhythm.place(a, 'on-beat chant', 0).notes.filter(n => n.stress).forEach(n => assert.equal(n.s % 4, 0, n.text));
  });
  it('transport ticks send each syllable to the Drum Machine at its step', () => {
    const U = TH.universe(0.2, { bpm: 120 }); const pads = TH.spawn(U, 'eravos.pads'), a = TH.spawn(U, 'eravos.lyric-rhythm'), c = OrganismFactory.handle(a).ctx;
    c.params.set('text', 'heart heart'); const got = []; U.K.bus.subscribe('note:trigger', (p) => { if (p.target === pads) got.push(p); });
    for (let s = 0; s < 16; s++) U.K.bus.publish('transport:tick', { step16: s, time: s * 0.125, stepDur: 0.125 });
    assert.equal(got.length, 2); assert.near(got[0].time, 0, 1e-9); assert.near(got[1].time, 0.25, 1e-9); assert.equal(got[0].note, 36);
  });
  it('Send to Timeline puts a note clip with every syllable on the Timeline', async () => {
    const U = TH.universe(0.2); const tl = TH.spawn(U, 'eravos.timeline'), pads = TH.spawn(U, 'eravos.pads'), a = TH.spawn(U, 'eravos.lyric-rhythm'), c = OrganismFactory.handle(a).ctx;
    c.params.set('text', 'you light the dark'); U.K.bus.publish('ui:send_timeline:' + a, {}); await new Promise(r => setTimeout(r, 30));
    const clips = OrganismFactory.handle(tl).ctx.internals.clips; assert.equal(clips.length, 1); assert.equal(clips[0].notes.length, c.plan().notes.length);
  });
});
