/* eravos.song-recorder UI — DAW-style lanes in the bottom dock.
 * Canvas: ruler (click = seek) · clips with real waveforms · drag body = move (also to another lane) · drag an edge = trim
 * · double-click = split there · shift-click = add to selection · ctrl/⌘-wheel = zoom · wheel = scroll · drop audio files.
 * Keys while the recorder is focused: R record · Delete · Ctrl+D duplicate · S split at playhead · Home rewind. */
OrganismFactory.reg('eravos.song-recorder', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let st = { lanes: [], clips: [], sel: [], armed: null, recording: null, bpm: 120, head: 0, formats: [] };
  const peaks = new Map(); let clock = { playing: false, head: 0 }, scrollB = 0;
  const LH = 48, RH = 22, HW = 168;
  // ---------------- toolbar
  const recB = h('button', { class: 'sr-rec', title: 'Record (R) — records what you hear; press again to stop' }, [h('span', { class: 'dot' }), h('span', { class: 'lbl', text: 'REC' })]);
  recB.onclick = () => view.emit('record');
  const playB = UI.Button({ label: '▶', hint: 'play the takes only — the rest of the canvas stays silent (Space plays the whole song)', onClick: () => view.emit('play') });
  const withSong = UI.paramControl(view, cfg('withSong'));
  const homeB = UI.Button({ label: '⏮', hint: 'back to bar 1 (Home)', onClick: () => view.emit('seek', { beat: 0 }) });
  const pos = h('span', { class: 'sr-pos', text: '1.1' });
  const srcSel = UI.Select({ options: [{ value: 'master', label: '🎚 Everything you hear' }], onChange: (v) => view.set('source', v) });
  const refreshSrc = () => { srcSel.setOptions([{ value: 'master', label: '🎚 Everything you hear' }].concat(view.targets('capability.audio_out'))); srcSel.set(view.state.source || 'master'); };
  view.observe('factory:spawned', refreshSrc); view.observe('kernel:organism', refreshSrc); refreshSrc();
  const snapSel = UI.paramControl(view, cfg('snap'), { segMax: 5, noLabel: true });
  const fmtSel = UI.Select({ options: [], onChange: (v) => view.set('format', v) });
  const rangeSel = UI.paramControl(view, cfg('range'), { segMax: 3, noLabel: true });
  const stemsT = UI.paramControl(view, cfg('stems'));
  const nameIn = UI.paramControl(view, cfg('songName'));
  const expB = UI.Button({ label: '⤓ Export', kind: 'primary', hint: 'render the song offline and save it', onClick: () => view.emit('export', {}) });
  const songB = UI.Button({ label: '📖 Save to Songs', hint: 'keep this song (audio + everything on the canvas) in the Songbook → My songs', onClick: () => view.emit('save_song', {}) });
  const expSt = h('span', { class: 'sr-exp' });
  // 3.68 TAGS — the file's metadata, autofilled (the song's name, your artist name, genre, year, BPM, key), and its cover
  const tagB = UI.Button({ label: '🏷 Tags', hint: 'the tags and cover every export carries — filled in for you; change any of them', onClick: () => openTags() });
  let metaSt = null, tagPanel = null;
  view.on('meta', (m) => { metaSt = m; if (tagPanel) paintTags(); });
  const FIELDS = [['title', 'Title'], ['artist', 'Artist'], ['album', 'Album'], ['genre', 'Genre'], ['year', 'Year'], ['bpm', 'BPM'], ['key', 'Key'], ['comment', 'Comment']];
  function openTags() {
    if (tagPanel) { closeTags(); return; }
    tagPanel = h('div', { class: 'sr-tags', role: 'dialog', 'aria-label': 'tags and cover' });
    tagPanel.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') closeTags(); });
    tagPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
    document.body.appendChild(tagPanel); paintTags(); view.emit('want_meta', {});
  }
  function closeTags() { if (tagPanel) { tagPanel.remove(); tagPanel = null; } }
  view.onDispose && view.onDispose(closeTags);
  const coverFile = h('input', { type: 'file', accept: 'image/png,image/jpeg', style: { display: 'none' } });
  coverFile.addEventListener('change', async () => { const f = coverFile.files[0]; if (f) view.emit('cover_set', { arrayBuffer: await f.arrayBuffer(), mime: f.type, name: f.name }); coverFile.value = ''; });
  function paintTags() {
    const m = metaSt || { own: {}, auto: {}, resolved: {} }, el = tagPanel; el.innerHTML = '';
    const close = h('button', { class: 'sr-tags-x', title: 'close (Esc)', text: '✕' }); close.onclick = closeTags;
    const rows = FIELDS.map(([k, label]) => {
      const inp = h('input', { class: 'sr-tag-in', value: (m.own && m.own[k]) || '', placeholder: (m.auto && m.auto[k]) || '', 'aria-label': label, 'data-key': k });
      const send = () => { if ((inp.value || '') !== ((m.own && m.own[k]) || '')) view.emit('meta_set', { patch: { [k]: inp.value } }); };
      inp.addEventListener('change', send); inp.addEventListener('blur', send);
      const auto = !(m.own && m.own[k]) && (m.auto && m.auto[k]);
      return h('label', { class: 'sr-tag-row' }, [h('span', { class: 'sr-tag-l', text: label }), inp, h('small', { class: 'sr-tag-hint', text: auto ? 'auto' : (m.own && m.own[k]) ? 'yours' : '' })]);
    });
    const img = m.cover ? h('img', { class: 'sr-cover', src: m.cover, alt: 'the cover' }) : h('div', { class: 'sr-cover empty', text: 'no cover' });
    const up = h('button', { class: 'tb-btn', text: m.uploaded ? 'Change image…' : 'Upload image…', title: 'a PNG or JPEG, square works best' }); up.onclick = () => coverFile.click();
    const rm = m.uploaded ? h('button', { class: 'tb-btn', text: 'Remove', title: 'back to the auto cover (or none)' }) : null; if (rm) rm.onclick = () => view.emit('cover_clear', {});
    el.append(
      h('div', { class: 'sr-tags-head' }, [h('b', { text: 'Tags & cover' }), h('small', { text: ' every export carries these — grey = filled in for you; type to change one, clear it to go back' }), close]),
      h('div', { class: 'sr-tags-body' }, [
        h('div', { class: 'sr-tags-fields' }, rows),
        h('div', { class: 'sr-tags-cover' }, [img, h('div', { class: 'sr-tags-btns' }, [up, rm].filter(Boolean)), UI.paramControl(view, cfg('autoCover')).el,
          h('small', { class: 'sr-tag-hint', text: m.uploaded ? 'your image' : m.autoCover ? 'drawn from the song (the final one uses the whole export)' : 'no cover' })]),
      ]),
      h('small', { class: 'sr-tag-hint', text: 'Written into MP3, WAV, FLAC and AIFF. Opus files carry no tags. Your artist name is remembered on this computer for every project.' }),
      coverFile);
  }
  const file = h('input', { type: 'file', accept: 'audio/*', multiple: true, style: { display: 'none' } });
  file.addEventListener('change', async () => { for (const f of Array.from(file.files)) view.emit('import', { arrayBuffer: await f.arrayBuffer(), name: f.name }); file.value = ''; });
  const impB = UI.Button({ label: '＋ Audio', hint: 'add audio files at the playhead (or drop them on a lane)', onClick: () => file.click() });
  const laneB = UI.Button({ label: '＋ Lane', onClick: () => view.emit('lane_add', {}) });
  const insp = h('span', { class: 'sr-insp' });
  view.bind('format', (v) => fmtSel.set(v)); view.bind('source', (v) => srcSel.set(v || 'master'));
  const bar = h('div', { class: 'sr-bar' }, [recB, playB.el, homeB.el, pos, h('span', { class: 'sr-l', text: 'REC FROM' }), srcSel.el, h('span', { class: 'sr-sep' }), h('span', { class: 'sr-l', text: 'SNAP' }), snapSel.el, impB.el, laneB.el, withSong.el, insp,
    h('span', { class: 'sr-grow' }), nameIn.el, fmtSel.el, rangeSel.el, stemsT.el, tagB.el, expB.el, songB.el, expSt, file]);
  // ---------------- lanes + canvas
  const heads = h('div', { class: 'sr-heads' });
  const cv = UI.Canvas(800, 200); cv.className += ' sr-canvas'; cv.tabIndex = 0;
  const wrap = h('div', { class: 'sr-wrap' }, [cv]);
  const main = h('div', { class: 'sr-main' }, [heads, wrap]);
  view.root.append(bar, main);
  view.root.classList.add('sr-root');
  const ppb = () => view.state.zoom || 26;          // pixels per beat
  const spb = () => 60 / (st.bpm || 120);
  const durB = (c) => c.dur / spb();
  const X = (b) => (b - scrollB) * ppb(), B = (x) => x / ppb() + scrollB;
  function nowBeat() { if (clock.playing && clock.t0 !== undefined) return clock.b0 + (view.ac.currentTime - clock.t0) / (60 / (clock.bpm || st.bpm)); return clock.head !== undefined ? clock.head : st.head || 0; }
  function paintHeads() {
    heads.innerHTML = ''; heads.appendChild(h('div', { class: 'sr-hruler', style: { height: RH + 'px' } }, [h('span', { text: `${st.lanes.length} lane${st.lanes.length === 1 ? '' : 's'} · ${st.clips.length} clip${st.clips.length === 1 ? '' : 's'}` })]));
    st.lanes.forEach(l => {
      const nm = h('span', { class: 'sr-lname', text: l.name, title: 'double-click to rename' });
      nm.ondblclick = () => UI.ask('Lane name', l.name).then((v) => { if (v) view.emit('lane_edit', { id: l.id, patch: { name: v } }); });
      const tog = (k, t, title) => { const b = h('button', { class: 'sr-tg ' + k + (l[k] ? ' on' : ''), text: t, title }); b.onclick = () => view.emit('lane_edit', { id: l.id, patch: { [k]: !l[k] } }); return b; };
      const arm = h('button', { class: 'sr-tg arm' + (st.armed === l.id ? ' on' : ''), text: '●', title: 'arm: the next take records onto this lane' }); arm.onclick = () => view.emit('lane_arm', { id: l.id });
      const vol = UI.NumberDrag({ min: -60, max: 12, step: 0.5, value: l.vol, format: (v) => (v > 0 ? '+' : '') + (+v).toFixed(1), onChange: (v) => view.emit('lane_edit', { id: l.id, patch: { vol: v } }) });
      const del = h('button', { class: 'sr-tg', text: '×', title: 'delete lane and its clips' }); del.onclick = () => { if (confirm(`Delete lane “${l.name}” and its clips?`)) view.emit('lane_delete', { id: l.id }); };
      heads.appendChild(h('div', { class: 'sr-head', style: { height: LH + 'px', '--lc': l.color } }, [h('div', { class: 'sr-hrow' }, [arm, nm]), h('div', { class: 'sr-hrow' }, [tog('mute', 'M', 'mute'), tog('solo', 'S', 'solo'), vol.el, h('small', { text: 'dB' }), del])]));
    });
    if (!st.lanes.length) heads.appendChild(h('div', { class: 'sr-empty', text: 'Press ⏺ REC — the transport starts and everything you hear becomes a take.' }));
  }
  // ---------------- draw
  UI.loop(cv, () => {
    const g = cv.g; const r = wrap.getBoundingClientRect(); const W = Math.max(200, r.width), H = Math.max(80, r.height);
    if (Math.abs(cv.W - W) > 1 || Math.abs(cv.H - H) > 1) { cv.width = W * cv.dpr; cv.height = H * cv.dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.W = W; cv.H = H; g.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0); }
    const nb = nowBeat();
    if (clock.playing && view.state.follow && (X(nb) > W * 0.85 || X(nb) < 0)) scrollB = Math.max(0, nb - (W * 0.15) / ppb());
    g.fillStyle = '#070a0f'; g.fillRect(0, 0, W, H);
    // lanes background
    st.lanes.forEach((l, i) => { const y = RH + i * LH; g.fillStyle = i % 2 ? '#0a0f16' : '#0c121a'; g.fillRect(0, y, W, LH); g.fillStyle = l.color + '22'; g.fillRect(0, y, 3, LH); });
    // grid
    const b0 = Math.floor(scrollB), b1 = Math.ceil(B(W));
    for (let b = b0; b <= b1; b++) { const x = X(b), isBar = b % 4 === 0; if (!isBar && ppb() < 8) continue; g.strokeStyle = isBar ? '#1f2c3c' : '#131c27'; g.beginPath(); g.moveTo(x + 0.5, RH); g.lineTo(x + 0.5, H); g.stroke(); }
    // ruler
    g.fillStyle = '#0d141d'; g.fillRect(0, 0, W, RH); g.fillStyle = '#7f93a8'; g.font = '10px ui-monospace, monospace';
    const every = ppb() * 4 < 36 ? 4 : 1;
    for (let bar = Math.floor(b0 / 4); bar * 4 <= b1; bar++) { if (bar % every) continue; const x = X(bar * 4); g.fillText(String(bar + 1), x + 3, 14); g.fillStyle = '#2b3b50'; g.fillRect(x, 14, 1, RH - 14); g.fillStyle = '#7f93a8'; }
    // clips
    st.clips.forEach(c => {
      const li = st.lanes.findIndex(l => l.id === c.lane); if (li < 0) return;
      const x = X(c.start), w = Math.max(2, durB(c) * ppb()), y = RH + li * LH + 3, hh = LH - 6; if (x > W || x + w < 0) return;
      const lane = st.lanes[li], col = lane.color, s = st.sel.includes(c.id);
      g.fillStyle = c.mute ? '#1a1f27' : col + (s ? '55' : '30'); g.fillRect(x, y, w, hh);
      g.strokeStyle = s ? '#fff' : col; g.lineWidth = s ? 1.5 : 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, hh - 1);
      const pk = peaks.get(c.hash);
      if (pk && w > 6) {
        const N = pk.peaks.length / 2, sec = pk.duration || c.dur, mid = y + hh / 2 + 5, amp = (hh - 14) / 2, gain = Math.pow(10, (c.gain || 0) / 20);
        g.fillStyle = c.mute ? '#3a4452' : col; g.beginPath();
        const x0 = Math.max(x, 0), x1 = Math.min(x + w, W);
        for (let px = x0; px < x1; px++) { const t = c.offset + (px - x) / w * c.dur; const i = Math.min(N - 1, Math.max(0, Math.floor(t / sec * N))); const mn = pk.peaks[i * 2] * gain, mx = pk.peaks[i * 2 + 1] * gain; g.rect(px, mid - Math.min(1, mx) * amp, 1, Math.max(1, (Math.min(1, mx) - Math.max(-1, mn)) * amp)); }
        g.fill();
      }
      // fades
      g.strokeStyle = '#ffffff55'; g.beginPath(); const fi = (c.fadeIn || 0) / c.dur * w, fo = (c.fadeOut || 0) / c.dur * w; if (fi > 2) { g.moveTo(x, y + hh); g.lineTo(x + fi, y); } if (fo > 2) { g.moveTo(x + w - fo, y); g.lineTo(x + w, y + hh); } g.stroke();
      g.fillStyle = '#d6e4f0'; g.font = '10px ui-sans-serif, system-ui'; if (w > 30) g.fillText(c.name + (c.gain ? ` ${c.gain > 0 ? '+' : ''}${(+c.gain).toFixed(1)}dB` : ''), x + 4, y + 11);
    });
    // recording in progress
    if (st.recording && st.recording.startBeat !== null && st.recording.startBeat !== undefined && clock.playing) {
      const li = st.recording.lane ? st.lanes.findIndex(l => l.id === st.recording.lane) : st.lanes.length;
      const y = RH + li * LH + 3, x = X(st.recording.startBeat), w = Math.max(2, X(nb) - x);
      g.fillStyle = 'rgba(255,51,85,.22)'; g.fillRect(x, y, w, LH - 6); g.strokeStyle = '#ff3355'; g.strokeRect(x + 0.5, y + 0.5, w, LH - 7);
      g.fillStyle = '#ff7a8e'; g.font = '600 10px ui-monospace, monospace'; g.fillText('● recording', x + 4, y + 12);
    }
    // playhead
    const px = X(nb); if (px >= 0 && px <= W) { g.fillStyle = '#00d4ff'; g.fillRect(px, 0, 1.5, H); g.beginPath(); g.moveTo(px - 5, 0); g.lineTo(px + 6, 0); g.lineTo(px + 0.75, 7); g.fill(); }
    const bb = Math.max(0, nb); pos.textContent = `${Math.floor(bb / 4) + 1}.${Math.floor(bb % 4) + 1}`;
  }, 60);
  // ---------------- interaction
  function hit(x, y) {
    if (y < RH) return { ruler: true };
    const li = Math.floor((y - RH) / LH), lane = st.lanes[li];
    for (let i = st.clips.length - 1; i >= 0; i--) {
      const c = st.clips[i]; if (!lane || c.lane !== lane.id) continue;
      const cx = X(c.start), w = durB(c) * ppb(); if (x >= cx - 2 && x <= cx + w + 2) return { clip: c, lane, edge: x < cx + 7 ? 'left' : x > cx + w - 7 ? 'right' : null };
    }
    return { lane, li };
  }
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); cv.focus({ preventScroll: true });
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, ht = hit(x, y);
    if (ht.ruler) { view.emit('seek', { beat: Math.max(0, B(x)) }); drag = { seek: true }; cv.setPointerCapture(e.pointerId); return; }
    if (!ht.clip) { view.emit('select', { ids: [] }); return; }
    const ids = e.shiftKey ? Array.from(new Set(st.sel.concat([ht.clip.id]))) : st.sel.includes(ht.clip.id) ? st.sel : [ht.clip.id];
    if (ids.join() !== st.sel.join()) view.emit('select', { ids });
    drag = { clip: ht.clip, edge: ht.edge, x0: x, y0: y, b0: ht.clip.start, moved: false };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (!drag) { const ht = hit(x, y); cv.style.cursor = ht.ruler ? 'text' : ht.clip ? (ht.edge ? 'ew-resize' : 'grab') : 'default'; return; }
    if (drag.seek) { view.emit('seek', { beat: Math.max(0, B(x)) }); return; }
    if (!drag.moved && Math.abs(x - drag.x0) < 3 && Math.abs(y - drag.y0) < 3) return; drag.moved = true;
    const snap = !e.altKey;
    if (drag.edge) view.emit('clip_trim', { id: drag.clip.id, edge: drag.edge, beat: B(x), snap });
    else { const li = Math.max(0, Math.min(st.lanes.length - 1, Math.floor((y - RH) / LH))); view.emit('clip_move', { id: drag.clip.id, start: drag.b0 + (x - drag.x0) / ppb(), lane: st.lanes[li] && st.lanes[li].id, snap }); }
  });
  const endDrag = () => { drag = null; };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => cv.addEventListener(t, endDrag));
  cv.addEventListener('dblclick', (e) => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, ht = hit(x, y); if (ht.clip) view.emit('clip_split', { id: ht.clip.id, beat: B(x) }); });
  cv.addEventListener('wheel', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.ctrlKey || e.metaKey) { const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, bm = B(mx); const z = Math.max(4, Math.min(200, ppb() * Math.exp(-e.deltaY * 0.002))); view.set('zoom', +z.toFixed(2)); scrollB = Math.max(0, bm - mx / z); }
    else scrollB = Math.max(0, scrollB + (e.deltaX || e.deltaY) / ppb());
  }, { passive: false });
  cv.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'delete' || k === 'backspace') { e.preventDefault(); view.emit('clip_delete', {}); }
    else if (k === 'd' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); view.emit('clip_dup', {}); }
    else if (k === 's' && !e.ctrlKey) { e.preventDefault(); view.emit('clip_split', { beat: nowBeat() }); }
    else if (k === 'r' && !e.ctrlKey) { e.preventDefault(); view.emit('record'); }
    else if (k === 'home') { e.preventDefault(); view.emit('seek', { beat: 0 }); }
    else if (k === '=' || k === '+') view.set('zoom', Math.min(200, ppb() * 1.25)); else if (k === '-') view.set('zoom', Math.max(4, ppb() / 1.25));
  });
  // drop audio on a lane
  view.root.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); view.root.classList.add('sr-drop'); });
  view.root.addEventListener('dragleave', () => view.root.classList.remove('sr-drop'));
  view.root.addEventListener('drop', async (e) => {
    e.preventDefault(); e.stopPropagation(); view.root.classList.remove('sr-drop');
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, ht = (x >= 0 && y >= 0) ? hit(x, y) : {};
    for (const f of Array.from(e.dataTransfer.files || [])) view.emit('import', { arrayBuffer: await f.arrayBuffer(), name: f.name, lane: ht.lane && ht.lane.id, beat: x >= 0 ? Math.max(0, B(x)) : undefined });
  });
  // inspector for one selected clip
  function paintInsp() {
    insp.innerHTML = ''; if (st.sel.length !== 1) { if (st.sel.length > 1) insp.appendChild(h('span', { class: 'sr-l', text: st.sel.length + ' clips selected' })); return; }
    const c = st.clips.find(x => x.id === st.sel[0]); if (!c) return;
    const num = (label, key, min, max, step, scale, unit) => { const d = UI.NumberDrag({ min, max, step, value: (c[key] || 0) * scale, format: (v) => `${label} ${(+v).toFixed(step < 1 ? 1 : 0)}${unit}`, onChange: (v) => view.emit('clip_edit', { id: c.id, patch: { [key]: v / scale } }) }); return d.el; };
    const mute = h('button', { class: 'sr-tg' + (c.mute ? ' on' : ''), text: 'M', title: 'mute clip' }); mute.onclick = () => view.emit('clip_edit', { id: c.id, patch: { mute: !c.mute } });
    insp.append(h('span', { class: 'sr-l', text: c.name }), num('gain', 'gain', -40, 12, 0.5, 1, 'dB'), num('in', 'fadeIn', 0, 4000, 5, 1000, 'ms'), num('out', 'fadeOut', 0, 4000, 5, 1000, 'ms'), mute,
      UI.Button({ label: '✂', hint: 'split at playhead (S)', onClick: () => view.emit('clip_split', { id: c.id, beat: nowBeat() }) }).el,
      UI.Button({ label: '⧉', hint: 'duplicate (Ctrl+D)', onClick: () => view.emit('clip_dup', {}) }).el,
      UI.Button({ label: '🗑', hint: 'delete (Del)', onClick: () => view.emit('clip_delete', {}) }).el);
  }
  view.on('peaks', (p) => { peaks.set(p.hash, p); });
  view.on('clock', (c) => { clock = Object.assign({}, clock, c); if (c.playing === false) clock.t0 = undefined; playB.set(c.playing ? '■' : '▶'); });
  view.on('export_state', (s) => { expSt.textContent = s.error ? '⚠ ' + s.error : s.text || ''; expSt.className = 'sr-exp' + (s.error ? ' bad' : s.done ? ' good' : ''); expB.el.disabled = !!s.busy; songB.el.disabled = !!s.busy; });
  view.on('recorded', () => view.root.classList.add('sr-flash'));
  view.on('state_sync', (s) => {
    if (!s.lanes) return; st = s;
    if (s.formats && s.formats.length) { fmtSel.setOptions(s.formats); fmtSel.set(view.state.format); }
    recB.classList.toggle('on', !!s.recording); recB.classList.toggle('wait', !!(s.recording && s.recording.waiting));
    recB.querySelector('.lbl').textContent = s.recording ? (s.recording.waiting ? 'COUNT…' : 'STOP') : 'REC';
    paintHeads(); paintInsp();
  });
  view.emit('want_peaks');
});
