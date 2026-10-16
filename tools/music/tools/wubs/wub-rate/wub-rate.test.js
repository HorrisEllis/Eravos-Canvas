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
});
