/* P102 · Reactive colours › Beat — his words, 2026-11-05: "i want them to be the same color and change to the beat" · "Everything turns
 * the same colour and changes on the beat … with no restyle". */
window.__phase = 'P102';
describe('P102 · Beat colour — one colour for every tool, moving on the beat', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); if (!SoundCSS._tick) SoundCSS.init(Kernel); }
  const accOf = (id) => getComputedStyle(CanvasWM.windowOf(id)).getPropertyValue('--acc').trim();
  const norm = (c) => { const d = document.createElement('i'); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v; };
  it('every tool and the page share one colour; a beat moves it on; greys and surfaces keep theirs; back to Static restores each tool', async () => {
    host(); const was = SoundCSS.mode, every = SoundCSS.beatEvery;
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 10, y: 10 }), b = OrganismFactory.spawn('eravos.fx-echo', { x: 700, y: 10 }); await TH.sleep(40);
    const own = [accOf(a), accOf(b)];
    try {
      assert.ok(norm(own[0]) !== norm(own[1]), 'two tools with their own colours to start with');
      SoundCSS.setMode('beat'); SoundCSS.step(); await TH.sleep(20);
      const c1 = SoundCSS.beatColour, page = getComputedStyle(document.documentElement).getPropertyValue('--pink').trim();
      assert.ok(c1, 'a beat colour'); assert.equal(norm(accOf(a)), norm(c1), 'Wobble Bass wears it'); assert.equal(norm(accOf(b)), norm(c1), 'Tape Echo wears it');
      assert.equal(norm(page), norm(c1), 'the page palette is it too');
      const win = CanvasWM.windowOf(a), cv = document.createElement('canvas'); win.appendChild(cv);
      assert.equal(norm(SoundCSS.colourIn(cv, '#ff2266')), norm(c1), 'a colour a tool draws becomes the beat colour');
      assert.equal(SoundCSS.colourIn(cv, '#1a2230'), '#1a2230', 'a dark surface keeps its own'); assert.equal(SoundCSS.colourIn(cv, '#8a8a8a'), '#8a8a8a', 'a grey keeps its own'); cv.remove();
      SoundCSS.beatStep(); for (let i = 0; i < 12; i++) SoundCSS.step(); await TH.sleep(20);
      const c2 = SoundCSS.beatColour; assert.ok(norm(c2) !== norm(c1), `the beat moved it on (${c1} → ${c2})`); assert.equal(norm(accOf(a)), norm(c2)); assert.equal(norm(accOf(b)), norm(c2));
      // the transport's own tick (beat 2 of a bar, heard now) steps it; with "every bar" a mid-bar beat does not
      SoundCSS.setBeatEvery(4); const before = SoundCSS.beatBase; Kernel.bus.publish('transport:tick', { step16: 4, time: Kernel.audio.ctx.currentTime, bar: 1, beat: 2, sixteenth: 1 }); await TH.sleep(30); for (let i = 0; i < 12; i++) SoundCSS.step();
      assert.equal(SoundCSS.beatBase, before, 'every bar: beat 2 does not move it');
      Kernel.bus.publish('transport:tick', { step16: 16, time: Kernel.audio.ctx.currentTime, bar: 2, beat: 1, sixteenth: 1 }); await TH.sleep(30); for (let i = 0; i < 12; i++) SoundCSS.step();
      assert.ok(SoundCSS.beatBase !== before, 'every bar: the next bar does');
    } finally { SoundCSS.setBeatEvery(every); SoundCSS.setMode(was === 'beat' ? 'static' : was); await TH.sleep(20); }
    assert.equal(norm(accOf(a)), norm(own[0]), 'out of Beat, Wobble Bass has its own colour back'); assert.equal(norm(accOf(b)), norm(own[1]), 'and Tape Echo its own');
    OrganismFactory.close(a); OrganismFactory.close(b);
  });
});
