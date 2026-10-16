/* P42 · Her voice in the songs — data/her-voice.js (the store, her phrases, where they go) + data/her-edm-songbook.js
 * (EDM in her keys, with room for her). The voice here is synthetic: her recordings never live in the repository. */
window.__phase = 'P42';
describe('P42 · Her voice', () => {
  const SR = 48000, LENS = [0.6, 2.2, 0.9, 3.1, 1.1, 1.8];   // seconds of "speech", 0.6 s of silence between
  function fakeVoice() {   // a 150 Hz buzz with a syllable wobble, like a spoken line — then the silences
    const total = LENS.reduce((a, b) => a + b + 0.6, 0.5), buf = new OfflineAudioContext(1, 1, SR).createBuffer(1, Math.ceil(total * SR), SR), d = buf.getChannelData(0), at = [];
    let t = 0.5;
    LENS.forEach(L => { at.push([t, t + L]); for (let i = Math.floor(t * SR); i < Math.floor((t + L) * SR); i++) { const x = i / SR; d[i] = 0.3 * Math.sin(2 * Math.PI * 150 * x) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 4 * x)) * Math.min(1, (x - t) * 50, (t + L - x) * 50); } t += L + 0.6; });
    return { ab: AudioRecorder.encodeWAV(buf, 16), at };
  }
  const HER = ['her-festival', 'her-progressive', 'her-trance', 'her-electro', 'her-melodic', 'her-bass-house', 'her-dnb', 'her-wubs'];
  const kindOf = (s) => s.kind || s.name.replace(/\s*\d+$/, '');

  it('her phrases are found between the silences (within 30 ms)', async () => {
    const { ab, at } = fakeVoice(), buf = await new OfflineAudioContext(1, 1, SR).decodeAudioData(ab.slice(0));
    const ph = HerVoice.phrasesOf(buf);
    assert.equal(ph.length, LENS.length, JSON.stringify(ph));
    ph.forEach(([a, b], i) => { assert.near(a, at[i][0], 0.03, 'start ' + i); assert.near(b, at[i][1], 0.03, 'end ' + i); });
  });

  it('the eight EDM genres for her: in her keys, every preset exists, a held bar before every drop, a verse for her lines', () => {
    const bad = [];
    HER.forEach(id => {
      const G = SongEngine.genres().find(g => g.id === id); if (!G) return bad.push('no genre ' + id);
      if (!G.voice) bad.push(id + ': no voice');
      G.roots.forEach(r => { if (![1, 3, 8].includes(r)) bad.push(id + ': root ' + r); });
      const check = (org, p) => [].concat(p || []).forEach(x => { const d = OrganismFactory.def(org); if (!d || !(d.presets || {})[x]) bad.push(id + ': ' + org + ' “' + x + '”'); });
      Object.values(G.parts).forEach(P => check(P.organism, P.preset)); (G.fx || []).forEach(f => check(f.organism, f.preset)); (G.mods || []).forEach(m => check(m.organism, m.preset));
      G.form.forEach((s, i) => { if (kindOf(s) === 'drop' && kindOf(G.form[i - 1] || {}) !== 'pause') bad.push(id + ': no pause before ' + s.name); });
      if (!G.form.some(s => ['verse', 'break'].includes(kindOf(s)))) bad.push(id + ': nowhere for her lines');
    });
    if (!(OrganismFactory.def('eravos.fx-eq').presets || {})['Vocal Clarity']) bad.push('fx-eq Vocal Clarity');
    if (!(OrganismFactory.def('eravos.fx-dynamics').presets || {})['Vocal Level']) bad.push('fx-dynamics Vocal Level');
    assert.equal(bad.join(' · '), '');
    assert.equal(HerEdmSongbook.songs.length, 24);
    const all = Songbook.songs(); HerEdmSongbook.songs.forEach(id => { const s = all.find(x => x.id === id); assert.ok(s && s.mood.includes('edm') && s.mood.includes('her'), id); });
  });

  it('the plan: short lines in the intro, a 1/16 stutter in the build, one line that fits the held bar, her last line in the outro', () => {
    const steps = SongEngine.generate('her-festival', 7), st = steps.find(s => s.op === 'her_voice'), bpm = st.bpm, bar = 240 / bpm;
    const rec = { hash: 'x', name: 'x', phrases: [[0.5, 1.1], [1.7, 3.9], [4.5, 5.4], [6.0, 9.1], [9.7, 10.8], [11.4, 13.2]] };
    const P = HerVoice.plan(st.sections, bpm, [rec], 7), sec = (role) => st.sections.filter(s => HerVoice.roleOf(s) === role);
    const end = st.sections.reduce((a, s) => Math.max(a, s.bar + s.bars), 0);
    P.forEach(p => assert.lt(p.startBar + p.lengthSec / bar, end + 1, 'inside the song'));
    sec('pause').forEach(S => { const p = P.find(x => x.role === 'pause' && x.startBar >= S.bar && x.startBar < S.bar + 1); assert.ok(p, 'a line in ' + S.name); assert.lt(p.lengthSec, bar, 'fits the held bar'); });
    sec('build').forEach(S => assert.equal(P.filter(x => x.role === 'chop' && x.startBar >= S.bar && x.startBar < S.bar + S.bars).length, 8, 'stutter in ' + S.name));
    assert.ok(P.some(p => p.role === 'intro'), 'intro'); assert.ok(P.some(p => p.role === 'talk'), 'verse/break'); assert.ok(P.some(p => p.role === 'outro'), 'outro');
    assert.equal(HerVoice.plan(st.sections, bpm, [], 7).length, 0, 'no recordings → nothing');
  });

  it('in ERAVOS: the song lands her phrases on the timeline, through the vocal chain — and you hear her in the held bar', async () => {
    const { ab } = fakeVoice(), G = SongEngine.genres().find(g => g.id === 'her-festival');
    const steps = SongEngine.generate('her-festival', 7), st = steps.find(s => s.op === 'her_voice'), pause = st.sections.find(s => s.kind === 'pause');
    async function run(withVoice) {
      const bar = 240 / st.bpm, U = TH.universe(bar * 1.5, { bpm: st.bpm }), n0 = U.K.faults.list().length, rid = 'test.p42.' + withVoice;
      await HerVoice.clear({ persist: false }); if (withVoice) await HerVoice.add(ab.slice(0), 'fake-her.wav', { K: U.K, persist: false });
      Recipes.register({ id: rid, label: rid, steps }); const r = await Recipes.run(rid, { K: U.K, headless: true });
      await Promise.all(Object.values(r.alias).map(id => (OrganismFactory.handle(id) || {}).ctx).filter(c => c && c.ready).map(c => c.ready));   // worklets (the vocal compressor)
      const faults = U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | ');
      const tl = OrganismFactory.handle(r.alias.tl).ctx, S = tl.serialize ? tl.serialize() : null;
      U.T.renderTicks((pause.bar - 1) * 16, pause.bar * 16, 0.05); const buf = await TH.render(U);
      return { faults, U, alias: r.alias, buf, rms: TH.rms(buf, 0.05, 0.05 + bar * 0.9) };
    }
    const on = await run(true);
    assert.equal(on.faults, '', 'faults');
    const tlState = JSON.stringify(OrganismFactory.handle(on.alias.tl).ctx.serialize());
    assert.ok(/her · pause/.test(tlState) && /her · chop/.test(tlState) && /🎤 Her voice/.test(tlState), 'her clips + lane on the timeline');
    const W = on.U.K.wires.list(); assert.ok(W.some(w => w.src.instanceId === on.alias.tl && w.dst.instanceId === on.alias.voxEq) && W.some(w => w.src.instanceId === on.alias.voxEq && w.dst.instanceId === on.alias.voxLvl), 'timeline → vocal EQ → level');
    const off = await run(false);
    assert.equal(off.faults, '', 'faults without her');
    assert.gt(TH.db(on.rms), TH.db(off.rms) + 2, `she is heard in the held bar (${TH.db(on.rms).toFixed(1)} vs ${TH.db(off.rms).toFixed(1)} dB)`);
    await HerVoice.clear({ persist: false });
  }, { timeout: 60000 });
});
