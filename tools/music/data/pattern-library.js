/* ERAVOS Pattern Library (3.71 · specs/eravos.pattern-library.spec, addendum 2026-10-24) — window.PatternLibrary.
 * James, 2026-10-24: "what about instead of so much songs, we have a pattern library" (and 10-23: "what about instead of so many songs, we
 * have a pattern library?").
 * A PATTERN is one musical idea you can drop anywhere: a drum groove, a bass line, a wobble phrase, chords, a lead, an arp line, a DROP (the
 * bar the floor falls out), a FILL, or a CURVE (a knob moving over bars). It keeps what makes it good: the timeline's own notes with their
 * bends, oscillation and per-note knobs (pitched notes stored as semitones from the key's root, so it plays in any song's key).
 *   { id, name, type, genre, genreLabel, bpm, bars, tool, preset?, configure?, scale, drums?, notes?, curve?: { key, points, osc? }, source }
 * The library is GENERATED from the Song Engine — every genre's parts, section by section — nothing stored by hand, so a new genre adds its
 * patterns by itself. Floor Falls' four pause moves (falls · stairs · freefall · rises) are named.
 *   PatternLibrary.all() · types · get(id) · forTool(tool, { drums }) (3.76) · send(p, { K?, bar?, lane?, headless? }) → { tl, lane, tool } · render(p) · play(p) · stop() · open() */
