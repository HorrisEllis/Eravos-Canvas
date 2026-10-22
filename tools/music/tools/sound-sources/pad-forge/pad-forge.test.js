/* Pad Forge (eravos.pad-forge) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.pad-forge');

// 1.1 — measured fix: chords no longer clip the Warmth shaper, sources sit at one loudness, width is not a comb filter
describe('Pad Forge 1.1 · headroom, even sources, real stereo', () => {
  const chord = async (preset, params, tapPre) => {
    const U = TH.universe(2.4), id = TH.spawn(U, 'eravos.pad-forge'), c = OrganismFactory.handle(id).ctx; if (preset) c.presets.load(preset);
    Object.entries(params || {}).forEach(([k, v]) => c.params.set(k, v));
    if (tapPre) { c.params.set('level', 0); const t = U.ctx.createGain(); c.internals.pre.connect(t); t.connect(U.ctx.destination); }
    [57, 60, 64, 67].forEach(n => TH.note(U, id, n, 0.05, { duration: 1.9, velocity: 1 })); return TH.render(U);
  };
  it('a loud 4-note chord stays well inside the Warmth shaper on the hottest presets (it reached 3.4× full scale in 1.0)', async () => {
    for (const p of ['EDM Pad · Glass Pluck Pad', 'Celestial Glass', 'Her Essence', 'EDM Pad · Deep House Organ Pad']) assert.lt(TH.peak(await chord(p, null, true), 0.1, 2.3), 0.6, p);
  });
  it('the output of those chords peaks below full scale', async () => {
    for (const p of ['EDM Pad · Glass Pluck Pad', 'Her Essence']) assert.lt(TH.peak(await chord(p), 0.1, 2.3), 0.95, p);
  });
  it('every source alone lands within 4 dB of the others (they spanned 16 dB)', async () => {
    const lv = [];
    for (const k of ['swarm', 'glass', 'air', 'choir', 'organ', 'strings', 'halo'])
      lv.push(TH.db(TH.rms(await chord(null, { cornerA: k, cornerB: k, cornerC: k, cornerD: k, x: 0.5, y: 0.5, orbit: 'still', warmth: 0, space: 0, shimmer: 0, width: 0, level: 1, bloom: 0, cutoff: 16000, attack: 0.05 }), 0.8, 1.9)));
    assert.lt(Math.max(...lv) - Math.min(...lv), 4, lv.map(x => x.toFixed(1)).join(' '));
  }, { timeout: 40000 });
  it('width is stereo, not a comb: left and right differ, and with width 0 they are identical', async () => {
    const diff = (b) => { const L = b.getChannelData(0), R = b.getChannelData(1); let d = 0, a = 0; for (let i = Math.floor(0.8 * TH.SR); i < 1.9 * TH.SR; i++) { d += (L[i] - R[i]) ** 2; a += L[i] ** 2; } return Math.sqrt(d / a); };
    const base = { space: 0, shimmer: 0, orbit: 'still' };
    assert.gt(diff(await chord('Her Essence', Object.assign({ width: 1 }, base))), 0.2, 'wide');
    assert.lt(diff(await chord('Her Essence', Object.assign({ width: 0 }, base))), 0.01, 'mono at width 0');
  });
});

// 3.52 — Octave and Pitch (his song: "the pad (yellow) is to high pitched though, and I need more control")
describe('Pad Forge 3.52 · Octave and Pitch move the whole pad', () => {
  const zc = async (params) => {
    const U = TH.universe(1.6), id = TH.spawn(U, 'eravos.pad-forge'), c = OrganismFactory.handle(id).ctx;
    c.params.setMany(Object.assign({ shimmer: 0, space: 0, bloom: 0, cutoff: 16000, attack: 0.01 }, params));
    TH.note(U, id, 69, 0.05, { duration: 1.4, velocity: 1 }); const b = await TH.render(U), d = b.getChannelData(0);
    let n = 0; for (let i = Math.floor(0.4 * TH.SR) + 1; i < Math.floor(1.4 * TH.SR); i++) if ((d[i - 1] < 0) !== (d[i] < 0)) n++; return n;
  };
  it('defaults are 0: nothing changes for old songs and presets', () => {
    const d = OrganismFactory.def('eravos.pad-forge'); ['octave', 'transpose'].forEach(k => assert.equal(d.config.find(c => c.key === k).default, 0, k));
  });
  it('Octave −1 sounds an octave lower; Pitch −12 does the same', async () => {
    const base = await zc({}), down = await zc({ octave: -1 }), pitch = await zc({ transpose: -12 });
    assert.ok(down / base > 0.35 && down / base < 0.7, `octave −1: ${down} vs ${base} crossings (≈ half)`);
    assert.ok(Math.abs(pitch - down) / down < 0.15, `pitch −12 ≈ octave −1: ${pitch} vs ${down}`);
  });
});
