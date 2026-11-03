/* ERAVOS runtime — themes.js → window.Themes (spec eravos.themes, addendum 3.91)
 * Asked: "the colors inside the tools … look at the buttons, looks bad. please make those themes. and hook into the reactive. make all
 * the buttons beautiful. make a themes section in the settings."
 * A THEME is the whole look in one choice — panels, buttons, title bars, how far the reactive colours may tint the surfaces — set on
 * <html data-theme="…"> (an inline line in index.html sets it before the first paint). Every rule of a theme is scoped to it in eravos.css,
 * so switching is instant and nothing of another theme leaks.
 *   studio    the device look (3.72): sharp, dark, each tool in its own colour
 *   dusk      sunset gradients, round pill buttons, the tool's painting in its title bar, soft rounded panels
 *   midnight  calm graphite: quiet panels, the accent only where it means something, gentle reactions
 *   field     (3.98) clear buttons on deep black; one gradient under the canvas, seen only through the accents (colour-field.js)
 * HOOKED INTO THE REACTIVE COLOURS: a theme gives the palette they light (they read it again on a switch, the 'eravos:theme' event) and
 * --react-surface, how far they may tint a surface (1 = as asked, below 1 = calmer).
 *   Themes.list() · get() · set(id) · onChange(fn) · panel() → the Options section (cards with a live picture of each theme) */
