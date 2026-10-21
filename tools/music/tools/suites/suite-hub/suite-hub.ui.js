/* eravos.suite-hub UI — the suite window: the system and its parts (spec eravos.suites ADDENDUM 2026-10-21 · P48.5b, P48.8).
 * Tabs: PANEL (P48.8, the suite as one instrument: its macros, then every part's controls inside this window, grouped by part:
 *   main knobs, ⤢ its whole face, ▾ fold, ↗ its window; "Fold the part windows") · Parts (here / not here, ＋ add, Mix in parts
 *   of other suites) · Scenes · Wiring.
 * James, 2026-10-21: "the suite should be like a synthesis tool of the respective tools ... like a control panel of the respective tools"
 * The part cards are drawn the way the mods rack draws a mod (F.makeView + the face keys, or the tool's own UI with ⤢).
 * A keyboard plays every part that takes notes (a part with notes: false follows another part on its own).
 * Every button is the user's own action through window.Suites (spawn, preset, wire, Mods.add), so Ctrl+Z takes it back. */
OrganismFactory.reg('eravos.suite-hub', function (view) {
  const UI = view.ui, h = UI.h, K = view.K, me = view.instanceId, Su = window.Suites;
  const win = view.root.closest ? view.root.closest('.wm-win') : null;
  const el = h('div', { class: 'su' }); view.root.appendChild(el);
  const btn = (label, hint, fn, cls) => { const b = h('button', { class: 'su-btn' + (cls ? ' ' + cls : ''), text: label, title: hint || '' }); b.addEventListener('click', (e) => { e.stopPropagation(); fn(); }); return b; };
  const def = (t) => OrganismFactory.def(t) || (window.Catalog && window.Catalog.meta && window.Catalog.meta(t)) || null;
  const name = (t) => { const d = def(t); return d ? (d.icon || '') + ' ' + (d.label || t) : t; };
  const go = (id) => K.bus.publish('canvas:focus-request', { instanceId: id });
  const suite = () => Su && Su.get(view.state.suite);
  let tab = 'panel';   // which tab shows is the window's view, not a setting (no undo step, not saved)
  const mode = new Map();   // part instance → 'face' | 'full' | 'shut' (how its card shows here)
  let views = [];           // part views mounted in this window — disposed on every repaint
  const dropViews = () => { views.forEach(v => { try { v.dispose(); } catch (e) {} }); views = []; };
  view.onDispose(dropViews);
  let pend = 0; const soon = () => { if (!pend) pend = setTimeout(() => { pend = 0; paint(); }, 30); };

  // a keyboard for the whole system: every part here that takes notes plays (parts marked notes:false follow on their own)
  const held = new Map();
  const players = () => { const s = suite(); if (!s) return []; return Su.status(K, me).filter(x => x.instanceId && x.part.notes !== false && (OrganismFactory.handle(x.instanceId) || {}).def && (OrganismFactory.handle(x.instanceId).def.hooks || []).some(hk => /note_in$/.test(hk.hook_id))).map(x => x.instanceId); };
  const kb = UI.Keyboard({ low: 24, high: 48, key: view.key,
    onDown: (n, v) => { const ids = players(); held.set(n, ids); ids.forEach(id => K.bus.publish('ui:audition:' + id, { note: n, velocity: v, duration: 30 })); },
    onUp: (n) => { (held.get(n) || []).forEach(id => K.bus.publish('ui:audition_off:' + id, { note: n })); held.delete(n); } });
  if (view.observe) view.observe('theory:key-change', (k) => kb.setKey(k));

  function picker() {
    el.appendChild(h('p', { class: 'su-p', text: 'Pick the suite this window holds:' }));
    (Su ? Su.list() : []).forEach(s => el.appendChild(h('div', { class: 'su-row' }, [
      h('span', { class: 'su-ic', text: s.icon || '🧰' }), h('div', { class: 'su-grow' }, [h('b', { text: s.label }), h('div', { class: 'su-dim', text: s.parts.map(p => name(p.tool)).join(' · ') })]),
      btn('Use', 'make this window ' + s.label, () => view.set('suite', s.id), 'pri')])));
  }
  function partsTab(s) {
    const st = Su.status(K, me);
    el.appendChild(h('div', { class: 'su-bar' }, [btn('＋ Build the whole system', 'every required part, wired into this suite, on the ' + (s.starter || 'first') + ' scene — Ctrl+Z takes it back a step at a time', () => Su.build(K, me), 'pri su-build')]));
    st.forEach(x => {
      const p = x.part, here = !!x.instanceId, d = def(p.tool);
      const state = !x.installed ? 'not installed' : here ? (p.as === 'mod' ? 'inside ' + name(p.in) : 'here, connected') : 'not here';
      el.appendChild(h('div', { class: 'su-row su-part' + (here ? ' on' : '') + (x.mixed ? ' mixed' : ''), 'data-tool': p.tool }, [
        h('span', { class: 'su-role', text: p.role || '' }),
        h('div', { class: 'su-grow' }, [h('b', { text: name(p.tool) + (p.required ? '' : '  ·  optional') }), h('div', { class: 'su-dim', text: (p.why || (d && (d.blurb || d.summary)) || '') })]),
        h('span', { class: 'su-state', text: state }),
        here ? btn('↗', 'go to it', () => go(x.instanceId)) : x.installed ? btn('＋', 'add just this part, wired into what is here', () => Su.addPart(K, me, p.tool), 'su-add') : null,
      ].filter(Boolean)));
    });
    const mix = Su.mixable(s.id).filter(m => !st.some(x => x.part.tool === m.tool && x.instanceId));
    if (mix.length) {
      el.appendChild(h('h4', { class: 'su-h', text: 'Mix in — parts of other suites' }));
      mix.forEach(m => el.appendChild(h('div', { class: 'su-row su-mix', 'data-tool': m.tool }, [
        h('span', { class: 'su-role', text: m.role }), h('div', { class: 'su-grow' }, [h('b', { text: name(m.tool) }), h('div', { class: 'su-dim', text: 'from ' + m.from })]),
        btn('＋', 'add it to this system — it joins by the first ports that fit', () => Su.addPart(K, me, m.tool), 'su-add')])));
    }
    el.appendChild(UI.hint('Every part is its own tool: open it, change it, close it — the others keep playing. Wire any other tool into this window (or into a part) and it joins the system.'));
  }
  function panelTab(s) {
    const F = OrganismFactory, ms = Su.members(K, me);
    // the suite's macros: one knob turns several parts at once
    if ((s.macros || []).length) {
      el.appendChild(h('div', { class: 'su-macros' }, s.macros.map((m, i) => {
        const k = UI.Knob({ label: m.label, min: 0, max: 1, step: 0.001, default: m.default !== undefined ? m.default : 0.5, value: view.state['m' + (i + 1)], size: 46,
          hint: m.hint || ('turns ' + m.targets.map(t => name(t.tool) + ' ' + t.key).join(', ')), onChange: (v) => Su.macro(K, me, i, v) });
        k.el.classList.add('su-macro'); k.el.dataset.macro = String(i); view.bind('m' + (i + 1), (v) => k.set(v));
        return k.el;
      })));
    }
    if (!ms.size) { el.appendChild(h('div', { class: 'su-bar' }, [btn('＋ Build the whole system', 'every required part, wired into this suite, on the ' + (s.starter || 'first') + ' scene', () => Su.build(K, me), 'pri su-build')])); el.appendChild(UI.hint('Nothing is here yet. Build the whole system, or add parts one by one in Parts. Their controls then show here.')); return; }
    const folded = Array.from(ms.keys()).some(id => { const w = window.CanvasWM && CanvasWM.windowOf(id); return w && w.classList.contains('collapsed'); });
    el.appendChild(h('div', { class: 'su-bar' }, [btn(folded ? '▤ Open the part windows' : '▭ Fold the part windows', folded ? 'show every part window again' : 'leave only their title bars — play the system from here', () => { Su.fold(K, me, !folded); soon(); }, 'su-fold')]));
    const order = s.parts.map(p => p.tool), byTool = (a, b) => (order.indexOf(a[1]) + 1 || 99) - (order.indexOf(b[1]) + 1 || 99);
    Array.from(ms).filter(([id]) => { const r = F.handle(id); return r && !r.hostId; }).sort(byTool).forEach(([id, tool]) => {
      const r = F.handle(id), part = s.parts.find(p => p.tool === tool), m = mode.get(id) || 'face';
      const card = h('div', { class: 'su-card', 'data-instance': id, style: { '--pc': r.def.accent || '#00d4ff' } });
      const set = (v) => () => { mode.set(id, v); paint(); };
      card.appendChild(h('div', { class: 'su-chead' }, [
        h('span', { class: 'su-role', text: (part && part.role) || 'mixed in' }), h('b', { class: 'su-grow', text: name(tool) }),
        btn(m === 'full' ? '▣' : '⤢', m === 'full' ? 'just its main controls' : 'all of it, here', set(m === 'full' ? 'face' : 'full')),
        btn(m === 'shut' ? '▸' : '▾', m === 'shut' ? 'unfold' : 'fold', set(m === 'shut' ? 'face' : 'shut')),
        btn('↗', 'go to its window', () => go(id))]));
      if (m !== 'shut') {
        const inner = h('div', { class: 'su-cbody' }); card.appendChild(inner);
        const v = F.makeView(r, inner); views.push(v); const uiFn = F.ui(r.id);
        if (m === 'full' && uiFn) { try { uiFn(v); } catch (x) { inner.appendChild(UI.hint('its controls could not open here: ' + x.message)); } }
        else { const keys = window.Links ? Links.faceKeys(r.def) : []; inner.appendChild(keys.length ? UI.paramPanel(v, keys, { flat: true, noTitles: true, size: 30, compact: true }) : UI.hint('⤢ shows its controls')); }
        // its mods live on its card
        (window.Mods ? Mods.entries(id) : []).filter(e => e.child && F.handle(e.child)).forEach(e => {
          const c = F.handle(e.child), mv = F.makeView(c, h('div')); views.push(mv);
          const keys = window.Links ? Links.faceKeys(c.def) : [];
          inner.appendChild(h('div', { class: 'su-mod' }, [h('span', { class: 'su-dim', text: '🧩 inside: ' + name(e.tool) }), keys.length ? UI.paramPanel(mv, keys, { flat: true, noTitles: true, size: 26, compact: true }) : null].filter(Boolean)));
        });
      }
      el.appendChild(card);
    });
  }
  function scenesTab(s) {
    Object.keys(s.scenes).forEach(n => {
      const sc = s.scenes[n];
      el.appendChild(h('div', { class: 'su-row su-scene' + (view.state.scene === n ? ' on' : ''), 'data-scene': n }, [
        h('div', { class: 'su-grow' }, [h('b', { text: n }), h('div', { class: 'su-dim', text: Object.keys(sc).map(t => name(t) + ': ' + (sc[t].preset || 'set')).join(' · ') })]),
        btn('Load', 'set every part of the system (missing required parts open first)', () => Su.scene(K, me, n), 'pri')]));
    });
  }
  function wiringTab() {
    Su.wiring(K, me).forEach(w => el.appendChild(h('div', { class: 'su-row su-wire' + (w.on ? ' on' : '') }, [
      h('span', { class: 'su-state', text: w.on ? '✓' : w.possible ? '·' : '—' }),
      h('div', { class: 'su-grow', text: name(w.wire.from[0]) + '  →  ' + (w.toSuite ? '🧰 this suite' : name(w.wire.to[0])) + '   ' + (w.wire.to[1] || '').split('.').pop() }),
      !w.on && w.possible ? btn('＋', 'connect it', () => Su.addPart(K, me, w.wire.from[0])) : null].filter(Boolean))));
  }
  function paint() {
    dropViews(); el.innerHTML = ''; const s = suite();
    if (win) { const t = win.querySelector('.wm-title'), ic = win.querySelector('.wm-icon'); if (t) t.textContent = s ? s.label : 'Suite'; if (ic && s && s.icon) ic.textContent = s.icon; if (s && s.accent) win.style.setProperty('--acc', s.accent); }
    if (!s) { picker(); return; }
    const n = Su.members(K, me).size;
    el.appendChild(h('div', { class: 'su-head' }, [h('span', { class: 'su-big', text: s.icon || '🧰' }), h('div', { class: 'su-grow' }, [h('b', { class: 'su-title', text: s.label }), h('div', { class: 'su-dim', text: s.blurb || '' }), h('div', { class: 'su-count', text: n + ' connected' + (view.state.scene ? ' · scene: ' + view.state.scene : '') })])]));
    el.appendChild(h('div', { class: 'su-tabs', role: 'tablist' }, [['panel', 'Panel'], ['parts', 'Parts'], ['scenes', 'Scenes'], ['wiring', 'Wiring']].map(([k, l]) => { const b = btn(l, '', () => { tab = k; paint(); }, tab === k ? 'on' : ''); b.setAttribute('role', 'tab'); b.dataset.tab = k; return b; })));
    if (tab === 'scenes') scenesTab(s); else if (tab === 'wiring') wiringTab(); else if (tab === 'parts') partsTab(s); else panelTab(s);
    el.appendChild(h('div', { class: 'su-kb' }, [kb.el]));
  }
  ['suite', 'scene'].forEach(k => view.bind(k, soon));
  ['kernel:wire-registered', 'kernel:wire-removed', 'kernel:organism-mounted', 'kernel:organism-unmounted'].forEach(t => view.observe(t, soon));
  paint();
});
