/* 3.35 — ⏮ restart (loop start / bar 1) + tap tempo as transport events · MIDI Map pad roles: layouts (drums, keys,
 * chords, split, perform), one-pad edits, actions (transport, markers, drop, pattern slots). Default stays as before. */
window.__phase = 'P24';
describe('restart · pad roles (3.35)', () => {
  function mockMIDI() {
    const input = { id: 'in1', name: 'DONNER StarryPad', state: 'connected', onmidimessage: null };
    const output = { id: 'out1', name: 'DONNER StarryPad', state: 'connected', send() {} };
    return { access: { inputs: new Map([['in1', input]]), outputs: new Map([['out1', output]]), onstatechange: null }, hit: (b) => input.onmidimessage({ data: new Uint8Array(b) }) };
  }
  const STARRY = [36, 38, 40, 41, 43, 45, 47, 48, 50, 52, 53, 55, 57, 59, 60, 62];   // hardware pad 1 (bottom-left) … 16
  async function rig(extra) {
    const U = TH.universe(0.3); await OrganismSDK.IDB.put('presets', 'eravos.midi-mapper', {});
    const ids = {}; (extra || []).forEach(o => { ids[o] = TH.spawn(U, o); });
    const m = TH.spawn(U, 'eravos.midi-mapper'), c = OrganismFactory.handle(m).ctx, mm = mockMIDI(); await c.connect(mm.access);
    const seen = []; ['ui:transport-restart', 'ui:transport-play', 'ui:transport-loop', 'ui:transport-tap', 'ui:marker_jump', 'ui:drop_fire', 'seq:pattern_cue', 'note:trigger'].forEach(t => U.K.bus.subscribe(t, (p) => seen.push({ t, p }), 't'));
    const cfg = (key, value) => U.K.bus.publish('ui:config_change:' + m, { key, value });
    const pad = (n) => { seen.length = 0; mm.hit([0x99, STARRY[n - 1], 100]); return seen.slice(); };
    return { U, m, c, ids, cfg, pad, seen };
  }
  it('⏮ restart: loop on → loop start, loop off → bar 1, to:start forces bar 1, play:true starts it', () => {
    const U = TH.universe(0.3), T = U.T;
    T.setLoop({ on: true, startBar: 5, endBar: 9 }); T.seek(12); U.K.bus.publish('ui:transport-restart', {}); assert.equal(T.position16, 64);
    T.seek(12); U.K.bus.publish('ui:transport-restart', { to: 'start' }); assert.equal(T.position16, 0);
    T.setLoop({ on: false }); T.seek(7); U.K.bus.publish('ui:transport-restart', {}); assert.equal(T.position16, 0);
    U.K.bus.publish('ui:transport-restart', { play: true }); assert.ok(T.playing, 'play:true starts a stopped transport'); T.stop();
  });
  it('tap tempo is a transport event: taps 500 ms apart → 120 BPM', () => {
    const U = TH.universe(0.3); U.T.setBpm(90); U.T.tap(1000); U.T.tap(1500); assert.equal(U.T.tap(2000), 120); assert.equal(U.T.bpm, 120);
  });
  it('default (drums) is unchanged: StarryPad pad 1 plays drum note 48 on the pad tool; the grid lights hardware pad 1', async () => {
    const { pad, ids, c } = await rig(['eravos.pads']); let lit = null; c.emitUI = ((o) => (n, p) => { if (n === 'pad_hit') lit = p.index; return o(n, p); })(c.emitUI);
    const got = pad(1).filter(x => x.t === 'note:trigger'); assert.equal(got.length, 1); assert.equal(got[0].p.target, ids['eravos.pads']); assert.equal(got[0].p.note, 48); assert.equal(lit, 0);
  });
  it('Perform layout: pads are transport / marker / drop / pattern buttons', async () => {
    const { pad, cfg, ids } = await rig(['eravos.sequencer']); cfg('padLayout', 'perform');
    assert.ok(pad(1).some(x => x.t === 'ui:transport-restart'), 'pad 1 restarts');
    assert.ok(pad(2).some(x => x.t === 'ui:transport-play' && x.p.toggle), 'pad 2 plays / stops');
    const l1 = pad(4).find(x => x.t === 'ui:transport-loop'), l2 = pad(4).find(x => x.t === 'ui:transport-loop'); assert.ok(l1.p.on !== l2.p.on, 'pad 4 toggles the loop');
    assert.equal(pad(6).find(x => x.t === 'ui:marker_jump').p.dir, 1); assert.ok(pad(7).some(x => x.t === 'ui:drop_fire'), 'pad 7 fires the drop');
    const cue = pad(9).find(x => x.t === 'seq:pattern_cue'); assert.equal(cue.p.slot, 'A'); assert.equal(cue.p.target, ids['eravos.sequencer']);
    assert.equal(pad(16).find(x => x.t === 'seq:pattern_cue').p.slot, 'H'); assert.ok(!pad(1).some(x => x.t === 'note:trigger'), 'no drum hits');
  });
  it('Keys / Chords / Split play the synth in the song key', async () => {
    const { pad, cfg, ids, c } = await rig(['eravos.pads', 'eravos.supersaw']), syn = ids['eravos.supersaw'], MT = MusicTheory, k = c.key || { root: 9, scale: 'minor' };
    cfg('padLayout', 'keys'); cfg('padOctave', 4);
    let n = pad(3).filter(x => x.t === 'note:trigger'); assert.equal(n.length, 1); assert.equal(n[0].p.target, syn); assert.equal(n[0].p.note, MT.degreeToMidi(3, 4, k.root, k.scale));
    cfg('padLayout', 'chords'); n = pad(1).filter(x => x.t === 'note:trigger'); assert.deepEqual(n.map(x => x.p.note), MT.chord(1, k.root, k.scale, 'triad', 4)); assert.ok(n.every(x => x.p.target === syn));
    assert.equal(pad(9).find(x => x.t === 'note:trigger').p.target, ids['eravos.pads'], 'chords layout: pads 9–16 stay drums');
    cfg('padLayout', 'split'); assert.equal(pad(1).find(x => x.t === 'note:trigger').p.target, ids['eravos.pads']); assert.equal(pad(9).find(x => x.t === 'note:trigger').p.target, syn);
  });
  it('✎ one pad: set pad 16 to Fire the drop → layout becomes Custom, saved with the mapper', async () => {
    const { U, m, pad, c } = await rig(['eravos.pads']);
    U.K.bus.publish('ui:pad_role:' + m, { index: 15, role: { kind: 'action', action: 'drop' } });
    assert.equal(c.params.get('padLayout'), 'custom'); assert.ok(pad(16).some(x => x.t === 'ui:drop_fire')); assert.ok(pad(1).some(x => x.t === 'note:trigger'), 'the others still drum');
    assert.equal(c.saveExtra().roles[15].action, 'drop');
    U.K.bus.publish('ui:pad_role:' + m, { index: 3, role: { kind: 'action', action: 'nope' } }); assert.equal(c.roles()[3], null, 'an unknown action is refused');
  });
  it('markers: next / previous jump the transport from where the playhead is', async () => {
    const U = TH.universe(0.3), tl = TH.spawn(U, 'eravos.timeline'), pub = (t, p) => U.K.bus.publish('ui:' + t + ':' + tl, p);
    pub('marker_edit', { op: 'add', bar: 5, name: 'build' }); pub('marker_edit', { op: 'add', bar: 9, name: 'DROP' }); pub('seek', { bar: 1 });
    U.K.bus.publish('ui:marker_jump', { dir: 1 }); assert.equal(U.T.position16, 64);
    U.K.bus.publish('ui:marker_jump', { dir: 1 }); assert.equal(U.T.position16, 128);
    U.K.bus.publish('ui:marker_jump', { dir: -1 }); assert.equal(U.T.position16, 64);
    U.K.bus.publish('ui:marker_jump', { dir: -1 }); assert.equal(U.T.position16, 0, 'before the first marker → bar 1');
  });
});
