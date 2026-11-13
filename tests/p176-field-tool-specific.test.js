/* P176 — the Field is tool-specific. His words, 2026-11-13: "What about tool dependant." → "I meant tool specific. Using the dag maybe or
 * contract". A note's New-layer menu and its knob layers follow the playing tool: its contract (tool.json "field": first) and its settings'
 * groups placed on the sound's stages (the DAG order). */
window.__phase = 'P176';
describe('P176 the Field follows the playing tool', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make(target) {
    host(); const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); const inst = OrganismFactory.spawn(target, { x: 40, y: 700 }); await TH.sleep(250);
    pub('lane_add', { kind: 'inst', name: 'Lane', target: inst }); await TH.sleep(80); pub('clip_add', { kind: 'notes', startBar: 1, bars: 1, notes: [{ s: 0, l: 8, n: 48, v: 0.8 }] }); await TH.sleep(120);
    const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clip.id); await TH.sleep(300); H.view.roll.openWorkshop(0); await TH.sleep(80);
    return { ws: Workshop.current, clip: () => H.ctx.internals.clips.find(c => c.id === clip.id), done: () => { if (Workshop.current) Workshop.current.close(); OrganismFactory.close(id); OrganismFactory.close(inst); CanvasWM.view = view0; CanvasWM.applyView(); } };
  }
  it('every field contract names only controls its tool has', () => {
    const bad = []; Catalog.tools().filter(m => m.field).forEach(m => { const def = OrganismFactory.def(m.id), keys = ((def && (def.config || (def.descriptor && def.descriptor.config))) || []).map(c => c.key);
      (m.field.first || []).forEach(k => { if (!keys.includes(k)) bad.push(m.id + ': ' + k); }); });
    assert.gt(Catalog.tools().filter(m => m.field).length, 5, 'six tools have a contract'); assert.equal(bad.join(' | '), '', 'unknown keys');
  });
  it('Retro DCO: its contract first, then its stages in the sound’s order; a shaped knob sits in its stage', async () => {
    const t = await make('eravos.retro-dco');
    try { const ws = t.ws, A = ws.addable().filter(x => x.startsWith('SHAPE OVER THE NOTE'));
      const secs = [...new Set(A.map(x => x.replace(/ › .*$/, '').replace('SHAPE OVER THE NOTE · ', '')))];
      assert.equal(secs[0], 'PITCH', 'pitch first: ' + secs.join(' | ')); assert.ok(/RETRO DCO · FIRST/.test(secs[1]), 'then Retro DCO’s own first: ' + secs[1]);
      const first = A.filter(x => /FIRST › /.test(x)).map(x => x.replace(/^.* › /, '')); assert.equal(first[0], 'Cutoff', 'in the contract’s order: ' + first.join(', '));
      const order = ['CONTROL', 'SOURCE', 'SHAPE', 'AMP', 'MOD', 'FX', 'OUT', 'MORE'], st = secs.slice(2).map(x => x.split(' · ')[0]);
      assert.ok(st.every((x, i) => i === 0 || order.indexOf(x) >= order.indexOf(st[i - 1])), 'stages in the DAG’s order: ' + secs.slice(2).join(' | '));
      assert.ok(secs.some(x => /^SOURCE · /.test(x)) && secs.some(x => /^AMP · /.test(x)), 'its own groups on their stages: ' + secs.join(' | '));
      ws.add('Cutoff', 'SHAPE OVER THE NOTE'); ws.action('▴ UP'); await TH.sleep(20);
      const L = EravosTimelineWorkshop.KIND.layers(ws.doc()), sh = L.find(l => /^T:k:cutoff/.test(l.id)); assert.ok(sh && /RETRO DCO/.test(sh.group), 'the cutoff curve under Retro DCO: ' + (sh && sh.group));
      const saw = ws.addable().find(x => /^SET FOR THIS NOTE ONLY · SOURCE[^›]* › Saw$/.test(x)); assert.ok(saw, 'Saw for this note, under SOURCE');
    } finally { t.done(); }
  });
  it('Wobble Bass: a different tool, a different Field — its own first (depth, vowel, growl)', async () => {
    const t = await make('eravos.wobble-bass');
    try { const first = t.ws.addable().filter(x => /^SHAPE OVER THE NOTE · WOBBLE BASS · FIRST › /.test(x)).map(x => x.replace(/^.* › /, ''));
      assert.ok(first.length >= 4 && first[0] === 'Depth', 'Wobble Bass offers its wobble first: ' + first.join(', '));
    } finally { t.done(); }
  });
});
