/* Drum Machine (eravos.pads) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.pads');

window.__phase = 'P39';
describe('Drum Machine 3.0 · models per voice (pads.spec PLANNED 3.0)', () => {
  // render one pad, measured at the tool's own port (the master chain is muted, as in the choke test)
  async function renderPad(padDef, secs) {
    const U = TH.universe(secs || 1.6), a = TH.spawn(U, 'eravos.pads'), c = OrganismFactory.handle(a).ctx;
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'out').node.connect(U.ctx.destination);
    U.K.bus.publish('ui:pad_set:' + a, { index: 0, pad: padDef });
    // noise voices start their noise buffer at a random offset (by design: hits breathe); the measurement seeds it so a
    // model's features are the same every run
    const rnd = Math.random, seeded = (() => { let x = 12345; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();
    Math.random = seeded; try { c.trigger(0, 1, 0.05); } finally { Math.random = rnd; }
    return { buf: await TH.render(U), U };
  }
  // features: brightness (log spectral centroid of the first 80 ms), length (log time to −30 dB), punch (crest of the first 30 ms)
  function features(buf) {
    const d = buf.getChannelData(0), sr = buf.sampleRate, s0 = Math.floor(0.05 * sr), N = 4096, re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = (d[s0 + i] || 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
    MusicSDKfft(re, im);
    let num = 0, den = 0; for (let k = 1; k < N / 2; k++) { const m = Math.hypot(re[k], im[k]); num += m * k * sr / N; den += m; }
    let peak = 0; for (let i = s0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    let last = s0; for (let i = s0; i < d.length; i++) if (Math.abs(d[i]) > peak * 0.0316) last = i;
    let pk = 0, sq = 0; const w = Math.floor(0.03 * sr); for (let i = s0; i < s0 + w; i++) { pk = Math.max(pk, Math.abs(d[i])); sq += d[i] * d[i]; }
    return { bright: Math.log2(Math.max(20, num / Math.max(1e-9, den))), len: Math.log2(Math.max(0.005, (last - s0) / sr)), punch: pk / Math.sqrt(sq / w + 1e-12), peak, nan: d.some(x => !isFinite(x)) };
  }
  function MusicSDKfft(re, im) { // in-place radix-2 (kept local: the test measures, it does not depend on a tool's internals)
    const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
      for (let i = 0; i < n; i += len) { let xr = 1, xi = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * xr - im[i + k + len / 2] * xi, vi = re[i + k + len / 2] * xi + im[i + k + len / 2] * xr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = xr * wr - xi * wi; xi = xr * wi + xi * wr; xr = t; } } }
  }
  const dist = (a, b) => Math.hypot(a.bright - b.bright, (a.len - b.len) * 0.8, (a.punch - b.punch) / 3);
  const lib = () => OrganismFactory.def('eravos.pads').lib;
  it('every model of every voice renders: non-silent, finite, no faults', async () => {
    const bad = [], L = lib(); window.__padFeatures = {};
    for (const v of Object.keys(L.MODELS)) { if (v === 'sample') continue;
      for (const m of Object.keys(L.MODELS[v])) {
        const { buf, U } = await renderPad(Object.assign({ voice: v, model: m }, L.MODELS[v][m]), v === 'crash' || v === '808' || m === 'rumble' ? 3 : 1.6), f = features(buf);
        window.__padFeatures[v + '/' + m] = f;
        if (f.nan || f.peak < 0.01 || U.K.faults.list().length) bad.push(`${v}/${m} peak ${f.peak.toFixed(3)} nan ${f.nan} faults ${U.K.faults.list().length}`);
      } }
    console.log('pad features', JSON.stringify(Object.fromEntries(Object.entries(window.__padFeatures).map(([k, f]) => [k, [+f.bright.toFixed(2), +f.len.toFixed(2), +f.punch.toFixed(2), +f.peak.toFixed(2)]]))));
    assert.equal(bad.join(' · '), '');
  });
  it('models of a voice are DIFFERENT instruments: every pair differs by a measured distance (kits cannot all sound the same again)', () => {
    const F = window.__padFeatures, L = lib(), close = [];
    Object.keys(L.MODELS).forEach(v => { const ms = Object.keys(L.MODELS[v]).filter(m => F[v + '/' + m]);
      for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) { const d = dist(F[v + '/' + ms[i]], F[v + '/' + ms[j]]); if (d < 0.35) close.push(`${v}: ${ms[i]}~${ms[j]} ${d.toFixed(2)}`); } });
    assert.equal(close.join(' · '), '');
  });
  // noise voices start their noise at a random offset (2.0 behaviour), so identity is checked on a noise-free voice
  it('classic pads are byte-identical to 2.0 (no 3.0 node is built for them)', async () => {
    const a = await renderPad({ voice: '808', tune: -3, decay: 0.8, drive: 0.3 }), b = await renderPad({ voice: '808', model: 'classic', tune: -3, decay: 0.8, drive: 0.3, tone: 0, snap: 1, body: 0, driveType: 'fold' });
    // compared up to the voice's own end (0.05 + 0.8 s): after it, the 2.0 cleanup disconnects the voice in whichever
    // render quantum the main thread reaches first — that block varies run to run in 2.0 as well, so it is not "the sound"
    const x = a.buf.getChannelData(0), y = b.buf.getChannelData(0), lim = Math.floor(0.9 * TH.SR); let n = 0, m = 0, first = -1; for (let i = 0; i < lim; i++) if (x[i] !== y[i]) { n++; m = Math.max(m, Math.abs(x[i] - y[i])); if (first < 0) first = i; }
    assert.equal(n, 0, `classic render changed: ${n} samples, max |Δ| ${m}, first at ${first}`);
  });
  it('a model change sets that model’s defaults; unknown model → RUNTIME_002; a kit preset fills the current bank', () => {
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.pads'), c = OrganismFactory.handle(a).ctx, pub = (k, p) => U.K.bus.publish('ui:' + k + ':' + a, p);
    pub('pad_edit', { index: 0, key: 'model', value: 'tearout' }); const p0 = c.kitOf()[0]; assert.equal(p0.model, 'tearout'); assert.equal(p0.driveType, 'asym'); assert.near(p0.drive, 0.85, 1e-9);
    assert.fault(U.K, 'RUNTIME_002', () => pub('pad_edit', { index: 0, key: 'model', value: 'nope' }));
    const kit = Array.from({ length: 16 }, (_, i) => ({ voice: i % 2 ? 'snare' : 'kick', model: i % 2 ? 'crack' : 'punch' }));
    c.loadExtra({ kit }); assert.deepEqual(c.kitOf().slice(0, 2).map(p => p.model), ['punch', 'crack']);
  });
});
describe('Drum Machine 3.0 · kits are presets, and they differ', () => {
  const kitPresets = () => { const d = OrganismFactory.def('eravos.pads'); return Object.keys(d.presets || {}).filter(n => d.presets[n].extra && d.presets[n].extra.kit); };
  it('≥ 38 kit presets ship; loading one fills the current bank; kick, snare, clap and hat of every kit sound', async () => {
    const names = kitPresets(); assert.gt(names.length, 37, 'kit presets');
    const bad = [];
    for (const n of names) {
      const U = TH.universe(0.9), a = TH.spawn(U, 'eravos.pads'), c = OrganismFactory.handle(a).ctx;
      U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'out').node.connect(U.ctx.destination);
      c.presets.load(n); const k = c.kitOf(); if (k[0].model === undefined) bad.push(n + ': not loaded');
      [0, 1, 2, 3].forEach((i, j) => c.trigger(i, 1, 0.02 + j * 0.2));
      const buf = await TH.render(U); [0, 1, 2, 3].forEach((i, j) => { if (TH.peak(buf, 0.02 + j * 0.2, 0.2 + j * 0.2) < 0.01) bad.push(`${n}: pad ${i + 1} silent`); });
      if (U.K.faults.list().length) bad.push(n + ': faults');
    }
    assert.equal(bad.join(' · '), '');
  });
  it('kits differ: ≥ 90 % of kit pairs differ in at least 2 of kick / snare / hat (model or tune)', () => {
    const d = OrganismFactory.def('eravos.pads'), sig = kitPresets().map(n => [0, 1, 3].map(i => { const p = d.presets[n].extra.kit[i]; return p.voice + '/' + (p.model || 'classic') + '/' + (p.tune || 0); }));
    let pairs = 0, ok = 0; for (let i = 0; i < sig.length; i++) for (let j = i + 1; j < sig.length; j++) { pairs++; if (sig[i].filter((x, k) => x !== sig[j][k]).length >= 2) ok++; }
    assert.gt(ok / pairs, 0.9, `${ok}/${pairs}`);
  });
  it('the Sounds page lists the kit preset packs from the same data; switching a pack off removes its kits there and from the presets', () => {
    const lst = KitPacks.list(), lost = lst.find(p => p.id === '@pads.lost-love'); assert.ok(lost && Object.keys(lost.kits).length >= 6, 'Lost Love kits listed');
    KitPacks.toggle('@pads.lost-love', false);
    assert.ok(!KitPacks.kits().some(k => k.packId === '@pads.lost-love')); assert.ok(!Object.keys(OrganismFactory.def('eravos.pads').presets).some(n => /^Lost Love · /.test(n)));
    KitPacks.toggle('@pads.lost-love', true); assert.ok(Object.keys(OrganismFactory.def('eravos.pads').presets).some(n => /^Lost Love · /.test(n)));
  });
});
