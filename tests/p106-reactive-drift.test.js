/* P106 · reactive colours never compound — his words, 2026-11-05: "also the canvas reactive colors keep compounding errors. test it.
 * maybe white border around tool ui". Every colour of five tools is snapshotted, the reactive colours are driven hard in every mode
 * (lit, pulsed, beat-stepped, the tools redrawing), switched off, and every colour must be back to what it was — as DRAWN (each colour
 * painted on one pixel and read back, ±3 per channel), so notation does not matter but any real creep does. */
window.__phase = 'P106';
describe('P106 · reactive colours come back exactly: no drift, no compounding', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); if (!SoundCSS._tick) SoundCSS.init(Kernel); }
  const px = document.createElement('canvas'); px.width = px.height = 1; const cv = px.getContext('2d', { willReadFrequently: true });
  const norm = (str) => String(str).replace(/(?:rgba?|oklab|oklch|lab|lch|color|hsla?)\((?:[^()]|\([^()]*\))*\)|#[0-9a-f]{3,8}\b/gi, (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = 'rgba(0,0,0,0)'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return d[3] ? '[' + d[0] + ',' + d[1] + ',' + d[2] + ',' + d[3] + ']' : ''; }).replace(/\d+\.\d+px/g, (n) => Math.round(parseFloat(n)) + 'px').replace(/,\s*0px 0px 0px 0px/g, '');
  const close = (a, b) => { const A = (a || '').match(/\[[^\]]*\]|[^\[]+/g) || [], B = (b || '').match(/\[[^\]]*\]|[^\[]+/g) || []; if (A.length !== B.length) return false; return A.every((x, i) => x[0] !== '[' ? x === B[i] : JSON.parse(x).every((v, j) => Math.abs(v - JSON.parse(B[i])[j]) <= 3)); };
  it('five tools, every mode driven for 300 frames with redraws, then off: every drawn colour is what it was, and no palette is left on a window', async () => {
    host(); const was = SoundCSS.mode;
    const ids = ['eravos.wobble-bass', 'eravos.fx-echo', 'eravos.groove-gen', 'eravos.retro-poly', 'eravos.pads'].map((t, i) => OrganismFactory.spawn(t, { x: 40 + i * 50, y: 40 + i * 40 }));
    try {
      SoundCSS.setMode('off'); await TH.sleep(400);
      const snap = () => { const m = new Map(); ids.forEach(id => { const w = CanvasWM.windowOf(id); [w, ...w.querySelectorAll('*')].forEach((el, k) => { const cs = getComputedStyle(el); m.set(id + ':' + k, [cs.color, cs.borderTopColor, cs.backgroundColor, cs.backgroundImage, cs.boxShadow].map(norm).join('|')); }); }); return m; };
      const before = snap();
      for (const mode of ['static', 'changing', 'custom', 'beat']) {
        SoundCSS.setMode(mode);
        for (let i = 0; i < 300; i++) {
          const ts = performance.now() + i * 100;
          ids.forEach(id => SoundCSS.liveAcc(CanvasWM.windowOf(id), Math.abs(Math.sin(i * 0.37 + id.length)), ts, { mode, amt: 0.8, shift: (i % 7) * 20, pulse: i % 4 === 0 ? 1 : 0, colors: SoundCSS.colors }));
          if (mode === 'beat' && i % 8 === 0) SoundCSS.beatStep();
          if (i % 25 === 0) ids.forEach(id => { const r = OrganismFactory.handle(id), c = (r.def.config || []).find(x => x.type === 'number'); if (c) r.view.emit('config_change', { key: c.key, value: c.default }); });
          if (i % 5 === 0) SoundCSS.step();
        }
        SoundCSS.setMode('off'); await TH.sleep(600);
        const after = snap(), bad = []; after.forEach((v, k) => { if (before.get(k) !== v && !close(before.get(k), v)) bad.push(k + ' ' + (before.get(k) || '').slice(0, 60) + ' → ' + v.slice(0, 60)); });
        assert.equal(bad.length, 0, `${mode}: ${bad.length} colours did not come back — ${bad.slice(0, 2).join(' · ')}`);
        ids.forEach(id => { const w = CanvasWM.windowOf(id); ['--amber', '--cyan', '--pink', '--green', '--violet', '--red'].forEach(v => assert.equal(w.style.getPropertyValue(v), '', `${mode}: ${v} left on a window (the plug's colour)`)); });
      }
    } finally { SoundCSS.setMode(was === 'off' ? 'static' : was); ids.forEach(id => OrganismFactory.close(id)); }
  });
  it('black surfaces are applied once: darkening an already neutral colour changes nothing', () => {
    const N = BlackSurfaces.neutral; for (const c of ['#0b1119', '#111823', 'rgba(7, 9, 13, 0.9)', '#223044']) { const a = N(c), b = N(a), c3 = N(b); assert.equal(b, a, c + ' twice'); assert.equal(c3, a, c + ' three times'); }
  });
});
