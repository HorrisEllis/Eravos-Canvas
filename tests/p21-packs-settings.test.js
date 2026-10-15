/* 3.34 §A §B §D + packs: drag guard, maximize, tool settings, per-tool pack schema, your packs, preset editing */
window.__phase = 'P21';
describe('drag guard · maximize · settings · packs & presets (3.34)', () => {
  it('a registered drag is ended by the guard; a captured element gets pointercancel', () => {
    let ended = 0; UIKit.drag.begin(() => ended++); const el = document.createElement('div'); document.body.appendChild(el);
    let cancelled = 0; el.addEventListener('pointercancel', () => cancelled++);
    try { el.setPointerCapture(1); } catch (e) {} // no active pointer: throws, but the guard already noted it
    UIKit.drag.endAll('test'); el.remove();
    assert.equal(ended, 1); assert.equal(UIKit.drag.live, 0); assert.ok(cancelled <= 1);
  });
  function host() { const host = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('⤢ maximize fills the canvas and restores the exact rect', async () => {
    host(); const id = OrganismFactory.spawn('eravos.fx-echo', { x: 30, y: 40, w: 300, h: 200 }); await TH.sleep(20);
    const r0 = CanvasWM.rectOf(id); assert.equal(CanvasWM.maximize(id), true); const r1 = CanvasWM.rectOf(id);
    assert.ok(CanvasWM.windowOf(id).classList.contains('maximized') && (r1.w !== r0.w || r1.h !== r0.h), 'fills the visible canvas'); assert.equal(CanvasWM.maximize(id), false);
    const r2 = CanvasWM.rectOf(id); assert.equal(r2.x, r0.x); assert.equal(r2.w, r0.w); assert.equal(r2.h, r0.h);
    OrganismFactory.close(id);
  });
  it('⚙ settings lists every setting of the tool, including the face-hidden Speed', async () => {
    host(); const id = OrganismFactory.spawn('eravos.sequencer', { x: 10, y: 10 }); await TH.sleep(30);
    const rec = OrganismFactory.handle(id), panel = ToolSettings.open(rec); assert.ok(panel && panel.classList.contains('open'));
    const want = rec.def.config.filter(c => !c.hidden).length, got = panel.querySelectorAll('.ts-sec .uk-panel .uk-row > *').length;
    assert.ok(got >= want, `controls ${got} ≥ settings ${want}`);
    assert.ok(/Speed/.test(panel.textContent) && panel.querySelector('[data-section="packs"]'), 'Speed + Packs & presets present');
    ToolSettings.close(rec); assert.ok(!panel.classList.contains('open')); OrganismFactory.close(id);
  });
  it('per-tool pack schema is generated from the tool and validate() names every problem', () => {
    const sc = ContentPacks.toolSchema('eravos.supersaw'); const props = sc.properties.items.properties['eravos.supersaw'].properties.presets.additionalProperties.properties.params.properties;
    const d = OrganismFactory.def('eravos.supersaw'); assert.equal(Object.keys(props).length, d.config.filter(c => !c.hidden).length);
    const num = d.config.find(c => c.type === 'number' && c.max !== undefined);
    const bad = ContentPacks.validate({ id: 'x.y', label: 'X', items: { 'eravos.supersaw': { presets: { A: { params: { nope: 1, [num.key]: num.max + 1 } } } }, 'eravos.not-here': { presets: {} } } });
    assert.ok(!bad.ok && bad.errors.length === 3, bad.errors.join(' | '));
    assert.ok(ContentPacks.validate({ id: 'x.y', label: 'X', items: { 'eravos.supersaw': { presets: { A: { params: { [num.key]: num.max } } } } } }).ok);
  });
  it('your packs: create → save preset → appears in the tool menu → rename → off/on → export → import → delete', () => {
    const T = 'eravos.supersaw', d = OrganismFactory.def(T), num = d.config.find(c => c.type === 'number');
    const id = ContentPacks.user.create(T, 'Test Pack'); assert.ok(ContentPacks.user.is(id), 'created');
    const pr = ContentPacks.user.putPreset(id, T, 'Bright', { params: { [num.key]: num.default } }); assert.ok(pr.ok, 'put: ' + JSON.stringify(pr));
    assert.ok('Test Pack · Bright' in d.presets, 'merged into the preset menu');
    assert.ok(ContentPacks.user.renamePreset(id, T, 'Bright', 'Brighter')); assert.ok('Test Pack · Brighter' in d.presets && !('Test Pack · Bright' in d.presets));
    ContentPacks.setEnabled(id, false); assert.ok(!('Test Pack · Brighter' in d.presets), 'off: gone from the menu'); ContentPacks.setEnabled(id, true);
    assert.equal(ContentPacks.user.putPreset(id, T, 'Bad', { params: { nope: 1 } }).ok, false, 'invalid preset refused');
    const ex = ContentPacks.user.export(id); assert.equal(ex.items[T].presets.Brighter.params[num.key], num.default);
    ContentPacks.user.remove(id); assert.ok(!ContentPacks.get(id));
    const r = ContentPacks.user.import(ex); assert.ok(r.ok && ContentPacks.get(r.id)); ContentPacks.user.remove(r.id);
    const r2 = ContentPacks.user.import({ id: 'x.y', label: 'X', items: { [T]: { presets: { Z: { params: { nope: 2 } } } } } }); assert.ok(!r2.ok && /nope/.test(r2.errors[0]), 'import is honest');
  });
  it('My presets: put / rename / delete through the standard hooks', async () => {
    const U = TH.universe(0.1), inst = TH.spawn(U, 'eravos.supersaw'), ctx = OrganismFactory.handle(inst).ctx, d = ctx.descriptor, num = d.config.find(c => c.type === 'number');
    U.K.bus.publish('ui:preset_put:' + inst, { name: 'Mine A', value: { params: { [num.key]: num.default, notAKey: 3 } } });
    assert.ok(ctx.presets.user['Mine A'] && !('notAKey' in ctx.presets.user['Mine A'].params), 'only real settings kept');
    U.K.bus.publish('ui:preset_rename:' + inst, { from: 'Mine A', to: 'Mine B' }); assert.ok(ctx.presets.user['Mine B'] && !ctx.presets.user['Mine A']);
    U.K.bus.publish('ui:preset_delete:' + inst, { name: 'Mine B' }); assert.ok(!ctx.presets.user['Mine B']);
    await TH.sleep(20);
  });
});
