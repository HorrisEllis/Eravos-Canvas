/* Squash (eravos.fx-squash) — tests that travel with the tool: the shared contract, then its own (spec fx-squash.spec). */
TH.toolContract('eravos.fx-squash');
describe('tool · Squash — three-band OTT-style squash', () => {
  const SR = 48000;
  // feed a stereo signal (fn(t) → [L, R]) through the tool, read both channels back
  async function run(params, sig, sec) {
    sec = sec || 1; const U = TH.universe(sec), fx = TH.spawn(U, 'eravos.fx-squash'), c = OrganismFactory.handle(fx).ctx;
    c.params.setMany(Object.assign({ mix: 1 }, params)); if (c.ready) await c.ready;
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(fx, 'out').node.connect(U.ctx.destination);
    const n = Math.round(SR * sec), b = new AudioBuffer({ numberOfChannels: 2, length: n, sampleRate: SR }), L = b.getChannelData(0), R = b.getChannelData(1);
    for (let i = 0; i < n; i++) { const v = sig(i / SR); L[i] = v[0]; R[i] = v[1]; }
    const s = U.ctx.createBufferSource(); s.buffer = b; s.connect(U.K.audio.port(fx, 'in').node); s.start(0);
    const out = await TH.render(U); return [out.getChannelData(0), out.getChannelData(1)];
  }
  const rms = (d, a, b) => { let s = 0; for (let i = Math.round(a * SR); i < b * SR; i++) s += d[i] * d[i]; return Math.sqrt(s / ((b - a) * SR)); };
  const db = (v) => 20 * Math.log10(Math.max(1e-9, v));
  const saw = (t, hz) => 2 * ((t * hz) % 1) - 1;
  const tone = (d, hz, a, b) => { let re = 0, im = 0; const i0 = Math.round(a * SR), n = Math.round((b - a) * SR); for (let i = i0; i < i0 + n; i++) { re += d[i] * Math.cos(2 * Math.PI * hz * i / SR); im += d[i] * Math.sin(2 * Math.PI * hz * i / SR); } return 2 * Math.hypot(re, im) / n; };
  // a growl that goes quiet → loud: a 330 Hz saw at −30 dBFS for half a second, then at −6
  const quietLoud = (t) => { const v = (t < 0.5 ? 0.03 : 0.5) * saw(t, 330); return [v, v]; };
  it('squash: the quiet part comes up and the loud part stays put — the gap between them shrinks by 8 dB or more', async () => {
    const [dry] = await run({ amount: 0 }, quietLoud), [sq] = await run({ amount: 0.8 }, quietLoud);
    const gapDry = db(rms(dry, 0.6, 0.95)) - db(rms(dry, 0.1, 0.45)), gapSq = db(rms(sq, 0.6, 0.95)) - db(rms(sq, 0.1, 0.45));
    assert.gt(gapDry, 20, `untouched: ${gapDry.toFixed(1)} dB between the parts`); assert.lt(gapSq, gapDry - 8, `squashed: ${gapSq.toFixed(1)} dB`);
    assert.gt(db(rms(sq, 0.1, 0.45)) - db(rms(dry, 0.1, 0.45)), 6, 'the quiet part came up');
    assert.lt(Math.abs(db(rms(sq, 0.6, 0.95)) - db(rms(dry, 0.6, 0.95))), 6, 'the loud part stays within 6 dB of where it was');
  });
  it('lows clean: a 45 Hz sub under a squashed 440 Hz comes out as it went in; squashed lows do not', async () => {
    const sig = (t) => { const v = 0.4 * Math.sin(2 * Math.PI * 45 * t) + 0.2 * Math.sin(2 * Math.PI * 440 * t); return [v, v]; };
    const clean = tone((await run({ amount: 1, low: 1, lowClean: true }, sig))[0], 45, 0.3, 0.9), crushed = tone((await run({ amount: 1, low: 1, lowClean: false }, sig))[0], 45, 0.3, 0.9);
    assert.near(clean, 0.4, 0.06, `kept at ${clean.toFixed(3)} (in 0.4)`); assert.gt(Math.abs(crushed - 0.4), Math.abs(clean - 0.4) + 0.02, `squashed lows move: ${crushed.toFixed(3)}`);
  });
  it('mono lows: a sub only in the left comes out in both sides; the highs keep their stereo', async () => {
    const sig = (t) => [0.4 * Math.sin(2 * Math.PI * 50 * t) + 0.2 * Math.sin(2 * Math.PI * 5000 * t), 0];
    const [l0, r0] = await run({ amount: 0, monoLow: false }, sig), [l1, r1] = await run({ amount: 0, monoLow: true }, sig);
    assert.lt(tone(r0, 50, 0.3, 0.9), 0.02, 'stereo: the right side has no sub');
    assert.near(tone(r1, 50, 0.3, 0.9) / tone(l1, 50, 0.3, 0.9), 1, 0.05, 'mono lows: the same sub both sides');
    assert.lt(tone(r1, 5000, 0.3, 0.9), 0.02, 'the 5 kHz stays left'); assert.gt(tone(l1, 5000, 0.3, 0.9), 0.1);
  });
  it('flat at Squash 0: sines from 40 Hz to 10 kHz come out at the level they went in (±1 dB) — the split sums back', async () => {
    for (const hz of [40, 120, 180, 400, 1000, 2400, 5000, 10000]) {
      const [o] = await run({ amount: 0 }, (t) => { const v = 0.3 * Math.sin(2 * Math.PI * hz * t); return [v, v]; }, 0.6);
      assert.lt(Math.abs(db(tone(o, hz, 0.25, 0.55)) - db(0.3)), 1, `${hz} Hz: ${(db(tone(o, hz, 0.25, 0.55)) - db(0.3)).toFixed(2)} dB`);
    }
  });
  it('zero latency: a click comes out on time (within a millisecond)', async () => {
    const at = 0.2, [o] = await run({ amount: 0.8 }, (t) => { const v = Math.abs(t - at) < 0.5 / SR ? 0.8 : 0; return [v, v]; }, 0.4);
    let i = 0; while (i < o.length && Math.abs(o[i]) < 0.02) i++; assert.lt(Math.abs(i / SR - at), 0.001, `first sound at ${(i / SR * 1000).toFixed(2)} ms (the click at ${at * 1000})`);
  });
  it('the Mix blends the untouched signal back: at 0 it is the input', async () => {
    const [dry] = await run({ amount: 0, mix: 0 }, quietLoud), [mix0] = await run({ amount: 1, mix: 0 }, quietLoud);
    assert.lt(Math.abs(db(rms(mix0, 0.1, 0.45)) - db(rms(dry, 0.1, 0.45))), 0.5);
  });
});
