/* 3.68 — "The export: have a metadata editor option and have it autofilled. Option to upload cover image." Tags written into
 * MP3 / WAV / FLAC / AIFF (read back here byte by byte), the audio untouched by them, and the Song Recorder's autofill and covers. */
window.__phase = 'P68';
describe('P68 · export tags — written into every format, the audio untouched', () => {
  const buf = () => { const sr = 48000, n = sr, b = new OfflineAudioContext(2, n, sr).createBuffer(2, n, sr); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = 0.4 * Math.sin(2 * Math.PI * (220 + 110 * c) * i / sr); } return b; };
  const png = async () => { const cv = document.createElement('canvas'); cv.width = cv.height = 8; cv.getContext('2d').fillRect(0, 0, 4, 4); return new Uint8Array(await (await new Promise(r => cv.toBlob(r, 'image/png'))).arrayBuffer()); };
  const META = async () => ({ title: 'Floor Falls Out — ñ', artist: 'James', album: 'Heavy', genre: 'Dubstep', year: '2026', bpm: 145, key: 'Am', comment: 'Made with ERAVOS', encoder: 'ERAVOS', cover: { mime: 'image/png', bytes: await png(), size: 8 } });
  const bytes = async (r) => new Uint8Array(await r.blob.arrayBuffer());
  const str = (b, a, n) => String.fromCharCode(...b.subarray(a, a + n));
  const u32be = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0, u32le = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  const utf16 = (b) => { const s = b[0] === 0xff && b[1] === 0xfe ? 2 : 0; let t = ''; for (let i = s; i + 1 < b.length; i += 2) { const c = b[i] | (b[i + 1] << 8); if (!c) break; t += String.fromCharCode(c); } return t; };
  function id3Frames(b, at) {   // ID3v2.3 at offset → { id: body }
    assert.equal(str(b, at, 3), 'ID3'); assert.equal(b[at + 3], 3, 'v2.3');
    const size = (b[at + 6] << 21) | (b[at + 7] << 14) | (b[at + 8] << 7) | b[at + 9], out = {}; let o = at + 10;
    while (o < at + 10 + size) { const id = str(b, o, 4), n = u32be(b, o + 4); if (!/^[A-Z0-9]{4}$/.test(id)) break; out[id] = b.subarray(o + 10, o + 10 + n); o += 10 + n; }
    return { frames: out, end: at + 10 + size };
  }
  const decode = async (r) => new OfflineAudioContext(2, 48000, 48000).decodeAudioData((await r.blob.arrayBuffer()).slice(0));
  const same = async (a, b) => { const x = (await decode(a)).getChannelData(1), y = (await decode(b)).getChannelData(1); assert.equal(x.length, y.length); let mx = 0; for (let i = 0; i < x.length; i++) mx = Math.max(mx, Math.abs(x[i] - y[i])); return mx; };
  it('MP3: an ID3v2.3 tag in front — every field, UTF-16 text, the cover as the front cover — and it still plays', async () => {
    const b = buf(), m = await META(), r = await Codecs.encode(b, 'mp3-192', { meta: m }), d = await bytes(r), { frames: F, end } = id3Frames(d, 0);
    assert.ok(r.tagged); assert.equal(utf16(F.TIT2.subarray(1)), 'Floor Falls Out — ñ', 'the title, any characters'); assert.equal(utf16(F.TPE1.subarray(1)), 'James');
    assert.equal(utf16(F.TBPM.subarray(1)), '145'); assert.equal(utf16(F.TKEY.subarray(1)), 'Am'); assert.equal(utf16(F.TCON.subarray(1)), 'Dubstep'); assert.equal(utf16(F.TSSE.subarray(1)), 'ERAVOS');
    const ap = F.APIC; assert.equal(str(ap, 1, 9), 'image/png'); assert.equal(ap[11], 3, 'front cover'); assert.deepEqual(Array.from(ap.subarray(13)), Array.from(m.cover.bytes), 'the image bytes');
    assert.equal(d[end], 0xff, 'the audio starts right after the tag'); assert.gt((await decode(r)).length, 40000, 'it still decodes');
  });
  it('WAV: a LIST/INFO chunk and an id3 chunk after the audio; the RIFF size is right; the samples are bit-identical', async () => {
    const b = buf(), m = await META(), plain = await Codecs.encode(b, 'wav24'), r = await Codecs.encode(b, 'wav24', { meta: m }), d = await bytes(r);
    assert.equal(u32le(d, 4), d.length - 8, 'RIFF size'); const ch = {}; let o = 12; while (o + 8 <= d.length) { const id = str(d, o, 4), n = u32le(d, o + 4); ch[id] = d.subarray(o + 8, o + 8 + n); o += 8 + n + (n % 2); }
    assert.ok(ch['fmt '] && ch.data && ch.LIST && ch['id3 '], 'chunks: ' + Object.keys(ch).join(' '));
    assert.equal(str(ch.LIST, 0, 4), 'INFO'); const info = {}; let q = 4; while (q + 8 <= ch.LIST.length) { const id = str(ch.LIST, q, 4), n = u32le(ch.LIST, q + 4); info[id] = new TextDecoder().decode(ch.LIST.subarray(q + 8, q + 8 + n)).replace(/\0+$/, ''); q += 8 + n + (n % 2); }
    assert.equal(info.INAM, 'Floor Falls Out — ñ'); assert.equal(info.IART, 'James'); assert.equal(info.IGNR, 'Dubstep'); assert.equal(info.ISFT, 'ERAVOS');
    assert.ok(id3Frames(ch['id3 '], 0).frames.APIC, 'the id3 chunk carries the cover');
    assert.equal(await same(plain, r), 0, 'the audio is the same bytes');
  });
  it('FLAC: STREAMINFO, then VORBIS_COMMENT and PICTURE (the last block); still bit-identical when decoded', async () => {
    const b = buf(), m = await META(), plain = await Codecs.encode(b, 'flac24'), r = await Codecs.encode(b, 'flac24', { meta: m }), d = await bytes(r);
    assert.equal(str(d, 0, 4), 'fLaC'); const blocks = []; let o = 4, last = false;
    while (!last) { last = !!(d[o] & 128); const type = d[o] & 127, n = (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3]; blocks.push({ type, body: d.subarray(o + 4, o + 4 + n), last }); o += 4 + n; }
    assert.deepEqual(blocks.map(x => x.type), [0, 4, 6], 'STREAMINFO · VORBIS_COMMENT · PICTURE'); assert.ok(blocks[2].last && !blocks[0].last);
    const vc = blocks[1].body, vl = u32le(vc, 0); let p = 4 + vl; const n = u32le(vc, p); p += 4; const tags = []; for (let i = 0; i < n; i++) { const l = u32le(vc, p); tags.push(new TextDecoder().decode(vc.subarray(p + 4, p + 4 + l))); p += 4 + l; }
    assert.ok(tags.includes('TITLE=Floor Falls Out — ñ') && tags.includes('ARTIST=James') && tags.includes('BPM=145') && tags.includes('INITIALKEY=Am'), tags.join(' | '));
    assert.equal(u32be(blocks[2].body, 0), 3, 'front cover');
    assert.equal(await same(plain, r), 0, 'decodes to the same samples');
  });
  it('AIFF: NAME, AUTH, ANNO and an ID3 chunk; the FORM size is right · Opus carries no tags (and says so)', async () => {
    const b = buf(), m = await META(), d = await bytes(await Codecs.encode(b, 'aiff24', { meta: m }));
    assert.equal(u32be(d, 4), d.length - 8); const ids = []; let o = 12; while (o + 8 <= d.length) { const id = str(d, o, 4), n = u32be(d, o + 4); ids.push(id); o += 8 + n + (n % 2); }
    ['COMM', 'SSND', 'NAME', 'AUTH', 'ANNO', 'ID3 '].forEach(id => assert.ok(ids.includes(id), id + ' in ' + ids.join(' ')));
    assert.ok(!Codecs.tags('opus-webm') && Codecs.tags('mp3-320') && Codecs.tags('flac16'));
  });
});

