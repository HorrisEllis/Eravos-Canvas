/* ERAVOS music domain — codecs.js → window.Codecs (spec eravos.codecs)
 * Every export format from one AudioBuffer:
 *   WAV  16 / 24-bit PCM, 32-bit float · AIFF 16 / 24 · FLAC 16 / 24 (own encoder: fixed predictors 0–4 per channel,
 *   Rice2 residuals, CRC-8/16 — lossless, verified by round-trip) · MP3 128 / 192 / 256 / 320 (lamejs, LGPL, separate
 *   file) · Opus in WebM or Ogg (MediaRecorder — real-time, where the browser offers it) · stems as a ZIP of WAVs.
 * encode(buffer, id) → Promise<{ blob, ext, mime, bytes }>. Formats the runtime cannot make are listed with ok:false.
 * 3.68 METADATA: encode(buffer, id, { meta }) writes the song's tags into the file —
 *   meta { title, artist, album, genre, year, bpm, key, comment, encoder, cover: { mime: 'image/png' | 'image/jpeg', bytes: Uint8Array } }
 *   MP3: an ID3v2.3 tag in front (text, BPM, key, comment, encoder, the cover as APIC front cover)
 *   WAV: a LIST/INFO chunk (title, artist, album, genre, date, comment, software) + an 'id3 ' chunk (the same ID3 tag, with the cover)
 *   FLAC: a VORBIS_COMMENT block + a PICTURE block (front cover) after STREAMINFO
 *   AIFF: NAME / AUTH / ANNO chunks + an 'ID3 ' chunk (with the cover)
 *   Opus (MediaRecorder): no tags — the browser writes the container. Every tag is added after the audio is encoded: the samples are
 *   the same bytes as without metadata. */
