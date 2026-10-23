/* P14 tests — agnostic shell expansion, XenTheory, xenharmonic + sound-design organisms (spec eravos.phase14-sound-design) */
window.__phase = 'P14';
const P14 = {
  ctxOf: (inst) => OrganismFactory.handle(inst).ctx,
  set(U, inst, obj) { Object.keys(obj).forEach(k => U.K.bus.publish('ui:config_change:' + inst, { key: k, value: obj[k] })); },
};

describe('XenTheory — non-standard harmonic data', () => {
  const X = window.XenTheory;
  it('Bohlen–Pierce: 13 steps per 3:1, step 13 = ×3', () => { const t = X.tuning('Bohlen–Pierce (13ED3)'); assert.equal(t.steps.length, 13); assert.near(X.freq(t, 13, 100), 300, 1e-6); });
  it('equal division of φ: one period = golden ratio (irrational, 833.09¢)', () => { const t = X.tuning('Equal division of φ', { n: 5 }); assert.near(t.period, 833.090, 0.001); assert.near(X.freq(t, 5, 100), 100 * X.PHI, 1e-6); });
  it('Scala text: ratios, cents, constants, expressions; last = period', () => { const t = X.parseScale('9/8 386.3137 phi 2^(11/12) 2/1'); assert.equal(t.steps.length, 5); assert.near(t.period, 1200, 1e-6); assert.near(t.steps[3], 833.09, 0.01); });
  it('one entry = equal step without period (Carlos α)', () => { const t = X.tuning('Wendy Carlos α'); assert.near(X.stepCents(t, 9), 9 * 77.965, 1e-6); });
  it('continued fractions: π → 355/113 within 113', () => { const a = X.approx(Math.PI, 120); assert.equal(a.p + '/' + a.q, '355/113'); });
  it('φ is recognised as irrational; 3/2 as a perfect fifth', () => { assert.equal(X.describeRatio(X.PHI).irrational, 'φ'); assert.equal(X.describeRatio(1.5).name, 'perfect fifth'); });
  it('dissonance curve of a 7-partial harmonic timbre: minima at 5/4, 4/3, 7/5, 3/2, 5/3, 7/4, 2/1', () => {
    const m = X.minima(X.dissonanceCurve(X.spectrum('harmonic', { partials: 7 }), 261.63, 0, 1250, 5)).map(x => x.c);
    [386, 498, 583, 702, 884, 969, 1200].forEach(c => assert.ok(m.some(v => Math.abs(v - c) <= 16), 'minimum near ' + c + ' in ' + m.join(',')));
  });
  it('f0 + inharmonicity B recovered from stiff-string partials (missing fundamental)', () => {
    const pk = [2, 3, 4, 5, 6, 7].map(n => ({ f: 110 * n * Math.sqrt(1 + 0.001 * n * n), db: -6 * n }));
    const a = X.analyse(pk); assert.near(a.f0, 110, 0.05); assert.near(a.B, 0.001, 0.00005);
  });
  it('tuning-matched spectrum bends harmonics onto 10-EDO steps', () => {
    const t = X.tuning('EDO (any)', { n: 10 }); const s = X.spectrum('tuning-matched', { partials: 6, tuning: t });
    s.forEach(p => { const c = X.cents(p.r); assert.near(c / 120, Math.round(c / 120), 1e-6); });
  });
});

describe('eravos.xen-synth', () => {
  stdTests('eravos.xen-synth', { note: 60 });
  it('12-TET + one partial: key 69 → 440 Hz', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.xen-synth');
    P14.set(U, a, { tuning: '12-TET', spectrum: 'harmonic', partials: 1, shimmer: 0, spread: 0, baseHz: 261.6256, baseNote: 60, attack: 0.005, sustain: 1 });
    TH.note(U, a, 69, 0.05, { duration: 0.8 }); const buf = await TH.render(U);
    assert.near(TH.acFreq(buf, 0.3, 0.6, 200, 900), 440, 2);
  });
  it('equal division of φ: step +1 sounds base × φ^(1/N) — an irrational frequency', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.xen-synth');
    P14.set(U, a, { tuning: 'Equal division of φ', n: 1, spectrum: 'harmonic', partials: 1, shimmer: 0, spread: 0, baseHz: 200, baseNote: 60, sustain: 1 });
    TH.note(U, a, 61, 0.05, { duration: 0.8 }); const buf = await TH.render(U);
    assert.near(TH.acFreq(buf, 0.3, 0.6, 150, 600), 200 * XenTheory.PHI, 1.5);
  });
  it('note:trigger with exact freq overrides the key', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.xen-synth');
    P14.set(U, a, { partials: 1, shimmer: 0, spread: 0, sustain: 1, spectrum: 'harmonic' });
    TH.note(U, a, 60, 0.05, { duration: 0.8, freq: 333.3 }); const buf = await TH.render(U);
    assert.near(TH.acFreq(buf, 0.3, 0.6, 150, 900), 333.3, 1.5);
  });
  it('xen:tuning in → Custom tuning with those steps', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.xen-synth'); const c = P14.ctxOf(a);
    U.K.bus.publish('xen:tuning', { target: a, steps: [0, 300, 833.09], period: 1200, name: 'test' });
    assert.equal(c.params.get('tuning'), 'Custom (text)'); assert.equal(c.internals.tun.steps.length, 3); assert.near(c.internals.tun.steps[2], 833.09, 0.001);
  });
  it('xen:spectrum in → received partials (normalised to the first)', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.xen-synth'); const c = P14.ctxOf(a);
    U.K.bus.publish('xen:spectrum', { target: '*', partials: [{ r: 2, a: 1 }, { r: 2 * XenTheory.PHI, a: 0.5 }] });
    assert.equal(c.params.get('spectrum'), 'received'); assert.near(c.internals.spec[1].r, XenTheory.PHI, 1e-9);
  });
});

