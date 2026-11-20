/* ERAVOS core — field/mutate.js → window.FieldMutate (2026-11-20). Domain-free: it names no domain, tool or topic (tests/boundary.test.js).
 * His words (2026-11-20): "okay now i want to be able to mutate, and swap components for the wobble bass." · "need to be able to swap them out.
 * then i want each tool to be able to be able to do that. then the workshop or field. like i want full mutation, like keep going"
 * ONE mutation for everything that has settings — a tool on the canvas, a tool exploded on the Field board, a document in the Workshop — never
 * copied (axiom 2). It works on a TARGET:
 *   { id,                 what it learns under (a tool's id, a Workshop kind's id) — kept on this device
 *     list() → [setting]  { key, type: number | enum | boolean, min, max, step, options, label, unit, default,
 *                           socket?  (an enum whose options are parts: a swap), part? (belongs to that part: only while it is in its socket),
 *                           of? (the key of its socket, when two sockets take the same part),
 *                           mutate?: false (never touched) }
 *     get(key), set(patch)   (the whole patch is ONE undo step) · hear?()  (play it, so the change is heard at once) }
 * A mutation: some sockets swapped (each new part's own settings rolled fresh), a few other settings moved — near where they are, not anywhere
 * (a mutation, not a randomise). Learning: a kept mutation's choices (a part, an option) and the settings it moved weigh more next time; a thrown
 * one's less. Never the same state twice (its signature remembered). A domain can keep settings out (FieldMutate.guards: (setting, target) → false).
 *   FieldMutate.mutate(target, { rnd, moves, extra?(rnd) → { patch, words } (a part from another tool) }) → { patch, prev, sig, words } | null · .judge(target, m, keep) · .learned(id) · .forget(id)
 *   FieldMutate.dock(target, { onMutate, kit?, primary? }) → an element (kit: a tool window's UI kit — its buttons then): ⚄ MUTATE · ✓ KEEP · ✗ THROW, what changed, what it has learned
 *   FieldMutate.toolTarget(instanceId) → the target of a tool on the canvas (its settings; set = as if turned by hand) */
