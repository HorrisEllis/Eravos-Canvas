/* Feelings (eravos.feelings) — tests that travel with the tool: the shared contract, then the sound measured (feelings.spec acceptance). */
TH.toolContract('eravos.feelings');
window.__phase = 'P187';
describe('Feelings — one feeling fills the pad; drag to play it', () => {
  async function play(params, sec, script) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.feelings', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(params || {}).forEach(([k, v]) => c.params.set(k, v));
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    if (script) script(c, ctx);
    const b = await ctx.startRendering(); return { L: b.getChannelData(0), R: b.getChannelData(1), sr };
  }
  const rms = (d, a, b) => { let s = 0; for (let i = a; i < b; i++) s += d[i] * d[i]; return Math.sqrt(s / Math.max(1, b - a)); };
  const peak = (d) => { let m = 0; for (const x of d) { if (!isFinite(x)) return Infinity; m = Math.max(m, Math.abs(x)); } return m; };
  const S = (r, t) => Math.floor(t * r.sr), dB = (x) => 20 * Math.log10(x + 1e-12);
  const goertzel = (d, a, n, hz, sr) => { const w = 2 * Math.PI * hz / sr, cw = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let j = a; j < a + n; j++) { const s0 = d[j] * (0.5 - 0.5 * Math.cos(2 * Math.PI * (j - a) / n)) + cw * s1 - s2; s2 = s1; s1 = s0; } return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - cw * s1 * s2)); };
  // the loudness envelope's spectrum: where its wobble lives (rectify → 1 ms blocks)
  function wobble(d, a, b, sr) { const blk = Math.round(sr / 1000), env = []; for (let i = a; i + blk <= b; i += blk) { let s = 0; for (let j = i; j < i + blk; j++) s += Math.abs(d[j]); env.push(s / blk); }
    const m = env.reduce((x, y) => x + y, 0) / env.length, e = env.map(x => x - m); let best = 0, at = 0, band = 0, all = 0;
    for (let f = 2; f <= 300; f += 2) { const p = goertzel(e, 0, e.length, f, 1000) ** 2; all += p; if (f >= 30 && f <= 150) band += p; if (p > best) { best = p; at = f; } } return { at, share: band / (all + 1e-20), band }; }
  it('silent until touched; touched it sounds; let go it fades to silence', async () => {
    const r = await play({ feeling: 'love', y: 0.6 }, 6, (c, ctx) => { c.touch(true, 0.8); c.touch(false, 2.0); });
    assert.lt(rms(r.L, S(r, 0.1), S(r, 0.7)), 1e-4, 'nothing before the touch'); assert.gt(rms(r.L, S(r, 1.2), S(r, 1.9)), 0.005, 'sounds while touched');
    assert.lt(rms(r.L, S(r, 5.5), S(r, 6)), rms(r.L, S(r, 1.2), S(r, 1.9)) * 0.03, 'let go: fades away (its release, then the space)');
  });
  it('a drag on the pad in its window plays it, and letting go stops it (the window\u2019s own events, none dropped)', async () => {
    const hm = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(hm, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot();
    const id = OrganismFactory.spawn('eravos.feelings', { x: 10, y: 10 }); await TH.sleep(60);
    const c = OrganismFactory.handle(id).ctx, pad = CanvasWM.windowOf(id).querySelector('canvas[data-pad]'), before = Kernel.faults.list().length;
    try {
      assert.ok(pad, 'the pad is there'); const r = pad.getBoundingClientRect(), at = (x, y) => ({ clientX: r.left + x * r.width, clientY: r.top + y * r.height, pointerId: 1, bubbles: true });
      pad.dispatchEvent(new PointerEvent('pointerdown', at(0.2, 0.8))); await TH.sleep(20);
      assert.ok(c.internals.sounding, 'pressed: it sounds');
      pad.dispatchEvent(new PointerEvent('pointermove', at(0.8, 0.1))); await TH.sleep(30);
      assert.gt(c.params.get('x'), 0.7, 'dragged right: Across follows (' + c.params.get('x') + ')'); assert.gt(c.params.get('y'), 0.8, 'dragged up: Up follows (' + c.params.get('y') + ')');
      pad.dispatchEvent(new PointerEvent('pointerup', at(0.8, 0.1))); await TH.sleep(20);
      assert.ok(!c.internals.sounding, 'let go: it stops');
      assert.equal(Kernel.faults.list().slice(before).map(f => f.message || '').filter(m => /ui_hooks|dropped/.test(m)).join(' · '), '', 'no UI event dropped');
    } finally { OrganismFactory.close(id); }
  });
  it('up is the dynamic range: top ≥ 18 dB louder than bottom, every feeling', async () => {
    for (const feeling of ['love', 'anger', 'sadness']) {
      const lo = await play({ feeling, y: 0, hold: true }, 2), hi = await play({ feeling, y: 1, hold: true }, 2);
      const d = dB(rms(hi.L, S(hi, 1), S(hi, 2))) - dB(rms(lo.L, S(lo, 1), S(lo, 2))); assert.gt(d, 18, feeling + ': ' + d.toFixed(1) + ' dB from bottom to top');
    }
  });
  it('anger irritates: its loudness wobbles inside 30–150 Hz and follows across (sidebands at the note ± the wobble); love does not', async () => {
    // 0.2.0: Anger sits an octave up (110 Hz), so its own pitch is inside 30–150 Hz too and an envelope reading finds the note, not the wobble.
    // Measured instead where amplitude modulation shows: a sideband at the note + the wobble rate, against the note itself.
    const f0 = 440 * Math.pow(2, (45 + 5 * 0.7 - 69) / 12);
    const side = async (feeling, x, rate) => { const r = await play({ feeling, x, y: 0.7, hold: true }, 2), a = S(r, 0.8), n = 16384; const base = feeling === 'anger' ? f0 : 440 * Math.pow(2, (57 + 7 * 0.7 - 69) / 12);
      return dB(goertzel(r.L, a, n, base + rate, r.sr)) - dB(goertzel(r.L, a, n, base, r.sr)); };
    const c = [0, 1].map(x => FeelingsData.FEEL.anger.at(x, 0.7).roughHz);
    const a30 = await side('anger', 0, 30), a150 = await side('anger', 1, 150), l = await side('love', 0.5, 90);
    assert.gt(a30, -26, 'anger left: sideband at note + 30 Hz ' + a30.toFixed(1) + ' dB'); assert.gt(a150, -26, 'anger right: sideband at note + 150 Hz ' + a150.toFixed(1) + ' dB');
    assert.lt(l, Math.min(a30, a150) - 12, 'love has no such wobble (' + l.toFixed(1) + ' dB)');
  });
  it('anger is low: far more of its energy under 150 Hz than love', async () => {
    const low = (r) => goertzel(r.L, S(r, 1), 8192, 55, r.sr) + goertzel(r.L, S(r, 1), 8192, 110, r.sr), all = (r) => rms(r.L, S(r, 1), S(r, 1) + 8192) * 8192;
    const a = await play({ feeling: 'anger', x: 0.3, y: 0.5, hold: true }, 2), l = await play({ feeling: 'love', x: 0.3, y: 0.5, hold: true }, 2);
    assert.gt(low(a) / all(a), (low(l) / all(l)) * 4, 'low share: anger ' + (low(a) / all(a)).toFixed(3) + ' vs love ' + (low(l) / all(l)).toFixed(3));
  });
  it('a move while it sounds reaches it (Up from bottom to top mid-sound); never over 0.72', async () => {
    const r = await play({ feeling: 'sadness', y: 0.05, hold: true }, 4, (c, ctx) => { ctx.suspend(1.6).then(() => { c.params.set('y', 1); ctx.resume(); }); });
    assert.gt(dB(rms(r.L, S(r, 3), S(r, 3.9))) - dB(rms(r.L, S(r, 0.8), S(r, 1.5))), 15, 'Up moved mid-sound: louder by > 15 dB');
    for (const feeling of ['love', 'anger', 'sadness']) for (const x of [0, 1]) { const q = await play({ feeling, x, y: 1, speed: 1, level: 1, hold: true }, 2); assert.lt(peak(q.L), 0.73, feeling + ' x ' + x + ' peak ' + peak(q.L).toFixed(3)); }
  });
  // 0.2.0 — his: "the field isn't changing the tone and depth. Anger sounds messed up and the third one doesn't work." These fail on 0.1.0.
  function centroid(r) { const a = S(r, 1.2), n = 2048, re = new Float64Array(n); for (let i = 0; i < n; i++) re[i] = r.L[a + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / n));
    let num = 0, den = 0; for (let k = 1; k < n / 2; k++) { let x = 0, y = 0; const w = 2 * Math.PI * k / n; for (let i = 0; i < n; i++) { x += re[i] * Math.cos(w * i); y += re[i] * Math.sin(w * i); } const m = x * x + y * y; num += m * k * r.sr / n; den += m; } return num / (den + 1e-20); }
  it('up opens the tone, not only the level: brightness at the top ≥ 2× the bottom (0.1.0: 1.7×), every feeling', async () => {
    for (const feeling of ['love', 'anger', 'sadness']) { const lo = centroid(await play({ feeling, x: 0.5, y: 0, hold: true }, 2)), hi = centroid(await play({ feeling, x: 0.5, y: 1, hold: true }, 2));
      assert.gt(hi / lo, 2, feeling + ': ' + lo.toFixed(0) + ' → ' + hi.toFixed(0) + ' Hz'); }
  });
  it('across moves the colour and the depth: brightness or width changes ≥ 25 % from left to right, every feeling', async () => {
    const width = (r) => { const a = S(r, 1.2), b = S(r, 1.9); let m = 0, d = 0; for (let i = a; i < b; i++) { m += (r.L[i] + r.R[i]) ** 2; d += (r.L[i] - r.R[i]) ** 2; } return Math.sqrt(d / (m + 1e-20)); };
    for (const feeling of ['love', 'anger', 'sadness']) { const l = await play({ feeling, x: 0, y: 0.6, hold: true }, 2), r = await play({ feeling, x: 1, y: 0.6, hold: true }, 2);
      const dc = Math.abs(centroid(r) / centroid(l) - 1), dw = Math.abs(width(r) - width(l)) / Math.max(0.05, width(l));
      assert.gt(Math.max(dc, dw), 0.25, feeling + ': brightness ' + (dc * 100).toFixed(0) + ' %, width ' + (dw * 100).toFixed(0) + ' %'); }
  });
  it('every feeling is heard on small speakers: at the pad’s middle most of its energy is above 150 Hz', async () => {
    for (const feeling of ['love', 'anger', 'sadness']) { const r = await play({ feeling, x: 0.5, y: 0.5, hold: true }, 2), a = S(r, 1), n = 8192;
      let low = 0; for (let f = 20; f <= 150; f += 5) low += goertzel(r.L, a, n, f, r.sr) ** 2; let all = 0; for (let f = 20; f <= 8000; f += 5) all += goertzel(r.L, a, n, f, r.sr) ** 2;
      assert.lt(low / all, 0.5, feeling + ': ' + (100 * low / all).toFixed(0) + ' % under 150 Hz'); }
  });
});