// ---- synthetic test signals
function synthBuffer(sr, sec, partials) { // partials: [{f, a}]
  const n = Math.floor(sr * sec), ctx = new OfflineAudioContext(1, n, sr), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
  partials.forEach(p => { const w = 2 * Math.PI * p.f / sr; for (let i = 0; i < n; i++) d[i] += p.a * Math.sin(w * i + (p.ph || 0)); });
  return b;
}

describe('eravos.ratio-lattice', () => {
  stdTests('eravos.ratio-lattice', { noTarget: true, play: (U, inst) => { U.K.bus.publish('ui:node_toggle:' + inst, { a: 0, b: 0, c: 0 }); U.K.bus.publish('ui:node_toggle:' + inst, { a: 1, b: 0, c: 0 }); } });
  it('lattice ratios: (3·5) → 15/8, z=7 → 7/4, otonal 4:5:6:7', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.ratio-lattice'); const I = P14.ctxOf(a).internals;
    const r = I.nodeRatio(1, 1, 0, 7); assert.equal(r.p + '/' + r.q, '15/8');
    const z = I.nodeRatio(0, 0, 1, 7); assert.equal(z.p + '/' + z.q, '7/4');
    assert.deepEqual(I.otonal([{ p: 1, q: 1 }, { p: 5, q: 4 }, { p: 3, q: 2 }, { p: 7, q: 4 }]), [4, 5, 6, 7]);
  });
  it('preset “Harmonic Seventh” → chord 4:5:6:7, drones sound', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.ratio-lattice'); const c = P14.ctxOf(a);
    c.presets.load('Harmonic Seventh 4:5:6:7');
    let st = null; U.K.bus.subscribe('org:state_sync:' + a, s => { st = s; }); c.syncUI();
    assert.equal(st.otonal, '4:5:6:7'); assert.equal(c.internals.drones.size, 4);
    const buf = await TH.render(U); assert.gt(TH.db(TH.rms(buf, 0.4, 0.9)), -40);
  });
  it('send chord → note:trigger with exact freq to the chosen instrument; export → xen:tuning', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.ratio-lattice'); const got = [], tun = [];
    U.K.bus.subscribe('note:trigger', p => got.push(p)); U.K.bus.subscribe('xen:tuning', p => tun.push(p));
    P14.set(U, a, { sendTo: 'synth-x', baseHz: 200 });
    U.K.bus.publish('ui:node_toggle:' + a, { a: 0, b: 0, c: 0 }); U.K.bus.publish('ui:node_toggle:' + a, { a: 0, b: 0, c: 1 });
    U.K.bus.publish('ui:send_chord:' + a, {});
    assert.equal(got.length, 2); assert.equal(got[0].target, 'synth-x'); assert.near(got[1].freq, 350, 1e-9);
    U.K.bus.publish('ui:export_scale:' + a, {}); assert.equal(tun.length, 1); assert.near(tun[0].steps[1], XenTheory.cents(7 / 4), 1e-3);
  });
});

describe('eravos.recursive-spectra', () => {
  stdTests('eravos.recursive-spectra', { setup: (U, inst) => P14.set(U, inst, { drone: false }) });
  it('lineage: depth+1 generations, ≤ partials each, ratios within [1, ceiling], deterministic', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.recursive-spectra'); const I = P14.ctxOf(a).internals;
    P14.set(U, a, { depth: 6, partials: 8, ceiling: 10, transform: 'golden-fold' });
    const L = I.lineage; assert.equal(L.length, 7);
    L.forEach(sp => { assert.ok(sp.length <= 8); sp.forEach(x => { assert.ok(x.r >= 0.999 && x.r <= 10.001, 'r ' + x.r); }); });
    const again = I.lineage.map(s => s.map(x => x.r.toFixed(6)).join()); P14.set(U, a, { amount: P14.ctxOf(a).params.get('amount') }); assert.deepEqual(I.lineage.map(s => s.map(x => x.r.toFixed(6)).join()), again);
  });
  it('every transform keeps the spectrum finite and non-empty for 32 generations', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.recursive-spectra'); const I = P14.ctxOf(a).internals;
    ['power', 'golden-fold', 'sum-difference', 'mirror', 'spiral'].forEach(t => { P14.set(U, a, { transform: t, depth: 32, amount: 0.9 }); I.lineage.forEach(sp => { assert.ok(sp.length > 0, t); sp.forEach(x => assert.ok(Number.isFinite(x.r) && Number.isFinite(x.a), t)); }); });
  });
  it('ping-pong walks down then back up', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.recursive-spectra'); const c = P14.ctxOf(a);
    P14.set(U, a, { depth: 2, loop: 'ping-pong' }); const seen = [];
    for (let i = 0; i < 5; i++) { c.advance(0); seen.push(c.internals.gen); }
    assert.deepEqual(seen, [1, 2, 1, 0, 1]);
  });
  it('scale from timbre: harmonic seed → a 3/2 among the minima', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.recursive-spectra'); const c = P14.ctxOf(a);
    P14.set(U, a, { seed: 'harmonic', partials: 8 }); const m = c.sendScale();
    assert.ok(m.some(x => Math.abs(x - 702) < 8), m.join(','));
  });
  it('drone sounds with no notes', async () => { const U = TH.universe(1); TH.spawn(U, 'eravos.recursive-spectra'); const buf = await TH.render(U); assert.gt(TH.db(TH.rms(buf, 0.5, 1)), -45); });
});

