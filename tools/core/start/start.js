/* ERAVOS core — start/start.js → window.StartScreen (SS1, 2026-11-20; specs/eravos.start-screens.spec). Domain-free: it names no domain, tool or
 * topic (tests/boundary.test.js) — every word, picture and list comes from the catalog (domains, tools, categories, thumbnails, paintings), the
 * recipes (setups and their paintings) and FieldBoard (tools that explode). Today's Start (the canvas's bootScreen) stays until he says yes.
 * His words (2026-11-20): "domain screen first, then animated transition into the next screen, which would be the tool selection screen, which
 * needs to be organized better. with a open catalog button on the top, open mutation lab. … animated transitions between screens completely
 * dynamically changes fluidly through the screens. like beautiful transitions. I want the beautiful art like the thumbnails."
 * The screens: DOMAINS (only the domains + the WORKSHOP + an empty canvas) → a DOMAIN (its painting as a banner, its setups, its tools by category)
 * · WORKSHOP (the Field, the Workshop, the Mutation Lab) → MUTATION LAB. On top always: ERAVOS · the path · ⧉ OPEN CATALOG · ⚄ MUTATION LAB · ✕.
 * The motion (FieldMotion, shared): a painting carried from one screen to the next (the chosen card's painting grows into the banner), the old
 * screen's cards fall away, the new one's cascade in; back reverses it; a category change flows the cards. Reduced motion → at once.
 *   StartScreen.open({ first }) · StartScreen.close() · StartScreen.current → { go(screenId, arg), screen } */
