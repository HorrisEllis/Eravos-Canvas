/* ERAVOS song previews (3.60) — "the songs are supposed to have previews".
 * Two kinds, both from the song itself (a genre + its pinned seed), nothing stored in advance:
 *   map    the song's shape: its sections along the bottom (the drops lit), one row per part with its notes — a small strip on
 *          every card, a full map in the detail panel. Pure data: SongEngine.generate(), drawn on a canvas.
 *   sound  ▶ Preview: the song is written into its OWN offline universe (OfflineAudioContext — nothing on your canvas changes,
 *          nothing plays while it renders), the bars that matter are rendered — two bars of build, the pause and the first
 *          bars of the drop (or the verse, if it has no drop) — then played. Rendered once per song and kept for the session.
 * Songs made from a recipe (not a genre) have no generated shape: no map, no preview. */
(function (global) {
  'use strict';
  const SE = () => global.SongEngine;
  const maps = new Map(), sounds = new Map(), busy = new Map();
  const ROLE_COL = { drums: '#8fa3b8', bass: '#ff2266', chords: '#b066ff', lead: '#00d4ff', fx: '#ffd24a' };
  const KIND_COL = { intro: '#1c2836', verse: '#22303f', build: '#3a3220', pause: '#000000', drop: null, break: '#1d2a33', chorus: '#2b2340', outro: '#1c2836' };

  /** the song's shape: { bars, bpm, secs: [{name, kind, bar, bars}], parts: [{key, name, role, clips: [{bar, bars, notes}]}] } */
  function map(s) {
    if (!s || s.recipe || !s.genre || !SE()) return null; if (maps.has(s.id)) return maps.get(s.id);
    const G = SE().genres().find(g => g.id === s.genre); if (!G) return null;
    let steps; try { steps = SE().generate(s.genre, s.seed || 1); } catch (e) { return null; } if (!steps) return null; steps = steps.steps || steps;
    const marks = steps.filter(x => x.op === 'event' && x.topic === 'marker_edit').map(x => x.payload);
    const clips = steps.filter(x => x.op === 'event' && x.topic === 'clip_add' && x.payload && x.payload.kind === 'notes').map(x => x.payload);
    const end = Math.max(1, ...clips.map(c => c.startBar + c.bars)), bpmStep = steps.find(x => x.op === 'bpm');
    const secs = marks.map((m, i) => { const next = marks[i + 1] ? marks[i + 1].bar : end; return { name: m.name, kind: m.name.replace(/\s*\d+$/, ''), bar: m.bar, bars: next - m.bar }; });
    const parts = Object.keys(G.parts || {}).map(k => ({ key: k, name: G.parts[k].name || k, role: G.parts[k].role || 'lead', clips: clips.filter(c => c.target === '@' + k).map(c => ({ bar: c.startBar, bars: c.bars, notes: c.notes })) })).filter(p => p.clips.length);
    const m = { bars: end - 1, bpm: bpmStep ? bpmStep.bpm : (G.bpm ? G.bpm[0] : 120), secs, parts, accent: G.accent || '#ff2266' };
    maps.set(s.id, m); return m;
  }
  /** draw the map. o.mini: the card strip (sections + note density only) */
  function draw(cv, s, o) {
    o = o || {}; const m = map(s), g = cv.getContext('2d'), dpr = Math.min(2, global.devicePixelRatio || 1), W = cv.clientWidth || cv.width, H = cv.clientHeight || cv.height;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); } g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H); if (!m) return false;
    const x = (bar) => (bar - 1) / Math.max(1, m.bars) * W, SH = o.mini ? 5 : 12;
    m.secs.forEach(sc => { g.fillStyle = sc.kind === 'drop' ? m.accent : (KIND_COL[sc.kind] || '#1c2836'); g.globalAlpha = sc.kind === 'drop' ? 0.85 : 1; g.fillRect(x(sc.bar), H - SH, Math.max(1, x(sc.bar + sc.bars) - x(sc.bar) - 1), SH); g.globalAlpha = 1;
      if (!o.mini && x(sc.bar + sc.bars) - x(sc.bar) > 34) { g.fillStyle = sc.kind === 'drop' ? '#fff' : '#8fa3b8'; g.font = '9px monospace'; g.fillText(sc.name, x(sc.bar) + 3, H - 3); } });
    const top = 2, rowsH = H - SH - 4, rh = rowsH / Math.max(1, m.parts.length);
    m.parts.forEach((p, i) => {
      const y0 = top + i * rh, col = ROLE_COL[p.role] || '#00d4ff';
      if (!o.mini) { g.fillStyle = '#5d6f82'; g.font = '9px sans-serif'; g.fillText(p.name, 2, y0 + Math.min(10, rh - 1)); }
      p.clips.forEach(c => {
        const lo = Math.min(...c.notes.map(n => n.n)), hi = Math.max(...c.notes.map(n => n.n)), span = Math.max(12, hi - lo + 1);
        if (o.mini) { g.fillStyle = col; g.globalAlpha = 0.18 + Math.min(0.6, c.notes.length / (c.bars * 12)); g.fillRect(x(c.bar), y0 + 1, Math.max(1, x(c.bar + c.bars) - x(c.bar) - 1), Math.max(1, rh - 2)); g.globalAlpha = 1; return; }
        g.fillStyle = col; g.globalAlpha = 0.12; g.fillRect(x(c.bar), y0 + 1, x(c.bar + c.bars) - x(c.bar) - 1, rh - 2); g.globalAlpha = 0.9;
        c.notes.forEach(n => { const nx = x(c.bar + n.s / 16), ny = y0 + 2 + (1 - (n.n - lo) / span) * (rh - 5), w = Math.max(1, x(c.bar + (n.s + n.l) / 16) - nx);
          if (n.b && (n.b.from || n.b.to)) { g.strokeStyle = col; g.lineWidth = 1.2; g.beginPath(); g.moveTo(nx, ny - n.b.from / span * (rh - 5)); g.lineTo(nx + w, ny - n.b.to / span * (rh - 5)); g.stroke(); }
          else g.fillRect(nx, ny, w, 1.6); });
        g.globalAlpha = 1;
      });
    });
    if (o.at !== undefined && o.at !== null) { g.fillStyle = '#fff'; g.fillRect(x(o.at), 0, 1.5, H); }
    return true;
  }
  /** which bars a preview plays: the end of the build, the pause and the drop — or the verse */
  function window_(m) {
    const drop = m.secs.find(sc => sc.kind === 'drop'), verse = m.secs.find(sc => sc.kind === 'verse' || sc.kind === 'chorus');
    if (drop) { const i = m.secs.indexOf(drop), before = m.secs[i - 1], lead = before && before.kind === 'pause' ? before.bars : 0, from = Math.max(1, drop.bar - lead - 2);   // two bars of build, the pause, the drop
      return { from, bars: Math.min(9, drop.bar - from + 5) }; }
    const v = verse || m.secs[1] || m.secs[0]; return { from: v ? v.bar : 1, bars: Math.min(8, v ? v.bars : 8) };
  }
  /** render the preview in its own offline universe → AudioBuffer (kept for the session) */
  async function render(s) {
    if (sounds.has(s.id)) return sounds.get(s.id); if (busy.has(s.id)) return busy.get(s.id);
    const job = (async () => {
      const m = map(s); if (!m) return null; const w = window_(m), barSec = 240 / m.bpm, SR = 24000, sec = w.bars * barSec + 2.5;
      const ctx = new OfflineAudioContext(2, Math.ceil(SR * sec), SR), K = global.Kernel.create({ ctx, quiet: true, syncIR: true });
      const T = global.MasterTransport.create(K, { offline: true, bpm: m.bpm }); T.boot();
      try {
        await SE().write(s.genre, s.seed || 1, { K, headless: true });
        T.bpm = m.bpm; const start = (w.from - 1) * 16; T.renderTicks(start, start + w.bars * 16, 0.05);
        const buf = await ctx.startRendering();
        let pk = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; } }
        if (pk > 1e-4) { const k = 0.89 / pk; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; } }   // −1 dB
        const out = { buf, from: w.from, bars: w.bars, barSec, silent: pk <= 1e-4 };
        sounds.set(s.id, out); if (sounds.size > 12) sounds.delete(sounds.keys().next().value); return out;
      } finally { try { global.OrganismFactory.clearAll(K); } catch (e) {} busy.delete(s.id); }
    })();
    busy.set(s.id, job); return job;
  }
  let playing = null;
  function stop() { if (!playing) return; try { playing.src.stop(); } catch (e) {} const p = playing; playing = null; if (p.onend) p.onend(); }
  /** ▶ / ■ — onTick(bar | null) follows the playhead (for the map) */
  async function play(s, onTick) {
    if (playing && playing.id === s.id) { stop(); return false; }
    stop(); const r = await render(s); if (!r || r.silent) return null;
    const ac = global.Kernel && global.Kernel.audio && global.Kernel.audio.boot ? global.Kernel.audio.boot() : null; if (!ac) return null;
    try { await ac.resume(); } catch (e) {}
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = r.buf; g.gain.value = 0.9; src.connect(g); g.connect(ac.destination);
    const t0 = ac.currentTime + 0.02; src.start(t0); const me = { id: s.id, src, onend: () => onTick && onTick(null) }; playing = me;
    const tick = () => { if (playing !== me) return; const bar = r.from + (ac.currentTime - t0 - 0.05) / r.barSec; if (onTick) onTick(Math.max(r.from, bar)); requestAnimationFrame(tick); };
    requestAnimationFrame(tick); src.onended = () => { if (playing === me) { playing = null; if (onTick) onTick(null); } };
    return true;
  }
  global.SongPreview = { map, draw, render, play, stop, window: (s) => { const m = map(s); return m && window_(m); }, get playing() { return playing && playing.id; } };
})(typeof window !== 'undefined' ? window : globalThis);
