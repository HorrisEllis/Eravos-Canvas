/* Drop Builder (eravos.bass-drop-builder) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.bass-drop-builder');

// 3.53 — "I also need a way to make deep bass drops, like spatially"
window.__phase = 'P53';
describe('Drop Builder — SPACE (deep, wide, 3D — the sub stays mono)', () => {
  const SR = 24000;
  async function render(params, sec, fn) {
    const ctx = new OfflineAudioContext(2, Math.ceil(sec * SR), SR), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.bass-drop-builder', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(Object.assign({ impactLevel: 0, crashLevel: 0, downLevel: 0 }, params)).forEach(([k, v]) => c.params.set(k, v));
    K.audio.chain.out.gain.value = 0; K.audio.port(a, 'fx').node.connect(ctx.destination); fn(c);
    const b = await ctx.startRendering(); return { L: b.getChannelData(0), R: b.getChannelData(1), c };
  }
  const rms = (d, a, b) => { let q = 0; const i0 = Math.floor(a * SR), i1 = Math.floor(b * SR); for (let i = i0; i < i1; i++) q += d[i] * d[i]; return Math.sqrt(q / Math.max(1, i1 - i0)); };
  const lowpass = (d, hz) => { const k = 1 - Math.exp(-2 * Math.PI * hz / SR), o = new Float32Array(d.length), y = [0, 0, 0, 0]; for (let i = 0; i < d.length; i++) { let x = d[i]; for (let j = 0; j < 4; j++) x = y[j] += k * (x - y[j]); o[i] = x; } return o; };   // 24 dB/oct: a gentler measure counts the room above the crossover as low end
  it('all SPACE knobs at 0 (the default): nothing is added — every saved drop sounds as before', async () => {
    const r = await render({}, 2, (c) => { c.swellInto(1); c.spaceDrop(1, 4); });
    assert.lt(rms(r.L, 0, 2) + rms(r.R, 0, 2), 1e-6);
  });
  it('sub dive: a deep sine falling from 62 to 31 Hz, exactly the same in both ears (mono)', async () => {
    const r = await render({ subDive: 1 }, 3, (c) => c.spaceDrop(0.2, 4));
    assert.gt(rms(r.L, 0.3, 1), 0.1, 'it is loud'); let diff = 0; for (let i = 0; i < r.L.length; i++) diff = Math.max(diff, Math.abs(r.L[i] - r.R[i])); assert.lt(diff, 1e-6, 'mono');
    const zc = (a, b) => { let n = 0; for (let i = Math.floor(a * SR) + 1; i < b * SR; i++) if ((r.L[i] >= 0) !== (r.L[i - 1] >= 0)) n++; return n / 2 / (b - a); };
    assert.gt(zc(0.22, 0.5), zc(1.6, 2.2), 'it dives'); assert.lt(zc(1.6, 2.2), 45, 'into the deep sub');
  });
  it('space tail: a wide room after the hit with nothing under the crossover in it (the low end stays tight)', async () => {
    const r = await render({ spaceTail: 1, spaceSize: 4, spaceDuck: 0, spaceWidth: 1 }, 4, (c) => c.spaceDrop(0.2, 4));
    assert.gt(rms(r.L, 1, 2.5), 0.004, 'the room rings on after the hit');
    let s = 0, d = 0; for (let i = SR; i < 2.5 * SR; i++) { s += (r.L[i] + r.R[i]) ** 2; d += (r.L[i] - r.R[i]) ** 2; } assert.gt(d / s, 0.2, 'wide: the ears differ');
    const lowL = lowpass(r.L, 60); assert.lt(rms(lowL, 1, 2.5) / rms(r.L, 1, 2.5), 0.08, 'almost nothing below the crossover');
    const open = await render({ spaceTail: 1, spaceSize: 4, spaceDuck: 0, spaceWidth: 1, crossover: 20 }, 4, (c) => c.spaceDrop(0.2, 4));
    assert.gt(rms(lowpass(open.L, 60), 1, 2.5) / rms(open.L, 1, 2.5), rms(lowL, 1, 2.5) / rms(r.L, 1, 2.5) * 2, 'and the measure does see low end when the crossover is opened right down');
  });
  it('tail duck: the room dips on every beat of the drop', async () => {
    const r = await render({ spaceTail: 1, spaceSize: 6, spaceDuck: 1 }, 3, (c) => c.spaceDrop(0.2, 4));
    const beat = 0.5; assert.lt(rms(r.L, 0.2 + 2 * beat + 0.005, 0.2 + 2 * beat + 0.03), rms(r.L, 0.2 + 2 * beat - 0.06, 0.2 + 2 * beat - 0.01) * 0.6, 'down on beat 3');
  });
  it('orbit: the space moves around you — one side, then the other', async () => {
    const r = await render({ spaceTail: 1, spaceSize: 8, spaceDuck: 0, orbit: 1, orbitBars: 1, spaceWidth: 0 }, 2.4, (c) => c.spaceDrop(0.1, 4));
    const bal = (a, b) => rms(r.L, a, b) / Math.max(1e-9, rms(r.R, a, b));   // at 120 BPM one circle = 2 s: right side ~0.6 s, left ~1.6 s
    assert.gt(bal(1.45, 1.75) / bal(0.45, 0.75), 2, 'left-heavy half a circle after right-heavy');
  });
  it('reverse swell: rises into the hit and stops exactly on it', async () => {
    const r = await render({ swell: 1, swellBeats: 2 }, 2, (c) => c.swellInto(1.5));
    assert.gt(rms(r.L, 1.35, 1.49), rms(r.L, 0.55, 0.7) * 3, 'rising'); assert.lt(rms(r.L, 1.51, 1.9), 0.02, 'over on the drop');
  });
});
