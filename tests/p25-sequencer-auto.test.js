/* 3.36 — the Sequencer drives the canvas to the beat: automation lanes (hold / glide) on any tool's knob, step knob locks,
 * step conditions + fill, seeded evolve, compact Sequencer packs (Give Your Head a Shake), Lyrics → Sequencer. */
window.__phase = 'P25';
describe('Sequencer 2.1: automation, conditions, evolve, packs (3.36)', () => {
  const pub = (U, hook, id, p) => U.K.bus.publish('ui:' + hook + ':' + id, p || {});
  function rig(secs) {
    const U = TH.universe(secs || 1); const wob = TH.spawn(U, 'eravos.wobble-bass'), s = TH.spawn(U, 'eravos.sequencer'), c = OrganismFactory.handle(s).ctx;
    const changes = []; U.K.bus.subscribe('ui:config_change:' + wob, (p) => changes.push(p), 't');
    return { U, wob, s, c, changes, read: (k) => OrganismFactory.handle(wob).ctx.params.get(k) };
  }
  const lastIdx = (c) => c.internals.tracks.length - 1;
  it('automation lane (hold): step values become the Wobble Bass cutoff on the beat', async () => {
    const { U, s, c, wob, changes, read } = rig();
    pub(U, 'track_add', s, { kind: 'auto', name: 'cut', target: wob, param: 'cutoff', mode: 'hold' }); const ti = lastIdx(c);
    pub(U, 'step_edit', s, { track: ti, step: 0, patch: { on: true, val: 0 } }); pub(U, 'step_edit', s, { track: ti, step: 2, patch: { on: true, val: 1 } });
    U.T.renderTicks(0, 4, 0.05); await TH.render(U);
    const cut = changes.filter(x => x.key === 'cutoff').map(x => x.value); assert.deepEqual(cut, [40, 8000]); assert.equal(read('cutoff'), 8000);
    assert.ok(changes.every(x => x._auto), 'marked as automation (no undo steps)');
  });
  it('automation lane (glide): slides between set steps, rising monotonically', async () => {
    const { U, s, c, wob, changes } = rig();
    pub(U, 'track_add', s, { kind: 'auto', name: 'cut', target: wob, param: 'cutoff', mode: 'glide' }); const ti = lastIdx(c);
    pub(U, 'step_edit', s, { track: ti, step: 0, patch: { on: true, val: 0 } }); pub(U, 'step_edit', s, { track: ti, step: 4, patch: { on: true, val: 1 } });
    U.T.renderTicks(0, 5, 0.05); await TH.render(U);
    const cut = changes.filter(x => x.key === 'cutoff').map(x => x.value), up = cut.slice(0, cut.indexOf(8000) + 1);
    assert.ok(up.length >= 10, 'many in-between values: ' + up.length); assert.ok(up.every((v, i) => !i || v >= up[i - 1]), 'monotonic');
  });
  it('step locks: a hit sets its instrument’s knob, the next hit without the lock puts it back', async () => {
    const { U, s, c, wob, changes, read } = rig();
    pub(U, 'track_add', s, { kind: 'melodic', name: 'wob', target: wob }); const ti = lastIdx(c);
    [0, 2].forEach(i => pub(U, 'step_edit', s, { track: ti, step: i, patch: { on: true } }));
    pub(U, 'lock_set', s, { track: ti, step: 0, key: 'lfoShape', value: 'yoy' });
    U.T.renderTicks(0, 4, 0.05); await TH.render(U);
    assert.deepEqual(changes.filter(x => x.key === 'lfoShape').map(x => x.value), ['yoy', 'sine']); assert.equal(read('lfoShape'), 'sine');
  });
  it('conditions: 1:2 plays every other pass; fill steps play only while Fill is on', () => {
    const U = TH.universe(0.3), pads = TH.spawn(U, 'eravos.pads'), s = TH.spawn(U, 'eravos.sequencer'), c = OrganismFactory.handle(s).ctx;
    pub(U, 'step_edit', s, { track: 0, step: 0, patch: { on: true, cond: '1:2' } }); pub(U, 'step_edit', s, { track: 1, step: 1, patch: { on: true, cond: 'fill' } });
    let n = { k: 0, s: 0 }; U.K.bus.subscribe('note:trigger', (p) => { if (p.note === 36) n.k++; if (p.note === 37) n.s++; }, 't');
    U.T.renderTicks(0, 64, 0.05); assert.equal(n.k, 2, 'passes 1 and 3'); assert.equal(n.s, 0, 'no fill');
    c.params.set('fill', true); n = { k: 0, s: 0 }; U.T.renderTicks(0, 64, 0.05); assert.equal(n.s, 4, 'fill on → every pass');
    pub(U, 'step_edit', s, { track: 0, step: 3, patch: { on: true, cond: 'bogus' } }); assert.ok(!c.internals.patterns.A.steps[0][3].on, 'an unknown condition is refused');
  });
  it('evolve: the first pass is as written; later passes wander in key — the same every time for the same seed', () => {
    const run = (seed) => {
      const U = TH.universe(0.3), syn = TH.spawn(U, 'eravos.supersaw'), s = TH.spawn(U, 'eravos.sequencer'), c = OrganismFactory.handle(s).ctx;
      c.params.set('seed', seed); pub(U, 'track_add', s, { kind: 'melodic', name: 'm', target: syn, evolve: 1 }); const ti = lastIdx(c);
      for (let i = 0; i < 16; i += 2) pub(U, 'step_edit', s, { track: ti, step: i, patch: { on: true, degree: 3 } });
      const notes = []; U.K.bus.subscribe('note:trigger', (p) => { if (p.target === syn) notes.push(p.note); }, 't'); U.T.renderTicks(0, 64, 0.05); return notes;
    };
    const a = run(7), b = run(7), c2 = run(8);
    assert.deepEqual(a, b, 'repeatable'); assert.ok(new Set(a.slice(0, 8)).size === 1, 'pass 1 untouched'); assert.ok(new Set(a.slice(8)).size > 1, 'later passes move');
    assert.ok(JSON.stringify(a) !== JSON.stringify(c2), 'another seed, another path');
  });
  it('pack “Give Your Head a Shake”: lanes, 7 slots, chain, fills, locks; lanes find their tools (and wait for missing ones)', () => {
    const U = TH.universe(0.3), pads = TH.spawn(U, 'eravos.pads'), wob = TH.spawn(U, 'eravos.wobble-bass'), mfx = TH.spawn(U, 'eravos.master-fx'), s = TH.spawn(U, 'eravos.sequencer'), c = OrganismFactory.handle(s).ctx;
    pub(U, 'preset_load', s, { name: 'Song · Give Your Head a Shake' });
    const T = c.internals.tracks, by = (n) => T.find(t => t.name === n);
    assert.equal(T.length, 11); assert.equal(c.internals.chain.length, 9); assert.ok(c.params.get('chainOn'));
    assert.equal(by('wobble').target, wob); assert.equal(by('wobble rate').target, wob); assert.equal(by('DJ filter').target, mfx); assert.equal(by('kick').target, pads);
    assert.equal(by('her voice').target, null, 'no Sample Player yet — the voice lane waits (never the drum pads)');
    const sp = TH.spawn(U, 'eravos.sample-player'); assert.equal(by('her voice').target, sp, 'resolves when her clip’s player appears');
    const E = c.internals.patterns.E, si = T.indexOf(by('snare')), wi = T.indexOf(by('wobble'));
    assert.equal(E.length, 64); assert.equal(E.steps[si][63].cond, 'fill'); assert.equal(E.steps[wi][20].locks.lfoShape, 'yoy');
    assert.equal(c.internals.patterns.D.name, 'pause'); assert.equal(c.internals.patterns.D.length, 8);
  });
  it('Lyrics → Sequencer: the words become lanes, 4 bars per slot, chained; her voice lane on every line start', () => {
    const U = TH.universe(0.3), pads = TH.spawn(U, 'eravos.pads'), sp = TH.spawn(U, 'eravos.sample-player'), s = TH.spawn(U, 'eravos.sequencer'), c = OrganismFactory.handle(s).ctx, ly = TH.spawn(U, 'eravos.lyric-rhythm');
    pub(U, 'send_sequencer', ly, {});
    const T = c.internals.tracks, voice = T.find(t => t.name === 'her voice'), kick = T.findIndex(t => t.name === 'words kick');
    assert.ok(voice && voice.target === sp, 'voice lane → the Sample Player'); assert.ok(kick >= 0 && c.internals.patterns.A.steps[kick].some(x => x.on), 'words kick has hits');
    const plan = OrganismFactory.handle(ly).ctx.plan(), slots = Math.min(8, Math.ceil(plan.steps / 64));
    assert.equal(c.internals.chain.length, slots); assert.ok(c.internals.patterns.A.steps[T.indexOf(voice)][0].on, 'line 1 starts with her');
  });
});
