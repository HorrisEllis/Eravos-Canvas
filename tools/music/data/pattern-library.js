/* ERAVOS Pattern Library (3.71 · specs/eravos.pattern-library.spec, addendum 2026-10-24) — window.PatternLibrary.
 * James, 2026-10-24: "what about instead of so much songs, we have a pattern library" (and 10-23: "what about instead of so many songs, we
 * have a pattern library?").
 * A PATTERN is one musical idea you can drop anywhere: a drum groove, a bass line, a wobble phrase, chords, a lead, an arp line, a DROP (the
 * bar the floor falls out), a FILL, or a CURVE (a knob moving over bars). It keeps what makes it good: the timeline's own notes with their
 * bends, oscillation and per-note knobs (pitched notes stored as semitones from the key's root, so it plays in any song's key).
 *   { id, name, type, genre, genreLabel, bpm, bars, tool, preset?, configure?, scale, drums?, notes?, curve?: { key, points, osc? }, source }
 * The library is GENERATED from the Song Engine — every genre's parts, section by section — nothing stored by hand, so a new genre adds its
 * patterns by itself. Floor Falls' four pause moves (falls · stairs · freefall · rises) are named.
 *   PatternLibrary.all() · types · get(id) · send(p, { K?, bar?, headless? }) → { tl, lane, tool } · render(p) · play(p) · stop() · open() */
