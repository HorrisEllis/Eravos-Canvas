/* Destroyer (eravos.fx-destroyer) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Then its own: 2.0 gain staging, LOW KEEP, ALIAS. */
TH.toolContract('eravos.fx-destroyer');
describe('tool · Destroyer 2.0 — sounds good at every setting', () => {
  const SR = 48000;
  async function run(params, sig, sec) {
    const U = TH.universe(sec || 0.8), fx = TH.spawn(U, 'eravos.fx-destroyer'), c = OrganismFactory.handle(fx).ctx;
    c.params.setMany(params); if (c.ready) await c.ready;
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(fx, 'out').node.connect(U.ctx.destination);
    const b = new AudioBuffer({ numberOfChannels: 1, length: Math.round(SR * (sec || 0.8)), sampleRate: SR }), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = sig(i / SR);
    const s = U.ctx.createBufferSource(); s.buffer = b; s.connect(U.K.audio.port(fx, 'in').node); s.start(0);
    return (await TH.render(U)).getChannelData(0);
  }
  const rms = (d, a, b) => { let s = 0; for (let i = Math.round(a * SR); i < b * SR; i++) s += d[i] * d[i]; return Math.sqrt(s / ((b - a) * SR)); };
  const db = (v) => 20 * Math.log10(Math.max(1e-9, v));
  const saw = (a, hz) => (t) => a * (2 * ((t * hz) % 1) - 1);
  it('auto gain: full drive on a −18 dBFS part changes its colour, not its volume (within 6 dB, every shape)', async () => {
    for (const shape of OrganismFactory.def('eravos.fx-destroyer').config.find(c => c.key === 'shape').options) {
      const y = await run({ shape, drive: 1, mix: 1 }, saw(0.125, 110));
      const gain = db(rms(y, 0.3, 0.7)) - db(0.125 / Math.sqrt(3));
      assert.lt(Math.abs(gain), 6, `${shape}: ${gain.toFixed(1)} dB`);
    }
  });
  it('low keep: a 45 Hz sub under a driven 440 Hz comes out as clean as it went in', async () => {
    const sig = (t) => 0.3 * Math.sin(2 * Math.PI * 45 * t) + 0.2 * Math.sin(2 * Math.PI * 440 * t);
    const sub = (d) => { let re = 0, im = 0; const a = Math.round(0.3 * SR), n = Math.round(0.4 * SR); for (let i = a; i < a + n; i++) { re += d[i] * Math.cos(2 * Math.PI * 45 * i / SR); im += d[i] * Math.sin(2 * Math.PI * 45 * i / SR); } return 2 * Math.hypot(re, im) / n; };
    const kept = sub(await run({ shape: 'hard', drive: 0.9, lowKeep: 110, mix: 1 }, sig)), full = sub(await run({ shape: 'hard', drive: 0.9, lowKeep: 0, mix: 1 }, sig));
    assert.gt(kept, 0.24, `sub kept at ${kept.toFixed(3)} (in 0.3)`); assert.gt(kept, full * 1.3, `kept ${kept.toFixed(3)} vs crushed into the shaper ${full.toFixed(3)}`);
  });
  it('alias 0 keeps a downsampled tone harmonic; alias 1 lets the fold-over through', async () => {
    const f0 = 1500, sig = (t) => 0.25 * Math.sin(2 * Math.PI * f0 * t);
    const inharm = (d) => { const N = 8192, re = new Float32Array(N), im = new Float32Array(N), w = OrganismSDK.dsp.hann(N), o = Math.round(0.3 * SR); for (let i = 0; i < N; i++) re[i] = d[o + i] * w[i]; OrganismSDK.dsp.fft(re, im);
      let h = 0, x = 0; for (let k = 2; k < N / 2; k++) { const f = k * SR / N, m = re[k] * re[k] + im[k] * im[k], r = f / f0; if (Math.round(r) >= 1 && Math.abs(r - Math.round(r)) * f0 < 60) h += m; else x += m; } return x / h; };
    const clean = inharm(await run({ drive: 0, bits: 16, downsample: 6, alias: 0, mix: 1 }, sig)), raw = inharm(await run({ drive: 0, bits: 16, downsample: 6, alias: 1, mix: 1 }, sig));
    assert.gt(raw, clean * 4, `raw ${db(Math.sqrt(raw)).toFixed(1)} dB vs clean ${db(Math.sqrt(clean)).toFixed(1)} dB`);
  });
});

