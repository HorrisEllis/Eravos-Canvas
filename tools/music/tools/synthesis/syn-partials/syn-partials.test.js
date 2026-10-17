/* Partials (eravos.syn-partials) — the shared contract, then its own: in pitch, odd-only, stretch, evolve */
TH.toolContract('eravos.syn-partials');
describe('tool · Partials — additive, drawn', () => {
  const SR = TH.SR;
  async function play(params, dur) {
    // a known starting point (its default preset is Glass Keys): a saw, no stretch / damp / evolve
    const BASE = { partialsA: Array.from({ length: 24 }, (_, i) => +(1 / (i + 1)).toFixed(3)), partialsB: Array.from({ length: 24 }, (_, i) => (i + 1) % 2 ? +(1 / (i + 1)).toFixed(3) : 0), morph: 0, evolve: 0, tilt: 0, oddEven: 0, stretch: 0, damp: 0, sustain: 0.8 };
    const U = TH.universe(dur || 1), o = TH.spawn(U, 'eravos.syn-partials'), c = OrganismFactory.handle(o).ctx; c.params.setMany(Object.assign(BASE, params || {}));
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(o, 'out').node.connect(U.ctx.destination);
    TH.note(U, o, 57, 0.05, { duration: (dur || 1) - 0.15 }); return (await TH.render(U)).getChannelData(0);
  }
  const mag = (d, f, a, n) => { let re = 0, im = 0; const s = Math.round(a * SR); for (let i = 0; i < n; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n); re += d[s + i] * w * Math.cos(2 * Math.PI * f * i / SR); im += d[s + i] * w * Math.sin(2 * Math.PI * f * i / SR); } return Math.hypot(re, im); };
  it('plays A3 (220 Hz) and is heard', async () => {
    const d = await play({}); assert.gt(mag(d, 220, 0.3, 9600), mag(d, 233, 0.3, 9600) * 10, 'energy on 220 Hz');
  });
  it('an odd-only spectrum has (almost) no 2nd harmonic; odd/even + flips it', async () => {
    const odd = await play({ partialsA: Array.from({ length: 24 }, (_, i) => (i + 1) % 2 ? 1 / (i + 1) : 0) });
    assert.lt(mag(odd, 440, 0.3, 9600), mag(odd, 660, 0.3, 9600) * 0.05, 'no 440 Hz');
    const even = await play({ oddEven: 1 }); assert.lt(mag(even, 660, 0.3, 9600), mag(even, 440, 0.3, 9600) * 0.05, 'no 660 Hz at odd/even +1');
  });
  it('stretch moves the 2nd partial off 440 Hz (bells)', async () => {
    const SAW = Array.from({ length: 24 }, (_, i) => 1 / (i + 1)), d = await play({ stretch: 1, partialsA: SAW });
    // re-centred on the note: partial 1 sits a little flat, partial 2 at 2 × 1.035 of it — off the harmonic 2:1
    let a = 0, b = 0; for (let k = 1; k <= 6; k++) { const e = 1 / (k * k); a += e * k; b += e * k * (1 + 0.035 * (k - 1)); }
    const f1 = 220 * a / b, f2 = f1 * 2 * 1.035;
    assert.gt(mag(d, f2, 0.3, 9600), mag(d, f1 * 2, 0.3, 9600) * 3, `2nd partial at ${f2.toFixed(1)}, not ${(f1 * 2).toFixed(1)}`);
  });
  it('evolve: the tone at the end of a held note is spectrum B', async () => {
    const SINE = [1].concat(Array(23).fill(0)), SAW = Array.from({ length: 24 }, (_, i) => 1 / (i + 1));
    const d = await play({ partialsA: SAW, partialsB: SINE, evolve: 1, sustain: 1 }, 1.8);
    const h2 = (t) => mag(d, 440, t, 4800) / mag(d, 220, t, 4800);
    assert.gt(h2(0.12), 0.3, 'saw-like at the start'); assert.lt(h2(1.3), 0.05, 'sine at the end');
  });
});