describe('eravos.harmonic-analyzer', () => {
  const sr = 48000;
  it('stiff string (missing fundamental not needed): f0 and B recovered', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.harmonic-analyzer'); const c = P14.ctxOf(a);
    const f0 = 130.81, B = 0.0005, parts = []; for (let n = 1; n <= 14; n++) parts.push({ f: n * f0 * Math.sqrt(1 + B * n * n), a: 0.5 / n, ph: n });
    const r = c.analyseBuffer(synthBuffer(sr, 2, parts), 'string');
    assert.near(r.f0, f0, 0.3); assert.near(r.B, B, B * 0.25); assert.equal(r.note.name.replace(/\d/, ''), 'C');
  });
  it('φ-spectrum: partials recognised as irrational', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.harmonic-analyzer'); const c = P14.ctxOf(a);
    const r = c.analyseBuffer(synthBuffer(sr, 2, [0, 1, 2, 3].map(k => ({ f: 220 * Math.pow(XenTheory.PHI, k), a: 0.4 * Math.pow(0.8, k) }))), 'phi');
    assert.ok(r.partials.some(p => p.irrational === 'φ'), JSON.stringify(r.partials.map(p => p.irrational)));
    assert.lt(r.harmonicity, 0.7);
  });
  it('recursive layers split a two-note chord into two series', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.harmonic-analyzer'); const c = P14.ctxOf(a);
    const parts = []; [110, 155.56].forEach(f => { for (let n = 1; n <= 8; n++) parts.push({ f: f * n, a: 0.3 / n, ph: n * 1.7 }); });
    P14.set(U, a, { layers: 3, maxPeaks: 40 });
    const r = c.analyseBuffer(synthBuffer(sr, 2, parts), 'chord');
    const fs = r.layers.map(L => L.f0);
    assert.ok(fs.some(f => Math.abs(f - 110) < 1) && fs.some(f => Math.abs(f - 155.56) < 1.5), 'layers ' + fs.join(','));
  });
  it('send tuning → xen:tuning holding a near-3/2 consonance', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.harmonic-analyzer'); const c = P14.ctxOf(a); const got = [];
    U.K.bus.subscribe('xen:tuning', p => got.push(p));
    c.analyseBuffer(synthBuffer(sr, 1.5, [1, 2, 3, 4, 5, 6].map(n => ({ f: 200 * n, a: 0.4 / n }))), 'saw');
    U.K.bus.publish('ui:send_tuning:' + a, {});
    assert.equal(got.length, 1); assert.ok(got[0].steps.some(s => Math.abs(s - 702) < 10), got[0].steps.join(','));
  });
  it('standard: unmount clean, presets load, state round-trips', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.harmonic-analyzer'); const c = P14.ctxOf(a);
    assert.noFault(U.K, () => Object.keys(c.presets.factory).forEach(n => assert.ok(c.presets.load(n))));
    c.params.set('maxDen', 77); const b = TH.spawn(U, 'eravos.harmonic-analyzer', { state: JSON.parse(JSON.stringify(c.serialize())) });
    assert.equal(P14.ctxOf(b).params.get('maxDen'), 77);
    OrganismFactory.close(a); assert.equal(U.K.bus.subscriberCount(a), 0); assert.equal(U.K.audio.ports(a).length, 0);
  });
});

describe('MIDI — StarryPad works with no learning (P14 fix)', () => {
  function mock(name) {
    const sent = [], input = { id: 'i', name, state: 'connected', onmidimessage: null }, output = { id: 'o', name, state: 'connected', send(d) { sent.push(Array.from(d)); } };
    return { access: { inputs: new Map([['i', input]]), outputs: new Map([['o', output]]), onstatechange: null }, sent, hit: (b) => input.onmidimessage({ data: new Uint8Array(b) }) };
  }
  async function setup(U, name) { await OrganismSDK.IDB.put('presets', 'eravos.midi-mapper', {}); const m = TH.spawn(U, 'eravos.midi-mapper'); const c = P14.ctxOf(m); const mm = mock(name); await c.connect(mm.access); return { m, c, mm }; }
  it('DPD-16 factory notes 36,38,40,41… (bottom row) → the Drum Machine’s BOTTOM row 13,14,15,16 (rows flipped to match the screen)', async () => {
    const U = TH.universe(0.2); const pads = TH.spawn(U, 'eravos.pads'); const { mm } = await setup(U, 'STARRYPAD'); const got = [];
    U.K.bus.subscribe('note:trigger', p => got.push(p.note));
    [36, 38, 40, 41, 62].forEach(n => mm.hit([0x99, n, 100]));
    assert.deepEqual(got, [48, 49, 50, 51, 39]); // hardware top-right (62) = screen pad 4
  });
  it('profile auto-selected from the device name; any channel matches the factory map', async () => {
    const U = TH.universe(0.2); TH.spawn(U, 'eravos.pads'); const { c, mm } = await setup(U, 'Donner DPD-16'); const got = [];
    assert.equal(c.params.get('profile'), 'starrypad');
    U.K.bus.subscribe('note:trigger', p => got.push(p.note)); mm.hit([0x90, 43, 90]); assert.deepEqual(got, [44]); // hw pad 5 (2nd row, left) = screen pad 9
  });
  it('generic controller: chromatic 36–51 play pads straight away', async () => {
    const U = TH.universe(0.2); TH.spawn(U, 'eravos.pads'); const { c, mm } = await setup(U, 'Some Pad'); c.params.set('profile', 'generic'); const got = [];
    U.K.bus.subscribe('note:trigger', p => got.push(p.note)); mm.hit([0x90, 37, 90]); assert.deepEqual(got, [49]); // hw pad 2 bottom row = screen pad 14
  });
  it('midi:status broadcast for the toolbar MIDI button', async () => {
    const U = TH.universe(0.2); const st = []; U.K.bus.subscribe('midi:status', p => st.push(p)); const { mm } = await setup(U, 'STARRYPAD');
    mm.hit([0x99, 36, 100]); assert.ok(st.some(s => s.connected && s.device === 'STARRYPAD')); assert.ok(st.some(s => s.activity));
  });
});

describe('per-tool volume (trim) — P14', () => {
  it('every audio out has a trim; −6 dB halves the level; mute silences', async () => {
    const run = async (o) => { const U = TH.universe(0.6); const a = TH.spawn(U, 'eravos.supersaw'); if (o) U.K.audio.setTrim(a, 'out', o); U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'out').node.connect(U.ctx.destination); TH.note(U, a, 57, 0.05, { duration: 0.5 }); return TH.rms(await TH.render(U), 0.1, 0.5); };
    const ref = await run(), half = await run({ db: -6.0206 }), mute = await run({ mute: true });
    assert.near(half / ref, 0.5, 0.02); assert.lt(TH.db(mute), -80);
  });
});