(function (global) {
  'use strict';
  const SE = () => global.SongEngine, F = () => global.OrganismFactory;
  const TYPES = [['drums', '🥁 Drums'], ['bass', '🔊 Bass'], ['wobble', '〰 Wobble'], ['chords', '🎹 Chords'], ['lead', '🎵 Lead'], ['arp', '🪜 Arp'], ['drop', '🕳 Drops'], ['fill', '🥁 Fills'], ['curve', '📈 Curves'], ['tension', '🔺 Tension'], ['chain', '⛓ Build → Drop']];   // 3.72: tension · chains
  const MAX_BARS = 4;
  let LIB = null;
  const sources = [];   // 3.72: data files add hand-made patterns (PatternLibrary.addSource(fn → patterns[]))
  const sig = (p) => p.type + '|' + p.tool + '|' + (p.move || '') + '|' + JSON.stringify(p.notes || p.curve || (p.parts || []).map(x => [x.at, x.pattern.name]));   // a named move is its own pattern even when its notes match another's (freefall = falls' notes + its curves)
  function typeOf(G, P) {
    if (P.role === 'drums') return 'drums';
    if (P.organism === 'eravos.arp') return 'arp';
    if (P.role === 'bass') return /wobble|wub/.test(P.organism) ? 'wobble' : 'bass';
    if (P.role === 'chords') return 'chords';
    if (P.role === 'lead') return 'lead';
    return null;
  }
  // one genre, one seed → its patterns: per part, the first bars of each kind of section; the pause = a DROP; the build's last drum bar = a FILL
  function fromGenre(G, seed, name) {
    let steps; try { steps = SE().generate(G.id, seed); } catch (e) { return []; } if (!steps) return []; steps = steps.steps || steps;
    const sess = steps.find(s => s.op === 'configure' && s.target === 'session'), root = sess ? +sess.params.root || 0 : 0, scale = sess ? sess.params.scale : 'minor';
    const bpm = (steps.find(s => s.op === 'bpm') || {}).bpm || 120, mounts = {}, conf = {};
    steps.forEach(s => { if (s.op === 'mount') mounts[s.as] = s; if (s.op === 'configure' && s.target) conf[s.target] = Object.assign(conf[s.target] || {}, s.params); });
    const out = [], seen = new Set(), base = (alias, P) => ({ genre: G.id, genreLabel: G.label, bpm, scale, tool: P.organism, preset: mounts[alias] && mounts[alias].preset, configure: conf[alias] });
    steps.filter(s => s.op === 'event' && s.topic === 'clip_add' && s.payload && s.payload.kind === 'notes').forEach(s => {
      const c = s.payload, alias = String(c.target || '').replace(/^@/, ''), P = G.parts[alias]; if (!P) return;
      const t0 = typeOf(G, P); if (!t0) return;
      const secName = String(c.name || '').split(' · ').pop(), kind = secName.replace(/\s*\d+$/, '');
      const pitched = (n) => Object.assign({ s: n.s, l: n.l, r: n.n - root, v: n.v }, n.p ? { p: n.p } : {}, n.b ? { b: n.b } : {});
      const drum = (n) => ({ s: n.s, l: n.l, n: n.n, v: n.v });
      const take = (from, bars) => c.notes.filter(n => n.s >= from * 16 && n.s < (from + bars) * 16).map(n => Object.assign({}, n, { s: n.s - from * 16 }));
      const push = (type, bars, notes, nm) => { if (!notes.length) return; const k = alias + '|' + type + '|' + kind; if (seen.has(k)) return; seen.add(k);
        out.push(Object.assign(base(alias, P), { type, bars, name: nm || ((P.name || alias) + ' · ' + secName), drums: t0 === 'drums', notes: notes.map(t0 === 'drums' ? drum : pitched), source: G.label + ' #' + seed + ' · ' + secName })); };
      if (kind === 'pause') return P.role === 'bass' ? push('drop', c.bars, take(0, c.bars), name ? name + ' (' + (P.name || alias) + ')' : null) : undefined;   // a drop is the bass in the pause (a pad holding there is not one)
      const bars = Math.min(MAX_BARS, c.loop ? Math.max(1, Math.round(c.loop / 16)) : c.bars);
      push(t0, bars, take(0, bars));
      if (t0 === 'drums' && kind === 'build' && c.bars > 1) push('fill', 1, take(c.bars - 1, 1), (P.name || alias) + ' · fill into the drop');
    });
    // curves: the first stretch of every curve lane (points from bar 0), with its oscillation
    steps.filter(s => s.op === 'event' && s.topic === 'lane_add' && s.payload && s.payload.kind === 'auto').forEach(s => {
      const c = s.payload, alias = String(c.target || '').replace(/^@/, ''), P = G.parts[alias]; if (!P || !Array.isArray(c.points) || !c.points.length) return;
      const pts = c.points.slice().sort((a, b) => a[0] - b[0]), b0 = pts[0][0], first = pts.filter(q => q[0] < b0 + 16);
      const span = Math.max(1, Math.ceil(first[first.length - 1][0] - b0 + 1e-6));
      const k = alias + '|curve|' + c.key; if (seen.has(k)) return; seen.add(k);
      out.push(Object.assign(base(alias, P), { type: 'curve', bars: Math.min(16, span), name: (c.name || c.key) + ' (' + (P.name || alias) + ')' + (name ? ' · ' + name : ''),
        curve: Object.assign({ key: c.key, points: first.map(q => [+(q[0] - b0).toFixed(4), q[1]]) }, c.osc ? { osc: c.osc } : {}), source: G.label + ' #' + seed }));
    });
    return out;
  }
  function build() {
    const out = [], have = new Set(), add = (p) => { const k = sig(p); if (have.has(k)) return; have.add(k); p.id = 'pat-' + (out.length + 1).toString(36) + '-' + p.type; out.push(p); };
    // Floor Falls first: its four pause moves and its freefall curves, by name (the moves come from the seed: 7001 falls · 7002 stairs …)
    const FF = global.FloorFallsSongbook, G = FF && SE() && SE().genres().find(g => g.id === 'hd-floor-falls');
    if (G) [7001, 7002, 7003, 7004].forEach(seed => { const mv = FF.moveOf(seed), label = { falls: 'The floor falls', stairs: 'Stairs down', freefall: 'Freefall', rises: 'Rises from the floor' }[mv];
      fromGenre(G, seed, label).filter(p => p.type === 'drop' || (!!p.curve && /Freefall/.test(p.name))).forEach(p => { p.move = mv; add(p); }); });
    sources.forEach(fn => { try { (fn() || []).forEach(add); } catch (e) { console.error('[ERAVOS] pattern source failed', e); } });   // 3.72 hand-made first
    const named = new Set(out.map(p => p.type + '|' + p.tool + '|' + JSON.stringify(p.notes || p.curve)));
    (SE() ? SE().genres() : []).forEach(Gx => [1, 2].forEach(seed => fromGenre(Gx, seed).forEach(p => { if (!named.has(p.type + '|' + p.tool + '|' + JSON.stringify(p.notes || p.curve))) add(p); })));
    return out;
  }
  const all = () => { if (!LIB) LIB = build(); return LIB; };
  // ---- into a song: the Timeline on the canvas (or a new one), the track that plays this kind of tool (or a new one with it), after
  //      what is already on that track (or at `bar`), in the song's key
  function trackFor(K, tl, p, headless) {
    const T = F().handle(tl).ctx, lanes = T.internals.lanes;
    let lane = lanes.find(l => l.kind === 'inst' && l.target && K.registry.get(l.target) && K.registry.get(l.target).organism_id === p.tool);
    if (lane) return lane;
    const id = F().spawn(p.tool, Object.assign({ K }, headless ? { headless: true } : {})); if (!id) return null;
    if (p.preset) K.bus.publish('ui:preset_load:' + id, { name: p.preset });
    Object.entries(p.configure || {}).forEach(([key, value]) => K.bus.publish('ui:config_change:' + id, { key, value }));
    K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: id, name: (F().def(p.tool) || {}).label || p.tool });
    return T.internals.lanes.find(l => l.kind === 'inst' && l.target === id) || null;
  }
  function send(p, o) {
    o = o || {}; const K = o.K || global.Kernel; if (!p || !K) return null;
    let tl = (K.registry.byOrganism('eravos.timeline')[0] || {}).instance_id;
    if (!tl) tl = F().spawn('eravos.timeline', Object.assign({ K }, o.headless ? { headless: true } : {}));
    if (!tl) return null;
    if (p.type === 'chain') {   // 3.72: every part at its offset — each on the track for its kind of tool — starting after the song's last clip
      const T0 = F().handle(tl).ctx, end0 = Math.max(1, ...T0.internals.clips.map(c => c.startBar + (c.bars || 0))), b0 = o.bar || end0;
      const done = p.parts.map(x => send(x.pattern, { K, bar: b0 + x.at, headless: o.headless })); return { tl, bar: b0, parts: done, lane: done[0] && done[0].lane, tool: done[0] && done[0].tool };
    }
    const T = F().handle(tl).ctx, lane = trackFor(K, tl, p, o.headless); if (!lane) return null;
    const root = T.key ? +T.key.root || 0 : 0, pub = (k, v) => K.bus.publish('ui:' + k + ':' + tl, v);
    const end = Math.max(1, ...T.internals.clips.filter(c => c.lane === lane.id).map(c => c.startBar + (c.bars || 0)));
    const bar = o.bar || end;
    if (!!p.curve) {
      pub('lane_add', Object.assign({ kind: 'auto', target: lane.target, key: p.curve.key, name: p.name.replace(/\s*\(.*$/, ''), points: p.curve.points.map(q => [q[0] + bar, q[1]]) }, p.curve.osc ? { osc: p.curve.osc } : {}));
      return { tl, lane, tool: lane.target, bar };
    }
    const notes = p.notes.map(n => Object.assign({ s: n.s, l: n.l, n: p.drums ? n.n : n.r + root, v: n.v }, n.p ? { p: n.p } : {}, n.b ? { b: n.b } : {}));
    pub('clip_add', Object.assign({ kind: 'notes', lane: lane.id, startBar: bar, bars: o.bars || p.bars, name: p.name, notes }, o.loop ? { loop: o.loop } : {}));
    return { tl, lane, tool: lane.target, bar };
  }
  // ---- ▶ hear it: rendered in its own offline universe (nothing on the canvas changes), kept for the session
  const sounds = new Map(); let playing = null;
  async function render(p) {
    if (sounds.has(p.id)) return sounds.get(p.id);
    const reps = p.type === 'chain' || p.type === 'tension' ? 1 : p.bars <= 1 ? 4 : p.bars <= 2 ? 2 : 1, bars = p.bars * reps, barSec = 240 / p.bpm, SR = 24000;
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * (bars * barSec + 1.5)), SR), K = global.Kernel.create({ ctx, quiet: true, syncIR: true });
    const T = global.MasterTransport.create(K, { offline: true, bpm: p.bpm }); T.boot();
    try {
      const r = send(p, Object.assign({ K, bar: 1, headless: true }, p.type === 'chain' ? {} : { bars, loop: !!p.curve ? 0 : p.bars * 16 })); if (!r) return null;
      if (!!p.curve) {   // a curve is heard on a held note of its tool
        K.bus.publish('ui:clip_add:' + r.tl, { kind: 'notes', lane: r.lane.id, startBar: 1, bars, notes: [{ s: 0, l: bars * 16 - 1, n: /sub|bass|wobble|reese|wub/.test(p.tool) ? 36 : 60, v: 0.9 }] });
      }
      await new Promise(res => setTimeout(res, 30));
      T.renderTicks(0, bars * 16, 0.05);
      const buf = await ctx.startRendering();
      let pk = 0; for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); }
      if (pk > 1e-4) { const k = 0.89 / pk; for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; } }
      const out = { buf, silent: pk <= 1e-4, gain: pk > 1e-4 ? 0.89 / pk : 1, barSec }; sounds.set(p.id, out); if (sounds.size > 24) sounds.delete(sounds.keys().next().value); return out;
    } finally { try { F().clearAll(K); } catch (e) {} }
  }
  function stop() { if (!playing) return; try { playing.src.stop(); } catch (e) {} const pl = playing; playing = null; if (pl.onend) pl.onend(); }
  async function play(p, onend) {
    if (playing && playing.id === p.id) { stop(); return false; }
    stop(); const r = await render(p); if (!r || r.silent) return null;
    const ac = global.Kernel.audio.boot(); try { await ac.resume(); } catch (e) {}
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = r.buf; g.gain.value = 0.9; src.connect(g); g.connect(ac.destination); src.start(ac.currentTime + 0.02);
    const me = { id: p.id, src, onend }; playing = me; src.onended = () => { if (playing === me) { playing = null; if (onend) onend(); } };
    return true;
  }
  // ---- the page (off the canvas, beside Songs)
  function drawCard(cv, p) {
    const W = cv.width = 220, H = cv.height = 54, g = cv.getContext('2d'); g.fillStyle = '#0a1018'; g.fillRect(0, 0, W, H);
    const steps = p.bars * 16; g.fillStyle = '#16202c'; for (let b = 1; b < p.bars; b++) g.fillRect(b * 16 / steps * W, 0, 1, H);
    if (p.type === 'chain') {
      const COL = { tension: '#ffd24a', drop: '#ff2266', drums: '#8fa3b8', bass: '#ff2266', wobble: '#b066ff', curve: '#ffd24a', lead: '#00d4ff', chords: '#7cf7ff' }, rows = p.parts.length, rh = (H - 4) / rows;
      p.parts.forEach((x, i) => { const q = x.pattern; g.fillStyle = COL[q.type] || '#00d4ff'; g.globalAlpha = 0.85; g.fillRect(x.at / p.bars * W, 2 + i * rh, Math.max(3, q.bars / p.bars * W - 1), Math.max(2, rh - 2)); });
      g.globalAlpha = 1; return;
    }
    if (!!p.curve) {
      const ys = p.curve.points.map(q => q[1]).filter(v => typeof v === 'number'); if (!ys.length) return;
      const lo = Math.min(...ys), hi = Math.max(...ys), Y = (v) => H - 6 - (hi === lo ? 0.5 : (v - lo) / (hi - lo)) * (H - 12);
      g.strokeStyle = '#ffd24a'; g.lineWidth = 2; g.beginPath(); p.curve.points.forEach((q, i) => { const x = q[0] / p.bars * W; i ? g.lineTo(x, Y(q[1])) : g.moveTo(x, Y(q[1])); }); g.lineTo(W, Y(ys[ys.length - 1])); g.stroke();
      return;
    }
    const ns = p.notes, key = (n) => p.drums ? n.n : n.r, lo = Math.min(...ns.map(key)), hi = Math.max(...ns.map(key)), span = Math.max(6, hi - lo + 1);
    g.fillStyle = p.type === 'drop' ? '#ff2266' : p.drums || p.type === 'fill' ? '#8fa3b8' : '#00d4ff';
    ns.forEach(n => { const x = n.s / steps * W, w = Math.max(1.5, n.l / steps * W - 1), y = H - 5 - (key(n) - lo + 1) / span * (H - 10);
      if (n.b && (n.b.from || n.b.to)) { g.strokeStyle = g.fillStyle; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - (n.b.from || 0) / span * (H - 10)); g.lineTo(x + w, y - (n.b.to || 0) / span * (H - 10)); g.stroke(); }
      else g.fillRect(x, y, w, Math.max(2, (H - 10) / span - 1)); });
  }
  let page = null;
  function open() {
    if (page) { page.close(); return; }
    const UI = global.UIKit, h = UI.h, lib = all();
    let type = 'all', genre = 'all', q = '';
    const ov = h('div', { class: 'overlay sbk plib', role: 'dialog', 'aria-label': 'Patterns' });
    const typeRow = h('div', { class: 'sbk-chips' }), genreRow = h('div', { class: 'sbk-chips plib-genres' }), grid = h('div', { class: 'plib-grid' }), status = h('span', { class: 'sbk-sub' });
    const search = h('input', { class: 'sbk-q', type: 'search', placeholder: 'find a pattern, a genre, a tool…' });
    search.addEventListener('input', () => { q = search.value.trim().toLowerCase(); paint(); }); search.addEventListener('keydown', (e) => e.stopPropagation());
    const close = () => { stop(); if (io) io.disconnect(); ov.remove(); document.removeEventListener('keydown', key, true); page = null; };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const io = 'IntersectionObserver' in global ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting && e.target._p) { drawCard(e.target, e.target._p); io.unobserve(e.target); } })) : null;
    ov.append(h('div', { class: 'sbk-box' }, [
      h('header', { class: 'sbk-head' }, [h('div', {}, [h('b', { text: '🧩 Patterns' }), h('span', { class: 'sbk-sub', text: ' one idea at a time — hear it, send it to your song. ' + lib.length + ' patterns, from every genre' })]), h('button', { class: 'sbk-x', text: '×', 'aria-label': 'close', onclick: () => close() })]),
      h('div', { class: 'sbk-filter' }, [typeRow, genreRow, h('div', { class: 'sbk-row2' }, [search, status])]), grid]));
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    document.addEventListener('keydown', key, true);
    const genres = Array.from(new Map(lib.map(p => [p.genre, p.genreLabel])).entries()).sort((a, b) => a[1].localeCompare(b[1]));
    function paint() {
      const inType = (p) => type === 'all' || p.type === type, inGenre = (p) => genre === 'all' || p.genre === genre;
      typeRow.innerHTML = ''; [['all', 'All']].concat(TYPES).forEach(([id, label]) => { const n = lib.filter(p => (id === 'all' || p.type === id) && inGenre(p)).length; if (!n && id !== 'all') return;
        const b = h('button', { class: 'sbk-chip' + (type === id ? ' on' : ''), text: label + ' ' + n }); b.onclick = () => { type = id; paint(); }; typeRow.appendChild(b); });
      genreRow.innerHTML = ''; [['all', 'Every genre']].concat(genres).forEach(([id, label]) => { const n = lib.filter(p => (id === 'all' || p.genre === id) && inType(p)).length; if (!n) return;
        const b = h('button', { class: 'sbk-chip' + (genre === id ? ' on' : ''), text: label + ' ' + n }); b.onclick = () => { genre = id; paint(); }; genreRow.appendChild(b); });
      const list = lib.filter(p => inType(p) && inGenre(p) && (!q || (p.name + ' ' + p.genreLabel + ' ' + p.type + ' ' + p.tool + ' ' + (p.move || '')).toLowerCase().includes(q)));
      grid.innerHTML = ''; status.textContent = list.length + ' shown';
      list.slice(0, 240).forEach(p => {
        const cv = h('canvas', { class: 'plib-draw', 'aria-hidden': 'true' }); cv._p = p; if (io) io.observe(cv); else drawCard(cv, p);
        const hear = h('button', { class: 'sbk-alt sm', text: '▶', title: 'hear it — rendered off the canvas, nothing changes' });
        hear.onclick = async () => { if (playing && playing.id === p.id) { stop(); return; } hear.textContent = '…'; const ok = await play(p, () => { hear.textContent = '▶'; }); hear.textContent = ok ? '■' : '▶'; if (ok === null) status.textContent = 'no sound came out of “' + p.name + '”'; };
        const sendB = h('button', { class: 'sbk-alt sm', text: '→ Timeline', title: !!p.curve ? 'adds this curve to the track that plays this kind of tool (or a new track with it)' : 'adds it after what is on the track that plays this kind of tool (or a new track with it), in your song’s key' });
        sendB.onclick = () => { const r = send(p); status.textContent = r ? '“' + p.name + '” → the Timeline, bar ' + r.bar : 'could not send it'; };
        grid.appendChild(h('div', { class: 'plib-card', style: { '--acc': p.type === 'drop' ? '#ff2266' : !!p.curve ? '#ffd24a' : '#00d4ff' } }, [
          h('b', { text: p.name }), h('small', { text: (TYPES.find(t => t[0] === p.type) || [0, p.type])[1] + ' · ' + p.genreLabel + ' · ' + p.bars + (p.bars > 1 ? ' bars' : ' bar') + ' · ' + p.bpm + ' BPM' }),
          cv, h('div', { class: 'plib-actions' }, [hear, sendB, h('span', { class: 'plib-tool', text: ((F().def(p.tool) || {}).label || p.tool) + (p.preset ? ' · ' + p.preset : '') })])]));
      });
      if (list.length > 240) grid.appendChild(h('p', { class: 'sbk-note', text: (list.length - 240) + ' more — pick a type or a genre, or search' }));
    }
    paint(); document.body.appendChild(ov); search.focus();
    page = { close };
    return page;
  }
  global.PatternLibrary = { addSource: (fn) => { if (typeof fn === 'function') { sources.push(fn); LIB = null; } }, all, types: TYPES.map(t => ({ id: t[0], label: t[1] })), get: (id) => all().find(p => p.id === id) || null, send, render, play, stop, open, rebuild: () => { LIB = null; return all(); }, fromGenre };
})(typeof window !== 'undefined' ? window : globalThis);
