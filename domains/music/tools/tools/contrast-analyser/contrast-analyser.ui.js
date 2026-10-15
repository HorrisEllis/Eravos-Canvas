/* eravos.contrast-analyser UI — slots A/B, FREQUENCY · DYNAMICS · RHYTHM tabs, score strip, advice list */
OrganismFactory.reg('eravos.contrast-analyser', function (view) {
  const UI = view.ui, h = UI.h;
  let R = null, tab = 'FREQUENCY';
  const slotEl = (slot, col) => {
    const name = h('div', { class: 'org-note', style: { color: col, fontSize: '13px' }, text: slot + ': drop a sound here' });
    const icon = h('div', { style: { fontSize: '22px', color: col, opacity: 0.8, lineHeight: 1 }, text: slot === 'A' ? '⬇ A' : '⬇ B' });
    const mode = UI.Segmented({ options: [{ value: 'file', label: 'file' }, { value: 'live', label: 'LIVE' }, { value: 'wait', label: 'take next clip' }], value: 'file', onChange: (v) => view.emit('slot_mode', { slot, mode: v }) });
    const box = h('div', { class: 'dropzone', style: { flex: '1', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px', borderColor: col + '66' } }, [icon, name, mode.el]);
    box.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); box.classList.add('over'); });
    box.addEventListener('dragleave', () => box.classList.remove('over'));
    box.addEventListener('drop', async (e) => { e.preventDefault(); e.stopPropagation(); box.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) view.emit('slot_load', { slot, arrayBuffer: await f.arrayBuffer(), name: f.name }); });
    view.on('slot', (s) => { if (s.slot === slot) name.textContent = `${slot}: ${s.name} (${s.duration.toFixed(1)} s)`; });
    view.on('state_sync', (s) => { if (s.slots) mode.set(s.slots[slot].mode); });
    return box;
  };
  const tabs = UI.Segmented({ options: ['FREQUENCY', 'DYNAMICS', 'RHYTHM'], value: tab, onChange: (v) => { tab = v; } });
  const cv = UI.Canvas(600, 200);
  const scores = h('div', { class: 'org-row' });
  const advice = h('div', { class: 'uk-group', style: { fontSize: '12px', lineHeight: '1.5' } });
  view.on('analysis', (r) => {
    R = r; scores.innerHTML = ''; advice.innerHTML = '';
    if (!r.ready) { advice.appendChild(UI.hint('Load two sounds (drop a file on A and B, set LIVE and wire two outputs in, or choose “take next clip” and send clips from Sample windows).')); return; }
    const chip = (label, val, verdict, col) => h('div', { class: 'uk-group', style: { minWidth: '150px' } }, [h('div', { class: 'uk-group-title', text: label }), h('div', { class: 'org-big', style: { color: col, fontSize: '22px' }, text: val }), h('div', { class: 'uk-hint', text: verdict })]);
    scores.append(
      chip('CLASH', r.clash.toFixed(0) + '/100', r.clash > 60 ? 'they fight — make room' : r.clash > 30 ? 'some overlap' : 'separate', r.clash > 60 ? '#ff2266' : r.clash > 30 ? '#ffaa00' : '#00ff88'),
      chip('LOUDNESS GAP', (r.dynDiffDb > 0 ? 'A +' : 'B +') + Math.abs(r.dynDiffDb).toFixed(1) + ' dB', Math.abs(r.dynDiffDb) > 6 ? 'one will bury the other' : 'balanced', Math.abs(r.dynDiffDb) > 6 ? '#ffaa00' : '#00ff88'),
      chip('DISPLACEMENT', r.displacement.toFixed(2), r.displacement < 0.05 ? 'same rhythm (flat)' : 'different grooves', r.displacement < 0.05 ? '#ffaa00' : '#00ff88'));
    r.advice.forEach(a => advice.appendChild(h('div', { text: '→ ' + a })));
    advice.appendChild(UI.Button({ label: 'Copy advice', onClick: () => navigator.clipboard && navigator.clipboard.writeText(r.advice.join('\n')) }).el);
  });
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 200; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    if (!R || !R.ready) { // 3.27 empty state: show what the view WILL show, faintly, plus the three ways in
      const bw = W / 24, wave = (k, ph) => (i) => H - 40 - (Math.sin(i * 0.45 + ph) * 0.5 + 0.5) * (H - 70) * (k === 0 ? Math.exp(-i / 10) : 1 - Math.exp(-i / 6)) ;
      g.fillStyle = 'rgba(255,34,102,.07)'; g.fillRect(4 * bw, 0, 5 * bw, H - 26);
      [[wave(0, 0), '#00d4ff'], [wave(1, 2), '#ffaa00']].forEach(([f, col]) => { g.strokeStyle = col + '55'; g.setLineDash([4, 4]); g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 24; i++) { const y = f(i); i ? g.lineTo(i * bw + bw / 2, y) : g.moveTo(bw / 2, y); } g.stroke(); });
      g.setLineDash([]);
      g.fillStyle = '#ff6688'; g.font = '10px monospace'; g.fillText('red band = where they fight', 4 * bw + 4, 14);
      g.fillStyle = '#c9d6e3'; g.font = '13px system-ui, sans-serif';
      const lines = ['Compare two sounds — does the bass fight the kick? is the vocal buried?', '1  drop a file on A and on B', '2  or set LIVE and wire two tools into the left dots', '3  or “take next clip” and send clips from a Sample window'];
      lines.forEach((t, i) => { g.fillStyle = i ? '#9fb3c8' : '#e6eef6'; g.fillText(t, 14, H - 72 + i * 17); });
      return;
    }
    if (tab === 'FREQUENCY') {
      const bw = W / 24;
      R.contested.forEach(b => { const i = R.barks.indexOf(b.lo); g.fillStyle = 'rgba(255,34,102,.15)'; g.fillRect(i * bw, 0, bw, H); });
      [[R.bandsA, '#00d4ff'], [R.bandsB, '#ffaa00']].forEach(([bs, col], k) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); bs.forEach((v, i) => { const y = H - 14 - Math.max(0, (v + 60) / 60) * (H - 20); i ? g.lineTo(i * bw + bw / 2, y) : g.moveTo(bw / 2, y); }); g.stroke(); });
      g.fillStyle = '#7f93a8'; g.font = '9px monospace'; [100, 400, 1080, 2700, 6400, 15500].forEach(f => { const i = R.barks.indexOf(f); if (i >= 0) g.fillText(f >= 1000 ? (f / 1000) + 'k' : f, i * bw, H - 2); });
      g.fillStyle = '#00d4ff'; g.fillText('A', W - 30, 12); g.fillStyle = '#ffaa00'; g.fillText('B', W - 16, 12);
    } else if (tab === 'DYNAMICS') {
      [[R.rmsA, '#00d4ff'], [R.rmsB, '#ffaa00']].forEach(([c, col]) => { if (!c) return; g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); c.forEach((v, i) => { const x = i / c.length * W, y = H - Math.max(0, (v + 60) / 60) * H; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); });
      g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(`crest A ${R.crestA ? R.crestA.toFixed(1) : '—'} dB · B ${R.crestB ? R.crestB.toFixed(1) : '—'} dB (high = punchy, low = squashed)`, 6, 12);
    } else {
      const g16 = 60 / R.bpm / 4, span = Math.max(...R.onsetsA.concat(R.onsetsB, [2])); const X = (t) => t / span * W;
      for (let t = 0; t < span; t += g16) { g.fillStyle = Math.round(t / g16) % 4 === 0 ? '#223044' : '#141c27'; g.fillRect(X(t), 0, 1, H); }
      R.onsetsA.forEach(t => { g.fillStyle = '#00d4ff'; g.fillRect(X(t) - 1, 20, 3, 60); }); R.onsetsB.forEach(t => { g.fillStyle = '#ffaa00'; g.fillRect(X(t) - 1, 100, 3, 60); });
      g.fillStyle = '#7f93a8'; g.font = '10px monospace'; g.fillText(`${R.bpm} BPM grid (1/16)`, 6, 12);
    }
  }, 15);
  advice.appendChild(UI.hint('Waiting for two sounds — the scores (CLASH · LOUDNESS GAP · DISPLACEMENT) and plain-language advice appear here.'));
  view.root.append(h('div', { style: { display: 'flex', gap: '8px' } }, [slotEl('A', '#00d4ff'), slotEl('B', '#ffaa00')]), h('div', { class: 'org-row', style: { marginTop: '6px' } }, [tabs.el, UI.Button({ label: 'Re-analyse', onClick: () => view.emit('reanalyse', {}) }).el]), cv, scores, advice);
});
