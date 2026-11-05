/* P109 · the Timeline's piano roll scales and can be its own window — his words, 2026-11-05: "also split the timeline. maybe. it doesn't
 * scale well, also i want them to be seperate or an option to be seperate" → "Piano roll its own window" → "oh and make it borderless".
 *   · the notes fill the roll's width (a 2-bar clip drew 450 px of grid in a 1,500 px roll) until a zoom is picked by hand
 *   · VIEW › Piano roll in its own window (default off: under the tracks, as before): one borderless panel (CanvasWM.openPanel) that
 *     follows the open clip; × closes the clip; turning it off, or the Timeline closing, puts everything back */
window.__phase = 'P109';
describe('P109 · piano roll: fills its width, and its own borderless window as an option', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make() {
    host(); const id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1400, h: 700 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(60);
    pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [{ s: 0, l: 4, n: 69, v: 0.8 }] }); await TH.sleep(80);
    pub('clip_add', { kind: 'notes', startBar: 5, bars: 1, notes: [{ s: 0, l: 2, n: 72, v: 0.8 }] }); await TH.sleep(80);
    const H = OrganismFactory.handle(id), clips = H.ctx.internals.clips.filter(c => c.kind === 'notes');
    return { id, H, pub, clips, panel: () => document.querySelector(`.wm-panel[data-owner="${id}"]`), win: () => CanvasWM.windowOf(id) };
  }
  it('the notes fill the roll’s width; a zoom picked by hand is kept', async () => {
    const t = await make();
    try {
      t.H.view.openClip(t.clips[0].id); await TH.sleep(250);
      const sc = t.win().querySelector('.tlpr-scroll'), g = t.win().querySelector('.tlpr-grid');
      assert.ok(g.getBoundingClientRect().width > sc.getBoundingClientRect().width * 0.85, `grid ${Math.round(g.getBoundingClientRect().width)} px of ${Math.round(sc.getBoundingClientRect().width)} px`);
      const roll = t.win().querySelector('.tlpr'); const sel = Array.from(roll.querySelectorAll('select')).find(s => Array.from(s.options).some(o => o.value === 'fit'));
      sel.value = '8'; sel.dispatchEvent(new Event('change', { bubbles: true })); await TH.sleep(60);
      const w8 = g.getBoundingClientRect().width; t.win().style.width = '1300px'; await TH.sleep(120);
      assert.near(g.getBoundingClientRect().width, w8, 2, 'a hand-picked zoom stays when the window changes size');
    } finally { OrganismFactory.close(t.id); }
  });
  it('own window: off by default; on → one borderless panel with the roll, follows the clip, × closes the clip, off / closing the Timeline puts it back', async () => {
    const t = await make();
    try {
      t.H.view.openClip(t.clips[0].id); await TH.sleep(150);
      assert.equal(t.panel(), null, 'default: under the tracks, as before'); assert.ok(t.win().querySelector('.tlpr.open'));
      t.pub('config_change', { key: 'rollWindow', value: true }); await TH.sleep(200);
      const p = t.panel(); assert.ok(p, 'a panel'); assert.ok(p.querySelector('.tlpr.open'), 'the roll is in it'); assert.equal(t.win().querySelector('.tlpr'), null, 'and not in the Timeline');
      const cs = getComputedStyle(p); assert.equal(parseFloat(cs.borderTopWidth) || 0, 0, 'borderless'); assert.equal(cs.boxShadow, 'none', 'no frame');
      t.H.view.openClip(t.clips[1].id); await TH.sleep(150);
      assert.equal(document.querySelectorAll('.wm-panel').length, 1, 'one roll window: another clip switches it');
      p.querySelector('.wm-x').click(); await TH.sleep(120);
      assert.equal(t.panel(), null, '× closes it'); assert.equal(document.querySelectorAll('.tlpr.open').length, 0, 'and the clip'); assert.ok(t.win().querySelector('.tlpr'), 'the roll is home');
      t.H.view.openClip(t.clips[0].id); await TH.sleep(150); assert.ok(t.panel(), 'opening a clip again: its window');
      t.pub('config_change', { key: 'rollWindow', value: false }); await TH.sleep(150);
      assert.equal(t.panel(), null, 'off: no panel'); assert.ok(t.win().querySelector('.tlpr.open'), 'the roll back under the tracks, still open');
      t.pub('config_change', { key: 'rollWindow', value: true }); await TH.sleep(150); assert.ok(t.panel());
    } finally { OrganismFactory.close(t.id); }
    await TH.sleep(120); assert.equal(document.querySelectorAll('.wm-panel').length, 0, 'the Timeline closing takes its roll window with it');
  });
});
