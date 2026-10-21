/* eravos.suite UI — the suite window: the system and its parts (spec eravos.suites ADDENDUM 2026-10-21 · P48.5b).
 * Tabs: Parts (each part here / not here / wired, ＋ add it, ↗ go to it, Mix in parts of other suites) · Scenes · Wiring.
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
  let tab = 'parts';   // which tab shows is the window's view, not a setting (no undo step, not saved)
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
    el.innerHTML = ''; const s = suite();
    if (win) { const t = win.querySelector('.wm-title'), ic = win.querySelector('.wm-icon'); if (t) t.textContent = s ? s.label : 'Suite'; if (ic && s && s.icon) ic.textContent = s.icon; if (s && s.accent) win.style.setProperty('--acc', s.accent); }
    if (!s) { picker(); return; }
    const n = Su.members(K, me).size;
    el.appendChild(h('div', { class: 'su-head' }, [h('span', { class: 'su-big', text: s.icon || '🧰' }), h('div', { class: 'su-grow' }, [h('b', { class: 'su-title', text: s.label }), h('div', { class: 'su-dim', text: s.blurb || '' }), h('div', { class: 'su-count', text: n + ' connected' + (view.state.scene ? ' · scene: ' + view.state.scene : '') })])]));
    el.appendChild(h('div', { class: 'su-tabs', role: 'tablist' }, [['parts', 'Parts'], ['scenes', 'Scenes'], ['wiring', 'Wiring']].map(([k, l]) => { const b = btn(l, '', () => { tab = k; paint(); }, tab === k ? 'on' : ''); b.setAttribute('role', 'tab'); b.dataset.tab = k; return b; })));
    if (tab === 'scenes') scenesTab(s); else if (tab === 'wiring') wiringTab(); else partsTab(s);
    el.appendChild(h('div', { class: 'su-kb' }, [kb.el]));
  }
  ['suite', 'scene'].forEach(k => view.bind(k, soon));
  ['kernel:wire-registered', 'kernel:wire-removed', 'kernel:organism-mounted', 'kernel:organism-unmounted'].forEach(t => view.observe(t, soon));
  paint();
});
