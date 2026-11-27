/* Ripple (eravos.ripple) — tests that travel with the tool. The shared contract (TH.toolContract): spawns clean, every shipped preset loads in
 * range, save → load is exact, closing leaves nothing behind, Stop all is obeyed. Then its own (ripple.spec acceptance), measured offline:
 * the swell runs at Beat Hz on any note · the sub never passes the tube · Dive falls into the note · the grind grinds with Drive. */
TH.toolContract('eravos.ripple');
window.__rippleWas = window.__phase; window.__phase = 'P239';
describe('Ripple — a clean sub under a grind that swells at Beat Hz', () => {
  const BASE = { voices: 2, beat: 1.6, detune: 0, width: 0, sub: 0, grind: 1, drive: 0, cutoff: 12000, fEnv: 0, res: 0.7, dive: 0, aA: 0.002, aD: 0.01, aS: 1, aR: 0.05, octave: 0, level: 0.7, wave: 'sine', midOct: '0' };
  async function play(params, notes, sec) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.ripple', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(Object.assign({}, BASE, params || {})).forEach(([k, v]) => c.params.set(k, v));
    await c.ready;
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    notes.forEach(([note, t, d, v]) => c.noteOn(note, v || 0.8, t, d));
    const b = await ctx.startRendering(); return { L: b.getChannelData(0), sr };
  }
  const S = (r, t) => Math.floor(t * r.sr);
  const rms = (d, a, b) => { let s = 0; for (let i = a; i < b; i++) s += d[i] * d[i]; return Math.sqrt(s / Math.max(1, b - a)); };
  const pitch = (d, a, b, sr) => { let zc = 0, first = -1, last = -1; for (let i = a; i < b; i++) if (d[i] <= 0 && d[i + 1] > 0) { const t = i + d[i] / (d[i] - d[i + 1]); if (first < 0) first = t; last = t; zc++; } return (zc - 1) / ((last - first) / sr); };
  // the swell's period: the loudness in 10 ms windows; where it empties (a dip under a fifth of the loudest), the mean spacing of the dips
  function swellPeriod(r, from, to) {
    const w = Math.floor(r.sr * 0.01), env = []; for (let i = S(r, from); i + w < S(r, to); i += w) env.push(rms(r.L, i, i + w));
    const top = Math.max(...env), dips = []; let inDip = false, lo = 0, at = 0;
    env.forEach((x, i) => { if (x < top * 0.2) { if (!inDip || x < lo) { lo = x; at = i; } inDip = true; } else if (inDip) { dips.push(at); inDip = false; } });
    return dips.length > 1 ? (dips[dips.length - 1] - dips[0]) / (dips.length - 1) * 0.01 : 0;
  }
  it('two grind voices Beat 1.6 Hz apart swell 1.6 times a second — on a low note and an octave up (± 5 %)', async () => {
    for (const note of [45, 57]) { const r = await play({}, [[note, 0.02, 4.4]], 4.6), per = swellPeriod(r, 0.3, 4.3);
      assert.lt(Math.abs(per - 1 / 1.6) / (1 / 1.6), 0.05, `note ${note}: the swell repeats every ${per.toFixed(3)} s (1/1.6 = 0.625)`); }
  });
  it('Beat 4 swells four times a second (the knob is the rate)', async () => {
    const r = await play({ beat: 4 }, [[45, 0.02, 3]], 3.2), per = swellPeriod(r, 0.3, 3); assert.lt(Math.abs(per - 0.25) / 0.25, 0.08, 'period ' + per.toFixed(3) + ' s');
  });
  it('the sub never passes the tube: grind off, Drive 0 and Drive 24 give the same sub (difference < −60 dB)', async () => {
    const a = await play({ sub: 1, grind: 0, drive: 0 }, [[45, 0.4, 1]], 1.6), b = await play({ sub: 1, grind: 0, drive: 24 }, [[45, 0.4, 1]], 1.6);   // after the grind's level has glided to 0 (a 12 ms glide from its default)
    let d = 0; for (let i = 0; i < a.L.length; i++) d += (a.L[i] - b.L[i]) ** 2; const ra = rms(a.L, 0, a.L.length), rd = Math.sqrt(d / a.L.length);
    assert.gt(ra, 0.01, 'the sub sounds'); assert.lt(20 * Math.log10(rd / ra + 1e-12), -60, 'difference ' + (20 * Math.log10(rd / ra + 1e-12)).toFixed(1) + ' dB');
  });
  it('Drive grinds: the grind at 24 dB carries more of itself above 1 kHz than at 0 dB', async () => {
    const hi = (r) => { let h = 0, all = 0, y = 0; for (let i = S(r, 0.2); i < S(r, 1.2); i++) { const x = r.L[i]; const hp = x - y; y = x; h += hp * hp; all += x * x; } return h / all; };   // a first difference ≈ the highs
    const a = hi(await play({ drive: 0, beat: 2, voices: 3 }, [[45, 0.05, 1.3]], 1.4)), b = hi(await play({ drive: 24, beat: 2, voices: 3 }, [[45, 0.05, 1.3]], 1.4));
    assert.gt(b, a * 3, `highs: drive 0 ${a.toExponential(2)} → drive 24 ${b.toExponential(2)}`);
  });
  it('Dive 12 over 0.4 s: a note starts an octave up and lands on its pitch', async () => {
    const r = await play({ sub: 1, grind: 0, dive: 12, diveTime: 0.4 }, [[45, 0.02, 1.4]], 1.5), f0 = pitch(r.L, S(r, 0.03), S(r, 0.09), r.sr), f1 = pitch(r.L, S(r, 0.7), S(r, 1.3), r.sr);
    assert.gt(f0, 220 * 0.85, 'A2 (110 Hz) starts an octave up: ' + f0.toFixed(1) + ' Hz'); assert.lt(Math.abs(1200 * Math.log2(f1 / 110)), 10, 'landed ' + f1.toFixed(2) + ' Hz (110)');
  });
  it('the ripple goes out as a modulation signal any tool can take', () => {
    const def = OrganismFactory.def('eravos.ripple'); assert.ok(JSON.stringify(def.hooks).includes('ripple.hook.ripple_out'), 'declares the ripple out');
  });
});
window.__phase = window.__rippleWas;   // the next file's tests keep their own phase
