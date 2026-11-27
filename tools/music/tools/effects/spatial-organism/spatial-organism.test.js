/* Spatial Organism (eravos.spatial-organism) — tests that travel with the tool. The shared contract (TH.toolContract), then its own
 * (spatial-organism.spec acceptance), measured offline. */
TH.toolContract('eravos.spatial-organism');
window.__spatialWas = window.__phase; window.__phase = 'P241';
describe('Spatial Organism — a point around you, moved, in a room', () => {
  const REST = { angle: 0, distance: 0, ears: 0, orbitDepth: 0, orbitDist: 0, room: 0, width: 1, bassMono: 0, mix: 1 };
  async function run(params, src, sec, taps) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.spatial-organism', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(Object.assign({}, REST, params)).forEach(([k, v]) => c.params.set(k, v)); await c.ready;
    const ports = K.audio.ports(a), inN = ports.find(x => x.kind === 'audio' && x.direction === 'in').node, outN = ports.find(x => x.kind === 'audio' && x.direction === 'out').node;
    K.audio.chain.out.gain.value = 0; outN.connect(ctx.destination);
    let whereBuf = null; if (taps) { const w = ports.find(x => x.label === 'where it is' || x.id === 'where' || x.port_id === 'where'); const m = ctx.createChannelMerger(2); w.node.connect(m, 0, 0); m.connect(ctx.destination); whereBuf = true; }
    src(ctx, inN, sr); const b = await ctx.startRendering(); return { L: b.getChannelData(0), R: b.getChannelData(1), sr };
  }
  const tone = (hz, panL, panR, from, to) => (ctx, node) => { const o = ctx.createOscillator(); o.frequency.value = hz; const m = ctx.createChannelMerger(2), gl = ctx.createGain(), gr = ctx.createGain();
    gl.gain.value = panL; gr.gain.value = panR; o.connect(gl); o.connect(gr); gl.connect(m, 0, 0); gr.connect(m, 0, 1); m.connect(node); o.start(from || 0); if (to) o.stop(to); };
  const rms = (d, sr, a, b) => { let s = 0; const i0 = Math.floor(a * sr), i1 = Math.floor(b * sr); for (let i = i0; i < i1; i++) s += d[i] * d[i]; return Math.sqrt(s / (i1 - i0)); };
  const dB = (x) => 20 * Math.log10(x + 1e-12);
  it('at rest: a mono input comes out −3 dB a side (an equal-power centre); a side-only input unchanged', async () => {
    const m = await run({}, tone(500, 0.3, 0.3), 1), want = dB(0.3 / Math.SQRT2 * Math.SQRT1_2);
    assert.lt(Math.abs(dB(rms(m.L, m.sr, 0.3, 0.9)) - want), 0.1, `mono: ${dB(rms(m.L, m.sr, 0.3, 0.9)).toFixed(2)} dB vs ${want.toFixed(2)}`);
    const s = await run({}, tone(500, 0.3, -0.3), 1); assert.lt(Math.abs(dB(rms(s.L, s.sr, 0.3, 0.9)) - dB(0.3 / Math.SQRT2)), 0.1, 'side only: unchanged');
  });
  it('Angle 1: the left falls silent · Distance 1: about 18 dB quieter (and the air)', async () => {
    const r = await run({ angle: 1 }, tone(500, 0.3, 0.3), 1); assert.lt(rms(r.L, r.sr, 0.3, 0.9), 1e-4, 'left silent');
    const n = await run({ distance: 0 }, tone(300, 0.3, 0.3), 1), f = await run({ distance: 1 }, tone(300, 0.3, 0.3), 1), d = dB(rms(f.L, f.sr, 0.3, 0.9) / rms(n.L, n.sr, 0.3, 0.9));
    assert.lt(Math.abs(d + 18), 1.2, `distance 1: ${d.toFixed(1)} dB`);
  });
  it('the pendulum with Lean 0.8 sounds on the right most of the time', async () => {
    const r = await run({ orbitDepth: 1, shape: 'pendulum', lean: 0.8, orbit: 1 }, tone(500, 0.3, 0.3), 4.2), w = Math.floor(r.sr * 0.05); let right = 0, all = 0;
    for (let i = Math.floor(0.2 * r.sr); i + w < r.L.length; i += w) { const l = rms(r.L, r.sr, i / r.sr, (i + w) / r.sr), rr = rms(r.R, r.sr, i / r.sr, (i + w) / r.sr); if (rr > l) right++; all++; }
    assert.gt(right / all, 0.6, `right ${(100 * right / all).toFixed(0)} % of the time`);
  });
  it('Room adds echoes after the sound stops; Bass mono brings a low tone to both sides', async () => {
    const dry = await run({ room: 0 }, tone(800, 0.3, 0.3, 0, 0.3), 0.6), wet = await run({ room: 1, size: 20, predelay: 10 }, tone(800, 0.3, 0.3, 0, 0.3), 0.6);
    assert.gt(rms(wet.L, wet.sr, 0.31, 0.4), rms(dry.L, dry.sr, 0.31, 0.4) * 10, 'echoes after it stops');
    const m = await run({ angle: -1, bassMono: 200 }, tone(50, 0.3, 0.3), 1.2); assert.gt(rms(m.R, m.sr, 0.5, 1.1) / rms(m.L, m.sr, 0.5, 1.1), 0.9, 'a 50 Hz tone hard left reaches the right');
  });
});
window.__phase = window.__spatialWas;
