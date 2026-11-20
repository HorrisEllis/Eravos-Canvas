/* Wobble Builder (eravos.wobble-builder) — tests that travel with the tool (WB1–WB3, tools/music/tools/bass/wobble-builder/wobble-builder.spec).
 * The contract is shared (TH.toolContract). Then: live = offline (the worklet plays the very samples the offline Voice renders — the null render),
 * a knob and a slot swap reach the sound while it plays, and SYNTHESIZE makes a real tool (refusing a twin). Plain node: tests/wobble-builder.test.mjs. */
TH.toolContract('eravos.wobble-builder');

window.__phase = 'P202';
describe('Wobble Builder — live, swapped, synthesized', () => {
  const WB = () => window.WobbleBuilder;
  async function live(secs, setup, during, o) {   // the tool in an offline universe, its out to the speakers; setup(ctx) schedules notes; during: [[t, fn]]
    const U = TH.universe(secs, { bpm: 140 }), a = TH.spawn(U, 'eravos.wobble-builder'), c = OrganismFactory.handle(a).ctx;
    await c.internals.ready; assert.ok(c.internals.node(), 'its worklet is running');
    U.K.audio.chain.out.gain.value = 0;
    if (o && o.engine) c.internals.node().connect(U.ctx.destination);   // the engine itself (the canvas's port adds its own 5 Hz DC block after it, as for every tool)
    else U.K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(U.ctx.destination));
    setup(c); (during || []).forEach(([t, fn]) => U.ctx.suspend(t).then(() => { fn(c); return new Promise(r => setTimeout(r, 30)); }).then(() => U.ctx.resume()));
    return { buf: await TH.render(U), c };
  }
  const bright = (d, sr, a, b) => { let e = 0, f = 0; for (let i = Math.floor(a * sr) + 1; i < Math.floor(b * sr); i++) { e += d[i] * d[i]; f += (d[i] - d[i - 1]) ** 2; } return Math.sqrt(f / (e || 1e-12)); };
  it('live = offline: the worklet plays exactly what the Voice renders (null render ≤ −60 dB)', async () => {
    const { buf, c } = await live(1.7, (c) => { c.internals.noteOn(45, 0.9, 0.05, 0.75); c.internals.noteOn(50, 0.9, 0.9, 0.6); }, [], { engine: true });
    const s = c.internals.settings(), d = c.internals.dag(), sr = buf.sampleRate, g = 2 / sr;   // the gate opens two samples after the note (it falls first: the wobble restarts)
    const v = WB().Voice(Assemble, MusicAdapters, MusicParts, MusicContracts.contracts, sr).render(d, [{ t: 0.05 + g, dur: 0.75 - g, hz: 55 }, { t: 0.9, dur: 0.6, hz: 440 * Math.pow(2, (50 - 12 - 69) / 12) }], buf.duration, s.level, s.glide);   // the second note glides in, legato (the first is still held when it starts)
    const L = buf.getChannelData(0); let e = 0, r = 0; for (let i = 0; i < L.length; i++) { e += v.L[i] * v.L[i]; r += (L[i] - v.L[i]) ** 2; }
    const db = 10 * Math.log10(r / e + 1e-30);
    assert.ok(e > 1, 'it sounds'); assert.ok(db < -60, 'live and offline null: ' + db.toFixed(1) + ' dB');
  });
  it('a knob while it plays: Cutoff up mid-note makes it brighter, at once, no rebuild', async () => {
    const { buf } = await live(1.4, (c) => { c.params.set('depth', 0); c.internals.noteOn(45, 0.9, 0.02, 1.3); }, [[0.7, (c) => c.params.set('cutoff', 1600)]]);
    const d = buf.getChannelData(0), sr = buf.sampleRate, b1 = bright(d, sr, 0.3, 0.65), b2 = bright(d, sr, 0.8, 1.2);
    assert.ok(b2 > b1 * 1.5, 'brighter after the knob: ' + b1.toFixed(3) + ' → ' + b2.toFixed(3));
    let jump = 0, before = 0; for (let i = Math.floor(0.69 * sr); i < Math.floor(0.75 * sr); i++) jump = Math.max(jump, Math.abs(d[i] - d[i - 1])); for (let i = Math.floor(0.5 * sr); i < Math.floor(0.68 * sr); i++) before = Math.max(before, Math.abs(d[i] - d[i - 1]));
    assert.ok(jump < Math.max(0.3, before * 3), 'no click at the change: ' + jump.toFixed(3) + ' (the note itself ' + before.toFixed(3) + ')');
  });
  it('a slot swapped while it plays: the bitcrusher into DRIVE is heard (the chain rebuilt, cross-faded)', async () => {
    const { buf } = await live(1.4, (c) => { c.params.set('depth', 0); c.params.set('drive', 'none'); c.internals.noteOn(45, 0.9, 0.02, 1.3); }, [[0.7, (c) => { c.params.set('drive', 'bitcrusher'); c.params.set('dCrushBits', 3); c.params.set('dCrushRate', 3000); }]]);
    const d = buf.getChannelData(0), sr = buf.sampleRate, b1 = bright(d, sr, 0.3, 0.65), b2 = bright(d, sr, 0.85, 1.25);
    assert.ok(Math.abs(b2 - b1) / b1 > 0.2, 'the crusher changes it: ' + b1.toFixed(3) + ' → ' + b2.toFixed(3));
    let pk = 0; for (const x of d) pk = Math.max(pk, Math.abs(x)); assert.ok(pk < 1, 'under full scale (' + pk.toFixed(3) + ')');
  });
  it('SYNTHESIZE makes a real tool — and refuses a twin', async () => {
    if (!window.MusicNovelty) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = (window.ERAVOS_TOOLS || '../tools/') + 'music/compat/novelty.js'; s.onload = res; s.onerror = () => rej(new Error('novelty.js')); document.head.appendChild(s); });
    const keep = MadeTools.list(WB().MADE_KEY); MadeTools.save(WB().MADE_KEY, []);
    try {
      const s = Object.assign(WB().defaults(), { mouth: 'filter-ladder', mLadMode: 'bandpass 12', rate: '1/8t', drive: 'saturator-tape', dTapeDrive: 14 });
      const r = WB().make('Test Gutter', s, 140, MusicNovelty);
      assert.ok(r.ok, 'made: ' + (r.why || '')); assert.equal(r.id, 'eravos.wb-test-gutter'); assert.ok(['novel', 'CLOSE'].includes(r.verdict), r.verdict + ' · nearest ' + r.near + ' (' + r.d + ')');
      const def = OrganismFactory.def(r.id); assert.ok(def && def.made && def.made.from === 'eravos.wobble-builder', 'a tool of its own, that says where it came from');
      assert.equal(def.config.find(c => c.key === 'mouth').default, 'filter-ladder', 'its settings are its own defaults');
      const U = TH.universe(0.2), inst = TH.spawn(U, r.id), mc = OrganismFactory.handle(inst).ctx; await mc.internals.ready;
      assert.equal(mc.params.get('dTapeDrive'), 14, 'it opens as it was made'); assert.ok(mc.internals.node(), 'it plays on the same engine');
      const again = WB().make('Test Gutter', s, 140, MusicNovelty);
      assert.ok(!again.ok && /again/.test(again.why), 'the same one again is refused: ' + again.why);
      assert.equal(WB().made().length, 1, 'kept once');
    } finally { MadeTools.save(WB().MADE_KEY, keep); }
  });
});
