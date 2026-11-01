/* 3.86 — "i want the songs broken into patterns, and moved to the patterns menu, piece by piece, sorted by instrument, like blocks, or
 * units, then the songs library is for saved or export songs". */
window.__phase = 'P86';
describe('P86 · songs in blocks (Patterns) · Songs = your saved and exported songs', () => {
  it('every named song is taken apart: each instrument, each section a block named for the song; they play in your key', () => {
    const lib = PatternLibrary.all(), blocks = lib.filter(p => p.song);
    const s = Songbook.songs().find(x => x.id === 'bun-dem'); assert.ok(s, 'Bun Dem');
    const mine = blocks.filter(p => p.song.id === 'bun-dem'); assert.gt(mine.length, 4, 'Bun Dem in blocks');
    assert.gt(new Set(mine.map(p => p.tool)).size, 2, 'several instruments'); assert.gt(new Set(mine.map(p => p.section)).size, 2, 'several sections');
    mine.forEach(p => { assert.ok(p.name.indexOf('Bun Dem · ') === 0, p.name); assert.ok(p.notes && p.notes.length, 'notes'); assert.ok(p.bars <= 4, 'a block is at most 4 bars'); });
    assert.ok(mine.filter(p => !p.drums).every(p => p.notes.every(n => typeof n.r === 'number')), 'pitched blocks keep notes from the root (any key)');
    assert.gt(new Set(blocks.map(p => p.song.id)).size, 250, 'nearly every song');
  });
  it('the page: pick an instrument in the tool list → only its blocks, each saying its song; by song, every song has ▶ Whole song', () => {
    PatternLibrary.open({ group: 'type' }); const ov = document.querySelector('.overlay.plib');
    try {
      const rb = ov.querySelector('.plib-rt[data-tool="eravos.reese-bass"]'); assert.ok(rb, 'Reese Bass in the tool list'); rb.click();
      const cards = [...ov.querySelectorAll('.plib-card')]; assert.gt(cards.length, 0, 'its blocks');
      assert.ok(cards.some(c => c.querySelector('.plib-song')), 'a block says which song it is from');
      assert.ok(PatternLibrary.all().filter(p => p.tool === 'eravos.reese-bass' && p.song).length > 50, 'Reese Bass blocks from the songs');
    } finally { PatternLibrary.open(); }
    PatternLibrary.open({ group: 'song' }); const ov2 = document.querySelector('.overlay.plib');
    try { assert.ok(ov2.querySelector('.plib-sec[data-sec="bun-dem"] .plib-whole'), 'Bun Dem has ▶ Whole song'); } finally { PatternLibrary.open(); }
  });
  it('Songs has the songs again, and yours (saved and exported) under My songs; an Export is kept there too', async () => {
    const IDB = OrganismSDK.IDB, before = await IDB.get('library', 'mysongs');
    try {
      await IDB.put('library', 'mysongs', [{ name: 'Night Drive', time: Date.now(), duration: 64, bpm: 140, project: '♪ Night Drive' }, { name: 'For June', time: Date.now() - 1000, duration: 90, bpm: 128, project: '♪ For June', exported: 'WAV 24-bit' }]);
      // 3.92 the songs came back to Songs (asked: "can you recover those? those are my rythme"); yours are under 📖 My songs
      Songbook.open(); const ov = document.querySelector('.overlay.sbk'); await TH.sleep(30);
      assert.ok([...ov.querySelectorAll('.sbk-card b')].some(b => /Floor Falls Out/.test(b.textContent)), 'the songs are back');
      [...ov.querySelectorAll('.sbk-chip')].find(c => /My songs/.test(c.textContent)).click(); await TH.sleep(60);
      const cards = [...ov.querySelectorAll('.sbk-card b')].map(b => b.textContent); assert.deepEqual(cards, ['Night Drive', 'For June'], 'your songs');
      assert.ok(/exported · WAV 24-bit/.test(ov.textContent), 'an export says so');
      ov.querySelector('.sbk-x').click();
      // ⤓ Export hands the song to Songs too (the file download itself is stubbed here)
      const U = TH.universe(0.2, { bpm: 120 }), a = TH.spawn(U, 'eravos.song-recorder'), c = OrganismFactory.handle(a).ctx, dl = Codecs.download; Codecs.download = () => {};
      try {
        const sr = 48000, buf = new OfflineAudioContext(1, sr / 2, sr).createBuffer(1, sr / 2, sr), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = 0.3 * Math.sin(i / 20);
        await c.addAudio(AudioRecorder.encodeWAV(buf, 24), 't.wav', null, 0);
        const got = await new Promise((res) => { U.K.bus.subscribe('song:saved', res); U.K.bus.publish('ui:config_change:' + a, { key: 'songName', value: 'exported one' }); U.K.bus.publish('ui:export:' + a, { format: 'wav24' }); setTimeout(() => res(null), 8000); });
        assert.ok(got, 'an export is handed to Songs'); assert.equal(got.name, 'exported one'); assert.ok(got.exported, 'marked exported: ' + got.exported); assert.gt(got.audio.byteLength, 1000);
      } finally { Codecs.download = dl; }
    } finally { await IDB.put('library', 'mysongs', before || []); const o = document.querySelector('.overlay.sbk'); if (o) o.remove(); }
  });
});