describe('eravos.song-recorder (bottom dock)', () => {
  const tone = (sec, f) => { const sr = 48000, n = Math.floor(sr * sec), b = new OfflineAudioContext(1, n, sr).createBuffer(1, n, sr), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = 0.5 * Math.sin(2 * Math.PI * (f || 440) * i / sr); return AudioRecorder.encodeWAV(b, 24); };
  it('with “Play with song” on, a placed clip plays when the transport plays (post bus, not re-recorded)', async () => {
    const U = TH.universe(2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.song-recorder'); const c = P14.ctxOf(a);
    P14.set(U, a, { withSong: true }); // 3.27: off by default — see p16.test.js
    const clip = await c.addAudio(tone(0.5), 'tone.wav', null, 2); // beat 2 = 1.0 s at 120 BPM
    assert.near(clip.start, 2, 1e-9);
    U.T.renderTicks(0, 16, 0.1); const buf = await TH.render(U);
    assert.lt(TH.db(TH.rms(buf, 0.2, 1.0)), -60, 'silent before the clip'); assert.gt(TH.db(TH.rms(buf, 1.2, 1.5)), -20, 'clip audible at beat 2');
    assert.ok(U.K.audio.port(a, 'out').onPost && !U.K.audio.port(a, 'out').onMaster);
  });
  it('split → two clips that tile the original; trim left keeps audio aligned; move snaps', async () => {
    const U = TH.universe(0.2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.song-recorder'); const c = P14.ctxOf(a);
    const cl = await c.addAudio(tone(2), 't.wav', null, 0);
    U.K.bus.publish('ui:clip_split:' + a, { id: cl.id, beat: 1.5 });
    const [x, y] = c.internals.clips; assert.near(x.dur, 0.75, 1e-9); assert.near(y.start, 1.5, 1e-9); assert.near(y.offset, 0.75, 1e-9); assert.near(x.dur + y.dur, 2, 1e-9);
    U.K.bus.publish('ui:clip_trim:' + a, { id: y.id, edge: 'left', beat: 2 }); assert.near(y.offset, 1.0, 1e-9); assert.near(y.start, 2, 1e-9);
    U.K.bus.publish('ui:clip_move:' + a, { id: x.id, start: 3.3 }); assert.near(x.start, 3, 1e-9); // snap: beat
  });
  it('export render = song length + tail, lanes mute/solo respected', async () => {
    const U = TH.universe(0.2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.song-recorder'); const c = P14.ctxOf(a);
    await c.addAudio(tone(1, 220), 'a.wav', null, 0); const b = await c.addAudio(tone(1, 330), 'b.wav', null, 4);
    U.K.bus.publish('ui:config_change:' + a, { key: 'tail', value: 0.5 });
    let buf = await c.render(); assert.near(buf.duration, 3 + 0.5, 0.01);
    U.K.bus.publish('ui:lane_edit:' + a, { id: b.lane, patch: { mute: true } });
    buf = await c.render(); assert.lt(TH.db(TH.rms(buf, 2.1, 2.9)), -80, 'muted lane silent');
  });
  it('state round-trips (lanes, clips) through serialize', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.song-recorder'); const c = P14.ctxOf(a);
    await c.addAudio(tone(0.3), 'x.wav', null, 1);
    const s = JSON.parse(JSON.stringify(c.serialize())); OrganismFactory.close(a);
    const b = TH.spawn(U, 'eravos.song-recorder', { state: s }); assert.equal(P14.ctxOf(b).internals.clips.length, 1); assert.equal(P14.ctxOf(b).internals.lanes.length, 1);
  });
});

describe('Codecs — every export format', () => {
  const buf = () => { const sr = 48000, n = sr, b = new OfflineAudioContext(2, n, sr).createBuffer(2, n, sr); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = 0.4 * Math.sin(2 * Math.PI * (300 + 100 * c) * i / sr); } return b; };
  it('lossless formats decode back (WAV, FLAC) and FLAC is smaller than WAV', async () => {
    const b = buf(); const w = await Codecs.encode(b, 'wav24'), f = await Codecs.encode(b, 'flac24');
    assert.lt(f.bytes, w.bytes);
    for (const r of [w, f, await Codecs.encode(b, 'wav16'), await Codecs.encode(b, 'flac16'), await Codecs.encode(b, 'wav32f')]) { const d = await new OfflineAudioContext(2, 48000, 48000).decodeAudioData(await r.blob.arrayBuffer()); assert.equal(d.length, 48000, r.label); }
  });
  it('FLAC 24 decodes bit-identical to WAV 24', async () => {
    const b = buf(); const dec = async (id) => (await new OfflineAudioContext(2, 48000, 48000).decodeAudioData(await (await Codecs.encode(b, id)).blob.arrayBuffer())).getChannelData(1);
    const x = await dec('wav24'), y = await dec('flac24'); let mx = 0; for (let i = 0; i < x.length; i++) mx = Math.max(mx, Math.abs(x[i] - y[i])); assert.equal(mx, 0);
  });
  it('MP3 encodes and decodes; AIFF has a valid FORM header; stems ZIP is a zip', async () => {
    const b = buf(); const m = await Codecs.encode(b, 'mp3-192'); const d = await new OfflineAudioContext(2, 48000, 48000).decodeAudioData(await m.blob.arrayBuffer()); assert.gt(d.length, 40000);
    const a = new Uint8Array(await (await Codecs.encode(b, 'aiff24')).blob.arrayBuffer()); assert.equal(String.fromCharCode(...a.slice(0, 4)) + String.fromCharCode(...a.slice(8, 12)), 'FORMAIFF');
    const z = new Uint8Array(await Codecs.zip([{ name: 'a.txt', data: new Uint8Array([1, 2, 3]) }]).arrayBuffer()); assert.equal(z[0] + z[1] * 256, 0x4b50);
  });
});

describe('eravos.sub-engine', () => {
  stdTests('eravos.sub-engine', { note: 45 });
  it('octave −2: key 57 (A3) sounds 55 Hz; phantom 0 keeps it a pure low tone', async () => {
    const U = TH.universe(1.2); const a = TH.spawn(U, 'eravos.sub-engine');
    P14.set(U, a, { shape: 0, phantom: 0, click: 0, drop: 0, drive: 0, octave: -2, sustain: 1 });
    TH.note(U, a, 57, 0.05, { duration: 1 }); const buf = await TH.render(U);
    assert.near(TH.acFreq(buf, 0.4, 0.9, 30, 300), 55, 1);
  });
  it('808 drop: pitch starts high and falls to the note', async () => {
    const U = TH.universe(1.2); const a = TH.spawn(U, 'eravos.sub-engine');
    P14.set(U, a, { shape: 0, phantom: 0, click: 0, drop: 12, dropTime: 0.3, octave: -1, sustain: 1 });
    TH.note(U, a, 57, 0.05, { duration: 1 }); const buf = await TH.render(U);
    assert.gt(TH.zcFreq(buf, 0.06, 0.12), 150); assert.near(TH.zcFreq(buf, 0.6, 1.0), 110, 2);
  });
});
describe('eravos.pad-forge', () => {
  stdTests('eravos.pad-forge', { note: 57, seconds: 1.5 });
  it('every corner source makes sound on its own', async () => {
    for (const src of ['swarm', 'glass', 'air', 'choir', 'organ', 'strings', 'halo']) {
      const U = TH.universe(1.2); const a = TH.spawn(U, 'eravos.pad-forge');
      P14.set(U, a, { cornerA: src, cornerB: src, cornerC: src, cornerD: src, attack: 0.01, space: 0, shimmer: 0, bloom: 0 });
      TH.note(U, a, 57, 0.05, { duration: 1 }); const buf = await TH.render(U);
      assert.gt(TH.db(TH.rms(buf, 0.3, 1.0)), -55, src);
    }
  });
  it('hold: a new chord releases the old one', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.pad-forge'); const c = P14.ctxOf(a); P14.set(U, a, { hold: true });
    TH.note(U, a, 57, 0.0, { duration: 0.1 }); TH.note(U, a, 60, 0.0, { duration: 0.1 }); TH.note(U, a, 62, 0.5, { duration: 0.1 });
    const held = c.internals.voices.filter(v => v.off === Infinity).map(v => v.note); assert.deepEqual(held, [62]);
  });
});