(function (global) {
  'use strict';
  const doc = global.document, root = doc && doc.documentElement, KEY = 'eravos.theme';
  const LIST = [
    { id: 'dusk', label: 'Dusk', blurb: 'Sunset gradients, round pill buttons, each tool’s painting in its title bar.', swatch: ['#ff2266', '#ff6fa8', '#ffb36b', '#b06bff'] },
    { id: 'studio', label: 'Studio', blurb: 'The device look: sharp, dark, every tool in its own colour.', swatch: ['#00d4ff', '#0d1218', '#223044', '#7f93a8'] },
    { id: 'field', label: 'Field', blurb: 'Clear buttons on deep black. One gradient lies under the canvas and shows only through the accents — drag a tool and its colours change with where it sits.', swatch: ['#6f5cff', '#b04dff', '#ff3d8b', '#ffc24a'] },
    { id: 'midnight', label: 'Midnight', blurb: 'Calm graphite. The accent only where it means something; gentle reactions.', swatch: ['#8fa8ff', '#11141b', '#2a3142', '#c9d2e3'] },
  ];
  const DEFAULT = 'dusk';
  // S1 (spec eravos.settings-buttons-dag): button styles, a choice beside the theme (canvas/runtime/buttons.css). 'theme' = the theme's own.
  const BUTTONS = [
    { id: 'theme', label: 'The theme’s own', blurb: 'Each theme’s buttons, as designed.' },
    { id: 'a', label: 'Clear glass', blurb: 'A thin bright pane: blur behind, a highlight on top; on = filled with the accent.' },
    { id: 'b', label: 'Glowing edge', blurb: 'Dark smoked glass with a glowing gradient edge; text and icons in the accent.' },
    { id: 'c', label: 'Frosted pill', blurb: 'Round, deep frost, a soft inner glow and a sheen on hover.' },
    { id: 'd', label: 'RGB edge', blurb: 'A rainbow rim travelling like RGB lighting; the text and icons the same rainbow.' },
  ];
  const BKEY = 'eravos.buttons';
  function getButtons() { const v = root && root.dataset.buttons; return BUTTONS.some(b => b.id === v) ? v : 'theme'; }
  function setButtons(id) {
    if (!BUTTONS.some(b => b.id === id) || !root) return false;
    if (id === 'theme') delete root.dataset.buttons; else root.dataset.buttons = id;
    try { global.localStorage.setItem(BKEY, id); } catch (e) {}
    try { global.dispatchEvent(new CustomEvent('eravos:buttons', { detail: { id } })); } catch (e) {}
    listeners.forEach(fn => { try { fn(get()); } catch (e) {} }); return true;
  }
  const listeners = [];
  const valid = (id) => LIST.some(t => t.id === id);
  function get() { const v = root && root.dataset.theme; return valid(v) ? v : DEFAULT; }
  function set(id) {
    if (!valid(id) || !root) return false;
    root.dataset.theme = id; try { global.localStorage.setItem(KEY, id); } catch (e) {}
    try { global.dispatchEvent(new CustomEvent('eravos:theme', { detail: { id } })); } catch (e) {}
    listeners.forEach(fn => { try { fn(id); } catch (e) {} });
    return true;
  }
  if (root && !valid(root.dataset.theme)) { let v = null; try { v = global.localStorage.getItem(KEY); } catch (e) {} root.dataset.theme = valid(v) ? v : DEFAULT; }

  // ---- the Options section: one card per theme, each a small live picture of a window in that theme
  function mini(t) {
    const h = global.UIKit.h;
    return h('div', { class: 'thm-mini', 'data-theme-preview': t.id }, [
      h('div', { class: 'thm-mhead' }, [h('i'), h('b', { text: 'YOUR TOOL' })]),
      h('div', { class: 'thm-mbody' }, [
        h('div', { class: 'thm-mrow' }, [h('span', { class: 'thm-mbtn on', text: '1/8' }), h('span', { class: 'thm-mbtn', text: '1/4' }), h('span', { class: 'thm-mbtn', text: 'Sync' })]),
        h('div', { class: 'thm-mknobs' }, [0.7, 0.4, 0.85].map(v => h('span', { class: 'thm-mknob', style: { '--v': v } }))),
        h('span', { class: 'thm-mpri', text: '＋ Add' }),
      ])]);
  }
  function panel(onClose) {
    const h = global.UIKit.h, cards = h('div', { class: 'thm-cards' });
    const paint = () => { cards.innerHTML = ''; LIST.forEach(t => {
      const on = get() === t.id, c = h('button', { class: 'thm-card' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', title: t.blurb }, [mini(t),
        h('div', { class: 'thm-tx' }, [h('b', { text: t.label + (on ? '  ✓' : '') }), h('small', { text: t.blurb })]),
        h('div', { class: 'thm-sw' }, t.swatch.map(c2 => h('i', { style: { background: c2 } })))]);
      c.onclick = () => { set(t.id); paint(); }; cards.appendChild(c); }); };
    paint();
    // the button styles: each card shows a real button drawn in that style (data-buttons on the card itself)
    const bcards = h('div', { class: 'thm-btns' });
    const paintB = () => { bcards.innerHTML = ''; BUTTONS.forEach(b => {
      const on = getButtons() === b.id, c = h('button', { class: 'thm-bcard' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', title: b.blurb }, [
        h('span', { class: 'thm-bdemo', 'data-buttons-demo': b.id }, [h('span', { class: 'uk-btn', text: 'Button' }), h('span', { class: 'uk-toggle on', text: 'On' })]),
        h('b', { text: b.label + (on ? '  ✓' : '') }), h('small', { text: b.blurb })]);
      c.onclick = () => { setButtons(b.id); paintB(); }; bcards.appendChild(c); }); };
    paintB();
    const react = h('button', { class: 'thm-link', type: 'button', text: 'Reactive colours — how every colour answers the sound →', onclick: () => { if (onClose) onClose(); const b = doc.getElementById('reactBtn'); if (b) b.click(); } });
    return h('div', { class: 'thm-panel', role: 'dialog', 'aria-label': 'Themes' }, [
      h('div', { class: 'thm-headr' }, [h('b', { text: 'THEMES' }), h('span', { text: 'the whole look in one choice — remembered on this computer' }), h('button', { class: 'thm-x', type: 'button', text: '×', 'aria-label': 'close', onclick: () => onClose && onClose() })]),
      cards, h('div', { class: 'thm-sub' }, [h('b', { text: 'BUTTONS' }), h('span', { text: 'with any theme' })]), bcards, react]);
  }
  // the entry in ⋯ Options (the shell's options slot), opening the section as a popover
  function entry() {
    const slot = doc && doc.getElementById('slot-options'); if (!slot || doc.getElementById('themeBtn') || !global.UIKit) return !!(doc && doc.getElementById('themeBtn'));
    const b = doc.createElement('button'); b.id = 'themeBtn'; b.type = 'button'; b.className = 'tb-btn thm-entry'; b.title = 'Themes — the whole look in one choice';
    const tag = doc.createElement('span'); tag.className = 'thm-tag'; const name = () => { tag.textContent = (LIST.find(t => t.id === get()) || {}).label || ''; };
    b.append(doc.createTextNode('Theme '), tag); name(); listeners.push(name);
    let pop = null; const close = () => { if (pop) { pop.remove(); pop = null; } doc.removeEventListener('keydown', key, true); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    b.onclick = () => { if (pop) return close(); const m = doc.getElementById('optMenu'); if (m) m.hidden = true; pop = h0('div', 'thm-pop'); pop.appendChild(panel(close)); doc.body.appendChild(pop); doc.addEventListener('keydown', key, true);
      pop.addEventListener('mousedown', (e) => { if (e.target === pop) close(); }); };
    slot.insertBefore(b, slot.firstChild); return true;
  }
  const h0 = (tag, cls) => { const e = doc.createElement(tag); e.className = cls; return e; };
  function boot() { if (!entry()) setTimeout(boot, 300); }
  if (doc) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot(); }
  global.Themes = { list: () => LIST.map(t => Object.assign({}, t)), get, set, onChange(fn) { listeners.push(fn); }, panel, DEFAULT,
    buttons: () => BUTTONS.map(b => Object.assign({}, b)), getButtons, setButtons };
})(typeof window !== 'undefined' ? window : globalThis);
