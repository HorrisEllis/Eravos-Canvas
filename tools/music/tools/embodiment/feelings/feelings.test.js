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
    const b = await ctx.startRendering(); return { L: b.getChannelData(0), sr };
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
  it('anger irritates: its loudness wobbles inside 30–150 Hz and follows across; love does not', async () => {
    const at = async (x) => { const r = await play({ feeling: 'anger', x, y: 0.7, hold: true }, 2); return wobble(r.L, S(r, 0.8), S(r, 1.9), r.sr); };
    const a0 = await at(0), a1 = await at(1), lv = (() => 0)();
    assert.ok(Math.abs(a0.at - 30) <= 4, 'left: the wobble at 30 Hz (' + a0.at + ')'); assert.ok(Math.abs(a1.at - 150) <= 6, 'right: at 150 Hz (' + a1.at + ')');
    const r = await play({ feeling: 'love', x: 0.5, y: 0.7, hold: true }, 2), l = wobble(r.L, S(r, 0.8), S(r, 1.9), r.sr), mid = await at(0.5);
    assert.gt(mid.band, l.band * 6, 'anger’s 30–150 Hz wobble ≥ 6× love’s');
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
});
