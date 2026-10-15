/* eravos.session UI — big BPM + TAP, key wheel + scale with plain-language hint, file row, export row with progress */
OrganismFactory.reg('eravos.session', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const name = UI.paramControl(view, cfg('songName'));
  const bpm = UI.NumberDrag({ min: 40, max: 240, step: 1, value: view.state.bpm, label: 'BPM', suffix: ' BPM', onChange: (v) => view.set('bpm', v) });
  bpm.el.style.fontSize = '26px'; bpm.el.style.padding = '6px 14px';
  view.bind('bpm', (v) => bpm.set(v));
  const tap = UI.Button({ label: 'TAP', kind: 'big', hint: 'tap 4+ times on the beat', onClick: () => view.emit('tap', { t: performance.now() / 1000 }) });
  // key wheel
  const wheel = UI.Canvas(150, 150); wheel.style.width = '150px'; wheel.style.cursor = 'pointer';
  const order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // circle of fifths
  UI.loop(wheel, () => {
    const g = wheel.g, cx = 75, cy = 75; g.clearRect(0, 0, 150, 150);
    order.forEach((pc, i) => {
      const a0 = (i - 0.5) / 12 * Math.PI * 2 - Math.PI / 2, a1 = (i + 0.5) / 12 * Math.PI * 2 - Math.PI / 2;
      const on = pc === view.state.root;
      g.beginPath(); g.moveTo(cx + Math.cos(a0) * 34, cy + Math.sin(a0) * 34); g.arc(cx, cy, 70, a0, a1); g.arc(cx, cy, 34, a1, a0, true); g.closePath();
      g.fillStyle = on ? '#ffaa00' : (i % 2 ? '#141c27' : '#18222f'); g.fill(); g.strokeStyle = '#0b0f14'; g.stroke();
      const am = (a0 + a1) / 2; g.fillStyle = on ? '#000' : '#cfe'; g.font = (on ? '700 ' : '') + '12px sans-serif'; g.textAlign = 'center'; g.fillText(MT.NAMES[pc], cx + Math.cos(am) * 52, cy + Math.sin(am) * 52 + 4);
    });
    g.fillStyle = '#ffaa00'; g.font = '700 16px sans-serif'; g.textAlign = 'center'; g.fillText(MT.NAMES[view.state.root], cx, cy + 2);
    g.fillStyle = '#7f93a8'; g.font = '10px sans-serif'; g.fillText(String(view.state.scale).replace('_', ' '), cx, cy + 16);
  }, 15);
  wheel.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const r = wheel.getBoundingClientRect(); const x = e.clientX - r.left - 75, y = e.clientY - r.top - 75;
    if (Math.hypot(x, y) < 30) return; let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
    view.set('root', order[Math.round(a / (Math.PI * 2) * 12) % 12]);
  });
  const scale = UI.Select({ options: MT.scales.map(s => ({ value: s, label: s.replace('_', ' ') })), value: view.state.scale, onChange: (v) => view.set('scale', v) });
  view.bind('scale', (v) => scale.set(v));
  const hint = h('div', { class: 'uk-hint', style: { maxWidth: '180px' } });
  view.on('state_sync', (s) => { hint.textContent = s.hint ? '“' + s.hint + '”' : ''; });
  view.bind('scale', (v) => { hint.textContent = '“' + (MT.HINTS[v] || '') + '”'; });
  const metro = UI.paramControl(view, cfg('metronome')), cin = UI.paramControl(view, cfg('countIn'), { size: 28 });
  // files
  const fileIn = h('input', { type: 'file', accept: '.json', style: { display: 'none' } });
  fileIn.addEventListener('change', async () => { const f = fileIn.files[0]; if (f) view.emit('open', { text: await f.text() }); });
  const status = h('div', { class: 'uk-hint', text: '' });
  const auto = h('div', { class: 'uk-hint', text: 'autosave: —' });
  view.on('autosaved', (p) => { auto.style.color = ''; auto.textContent = 'autosaved ' + new Date(p.time).toLocaleTimeString(); });
  view.on('autosave_failed', () => { auto.textContent = 'NOT saved — storage blocked: use Save'; auto.style.color = '#ff5577'; });
  view.on('status', (s) => { status.textContent = s.text; });
  view.on('file_ready', (f) => { window.Workspace.download(f.name, f.data, f.mime); if (window.Workspace.markKept) window.Workspace.markKept(); });
  // P11.3 (gate S): keep the song as a named project inside ERAVOS (Start screen → PROJECTS opens it)
  const projBtn = UI.Button({ label: 'Keep as project', hint: 'save this song under its name inside ERAVOS — reopen it from the Start screen', onClick: async () => {
    const name = (view.state.songName || 'untitled').trim(); const ok = await window.Workspace.projects.save(name);
    if (window.Shell) window.Shell.toast(ok ? `Kept “${name}” in your projects (Start → PROJECTS).` : 'Couldn’t keep the project — your browser storage may be full or blocked.', ok ? 'good' : 'bad', 4000);
  } });
  const prog = h('div', { style: { height: '6px', background: '#1a2533', borderRadius: '3px', overflow: 'hidden' } }, [h('div', { style: { height: '100%', width: '0%', background: 'linear-gradient(90deg,#ff2266,#b066ff)' } })]);
  view.on('progress', (p) => { if (p.state === 'progress') prog.firstChild.style.width = (p.progress * 100) + '%'; if (p.state === 'done') prog.firstChild.style.width = '100%'; if (p.state === 'start') prog.firstChild.style.width = '0%'; });
  const bars = UI.paramControl(view, cfg('bounceBars'), { size: 30 }), bits = UI.paramControl(view, cfg('bitDepth')), autoL = UI.paramControl(view, cfg('autoLength'));
  view.root.append(
    h('div', { class: 'org-row' }, [name.el]),
    h('div', { class: 'org-row' }, [bpm.el, tap.el, metro.el, cin.el]),
    h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } }, [wheel, h('div', { class: 'org-col' }, [h('span', { class: 'org-label', text: 'Scale' }), scale.el, hint])]),
    h('div', { class: 'uk-group', style: { marginTop: '6px' } }, [h('div', { class: 'uk-group-title', text: 'PROJECT' }), h('div', { class: 'org-row' }, [UI.Button({ label: 'New', onClick: () => { if (confirm('Start a new song? (the current one stays in autosave)')) view.emit('new', {}); } }).el, UI.Button({ label: 'Open…', onClick: () => fileIn.click() }).el, UI.Button({ label: 'Save', kind: 'primary', hint: 'download a .eravos.json file (your clips are inside it)', onClick: () => view.emit('save', {}) }).el, projBtn.el, fileIn]), auto]),
    h('div', { class: 'uk-group', style: { marginTop: '6px' } }, [h('div', { class: 'uk-group-title', text: 'EXPORT' }), h('div', { class: 'org-row' }, [bars.el, bits.el, autoL.el]), h('div', { class: 'org-row' }, [UI.Button({ label: '⤓ BOUNCE WAV', kind: 'primary big', onClick: () => view.emit('bounce', {}) }).el, UI.Button({ label: '⏺ Record', onClick: () => view.emit('record', {}) }).el]), prog, status]),
  );
});
