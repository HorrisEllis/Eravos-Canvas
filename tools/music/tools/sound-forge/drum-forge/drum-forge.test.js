/* Drum Forge (eravos.drum-forge) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.drum-forge');

describe('Drum Forge 1.1 · drawn pitch drop, layer lengths, pad filter, velocity → tone (3.79)', () => {
  const ctxOf = (id) => OrganismFactory.handle(id).ctx;
  function rig() { const U = TH.universe(0.6), id = TH.spawn(U, 'eravos.drum-forge'), c = ctxOf(id); const edit = (i, patch) => U.K.bus.publish('ui:slot_edit:' + id, { i, patch }); return { U, id, c, edit }; }
  const ch = (b) => b.getChannelData(0);
  const energy = (d, a, z, sr) => { let e = 0; for (let i = Math.floor(a * sr); i < Math.min(d.length, Math.floor(z * sr)); i++) e += d[i] * d[i]; return e; };
  const bright = (d, sr, a, z) => { let e = 0, df = 0; for (let i = Math.floor(a * sr) + 1; i < Math.min(d.length, Math.floor(z * sr)); i++) { e += d[i] * d[i]; df += (d[i] - d[i - 1]) ** 2; } return df / (e + 1e-12); };
  // the kick's pitch at a moment: zero crossings in a short window
  const hz = (d, sr, at) => { const a = Math.floor(at * sr), n = Math.floor(0.012 * sr); let z = 0; for (let i = a + 1; i < a + n; i++) if ((d[i - 1] < 0) !== (d[i] < 0)) z++; return z / 2 / 0.012; };
  it('everything new at its default: the very same kick as 1.0 (and an old saved kit gets the defaults)', async () => {
    const r = rig(); r.edit(0, { tone: 0.3 }); const a = ch(await r.c.render(0));
    r.edit(0, { curve: 0.5, nlen: 1, clen: 1, filter: 0 }); const b = ch(await r.c.render(0));
    let diff = 0; for (let i = 0; i < a.length; i++) diff = Math.max(diff, Math.abs(a[i] - b[i])); assert.lt(diff, 1e-6);
    const s = JSON.parse(JSON.stringify(r.c.internals.slots)).map(x => { ['curve', 'nlen', 'clen', 'filter'].forEach(k => delete x[k]); return x; });
    r.c.loadExtra({ slots: s }); assert.equal(r.c.internals.slots[0].curve, 0.5); assert.equal(r.c.internals.slots[0].filter, 0);
  });
  it('the drop curve: low falls fast then settles, high holds then falls — the same start and end', async () => {
    const r = rig(), sr = r.U.ctx.sampleRate; r.edit(0, { pitch: 24, ptime: 0.12, tone: 0.3, snap: 0, drive: 0 });
    const at = async (c) => { r.edit(0, { curve: c }); return hz(ch(await r.c.render(0)), sr, 0.035); };
    const fast = await at(0), mid = await at(0.5), hold = await at(1);
    assert.lt(fast, mid, 'fast drop: lower by 30 ms'); assert.gt(hold, mid, 'hold: higher by 30 ms');
    r.edit(0, { curve: 0 }); const end = hz(ch(await r.c.render(0)), sr, 0.2); r.edit(0, { curve: 1 }); assert.near(hz(ch(await r.c.render(0)), sr, 0.2), end, 6, 'the same note after the drop');
  });
  it('layer lengths: a longer noise layer rings on in the snare; the pad filter: high-pass takes the kick’s low end, low-pass darkens the hat', async () => {
    const r = rig(), sr = r.U.ctx.sampleRate;
    r.edit(2, { nlen: 0.3 }); const short = energy(ch(await r.c.render(2)), 0.12, 0.4, sr); r.edit(2, { nlen: 3 }); const long = energy(ch(await r.c.render(2)), 0.12, 0.4, sr);
    assert.gt(long, short * 4, 'noise rings on');
    const k0 = energy(ch(await r.c.render(0)), 0, 0.3, sr); r.edit(0, { filter: 0.6 }); const k1 = energy(ch(await r.c.render(0)), 0, 0.3, sr); assert.lt(k1, k0 * 0.2, 'high-pass: the low end gone');
    const h0 = bright(ch(await r.c.render(3)), sr, 0, 0.05); r.edit(3, { filter: -0.5 }); const h1 = bright(ch(await r.c.render(3)), sr, 0, 0.05); assert.lt(h1, h0 * 0.5, 'low-pass: darker');
  });
  it('an edit is held to its range; velocity → tone: a soft snare is darker than a hard one only when it is on', async () => {
    const r = rig(); r.edit(0, { curve: 9, nlen: -1, filter: -7, decay: 99 }); const s = r.c.internals.slots[0];
    assert.equal(s.curve, 1); assert.equal(s.nlen, 0.1); assert.equal(s.filter, -1); assert.equal(s.decay, 8);
    const play = async (vt, vel, extra) => { const U = TH.universe(0.6), id = TH.spawn(U, 'eravos.drum-forge'), c = ctxOf(id); c.params.setMany({ velTone: vt, room: 0 });
      U.K.bus.publish('ui:slot_edit:' + id, { i: 2, patch: Object.assign({ snap: 0, noise: 1 }, extra || {}) });
      U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(id, 'out').node.connect(U.ctx.destination);
      U.K.bus.publish('note:trigger', { target: id, note: 38, velocity: vel, time: 0.05, duration: 0.1 }); return bright(ch(await TH.render(U)), U.ctx.sampleRate, 0.06, 0.25); };
    const off = (await play(0, 0.3)) / (await play(0, 1)), on = (await play(1, 0.3)) / (await play(1, 1));
    assert.near(off, 1, 0.15, 'off: velocity is only level'); assert.lt(on, off * 0.8, 'on: soft is darker');
    const withF = (await play(1, 0.3, { filter: 0.2 })) / (await play(1, 1, { filter: 0.2 })); assert.lt(withF, off * 0.8, 'and still with the pad’s own filter on (they chain)');
  });
  it('performs: four macros and the Motion / Perform settings', () => {
    const d = OrganismFactory.def('eravos.drum-forge'); ['m1', 'm4', '_motion', '_perform', 'velTone'].forEach(k => assert.ok(d.config.some(c => c.key === k), k));
    assert.ok(window.MusicMotion.performs(d));
  });
});
