/* ERAVOS music — motion-ui.js · 3.71b the window side of core/motion.js: tabs, the Motion panel and the Perform panel.
 * Built from the app's own controls (knobs, .uk-seg, .uk-btn, selects) so a tool that opts in looks like every other tool.
 *   UI.pageTabsFor(view)      the Motion and Perform tabs a tool's page shows (canvas/runtime/tool-page.js asks for them)
 *   UI.motionPanel(view)      the knobs that move on their own: shape · rate · depth · phase, a live picture of each, steps editor
 *   UI.performPanel(view)     an XY pad + the four macro knobs; each macro lists the knobs it turns (chips), Learn by turning one */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc || !global.UIKit) return;
  const UI = global.UIKit, h = UI.h, M = () => global.MusicMotion;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const knobsOf = (view) => (view.descriptor.config || []).filter(c => (c.type === 'number' || c.type === 'integer') && !c.hidden && !c.perform && c.motion !== false && c.max > c.min);
  const labelOf = (view, k) => { const c = (view.descriptor.config || []).find(x => x.key === k); return c ? (c.label || k) : k; };
  const rateLabel = (b) => { const r = M().RATES.find(([v]) => Math.abs(v - b) < 1e-6); return r ? r[1] : (+b).toFixed(2) + ' beats'; };
  const stop = (el) => { ['pointerdown', 'keydown', 'wheel'].forEach(t => el.addEventListener(t, e => e.stopPropagation())); return el; };
  function select(options, value, onChange, cls) {
    const s = h('select', { class: 'uk-select mo-sel' + (cls ? ' ' + cls : '') }, options.map(([v, l]) => h('option', { value: String(v), text: l })));
    s.value = String(value); s.addEventListener('change', () => onChange(s.value)); stop(s); return s;
  }

  // ---------------------------------------------------------------- tabs
  function toolTabs(view, tabs, o) {
    o = o || {}; let cur = tabs[0].id;
    try { const k = 'eravos.tab.' + view.descriptor.id, v = global.sessionStorage && global.sessionStorage.getItem(k); if (v && tabs.some(t => t.id === v)) cur = v; } catch (e) {}
    const panes = tabs.map(t => { const p = h('div', { class: 'mo-pane', 'data-tab': t.id }, [t.el]); return p; });
    const bar = UI.Segmented({ options: tabs.map(t => ({ value: t.id, label: t.label, hint: t.hint || '' })), value: cur, onChange: (v) => show(v) });
    bar.el.classList.add('mo-tabs');
    function show(id) { cur = id; panes.forEach(p => { p.hidden = p.dataset.tab !== id; }); bar.set && bar.set(id); tabs.forEach(t => { if (t.id === id && t.onShow) t.onShow(); }); try { global.sessionStorage.setItem('eravos.tab.' + view.descriptor.id, id); } catch (e) {} }
    const el = h('div', { class: 'mo-tabbed' }, [h('div', { class: 'mo-tabrow' }, [bar.el].concat(o.right ? [o.right] : [])), ...panes]);
    show(cur);
    return { el, show, get current() { return cur; } };
  }

  // ---------------------------------------------------------------- 3.72b the look: drawn shape tiles, a live scope, a steps editor
  const SHAPE_ICON = { sine: 'M2 14 C 8 0, 14 0, 20 14 S 32 28, 38 14', triangle: 'M2 22 L11 4 L29 24 L38 6', saw: 'M2 4 L20 24 L20 4 L38 24', ramp: 'M2 24 L20 4 L20 24 L38 4',
    square: 'M2 22 L2 6 L20 6 L20 22 L38 22 L38 6', random: 'M2 18 H8 V6 H14 V20 H20 V10 H26 V24 H32 V12 H38', smooth: 'M2 18 C 6 6, 10 6, 14 14 S 22 24, 26 12 S 34 4, 38 16',
    steps: 'M2 24 V16 H10 V8 H18 V20 H26 V4 H34 V14 H38', follow: 'M2 14 L6 10 L9 18 L12 6 L15 22 L18 9 L21 17 L24 12 L27 15 L30 13 L34 14 L38 14' };
  function shapeTiles(cur, onPick) {
    const el = h('div', { class: 'mo-shapes', role: 'radiogroup', 'aria-label': 'shape' });
    M().SHAPES.forEach(sh => {
      const t = h('button', { class: 'mo-tile' + (sh === cur ? ' on' : ''), title: M().SHAPE_LABEL[sh], role: 'radio', 'aria-checked': sh === cur ? 'true' : 'false',
        html: `<svg width="40" height="28" viewBox="0 0 40 28" aria-hidden="true"><path d="${SHAPE_ICON[sh]}"/></svg>` });
      t.addEventListener('click', (e) => { e.stopPropagation(); onPick(sh); }); el.appendChild(t);
    });
    return el;
  }
  function scope(view, getM) {
    const cv = UI.Canvas(360, 64); cv.classList.add('mo-scope');
    UI.loop(cv, () => {
      const g = cv.g, W = cv.fit().W, H = cv.H, m = getM(); g.clearRect(0, 0, W, H); if (!m) return;
      const acc = getComputedStyle(cv).getPropertyValue('--acc').trim() || '#ffaa00';
      g.strokeStyle = 'rgba(127,147,168,.16)'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.stroke(); }
      g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      const at = (c) => m.shape === 'follow' ? Math.sin(c * 9) * 0.5 * Math.abs(Math.sin(c * 3)) : M().shapeAt(m.shape, c, 11, m.steps);
      g.strokeStyle = acc; g.lineWidth = 2; g.shadowColor = acc; g.shadowBlur = 8; g.beginPath();
      for (let x = 0; x <= W; x++) { const y = H / 2 - at(x / W * 2 + m.phase) * m.depth * (H / 2 - 4); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.shadowBlur = 0;
      const ac = view.ac, beats = ac ? ac.currentTime * ((view.K && view.K.music && view.K.music.bpm) || 120) / 60 : 0, c = (beats / m.beats) % 2, px = c / 2 * W, py = H / 2 - at(c + m.phase) * m.depth * (H / 2 - 4);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 3, 0, Math.PI * 2); g.fill();
    }, 30);
    return cv;
  }
  function stepsEditor(m, onChange) {
    const cv = UI.Canvas(360, 56); cv.classList.add('mo-steps'); let down = false;
    UI.loop(cv, () => {
      const g = cv.g, W = cv.fit().W, H = cv.H, s = m.steps, w = W / s.length, acc = getComputedStyle(cv).getPropertyValue('--acc').trim() || '#ffaa00'; g.clearRect(0, 0, W, H);
      s.forEach((v, i) => { g.fillStyle = 'rgba(127,147,168,.08)'; g.fillRect(i * w + 2, 2, w - 4, H - 4); const y = H / 2 - v * (H / 2 - 3); g.fillStyle = acc; g.shadowColor = acc; g.shadowBlur = 6; g.fillRect(i * w + 3, Math.min(y, H / 2), w - 6, Math.max(2, Math.abs(y - H / 2))); g.shadowBlur = 0; });
      g.fillStyle = 'rgba(127,147,168,.25)'; g.fillRect(0, H / 2, W, 1);
    }, 15);
    const set = (e) => { const r = cv.getBoundingClientRect(), i = clamp(Math.floor((e.clientX - r.left) / r.width * m.steps.length), 0, m.steps.length - 1); m.steps[i] = +clamp(1 - 2 * (e.clientY - r.top) / r.height, -1, 1).toFixed(2); };
    cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} set(e); });
    cv.addEventListener('pointermove', (e) => { if (down) set(e); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { if (down) { down = false; onChange(); } }));
    return cv;
  }
  const head = (title, right) => h('div', { class: 'mo-head' }, [h('span', { class: 'mo-dot' }), h('span', { class: 'mo-cap', text: title }), h('span', { class: 'mo-rule' })].concat(right || []));

  // ---------------------------------------------------------------- MOTION: slots for the moving knobs, then the chosen one's shape, rate, depth, phase
  function motionPanel(view) {
    const el = h('div', { class: 'mo-panel mo-motion' });
    const list = () => M().cleanMotion(view.state._motion);
    let sig = '', sel = null;
    const save = (arr, keep) => { if (keep) sig = JSON.stringify(arr); view.emit('config_change', { key: '_motion', value: arr }); };   // keep: a value turned here — no rebuild under the hand
    function paint() {
      el.innerHTML = '';
      const ms = list(), free = knobsOf(view).filter(c => !ms.some(m => m.key === c.key));
      if (!ms.some(m => m.key === sel)) sel = ms.length ? ms[0].key : null;
      const add = select([['', '＋ Move a knob']].concat(free.map(c => [c.key, c.label || c.key])), '', (k) => { if (!k) return; sel = k; save(ms.concat([{ key: k, shape: 'sine', beats: 4, depth: 0.5, phase: 0 }])); }, 'mo-addsel');
      el.appendChild(head('Motion', [h('span', { class: 'mo-count', text: ms.length ? ms.length + ' moving' : 'none moving' }), add]));
      if (!ms.length) { el.appendChild(h('div', { class: 'mo-empty', text: 'Pick a knob above and it moves on its own, in time with the song. Or right-click any knob.' })); return; }
      // the slots
      el.appendChild(h('div', { class: 'mo-slots' }, ms.map(m => {
        const b = h('button', { class: 'mo-slot' + (m.key === sel ? ' sel' : '') + (m.off ? ' off' : ''), text: labelOf(view, m.key), title: 'edit how ' + labelOf(view, m.key) + ' moves' });
        b.addEventListener('click', (e) => { e.stopPropagation(); sel = m.key; paint(); }); return b;
      })));
      const i = ms.findIndex(m => m.key === sel), m = ms[i];
      const upd = (patch, keep) => { const arr = list(); Object.assign(arr[i], patch); if (patch.shape === 'steps' && !arr[i].steps) arr[i].steps = [1, 0.5, 0, -0.5, -1, -0.5, 0, 0.5]; save(arr, keep); };
      el.appendChild(h('div', { class: 'mo-lab', text: 'Shape — ' + labelOf(view, m.key) }));
      el.appendChild(shapeTiles(m.shape, (sh) => upd({ shape: sh })));
      const rate = m.shape === 'follow' ? h('span', { class: 'mo-lcd', text: 'THE MIX' }) : UI.Segmented({ options: M().RATES.map(([v, l]) => ({ value: v, label: l.toUpperCase() })), value: M().RATES.some(([v]) => Math.abs(v - m.beats) < 1e-6) ? M().RATES.find(([v]) => Math.abs(v - m.beats) < 1e-6)[0] : 4, onChange: (v) => upd({ beats: +v }) }).el;
      const depth = UI.Knob({ key: 'depth', label: 'Depth', min: -1, max: 1, step: 0.01, value: m.depth, size: 46, format: (v) => (v > 0 ? '+' : '') + v.toFixed(2), onChange: (v) => upd({ depth: v }, true) });
      const phase = UI.Knob({ key: 'phase', label: 'Phase', min: 0, max: 1, step: 0.01, value: m.phase, size: 46, format: (v) => Math.round(v * 360) + '°', onChange: (v) => upd({ phase: v }, true) });
      depth.el.classList.add('mo-modknob'); phase.el.classList.add('mo-modknob');
      el.appendChild(h('div', { class: 'mo-lab', text: 'Rate' })); el.appendChild(h('div', { class: 'mo-rate' }, [rate]));
      el.appendChild(h('div', { class: 'mo-edit' }, [scope(view, () => list()[i]), depth.el, phase.el]));
      if (m.shape === 'steps') el.appendChild(h('div', { class: 'mo-stepsrow' }, [stepsEditor(m, () => upd({ steps: m.steps.slice() }, true)),
        UI.Button({ label: '−', hint: 'fewer steps', onClick: () => upd({ steps: m.steps.slice(0, Math.max(2, m.steps.length - 1)) }) }).el,
        UI.Button({ label: '+', hint: 'more steps', onClick: () => upd({ steps: m.steps.concat([0]).slice(0, 16) }) }).el]));
      const on = UI.Toggle({ label: m.off ? 'OFF' : 'ON', value: !m.off, hint: 'pause this movement (it keeps its settings)', onChange: (v) => upd({ off: !v }) });
      el.appendChild(h('div', { class: 'mo-foot' }, [h('span', { class: 'mo-note', text: 'SYNCED TO THE SONG · THE KNOB KEEPS ITS OWN VALUE' }), on.el,
        UI.Button({ label: 'Remove', hint: 'stop moving this knob', onClick: () => save(list().filter((_, j) => j !== i)) }).el]));
    }
    const repaint = () => { const s = JSON.stringify(M().cleanMotion(view.state._motion)); if (s === sig && el.childNodes.length) return; sig = s; paint(); };
    view.bind('_motion', repaint); view.on('state_sync', repaint); repaint(); stop(el);
    return { el, repaint };
  }

  // ---------------------------------------------------------------- PERFORM: the XY pad (with its trail) and four macro cards
  const MAC_COL = ['#ff2266', '#ffaa00', '#00d4ff', '#b066ff'];
  function performPanel(view) {
    const el = h('div', { class: 'mo-panel mo-perform' }), MAC = M().MACROS;
    const pf = () => M().cleanPerform(view.state._perform);
    let sig = '';
    const save = (p, keep) => { if (keep) sig = JSON.stringify(p); view.emit('config_change', { key: '_perform', value: p }); };
    const live = {}; view.on('param_live', (p) => { if (p && MAC.includes(p.key)) live[p.key] = p.value; });
    const val = (k) => (live[k] !== undefined && live[k] !== null ? live[k] : +view.state[k] || 0);
    // the pad: X and Y each turn a macro; where it has been fades behind it
    const pad = UI.Canvas(200, 200); pad.classList.add('mo-xy'); let down = false, lastSend = 0; const trail = [];
    UI.loop(pad, () => {
      const g = pad.g, W = pad.fit().W, H = pad.H, p = pf(), cx = MAC_COL[p.xy.x], cy = MAC_COL[p.xy.y]; g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(127,147,168,.12)'; g.lineWidth = 1; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(i * W / 6, 0); g.lineTo(i * W / 6, H); g.moveTo(0, i * H / 6); g.lineTo(W, i * H / 6); g.stroke(); }
      const x = val(MAC[p.xy.x]) * W, y = (1 - val(MAC[p.xy.y])) * H, last = trail[trail.length - 1];
      if (!last || Math.hypot(last[0] - x, last[1] - y) > 1) trail.push([x, y]); if (trail.length > 48) trail.shift();
      trail.forEach((q, i) => { g.fillStyle = cx; g.globalAlpha = i / trail.length * 0.45; g.beginPath(); g.arc(q[0], q[1], 2 + i / trail.length * 3, 0, Math.PI * 2); g.fill(); }); g.globalAlpha = 1;
      g.strokeStyle = cx; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); g.strokeStyle = cy; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.globalAlpha = 1;
      g.shadowColor = cx; g.shadowBlur = 16; g.fillStyle = cx; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
      g.font = '600 9px monospace'; g.fillStyle = 'rgba(214,228,240,.55)'; g.fillText('X · ' + p.names[p.xy.x].toUpperCase(), 6, H - 6);
      g.save(); g.translate(12, H - 24); g.rotate(-Math.PI / 2); g.fillText('Y · ' + p.names[p.xy.y].toUpperCase(), 0, 0); g.restore();
    }, 30);
    const fromPad = (e, force) => {
      const r = pad.getBoundingClientRect(), p = pf(), x = +clamp((e.clientX - r.left) / r.width, 0, 1).toFixed(3), y = +clamp(1 - (e.clientY - r.top) / r.height, 0, 1).toFixed(3), now = performance.now();
      if (!force && now - lastSend < 30) return; lastSend = now;
      view.emit('config_change', { key: MAC[p.xy.x], value: x }); if (p.xy.y !== p.xy.x) view.emit('config_change', { key: MAC[p.xy.y], value: y });
    };
    pad.addEventListener('pointerdown', (e) => { e.stopPropagation(); down = true; try { pad.setPointerCapture(e.pointerId); } catch (x) {} fromPad(e, true); });
    pad.addEventListener('pointermove', (e) => { if (down) fromPad(e); });
    ['pointerup', 'pointercancel'].forEach(t => pad.addEventListener(t, (e) => { if (down) { down = false; fromPad(e, true); } }));
    const axes = h('div', { class: 'mo-axes' }), macros = h('div', { class: 'mo-macros' });
    let learning = -1, snap = null;
    const banner = h('div', { class: 'mo-learn', hidden: true });
    function paint() {
      const p = pf(); axes.innerHTML = ''; macros.innerHTML = '';
      ['x', 'y'].forEach(which => axes.appendChild(h('div', { class: 'mo-axis' }, [h('span', { class: 'mo-lab', text: which.toUpperCase() }),
        UI.Segmented({ options: MAC.map((_, i) => ({ value: i, label: String(i + 1), hint: p.names[i] })), value: p.xy[which], onChange: (v) => { const q = pf(); q.xy[which] = +v; save(q); } }).el])));
      MAC.forEach((mk, i) => {
        const c = (view.descriptor.config || []).find(x => x.key === mk), kn = UI.paramControl(view, Object.assign({}, c, { label: '' }), { size: 54 });
        const name = h('input', { class: 'mo-mname', value: p.names[i], title: 'rename this macro', 'aria-label': 'macro ' + (i + 1) + ' name' }); stop(name);
        name.addEventListener('change', () => { const q = pf(); q.names[i] = name.value || ('Macro ' + (i + 1)); save(q); });
        const dests = Object.keys(p.map[i]).map(k => {
          const amt = p.map[i][k], n = UI.NumberDrag({ value: Math.round(amt * 100), min: -100, max: 100, step: 1, label: 'how far ' + p.names[i] + ' turns ' + labelOf(view, k), format: (v) => (v > 0 ? '+' : '') + v + '%', onChange: (v) => { const q = pf(); q.map[i][k] = clamp(v / 100, -1, 1); if (!q.map[i][k]) delete q.map[i][k]; save(q, !!q.map[i][k]); } });
          return h('div', { class: 'mo-chip mo-dest' }, [h('span', { class: 'mo-dn', text: labelOf(view, k) }), n.el,
            h('button', { class: 'mo-x', text: '×', title: 'take it off this macro', onclick: (e) => { e.stopPropagation(); const q = pf(); delete q.map[i][k]; save(q); } })]);
        });
        const free = knobsOf(view).filter(c2 => !(c2.key in p.map[i]));
        const add = select([['', '＋ Add a knob']].concat(free.map(c2 => [c2.key, c2.label || c2.key])), '', (k) => { if (!k) return; const q = pf(); q.map[i][k] = 0.5; save(q); }, 'mo-add');
        const learn = UI.Toggle({ label: 'LEARN', value: learning === i, hint: 'turn knobs on the Panel: each one you turn joins this macro — as far as you turned it', onChange: (v) => setLearn(v ? i : -1) });
        const card = h('div', { class: 'mo-mrow' + (learning === i ? ' learning' : ''), style: { '--acc': MAC_COL[i] } }, [
          h('div', { class: 'mo-mtop' }, [name, learn.el]), h('div', { class: 'mo-mknob' }, [kn ? kn.el : h('span')]),
          h('div', { class: 'mo-dests' }, dests.length ? dests : [h('div', { class: 'mo-none', text: 'turns nothing yet' })]), add]);
        macros.appendChild(card);
      });
    }
    function setLearn(i) {
      learning = i; snap = i >= 0 ? Object.assign({}, view.state) : null;
      banner.hidden = i < 0; banner.textContent = i >= 0 ? 'LEARNING ' + pf().names[i].toUpperCase() + ' — turn any knob on the Panel: it joins as far as you turn it, then goes back' : '';
      paint();
    }
    // learn: a knob turned while learning joins the macro (the turn = its amount) and the knob goes back where it was
    knobsOf(view).forEach(c => view.bind(c.key, (v) => {
      if (learning < 0 || !snap || snap[c.key] === undefined || v === snap[c.key]) return;
      const amt = clamp((v - snap[c.key]) / (c.max - c.min), -1, 1); if (Math.abs(amt) < 0.01) return;
      const q = pf(); q.map[learning][c.key] = +amt.toFixed(2); save(q); view.emit('config_change', { key: c.key, value: snap[c.key] });
    }));
    el.append(head('Perform', [h('span', { class: 'mo-count', text: 'MIDI-LEARN OR AUTOMATE A MACRO LIKE ANY KNOB' })]), banner,
      h('div', { class: 'mo-pgrid' }, [h('div', { class: 'mo-padcol' }, [pad, axes]), macros]));
    const repaint = () => { const s = JSON.stringify(M().cleanPerform(view.state._perform)); if (s === sig && macros.childNodes.length) return; sig = s; paint(); };
    view.bind('_perform', repaint); view.on('state_sync', repaint); repaint(); stop(el);
    return { el, learn: setLearn };
  }

  // 3.71b his call: these live on the tool's PAGE as tabs (horizontal, beside Panel) — the window stays the tool itself
  const pageTabsFor = (view) => (M() && M().performs(view.descriptor)) ? [
    { id: 'motion', label: 'Motion', ic: 'activity', sub: '· knobs that move on their own, in time with the song', el: motionPanel(view).el },
    { id: 'perform', label: 'Perform', ic: 'gauge', sub: '· four macros and an XY pad', el: performPanel(view).el },
  ] : [];
  UI.extend({ toolTabs, motionPanel, performPanel, pageTabsFor });
})(typeof window !== 'undefined' ? window : globalThis);