describe('Destroyer 2.1 · no blown speaker, less work (3.77)', () => {
  async function imd(params) {   // a loud 50 Hz (the bass) + a quiet 1 kHz (the music): what the bass does to the music
    const SR = 48000, U = TH.universe(1.2), id = TH.spawn(U, 'eravos.fx-destroyer'), c = OrganismFactory.handle(id).ctx; if (c.ready) await c.ready;
    c.params.setMany(Object.assign({ mix: 1 }, params || {}));
    const ac = U.ctx, o1 = ac.createOscillator(), o2 = ac.createOscillator(), g1 = ac.createGain(), g2 = ac.createGain(); o1.frequency.value = 50; o2.frequency.value = 1000; g1.gain.value = 0.4; g2.gain.value = 0.1;
    o1.connect(g1); o2.connect(g2); const inp = U.K.audio.port(id, 'in').node; g1.connect(inp); g2.connect(inp); o1.start(0); o2.start(0);
    U.K.audio.chain.out.disconnect(ac.destination); U.K.audio.port(id, 'out').node.connect(ac.destination);
    const d = (await TH.render(U)).getChannelData(0), N = 32768, off = Math.floor(0.3 * SR), re = new Float32Array(N), im = new Float32Array(N), w = OrganismSDK.dsp.hann(N);
    for (let i = 0; i < N; i++) re[i] = d[off + i] * w[i]; OrganismSDK.dsp.fft(re, im);
    const mag = (f) => { const k = Math.round(f * N / SR); let m = 0; for (let j = k - 2; j <= k + 2; j++) m = Math.max(m, Math.hypot(re[j], im[j])); return m; };
    return { imd: 20 * Math.log10(Math.hypot(mag(950), mag(1050), mag(900), mag(1100)) / mag(1000)), sub: 20 * Math.log10(mag(50)), c };
  }
  it('the default keeps the sub out of the damage: the bass no longer chews the music (intermodulation under −30 dB; was −1.6) and the sub is as deep as dry', async () => {
    const dflt = await imd(), dry = await imd({ drive: 0 });
    assert.lt(dflt.imd, -30, 'intermodulation ' + dflt.imd.toFixed(1) + ' dB'); assert.lt(Math.abs(dflt.sub - dry.sub), 1.5, 'the sub keeps its level');
    assert.equal(dflt.c.params.get('lowKeep'), 100); assert.equal(dflt.c.params.get('tight'), 40);
  });
  it('every shipped preset but Total Destruction keeps the sub clean', () => {
    const U = TH.universe(0.2), c = OrganismFactory.handle(TH.spawn(U, 'eravos.fx-destroyer')).ctx;
    c.presets.names().filter(n => !n.startsWith('user:')).forEach(n => { c.presets.load(n); if (!/Total Destruction/.test(n)) assert.ok(c.params.get('lowKeep') >= 20, n); });
  });
  it('stages that change nothing are out of the path: no crusher at 16 bits, the crusher in when crushing; no crossover with Low keep off; no shelves when flat', async () => {
    const U = TH.universe(0.2), c = OrganismFactory.handle(TH.spawn(U, 'eravos.fx-destroyer')).ctx; if (c.ready) await c.ready;
    assert.deepEqual(c.routing(), { tilt: false, keep: true, crush: false });
    c.params.set('bits', 8); assert.equal(c.routing().crush, true, 'crushing: the crusher is in');
    c.params.setMany({ bits: 16, lowKeep: 0, tilt: 0.3 }); assert.deepEqual(c.routing(), { tilt: true, keep: false, crush: false });
  });
});
