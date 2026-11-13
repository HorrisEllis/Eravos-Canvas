/* P183 — separating the elements for synthesis (ES1; his words, 2026-11-13: "make sure you are seperating the elements for synthesis. i want to
 * add the element synthesis"). Every tool that separates its elements (it gives its controls an `element`): every control names one, every
 * component element is one the tool announces (tool.json needs.components, from its DAG), and the face synthesised from them holds every
 * control once, element by element, in the sound's order. Piano first; the guard covers every tool that separates. */
window.__phase = 'P183';
describe('P183 element synthesis — every control in its element, the face made from them', () => {
  const sep = () => OrganismFactory.defined().filter(d => d.elementWords || d.elementOrder);   // a tool that separates declares its elements
  it('Piano separates every control; each element is announced or its own part', async () => {
    assert.ok(sep().some(d => d.id === 'eravos.piano'), 'Piano separates its elements');
    sep().forEach(d => { const p = ElementSynthesis.check(d); assert.deepEqual(p, [], d.id + ': ' + p.join(' · ')); });
    const E = ElementSynthesis.elementsOf(OrganismFactory.def('eravos.piano'));
    assert.equal(E[0].id, 'own:piano', 'what sounds first'); assert.equal(E[E.length - 1].id, 'own:out', 'out last');
    assert.ok(E.findIndex(e => e.id === 'modal-resonator') < E.findIndex(e => e.id === 'filter-svf') && E.findIndex(e => e.id === 'filter-svf') < E.findIndex(e => e.id === 'saturator-tube'), 'source → shape → fx');
  });
  it('the synthesised face holds every control once, a card per element, and moves the tool', async () => {
    const a = OrganismFactory.spawn('eravos.piano', { at: [20, 20] }), h = OrganismFactory.handle(a);
    try {
      const view = h.view || OrganismFactory.makeView(h, document.createElement('div'));   // a view of this tool, as a window or a mod card gets one assert.ok(view && view.ui, 'the window’s view');
      const f = ElementSynthesis.face(view, { face: [] .concat(OrganismFactory.def('eravos.piano').config.map(c => c.key)) }), keys = [...f.querySelectorAll('[data-key]')].map(x => x.dataset.key), def = OrganismFactory.def('eravos.piano');
      assert.equal(f.querySelectorAll('[data-element]').length, ElementSynthesis.elementsOf(def).length, 'one card per element (everything on the face)');
      const g = ElementSynthesis.face(view, { skip: ['model', 'pedal'] }), gk = [...g.querySelectorAll('[data-key]')].map(x => x.dataset.key);
      assert.ok(!gk.includes('model') && !gk.includes('pedal'), 'what the tool shows elsewhere is not shown twice');
      assert.deepEqual(gk.slice(0, def.faceKeys.length).slice().sort(), def.faceKeys.slice().sort(), 'the face keys first; the rest behind More depth');
      assert.deepEqual(keys.slice().sort(), def.config.filter(c => !c.hidden).map(c => c.key).sort(), 'every control once');
      h.ctx.params.set('brightness', 0.83); assert.equal(h.ctx.params.get('brightness'), 0.83, 'the same params behind it');
    } finally { OrganismFactory.close(a); }
  });
});
