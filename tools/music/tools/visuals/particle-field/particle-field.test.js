/* Field (eravos.particle-field) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.particle-field');

// 3.54 — the CFR / Associative Lattice field, rebuilt for ERAVOS: sound → forces, notes → a memory of basins
window.__phase = 'P54';
describe('Field — sound becomes forces, notes dig a memory', () => {
  const F = () => window.EravosField, SR = 48000, N = 8192;
  const frame = (peaks) => { const db = new Float32Array(N / 2).fill(-140); peaks.forEach(([hz, lvl]) => { const k = Math.round(hz / (SR / N)); for (let j = -1; j <= 1; j++) db[k + j] = lvl - Math.abs(j) * 12; }); return db; };
  const nearShare = (w, pc) => { const [ax, ay] = F().basinXY(pc, w.B * 0.55); let n = 0; for (let i = 0; i < w.N; i++) { const dx = w.px[i] - ax, dy = w.py[i] - ay; if (dx * dx + dy * dy < 6.25) n++; } return n / w.N; };
  const K0 = { gravity: 1, curl: 0.6, entropy: 0.4, damping: 0.12, speed: 1, basins: 1 }, QUIET = { bass: 0, mid: 0, high: 0, chroma: new Array(12).fill(0) };
  const run = (w, frames, drive, k, L) => { for (let i = 0; i < frames; i++) F().step(w, 1 / 60, drive, k || K0, L); return w; };

  it('features: a 440 Hz tone is the note A, a 50 Hz tone is bass — each band only hears its own range', () => {
    const a = F().features(frame([[440, -20]]), SR, N); assert.equal(a.chroma.indexOf(Math.max(...a.chroma)), 9, 'A'); assert.gt(a.chroma[9], 0.9); assert.gt(a.mid, a.bass + 0.3);
    const b = F().features(frame([[50, -15]]), SR, N); assert.gt(b.bass, 0.6); assert.lt(b.mid, 0.2);
    const c = F().features(frame([[261.63, -20], [329.63, -20], [392, -20]]), SR, N); [0, 4, 7].forEach(pc => assert.gt(c.chroma[pc], 0.25, 'C major: ' + pc));
    assert.equal(F().features(new Float32Array(N / 2).fill(-140), SR, N).chroma.reduce((s, v) => s + v, 0), 0, 'silence names no note');
  });
  it('onsets: a steady sound never bursts; a jump does, once (no double trigger inside 80 ms)', () => {
    const pick = F().onsets(() => 0.5); let n = 0; for (let i = 0; i < 60; i++) if (pick(0.3, i / 30)) n++; assert.equal(n, 0, 'steady');
    assert.gt(pick(3, 2.0), 0, 'the jump'); assert.equal(pick(3, 2.03), 0, 'refractory');
  });
  it('memory: notes heard dig their basin; unheard basins fill back in with a half-life of Memory seconds', () => {
    const L = F().landscape(), A = new Array(12).fill(0); A[9] = 1;
    for (let i = 0; i < 300; i++) F().deposit(L, A, 1 / 30, 60, 1, 1); assert.gt(L.depth[9], 0.5, 'A dug'); assert.equal(F().deepest(L), 9);
    const before = L.depth[9]; for (let i = 0; i < 60; i++) F().deposit(L, new Array(12).fill(0), 1 / 30, 2, 1, 0);
    assert.near(L.depth[9] / before, 0.5, 0.02, 'one half-life later: half as deep');
    const frozen = F().landscape([0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0]); for (let i = 0; i < 30; i++) F().deposit(frozen, A, 1 / 30, 3600, 0, 1); assert.near(frozen.depth[9], 0.4, 0.01, 'Learn 0 + a long memory: frozen');
  });
  it('the field is seeded: the same sound gives exactly the same picture', () => {
    const d = { bass: 0.6, mid: 0.4, high: 0.3, chroma: QUIET.chroma }, a = run(F().world(1500, 3), 120, d), b = run(F().world(1500, 3), 120, d);
    assert.equal(Array.from(a.px).join(), Array.from(b.px).join());
  });
  it('bass pulls the field in; a hit sends a ring out through it', () => {
    const still = run(F().world(3000, 5), 240, QUIET), pulled = run(F().world(3000, 5), 240, Object.assign({}, QUIET, { bass: 1 }));
    assert.lt(F().stats(pulled).radius, F().stats(still).radius * 0.85, 'gravity');
    const a = F().world(3000, 5), b = F().world(3000, 5); run(a, 60, QUIET); run(b, 60, QUIET); F().burst(b, 2, 0, 0);
    run(a, 10, QUIET); run(b, 10, QUIET); assert.gt(F().stats(b).speed, F().stats(a).speed * 1.5, 'the ring kicks the dots it passes');
    assert.gt(F().stats(b).radius, F().stats(a).radius, 'outward');
  });
  it('a deep basin holds the field: dots gather on the note the song keeps playing', () => {
    const L = F().landscape([0, 0, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0]), held = run(F().world(3000, 9), 400, QUIET, K0, L), free = run(F().world(3000, 9), 400, QUIET, Object.assign({}, K0, { basins: 0 }), L);
    assert.gt(nearShare(held, 9), nearShare(free, 9) * 2, 'gathered on A'); assert.gt(nearShare(held, 9), 0.2);
    assert.equal(held.pc[Array.from(held.pc).findIndex(p => p >= 0)], 9, 'and coloured as A');
  });
  it('every knob from one end to the other: no NaN, nothing escapes', () => {
    const L = F().landscape(new Array(12).fill(1)), w = F().world(800, 1), wild = { bass: 1, mid: 1, high: 1, chroma: new Array(12).fill(1 / 12) };
    for (let i = 0; i < 200; i++) { if (i % 10 === 0) F().burst(w, 6, 0, 0); F().step(w, 0.05, wild, { gravity: 3, curl: 3, entropy: 3, damping: 0, speed: 3, basins: 3 }, L); }
    for (let i = 0; i < 100; i++) F().step(w, 0.05, QUIET, { gravity: 0, curl: 0, entropy: 0, damping: 0.9, speed: 0.1, basins: 0 }, L);
    for (let i = 0; i < w.N; i++) { assert.ok(Number.isFinite(w.px[i] + w.py[i] + w.pz[i]), 'finite'); assert.lt(Math.hypot(w.px[i], w.py[i]), w.B * 1.11, 'inside'); }
  });
  it('the real chain: a tone wired in → the engine names its note, and the memory is saved with the project', async () => {
    const ctx = new OfflineAudioContext(1, SR, SR), K = Kernel.create({ ctx, quiet: true }), id = OrganismFactory.spawn('eravos.particle-field', { K, headless: true }), c = OrganismFactory.handle(id).ctx;
    const o = ctx.createOscillator(); o.frequency.value = 392; o.connect(K.audio.port(id, 'in').node); o.start(0); let d = null;
    ctx.suspend(0.5).then(() => { const db = new Float32Array(c.internals.an.frequencyBinCount); c.internals.an.getFloatFrequencyData(db); for (let i = 0; i < 40; i++) d = c.frame(db, 0.1 + i / 30, SR, c.internals.an.fftSize); ctx.resume(); });
    await ctx.startRendering();
    assert.equal(d.deepest, 7, 'G'); assert.gt(d.depth[7], 0.1); assert.gt(d.mid, 0.3);
    const saved = c.stateExtra(); assert.equal(saved.depth.length, 12);
    c.loadExtra({ depth: new Array(12).fill(0) }); assert.equal(F().deepest(c.internals.landscape), -1, 'loaded flat');
    c.loadExtra(saved); assert.equal(F().deepest(c.internals.landscape), 7, 'and back: the field still knows the song');
    K.bus.publish('ui:forget:' + id, {}); assert.equal(F().deepest(c.internals.landscape), -1, 'Forget flattens it');
  });
});