(function (global) {
  'use strict';
  const clamp = (x) => x < -1 ? -1 : x > 1 ? 1 : x;
  function chans(buf) { const c = []; for (let i = 0; i < buf.numberOfChannels; i++) c.push(buf.getChannelData(i)); return c; }
  // TPDF dither for 16-bit
  function quant(x, bits, rnd) { const m = Math.pow(2, bits - 1) - 1; const d = bits <= 16 && rnd ? (rnd() - rnd()) / m : 0; return Math.max(-m - 1, Math.min(m, Math.round(clamp(x + d) * m))); }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------------------------------------------------------------- WAV
  function wav(buf, bits) {
    const C = chans(buf), n = buf.length, nc = C.length, flt = bits === 32, bps = bits / 8, data = n * nc * bps;
    const ab = new ArrayBuffer(44 + data), dv = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + data, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true);
    dv.setUint16(20, flt ? 3 : 1, true); dv.setUint16(22, nc, true); dv.setUint32(24, buf.sampleRate, true); dv.setUint32(28, buf.sampleRate * nc * bps, true);
    dv.setUint16(32, nc * bps, true); dv.setUint16(34, bits, true); w(36, 'data'); dv.setUint32(40, data, true);
    let o = 44; const r = rng(7);
    for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) {
      const x = C[c][i];
      if (flt) { dv.setFloat32(o, x, true); o += 4; }
      else if (bits === 16) { dv.setInt16(o, quant(x, 16, r), true); o += 2; }
      else { const v = quant(x, 24); dv.setUint8(o, v & 255); dv.setUint8(o + 1, (v >> 8) & 255); dv.setUint8(o + 2, (v >> 16) & 255); o += 3; }
    }
    return ab;
  }
  // ---------------------------------------------------------------- AIFF (big-endian, 80-bit extended sample rate)
  function ext80(v, dv, o) {
    let exp = 16383 + Math.floor(Math.log2(v)); let mant = v / Math.pow(2, Math.floor(Math.log2(v)));
    dv.setUint16(o, exp); const hi = Math.floor(mant * 0x80000000); dv.setUint32(o + 2, hi >>> 0); dv.setUint32(o + 6, Math.floor((mant * 0x80000000 - hi) * 0x100000000) >>> 0);
  }
  function aiff(buf, bits) {
    const C = chans(buf), n = buf.length, nc = C.length, bps = bits / 8, data = n * nc * bps;
    const ab = new ArrayBuffer(54 + data), dv = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'FORM'); dv.setUint32(4, 46 + data); w(8, 'AIFF'); w(12, 'COMM'); dv.setUint32(16, 18); dv.setUint16(20, nc); dv.setUint32(22, n); dv.setUint16(26, bits); ext80(buf.sampleRate, dv, 28);
    w(38, 'SSND'); dv.setUint32(42, data + 8); dv.setUint32(46, 0); dv.setUint32(50, 0);
    let o = 54; const r = rng(7);
    for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) { const v = quant(C[c][i], bits, bits === 16 ? r : null); if (bits === 16) { dv.setInt16(o, v); o += 2; } else { dv.setUint8(o, (v >> 16) & 255); dv.setUint8(o + 1, (v >> 8) & 255); dv.setUint8(o + 2, v & 255); o += 3; } }
    return ab;
  }

  // ---------------------------------------------------------------- FLAC
  function BitWriter(cap) {
    let buf = new Uint8Array(cap || 1 << 16), pos = 0, acc = 0, nb = 0;
    const grow = () => { const b = new Uint8Array(buf.length * 2); b.set(buf); buf = b; };
    return {
      bits(v, n) { // v unsigned, n ≤ 36 — word-level: ≤ 24 bits per step into a 31-bit accumulator
        if (n > 24) { this.bits(Math.floor(v / 16777216), n - 24); this.bits(v % 16777216, 24); return; }
        acc = (acc << n) | (v & ((1 << n) - 1)); nb += n;
        while (nb >= 8) { nb -= 8; if (pos >= buf.length - 8) grow(); buf[pos++] = (acc >>> nb) & 255; }
        acc &= (1 << nb) - 1;
      },
      sbits(v, n) { this.bits(v < 0 ? v + Math.pow(2, n) : v, n); },
      unary(q) { while (q >= 24) { this.bits(0, 24); q -= 24; } this.bits(1, q + 1); },
      align() { if (nb) this.bits(0, 8 - nb); },
      get pos() { return pos; }, bytes(from, to) { return buf.subarray(from, to); }, out() { return buf.slice(0, pos); },
    };
  }
  const CRC8 = new Uint8Array(256), CRC16 = new Uint16Array(256);
  for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 255 : (c << 1) & 255; CRC8[i] = c; let d = i << 8; for (let k = 0; k < 8; k++) d = d & 0x8000 ? ((d << 1) ^ 0x8005) & 0xffff : (d << 1) & 0xffff; CRC16[i] = d; }
  const crc8 = (b) => { let c = 0; for (let i = 0; i < b.length; i++) c = CRC8[c ^ b[i]]; return c; };
  const crc16 = (b) => { let c = 0; for (let i = 0; i < b.length; i++) c = ((c << 8) ^ CRC16[(c >> 8) ^ b[i]]) & 0xffff; return c; };
  function utf8num(w, v) { // FLAC "UTF-8" coded frame number
    if (v < 0x80) { w.bits(v, 8); return; }
    const n = v < 0x800 ? 2 : v < 0x10000 ? 3 : v < 0x200000 ? 4 : v < 0x4000000 ? 5 : 6;
    w.bits((0xff00 >> n) & 0xff | (v >> (6 * (n - 1))), 8);
    for (let i = n - 2; i >= 0; i--) w.bits(0x80 | ((v >> (6 * i)) & 0x3f), 8);
  }
  function flacSubframe(w, x, bps) {
    const n = x.length;
    if (x.every(v => v === x[0])) { w.bits(0, 1); w.bits(0, 6); w.bits(0, 1); w.sbits(x[0], bps); return; } // CONSTANT
    // pick the fixed predictor (order 0–4) with the smallest residual magnitude
    let best = null;
    for (let ord = 0; ord <= 4 && ord < n; ord++) {
      const r = new Int32Array(n - ord); let sum = 0;
      for (let i = ord; i < n; i++) {
        const p = ord === 0 ? 0 : ord === 1 ? x[i - 1] : ord === 2 ? 2 * x[i - 1] - x[i - 2] : ord === 3 ? 3 * x[i - 1] - 3 * x[i - 2] + x[i - 3] : 4 * x[i - 1] - 6 * x[i - 2] + 4 * x[i - 3] - x[i - 4];
        r[i - ord] = x[i] - p; sum += Math.abs(r[i - ord]);
      }
      if (!best || sum < best.sum) best = { ord, r, sum };
    }
    const mean = best.sum / Math.max(1, best.r.length);
    let k = mean > 0 ? Math.max(0, Math.floor(Math.log2(mean * 0.69 + 1))) : 0; k = Math.min(30, k);
    const est = best.r.length * (k + 1) + best.r.reduce((s, v) => s + ((v >= 0 ? 2 * v : -2 * v - 1) >>> k), 0);
    if (est > n * bps) { w.bits(0, 1); w.bits(1, 6); w.bits(0, 1); for (let i = 0; i < n; i++) w.sbits(x[i], bps); return; } // VERBATIM
    w.bits(0, 1); w.bits(8 | best.ord, 6); w.bits(0, 1);
    for (let i = 0; i < best.ord; i++) w.sbits(x[i], bps);
    w.bits(1, 2); w.bits(0, 4); w.bits(k, 5); // RICE2, partition order 0
    for (let i = 0; i < best.r.length; i++) { const v = best.r[i], u = v >= 0 ? 2 * v : -2 * v - 1; w.unary(Math.floor(u / Math.pow(2, k))); if (k) w.bits(u % Math.pow(2, k), k); }
  }
  function flac(buf, bps) {
    const C = chans(buf).slice(0, 8), nc = C.length, n = buf.length, BS = 4096, sr = buf.sampleRate;
    const r = bps === 16 ? rng(7) : null;
    const ints = C.map(() => new Int32Array(n)); for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) ints[c][i] = quant(C[c][i], bps, r); // interleaved order = same dither as WAV/AIFF
    const w = BitWriter(n * nc * bps / 8 + 4096);
    w.bits(0x664c6143, 32); // fLaC
    w.bits(1, 1); w.bits(0, 7); w.bits(34, 24); // last metadata block, STREAMINFO, length 34
    w.bits(BS, 16); w.bits(BS, 16); w.bits(0, 24); w.bits(0, 24); w.bits(sr, 20); w.bits(nc - 1, 3); w.bits(bps - 1, 5); w.bits(n, 36);
    for (let i = 0; i < 4; i++) w.bits(0, 32); // MD5 unknown (allowed)
    for (let f = 0, s = 0; s < n; f++, s += BS) {
      const len = Math.min(BS, n - s), h0 = w.pos;
      w.bits(0x3ffe, 14); w.bits(0, 1); w.bits(0, 1); w.bits(7, 4); w.bits(0, 4); w.bits(nc - 1, 4); w.bits(bps === 16 ? 4 : 6, 3); w.bits(0, 1);
      utf8num(w, f); w.bits(len - 1, 16);
      w.bits(crc8(w.bytes(h0, w.pos)), 8);
      for (let c = 0; c < nc; c++) flacSubframe(w, ints[c].subarray(s, s + len), bps);
      w.align(); w.bits(crc16(w.bytes(h0, w.pos)), 16);
    }
    return w.out().buffer;
  }

  // ---------------------------------------------------------------- MP3 (lamejs)
  function mp3(buf, kbps) {
    const L = global.lamejs; if (!L || !L.Mp3Encoder) throw new Error('MP3 encoder (lame.min.js) not loaded');
    const nc = Math.min(2, buf.numberOfChannels), enc = new L.Mp3Encoder(nc, buf.sampleRate, kbps), C = chans(buf), n = buf.length, r = rng(5);
    const to16 = (a) => { const o = new Int16Array(a.length); for (let i = 0; i < a.length; i++) o[i] = quant(a[i], 16, r); return o; };
    const l = to16(C[0]), rr = nc > 1 ? to16(C[1]) : null, parts = [];
    for (let i = 0; i < n; i += 1152) { const d = nc > 1 ? enc.encodeBuffer(l.subarray(i, i + 1152), rr.subarray(i, i + 1152)) : enc.encodeBuffer(l.subarray(i, i + 1152)); if (d.length) parts.push(new Uint8Array(d)); }
    const e = enc.flush(); if (e.length) parts.push(new Uint8Array(e));
    return new Blob(parts, { type: 'audio/mpeg' });
  }
  // ---------------------------------------------------------------- Opus (MediaRecorder, real time)
  function opusMime(container) {
    const MR = global.MediaRecorder; if (!MR || !MR.isTypeSupported) return null;
    const c = container === 'ogg' ? ['audio/ogg;codecs=opus', 'audio/ogg'] : ['audio/webm;codecs=opus', 'audio/webm'];
    return c.find(t => MR.isTypeSupported(t)) || null;
  }
  function opus(buf, container, kbps, onProgress) {
    const mime = opusMime(container); if (!mime) return Promise.reject(new Error(`this browser cannot record ${container}/Opus`));
    const ac = new (global.AudioContext || global.webkitAudioContext)({ sampleRate: buf.sampleRate });
    const src = ac.createBufferSource(); src.buffer = buf; const dst = ac.createMediaStreamDestination(); src.connect(dst);
    const rec = new global.MediaRecorder(dst.stream, { mimeType: mime, audioBitsPerSecond: kbps * 1000 }); const parts = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) parts.push(e.data); };
    return new Promise((res, rej) => {
      rec.onstop = () => { ac.close(); res(new Blob(parts, { type: mime })); }; rec.onerror = (e) => rej(e.error || new Error('MediaRecorder error'));
      const t0 = ac.currentTime; const iv = setInterval(() => { if (onProgress) onProgress(Math.min(1, (ac.currentTime - t0) / buf.duration)); }, 200);
      src.onended = () => { clearInterval(iv); setTimeout(() => rec.stop(), 120); };
      rec.start(250); src.start();
    });
  }
  // ---------------------------------------------------------------- ZIP (stored) for stems
  const CRC32 = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC32[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) { // [{name, data:Uint8Array}]
    const enc = new TextEncoder(), locals = [], cents = []; let off = 0;
    files.forEach(f => {
      const nm = enc.encode(f.name), d = f.data, crc = crc32(d), lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint32(14, crc, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, nm.length, true);
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint32(16, crc, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      locals.push(new Uint8Array(lh.buffer), nm, d); cents.push(new Uint8Array(ch.buffer), nm); off += 30 + nm.length + d.length;
    });
    const cdLen = cents.reduce((s, x) => s + x.length, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdLen, true); end.setUint32(16, off, true);
    return new Blob(locals.concat(cents, [new Uint8Array(end.buffer)]), { type: 'application/zip' });
  }

  // ---------------------------------------------------------------- 3.68 metadata (tags)
  const utf8 = (t) => new TextEncoder().encode(String(t));
  const cat = (parts) => { const n = parts.reduce((s, p) => s + p.length, 0), o = new Uint8Array(n); let i = 0; parts.forEach(p => { o.set(p, i); i += p.length; }); return o; };
  const u32be = (v) => new Uint8Array([(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
  const u32le = (v) => new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]);
  const ascii = (t) => new Uint8Array(Array.from(String(t), c => c.charCodeAt(0) & 255));
  const has = (v) => v !== undefined && v !== null && String(v).trim() !== '';
  // the text fields every format carries, in one order
  const FIELDS = (m) => [['title', m.title], ['artist', m.artist], ['album', m.album], ['genre', m.genre], ['year', m.year], ['bpm', m.bpm && Math.round(+m.bpm)], ['key', m.key], ['comment', m.comment], ['encoder', m.encoder]].filter(([, v]) => has(v));
  // ID3v2.3: UTF-16 text (encoding 1, with BOM) so any name survives; frame sizes plain 32-bit, the tag size syncsafe
  function id3(m) {
    const u16 = (t) => { const b = [0xff, 0xfe]; for (const ch of String(t)) { const c = ch.codePointAt(0); if (c > 0xffff) { const h = 0xd800 + ((c - 0x10000) >> 10), l = 0xdc00 + ((c - 0x10000) & 0x3ff); b.push(h & 255, h >> 8, l & 255, l >> 8); } else b.push(c & 255, c >> 8); } return new Uint8Array(b); };
    const frame = (id, body) => cat([ascii(id), u32be(body.length), new Uint8Array([0, 0]), body]);
    const text = (id, t) => frame(id, cat([new Uint8Array([1]), u16(t)]));
    const ID = { title: 'TIT2', artist: 'TPE1', album: 'TALB', genre: 'TCON', year: 'TYER', bpm: 'TBPM', key: 'TKEY', encoder: 'TSSE' }, fr = [];
    FIELDS(m).forEach(([k, v]) => { if (k === 'comment') fr.push(frame('COMM', cat([new Uint8Array([1]), ascii('eng'), u16(''), new Uint8Array([0, 0]), u16(v)]))); else fr.push(text(ID[k], v)); });
    if (m.cover && m.cover.bytes && m.cover.bytes.length) fr.push(frame('APIC', cat([new Uint8Array([0]), ascii(m.cover.mime || 'image/png'), new Uint8Array([0, 3, 0]), m.cover.bytes])));   // 3 = front cover
    const body = cat(fr), n = body.length, ss = new Uint8Array([(n >> 21) & 127, (n >> 14) & 127, (n >> 7) & 127, n & 127]);
    return cat([ascii('ID3'), new Uint8Array([3, 0, 0]), ss, body]);
  }
  // a RIFF/IFF chunk, padded to an even length
  const chunk = (id, body, be) => cat([ascii(id), be ? u32be(body.length) : u32le(body.length), body].concat(body.length % 2 ? [new Uint8Array([0])] : []));
  function tagWav(ab, m) {
    const src = new Uint8Array(ab), INFO = { title: 'INAM', artist: 'IART', album: 'IPRD', genre: 'IGNR', year: 'ICRD', comment: 'ICMT', encoder: 'ISFT' };
    const subs = FIELDS(m).filter(([k]) => INFO[k]).map(([k, v]) => chunk(INFO[k], cat([utf8(v), new Uint8Array([0])])));
    const add = cat([subs.length ? chunk('LIST', cat([ascii('INFO')].concat(subs))) : new Uint8Array(0), chunk('id3 ', id3(m))]);
    const out = cat([src, add]); new DataView(out.buffer).setUint32(4, out.length - 8, true); return out.buffer;
  }
  function tagAiff(ab, m) {
    const src = new Uint8Array(ab), F = Object.fromEntries(FIELDS(m)), parts = [];
    if (has(F.title)) parts.push(chunk('NAME', utf8(F.title), true)); if (has(F.artist)) parts.push(chunk('AUTH', utf8(F.artist), true));
    if (has(F.comment)) parts.push(chunk('ANNO', utf8(F.comment), true)); parts.push(chunk('ID3 ', id3(m), true));
    const out = cat([src].concat(parts)); new DataView(out.buffer).setUint32(4, out.length - 8); return out.buffer;
  }
  function tagFlac(ab, m) {
    const src = new Uint8Array(ab); if (String.fromCharCode(...src.subarray(0, 4)) !== 'fLaC') return ab;
    const siEnd = 4 + 4 + ((src[5] << 16) | (src[6] << 8) | src[7]);   // our encoder writes STREAMINFO alone, marked last
    const VC = { title: 'TITLE', artist: 'ARTIST', album: 'ALBUM', genre: 'GENRE', year: 'DATE', bpm: 'BPM', key: 'INITIALKEY', comment: 'COMMENT', encoder: 'ENCODER' };
    const vendor = utf8('ERAVOS'), entries = FIELDS(m).map(([k, v]) => utf8(VC[k] + '=' + v));
    const vc = cat([u32le(vendor.length), vendor, u32le(entries.length)].concat(...entries.map(e => [u32le(e.length), e])));
    const blocks = [[4, vc]];
    if (m.cover && m.cover.bytes && m.cover.bytes.length) { const mime = ascii(m.cover.mime || 'image/png'), dim = m.cover.size || 0;
      blocks.push([6, cat([u32be(3), u32be(mime.length), mime, u32be(0), u32be(dim), u32be(dim), u32be(24), u32be(0), u32be(m.cover.bytes.length), m.cover.bytes])]); }
    const head = (type, last, len) => new Uint8Array([(last ? 128 : 0) | type, (len >> 16) & 255, (len >> 8) & 255, len & 255]);
    const si = src.slice(0, siEnd); si[4] = si[4] & 127;   // STREAMINFO is no longer the last block
    const out = cat([si].concat(...blocks.map(([t, b], i) => [head(t, i === blocks.length - 1, b.length), b]), [src.subarray(siEnd)]));
    return out.buffer;
  }
  async function tag(ext, r, m) {
    if (ext === 'mp3') return new Blob([id3(m), r instanceof Blob ? r : new Uint8Array(r)], { type: 'audio/mpeg' });
    const ab = r instanceof Blob ? await r.arrayBuffer() : r;
    return ext === 'wav' ? tagWav(ab, m) : ext === 'aiff' ? tagAiff(ab, m) : ext === 'flac' ? tagFlac(ab, m) : r;
  }

  const FORMATS = [
    { id: 'wav24', label: 'WAV 24-bit', ext: 'wav', mime: 'audio/wav', kind: 'lossless', make: (b) => wav(b, 24) },
    { id: 'wav16', label: 'WAV 16-bit (CD, dithered)', ext: 'wav', mime: 'audio/wav', kind: 'lossless', make: (b) => wav(b, 16) },
    { id: 'wav32f', label: 'WAV 32-bit float', ext: 'wav', mime: 'audio/wav', kind: 'lossless', make: (b) => wav(b, 32) },
    { id: 'flac24', label: 'FLAC 24-bit', ext: 'flac', mime: 'audio/flac', kind: 'lossless', make: (b) => flac(b, 24) },
    { id: 'flac16', label: 'FLAC 16-bit', ext: 'flac', mime: 'audio/flac', kind: 'lossless', make: (b) => flac(b, 16) },
    { id: 'aiff24', label: 'AIFF 24-bit', ext: 'aiff', mime: 'audio/aiff', kind: 'lossless', make: (b) => aiff(b, 24) },
    { id: 'aiff16', label: 'AIFF 16-bit', ext: 'aiff', mime: 'audio/aiff', kind: 'lossless', make: (b) => aiff(b, 16) },
    { id: 'mp3-320', label: 'MP3 320 kbps', ext: 'mp3', mime: 'audio/mpeg', kind: 'lossy', make: (b) => mp3(b, 320), ok: () => !!(global.lamejs && global.lamejs.Mp3Encoder) },
    { id: 'mp3-192', label: 'MP3 192 kbps', ext: 'mp3', mime: 'audio/mpeg', kind: 'lossy', make: (b) => mp3(b, 192), ok: () => !!(global.lamejs && global.lamejs.Mp3Encoder) },
    { id: 'mp3-128', label: 'MP3 128 kbps', ext: 'mp3', mime: 'audio/mpeg', kind: 'lossy', make: (b) => mp3(b, 128), ok: () => !!(global.lamejs && global.lamejs.Mp3Encoder) },
    { id: 'opus-webm', label: 'Opus 192 (WebM, real-time)', ext: 'webm', mime: 'audio/webm', kind: 'lossy', realtime: true, make: (b, o) => opus(b, 'webm', 192, o && o.onProgress), ok: () => !!opusMime('webm') },
    { id: 'opus-ogg', label: 'Opus 192 (Ogg, real-time)', ext: 'ogg', mime: 'audio/ogg', kind: 'lossy', realtime: true, make: (b, o) => opus(b, 'ogg', 192, o && o.onProgress), ok: () => !!opusMime('ogg') },
  ];
  async function encode(buffer, id, o) {
    const f = FORMATS.find(x => x.id === id); if (!f) throw new Error('unknown format ' + id);
    if (f.ok && !f.ok()) throw new Error(f.label + ' is not available in this runtime');
    let r = await f.make(buffer, o);
    const tagged = !!(o && o.meta && !f.realtime); if (tagged) r = await tag(f.ext, r, o.meta);
    const blob = r instanceof Blob ? r : new Blob([r], { type: f.mime });
    return { blob, ext: f.ext, mime: f.mime, bytes: blob.size, label: f.label, tagged };
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = global.document.createElement('a'); a.href = url; a.download = name; global.document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  global.Codecs = { FORMATS: FORMATS.map(f => ({ id: f.id, label: f.label, ext: f.ext, kind: f.kind, realtime: !!f.realtime, available: () => !f.ok || f.ok() })), encode, download, wav, aiff, flac, mp3, zip, crc32, id3, tagWav, tagAiff, tagFlac, tags: (id) => { const f = FORMATS.find(x => x.id === id); return !!f && !f.realtime; } };
})(typeof window !== 'undefined' ? window : globalThis);
