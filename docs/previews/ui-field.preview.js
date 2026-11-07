/* PREVIEW ONLY — the UI from a DAG, laid out by a constraint field (his words, 2026-11-07: "Need the dag for the ui. Like dynamically
 * changes using the constraint field? Like moves around fluidly?"). Runs on the REAL Swarm Oscillator window; nothing is shipped.
 *   the DAG   every control is a node; "matters when" edges (a control does something only in some states: Cluster only in harmonic mode)
 *             and "drives" edges (what part of the sound it moves). Here written from the tool's own rules; built, it is GENERATED from each
 *             tool's config (a `when` on a setting) and its spec's signal_dag.
 *   the field the conditions: the current state (mode, shape), what you touched last, what is moving it (a wire, an LFO), the room there is,
 *             and "power without overwhelm" (at most N on the face). Each control gets a score; the layout is what emerges: the most
 *             relevant come forward in score order, the rest fold into MORE, and what does nothing now rests in NOT IN PLAY, with why.
 *   fluid     every move is animated from where it was (FLIP), so the window re-forms instead of jumping.
 * window.__uiField(state) re-forms the window for { mode, shape, touched } · window.__uiDag() draws the DAG beside it. */
(function () {
  const DEPS = {   // key → [the setting it depends on, the values where it does something, why it rests otherwise]
    coupling: ['mode', ['coupled', 'harmonic', 'chaotic'], 'free: the voices do not pull on each other'], pull: ['mode', ['coupled', 'harmonic', 'chaotic'], 'free: no pull'],
    lfoCouple: ['mode', ['coupled', 'harmonic', 'chaotic'], 'free: no pull to move'], restless: ['mode', ['coupled', 'harmonic', 'chaotic'], 'free: nothing locks, so nothing bursts'],
    cohTone: ['mode', ['coupled', 'harmonic', 'chaotic'], 'free: it never locks'], cluster: ['mode', ['harmonic'], 'only in harmonic mode'], form: ['mode', ['harmonic'], 'only in harmonic mode'],
    table: ['shape', ['table'], 'only with the table shape'],
  };
  const DRIVES = { voices: 'swarm', spread: 'swarm', coupling: 'swarm', pull: 'swarm', drift: 'swarm', cluster: 'swarm', restless: 'swarm', form: 'swarm', fieldFm: 'osc', table: 'osc', sub: 'osc', octave: 'osc',
    cutoff: 'filter', res: 'filter', envAmt: 'filter', cohTone: 'filter', attack: 'amp', decay: 'amp', sustain: 'amp', release: 'amp', lfoRate: 'motion', lfoCouple: 'motion', width: 'out', level: 'out', monoBelow: 'out' };
  const BASE = { voices: 6, spread: 6, coupling: 8, cutoff: 7, res: 5, attack: 5, release: 5, level: 4, width: 3, pull: 4, drift: 4, cluster: 3, table: 3, sub: 3, octave: 2, envAmt: 3, decay: 3, sustain: 3,
    lfoRate: 3, lfoCouple: 3, monoBelow: 1, restless: 4, form: 3, fieldFm: 4, cohTone: 3 };
  const BOOST = { harmonic: { cluster: 7, form: 6 }, chaotic: { coupling: 3, restless: 3 }, coupled: { coupling: 2, restless: 2 }, free: { spread: 3, drift: 4 } };
  const FACE = 10;
  let W = null, wrap = null, face = null, more = null, rest = null;
  function setup() {
    const win = [...document.querySelectorAll('.wm-win')].find(w => /SWARM/i.test(w.textContent)); if (!win) throw new Error('open the Swarm Oscillator first');
    W = win; const deepB = [...win.querySelectorAll('button')].find(b => /More depth/.test(b.textContent)); if (deepB && /▸/.test(deepB.textContent)) deepB.click();
    const ctrls = [...win.querySelectorAll('[data-key]')]; const host = ctrls[0].closest('.uk-panel').parentElement;
    [...host.querySelectorAll('.uk-panel')].forEach(p => { p.style.display = 'none'; }); if (deepB) deepB.parentElement.style.display = 'none';
    const sec = (title, cls) => { const s = document.createElement('div'); s.className = 'uk-group uf-' + cls; s.innerHTML = '<div class="uk-group-title">' + title + '</div><div class="uk-row uf-row"></div>'; return s; };
    wrap = document.createElement('div'); wrap.className = 'uk-panel uf-wrap'; face = sec('IN PLAY — MOST RELEVANT NOW', 'face'); more = sec('MORE', 'more'); rest = sec('NOT IN PLAY', 'rest');
    wrap.append(face, more, rest); host.appendChild(wrap);
    const st = document.createElement('style'); st.textContent = '.uf-row{display:flex;flex-wrap:wrap;gap:6px 4px;min-height:20px}.uf-rest [data-key]{opacity:.32;transform-origin:center}.uf-rest .uf-why{display:block}.uf-why{display:none;font:400 9px ui-monospace,monospace;color:#6c7a8c;text-align:center;max-width:86px;margin-top:2px}.uf-more [data-key]{transform:scale(.86)}.uf-score{position:absolute;top:-6px;right:-2px;font:400 8px ui-monospace,monospace;color:#00d4ff;opacity:.7}.uf-cell{position:relative;display:flex;flex-direction:column;align-items:center}';
    document.head.appendChild(st);
    ctrls.forEach(c => { const cell = document.createElement('div'); cell.className = 'uf-cell'; cell.dataset.cell = c.dataset.key; c.replaceWith(cell); cell.appendChild(c);
      const why = document.createElement('span'); why.className = 'uf-why'; cell.appendChild(why); const sc = document.createElement('span'); sc.className = 'uf-score'; cell.appendChild(sc); more.querySelector('.uf-row').appendChild(cell); });
  }
  window.__uiField = function (state) {
    if (!W) setup(); state = Object.assign({ mode: 'coupled', shape: 'saw', touched: null }, state || {});
    const cells = [...W.querySelectorAll('.uf-cell')];
    const score = (k) => { const d = DEPS[k]; if (d && !d[1].includes(state[d[0]])) return -1; return (BASE[k] || 1) + ((BOOST[state.mode] || {})[k] || 0) + (state.touched === k ? 6 : 0) + (k === 'table' && state.shape === 'table' ? 6 : 0); };
    const before = new Map(cells.map(c => [c, c.getBoundingClientRect()]));
    const ranked = cells.map(c => [c, score(c.dataset.cell)]).sort((a, b) => b[1] - a[1]);
    let n = 0; ranked.forEach(([c, s]) => { const k = c.dataset.cell, dst = s < 0 ? rest : n++ < FACE ? face : more; dst.querySelector('.uf-row').appendChild(c);
      c.querySelector('.uf-why').textContent = s < 0 ? DEPS[k][2] : ''; c.querySelector('.uf-score').textContent = s < 0 ? '' : String(s); });
    rest.querySelector('.uk-group-title').textContent = 'NOT IN PLAY — ' + state.mode.toUpperCase() + ' MODE' + (state.shape !== 'table' ? ' · ' + state.shape.toUpperCase() : '');
    // FLIP: each control starts where it was and glides to where the field put it
    cells.forEach(c => { const a = before.get(c), b = c.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top; if (!dx && !dy) return;
      c.style.transition = 'none'; c.style.transform = `translate(${dx}px, ${dy}px)`; requestAnimationFrame(() => { c.style.transition = 'transform 420ms cubic-bezier(.2,.8,.2,1)'; c.style.transform = ''; }); });
    return ranked.map(([c, s]) => c.dataset.cell + ':' + s);
  };
  // the DAG, drawn beside the window: the two settings the others depend on, every control, what it drives
  window.__uiDag = function (x, y, w, h, state) {
    state = Object.assign({ mode: 'coupled', shape: 'saw' }, state || {}); let cv = document.getElementById('uf-dag'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'uf-dag'; document.body.appendChild(cv); }
    const d = 2; Object.assign(cv.style, { position: 'fixed', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: 99999, background: '#050608', border: '1px solid #1a2230', borderRadius: '8px' });
    cv.width = w * d; cv.height = h * d; const g = cv.getContext('2d'); g.scale(d, d); g.fillStyle = '#050608'; g.fillRect(0, 0, w, h);
    const keys = Object.keys(BASE), stages = ['swarm', 'osc', 'filter', 'amp', 'motion', 'out'], colX = [40, w * 0.42, w - 70];
    const yOf = (i, n) => 36 + i * ((h - 56) / Math.max(1, n - 1));
    const src = { mode: [colX[0], h * 0.35], shape: [colX[0], h * 0.7] }, ctl = {}, stg = {};
    keys.forEach((k, i) => { ctl[k] = [colX[1], yOf(i, keys.length)]; }); stages.forEach((s, i) => { stg[s] = [colX[2], yOf(i, stages.length) * 0.8 + h * 0.1]; });
    const on = (k) => { const dd = DEPS[k]; return !dd || dd[1].includes(state[dd[0]]); };
    keys.forEach(k => { const dd = DEPS[k]; if (dd) { const [ax, ay] = src[dd[0]], [bx, by] = ctl[k]; g.strokeStyle = on(k) ? 'rgba(0,212,255,.55)' : 'rgba(80,90,110,.35)'; g.setLineDash(on(k) ? [] : [3, 3]); g.beginPath(); g.moveTo(ax + 30, ay); g.bezierCurveTo(ax + 120, ay, bx - 120, by, bx - 6, by); g.stroke(); g.setLineDash([]); }
      const [cx, cy] = ctl[k], [sx, sy] = stg[DRIVES[k]]; g.strokeStyle = on(k) ? 'rgba(138,92,255,.4)' : 'rgba(60,66,80,.25)'; g.beginPath(); g.moveTo(cx + 64, cy); g.bezierCurveTo(cx + 140, cy, sx - 100, sy, sx - 8, sy); g.stroke(); });
    g.font = '10px ui-monospace, monospace';
    Object.entries(src).forEach(([k, [px, py]]) => { g.fillStyle = '#0b1320'; g.strokeStyle = '#00d4ff'; g.fillRect(px - 30, py - 10, 60, 20); g.strokeRect(px - 30, py - 10, 60, 20); g.fillStyle = '#e8f6ff'; g.textAlign = 'center'; g.fillText(k.toUpperCase(), px, py - 14); g.fillText(state[k], px, py + 4); });
    keys.forEach(k => { const [px, py] = ctl[k]; g.fillStyle = on(k) ? '#cfe6ff' : '#4a5566'; g.textAlign = 'left'; g.fillText(k, px, py + 3); });
    stages.forEach(s => { const [px, py] = stg[s]; g.fillStyle = '#140f22'; g.strokeStyle = '#8a5cff'; g.fillRect(px - 8, py - 9, 64, 18); g.strokeRect(px - 8, py - 9, 64, 18); g.fillStyle = '#d8c8ff'; g.textAlign = 'left'; g.fillText(s.toUpperCase(), px - 2, py + 3); });
    g.fillStyle = '#6c7a8c'; g.textAlign = 'left'; g.fillText('THE UI DAG — SETTINGS → CONTROLS (MATTERS WHEN) → THE SOUND (DRIVES)', 12, 16); g.fillText('dashed: does nothing in this state', 12, h - 8);
  };
})();
