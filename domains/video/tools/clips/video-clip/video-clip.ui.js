/* eravos.video.video-clip UI — the picture · ▶/⏸, time, I / O (set in / out at the playhead), Grab, Export · a
 * filmstrip: click to seek, drag the green/red handles to trim. Keys (window focused): Space play/pause, I / O, ← →. */
OrganismFactory.reg('eravos.video.video-clip', function (view) {
  const UI = view.ui, h = UI.h;
  const file = h('input', { type: 'file', accept: 'video/*', style: { display: 'none' }, 'aria-hidden': 'true' });
  file.addEventListener('change', async () => { const f = file.files && file.files[0]; if (!f) return; status.textContent = 'opening ' + f.name + '…'; view.emit('open_file', { arrayBuffer: await f.arrayBuffer(), name: f.name, type: f.type }); file.value = ''; });
  const openB = UI.Button({ label: '📂 Open…', kind: 'primary', hint: 'open a video (or drop one on the canvas)', onClick: () => file.click() });
  const playB = UI.Button({ label: '▶', hint: 'play / pause (Space)', onClick: () => view.emit(playing ? 'pause' : 'play', {}) });
  const inB = UI.Button({ label: 'I', hint: 'set the IN point here (I)', onClick: () => view.emit('set_in', {}) });
  const outB = UI.Button({ label: 'O', hint: 'set the OUT point here (O)', onClick: () => view.emit('set_out', {}) });
  const grabB = UI.Button({ label: '⧉ Frame', hint: 'send this frame out as a picture', onClick: () => view.emit('grab', {}) });
  const expB = UI.Button({ label: '⤓ Export cut', hint: 'record the cut (in → out) as WebM — takes as long as the cut', onClick: () => view.emit(exporting ? 'cancel_export' : 'export', {}) });
  const clock = h('span', { class: 'vc-clock', text: '0:00.0 / 0:00.0' }), status = h('span', { class: 'vc-status', 'aria-live': 'polite' });
  const stage = h('div', { class: 'vc-stage', tabindex: '0', 'aria-label': 'Video — Space plays, I and O set the cut, arrows step' }), empty = h('div', { class: 'vc-empty', text: 'Open a video or drop one on the canvas.' });
  stage.append(empty);
  const strip = h('canvas', { class: 'vc-strip', height: 64, role: 'slider', tabindex: '0', 'aria-label': 'Filmstrip — click to seek, drag the handles to trim' });
  let st = { duration: 0, in: 0, out: 0 }, t = 0, frames = [], playing = false, exporting = false, drag = null;
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  function drawStrip() {
    const W = strip.clientWidth || 600; strip.width = W; const g = strip.getContext('2d'), H = 64; g.fillStyle = '#05080c'; g.fillRect(0, 0, W, H);
    if (frames.length) { const fw = W / frames.length; frames.forEach((f, i) => { try { g.drawImage(f, i * fw, 8, fw, H - 16); } catch (e) {} }); }
    if (!st.duration) return; const X = (s) => s / st.duration * W;
    g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(0, 0, X(st.in), H); g.fillRect(X(st.out), 0, W - X(st.out), H);
    g.fillStyle = '#7cffb2'; g.fillRect(X(st.in) - 2, 0, 4, H); g.fillStyle = '#ff6b81'; g.fillRect(X(st.out) - 2, 0, 4, H);
    g.fillStyle = '#fff'; g.fillRect(X(t) - 1, 0, 2, H);
    strip.setAttribute('aria-valuenow', t.toFixed(2)); strip.setAttribute('aria-valuemin', '0'); strip.setAttribute('aria-valuemax', st.duration.toFixed(2));
  }
  const tAt = (e) => { const r = strip.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * st.duration; };
  strip.addEventListener('pointerdown', (e) => { if (!st.duration) return; e.preventDefault(); e.stopPropagation(); strip.setPointerCapture(e.pointerId); const s = tAt(e), px = st.duration / Math.max(1, strip.clientWidth) * 8;
    drag = Math.abs(s - st.in) < px ? 'in' : Math.abs(s - st.out) < px ? 'out' : 'seek'; if (drag === 'seek') view.emit('seek', { t: s }); });
  strip.addEventListener('pointermove', (e) => { if (!drag || drag === 'seek') return; const s = tAt(e); if (drag === 'in') st.in = Math.min(s, st.out - 0.05); else st.out = Math.max(s, st.in + 0.05); drawStrip(); });
  strip.addEventListener('pointerup', () => { if (drag === 'in' || drag === 'out') view.emit('trim', { in: st.in, out: st.out }); drag = null; });
  const keys = (e) => { if (e.target.tagName === 'INPUT') return; const k = e.key;
    if (k === ' ') { e.preventDefault(); e.stopPropagation(); view.emit(playing ? 'pause' : 'play', {}); }
    else if (k === 'i' || k === 'I') { e.stopPropagation(); view.emit('set_in', {}); } else if (k === 'o' || k === 'O') { e.stopPropagation(); view.emit('set_out', {}); }
    else if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); view.emit('seek', { t: t + (k === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 : 1 / 30) }); } };
  stage.addEventListener('keydown', keys); strip.addEventListener('keydown', keys);
  view.on('element', (x) => { if (x.el && x.el.parentNode !== stage) { stage.insertBefore(x.el, empty); } });
  view.on('loaded', (i) => { st = Object.assign(st, { duration: i.duration, in: i.in, out: i.out }); empty.style.display = 'none'; status.textContent = `${i.name} · ${i.width}×${i.height} · ${fmt(i.duration)}`; drawStrip(); });
  view.on('thumbs', (x) => { frames = x.frames || []; drawStrip(); });
  view.on('time', (x) => { t = x.t; clock.textContent = `${fmt(t)} / ${fmt(st.duration)}`; drawStrip(); });
  view.on('playing', (x) => { playing = !!x.on; playB.set(playing ? '⏸' : '▶'); });
  view.on('export', (x) => { exporting = x.state === 'recording'; expB.set(exporting ? '■ Cancel export' : '⤓ Export cut'); status.textContent = x.state === 'recording' ? `exporting… ${Math.round(100 * (x.done || 0))} %` : x.state === 'done' ? `saved ${x.name} (${(x.bytes / 1048576).toFixed(1)} MB)` : 'export cancelled'; });
  view.on('missing', (x) => { status.textContent = `${x.name}: the video isn’t in this project any more — open it again`; });
  view.on('state_sync', (s) => { if (s.duration) { st = { duration: s.duration, in: s.in, out: s.out }; t = s.t || t; empty.style.display = s.ready ? 'none' : ''; clock.textContent = `${fmt(t)} / ${fmt(st.duration)}`; drawStrip(); } });
  new ResizeObserver(drawStrip).observe(strip);
  view.emit('want_element', {});
  view.root.append(file,
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { gap: '6px' } }, [openB.el, grabB.el, expB.el])]),
    stage,
    h('div', { class: 'org-row', style: { gap: '6px', alignItems: 'center' } }, [playB.el, inB.el, outB.el, clock, status]),
    strip,
    UI.paramPanel(view, ['loop', 'rate', 'volume', 'muted', 'follow', 'frameFps'], { flat: true, noTitles: true, size: 30 }),
    UI.hint('Drag the green / red handles to trim; click the strip to seek. “Frame” (or pausing) sends the picture out — wire “frame” into Image Adjust. Export records the cut in real time.'),
  );
});
