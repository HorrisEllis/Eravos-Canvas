/* ERAVOS Note Library (W3f · specs/eravos.workshop.spec ADDENDUM 2026-11-09 (4)) — window.NoteLibrary.
 * His words, 2026-11-09: "Also a note library, inside of the patterns library. Have 2 tabs. One for notes, the other for patterns. Agnostic note."
 * A saved NOTE is how one note moves and plays — its shape (sh: pitch and knob trees), its bend, its curves, how it plays (x: when, chord, ratchet
 * shape, humanize, speed), chance, ratchet, nudge, velocity — kept WITHOUT its place or its pitch, so it fits any note of any tool: what belongs
 * to the instrument it was made on (knob curves, knob values, knob shapes) comes along only where the new instrument has that knob; the rest is
 * said, never silently dropped.
 *   NoteLibrary.all() · get(id) · save(note, name, { tool }) → saved · rename(id, name) · remove(id) · applyTo(note, saved, knobKeys) → { note,
 *   dropped } · draw(canvas, saved) · describe(saved) · onChange(fn) · page(h, { onApply, canApply }) → the Notes tab's element
 * Kept in your library (localStorage, the app's own data folder in ERAVOS.exe). */
(function (global) {
  'use strict';
  const KEY = 'eravos.noteLibrary.v1', listeners = [];
  const read = () => { try { const a = JSON.parse(global.localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const write = (a) => { try { global.localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} listeners.forEach(fn => { try { fn(); } catch (er) {} }); };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const FIELDS = ['l', 'v', 'b', 'c', 'p', 'sh', 'x', 'pr', 'rt', 'mt'];
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const uid = () => 'N' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function all() { return read(); }
  function get(id) { return read().find(s => s.id === id) || null; }
  function save(note, name, o) {
    const n = {}; FIELDS.forEach(k => { if (note[k] !== undefined) n[k] = clone(note[k]); });
    const s = { id: uid(), name: String(name || '').trim().slice(0, 60) || 'Note', at: new Date().toISOString(), from: { pitch: note.n, tool: (o && o.tool) || '' }, note: n };
    const a = read(); a.unshift(s); write(a.slice(0, 500)); return s;
  }
  function rename(id, name) { const a = read(), s = a.find(x => x.id === id); if (!s) return false; s.name = String(name || '').trim().slice(0, 60) || s.name; write(a); return true; }
  function remove(id) { const a = read(), b = a.filter(x => x.id !== id); if (b.length === a.length) return false; write(b); return true; }
  // a saved note onto a note: its place (s) and pitch (n) stay; knob parts only where the instrument has the knob
  function applyTo(target, saved, knobKeys) {
    const src = (saved && saved.note) || {}, has = knobKeys ? new Set(knobKeys) : null, out = { s: target.s, n: target.n, l: target.l, v: target.v }, dropped = [];
    ['b', 'pr', 'rt', 'mt', 'x'].forEach(k => { if (src[k] !== undefined) out[k] = clone(src[k]); });
    if (src.v !== undefined) out.v = src.v;
    const keep = (k) => !has || has.has(k);
    if (src.c) { const c = {}; Object.keys(src.c).forEach(k => { if (keep(k)) c[k] = clone(src.c[k]); else dropped.push(k); }); if (Object.keys(c).length) out.c = c; }
    if (src.p) { const p = {}; Object.keys(src.p).forEach(k => { if (keep(k)) p[k] = src.p[k]; else if (!dropped.includes(k)) dropped.push(k); }); if (Object.keys(p).length) out.p = p; }
    if (src.sh && src.sh.t) { const t = {}; Object.keys(src.sh.t).forEach(k => { if (k === 'pitch' || keep(k.slice(2))) t[k] = clone(src.sh.t[k]); else if (!dropped.includes(k.slice(2))) dropped.push(k.slice(2)); }); if (Object.keys(t).length) out.sh = { t }; }
    return { note: out, dropped };
  }
  // the pitch over the note: its shaped pitch, else its drawn path, else its bend
  function pitchAt(n, t) {
    const M = global.MusicParts && global.MusicParts.modTree;
    if (n.sh && n.sh.t && n.sh.t.pitch && M) return M.at(n.sh.t.pitch, t);
    const b = n.b; if (!b) return 0;
    if (b.shape === 'path' && b.path && global.MusicParts && global.MusicParts.pathAt) return global.MusicParts.pathAt(b.path, t);
    const u = t <= (b.at || 0) ? 0 : (t - (b.at || 0)) / Math.max(1e-6, 1 - (b.at || 0)), e = b.shape === 'linear' ? u : b.shape === 'early' ? 1 - Math.pow(1 - u, 3) : b.shape === 'late' ? u * u * u : u * u * (3 - 2 * u);
    return (b.from || 0) + ((b.to || 0) - (b.from || 0)) * e;
  }
  function describe(s) {
    const n = (s && s.note) || {}, x = n.x || {}, w = [];
    if (n.sh && n.sh.t) { const T = Object.keys(n.sh.t); w.push('shapes ' + T.map(t => t === 'pitch' ? 'pitch' : t.slice(2)).join(', ')); }
    else if (n.b) w.push('bend');
    if (x.iv) w.push((x.iv.length + 1) + ' voices'); if (x.cond) w.push('pass ' + (x.cond.at + 1) + '/' + x.cond.every); if (x.tempo) w.push('× ' + x.tempo + ' speed');
    if ((n.rt || 1) > 1) w.push('×' + n.rt + ' ratchet'); if (x.ht || x.hv) w.push('humanized'); if (n.p) w.push(Object.keys(n.p).length + ' knob' + (Object.keys(n.p).length > 1 ? 's' : ''));
    return w.join(' · ') || 'plain';
  }
  function draw(cv, s) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, n = (s && s.note) || {}, iv = [0].concat((n.x && n.x.iv) || []);
    g.fillStyle = '#05080d'; g.fillRect(0, 0, W, H);
    const pts = []; for (let i = 0; i <= 80; i++) pts.push(pitchAt(n, i / 80));
    const lo = Math.min(...pts) + Math.min(...iv) - 1, hi = Math.max(...pts) + Math.max(...iv) + 1, Y = (v) => H - 6 - (v - lo) / Math.max(1e-6, hi - lo) * (H - 12);
    iv.forEach((d, k) => { g.strokeStyle = k ? 'rgba(255,79,216,0.7)' : '#00d4ff'; g.lineWidth = k ? 1 : 2; g.beginPath(); pts.forEach((v, i) => { const x = 4 + i / 80 * (W - 8), y = Y(v + d); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); });
    const r = n.rt || 1; if (r > 1) { g.fillStyle = '#ffb000'; for (let q = 0; q < r; q++) g.fillRect(4 + q / r * (W - 8), H - 4, 2, 3); }
  }
  // the Notes tab (inside the Patterns library)
  function page(h, o) {
    o = o || {};
    const box = h('div', { class: 'nlib' }), list = h('div', { class: 'plib-list nlib-list' }), head = h('p', { class: 'plib-about' });
    function paint() {
      const a = read(), can = o.canApply ? o.canApply() : false;
      head.textContent = a.length ? a.length + ' saved note' + (a.length > 1 ? 's' : '') + ' — each fits any note of any tool (knob parts come along where the tool has the knob). ' + (can ? 'Apply puts it on the note open in the Workshop.' : 'Open a note in the Workshop to apply one.')
        : 'No saved notes yet. In the Workshop, shape a note and press Ctrl+S (or right-click › Save to the note library).';
      list.replaceChildren(...a.map(s => {
        const cv = h('canvas', { class: 'plib-draw nlib-draw', width: 240, height: 64 }); draw(cv, s);
        const name = h('b', { class: 'nlib-name', text: s.name, title: 'click to rename' });
        name.onclick = () => { const v = global.prompt('Name', s.name); if (v) { rename(s.id, v); paint(); } };
        const apply = h('button', { class: 'sbk-alt sm', text: 'Apply', title: 'put it on the note open in the Workshop' }); apply.disabled = !can; apply.onclick = () => { if (o.onApply) o.onApply(s); paint(); };
        const del = h('button', { class: 'sbk-alt sm', text: 'Delete', title: 'delete it from the library' }); del.onclick = () => { if (global.confirm('Delete “' + s.name + '”?')) { remove(s.id); paint(); } };
        return h('div', { class: 'plib-card nlib-card' }, [cv, h('div', { class: 'nlib-meta' }, [name, h('span', { class: 'sbk-sub', text: describe(s) + (s.from && s.from.tool ? ' · made on ' + s.from.tool : '') })]), h('div', { class: 'nlib-act' }, [apply, del])]);
      }));
    }
    box.append(head, list); paint(); const off = () => { const i = listeners.indexOf(paint); if (i >= 0) listeners.splice(i, 1); }; listeners.push(paint); box._off = off;
    return box;
  }
  const onChange = (fn) => { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; };
  global.NoteLibrary = { all, get, save, rename, remove, applyTo, draw, describe, page, onChange, pitchAt, NAMES };
})(window);
