/* P120 · .erv — the project in layers, like a PSD (specs/eravos.erv-format.spec). His words (2026-11-06): "Can we use yaml to save songs like a
 * psd file. Like so it has layers? Like it saves what’s on the canvas?" (09:23:29Z) · "And then the PSD style YAML, maybe ERV as an extension
 * for that." (15:55:01Z) */
window.__phase = 'P120';
describe('P120 · .erv: the canvas as a layered YAML file', () => {
  const canon = (x) => JSON.stringify(x, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((o, kk) => (o[kk] = v[kk], o), {}) : v);
  function setup() {
    const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot();
    OrganismFactory.clearAll(Kernel);
    const a = OrganismFactory.spawn('eravos.retro-poly', { K: Kernel, x: 40, y: 40 }), b = OrganismFactory.spawn('eravos.fx-echo', { K: Kernel, x: 700, y: 40 });
    Kernel.bus.publish('ui:config_change:' + a, { key: 'cutoff', value: 1234 });
    const w = Kernel.wires.register({ src: { instanceId: a, hookId: 'rp.hook.audio_out' }, dst: { instanceId: b, hookId: 'fx.hook.audio_in' } });
    return { a, b, wired: w.ok };
  }
  it('snapshot → .erv → snapshot is exact; the text reads as layers (a Tools group, wires, each domain)', () => {
    const { a, wired } = setup(); assert.ok(wired, 'wired');
    try {
      const snap = JSON.parse(JSON.stringify(Workspace.snapshot())), text = Erv.toErv(snap, { name: 'Night Drive' });
      assert.ok(/^erv: 1$/m.test(text) && /kind: group/.test(text) && /label: Tools/.test(text) && /kind: wires/.test(text), 'layers in the text');
      assert.ok(/label: Retro Poly/.test(text) && /cutoff: 1234/.test(text), 'a tool, by name, with its settings in plain sight');
      const back = Erv.fromErv(text).snap; assert.equal(canon(back), canon(snap), 'the same snapshot back');
      assert.ok(Object.keys(snap.domains).length > 0, 'a domain layer was in it (' + Object.keys(snap.domains).join(', ') + ')');
    } finally { OrganismFactory.clearAll(Kernel); }
  });
  it('open in part: a layer off is left out (and its wires); a hand edit opens as edited; unknown keys survive', async () => {
    const { a, b } = setup();
    try {
      const text = Erv.toErv(Workspace.snapshot(), { name: 'Part' }), L = Erv.layers(text), tool = L.find(l => l.kind === 'tool' && l.tool === 'eravos.fx-echo');
      assert.ok(tool && tool.path.join(' › ') === 'Tools › ' + tool.label, 'the layer list, with paths (for the open dialog)');
      const part = Erv.fromErv(text, { only: new Set(L.filter(l => l.id !== tool.id).map(l => l.id)) }).snap;
      assert.ok(!part.organisms.some(o => o.id === 'eravos.fx-echo') && part.wires.length === 0, 'the echo left out, and the wire into it');
      // switched off in the file itself (on: false), as a person would in a text editor
      const i = text.indexOf('id: ' + b), m = /\n(\s+)on: true\n/.exec(text.slice(i)), j = i + m.index + 1 + m[1].length, offText = text.slice(0, j) + 'on: false' + text.slice(j + 8);   // its own on: (a whole line)
      assert.ok(offText !== text, 'the switch is in the text'); assert.ok(!Erv.fromErv(offText).snap.organisms.some(o => o.instanceId === b), 'on: false = left out');
      // a knob edited by hand
      const edited = text.replace('cutoff: 1234', 'cutoff: 777'); await Erv.open(edited);
      const rp = OrganismFactory.handles().find(r => r.id === 'eravos.retro-poly' && r.K === Kernel && !r.unmounted);   // this canvas's, not another test's assert.equal(rp.ctx.params.get('cutoff'), 777, 'opens as edited');
      // unknown keys (a newer ERAVOS, or a person's note) come back out
      const plus = text.replace(/^layers:/m, 'mood: late night\nlayers:').replace(/^(\s*)label: Wires$/m, (m, sp) => m + '\n' + sp + 'note: keep these'), d = Erv.fromErv(plus);
      assert.equal(d.snap.mood, undefined, 'a top-level key is not a snapshot key'); assert.ok(Erv.parse(plus).mood === 'late night' && Erv.layers(plus).find(l => l.kind === 'wires').note === 'keep these', 'kept in the file');
    } finally { OrganismFactory.clearAll(Kernel); }
  });
  it('safe: a broken file says where, and opens nothing; a file cannot run code', () => {
    let msg = ''; try { Erv.fromErv('erv: 1\nlayers:\n  - id: [unclosed\n'); } catch (e) { msg = e.message; } assert.ok(/line \d+, column \d+/.test(msg), 'where it broke: ' + msg);
    let blocked = false; try { Erv.parse('erv: 1\nx: !!js/function "function(){ window.__pwned = 1 }"\n'); } catch (e) { blocked = true; } assert.ok(blocked && !window.__pwned, 'no code from a file (CORE schema)');
    let notErv = ''; try { Erv.fromErv('hello: world\n'); } catch (e) { notErv = e.message; } assert.ok(/not an \.erv/.test(notErv), 'not an .erv: said plainly');
  });
});
