/* eravos.fx-glitch UI — the last two seconds of what came in (a rolling strip) with every glitch drawn where it lands,
 * six HOLD pads (press = start on the next grid step, release = stop on the grid) and the Chaos controls. */
OrganismFactory.reg('eravos.fx-glitch', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), ac = view.ac;
  const an = view.tap('in', 1024), td = new Float32Array(1024);
  const H = 110, SPAN = 2, cv = UI.Canvas(560, H); cv.setAttribute('aria-label', 'the last two seconds of input, with glitches marked');
  const peaks = []; const evs = []; const COL = { repeat: '#ff0044', hold: '#ff0044', reverse: '#00d4ff', stop: '#ffaa00', half: '#aa66ff', scatter: '#00ff88' };
  view.on('event', (e) => { evs.push(e); while (evs.length > 40) evs.shift(); });
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, now = ac.currentTime; an.getFloatTimeDomainData(td); let p = 0; for (let i = 0; i < td.length; i++) p = Math.max(p, Math.abs(td[i]));
    peaks.push([now, p]); while (peaks.length && peaks[0][0] < now - SPAN) peaks.shift();
    g.fillStyle = '#100308'; g.fillRect(0, 0, W, H);
    const X = (t) => W - (now - t) / SPAN * W;
    evs.forEach(e => { const x0 = X(e.at), x1 = X(e.at + e.dur); if (x1 < 0 || x0 > W) return; g.fillStyle = (COL[e.kind] || '#fff') + '33'; g.fillRect(x0, 0, Math.max(2, x1 - x0), H); g.fillStyle = COL[e.kind] || '#fff'; g.fillRect(x0, 0, 2, H); g.font = '10px monospace'; g.fillText(e.kind, x0 + 4, 12); if (e.kind === 'repeat' || e.kind === 'hold') { g.fillStyle = (COL[e.kind]) + '88'; g.fillRect(X(e.at - e.len), H - 6, Math.max(2, e.len / SPAN * W), 6); } });
    g.fillStyle = '#ff6688'; peaks.forEach(([t, v]) => { const x = X(t), hh = Math.min(1, v) * (H / 2 - 8); g.fillRect(x, H / 2 - hh, 2, hh * 2); });
    g.fillStyle = '#8a5060'; g.font = '10px monospace'; g.fillText('← 2 s · input · bars under a repeat = the slice it replays', 6, H - 10);
  }, 30);
  // six hold pads
  const PADS = [{ label: 'REPEAT 1/8', ev: 'hold', div: '1/8' }, { label: 'REPEAT 1/16', ev: 'hold', div: '1/16' }, { label: 'REPEAT 1/32', ev: 'hold', div: '1/32' }, { label: 'REVERSE', ev: 'reverse' }, { label: 'STOP', ev: 'stop' }, { label: 'SCATTER', ev: 'scatter' }];
  const pads = h('div', { class: 'glitch-pads' });
  PADS.forEach((pd, i) => {
    const b = h('button', { class: 'glitch-pad', text: pd.label, title: 'hold — starts on the next grid step, stops on the grid when you let go (Space/Enter works too)', style: { '--pc': COL[pd.ev] || '#ff0044' } });
    const down = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } b.classList.add('on'); view.emit('hold', { key: 'p' + i, event: pd.ev, div: pd.div }); };
    const up = () => { if (!b.classList.contains('on')) return; b.classList.remove('on'); view.emit('release', { key: 'p' + i }); };
    b.addEventListener('pointerdown', (e) => { b.setPointerCapture(e.pointerId); down(e); }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, up));
    b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e); }); b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });
    pads.appendChild(b);
  });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramControl(view, cfg('bypass')).el]),
    cv, pads,
    h('div', { class: 'org-row', style: { gap: '8px', flexWrap: 'wrap' } }, [UI.paramControl(view, cfg('rate')).el, UI.paramControl(view, cfg('size')).el]),
    UI.paramPanel(view, ['repeats', 'pitchDrift', 'stopBeats', 'chaos', 'reverseProb', 'stopProb', 'scatterProb', 'mix'], { size: 30 }),
    UI.hint('Wire a sound in (its right-edge plug → this window). Press play: the pads and Chaos land on the grid. The Drop Builder and Automation can fire glitches too.'),
    UI.audioRouting(view).el,
  );
});
