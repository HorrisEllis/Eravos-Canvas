/* eravos.band-collision UI — the COLLISION element (masking-analyzer's): the sound through it and the key, as spectra; lit where they collide;
 * the split line and the band each side of it; the duck as it happens. Then the controls by part. */
OrganismFactory.reg('eravos.band-collision', function (view) {
  const UI = view.ui, h = UI.h, ACC = '#ff5a3c', ACC2 = '#5ac8ff', DIM = '#8f8f99';
  const cfg = (k) => view.descriptor.config.find(c => c.key === k), S = (k) => view.state[k];
  const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 30, segMax: 4 }); c.el.dataset.key = k; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const duckTap = view.tap('duck', 256), db = new Float32Array(256), anIn = view.tap('in', 4096), anKey = view.tap('key', 4096);
  const fa = new Float32Array(anIn.frequencyBinCount), fb = new Float32Array(anKey.frequencyBinCount);
  const cv = UI.Canvas(560, 170); let last = null, tick = 0;
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = 170, base = H - 18, top = 30, x = (hz) => 6 + Math.log(hz / 20) / Math.log(800) * (W - 12), y = (d) => base - Math.max(0, Math.min(1, (d + 90) / 80)) * (base - top);
    g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
    if (tick++ % 3 === 0) { anIn.getFloatFrequencyData(fa); anKey.getFloatFrequencyData(fb); const binHz = anIn.context.sampleRate / anIn.fftSize; last = Object.assign(window.MusicParts.masking(fa, fb, { binHz }), { a: fa, b: fb, binHz }); }
    if (last) {
      last.bands.forEach(b => { if (b.collide <= 0.02 || b.lo > 16000) return; g.fillStyle = `rgba(255,90,60,${0.15 + 0.6 * b.collide})`; const yy = y(Math.min(b.a, b.b)); g.fillRect(x(b.lo), yy, x(b.hi) - x(b.lo) - 1, base - yy); });
      [[last.a, '#e8e8ea'], [last.b, ACC2]].forEach(([d, col]) => { g.strokeStyle = col; g.lineWidth = 1.3; g.beginPath(); let on = false;
        for (let i = 1; i < d.length; i++) { const hz = i * last.binHz; if (hz < 20 || hz > 16000) continue; const yy = y(d[i]); on ? g.lineTo(x(hz), yy) : g.moveTo(x(hz), yy); on = true; } g.stroke(); });
    }
    const sx = x(S('split')); g.strokeStyle = ACC; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(sx, top - 6); g.lineTo(sx, base); g.stroke(); g.setLineDash([]);
    duckTap.getFloatTimeDomainData(db); let e = 0; for (const v of db) e = Math.max(e, v);
    const dLow = S('lowDuck') * e; g.fillStyle = ACC; g.fillRect(6, base + 6, Math.max(0, (sx - 6) * Math.min(1, dLow / 36)), 4);
    [30, 50, 100, 200, 500, 1000, 5000].forEach(hz => { g.fillStyle = DIM; g.font = '10px ui-monospace, monospace'; g.fillText(hz >= 1000 ? hz / 1000 + 'k' : '' + hz, x(hz) - 6, H - 1); });
    g.font = '10px ui-monospace, monospace'; g.fillStyle = '#e8e8ea'; g.fillText('The sound', 6, 12); g.fillStyle = ACC2; g.fillText('The key', 74, 12);
    g.fillStyle = ACC; g.fillText(last ? `Collide ${(last.total * 100).toFixed(0)} %` : 'Collide —', 128, 12);
    g.fillStyle = DIM; g.fillText(`LOW < ${S('split')} Hz ducks ${dLow.toFixed(1)} dB now`, W - 230, 12);
    g.fillText(last && last.total > 0.02 ? 'Lit: both loud in the same band' : 'Wire a kick into the key (blue dot) to see where they meet', 6, 24);
  }, 30);
  const face = h('div', { class: 'uk-panel' }, [card('SPLIT', ['split', 'lowMono']), card('DUCK', ['lowDuck', 'midDuck']), card('KEY', ['attack', 'hold', 'release'])]);
  const deep = h('div', { class: 'uk-panel' }, [card('KEY+', ['floor']), card('BANDS', ['lowGain', 'midGain']), card('OUT', ['mix'])]);
  deep.style.display = 'none';
  const more = UI.Button({ label: 'More depth ▸', hint: 'What the key hears from, each band’s level, the mix', onClick: () => { const show = deep.style.display === 'none'; deep.style.display = show ? '' : 'none'; more.el.textContent = show ? 'More depth ▾' : 'More depth ▸'; } });
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]), cv, face, h('div', { class: 'org-row' }, [more.el]), deep,
    UI.hint('Two sounds in one band fight for it. Wire the bass through, a kick into the key: on every kick the low band steps back (Low duck), the mid if you want (Mid duck). The duck goes out (violet) to move anything else at the same moment.'));
});
