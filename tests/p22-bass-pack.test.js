/* 3.34.2 — Bass Pack: eight bass-music genres (tools/music/data/bass-pack.js) + the Song Engine's optional G.bar hook */
window.__phase = 'P22';
describe('Bass Pack (wubs, dubs, bass drops)', () => {
  const IDS = ['tearout', 'dubstep-og', 'riddim-war', 'drumstep', 'trapstep', 'bass-house', 'deathstep', 'tension-study'];
  const G = (id) => SongEngine.genres().find(g => g.id === id);
  const song = (id, seed) => { const steps = SongEngine.generate(id, seed); return { steps, cfg: steps.find(s => s.op === 'configure' && s.target === 'session').params, marks: steps.filter(s => s.topic === 'marker_edit').map(s => s.payload), clips: steps.filter(s => s.topic === 'clip_add').map(s => s.payload) }; };
  const inSection = (s, g, i) => s.clips.filter(c => c.startBar === s.marks[i].bar && c.name.endsWith(' · ' + g.form[i].name));
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h; };

  it('all eight genres are registered and write a finished song: markers = the form, a clip per playing part', () => {
    IDS.forEach(id => { assert.ok(G(id), id + ' registered'); const g = G(id), s = song(id, 4);
      assert.equal(s.marks.length, g.form.length, id + ' markers'); assert.equal(s.cfg.autoLength, true);
      g.form.forEach((sec, i) => assert.equal(inSection(s, g, i).length, sec.play.length, id + ' / ' + sec.name + ' clips')); });
  });
  it('every note is valid, in range and (bass, chords, lead) in the song key — fractional steps (triplets, 32nds) included', () => {
    IDS.forEach(id => { for (let seed = 1; seed <= 25; seed++) { const s = song(id, seed), pcs = new Set(MusicTheory.SCALES[s.cfg.scale].map(x => (x + s.cfg.root) % 12));
      s.clips.forEach(c => c.notes.forEach(n => { assert.ok([n.s, n.l, n.n, n.v].every(Number.isFinite), c.name + ' finite');
        assert.ok(n.s >= 0 && n.s < c.bars * 16, c.name + ' s ' + n.s); assert.ok(n.l >= 0.25 - 1e-9, c.name + ' l ' + n.l); assert.ok(n.v > 0 && n.v <= 1, c.name + ' v'); assert.ok(n.n >= 0 && n.n <= 127, c.name + ' pitch');
        if (!/^Drums/.test(c.name)) assert.ok(pcs.has(n.n % 12), id + '#' + seed + ' ' + c.name + ' ' + n.n + ' out of key'); })); } });
  });
  it('a build accelerates: the snare gets denser every bar, the kick leaves the last bar, a flagged lead climbs ≥ an octave and gets ≥ 4× denser', () => {
    IDS.forEach(id => { const g = G(id), s = song(id, 9);
      g.form.forEach((sec, i) => { if (sec.kind !== 'build') return; const cs = inSection(s, g, i), dr = cs.find(c => /^Drums/.test(c.name));
        if (dr) { const per = Array.from({ length: sec.bars }, (_, b) => dr.notes.filter(n => n.n === 37 && n.s >= b * 16 && n.s < b * 16 + 16).length);
          for (let b = 1; b < per.length; b++) assert.ok(per[b] >= per[b - 1], id + ' ' + sec.name + ' snare ' + per); assert.ok(per[per.length - 1] >= 16, id + ' last bar is a roll');
          assert.ok(!dr.notes.some(n => n.n === 36 && n.s >= (sec.bars - 1) * 16), id + ' kick leaves'); }
        Object.keys(g.parts).filter(k => g.parts[k].riser && sec.play.includes(k)).forEach(k => { const ns = cs.find(c => c.name.startsWith(g.parts[k].name + ' · ')).notes.slice().sort((a, b) => a.s - b.s);
          for (let j = 1; j < ns.length; j++) assert.ok(ns[j].n >= ns[j - 1].n, id + ' riser never falls');
          assert.ok(ns[ns.length - 1].n - ns[0].n >= 12, id + ' climbs'); assert.ok(ns.filter(n => n.s >= (sec.bars - 1) * 16).length > 4 * ns.filter(n => n.s < 16).length, id + ' densifies'); }); });
    });
  });
  it('the pause is only a held chord; before every drop all parts stop half a beat early; every drop opens with crash + kick', () => {
    IDS.forEach(id => { const g = G(id), s = song(id, 6);
      g.form.forEach((sec, i) => {
        if (sec.kind === 'pause') { const cs = inSection(s, g, i); assert.equal(cs.length, 1, id + ' pause is one part'); assert.ok(/Pad|Choir|Atmos/.test(cs[0].name), id + ' pause is a chord: ' + cs[0].name); }
        if (sec.kind !== 'drop') return; const dr = inSection(s, g, i).find(c => /^Drums/.test(c.name));
        assert.ok(dr.notes.some(n => n.s === 0 && n.n === 44), id + ' crash'); assert.ok(dr.notes.some(n => n.s === 0 && n.n === 36 && n.v === 1), id + ' kick');
        inSection(s, g, i - 1).forEach(c => assert.ok(Math.max(...c.notes.map(n => n.s + n.l)) <= (g.form[i - 1].bars - 1) * 16 + 14 + 1e-9, id + ' gap before ' + sec.name)); });
    });
  });
  it('the second drop is heavier (more layers) where it is written to be; the lift moves chords and lead, never the bass', () => {
    [['tearout', 'drop', 'drop 2'], ['riddim-war', 'drop', 'drop 2'], ['deathstep', 'drop', 'drop 2'], ['tension-study', 'drop', 'final drop']].forEach(([id, a, b]) => { const g = G(id), s = song(id, 5), ia = g.form.findIndex(x => x.name === a), ib = g.form.findIndex(x => x.name === b);
      assert.gt(inSection(s, g, ib).length, inSection(s, g, ia).length, id + ' more layers'); });
    const g = G('tearout'), s = song('tearout', 62), ia = g.form.findIndex(x => x.name === 'drop'), ib = g.form.findIndex(x => x.name === 'drop 2'), pitches = (i, name) => inSection(s, g, i).find(c => c.name.startsWith(name + ' · ')).notes.map(n => n.n).join();
    assert.equal(pitches(ia, 'Sub'), pitches(ib, 'Sub'), 'bass does not move'); assert.ok(pitches(ia, 'Pad') !== pitches(ib, 'Pad'), 'chords lift');
  });
  it('same genre + seed → same song; another seed → another song', () => {
    IDS.forEach(id => { assert.equal(JSON.stringify(SongEngine.generate(id, 8)), JSON.stringify(SongEngine.generate(id, 8))); assert.ok(JSON.stringify(SongEngine.generate(id, 8)) !== JSON.stringify(SongEngine.generate(id, 9)), id + ' seeds differ'); });
  });
  it('Songbook: eight named songs, each on a registered genre with a pinned seed', () => {
    const all = Songbook.songs(); ['bp-tearout', 'bp-dub', 'bp-riddim', 'bp-drumstep', 'bp-trap', 'bp-bhouse', 'bp-dread', 'bp-study'].forEach(id => { const s = all.find(x => x.id === id); assert.ok(s, id); assert.ok(G(s.genre), id + ' genre'); assert.ok(s.seed > 0 && s.listen && s.drop && s.voice, id + ' text'); });
  });
  it('Words → Song works on every new genre: the parts named in wordsPlay sing', () => {
    if (!window.RhythmExpand) return;
    IDS.forEach(id => { const g = G(id), clips = RhythmExpand.generate('Can you feel me\nevery second away\n\nare you holding on?\nto the sounds of my love', { genre: id, seed: 3 }).filter(s => s.topic === 'clip_add').map(s => s.payload);
      g.wordsPlay.verse.forEach(k => assert.ok(clips.some(c => c.name.startsWith(g.parts[k].name + ' · verse')), id + ' ' + k + ' sings')); });
  });
  it('the Song Engine is unchanged for genres without a bar writer (golden hashes taken before 3.34.2)', () => {
    // 3.34.2 merge: all five re-captured from the 3.34-alpha engine IN this page (same values with the 3.34.2 engine).
    // The 3.34.2 set was taken with no organism defs loaded → place() used SIZE {500×460} → every mount x/y differed.
    // Notes never differed — only window coordinates. A golden must be taken in the environment that checks it.
    const gold = { 'dubstep:7': 1597129955, 'house:5': 1939224218, 'darkwave:3': 305923139, 'neuro:11': 2802337638, 'trance:2': 2783395663 };
    Object.keys(gold).forEach(k => { const [id, seed] = k.split(':'); assert.equal(hash(JSON.stringify(SongEngine.generate(id, +seed))), gold[k], k); });
  });
});
