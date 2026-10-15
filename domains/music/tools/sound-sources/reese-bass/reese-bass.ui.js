/* eravos.reese-bass UI — goniometer (L/R Lissajous from a real analyser pair) + STACK | FILTER | COMB | DRIVE+SUB */
OrganismFactory.reg('eravos.reese-bass', function (view) {
  const UI = view.ui, h = UI.h;
  const st = view.tapStereo('out', 1024);
  const gon = UI.Canvas(150, 150); gon.style.width = '150px'; gon.style.flex = 'none';
  const bl = new Float32Array(1024), br = new Float32Array(1024);
  let corr = 1;
  UI.loop(gon, () => {
    const g = gon.g, W = 150, H = 150;
    g.fillStyle = 'rgba(8,11,16,0.35)'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1a2533'; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    if (!st) return;
    st.L.getFloatTimeDomainData(bl); st.R.getFloatTimeDomainData(br);
    let sLR = 0, sLL = 0, sRR = 0;
    g.fillStyle = '#ff2266';
    for (let i = 0; i < 1024; i += 2) {
      const l = bl[i], r = br[i]; sLR += l * r; sLL += l * l; sRR += r * r;
      const m = (l + r) * 0.7, s = (l - r) * 0.7; // mid up, side across
      g.fillRect(W / 2 + s * W * 0.9, H / 2 - m * H * 0.9, 1.4, 1.4);
    }
    corr = sLL && sRR ? sLR / Math.sqrt(sLL * sRR) : 1;
    g.fillStyle = '#7f93a8'; g.font = '9px monospace'; g.fillText('corr ' + corr.toFixed(2), 4, H - 4);
  }, 30);
  const groups = UI.paramPanel(view, null, { size: 32 });
  const kb = UI.Keyboard({ low: 33, high: 57, key: view.key, onDown: (n) => view.emit('audition', { note: n + 12, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n + 12 }) });
  view.observe('theory:key-change', (k) => kb.setKey(k));
  view.root.append(h('div', { class: 'org-row' }, [UI.presetBar(view)]), h('div', { style: { display: 'flex', gap: '8px', alignItems: 'flex-start' } }, [gon, groups]), h('div', { style: { height: '6px' } }), kb.el);
});
