/* 3.48.2 · accents follow the sound — "all the accent colours are supposed to change with the sound" */
window.__phase = 'P48c';
describe('P48c · living accents', () => {
  const host = () => { if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } if (!ModsRack.render) Mods.init(Kernel); };
  const accOf = (el) => getComputedStyle(el).getPropertyValue('--acc').trim();
  it('a sounding window\'s accent moves with its level (every knob in it follows) and comes back when it is quiet', async () => {
    host(); const id = OrganismFactory.spawn('eravos.wub-filter', { x: 40, y: 40 }); await TH.sleep(30);
    try {
      const w = CanvasWM.windowOf(id), base = accOf(w), knob = w.querySelector('.uk-knob');
      assert.ok(knob, 'it has knobs'); assert.equal(accOf(knob), base, 'knobs take the window colour (no colour pinned on each knob)');
      SoundCSS.liveAcc(w, 0.9); const loud = accOf(w);
      assert.ok(loud && loud.toLowerCase() !== base.toLowerCase(), `loud ${loud} ≠ quiet ${base}`);
      assert.equal(accOf(knob), loud, 'the knob arcs follow'); assert.equal(w.dataset.accLive, loud, 'drawn displays read it too');
      SoundCSS.liveAcc(w, 0.2); assert.ok(accOf(w) !== loud, 'quieter = closer to its own colour');
      SoundCSS.restoreAcc(w); assert.equal(accOf(w), base, 'silence: its own colour again');
    } finally { OrganismFactory.close(id); }
  });
  it('a tool inside another (a mod card) keeps its own colour', async () => {
    host(); const id = OrganismFactory.spawn('eravos.fx-destroyer', { x: 40, y: 40 }); await TH.sleep(30);
    try {
      Mods.add(id, 'after', 'eravos.wub-filter'); await TH.sleep(150);
      const card = CanvasWM.windowOf(id).querySelector('.md-card'); assert.ok(card, 'card');
      assert.equal(accOf(card).toLowerCase(), OrganismFactory.def('eravos.wub-filter').accent.toLowerCase());
    } finally { OrganismFactory.close(id); }
  });
});