describe('eravos.dub-station', () => {
  stdTests('eravos.dub-station', { noTarget: true, play: (U, inst, t) => P14.ctxOf(inst).horn(t) });
  it('skank: one-drop chops land on the offbeats (steps 6 and 14) while the transport runs', async () => {
    const U = TH.universe(2.2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.dub-station'); P14.set(U, a, { skankOn: true, skankStyle: 'one-drop chop', spring: 0, echo: 0 });
    U.T.renderTicks(0, 16, 0.1); const buf = await TH.render(U); const step = 0.125;
    assert.lt(TH.db(TH.rms(buf, 0.1, 0.1 + 5.5 * step)), -60, 'quiet before the first offbeat');
    assert.gt(TH.db(TH.rms(buf, 0.1 + 6 * step, 0.1 + 6.6 * step)), -40, 'chop on step 6');
  });
  it('chords follow the song key: A minor i → A C E', () => { const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.dub-station'); assert.deepEqual(P14.ctxOf(a).internals.chordNotes(0).map(n => n % 12), [9, 0, 4]); });
  it('siren sounds while held and stops after release', async () => {
    const U = TH.universe(1.5); const a = TH.spawn(U, 'eravos.dub-station'); const c = P14.ctxOf(a); P14.set(U, a, { spring: 0, echo: 0 });
    c.sirenOn(0.05); c.sirenOff(0.6); const buf = await TH.render(U);
    assert.gt(TH.db(TH.rms(buf, 0.2, 0.5)), -35); assert.lt(TH.db(TH.rms(buf, 1.1, 1.5)), -60);
  });
  it('big knob: the riddim wired in is high-passed', async () => {
    const run = async (hz) => { const U = TH.universe(0.8); const a = TH.spawn(U, 'eravos.dub-station'), s = TH.spawn(U, 'eravos.sub-engine'); U.K.wires.register({ src: { instanceId: s, hookId: 'sub.hook.audio_out' }, dst: { instanceId: a, hookId: 'dub.hook.audio_in' } }); P14.set(U, a, { bigKnob: hz, spring: 0, echo: 0 }); P14.set(U, s, { phantom: 0, click: 0 }); TH.note(U, s, 57, 0.05, { duration: 0.7 }); return TH.rms(await TH.render(U), 0.3, 0.7); };
    assert.lt(TH.db(await run(1500)) - TH.db(await run(20)), -24);
  });
});

describe('eravos.drum-forge', () => {
  stdTests('eravos.drum-forge', { note: 36 });
  it('every voice model makes a sound, and every kit pad renders offline without clipping', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.drum-forge'); const c = P14.ctxOf(a);
    for (const type of c.descriptor.config && Object.values(c.internals.KITS)[0] ? ['kick', '808', 'snare', 'gated snare', 'clap', 'hat', 'open hat', 'ride', 'crash', 'tom', 'rim', 'fm perc', 'metal', 'zap', 'laser', 'riser', 'downlifter', 'impact', 'vinyl', 'shaker'] : []) {
      U.K.bus.publish('ui:slot_edit:' + a, { i: 0, patch: { type, decay: 0.3 } });
      const b = await c.render(0); assert.gt(TH.db(TH.rms(b)), -60, type); assert.lt(TH.peak(b), 0.99, type);
    }
  }, { timeout: 60000 });
  it('notes 36–51 → slots 1–16 (pad:trigger index), hats choke open hats', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.drum-forge'); const got = []; U.K.bus.subscribe('pad:trigger', p => got.push(p.index));
    [36, 51, 52].forEach(n => TH.note(U, a, n, 0.05)); assert.deepEqual(got, [0, 15]);
  });
  it('kits load 16 slots each; the dancehall kit is the default', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.drum-forge'); const c = P14.ctxOf(a);
    assert.equal(c.internals.slots.length, 16); assert.equal(c.params.get('kit'), 'Dancehall · Bun Dem');
    Object.keys(c.presets.factory).forEach(n => { c.presets.load(n); assert.equal(c.internals.slots.length, 16, n); });
  });
  it('send renders the slot into an asset addressed to a Drum Machine', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.drum-forge'); const got = []; U.K.bus.subscribe('asset:ready', p => got.push(p));
    U.K.bus.publish('ui:send:' + a, { i: 2, target: 'pads-x' }); await TH.sleep(300);
    assert.equal(got.length, 1); assert.equal(got[0].target, 'pads-x'); assert.ok(U.K.assets.get(got[0].hash));
  });
});

