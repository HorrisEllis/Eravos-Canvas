/* eravos.embodiment-lab — spec domains/music/tools/embodiment/embodiment-lab/embodiment-lab.spec */
window.__phase = 'P20';
describe('eravos.embodiment-lab (Embodiment Lab)', () => {
  const ctxOf = (id) => OrganismFactory.handle(id).ctx;
  async function run(sec, setup) {
    const U = TH.universe(sec, { bpm: 120 }); const a = TH.spawn(U, 'eravos.embodiment-lab'), c = ctxOf(a);
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'out').node.connect(U.ctx.destination);
    if (setup) setup(c, U, a); c.params.set('fade', 1); c.begin(0.01); c.scheduleAhead(sec);
    return { buf: await TH.render(U), c };
  }
  it('after Begin it sounds, under the ceiling', async () => {
    const { buf } = await run(4); assert.gt(TH.db(TH.rms(buf, 1.5, 4)), -45); assert.lt(TH.peak(buf, 0, 4), 0.9);
  }, { timeout: 30000 });
  it('the breath period matches in + hold + out + rest', async () => {
    const { buf } = await run(14, (c) => { ['pulse', 'drift', 'stereo', 'space'].forEach(k => c.params.set(k, 0)); c.params.set('breathDepth', 1); c.params.set('inhale', 2); c.params.set('hold', 0.5); c.params.set('exhale', 2); c.params.set('rest', 0.5); });
    const d = buf.getChannelData(0), sr = buf.sampleRate, hop = Math.round(sr * 0.05), env = [];
    for (let s = 0; s + hop < d.length; s += hop) { let q = 0; for (let i = s; i < s + hop; i++) q += d[i] * d[i]; env.push(Math.sqrt(q / hop)); }
    const mins = []; for (let i = 20; i < env.length - 10; i++) if (env[i] <= Math.min(...env.slice(i - 10, i + 11)) && (!mins.length || i - mins[mins.length - 1] > 30)) mins.push(i);
    assert.ok(mins.length >= 2, 'two breath minima'); assert.near((mins[1] - mins[0]) * 0.05, 5, 0.5);
  }, { timeout: 40000 });
  it('cues walk up the body, one per cueEvery breaths, and go out as embody:cue', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.embodiment-lab'), c = ctxOf(a), got = [];
    U.K.bus.subscribe('embody:cue', (p) => got.push(p.region));
    ['inhale', 'exhale'].forEach(k => c.params.set(k, 1)); ['hold', 'rest'].forEach(k => c.params.set(k, 0)); c.params.set('cueEvery', 1);
    c.begin(0); c.scheduleAhead(6.5);
    assert.deepEqual(got.slice(0, 4), ['feet', 'legs', 'belly', 'chest']);
  });
  it('every Feelings preset loads and renders without clipping', async () => {
    const names = Object.keys(OrganismFactory.def('eravos.embodiment-lab').presets).filter(n => n.startsWith('Feelings · '));
    assert.ok(names.length >= 11);
    for (const n of names) { const { buf } = await run(2.5, (c) => c.presets.load(n)); assert.lt(TH.peak(buf, 0, 2.5), 0.9, n); assert.gt(TH.db(TH.rms(buf, 1.2, 2.5)), -60, n + ' audible'); }
  }, { timeout: 120000 });
  it('End fades to silence', async () => {
    const U = TH.universe(5); const a = TH.spawn(U, 'eravos.embodiment-lab'), c = ctxOf(a);
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'out').node.connect(U.ctx.destination);
    c.params.set('fade', 1); c.begin(0); c.scheduleAhead(5); c.end(2);
    const buf = await TH.render(U); assert.gt(TH.db(TH.rms(buf, 1.2, 1.9)), -45); assert.lt(TH.db(TH.rms(buf, 3.6, 5)), -70);
  }, { timeout: 30000 });
});
