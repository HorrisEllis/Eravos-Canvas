/* eravos.drum-forge UI — 4×4 pads (bottom-left = pad 1, like the StarryPad) that flash on every hit, the selected
 * sound's rendered waveform, its voice model + shaping knobs, render / kit ZIP / send-to-pad. */
OrganismFactory.reg('eravos.drum-forge', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let slots = [], types = [], sel = 0, prev = null;
  const ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];
  const grid = h('div', { class: 'forge-pads' }); const cells = [];
  ORDER.forEach(i => { const b = h('button', { class: 'forge-pad', 'aria-label': 'Pad ' + (i + 1) + ' — play' }, [h('span', { text: '' }), h('small', { text: '' })]); b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); sel = i; view.emit('hit', { i, vel: e.shiftKey ? 1 : 0.85 }); paint(); editor(); view.emit('preview', { i }); }); b.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); e.stopPropagation(); sel = i; view.emit('hit', { i, vel: 0.85 }); paint(); editor(); view.emit('preview', { i }); } }); cells[i] = b; grid.appendChild(b); });
  function paint() { cells.forEach((b, i) => { const s = slots[i]; if (!s) return; b.firstChild.textContent = s.name; b.lastChild.textContent = `${i + 1} · ${s.type}`; b.classList.toggle('sel', i === sel); b.setAttribute('aria-label', `Pad ${i + 1}: ${s.name} — play`); }); }
  view.on('hit', (p) => { const b = cells[p.i]; if (!b) return; b.classList.add('hit'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('hit'), 110); });
  const wave = UI.Canvas(300, 90);
  UI.loop(wave, () => { const g = wave.g; wave.fit(); const W = wave.W, H = 90; g.fillStyle = '#0a0806'; g.fillRect(0, 0, W, H); if (!prev || prev.i !== sel) return; const n = prev.peaks.length / 2; g.fillStyle = '#ff7b00'; for (let x = 0; x < W; x++) { const k = Math.floor(x / W * n); const mn = prev.peaks[k * 2], mx = prev.peaks[k * 2 + 1]; g.fillRect(x, H / 2 - mx * H / 2, 1, Math.max(1, (mx - mn) * H / 2)); } g.fillStyle = '#c9a07a'; g.font = '10px monospace'; g.fillText(prev.dur.toFixed(2) + ' s', 4, 12); }, 15);
  view.on('preview', (p) => { prev = p; });
  const ed = h('div', { class: 'org-col' });
  const KN = [['tune', -24, 24, 0.5, 'Tune', 'st'], ['decay', 0.01, 8, 0.01, 'Decay', 's'], ['pitch', 0, 48, 0.5, 'Pitch env', 'st'], ['ptime', 0.002, 0.6, 0.001, 'Pitch time', 's'], ['tone', 0, 1, 0.01, 'Tone'], ['noise', 0, 1, 0.01, 'Noise'], ['snap', 0, 1, 0.01, 'Snap'], ['drive', 0, 1, 0.01, 'Drive'], ['fm', 0.25, 8, 0.0001, 'FM ratio'], ['fmi', 0, 8, 0.01, 'FM index'], ['gate', 0, 1, 0.01, 'Gate verb'], ['pan', -1, 1, 0.01, 'Pan'], ['level', 0, 1.5, 0.01, 'Level'], ['choke', 0, 4, 1, 'Choke grp']];
  let tmr = 0;
  function editor() {
    ed.innerHTML = ''; const s = slots[sel]; if (!s) return;
    const typeSel = UI.Select({ options: types, value: s.type, onChange: (v) => view.emit('slot_edit', { i: sel, patch: { type: v }, audition: true }) });
    const name = h('input', { class: 'uk-text', value: s.name, style: { width: '120px' } }); name.addEventListener('change', () => view.emit('slot_edit', { i: sel, patch: { name: name.value } })); name.addEventListener('pointerdown', e => e.stopPropagation());
    const row = h('div', { class: 'uk-row', style: { flexWrap: 'wrap', gap: '4px' } });
    KN.forEach(([k, min, max, step, label, unit]) => { const kn = UI.Knob({ key: k, min, max, step, label, unit, value: s[k], size: 30, accent: '#ff7b00', onChange: (v) => { view.emit('slot_edit', { i: sel, patch: { [k]: v } }); clearTimeout(tmr); tmr = setTimeout(() => { view.emit('hit', { i: sel, vel: 0.85 }); view.emit('preview', { i: sel }); }, 260); } }); row.appendChild(kn.el); });
    ed.append(h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap' } }, [h('span', { class: 'org-label', text: `PAD ${sel + 1}` }), typeSel.el, name,
      UI.Button({ label: '▶', hint: 'play', onClick: () => view.emit('hit', { i: sel }) }).el,
      UI.Button({ label: '⤓ WAV', hint: 'render this sound to a 24-bit WAV', onClick: () => view.emit('render', { i: sel }) }).el,
      targetSel.el, UI.Button({ label: '⇢ Send', hint: 'render and load it into the chosen Drum Machine / Sample Player / Song Recorder', onClick: () => { const t = targetSel.get(); if (t) view.emit('send', { i: sel, target: t }); } }).el]), row);
  }
  const targetSel = UI.Select({ options: [] });
  const refresh = () => targetSel.setOptions([{ value: '', label: 'send to…' }].concat(view.targets().filter(t => /Drum Machine|Sample|Song Recorder|Clip/i.test(t.label))));
  view.observe('factory:spawned', refresh); view.observe('kernel:organism', refresh); refresh();
  const dl = (blob, name) => window.Codecs.download(blob, name);
  view.on('file', (f) => dl(new Blob([f.data], { type: 'audio/wav' }), f.name));
  view.on('zip', (z) => dl(z.blob, z.name));
  view.on('state_sync', (s) => { if (!s.slots) return; slots = s.slots; types = s.types; sel = view.state.sel || sel; paint(); if (!ed.contains(document.activeElement)) editor(); });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [UI.presetBar(view), UI.paramControl(view, cfg('room'), { size: 28 }).el, UI.paramControl(view, cfg('volume'), { size: 28 }).el,
      UI.Button({ label: '⤓ Kit (16 WAV, zip)', hint: 'every pad as a 24-bit WAV — load them into any sampler or pad app', onClick: () => view.emit('render_kit') }).el]),
    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }, [grid, wave]), ed,
    UI.hint('Shift-click a pad for full velocity. Pads 1–16 answer notes 36–51 and the StarryPad (through MIDI Map). Gate verb sends a hit into the shared 80s gated room.'),
  );
  setTimeout(() => view.emit('preview', { i: 0 }), 50);
});
