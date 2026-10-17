/* eravos.syn-partials UI — two drawable spectra (drag across the bars to paint), the one a note starts on lit by A ↔ B;
 * where the partials actually sit (stretch) drawn under them; live spectrum, knobs, keyboard */
OrganismFactory.reg('eravos.syn-partials', function (view) {
  const UI = view.ui, h = UI.h, NP = view.descriptor.spectra.NP;
  function editor(set, color) {
    const cv = UI.Canvas(270, 110); cv.style.cursor = 'crosshair';
    const key = set === 'A' ? 'partialsA' : 'partialsB';
    UI.loop(cv, () => {
      const g = cv.g, W = cv.fit().W, H = 110, s = view.state, arr = s[key] || [], lit = set === 'A' ? 1 - s.morph : s.morph, bw = (W - 8) / NP;
      g.fillStyle = '#0f0b05'; g.fillRect(0, 0, W, H);
      for (let k = 1; k <= NP; k++) { const v = +arr[k - 1] || 0; g.fillStyle = color; g.globalAlpha = 0.35 + 0.65 * lit; g.fillRect(4 + (k - 1) * bw + 1, H - 14 - v * (H - 22), bw - 2, v * (H - 22)); }
      g.globalAlpha = 1;
      // where the partials sound with STRETCH (ticks under the bars, against the harmonic grid)
      g.fillStyle = '#7f93a8'; for (let k = 1; k <= NP; k++) { const r = k * (1 + (s.stretch || 0) * 0.035 * (k - 1)), x = 4 + (r - 0.5) / NP * (W - 8); if (x < W) g.fillRect(x, H - 9, 1, 6); }
      g.font = '10px monospace'; g.fillText(set === 'A' ? 'A — start' : 'B — evolve to', 6, 12);
    }, 30);
    let down = false;
    const paint = (e) => { const r = cv.getBoundingClientRect(), k = Math.floor((e.clientX - r.left - 4) / ((r.width - 8) / NP)) + 1, v = 1 - (e.clientY - r.top - 8) / (r.height - 22); if (k >= 1 && k <= NP) view.emit('partial_set', { set, k, v: Math.max(0, Math.min(1, v)) }); };
    cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); down = true; cv.setPointerCapture(e.pointerId); paint(e); });
    cv.addEventListener('pointermove', (e) => { if (down) paint(e); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { down = false; }));
    return cv;
  }
  const pair = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }, [editor('A', '#ffb547'), editor('B', '#ff7a47')]);
  UI.instrumentPanel(view, { top: [pair], keys: ['morph', 'evolve', 'tilt', 'oddEven', 'stretch', 'damp', 'octave', 'attack', 'decay', 'sustain', 'release', 'level'], low: 48, high: 72, color: '#ffb547',
    hint: 'Drag across the bars to draw. Stretch + Damp = bells and mallets; Evolve = a sound that changes as it holds.' });
});
