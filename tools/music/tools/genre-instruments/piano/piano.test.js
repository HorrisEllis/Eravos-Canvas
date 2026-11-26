/* Piano (eravos.piano) — tests that travel with the tool. The shared contract (TH.toolContract): spawns clean, every shipped preset loads in
 * range, save → load is exact, closing leaves nothing behind, Stop all is obeyed. Then its own — the spec's acceptance (piano.spec ADDENDUM
 * 2026-11-13): every model sounds; the pitch is right; the grand's 12th partial runs sharp; a key let go stops, with the pedal it rings; a knob
 * moved while a note sounds reaches it; every model at one loudness. */
TH.toolContract('eravos.piano');
window.__phase = 'P182';
describe('Piano — modelled live: tine, reed, felt, upright, honky, grand', () => {
  async function play(params, notes, sec, during) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.piano', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(Object.assign({ drive: 0, trem: 0, sympathetic: 0, resonance: 0, keyOff: 0 }, params || {})).forEach(([k, v]) => c.params.set(k, v));
    await c.internals.ready; assert.ok(c.internals.node(), 'its worklet is running');
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    notes.forEach(([note, t, d, v]) => c.internals.noteOn(note, v || 0.8, t, d));
    if (during) during(c, ctx);
    const b = await ctx.startRendering(); return { L: b.getChannelData(0), R: b.getChannelData(1), sr, c };
  }
  const rms = (d, a, b) => { let s = 0; for (let i = a; i < b; i++) s += d[i] * d[i]; return Math.sqrt(s / (b - a)); };
  const peak = (d) => { let m = 0; for (const x of d) { if (!isFinite(x)) return Infinity; m = Math.max(m, Math.abs(x)); } return m; };
  const S = (r, t) => Math.floor(t * r.sr);
  const goertzel = (d, a, n, hz, sr) => { const w = 2 * Math.PI * hz / sr, cw = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let j = a; j < a + n; j++) { const s0 = d[j] * (0.5 - 0.5 * Math.cos(2 * Math.PI * (j - a) / n)) + cw * s1 - s2; s2 = s1; s1 = s0; } return Math.sqrt(s1 * s1 + s2 * s2 - cw * s1 * s2); };
  const pitch = (d, a, b, sr) => { let zc = 0, first = -1, last = -1; for (let i = a; i < b; i++) if (d[i] <= 0 && d[i + 1] > 0) { const t = i + d[i] / (d[i] - d[i + 1]); if (first < 0) first = t; last = t; zc++; } return (zc - 1) / ((last - first) / sr); };
  it('every model sounds, finite, under full scale — and at one loudness (within 6 dB)', async () => {
    const lv = {};
    for (const model of ['tine', 'reed', 'felt', 'upright', 'honky', 'grand']) {
      const r = await play({ model }, [[57, 0.05, 1.2, 0.8], [60, 0.05, 1.2, 0.8], [64, 0.05, 1.2, 0.8]], 1.6);
      const e = rms(r.L, S(r, 0.08), S(r, 1.0)); lv[model] = 20 * Math.log10(e + 1e-12);
      assert.gt(e, 0.005, model + ' sounds (' + e.toFixed(4) + ')'); assert.lt(peak(r.L), 1, model + ' under full scale, no NaN');
    }
    const v = Object.values(lv), spread = Math.max(...v) - Math.min(...v);
    assert.lt(spread, 6, 'the models within 6 dB: ' + Object.entries(lv).map(([k, x]) => k + ' ' + x.toFixed(1)).join(' · '));
  });
  it('every factory preset: overlapping four-note chords (and its own pedal, body, sympathetic strings) stay under full scale', async () => {
    const pr = OrganismFactory.def('eravos.piano').presets || {}, names = Object.keys(pr); assert.gt(names.length, 5, 'the factory presets are loaded');
    const phrase = [[57, 0.1, 0.9], [60, 0.1, 0.9], [64, 0.1, 0.9], [67, 0.1, 0.9], [55, 0.83, 0.9], [59, 0.83, 0.9], [62, 0.83, 0.9], [65, 0.83, 0.9], [53, 1.56, 1.4], [57, 1.56, 1.4], [60, 1.56, 1.4], [64, 1.56, 1.4]];
    for (const name of names) { const p = Object.assign({ drive: 0, trem: 0, sympathetic: 0, resonance: 0, keyOff: 0 }, (pr[name] && pr[name].params) || pr[name]);
      const r = await play(p, phrase.map(([n, t, d]) => [n, t, d, 0.85]), 3.2); const pk = peak(r.L); assert.lt(pk, 1, name + ': peak ' + pk.toFixed(3)); assert.gt(rms(r.L, S(r, 0.2), S(r, 2.5)), 0.01, name + ' sounds'); }
  });
  it('no rumble under the notes: every factory preset, a middle-C dyad — under 30 Hz < 4 %, 30–120 Hz < 12 % of what it plays (3.234)', async () => {
    // his "The piano doesn't get enough love." (2026-11-26): measured before 3.234, Felt Lullaby put 42 % of its energy under 30 Hz and a third between 30 and 120
    const pr = OrganismFactory.def('eravos.piano').presets || {};
    const band = (d, sr, f0, f1) => { let s = 0; const n = 8192, a = Math.floor(0.12 * sr); for (let f = f0; f < f1; f += 2) { const g = goertzel(d, a, n, f, sr); s += g * g; } return s; };
    for (const name of Object.keys(pr)) { const p = Object.assign({}, (pr[name] && pr[name].params) || pr[name]);
      const r = await play(p, [[60, 0.1, 1.2, 0.6], [64, 0.1, 1.2, 0.5]], 1.6);
      const lo = band(r.L, r.sr, 2, 30), mid = band(r.L, r.sr, 30, 120), all = lo + mid + band(r.L, r.sr, 120, 2000);
      assert.lt(lo / all, 0.04, name + ': under 30 Hz ' + (100 * lo / all).toFixed(1) + ' %'); assert.lt(mid / all, 0.12, name + ': 30–120 Hz ' + (100 * mid / all).toFixed(1) + ' %'); }
  });
  it('pitch: A3 plays 220 Hz — the tine and the grand', async () => {
    for (const model of ['tine', 'grand']) {
      const r = await play({ model, brightness: 0.1, hardness: 0.2, inharm: 0, detune: 0, width: 0 }, [[57, 0.02, 1.5, 0.7]], 1.6);
      const f = pitch(r.L, S(r, 0.3), S(r, 1.2), r.sr); assert.ok(Math.abs(1200 * Math.log2(f / 220)) < 8, model + ' A3 plays ' + f.toFixed(2) + ' Hz');
    }
  });
  it('the grand is stretched: its 12th partial runs sharp (Stretch), at 0 it is not', async () => {
    const sharp = async (inharm) => { const r = await play({ model: 'grand', brightness: 1, hardness: 0.9, inharm, detune: 0, width: 0 }, [[57, 0.02, 1.5, 1]], 1.0);
      const a = S(r, 0.1), n = S(r, 0.5) - a; let best = 0, at = 0; for (let c = -20; c <= 80; c += 0.5) { const hz = 12 * 220 * Math.pow(2, c / 1200), m = goertzel(r.L, a, n, hz, r.sr); if (m > best) { best = m; at = c; } } return at; };
    const s0 = await sharp(0), s1 = await sharp(0.5);
    assert.lt(Math.abs(s0), 6, 'Stretch 0: the 12th partial in tune (' + s0 + ' c)'); assert.gt(s1, 8, 'Stretch 0.5: the 12th partial sharp (' + s1 + ' c)');
  });
  it('a key let go stops; with the pedal down it keeps ringing', async () => {
    const off = await play({ model: 'upright', release: 0.1, decay: 8 }, [[60, 0.05, 0.4, 0.8]], 1.6), on = await play({ model: 'upright', release: 0.1, decay: 8, pedal: true }, [[60, 0.05, 0.4, 0.8]], 1.6);
    const a = rms(off.L, S(off, 1.2), S(off, 1.6)), b = rms(on.L, S(on, 1.2), S(on, 1.6));
    assert.lt(a, 0.0005, 'let go: quiet after the release (' + a.toExponential(1) + ')'); assert.gt(b, 0.005, 'pedal down: still ringing (' + b.toFixed(4) + ')');
  });
  it('a knob turned while a note sounds reaches it (Bright down mid-note: the top darkens)', async () => {
    const r = await play({ model: 'tine', brightness: 1 }, [[60, 0.02, 2, 0.9]], 2.0, (c, ctx) => { ctx.suspend(0.9).then(() => { c.params.set('brightness', 0); ctx.resume(); }); });
    const hi = (t) => goertzel(r.L, S(r, t), 2048, 261.63 * 4, r.sr) / (goertzel(r.L, S(r, t), 2048, 261.63, r.sr) + 1e-9);
    assert.lt(hi(1.2), hi(0.6) * 0.7, 'the 4th partial falls against the fundamental after Bright moves: ' + hi(0.6).toFixed(3) + ' → ' + hi(1.2).toFixed(3));
  });
});
