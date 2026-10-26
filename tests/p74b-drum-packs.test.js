/* 3.74b — James, 2026-10-25: "also each pack for the dumpad needs to be completely different sounds. every pack needs to be additive." ·
 * "yes like there is supposed to be full range of synthwave sounds and tools". "Completely different" is MEASURED (specs/eravos.phase74b-map.spec
 * D-74b.2): every sound is rendered offline and fingerprinted — its loudness over time (7 windows) and its spectrum (9 octave bands, attack and
 * body) in dB — and a pack's sound must sit far from every built-in model and every other pack's sound. */
window.__phase = 'P74b';
describe('🥁 Drum packs that add their own sounds: Synthwave (3.74b)', () => {
  const BUILTIN = { kick: ['classic', '909', '808', 'punch', 'tearout', 'thump', 'hardstyle', 'rumble', 'zap'], snare: ['classic', '909', '808', 'crack', 'slam', 'rimshot', 'brush', 'electro', 'lofi'],
    clap: ['classic', 'stacked', 'snap', '808'], hat: ['classic', '909', 'tick', 'fm', 'lofi'], openhat: ['classic', '909', 'fm', 'lofi'], '808': ['classic', 'dist', 'reese', 'sub'],
    tom: ['classic', 'electro', 'conga', 'tabla'], crash: ['classic', 'ride', 'china', 'swell'], perc: ['classic', 'wood', 'clang', 'laser'], rim: ['classic'], shaker: ['classic'], cowbell: ['classic'] };
  const SEC = 1.7, T0 = 0.05;
  function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], xr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, xi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + xr; im[i + k] = ui + xi; re[i + k + len / 2] = ur - xr; im[i + k + len / 2] = ui - xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } }
  function bands(d, sr, from, to) {   // octave band energies 40 Hz … 20 kHz, dB against the loudest band
    const N = 2048, out = new Array(9).fill(1e-12); for (let s = Math.floor(from * sr); s + N <= Math.floor(to * sr); s += N) { const re = new Float64Array(N), im = new Float64Array(N);
      for (let i = 0; i < N; i++) re[i] = (d[s + i] || 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); fft(re, im);
      for (let k = 1; k < N / 2; k++) { const f = k * sr / N, b = Math.floor(Math.log2(f / 40)); if (b >= 0 && b < 9) out[b] += re[k] * re[k] + im[k] * im[k]; } }
    const mx = Math.max(...out); return out.map(e => Math.max(-50, 10 * Math.log10(e / mx)));
  }
  function fingerprint(buf) {
    const d = buf.getChannelData(0), sr = buf.sampleRate, W = [0, 0.01, 0.03, 0.08, 0.18, 0.4, 0.9, 1.6].map(x => x + T0);
    const env = W.slice(1).map((e, i) => TH.rms(buf, W[i], e)), mx = Math.max(...env);
    return { silent: mx < 1e-4, v: env.map(x => Math.max(-50, TH.db(x / mx))).concat(bands(d, sr, T0, T0 + 0.043), bands(d, sr, T0 + 0.043, T0 + 0.3)) };
  }
  const dist = (a, b) => Math.sqrt(a.v.reduce((s, x, i) => s + (x - b.v[i]) ** 2, 0) / a.v.length);   // RMS difference, dB per feature
  async function render(voice, model) {
    const U = TH.universe(SEC), a = TH.spawn(U, 'eravos.pads'), c = OrganismFactory.handle(a).ctx;
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'out').node.connect(U.ctx.destination);
    U.K.bus.publish('ui:pad_edit:' + a, { index: 0, key: 'voice', value: voice }); U.K.bus.publish('ui:pad_edit:' + a, { index: 0, key: 'model', value: model });
    const pd = c.stateExtra().banks[0][0]; assert.equal(pd.model, model, voice + ' ' + model + ' took');
    c.trigger(0, 0.9, T0); const buf = await TH.render(U); const f = fingerprint(buf); f.name = voice + ':' + model; f.faults = U.K.faults.list().length; return f;
  }
  let FP = null;
  async function prints() {
    if (FP) return FP; const base = [], pk = [];
    for (const v of Object.keys(BUILTIN)) for (const m of BUILTIN[v]) base.push(await render(v, m));
    for (const r of DrumRecipes.all()) { const f = await render(r.voice, r.name); f.pack = r.pack; pk.push(f); }
    return (FP = { base, pk });
  }

  it('additive: a pack registers its own sounds; another pack can never take one over; every built-in model is still there', () => {
    const sw = DrumRecipes.byPack('synthwave'); assert.gt(sw.length, 15, sw.length + ' Synthwave sounds');
    let refused = false; try { DrumRecipes.add({ pack: 'other', voice: 'snare', name: 'gated', layers: [{ k: 'tone', f: 200, d: 0.1 }] }); } catch (e) { refused = true; } assert.ok(refused, 'another pack cannot overwrite Synthwave’s gated snare');
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.pads'), ms = OrganismFactory.handle(a).ctx.stateExtra().models;
    Object.keys(BUILTIN).forEach(v => BUILTIN[v].forEach(m => assert.ok(ms[v].includes(m), v + ' ' + m + ' kept')));
    sw.forEach(r => assert.ok(ms[r.voice].includes(r.name), r.voice + ' ' + r.name + ' offered on the pad'));
  });
  it('the full synthwave range: Linn, DMX and Simmons kicks and snares, the gated snare and clap, Simmons and Syndrum toms, tambourine, claves, cowbell, the orchestra hit', () => {
    const have = new Set(DrumRecipes.byPack('synthwave').map(r => r.voice + ':' + r.name));
    ['kick:linn', 'kick:dmx', 'kick:simmons', 'snare:gated', 'snare:linn', 'snare:simmons', 'snare:dmx', 'clap:linn', 'clap:gated', 'tom:simmons', 'tom:syndrum',
      'perc:tambourine', 'perc:claves', 'perc:orch-hit', 'cowbell:dmx', 'hat:linn', 'openhat:dmx', 'crash:gated', 'rim:electro', 'shaker:cabasa'].forEach(k => assert.ok(have.has(k), k));
  });
  it('the Synthwave kits play only Synthwave sounds, and load onto the Drum Machine as they are', async () => {
    const kits = KitPacks.kits().filter(k => k.packId === 'synthwave'); assert.gt(kits.length, 2, kits.length + ' kits');
    kits.forEach(k => { assert.equal(k.pads.length, 16, k.name); k.pads.forEach(p => assert.equal((DrumRecipes.get(p.voice, p.model) || {}).pack, 'synthwave', k.name + ' ' + p.voice + ' ' + p.model)); });
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.pads'), c = OrganismFactory.handle(a).ctx;
    U.K.bus.publish('ui:kit_load:' + a, { pads: kits[0].pads }); await TH.sleep(50);
    assert.deepEqual(c.stateExtra().banks[0].map(p => p.voice + ':' + p.model), kits[0].pads.map(p => p.voice + ':' + p.model)); assert.equal(U.K.faults.list().length, 0, JSON.stringify(U.K.faults.list()));
  });
  it('COMPLETELY DIFFERENT, measured: every pack sound is far from every built-in model and every other pack sound (and from its pack-mates)', async () => {
    const { base, pk } = await prints(), MIN = 6;   // dB per feature; MIN calibrated against the built-ins' own nearest pairs (spec addendum)
    pk.forEach(f => { assert.ok(!f.silent, f.name + ' sounds'); assert.equal(f.faults, 0, f.name + ' no faults'); });
    const bad = [];
    pk.forEach(f => { const others = base.concat(pk.filter(g => g !== f)); let near = null, dm = 1e9; others.forEach(g => { const d = dist(f, g); if (d < dm) { dm = d; near = g; } });
      if (dm < MIN) bad.push(f.name + ' ≈ ' + near.name + ' (' + dm.toFixed(1) + ' dB)'); });
    assert.equal(bad.length, 0, bad.join(' · '));
  }, { timeout: 120000 });
});
