/* eravos.edm-lab UI 4.0 — one workstation, six pages:
 *   top     presets · pattern slots A–D (click = play it, ⧉ = copy this one there) · chain · actions (🎲 ✨ FILL BREAK DROP ⤓ MIDI PRINT)
 *   macro   ENERGY · TENSION · SWING · HUMANIZE · PUMP · section light — always in reach
 *   pages   RHYTHM (density canvas, kit, brush, groove starters) · BASS (ribbon + synth) · CHORDS (tension wheel + voice)
 *           LEAD (ribbon + synth) · ARRANGE (32-bar song map, build length, riser) · MIX (8 drum lanes + 4 outputs) */
OrganismFactory.reg('eravos.edm-lab', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let map = null, rows = [], kinds = [], lanes = [], filled = [], cursor = -1, flash = {}, bassNotes = [], leadNotes = [], chord = null, seqs = [], section = null, songBar = -1;
  const brush = { size: 1, strength: 1, erase: false };
  const COL = ['#ff2266', '#ffaa00', '#b87a00', '#ffdd00', '#ddff44', '#ff66aa', '#00ff88', '#ccff99'];

  // ---------------------------------------------------------------- top bar: pattern slots + chain + actions
  const slotEls = {};
  const slots = h('div', { class: 'lab-slots', role: 'group', 'aria-label': 'Patterns' }, ['A', 'B', 'C', 'D'].map(s => {
    const b = h('button', { class: 'lab-slot', title: 'play pattern ' + s + ' (shift-click: copy the current pattern here)', text: s });
    b.onclick = (e) => { if (e.shiftKey) view.emit('pattern_copy', { to: s }); else view.set('pattern', s); };
    slotEls[s] = b; return b;
  }));
  const copyTo = UI.Select({ options: [{ value: '', label: '⧉ copy to…' }, 'A', 'B', 'C', 'D'].map(x => typeof x === 'string' ? { value: x, label: '⧉ → ' + x } : x), onChange: (v) => { if (v) view.emit('pattern_copy', { to: v }); copyTo.select.value = ''; } });
  const paintSlots = () => Object.keys(slotEls).forEach(s => { slotEls[s].classList.toggle('on', view.state.pattern === s); slotEls[s].classList.toggle('filled', filled.includes(s)); });
  view.bind('pattern', paintSlots);
  const dropB = UI.Button({ label: '⬇ DROP', kind: 'danger', hint: 'next bar: a build (riser + snare roll, Build bars long) with a silent last beat, then the impact', onClick: () => view.emit('drop_arm', {}) });
  const fillB = UI.Button({ label: 'FILL', hint: 'the next bar ends in a snare + perc fill', onClick: () => view.emit('fill', {}) });
  const breakB = UI.Button({ label: 'BREAK', hint: 'drums and bass out until you press it again', onClick: () => view.emit('break', {}) });
  const midiB = UI.Button({ label: '⤓ MIDI', hint: 'save 8 bars as a .mid file — drums, bass, chords and lead, exactly what you hear', onClick: () => view.emit('export_midi', { bars: 8 }) });
  view.on('midi_file', (f) => { const bytes = Uint8Array.from(f.bytes || []), W = window.Workspace; if (W && W.download) W.download(f.name, bytes, 'audio/midi'); else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' })); a.download = f.name; a.click(); } });
  view.on('drop', (d) => { if (d.armed !== undefined) dropB.el.classList.toggle('lab-armed', d.armed); if (d.time) dropB.el.classList.remove('lab-armed'); });
  view.on('fill', () => { fillB.el.classList.add('lab-armed'); setTimeout(() => fillB.el.classList.remove('lab-armed'), 1200); });
  view.on('break', (b) => breakB.el.classList.toggle('lab-on', !!b.on));
  const tgt = UI.Select({ options: [] }); const refresh = () => tgt.setOptions(seqs.length ? seqs : [{ value: '', label: 'add a Sequencer first' }]);
  const printB = UI.Button({ label: 'PRINT → seq', kind: 'primary', hint: 'bake 2 bars of this groove into real Sequencer lanes', onClick: () => { if (tgt.select.value) view.emit('print', { target: tgt.select.value }); } });

  // ---------------------------------------------------------------- macro strip
  const knob = (key, o) => UI.paramControl(view, cfg(key), Object.assign({ size: 34 }, o || {})).el;
  const secLight = h('div', { class: 'lab-sec', text: 'LOOP' });
  const macro = h('div', { class: 'lab-macro' }, [knob('energy', { size: 44 }), knob('tension', { size: 44 }), knob('swing'), knob('humanize'), knob('density'), knob('pump', { size: 40 }), knob('pumpRelease'), secLight]);
  view.on('section', (s) => { section = s.section; songBar = s.bar; secLight.textContent = (section || 'loop').toUpperCase(); secLight.dataset.sec = section || ''; });

  // ---------------------------------------------------------------- RHYTHM page: density canvas
  const cv = UI.Canvas(560, 216); cv.style.cursor = 'crosshair'; cv.style.width = '100%';
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 216, rh = H / 8, lw = 58, cw = (W - lw) / 32; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    if (!map) return;
    rows.forEach((r, i) => {
      const l = lanes[i] || {}, solo = lanes.some(x => x.solo), live = !l.mute && (!solo || l.solo);
      g.globalAlpha = live ? 1 : 0.35; g.fillStyle = COL[i]; g.font = '600 10px monospace'; g.fillText(r, 4, i * rh + rh / 2 + 3);
      if (l.mute) { g.fillStyle = '#ff2266'; g.fillText('M', lw - 14, i * rh + rh / 2 + 3); } else if (l.solo) { g.fillStyle = '#ffdd00'; g.fillText('S', lw - 14, i * rh + rh / 2 + 3); }
      for (let s = 0; s < 32; s++) {
        const v = map[i][s], x = lw + s * cw, y = i * rh;
        g.fillStyle = s % 16 === 0 ? '#1a2432' : s % 4 === 0 ? '#141c27' : '#10161f'; g.fillRect(x + 1, y + 1, cw - 2, rh - 2);
        if (v > 0) { g.fillStyle = COL[i]; g.globalAlpha = (live ? 1 : 0.35) * (0.2 + 0.8 * v); g.fillRect(x + 1, y + 1 + (1 - v) * (rh - 2), cw - 2, v * (rh - 2)); g.globalAlpha = live ? 1 : 0.35; }
        const f = flash[i + ':' + s]; if (f && performance.now() - f < 140) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, cw - 2, rh - 2); }
      }
      g.globalAlpha = 1;
    });
    if (cursor >= 0) { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(lw + cursor * cw, 0, cw, H); }
  }, 30);
  let painting = false;
  const at = (e) => { const r = cv.getBoundingClientRect(), lw = 58 * r.width / cv.W, cw = (r.width - lw) / 32; return { x: e.clientX - r.left, lw, row: Math.max(0, Math.min(7, Math.floor((e.clientY - r.top) / (r.height / 8)))), step: Math.max(0, Math.min(31, Math.floor((e.clientX - r.left - lw) / cw))) }; };
  const paint = (e) => { const p = at(e); view.emit('paint', { row: p.row, step: p.step, radius: brush.size - 1, value: brush.erase || e.button === 2 || e.buttons === 2 ? 0 : brush.strength }); };
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const p = at(e);
    if (p.x < p.lw) { const l = lanes[p.row] || {}; view.emit('lane', { i: p.row, key: e.shiftKey ? 'solo' : 'mute', value: !(e.shiftKey ? l.solo : l.mute) }); return; }   // lane name: click mutes, shift-click solos
    painting = true; cv.setPointerCapture(e.pointerId); paint(e);
  });
  cv.addEventListener('pointermove', (e) => { if (painting) paint(e); });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { painting = false; }));
  view.on('map', (m) => { map = m.map; if (m.filled) { filled = m.filled; paintSlots(); } });
  view.on('lanes', (x) => { lanes = x.lanes; paintMix(); });
  view.on('hits', (x) => UI.atTime(view.ac, x.time, () => { cursor = x.step; const n = performance.now(); x.rows.forEach((on, i) => { if (on) flash[i + ':' + x.step] = n; }); if (x.pattern) Object.keys(slotEls).forEach(s => slotEls[s].classList.toggle('playing', s === x.pattern)); }));
  const brushSize = UI.Segmented({ label: '', hint: 'brush size', options: [{ value: 1, label: '•', hint: 'small brush' }, { value: 2, label: '●', hint: 'medium brush' }, { value: 4, label: '⬤', hint: 'large brush' }], value: 1, onChange: (v) => { brush.size = v; } });
  const brushStr = UI.Knob({ label: 'Strength', min: 0.1, max: 1, step: 0.05, value: 1, default: 1, size: 26, onChange: (v) => { brush.strength = v; } });
  const erase = UI.Toggle({ label: 'Erase', onChange: (v) => { brush.erase = v; } });
  const starter = UI.Select({ options: [{ value: '', label: '✦ groove starter…' }], onChange: (v) => { if (v) view.emit('map_kind', { kind: v }); starter.select.value = ''; } });
  const rhythmPage = h('div', { class: 'lab-page' }, [
    h('div', { class: 'org-row lab-tools' }, [UI.paramControl(view, cfg('kit'), { segMax: 0 }).el, knob('kitDrive', { size: 28 }), starter.el, brushSize.el, brushStr.el, erase.el,
      UI.Button({ label: 'Clear', hint: 'empty this pattern', onClick: () => view.emit('clear', {}) }).el, UI.Button({ label: '🎲 Reseed', hint: 'a new roll of the dice on the same painting', onClick: () => view.emit('reseed', {}) }).el,
      UI.Button({ label: '✨ Mutate', hint: 'nudge the painting — the groove evolves without losing itself', onClick: () => view.emit('mutate', {}) }).el]),
    cv,
    UI.hint('Paint where the drums are busy (right-click erases). Click a lane name to mute it, shift-click to solo. Density fires more or less of what you painted; Seed rolls which hits fire.'),
  ]);

  // ---------------------------------------------------------------- note ribbons (bass / lead)
  function ribbon(list, colour, label) {
    const c = UI.Canvas(560, 110); c.style.width = '100%';
    UI.loop(c, () => { const g = c.g, W = c.fit().W, H = 110, now = performance.now(); g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
      list.forEach(n => { const x = W - (now - n.t) / 18; if (x < -30) return; const y = H - 8 - ((n.midi - 24) / 72) * (H - 16); g.fillStyle = colour; g.fillRect(x, y - 4, 22, 8); g.fillStyle = '#fff'; g.font = '9px monospace'; g.fillText(n.name, x + 2, y - 6); });
      g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText(label, 4, 11); }, 30);
    return c;
  }
  const push = (list) => (n) => UI.atTime(view.ac, n.time, () => { list.push({ midi: n.midi, name: n.name, t: performance.now() }); if (list.length > 48) list.shift(); });
  view.on('bass_note', push(bassNotes)); view.on('lead_note', push(leadNotes));
  const bassPage = h('div', { class: 'lab-page' }, [
    h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('bassStyle'), { segMax: 0 }).el, UI.paramControl(view, cfg('bassWave')).el, UI.paramControl(view, cfg('wobble'), { segMax: 0 }).el]),
    ribbon(bassNotes, '#ff2266', 'BASS — notes actually played'),
    UI.paramPanel(view, ['bassOctave', 'bassCutoff', 'bassRes', 'bassEnv', 'bassDrive', 'bassGlide', 'bassSub'], { flat: true, noTitles: true, size: 34 }),
    UI.hint('Follow kick plays on your kick peaks; rolling fills the gaps between them; acid is a seeded 16th line with slides and accents (Reseed rolls a new one); wobble locks a filter LFO to the beat.'),
  ]);
  // tension wheel
  const wheel = UI.Canvas(190, 190); wheel.style.width = '190px';
  view.on('chord', (c) => UI.atTime(view.ac, c.time, () => { chord = c; }));
  UI.loop(wheel, () => {
    const g = wheel.g, cx = 95, cy = 95; g.clearRect(0, 0, 190, 190);
    const order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
    g.strokeStyle = '#223044'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 68, 0, 7); g.stroke();
    order.forEach((pc, i) => { const a = i / 12 * Math.PI * 2 - Math.PI / 2; const on = chord && chord.notes.some(n => n % 12 === pc); g.fillStyle = on ? '#ff2266' : '#1a2533'; g.beginPath(); g.arc(cx + Math.cos(a) * 68, cy + Math.sin(a) * 68, on ? 9 : 5, 0, 7); g.fill(); g.fillStyle = '#7f93a8'; g.font = '8px monospace'; g.textAlign = 'center'; g.fillText(MT.NAMES[pc], cx + Math.cos(a) * 85, cy + Math.sin(a) * 85 + 3); });
    const t = view.state.tension || 0; g.strokeStyle = '#ff2266'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, 46, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2); g.stroke();
    g.fillStyle = '#fff'; g.font = '700 15px sans-serif'; g.textAlign = 'center'; g.fillText(chord ? chord.name : '—', cx, cy + 4); g.font = '9px monospace'; g.fillStyle = '#7f93a8'; g.fillText('TENSION ' + t.toFixed(2), cx, cy + 19); g.textAlign = 'left';
  }, 20);
  let drag = null;
  wheel.addEventListener('pointerdown', (e) => { e.stopPropagation(); drag = { y: e.clientY, v: view.state.tension }; wheel.setPointerCapture(e.pointerId); });
  wheel.addEventListener('pointermove', (e) => { if (drag) view.set('tension', Math.max(0, Math.min(1, +(drag.v + (drag.y - e.clientY) / 150).toFixed(3)))); });
  ['pointerup', 'pointercancel'].forEach(t => wheel.addEventListener(t, () => { drag = null; }));
  const chordPage = h('div', { class: 'lab-page' }, [
    h('div', { style: { display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' } }, [wheel, h('div', { class: 'org-col', style: { flex: '1', minWidth: '260px' } }, [
      UI.paramControl(view, cfg('progression'), { segMax: 0 }).el, UI.paramControl(view, cfg('chordStyle')).el, UI.paramControl(view, cfg('chordBars')).el,
      UI.paramPanel(view, ['chordOctave', 'chordBright', 'chordWidth', 'chordAttack', 'chordRelease'], { flat: true, noTitles: true, size: 32 })])]),
    UI.hint('Drag the wheel up and down for TENSION: triads → add9 → 7sus4 → clusters with a tritone and a ♭9. Lit dots are the notes of the chord now, on the circle of fifths.'),
  ]);
  const leadPage = h('div', { class: 'lab-page' }, [
    h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('leadOn')).el, UI.paramControl(view, cfg('leadStyle'), { segMax: 0 }).el, UI.paramControl(view, cfg('leadRate')).el, UI.paramControl(view, cfg('leadWave')).el]),
    ribbon(leadNotes, '#00d4ff', 'LEAD — notes actually played'),
    UI.paramPanel(view, ['leadOctave', 'leadCutoff', 'leadGate', 'leadGlide', 'leadEcho'], { flat: true, noTitles: true, size: 34 }),
    UI.hint('Arps walk the chord tones; hook is a seeded 2-bar phrase that repeats over the changing chords (Reseed for another). The echo is a dotted eighth at the song tempo.'),
  ]);

  // ---------------------------------------------------------------- ARRANGE page: the 32-bar song map
  const songMap = UI.Canvas(560, 70); songMap.style.width = '100%';
  const SEC = [['intro', 0, '#00d4ff'], ['build', 8, '#ffaa00'], ['drop', 16, '#ff2266'], ['break', 24, '#8844ff']];
  UI.loop(songMap, () => { const g = songMap.g, W = songMap.fit().W, H = 70, bw = W / 32; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    const song = view.state.arrange === 'song';
    SEC.forEach(([n, b, c]) => { g.fillStyle = c; g.globalAlpha = song ? (section === n ? 0.85 : 0.35) : 0.12; g.fillRect(b * bw + 1, 14, 8 * bw - 2, H - 22); g.globalAlpha = 1; g.fillStyle = song ? '#fff' : '#55657a'; g.font = '700 11px monospace'; g.fillText(n.toUpperCase(), b * bw + 6, 32); g.font = '9px monospace'; g.fillText('bars ' + (b + 1) + '–' + (b + 8), b * bw + 6, 46); });
    for (let b = 0; b <= 32; b += 4) { g.fillStyle = '#2a3a50'; g.fillRect(b * bw, H - 6, 1, 6); }
    if (song && songBar >= 0) { g.fillStyle = '#fff'; g.fillRect(songBar * bw, 10, 2, H - 14); }
    g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText(song ? 'SONG — the lab arranges itself, then goes round again' : 'LOOP — switch Arrange to song for a 32-bar arc', 4, 10); }, 15);
  const arrangePage = h('div', { class: 'lab-page' }, [
    h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('arrange')).el, UI.paramControl(view, cfg('buildBars')).el, knob('riser'), UI.paramControl(view, cfg('chain'), { segMax: 0 }).el]),
    songMap,
    UI.hint('Song: intro (no bass) → build (riser, energy climbs) → DROP (impact, full energy) → break (chords and lead only). DROP any time: a build of Build bars, a silent last beat, then the hit. Chain plays patterns A–D in turn, 2 bars each.'),
  ]);

  // ---------------------------------------------------------------- MIX page: 8 lanes + 4 outputs
  const mixGrid = h('div', { class: 'lab-mix' });
  function paintMix() {
    if (!rows.length || !lanes.length) return;
    mixGrid.innerHTML = '';
    rows.forEach((r, i) => {
      const l = lanes[i], set = (key) => (v) => view.emit('lane', { i, key, value: v });
      const strip = h('div', { class: 'lab-strip', style: { '--c': COL[i] } }, [h('b', { text: r }),
        UI.Knob({ label: 'Level', min: 0, max: 1.5, step: 0.01, value: l.level, default: 1, size: 28, onChange: set('level') }).el,
        UI.Knob({ label: 'Tune', min: -24, max: 24, step: 0.1, unit: 'st', value: l.tune, default: 0, size: 28, onChange: set('tune') }).el,
        UI.Knob({ label: 'Decay', min: 0.2, max: 4, step: 0.01, value: l.decay, default: 1, size: 28, onChange: set('decay') }).el,
        UI.Knob({ label: 'Pan', min: -1, max: 1, step: 0.01, value: l.pan, default: 0, size: 28, onChange: set('pan') }).el,
        h('div', { class: 'lab-ms' }, [h('button', { class: 'lab-m' + (l.mute ? ' on' : ''), text: 'M', title: 'mute ' + r, onclick: () => set('mute')(!l.mute) }), h('button', { class: 'lab-s' + (l.solo ? ' on' : ''), text: 'S', title: 'solo ' + r, onclick: () => set('solo')(!l.solo) })])]);
      mixGrid.appendChild(strip);
    });
  }
  const mixPage = h('div', { class: 'lab-page' }, [mixGrid,
    h('div', { class: 'lab-sub', text: 'OUTPUTS — each one is its own cable (wire them to their own Channels)' }),
    UI.paramPanel(view, ['rhythmOn', 'rhythmLevel', 'bassOn', 'bassLevel', 'harmonyOn', 'harmonyLevel', 'leadOn', 'leadLevel'], { flat: true, noTitles: true, size: 30 })]);

  // ---------------------------------------------------------------- tabs
  const pages = { RHYTHM: rhythmPage, BASS: bassPage, CHORDS: chordPage, LEAD: leadPage, ARRANGE: arrangePage, MIX: mixPage };
  let tab = 'RHYTHM'; const tabEls = {};
  const tabs = h('div', { class: 'lab-tabs', role: 'tablist' }, Object.keys(pages).map(k => { const b = h('button', { class: 'lab-tab', role: 'tab', text: k }); b.onclick = () => show(k); tabEls[k] = b; return b; }));
  function show(k) { tab = k; Object.keys(pages).forEach(x => { pages[x].style.display = x === k ? '' : 'none'; tabEls[x].classList.toggle('on', x === k); tabEls[x].setAttribute('aria-selected', x === k ? 'true' : 'false'); }); }
  show(tab);

  view.on('state_sync', (s) => {
    if (s.map) map = s.map; if (s.rows) rows = s.rows; if (s.lanes) { lanes = s.lanes; paintMix(); } if (s.filled) filled = s.filled; paintSlots();
    if (s.kinds && !kinds.length) { kinds = s.kinds; starter.setOptions([{ value: '', label: '✦ groove starter…' }].concat(kinds.map(k => ({ value: k, label: k })))); }
    if (s.sequencers) { seqs = s.sequencers; refresh(); }
    if (s.breakOn !== undefined) breakB.el.classList.toggle('lab-on', !!s.breakOn);
  });
  view.root.classList.add('edm-lab');
  view.root.append(
    h('div', { class: 'org-row lab-top' }, [UI.presetBar(view), slots, copyTo.el, h('span', { class: 'lab-gap' }), fillB.el, breakB.el, dropB.el, midiB.el, tgt.el, printB.el]),
    macro, tabs, ...Object.values(pages),
  );
});
