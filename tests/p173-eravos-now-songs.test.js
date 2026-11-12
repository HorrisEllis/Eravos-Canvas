/* P173 — songs made with what ERAVOS has now. His words, 2026-11-12: "also add songs that use the new tools, automation, and full extent of
 * eravos." Six songs in three genres (ERAVOS Now · Lofi Tape / Synthwave Night / Wobble Lab), each its own variant. */
window.__phase = 'P173';
describe('P173 ERAVOS Now: six songs on the new tools, automation and the Workshop’s notes', () => {
  const NOW = () => Songbook.all().filter(s => /^now-/.test(s.genre));
  const stepsOf = (s) => SongEngine.generate(s.genre, s.seed);
  const named = (tool, name) => Object.keys((OrganismFactory.def(tool) || {}).presets || {}).includes(name);   // the names preset_load finds (a kit is not a preset)
  it('six songs on their own shelf; every tool and preset real; the new tools, curve lanes and every note feature used', () => {
    const S = NOW(); assert.equal(S.length, 6, S.map(s => s.title).join(' | ')); assert.ok(S.every(s => Songbook.categoryOf(s) === 'now'), 'on the ✨ ERAVOS Now shelf');
    assert.ok(Songbook.categories().some(c => c.id === 'now'));
    const tools = new Set(), notes = [], auto = [];
    S.forEach(s => { const st = stepsOf(s); assert.ok(st && st.length, s.title + ' generates');
      st.filter(x => x.op === 'mount').forEach(x => { tools.add(x.organism); assert.ok(OrganismFactory.def(x.organism), x.organism); if (x.preset) assert.ok(named(x.organism, x.preset), s.title + ': “' + x.preset + '” on ' + x.organism); });
      st.filter(x => x.op === 'event' && x.topic === 'clip_add').forEach(x => notes.push(...x.payload.notes));
      st.filter(x => x.op === 'event' && x.topic === 'lane_add' && x.payload.kind === 'auto').forEach(x => auto.push(s.genre + ':' + x.payload.target + ':' + x.payload.key)); });
    ['eravos.retro-dco', 'eravos.swarm-oscillator', 'eravos.tape-memory', 'eravos.wobble-bass', 'eravos.retro-poly', 'eravos.sidechain-compressor'].forEach(t => assert.ok(tools.has(t), 'uses ' + t));
    assert.gt(new Set(auto).size, 9, 'ten or more curve lanes: ' + [...new Set(auto)].join(' '));
    assert.ok(auto.some(a => /@pad:coupling/.test(a)) && auto.some(a => /@wob:depth/.test(a)) && auto.some(a => /@lead:lfoPitch/.test(a)) && auto.some(a => /:@pitch$/.test(a)), 'swarm coupling, wobble depth, DCO vibrato, a pitch riser');
    const has = (f) => notes.some(f);
    assert.ok(has(n => n.sh && n.sh.t && n.sh.t.pitch && n.b && n.b.shape === 'path'), 'pitch shapes compiled'); assert.ok(has(n => n.c && n.c.cutoff), 'knob curves per note');
    assert.ok(has(n => n.sh && Object.values(n.sh.t).some(g => (g.mods || []).some(m => (m.rate.mods || []).length || (m.depth.mods || []).length))), 'nested modulators');
    assert.ok(has(n => n.x && n.x.iv && n.x.strum), 'chords from one note'); assert.ok(has(n => n.x && n.x.cond && n.x.cond.skip) && has(n => n.x && n.x.cond && !n.x.cond.skip), 'pass conditions');
    assert.ok(has(n => n.rt > 1 && n.x && n.x.rs === 'accel') && has(n => n.rt > 1 && n.x && n.x.rs === 'decel'), 'ratchets both ways');
    assert.ok(has(n => n.x && n.x.tempo === 2) && has(n => n.pr) && has(n => n.mt) && has(n => n.x && n.x.hv) && has(n => n.p && n.p.vowelA), 'speed, chance, microtiming, humanize, a knob per note');
  });
  it('the two songs of each genre are different songs (under 80 % shared notes)', () => {
    const fp = (s) => { const st = stepsOf(s), root = (st.find(x => x.op === 'configure' && x.params && x.params.root !== undefined) || { params: { root: 0 } }).params.root, o = new Set();
      st.filter(x => x.op === 'event' && x.topic === 'clip_add').forEach(x => (x.payload.notes || []).forEach(n => o.add(x.payload.target + '|' + ((x.payload.startBar || 1) * 16 + n.s) + '|' + (((n.n - root) % 12) + 12) % 12))); return o; };
    const J = (a, b) => { let i = 0; a.forEach(x => { if (b.has(x)) i++; }); return i / (a.size + b.size - i); };
    const by = {}; NOW().forEach(s => (by[s.genre] = by[s.genre] || []).push(s));
    Object.values(by).forEach(([a, b]) => { const v = J(fp(a), fp(b)); assert.ok(v < 0.8, a.title + ' vs ' + b.title + ': ' + v.toFixed(2)); });
  });
  [['now-lofi-tape', 8102, 82, 'chorus'], ['now-synthwave-night', 8207, 105, 'drop'], ['now-wobble-lab', 8302, 145, 'drop']].forEach(([g, seed, bpm, sec]) => it(g + ': it writes with no fault and sounds in its ' + sec, async () => {
    const U = TH.universe(3.2, { bpm }), n0 = U.K.faults.list().length, rec = Recipes.get('eravos.recipe.engine.' + g); assert.ok(rec, 'a recipe for ' + g); rec._pinned = seed;
    await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
    assert.equal(U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | '), '');
    const tl = OrganismFactory.handle(U.K.registry.byOrganism('eravos.timeline')[0].instance_id).ctx, m = tl.internals.markers.find(x => x.name === sec);
    assert.ok(tl.internals.clips.some(c => c.notes && c.notes.some(n => n.sh || (n.x && n.x.iv))), 'the Workshop’s notes are in the session');
    const sd = 60 / bpm / 4, s0 = (m.bar - 1) * 16;
    for (let k = 0; k < 32; k++) { const t = 0.1 + k * sd; U.ctx.suspend(Math.max(0, Math.floor((t - 0.03) * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate)).then(() => { U.T.renderTicks(s0 + k, s0 + k + 1, t); U.ctx.resume(); }); }
    const buf = await TH.render(U); assert.gt(TH.rms(buf, 0.3, 3), 1e-3, 'it sounds');
  }));
});
