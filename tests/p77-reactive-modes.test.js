/* 3.77 — "anywhere there is color, and not one color, have options for the reactive color — like changing, the way it is now
 * (static), and a way to customize. the option needs to work, it does nothing, when trying to disable." */
window.__phase = 'P77';
describe('P77 · reactive colours: Off · Static · Changing · Custom', () => {
  const host = () => { if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } };
  const hueOf = (c) => { const n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h * 60; };
  it('turning a colour round the wheel keeps its light; Static keeps the hue; Custom leans toward your colours', () => {
    const S = SoundCSS, was = S.mode;
    try {
      assert.equal(S.rotate('#ff0000', 120), '#00ff00');
      S.setMode('static'); const st = S.colourFor('#ff2266', 0.8); assert.lt(Math.abs(hueOf(st) - hueOf('#ff2266')), 4, 'static: same hue');
      S.setMode('custom'); S.setColors({ low: '#00ff00', high: '#00ff00', hit: '#00ff00' }); const cu = S.colourFor('#ff2266', 0.9);
      assert.lt(Math.abs(hueOf(cu) - 120), 40, 'custom: toward your green — ' + cu);
    } finally { S.setColors({ low: '#ff2266', high: '#00d4ff', hit: '#ffffff' }); S.setMode(was === 'off' ? 'static' : was); }
  });
  it('every colour inside a window reacts — a pad’s own colour too — and each comes back exactly', () => {
    host(); const id = OrganismFactory.spawn('eravos.pads', { x: 40, y: 40 }), w = CanvasWM.windowOf(id), was = SoundCSS.mode;
    try {
      SoundCSS.setMode('static'); const pad = w.querySelector('[style*="--pc"]'); assert.ok(pad, 'a pad with its own colour');
      const pc0 = pad.style.getPropertyValue('--pc').trim(); w._accAt = 0;
      SoundCSS.liveAcc(w, 0.9); assert.ok(pad.style.getPropertyValue('--pc').trim() !== pc0, 'the pad’s colour moved');
      SoundCSS.restoreAcc(w); assert.equal(pad.style.getPropertyValue('--pc').trim(), pc0, 'and came back');
    } finally { OrganismFactory.close(id); SoundCSS.setMode(was === 'off' ? 'static' : was); }
  });
  it('Off is off: the class is set, the palette and every window are at rest, the older living layer stops too — and it is remembered', async () => {
    host(); const K = Kernel; K.audio.boot(); await K.audio.ctx.resume(); SoundCSS.init(K);
    const id = OrganismFactory.spawn('eravos.pad-forge', { x: 40, y: 40 }); await TH.sleep(60); const w = CanvasWM.windowOf(id), was = SoundCSS.mode;
    try {
      SoundCSS.setMode('off'); assert.ok(document.documentElement.classList.contains('snd-off')); assert.equal(SoundCSS.on, false);
      let stored = null; try { stored = localStorage.getItem('eravos.reactive.mode'); } catch (e) {} if (stored !== null) assert.equal(stored, 'off', 'remembered');
      for (let i = 0; i < 8; i++) { K.bus.publish('note:trigger', { target: id, note: 60, velocity: 1, time: K.audio.ctx.currentTime + 0.01, duration: 0.3 }); await TH.sleep(50); SoundCSS.step(); }
      assert.equal(+w.style.getPropertyValue('--tool-level') || 0, 0, 'no level'); assert.equal(document.documentElement.style.getPropertyValue('--pink'), '', 'palette at rest');
      if (w.classList.contains('alive')) assert.equal(+w.style.getPropertyValue('--live'), 0, 'the living layer is at rest too');
      SoundCSS.setMode('changing'); assert.equal(SoundCSS.on, true); assert.equal(document.documentElement.dataset.react, 'changing');
    } finally { OrganismFactory.close(id); SoundCSS.setMode(was === 'off' ? 'static' : was); }
  });
  it('⋯ Options → Reactive colours opens the panel: four mode cards with live previews, Amount, and (Custom) your colours + palettes', async () => {
    const entry = document.getElementById('reactBtn'); if (!entry) return;   // the options slot exists only on the full canvas page
    const was = SoundCSS.mode;
    try {
      entry.click(); await TH.sleep(80); const pop = document.querySelector('.rcp-pop'); assert.ok(pop, 'the panel opens');
      assert.deepEqual([...pop.querySelectorAll('.rcp-card .rcp-name')].map(b => b.textContent), ['Off', 'Static', 'Changing', 'Custom']);
      assert.equal(pop.querySelectorAll('canvas.rcp-pv').length, 4, 'a live preview on each');
      pop.querySelector('.rcp-card[data-mode="custom"]').click(); assert.equal(SoundCSS.mode, 'custom'); assert.ok(!pop.querySelector('.rcp-custom').hidden, 'your colours show');
      pop.querySelector('.rcp-pal').click(); assert.equal(SoundCSS.colors.low, ReactPanel.PALETTES[0][1].low, 'a palette sets your colours');
      pop.querySelector('.rcp-card[data-mode="off"]').click(); assert.equal(SoundCSS.mode, 'off'); assert.ok(pop.querySelector('.rcp-range').disabled);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await TH.sleep(20); assert.ok(!document.querySelector('.rcp-pop'), 'Esc closes it');
    } finally { SoundCSS.setMode(was === 'off' ? 'static' : was); const p2 = document.querySelector('.rcp-pop'); if (p2) p2.remove(); }
  });
  it('each tool has its own in ⚙ settings: Follow the app, or its own mode — saved with the tool, and it wins over the app’s', async () => {
    host(); const id = OrganismFactory.spawn('eravos.pads', { x: 40, y: 40 }), w = CanvasWM.windowOf(id), c = OrganismFactory.handle(id).ctx, was = SoundCSS.mode;
    try {
      assert.equal(SoundCSS.settingsOf(w).own, false, 'follows the app by default');
      ToolSettings.open(OrganismFactory.handle(id)); await TH.sleep(80);
      const sec = w.querySelector('.ts-sec[data-section="reactive"]') || document.querySelector('.ts-sec[data-section="reactive"]'); assert.ok(sec, 'a Reactive colours section in its settings');
      assert.deepEqual([...sec.querySelectorAll('.rcp-card')].map(b => b.dataset.mode), ['follow', 'off', 'static', 'changing', 'custom']);
      sec.querySelector('.rcp-card[data-mode="changing"]').click(); await TH.sleep(30);
      assert.equal(c.params.get('_react').mode, 'changing', 'saved on the tool'); assert.equal(c.serialize().params._react.mode, 'changing', 'and in its save');
      SoundCSS.setMode('static'); const S = SoundCSS.settingsOf(w); assert.ok(S.own && S.mode === 'changing', 'its own wins over the app’s');
      SoundCSS.setMode('off'); assert.equal(SoundCSS.settingsOf(w).mode, 'changing', 'even with the app Off');
    } finally { ToolSettings.close && ToolSettings.close(OrganismFactory.handle(id)); OrganismFactory.close(id); SoundCSS.setMode(was === 'off' ? 'static' : was); }
  });
  it('Changing follows each tool’s own sound: a dark sub and bright drums turn differently (no longer all together)', async () => {
    host(); const K = Kernel; K.audio.boot(); await K.audio.ctx.resume(); SoundCSS.init(K); const was = SoundCSS.mode; SoundCSS.setMode('changing');
    const sub = OrganismFactory.spawn('eravos.sub-engine', { x: 40, y: 40 }), pads = OrganismFactory.spawn('eravos.pads', { x: 600, y: 40 }); await TH.sleep(60);
    try {
      await TH.sleep(150); for (let i = 0; i < 28; i++) { const t = K.audio.ctx.currentTime + 0.01; K.bus.publish('note:trigger', { target: sub, note: 40, velocity: 1, time: t, duration: 0.3 }); K.bus.publish('note:trigger', { target: pads, note: 38, velocity: 1, time: t, duration: 0.2 }); await TH.sleep(45); SoundCSS.step(); }
      const a = CanvasWM.windowOf(sub)._shift, b = CanvasWM.windowOf(pads)._shift;
      assert.ok(typeof a === 'number' && typeof b === 'number', 'each has its own turn: ' + a + ' / ' + b + ' lv ' + CanvasWM.windowOf(sub).style.getPropertyValue('--tool-level') + ' / ' + CanvasWM.windowOf(pads).style.getPropertyValue('--tool-level') + ' ' + CanvasWM.windowOf(pads).dataset.react); assert.gt(Math.abs(a - b), 15, `sub ${a.toFixed(0)}° vs drums ${b.toFixed(0)}°`);
    } finally { OrganismFactory.close(sub); OrganismFactory.close(pads); SoundCSS.setMode(was === 'off' ? 'static' : was); }
  });
});