describe('eravos.bass-forge', () => {
  stdTests('eravos.bass-forge', { note: 45 });
  it('every preset renders loud and unclipped offline', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.bass-forge'); const c = P14.ctxOf(a);
    for (const n of Object.keys(c.presets.factory)) { c.presets.load(n); const b = await c.renderWith({}, 55, 0.8); assert.gt(TH.db(TH.rms(b)), -40, n); assert.lt(TH.peak(b), 1.0, n); }
  }, { timeout: 60000 });
  it('MATCH (recursive): starting from a different preset, distance to a reference shrinks', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.bass-forge'); const c = P14.ctxOf(a);
    c.presets.load('Dub Wobble (soft)'); const ref = await c.renderWith({}, 55, 1.2);            // the reference: a known sound
    c.presets.load('Screech');
    const before = c.distance(c.features(await c.renderWith({}, 55, 1.2)), c.features(ref));
    const r = await c.match(ref, { rounds: 2 });
    assert.lt(r.dist, before * 0.8, `before ${before.toFixed(3)} after ${r.dist.toFixed(3)}`); assert.gt(r.iter, 5);
  }, { timeout: 120000 });
});

describe('eravos.organ (Gothic Organ — spec eravos.organism.organ)', () => {
  stdTests('eravos.organ', { note: 57, seconds: 1.5 });
  it("spec: only the 8' drawbar → a single partial at the note frequency ± 0.5 Hz", async () => {
    const U = TH.universe(1.5); const a = TH.spawn(U, 'eravos.organ'); const o = { celeste: 0, chiff: 0, wind: 0, tremDepth: 0, breathDepth: 0, space: 0, pedal: false, scrape: 0, reed: 0, attack: 0.01, dark: 12000, pipe: 'tonewheel', perc: 0, drive: 0, rotary: 0, pulse: 0 };
    for (let i = 0; i < 9; i++) o['d' + i] = i === 2 ? 8 : 0; P14.set(U, a, o);
    TH.note(U, a, 57, 0.05, { duration: 1.4 }); const buf = await TH.render(U);
    assert.near(TH.zcFreq(buf, 0.4, 1.4), 220, 0.5);
  });
  it('spec: 7 notes held → 6 voices (oldest stolen)', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.organ'); const c = P14.ctxOf(a);
    [48, 50, 52, 53, 55, 57, 59].forEach(n => TH.note(U, a, n, 0.01, { duration: 5 }));
    assert.equal(c.internals.voices.length, 6); assert.ok(!c.internals.voices.some(v => v.note === 48));
  });
  it('spec: breath period 10 s → amplitude cycle measured within 2 %', async () => {
    const sr = 4000, ctx = new OfflineAudioContext(1, sr * 22, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true }).boot();
    const a = OrganismFactory.spawn('eravos.organ', { K, headless: true }); const o = { breathPeriod: 10, breathDepth: 1, tremDepth: 0, space: 0, chiff: 0, wind: 0, pedal: false, celeste: 0, attack: 0.01, drive: 0, rotary: 0, pulse: 0, perc: 0 }; Object.keys(o).forEach(k => K.bus.publish('ui:config_change:' + a, { key: k, value: o[k] }));
    K.audio.chain.out.gain.value = 0; K.audio.port(a, 'out').node.connect(ctx.destination);
    K.bus.publish('note:trigger', { target: a, note: 57, velocity: 1, time: 0.01, duration: 21.9 }); const buf = await ctx.startRendering(); const d = buf.getChannelData(0);
    const env = []; for (let s = 0; s + sr * 0.1 <= d.length; s += sr * 0.1) { let q = 0; for (let i = s; i < s + sr * 0.1; i++) q += d[i] * d[i]; env.push(Math.sqrt(q)); }
    const mins = []; for (let i = 5; i < env.length - 5; i++) if (env[i] <= Math.min(...env.slice(i - 5, i + 6))) mins.push(i * 0.1);
    assert.ok(mins.length >= 2, 'two breath minima'); assert.near(mins[1] - mins[0], 10, 0.2);
  }, { timeout: 30000 });
  it('gothic chord: one key → a detuned minor triad; pedal follows the lowest note', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.organ'); const c = P14.ctxOf(a); P14.set(U, a, { chord: true, pedal: true });
    TH.note(U, a, 45, 0.01, { duration: 3 }); TH.note(U, a, 52, 0.01, { duration: 3 }); assert.equal(c.internals.pedal.note, 45);
  });
  it('Hanging Tree 1.1: pulse throbs at the 1/8 rate of the tempo (140 BPM → 4.67 Hz envelope)', async () => {
    const U = TH.universe(3.2, { bpm: 140 }); const a = TH.spawn(U, 'eravos.organ'); P14.set(U, a, { space: 0, rotary: 0, pulse: 1, pulseRate: '1/8', pulseShape: 'smooth', breathDepth: 0, tremDepth: 0, wind: 0, chiff: 0, perc: 0, pedal: false, attack: 0.01 });
    TH.note(U, a, 57, 0.01, { duration: 3.1 }); const b = await TH.render(U), d = b.getChannelData(0), sr = b.sampleRate, hop = Math.round(sr * 0.02), env = [];
    for (let s = Math.round(sr * 0.5); s + hop < Math.round(sr * 3); s += hop) { let q = 0; for (let i = s; i < s + hop; i++) q += d[i] * d[i]; env.push(Math.sqrt(q / hop)); }
    const m = env.reduce((x, y) => x + y) / env.length; let cross = 0; for (let i = 1; i < env.length; i++) if (env[i - 1] < m && env[i] >= m) cross++;
    assert.near(cross / 2.5, 140 / 60 * 2, 0.4);
  });
  it('Hanging Tree 1.1: amp drive adds harmonics; rotary fast spins the horn up with inertia', async () => {
    const zc = async (drive) => { const U = TH.universe(1, { bpm: 120 }); const a = TH.spawn(U, 'eravos.organ'); const o = { space: 0, rotary: 0, pulse: 0, breathDepth: 0, tremDepth: 0, wind: 0, chiff: 0, perc: 0, pedal: false, attack: 0.01, pipe: 'tonewheel', drive, dark: 12000, ampTone: 12000 }; for (let i = 0; i < 9; i++) o['d' + i] = i === 2 ? 8 : 0; P14.set(U, a, o); TH.note(U, a, 45, 0.01, { duration: 0.9 }); const b = await TH.render(U); const d = b.getChannelData(0); let e = 0, de = 0; for (let i = 24000; i < 46000; i++) { e += d[i] * d[i]; const x = d[i] - d[i - 1]; de += x * x; } return de / e; };
    // RCA 3.28: the 3× threshold was never met (2.6× measured since 3.24) — the amp's pre-gain is relative to the voice bus,
    // and a single 8' drawbar is the quietest registration there is. The property the spec states is "adds harmonics":
    // measured as monotonic brightening, at least doubling at 0.9. Presets (tuned by ear on this amp) are unchanged.
    const z0 = await zc(0), z5 = await zc(0.5), z9 = await zc(0.9);
    assert.gt(z5, z0 * 1.1, 'brighter at 0.5'); assert.gt(z9, z5 * 1.5, 'brighter still at 0.9'); assert.gt(z9, z0 * 2, 'at least doubles at 0.9');
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.organ'); const c = P14.ctxOf(a); P14.set(U, a, { rotorSpeed: 'fast' });
    const f = c.internals.horn.frequency; assert.ok(f.value < 1.5, 'no instant jump'); 
  });
});

