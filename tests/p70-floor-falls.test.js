/* 3.70 — James, 2026-10-24: "more floor falls out and raven drop. curves and deep bass drops," */
window.__phase = 'P70';
describe('🕳 Floor Falls: more Floor Falls Out and Raven Drop — curves and deep drops (3.70)', () => {
  const G = () => SongEngine.genres().find(g => g.id === 'hd-floor-falls');
  const gen = (seed) => { const st = SongEngine.generate('hd-floor-falls', seed); return st.steps || st; };
  it('eight songs on the 💥 Heavy Drops shelf, every preset real, each move twice', () => {
    assert.ok(G(), 'genre'); assert.equal(window.FloorFallsSongbook.songs.length, 8);
    const bad = []; [].concat(Object.values(G().parts), G().fx, G().mods).forEach(p => { const d = OrganismFactory.def(p.organism); if (!d) return bad.push(p.organism); [].concat(p.preset || []).forEach(n => { if (!(d.presets || {})[n]) bad.push(p.organism + ' "' + n + '"'); }); });
    assert.equal(bad.join(' · '), '');
    const songs = window.FloorFallsSongbook.songs.map(id => Songbook.all().find(x => x.id === id)); assert.ok(songs.every(Boolean));
    assert.ok(songs.every(s => Songbook.categoryOf(s) === 'heavy'));
    const count = {}; songs.forEach(s => { count[s.move] = (count[s.move] || 0) + 1; }); assert.deepEqual(count, { falls: 2, stairs: 2, freefall: 2, rises: 2 });
  });
  it('deep that is heard: the sub plays its real note (Octave 0) and no dive goes under ~18 Hz', () => {
    [7001, 7002, 7003, 7004].forEach(seed => {
      const steps = gen(seed), cf = steps.find(s => s.op === 'configure' && s.target === 'sub'); assert.equal(cf.params.octave, 0, 'Octave 0');
      const sub = steps.filter(s => s.topic === 'clip_add' && s.payload.target === '@sub').flatMap(c => c.payload.notes);
      const lowest = Math.min(...sub.map(n => n.n + Math.min(0, n.b ? Math.min(n.b.from, n.b.to) : 0)));
      assert.ok(lowest >= 14, `seed ${seed}: the lowest pitch any sub note reaches is MIDI ${lowest} (≥ 14 ≈ 18 Hz)`);
    });
  });
  it('a move per song: falls · stairs (four steps down) · freefall (Pitch curves bend everything down) · rises (out of the floor)', () => {
    const pause = (seed) => gen(seed).filter(s => s.topic === 'clip_add' && s.payload.target === '@sub' && /pause$/.test(s.payload.name))[0].payload.notes;
    assert.equal(pause(7001).length, 1); assert.ok(pause(7001)[0].b.to < 0, 'falls');
    assert.equal(pause(7002).length, 4, 'stairs: four steps'); assert.ok(pause(7002).every((n, i, a) => !i || n.n < a[i - 1].n), 'each lower');
    const ff = gen(7003).filter(s => s.topic === 'lane_add' && s.payload.kind === 'auto' && s.payload.name === 'Freefall'); assert.equal(ff.length, 2, 'Wobble and Reese freefall curves');
    assert.ok(ff.every(l => Math.min(...l.payload.points.map(p => p[1])) === -12));
    assert.ok(pause(7004)[0].b.from < 0 && pause(7004)[0].b.to === 0, 'rises: from under the floor up to the note');
  });
  it('drop 2 is Raven Drop’s: the Reese “Her Drop” talks, opens every phrase, ripples', () => {
    const steps = gen(7005), reese = steps.filter(s => s.topic === 'clip_add' && s.payload.target === '@reese');
    assert.equal(reese.length, 1, 'only in drop 2'); assert.ok(/drop 2/.test(reese[0].payload.name));
    assert.ok(reese[0].payload.notes.some(n => n.b && n.b.osc), 'it talks (oscillating notes)');
    assert.equal(steps.find(s => s.op === 'mount' && s.organism === 'eravos.reese-bass').preset, 'Her Drop (dubstep reese)');
    const auto = steps.filter(s => s.topic === 'lane_add' && s.payload.kind === 'auto').map(s => s.payload);
    const opens = auto.find(l => l.name === 'Reese opens'); assert.ok(opens && opens.points.length >= 8, 'the filter opens every 4 bars');
    const rip = auto.find(l => l.target === '@reese' && l.key === '@pitch'); assert.ok(rip && rip.osc && rip.osc.rate === '1/2', 'Ripples');
  });
  it('it writes into a session with no fault, and the pause + drop put far less energy under 20 Hz than Floor Falls Out', async () => {
    async function under20(genre, seed) {
      const U = TH.universe(5.2, { bpm: 144 }), rec = Recipes.get('eravos.recipe.engine.' + genre), n0 = U.K.faults.list().length; rec._pinned = seed;
      await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
      const faults = U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message);
      const tl = OrganismFactory.handle(U.K.registry.byOrganism('eravos.timeline')[0].instance_id).ctx, pause = tl.internals.markers.find(m => m.name === 'pause').bar;
      const sd = 60 / 144 / 4, s0 = (pause - 1) * 16;
      for (let k = 0; k < 44; k++) { const t = 0.1 + k * sd; U.ctx.suspend(Math.max(0, Math.floor((t - 0.03) * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate)).then(() => { U.T.renderTicks(s0 + k, s0 + k + 1, t); U.ctx.resume(); }); }
      const buf = await TH.render(U), L = buf.getChannelData(0), R = buf.getChannelData(1), sr = buf.sampleRate, k = 1 - Math.exp(-2 * Math.PI * 20 / sr);
      let l1 = 0, l2 = 0, inf = 0, all = 0; for (let i = 0; i < L.length; i++) { const m = (L[i] + R[i]) / 2; l1 += k * (m - l1); l2 += k * (l1 - l2); if (i > sr * 0.3) { inf += l2 * l2; all += m * m; } }
      U.K.registry.list().forEach(x => { try { OrganismFactory.close(x.instance_id); } catch (e) {} });
      return { share: inf / all, faults, rms: TH.db(Math.sqrt(all / L.length)) };
    }
    const ffo = await under20('hd-heavy-drops', 5901), ff = await under20('hd-floor-falls', 7001);
    assert.equal(ff.faults.join(' | '), '', 'no fault');
    assert.gt(ff.rms, -40, 'it sounds');
    assert.lt(ff.share, ffo.share / 3, `energy under 20 Hz: ${(100 * ff.share).toFixed(1)} % vs Floor Falls Out ${(100 * ffo.share).toFixed(1)} %`);
  });
});
