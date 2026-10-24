/* Wub Rate (eravos.wub-rate) — tests that travel with the tool: the shared contract, then its own. The output is a
 * control signal: tests route it straight to the speakers of an offline universe and read it back. */
TH.toolContract('eravos.wub-rate');
describe('tool · Wub Rate — the wobble rhythm', () => {
  const setup = (sec, params) => {
    const U = TH.universe(sec || 1.5, { bpm: 120 }), id = TH.spawn(U, 'eravos.wub-rate'), c = OrganismFactory.handle(id).ctx;
    Object.entries(Object.assign({ smooth: 0, shape: 'sine', polarity: 'unipolar+', retrig: 'on change' }, params || {})).forEach(([k, v]) => c.params.set(k, v));
    c.internals.out.connect(U.ctx.destination); return { U, id, c };
  };
  const cycles = (b, from, to, level) => { const d = b.getChannelData(0); let n = 0; for (let i = Math.floor(from * b.sampleRate) + 1; i < to * b.sampleRate; i++) if (d[i - 1] < level && d[i] >= level) n++; return n; };
  const range = (b, from, to) => { const d = b.getChannelData(0); let lo = 9, hi = -9; for (let i = Math.floor(from * b.sampleRate); i < to * b.sampleRate; i++) { lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); } return [lo, hi]; };
  it('stopped, it runs free: 1/8 at 120 BPM cycles at 4 Hz, unipolar+ stays inside 0…1', async () => {
    const { U } = setup(1.5, { steps: Array(16).fill('1/8') });
    const b = await TH.render(U);
    assert.near(cycles(b, 0.25, 1.25, 0.5), 4, 1, 'cycles per second');
    const [lo, hi] = range(b, 0.05, 1.4); assert.gt(lo, -0.02); assert.lt(hi, 1.02); assert.gt(hi, 0.95, 'opens fully');
  });
  it('polarity: bipolar swings both ways, inverted starts open, unipolar− stays at or below 0', async () => {
    let b = await TH.render(setup(1, { steps: Array(16).fill('1/4'), polarity: 'bipolar' }).U); let [lo, hi] = range(b, 0.02, 0.98);
    assert.lt(lo, -0.9); assert.gt(hi, 0.9);
    b = await TH.render(setup(0.3, { steps: Array(16).fill('1/4'), polarity: 'bipolar inverted' }).U);
    assert.gt(b.getChannelData(0)[Math.floor(0.005 * b.sampleRate)], 0.9, 'inverted: closed end is +1');
    b = await TH.render(setup(1, { steps: Array(16).fill('1/4'), polarity: 'unipolar−' }).U); [lo, hi] = range(b, 0.02, 0.98);
    assert.lt(hi, 0.02); assert.lt(lo, -0.95);
  });
  it('steps follow the transport: a 1/4 step then a 1/16 step change the rate on the boundary', async () => {
    const steps = ['1/4', '1/16'].concat(Array(14).fill('1/8'));
    const { U } = setup(2.2, { steps, length: 2, stepLen: '1/2' });   // 1/2 = two beats = 1 s at 120
    U.T.renderTicks(0, 17, 0); const b = await TH.render(U);   /* offline: 16ths published up front (0.125 s each at 120) */
    assert.near(cycles(b, 0.0, 0.98, 0.5), 2, 1, 'first second at 1/4 = 2 Hz');
    assert.near(cycles(b, 1.0, 1.98, 0.5), 8, 1, 'second second at 1/16 = 8 Hz');
    const [lo, hi] = range(b, 0.05, 2.1); assert.gt(lo, -0.02, 'never below closed'); assert.lt(hi, 1.02, 'never past open');
  });
  it('off holds the mouth shut until the next rate', async () => {
    const { U } = setup(2.2, { steps: ['1/8', 'off'].concat(Array(14).fill('1/8')), length: 2, stepLen: '1/2' });
    U.T.renderTicks(0, 17, 0); const b = await TH.render(U);   /* offline: 16ths published up front (0.125 s each at 120) */ const [lo, hi] = range(b, 1.05, 1.95);
    assert.lt(Math.max(Math.abs(lo), Math.abs(hi)), 0.02, 'closed (0) during the off step');
    assert.gt(range(b, 0.1, 0.9)[1], 0.9, 'wobbling before it');
  });
  it('step_set changes one step and rejects a bad value', () => {
    const { U, id, c } = setup(0.2);
    U.K.bus.publish('ui:step_set:' + id, { index: 3, value: '1/16t' }); assert.equal(c.params.get('steps')[3], '1/16t');
    assert.fault(U.K, 'RUNTIME_002', () => U.K.bus.publish('ui:step_set:' + id, { index: 3, value: 'fast' }));
    U.K.bus.publish('ui:steps_shift:' + id, { by: 1 }); assert.equal(c.params.get('steps')[4], '1/16t', 'shifted one later');
  });
  // 1.1 — the speed controls the Wobble Bass had and Wub Rate lacked
  it('Rate bend ×2: 1/8 at 120 BPM cycles at 8 Hz instead of 4 — moved smoothly, never restarted', async () => {
    const { U } = setup(1.5, { steps: Array(16).fill('1/8'), rateBend: 2 });
    const b = await TH.render(U); assert.near(cycles(b, 0.25, 1.25, 0.5), 8, 1);
  });
  it('Rate glide: the next step’s rate swoops in and the wobble glides on (no restart from closed); without it, it restarts', async () => {
    const run = async (glide) => { const { U } = setup(2.2, { steps: ['1/4', '1/16'].concat(Array(14).fill('1/8')), length: 2, stepLen: '1/2', rateBend: 1.25, rateGlide: glide }); U.T.renderTicks(0, 17, 0); return TH.render(U); };
    const at = (b, t) => b.getChannelData(0)[Math.floor(t * b.sampleRate)];
    const jump = await run(0), glide = await run(0.4);   // at 2.5 Hz the wobble is wide open at the 1 s boundary
    assert.gt(at(jump, 0.995), 0.9); assert.lt(at(jump, 1.004), 0.1, 'no glide: the new rate restarts from closed');
    assert.gt(at(glide, 0.995), 0.9); assert.gt(at(glide, 1.004), 0.85, 'glide: it carries on from where it was');
    assert.lt(cycles(glide, 1.0, 1.15, 0.5), cycles(jump, 1.0, 1.15, 0.5) + 0.5, 'it speeds up over the glide, not at once');
    assert.near(cycles(glide, 1.4, 1.98, 0.5), 10 * 0.58, 1.5, 'then runs at the new rate (1/16 × 1.25 = 10 Hz)');
  });
  it('the rate input: an LFO held high pushes the speed up', async () => {
    const U = TH.universe(1.5, { bpm: 120 }), id = TH.spawn(U, 'eravos.wub-rate'), c = OrganismFactory.handle(id).ctx, l = TH.spawn(U, 'eravos.lfo'), L = OrganismFactory.handle(l).ctx;
    [['smooth', 0], ['steps', Array(16).fill('1/8')]].forEach(([k, v]) => c.params.set(k, v)); L.params.set('depth', 0); L.params.set('offset', 1);
    assert.ok(U.K.wires.register({ src: { instanceId: l, hookId: 'lfo.hook.mod_out' }, dst: { instanceId: id, hookId: 'wubrate.hook.mod_rate' } }).ok, 'wired');
    c.internals.out.connect(U.ctx.destination); const b = await TH.render(U);
    assert.gt(cycles(b, 0.25, 1.25, 0.5), 6, 'faster than its own 4 Hz: ' + cycles(b, 0.25, 1.25, 0.5));
  });
});
