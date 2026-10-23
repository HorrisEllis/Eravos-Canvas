/* eravos.bass-drop-builder UI — section bar (drag boundaries), per-section cue editor, vocal lane, FX, FIRE/ABORT */
OrganismFactory.reg('eravos.bass-drop-builder', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let S = null, sel = 'TENSION', runInfo = null, curSec = null;
  const KEYS = { TENSION: 'tensionBars', BUILD: 'buildBars', PAUSE: 'pauseBars', DROP: 'dropBars' };
  const HELP = { TENSION: 'Uneasy, filtered, waiting. Her first words can live here.', BUILD: 'Snare roll speeds up, riser climbs. Energy rises.', PAUSE: 'One beat of silence — the breath before the hit.', DROP: 'Everything hits. The bass takes over.' };
  const bar = UI.Canvas(740, 150); bar.style.cursor = 'pointer';
  const fire = UI.Button({ label: '🔻 FIRE', kind: 'primary big', hint: 'arm: runs from the next bar (or from the start when you press play / bounce)', onClick: () => view.emit('fire', {}) });
  const abort = UI.Button({ label: 'ABORT', kind: 'danger', onClick: () => view.emit('abort', {}) });
  const status = h('span', { class: 'org-note', text: 'idle' });
  view.on('run', (r) => { runInfo = r.state === 'running' ? r : null; status.textContent = r.state === 'armed' ? 'ARMED — starts on the next bar (press play)' : r.state === 'running' ? 'RUNNING' : r.state; fire.el.style.animation = r.state === 'armed' ? 'pulse .6s infinite' : ''; });
  view.on('section', (s) => UI.atTime(view.ac, s.time, () => { curSec = s.section; }));
  const W = () => bar.W;
  function layout() {
    if (!S) return null; const B = S.bars; const tot = S.sections.reduce((a, s) => a + B[s], 0) || 1;
    let x = 0; const segs = {}; const w = W();
    S.sections.forEach(s => { const sw = Math.max(B[s] ? 26 : 6, B[s] / tot * (w - 20)); segs[s] = { x, w: sw }; x += sw; });
    const k = (w) / x; Object.values(segs).forEach(g => { g.x *= k; g.w *= k; });
    return { segs, tot };
  }
  UI.loop(bar, () => {
    bar.fit(); const g = bar.g, w = bar.W, H = 150; g.fillStyle = '#080b10'; g.fillRect(0, 0, w, H);
    const L = layout(); if (!L) return;
    S.sections.forEach(s => {
      const sg = L.segs[s], col = S.colors[s];
      g.fillStyle = col + (s === sel ? '55' : '2a'); g.fillRect(sg.x + 1, 6, sg.w - 2, 74);
      g.strokeStyle = s === sel ? col : col + '88'; g.lineWidth = s === sel ? 2 : 1; g.strokeRect(sg.x + 1, 6, sg.w - 2, 74);
      g.save(); g.beginPath(); g.rect(sg.x + 1, 6, sg.w - 2, 74); g.clip();
      g.fillStyle = col; g.font = '700 12px monospace'; g.fillText(sg.w < 60 ? s[0] : s, sg.x + 6, 22);
      g.fillStyle = '#cfe'; g.font = '11px monospace'; g.fillText(S.bars[s] + ' bar' + (S.bars[s] === 1 ? '' : 's'), sg.x + 6, 38);
      const c = S.cues[s] || {}; g.fillStyle = '#9ab'; g.font = '10px monospace';
      const bits = []; if (c.slot) bits.push('▦ ' + c.slot); if (typeof c.djStart === 'number') bits.push('DJ ' + c.djStart + '→' + (c.djEnd ?? c.djStart)); if (c.mutes && c.mutes.length) bits.push('mute ' + c.mutes.length); if (typeof c.energy === 'number') bits.push('E ' + c.energy);
      bits.forEach((t, i) => g.fillText(t, sg.x + 6, 54 + i * 12));
      g.restore();
      if (curSec === s && runInfo) { g.fillStyle = '#fff'; g.fillRect(sg.x + 1, 6, 3, 74); }
    });
    // playhead during run
    if (runInfo) { const now = view.ac.currentTime, t0 = runInfo.sections.TENSION[0], t1 = runInfo.sections.DROP[1]; const f = (now - t0) / (t1 - t0); if (f >= 0 && f <= 1) { let acc = 0, x = 0; for (const s of S.sections) { const [a, b] = runInfo.sections[s]; if (now >= a && now < b) { x = L.segs[s].x + (now - a) / (b - a) * L.segs[s].w; break; } } g.fillStyle = '#fff'; g.fillRect(x, 0, 2, H); } }
    // vocal lane
    const vy = 90; g.fillStyle = '#0f1620'; g.fillRect(0, vy, w, 54); g.fillStyle = '#7f93a8'; g.font = '10px monospace';
    if (!S.vocal) { g.fillText('VOCAL — drop her clip here, or “Send clip to… Drop Builder” from a Sample window', 8, vy + 30); return; }
    const secDur = 240 / view.bpm, beat = 60 / view.bpm;
    // map seconds → x within the section layout
    const xAt = (sec, off) => { const sg = L.segs[sec], len = S.bars[sec] * secDur || 1e-9; return sg.x + Math.max(0, Math.min(1, off / len)) * sg.w; };
    let x0, x1;
    const view_ = view.state;
    if (view_.vocalEndOnDrop) { // walk backwards from DROP start
      let remain = S.vocal.duration, sec = 'PAUSE'; const order = ['PAUSE', 'BUILD', 'TENSION']; x1 = L.segs.DROP.x;
      for (sec of order) { const len = S.bars[sec] * secDur; if (remain <= len) { x0 = xAt(sec, len - remain); remain = 0; break; } remain -= len; }
      if (remain > 0) x0 = 0;
    } else { const sec = view_.vocalSection; x0 = xAt(sec, view_.vocalBeat * beat); let remain = S.vocal.duration, x = x0; const idx = S.sections.indexOf(sec); x1 = x0; let off = view_.vocalBeat * beat; for (let i = idx; i < S.sections.length && remain > 0; i++) { const s = S.sections[i]; const len = S.bars[s] * secDur; const avail = len - (i === idx ? off : 0); const take = Math.min(avail, remain); x1 = xAt(s, (i === idx ? off : 0) + take); remain -= take; } }
    g.fillStyle = 'rgba(170,68,255,.25)'; g.fillRect(x0, vy + 2, Math.max(2, x1 - x0), 50);
    const pk = S.vocal.peaks, n = pk.length / 2; g.fillStyle = '#b066ff';
    for (let x = 0; x < x1 - x0; x++) { const i = Math.floor(x / (x1 - x0) * n); g.fillRect(x0 + x, vy + 27 - pk[i * 2 + 1] * 22, 1, Math.max(1, (pk[i * 2 + 1] - pk[i * 2]) * 22)); }
    g.fillStyle = '#fff'; g.fillText('🎤 ' + S.vocal.name + (view_.stutter ? '  ×' + view_.stutter + ' stutter' : ''), x0 + 4, vy + 12);
    if (view_.vocalEndOnDrop) { g.fillStyle = '#ff2266'; g.fillRect(x1 - 1, vy, 2, 54); }
  }, 30);
  // interaction: click selects section; drag right edge of a section changes its bars; drag on vocal lane places it
  let drag = null;
  bar.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const L = layout(); if (!L) return; const pt = UI.toContent(bar, e.clientX, e.clientY), x = pt.x, y = pt.y;
    try { bar.setPointerCapture(e.pointerId); } catch (_) {}
    if (y > 88) { if (S.vocal) drag = { vocal: true }; return; }
    for (const s of S.sections) { const sg = L.segs[s]; if (Math.abs(x - (sg.x + sg.w)) < 7) { drag = { sec: s, x0: x, b0: S.bars[s], pxPerBar: sg.w / Math.max(0.25, S.bars[s]) }; return; } if (x >= sg.x && x < sg.x + sg.w) { select(s); } }
  });
  bar.addEventListener('pointermove', (e) => {
    if (!drag) return; const x = UI.toContent(bar, e.clientX, e.clientY).x, L = layout();
    if (drag.sec) { const nb = Math.max(drag.sec === 'DROP' ? 1 : 0, Math.round((drag.b0 + (x - drag.x0) / drag.pxPerBar) * 4) / 4); if (nb !== S.bars[drag.sec]) view.emit('section_edit', { section: drag.sec, bars: nb }); }
    else if (drag.vocal) { // place: section under pointer + beat offset (turns off end-on-drop)
      for (const s of S.sections) { const sg = L.segs[s]; if (x >= sg.x && x < sg.x + sg.w) { const beats = Math.max(0, Math.round((x - sg.x) / sg.w * S.bars[s] * 4 * 4) / 4); view.emit('vocal_place', { section: s, beat: beats, endOnDrop: false }); } }
    }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => bar.addEventListener(t, () => { drag = null; }));
  bar.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
  bar.addEventListener('drop', async (e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) view.emit('vocal_load', { arrayBuffer: await f.arrayBuffer(), name: f.name }); });
  // ---------------------------------------------------------------- 3.0: every part of every section editable
  const grp = (title, keys, extra) => h('div', { class: 'uk-group db-grp' }, [h('div', { class: 'uk-group-title', text: title }), UI.paramPanel(view, keys, { flat: true, noTitles: true, size: 30, segMax: 5 })].concat(extra || []));
  // TENSION — the tension voice (22 params) + its starting sounds
  const tSel = UI.Select({ label: 'Start from', options: ['— sound —'], onChange: (v) => { if (v !== '— sound —') view.emit('tension_sound', { name: v }); tSel.set('— sound —'); } });
  view.on('state_sync', (s) => { if (s.tensionSounds) tSel.setOptions(['— sound —'].concat(s.tensionSounds)); });
  const PANELS = {
    TENSION: h('div', {}, [h('div', { class: 'org-row' }, [tSel.el, h('span', { class: 'org-note', text: 'Sound off → the section plays only what you cue above' })]),
      grp('SOUND', ['tensionTone', 'padLevel', 'tChords', 'tVoicing', 'tOct']), grp('TONE', ['tWave', 'tVoices', 'tDetune', 'tWidth', 'tSub', 'tAir']),
      grp('SHAPE', ['tAttack', 'tRelease', 'tSwell', 'tPump', 'tRate']), grp('FILTER · SPACE', ['tCutoff', 'tCutoffEnd', 'tRes', 'tMotion', 'tMotionRate', 'tSpace'])]),
    BUILD: h('div', {}, [grp('RISER', ['riserLevel', 'riserWave', 'riserOct', 'riserNoise', 'riserCurve', 'riserFrom']), grp('ROLL', ['rollLevel', 'rollVoice', 'rollStart', 'rollEnd', 'rollCurve', 'rollPitch', 'rollFrom'])]),
    PAUSE: h('div', {}, [grp('THE GAP — the breath before the hit', ['gapSound', 'gapLevel', 'gapLen'])]),
    DROP: h('div', {}, [grp('IMPACT', ['impactLevel', 'impactPitch', 'impactLen', 'crashLevel']), grp('DOWNLIFTER', ['downLevel', 'downLen']),
      grp('SPACE — deep and wide: the sub stays mono and centred, the room above it opens', ['subDive', 'subFrom', 'subTo', 'subLen', 'crossover', 'spaceTail', 'spaceSize', 'spacePre', 'spaceDuck', 'spaceWidth', 'swell', 'swellBeats', 'orbit', 'orbitBars'])]),
  };
  const tabs = h('div', { class: 'db-tabs' }), secTitle = h('div', { class: 'db-sec-title' }), cueBox = h('div', { class: 'db-cue' }), panelBox = h('div', {});
  const hear = UI.Button({ label: '▶ hear this part', hint: 'play this section’s sound on its own (up to 4 bars) — again to stop', onClick: () => view.emit('section_audition', { section: sel }) });
  view.on('section_audition', (a) => { hear.el.textContent = a.on ? '■ stop' : '▶ hear this part'; });
  const lenCtl = {}; Object.keys(KEYS).forEach(k => { lenCtl[k] = UI.paramControl(view, cfg(KEYS[k]), { size: 30 }).el; });
  const lenBox = h('span', { class: 'db-len' });
  function select(s) { sel = s; tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.s === s)); secTitle.textContent = s + ' — ' + HELP[s]; panelBox.replaceChildren(PANELS[s]); lenBox.replaceChildren(lenCtl[s]); drawCue(); }
  ['TENSION', 'BUILD', 'PAUSE', 'DROP'].forEach(s => { const b = h('button', { class: 'db-tab', text: s, style: { '--c': { TENSION: '#8844ff', BUILD: '#ffaa00', PAUSE: '#ffffff', DROP: '#ff2266' }[s] } }); b.dataset.s = s; b.onclick = () => select(s); tabs.appendChild(b); });
  function drawCue() {
    cueBox.innerHTML = ''; if (!S) return;
    const c = S.cues[sel] || {}; const e = (patch) => view.emit('cue_edit', { section: sel, patch });
    const row = h('div', { class: 'org-row' });
    row.append(UI.Select({ label: 'Sequencer', options: [{ value: '', label: '—' }].concat(S.sequencers), value: c.target || '', onChange: (v) => e({ target: v || null }) }).el,
      UI.Select({ label: 'Pattern', options: [{ value: '', label: '—' }].concat(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']), value: c.slot || '', onChange: (v) => e({ slot: v || null }) }).el,
      UI.Toggle({ label: 'DJ filter sweep', value: typeof c.djStart === 'number', onChange: (v) => e(v ? { djStart: -0.8, djEnd: 0 } : { djStart: null, djEnd: null }) }).el);
    if (typeof c.djStart === 'number') row.append(UI.Knob({ label: 'from', min: -1, max: 1, step: 0.01, value: c.djStart, default: 0, size: 28, onChange: (v) => e({ djStart: v }) }).el, UI.Knob({ label: 'to', min: -1, max: 1, step: 0.01, value: c.djEnd ?? c.djStart, default: 0, size: 28, onChange: (v) => e({ djEnd: v }) }).el);
    if (S.labs.length) row.append(UI.Select({ label: 'EDM Lab energy', options: [{ value: '', label: '—' }].concat(S.labs), value: c.energyTarget || '', onChange: (v) => e({ energyTarget: v || null, energy: c.energy ?? 0.6 }) }).el, UI.Knob({ label: 'energy', min: 0, max: 1, step: 0.01, value: c.energy ?? 0.6, default: 0.6, size: 28, onChange: (v) => e({ energy: v }) }).el);
    if (S.channels.length) { const m = h('div', { class: 'uk-field' }, [h('span', { text: 'Mute in this section' })]); S.channels.forEach(ch => m.appendChild(UI.Toggle({ label: ch.label, value: (c.mutes || []).includes(ch.value), onChange: (v) => { const ms = new Set(c.mutes || []); v ? ms.add(ch.value) : ms.delete(ch.value); e({ mutes: Array.from(ms) }); } }).el)); row.append(m); }
    cueBox.append(h('div', { class: 'uk-group-title', text: 'WHAT ELSE PLAYS HERE' }), row);
    if (sel === 'DROP') { const after = S.cues.AFTER || {}; cueBox.append(h('div', { class: 'org-row' }, [h('span', { class: 'org-label', text: 'After the drop play' }), UI.Select({ options: [{ value: '', label: '—' }].concat(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']), value: after.slot || '', onChange: (v) => view.emit('cue_edit', { section: 'AFTER', patch: { slot: v || null, target: after.target || (S.sequencers[0] || {}).value || null } }) }).el])); }
  }
  // HER VOICE — first and biggest: the reason this tool exists
  const vName = h('div', { class: 'db-vname', text: 'Drop her clip here (or on the strip above) — or “Send clip to… → Drop Builder” from a Sample window.' });
  const vPanel = h('div', { class: 'uk-group db-voice' }, [h('div', { class: 'uk-group-title', text: '💘 HER VOICE — the line right before the drop' }), vName,
    h('div', { class: 'org-row' }, [UI.Button({ label: '▶ hear her line', onClick: () => view.emit('vocal_audition', {}) }).el].concat(['vocalEndOnDrop', 'vocalTrimStart', 'vocalTrimEnd', 'stutter', 'vocalGain', 'vocalHpf', 'throw'].map(k => UI.paramControl(view, cfg(k), { size: 30 }).el)))]);
  vPanel.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); vPanel.classList.add('over'); });
  vPanel.addEventListener('dragleave', () => vPanel.classList.remove('over'));
  vPanel.addEventListener('drop', async (e) => { e.preventDefault(); e.stopPropagation(); vPanel.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) view.emit('vocal_load', { arrayBuffer: await f.arrayBuffer(), name: f.name }); });
  view.on('state_sync', (s) => { if (s.cues) { S = s; drawCue(); } vName.textContent = s.vocal ? `🎤 ${s.vocal.name} · ${s.vocal.duration.toFixed(2)} s` : 'Drop her clip here (or on the strip above) — or “Send clip to… → Drop Builder” from a Sample window.'; vPanel.classList.toggle('has', !!s.vocal); });
  if (!document.getElementById('db-style')) document.head.appendChild(h('style', { id: 'db-style', text: `
    .db-voice { border: 1px solid color-mix(in srgb, #ff2266 45%, var(--line2)); background: linear-gradient(180deg, color-mix(in srgb, #ff2266 10%, var(--panel)), var(--panel)); }
    .db-voice.over { box-shadow: 0 0 0 2px #ff2266, 0 0 24px rgba(255,34,102,.4); } .db-voice.has .db-vname { color: #ffd0de; font-weight: 600; }
    .db-vname { color: var(--dim); font-size: 12.5px; margin: 2px 0 6px; }
    .db-tabs { display: flex; gap: 6px; margin: 10px 0 6px; } .db-tab { flex: 1; height: 34px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--c) 40%, var(--line2)); background: color-mix(in srgb, var(--c) 8%, var(--panel2)); color: var(--text); font: 700 12px var(--mono); letter-spacing: 1.2px; cursor: pointer; }
    .db-tab.on { background: color-mix(in srgb, var(--c) 28%, var(--panel2)); border-color: var(--c); box-shadow: 0 0 14px color-mix(in srgb, var(--c) 35%, transparent); }
    .db-sec { border: 1px solid var(--line2); border-radius: 10px; padding: 8px 10px; background: color-mix(in srgb, var(--panel) 90%, transparent); }
    .db-sec-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; } .db-sec-title { font: 700 11px var(--mono); letter-spacing: 1.2px; color: var(--dim); text-transform: uppercase; }
    .db-cue { margin-top: 6px; } .db-grp { margin-top: 6px; }` }));
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [h('div', { class: 'org-row', style: { margin: 0 } }, [fire.el, abort.el, status]), UI.presetBar(view)]),
    bar, UI.hint('Click a section (or a tab below) to edit everything in it · drag a section’s right edge to change its length · drop her voice onto the lower strip or the voice panel · drag the vocal to move it.'),
    vPanel, tabs,
    h('div', { class: 'db-sec' }, [h('div', { class: 'db-sec-head' }, [secTitle, h('div', { class: 'org-row', style: { margin: 0 } }, [lenBox, hear.el])]), panelBox, cueBox]),
    UI.paramPanel(view, ['startMode', 'autoFire', 'outroBars'], { flat: true, noTitles: true, size: 28 }),
  );
  select(sel);
  UI.alive(view, { port: 'fx', events: ['section', 'run'] });
});