(function (global) {
  'use strict';
  const SE = () => global.SongEngine, F = () => global.OrganismFactory;
  const TYPES = [['drums', '🥁 Drums'], ['bass', '🔊 Bass'], ['wobble', '〰 Wobble'], ['chords', '🎹 Chords'], ['lead', '🎵 Lead'], ['arp', '🪜 Arp'], ['drop', '🕳 Drops'], ['fill', '🥁 Fills'], ['curve', '📈 Curves'], ['tension', '🔺 Tension'], ['chain', '⛓ Build → Drop']];   // 3.72: tension · chains
  const MAX_BARS = 4;
  let LIB = null;
  const sources = [], transforms = [];   // 3.74 transforms: fn(the built library) → more patterns (curves for every genre)   // 3.72: data files add hand-made patterns (PatternLibrary.addSource(fn → patterns[]))
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
    transforms.forEach(fn => { try { (fn(out.slice()) || []).forEach(add); } catch (e) { console.error('[ERAVOS] pattern transform failed', e); } });   // 3.74
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
    const T = F().handle(tl).ctx, lane = (o.lane && T.internals.lanes.find(l => l.id === o.lane)) || trackFor(K, tl, p, o.headless); if (!lane) return null;   // 3.76 o.lane: the track you asked from
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
  // 3.73 — James, 2026-10-24, on the page: "needs to be able to collapse tge catogaries. curves, deep drops. make it powerful."
  // ~90 genres in one wall → FAMILIES (collapsed, a caret opens one); types and genres pick several at once; quick picks for deep drops,
  // curves, tension and build → drop; results in sections (by type, family or genre) that fold; sort, BPM range, ★ favourites.
  // What you pick stays picked the next time the page opens; folds and favourites stay across visits.
  const FAMILIES = [
    ['deep', '🕳 Deep drops & tension', /^(hd-|tension-)/],
    ['dubstep', 'Dubstep', /^(dubstep|riddim|melodic|tearout|deathstep|trapstep|drumstep|wub-|brostep|talker|dancehall-dubstep|reese-vs-wub)/],
    ['dnb', 'Drum & Bass', /^(dnb|neuro|jungle|breakbeat|reese-roller|halftime-reese)$/],
    ['house', 'House & Garage', /^(house|deep-house|tech-house|ukg|future-garage|electro|big-room|bass-house|progressive)$/],
    ['techno', 'Techno & Trance', /^(techno|trance|psytrance|hardstyle)$/],
    ['trap', 'Trap & Hip-hop', /^(trap|phonk|future-bass|moombahton)$/],
    ['reggae', 'Reggae & Dancehall', /^(reggae|dancehall|bun-dem)/],
    ['synth', 'Synth & Dark', /^(synthwave|darkwave|witch-house|hanging-tree)$/],
    ['chill', 'Chill & Ambient', /^(lofi|ambient|am-)/],
    ['lost-love', 'Lost Love', /^ll-/], ['for-her', 'For Her', /^her-/], ['odd-couples', 'Odd Couples', /^oc-/], ['synthesis', 'Synthesis', /^syn-/]];
  const familyOf = (genre) => (FAMILIES.find(f => f[2].test(genre)) || ['other', 'More'])[0];
  const familyLabel = (id) => (FAMILIES.find(f => f[0] === id) || [0, 'More'])[1];
  const QUICK = [['deep', '🕳 Deep drops', { family: 'deep' }], ['curve', '📈 Curves', { type: 'curve' }], ['tension', '🔺 Tension', { type: 'tension' }],
    ['chain', '⛓ Build → Drop', { type: 'chain' }], ['fav', '★ Favourites', { fav: true }]];
  const SORTS = [['genre', 'Genre'], ['name', 'Name'], ['bpm', 'BPM ↑'], ['bpm-', 'BPM ↓'], ['bars', 'Longest']];
  const GROUPS = [['type', 'Sections: type'], ['family', 'Sections: family'], ['genre', 'Sections: genre'], ['none', 'No sections']];
  const STORE = 'eravos.patterns.page', SECTION = 24;
  const store = { get() { try { return JSON.parse(global.localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } },
    set(o) { try { global.localStorage.setItem(STORE, JSON.stringify(Object.assign(store.get(), o))); } catch (e) {} } };
  const pick = { types: new Set(), genres: new Set(), fav: false, q: '', lo: '', hi: '', sort: 'genre', group: 'type' };   // kept while the app runs
  function matches(p, o) {   // o: { types:Set, genres:Set, fav, favs:Set, words:[], lo, hi }
    if (o.types.size && !o.types.has(p.type)) return false;
    if (o.genres.size && !o.genres.has(p.genre)) return false;
    if (o.fav && !o.favs.has(p.id)) return false;
    if (o.lo !== '' && p.bpm < +o.lo) return false; if (o.hi !== '' && p.bpm > +o.hi) return false;
    if (o.words.length) { const hay = (p.name + ' ' + p.genreLabel + ' ' + familyLabel(familyOf(p.genre)) + ' ' + p.type + ' ' + p.tool + ' ' + (p.move || '') + ' ' + (p.preset || '') + ' ' + p.bpm).toLowerCase(); if (!o.words.every(w => hay.includes(w))) return false; }
    return true;
  }
  let page = null;
  function open() {
    if (page) { page.close(); return; }
    const UI = global.UIKit, h = UI.h, lib = all(), saved = store.get();
    const favs = new Set(saved.favs || []), folded = new Set(saved.folded || []), openFam = new Set(saved.openFam || []), more = {};
    const typeLabel = (t) => (TYPES.find(x => x[0] === t) || [0, t])[1];
    const ov = h('div', { class: 'overlay sbk plib', role: 'dialog', 'aria-label': 'Patterns' });
    const quickRow = h('div', { class: 'sbk-chips plib-quick' }), typeRow = h('div', { class: 'sbk-chips' }), famRow = h('div', { class: 'sbk-chips plib-fams' }),
      genreRow = h('div', { class: 'sbk-chips plib-genres' }), grid = h('div', { class: 'plib-list' }), status = h('span', { class: 'sbk-sub' });
    const search = h('input', { class: 'sbk-q', type: 'search', placeholder: 'find a pattern, a genre, a tool, a BPM… (words narrow it)', value: pick.q });
    const num = (ph, k) => { const i = h('input', { class: 'sbk-q plib-bpm', type: 'number', min: '40', max: '220', placeholder: ph, title: 'BPM ' + ph, value: pick[k] });
      i.addEventListener('input', () => { pick[k] = i.value.trim(); paint(); }); i.addEventListener('keydown', (e) => e.stopPropagation()); return i; };
    const sel = (opts, k, title) => { const s = h('select', { class: 'sbk-q plib-sel', title }); opts.forEach(([v, l]) => { const o = h('option', { value: v, text: l }); if (pick[k] === v) o.selected = true; s.appendChild(o); });
      s.addEventListener('change', () => { pick[k] = s.value; paint(); }); return s; };
    const lo = num('min', 'lo'), hi = num('max', 'hi'), sortSel = sel(SORTS, 'sort', 'sort by'), groupSel = sel(GROUPS, 'group', 'sections');
    const foldAll = h('button', { class: 'sbk-alt sm', text: 'Fold all', title: 'fold every section (or open them all)' });
    const clear = h('button', { class: 'sbk-alt sm', text: 'Clear', title: 'pick nothing — every pattern' });
    search.addEventListener('input', () => { pick.q = search.value.trim().toLowerCase(); paint(); });
    search.addEventListener('keydown', (e) => e.stopPropagation());
    clear.onclick = () => { pick.types.clear(); pick.genres.clear(); pick.fav = false; pick.q = search.value = ''; pick.lo = lo.value = ''; pick.hi = hi.value = ''; paint(); };
    const close = () => { stop(); if (io) io.disconnect(); ov.remove(); document.removeEventListener('keydown', key, true); page = null; };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); } };
    const io = 'IntersectionObserver' in global ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting && e.target._p) { drawCard(e.target, e.target._p); io.unobserve(e.target); } })) : null;
    ov.append(h('div', { class: 'sbk-box' }, [
      h('header', { class: 'sbk-head' }, [h('div', {}, [h('b', { text: '🧩 Patterns' }), h('span', { class: 'sbk-sub', text: ' one idea at a time — hear it, send it to your song. ' + lib.length + ' patterns, from every genre' })]), h('button', { class: 'sbk-x', text: '×', 'aria-label': 'close', onclick: () => close() })]),
      h('div', { class: 'sbk-filter' }, [quickRow, typeRow, famRow, genreRow, h('div', { class: 'sbk-row2' }, [search, h('span', { class: 'sbk-sub', text: 'BPM' }), lo, hi, sortSel, groupSel, foldAll, clear, status])]), grid]));
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    document.addEventListener('keydown', key, true);
    const genres = Array.from(new Map(lib.map(p => [p.genre, p.genreLabel])).entries()).sort((a, b) => a[1].localeCompare(b[1]));
    const fams = FAMILIES.map(f => f[0]).concat(['other']).map(id => ({ id, label: familyLabel(id), genres: genres.filter(g => familyOf(g[0]) === id) })).filter(f => f.genres.length);
    const toggle = (set, v, e) => { if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) { set.has(v) ? set.delete(v) : set.add(v); } else if (set.has(v) && set.size === 1) set.clear(); else { set.clear(); set.add(v); } };
    const tog = (set, v) => { set.has(v) ? set.delete(v) : set.add(v); };
    const chip = (text, on, fn, cls, title) => { const b = h('button', { class: 'sbk-chip' + (cls ? ' ' + cls : '') + (on ? ' on' : ''), text, title: title || '' }); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.onclick = (e) => { fn(e); paint(); }; return b; };
    const opts = (over) => Object.assign({ types: pick.types, genres: pick.genres, fav: pick.fav, favs, words: pick.q.split(/\s+/).filter(Boolean), lo: pick.lo, hi: pick.hi }, over);
    const count = (over) => lib.reduce((n, p) => n + (matches(p, opts(over)) ? 1 : 0), 0);
    const famOn = (f) => f.genres.every(g => pick.genres.has(g[0])), famSome = (f) => f.genres.some(g => pick.genres.has(g[0]));
    function card(p) {
      const cv = h('canvas', { class: 'plib-draw', 'aria-hidden': 'true' }); cv._p = p; if (io) io.observe(cv); else drawCard(cv, p);
      const hear = h('button', { class: 'sbk-alt sm', text: '▶', title: 'hear it — rendered off the canvas, nothing changes' });
      hear.onclick = async () => { if (playing && playing.id === p.id) { stop(); return; } hear.textContent = '…'; const ok = await play(p, () => { hear.textContent = '▶'; }); hear.textContent = ok ? '■' : '▶'; if (ok === null) status.textContent = 'no sound came out of “' + p.name + '”'; };
      const sendB = h('button', { class: 'sbk-alt sm', text: '→ Timeline', title: !!p.curve ? 'adds this curve to the track that plays this kind of tool (or a new track with it)' : 'adds it after what is on the track that plays this kind of tool (or a new track with it), in your song’s key' });
      sendB.onclick = () => { const r = send(p); status.textContent = r ? '“' + p.name + '” → the Timeline, bar ' + r.bar : 'could not send it'; };
      const star = h('button', { class: 'plib-star' + (favs.has(p.id) ? ' on' : ''), text: favs.has(p.id) ? '★' : '☆', title: 'keep it in ★ Favourites', 'aria-label': 'favourite' });
      star.onclick = () => { tog(favs, p.id); store.set({ favs: [...favs] }); star.classList.toggle('on', favs.has(p.id)); star.textContent = favs.has(p.id) ? '★' : '☆'; if (pick.fav) paint(); };
      return h('div', { class: 'plib-card', style: { '--acc': p.type === 'drop' ? '#ff2266' : !!p.curve ? '#ffd24a' : '#00d4ff' } }, [
        h('div', { class: 'plib-top' }, [h('b', { text: p.name }), star]), h('small', { text: typeLabel(p.type) + ' · ' + p.genreLabel + ' · ' + p.bars + (p.bars > 1 ? ' bars' : ' bar') + ' · ' + p.bpm + ' BPM' }),
        cv, h('div', { class: 'plib-actions' }, [hear, sendB, h('span', { class: 'plib-tool', text: ((F().def(p.tool) || {}).label || p.tool) + (p.preset ? ' · ' + p.preset : '') })])]);
    }
    function paint() {
      // quick picks
      quickRow.innerHTML = ''; quickRow.appendChild(h('span', { class: 'plib-lbl', text: 'Quick' }));
      QUICK.forEach(([id, label, q]) => {
        const f = q.family && fams.find(x => x.id === q.family);
        const on = q.fav ? pick.fav : q.type ? pick.types.size === 1 && pick.types.has(q.type) : !!f && famOn(f) && pick.genres.size === f.genres.length;
        const n = q.fav ? favs.size : q.type ? lib.filter(p => p.type === q.type).length : f ? lib.filter(p => familyOf(p.genre) === f.id).length : 0;
        if (!n && !q.fav) return;
        quickRow.appendChild(chip(label + ' ' + n, on, () => {
          if (q.fav) { pick.fav = !pick.fav; return; }
          if (q.type) { if (on) pick.types.clear(); else { pick.types.clear(); pick.types.add(q.type); } return; }
          pick.genres.clear(); if (!on) { f.genres.forEach(g => pick.genres.add(g[0])); openFam.add(f.id); store.set({ openFam: [...openFam] }); }
        }, 'plib-q', q.fav ? 'only the ones you starred' : q.type ? 'only ' + label.slice(2).toLowerCase() : 'Floor Falls, Heavy Drops and the tension studies'));
      });
      // types (click = only this one · shift/ctrl-click = add it)
      typeRow.innerHTML = ''; typeRow.appendChild(h('span', { class: 'plib-lbl', text: 'Type' }));
      typeRow.appendChild(chip('All ' + count({ types: new Set() }), !pick.types.size, () => pick.types.clear()));
      TYPES.forEach(([id, label]) => { const n = count({ types: new Set([id]) }); if (!n && !pick.types.has(id)) return;
        typeRow.appendChild(chip(label + ' ' + n, pick.types.has(id), (e) => toggle(pick.types, id, e), '', 'click: only these · shift-click: add these too')); });
      // families: the name picks the whole family, the caret opens its genres
      famRow.innerHTML = ''; famRow.appendChild(h('span', { class: 'plib-lbl', text: 'Genre' }));
      famRow.appendChild(chip('Every genre', !pick.genres.size, () => pick.genres.clear()));
      fams.forEach(f => {
        const gs = new Set(f.genres.map(g => g[0])), n = count({ genres: gs }); if (!n && !famSome(f)) return;
        const isOpen = openFam.has(f.id), sel = f.genres.filter(g => pick.genres.has(g[0])).length;
        const name = h('button', { class: 'plib-fam-name', text: f.label + ' ' + n + (sel && !famOn(f) ? ' · ' + sel + '/' + f.genres.length : ''), title: 'click: only this family · shift-click: add it' });
        name.onclick = (e) => { const add = e.shiftKey || e.ctrlKey || e.metaKey, full = famOn(f); if (!add) { const only = full && pick.genres.size === gs.size; pick.genres.clear(); if (!only) gs.forEach(g => pick.genres.add(g)); } else gs.forEach(g => full ? pick.genres.delete(g) : pick.genres.add(g)); paint(); };
        const caret = h('button', { class: 'plib-caret', text: isOpen ? '▾' : '▸', title: (isOpen ? 'fold ' : 'open ') + f.label + ' (' + f.genres.length + ' genres)', 'aria-expanded': isOpen ? 'true' : 'false' });
        caret.onclick = () => { tog(openFam, f.id); store.set({ openFam: [...openFam] }); paint(); };
        const g = h('span', { class: 'sbk-chip plib-fam' + (famOn(f) ? ' on' : famSome(f) ? ' some' : '') + (isOpen ? ' open' : ''), 'data-fam': f.id }, [caret, name]);
        famRow.appendChild(g);
      });
      genreRow.innerHTML = ''; genreRow.hidden = true;
      fams.filter(f => openFam.has(f.id)).forEach(f => {
        const box = h('div', { class: 'plib-fgroup', 'data-fam': f.id }, [h('span', { class: 'plib-lbl', text: f.label })]);
        f.genres.forEach(([id, label]) => { const n = count({ genres: new Set([id]) }); if (!n && !pick.genres.has(id)) return;
          box.appendChild(chip((label.indexOf(f.label + ' · ') === 0 ? label.slice(f.label.length + 3) : label) + ' ' + n, pick.genres.has(id), (e) => toggle(pick.genres, id, e), '', 'click: only this · shift-click: add it')); });
        genreRow.appendChild(box); genreRow.hidden = false;
      });
      // the list, in sections that fold
      const o = opts(), list = lib.filter(p => matches(p, o)), byName = (a, b) => a.name.localeCompare(b.name);
      const cmp = { genre: (a, b) => a.genreLabel.localeCompare(b.genreLabel) || byName(a, b), name: byName, bpm: (a, b) => a.bpm - b.bpm || byName(a, b), 'bpm-': (a, b) => b.bpm - a.bpm || byName(a, b), bars: (a, b) => b.bars - a.bars || byName(a, b) }[pick.sort] || byName;
      list.sort(cmp);
      const keyOf = { type: (p) => p.type, family: (p) => familyOf(p.genre), genre: (p) => p.genre, none: () => 'all' }[pick.group] || ((p) => p.type);
      const labelOf = { type: typeLabel, family: familyLabel, genre: (g) => (genres.find(x => x[0] === g) || [0, g])[1], none: () => 'Every pattern' }[pick.group] || typeLabel;
      const order = pick.group === 'type' ? TYPES.map(t => t[0]) : pick.group === 'family' ? fams.map(f => f.id) : null;
      const sections = new Map(); list.forEach(p => { const k = keyOf(p); if (!sections.has(k)) sections.set(k, []); sections.get(k).push(p); });
      const keys = [...sections.keys()]; if (order) keys.sort((a, b) => order.indexOf(a) - order.indexOf(b)); else if (pick.group === 'genre') keys.sort((a, b) => labelOf(a).localeCompare(labelOf(b)));
      grid.innerHTML = ''; status.textContent = list.length + ' shown · ' + keys.length + (keys.length === 1 ? ' section' : ' sections');
      const allFolded = keys.length && keys.every(k => folded.has(pick.group + ':' + k)); foldAll.textContent = allFolded ? 'Open all' : 'Fold all';
      foldAll.onclick = () => { keys.forEach(k => allFolded ? folded.delete(pick.group + ':' + k) : folded.add(pick.group + ':' + k)); store.set({ folded: [...folded] }); paint(); };
      keys.forEach(k => {
        const items = sections.get(k), fk = pick.group + ':' + k, isF = folded.has(fk), shown = more[fk] || SECTION;
        const head = h('button', { class: 'plib-sec-head', 'aria-expanded': isF ? 'false' : 'true' }, [h('span', { class: 'plib-caret', text: isF ? '▸' : '▾' }), h('b', { text: labelOf(k) }), h('span', { class: 'sbk-sub', text: ' ' + items.length })]);
        head.onclick = () => { tog(folded, fk); store.set({ folded: [...folded] }); paint(); };
        const sec = h('section', { class: 'plib-sec' + (isF ? ' folded' : ''), 'data-sec': k }, [head]);
        if (!isF) {
          const g = h('div', { class: 'plib-grid' }); items.slice(0, shown).forEach(p => g.appendChild(card(p))); sec.appendChild(g);
          if (items.length > shown) { const m = h('button', { class: 'sbk-alt sm plib-more', text: 'Show ' + Math.min(SECTION * 2, items.length - shown) + ' more of ' + (items.length - shown) }); m.onclick = () => { more[fk] = shown + SECTION * 2; paint(); }; sec.appendChild(m); }
        }
        grid.appendChild(sec);
      });
      if (!list.length) grid.appendChild(h('p', { class: 'sbk-note', text: 'nothing matches — Clear, or pick less' }));
    }
    paint(); document.body.appendChild(ov); search.focus();
    page = { close, paint };
    return page;
  }
  // ---- 3.76 patterns per tool (the Timeline's ♪ on every track): "I need patterns per tool for the timeline … easier to make and
  //      understand music … I get overwhelmed by too much information". What fits THIS tool, a few at a time, each kind said in one line.
  const ABOUT = { drums: 'The beat. Kick and snare are the skeleton; hats keep time between them.', bass: 'Low notes that lock to the kick. Usually the root of the chord.',
    wobble: 'Bass whose tone opens and closes in rhythm: the wub.', chords: 'Several notes at once. They set the mood (minor sounds darker).',
    lead: 'The tune you would hum. One note at a time, on top.', arp: 'A chord played one note at a time, round and round.',
    drop: 'The bar where the floor falls out, right before the big part.', fill: 'A short drum change that says: something new is coming.',
    curve: 'A knob moving over time: how a sound rises, opens or dives.', tension: 'A build: things speed up and rise so the drop hits harder.',
    chain: 'Build, pause, drop: the whole move in one.' };
  // the kinds a tool can play when no pattern was written on it yet (by what it is: a drum kit, something low, chords, or a melody)
  function kindsFor(tool, drums) {
    const d = (F() && F().def(tool)) || {}, w = (tool + ' ' + (d.label || '') + ' ' + (d.category || '')).toLowerCase();
    if (drums || /drum|kit|pads|perc|beat/.test(w)) return ['drums', 'fill', 'tension'];
    if (/wobble|wub/.test(w)) return ['wobble', 'drop', 'bass'];
    if (/bass|sub|reese|acid/.test(w)) return ['bass', 'drop', 'wobble'];
    if (/pad|chord|organ|poly|keys|piano|choir|coven|string/.test(w)) return ['chords', 'arp'];
    return ['lead', 'arp', 'chords'];
  }
  // forTool(organism_id, { drums }) → { exact, kinds:[{ id, label, about, n }], list(kind?) → patterns }: this tool's own first; else the
  // kinds it can play, from other tools (they play on yours: a pattern is notes)
  function forTool(tool, o) {
    o = o || {}; const lib = all().filter(p => p.type !== 'chain'), own = lib.filter(p => p.tool === tool), exact = own.some(p => p.type !== 'curve');
    const pool = exact ? own : lib.filter(p => kindsFor(tool, o.drums).includes(p.type) && p.type !== 'curve').concat(own);
    const order = exact ? TYPES.map(t => t[0]) : kindsFor(tool, o.drums);
    const kinds = order.map(id => ({ id, label: (TYPES.find(t => t[0] === id) || [id, id])[1], about: ABOUT[id] || '', n: pool.filter(p => p.type === id).length })).filter(k => k.n);
    return { exact, kinds, about: ABOUT, list: (kind) => pool.filter(p => !kind || p.type === kind) };
  }
  global.PatternLibrary = { forTool, kindsFor, about: ABOUT, draw: drawCard, addTransform: (fn) => { if (typeof fn === 'function') { transforms.push(fn); LIB = null; } }, addSource: (fn) => { if (typeof fn === 'function') { sources.push(fn); LIB = null; } }, all, types: TYPES.map(t => ({ id: t[0], label: t[1] })), get: (id) => all().find(p => p.id === id) || null, send, render, play, stop, open, rebuild: () => { LIB = null; return all(); }, fromGenre, families: FAMILIES.map(f => ({ id: f[0], label: f[1] })), familyOf, matches };
})(typeof window !== 'undefined' ? window : globalThis);
