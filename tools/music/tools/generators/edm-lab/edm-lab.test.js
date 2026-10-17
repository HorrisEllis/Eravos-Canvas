/* EDM Lab (eravos.edm-lab) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.edm-lab');

window.__phase = 'P44';
describe('EDM Lab 4.0 — the groove workstation', () => {
  const lab = (o) => { const U = TH.universe((o && o.sec) || 0.2, { bpm: 120 }), a = TH.spawn(U, 'eravos.edm-lab'), c = OrganismFactory.handle(a).ctx; return { U, a, c }; };
  it('the lead is its own out port and sounds when switched on', async () => {
    const { U, a, c } = lab({ sec: 3 }); c.params.set('leadOn', true);
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'lead').node.connect(U.ctx.destination);
    let n = 0; U.K.bus.subscribe('org:lead_note:' + a, () => n++);
    U.T.renderTicks(0, 32, 0.1); const b = await TH.render(U);
    assert.gt(n, 4, 'lead notes played'); assert.gt(TH.db(TH.rms(b, 0.2, 3)), -60, 'lead port non-silent');
  });
  it('every bass style stays in the song key, and every lead style too', () => {
    const { U, c } = lab(), k = U.K.music.key;
    ['follow kick', 'offbeat', 'rolling', 'octave pump', 'half-time', 'wobble', 'acid'].forEach(st => { c.params.set('bassStyle', st); let n = 0;
      for (let bar = 0; bar < 4; bar++) for (let s = 0; s < 16; s++) { const b = c.bassAt(bar, s); if (b) { n++; assert.ok(MusicTheory.inScale(b.midi, k.root, k.scale), st + ' ' + b.midi); } }
      assert.gt(n, 0, st + ' plays'); });
    c.params.set('leadOn', true);
    ['arp up', 'arp down', 'arp up-down', 'random', 'hook', 'chord tones'].forEach(st => { c.params.set('leadStyle', st); let n = 0;
      for (let bar = 0; bar < 4; bar++) for (let s = 0; s < 16; s++) { const l = c.leadAt(bar, s); if (l) { n++; assert.ok(MusicTheory.inScale(l.midi, k.root, k.scale), st + ' ' + l.midi); } }
      assert.gt(n, 0, st + ' plays'); });
  });
  it('hook: the same 2-bar phrase every time round', () => {
    const { c } = lab(); c.params.set('leadStyle', 'hook'); c.params.set('progression', 'i (drone)');
    const bars = (b) => Array.from({ length: 16 }, (_, s) => { const l = c.leadAt(b, s); return l ? l.midi : '-'; }).join(',');
    assert.equal(bars(0), bars(2)); assert.equal(bars(1), bars(5));
  });
  it('patterns: chain A·B plays A on bars 1–2 and B on bars 3–4; copy A → C is exact', () => {
    const { U, a, c } = lab();
    c.internals.patterns.B = c.internals.presetMap('house');
    const row = (bar) => Array.from({ length: 16 }, (_, s) => c.hits(bar, s)[0] > 0 ? 1 : 0).join('');
    c.params.set('pattern', 'B'); const b2 = row(2); c.params.set('pattern', 'A'); const a0 = row(0);
    c.params.set('chain', 'A·B'); assert.equal(row(0), a0); assert.equal(row(2), b2);
    U.K.bus.publish('ui:pattern_copy:' + a, { to: 'C' }); assert.equal(JSON.stringify(c.internals.patterns.C), JSON.stringify(c.internals.patterns.A));
  });
  it('mute and solo: a muted lane is not printed and not in the MIDI file', () => {
    const { U, a, c } = lab(); U.K.bus.publish('ui:lane:' + a, { i: 0, key: 'mute', value: true });
    assert.ok(c.internals.lanes[0].mute);
    const bytes = c.midi(2), txt = Array.from(bytes); assert.equal(String.fromCharCode(...txt.slice(0, 4)), 'MThd');
    // no note-on for GM kick (36) on channel 10 (0x99)
    let kicks = 0; for (let i = 0; i < txt.length - 1; i++) if (txt[i] === 0x99 && txt[i + 1] === 36) kicks++;
    assert.equal(kicks, 0);
  });
  it('⤓ MIDI: a valid type-1 file whose drum notes are exactly the lab hits', () => {
    const { c } = lab(); const b = Array.from(c.midi(4));
    assert.equal(String.fromCharCode(...b.slice(0, 4)), 'MThd'); assert.equal(b[9], 1); assert.gt(b[11], 3);   // type 1, ≥ 4 tracks
    let ons = 0; for (let i = 0; i < b.length - 2; i++) if (b[i] === 0x99 && b[i + 2] > 0) ons++;
    let hits = 0; for (let bar = 0; bar < 4; bar++) for (let s = 0; s < 16; s++) hits += c.hits(bar, s).filter(v => v > 0).length;
    assert.equal(ons, hits);
  });
  it('a 4-bar build: DROP armed in bar 1 → impact on bar 6, the last beat of bar 5 silent', () => {
    const { U, a, c } = lab(); let dropT = null; U.K.bus.subscribe('edm:drop-fired', p => { dropT = p.time; });
    const hitsAt = {}; U.K.bus.subscribe('org:hits:' + a, h => { hitsAt[Math.round((h.time - 0.1) / 0.125)] = true; });
    c.params.set('buildBars', 4); U.T.renderTicks(0, 3, 0.1); c.armDrop(); U.T.renderTicks(3, 16 * 7, 0.1 + 3 * 0.125);
    assert.near(dropT, 0.1 + 80 * 0.125, 1e-9);
    [76, 77, 78, 79].forEach(s => assert.ok(!hitsAt[s], 'silent step ' + s));
  });
  it('song arrangement: intro · build · drop (fires edm:drop-fired on bar 17) · break', () => {
    const { U, a, c } = lab(); c.params.set('arrange', 'song'); const secs = []; let dropT = null;
    U.K.bus.subscribe('org:section:' + a, s => secs.push(s.section)); U.K.bus.subscribe('edm:drop-fired', p => { dropT = p.time; });
    U.T.renderTicks(0, 16 * 32, 0.1);
    assert.deepEqual(secs.filter((x, i) => x !== secs[i - 1]).slice(0, 4), ['intro', 'build', 'drop', 'break']);
    assert.near(dropT, 0.1 + 16 * 16 * 0.125, 1e-9);
  });
  it('every kit and every shipped preset makes sound', async () => {
    const d = OrganismFactory.def('eravos.edm-lab');
    for (const kit of d.config.find(x => x.key === 'kit').options) {
      const U = TH.universe(2, { bpm: 120 }), a = TH.spawn(U, 'eravos.edm-lab'), c = OrganismFactory.handle(a).ctx; c.params.set('kit', kit);
      U.T.renderTicks(0, 16, 0.1); const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.1, 2)), -50, kit);
    }
    for (const n of Object.keys(d.presets)) {
      const U = TH.universe(2, { bpm: 120 }), a = TH.spawn(U, 'eravos.edm-lab'), c = OrganismFactory.handle(a).ctx; c.presets.load(n);
      U.T.renderTicks(0, 16, 0.1); const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.1, 2)), -50, n);
    }
  }, { timeout: 120000 });
});
