/* ERAVOS music — react-panel.js · 3.74d the Reactive colours panel (his words: "that panel, do it right this time … worth the space it
 * takes up" · "give each tool the ability to adjust it … in the settings for each tool").
 * One panel, two places: ⋯ Options → Reactive colours (the app's) and every tool's ⚙ settings (that tool's own: Follow the app, or its
 * own mode / amount / colours, saved with the tool). Each mode is a card with a LIVE preview of what it does — the same colour code
 * the app runs (SoundCSS.colourFor) on a beat played for the preview — so you see the difference before you pick. Amount is a
 * wide slider with its value; Custom has three swatches (low end · top · hits) and ready palettes. */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const S = () => global.SoundCSS;
  const MODES = [
    ['follow', 'Follow the app', 'whatever ⋯ Options says'],
    ['off', 'Off', 'its colours stay as designed'],
    ['static', 'Static', 'each colour keeps its hue — its light follows the sound'],
    ['changing', 'Changing', 'colours travel round the wheel with what it plays'],
    ['custom', 'Custom', 'colours lean toward your three with the sound'],
  ];
  const PALETTES = [
    ['Neon', { low: '#ff2266', high: '#00d4ff', hit: '#ffffff' }], ['Sunset', { low: '#ff3b00', high: '#ff9ad5', hit: '#ffe066' }],
    ['Ice', { low: '#2a5bff', high: '#9ff6ff', hit: '#ffffff' }], ['Toxic', { low: '#00ff6a', high: '#d4ff00', hit: '#ffffff' }],
    ['Royal', { low: '#7a00ff', high: '#ff00c8', hit: '#ffd700' }], ['Ember', { low: '#ff1a00', high: '#ff8c00', hit: '#fff1b0' }],
  ];
  const el = (tag, cls, txt) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const stop = (e) => { ['pointerdown', 'keydown', 'wheel', 'click'].forEach(t => e.addEventListener(t, x => x.stopPropagation())); return e; };

  // the beat the previews dance to: a kick every half second, hats between, a slow sweep of brightness
  function beat(t) {
    const ph = (t % 0.5) / 0.5, kick = Math.exp(-ph * 7), hat = Math.exp(-(((t + 0.25) % 0.25) / 0.25) * 12) * 0.4, sweep = 0.5 + 0.5 * Math.sin(t * 0.7);
    return { level: Math.min(1, 0.3 + kick * 0.7 + hat),   // a floor: every preview always shows what its mode does
      low: kick, high: 0.25 + 0.5 * sweep + hat * 0.5, pulse: ph < 0.08 ? 1 - ph / 0.08 : 0, bright: sweep, t };
  }

  function build(o) {
    o = o || {}; const tool = o.scope === 'tool' && o.view, view = tool ? o.view : null;
    const box = stop(el('div', 'rcp' + (tool ? ' rcp-tool' : '')));
    const get = () => {   // what this panel edits: the app's settings, or the tool's own
      if (!tool) return { mode: S().mode, amount: S().amount, colors: S().colors };
      const x = (view.state && view.state._react) || { mode: 'follow' };
      return { mode: x.mode || 'follow', amount: typeof x.amount === 'number' ? x.amount : S().amount, colors: Object.assign({}, S().colors, x.colors || {}) };
    };
    const put = (patch) => {
      if (!tool) { if (patch.mode) S().setMode(patch.mode); if (patch.amount !== undefined) S().setAmount(patch.amount); if (patch.colors) S().setColors(patch.colors); return; }
      const cur = get(), next = { mode: patch.mode || cur.mode, amount: patch.amount !== undefined ? patch.amount : cur.amount, colors: Object.assign({}, cur.colors, patch.colors || {}) };
      view.emit('config_change', { key: '_react', value: next }); if (S().rescan) S().rescan(); setTimeout(paint, 0);
    };
    // the colours a preview shows: this tool's own (its accent and the colours inside it), or the app's palette
    const swatchesOf = () => {
      if (tool) { const w = view.root && view.root.closest && view.root.closest('.wm-win'), acc = (view.descriptor && view.descriptor.accent) || '#00d4ff', out = [acc];
        if (w) w.querySelectorAll('[style*="--"]').forEach(e => { if (out.length >= 6) return; for (let i = 0; i < e.style.length; i++) { const n = e.style[i]; if (n.startsWith('--') && n !== '--acc') { const v = (e._cb && e._cb[n]) || e.style.getPropertyValue(n).trim(); if (/^#[0-9a-f]{6}$/i.test(v) && !out.includes(v)) out.push(v); } } });
        return out.concat(['#00d4ff', '#ff2266', '#00ff88', '#b066ff', '#ffaa00']).slice(0, 6); }
      return ['#00d4ff', '#ff2266', '#00ff88', '#b066ff', '#ffaa00', '#ff3355'];
    };
    let SW = swatchesOf();
    const head = el('div', 'rcp-head'); if (!tool) head.append(el('span', 'rcp-dot'), el('span', 'rcp-title', 'Reactive colours')); head.append(el('span', 'rcp-sub', tool ? 'This tool’s accent and every colour inside it — follow the app, or its own way.' : 'how every colour in ERAVOS answers the sound'));
    const cards = el('div', 'rcp-modes'), previews = [];
    MODES.filter(([m]) => tool || m !== 'follow').forEach(([m, name, desc]) => {
      const c = el('button', 'rcp-card'); c.dataset.mode = m; c.type = 'button'; c.setAttribute('role', 'radio'); c.title = desc;
      const cv = el('canvas', 'rcp-pv'); cv.width = 240; cv.height = 72; previews.push([cv, m]);
      c.append(cv, el('b', 'rcp-name', name), el('span', 'rcp-desc', desc));
      c.addEventListener('click', () => { put({ mode: m }); paint(); }); cards.appendChild(c);
    });
    const amtRow = el('div', 'rcp-amt'), amtLab = el('span', 'rcp-lab', 'Amount'), amt = el('input', 'rcp-range'), amtVal = el('span', 'rcp-val');
    amt.type = 'range'; amt.min = '0'; amt.max = '100'; amt.setAttribute('aria-label', 'Reactive colours amount');
    amt.addEventListener('input', () => { const v = amt.value / 100; amtVal.textContent = amt.value + '%'; amt.style.setProperty('--v', amt.value + '%'); put({ amount: v }); });
    const ends = el('div', 'rcp-ends'); ends.append(el('span', '', 'subtle'), el('span', '', 'wild'));
    const amtMain = el('div', 'rcp-amtmain'); amtMain.append(amt, ends); amtRow.append(amtLab, amtMain, amtVal);
    const cust = el('div', 'rcp-custom'), sws = el('div', 'rcp-sws'), pals = el('div', 'rcp-pals');
    [['low', 'Low end'], ['high', 'Top'], ['hit', 'Hits']].forEach(([k, t]) => {
      const lab = el('label', 'rcp-sw'), i = el('input'), chip = el('span', 'rcp-chip'); i.type = 'color'; i.dataset.k = k; i.setAttribute('aria-label', t + ' colour');
      i.addEventListener('input', () => { chip.style.background = i.value; put({ colors: { [k]: i.value } }); });
      lab.append(chip, i, el('span', 'rcp-swl', t)); sws.appendChild(lab);
    });
    PALETTES.forEach(([n, c]) => { const b = el('button', 'rcp-pal'); b.type = 'button'; b.title = n; b.style.setProperty('--a', c.low); b.style.setProperty('--b', c.high); b.style.setProperty('--c', c.hit);
      b.append(el('i'), el('span', '', n)); b.addEventListener('click', () => { put({ mode: 'custom', colors: c }); paint(); }); pals.appendChild(b); });
    cust.append(el('span', 'rcp-lab', 'Your colours'), sws, el('span', 'rcp-lab', 'Or a palette'), pals);
    const foot = el('div', 'rcp-foot', tool ? 'Saved with this tool. “Follow the app” uses ⋯ Options → Reactive colours.' : 'Remembered on this computer. Any tool can have its own: ⚙ → Reactive colours.');
    box.append(head, cards, amtRow, cust, foot);

    function paint() {
      const g = get(), eff = g.mode === 'follow' ? S().mode : g.mode;
      cards.querySelectorAll('.rcp-card').forEach(c => { const on = c.dataset.mode === g.mode; c.classList.toggle('on', on); c.setAttribute('aria-checked', on ? 'true' : 'false'); });
      amt.value = String(Math.round(g.amount * 100)); amt.style.setProperty('--v', amt.value + '%'); amtVal.textContent = amt.value + '%';
      amtRow.classList.toggle('dim', eff === 'off' || g.mode === 'follow'); amt.disabled = eff === 'off' || g.mode === 'follow';
      cust.hidden = eff !== 'custom'; sws.querySelectorAll('input').forEach(i => { i.value = g.colors[i.dataset.k]; i.previousSibling.style.background = i.value; });
    }
    // the previews: one loop for all of them while the panel is on screen
    let raf = 0, t0 = performance.now();
    const R = (x, y, w, h, r, g) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    function frame() {
      raf = global.requestAnimationFrame(frame); if (!box.isConnected) { if (box._wasOn) global.cancelAnimationFrame(raf); return; } box._wasOn = true;
      const t = (performance.now() - t0) / 1000, B = beat(t), g0 = get(), amtNow = g0.amount;
      previews.forEach(([cv, m]) => {
        const g = cv.getContext('2d'), W = cv.width, H = cv.height, md = m === 'follow' ? S().mode : m; g.clearRect(0, 0, W, H);
        const shift = (B.bright - 0.5) * 200 + Math.sin(t * 0.8) * 40 + B.pulse * 40;
        const opt = { mode: md, amt: amtNow, shift: shift * amtNow, colors: g0.colors, low: B.low, high: B.high, pulse: B.pulse };
        const k = Math.max(0, Math.min(1, (B.level * 0.85 + B.pulse * 0.25) * amtNow * 1.25)), n = SW.length, bw = (W - 16) / n;
        SW.forEach((c, i) => {
          const col = md === 'off' ? c : S().colourFor(c, k, opt), hgt = (md === 'off' ? 0.55 : 0.35 + 0.6 * Math.min(1, B.level * (0.7 + 0.3 * Math.sin(i * 1.7 + t * 3)))) * (H - 12);
          g.fillStyle = 'rgba(255,255,255,.04)'; R(8 + i * bw + 2, 6, bw - 4, H - 12, 3, g); g.fill();
          g.fillStyle = col; g.shadowColor = col; g.shadowBlur = md === 'off' ? 0 : 6 + 10 * k; R(8 + i * bw + 2, H - 6 - hgt, bw - 4, hgt, 3, g); g.fill(); g.shadowBlur = 0;
        });
      });
    }
    raf = global.requestAnimationFrame(frame);
    if (tool) view.bind('_react', () => paint()); if (S().onChange) S().onChange(() => paint());
    setTimeout(() => { SW = swatchesOf(); }, 200);
    paint();
    return box;
  }

  // ⋯ Options: one line that says the mode; it opens the panel beside the menu
  function optionsEntry() {
    const slot = doc.getElementById('slot-options'); if (!slot || doc.getElementById('reactBtn')) return false;
    const b = el('button', 'tb-btn rcp-entry'); b.id = 'reactBtn'; b.type = 'button'; b.title = 'Reactive colours — how every colour answers the sound';
    const say = () => { const m = S().mode; b.innerHTML = ''; b.append(el('span', 'rcp-entry-l', '◐ Reactive colours'), el('span', 'rcp-entry-m rcp-m-' + m, ({ off: 'Off', static: 'Static', changing: 'Changing', custom: 'Custom' })[m])); };
    let pop = null;
    const close = () => { if (pop) { pop.remove(); pop = null; doc.removeEventListener('pointerdown', away, true); } };
    const away = (e) => { if (pop && !pop.contains(e.target) && e.target !== b && !b.contains(e.target)) close(); };
    b.addEventListener('click', (e) => { e.stopPropagation(); if (pop) { close(); return; }
      pop = el('div', 'rcp-pop'); pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Reactive colours'); pop.appendChild(build({ scope: 'app' }));
      const x = el('button', 'rcp-x', '✕'); x.title = 'close (Esc)'; x.addEventListener('click', (e2) => { e2.stopPropagation(); close(); }); pop.appendChild(x);
      const esc = (e2) => { if (e2.key === 'Escape' && pop) { e2.stopPropagation(); close(); doc.removeEventListener('keydown', esc, true); } }; doc.addEventListener('keydown', esc, true);
      doc.body.appendChild(pop); const r = b.getBoundingClientRect(), W = global.innerWidth;
      pop.style.top = Math.max(8, r.top) + 'px'; pop.style.left = Math.max(8, Math.min(W - pop.offsetWidth - 8, r.left - pop.offsetWidth - 10)) + 'px';
      setTimeout(() => doc.addEventListener('pointerdown', away, true), 0); });
    if (S().onChange) S().onChange(say); say(); slot.appendChild(b); return true;
  }
  function boot() { if (!S()) return setTimeout(boot, 200); if (!optionsEntry() && !doc.getElementById('reactBtn')) setTimeout(boot, 400);
    if (global.ToolSettings && !boot._ts) { boot._ts = true; global.ToolSettings.addSection({ id: 'reactive', label: 'Reactive colours', order: 40,
      when: (d) => d.domain === 'music' && (d.config || []).some(c => c.key === '_react'), make: (rec, K, view) => build({ scope: 'tool', view }) }); } }
  global.ReactPanel = { build, PALETTES };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);
