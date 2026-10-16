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

// 3.1 — the sub sits at the wub's own pitch; growl grit; the mouth reaches the mids
describe('Wobble Bass 3.1 · sub at the wub’s pitch, fold grit, mid-range growl', () => {
  // share of energy per band, from one Hann-windowed FFT (8192 samples) starting at t
  function bands(buf, t, edges) {
    const x = buf.getChannelData(0), N = 8192, s = Math.floor(t * buf.sampleRate), re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = x[s + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
    for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= N; len <<= 1) { const a = -2 * Math.PI / len; for (let i = 0; i < N; i += len) for (let k = 0; k < len / 2; k++) { const c = Math.cos(a * k), sn = Math.sin(a * k), p = i + k, q = p + len / 2, vr = re[q] * c - im[q] * sn, vi = re[q] * sn + im[q] * c; re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; } }
    const hz = buf.sampleRate / N, e = edges.slice(1).map(() => 0); let tot = 0;
    for (let i = 1; i < N / 2; i++) { const f = i * hz, m = re[i] * re[i] + im[i] * im[i]; tot += m; for (let b = 0; b < e.length; b++) if (f >= edges[b] && f < edges[b + 1]) e[b] += m; }
    return e.map(v => v / tot);
  }
  const rig = (secs, preset, params) => {
    const U = TH.universe(secs || 1, { bpm: 140 }), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx;
    if (preset) c.presets.load(preset); Object.keys(params || {}).forEach(k => c.params.set(k, params[k])); return { U, w, c };
  };
  it('by default the sub plays at the wub’s pitch (A2 at octave −1 → 55 Hz, not 27.5 Hz)', async () => {
    const { U, w, c } = rig(0.6); assert.equal(c.params.get('subOct'), '0');
    TH.note(U, w, 45, 0.05, { duration: 0.4 }); await TH.render(U);
    assert.near(c.internals.sub.frequency.value, 55, 0.01);
    c.params.set('subOct', '-1'); assert.near(c.internals.sub.frequency.value, 55, 0.01, 'the ramp target is set, not the value yet');
  });
  it('fold grit makes far more upper harmonics than soft grit at the same amount', async () => {
    const hiShare = async (gritMode) => { const { U, w } = rig(0.8, null, { gritMode, shaper: 0.7, lfoSync: false, lfoHz: 0.1, depth: 0, cutoff: 900, sub: 0 });
      TH.note(U, w, 45, 0.05, { duration: 0.7 }); const b = await TH.render(U); const [, hi] = bands(b, 0.3, [20, 800, 20000]); return hi; };
    assert.gt(await hiShare('fold'), (await hiShare('soft')) * 1.5);
  });
  it('the dancehall presets reach past the low end: far more energy above 800 Hz than Classic Wub, open', async () => {
    const mids = async (name) => { const { U, w } = rig(2.3, name, { wubOn: false, lfoSync: false, lfoHz: 0.25, retrig: true, lfoShape: 'sine' });   // opens over 2 s
      TH.note(U, w, 45, 0.05, { duration: 2.2 }); const b = await TH.render(U); return bands(b, 1.85, [20, 800, 20000])[1]; };
    const classic = await mids('Classic Wub 1/8');
    for (const n of ['Bun Dem Growl (dancehall drop)', 'Sound-System Screech', 'Fold Growl Wub 1/8']) assert.gt(await mids(n), classic * 2, n);
  }, { timeout: 60000 });
});
