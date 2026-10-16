/* ERAVOS · Her Voice (3.41) — her recordings, kept on this computer, placed into songs by the Song Engine.
 * 1. The store: HerVoice.add(arrayBuffer, name) keeps a recording (IndexedDB 'assets' + an index in 'library'),
 *    finds her phrases (the words between the silences) and remembers them. Nothing leaves the machine and nothing
 *    is written into the repository: each copy of ERAVOS has its own voice store.
 * 2. The placement: a genre with `voice` gets one extra recipe step, { op: 'her_voice' }. It lays her phrases on the
 *    timeline as ordinary audio clips (trimmed with offset/length, faded) where an EDM song wants a voice:
 *      intro   short lines every 4 bars          verse/break  her longer lines, one after another
 *      build   a 1/16 stutter of one line, then the line itself, ending as the gap opens
 *      pause   one short line alone in the silence before the drop
 *      drop    a short line every 8 bars (quiet, wet)            outro  her last line
 *    Every clip can be moved, trimmed or deleted on the timeline like any other. With no recordings stored, the step
 *    does nothing and the song plays without her. The timeline's audio goes through the genre's vocal chain (EQ +
 *    level) with the master reverb and echo sends opened. */
(function () {
  'use strict';
  const R = window.Recipes, SE = window.SongEngine;
  if (!R) return;
  const IDB = () => window.OrganismSDK && window.OrganismSDK.IDB;
  const KEY = 'her-voice';
  let recs = null;                   // [{ hash, name, duration, phrases: [[a, b] seconds] }]
  const listeners = [];
  const changed = () => listeners.forEach(fn => { try { fn(recs.slice()); } catch (e) {} });

  // ---------------------------------------------------------------- phrases: the words between the silences
  // 10 ms windows; silence = 30 dB under the loudest window (never above −55 dBFS); a gap must last 350 ms to split;
  // a phrase shorter than 250 ms is a breath or a click and is dropped.
  function phrasesOf(buf) {
    const sr = buf.sampleRate, w = Math.max(1, Math.round(sr * 0.01)), n = buf.length, chs = [];
    for (let c = 0; c < buf.numberOfChannels; c++) chs.push(buf.getChannelData(c));
    const db = [];
    for (let s = 0; s < n; s += w) { let q = 0; const e = Math.min(n, s + w); for (let i = s; i < e; i++) { let v = 0; chs.forEach(d => { v += d[i]; }); v /= chs.length; q += v * v; } db.push(10 * Math.log10(q / Math.max(1, e - s) + 1e-20)); }
    const top = Math.max.apply(null, db.concat([-120])), thr = Math.max(-55, top - 30), gapW = 35;
    const out = []; let st = -1, quiet = 0;
    db.forEach((d, k) => {
      if (d > thr) { if (st < 0) st = k; quiet = 0; }
      else if (st >= 0 && ++quiet >= gapW) { out.push([st, k - quiet + 1]); st = -1; quiet = 0; }
    });
    if (st >= 0) out.push([st, db.length]);
    return out.map(([a, b]) => [+(a * w / sr).toFixed(3), +(Math.min(n, b * w) / sr).toFixed(3)]).filter(([a, b]) => b - a >= 0.25);
  }

  // one gain per recording so her words sit at −16 dBFS RMS (a quiet phone recording comes up, a hot one comes down)
  function levelOf(buf, phrases) {
    const d = buf.getChannelData(0), sr = buf.sampleRate; let q = 0, n = 0;
    phrases.forEach(([a, b]) => { for (let i = Math.floor(a * sr); i < Math.min(d.length, Math.floor(b * sr)); i++) { q += d[i] * d[i]; n++; } });
    if (!n) return 1;
    const db = 10 * Math.log10(q / n + 1e-20);
    return +Math.max(0.25, Math.min(8, Math.pow(10, (-16 - db) / 20))).toFixed(3);
  }

  async function decode(ab) {
    const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    return await new AC(1, 1, 48000).decodeAudioData(ab.slice(0));
  }
  const hashOf = (ab) => (window.Kernel && window.Kernel.assets ? window.Kernel.assets.hash(ab) : null);

  async function load() {
    if (recs) return recs;
    recs = [];
    try { recs = ((await IDB().get('library', KEY)) || []).filter(r => r && r.hash); } catch (e) {}
    return recs;
  }
  async function save(o) { if (o && o.persist === false) return; try { await IDB().put('library', KEY, recs); } catch (e) {} }

  // add a recording (any file the browser can decode: wav, mp3, ogg; m4a where the platform has AAC)
  async function add(ab, name, o) {
    o = o || {}; await load();
    let buf; try { buf = await decode(ab); } catch (e) { throw new Error((name || 'this file') + ' could not be read — save it as WAV or MP3 and try again'); }
    const K = o.K || window.Kernel, hash = (K && K.assets ? K.assets.hash(ab) : hashOf(ab));
    if (K && K.assets) { const a = K.assets.register(ab, { name: name || 'her voice', mime: 'audio/*', asset_type: 'audio' }); a.decoded = a.decoded || buf; }
    if (o.persist !== false) { try { await IDB().put('assets', hash, { name: name || 'her voice', mime: 'audio/*', asset_type: 'audio', data: ab }); } catch (e) {} }
    const phrases = phrasesOf(buf);
    const rec = { hash, name: name || 'her voice', duration: +buf.duration.toFixed(3), phrases, gain: levelOf(buf, phrases) };
    recs = recs.filter(r => r.hash !== hash).concat([rec]);
    await save(o); changed(); return rec;
  }
  async function remove(hash) { await load(); recs = recs.filter(r => r.hash !== hash); await save(); try { await IDB().put('assets', hash, null); } catch (e) {} changed(); }
  async function clear(o) { recs = []; await save(o); changed(); }

  // make sure every stored recording is in this universe's asset registry (decoded)
  async function ensure(K) {
    await load();
    for (const r of recs) {
      let a = K.assets.get(r.hash);
      if (!a) { let st = null; try { st = await IDB().get('assets', r.hash); } catch (e) {} if (!st || !st.data) continue; a = K.assets.register(st.data, { name: r.name, mime: st.mime || 'audio/*', asset_type: 'audio' }); }
      if (!a.decoded) { try { a.decoded = await K.assets.decode(r.hash); } catch (e) {} }
    }
    return recs.filter(r => { const a = K.assets.get(r.hash); return a && a.decoded; });
  }

  // ---------------------------------------------------------------- where her phrases go (pure: sections + phrases → clips)
  const ROLE = { intro: 'intro', verse: 'talk', break: 'talk', chorus: 'drop', drop: 'drop', peak: 'drop', build: 'build', pause: 'pause', outro: 'outro' };
  function roleOf(sec) { return ROLE[sec.kind] || ROLE[String(sec.name).replace(/\s*\d+$/, '').toLowerCase()] || 'talk'; }
  function plan(sections, bpm, rs, seed) {
    const bar = 240 / bpm, s16 = bar / 16, all = [];
    rs.forEach(r => r.phrases.forEach(([a, b]) => all.push({ hash: r.hash, name: r.name, a, b, len: b - a, level: r.gain || 1 })));
    if (!all.length) return [];
    const rot = (arr, k) => arr.length ? arr.slice(k % arr.length).concat(arr.slice(0, k % arr.length)) : arr;
    const k0 = Math.abs(seed | 0);
    const short = rot(all.filter(p => p.len < 1.5).sort((x, y) => x.len - y.len), k0);
    const long = rot(all.filter(p => p.len >= 1.5), k0);
    const talk = long.length ? long.slice() : all.slice();
    const shortOr = (i) => (short.length ? short : all)[i % (short.length || all.length)];
    const hasOutro = sections.some(s => roleOf(s) === 'outro');
    const last = hasOutro && talk.length > 1 ? talk.pop() : null;
    const out = [], PRE = 0.06, POST = 0.18;
    const put = (p, startBar, o) => {   // a phrase, trimmed around its words, starting at bar position startBar
      o = o || {}; const a = Math.max(0, p.a - PRE), len = o.len || (p.b + POST - a);
      out.push({ hash: p.hash, name: p.name, role: o.role, startBar: +startBar.toFixed(4), offsetSec: +a.toFixed(3), lengthSec: +len.toFixed(3), gain: +((o.gain || 1) * (p.level || 1)).toFixed(3), fadeIn: o.fadeIn === undefined ? 0.02 : o.fadeIn, fadeOut: o.fadeOut === undefined ? Math.min(0.15, len / 3) : o.fadeOut });
    };
    let si = 0;
    sections.forEach((S, idx) => {
      const role = roleOf(S), A = S.bar, B = S.bar + S.bars, next = sections[idx + 1];
      if (role === 'intro') for (let b = A + 1; b < B; b += 4) put(shortOr(si++), b, { role, gain: 0.9 });
      else if (role === 'talk' || (role === 'outro' && !last)) {
        const cap = role === 'outro' ? 1 : S.kind === 'break' || /break/.test(S.name) ? 2 : 3; let b = A + 1, n = 0;
        while (talk.length && n < cap && b < B - 1) { const p = talk.shift(); put(p, b, { role, gain: 1.1 }); b += Math.ceil((p.len + 0.6) / bar); n++; }
      } else if (role === 'outro') put(last, A, { role, gain: 1.1, fadeOut: 0.6 });
      else if (role === 'build') {
        const p = shortOr(si++), end = B - (next && roleOf(next) === 'pause' ? 0 : 0.125);   // ends as the gap opens
        const lineStart = end - (p.len + PRE + POST) / bar - 0.1 / bar, chop0 = lineStart - 8 / 16;
        if (chop0 > A) {
          for (let k = 0; k < 8; k++) put(p, chop0 + k / 16, { role: 'chop', gain: 0.8, len: s16 * 0.9, fadeIn: 0.003, fadeOut: 0.01 });
          put(p, lineStart, { role, gain: 1 });
        }
      } else if (role === 'pause') {
        const fit = all.filter(p => p.len + PRE + POST < bar * 0.92); if (fit.length) put(fit[(si++) % fit.length], A + 0.01, { role, gain: 1.15 });
      } else if (role === 'drop') for (let b = A + 4; b < B; b += 8) put(shortOr(si++), b, { role, gain: 0.55 });
    });
    return out;
  }

  // ---------------------------------------------------------------- recipe op
  R.defineOp('her_voice', async (st, c) => {
    const K = c.K, tl = c.alias[st.target] || st.target, h = window.OrganismFactory && window.OrganismFactory.handle(tl);
    if (!h || !h.ctx || !h.ctx.addAudioClip) return;
    const rs = await ensure(K); if (!rs.length) { K.bus.publish('her-voice:missing', {}); return; }
    const clips = plan(st.sections, st.bpm, rs, st.seed || 1);
    // two audio lanes of her own: her lines, and the stutter chops (the timeline starts with two empty audio lanes)
    const audioLanes = () => ((h.ctx.serialize().extra || {}).lanes || []).filter(l => l.kind === 'audio');
    while (audioLanes().length < 2) K.bus.publish('ui:lane_add:' + tl, { kind: 'audio' });
    const [herLane, chopLane] = audioLanes().slice(-2).map(l => l.id), lanes = new Map([['her', herLane], ['chop', chopLane]]);
    for (const p of clips) {
      const clip = await h.ctx.addAudioClip(p.hash, p.role === 'chop' ? 'her · chop' : 'her · ' + p.role, p.startBar, p.role === 'chop' ? chopLane : herLane);
      if (!clip) continue;
      K.bus.publish('ui:clip_edit:' + tl, { id: clip.id, patch: { offsetSec: p.offsetSec, lengthSec: p.lengthSec, gain: p.gain, fadeIn: p.fadeIn, fadeOut: p.fadeOut } });
    }
    K.bus.publish('ui:lane_edit:' + tl, { id: lanes.get('her'), patch: { name: '🎤 Her voice' } });
    K.bus.publish('ui:lane_edit:' + tl, { id: lanes.get('chop'), patch: { name: '🎤 Her chops', gain: 0.9 } });
    const out = st.out && (c.alias[st.out] || st.out);
    if (out && K.audio && K.audio.strip) { try { K.audio.strip(out, 'out').set({ sends: { reverb: 0.32, echo: 0.18 } }); } catch (e) {} }
    K.bus.publish('her-voice:placed', { count: clips.length });
  });

  window.HerVoice = { load, add, remove, clear, ensure, plan, phrasesOf, roleOf, list: async () => (await load()).slice(), onChange(fn) { listeners.push(fn); } };
})();
