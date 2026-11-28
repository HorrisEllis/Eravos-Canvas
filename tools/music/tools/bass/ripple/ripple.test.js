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
  // 3.250 his words (2026-11-27): "Can you get the rumble sound? Like it's a high pitch tone that loads in, collides and ripples."
  it('Rise: Dive −12 starts a note an octave under and lands on it', async () => {
    const r = await play({ sub: 1, grind: 0, dive: -12, diveTime: 0.4 }, [[45, 0.02, 1.4]], 1.5), f0 = pitch(r.L, S(r, 0.03), S(r, 0.09), r.sr), f1 = pitch(r.L, S(r, 0.7), S(r, 1.3), r.sr);
    assert.lt(f0, 110 * 0.6, 'A2 (110 Hz) starts an octave under: ' + f0.toFixed(1) + ' Hz'); assert.lt(Math.abs(1200 * Math.log2(f1 / 110)), 10, 'landed ' + f1.toFixed(2) + ' Hz');
  });
  it('Collide: voices 40 Hz apart slide to Beat 1 Hz — a fast clash at the start, a slow ripple after Collide time', async () => {
    const r = await play({ beat: 1, collideFrom: 40, collideTime: 1.2, octave: 2 }, [[57, 0.02, 3.6]], 3.8);
    // the clash: count the dips of the loudness (2 ms windows) in 0.1–0.4 s; the ripple: the spacing of the dips after 1.4 s
    const env = (a, b, w) => { const o = []; for (let i = S(r, a); i + w < S(r, b); i += w) o.push(rms(r.L, i, i + w)); return o; };
    const dips = (e) => { const top = Math.max(...e); let n = 0, inD = false; e.forEach(x => { if (x < top * 0.3) { if (!inD) n++; inD = true; } else inD = false; }); return n; };
    const early = dips(env(0.1, 0.4, Math.floor(r.sr * 0.002))), late = swellPeriod(r, 1.4, 3.6);
    assert.gt(early, 6, 'the clash: ' + early + ' dips in 0.3 s (voices ~35 Hz apart)'); assert.lt(Math.abs(late - 1), 0.08, 'the ripple: every ' + late.toFixed(3) + ' s (Beat 1 Hz)');
  });
  it('Env amt below 0: a note starts dark and opens in (its highs grow)', async () => {
    const hi = (r, a, b) => { let h = 0, all = 0, y = 0; for (let i = S(r, a); i < S(r, b); i++) { const x = r.L[i]; const d = x - y; y = x; h += d * d; all += x * x; } return h / all; };
    const r = await play({ sub: 0, fEnv: -3, fDec: 0.8, cutoff: 4000, drive: 0, wave: 'saw', voices: 2 }, [[45, 0.02, 2.4]], 2.5), a = hi(r, 0.03, 0.09), b = hi(r, 1.8, 2.3);
    assert.gt(b, a * 4, `highs at the start ${a.toExponential(2)} → after ${b.toExponential(2)}`);
  });
  it('the new settings at their defaults leave every note as it was (Collide from 0)', () => {
    const d = OrganismFactory.def('eravos.ripple'), c = (k) => d.config.find(x => x.key === k); assert.equal(c('collideFrom').default, 0); assert.ok(c('dive').min < 0 && c('fEnv').min < 0, 'Rise and opening filter are in reach');
  });
  // 3.255 the recipe he pasted (2026-11-28): "Modulation from a square wave two octaves higher" — Mod (FM) on each voice
  it('Mod: a modulator two octaves up (ratio 4) puts sidebands on the note (f ± 4f: 3f and 5f); Mod amount 0 puts none', async () => {
    const amp = (r, hz, a, b) => { let re = 0, im = 0; for (let i = S(r, a); i < S(r, b); i++) { const w = 2 * Math.PI * hz * i / r.sr; re += r.L[i] * Math.cos(w); im += r.L[i] * Math.sin(w); } return Math.hypot(re, im); };
    const base = { wave: 'sine', voices: 2, beat: 0, detune: 0, width: 0, sub: 0, grind: 1, drive: 0, cutoff: 12000, res: 0.5, fEnv: 0, octave: 0, midOct: '+1', modRatio: 4, modWave: 'sine' };
    const off = await play(Object.assign({}, base, { modAmt: 0 }), [[45, 0.02, 1.2]], 1.3), on = await play(Object.assign({}, base, { modAmt: 1 }), [[45, 0.02, 1.2]], 1.3), f = 220;
    const r5 = (r) => amp(r, 5 * f, 0.3, 1.0) / amp(r, f, 0.3, 1.0), r3 = (r) => amp(r, 3 * f, 0.3, 1.0) / amp(r, f, 0.3, 1.0);
    assert.lt(r5(off), 0.01, 'off: nothing at 5f (' + r5(off).toFixed(4) + ')'); assert.gt(r5(on), 0.2, 'on: a sideband at 5f (' + r5(on).toFixed(3) + ' of the note)'); assert.gt(r3(on), 0.2, 'on: a sideband at 3f (' + r3(on).toFixed(3) + ')');
  });
  it('Mod amount is 0 by default, so every note and preset plays as before', () => {
    const d = OrganismFactory.def('eravos.ripple'), c = (k) => d.config.find(x => x.key === k); assert.equal(c('modAmt').default, 0); assert.equal(c('modRatio').default, 4);
    Object.entries(d.presets).forEach(([n, pr]) => assert.ok(!((pr.params || pr).modAmt), n + ' has no Mod'));
  });
  it('the ripple goes out as a modulation signal any tool can take', () => {
    const def = OrganismFactory.def('eravos.ripple'); assert.ok(JSON.stringify(def.hooks).includes('ripple.hook.ripple_out'), 'declares the ripple out');
  });
});
window.__phase = window.__rippleWas;   // the next file's tests keep their own phase
