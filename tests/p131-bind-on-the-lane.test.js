/* P131 · Automation: Bind on the lane — his words, 2026-11-06: "“Automate this”: an empty lane with a bind button to bind a tool or
 * component, or interaction object?" · "yes". ＋ Add lane = an empty lane that draws and drives nothing; its own ⊕ Bind points it at the
 * next control touched — on a tool, a component, or an interaction object (the XY Pad's X and Y). Rebind, Unbind, pick from a list,
 * saved and loaded as it was. */
window.__phase = 'P131';
describe('P131 · Automation: an empty lane, and its own Bind', () => {
  it('an empty lane drives nothing; its Bind catches the next touch on a tool; the first point starts at the knob; one control, one lane', () => {
    const U = TH.universe(0.2), ch = TH.spawn(U, 'eravos.channel'), a = TH.spawn(U, 'eravos.macro-automation'), c = OrganismFactory.handle(a).ctx, pub = (t, p) => U.K.bus.publish(t, p);
    pub('ui:lane_add:' + a, {}); assert.equal(c.lanes().length, 1, 'a lane'); const l = c.lanes()[0];
    assert.ok(l.unbound && !l.target, 'empty: bound to nothing'); assert.equal(U.K.faults.list().filter(f => /unmounted/.test(f.message || '')).length, 0, 'not "target gone"');
    pub('ui:config_change:' + ch, { key: 'pan', value: 0.3 }); assert.ok(l.unbound, 'not binding: a touch does nothing');
    pub('ui:lane_bind:' + a, { id: l.id }); assert.equal(c.binding(), l.id, 'this lane is listening');
    pub('ui:config_change:' + ch, { key: 'pan', value: 0.4, _auto: true }); assert.ok(l.unbound, 'an automation move is not a touch');
    pub('ui:config_change:' + ch, { key: 'pan', value: 0.5 });
    assert.ok(!l.unbound, 'bound'); assert.equal(l.target, ch); assert.equal(l.key, 'pan'); assert.ok(!c.binding(), 'one touch, then it lets go');
    const pc = OrganismFactory.handle(ch).def.config.find(x => x.key === 'pan'); assert.near(l.points[0].value, (0.5 - pc.min) / (pc.max - pc.min), 1e-6, 'started at the knob (no jump)');
    pub('ui:lane_add:' + a, {}); const l2 = c.lanes()[1]; pub('ui:lane_bind:' + a, { id: l2.id }); pub('ui:config_change:' + ch, { key: 'pan', value: 0.6 });
    assert.ok(l2.unbound, 'a control another lane drives is not taken twice');
    pub('ui:lane_bind:' + a, { id: l2.id }); pub('ui:lane_bind:' + a, { id: l2.id }); assert.ok(!c.binding(), '⊕ twice cancels');
  });
  it('the XY Pad is an interaction object: a hand on it binds a lane to X; the lane then moves the puck', async () => {
    const U = TH.universe(0.2), xy = TH.spawn(U, 'eravos.xy-pad'), a = TH.spawn(U, 'eravos.macro-automation'), c = OrganismFactory.handle(a).ctx, X = OrganismFactory.handle(xy).ctx, pub = (t, p) => U.K.bus.publish(t, p);
    pub('ui:lane_add:' + a, {}); const l = c.lanes()[0]; pub('ui:lane_bind:' + a, { id: l.id });
    pub('ui:xy_move:' + xy, { x: 0.8, y: 0.2 });
    assert.equal(l.target, xy, 'bound to the pad'); assert.equal(l.key, 'posX', 'to its X (the first of the two the hand moved)');
    assert.near(X.params.get('posX'), 0.8, 1e-9, 'the hand is the control'); assert.near(X.params.get('posY'), 0.2, 1e-9);
    c.sendEvent(l, 0.25); assert.near(X.params.get('posX'), 0.25, 1e-9, 'a lane moving X…');
    assert.near(X.mapX(X.params.get('posX')), 0.25, 1e-9, '…is where the puck and the X output go');
  });
  it('Rebind keeps the drawn shape; Unbind empties it, shape kept; pick from a list; saved and loaded as it was', () => {
    const U = TH.universe(0.2), ch = TH.spawn(U, 'eravos.channel'), a = TH.spawn(U, 'eravos.macro-automation'), A = OrganismFactory.handle(a).ctx, pub = (t, p) => U.K.bus.publish(t, p);
    pub('ui:lane_add:' + a, {}); const l = A.lanes()[0];
    pub('ui:point_edit:' + a, { lane: l.id, op: 'add', point: { bar: 3, value: 0.9 } }); const shape = JSON.stringify(l.points);
    pub('ui:lane_bind_to:' + a, { id: l.id, target: ch, key: 'pan' }); assert.equal(l.key, 'pan', 'picked from the list');
    assert.equal(JSON.stringify(l.points.map(p => p.bar)), JSON.stringify(JSON.parse(shape).map(p => p.bar)), 'drawn first, then bound: the shape is kept');
    pub('ui:lane_bind_to:' + a, { id: l.id, target: ch, key: 'trim' }); assert.equal(l.key, 'trim', 'rebound'); assert.equal(A.lanes().length, 1);
    pub('ui:lane_unbind:' + a, { id: l.id }); assert.ok(l.unbound && !l.target, 'unbound'); assert.equal(l.points.length, 2, 'shape kept');
    pub('ui:lane_add:' + a, {}); pub('ui:lane_bind_to:' + a, { id: A.lanes()[1].id, target: ch, key: 'pan' });
    const s = A.serialize(), b = TH.spawn(U, 'eravos.macro-automation'), B = OrganismFactory.handle(b).ctx; B.deserialize(JSON.parse(JSON.stringify(s)));
    assert.equal(B.lanes().length, 2); assert.ok(B.lanes()[0].unbound, 'the unbound lane comes back unbound'); assert.equal(B.lanes()[0].points.length, 2, 'with its shape');
    assert.equal(B.lanes()[1].key, 'pan', 'the bound one comes back bound');
  });
});
