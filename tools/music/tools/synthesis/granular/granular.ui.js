/* eravos.granular UI — the grain field: every live grain drawn where it reads (x: position in memory / clip) and how it is
 * pitched (y), fading over its life; the spray band around Position. Click the field to burst grains there. */
OrganismFactory.reg('eravos.granular', function (view) {
  const UI = view.ui, h = UI.h;
  let grains = [], filled = 0, clip = null;
  view.on('grains', (d) => { grains = d.g || []; filled = d.filled || 0; });
  const src = h('div', { class: 'uk-hint' });
  const paintSrc = () => { src.textContent = clip ? `clip: ${clip.clip} (${clip.seconds.toFixed(1)} s) — the cloud plays the clip` : `live: drawing from the last ${Math.min(view.state.memory, filled || 0).toFixed(1)} of ${view.state.memory} s of what is wired in`; };
  view.on('source', (s) => { clip = s.clip ? s : null; paintSrc(); });
  const cv = UI.Canvas(520, 150); cv.style.cursor = 'crosshair';
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 150, s = view.state, Y = (st) => H / 2 - st / 24 * (H / 2 - 10);
    g.fillStyle = '#081005'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1b2a12'; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    const x0 = Math.max(0, s.position - s.spray) * W, x1 = Math.min(1, s.position + s.spray) * W;
    g.fillStyle = 'rgba(170,255,68,.08)'; g.fillRect(x0, 0, x1 - x0, H); g.fillStyle = '#aaff44'; g.fillRect(s.position * W - 1, 0, 2, H);
    grains.forEach(([x, st, life]) => { g.globalAlpha = Math.max(0.15, 1 - life); g.beginPath(); g.arc(x * W, Y(st), 3 + 3 * Math.sin(Math.PI * life), 0, 7); g.fill(); });
    g.globalAlpha = 1; g.fillStyle = '#7f93a8'; g.font = '10px monospace';
    g.fillText(`${clip ? 'clip' : 'live'} · ${s.sync !== 'off' ? 'sync ' + s.sync : s.density.toFixed(0) + '/s'} · ${(s.size * 1000).toFixed(0)} ms${s.freeze ? ' · FROZEN' : ''}${s.keys ? ' · keys' : ''}`, 6, 12);
    g.fillText(clip ? 'start' : 'older', 6, H - 4); g.fillText(clip ? 'end' : 'now', W - 28, H - 4);
  }, 30);
  cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; view.emit('burst', { pos: x, pitch: Math.round((0.5 - y) * 48) }); });
  const file = h('input', { type: 'file', accept: 'audio/*', style: { display: 'none' } });
  file.addEventListener('change', () => { const f = file.files && file.files[0]; if (!f) return; f.arrayBuffer().then(ab => view.emit('load', { arrayBuffer: ab, name: f.name })); file.value = ''; });
  const live = UI.Button({ label: '● Live', hint: 'draw from whatever is wired into it (forget the clip)', onClick: () => view.emit('live', {}) });
  const load = UI.Button({ label: 'Load clip…', hint: 'a sound file to scatter (or wire a Clip Maker into it)', onClick: () => file.click() });
  paintSrc(); view.bind('memory', paintSrc);
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0, gap: '6px' } }, [live.el, load.el, UI.paramControl(view, view.descriptor.config.find(c => c.key === 'bypass')).el])]),
    cv, src, file,
    UI.paramPanel(view, ['position', 'spray', 'memory', 'scan', 'freeze', 'size', 'shape', 'density', 'sync', 'reverse', 'pitch', 'pitchSpray', 'quantize', 'keys', 'width', 'feedback', 'level', 'mix'], { size: 30 }),
    UI.audioRouting(view, { emptyIn: 'Nothing plugged in — wire any sound into it (or put it in a tool’s 🧩 MODS rack), or load a clip.' }).el,
  );
});
