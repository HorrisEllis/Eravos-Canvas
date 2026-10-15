/* 3.34 §C — speed per tool: the master's ticks resampled per tool (sdk-music onTick) */
window.__phase = 'P21';
describe('speed per tool (3.34)', () => {
  function fakeTool(rate, ownBpm) {
    const id = 'speed-probe-' + Math.random().toString(36).slice(2, 6);
    if (!OrganismFactory.defined().some(d => d.id === 'eravos.speed-probe')) {
      OrganismFactory.define({ id: 'eravos.speed-probe', domain: 'music', label: 'probe', category: 'Test', hooks: [OrganismSDK.STD.transport_in('probe.hook.t')], config: [],
        engine(ctx) { ctx.seen = []; ctx.onTick((t) => ctx.seen.push(t)); return {}; } });
    }
    const U = TH.universe(0.2); const inst = TH.spawn(U, 'eravos.speed-probe');
    const ctx = OrganismFactory.handle(inst).ctx; ctx._U = U;
    ctx.params.set('tempoX', rate); if (ownBpm) ctx.params.set('tempoBpm', ownBpm);
    return { inst, ctx };
  }
  function run(ctx, n, bpm) {
    const stepDur = 60 / bpm / 4;
    for (let s = 0; s < n; s++) ctx._U.K.bus.publish('transport:tick', { step16: s, time: 10 + s * stepDur, bar: Math.floor(s / 16) + 1, beat: Math.floor((s % 16) / 4) + 1, sixteenth: (s % 4) + 1, stepDur, bpm });
    return ctx.seen;
  }
  it('the domain adds Speed + Own BPM to tick-driven tools only', () => {
    Kernel.audio.boot();
    const seq = OrganismFactory.defined().find(d => d.id === 'eravos.sequencer'), tl = OrganismFactory.defined().find(d => d.id === 'eravos.timeline'), ch = OrganismFactory.defined().find(d => d.id === 'eravos.channel');
    assert.ok(seq.config.some(c => c.key === 'tempoX') && seq.config.some(c => c.key === 'tempoBpm'));
    assert.ok(!tl.config.some(c => c.key === 'tempoX'), 'timeline keeps the song tempo');
    assert.ok(!ch.config.some(c => c.key === 'tempoX'), 'a tool without ticks gets nothing');
  });
  it('×1 passes the master ticks through unchanged', () => {
    const { inst, ctx } = fakeTool('1'); const seen = run(ctx, 16, 120);
    assert.equal(seen.length, 16); assert.equal(seen[5].step16, 5); OrganismFactory.close(inst);
  });
  it('×2 hears two 16ths per master 16th, evenly spaced; ½ hears every other one', () => {
    let { inst, ctx } = fakeTool('2'); let seen = run(ctx, 16, 120); const sd = 60 / 120 / 4;
    assert.equal(seen.length, 32); assert.ok(Math.abs(seen[1].time - seen[0].time - sd / 2) < 1e-9); assert.ok(Math.abs(seen[0].bpm - 240) < 1e-9);
    OrganismFactory.close(inst);
    ({ inst, ctx } = fakeTool('½')); seen = run(ctx, 16, 120);
    assert.equal(seen.length, 8); assert.ok(Math.abs(seen[1].time - seen[0].time - sd * 2) < 1e-9); assert.equal(seen[3].step16, 3);
    OrganismFactory.close(inst);
  });
  it('own BPM 70 under a 140 song is half time; ¾ lands between master ticks at exact audio times', () => {
    let { inst, ctx } = fakeTool('own', 70); const KK = ctx._U.K; KK.music.bpm = 140; let seen = run(ctx, 32, 140);
    assert.equal(seen.length, 16); assert.ok(Math.abs(ctx.bpm - 70) < 1e-9, 'ctx.bpm is the tool’s own'); OrganismFactory.close(inst);
    ({ inst, ctx } = fakeTool('¾')); ctx._U.K.music.bpm = 140; seen = run(ctx, 16, 140); const sd = 60 / 140 / 4;
    assert.equal(seen.length, 12); seen.slice(1).forEach((t, i) => assert.ok(Math.abs(t.time - seen[i].time - sd / 0.75) < 1e-9, 'even spacing'));
    OrganismFactory.close(inst); 
  });
  it('a jump (loop / seek) resyncs to the new song position', () => {
    const { inst, ctx } = fakeTool('2'); const sd = 60 / 120 / 4;
    ctx._U.K.bus.publish('transport:tick', { step16: 0, time: 1, bar: 1, beat: 1, sixteenth: 1, stepDur: sd, bpm: 120 });
    ctx._U.K.bus.publish('transport:tick', { step16: 32, time: 2, bar: 3, beat: 1, sixteenth: 1, stepDur: sd, bpm: 120 });
    assert.equal(ctx.seen[2].step16, 64, 'tool step = master step × rate after the jump'); OrganismFactory.close(inst);
  });
});
