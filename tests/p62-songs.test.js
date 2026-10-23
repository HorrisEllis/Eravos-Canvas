/* 3.62 — "add songs that use the automation, arp, etc" (2026-10-23): the 🪜 Arp & Motion songbook. */
window.__phase = 'P62';
describe('🪜 Arp & Motion: songs built from the Arp, curves and repeating clips (3.62)', () => {
  const G = () => SongEngine.genres().find(g => g.id === 'am-arp-motion');
  it('six songs on their own shelf, every preset real', () => {
    assert.ok(G(), 'genre'); assert.equal(window.ArpMotionSongbook.songs.length, 6);
    const bad = []; Object.values(G().parts).forEach(p => { const d = OrganismFactory.def(p.organism); if (!d) bad.push(p.organism); [].concat(p.preset || []).forEach(n => { if (!(d.presets || {})[n]) bad.push(p.organism + ' "' + n + '"'); }); });
    assert.equal(bad.join(' · '), '');
    window.ArpMotionSongbook.songs.forEach(id => { const s = Songbook.all().find(x => x.id === id); assert.ok(s, id); assert.equal(Songbook.categoryOf(s), 'motion', id); });
  });
  it('what a song writes: the Arp plays the pluck, its chords repeat, the curves climb through every build, the lead glides and blooms', () => {
    const st = SongEngine.generate('am-arp-motion', 6201), steps = st.steps || st, ev = (t) => steps.filter(s => s.op === 'event' && s.topic === t);
    assert.ok(steps.some(s => s.op === 'wire' && s.from[0] === 'arp' && s.to[0] === 'keys'), 'Arp → pluck wired');
    const arpClips = ev('clip_add').filter(c => c.payload.target === '@arp');
    assert.ok(arpClips.some(c => c.payload.loop === 64), 'the Arp’s chords: one turn written, repeating');
    assert.ok(arpClips.filter(c => c.payload.loop).every(c => c.payload.notes.every(n => n.s < c.payload.loop)), 'a repeating clip holds only its first turn');
    assert.ok(arpClips.some(c => !c.payload.loop), 'a section that changes in its last bar (the gap before the drop) is written out');
    const lanes = ev('lane_add').filter(l => l.payload.kind === 'auto').map(l => l.payload), by = (t, k) => lanes.find(l => l.target === t && l.key === k);
    ['octaves', 'gate', 'div'].forEach(k => assert.ok(by('@arp', k), 'Arp ' + k + ' curve'));
    assert.equal(Math.max(...by('@arp', 'octaves').points.map(p => p[1])), 3); assert.ok(by('@arp', 'div').points.some(p => p[1] === '1/8') && by('@arp', 'div').points.some(p => p[1] === '1/16'));
    assert.ok(by('@keys', 'cutoff'), 'the pluck’s filter'); assert.equal(Math.max(...by('@pad', '@pitch').points.map(p => p[1])), 12, 'the pad bends up an octave');
    const lead = ev('clip_add').filter(c => c.payload.target === '@lead').flatMap(c => c.payload.notes);
    assert.ok(lead.some(n => n.b && n.b.from < 0 && n.b.to === 0), 'glides in from below'); assert.ok(lead.some(n => n.b && n.b.osc && n.b.osc.rate === 5.5), 'a vibrato that blooms');
  });
  it('it writes into a session with no fault, and plays: the Arp steps the held chords into the pluck, its curves move it', async () => {
    const U = TH.universe(4.2, { bpm: 126 }), n0 = U.K.faults.list().length, rec = Recipes.get('eravos.recipe.engine.am-arp-motion'); rec._pinned = 6201;
    await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
    assert.equal(U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | '), '');
    const tl = OrganismFactory.handle(U.K.registry.byOrganism('eravos.timeline')[0].instance_id).ctx, arp = U.K.registry.byOrganism('eravos.arp')[0].instance_id;
    const saws = U.K.registry.byOrganism('eravos.supersaw').map(r => r.instance_id), pluck = saws.find(id => U.K.wires.list().some(w => w.src.instanceId === arp && w.dst.instanceId === id));
    assert.ok(pluck, 'the Arp is wired to a Supersaw');
    assert.equal(tl.internals.lanes.filter(l => l.kind === 'auto' && l.target === arp).length, 3, 'three curve lanes on the Arp');
    assert.ok(tl.internals.clips.some(c => c.loop), 'repeating clips in the session');
    const build = tl.internals.markers.find(m => m.name === 'build'), sent = []; U.K.bus.subscribe('note:trigger', (p) => { if (p.target === pluck) sent.push(p); if (p.target === arp) toArp.push([p.note, +p.time.toFixed(2), +p.duration.toFixed(2)]); }); const toArp = [], live = []; U.K.bus.subscribe('knob:live', (p) => { if (p.target === arp) live.push([p.key, p.value]); });
    const bar0 = build.bar + 5;   // three quarters into the build: octaves 3, rate 1/16
    // two bars, each 16th sent just ahead of its time, the way the live transport schedules (the curves land on the audio clock first)
    const sd = 60 / 126 / 4, s0 = (bar0 - 1) * 16;
    for (let k = 0; k < 32; k++) { const t = 0.1 + k * sd; U.ctx.suspend(Math.max(0, Math.floor((t - 0.03) * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate)).then(() => { U.T.renderTicks(s0 + k, s0 + k + 1, t); U.ctx.resume(); }); }
    const buf = await TH.render(U);
    assert.gt(sent.length, 16, 'the Arp plays the pluck: ' + sent.length + ' notes in two bars');
    assert.ok(live.some(x => x[0] === 'octaves' && x[1] === 3) && live.some(x => x[0] === 'div' && x[1] === '1/16'), 'the curves set the Arp: ' + JSON.stringify(live.slice(0, 4)));
    const span = Math.max(...sent.map(p => p.note)) - Math.min(...sent.map(p => p.note)); assert.gt(span, 24, `three octaves wide late in the build (${span} semitones)`);
    assert.gt(TH.rms(buf, 0.5, 4), 1e-3, 'and it sounds'); assert.gt(toArp.length, 3, 'the held chords reach the Arp');
  });
});
