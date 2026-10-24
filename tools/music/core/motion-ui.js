/* ERAVOS music — motion-ui.js · 3.71 the window side of core/motion.js: tabs, the Motion panel and the Perform panel.
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

  // ---------------------------------------------------------------- the picture of one movement (the cursor runs while it plays)
  function preview(view, getM) {
    const cv = UI.Canvas(92, 26); cv.classList.add('mo-pic');
    UI.loop(cv, () => {
      const g = cv.g, W = cv.fit().W, H = cv.H, m = getM(); g.clearRect(0, 0, W, H); if (!m) return;
      const acc = getComputedStyle(cv).getPropertyValue('--acc').trim() || '#00d4ff';
      g.strokeStyle = 'rgba(127,147,168,.25)'; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      g.strokeStyle = acc; g.lineWidth = 1.5; g.beginPath();
      for (let x = 0; x <= W; x++) { const c = x / W * 2 + m.phase, v = m.shape === 'follow' ? Math.sin(x / W * 9) * 0.5 * Math.abs(Math.sin(x / W * 3)) : M().shapeAt(m.shape, c, 11, m.steps); const y = H / 2 - v * m.depth * (H / 2 - 2); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      const ac = view.ac, beats = ac ? ac.currentTime * ((view.K && view.K.music && view.K.music.bpm) || 120) / 60 : 0, px = ((beats / m.beats) % 2) / 2 * W;
      g.fillStyle = acc; g.fillRect(px, 0, 1.5, H);
    }, 20);
    return cv;
  }
  // the steps of a 'steps' movement: drag up/down on a bar
  function stepsEditor(m, onChange) {
    const cv = UI.Canvas(184, 44); cv.classList.add('mo-steps'); let down = false;
    UI.loop(cv, () => {
      const g = cv.g, W = cv.fit().W, H = cv.H, s = m.steps, w = W / s.length, acc = getComputedStyle(cv).getPropertyValue('--acc').trim() || '#00d4ff'; g.clearRect(0, 0, W, H);
      s.forEach((v, i) => { g.fillStyle = 'rgba(127,147,168,.12)'; g.fillRect(i * w + 1, 0, w - 2, H); g.fillStyle = acc; const y = H / 2 - v * (H / 2 - 1); g.fillRect(i * w + 1, Math.min(y, H / 2), w - 2, Math.max(1.5, Math.abs(y - H / 2))); });
    }, 15);
    const set = (e) => { const r = cv.getBoundingClientRect(), i = clamp(Math.floor((e.clientX - r.left) / r.width * m.steps.length), 0, m.steps.length - 1); m.steps[i] = +clamp(1 - 2 * (e.clientY - r.top) / r.height, -1, 1).toFixed(2); };
    cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} set(e); });
    cv.addEventListener('pointermove', (e) => { if (down) set(e); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { if (down) { down = false; onChange(); } }));
    return cv;
  }

  // ---------------------------------------------------------------- MOTION
  function motionPanel(view) {
    const el = h('div', { class: 'mo-panel' });
    const list = () => M().cleanMotion(view.state._motion);
    let sig = '';
    const save = (arr, keep) => { if (keep) sig = JSON.stringify(arr); view.emit('config_change', { key: '_motion', value: arr }); };   // keep: a value turned here — no rebuild under the hand
    function paint() {
      el.innerHTML = '';
      const ms = list(), free = knobsOf(view).filter(c => !ms.some(m => m.key === c.key));
      const add = select([['', '＋ Move a knob…']].concat(free.map(c => [c.key, c.label || c.key])), '', (k) => { if (!k) return; save(ms.concat([{ key: k, shape: 'sine', beats: 4, depth: 0.5, phase: 0 }])); });
      el.appendChild(h('div', { class: 'mo-head' }, [h('span', { class: 'mo-cap', text: 'MOTION' }), h('span', { class: 'mo-dim', text: ms.length ? 'knobs moving on their own, in time with the song' : 'nothing moves yet — pick a knob to move it on its own' }), add]));
      ms.forEach((m, i) => {
        const upd = (patch, keep) => { const arr = list(); Object.assign(arr[i], patch); if (patch.shape === 'steps' && !arr[i].steps) arr[i].steps = [1, 0.5, 0, -0.5, -1, -0.5, 0, 0.5]; save(arr, keep); };
        const depth = UI.Knob({ key: 'depth', label: 'Depth', min: -1, max: 1, step: 0.01, value: m.depth, size: 30, onChange: (v) => upd({ depth: v }, true) });
        const phase = UI.Knob({ key: 'phase', label: 'Phase', min: 0, max: 1, step: 0.01, value: m.phase, size: 30, onChange: (v) => upd({ phase: v }, true) });
        const row = h('div', { class: 'mo-row' + (m.off ? ' off' : '') }, [
          h('b', { class: 'mo-name', text: labelOf(view, m.key) }),
          select(M().SHAPES.map(s => [s, M().SHAPE_LABEL[s]]), m.shape, (v) => upd({ shape: v })),
          m.shape === 'follow' ? h('span', { class: 'mo-dim mo-rate', text: 'the mix' }) : select(M().RATES.map(([v, l]) => [v, l]), M().RATES.some(([v]) => Math.abs(v - m.beats) < 1e-6) ? m.beats : 4, (v) => upd({ beats: +v }), 'mo-rate'),
          depth.el, phase.el, preview(view, () => list()[i]),
          UI.Button({ label: m.off ? 'Off' : 'On', hint: 'pause this movement (it keeps its settings)', onClick: () => upd({ off: !m.off }) }).el,
          UI.Button({ label: '×', hint: 'stop moving this knob', onClick: () => save(list().filter((_, j) => j !== i)) }).el,
        ]);
        el.appendChild(row);
        if (m.shape === 'steps') row.appendChild(h('div', { class: 'mo-sub' }, [h('span', { class: 'mo-dim', text: 'steps — drag the bars' }), stepsEditor(m, () => upd({ steps: m.steps.slice() }, true)),
          UI.Button({ label: '−', hint: 'fewer steps', onClick: () => upd({ steps: m.steps.slice(0, Math.max(2, m.steps.length - 1)) }) }).el,
          UI.Button({ label: '+', hint: 'more steps', onClick: () => upd({ steps: m.steps.concat([0]).slice(0, 16) }) }).el]));
      });
    }
    const repaint = () => { const s = JSON.stringify(M().cleanMotion(view.state._motion)); if (s === sig && el.childNodes.length) return; sig = s; paint(); };
    view.bind('_motion', repaint); view.on('state_sync', repaint); repaint(); stop(el);
    return { el, repaint };
  }

  // ---------------------------------------------------------------- PERFORM
  function performPanel(view) {
    const el = h('div', { class: 'mo-panel mo-perform' }), MAC = M().MACROS;
    const pf = () => M().cleanPerform(view.state._perform);
    let sig = '';
    const save = (p, keep) => { if (keep) sig = JSON.stringify(p); view.emit('config_change', { key: '_perform', value: p }); };
    const live = {}; view.on('param_live', (p) => { if (p && MAC.includes(p.key)) live[p.key] = p.value; });
    const val = (k) => (live[k] !== undefined && live[k] !== null ? live[k] : +view.state[k] || 0);
    // the XY pad: X and Y each turn a macro
    const pad = UI.Canvas(150, 150); pad.classList.add('mo-xy'); let down = false, lastSend = 0;
    UI.loop(pad, () => {
      const g = pad.g, W = pad.fit().W, H = pad.H, p = pf(), acc = getComputedStyle(pad).getPropertyValue('--acc').trim() || '#00d4ff'; g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(127,147,168,.14)'; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.moveTo(0, i * H / 4); g.lineTo(W, i * H / 4); g.stroke(); }
      const x = val(MAC[p.xy.x]) * W, y = (1 - val(MAC[p.xy.y])) * H;
      g.strokeStyle = acc; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = acc; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(214,228,240,.55)'; g.font = '9px monospace'; g.fillText('X ' + p.names[p.xy.x], 4, H - 5); g.save(); g.translate(10, H - 26); g.rotate(-Math.PI / 2); g.fillText('Y ' + p.names[p.xy.y], 0, 0); g.restore();
    }, 30);
    const fromPad = (e, force) => {
      const r = pad.getBoundingClientRect(), p = pf(), x = +clamp((e.clientX - r.left) / r.width, 0, 1).toFixed(3), y = +clamp(1 - (e.clientY - r.top) / r.height, 0, 1).toFixed(3), now = performance.now();
      if (!force && now - lastSend < 30) return; lastSend = now;
      view.emit('config_change', { key: MAC[p.xy.x], value: x }); if (p.xy.y !== p.xy.x) view.emit('config_change', { key: MAC[p.xy.y], value: y });
    };
    pad.addEventListener('pointerdown', (e) => { e.stopPropagation(); down = true; try { pad.setPointerCapture(e.pointerId); } catch (x) {} fromPad(e, true); });
    pad.addEventListener('pointermove', (e) => { if (down) fromPad(e); });
    ['pointerup', 'pointercancel'].forEach(t => pad.addEventListener(t, (e) => { if (down) { down = false; fromPad(e, true); } }));
    const axes = h('div', { class: 'mo-axes' });
    const macros = h('div', { class: 'mo-macros' });
    let learning = -1, snap = null;
    const banner = h('div', { class: 'mo-learn', hidden: true });
    function paint() {
      const p = pf(); axes.innerHTML = ''; macros.innerHTML = '';
      const ax = (which) => select(MAC.map((_, i) => [i, which.toUpperCase() + ' → ' + p.names[i]]), p.xy[which], (v) => { const q = pf(); q.xy[which] = +v; save(q); });
      axes.append(ax('x'), ax('y'));
      MAC.forEach((mk, i) => {
        const c = (view.descriptor.config || []).find(x => x.key === mk); const kn = UI.paramControl(view, Object.assign({}, c, { label: '' }), { size: 38 });
        const name = h('input', { class: 'uk-text mo-mname', value: p.names[i], title: 'rename this macro' }); stop(name);
        name.addEventListener('change', () => { const q = pf(); q.names[i] = name.value || ('Macro ' + (i + 1)); save(q); });
        const chips = Object.keys(p.map[i]).map(k => {
          const amt = p.map[i][k], n = UI.NumberDrag ? UI.NumberDrag({ value: Math.round(amt * 100), min: -100, max: 100, step: 1, format: (v) => (v > 0 ? '+' : '') + v + '%', onChange: (v) => { const q = pf(); q.map[i][k] = clamp(v / 100, -1, 1); if (!q.map[i][k]) delete q.map[i][k]; save(q, !!q.map[i][k]); } }) : null;
          return h('span', { class: 'mo-chip', title: 'how far this macro turns ' + labelOf(view, k) + ' (drag the number)' }, [h('span', { text: labelOf(view, k) }), n ? n.el : h('span', { text: Math.round(amt * 100) + '%' }),
            h('button', { class: 'mo-x', text: '×', title: 'take it off this macro', onclick: (e) => { e.stopPropagation(); const q = pf(); delete q.map[i][k]; save(q); } })]);
        });
        const free = knobsOf(view).filter(c2 => !(c2.key in p.map[i]));
        const add = select([['', '＋ knob']].concat(free.map(c2 => [c2.key, c2.label || c2.key])), '', (k) => { if (!k) return; const q = pf(); q.map[i][k] = 0.5; save(q); }, 'mo-add');
        const learn = UI.Button({ label: learning === i ? 'Done' : 'Learn', hint: 'turn knobs in the Play tab: each one you turn is added — as far as you turned it', onClick: () => setLearn(learning === i ? -1 : i) });
        if (learning === i) learn.el.classList.add('on');
        macros.appendChild(h('div', { class: 'mo-mrow' + (learning === i ? ' learning' : '') }, [kn ? kn.el : h('span'), h('div', { class: 'mo-mbody' }, [h('div', { class: 'mo-mtop' }, [name, learn.el]), h('div', { class: 'mo-chips' }, chips.concat([add]))])]));
      });
    }
    function setLearn(i) {
      learning = i; snap = i >= 0 ? Object.assign({}, view.state) : null;
      banner.hidden = i < 0; banner.textContent = i >= 0 ? 'Learning ' + pf().names[i] + ': turn any knob — it is added as far as you turn it, then goes back. Done when finished.' : '';
      paint();
    }
    // learn: a knob turned while learning joins the macro (the turn = its amount) and the knob goes back where it was
    knobsOf(view).forEach(c => view.bind(c.key, (v) => {
      if (learning < 0 || !snap || snap[c.key] === undefined || v === snap[c.key]) return;
      const amt = clamp((v - snap[c.key]) / (c.max - c.min), -1, 1); if (Math.abs(amt) < 0.01) return;
      const q = pf(); q.map[learning][c.key] = +amt.toFixed(2); save(q); view.emit('config_change', { key: c.key, value: snap[c.key] });
    }));
    el.append(h('div', { class: 'mo-head' }, [h('span', { class: 'mo-cap', text: 'PERFORM' }), h('span', { class: 'mo-dim', text: 'four macros turn many knobs at once; the pad plays two of them — MIDI-learn or automate a macro like any knob' })]),
      banner, h('div', { class: 'mo-pgrid' }, [h('div', { class: 'mo-padcol' }, [pad, axes]), macros]));
    const repaint = () => { const s = JSON.stringify(M().cleanPerform(view.state._perform)); if (s === sig && macros.childNodes.length) return; sig = s; paint(); };
    view.bind('_perform', repaint); view.on('state_sync', repaint); repaint(); stop(el);
    return { el, learn: setLearn };
  }

  // 3.71 his call: these live on the tool's PAGE as tabs (horizontal, beside Panel) — the window stays the tool itself
  const pageTabsFor = (view) => (M() && M().performs(view.descriptor)) ? [
    { id: 'motion', label: 'Motion', ic: 'activity', sub: '· knobs that move on their own, in time with the song', el: motionPanel(view).el },
    { id: 'perform', label: 'Perform', ic: 'gauge', sub: '· four macros and an XY pad', el: performPanel(view).el },
  ] : [];
  UI.extend({ toolTabs, motionPanel, performPanel, pageTabsFor });
})(typeof window !== 'undefined' ? window : globalThis);