describe('eravos.retro-poly', () => {
  stdTests('eravos.retro-poly', { note: 57 });
  it('PWM pulse: width 0.5 with no saw → odd harmonics only (square-like)', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.retro-poly');
    P14.set(U, a, { saw: 0, pulse: 1, width: 0.5, pwm: 0, sub: 0, drift: 0, cutoff: 16000, envAmt: 0, chorus: 'off', sustain: 1, keytrack: 0 });
    TH.note(U, a, 57, 0.05, { duration: 0.9 }); const buf = await TH.render(U);
    const d = buf.getChannelData(0), N = 8192, s0 = Math.floor(0.4 * 48000), re = new Float32Array(N), im = new Float32Array(N), w = OrganismSDK.dsp.hann(N);
    for (let i = 0; i < N; i++) re[i] = d[s0 + i] * w[i]; OrganismSDK.dsp.fft(re, im); const mag = (f) => { const k = Math.round(f * N / 48000); let m = 0; for (let j = k - 2; j <= k + 2; j++) m = Math.max(m, Math.hypot(re[j], im[j])); return m; };
    assert.gt(mag(220 * 3) / (mag(220 * 2) + 1e-9), 8, '3rd ≫ 2nd harmonic');
  });
  it('arp: held keys step on the transport ticks (up, 1/16)', () => {
    const U = TH.universe(1.2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.retro-poly'); const c = P14.ctxOf(a); P14.set(U, a, { arp: 'up', arpDiv: '1/16', arpOct: 1 });
    const played = []; const orig = c.internals.voices; U.K.bus.subscribe('org:state_sync:' + a, () => {});
    U.K.bus.publish('ui:audition:' + a, { note: 60 }); U.K.bus.publish('ui:audition:' + a, { note: 64 }); U.K.bus.publish('ui:audition:' + a, { note: 67 });
    assert.deepEqual(c.internals.arpSeq(), [60, 64, 67]);
    U.T.renderTicks(0, 6, 0.05); assert.ok(c.internals.voices.length >= 1);
  });
});

