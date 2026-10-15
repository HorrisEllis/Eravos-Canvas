/* 3.34 §E — the mixer layer (K.audio.strip / lines) and the Mixer tool */
window.__phase = 'P21';
describe('mixer: strips, lines, sends, solo (3.34)', () => {
  function probe() {
    if (OrganismFactory.def('eravos.tone-probe')) return;
    OrganismFactory.define({ id: 'eravos.tone-probe', domain: 'music', label: 'tone', category: 'Test', permissions: ['audio_out', 'bus_publish', 'bus_subscribe'], hooks: [OrganismSDK.STD.audio_out('tp.hook.out')], config: [{ key: 'f', type: 'number', default: 440, min: 20, max: 4000 }],
      engine(ctx) { const o = ctx.ac.createOscillator(), g = ctx.ac.createGain(); g.gain.value = 0.2; o.frequency.value = ctx.params.get('f'); o.connect(g); o.start(); ctx.track(o); ctx.track(g); ctx.port('out', { kind: 'audio', direction: 'out', node: g }); return {}; } });
  }
  async function mixRender(setup) {
    probe(); const U = TH.universe(0.5); const a = TH.spawn(U, 'eravos.tone-probe'), b = TH.spawn(U, 'eravos.tone-probe', { config: { f: 660 } });
    if (setup) setup(U, a, b);
    const buf = await TH.render(U); return { buf, U, a, b, L: TH.rms(buf, 0.2, 0.5, 0), R: TH.rms(buf, 0.2, 0.5, 1) };
  }
  it('fader = the tool’s trim (title-bar volume, Settings and Mixer are one control)', async () => {
    const base = await mixRender();
    const r = await mixRender((U, a, b) => { U.K.audio.strip(a, 'out').set({ db: -60 }); U.K.audio.strip(b, 'out').set({ db: -12 }); });
    assert.equal(r.U.K.audio.getTrim(r.b).db, -12);
    const ratio = r.L / base.L; assert.ok(ratio > 0.1 && ratio < 0.4, 'only b at −12 dB remains, ratio ' + ratio.toFixed(3));
  });
  it('pan hard left empties the right channel', async () => {
    const r = await mixRender((U, a, b) => { U.K.audio.strip(a, 'out').set({ pan: -1 }); U.K.audio.strip(b, 'out').set({ pan: -1 }); });
    assert.ok(r.R < r.L * 0.02, `R ${r.R} vs L ${r.L}`);
  });
  it('solo: only soloed strips are heard; EQ low cut removes a low tone', async () => {
    const base = await mixRender();
    const r = await mixRender((U, a) => U.K.audio.strip(a, 'out').set({ solo: true }));
    const onlyA = await mixRender((U, a, b) => U.K.audio.strip(b, 'out').set({ mute: true }));
    assert.ok(Math.abs(r.L - onlyA.L) / onlyA.L < 0.05 && r.L < base.L * 0.9, 'solo a = a alone');
    const cut = await mixRender((U, a, b) => { U.K.audio.strip(b, 'out').set({ mute: true }); U.K.audio.strip(a, 'out').set({ lowCut: 600 }); });
    assert.ok(cut.L < onlyA.L * 0.6, 'a 440 Hz tone under a 600 Hz low cut is much quieter: ' + (cut.L / onlyA.L).toFixed(3));
  });
  it('a GROUP line takes assigned strips; its fader moves them all; removing it sends them home', async () => {
    const g = await mixRender((U, a, b) => { const id = U.K.audio.lines.add({ kind: 'group' }); U.K.audio.strip(a, 'out').set({ line: id }); U.K.audio.strip(b, 'out').set({ line: id }); U.K.audio.lines.set(id, { db: -60 }); });
    assert.ok(g.L < 0.002, 'group at −60 dB silences both, rms ' + g.L);
    const back = await mixRender((U, a, b) => { const id = U.K.audio.lines.add({ kind: 'group' }); U.K.audio.strip(a, 'out').set({ line: id }); U.K.audio.lines.set(id, { db: -60 }); U.K.audio.lines.remove(id); });
    const base = await mixRender(); assert.ok(Math.abs(back.L - base.L) / base.L < 0.05, 'home again after the line is removed');
  });
  it('an AUX send adds that line (plain aux, send 1 = +6 dB of the same signal)', async () => {
    const only = await mixRender((U, a, b) => U.K.audio.strip(b, 'out').set({ mute: true }));
    const s = await mixRender((U, a, b) => { U.K.audio.strip(b, 'out').set({ mute: true }); const id = U.K.audio.lines.add({ kind: 'aux', fx: 'plain' }); U.K.audio.strip(a, 'out').set({ sends: { [id]: 1 } }); });
    const r = s.L / only.L; assert.ok(r > 1.7 && r < 2.3, 'doubled, ratio ' + r.toFixed(2));
  });
  it('mixState → loadMix round-trips lines and strips', () => {
    probe(); const U = TH.universe(0.1); const a = TH.spawn(U, 'eravos.tone-probe');
    const id = U.K.audio.lines.add({ kind: 'aux', fx: 'echo', name: 'Throw' }); U.K.audio.strip(a, 'out').set({ pan: 0.4, sends: { [id]: 0.5 } });
    const m = JSON.parse(JSON.stringify(U.K.audio.mixState()));
    U.K.audio.loadMix(null); assert.equal(U.K.audio.lines.list().length, 0);
    U.K.audio.loadMix(m); const L = U.K.audio.lines.list(); assert.equal(L.length, 1); assert.equal(L[0].name, 'Throw');
    const st = U.K.audio.strip(a, 'out').get(); assert.equal(st.pan, 0.4); assert.equal(st.sends[L[0].id], 0.5);
  });
  it('the Mixer tool lists a strip for every sound and its ui hooks drive the layer', async () => {
    probe(); const U = TH.universe(0.1); const a = TH.spawn(U, 'eravos.tone-probe'); const mx = TH.spawn(U, 'eravos.mixer');
    const ctx = OrganismFactory.handle(mx).ctx;
    assert.ok(ctx.internals.strips().some(s => s.inst === a), 'strip appears by itself');
    U.K.bus.publish('ui:strip_set:' + mx, { inst: a, port: 'out', patch: { db: -6, pan: -0.5 } });
    assert.equal(U.K.audio.getTrim(a).db, -6); assert.equal(U.K.audio.strip(a).get().pan, -0.5);
    U.K.bus.publish('ui:line_add:' + mx, { kind: 'group' }); assert.equal(U.K.audio.lines.list().length, 1);
    assert.ok(ctx.internals.lines().some(l => l.id === 'reverb') && ctx.internals.lines().some(l => l.id === 'echo'), 'built-in returns listed');
    const sx = ctx.saveExtra(); assert.ok(sx.mix && sx.mix.lines.length === 1, 'the mix is the Mixer’s snapshot (undo)');
  });
});
