/* eravos.fx-pitch UI — what goes in vs what comes out: both pitches tracked live and drawn as a scrolling trace
 * with note names, plus the shift itself as a big readout. */
OrganismFactory.reg('eravos.fx-pitch', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), MT = window.MusicTheory;
  const anIn = view.tap('in', 2048), anOut = view.tap('out', 2048), ti = new Float32Array(2048), to = new Float32Array(2048);
  function f0(an, td) {
    if (!an) return null; an.getFloatTimeDomainData(td); let e = 0; for (let i = 0; i < td.length; i++) e += td[i] * td[i]; if (e / td.length < 1e-5) return null;
    const sr = an.context.sampleRate, lo = Math.floor(sr / 1200), hi = Math.floor(sr / 60); let best = 0, bl = 0;
    for (let L = lo; L <= hi; L += 1) { let c = 0; for (let i = 0; i < 1024; i += 2) c += td[i] * td[i + L]; if (c > best) { best = c; bl = L; } }
    return bl ? sr / bl : null;
  }
  const H = 150, cv = UI.Canvas(520, H), hist = []; cv.setAttribute('aria-label', 'input and output pitch over time');
  const big = h('div', { class: 'org-big', style: { fontSize: '28px', color: '#ff44aa', minWidth: '120px' }, 'aria-live': 'polite' });
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, s = view.state; const a = f0(anIn, ti), b = f0(anOut, to);
    hist.push([a ? MT.midiOfHz(a) : null, b ? MT.midiOfHz(b) : null]); if (hist.length > W / 3) hist.shift();
    g.fillStyle = '#0d0610'; g.fillRect(0, 0, W, H);
    const lo = 24, hi = 96, Y = (n) => H - (n - lo) / (hi - lo) * (H - 10) - 5;
    for (let n = 36; n <= 84; n += 12) { g.fillStyle = '#24152a'; g.fillRect(0, Y(n), W, 1); g.fillStyle = '#6a4a70'; g.font = '9px monospace'; g.fillText(MT.noteName(n), 2, Y(n) - 2); }
    [[0, 'rgba(255,255,255,.45)'], [1, '#ff44aa']].forEach(([k, col]) => { g.fillStyle = col; hist.forEach((v, i) => { if (v[k] !== null) g.fillRect(i * 3, Y(v[k]) - 1.5, 3, 3); }); });
    g.font = '11px monospace'; g.fillStyle = '#bbb'; g.fillText('in ' + (a ? MT.noteName(Math.round(MT.midiOfHz(a))) : '—'), W - 120, 14); g.fillStyle = '#ff44aa'; g.fillText('out ' + (b ? MT.noteName(Math.round(MT.midiOfHz(b))) : '—'), W - 60, 14);
    const st = s.semitones + s.cents / 100; big.textContent = (st > 0 ? '+' : '') + (Math.abs(st % 1) > 0.001 ? st.toFixed(2) : st.toFixed(0)) + ' st';
  }, 15);
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), UI.paramControl(view, cfg('bypass')).el]),
    cv,
    h('div', { class: 'org-row', style: { alignItems: 'center', gap: '10px', flexWrap: 'wrap' } }, [big, UI.paramPanel(view, ['semitones', 'cents', 'window', 'glide'], { flat: true, noTitles: true, size: 34 })]),
    h('div', { class: 'org-row', style: { gap: '8px', flexWrap: 'wrap' } }, [UI.paramControl(view, cfg('harm1')).el, UI.paramControl(view, cfg('harm2')).el]),
    UI.paramPanel(view, ['harmLevel', 'mix', 'inGain', 'outGain'], { flat: true, noTitles: true, size: 30 }),
    UI.hint('Harmonies follow the sound you feed in and land on notes of the song key — a 3rd is always the in-key 3rd.'),
    UI.audioRouting(view).el,
  );
});
