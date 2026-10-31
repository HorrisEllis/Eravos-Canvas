/* Bass Forge (eravos.bass-forge) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.bass-forge');

describe('Bass Forge 1.1 · feel, the LFO out, match picture, motion (3.79)', () => {
  const ctxOf = (id) => OrganismFactory.handle(id).ctx;
  // render one forge: its sound (port out) or its LFO (port lfo) straight to the speakers, no master chain
  async function render(params, notes, port, secs) {
    const U = TH.universe(secs || 1.2), id = TH.spawn(U, 'eravos.bass-forge'), c = ctxOf(id);
    c.params.setMany(Object.assign({ lfoDiv: '1/4' }, params || {}));
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(id, port || 'out').node.connect(U.ctx.destination);
    (notes || [[33, 0.05, 0.9, 0.8]]).forEach(([n, t, v, d]) => U.K.bus.publish('note:trigger', { target: id, note: n, velocity: v, time: t, duration: d }));
    return { d: (await TH.render(U)).getChannelData(0), c };
  }
  const swing = (d, a, z) => { let lo = Infinity, hi = -Infinity; for (let i = Math.floor(a * 48000); i < Math.floor(z * 48000); i++) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); } return hi - lo; };
  const bright = (d, a, z) => { let e = 0, df = 0; for (let i = Math.floor(a * 48000) + 1; i < Math.floor(z * 48000); i++) { e += d[i] * d[i]; df += (d[i] - d[i - 1]) ** 2; } return df / (e + 1e-12); };
  it('everything new at its default: the very same sound as 1.0', async () => {
    const a = (await render()).d, b = (await render({ talk: 0, velBright: 0, lfoPhase: 0, lfoFree: false })).d;
    // the render itself wobbles ~1e-4 between runs (its compressors); a change would be far larger
    let diff = 0; for (let i = 0; i < a.length; i++) diff = Math.max(diff, Math.abs(a[i] - b[i])); assert.lt(diff, 2e-3);
  });
  it('talk: a soft note moves its LFO less than a hard one; at 0 both move fully', async () => {
    const soft = (await render({ talk: 1 }, [[33, 0.05, 0.3, 1]], 'lfo')).d, hard = (await render({ talk: 1 }, [[33, 0.05, 1, 1]], 'lfo')).d, off = (await render({ talk: 0 }, [[33, 0.05, 0.3, 1]], 'lfo')).d;
    const s = swing(soft, 0.2, 1), hh = swing(hard, 0.2, 1), o = swing(off, 0.2, 1);
    assert.gt(o, 0.9); assert.near(hh, o, 0.05, 'hard = full'); assert.lt(s, hh * 0.45, 'soft moves less');
  });
  it('vel → bright: a soft note is darker than a hard one only when it is on', async () => {
    const clean = { lfoCut: 0, lfoFM: 0, drive: 0, ott: 0, crush: 0, fold: 0 }, r = async (vb, v) => bright((await render(Object.assign({ velBright: vb }, clean), [[33, 0.05, v, 0.8]])).d, 0.3, 0.8);
    const off = (await r(0, 0.3)) / (await r(0, 1)), on = (await r(1, 0.3)) / (await r(1, 1));
    assert.near(off, 1, 0.1, 'off: velocity is only level'); assert.lt(on, off * 0.8, 'on: the soft note is darker');
  });
  it('LFO start: a sine starts at the bottom, the middle or the top; LFO free: a second note does not restart it', async () => {
    const at = Math.floor(0.0502 * 48000), L = async (ph) => (await render({ lfoShape: 'sine', lfoPhase: ph }, null, 'lfo')).d[at];
    assert.lt(await L(0), 0.05, 'from the bottom'); assert.near(await L(0.25), 0.5, 0.05, 'from the middle'); assert.gt(await L(0.5), 0.95, 'from the top');
    const U = TH.universe(0.3), id = TH.spawn(U, 'eravos.bass-forge'), c = ctxOf(id); c.params.set('lfoFree', true);
    U.K.bus.publish('note:trigger', { target: id, note: 33, velocity: 1, time: 0.01, duration: 0.05 }); const l1 = c.internals.lfo;
    U.K.bus.publish('note:trigger', { target: id, note: 36, velocity: 1, time: 0.2, duration: 0.05 }); assert.ok(c.internals.lfo === l1, 'the same LFO runs on');
    c.params.set('lfoFree', false); U.K.bus.publish('note:trigger', { target: id, note: 38, velocity: 1, time: 0.25, duration: 0.05 }); assert.ok(c.internals.lfo !== l1, 'restarted');
  });
  it('the LFO is a mod out; MATCH reports what it measured (the reference and the forge) and keeps it for the window', async () => {
    const U = TH.universe(0.2), id = TH.spawn(U, 'eravos.bass-forge'), c = ctxOf(id), p = U.K.audio.port(id, 'lfo');
    assert.ok(p && p.kind === 'mod' && p.direction === 'out');
    const ref = await c.renderWith({ fm: 6, fold: 0.8, cutoff: 900 }, 55, 0.8), r = await c.match(ref, { rounds: 1 });
    ['centroid', 'flat', 'sub', 'bright', 'rate', 'depth'].forEach(k => { assert.ok(isFinite(r.target[k]), 'target ' + k); assert.ok(isFinite(r.feat[k]), 'forge ' + k); });
    assert.near(c.distance(r.feat, r.target), r.dist, 1e-9); assert.equal(c.stateExtra().match.dist, r.dist);
  });
  it('performs: four macros and the Motion / Perform settings', () => {
    const d = OrganismFactory.def('eravos.bass-forge'); ['m1', 'm4', '_motion', '_perform', 'talk', 'velBright', 'lfoPhase', 'lfoFree'].forEach(k => assert.ok(d.config.some(c => c.key === k), k));
    assert.ok(window.MusicMotion.performs(d));
  });
});
