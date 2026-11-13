/* P174 — layers in the Workshop, finished. His words, 2026-11-13: "make sure we can edit, change and manipulate layers in workshop. Let's get
 * that finished." Every operation a layer has — the eye (off in the sound), amount, rename, duplicate, delete, reset, order, copy / paste,
 * lock — each one undo step, each reaching what plays. */
window.__phase = 'P174';
describe('P174 the Workshop’s layers: edit, change, manipulate', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make(notes) {
    host(); const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); const inst = OrganismFactory.spawn('eravos.retro-poly', { x: 40, y: 700 }); await TH.sleep(200);
    pub('lane_add', { kind: 'inst', name: 'Lead', target: inst }); await TH.sleep(80); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes }); await TH.sleep(120);
    const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clip.id); await TH.sleep(300);
    H.view.roll.openWorkshop(0); await TH.sleep(80);
    return { ws: Workshop.current, clip: () => H.ctx.internals.clips.find(c => c.id === clip.id), done: () => { if (Workshop.current) Workshop.current.close(); OrganismFactory.close(id); OrganismFactory.close(inst); CanvasWM.view = view0; CanvasWM.applyView(); } };
  }
  const NOTES = [{ s: 0, l: 8, n: 60, v: 0.8 }, { s: 8, l: 8, n: 64, v: 0.8 }];
  const peak = (b) => Math.max(...b.path.map(q => Math.abs(q[1])));
  const key = (k, o) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o || {})));
  it('a shape layer: off in the sound and back, amount, rename, lock refuses, delete, undo — each one step', async () => {
    const t = await make(NOTES);
    try { const ws = t.ws;
      ws.set('add', 'Pitch'); ws.set('base.preset', 'rise'); ws.set('base.hi', 4); ws.action('▴ UP'); await TH.sleep(30);
      const n0 = () => t.clip().notes[0]; assert.ok(n0().b && n0().b.shape === 'path' && peak(n0().b) > 3.5, 'the pitch rises 4 st');
      let ops = ws.layerOps('T:pitch'); ['remove', 'reset', 'rename', 'copy'].forEach(k => assert.ok(ops[k], 'a shape can ' + k)); assert.equal(ops.enable, true); assert.equal(ops.amount, 1);
      const h0 = ws.history().length;
      assert.ok(ws.layer('T:pitch', 'enable', false)); await TH.sleep(20); assert.ok(!n0().b, 'off: the note plays flat'); assert.ok(n0().sh.t.pitch, 'the shape is kept');
      assert.ok(document.querySelector('.ws-lay[data-id="T:pitch"]').classList.contains('off'), 'the row says off');
      assert.ok(ws.layer('T:pitch', 'enable', true)); await TH.sleep(20); assert.ok(peak(n0().b) > 3.5, 'on again: it rises');
      assert.ok(ws.layer('T:pitch', 'amount', 0.5)); await TH.sleep(20); assert.ok(Math.abs(peak(n0().b) - 2) < 0.15, 'amount 50 %: half the rise (' + peak(n0().b).toFixed(2) + ')');
      ws.select('T:pitch'); await TH.sleep(10); assert.ok(document.querySelector('.ws-amount input[type=range]'), 'Amount in PROPERTIES');
      assert.ok(ws.layer('T:pitch', 'rename', 'Scoop')); await TH.sleep(20); assert.ok(/Scoop/.test(document.querySelector('.ws-lay[data-id="T:pitch"]').textContent), 'renamed');
      assert.equal(ws.history().length, h0 + 4, 'four steps: ' + ws.history().slice(h0).join(' | '));
      ws.layer('T:pitch', 'lock'); assert.ok(ws.locked('T:pitch'));
      assert.ok(!ws.layer('T:pitch', 'remove') && n0().sh.t.pitch, 'locked: delete refused'); assert.ok(!ws.layer('T:pitch', 'amount', 1), 'locked: amount refused');
      assert.ok(document.querySelector('.ws-lockbar'), 'PROPERTIES says locked'); ws.layer('T:pitch', 'lock');
      key('Delete'); await TH.sleep(20); assert.ok(!(n0().sh && n0().sh.t.pitch) && !n0().b, 'Delete: the shape is gone');
      ws.undo(); await TH.sleep(20); assert.ok(n0().sh.t.pitch.name === 'Scoop' && n0().b, 'undo brings it back as it was');
    } finally { t.done(); }
  });
  it('modulators: rename, duplicate, order, off, amount, reset, delete; the footer and the menu offer only what the layer can do', async () => {
    const t = await make(NOTES);
    try { const ws = t.ws, mods = () => t.clip().notes[0].sh.t.pitch.mods;
      ws.set('add', 'Pitch'); ws.action('＋ MOD'); ws.action('＋ MOD'); await TH.sleep(20); assert.equal(mods().length, 2);
      ws.set('m.1.shape', 'square'); ws.layer('m:0', 'rename', 'Wobble'); ws.select('m:0'); key('j', { ctrlKey: true }); await TH.sleep(20);
      assert.deepEqual(mods().map(m => m.name || m.shape), ['Wobble', 'Wobble copy', 'square'], 'Ctrl+J duplicated it after itself'); assert.equal(ws.selected, 'm:1', 'the copy is selected');
      key(']', { ctrlKey: true }); await TH.sleep(20); assert.deepEqual(mods().map(m => m.name || m.shape), ['Wobble', 'square', 'Wobble copy'], 'Ctrl+] moved it down'); assert.equal(ws.selected, 'm:2', 'the selection follows');
      const flat = () => JSON.stringify(t.clip().notes[0].b.path);
      const p0 = flat(); ws.layer('m:1', 'enable', false); await TH.sleep(20); assert.ok(mods()[1].on === false && flat() !== p0, 'off: that modulator stops playing');
      ws.layer('m:1', 'enable', true); ws.layer('m:0', 'amount', 0); ws.layer('m:2', 'amount', 0); await TH.sleep(20);
      const pSq = flat(); ws.layer('m:1', 'amount', 0); await TH.sleep(20); assert.ok(!t.clip().notes[0].b || flat() !== pSq, 'amount 0 on every modulator: they add nothing');
      ws.layer('m:1', 'amount', 1); ws.layer('m:1', 'reset'); await TH.sleep(20); assert.equal(mods()[1].shape, 'sine', 'reset: the default modulator');
      ws.select('m:0'); await TH.sleep(10); const foot = Array.from(document.querySelectorAll('.ws-lfoot .ws-lt')).map(b => b.textContent);
      assert.ok(foot.includes('🗑') && !foot.includes('−') && !foot.includes('⊘'), 'one delete, in the footer: ' + foot.join(' '));
      const row = document.querySelector('.ws-lay[data-id="m:0"]'); row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 900, clientY: 500 })); await TH.sleep(20);
      const items = Array.from(document.querySelectorAll('.cm .cm-item')).map(b => b.textContent);
      ['Rename', 'Duplicate', 'Copy', 'Paste', 'Move up', 'Move down', 'Reset', 'Delete', 'Lock', 'Turn off'].forEach(w => assert.ok(items.some(x => x.indexOf(w) === 0), 'menu: ' + w + ' — ' + items.join(' · ')));
      ContextMenu.close();
      const n = mods().length; ws.layer('m:0', 'remove'); await TH.sleep(20); assert.equal(mods().length, n - 1, 'Delete takes one away');
    } finally { t.done(); }
  });
  it('copy a layer on one note, paste it on another: a shape, a modulator, a chord', async () => {
    const t = await make(NOTES);
    try { const ws = t.ws, N = (i) => t.clip().notes[i];
      ws.set('add', 'Pitch'); ws.set('base.preset', 'rise'); ws.set('base.hi', 3); ws.action('＋ MOD'); ws.action('▴ UP'); await TH.sleep(20);
      assert.ok(ws.layer('T:pitch', 'copy') && Workshop.current.clipboard(), 'copied');
      ws.set('sel', 2); await TH.sleep(20); assert.ok(!N(1).sh, 'note 2 has no shape');
      assert.ok(ws.layer('pattern', 'paste')); await TH.sleep(20); assert.ok(N(1).sh.t.pitch && N(1).b && peak(N(1).b) > 2.5, 'note 2 got the shape and plays it');
      ws.set('sel', 1); ws.set('x.chord', 'minor'); await TH.sleep(20); const iv = JSON.stringify(N(0).x && N(0).x.iv); assert.ok(iv && iv !== 'undefined', 'note 1 has a chord');
      ws.layer('chord', 'copy'); ws.set('sel', 2); await TH.sleep(10); assert.ok(ws.layer('chord', 'paste')); await TH.sleep(20); assert.equal(JSON.stringify(N(1).x.iv), iv, 'the chord pasted onto note 2');
      ws.set('sel', 1); ws.set('nav', 'into:T:pitch'); await TH.sleep(10);   // into note 1's pitch: copy its modulator, paste it into note 2's
      assert.ok(ws.layer('m:0', 'copy')); ws.action('▴ UP'); ws.set('sel', 2); await TH.sleep(10); const before = N(1).sh.t.pitch.mods.length;
      assert.ok(ws.layer('T:pitch', 'paste')); await TH.sleep(20); assert.equal(N(1).sh.t.pitch.mods.length, before + 1, 'a modulator pasted onto a shape joins it');
    } finally { t.done(); }
  });
  it('a locked layer cannot be drawn on; the Delete key on a knob layer sends it back to the instrument', async () => {
    const t = await make(NOTES);
    try { const ws = t.ws; ws.set('add', 'Pitch'); await TH.sleep(10); ws.select('base'); ws.layer('base', 'lock');
      const cv = ws.el.querySelector('.ws-canvas'), r = cv.getBoundingClientRect(), b0 = JSON.stringify(t.clip().notes[0].sh.t.pitch.base);
      const ev = (ty, x, y) => cv.dispatchEvent(new PointerEvent(ty, { bubbles: true, clientX: r.left + x, clientY: r.top + y, pointerId: 3, button: 0, buttons: 1 }));
      ev('pointerdown', 60, r.height - 60); for (let i = 1; i < 12; i++) ev('pointermove', 60 + i * 40, r.height - 60 - i * 15); ev('pointerup', 520, r.height - 230); await TH.sleep(30);
      assert.equal(JSON.stringify(t.clip().notes[0].sh.t.pitch.base), b0, 'a locked base does not change under the pen');
      ws.layer('base', 'lock'); ws.action('▴ UP');
      const K2 = ws.doc().knobs || []; assert.ok(K2.length); ws.set('setp', K2[0].label); await TH.sleep(10); const k = K2[0].key; assert.ok(t.clip().notes[0].p && t.clip().notes[0].p[k] !== undefined);
      ws.select('P:' + k); key('Delete'); await TH.sleep(20); assert.ok(!(t.clip().notes[0].p && t.clip().notes[0].p[k] !== undefined), 'back to the instrument’s value');
    } finally { t.done(); }
  });
});
