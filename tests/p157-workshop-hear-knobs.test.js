/* P157 — the Workshop, continued (W3c, specs/eravos.workshop.spec ADDENDUM 2026-11-09). His words, 2026-11-09: "Continue the wokshop".
 * ▶ HEAR plays the open note alone, shaped (bend path, curves, its own knob values, its length); ⇉ ALL NOTES gives every note of the pattern
 * this note's shape; ITS KNOBS sets any knob of the instrument for this note only (an envelope per note). */
window.__phase = 'P157';
describe('P157 hear a shaped note; its shape to all; its own knobs', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  let view0 = null; const restoreView = () => { if (view0) { CanvasWM.view = view0; CanvasWM.applyView(); view0 = null; } };
  const closeWs = () => { if (window.Workshop && Workshop.current) Workshop.current.close(); };
  async function make(notes) {
    host(); view0 = Object.assign({}, CanvasWM.view); const id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); const tid = OrganismFactory.defined().map(d => d.id).find(x => /retro-poly|acid|wobble/.test(x)) || OrganismFactory.defined().map(d => d.id).find(x => /synth/.test(x));
    const inst = OrganismFactory.spawn(tid, { x: 40, y: 700 }); await TH.sleep(120);
    pub('lane_add', { kind: 'inst', name: 'Lead', target: inst }); await TH.sleep(80);
    pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes }); await TH.sleep(80);
    const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes');
    H.view.openClip(clip.id); await TH.sleep(300);
    return { id, inst, H, roll: H.view.roll, clip: () => H.ctx.internals.clips.find(c => c.id === clip.id) };
  }
  const NOTES = [{ s: 0, l: 8, n: 60, v: 0.8 }, { s: 8, l: 4, n: 64, v: 0.7 }, { s: 12, l: 4, n: 67, v: 0.7 }];
  it('▶ HEAR plays the open note through its instrument, with its bend path, its curves, its own knobs and its length', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, k = ws.doc().knobs.find(q => q.max - q.min > 1);
      ws.set('add', 'Pitch'); ws.action('＋ MOD'); ws.set('m.0.depth', 1); ws.action('▴ UP'); ws.set('add', k.label); ws.action('＋ MOD'); ws.action('▴ UP'); ws.set('setp', ws.doc().knobs[0].label); await TH.sleep(30);
      const heard = []; const off = Kernel.bus.subscribe('ui:note_audition:' + t.id, (m) => heard.push(m && m.payload !== undefined ? m.payload : m));
      try { assert.ok(ws.action('▶ HEAR'), 'HEAR is there'); await TH.sleep(30); } finally { if (typeof off === 'function') off(); }
      const p = heard.find(x => x && x.note === 60); assert.ok(p, 'an audition went to the Timeline: ' + JSON.stringify(heard).slice(0, 200));
      assert.ok(p.bend && p.bend.shape === 'path' && p.bend.path.length === 64, 'with its pitch path');
      assert.ok(p.curves && p.curves[k.key] && p.curves[k.key].length === 64, 'with its curve on ' + k.label);
      assert.ok(p.params && p.params[ws.doc().knobs[0].key] !== undefined, 'with its own knob value');
      assert.ok(p.duration > 0.5 && p.duration <= 4, 'for its length (' + p.duration.toFixed(2) + ' s)');
    } finally { closeWs(); OrganismFactory.close(t.id); OrganismFactory.close(t.inst); restoreView(); }
  });
  it('⇉ ALL NOTES gives every note this note\'s shape; ITS KNOBS sets and clears a knob for this note only', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(1); await TH.sleep(40); const ws = Workshop.current, kn = ws.doc().knobs.find(q => q.max - q.min > 1);
      ws.set('setp', kn.label); await TH.sleep(20);
      assert.equal(t.clip().notes[1].p[kn.key], kn.val, 'the knob starts at the instrument\'s own value');
      ws.set('p.' + kn.key, kn.max, kn.label); await TH.sleep(20);
      assert.equal(t.clip().notes[1].p[kn.key], kn.max, 'and is this note\'s own'); assert.ok(!t.clip().notes[0].p && !t.clip().notes[2].p, 'the other notes are untouched');
      ws.set('add', 'Pitch'); ws.action('＋ MOD'); ws.set('m.0.depth', 2); ws.action('▴ UP'); await TH.sleep(20);
      assert.ok(ws.action('⇉ ALL NOTES')); await TH.sleep(30);
      t.clip().notes.forEach((x, i) => { assert.ok(x.sh && x.sh.t.pitch.mods.length === 1, 'note ' + (i + 1) + ' has the shape'); assert.ok(x.b && x.b.shape === 'path', 'and plays it'); assert.equal(x.p[kn.key], kn.max, 'and the knob'); });
      ws.select('P:' + kn.key); assert.ok(ws.action('✕ KNOB')); await TH.sleep(20); assert.ok(!(t.clip().notes[1].p && t.clip().notes[1].p[kn.key] !== undefined), '✕ KNOB: this note back to the instrument\'s value');
      ws.undo(); await TH.sleep(20); assert.equal(t.clip().notes[1].p[kn.key], kn.max, 'undo brings it back');
    } finally { closeWs(); OrganismFactory.close(t.id); OrganismFactory.close(t.inst); restoreView(); }
  });
});