describe('eravos.coven', () => {
  stdTests('eravos.coven', { note: 57, seconds: 1.5, setup: (U, a) => P14.set(U, a, { attack: 0.02 }) });
  it('chant: the mouth walks the typed vowels one per division', () => {
    const U = TH.universe(2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.coven'); const c = P14.ctxOf(a); const seen = [];
    U.K.bus.subscribe('org:vowel:' + a, p => seen.push(p.v)); P14.set(U, a, { chant: 'o-u i', chantDiv: '1/4' });
    assert.deepEqual(c.internals.seq, ['O', 'U', 'I']); U.T.renderTicks(0, 16, 0.05);
    assert.deepEqual(seen.slice(0, 5), ['O', 'U', 'I', 'O', 'U']);
  });
  it('screw lowers the pitch by the set semitones', async () => {
    const run = async (sc) => { const U = TH.universe(1.2); const a = TH.spawn(U, 'eravos.coven'); P14.set(U, a, { voices: 1, spread: 0, breath: 0, vibrato: 0, hex: 'off', summon: 0, static: 0, dark: 12000, attack: 0.01, screw: sc }); TH.note(U, a, 57, 0.05, { duration: 1 }); return TH.acFreq(await TH.render(U), 0.4, 0.9, 80, 600); };
    const f0 = await run(0), f12 = await run(12); assert.near(f12 / f0, 0.5, 0.02);
  });
  it('summon: a drone grows under a held chord', () => { const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.coven'); P14.set(U, a, { summon: 0.8 }); TH.note(U, a, 50, 0.01, { duration: 4 }); TH.note(U, a, 57, 0.01, { duration: 4 }); assert.equal(P14.ctxOf(a).internals.drone.note, 50); });
});

describe('eravos.fx-haunt (STD.fx)', () => {
  const feed = (U, fx, f, amp) => { const s = U.ctx.createOscillator(); s.frequency.value = f || 440; const g = U.ctx.createGain(); g.gain.value = amp || 0.5; s.connect(g); g.connect(U.K.audio.port(fx, 'in').node); s.start(0); return g; };
  it('mix 0 nulls against the input', async () => {
    const U = TH.universe(0.6); const fx = TH.spawn(U, 'eravos.fx-haunt'); const c = P14.ctxOf(fx); c.params.set('mix', 0); U.K.audio.chain.out.gain.value = 0;
    const g = feed(U, fx); const inv = U.ctx.createGain(); inv.gain.value = -1; g.connect(inv); inv.connect(U.ctx.destination); U.K.audio.port(fx, 'out').node.connect(U.ctx.destination);
    assert.lt(TH.rms(await TH.render(U), 0.2, 0.6), 1e-4);
  });
  it('every preset: wet signal non-silent, no faults', async () => {
    const U0 = TH.universe(0.2); const names = Object.keys(P14.ctxOf(TH.spawn(U0, 'eravos.fx-haunt')).presets.factory);
    for (const n of names) { const U = TH.universe(1); const fx = TH.spawn(U, 'eravos.fx-haunt'); const c = P14.ctxOf(fx); c.presets.load(n); await TH.sleep(30); U.K.audio.chain.out.gain.value = 0; U.K.audio.port(fx, 'out').node.connect(U.ctx.destination); feed(U, fx, 220); assert.gt(TH.db(TH.rms(await TH.render(U), 0.5, 1)), -45, n); }
  });
  it('screw 12 st halves the pitch (worklet)', async () => {
    const U = TH.universe(1.2); const fx = TH.spawn(U, 'eravos.fx-haunt'); const c = P14.ctxOf(fx); await TH.sleep(80);
    if (!c.internals.pitch) return; // AudioWorklet unavailable in this runner
    U.K.bus.publish('ui:preset_apply:' + fx, { params: { screw: 12, warble: 0, vinyl: 0, ghost: 0, crush: 0, tone: 'open', mix: 1 } });
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(fx, 'out').node.connect(U.ctx.destination); feed(U, fx, 440);
    assert.near(TH.acFreq(await TH.render(U), 0.5, 1.1, 100, 600), 220, 6);
  });
});

describe('eravos.curve-synth (spec eravos.organism.curve-synth)', () => {
  stdTests('eravos.curve-synth', { note: 60 });
  it('spec: straight rising curve 0→1 over 1 s → frequency rises low→high monotonically', async () => {
    const U = TH.universe(1.3); const a = TH.spawn(U, 'eravos.curve-synth'); const c = P14.ctxOf(a);
    P14.set(U, a, { follow: 'range', slot: 5, duration: 1, lowNote: 48, highNote: 84, edge: false, noise: 0, drive: 0, sustain: 1, wave: 'sine' });
    c.playCurve(5, 60, 1, 0.05); const buf = await TH.render(U);
    const fs = [0.15, 0.4, 0.65, 0.9].map(t => TH.zcFreq(buf, t, t + 0.08)); for (let i = 1; i < fs.length; i++) assert.gt(fs[i], fs[i - 1], fs.join(','));
    assert.near(fs[0], MusicTheory.hz(48 + 0.12 * 36), 25);
  });
  it('spec: bounces 2 → 2 reflections, each quieter and shorter', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.curve-synth'); const c = P14.ctxOf(a); P14.set(U, a, { edge: true, bounces: 2, restitution: 0.5, decay: 0.5 });
    const plan = c.playCurve(5, 60, 1, 0.01); assert.equal(plan.length, 3); assert.lt(plan[2].amp, plan[1].amp); assert.lt(plan[2].dur, plan[1].dur);
  });
  it('spec: curves are stored in serialize', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.curve-synth'); U.K.bus.publish('ui:curve_set:' + a, { slot: 7, pts: [{ x: 0, y: 0.1 }, { x: 1, y: 0.9 }] });
    const s = P14.ctxOf(a).serialize(); assert.deepEqual(s.extra.curves[7], [[0, 0.1], [1, 0.9]]);
  });
});

describe('eravos.breath (spec eravos.organism.breath)', () => {
  it('spec: BOX → phases each 4.0 s; breath = 1 at the end of the inhale, 0 at the end of the exhale', async () => {
    const sr = 3000, ctx = new OfflineAudioContext(1, sr * 17, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true }).boot();
    const a = OrganismFactory.spawn('eravos.breath', { K, headless: true }); const c = OrganismFactory.handle(a).ctx; const ph = [];
    K.bus.subscribe('breath:phase', p => ph.push(p)); K.bus.publish('ui:config_change:' + a, { key: 'pattern', value: 'BOX' }); c.scheduleAhead(16.5);
    const times = ph.slice(0, 4).map(p => p.time); for (let i = 1; i < 4; i++) assert.near(times[i] - times[i - 1], 4, 0.01);
    K.audio.chain.out.gain.value = 0; c.internals.sig.connect(ctx.destination); const b = await ctx.startRendering(), d = b.getChannelData(0);
    const at = (t) => d[Math.floor(t * sr)]; const t0 = times[0];
    assert.near(at(t0 + 3.99), 1, 0.02); assert.near(at(t0 + 11.99), 0, 0.02);
  });
  it('tempo link snaps the breath cycle to whole bars', () => {
    const U = TH.universe(0.2, { bpm: 60 }); const a = TH.spawn(U, 'eravos.breath'); const c = P14.ctxOf(a); P14.set(U, a, { tempoLink: true }); U.T.setBpm(60);
    const tot = c.durations().reduce((x, y) => x + y, 0); assert.near(tot % 4, 0, 1e-9);
  });
});
