/* 3.72 — James, 2026-10-24: "curves, depth, deep bass, huge drop, contrast and a lot of tensnio'" */
window.__phase = 'P72';
describe('🔺 Tension & 💥 drops: build → pause → huge drop, measured (3.72)', () => {
  const L = () => PatternLibrary.all();
  it('the tension patterns, the drops and four chains (one per Floor Falls move) are in the library', () => {
    const t = L().filter(p => p.type === 'tension'); assert.gt(t.length, 7, t.length + ' tension patterns');
    assert.ok(t.some(p => p.curve && p.curve.key === '@pitch') && t.some(p => p.curve && p.curve.key === 'cutoff'), 'a riser curve and a filter rip');
    const ch = L().filter(p => p.type === 'chain'); assert.deepEqual(ch.map(p => p.move).sort(), ['falls', 'freefall', 'rises', 'stairs']);
    assert.ok(ch.every(p => p.parts.some(x => x.at === 8 && x.pattern.type === 'drop')), 'each pauses on bar 9 with a Floor Falls move');
    const subs = L().filter(p => p.genre === 'tension-drops' && p.tool === 'eravos.sub-engine');
    assert.ok(subs.every(p => p.configure && p.configure.octave === 0), 'every sub at its real note (Octave 0)');
    assert.ok(subs.every(p => p.notes.every(n => n.r + Math.min(0, n.b ? Math.min(n.b.from, n.b.to) : 0) >= 14)), 'no dive under ~18 Hz');
  });
  // the measurements: one chain rendered off the canvas → per bar: level, the 30–60 Hz share
  function bars(r, n) {
    const L0 = r.buf.getChannelData(0), R0 = r.buf.getChannelData(1), sr = r.buf.sampleRate, per = Math.round(r.barSec * sr), out = [];
    const a1 = 1 - Math.exp(-2 * Math.PI * 30 / sr), a2 = 1 - Math.exp(-2 * Math.PI * 60 / sr); let l30 = 0, l30b = 0, l60 = 0, l60b = 0;
    // above 150 Hz: two RBJ high-pass biquads (24 dB/oct), so the sub does not leak into "above"
    const w = 2 * Math.PI * 150 / sr, al = Math.sin(w) / (2 * 0.7071), cw = Math.cos(w), a0 = 1 + al, B0 = (1 + cw) / 2 / a0, B1 = -(1 + cw) / a0, B2 = B0, A1 = -2 * cw / a0, A2 = (1 - al) / a0;
    const hp = () => { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; return (x) => { const y = B0 * x + B1 * x1 + B2 * x2 - A1 * y1 - A2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }; }, h1 = hp(), h2 = hp();
    for (let b = 0; b < n; b++) { let e = 0, band = 0, above = 0; const s0 = Math.round(0.05 * sr) + b * per;
      for (let i = s0; i < s0 + per && i < L0.length; i++) { const m = (L0[i] + R0[i]) / 2; l30 += a1 * (m - l30); l30b += a1 * (l30 - l30b); l60 += a2 * (m - l60); l60b += a2 * (l60 - l60b);
        const bd = l60b - l30b, hp = h2(h1(m)); e += m * m; band += bd * bd; above += hp * hp; }
      out.push({ db: 10 * Math.log10(e / per + 1e-12), deep: band / (e + 1e-12), above: 10 * Math.log10(above / per + 1e-12) }); }
    return out;
  }
  [['falls', 'Wobble'], ['stairs', 'Reese']].forEach(([mv, what]) => it(`the ${mv} chain (${what} drop): tension rises through the build, the pause is a hole, the drop is huge and deep`, async () => {
    const ch = L().find(p => p.type === 'chain' && p.move === mv), r = await PatternLibrary.render(ch); assert.ok(r && !r.silent, 'it sounds');
    const B = bars(r, 13), first = B[0], last = B[7], pause = B[8], drop = B.slice(9, 13), avg = (k) => 10 * Math.log10(drop.reduce((a, x) => a + Math.pow(10, x[k] / 10), 0) / 4), dropDb = avg('db'), dropAbove = avg('above');
    const say = `build ${first.db.toFixed(1)} → ${last.db.toFixed(1)} dB · above 150 Hz: pause ${pause.above.toFixed(1)} vs drop ${dropAbove.toFixed(1)} dB · whole band: pause ${pause.db.toFixed(1)} vs drop ${dropDb.toFixed(1)} · drop 30–60 Hz ${(100 * drop.reduce((a, x) => a + x.deep, 0) / 4).toFixed(0)} %`;
    window.__p72 = (window.__p72 || []).concat(mv + ': ' + say);
    assert.gt(last.db - first.db, 3, 'tension: the build gets louder — ' + say);
    assert.gt(dropAbove - pause.above, 15, 'contrast: above the sub, the pause is a hole — ' + say);   // the sub's dive is the pause's event (Floor Falls Out), so the hole is above it
    assert.gt(drop.reduce((a, x) => a + x.deep, 0) / 4, 0.08, 'depth: the drop’s share of 30–60 Hz — ' + say);
  }));
  it('→ Timeline: a chain lands as parts on their own tracks, at their bars', () => {
    const ctx = new OfflineAudioContext(2, 24000, 24000), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 145 }).boot();
    const ch = L().find(p => p.type === 'chain' && p.move === 'falls'), res = PatternLibrary.send(ch, { K, headless: true, bar: 1 });
    const T = OrganismFactory.handle(res.tl).ctx, tools = new Set(T.internals.lanes.filter(l => l.kind === 'inst').map(l => K.registry.get(l.target).organism_id));
    ['eravos.pads', 'eravos.sub-engine', 'eravos.wobble-bass', 'eravos.supersaw'].forEach(t => assert.ok(tools.has(t), 'a track for ' + t));
    const sub = T.internals.lanes.find(l => l.kind === 'inst' && K.registry.get(l.target).organism_id === 'eravos.sub-engine');
    assert.deepEqual(T.internals.clips.filter(c => c.lane === sub.id).map(c => c.startBar).sort((a, b) => a - b), [5, 9, 10], 'the sub rises from bar 5 · the pause · the drop, on the sub track');
    assert.ok(T.internals.lanes.some(l => l.kind === 'auto' && l.key === '@pitch') && T.internals.lanes.some(l => l.kind === 'auto' && l.key === 'cutoff'), 'its curves');
    OrganismFactory.clearAll(K);
  });
});
