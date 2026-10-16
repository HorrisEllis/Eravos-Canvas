/* Wobble Bass (eravos.wobble-bass) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.wobble-bass');

window.__phase = 'P38';
describe('Wobble Bass 3.0 · Wub Lab stage 1: drawn shapes + wub sequence', () => {
  const pub = (U, hook, id, p) => U.K.bus.publish('ui:' + hook + ':' + id, p || {});
  const rig = (secs, params) => {
    const U = TH.universe(secs || 1), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx;
    Object.keys(params || {}).forEach(k => c.params.set(k, params[k]));
    return { U, w, c };
  };
  it('a drawn shape is exact: starts on its first point, passes through every point, bends curve the segment', () => {
    const { U, w, c } = rig(0.2);
    pub(U, 'shape_pts', w, { points: [[0, -1, 0], [0.5, 1, 0.8], [0.75, 0, 0]] });
    assert.equal(c.params.get('lfoShape'), 'draw', 'drawing switches the Shape to Draw');
    assert.near(c.shapeAt(0), -1, 1e-9); assert.near(c.shapeAt(0.5), 1, 1e-9); assert.near(c.shapeAt(0.75), 0, 1e-9);
    assert.near(c.shapeAt(0.25), 0, 1e-9, 'unbent segment is a straight line');
    assert.gt(c.shapeAt(0.625), 0.9, 'bend > 0 moves late: the falling segment holds near its start, then drops');
    assert.near(c.shapeAt(0.875), -0.5, 1e-9, 'the last segment wraps back to the first point');
  });
  it('a broken drawing is refused with a plain fault and changes nothing', () => {
    const { U, w, c } = rig(0.2), before = JSON.stringify(c.params.get('shapePts'));
    assert.fault(U.K, 'RUNTIME_002', () => pub(U, 'shape_pts', w, { points: [[0, 0]] }));
    assert.equal(JSON.stringify(c.params.get('shapePts')), before);
  });
  it('the drawn wobble is what you hear: a drawn gate holds open for half the cycle, then shut (DC kept)', async () => {
    const { U, w, c } = rig(1.05, { level: 0, lfoSync: true, div: '1/2' });   // 1/2 at 120 BPM = 1 s cycle
    pub(U, 'shape_pts', w, { points: [[0, 1, 0], [0.49, 1, 0], [0.5, -1, 0], [0.99, -1, 0]] });
    const probe = U.ctx.createGain(); c.internals.lfoBus.connect(probe); probe.connect(U.ctx.destination);
    const buf = await TH.render(U), d = buf.getChannelData(0), at = (s) => d[Math.floor(s * TH.SR)];
    assert.near(at(0.2), 0.5, 0.06, 'open half (lfoBus is ±0.5)'); assert.near(at(0.7), -0.5, 0.06, 'shut half');
  });
  it('wub seq: every step restarts the wobble at its own rate, sample-exact on the bar grid; empty steps hold', async () => {
    const { U, c } = rig(1.2, { wubOn: true, wubStep: '1/4', wubLen: 4, wubSeq: ['1/4', '1/16:yoy', '', 'x'] });
    c.internals.lfoLog.length = 0;
    U.T.renderTicks(0, 32, 0.05); await TH.render(U);
    const L = c.internals.lfoLog.map(e => [+e.t.toFixed(6), e.div, e.shape, e.stop]);
    assert.deepEqual(L, [[0.05, '1/4', 'sine', false], [0.55, '1/16', 'yoy', false], [1.55, '1/16', 'sine', true],
      [2.05, '1/4', 'sine', false], [2.55, '1/16', 'yoy', false], [3.55, '1/16', 'sine', true]], 'steps 1, 2, (3 holds), 4 stops — twice');
  });
  it('wub seq on: notes play pitch only — they never reset the wobble; off: notes retrigger as before', () => {
    const a = rig(0.5, { wubOn: true }); a.c.internals.lfoLog.length = 0;
    TH.note(a.U, a.w, 45, 0.1); TH.note(a.U, a.w, 47, 0.3);
    assert.equal(a.c.internals.lfoLog.length, 0, 'no restarts from notes');
    const b = rig(0.5, { wubOn: false }); b.c.internals.lfoLog.length = 0;
    TH.note(b.U, b.w, 45, 0.1); assert.equal(b.c.internals.lfoLog.length, 1, 'retrig per note');
  });
  it('wub_seq from the window: unknown cells become holds, 16 cells are kept, and On can be set in the same message', () => {
    const { U, w, c } = rig(0.2);
    pub(U, 'wub_seq', w, { cells: ['1/8', 'nonsense', 'x', '1/32:draw'], on: true });
    const s = c.params.get('wubSeq'); assert.equal(s.length, 16); assert.deepEqual(s.slice(0, 4), ['1/8', '', 'x', '1/32:draw']); assert.equal(c.params.get('wubOn'), true);
  });
  it('turning the sequence off after a stop un-freezes the wobble', async () => {
    const { U, c } = rig(0.6, { wubOn: true, wubStep: '1/16', wubLen: 1, wubSeq: ['x'] });
    U.T.renderTicks(0, 2, 0.05); assert.equal(c.internals.frozen, true);
    c.params.set('wubOn', false); assert.equal(c.internals.frozen, false);
  });
});