(function (global) {
  'use strict';
  const doc = global.document, M = () => global.FieldMotion, base = () => global.ERAVOS_TOOLS || '';
  const still = () => !M() || M().still(), A = (el, kf, o) => (M() ? M().A(el, kf, o) : null);
  const EASE = { glide: 'cubic-bezier(.65,0,.35,1)', out: 'cubic-bezier(.16,1,.3,1)', away: 'cubic-bezier(.6,0,.2,1)' };
  const el = (tag, cls, kids, attrs) => { const e = doc.createElement(tag); if (cls) e.className = cls; Object.keys(attrs || {}).forEach(k => { if (k === 'text') e.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else if (k === 'style') Object.assign(e.style, attrs[k]); else e.setAttribute(k, attrs[k]); }); (kids || []).filter(Boolean).forEach(c => e.append(c)); return e; };
  const url = (p) => !p ? null : /^(\.\.\/|\/|[a-z]+:)/.test(p) || p.indexOf(base()) === 0 && base() ? p : base() + p;
  const pic = (src, cls) => src ? el('img', cls || 'st-art', [], { src, alt: '', loading: 'eager', draggable: 'false' }) : el('div', (cls || 'st-art') + ' st-noart');
  let cur = null;

  // ---- what there is (all from the catalog and the recipes)
  const Cat = () => global.Catalog, S = () => global.Shell, X = () => global.Shell && global.Shell.X;
  const domains = () => (Cat() ? Cat().domains() : []).filter(d => !d.toolless);
  const toolsOf = (d) => (Cat() ? Cat().tools() : []).filter(t => t.domain === d.id && !t.hidden);
  const recipeDomain = (r) => { const x = X(); try { const ms = x && x.recipeModes ? x.recipeModes(r) : []; const m = ms.map(id => x.mode_(id)).find(Boolean); if (m && m.domain) return m.domain; } catch (e) {} const g = /^setup:([^.]+)\./.exec(r.id || ''); return g ? g[1] : null; };
  const setupsOf = (d) => (global.Recipes ? global.Recipes.list() : []).filter(r => r.section === 'SETUPS' && !r.hidden && recipeDomain(r) === d.id);
  const categoriesOf = (d) => { const out = []; toolsOf(d).forEach(t => { const c = t.category || 'General'; let x = out.find(o => o.name === c); if (!x) out.push(x = { name: c, tools: [] }); x.tools.push(t); }); return out; };

  // ---- what a click does (the same paths today's Start and the catalog take)
  async function startSetup(r) { const s = S(); close(); if (!s) return; s.activate(); if (global.OrganismFactory) global.OrganismFactory.blankStart(false);
    const K = s.K || global.Kernel, busy = K && K.registry ? K.registry.list().filter(x => !x.descriptor.system).length > 0 : false;
    const res = await global.Recipes.run(r.id, { clear: busy, origin: { x: 30, y: 20 } }); setTimeout(() => global.CanvasWM && global.CanvasWM.fitAll(), 80);
    if (res && res.faults && res.faults.length && s.toast) s.toast(res.faults.length + ' thing' + (res.faults.length > 1 ? 's' : '') + ' did not load cleanly — the red dot, top right.', 'bad', 7000); }
  async function addTool(t, then) { const s = S(), F = global.OrganismFactory, C = Cat(); close(); if (!s || !F) return null; s.activate();
    const d = domains().find(x => x.id === t.domain); if (d && !d.loaded && C && C.chooseDomain) C.chooseDomain(d.id);
    if (C && C.isInstalled && !C.isInstalled(t.id) || (F.defined && !F.defined().some(x => x.id === t.id))) { if (s.toast) s.toast('Installing ' + t.label + '…', '', 1500); await C.install([t.id], s.K || global.Kernel); }
    const x = X(), m = x && x.modes ? x.modes().find(mm => mm.domain === t.domain) : null; if (m && x.enterMode && !x.isActive(m.id)) try { x.enterMode(m.id); } catch (e) {}
    const id = F.spawn(t.id); if (id && s.toast) s.toast(t.label + ' added', 'good', 1800); if (id && then) setTimeout(() => then(id), 500); return id; }
  function emptyCanvas() { const s = S(); close(); if (!s) return; s.activate(); if (global.OrganismFactory) global.OrganismFactory.blankStart(true); }
  function catalog() { const s = S(); close(); if (s && global.AddMenu) setTimeout(() => global.AddMenu.show(s, s.X), 30); }

  // ---- the screens
  function card(o) {   // a painted card: its painting on top, its name, a line
    const c = el('div', 'st-card' + (o.cls ? ' ' + o.cls : ''), [pic(o.art), el('b', '', [], { text: o.title }), o.line ? el('small', '', [], { text: o.line }) : null], { role: 'button', tabindex: '0', title: o.hint || '' });
    if (o.hero) c.querySelector('.st-art').dataset.hero = o.hero; if (o.acc) c.style.setProperty('--acc', o.acc);
    c.addEventListener('click', o.go); c.addEventListener('keydown', (e) => { if (e.key === 'Enter') o.go(); }); return c;
  }
  function banner(art, hero, title, line, extra) {
    const b = el('div', 'st-banner', [pic(art, 'st-bart'), el('div', 'st-bshade'), el('div', 'st-btext', [el('h2', '', [], { text: title }), line ? el('p', '', [], { text: line }) : null, extra || null])]);
    if (hero) b.querySelector('.st-bart').dataset.hero = hero; return b;
  }
  const sec = (t, n) => el('div', 'st-sec', [t, n != null ? el('i', '', [], { text: String(n) }) : null]);
  const SCREENS = {
    domains() {
      const ds = domains();
      return el('div', 'st-screen st-domains', [el('p', 'st-lead', [], { text: 'What are you making?' }),
        el('div', 'st-grid st-dgrid', ds.map(d => card({ art: url(d.art), hero: 'dom:' + d.id, title: d.label, line: (d.summary || '') + (d.loaded ? '' : ' · installs as you choose it'), go: () => go('domain', d.id) }))
          .concat([card({ art: url('core/start/workshop-art.svg'), hero: 'dom:@workshop', title: 'Workshop', line: 'The Field, the Workshop and the Mutation Lab — take tools apart, shape them, make new ones.', go: () => go('workshop') })])),
        el('div', 'st-row', [el('button', 'st-quiet', [], { type: 'button', text: '◻ Empty canvas — add tools yourself', onclick: emptyCanvas })])]);
    },
    domain(id) {
      const d = domains().find(x => x.id === id); if (!d) return SCREENS.domains();
      const sets = setupsOf(d), cats = categoriesOf(d), first = cats[0] ? cats[0].name : null;
      const rail = el('nav', 'st-rail', cats.map(c => el('button', 'st-cat' + (c.name === first ? ' on' : ''), [c.name, el('i', '', [], { text: String(c.tools.length) })], { type: 'button', 'data-cat': c.name })));
      const grid = el('div', 'st-grid st-tgrid');
      const fill = (name) => { grid.replaceChildren(...(cats.find(c => c.name === name) || { tools: [] }).tools.map(t => card({ art: url(t.thumb || t.art || t.preview), title: (t.icon ? t.icon + ' ' : '') + t.label, line: t.summary, acc: t.accent, cls: 'st-tool', hint: 'put it on the canvas', go: () => addTool(t) }))); };
      fill(first);
      rail.addEventListener('click', (e) => { const b = e.target.closest('.st-cat'); if (!b || b.classList.contains('on')) return; rail.querySelectorAll('.st-cat').forEach(x => x.classList.toggle('on', x === b)); flow(grid, () => fill(b.dataset.cat)); });
      return el('div', 'st-screen st-domain', [banner(url(d.art), 'dom:' + d.id, d.label, d.summary, el('small', '', [], { text: toolsOf(d).length + ' tools · ' + cats.length + ' categories' + (sets.length ? ' · ' + sets.length + ' setups' : '') })),
        sets.length ? sec('START FROM A SETUP — a whole canvas, wired, playing', sets.length) : null,
        sets.length ? el('div', 'st-grid st-sgrid', sets.map(r => card({ art: r.art ? url(r.art) : null, title: r.label, line: r.blurb || r.summary || '', acc: r.accent, go: () => startSetup(r) }))) : null,
        sec('TOOLS', toolsOf(d).length), el('div', 'st-tools', [rail, grid])]);
    },
    workshop() {
      const FB = global.FieldBoard, boardTools = FB && FB.boards ? Array.from(FB.boards.keys()).map(id => (Cat() ? Cat().tools() : []).find(t => t.id === id)).filter(Boolean) : [];
      return el('div', 'st-screen st-workshop', [banner(url('core/start/workshop-art.svg'), 'dom:@workshop', 'Workshop', 'Take a tool apart and play every part of it; shape a note layer by layer; mutate tools into new ones.'),
        el('div', 'st-grid st-wgrid', [
          el('div', 'st-panel2', [el('h3', '', [], { text: 'THE FIELD — a tool blown apart' }), el('p', '', [], { text: 'Every part of the tool on the canvas, live, wired to its core. Pick one:' }),
            el('div', 'st-chips', boardTools.length ? boardTools.map(t => el('button', 'st-chip', [pic(url(t.thumb), 'st-cthumb'), t.label], { type: 'button', onclick: () => addTool(t, (id) => FB.explode(id, t.id)) })) : [el('small', '', [], { text: 'no tool has a board yet' })])]),
          el('div', 'st-panel2', [el('h3', '', [], { text: 'THE WORKSHOP — shape it layer by layer' }), el('p', '', [], { text: 'Opens from what you are editing (a note, a pattern, an instrument). Its BOARD view takes the document apart the same way: every layer live, wired to it.' })]),
          card({ art: url('core/start/lab-art.svg'), hero: 'lab', title: 'Mutation Lab', line: 'Swap a part, mutate the rest; it learns what you keep; repeats are refused.', go: () => go('lab') })])]);
    },
    lab() {
      const ts = (Cat() ? Cat().tools() : []).filter(t => (t.components || []).length || (t.needs && (t.needs.components || []).length));
      return el('div', 'st-screen st-lab', [banner(url('core/start/lab-art.svg'), 'lab', 'Mutation Lab', 'Start from a tool, swap its parts on the spot, mutate, keep what you love — it learns from each keep and each throw-away, and refuses repeats.',
          el('small', 'st-tag', [], { text: 'PREVIEW — shown 2026-11-20 · in the app on your yes' })),
        sec('TOOLS AND THE PARTS THEY ARE MADE OF', ts.length),
        el('div', 'st-grid st-tgrid', ts.map(t => { const parts = (t.components || (t.needs && t.needs.components) || []).map(x => String(x).split('@')[0]);
          return el('div', 'st-card st-tool st-static', [pic(url(t.thumb)), el('b', '', [], { text: t.label }), el('small', '', [], { text: parts.join(' · ') })]); }))]);
    }
  };
  const TITLES = { domains: () => [], domain: (id) => [(domains().find(d => d.id === id) || {}).label || id], workshop: () => ['Workshop'], lab: () => ['Workshop', 'Mutation Lab'] };

  // ---- motion
  function cascade(scr, delay) { if (still()) return; [].slice.call(scr.querySelectorAll('.st-card, .st-sec, .st-banner .st-btext, .st-panel2, .st-rail .st-cat, .st-lead, .st-row')).forEach((e, i) =>
    A(e, [{ opacity: 0, transform: 'translateY(22px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 620, delay: delay + Math.min(i, 24) * 38, easing: EASE.out })); }
  function fallAway(scr) { if (still()) return Promise.resolve(); const els = [].slice.call(scr.querySelectorAll('.st-card, .st-sec, .st-banner, .st-panel2, .st-rail, .st-lead, .st-row'));
    return Promise.all(els.map((e, i) => { const a = A(e, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(26px) scale(.96)' }], { duration: 380, delay: Math.min(i, 16) * 22, easing: EASE.away, fill: 'forwards' }); return a ? a.finished : null; }).filter(Boolean)).catch(() => {}); }
  function flow(grid, change) {   // a category change: the cards flow out, the new ones in
    if (still()) { change(); return; } const old = [].slice.call(grid.children);
    Promise.all(old.map((e, i) => A(e, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-18px)' }], { duration: 220, delay: i * 14, easing: EASE.away, fill: 'forwards' }).finished)).catch(() => {}).then(() => {
      change(); [].slice.call(grid.children).forEach((e, i) => A(e, [{ opacity: 0, transform: 'translateX(22px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: i * 32, easing: EASE.out })); });
  }
  function carry(from, to, panel) {   // a painting carried across: from its place on the old screen to its place on the new one
    const pr = panel.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect(); if (!a.width || !b.width) return Promise.resolve();
    const fly = from.cloneNode(true); fly.removeAttribute('data-hero'); fly.className = 'st-fly'; panel.appendChild(fly); to.style.visibility = 'hidden';
    const R = (r) => ({ left: (r.left - pr.left) + 'px', top: (r.top - pr.top) + 'px', width: r.width + 'px', height: r.height + 'px' });
    const an = A(fly, [Object.assign({ borderRadius: '6px' }, R(a)), Object.assign({ borderRadius: '10px' }, R(b))], { duration: 820, easing: EASE.glide, fill: 'forwards' });
    return (an ? an.finished : Promise.resolve()).catch(() => {}).then(() => { to.style.visibility = ''; fly.remove(); });
  }

  // ---- open, move between screens, close
  function go(screen, arg, o) {
    if (!cur) return; o = o || {}; const { body, panel } = cur, old = cur.screen, scr = SCREENS[screen](arg);
    cur.stack = o.back ? cur.stack : cur.stack.concat([[cur.at, cur.arg]]).slice(-8); if (o.back) cur.stack = cur.stack.slice(0, -1);
    cur.at = screen; cur.arg = arg; path();
    scr.style.visibility = 'hidden'; body.appendChild(scr); body.scrollTop = 0;
    const heroes = old ? [].slice.call(scr.querySelectorAll('[data-hero]')).map(t => [old.querySelector('[data-hero="' + t.dataset.hero + '"]'), t]).filter(p => p[0]) : [];
    const leave = old ? fallAway(old) : Promise.resolve();
    heroes.forEach(([f]) => { f.style.visibility = 'hidden'; });
    scr.style.visibility = ''; scr.style.opacity = '0';
    const heroWork = Promise.all(heroes.map(([f, t]) => { f.style.visibility = ''; return carry(f, t, panel).then(() => {}); }));
    heroes.forEach(([f]) => { f.style.visibility = 'hidden'; });
    leave.then(() => { if (old) old.remove(); scr.style.opacity = ''; cascade(scr, heroes.length ? 260 : 0); });
    cur.screen = scr; return heroWork;
  }
  function path() {
    const p = cur.top.querySelector('.st-path'), crumbs = [['ERAVOS', 'domains']].concat((TITLES[cur.at] || (() => []))(cur.arg).map((t, i, a) => [t, i === a.length - 1 ? null : 'workshop']));
    p.replaceChildren(...crumbs.map(([t, to], i) => el(i === crumbs.length - 1 ? 'span' : 'button', i === crumbs.length - 1 ? 'on' : '', [], { text: (i ? '› ' : '') + t, type: 'button', onclick: to ? () => go(to, null, { back: true }) : null })));
    cur.top.querySelector('.st-back').style.visibility = cur.at === 'domains' ? 'hidden' : '';
  }
  function open(o) {
    o = o || {}; if (cur) close(true);
    const back = el('button', 'st-back', [], { type: 'button', text: '←', title: 'back (Backspace)', onclick: () => back2() });
    const top = el('div', 'st-top', [back, el('h1', '', [], { text: 'ERAVOS' }), el('nav', 'st-path'), el('span', 'st-sp'),
      el('button', 'st-btn', [], { type: 'button', text: '⧉ OPEN CATALOG', title: 'every tool of every domain, what each needs', onclick: catalog }),
      el('button', 'st-btn hot', [], { type: 'button', text: '⚄ MUTATION LAB', onclick: () => go('lab') }),
      el('button', 'st-x', [], { type: 'button', text: '×', title: 'close (Esc)', onclick: () => close() })]);
    const body = el('div', 'st-body'), panel = el('div', 'st-panel', [top, body]), root = el('div', 'st-app', [panel], { role: 'dialog', 'aria-label': 'Start' });
    doc.body.appendChild(root);
    cur = { root, panel, top, body, screen: null, at: null, arg: null, stack: [], go: (s, a) => go(s, a), get screenId() { return cur.at; } };
    const onKey = (e) => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'Backspace') { e.preventDefault(); back2(); } };
    doc.addEventListener('keydown', onKey, true); cur.onKey = onKey;
    go(o.screen || 'domains', o.arg);
    if (!still()) { A(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' }); A(panel, [{ opacity: 0, transform: 'translateY(18px) scale(.975)' }, { opacity: 1, transform: 'none' }], { duration: 640, easing: EASE.out }); }
    return cur;
  }
  function back2() { if (!cur || !cur.stack.length) return; const [s, a] = cur.stack[cur.stack.length - 1]; if (s) go(s, a, { back: true }); }
  function close(now) {
    if (!cur) return; const c = cur; cur = null; doc.removeEventListener('keydown', c.onKey, true);
    if (now || still()) { c.root.remove(); return; }
    A(c.panel, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(14px) scale(.98)' }], { duration: 320, easing: EASE.away, fill: 'forwards' });
    const a = A(c.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: 'ease-in', fill: 'forwards' }); (a ? a.finished : Promise.resolve()).catch(() => {}).then(() => c.root.remove());
  }
  global.StartScreen = { open, close, get current() { return cur; }, screens: () => Object.keys(SCREENS) };
})(window);
