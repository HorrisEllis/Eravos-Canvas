/* P118 · Automation › ⊕ Bind — his words, 2026-11-06: "the automation tool needs to have a bind button to bind a tool aspect to the
 * automation tool, similar to the midi mapper." Press Bind, touch any knob on any tool: it gets a lane. One touch, then Bind lets go. */
window.__phase = 'P118';
describe('P118 · Automation: Bind', () => {
  it('Bind, then a knob touched on another tool → a lane for it; Bind lets go; its own knobs and automation moves are ignored', () => {
    const U = TH.universe(0.2), ch = TH.spawn(U, 'eravos.channel'), a = TH.spawn(U, 'eravos.macro-automation'), c = OrganismFactory.handle(a).ctx;
    U.K.bus.publish('ui:config_change:' + ch, { key: 'pan', value: 0.2 }); assert.equal(c.lanes().length, 0, 'not binding: nothing happens');
    U.K.bus.publish('ui:bind:' + a, {}); assert.ok(c.binding(), 'Bind is listening');
    U.K.bus.publish('ui:config_change:' + a, { key: 'mode', value: 'read' }); assert.equal(c.lanes().length, 0, 'its own knobs are not bound');
    U.K.bus.publish('ui:config_change:' + ch, { key: 'pan', value: 0.3, _auto: true }); assert.equal(c.lanes().length, 0, 'an automation move is not a touch');
    U.K.bus.publish('ui:config_change:' + ch, { key: 'pan', value: 0.4 });
    assert.equal(c.lanes().length, 1, 'the touched knob got a lane'); assert.equal(c.lanes()[0].target, ch); assert.equal(c.lanes()[0].key, 'pan');
    assert.ok(!c.binding(), 'one touch, then Bind lets go');
    U.K.bus.publish('ui:bind:' + a, {}); U.K.bus.publish('ui:config_change:' + ch, { key: 'pan', value: 0.5 });
    assert.equal(c.lanes().length, 1, 'binding the same knob twice makes no second lane');
    U.K.bus.publish('ui:bind:' + a, {}); U.K.bus.publish('ui:bind:' + a, {}); assert.ok(!c.binding(), 'pressing Bind again cancels');
  });
});
