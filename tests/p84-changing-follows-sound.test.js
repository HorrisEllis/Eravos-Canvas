/* 3.84 — James, 2026-11-01: "the changing setting is supposed to change the color based on the sound." Changing had a ±40° clock drift. */
window.__phase = 'P84';
describe('〰 Changing follows the sound, and only the sound (3.84)', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function play(id, note, steps, out) {
    const K = Kernel; for (let i = 0; i < steps; i++) { if (i % 6 === 0) K.bus.publish('note:trigger', { target: id, note, velocity: 1, time: K.audio.ctx.currentTime + 0.01, duration: 0.6 }); await TH.sleep(40); SoundCSS.step(); if (out) out.push(CanvasWM.windowOf(id)._shift); }
  }
  it('a deep sub turns its colours one way, a bright lead the other; a held note holds its colour (no drift)', async () => {
    host(); const K = Kernel; await K.audio.ctx.resume(); SoundCSS.init(K); const was = [SoundCSS.mode, SoundCSS.draw]; SoundCSS.setDraw('page'); SoundCSS.setMode('changing');
    const sub = OrganismFactory.spawn('eravos.sub-engine', { x: 40, y: 40 }), lead = OrganismFactory.spawn('eravos.supersaw', { x: 640, y: 40 }); await TH.sleep(200);
    try {
      const subS = [], leadS = [];
      await play(sub, 33, 24, subS); await play(lead, 88, 24, leadS);
      const a = subS.filter(x => typeof x === 'number').slice(-6), b = leadS.filter(x => typeof x === 'number').slice(-6);
      assert.ok(a.length && b.length, 'both turned: ' + subS.slice(-3) + ' / ' + leadS.slice(-3));
      const mean = (v) => v.reduce((x, y) => x + y, 0) / v.length;
      assert.ok(mean(a) < mean(b) - 40, 'the sub sits low (' + mean(a).toFixed(0) + '°), the lead high (' + mean(b).toFixed(0) + '°)');
      assert.ok(Math.max(...a) - Math.min(...a) <= 24, 'a held sub holds its colour: ' + a.join(', '));
      // the same sound, read 100 times in a row (no time for it to change): the colour must not move — a clock would move it
      K.bus.publish('note:trigger', { target: sub, note: 33, velocity: 1, time: K.audio.ctx.currentTime + 0.01, duration: 2 }); await TH.sleep(300);
      const w = CanvasWM.windowOf(sub), seq = []; for (let i = 0; i < 100; i++) { SoundCSS.step(); seq.push(w._shift); }
      assert.ok(Math.max(...seq.slice(20)) - Math.min(...seq.slice(20)) <= 12, 'no drift with the sound unchanged: ' + seq.slice(20).filter((x, i) => i % 10 === 0).join(', '));
    } finally { OrganismFactory.close(sub); OrganismFactory.close(lead); SoundCSS.setMode(was[0] === 'off' ? 'static' : was[0]); SoundCSS.setDraw(was[1]); }
  });
});
/* 3.95 — James: "i dont want the layer of light over the tools, only the buttons, knobs, anything that already has color, make that an
 * option in the settings. accent around the border and the font is colored like the rest of the ui and tools" */
describe('💡 Light over the tools: off by default (3.95)', () => {
  it('off: the surfaces never lean, the border and title wear the accent, a theme\'s window light is hidden; on: the surfaces lean again', () => {
    const R = document.documentElement, was = SoundCSS.light; SoundCSS.setLight(false);
    try {
      assert.equal(R.dataset.reactLight, 'colour');
      const w = document.createElement('div'); w.className = 'wm-win'; w.style.setProperty('--acc', '#ff2266'); const t = document.createElement('span'); t.className = 'wm-title'; t.textContent = 'x'; w.appendChild(t); document.body.appendChild(w);
      try { assert.equal(getComputedStyle(t).color, 'rgb(255, 34, 102)', 'the title in the accent'); assert.ok(getComputedStyle(w).borderTopColor !== 'rgba(0, 0, 0, 0)', 'an accent border'); } finally { w.remove(); }
      SoundCSS.setLight(true); assert.equal(R.dataset.reactLight, 'over');
    } finally { SoundCSS.setLight(was); }
  });
});