describe('P68 · the Song Recorder fills the tags in, remembers the artist, draws a cover', () => {
  const rig = () => { const U = TH.universe(0.2, { bpm: 145 }), id = TH.spawn(U, 'eravos.song-recorder'), c = OrganismFactory.handle(id).ctx; return { U, id, c, pub: (t, p) => U.K.bus.publish('ui:' + t + ':' + id, p) }; };
  it('autofilled: the song’s name (or the song the Songbook wrote), its genre, the year, BPM and key; typed values win; clearing one goes back', () => {
    const { U, c, pub } = rig(); if (c.secret) c.secret('artist').clear();
    let a = c.internals.metaOf(); assert.equal(a.title, 'my song'); assert.equal(a.bpm, '145'); assert.equal(a.year, String(new Date().getFullYear())); assert.equal(a.comment, 'Made with ERAVOS');
    assert.ok(/^[A-G]#?m?$/.test(a.key), 'a key: ' + a.key);
    U.K.bus.publish('song:written', { title: 'Floor Falls Out', genre: 'Heavy Drops (half-time)' }); a = c.internals.metaOf();
    assert.equal(a.title, 'Floor Falls Out', 'the Songbook’s song'); assert.equal(a.genre, 'Heavy Drops (half-time)');
    c.params.set('songName', 'Night Ride'); assert.equal(c.internals.metaOf().title, 'Night Ride', 'a name you typed wins');
    pub('meta_set', { patch: { genre: 'Dubstep', album: 'Heavy', nonsense: 'x' } }); a = c.internals.metaOf(); assert.equal(a.genre, 'Dubstep'); assert.equal(a.album, 'Heavy');
    assert.equal(c.params.get('meta').nonsense, undefined, 'only real fields'); pub('meta_set', { patch: { genre: '' } }); assert.equal(c.internals.metaOf().genre, 'Heavy Drops (half-time)', 'cleared → autofilled again');
  });
  it('the artist is typed once and remembered on this computer — a new recorder (another project) has it; it is never in the save', () => {
    const r1 = rig(); if (!r1.c.secret) return; r1.c.secret('artist').clear();
    r1.pub('meta_set', { patch: { artist: 'James' } }); const r2 = rig();
    try { assert.equal(r2.c.internals.metaOf().artist, 'James', 'remembered'); assert.ok(!JSON.stringify(r2.c.serialize()).includes('James'), 'not in the second project’s save'); }
    finally { r1.c.secret('artist').clear(); }
  });
  it('covers: no image → an auto cover drawn from the song (a 1000 px PNG); an uploaded image is used instead', async () => {
    const { c, pub } = rig(), sr = 48000, b = new OfflineAudioContext(2, sr, sr).createBuffer(2, sr, sr); for (let i = 0; i < sr; i++) b.getChannelData(0)[i] = Math.sin(i / 20) * (i / sr);
    let m = await c.internals.tagsFor(b); assert.ok(m.cover && m.cover.mime === 'image/png'); const B = m.cover.bytes;
    assert.equal(String.fromCharCode(...B.subarray(12, 16)), 'IHDR'); assert.equal((B[16] << 24) | (B[17] << 16) | (B[18] << 8) | B[19], 1000, '1000 px wide');
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const img = new Uint8Array(await (await new Promise(r => cv.toBlob(r, 'image/png'))).arrayBuffer());
    pub('cover_set', { arrayBuffer: img.buffer.slice(0), mime: 'image/png', name: 'mine.png' }); m = await c.internals.tagsFor(b);
    assert.deepEqual(Array.from(m.cover.bytes), Array.from(img), 'your image');
    pub('cover_set', { arrayBuffer: new ArrayBuffer(8), mime: 'image/gif' }); assert.deepEqual(Array.from((await c.internals.tagsFor(b)).cover.bytes), Array.from(img), 'a GIF is refused, the cover stays');
    pub('cover_clear', {}); c.params.set('autoCover', false); assert.equal((await c.internals.tagsFor(b)).cover, undefined, 'no image and no auto cover: none');
  });
});
