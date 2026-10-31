/* 3.82 — "i want the songs broken into patterns, and moved to the patterns menu, piece by piece, sorted by instrument, like blocks, or
 * units, then the songs library is for saved or export songs". */
window.__phase = 'P82';
describe('P82 · songs in blocks (Patterns) · Songs = your saved and exported songs', () => {
  it('every named song is taken apart: each instrument, each section a block named for the song; they play in your key', () => {
    const lib = PatternLibrary.all(), blocks = lib.filter(p => p.song);
    const s = Songbook.songs().find(x => x.id === 'bun-dem'); assert.ok(s, 'Bun Dem');
    const mine = blocks.filter(p => p.song.id === 'bun-dem'); assert.gt(mine.length, 4, 'Bun Dem in blocks');
    assert.gt(new Set(mine.map(p => p.tool)).size, 2, 'several instruments'); assert.gt(new Set(mine.map(p => p.section)).size, 2, 'several sections');
    mine.forEach(p => { assert.ok(p.name.indexOf('Bun Dem · ') === 0, p.name); assert.ok(p.notes && p.notes.length, 'notes'); assert.ok(p.bars <= 4, 'a block is at most 4 bars'); });
    assert.ok(mine.filter(p => !p.drums).every(p => p.notes.every(n => typeof n.r === 'number')), 'pitched blocks keep notes from the root (any key)');
    assert.gt(new Set(blocks.map(p => p.song.id)).size, 250, 'nearly every song');
  });
  it('the page: Instrument chips, sections by instrument by default (drums first), by song with ▶ Whole song; a block says its song', () => {
    PatternLibrary.open(); const ov = document.querySelector('.overlay.plib');
    try {
      const chips = [...ov.querySelectorAll('.plib-tools .sbk-chip')].map(c => c.textContent); assert.ok(chips.some(t => /^Drum Machine \d+/.test(t)), chips.slice(0, 5).join());
      const heads = [...ov.querySelectorAll('.plib-sec-head b')].map(b => b.textContent); assert.ok(/Drum/.test(heads[0]), 'drums first: ' + heads.slice(0, 3));
      const reese = [...ov.querySelectorAll('.plib-tools .sbk-chip')].find(c => /^Reese Bass/.test(c.textContent)); reese.click();
      const secs = [...ov.querySelectorAll('.plib-sec-head b')].map(b => b.textContent); assert.deepEqual(secs, ['Reese Bass'], 'one instrument picked');
      assert.ok(ov.querySelector('.plib-card .plib-song'), 'a block says which song it is from');
    } finally { PatternLibrary.open(); }
    PatternLibrary.open({ group: 'song' }); const ov2 = document.querySelector('.overlay.plib');
    try { assert.ok(ov2.querySelector('.plib-sec[data-sec="bun-dem"] .plib-whole'), 'Bun Dem has ▶ Whole song'); } finally { PatternLibrary.open(); }
  });
  it('Songs lists only your songs (saved and exported) and leads to the blocks; an Export is kept there too', async () => {
    const IDB = OrganismSDK.IDB, before = await IDB.get('library', 'mysongs');
    try {
      await IDB.put('library', 'mysongs', [{ name: 'Night Drive', time: Date.now(), duration: 64, bpm: 140, project: '♪ Night Drive' }, { name: 'For June', time: Date.now() - 1000, duration: 90, bpm: 128, project: '♪ For June', exported: 'WAV 24-bit' }]);
      Songbook.open(); const ov = document.querySelector('.overlay.sbk-mine'); await TH.sleep(60);
      const cards = [...ov.querySelectorAll('.sbk-card b')].map(b => b.textContent); assert.deepEqual(cards, ['Night Drive', 'For June'], 'your songs, nothing else');
      assert.ok(/exported · WAV 24-bit/.test(ov.textContent), 'an export says so');
      [...ov.querySelectorAll('.sbk-chip')].find(c => /Exported/.test(c.textContent)).click(); await TH.sleep(30);
      assert.deepEqual([...ov.querySelectorAll('.sbk-card b')].map(b => b.textContent), ['For June']);
      ov.querySelector('.sbk-topat').click(); assert.ok(!document.querySelector('.overlay.sbk-mine'), 'Songs closed'); assert.ok(document.querySelector('.overlay.plib'), 'Patterns open, by song'); PatternLibrary.open();
      // ⤓ Export hands the song to Songs too (the file download itself is stubbed here)
      const U = TH.universe(0.2, { bpm: 120 }), a = TH.spawn(U, 'eravos.song-recorder'), c = OrganismFactory.handle(a).ctx, dl = Codecs.download; Codecs.download = () => {};
      try {
        const sr = 48000, buf = new OfflineAudioContext(1, sr / 2, sr).createBuffer(1, sr / 2, sr), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = 0.3 * Math.sin(i / 20);
        await c.addAudio(AudioRecorder.encodeWAV(buf, 24), 't.wav', null, 0);
        const got = await new Promise((res) => { U.K.bus.subscribe('song:saved', res); U.K.bus.publish('ui:config_change:' + a, { key: 'songName', value: 'exported one' }); U.K.bus.publish('ui:export:' + a, { format: 'wav24' }); setTimeout(() => res(null), 8000); });
        assert.ok(got, 'an export is handed to Songs'); assert.equal(got.name, 'exported one'); assert.ok(got.exported, 'marked exported: ' + got.exported); assert.gt(got.audio.byteLength, 1000);
      } finally { Codecs.download = dl; }
    } finally { await IDB.put('library', 'mysongs', before || []); const o = document.querySelector('.overlay.sbk-mine'); if (o) o.remove(); }
  });
});
