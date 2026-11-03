/* 3.95: these test every colour reacting — dark surfaces and greys too — which is Light over the tools (on here, off again after).
 * 3.83 · James, 2026-11-01: "i want the colors in the tools to use the reactive colors" — what a tool DRAWS and WRITES reacts */
window.__phase = 'P83';
describe('P83 · the colours inside the tools react', () => {
  const host = () => { if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } if (!ModsRack.render) Mods.init(Kernel); };
  const mode0 = () => SoundCSS.mode;
  const dist = (a, b) => { const p = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; const m = /^#(..)(..)(..)/.exec(x.fillStyle) || /(\d+), (\d+), (\d+)/.exec(x.fillStyle); return m ? (m[0][0] === '#' ? [1, 2, 3].map(i => parseInt(m[i], 16)) : [1, 2, 3].map(i => +m[i])) : [0, 0, 0]; }; const A = p(a), B = p(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  it('a canvas inside a sounding window draws with reacting colours; quiet or outside a window it draws exactly what it was told', async () => {
    host(); const m0 = mode0(); if (SoundCSS.setLight) SoundCSS.setLight(true); SoundCSS.setMode('static'); const id = OrganismFactory.spawn('eravos.wub-filter', { x: 40, y: 40 }); await TH.sleep(30);
    try {
      const w = CanvasWM.windowOf(id), cv = document.createElement('canvas'); w.querySelector('.wm-body, .org-body, div').appendChild(cv); const g = cv.getContext('2d');
      const out = document.createElement('canvas').getContext('2d');
      g.fillStyle = '#ff2266'; assert.equal(g.fillStyle, '#ff2266', 'quiet: exact');
      SoundCSS.liveAcc(w, 0.9);
      g.fillStyle = '#ff2266'; const acc = g.fillStyle; assert.ok(acc !== '#ff2266', 'an accent lights: ' + acc);
      g.fillStyle = '#080b10'; const dark = g.fillStyle; assert.lt(dist(dark, '#080b10'), dist(acc, '#ff2266'), 'a dark surface leans less than an accent');
      g.strokeStyle = 'rgba(255, 34, 102, 0.25)'; assert.ok(/0\.25\)$/.test(g.strokeStyle), 'alpha kept: ' + g.strokeStyle);
      out.fillStyle = '#ff2266'; assert.equal(out.fillStyle, '#ff2266', 'a canvas outside any window is untouched');
      SoundCSS.restoreAcc(w); g.fillStyle = '#ff2266'; assert.equal(g.fillStyle, '#ff2266', 'quiet again: exact');
      SoundCSS.setMode('off'); SoundCSS.liveAcc(w, 0.9); g.fillStyle = '#ff2266'; assert.equal(g.fillStyle, '#ff2266', 'Off is off');
    } finally { OrganismFactory.close(id); SoundCSS.setMode(m0); if (SoundCSS.setLight) SoundCSS.setLight(false); }
  });
  it('a literal colour a tool writes inline becomes its own variable: the same colour at rest, lit with the window', async () => {
    const el = UIKit.h('div', { style: { background: '#0c0910', border: '1px solid #2a1d33', color: 'rgba(255, 34, 102, 0.5)', width: '10px' } }); document.body.appendChild(el);
    try {
      assert.equal(el.style.getPropertyValue('--rc-background-0'), '#0c0910'); assert.equal(getComputedStyle(el).backgroundColor, 'rgb(12, 9, 16)', 'looks the same');
      assert.ok(/var\(--rc-border-0\)/.test(el.style.border), 'border through its variable'); assert.equal(getComputedStyle(el).color, 'rgba(255, 34, 102, 0.5)');
    } finally { el.remove(); }
    host(); const m0 = mode0(); if (SoundCSS.setLight) SoundCSS.setLight(true); SoundCSS.setMode('static'); const id = OrganismFactory.spawn('eravos.wobble-bass', { x: 40, y: 40 }); await TH.sleep(60);
    try {
      const w = CanvasWM.windowOf(id), card = w.querySelector('[style*="--rc-"]'); assert.ok(card, 'the window has inline colours as variables');
      const n = Array.from(card.style).find(x => x.startsWith('--rc-')), base = card.style.getPropertyValue(n).trim();
      SoundCSS.liveAcc(w, 0.9, performance.now() + 5000); assert.ok(card.style.getPropertyValue(n).trim() !== base, 'lit: ' + n);
      SoundCSS.restoreAcc(w); assert.equal(card.style.getPropertyValue(n).trim(), base, 'back exactly');
    } finally { OrganismFactory.close(id); SoundCSS.setMode(m0); if (SoundCSS.setLight) SoundCSS.setLight(false); }
  });
  it('Changing turns a dark tinted background with the accents (no red cast left under green)', async () => {
    host(); const m0 = mode0(); if (SoundCSS.setLight) SoundCSS.setLight(true); SoundCSS.setMode('changing'); const id = OrganismFactory.spawn('eravos.wub-filter', { x: 40, y: 40 }); await TH.sleep(30);
    try {
      const w = CanvasWM.windowOf(id), cv = document.createElement('canvas'); w.appendChild(cv); const g = cv.getContext('2d');
      w._shift = 120; SoundCSS.liveAcc(w, 1, performance.now() + 9000, { mode: 'changing', amt: 1, shift: 120, pulse: 0, colors: SoundCSS.colors });
      const hue = (c) => { g.fillStyle = c; const v = g.fillStyle, n = parseInt(v.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), d = mx - mn; if (!d) return 0; let h = mx === r ? ((gg - b) / d) % 6 : mx === gg ? (b - r) / d + 2 : (r - gg) / d + 4; return ((h * 60) + 360) % 360; };
      const turn = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
      const acc = hue(w._ro.acc), dark = hue('#0b0710'), grid = hue('#1c2838');
      assert.lt(turn(acc, dark), 25, 'a dark pink background takes the accent\'s new hue (accent ' + acc.toFixed(0) + '°, dark ' + dark.toFixed(0) + '°)');
      assert.lt(turn(acc, grid), 25, 'a blue-grey grid does too, it is not turned into another colour (grid ' + grid.toFixed(0) + '°)');
    } finally { OrganismFactory.close(id); SoundCSS.setMode(m0); if (SoundCSS.setLight) SoundCSS.setLight(false); }
  });
  it('3.83b lit again and again (25 times a second), a colour stays where it should: nothing is lit twice', async () => {
    host(); const m0 = mode0(); if (SoundCSS.setLight) SoundCSS.setLight(true); SoundCSS.setMode('changing'); const id = OrganismFactory.spawn('eravos.dub-station', { x: 40, y: 40 }); await TH.sleep(60);
    try {
      const w = CanvasWM.windowOf(id), o = { mode: 'changing', amt: 1, shift: 110, pulse: 0.5, colors: SoundCSS.colors };
      SoundCSS.liveAcc(w, 1, performance.now() + 5000, o); const once = Array.from(w.style).filter(n => n.startsWith('--')).map(n => n + '=' + w.style.getPropertyValue(n).trim()).sort().join(' ');
      for (let i = 0; i < 25; i++) SoundCSS.liveAcc(w, 1, performance.now() + 5000 + i * 100, o);
      const many = Array.from(w.style).filter(n => n.startsWith('--')).map(n => n + '=' + w.style.getPropertyValue(n).trim()).sort().join(' ');
      assert.equal(many, once, 'the same colours after 25 lightings as after one');
      SoundCSS.restoreAcc(w); assert.ok(!Array.from(w.style).some(n => n.startsWith('--rcs-')), 'quiet: the stylesheet colours are back to the sheet');
    } finally { OrganismFactory.close(id); SoundCSS.setMode(m0); if (SoundCSS.setLight) SoundCSS.setLight(false); }
  });
  it('3.83b a colour set later (a pad border repainted) and a colour in a stylesheet react too', async () => {
    host(); const m0 = mode0(); if (SoundCSS.setLight) SoundCSS.setLight(true); SoundCSS.setMode('static'); const id = OrganismFactory.spawn('eravos.wub-filter', { x: 40, y: 40 }); await TH.sleep(30);
    try {
      const w = CanvasWM.windowOf(id), el = document.createElement('div'); w.appendChild(el); el.style.border = '2px solid #ff6b00'; await TH.sleep(0);
      assert.ok(/var\(--rc-/.test(el.getAttribute('style')), 'converted: ' + el.getAttribute('style'));
      const sty = document.createElement('style'); sty.textContent = '.p83-probe { color: #ff2266; }'; document.head.appendChild(sty); const pr = document.createElement('span'); pr.className = 'p83-probe'; pr.textContent = 'x'; w.appendChild(pr);
      const before = getComputedStyle(pr).color, b0 = getComputedStyle(el).borderTopColor;
      SoundCSS.liveAcc(w, 0.9, performance.now() + 9000); el.style.border = '2px solid #ff6b00'; await TH.sleep(0);
      assert.ok(getComputedStyle(pr).color !== before, 'the stylesheet colour lit: ' + getComputedStyle(pr).color);
      assert.ok(getComputedStyle(el).borderTopColor !== b0, 'the repainted border keeps its lit colour: ' + getComputedStyle(el).borderTopColor);
      SoundCSS.restoreAcc(w); assert.equal(getComputedStyle(pr).color, before, 'back exactly'); sty.remove();
    } finally { OrganismFactory.close(id); SoundCSS.setMode(m0); if (SoundCSS.setLight) SoundCSS.setLight(false); }
  });
});
