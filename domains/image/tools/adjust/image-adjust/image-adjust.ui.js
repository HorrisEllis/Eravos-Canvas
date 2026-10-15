/* eravos.image.image-adjust UI — Open / Export / Reset / hold Original · the picture (drag the crop when ✂ is on) ·
 * luma histogram · the adjustments in their groups. Drop an image file anywhere on the canvas to open it here. */
OrganismFactory.reg('eravos.image.image-adjust', function (view) {
  const UI = view.ui, h = UI.h, doc = document;
  const file = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, 'aria-hidden': 'true' });
  file.addEventListener('change', async () => { const f = file.files && file.files[0]; if (!f) return; view.emit('open_file', { arrayBuffer: await f.arrayBuffer(), name: f.name, type: f.type }); file.value = ''; });
  const openB = UI.Button({ label: '📂 Open…', kind: 'primary', hint: 'open a picture (or drop one on the canvas)', onClick: () => file.click() });
  const expB = UI.Button({ label: '⤓ Export', hint: 'save the adjusted picture', onClick: () => view.emit('export', {}) });
  const resetB = UI.Button({ label: 'Reset', hint: 'every adjustment back to neutral', onClick: () => view.emit('reset_all', {}) });
  const origB = h('button', { class: 'uk-btn ia-orig', title: 'hold to see the original', text: 'Original' });
  const hold = (on) => (e) => { e.preventDefault(); e.stopPropagation(); view.emit('original', { on }); };
  origB.addEventListener('pointerdown', hold(true)); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => origB.addEventListener(t, hold(false)));
  origB.addEventListener('keydown', (e) => { if (e.key === ' ' && !e.repeat) hold(true)(e); }); origB.addEventListener('keyup', (e) => { if (e.key === ' ') hold(false)(e); });
  const cropT = UI.Toggle({ label: '✂ Crop', hint: 'drag on the picture to crop; the shape follows “Crop shape”', onChange: (v) => { cropOn = v; draw(); } });
  const cropReset = UI.Button({ label: 'Full frame', hint: 'remove the crop', onClick: () => view.emit('crop_reset', {}) });
  const info = h('span', { class: 'ia-info', 'aria-live': 'polite', text: 'no picture yet' });
  const stage = h('div', { class: 'ia-stage' }), cv = h('canvas', { class: 'ia-canvas', role: 'img', 'aria-label': 'the adjusted picture' }), empty = h('div', { class: 'ia-empty', text: 'Open a picture, drop one on the canvas, or wire a picture into “in”.' });
  stage.append(cv, empty);
  const hist = h('canvas', { class: 'ia-hist', width: 256, height: 40, role: 'img', 'aria-label': 'brightness histogram' });
  let last = null, cropOn = false, crop = { x: 0, y: 0, w: 1, h: 1 }, srcInfo = null, drag = null;
  function draw() {
    const g = cv.getContext('2d'); if (!last) { cv.width = 1; cv.height = 1; empty.style.display = ''; return; } empty.style.display = 'none';
    // in crop mode show the whole (uncropped) frame and the crop rect over it — the engine always renders cropped,
    // so the box is drawn over the current result relative to the full frame
    cv.width = last.width; cv.height = last.height; g.drawImage(last.bitmap, 0, 0);
    if (cropOn) { g.save(); g.strokeStyle = '#6ee7f2'; g.lineWidth = Math.max(2, cv.width / 300); g.setLineDash([8, 6]); g.strokeRect(1, 1, cv.width - 2, cv.height - 2); g.restore(); }
  }
  function drawHist(H) { const g = hist.getContext('2d'); g.clearRect(0, 0, 256, 40); g.fillStyle = '#6ee7f2'; for (let i = 0; i < 256; i++) { const v = H[i] * 38; g.fillRect(i, 40 - v, 1, v); } }
  view.on('preview', (p) => { last = p; draw(); drawHist(p.hist || []); info.textContent = srcInfo ? `${srcInfo.name} · ${srcInfo.width}×${srcInfo.height}${p.original ? ' · ORIGINAL' : ''}` : ''; });
  view.on('source', (s) => { srcInfo = s; info.textContent = `${s.name} · ${s.width}×${s.height}`; });
  view.on('exported', (x) => { info.textContent = `saved ${x.name} · ${x.width}×${x.height} · ${(x.bytes / 1024).toFixed(0)} KB`; });
  view.on('missing', (x) => { info.textContent = `${x.name}: the picture isn’t in this project any more — open it again`; });
  view.on('state_sync', (s) => { if (s.crop) crop = s.crop; if (s.hasSource && !last) view.emit('want_preview', {}); });
  // crop by dragging on the picture: the new rect is relative to the CURRENT (cropped) view → mapped back to the full frame
  const at = (e) => { const r = cv.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; };
  cv.addEventListener('pointerdown', (e) => { if (!cropOn || !last) return; e.preventDefault(); e.stopPropagation(); cv.setPointerCapture(e.pointerId); drag = { a: at(e), b: at(e) }; });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; drag.b = at(e); draw(); const g = cv.getContext('2d'), x = Math.min(drag.a.x, drag.b.x) * cv.width, y = Math.min(drag.a.y, drag.b.y) * cv.height, w = Math.abs(drag.b.x - drag.a.x) * cv.width, hh = Math.abs(drag.b.y - drag.a.y) * cv.height; g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(last.bitmap, x, y, w, hh, x, y, w, hh); g.strokeStyle = '#6ee7f2'; g.lineWidth = 2; g.strokeRect(x, y, w, hh); });
  cv.addEventListener('pointerup', () => { if (!drag) return; const a = drag.a, b = drag.b; drag = null; const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), hh = Math.abs(b.y - a.y); if (w < 0.02 || hh < 0.02) { draw(); return; }
    view.emit('crop_set', { x: crop.x + x0 * crop.w, y: crop.y + y0 * crop.h, w: w * crop.w, h: hh * crop.h }); });
  const groups = UI.paramPanel(view, ['exposure', 'contrast', 'highlights', 'shadows', 'blackPoint', 'whitePoint', 'gamma', 'temperature', 'tint', 'saturation', 'vibrance', 'vignette', 'rotate', 'flipH', 'aspect', 'format', 'quality'], { size: 30 });
  view.root.append(file,
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap' } }, [openB.el, expB.el, resetB.el, origB])]),
    stage, h('div', { class: 'org-row', style: { gap: '8px', alignItems: 'center', flexWrap: 'wrap' } }, [hist, cropT.el, cropReset.el, info]),
    groups,
    UI.hint('Nothing is changed in your file: every slider is a setting; Export writes a new picture. Wire “out” into another tool to send it the result.'),
  );
});
