/* eravos.coven UI — the chant as a ring of syllables around a circle (the current one burning), the mouth's three
 * formants on the spectrum, the spell text field, keyboard. */
OrganismFactory.reg('eravos.coven', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const V = { A: [800, 1150, 2900], E: [400, 2000, 2550], I: [280, 2250, 2890], O: [450, 800, 2830], U: [325, 700, 2530], Y: [300, 1700, 2400] };
  let cur = { v: 'A', i: 0 };
  const ring = UI.Canvas(170, 170); const t0 = performance.now();
  UI.loop(ring, () => {
    const g = ring.g; ring.fit(); const W = ring.W, H = 170, cx = W / 2, cy = H / 2, R = 62, s = String(view.state.chant || '').toUpperCase().replace(/[^AEIOUY]/g, '').split('');
    g.fillStyle = '#0a0204'; g.fillRect(0, 0, W, H);
    const rot = (performance.now() - t0) / 9000;
    g.strokeStyle = 'rgba(196,0,47,.55)'; g.lineWidth = 1.2; g.beginPath();
    for (let k = 0; k <= 5; k++) { const a = rot + k * 4 * Math.PI / 5 - Math.PI / 2; const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.beginPath(); g.arc(cx, cy, R + 8, 0, 7); g.stroke();
    s.forEach((c, i) => { const a = -Math.PI / 2 + i / s.length * Math.PI * 2, x = cx + Math.cos(a) * (R + 22), y = cy + Math.sin(a) * (R + 22), on = i === cur.i % Math.max(1, s.length); g.fillStyle = on ? '#ff2a55' : '#5a1a26'; g.font = (on ? '700 18px' : '600 13px') + ' serif'; g.textAlign = 'center'; g.fillText(c, x, y + 6); });
    g.fillStyle = '#ff2a55'; g.font = '700 34px serif'; g.textAlign = 'center'; g.fillText(cur.v, cx, cy + 12); g.textAlign = 'left';
  }, 30);
  view.on('vowel', (p) => { cur = p; });
  const chant = UI.paramControl(view, cfg('chant')); const inp = chant.el.querySelector('input'); if (inp) inp.style.width = '150px';
  UI.instrumentPanel(view, { color: '#c4002f', low: 45, high: 69, height: 64,
    header: [chant.el, UI.paramControl(view, cfg('chantDiv'), { segMax: 5 }).el],
    top: [h('div', { style: { display: 'grid', gridTemplateColumns: '170px 1fr', gap: '8px', alignItems: 'center' } }, [ring, h('div', {}, [UI.paramControl(view, cfg('hex'), { segMax: 7 }).el, UI.hint('Type a spell of vowels (A E I O U Y) — the coven’s mouth walks it one syllable per division. Hex rings the choir at φ, √2, π… for bells and ghosts; Screw drags it all down; Summon grows a drone under long chords.')])])],
    overlay(g, W, Hh) { const X = (f) => Math.log(f / 20) / Math.log(1000) * W, F = V[cur.v] || V.A; F.forEach((f, i) => { g.fillStyle = 'rgba(255,42,85,.35)'; g.fillRect(X(f) - 2, 0, 4, Hh); g.fillStyle = '#ff8aa0'; g.font = '9px monospace'; g.fillText('F' + (i + 1), X(f) + 3, 10 + i * 10); }); },
    keys: ['glide', 'voices', 'spread', 'breath', 'vibrato', 'hexMix', 'screw', 'static', 'summon', 'dark', 'attack', 'release', 'level'] });
});