(function (global) {
  'use strict';
  const guards = [];
  const KEY = (id) => 'eravos.mutate.' + id;
  function learned(id) { try { const o = JSON.parse(localStorage.getItem(KEY(id)) || '{}'); return { w: o.w || {}, seen: o.seen || [], kept: o.kept || 0, thrown: o.thrown || 0 }; } catch (e) { return { w: {}, seen: [], kept: 0, thrown: 0 }; } }
  function keep(id, L) { try { L.seen = L.seen.slice(-500); localStorage.setItem(KEY(id), JSON.stringify(L)); } catch (e) {} }
  function forget(id) { try { localStorage.removeItem(KEY(id)); } catch (e) {} }
  const W = (L, k) => Math.exp(Math.max(-3, Math.min(3, (L.w[k] || 0) * 0.5)));
  function pick(list, weight, rnd) { const ws = list.map(weight), tot = ws.reduce((a, b) => a + b, 0); let r = rnd() * tot; for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; } return list[list.length - 1]; }
  const snap = (c, x) => { const lo = +c.min, hi = +c.max, st = +c.step || 0; x = Math.max(lo, Math.min(hi, x)); return st ? Math.max(lo, Math.min(hi, Math.round(Math.round((x - lo) / st) * st * 1e6) / 1e6 + lo)) : x; };
  function roll(c, rnd, L) {   // anywhere in its range (a part just swapped in: its settings fresh)
    if (c.type === 'enum') return pick(c.options, (o) => W(L, c.key + '=' + o), rnd);
    if (c.type === 'boolean') return rnd() < 0.5;
    const lo = +c.min, hi = +c.max; return snap(c, lo > 0 && hi / lo > 20 ? lo * Math.pow(hi / lo, rnd()) : lo + (hi - lo) * rnd());
  }
  function nudge(c, cur, rnd, L) {   // near where it is: a quarter of its range either way (by ratio when the range is wide)
    if (c.type === 'enum') { const others = c.options.filter(o => o !== cur); return others.length ? pick(others, (o) => W(L, c.key + '=' + o), rnd) : cur; }
    if (c.type === 'boolean') return !cur;
    const lo = +c.min, hi = +c.max, x = +cur; if (!isFinite(x)) return roll(c, rnd, L);
    if (lo > 0 && hi / lo > 20) return snap(c, x * Math.pow(hi / lo, (rnd() - 0.5) * 0.35));
    let y = snap(c, x + (hi - lo) * (rnd() - 0.5) * 0.5); if (y === x) y = snap(c, x + (hi - lo) * 0.15); if (y === x) y = snap(c, x - (hi - lo) * 0.15); return y;   // at an end of its range: away from it
  }
  const usable = (t, c) => c && !c.hidden && !c.settingsOnly && c.mutate !== false && ['number', 'enum', 'boolean'].includes(c.type)
    && (c.type !== 'number' || (isFinite(+c.min) && isFinite(+c.max) && +c.max > +c.min)) && (c.type !== 'enum' || (c.options || []).length > 1) && guards.every(g => { try { return g(c, t) !== false; } catch (e) { return true; } });
  const show = (c, v) => (typeof v === 'number' ? +(+v).toPrecision(3) : String(v)) + (c.unit && typeof v === 'number' ? ' ' + c.unit : '');
  function mutate(t, o) {
    o = o || {}; const rnd = o.rnd || Math.random, L = learned(t.id), all = (t.list() || []).filter(c => usable(t, c));
    if (!all.length) return null;
    const sockets = all.filter(c => c.socket && c.type === 'enum');
    const owner = (c) => sockets.find(s => c.of ? s.key === c.of : [].concat(c.part).some(p => s.options.includes(p)));   // of: the socket it belongs to, when two sockets take the same part
    for (let tries = 0; tries < 60; tries++) {
      const patch = {}, words = [], val = (k) => (k in patch ? patch[k] : t.get(k));
      // sockets: about half swap (at least one, most times), each new part's own settings fresh
      const swap = sockets.filter(() => rnd() < 0.5); if (sockets.length && !swap.length && rnd() < 0.7) swap.push(sockets[Math.floor(rnd() * sockets.length)]);
      swap.forEach(s => { const cur = t.get(s.key), others = s.options.filter(x => x !== cur); if (!others.length) return; const p = pick(others, (x) => W(L, s.key + '=' + x), rnd); patch[s.key] = p;
        const own = all.filter(c => c.part && [].concat(c.part).includes(p) && (!c.of || c.of === s.key)); own.forEach(c => { patch[c.key] = roll(c, rnd, L); });
        words.push((s.socket || s.label || s.key) + ' → ' + p + (own.length ? ' (' + own.map(c => (c.label || c.key) + ' ' + show(c, patch[c.key])).join(', ') + ')' : '')); });
      // another tool's part (o.extra: the Field board, when another tool is exploded beside this one) — counted with the swaps
      if (o.extra && rnd() < 0.6) { const x = o.extra(rnd); if (x && x.patch) { Object.keys(x.patch).forEach(k => { patch[k] = x.patch[k]; }); words.push(x.words); } }
      // the rest: a few settings moved, those that were kept before more often (a part's settings only while it is in its socket)
      const free = all.filter(c => !c.socket && !(c.key in patch) && (!c.part || (owner(c) && [].concat(c.part).includes(val(owner(c).key)))));
      const n = Math.min(free.length, o.moves || (swap.length ? 1 + Math.floor(rnd() * 3) : 2 + Math.floor(rnd() * 4))), moved = [];
      for (let i = 0; i < n; i++) { const pool = free.filter(c => !moved.includes(c)); if (!pool.length) break; const c = pick(pool, (x) => W(L, '@' + x.key), rnd); moved.push(c); patch[c.key] = nudge(c, t.get(c.key), rnd, L); }
      if (moved.length) words.push(moved.map(c => (c.label || c.key) + ' ' + show(c, t.get(c.key)) + ' → ' + show(c, patch[c.key])).join(' · '));
      const keys = Object.keys(patch).filter(k => patch[k] !== t.get(k)); if (!keys.length) continue;
      const sig = all.map(c => c.key + '=' + (typeof val(c.key) === 'number' ? +(+val(c.key)).toPrecision(2) : val(c.key))).join('&');
      if (L.seen.includes(sig)) continue;
      const prev = {}; Object.keys(patch).forEach(k => { prev[k] = t.get(k); });
      return { patch, prev, sig, words };
    }
    return null;
  }
  function judge(t, m, kept) {
    const L = learned(t.id), d = kept ? 1 : -1;
    Object.keys(m.patch).forEach(k => { const v = m.patch[k]; L.w['@' + k] = (L.w['@' + k] || 0) + d * 0.5; if (typeof v === 'string') L.w[k + '=' + v] = (L.w[k + '=' + v] || 0) + d; });
    if (kept) L.kept++; else L.thrown++; keep(t.id, L); return L;
  }
  function apply(t, m) { const L = learned(t.id); L.seen.push(m.sig); keep(t.id, L); t.set(m.patch); if (t.hear) try { t.hear(); } catch (e) {} }

  // the dock: one look wherever it sits (the Field board, the Workshop board, a window's menu)
  function dock(t, opt) {
    opt = opt || {}; const doc = global.document, h = (tag, cls, txt) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    // in a tool's window (opt.kit: its UI kit) the buttons are the kit's — the tool's own colour, its sizes (DESIGN-GUIDE: one kit everywhere)
    const K = opt.kit, btn = (cls, label) => { if (K && K.Button) { const b = K.Button({ label, kind: cls === 'fm-go' && opt.primary ? 'primary' : '' }).el; b.classList.add(cls); return b; } const b = h('button', cls, label); b.type = 'button'; return b; };
    const box = h('div', 'fm-dock' + (K ? ' fm-kit' : '')), row = h('div', 'fm-row'), go = btn('fm-go', '⚄ MUTATE'), kp = btn('fm-keep', '✓ KEEP'), th = btn('fm-throw', '✗ THROW'), line = h('div', 'fm-line'), tally = h('div', 'fm-tally');
    [go, kp, th].forEach(b => b.addEventListener('pointerdown', (e) => e.stopPropagation())); row.append(go, kp, th); box.append(row, line, tally);
    let cur = null;
    const count = () => { const L = learned(t.id); tally.textContent = L.kept + ' kept · ' + L.thrown + ' thrown · ' + L.seen.length + ' tried — it learns from each, never the same twice'; };
    const pending = (on) => { kp.disabled = th.disabled = !on; box.classList.toggle('pending', on); };
    line.textContent = opt.hint || 'a new combination, played at once — keep it or throw it'; pending(false); count();
    go.addEventListener('click', () => {
      if (cur) judge(t, cur, true);   // mutating again keeps the one before (it stays)
      const m = mutate(t, { extra: opt.extra }); if (!m) { line.textContent = 'nothing left to try here'; return; }
      cur = m; apply(t, m); line.textContent = m.words.join(' · '); pending(true); count(); if (opt.onMutate) opt.onMutate(m);
    });
    kp.addEventListener('click', () => { if (!cur) return; judge(t, cur, true); cur = null; pending(false); line.textContent = 'kept — it stays (save it as a preset to keep it by name)'; count(); });
    th.addEventListener('click', () => { if (!cur) return; judge(t, cur, false); t.set(cur.prev); if (t.hear) try { t.hear(); } catch (e) {} cur = null; pending(false); line.textContent = 'thrown — back to before; what it chose comes up less'; count(); });
    box.mutateNow = () => go.click(); box.keepNow = () => kp.click(); box.throwNow = () => th.click();
    return box;
  }

  // a tool on the canvas as a target: its settings; set = as if turned by hand (the canvas's history groups them: one undo step)
  function toolTarget(instanceId) {
    const F = global.OrganismFactory, r = F && F.handle(instanceId); if (!r) return null;
    return { id: r.id, list: () => (r.def && r.def.config) || [], get: (k) => r.ctx.params.get(k),
      set: (patch) => Object.keys(patch).forEach(k => r.view ? r.view.emit('config_change', { key: k, value: patch[k] }) : r.ctx.params.set(k, patch[k])),
      hear: () => { if (r.ctx.audition) r.ctx.audition({ note: 45, velocity: 0.9, duration: 1.4 }); } };
  }
  global.FieldMutate = { mutate, judge, apply, learned, forget, dock, toolTarget, guards, usable };
})(window);
