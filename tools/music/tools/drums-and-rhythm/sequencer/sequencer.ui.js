/* eravos.sequencer UI 2.1 (3.36: automation lanes painted like steps · voice lane · step conditions · knob locks · fill / humanize) — header (slots, chain, starters), step grid (drag-paint, velocity paint, degree wheel), step inspector, paint view (A-4) */
OrganismFactory.reg('eravos.sequencer', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory;
  const SLOTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const DIVS = ['', '1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  let G = null, sel = null, cursor = -1;
  // header
  const playB = UI.Button({ label: '▶ / ■', kind: 'primary', hint: 'play/stop the song (Space)', onClick: () => view.emit('transport_play', {}) });
  const slotBar = h('div', { class: 'uk-seg' });
  const slotBtns = SLOTS.map(s => { const b = h('button', { text: s, title: `slot ${s} — click: select (cues at next bar while playing) · shift-click: cue · alt-click: copy current slot here` }); b.addEventListener('click', (e) => { e.stopPropagation(); if (e.altKey) view.emit('slot_copy', { from: view.state.slot, to: s }); else if (e.shiftKey || G && G.playing) view.emit('slot_cue', { slot: s }); else view.emit('slot_cue', { slot: s }); }); slotBar.appendChild(b); return b; });
  const lenSel = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'length'), { segMax: 0 });
  const swing = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'swing'), { size: 28 });
  const song = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'chainOn'));
  const rec = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'recordMode'), { segMax: 0 });
  const vw = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'view'));
  const fillT = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'fill'));
  const humK = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'humanize'), { size: 26 });
  const COND_LABEL = { '': 'always', '1:2': '1st of 2', '2:2': '2nd of 2', '1:3': '1st of 3', '2:3': '2nd of 3', '3:3': '3rd of 3', '1:4': '1st of 4', '2:4': '2nd of 4', '3:4': '3rd of 4', '4:4': '4th of 4', fill: 'only in a fill', '!fill': 'not in a fill', first: 'first pass only', '!first': 'not the first pass' };
  const COND_BADGE = { fill: 'F', '!fill': '!F', first: '1st', '!first': '!1st' };
  const chainIn = h('input', { class: 'uk-text', style: { width: '120px' }, title: 'song chain: slot + repeats, e.g. A2 B2 C4 D2' });
  chainIn.addEventListener('pointerdown', e => e.stopPropagation());
  chainIn.addEventListener('change', () => { const ch = chainIn.value.toUpperCase().split(/[\s,]+/).map(t => /^([A-H])(\d*)$/.exec(t)).filter(Boolean).map(m => ({ slot: m[1], repeats: +(m[2] || 1) })); if (ch.length) view.emit('chain_edit', { chain: ch }); });
  const starters = UI.Select({ options: ['Genre starter…'].concat(Object.keys(window.ERAVOS_DATA.patterns || {})), onChange: (v) => { if (v !== 'Genre starter…') view.emit('starter_load', { name: v }); setTimeout(() => starters.set('Genre starter…'), 50); } });
  const fileIn = h('input', { type: 'file', accept: '.mid,.midi,.json', style: { display: 'none' } });
  fileIn.addEventListener('change', async () => { const f = fileIn.files[0]; if (f) view.emit('import', { arrayBuffer: await f.arrayBuffer(), name: f.name }); });
  const io = UI.Select({ options: ['File…', 'Import MIDI / pattern', 'Export MIDI', 'Export JSON', 'Clear this pattern'], onChange: (v) => { if (v === 'Import MIDI / pattern') fileIn.click(); if (v === 'Export MIDI') view.emit('export', { format: 'mid' }); if (v === 'Export JSON') view.emit('export', { format: 'json' }); if (v === 'Clear this pattern') view.emit('clear_pattern', {}); setTimeout(() => io.set('File…'), 50); } });
  view.on('export_ready', (x) => window.Workspace.download(x.name, x.data, x.mime));
  const addTrack = UI.Select({ options: ['＋ lane…', 'drum lane', 'melodic lane', { value: 'auto', label: 'automation lane (any knob of any tool)' }, { value: 'voice', label: 'her voice lane (Sample Player slices)' }], onChange: (v) => {
    if (v === 'drum lane') view.emit('track_add', { kind: 'drum' }); if (v === 'melodic lane') view.emit('track_add', { kind: 'melodic', name: 'melody' });
    if (v === 'auto') view.emit('track_add', { kind: 'auto', name: 'auto', color: '#ffd166', mode: 'hold' });
    if (v === 'voice') { const sp = view.targets().find(o => /Sample Player/i.test(o.label)); view.emit('track_add', { kind: 'drum', name: 'her voice', drumNote: 36, color: '#ff7eb6', target: sp ? sp.value : null }); }
    setTimeout(() => addTrack.set('＋ lane…'), 50); } });
  const header = h('div', { class: 'org-row', style: { flexWrap: 'wrap' } }, [UI.presetBar(view), playB.el, slotBar, lenSel.el, swing.el, song.el, chainIn, starters.el, io.el, rec.el, vw.el, fillT.el, humK.el, fileIn]);
  // grid
  const grid = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'auto', flex: '1', minHeight: '0' } });
  const insp = h('div', { class: 'uk-group', style: { display: 'flex', gap: '6px', alignItems: 'flex-end', flexWrap: 'wrap', minHeight: '54px' } });
  view.root.style.display = 'flex'; view.root.style.flexDirection = 'column';
  view.root.append(header, grid, h('div', { class: 'org-row', style: { marginTop: '4px' } }, [addTrack.el, UI.hint('Click = on/off · drag = paint · vertical drag on a hit = velocity · wheel on a melodic step = note (always in key) · automation lanes: click/drag sets the value, shift-click clears · right-click = step details (condition, knob locks)')]), insp);

  let paint = null;
  document.addEventListener('pointerup', () => { paint = null; });
  function cellEl(ti, i, st, t) {
    const beat = i % 4 === 0;
    const c = h('div', { class: 'seq-cell', style: { flex: '1', minWidth: '14px', height: view.state.view === 'paint' && t.kind === 'melodic' ? '58px' : '26px', borderRadius: '3px', position: 'relative', cursor: 'pointer', background: beat ? '#18222f' : '#121a24', border: '1px solid ' + (sel && sel.t === ti && sel.i === i ? '#fff' : (st.prob < 1 ? 'transparent' : '#223044')), outline: st.prob < 1 && st.on ? '1px dashed ' + t.color : '', overflow: 'hidden' } });
    if (t.kind === 'auto') {
      if (st.on) c.appendChild(h('div', { style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: (st.val * 100) + '%', background: t.color, opacity: 0.75, borderTop: '2px solid #fff8' } }));
    } else if (st.on) {
      const hue = t.kind === 'melodic' ? (st.degree - 1) * 45 : null;
      const col = view.state.view === 'paint' && hue !== null ? `hsl(${hue}, 90%, 60%)` : t.color;
      if (t.kind === 'drum') c.appendChild(h('div', { style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: (st.vel * 100) + '%', background: col, opacity: st.accent ? 1 : 0.8 } }));
      else {
        const y = view.state.view === 'paint' ? { bottom: ((st.degree - 1) / 13 * 100) + '%', height: '14%' } : { top: 0, bottom: 0 };
        c.appendChild(h('div', { style: Object.assign({ position: 'absolute', left: 0, right: st.slide ? '-3px' : 0, background: col, opacity: 0.35 + 0.65 * st.vel, borderRadius: '2px' }, y) }));
        c.appendChild(h('div', { style: { position: 'absolute', inset: 0, font: '8px var(--mono)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textShadow: '0 0 2px #000' }, text: G.tracks[ti].notes[i].replace(/-?\d+$/, '') + (st.wobbleDiv ? '' : '') }));
      }
      if (st.ratchet > 1) c.appendChild(h('div', { style: { position: 'absolute', top: '1px', right: '2px', font: '7px var(--mono)', color: '#fff' }, text: '×' + st.ratchet }));
    }
    if (st.on && st.cond) c.appendChild(h('div', { style: { position: 'absolute', top: '0', left: '1px', font: '7px var(--mono)', color: '#ffd166', textShadow: '0 0 2px #000' }, text: COND_BADGE[st.cond] || st.cond }));
    if (st.on && st.locks) c.appendChild(h('div', { title: 'knob lock: ' + Object.keys(st.locks).join(', '), style: { position: 'absolute', bottom: '1px', right: '1px', width: '5px', height: '5px', borderRadius: '50%', background: '#ffd166' } }));
    if (i === cursor) c.style.boxShadow = 'inset 0 0 0 2px #fff';
    c.dataset.i = i;
    c.addEventListener('contextmenu', (e) => { e.preventDefault(); sel = { t: ti, i }; drawInspector(); render(); });
    c.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); if (e.button === 2) return;
      sel = { t: ti, i };
      if (t.kind === 'auto') {   // value from where you press; shift-click clears
        if (e.shiftKey) { view.emit('step_edit', { track: ti, step: i, patch: { on: false } }); return; }
        const r = c.getBoundingClientRect(); paint = { t: ti, mode: 'val' };
        view.emit('step_edit', { track: ti, step: i, patch: { on: true, val: +Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)).toFixed(3) } }); return;
      }
      if (view.state.view === 'paint' && t.kind === 'melodic') {
        const r = c.getBoundingClientRect(); const deg = Math.max(1, Math.min(14, Math.round((1 - (e.clientY - r.top) / r.height) * 13) + 1));
        paint = { t: ti, mode: 'deg', on: true };
        view.emit('step_edit', { track: ti, step: i, patch: { on: true, degree: deg, vel: +(e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : 0.85).toFixed(2) } });
        return;
      }
      if (st.on && !e.shiftKey) { paint = { t: ti, on: false, y0: e.clientY, vel0: st.vel, i0: i, moved: false }; }
      else { paint = { t: ti, on: true }; view.emit('step_edit', { track: ti, step: i, patch: { on: true } }); }
    });
    c.addEventListener('pointerenter', (e) => {
      if (!paint || paint.t !== ti || e.buttons !== 1) return;
      if (paint.mode === 'val') { const r = c.getBoundingClientRect(); view.emit('step_edit', { track: ti, step: i, patch: { on: true, val: +Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)).toFixed(3) } }); return; }
      if (paint.mode === 'deg') { const r = c.getBoundingClientRect(); const deg = Math.max(1, Math.min(14, Math.round((1 - (e.clientY - r.top) / r.height) * 13) + 1)); view.emit('step_edit', { track: ti, step: i, patch: { on: true, degree: deg } }); return; }
      paint.moved = true; view.emit('step_edit', { track: ti, step: i, patch: { on: paint.on } });
    });
    c.addEventListener('pointermove', (e) => {
      if (paint && paint.mode === 'val' && paint.t === ti && e.buttons === 1) { const r = c.getBoundingClientRect(); view.emit('step_edit', { track: ti, step: i, patch: { on: true, val: +Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)).toFixed(3) } }); return; }
      if (!paint || paint.on || paint.i0 !== i || e.buttons !== 1) return;
      const dy = paint.y0 - e.clientY; if (Math.abs(dy) > 4) { paint.velDrag = true; view.emit('step_edit', { track: ti, step: i, patch: { vel: +Math.max(0.05, Math.min(1, paint.vel0 + dy / 60)).toFixed(2) } }); }
    });
    c.addEventListener('pointerup', (e) => { if (paint && paint.mode === 'val') return; if (paint && !paint.on && paint.i0 === i && !paint.velDrag && !paint.moved) view.emit('step_edit', { track: ti, step: i, patch: { on: false } }); });
    c.addEventListener('wheel', (e) => { if (t.kind !== 'melodic' || !st.on) return; e.preventDefault(); e.stopPropagation(); if (e.shiftKey) view.emit('step_edit', { track: ti, step: i, patch: { octave: Math.max(-2, Math.min(2, st.octave - Math.sign(e.deltaY))) } }); else view.emit('step_edit', { track: ti, step: i, patch: { degree: Math.max(1, Math.min(14, st.degree - Math.sign(e.deltaY))) } }); }, { passive: false });
    return c;
  }
  function trackHeader(t, ti) {
    const cap = t.kind === 'auto' ? undefined : 'capability.note_in';
    const tgt = UI.Select({ options: [{ value: '', label: t.missing ? '⚠ no target' : t.kind === 'auto' ? '— tool —' : '— target —' }].concat(view.targets(cap)), value: t.target || '', onChange: (v) => view.emit('track_edit', { track: ti, patch: t.kind === 'auto' ? { target: v || null, param: null } : { target: v || null } }) });
    tgt.select.style.maxWidth = '92px'; tgt.select.style.fontSize = '10px';
    tgt.select.addEventListener('pointerdown', () => tgt.setOptions([{ value: '', label: t.kind === 'auto' ? '— tool —' : '— target —' }].concat(view.targets(cap))));
    if (t.missing) tgt.select.style.borderColor = '#ff2266';
    const mb = h('button', { class: 'uk-toggle' + (t.mute ? ' on' : ''), text: 'M', style: { padding: '1px 5px' }, onclick: (e) => { e.stopPropagation(); view.emit('track_edit', { track: ti, patch: { mute: !t.mute } }); } });
    const sb = h('button', { class: 'uk-toggle' + (t.solo ? ' on' : ''), text: 'S', style: { padding: '1px 5px' }, onclick: (e) => { e.stopPropagation(); view.emit('track_edit', { track: ti, patch: { solo: !t.solo } }); } });
    // 3.37: the lane's own volume (its notes' velocity × this), next to M / S — auto lanes move knobs, so they have none
    const vk = t.kind === 'auto' ? null : UI.Knob({ label: '', min: 0, max: 1, step: 0.01, value: t.vol === undefined ? 1 : t.vol, default: 1, size: 18, accent: t.color, hint: 'lane volume', onChange: (v) => view.emit('track_edit', { track: ti, patch: { vol: v } }) });
    if (vk) { vk.el.title = `lane volume ${Math.round(100 * (t.vol === undefined ? 1 : t.vol))} % (drag · double-click resets)`; vk.el.setAttribute('aria-label', 'Lane volume'); const kv = vk.el.querySelector('.uk-knob-val'); if (kv) kv.style.display = 'none'; }
    const x = h('button', { class: 'uk-btn', text: '×', title: 'remove lane', style: { padding: '1px 5px' }, onclick: (e) => { e.stopPropagation(); if (confirm('Remove lane ' + t.name + '?')) view.emit('track_remove', { track: ti }); } });
    const nm = h('span', { style: { font: '600 11px var(--font)', color: t.color, width: '62px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text' }, title: (t.kind === 'melodic' ? 'melodic lane (scale degrees)' : t.kind === 'auto' ? 'automation lane → ' + (t.paramLabel || 'pick a knob') : 'drum lane → pad ' + (t.drumNote - 35)) + ' · dbl-click to rename', text: (t.kind === 'melodic' ? '♪ ' : t.kind === 'auto' ? '∿ ' : '') + t.name });
    nm.addEventListener('dblclick', () => { const n = prompt('Lane name', t.name); if (n) view.emit('track_edit', { track: ti, patch: { name: n } }); });
    const extra = [];
    if (t.kind === 'auto') {
      const ps = UI.Select({ options: [{ value: '', label: t.target ? '— knob —' : 'pick a tool' }].concat((t.params || []).map(p => ({ value: p.key, label: p.label }))), value: t.param || '', onChange: (v) => view.emit('track_edit', { track: ti, patch: { param: v || null, name: v ? ((t.params || []).find(p => p.key === v) || {}).label || v : 'auto' } }) });
      ps.select.style.maxWidth = '84px'; ps.select.style.fontSize = '10px'; if (!t.param) ps.select.style.borderColor = '#ffd166';
      const gl = h('button', { class: 'uk-toggle' + (t.mode === 'glide' ? ' on' : ''), title: 'glide: slide smoothly to the next set step · off: hold each value', text: '⟋', style: { padding: '1px 5px' }, onclick: (e) => { e.stopPropagation(); view.emit('track_edit', { track: ti, patch: { mode: t.mode === 'glide' ? 'hold' : 'glide' } }); } });
      extra.push(ps.el, gl);
    } else {
      const evK = UI.Knob({ label: '', min: 0, max: 1, step: 0.01, value: t.evolve || 0, default: 0, size: 18, accent: t.color, onChange: (v) => view.emit('track_edit', { track: ti, patch: { evolve: v } }) });
      evK.el.title = 'evolve: from the 2nd pass ' + (t.kind === 'melodic' ? 'notes wander in key, a few rest' : 'ghost notes grow on the offbeats') + ' (repeatable — Evolve seed in ⚙)'; const kv = evK.el.querySelector('.uk-knob-val'); if (kv) kv.style.display = 'none';
      extra.push(evK.el);
    }
    return h('div', { style: { display: 'flex', alignItems: 'center', gap: '3px', width: (G && G.tracks.some(x => x.kind === 'auto') ? 324 : 280) + 'px', flex: 'none' } }, [h('div', { style: { width: '8px', height: '8px', borderRadius: '50%', background: t.color } }), nm, tgt.el, ...extra, ...(vk ? [vk.el] : []), mb, sb, x]);
  }
  function render() {
    if (!G) return;
    const sc = grid.scrollTop; grid.innerHTML = '';
    G.tracks.forEach((t, ti) => {
      const row = h('div', { style: { display: 'flex', gap: '2px', alignItems: 'center' } }, [trackHeader(t, ti)]);
      const cells = h('div', { style: { display: 'flex', gap: '2px', flex: '1' } });
      t.steps.forEach((st, i) => cells.appendChild(cellEl(ti, i, st, t)));
      row.appendChild(cells); grid.appendChild(row);
    });
    if (!G.tracks.length) grid.appendChild(UI.hint('No lanes. Pick a genre starter above, or ＋ lane, or drag a wire from this window’s note output to an instrument.'));
    grid.scrollTop = sc;
    slotBtns.forEach((b, i) => { const s = SLOTS[i]; b.classList.toggle('on', s === G.slot); b.style.textDecoration = G.slotsUsed.includes(s) ? 'underline' : ''; b.style.outline = G.cued === s ? '2px solid #ffaa00' : ''; b.title = (G.names[s] ? G.names[s] + ' — ' : '') + b.title.replace(/^[^—]*— /, ''); });
    if (document.activeElement !== chainIn) chainIn.value = G.chain.map(c => c.slot + c.repeats).join(' ');
  }
  function drawInspector() {
    insp.innerHTML = '';
    if (!G || !sel || !G.tracks[sel.t]) { insp.appendChild(UI.hint('Right-click a step to edit velocity, probability, note, gate, accent, slide, ratchet, wobble rate.')); return; }
    const t = G.tracks[sel.t], st = t.steps[sel.i]; if (!st) return;
    const e = (patch) => view.emit('step_edit', { track: sel.t, step: sel.i, patch });
    insp.appendChild(h('span', { class: 'org-label', text: `${t.name} · step ${sel.i + 1}` + (t.kind === 'melodic' && st.on ? ' · ' + t.notes[sel.i] : '') }));
    const condSel = UI.Select({ label: 'Plays', options: Object.keys(COND_LABEL).map(k => ({ value: k, label: COND_LABEL[k] })), value: st.cond || '', onChange: (v) => e({ cond: v }) });
    condSel.el.title = 'which pass of the pattern this step plays on — 1st of 2 = every other loop · fill = only while Fill is on';
    if (t.kind === 'auto') {
      const pr = (t.params || []).find(p => p.key === t.param);
      insp.append(UI.Knob({ label: pr ? pr.label : 'Value', min: 0, max: 1, step: 0.001, value: st.val, default: 0.5, size: 30, accent: t.color, onChange: (v) => e({ on: true, val: v }) }).el, condSel.el,
        UI.hint(t.param ? (t.mode === 'glide' ? 'glides to the next set step' : 'holds until the next set step') : 'pick the tool and the knob in the lane header'));
      return;
    }
    const k = (key, label, min, max, step) => UI.Knob({ label, min, max, step, value: st[key], default: key === 'prob' || key === 'gate' ? 1 : 0.8, size: 28, accent: t.color, onChange: (v) => e({ [key]: key === 'ratchet' || key === 'degree' || key === 'octave' ? Math.round(v) : v }) }).el;
    insp.append(k('vel', 'Vel', 0.05, 1, 0.01), k('prob', 'Chance', 0, 1, 0.01), k('gate', 'Length', 0.1, 4, 0.1), k('ratchet', 'Ratchet', 1, 4, 1));
    if (t.kind === 'melodic') insp.append(k('degree', 'Degree', 1, 14, 1), k('octave', 'Octave', -2, 2, 1));
    insp.append(UI.Toggle({ label: 'Accent', value: st.accent, onChange: (v) => e({ accent: v }) }).el, UI.Toggle({ label: 'Slide', value: st.slide, onChange: (v) => e({ slide: v }) }).el);
    if (t.kind === 'melodic') insp.append(UI.Select({ label: 'Wobble', options: DIVS.map(d => ({ value: d, label: d || '—' })), value: st.wobbleDiv || '', onChange: (v) => e({ wobbleDiv: v || null }) }).el);
    insp.append(condSel.el);
    // knob locks: this hit sets knobs of its own instrument; they return on the lane's next hit
    const params = t.params || [], locks = st.locks || {};
    Object.keys(locks).forEach(key => {
      const pr = params.find(p => p.key === key) || { key, label: key, min: 0, max: 1 };
      const ctl = pr.type === 'enum' ? UI.Select({ label: '🔒 ' + pr.label, options: pr.options, value: locks[key], onChange: (v) => view.emit('lock_set', { track: sel.t, step: sel.i, key, value: v }) })
        : pr.type === 'boolean' ? UI.Toggle({ label: '🔒 ' + pr.label, value: !!locks[key], onChange: (v) => view.emit('lock_set', { track: sel.t, step: sel.i, key, value: v }) })
        : UI.Knob({ label: '🔒 ' + pr.label, min: pr.min, max: pr.max, step: pr.step || (pr.type === 'integer' ? 1 : (pr.max - pr.min) / 200), value: locks[key], size: 28, accent: '#ffd166', onChange: (v) => view.emit('lock_set', { track: sel.t, step: sel.i, key, value: v }) });
      insp.append(h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '2px' } }, [ctl.el, h('button', { class: 'uk-btn', text: '✕', title: 'remove this lock', style: { padding: '0 4px' }, onclick: () => view.emit('lock_set', { track: sel.t, step: sel.i, key, value: null }) })]));
    });
    if (params.length && st.on) {
      const add = UI.Select({ options: [{ value: '', label: '🔒 lock a knob…' }].concat(params.filter(p => !(p.key in locks)).map(p => ({ value: p.key, label: p.label }))), onChange: (key) => {
        setTimeout(() => add.set(''), 50); if (!key) return; const pr = params.find(p => p.key === key);
        const v = pr.type === 'enum' ? pr.options[0] : pr.type === 'boolean' ? true : (pr.min + pr.max) / 2; view.emit('lock_set', { track: sel.t, step: sel.i, key, value: v }); } });
      add.el.title = 'make this one hit change a knob of ' + (t.targetLabel || 'its instrument') + ' (it goes back on the next hit)'; insp.append(add.el);
    }
  }
  view.on('grid_sync', (g) => { G = g; render(); drawInspector(); });
  view.on('step_cursor', (c) => {
    if (c.step < 0) { cursor = -1; render(); return; }
    UI.atTime(view.ac, c.time, () => {
      const prev = cursor; cursor = c.step;
      grid.querySelectorAll(`.seq-cell[data-i="${prev}"]`).forEach(el => { el.style.boxShadow = ''; });
      grid.querySelectorAll(`.seq-cell[data-i="${cursor}"]`).forEach(el => { el.style.boxShadow = 'inset 0 0 0 2px #fff'; });
    });
  });
  view.bind('view', () => render());
  view.emit('request_state', {});
  drawInspector();
});
