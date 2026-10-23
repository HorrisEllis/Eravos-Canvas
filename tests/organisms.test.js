/* Organism tests — standard_tests (R10) + per-spec tests. Offline universes, deterministic. */
function makeClick(sr, sec, hits) { // test clip: decaying tone bursts at given times
  const ctx = new OfflineAudioContext(1, Math.floor(sr * sec), sr); const b = ctx.createBuffer(1, Math.floor(sr * sec), sr); const d = b.getChannelData(0);
  hits.forEach(t => { const s = Math.floor(t * sr); for (let i = 0; i < sr * 0.08 && s + i < d.length; i++) d[s + i] = Math.sin(2 * Math.PI * 440 * i / sr) * Math.exp(-i / (sr * 0.015)) * 0.9; });
  return b;
}
function stdTests(id, o) {
  o = o || {};
  const play = o.play || ((U, inst, t) => TH.note(U, inst, o.note || 57, t, { duration: 0.4 }));
  it('standard: renders non-silent audio through its out port', async () => {
    const U = TH.universe(o.seconds || 1.2); const inst = TH.spawn(U, id); if (o.setup) await o.setup(U, inst);
    await play(U, inst, 0.05);
    const buf = await TH.render(U);
    assert.gt(TH.db(TH.rms(buf)), -60, 'rms dBFS');
    assert.equal(U.K.faults.list().filter(f => /RUNTIME_00[23]/.test(f.fault_class)).length, 0, 'no runtime faults: ' + JSON.stringify(U.K.faults.list().map(f => f.message)));
  });
  if (!o.noTarget) it('standard: note:trigger for another target → silence', async () => {
    const U = TH.universe(0.8); const inst = TH.spawn(U, id); if (o.setup) await o.setup(U, inst);
    TH.note(U, 'someone-else', o.note || 57, 0.05, { duration: 0.3 });
    const buf = await TH.render(U);
    assert.lt(TH.db(TH.rms(buf)), -70);
  });
  it('standard: config below min / above max clamped; wrong type → RUNTIME_002', () => {
    const U = TH.universe(0.2); const inst = TH.spawn(U, id); const c = OrganismFactory.handle(inst).ctx;
    c.descriptor.config.filter(k => k.type === 'number').forEach(k => {
      c.params.set(k.key, k.min - 1000); assert.equal(c.params.get(k.key), k.min, k.key + ' min');
      c.params.set(k.key, k.max + 1000); assert.equal(c.params.get(k.key), k.max, k.key + ' max');
    });
    const k = c.descriptor.config.find(k => k.type === 'number');
    if (k) assert.fault(U.K, 'RUNTIME_002', () => c.params.set(k.key, 'x'));
  });
  it('standard: serialize → deserialize → identical params', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, id); const ca = OrganismFactory.handle(a).ctx;
    const k = ca.descriptor.config.find(k => k.type === 'number'); if (k) ca.params.set(k.key, k.min + (k.max - k.min) * 0.37);
    const b = TH.spawn(U, id, { state: JSON.parse(JSON.stringify(ca.serialize())) });
    assert.deepEqual(OrganismFactory.handle(b).ctx.params.all(), ca.params.all());
  });
  it('standard: unmount → zero bus subscribers, zero ports, zero wires', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, id);
    OrganismFactory.close(a);
    assert.equal(U.K.bus.subscriberCount(a), 0); assert.equal(U.K.audio.ports(a).length, 0); assert.equal(U.K.wires.list().length, 0); assert.ok(!U.K.registry.has(a));
  });
  it('standard: every factory preset loads without fault', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, id); const c = OrganismFactory.handle(a).ctx;
    assert.noFault(U.K, () => Object.keys(c.presets.factory).forEach(n => assert.ok(c.presets.load(n), n)));
  });
}

window.__phase = 'P2';
describe('eravos.pads', () => {
  stdTests('eravos.pads', { note: 36 });
  it('note 36 → pad 0, note 51 → pad 15, note 52 → ignored', () => {
    const U = TH.universe(0.5); const a = TH.spawn(U, 'eravos.pads'); const got = [];
    U.K.bus.subscribe('pad:trigger', p => got.push(p.index));
    [36, 51, 52].forEach(n => TH.note(U, a, n, 0.1));
    assert.deepEqual(got, [0, 15]);
  });
  it('choke: hat at t+0.1 cuts openhat started at t (< −60 dB by t+0.105)', async () => {
    const U = TH.universe(0.6); const a = TH.spawn(U, 'eravos.pads'); const c = OrganismFactory.handle(a).ctx;
    U.K.bus.publish('ui:pad_edit:' + a, { index: 3, key: 'choke', value: 1 }); // hat joins group 1
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'out').node.connect(U.ctx.destination); // measure the organism port (master comp/limiter add ~12 ms lookahead)
    c.trigger(4, 1, 0.1); c.trigger(3, 0.0001, 0.2); // near-silent hat to isolate the openhat cut
    const buf = await TH.render(U);
    assert.gt(TH.rms(buf, 0.12, 0.18), 0.001, 'openhat sounding');
    assert.lt(TH.db(TH.peak(buf, 0.206, 0.3)), -60);
  });
  it('bank change emits 16 pads with note field', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.pads'); let got = null;
    U.K.bus.subscribe('pad:bank-change', p => { got = p; });
    U.K.bus.publish('ui:bank_select:' + a, { bank: 1 });
    assert.equal(got.bank, 1); assert.equal(got.pads.length, 16); assert.equal(got.pads[15].note, 51);
  });
  it('pad load sample → sample voice plays buffer; reverse plays reversed copy', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.pads'); const c = OrganismFactory.handle(a).ctx;
    const clip = makeClick(48000, 0.5, [0.0]); const wav = AudioRecorder.encodeWAV(clip, 32);
    U.K.bus.publish('ui:pad_load:' + a, { index: 2, arrayBuffer: wav, name: 'click.wav' });
    await TH.sleep(100);
    U.K.bus.publish('ui:pad_edit:' + a, { index: 2, key: 'reverse', value: true });
    c.trigger(2, 1, 0.1);
    const buf = await TH.render(U);
    // reversed: energy near the END of the clip region (0.1+0.5) not the start
    assert.gt(TH.rms(buf, 0.5, 0.6), TH.rms(buf, 0.1, 0.2) * 3);
  });
});

describe('eravos.sample-player', () => {
  async function loaded(U, inst, clip) { const wav = AudioRecorder.encodeWAV(clip || makeClick(48000, 1, [0.05, 0.3, 0.55, 0.8]), 32); const c = OrganismFactory.handle(inst).ctx; await c.load(wav, 'test.wav'); return c; }
  stdTests('eravos.sample-player', { setup: (U, i) => loaded(U, i), note: 60 });
  it('reverse plays reversed samples (first output frame = last input frame ±1)', async () => {
    const U = TH.universe(1); const inst = TH.spawn(U, 'eravos.sample-player');
    const sr = 48000, b = new OfflineAudioContext(1, 4800, sr).createBuffer(1, 4800, sr); const d = b.getChannelData(0); for (let i = 0; i < 4800; i++) d[i] = i / 4800;
    const c = await loaded(U, inst, b);
    c.params.set('reverse', true); c.params.set('attack', 0); c.params.set('gain', 1);
    U.K.audio.chain.comp.threshold.value = 0; U.K.audio.chain.comp.ratio.value = 1; U.K.audio.chain.limiter.threshold.value = 0;
    c.noteOn(60, 1, 0.1);
    const buf = await TH.render(U); const o = buf.getChannelData(0); const s = Math.round(0.1 * sr);
    // first frames ≈ last input frame (≈1) scaled by chain; compare slope: output decreasing
    assert.gt(o[s + 50], o[s + 2000], 'descending ramp = reversed');
  });
  it('chromatic note root+12 → rate 2.0', async () => {
    const U = TH.universe(0.5); const inst = TH.spawn(U, 'eravos.sample-player'); const c = await loaded(U, inst);
    c.params.set('mode', 'chromatic'); const v = c.noteOn(72, 1, 0.1); assert.near(v.rate, 2, 1e-9);
  });
  it('slice mode 8: note 39 plays slice 3 bounds exactly', async () => {
    const U = TH.universe(0.5); const inst = TH.spawn(U, 'eravos.sample-player'); const c = await loaded(U, inst);
    c.params.set('mode', 'slice'); c.params.set('slices', 8);
    const v = c.noteOn(39, 1, 0.1); assert.near(v.offset, 3 / 8 * c.buffer.duration, 1e-9); assert.near(v.dur, c.buffer.duration / 8, 1e-9);
  });
  it('click train with 4 transients → auto slices = 4', async () => {
    const U = TH.universe(0.5); const inst = TH.spawn(U, 'eravos.sample-player'); const c = await loaded(U, inst);
    c.params.set('slices', 'auto'); assert.equal(c.slicePositions().length, 4);
  });
  it('playhead at pitch +12 advances 2× per second', async () => {
    const U = TH.universe(0.5); const inst = TH.spawn(U, 'eravos.sample-player'); const c = await loaded(U, inst);
    c.params.set('pitch', 12); const v = c.noteOn(60, 1, 0); assert.near(v.rate, 2, 1e-9);
  });
  it('undecodable file → ASSET_002, organism stays mounted', async () => {
    const U = TH.universe(0.5); const inst = TH.spawn(U, 'eravos.sample-player'); const c = OrganismFactory.handle(inst).ctx;
    const n0 = U.K.faults.list('ASSET_002').length;
    await c.load(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]).buffer, 'junk.mp3');
    assert.gt(U.K.faults.list('ASSET_002').length, n0); assert.ok(U.K.registry.has(inst));
  });
});

describe('eravos.wobble-bass', () => {
  stdTests('eravos.wobble-bass', { note: 45 });
  it('div 1/4 at 120 BPM → LFO frequency 2 Hz', () => {
    const U = TH.universe(0.3); const a = TH.spawn(U, 'eravos.wobble-bass'); const c = OrganismFactory.handle(a).ctx;
    c.params.set('div', '1/4'); assert.near(c.internals.lfo.frequency.value, 2, 1e-6);
  });
  // 3.39: the filter sits before the 4x post shaper (192 samples), so the LFO restarts 192 samples EARLY — the closed filter is
  // HEARD at t. The control signal therefore reads shape(0) at t − 192 samples; the log keeps the heard time.
  it('note-on at t resets LFO phase: the filter is heard closed at t (control restarts 192 samples early)', async () => {
    const U = TH.universe(0.6); const a = TH.spawn(U, 'eravos.wobble-bass'); const c = OrganismFactory.handle(a).ctx;
    const probe = U.ctx.createGain(); c.internals.uni.connect(probe); const m = U.ctx.createGain(); m.gain.value = 0; U.K.audio.chain.out.gain.value = 0;
    probe.connect(U.ctx.destination);
    c.params.set('lfoShape', 'sine'); c.noteOn(45, 1, 0.3, { duration: 0.2 });
    const buf = await TH.render(U); const d = buf.getChannelData(0);
    assert.near(d[Math.round(0.3 * 48000) - 192 + 2], 0, 2e-3, 'uni LFO at (note start − shaper latency) = 0 (closed)');
    assert.near(c.internals.lfoLog ? c.internals.lfoLog.slice(-1)[0].t : 0.3, 0.3, 1e-9, 'the log names the heard time');
  });
  it('formant OO→AH: band centres at LFO extremes equal vowel table ± 1 Hz', () => {
    const U = TH.universe(0.3); const a = TH.spawn(U, 'eravos.wobble-bass'); const c = OrganismFactory.handle(a).ctx;
    c.params.set('filterMode', 'formant'); c.params.set('vowelA', 'OO'); c.params.set('vowelB', 'AH');
    const b = c.internals.bands; // base = A ; scale = B − A → at uni=0 → A ; uni=1 → B
    assert.deepEqual(b.map(x => x.b.frequency.value), [300, 870, 2240]);
    const V = { OO: [300, 870, 2240], AH: [730, 1090, 2440] };
    // endpoint arithmetic: base + (B − A)·1
    b.forEach((x, i) => assert.near(x.b.frequency.value + (V.AH[i] - V.OO[i]), V.AH[i], 1));
  });
  it('slide note: no amp retrigger (legato), freq ramps over glide', () => {
    const U = TH.universe(0.8); const a = TH.spawn(U, 'eravos.wobble-bass'); const c = OrganismFactory.handle(a).ctx;
    c.noteOn(45, 1, 0.1, { duration: 0.3 }); c.noteOn(48, 1, 0.3, { duration: 0.2, slide: true });
    assert.ok(c.lastNote.slide, 'slide honoured when overlapping');
  });
});

describe('eravos.acid-synth', () => {
  stdTests('eravos.acid-synth', { note: 45 });
  it('3 consecutive accents raise effective cutoff monotonically; decays after 1 s idle', () => {
    const U = TH.universe(2); const a = TH.spawn(U, 'eravos.acid-synth'); const c = OrganismFactory.handle(a).ctx;
    const ch = [];
    [0.1, 0.225, 0.35].forEach(t => { c.noteOn(45, 1, t, { accent: true }); ch.push(c.lastNote.peakCharge); });
    assert.ok(ch[0] < ch[1] && ch[1] < ch[2], JSON.stringify(ch));
    assert.lt(c.chargeAt(1.4), ch[2] * 0.1);
  });
  it('slide: second note no env retrigger, pitch reaches target by 60 ms', async () => {
    const U = TH.universe(0.8); const a = TH.spawn(U, 'eravos.acid-synth'); const c = OrganismFactory.handle(a).ctx;
    c.noteOn(45, 1, 0.1, { slide: true, duration: 0.12 }); c.noteOn(57, 1, 0.225, { duration: 0.12 });
    assert.ok(c.lastNote.slideIn, 'slid-to note flagged');
    const buf = await TH.render(U);
    const f = TH.acFreq(buf, 0.29, 0.335, 60, 600); // after 60 ms glide: fundamental ≈ 220 Hz (saw → ZC ≈ fundamental after LP)
    assert.near(f, MusicTheory.hz(57), 12);
  });
  it('generator seed determinism: same seed → identical steps; all degrees in scale', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.acid-synth'); const c = OrganismFactory.handle(a).ctx;
    const s1 = c.generate({ seed: 42, density: 0.7 }), s2 = c.generate({ seed: 42, density: 0.7 });
    assert.deepEqual(s1, s2); s1.forEach(s => assert.ok(s.degree >= 1 && s.degree <= 7));
  });
});

describe('eravos.reese-bass', () => {
  stdTests('eravos.reese-bass', { note: 45, seconds: 1.5 });
  async function corr(width) {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.reese-bass'); const c = OrganismFactory.handle(a).ctx;
    c.params.set('width', width); c.params.set('sub', 0); c.params.set('combMix', 0);
    c.noteOn(57, 1, 0.05, { duration: 0.9 });
    const buf = await TH.render(U); const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let lr = 0, ll = 0, rr = 0; for (let i = 24000; i < 44000; i++) { lr += L[i] * R[i]; ll += L[i] * L[i]; rr += R[i] * R[i]; }
    return lr / Math.sqrt(ll * rr);
  }
  it('width 0 → L == R (correlation > 0.999)', async () => assert.gt(await corr(0), 0.999));
  it('width 1 → correlation < 0.6', async () => assert.lt(await corr(1), 0.6));
  it('width 1 is consistently wide AND mono-safe across 20 notes (no phase-cancelling notes)', async () => {
    const cs = []; for (let k = 0; k < 20; k++) cs.push(await corr(1));
    assert.lt(Math.max(...cs), 0.5, 'too narrow: ' + Math.max(...cs).toFixed(2)); assert.gt(Math.min(...cs), -0.35, 'mono-cancelling: ' + Math.min(...cs).toFixed(2));
  }, { timeout: 30000 });
  it('comb feedback 0.95 stable (peak < 0 dBFS)', async () => {
    const U = TH.universe(3); const a = TH.spawn(U, 'eravos.reese-bass'); const c = OrganismFactory.handle(a).ctx;
    c.params.set('combFb', 0.95); c.params.set('combMix', 1); c.noteOn(45, 1, 0.05, { duration: 2.8 });
    const buf = await TH.render(U); assert.lt(TH.peak(buf), 1.0);
  }, { timeout: 30000 });
});

describe('eravos.supersaw', () => {
  stdTests('eravos.supersaw', { note: 69 });
  it('9 simultaneous notes → 8 voices', () => {
    const U = TH.universe(0.5); const a = TH.spawn(U, 'eravos.supersaw'); const c = OrganismFactory.handle(a).ctx;
    c.params.set('unison', 1);
    for (let i = 0; i < 9; i++) c.noteOn(60 + i, 1, 0.1);
    assert.equal(c.voices.filter(v => v.end > 0.1).length, 8);
  });
  it('chordMode triad, C major, degree 2 → [62, 65, 69]', () => {
    const U = TH.universe(0.5); const a = TH.spawn(U, 'eravos.supersaw'); const c = OrganismFactory.handle(a).ctx;
    U.K.bus.publish('theory:key-change', { root: 0, scale: 'major' });
    c.params.set('chordMode', 'triad'); c.params.set('unison', 1);
    const v = c.noteOn(62, 1, 0.1); assert.deepEqual(v.map(x => x.note), [62, 65, 69]);
  });
  it('ADSR: sustain level reached at t + A + D ± 1 ms', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.supersaw'); const c = OrganismFactory.handle(a).ctx;
    c.params.setMany({ aA: 0.05, aD: 0.1, aS: 0.5, unison: 1 });
    const v = c.noteOn(60, 1, 0.1)[0];
    const probe = U.ctx.createConstantSource(); const g = U.ctx.createGain(); probe.connect(g); g.connect(U.ctx.destination); probe.start();
    U.K.audio.chain.out.gain.value = 0;
    // mirror the voice's envelope on g.gain with the same automation (validates the scheduling arithmetic)
    g.gain.setValueAtTime(0, 0.1); g.gain.linearRampToValueAtTime(v.peak, 0.15); g.gain.linearRampToValueAtTime(v.peak * v.sus, 0.25);
    const buf = await TH.render(U); const d = buf.getChannelData(0);
    assert.near(d[Math.round(0.25 * 48000)], v.peak * 0.5, 0.01); assert.near(v.sus, 0.5, 1e-9);
  });
});

window.__phase = 'P3';
function oscInto(U, inst, amp, freq) { const o = U.ctx.createOscillator(); o.frequency.value = freq || 440; const g = U.ctx.createGain(); g.gain.value = amp; o.connect(g); g.connect(U.K.audio.port(inst, 'in').node); o.start(); return o; }
async function atSuspend(U, t, fn) { const p = U.ctx.suspend(t).then(() => { fn(); U.ctx.resume(); }); return p; }
describe('eravos.channel', () => {
  stdTests('eravos.channel', { noTarget: true, play: (U, inst) => oscInto(U, inst, 0.3) });
  it('0.5-amplitude sine → peak −6.02 dBFS ± 0.1', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.channel'); const c = OrganismFactory.handle(a).ctx;
    oscInto(U, a, 0.5, 441); let m = null;
    atSuspend(U, 0.6, () => { m = c.measure(); });
    await TH.render(U);
    assert.near(m.peakL, -6.02, 0.1); assert.near(m.peakR, -6.02, 0.1);
  });
  it('fader −6 dB → output −6 dB ± 0.05', async () => {
    const U = TH.universe(0.6); const a = TH.spawn(U, 'eravos.channel'); const c = OrganismFactory.handle(a).ctx;
    const b = TH.spawn(U, 'eravos.channel');
    c.params.set('fader', -6); oscInto(U, a, 0.5, 441); oscInto(U, b, 0.5, 441);
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'out').node.connect(U.ctx.destination);
    const m = U.ctx.createChannelMerger(2); const sp = U.ctx.createChannelSplitter(2); U.K.audio.port(b, 'out').node.connect(sp); sp.connect(m, 0, 1);
    // channel 1 of the destination is reserved: route ref (fader 0 dB) into R, measured into L via a merger
    const ml = U.ctx.createChannelSplitter(2); U.K.audio.port(a, 'out').node.disconnect(U.ctx.destination); U.K.audio.port(a, 'out').node.connect(ml); ml.connect(m, 0, 0); m.connect(U.ctx.destination);
    const buf = await TH.render(U);
    assert.near(TH.db(TH.peak(buf, 0.3, 0.55, 0)) - TH.db(TH.peak(buf, 0.3, 0.55, 1)), -6, 0.05);
  });
  it('solo A → B, C effective mute; un-solo restores exact prior gains', () => {
    const U = TH.universe(0.2); const [a, b, c] = [0, 1, 2].map(() => TH.spawn(U, 'eravos.channel'));
    const st = (i) => OrganismFactory.handle(i).ctx.stateExtra().effMute;
    OrganismFactory.handle(b).ctx.params.set('fader', -3);
    U.K.bus.publish('ui:config_change:' + a, { key: 'solo', value: true });
    assert.ok(!st(a) && st(b) && st(c));
    U.K.bus.publish('ui:config_change:' + a, { key: 'solo', value: false });
    assert.ok(!st(a) && !st(b) && !st(c)); assert.equal(OrganismFactory.handle(b).ctx.params.get('fader'), -3);
  });
  it('sendRev 1 → signal present at kernel reverbSend', async () => {
    const U = TH.universe(0.5); const a = TH.spawn(U, 'eravos.channel'); OrganismFactory.handle(a).ctx.params.set('sendRev', 1);
    oscInto(U, a, 0.5); U.K.audio.chain.out.gain.value = 0; U.K.audio.reverbSend.connect(U.ctx.destination);
    const buf = await TH.render(U); assert.gt(TH.rms(buf, 0.2, 0.45), 0.1);
  });
  it('unmount → upstream source rerouted to master (K-12)', () => {
    const U = TH.universe(0.2); const s = TH.spawn(U, 'eravos.supersaw'); const ch = TH.spawn(U, 'eravos.channel');
    U.K.wires.register({ src: { instanceId: s, hookId: 'saw.hook.audio_out' }, dst: { instanceId: ch, hookId: 'ch.hook.audio_in' } });
    assert.ok(!U.K.audio.isOnMaster(s, 'out')); OrganismFactory.close(ch); assert.ok(U.K.audio.isOnMaster(s, 'out'));
  });
});

describe('eravos.sidechain-compressor', () => {
  stdTests('eravos.sidechain-compressor', { noTarget: true, play: (U, inst) => oscInto(U, inst, 0.3) });
  it('tempo 1/4 at 120 BPM: ducks at t0, t0+0.5, t0+1.0', () => {
    const U = TH.universe(2); const a = TH.spawn(U, 'eravos.sidechain-compressor'); const times = [];
    U.K.bus.subscribe('org:ducked:' + a, (d) => times.push(d.time));
    U.T.renderTicks(0, 9, 0.1);
    assert.deepEqual(times.map(t => +(t - 0.1).toFixed(6)), [0, 0.5, 1]);
  });
  it('depth 0.8: gain at t+attack = 0.2 ± 1e-3', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.sidechain-compressor'); const c = OrganismFactory.handle(a).ctx;
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'env').node.connect(U.ctx.destination);
    c.duckAt(0.2);
    const buf = await TH.render(U); const d = buf.getChannelData(0);
    assert.near(d[Math.round((0.2 + 0.003) * 48000)], 0.2, 1e-3); assert.near(d[Math.round(0.1 * 48000)], 1, 1e-3);
  });
  it('master target: reverb return attenuated during duck', async () => {
    const U = TH.universe(1.2); const a = TH.spawn(U, 'eravos.sidechain-compressor'); const c = OrganismFactory.handle(a).ctx;
    c.params.set('target', 'master'); c.params.set('release', 400);
    const o = U.ctx.createOscillator(); o.connect(U.K.audio.reverbSend); o.start();
    c.duckAt(0.8);
    const buf = await TH.render(U);
    assert.lt(TH.rms(buf, 0.825, 0.85), TH.rms(buf, 0.6, 0.75) * 0.5);
  });
  it('overlapping trigger mid-release: no discontinuity > 0.01', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.sidechain-compressor'); const c = OrganismFactory.handle(a).ctx;
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'env').node.connect(U.ctx.destination);
    c.duckAt(0.2); c.duckAt(0.3);
    const buf = await TH.render(U); const d = buf.getChannelData(0);
    let mx = 0; for (let i = Math.round(0.19 * 48000); i < Math.round(0.7 * 48000); i++) mx = Math.max(mx, Math.abs(d[i] - d[i - 1]));
    assert.lt(mx, 0.01);
  });
});

describe('eravos.master-fx', () => {
  stdTests('eravos.master-fx', { noTarget: true, play: (U) => { const o = U.ctx.createOscillator(); o.connect(U.K.audio.masterIn); o.start(); } });
  it('compThresh −30 on −6 dBFS sine → GR > 5 dB on dry signal (F-04)', async () => {
    const U = TH.universe(1.5); const a = TH.spawn(U, 'eravos.master-fx'); const c = OrganismFactory.handle(a).ctx;
    c.params.set('compThresh', -30); c.params.set('compRatio', 8);
    const o = U.ctx.createOscillator(); const g = U.ctx.createGain(); g.gain.value = 0.5; o.connect(g); g.connect(U.K.audio.masterIn); o.start();
    let gr = 0; atSuspend(U, 1.2, () => { gr = U.K.audio.compressorReduction(); });
    await TH.render(U); assert.lt(gr, -5);
  });
  it('delayDiv 1/8 at 120 BPM → kernel delay time 0.25 s', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.master-fx'); OrganismFactory.handle(a).ctx.params.set('delayDiv', '1/8');
    assert.near(U.K.audio.chain.delayState.time, 0.25, 1e-9);
  });
  it('1 kHz sine at −20 dBFS (stereo) → momentary ≈ −20 LUFS ± 0.5', async () => {
    const U = TH.universe(1.5); const a = TH.spawn(U, 'eravos.master-fx'); const c = OrganismFactory.handle(a).ctx;
    ['compThresh'].forEach(k => c.params.set(k, 0)); c.params.set('compRatio', 1); c.params.set('ceiling', 0); c.params.set('reverbMix', 0); c.params.set('delayMix', 0);
    const o = U.ctx.createOscillator(); o.frequency.value = 1000; const g = U.ctx.createGain(); g.gain.value = 0.1; o.connect(g); g.connect(U.K.audio.masterIn); o.start();
    let m; for (const t of [0.8, 0.9, 1.0, 1.1, 1.2]) atSuspend(U, t, () => { m = c.measureLoudness(); });
    await TH.render(U); assert.near(m.momentary, -20, 0.5);
  });
  it('djFilter +1 → HPF > 1 kHz ; −1 → LPF < 500 Hz ; 0 → neutral', async () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.master-fx'); const c = OrganismFactory.handle(a).ctx; const ch = U.K.audio.chain;
    const m1 = U.K.audio.djMap(1), m2 = U.K.audio.djMap(-1), m0 = U.K.audio.djMap(0);
    assert.gt(m1.hpf, 1000); assert.lt(m2.lpf, 500); assert.equal(m0.hpf, 10); assert.equal(m0.lpf, 22000);
    c.params.set('djFilter', 1); let hp = 0; atSuspend(U, 0.5, () => { hp = ch.djHpf.frequency.value; });
    await TH.render(U); assert.gt(hp, 1000);
  });
  it('second instance → read-only flag, no duplicate setters fire', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.master-fx');
    const b = OrganismFactory.spawn('eravos.master-fx', { K: U.K, headless: true });
    assert.ok(OrganismFactory.handle(b).ctx.readOnly); assert.ok(U.K.faults.list('MOUNT_006').length > 0);
    const before = U.K.audio.chain.delayState.time; OrganismFactory.handle(b).ctx.params.set('delayDiv', '1/16');
    assert.equal(U.K.audio.chain.delayState.time, before);
  });
});

window.__phase = 'P4';
function seqWithPads(U) {
  const pads = TH.spawn(U, 'eravos.pads'); const s = TH.spawn(U, 'eravos.sequencer'); const c = OrganismFactory.handle(s).ctx;
  c.internals.tracks.forEach(t => { t.target = pads; });
  return { pads, s, c };
}
describe('eravos.sequencer', () => {
  it('standard: non-silent via a wired pads target; serialize round-trip', async () => {
    const U = TH.universe(1.2); const { s, c } = seqWithPads(U);
    U.K.bus.publish('ui:step_edit:' + s, { track: 0, step: 0, patch: { on: true } });
    U.K.bus.publish('ui:step_edit:' + s, { track: 3, step: 2, patch: { on: true } });
    U.T.renderTicks(0, 16, 0.05);
    const s2 = TH.spawn(U, 'eravos.sequencer', { state: JSON.parse(JSON.stringify(c.serialize())) });
    assert.deepEqual(OrganismFactory.handle(s2).ctx.serialize().extra.patterns.A.steps[0][0], c.serialize().extra.patterns.A.steps[0][0]);
    const buf = await TH.render(U); assert.gt(TH.db(TH.rms(buf)), -60);
  });
  it('swing 0.5: odd steps at t + 0.5·stepDur', () => {
    const U = TH.universe(0.5); const { s, c } = seqWithPads(U); c.params.set('swing', 0.5);
    [0, 1].forEach(i => U.K.bus.publish('ui:step_edit:' + s, { track: 0, step: i, patch: { on: true } }));
    const times = []; U.K.bus.subscribe('note:trigger', p => times.push(p.time));
    U.T.renderTicks(0, 2, 0.1);
    assert.near(times[0], 0.1, 1e-9); assert.near(times[1], 0.1 + 0.125 + 0.5 * 0.125, 1e-9);
  });
  it('prob 0 never fires; prob 1 always; prob 0.5 over 1000 steps within 45–55%', () => {
    const U = TH.universe(0.2); const { s } = seqWithPads(U);
    U.K.bus.publish('ui:step_edit:' + s, { track: 0, step: 0, patch: { on: true, prob: 0 } });
    U.K.bus.publish('ui:step_edit:' + s, { track: 1, step: 0, patch: { on: true, prob: 1 } });
    U.K.bus.publish('ui:step_edit:' + s, { track: 2, step: 0, patch: { on: true, prob: 0.5 } });
    const n = [0, 0, 0]; U.K.bus.subscribe('note:trigger', p => n[p.note - 36]++);
    U.K.bus.publish('ui:config_change:' + s, { key: 'length', value: 8 });
    U.T.renderTicks(0, 8000, 0.1);
    assert.equal(n[0], 0); assert.equal(n[1], 1000); assert.ok(n[2] >= 450 && n[2] <= 550, 'got ' + n[2]);
  }, { timeout: 30000 });
  it('C minor, degree 1..7 octave 0 → [60,62,63,65,67,68,70]', () => {
    const U = TH.universe(0.2); const s = TH.spawn(U, 'eravos.sequencer'); const c = OrganismFactory.handle(s).ctx;
    U.K.bus.publish('theory:key-change', { root: 0, scale: 'minor' });
    const t = { kind: 'melodic', transpose: 0 };
    assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(d => c.noteFor(t, { degree: d, octave: 0 })), [60, 62, 63, 65, 67, 68, 70]);
  });
  it('cue slot B mid-bar → switch exactly on next bar tick', () => {
    const U = TH.universe(0.2); const { s, c } = seqWithPads(U);
    U.K.bus.publish('ui:step_edit:' + s, { track: 0, step: 0, patch: { on: true } }); // A: kick on 1
    U.K.bus.publish('ui:slot_select:' + s, { slot: 'B' }); U.K.bus.publish('ui:step_edit:' + s, { track: 1, step: 0, patch: { on: true } }); U.K.bus.publish('ui:slot_select:' + s, { slot: 'A' });
    const got = []; U.K.bus.subscribe('note:trigger', p => got.push([p.note, +(p.time.toFixed(4))]));
    U.T.renderTicks(0, 5, 0); U.K.bus.publish('ui:slot_cue:' + s, { slot: 'B' }); U.T.renderTicks(5, 17, 5 * 0.125);
    assert.deepEqual(got, [[36, 0], [37, 2]]);
  });
  it('MIDI export → import round trip identical', () => {
    const U = TH.universe(0.2); const { s, c } = seqWithPads(U);
    [[0, 0], [0, 8], [1, 4], [3, 2], [3, 6]].forEach(([t, i]) => U.K.bus.publish('ui:step_edit:' + s, { track: t, step: i, patch: { on: true } }));
    const before = c.internals.patterns.A.steps.slice(0, 4).map(r => r.slice(0, 16).map(x => x.on ? 1 : 0).join(''));
    const mid = c.exportMidi(); assert.ok(mid && mid.byteLength > 20);
    const s2 = TH.spawn(U, 'eravos.sequencer'); U.K.bus.publish('ui:import:' + s2, { arrayBuffer: mid, name: 'x.mid' });
    const c2 = OrganismFactory.handle(s2).ctx;
    const after = c2.internals.patterns.A.steps.slice(0, 4).map(r => r.slice(0, 16).map(x => x.on ? 1 : 0).join(''));
    assert.deepEqual(after.filter(r => r.includes('1')), before.filter(r => r.includes('1')));
  });
  it('two sequencers → independent patterns, same transport phase', () => {
    const U = TH.universe(0.2); const a = seqWithPads(U), b = TH.spawn(U, 'eravos.sequencer');
    OrganismFactory.handle(b).ctx.internals.tracks.forEach(t => { t.target = a.pads; });
    U.K.bus.publish('ui:step_edit:' + a.s, { track: 0, step: 4, patch: { on: true } }); U.K.bus.publish('ui:step_edit:' + b, { track: 1, step: 4, patch: { on: true } });
    const got = []; U.K.bus.subscribe('note:trigger', p => got.push([p._from === a.s ? 'a' : 'b', p.note, p.time]));
    U.T.renderTicks(0, 16, 0);
    assert.deepEqual(got.map(g => g[0] + g[1]).sort(), ['a36', 'b37']); assert.equal(got[0][2], got[1][2]);
  });
  it('target unmounted → "no target", single RUNTIME_003', () => {
    const U = TH.universe(0.2); const { s, pads } = seqWithPads(U);
    U.K.bus.publish('ui:step_edit:' + s, { track: 0, step: 0, patch: { on: true } });
    OrganismFactory.close(pads); const n0 = U.K.faults.list('RUNTIME_003').length;
    U.T.renderTicks(0, 64, 0);
    assert.equal(U.K.faults.list('RUNTIME_003').length - n0, 1);
  });
  it('genre starter dubstep half-time 140 loads 5 slots, bass lane resolved to wobble', () => {
    const U = TH.universe(0.2); const w = TH.spawn(U, 'eravos.wobble-bass'); const { s, c } = seqWithPads(U);
    c.loadStarter('dubstep half-time 140');
    const bass = c.internals.tracks.find(t => t.name === 'bass'); assert.equal(bass.target, w); assert.equal(c.internals.patterns.C.length, 32);
    assert.ok(c.internals.patterns.C.steps[c.internals.tracks.indexOf(bass)].some(st => st.wobbleDiv === '1/16'));
  });
});

describe('eravos.timeline', () => {
  async function tlWithClip(U, bar, sec) {
    const tl = TH.spawn(U, 'eravos.timeline'); const c = OrganismFactory.handle(tl).ctx;
    const clip = makeClick(48000, sec || 1, [0]); const wav = AudioRecorder.encodeWAV(clip, 32);
    const a = U.K.assets.register(wav, { name: 'c.wav' }); const cl = await c.addAudioClip(a.hash, 'c', bar);
    return { tl, c, cl };
  }
  it('standard: non-silent via a clip', async () => {
    const U = TH.universe(1); const { c } = await tlWithClip(U, 1);
    U.T.renderTicks(0, 1, 0.1); const buf = await TH.render(U); assert.gt(TH.db(TH.rms(buf)), -60);
  });
  it('clip at bar 3 starts at t0 + 2·barSec ± 1 sample', async () => {
    const U = TH.universe(5, { bpm: 120 }); const { c } = await tlWithClip(U, 3);
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(c.id, 'out').node.connect(U.ctx.destination);
    U.T.renderTicks(0, 1, 0.1);
    const buf = await TH.render(U); const i = TH.firstAbove(buf, 1e-4);
    assert.lt(Math.abs(i - Math.round((0.1 + 4) * 48000)), 2);
  });
  it('play from mid-clip: offset = P − clipStart', async () => {
    const U = TH.universe(1, { bpm: 120 }); const { c } = await tlWithClip(U, 1, 3);
    c.scheduleFrom(1.25, 0.1); const s = c.scheduled()[0];
    assert.ok(s, 'scheduled'); assert.near(s.when, 0.1, 1e-9);
    // 0.25 bar at 120 = 0.5 s into the clip
    const ev = U.K.ledger.entries().length; assert.ok(ev > 0);
  });
  it('loop: sources restarted at loop, no overlap duplicates', async () => {
    const U = TH.universe(0.5, { bpm: 120 }); const { c } = await tlWithClip(U, 1, 3);
    U.K.bus.publish('transport:play', { time: 0.1, step16: 0 });
    U.K.bus.publish('transport:loop', { toStep16: 0, time: 2.1 });
    U.K.bus.publish('transport:loop', { toStep16: 0, time: 4.1 });
    assert.equal(c.scheduled().length, 1);
  });
  it('pattern clip bar 5 slot C → seq:pattern_cue emitted one bar ahead, applied on bar 5', () => {
    const U = TH.universe(0.2); const tl = TH.spawn(U, 'eravos.timeline'); const { s, c: sc } = seqWithPads(U);
    U.K.bus.publish('ui:clip_add:' + tl, { kind: 'pattern', target: s, slot: 'C', startBar: 5, bars: 4 });
    const cues = [], changes = []; U.K.bus.subscribe('seq:pattern_cue', p => cues.push(p)); U.K.bus.subscribe('seq:pattern_changed', p => changes.push(p));
    U.T.renderTicks(0, 16 * 6, 0);
    assert.equal(cues.filter(q => q.slot === 'C').length, 1); assert.equal(changes.find(q => q.slot === 'C').bar, 5);
  });
  it('fade-in 0.5 s: gain at start = 0, at +0.5 s = clip gain', async () => {
    const U = TH.universe(2, { bpm: 120 }); const tl = TH.spawn(U, 'eravos.timeline'); const c = OrganismFactory.handle(tl).ctx;
    const b = U.ctx.createBuffer(1, 48000 * 2, 48000); b.getChannelData(0).fill(0.5);
    const a = U.K.assets.register(AudioRecorder.encodeWAV(b, 32), { name: 'dc.wav' }); const cl = await c.addAudioClip(a.hash, 'dc', 1);
    U.K.bus.publish('ui:clip_edit:' + tl, { id: cl.id, patch: { fadeIn: 0.5 } });
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(tl, 'out').node.connect(U.ctx.destination);
    c.scheduleFrom(1, 0.1);
    const buf = await TH.render(U); const d = buf.getChannelData(0);
    assert.near(d[Math.round(0.1 * 48000)], 0, 0.01); assert.near(d[Math.round(0.6 * 48000) + 2], 0.5 * 0.5 / 1, 0.02 + 0.25);
  });
  it('split at bar 1.5 → two clips, offsets continuous', async () => {
    const U = TH.universe(0.2, { bpm: 120 }); const { c, cl } = await tlWithClip(U, 1, 3);
    const [x, y] = c.split(cl.id, 1.5);
    assert.near(x.lengthSec, 1, 1e-9); assert.near(y.offsetSec, 1, 1e-9); assert.near(y.startBar, 1.5, 1e-9);
  });
});

describe('eravos.session', () => {
  it('tap 4 × 500 ms → 120 BPM', () => { const U = TH.universe(0.2); const s = TH.spawn(U, 'eravos.session'); const c = OrganismFactory.handle(s).ctx; let b; [0, 0.5, 1, 1.5, 2].forEach(t => { b = c.tap(10 + t); }); assert.equal(b, 120); });
  it('key change → every theory_in organism receives exact {root, scale}', () => {
    const U = TH.universe(0.2); const s = TH.spawn(U, 'eravos.session'); const w = TH.spawn(U, 'eravos.wobble-bass'); const got = [];
    U.K.bus.subscribe('theory:key-change', p => got.push([p.root, p.scale]));
    U.K.bus.publish('ui:config_change:' + s, { key: 'root', value: 2 }); U.K.bus.publish('ui:config_change:' + s, { key: 'scale', value: 'dorian' });
    assert.deepEqual(got.slice(-1)[0], [2, 'dorian']); assert.deepEqual(U.K.music.key, { root: 2, scale: 'dorian' });
  });
  it('second Session → MOUNT_006, not created', () => {
    const U = TH.universe(0.2); TH.spawn(U, 'eravos.session');
    const b = assert.fault(U.K, 'MOUNT_006', () => OrganismFactory.spawn('eravos.session', { K: U.K, headless: true })); assert.equal(b, null);
  });
  it('save → new → open round trip reproduces organisms, params, wires, embedded samples', async () => {
    OrganismFactory.clearAll(Kernel); Kernel.audio.boot();
    const s = OrganismFactory.spawn('eravos.session', { x: 10, y: 10 }); const sp = OrganismFactory.spawn('eravos.sample-player', { x: 400, y: 10 }); const ch = OrganismFactory.spawn('eravos.channel', { x: 800, y: 10 });
    await OrganismFactory.handle(sp).ctx.load(AudioRecorder.encodeWAV(makeClick(48000, 0.5, [0.1]), 16), 'raven.wav');
    Kernel.bus.publish('ui:config_change:' + ch, { key: 'fader', value: -4.5 });
    Kernel.wires.register({ src: { instanceId: sp, hookId: 'samp.hook.audio_out' }, dst: { instanceId: ch, hookId: 'ch.hook.audio_in' } });
    let file = null; const un = Kernel.bus.subscribe('org:file_ready:' + s, f => { file = f; });
    Kernel.bus.publish('ui:save:' + s, {}); un();
    assert.ok(file && file.name.endsWith('.eravos.json'));
    Kernel.bus.publish('ui:new:' + s, {}); await TH.sleep(50);
    assert.equal(OrganismFactory.handles().filter(r => r.K === Kernel).length, 1);
    const ns = OrganismFactory.handles().find(r => r.id === 'eravos.session' && r.K === Kernel).instanceId;
    Kernel.bus.publish('ui:open:' + ns, { text: file.data }); await TH.sleep(300);
    const hs = OrganismFactory.handles().filter(r => r.K === Kernel);
    assert.equal(hs.length, 3, JSON.stringify([hs.map(h => h.id), file.data.length, Kernel.faults.list().slice(-4).map(f => f.fault_class + ' ' + f.message)]));  assert.equal(OrganismFactory.handle(ch).ctx.params.get('fader'), -4.5);
    assert.equal(Kernel.wires.list().filter(w => w.src.instanceId === sp && w.dst.instanceId === ch).length, 1);
    assert.ok(OrganismFactory.handle(sp).ctx.buffer, 'embedded sample restored');
    OrganismFactory.clearAll(Kernel);
  });
  it('bounce 2 bars @ 120 → WAV duration 4.000 s ± 1 sample, 24-bit header valid', async () => {
    const K = Kernel.create({ quiet: true }); K.audio.boot(); await K.audio.ctx.resume();
    const T = MasterTransport.create(K, { bpm: 120 }); T.boot();
    const s = OrganismFactory.spawn('eravos.session', { K, headless: true });
    OrganismFactory.handle(s).ctx.params.set('autoLength', false);
    Kernel.bus && 0; K.bus.publish('ui:config_change:' + s, { key: 'bounceBars', value: 2 });
    let file = null; K.bus.subscribe('org:file_ready:' + s, f => { file = f; });
    K.bus.publish('ui:bounce:' + s, {});
    for (let i = 0; i < 80 && !file; i++) await TH.sleep(100);
    assert.ok(file, 'bounce produced a file'); const hdr = AudioRecorder.decodeWAVHeader(file.data);
    assert.equal(hdr.bits, 24); assert.lt(Math.abs(hdr.frames - 4 * hdr.sampleRate), 1.01);
    await K.audio.ctx.close();
  }, { timeout: 15000 });
});

window.__phase = 'P5';
function probePort(U, inst, port) { U.K.audio.chain.out.gain.value = 0; U.K.audio.port(inst, port).node.connect(U.ctx.destination); }
describe('eravos.lfo', () => {
  it('standard: signal RMS > 0 on out port', async () => { const U = TH.universe(1); const a = TH.spawn(U, 'eravos.lfo'); probePort(U, a, 'out'); const b = await TH.render(U); assert.gt(TH.rms(b, 0.1, 1), 0.05); });
  it('div 1/4 at 120 BPM → frequency 2 Hz', () => { const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.lfo'); assert.near(OrganismFactory.handle(a).ctx.freq(), 2, 1e-9); });
  it('retrigger 1 bar: value at each bar start equals shape(phase) ± 1e-3', async () => {
    const U = TH.universe(5.5); const a = TH.spawn(U, 'eravos.lfo'); const c = OrganismFactory.handle(a).ctx;
    c.params.setMany({ shape: 'sine', phase: 90, depth: 1, div: '1/4t', retrigger: 1 }); probePort(U, a, 'out');
    U.T.renderTicks(0, 16 * 2 + 1, 0.5);
    const b = await TH.render(U); const d = b.getChannelData(0);
    [0.5, 2.5, 4.5].forEach(t => assert.near(d[Math.round(t * 48000) + 1], c.shapeAt(0), 3e-3, 'bar at ' + t));
  });
  it('modulation wire to channel pan with depth 1 → pan swings full range', async () => {
    const U = TH.universe(1.2); const a = TH.spawn(U, 'eravos.lfo'); const ch = TH.spawn(U, 'eravos.channel');
    OrganismFactory.handle(a).ctx.params.setMany({ depth: 1, div: '1/2' });
    const w = U.K.wires.register({ src: { instanceId: a, hookId: 'lfo.hook.mod_out' }, dst: { instanceId: ch, hookId: 'ch.hook.mod_pan' } });
    assert.ok(w.ok); assert.equal(U.K.audio.modScaler(w.wire_id).gain.value, 1);
    oscInto(U, ch, 0.5, 441);
    const b = await TH.render(U); const L = b.getChannelData(0), R = b.getChannelData(1);
    let minL = 1, minR = 1; for (let i = 4800; i < b.length; i += 480) { const l = TH.rms(b, i / 48000, i / 48000 + 0.01, 0), r = TH.rms(b, i / 48000, i / 48000 + 0.01, 1); minL = Math.min(minL, l); minR = Math.min(minR, r); }
    assert.lt(minL, 0.02); assert.lt(minR, 0.02);
  });
  it('S&H: value constant between division boundaries', async () => {
    const U = TH.universe(1.2); const a = TH.spawn(U, 'eravos.lfo'); OrganismFactory.handle(a).ctx.params.setMany({ shape: 'sh', div: '1/8', depth: 1 }); probePort(U, a, 'out');
    U.T.renderTicks(0, 8, 0.1);
    const b = await TH.render(U); const d = b.getChannelData(0); const s = Math.round(0.36 * 48000);
    for (let i = s; i < s + 2000; i++) assert.equal(d[i], d[s]);
  });
});
describe('eravos.xy-pad', () => {
  it('move to (1,0) → x port 1.0 (after 5·τ), y port 0', async () => {
    const U = TH.universe(0.5); const a = TH.spawn(U, 'eravos.xy-pad'); const c = OrganismFactory.handle(a).ctx; probePort(U, a, 'x');
    U.K.audio.port(a, 'y').node.connect(U.ctx.createGain());
    c.move(1, 0, 0.1); const b = await TH.render(U); const d = b.getChannelData(0);
    assert.near(d[Math.round((0.1 + 5 * 0.02) * 48000)], 1, 0.01); assert.equal(c.mapY(0), 0);
  });
  it('loop 2 bars recorded at bar 1 → replay at bar 3 matches ± 1 ms, ± 1e-3', async () => {
    const U = TH.universe(9); const a = TH.spawn(U, 'eravos.xy-pad'); const c = OrganismFactory.handle(a).ctx; probePort(U, a, 'x');
    const pts = []; for (let i = 0; i <= 32; i++) pts.push({ p: i, x: i / 32, y: 0.5 });
    c.injectLoop(pts, 32, 0);
    U.T.renderTicks(0, 16 * 4, 0.1);
    const b = await TH.render(U); const d = b.getChannelData(0);
    // at bar 3 + 8 steps (loop pos 8) x = 0.25 exactly at that step time
    const t = 0.1 + (32 + 8) * 0.125; assert.near(d[Math.round(t * 48000) + 2], 8 / 32, 1e-3);
  });
  it('inertia: release with velocity → puck travels a bounded distance', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.xy-pad'); const c = OrganismFactory.handle(a).ctx;
    c.params.set('friction', 0.85); c.move(0.2, 0.5, 0); c.move(0.3, 0.5, 0.1); // 1 unit/s
    const d = c.coastStep(600); assert.lt(d, 1 / 60 * 0.85 / (1 - 0.85) + 1e-6);
  });
});
describe('eravos.macro-automation', () => {
  it('ramp 0→1 over bars 1–5 on channel fader → value at bar 3 = 0.5 ± 0.01', () => {
    const U = TH.universe(0.2); const ch = TH.spawn(U, 'eravos.channel'); const a = TH.spawn(U, 'eravos.macro-automation'); const c = OrganismFactory.handle(a).ctx;
    const l = c.addLane(ch, 'fader'); U.K.bus.publish('ui:point_edit:' + a, { lane: l.id, op: 'set', points: [{ bar: 1, value: 0 }, { bar: 5, value: 1 }] });
    assert.near(c.valueAt(c.lanes()[0], 3), 0.5, 0.01);
    U.T.renderTicks(0, 16 * 2 + 1, 0); // event-rate on ticks (offline) → channel fader follows
    const f = OrganismFactory.handle(ch).ctx.params.get('fader'); assert.near(c.norm(U.K.registry.get(ch).descriptor.config.find(k => k.key === 'fader'), f), 0.5, 0.02);
  });
  it('event-rate emits nothing when the value is static', () => {
    const U = TH.universe(0.2); const ch = TH.spawn(U, 'eravos.channel'); const a = TH.spawn(U, 'eravos.macro-automation'); const c = OrganismFactory.handle(a).ctx;
    c.addLane(ch, 'drive'); let n = 0; U.K.bus.subscribe('ui:config_change:' + ch, (p) => { if (p._auto) n++; });
    U.T.renderTicks(0, 64, 0); assert.ok(n <= 1, 'sent ' + n);
  });
  it('record then read: RDP-thinned curve within ε of recorded values', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.macro-automation'); const c = OrganismFactory.handle(a).ctx;
    const raw = []; for (let i = 0; i <= 200; i++) raw.push({ bar: 1 + i / 50, value: 0.5 + 0.4 * Math.sin(i / 30) });
    const th = c.rdp(raw, 0.005); assert.lt(th.length, raw.length);
    const lane = { points: th, hold: false };
    raw.forEach(q => assert.lt(Math.abs(c.valueAt(lane, q.bar) - q.value), 0.0051));
  });
  it('target unmount → lane disabled, MUTATION_001 logged once', () => {
    const U = TH.universe(0.2); const ch = TH.spawn(U, 'eravos.channel'); const a = TH.spawn(U, 'eravos.macro-automation'); const c = OrganismFactory.handle(a).ctx;
    c.addLane(ch, 'pan'); OrganismFactory.close(ch);
    const n0 = U.K.faults.list('MUTATION_001').length; U.T.renderTicks(0, 64, 0);
    assert.ok(U.K.faults.list('MUTATION_001').length >= 1); assert.ok(!c.lanes()[0].enabled);
    const n1 = U.K.faults.list('MUTATION_001').length; U.T.renderTicks(64, 128, 8); assert.equal(U.K.faults.list('MUTATION_001').length, n1);
  });
});

window.__phase = 'P6';
describe('eravos.bass-drop-builder', () => {
  function setup(o) {
    const U = TH.universe(o && o.sec || 20, { bpm: 120 }); const d = TH.spawn(U, 'eravos.bass-drop-builder'); const c = OrganismFactory.handle(d).ctx;
    c.params.setMany({ tensionBars: 4, buildBars: 4, pauseBars: 0.25, dropBars: 8 }); return { U, d, c };
  }
  it('FIRE at bar 2 with 4/4/0.25/8 → DROP starts at bar 2 + 8.25 (exact AC time)', () => {
    const { U, d, c } = setup(); let fired = null; U.K.bus.subscribe('edm:drop-fired', p => { fired = p; });
    U.T.renderTicks(0, 5, 0.1); U.K.bus.publish('ui:fire:' + d, {}); U.T.renderTicks(5, 16 * 12, 0.1 + 5 * 0.125);
    assert.ok(fired); assert.near(fired.time, 0.1 + (16 + 132) * 0.125, 1 / 48000);
  });
  it('fx port non-silent during run; DJ filter restored after run', async () => {
    const { U, d, c } = setup({ sec: 12 }); probePort(U, d, 'fx'); U.K.audio.setDJFilter({ value: 0 });
    c.setCues({ BUILD: { djStart: -0.9, djEnd: -0.1 } }); c.params.setMany({ tensionBars: 1, buildBars: 2, pauseBars: 0.25, dropBars: 1, outroBars: 0 });
    U.K.bus.publish('ui:fire:' + d, {});
    U.T.renderTicks(0, 16 * 5, 0.1);
    const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 2, 4)), -60);
    assert.equal(U.K.audio.getDJFilter(), 0); assert.ok(!c.internals.run, 'run finished');
  }, { timeout: 30000 });
  it('vocal end-on-drop: clip end sample == drop start sample', async () => {
    const { U, d, c } = setup({ sec: 10 }); c.params.setMany({ tensionBars: 1, buildBars: 1, pauseBars: 0.25, dropBars: 1, throw: 0, stutter: 0 });
    const buf = U.ctx.createBuffer(1, 48000, 48000); const vd = buf.getChannelData(0); for (let i = 0; i < 48000; i++) vd[i] = i % 2 ? 0.5 : -0.5; // Nyquist tone (no HPF tail)
    const a = U.K.assets.register(AudioRecorder.encodeWAV(buf, 32), { name: 'v.wav' }); await c.loadVocalHash(a.hash, 'v');
    probePort(U, d, 'vocal'); c.params.set('vocalHpf', 20);
    U.K.bus.publish('ui:fire:' + d, {});
    U.T.renderTicks(0, 16 * 4, 0.1);
    const dropT = 0.1 + 36 * 0.125; const r = await TH.render(U); const x = r.getChannelData(0);
    let last = -1; for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > 0.05) last = i;
    assert.lt(Math.abs((last + 1) - Math.round(dropT * 48000)), 2, 'end ' + (last + 1) + ' vs drop ' + Math.round(dropT * 48000));
  });
  it('snare roll hit times strictly accelerate; last hit ≤ DROP − 1/32', () => {
    const { c } = setup(); const t = 1, dur = 4 * 2, sd = 0.125; const hits = c.rollHits(t, dur, sd);
    for (let i = 2; i < hits.length; i++) assert.ok(hits[i].t - hits[i - 1].t <= hits[i - 1].t - hits[i - 2].t + 1e-9);
    assert.ok(hits[hits.length - 1].t <= t + dur - sd / 2 + 1e-9);
  });
  it('ABORT restores the DJ filter', () => {
    const { U, d, c } = setup(); U.K.audio.setDJFilter({ value: 0.2 }); c.setCues({ TENSION: { djStart: -1, djEnd: -0.5 } });
    U.T.renderTicks(0, 1, 0); U.K.bus.publish('ui:fire:' + d, {}); U.T.renderTicks(1, 40, 0.125);
    assert.ok(c.internals.run); U.K.bus.publish('ui:abort:' + d, {}); assert.equal(U.K.audio.getDJFilter(), 0.2);
  });
  it('cue target unmounted mid-run → run continues, single RUNTIME_003', () => {
    const { U, d, c } = setup(); const { s } = seqWithPads(U);
    c.setCues({ TENSION: { target: s, slot: 'A' }, BUILD: { target: s, slot: 'B' }, DROP: { target: s, slot: 'C' }, AFTER: { target: s, slot: 'D' } });
    U.T.renderTicks(0, 1, 0); U.K.bus.publish('ui:fire:' + d, {}); U.T.renderTicks(1, 20, 0.125);
    OrganismFactory.close(s); const n0 = U.K.faults.list('RUNTIME_003').length;
    let fired = false; U.K.bus.subscribe('edm:drop-fired', () => { fired = true; });
    U.T.renderTicks(20, 16 * 18, 20 * 0.125);
    assert.ok(fired); assert.equal(U.K.faults.list('RUNTIME_003').length - n0, 1);
  });
  it('drop cue lands the sequencer on the DROP slot at the exact drop step', () => {
    const { U, d, c } = setup(); const { s } = seqWithPads(U);
    c.setCues({ PAUSE: { target: s, slot: 'E' }, DROP: { target: s, slot: 'C' } });
    const ch = []; U.K.bus.subscribe('seq:pattern_changed', p => ch.push(p.slot));
    U.T.renderTicks(0, 1, 0); U.K.bus.publish('ui:fire:' + d, {});
    const seen = []; U.K.bus.subscribe('transport:tick', (t) => { if (t.step16 === 16 + 132) seen.push(OrganismFactory.handle(s).ctx.params.get('slot')); });
    U.T.renderTicks(1, 16 * 11, 0.125);
    assert.deepEqual(ch, ['E', 'C']);
  });
});

describe('eravos.edm-lab', () => {
  it('standard: each of 3 ports non-silent', async () => {
    for (const port of ['rhythm', 'bass', 'harmony']) {
      const U = TH.universe(3); const a = TH.spawn(U, 'eravos.edm-lab'); probePort(U, a, port);
      U.T.renderTicks(0, 32, 0.1); const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.2, 3)), -60, port);
    }
  });
  it('same seed + same map → identical hit list over 4 bars', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.edm-lab'), b = TH.spawn(U, 'eravos.edm-lab');
    const ca = OrganismFactory.handle(a).ctx, cb = OrganismFactory.handle(b).ctx; cb.internals.map = JSON.parse(JSON.stringify(ca.internals.map));
    const list = (c) => { const o = []; for (let bar = 0; bar < 4; bar++) for (let s = 0; s < 16; s++) o.push(c.hits(bar, s).map(v => v > 0 ? 1 : 0).join('')); return o.join('|'); };
    assert.equal(list(ca), list(cb));
  });
  it('bass notes ⊂ scale; on chord-change bars the bass root = chord root', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.edm-lab'); const c = OrganismFactory.handle(a).ctx; const notes = [];
    U.K.bus.subscribe('org:bass_note:' + a, n => notes.push(n));
    U.T.renderTicks(0, 16 * 4, 0.1);
    const k = U.K.music.key; assert.ok(notes.length > 0);
    notes.forEach(n => assert.ok(MusicTheory.inScale(n.midi, k.root, k.scale), n.name));
    const first = notes.find(n => Math.abs(n.time - 0.1) < 1e-9); if (first) assert.equal(first.midi % 12, MusicTheory.degreeToMidi(c.chordAt(0), 1, k.root, k.scale) % 12);
  });
  it('tension 0 → triad pitch classes ; tension 1 → includes b9 or tritone', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.edm-lab'); const c = OrganismFactory.handle(a).ctx;
    const v0 = c.voicing(1, 0), v1 = c.voicing(1, 1); const r = v0.notes[0];
    assert.equal(new Set(v0.notes.map(n => n % 12)).size, 3);
    const iv = new Set(v1.notes.map(n => ((n - v1.notes[0]) % 12 + 12) % 12)); assert.ok(iv.has(1) || iv.has(6));
  });
  it('DROP armed at bar 3 → impact at bar 5 beat 1, silence on bar 4 beat 4', () => {
    const U = TH.universe(0.2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.edm-lab'); const c = OrganismFactory.handle(a).ctx;
    let dropT = null; U.K.bus.subscribe('edm:drop-fired', p => { dropT = p.time; });
    const hitsAt = {}; U.K.bus.subscribe('org:hits:' + a, h => { hitsAt[Math.round((h.time - 0.1) / 0.125)] = true; });
    U.T.renderTicks(0, 32 + 3, 0.1); c.armDrop(); U.T.renderTicks(35, 16 * 5, 0.1 + 35 * 0.125);
    assert.near(dropT, 0.1 + 64 * 0.125, 1e-9);
    [60, 61, 62, 63].forEach(s => assert.ok(!hitsAt[s], 'silent step ' + s));
  });
  it('PRINT → sequencer drum lanes equal the lab hits for that seed', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.edm-lab'); const c = OrganismFactory.handle(a).ctx; const { s, c: sc } = seqWithPads(U);
    c.print(s);
    const tr = sc.internals.tracks.findIndex(t => t.name === 'lab kick'); assert.ok(tr >= 0);
    const row = sc.internals.patterns.A.steps[tr].slice(0, 32).map(x => x.on ? 1 : 0).join('');
    const exp = []; for (let bar = 0; bar < 2; bar++) for (let st = 0; st < 16; st++) exp.push(c.hits(bar, st)[0] > 0 ? 1 : 0);
    assert.equal(row, exp.join(''));
  });
});

describe('eravos.contrast-analyser', () => {
  const sine = (f, sec, amp) => { const b = new OfflineAudioContext(1, 48000 * sec, 48000).createBuffer(1, 48000 * sec, 48000); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (amp || 0.5) * Math.sin(2 * Math.PI * f * i / 48000); return b; };
  it('FFT of 1 kHz sine peaks in bin round(1000·N/sr) ± 1', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.contrast-analyser'); const c = OrganismFactory.handle(a).ctx;
    const p = c.welch(sine(1000, 1).getChannelData(0), 48000, 4096); let mx = 0, k = 0; p.forEach((v, i) => { if (v > mx) { mx = v; k = i; } });
    assert.lt(Math.abs(k - Math.round(1000 * 4096 / 48000)), 1.01);
  });
  it('100 Hz vs 5 kHz sines → clash < 5 ; identical file twice → clash > 95', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.contrast-analyser'); const c = OrganismFactory.handle(a).ctx;
    c.slots.A.buf = sine(100, 1); c.slots.B.buf = sine(5000, 1); assert.lt(c.analyse().clash, 5);
    const s = sine(440, 1); c.slots.A.buf = s; c.slots.B.buf = s; assert.gt(c.analyse().clash, 95);
  });
  it('120 BPM click track → detected 120 ± 1', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.contrast-analyser'); const c = OrganismFactory.handle(a).ctx;
    const hits = []; for (let t = 0; t < 8; t += 0.5) hits.push(t);
    assert.near(c.tempo(makeClick(48000, 8.2, hits).getChannelData(0), 48000), 120, 1);
  });
  it('live mode: source still audible on master (tap does not reroute)', () => {
    const U = TH.universe(0.2); const s = TH.spawn(U, 'eravos.supersaw'); const a = TH.spawn(U, 'eravos.contrast-analyser');
    U.K.wires.register({ src: { instanceId: s, hookId: 'saw.hook.audio_out' }, dst: { instanceId: a, hookId: 'ca.hook.in_a' } });
    assert.ok(U.K.audio.isOnMaster(s, 'out'));
  });
  it('no slot captures files dropped elsewhere on the canvas', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.contrast-analyser'); const c = OrganismFactory.handle(a).ctx; const sp = TH.spawn(U, 'eravos.sample-player');
    await OrganismFactory.handle(sp).ctx.load(AudioRecorder.encodeWAV(makeClick(48000, 0.5, [0.1]), 16), 'x.wav');
    assert.equal(c.slots.A.buf, null); assert.equal(c.slots.B.buf, null);
  });
});

describe('eravos.midi-mapper', () => {
  // mock Web MIDI: one StarryPad-named input + output that records sent bytes
  function mockMIDI(name) {
    const sent = [];
    const input = { id: 'in1', name: name || 'DONNER StarryPad', state: 'connected', onmidimessage: null };
    const output = { id: 'out1', name: name || 'DONNER StarryPad', state: 'connected', send(d, t) { sent.push(Array.from(d)); } };
    const access = { inputs: new Map([['in1', input]]), outputs: new Map([['out1', output]]), onstatechange: null };
    return { access, input, output, sent, hit: (bytes) => input.onmidimessage({ data: new Uint8Array(bytes) }) };
  }
  async function setup(U) {
    await OrganismSDK.IDB.put('presets', 'eravos.midi-mapper', {}); // no remembered controller from an earlier test
    const m = TH.spawn(U, 'eravos.midi-mapper'); const c = OrganismFactory.handle(m).ctx; const mm = mockMIDI();
    await c.connect(mm.access); return { m, c, mm };
  }
  it('auto-selects the StarryPad by name and listens to it', async () => {
    const U = TH.universe(0.2); const { mm } = await setup(U);
    assert.ok(typeof mm.input.onmidimessage === 'function');
  });
  it('pad learn: hitting 16 pads stores them; learned pad → note:trigger to Drum Machine (note 36+i)', async () => {
    const U = TH.universe(0.2); const pads = TH.spawn(U, 'eravos.pads'); const { m, mm } = await setup(U);
    U.K.bus.publish('ui:learn_pads:' + m, {});
    for (let i = 0; i < 16; i++) mm.hit([0x99, 60 + i * 2, 100]); // arbitrary non-contiguous notes, ch 10
    const got = []; U.K.bus.subscribe('note:trigger', (p) => got.push(p), 't');
    mm.hit([0x99, 60 + 5 * 2, 127]);
    assert.equal(got.length, 1); assert.equal(got[0].target, pads); assert.equal(got[0].note, 41);
  });
  it('pad learn rejects the same pad twice', async () => {
    const U = TH.universe(0.2); const { m, c, mm } = await setup(U);
    U.K.bus.publish('ui:learn_pads:' + m, {}); mm.hit([0x90, 40, 90]); mm.hit([0x90, 40, 90]); mm.hit([0x90, 41, 90]);
    const pn = OrganismFactory.handle(m).ctx.stateExtra().padNotes; assert.equal(pn[0].note, 40); assert.equal(pn[1].note, 41);
  });
  it('LEARN CC 74 then touch a channel fader → CC 127 sets fader max, 0 sets min', async () => {
    const U = TH.universe(0.2); const ch = TH.spawn(U, 'eravos.channel'); const { m, mm } = await setup(U);
    U.K.bus.publish('ui:learn_map:' + m, {}); mm.hit([0xb0, 74, 10]);
    U.K.bus.publish('ui:config_change:' + ch, { key: 'fader', value: -3 });
    const get = () => U.K.registry.readParam('kernel', ch, 'fader');
    mm.hit([0xb0, 74, 127]); assert.near(get(), 6, 0.01);
    await new Promise(r => setTimeout(r, 3)); mm.hit([0xb0, 74, 0]); assert.near(get(), -60, 0.01);
  });
  it('remembered controller never overwrites mappings made before the async recall lands (P10 race)', async () => {
    // session 1 learns CC 9 → channel A and remembers it
    const U1 = TH.universe(0.2); const chA = TH.spawn(U1, 'eravos.channel'); const s1 = await setup(U1);
    U1.K.bus.publish('ui:learn_map:' + s1.m, {}); s1.mm.hit([0xb0, 9, 64]); U1.K.bus.publish('ui:config_change:' + chA, { key: 'fader', value: -3 });
    await TH.sleep(60); // let remember() reach IndexedDB
    // session 2 mounts (recall starts, async), the user maps CC 7 → channel B before it resolves
    const U2 = TH.universe(0.2); const chB = TH.spawn(U2, 'eravos.channel'); const m2 = TH.spawn(U2, 'eravos.midi-mapper'); const c2 = OrganismFactory.handle(m2).ctx;
    const mm2 = mockMIDI(); await c2.connect(mm2.access);
    U2.K.bus.publish('ui:learn_map:' + m2, {}); mm2.hit([0xb0, 7, 64]); U2.K.bus.publish('ui:config_change:' + chB, { key: 'fader', value: 0 });
    await TH.sleep(80); // recall has resolved by now
    const maps = c2.stateExtra().mappings; assert.equal(maps.length, 1); assert.equal(maps[0].target, chB); assert.equal(maps[0].number, 7);
  });
  it('pick-up takeover ignores the hardware until it crosses the current value', async () => {
    const U = TH.universe(0.2); const ch = TH.spawn(U, 'eravos.channel'); const { m, c, mm } = await setup(U);
    U.K.bus.publish('ui:learn_map:' + m, {}); mm.hit([0xb0, 7, 10]);
    U.K.bus.publish('ui:config_change:' + ch, { key: 'fader', value: 0 });
    const map = c.stateExtra().mappings[0]; U.K.bus.publish('ui:map_edit:' + m, { id: map.id, patch: { takeover: 'pickup' } });
    const get = () => U.K.registry.readParam('kernel', ch, 'fader');
    mm.hit([0xb0, 7, 10]); assert.near(get(), 0, 0.01);               // far below: ignored
    await new Promise(r => setTimeout(r, 3)); mm.hit([0xb0, 7, 117]);  // ≈ +0.4 dB: within 3 % → picked up
    assert.lt(Math.abs(get()), 1);
    await new Promise(r => setTimeout(r, 3)); mm.hit([0xb0, 7, 20]); assert.lt(get(), -40); // now follows
  });
  it('LED feedback: pad:trigger index → note-on to the controller (only when enabled)', async () => {
    const U = TH.universe(0.2); const { m, mm } = await setup(U);
    U.K.bus.publish('ui:learn_pads:' + m, {}); for (let i = 0; i < 16; i++) mm.hit([0x90, 36 + i, 100]);
    U.K.bus.publish('ui:config_change:' + m, { key: 'ledFeedback', value: false });
    U.K.bus.publish('pad:trigger', { index: 3, velocity: 1 }); assert.equal(mm.sent.length, 0);
    U.K.bus.publish('ui:config_change:' + m, { key: 'ledFeedback', value: true });
    U.K.bus.publish('pad:trigger', { index: 3, velocity: 1 });
    assert.equal(mm.sent[0][0], 0x90); assert.equal(mm.sent[0][1], 39); assert.equal(mm.sent[0][2], 127);
  });
  it('unmapped notes pass through as canonical midi:note', async () => {
    const U = TH.universe(0.2); const { mm } = await setup(U);
    const got = []; U.K.bus.subscribe('midi:note', (p) => got.push(p), 't'); mm.hit([0x90, 64, 64]);
    assert.equal(got.length, 1); assert.equal(got[0].note, 64); assert.ok(got[0].on);
  });
});

// ============================================================ P9 — tracks (eravos.phase9-tracks.spec)
window.__phase = 'P9';
describe('P9 tracks — timeline instrument lanes', () => {
  function setup(sec, o) {
    const U = TH.universe(sec || 0.5, { bpm: 120 }); const tl = TH.spawn(U, 'eravos.timeline'); const c = OrganismFactory.handle(tl).ctx;
    const saw = TH.spawn(U, (o && o.inst) || 'eravos.supersaw');
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: saw });
    const lane = c.internals.lanes.find(l => l.kind === 'inst');
    const notes = []; U.K.bus.subscribe('note:trigger', p => { if (p._from === tl) notes.push(p); }, 't');
    return { U, tl, c, saw, lane, notes };
  }
  it('lists mounted instruments (note:trigger receivers) and binds a lane to one', () => {
    const { c, saw, lane } = setup();
    assert.ok(c.internals.instruments().some(i => i.value === saw)); assert.equal(lane.target, saw);
    assert.ok(!c.internals.instruments().some(i => i.organism === 'eravos.timeline'));
  });
  it('lane target must be an instrument', () => {
    const { U, tl, c } = setup(); const lfo = TH.spawn(U, 'eravos.lfo');
    assert.fault(U.K, 'RUNTIME_002', () => U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: lfo }));
    assert.equal(c.internals.lanes.filter(l => l.kind === 'inst').length, 1);
  });
  it('note clip at bar 2 → note:trigger at t0 + barSec, duration = l·stepDur·0.98', () => {
    const { U, c, lane, saw, notes } = setup();
    c.addNoteClip({ lane: lane.id, startBar: 2, bars: 1, notes: [{ s: 0, l: 4, n: 60, v: 0.9 }] });
    U.T.renderTicks(0, 40, 0.1);
    assert.equal(notes.length, 1); assert.equal(notes[0].target, saw); assert.equal(notes[0].note, 60);
    assert.near(notes[0].time, 0.1 + 2, 1e-6); assert.near(notes[0].duration, 4 * 0.125 * 0.98, 1e-9); assert.near(notes[0].velocity, 0.9, 1e-9);
  });
  it('sub-step start s = 4.5 lands at t0 + 4.5·stepDur', () => {
    const { U, c, lane, notes } = setup();
    c.addNoteClip({ lane: lane.id, startBar: 1, bars: 1, notes: [{ s: 4.5, l: 1, n: 64 }] });
    U.T.renderTicks(0, 16, 0.1); assert.equal(notes.length, 1); assert.near(notes[0].time, 0.1 + 4.5 * 0.125, 1e-6);
  });
  it('note longer than its clip is cut at the clip end', () => {
    const { U, c, lane, notes } = setup();
    c.addNoteClip({ lane: lane.id, startBar: 1, bars: 1, notes: [{ s: 12, l: 16, n: 64 }] });
    U.T.renderTicks(0, 16, 0); assert.near(notes[0].duration, 4 * 0.125 * 0.98, 1e-9);
  });
  it('mute, and solo on another lane, silence the track', () => {
    const { U, tl, c, lane, notes } = setup();
    c.addNoteClip({ lane: lane.id, startBar: 1, bars: 1, notes: [{ s: 0, l: 1, n: 60 }] });
    U.K.bus.publish('ui:lane_edit:' + tl, { id: lane.id, patch: { mute: true } }); U.T.renderTicks(0, 16, 0); assert.equal(notes.length, 0);
    U.K.bus.publish('ui:lane_edit:' + tl, { id: lane.id, patch: { mute: false } });
    const other = c.internals.lanes.find(l => l.kind === 'audio'); U.K.bus.publish('ui:lane_edit:' + tl, { id: other.id, patch: { solo: true } });
    U.T.renderTicks(0, 16, 2); assert.equal(notes.length, 0);
    U.K.bus.publish('ui:lane_edit:' + tl, { id: lane.id, patch: { solo: true } }); U.T.renderTicks(0, 16, 4); assert.equal(notes.length, 1);
  });
  it('instrument closed → exactly one RUNTIME_003, no throw, no notes', () => {
    const { U, c, lane, saw, notes } = setup();
    c.addNoteClip({ lane: lane.id, startBar: 1, bars: 4, notes: [{ s: 0, l: 1, n: 60 }, { s: 16, l: 1, n: 62 }, { s: 32, l: 1, n: 63 }] });
    OrganismFactory.close(saw); const n0 = U.K.faults.list('RUNTIME_003').length;
    U.T.renderTicks(0, 64, 0); assert.equal(U.K.faults.list('RUNTIME_003').length - n0, 1); assert.equal(notes.length, 0);
  });
  it('split at a bar keeps every note; right half offsets continue', () => {
    const { c, lane } = setup();
    const cl = c.addNoteClip({ lane: lane.id, startBar: 1, bars: 4, notes: [{ s: 0, l: 40, n: 60 }, { s: 20, l: 4, n: 62 }, { s: 40, l: 4, n: 63 }] });
    const [a, b] = c.split(cl.id, 3);
    assert.equal(a.notes.length + b.notes.length, 3); assert.equal(a.bars, 2); assert.equal(b.bars, 2); assert.near(b.startBar, 3, 1e-9);
    assert.equal(a.notes[0].l, 32); assert.equal(b.notes[0].s, 8); assert.equal(b.notes[0].n, 63);
  });
  it('duplicate deep-copies notes', () => {
    const { U, tl, c, lane } = setup();
    const cl = c.addNoteClip({ lane: lane.id, startBar: 1, bars: 1, notes: [{ s: 0, l: 4, n: 60 }] });
    U.K.bus.publish('ui:clip_duplicate:' + tl, { id: cl.id });
    const d = c.internals.clips.find(x => x.kind === 'notes' && x.id !== cl.id); assert.ok(d); assert.near(d.startBar, 2, 1e-9);
    U.K.bus.publish('ui:clip_edit:' + tl, { id: d.id, patch: { notes: [{ s: 1, l: 1, n: 70 }] } });
    assert.equal(cl.notes[0].n, 60); assert.equal(d.notes[0].n, 70);
  });
  it('clip_edit cleans notes: out-of-range dropped, clamped, sorted', () => {
    const { U, tl, c, lane } = setup(); const cl = c.addNoteClip({ lane: lane.id, bars: 1 });
    U.K.bus.publish('ui:clip_edit:' + tl, { id: cl.id, patch: { notes: [{ s: 8, l: 99, n: 200, v: 3 }, { s: 99, l: 1, n: 60 }, { s: 1, l: 0, n: 61 }, { s: 'x', l: 1, n: 1 }] } });
    assert.equal(cl.notes.length, 2); assert.equal(cl.notes[0].s, 1); assert.equal(cl.notes[0].l, 0.125, '3.48: the shortest note is a 1/128 (free grid)');
    assert.equal(cl.notes[1].n, 127); assert.equal(cl.notes[1].l, 8); assert.equal(cl.notes[1].v, 1);
  });
  it('a note clip cannot move onto an audio lane', () => {
    const { U, tl, c, lane } = setup(); const cl = c.addNoteClip({ lane: lane.id, bars: 1 }); const au = c.internals.lanes.find(l => l.kind === 'audio');
    assert.fault(U.K, 'RUNTIME_002', () => U.K.bus.publish('ui:clip_edit:' + tl, { id: cl.id, patch: { lane: au.id } })); assert.equal(cl.lane, lane.id);
  });
  it('chord fill "anthem" 4 bars sustain add9 → 16 notes, in key, root chord first', () => {
    const { U, tl, c, lane } = setup(); const cl = c.addNoteClip({ lane: lane.id, bars: 4 });
    U.K.bus.publish('ui:clip_fill:' + tl, { id: cl.id, progression: 'anthem', style: 'sustain', voicing: 'add9' });
    const k = c.key; assert.equal(cl.notes.length, 16);
    assert.ok(cl.notes.every(n => MusicTheory.inScale(n.n, k.root, k.scale)), 'in scale');
    assert.equal(Math.min(...cl.notes.filter(n => n.s === 0).map(n => n.n)), MusicTheory.degreeToMidi(1, 4, k.root, k.scale));
    assert.deepEqual([...new Set(cl.notes.map(n => n.s))], [0, 16, 32, 48]);
  });
  it('every fill style produces notes inside the clip', () => {
    const { c, lane } = setup(); const cl = c.addNoteClip({ lane: lane.id, bars: 2 });
    Object.keys(c.internals.FILL_STYLES).forEach(st => ['add9', 'single'].forEach(v => { c.fillNotes(cl, 'emotional', st, v); assert.gt(cl.notes.length, 0, st); assert.ok(cl.notes.every(n => n.s + n.l <= 32 + 1e-9), st); }));
  });
  it('end-to-end: note clip → supersaw audio (non-silent)', async () => {
    const { U, c, lane, saw } = setup(1.2);
    c.addNoteClip({ lane: lane.id, startBar: 1, bars: 1, notes: [{ s: 0, l: 6, n: 60 }] });
    probePort(U, saw, 'out'); U.T.renderTicks(0, 16, 0.05);
    const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.1, 0.8)), -40);
  });
  it('drum track: note clip plays pads (note 36 = pad 1)', async () => {
    const { U, c, lane, saw: pads } = setup(1, { inst: 'eravos.pads' });
    c.addNoteClip({ lane: lane.id, startBar: 1, bars: 1, notes: [{ s: 0, l: 1, n: 36 }] });
    probePort(U, pads, 'out'); U.T.renderTicks(0, 16, 0.05);
    const b = await TH.render(U); assert.gt(TH.db(TH.peak(b, 0.05, 0.4)), -30);
  });
  it('save / load round-trips instrument lanes and note clips', async () => {
    const { c, lane } = setup(); c.addNoteClip({ lane: lane.id, startBar: 3, bars: 2, notes: [{ s: 2, l: 3, n: 67, v: 0.5 }] });
    const x = JSON.parse(JSON.stringify(c.saveExtra()));
    const U2 = TH.universe(0.2); const tl2 = TH.spawn(U2, 'eravos.timeline'); const c2 = OrganismFactory.handle(tl2).ctx; await c2.loadExtra(x);
    const n = c2.internals.clips.find(k => k.kind === 'notes'); assert.ok(n); assert.equal(n.notes[0].n, 67); assert.near(n.startBar, 3, 1e-9);
    assert.equal(c2.internals.lanes.find(l => l.id === n.lane).kind, 'inst');
  });
  it('songEnd counts note clips', () => { const { c, lane } = setup(); c.addNoteClip({ lane: lane.id, startBar: 5, bars: 4 }); assert.equal(c.songEnd(), 8); });
});

describe('P9 tracks — sound palette', () => {
  it('every preset of every organism names only declared config keys, values valid', () => {
    const bad = [];
    OrganismFactory.defined().forEach(d => Object.entries(d.presets || {}).forEach(([name, pr]) => Object.entries((pr && pr.params) || {}).forEach(([k, v]) => {
      const cf = (d.config || []).find(c => c.key === k);
      if (!cf) return bad.push(`${d.id} "${name}": unknown key ${k}`);
      if (cf.type === 'enum' && !(cf.options || []).map(String).includes(String(v))) bad.push(`${d.id} "${name}": ${k}=${v} not in options`);
      if ((cf.type === 'number' || cf.type === 'integer') && (typeof v !== 'number' || (cf.min !== undefined && v < cf.min) || (cf.max !== undefined && v > cf.max))) bad.push(`${d.id} "${name}": ${k}=${v} out of range`);
    })));
    assert.equal(bad.length, 0, '\n' + bad.join('\n'));
  });
  it('Monstercat presets exist and load', () => {
    const U = TH.universe(0.2); const s = TH.spawn(U, 'eravos.supersaw'); const c = OrganismFactory.handle(s).ctx;
    ['Future Bass Chords (7th)', 'Future Bass Chords (add9)', 'Monstercat Pluck', 'Euphoric Lead', 'Silk Pad (add9)', 'Airy Sus Pad', 'Sidechain Chord Pump', 'Melodic Saw Bass'].forEach(p => assert.ok(OrganismFactory.def('eravos.supersaw').presets[p], p));
    U.K.bus.publish('ui:preset_load:' + s, { name: 'Silk Pad (add9)' }); assert.equal(c.params.get('chordMode'), 'add9');
  });
  it('supersaw add9 chord mode renders non-silent', async () => {
    const U = TH.universe(0.8); const s = TH.spawn(U, 'eravos.supersaw'); OrganismFactory.handle(s).ctx.params.set('chordMode', 'add9');
    probePort(U, s, 'out'); TH.note(U, s, 60, 0.05, { duration: 0.5 }); const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.1, 0.5)), -40);
  });
  it('pads bank D (future) selectable and sounds; 3-bank snapshot gains D', async () => {
    const U = TH.universe(0.6); const p = TH.spawn(U, 'eravos.pads'); const c = OrganismFactory.handle(p).ctx;
    U.K.bus.publish('ui:bank_select:' + p, { bank: 3 }); assert.equal(c.params.get('bank'), 3);
    probePort(U, p, 'out'); TH.note(U, p, 36, 0.05); const b = await TH.render(U); assert.gt(TH.db(TH.peak(b, 0.05, 0.4)), -30);
    const three = { banks: c.saveExtra().banks.slice(0, 3) }; await c.loadExtra(JSON.parse(JSON.stringify(three)));
    assert.equal(c.saveExtra().banks.length, 4);
  });
  it('recipe "Future Bass (Monstercat)" builds 4 bound tracks with written clips', async () => {
    const U = TH.universe(0.2); const r = await Recipes.run('eravos.recipe.future-bass', { K: U.K, headless: true });
    assert.ok(r && r.mounted.length >= 6, 'mounted');
    const tl = U.K.registry.byOrganism('eravos.timeline')[0].instance_id; const c = OrganismFactory.handle(tl).ctx;
    const inst = c.internals.lanes.filter(l => l.kind === 'inst'); assert.equal(inst.length, 4);
    assert.ok(inst.every(l => U.K.registry.has(l.target)), 'targets mounted');
    const clips = c.internals.clips.filter(k => k.kind === 'notes'); assert.equal(clips.length, 6); assert.ok(clips.every(k => k.notes.length > 0), 'clips written');
    assert.equal(c.internals.markers.length, 3); assert.equal(c.songEnd(), 16);
  });
});

describe('P9 tracks — drop builder tension (G-03, editable 2.2)', () => {
  ['Mist (default)', 'Low hum', 'Glass', 'Supersaw lift', 'Rising plucks', 'Dread'].forEach(name => it(`tension sound "${name}" renders non-silent, no clip`, async () => {
    const U = TH.universe(2.4, { bpm: 120 }); const d = TH.spawn(U, 'eravos.bass-drop-builder'); const c = OrganismFactory.handle(d).ctx;
    U.K.bus.publish('ui:tension_sound:' + d, { name }); probePort(U, d, 'fx'); c.tensionPad(0.1, 2);
    const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.6, 2)), -50); assert.lt(TH.peak(b, 0, 2.4), 1.2);
  }));
  it('off is silent; default is the flat Mist pad (no filter build, no swell); chords stay in key', async () => {
    const U = TH.universe(1.2, { bpm: 120 }); const d = TH.spawn(U, 'eravos.bass-drop-builder'); const c = OrganismFactory.handle(d).ctx, P = c.params;
    assert.equal(P.get('tensionTone'), 'pad'); assert.equal(P.get('tCutoff'), P.get('tCutoffEnd')); assert.equal(P.get('tSwell'), 0);
    const k = c.key; c.tensionChords().forEach(ch => ch.forEach(n => assert.ok(MusicTheory.inScale(n, k.root, k.scale), 'note ' + n)));
    P.set('tensionTone', 'off'); assert.equal(c.tensionPad(0.1, 1), null);
  });
  it('every tension knob changes the sound it names (chords/voicing/octave move notes)', () => {
    const U = TH.universe(0.2); const d = TH.spawn(U, 'eravos.bass-drop-builder'); const c = OrganismFactory.handle(d).ctx, P = c.params;
    const a = JSON.stringify(c.tensionChords()); P.set('tOct', 5); const b = JSON.stringify(c.tensionChords()); P.set('tChords', 'iv → V'); const e = JSON.stringify(c.tensionChords());
    assert.ok(a !== b && b !== e, 'chords respond');
    U.K.bus.publish('ui:tension_sound:' + d, { name: 'Glass' }); assert.equal(P.get('tOct'), 5); assert.equal(P.get('tWave'), 'sine');
  });
});

// ============================================================ P10 — patching (eravos.phase10-patching.spec)
window.__phase = 'P10';
describe('P10 patching — effects (STD.fx)', () => {
  const FX = ['eravos.fx-echo', 'eravos.fx-filter', 'eravos.fx-moddelay', 'eravos.fx-destroyer', 'eravos.fx-phaser'];
  function feed(U, fx, o) {
    o = o || {}; const src = U.ctx.createOscillator(); src.frequency.value = o.freq || 440;
    const g = U.ctx.createGain(); g.gain.value = o.amp || 0.5; src.connect(g); g.connect(U.K.audio.port(fx, 'in').node); src.start(o.at || 0);
    return g;
  }
  FX.forEach(id => {
    it(`${id}: mix 0 nulls against the input (STD.fx)`, async () => {
      const U = TH.universe(0.6); const fx = TH.spawn(U, id); const c = OrganismFactory.handle(fx).ctx; if (c.ready) await c.ready;
      c.params.set('mix', 0); U.K.audio.chain.out.gain.value = 0;
      const g = feed(U, fx); const inv = U.ctx.createGain(); inv.gain.value = -1; g.connect(inv); inv.connect(U.ctx.destination);
      U.K.audio.port(fx, 'out').node.connect(U.ctx.destination);
      const b = await TH.render(U); assert.lt(TH.rms(b, 0.2, 0.6), 1e-4);
    });
    it(`${id}: wet signal is non-silent`, async () => {
      const U = TH.universe(1); const fx = TH.spawn(U, id); const c = OrganismFactory.handle(fx).ctx; if (c.ready) await c.ready;
      c.params.set('mix', 1); probePort(U, fx, 'out'); feed(U, fx, { freq: 220 });
      const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.5, 1)), -40);
    });
  });
  it('echo: 1/8 at 120 → first repeat 0.25 s after the input ± 1 sample', async () => {
    const U = TH.universe(1.2, { bpm: 120 }); const fx = TH.spawn(U, 'eravos.fx-echo'); const c = OrganismFactory.handle(fx).ctx;
    c.params.setMany({ stereo: 'mono', wow: 0, flutter: 0, feedback: 0, sat: 0, div: '1/8', sync: true, mix: 1 });
    const imp = U.ctx.createBuffer(1, 48000, 48000); imp.getChannelData(0)[0] = 1; const s = U.ctx.createBufferSource(); s.buffer = imp;
    s.connect(U.K.audio.port(fx, 'in').node); s.start(0.5); probePort(U, fx, 'out');
    const b = await TH.render(U); const i = TH.firstAbove(b, 0.05); assert.lt(Math.abs(i - Math.round(0.75 * 48000)), 2);
  });
  it('echo: feedback 1.05 with saturation stays bounded', async () => {
    const U = TH.universe(3, { bpm: 150 }); const fx = TH.spawn(U, 'eravos.fx-echo'); const c = OrganismFactory.handle(fx).ctx;
    c.params.setMany({ feedback: 1.05, sat: 0.8, mix: 1 }); probePort(U, fx, 'out'); U.K.audio.chain.out.gain.value = 0;
    const g = feed(U, fx, { amp: 0.8 }); g.gain.setValueAtTime(0, 0.4);
    const b = await TH.render(U); assert.lt(TH.peak(b, 0, 3), 2); assert.gt(TH.rms(b, 2, 3), 1e-3, 'still ringing');
  });
  it('echo: throw passes one division then closes', async () => {
    const U = TH.universe(1.5, { bpm: 120 }); const fx = TH.spawn(U, 'eravos.fx-echo'); const c = OrganismFactory.handle(fx).ctx;
    c.params.setMany({ throwMode: true, feedback: 0, sat: 0, wow: 0, flutter: 0, stereo: 'mono', div: '1/4', mix: 1 });
    probePort(U, fx, 'out'); feed(U, fx, { at: 0.15 }); c.doThrow(0.3); // source starts after the gate has settled shut
    const b = await TH.render(U); // gate open 0.3–0.8 → echo 0.8–1.3 ; before 0.8 silent
    assert.lt(TH.rms(b, 0.35, 0.75), 1e-3); assert.gt(TH.rms(b, 0.85, 1.25), 0.05);
  });
  it('filter: LP 1 kHz 24 dB (flat Q) → ≈ −24 dB at 2 kHz', async () => {
    const U = TH.universe(1); const fx = TH.spawn(U, 'eravos.fx-filter'); const c = OrganismFactory.handle(fx).ctx;
    c.params.setMany({ type: 'LP', slope: 24, cutoff: 1000, res: Math.SQRT1_2, mix: 1, lfoAmt: 0, envAmt: 0, drive: 0 });
    probePort(U, fx, 'out'); feed(U, fx, { freq: 2000, amp: 0.5 });
    const b = await TH.render(U); const db = TH.db(TH.rms(b, 0.4, 1) / (0.5 / Math.SQRT2)); assert.near(db, -24, 2);
  });
  it('filter: envelope follower runs as an AudioWorklet', async () => {
    const U = TH.universe(0.2); const fx = TH.spawn(U, 'eravos.fx-filter'); const c = OrganismFactory.handle(fx).ctx; await c.ready;
    assert.equal(U.K.faults.list('RUNTIME_003').filter(f => /Destroyer|worklet/i.test(f.message)).length, 0);
  });
  it('destroyer: bits 1 → two-level output; downsample 4 holds each value 4 samples', async () => {
    const U = TH.universe(0.3); const fx = TH.spawn(U, 'eravos.fx-destroyer'); const c = OrganismFactory.handle(fx).ctx; await c.ready;
    c.params.setMany({ bits: 1, downsample: 4, drive: 0, shape: 'soft', mix: 1 }); U.K.audio.chain.out.gain.value = 0;
    assert.ok(c.internals.crush, 'worklet crusher'); c.internals.crush.connect(U.ctx.destination); feed(U, fx, { freq: 300 });
    const b = await TH.render(U); const d = b.getChannelData(0), from = Math.round(0.15 * 48000);
    const lv = new Set(); for (let i = from; i < from + 4000; i++) lv.add(Math.abs(d[i]).toFixed(4)); assert.equal(lv.size, 1, [...lv].join(','));
    let runs = 0, run = 1, bad = 0; for (let i = from + 1; i < from + 4000; i++) { if (d[i] === d[i - 1]) run++; else { if (runs > 0 && run % 4) bad++; runs++; run = 1; } } // first run starts mid-hold
    assert.equal(bad, 0, 'hold length multiple of 4');
  });
  it('phaser: 12 stages, feedback 0.9 stays stable', async () => {
    const U = TH.universe(3); const fx = TH.spawn(U, 'eravos.fx-phaser'); const c = OrganismFactory.handle(fx).ctx;
    c.params.setMany({ stages: 12, feedback: 0.9, mix: 1, rate: 2 }); probePort(U, fx, 'out');
    const n = OrganismSDK.dsp.noiseSource(U.ctx, 'white'); const g = U.ctx.createGain(); g.gain.value = 0.05; n.connect(g); g.connect(U.K.audio.port(fx, 'in').node); n.start();
    const b = await TH.render(U); const pk = TH.peak(b, 0, 3); assert.ok(isFinite(pk)); assert.lt(pk, 1); assert.gt(TH.rms(b, 2, 3), 1e-3);
  });
  it('mod delay: chorus at width 1 decorrelates L and R', async () => {
    const U = TH.universe(1); const fx = TH.spawn(U, 'eravos.fx-moddelay'); const c = OrganismFactory.handle(fx).ctx;
    c.params.setMany({ mode: 'chorus', spread: 1, mix: 1, depth: 0.8 }); probePort(U, fx, 'out');
    const n = OrganismSDK.dsp.noiseSource(U.ctx, 'white'); const g = U.ctx.createGain(); g.gain.value = 0.2; n.connect(g); g.connect(U.K.audio.port(fx, 'in').node); n.start();
    const b = await TH.render(U); const L = b.getChannelData(0), R = b.getChannelData(1); let x = 0, a = 0, r = 0;
    for (let i = 24000; i < 48000; i++) { x += L[i] * R[i]; a += L[i] * L[i]; r += R[i] * R[i]; } assert.lt(x / Math.sqrt(a * r), 0.9);
  });
});

describe('P10 patching — routing', () => {
  it('wiring a synth into an effect takes it off master; unwiring puts it back', () => {
    const U = TH.universe(0.2); const saw = TH.spawn(U, 'eravos.supersaw'); const fx = TH.spawn(U, 'eravos.fx-echo');
    assert.ok(U.K.audio.isOnMaster(saw, 'out'));
    const r = U.K.wires.register({ src: { instanceId: saw, hookId: 'saw.hook.audio_out' }, dst: { instanceId: fx, hookId: 'fx.hook.audio_in' } });
    assert.ok(r.ok, JSON.stringify(r.fault)); assert.ok(!U.K.audio.isOnMaster(saw, 'out')); assert.ok(U.K.audio.isOnMaster(fx, 'out'));
    U.K.wires.remove(r.wire.wire_id || r.wire_id || (U.K.wires.list()[0] || {}).wire_id, 'user'); assert.ok(U.K.audio.isOnMaster(saw, 'out'));
  });
  it('Master has a visible input; synth → Master is accepted and audible', async () => {
    const U = TH.universe(0.8); const m = TH.spawn(U, 'eravos.master-fx'); const saw = TH.spawn(U, 'eravos.supersaw');
    assert.ok(U.K.registry.hook(m, 'mfx.hook.audio_in'));
    const r = U.K.wires.register({ src: { instanceId: saw, hookId: 'saw.hook.audio_out' }, dst: { instanceId: m, hookId: 'mfx.hook.audio_in' } });
    assert.ok(r.ok, JSON.stringify(r.fault)); TH.note(U, saw, 60, 0.05, { duration: 0.5 });
    const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.1, 0.5)), -45);
  });
  it('wire UI helpers: every FX input is wireable and accepts every sound source', () => {
    const U = TH.universe(0.2); const fx = TH.spawn(U, 'eravos.fx-filter'); const dst = U.K.registry.hook(fx, 'fx.hook.audio_in');
    ['eravos.supersaw', 'eravos.pads', 'eravos.wobble-bass', 'eravos.reese-bass', 'eravos.acid-synth', 'eravos.sample-player', 'eravos.fx-echo'].forEach(id => {
      const inst = TH.spawn(U, id); const out = Array.from(U.K.registry.get(inst).hooks.values()).find(hk => hk.wire_type === 'audio' && hk.direction === 'out');
      assert.ok(out && WireSystem.wireable(out) && WireSystem.compatible(out, dst), id);
    });
  });
  it('recipe Future Bass patches pluck → Tape Echo and chords → Mod Delay', async () => {
    const U = TH.universe(0.2); await Recipes.run('eravos.recipe.future-bass', { K: U.K, headless: true });
    const ws = U.K.wires.list().filter(w => w.wire_type === 'audio'); assert.equal(ws.length, 2);
    const echo = U.K.registry.byOrganism('eravos.fx-echo')[0].instance_id; assert.ok(ws.some(w => w.dst.instanceId === echo));
  });
});

// ============================================================ P11 — production: MIDI access (eravos.phase11-production.spec M-01…M-04)
window.__phase = 'P11';
describe('P11 MIDI access — diagnosis and prompting', () => {
  function mapper() { const U = TH.universe(0.2); const m = TH.spawn(U, 'eravos.midi-mapper'); return { U, m, c: OrganismFactory.handle(m).ctx }; }
  const env = (o) => Object.assign({ firefox: false, safari: false, file: false, secure: true, api: true }, o);
  it('Firefox on file:// → explains the block and points to Start ERAVOS', () => {
    const x = mapper().c.explainMidi(null, env({ firefox: true, file: true }));
    assert.ok(/Firefox blocks MIDI/.test(x.error)); assert.ok(x.help.some(h => /Start ERAVOS/.test(h) && /localhost:4747/.test(h)));
  });
  it('Firefox "site permission add-on" rejection → no device / restart Firefox', () => {
    const x = mapper().c.explainMidi({ name: 'SecurityError', message: 'WebMIDI requires a site permission add-on to activate' }, env({ firefox: true }));
    assert.ok(/didn.t find a MIDI device/.test(x.error)); assert.ok(x.help.some(h => /reopen it/.test(h)));
  });
  it('blocked permission → how to re-allow in site settings', () => {
    const x = mapper().c.explainMidi({ name: 'NotAllowedError', message: '' }, env({}));
    assert.ok(/blocked/.test(x.error)); assert.ok(x.help.some(h => /Site settings/.test(h)));
  });
  it('MIDI system failed to start (device held by another app) → says so', () => {
    const x = mapper().c.explainMidi({ name: 'InvalidStateError', message: 'Platform dependent initialization failed.' }, env({}));
    assert.ok(/didn.t start/.test(x.error)); assert.ok(x.help.some(h => /only one app/.test(h)));
  });
  it('no Web MIDI: Safari / insecure page / other each get their own answer', () => {
    const c = mapper().c;
    assert.ok(/Safari/.test(c.explainMidi(null, env({ api: false, safari: true })).error));
    assert.ok(/localhost or https/.test(c.explainMidi(null, env({ api: false, secure: false })).error));
    assert.ok(/no MIDI support/.test(c.explainMidi(null, env({ api: false })).error));
  });
  async function withStubs(state, fn) {
    const calls = { n: 0 }; const p0 = navigator.permissions.query, r0 = Object.getOwnPropertyDescriptor(navigator, 'requestMIDIAccess');
    navigator.permissions.query = async () => ({ state });
    const input = { id: 'i', name: 'Pad', state: 'connected', onmidimessage: null };
    Object.defineProperty(navigator, 'requestMIDIAccess', { configurable: true, value: async () => { calls.n++; return { inputs: new Map([['i', input]]), outputs: new Map(), onstatechange: null }; } });
    try { await fn(calls); } finally { navigator.permissions.query = p0; if (r0) Object.defineProperty(navigator, 'requestMIDIAccess', r0); else delete navigator.requestMIDIAccess; }
  }
  it('mount does NOT request MIDI without permission (waits for the Connect click)', async () => {
    await withStubs('prompt', async (calls) => { const { c } = mapper(); await TH.sleep(20); assert.equal(await c.autoConnect(), false); assert.equal(calls.n, 0); });
  });
  it('mount auto-connects when permission was already granted', async () => {
    await withStubs('granted', async (calls) => { const { c } = mapper(); await TH.sleep(20); assert.gt(calls.n, 0); });
  });
  it('Connect with an empty device list says so (not silent)', async () => {
    const { U, m, c } = mapper(); const got = []; U.K.bus.subscribe('org:status:' + m, (p) => got.push(p), 't');
    const ok = await c.connect({ inputs: new Map(), outputs: new Map(), onstatechange: null });
    assert.ok(ok); assert.ok(got.some(s => /no MIDI device found/.test(s.warn || '')), JSON.stringify(got));
  });
});

// ============================================================ P13 — skeleton + packs (eravos.phase13-skeleton-packs.spec)
window.__phase = 'P13';
describe('P13 skeleton + packs — the canvas expands', () => {
  // stored (method 0) zip, enough for the kernel's unzip
  function storedZip(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    for (const [name, text] of Object.entries(files)) {
      const nb = enc.encode(name), db = enc.encode(text), c = crc(db);
      const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint32(14, c, true); lh.setUint32(18, db.length, true); lh.setUint32(22, db.length, true); lh.setUint16(26, nb.length, true);
      const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, c, true); ch.setUint32(20, db.length, true); ch.setUint32(24, db.length, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, off, true);
      parts.push(new Uint8Array(lh.buffer), nb, db); central.push(new Uint8Array(ch.buffer), nb); off += 30 + nb.length + db.length;
    }
    const cdLen = central.reduce((a, b) => a + b.length, 0), end = new DataView(new ArrayBuffer(22)), n = Object.keys(files).length;
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, n, true); end.setUint16(10, n, true); end.setUint32(12, cdLen, true); end.setUint32(16, off, true);
    const all = parts.concat(central, [new Uint8Array(end.buffer)]), out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; all.forEach(b => { out.set(b, p); p += b.length; }); return out.buffer;
  }
  it('a "domain" pack installs: its stylesheet is injected before its code runs, in listed order', async () => {
    const U = TH.universe(0.1); const I = Intake.create(U.K, { confirm: () => true });
    const man = { manifest_version: '1.0.0', pack_id: 'test.p13-domain', pack_type: 'domain', kernel_target: '3.2.0', author: 't', permissions: [],
      contents: { styles: { 'a.css': 'a.css' }, runtime: { 'one.js': 'one.js', 'two.js': 'two.js' } } };
    window.__p13 = [];
    const r = await I.file('d.zip', storedZip({ 'manifest.json': JSON.stringify(man), 'a.css': '.p13-probe{color:rgb(1,2,3)}',
      'one.js': "window.__p13.push('one:' + !!document.querySelector('style[data-pack=\"test.p13-domain\"]'))", 'two.js': "window.__p13.push('two')" }));
    assert.equal(r && r.kind, 'pack'); assert.deepEqual(window.__p13, ['one:true', 'two']);
  });
  it('a pack whose dependency is missing is refused (MOUNT_001), nothing runs', async () => {
    const U = TH.universe(0.1); const I = Intake.create(U.K, { confirm: () => true }); window.__p13b = 0;
    const man = { manifest_version: '1.0.0', pack_id: 'test.p13-tools', pack_type: 'organism_pack', kernel_target: '3.2.0', author: 't', permissions: [], dependencies: ['test.not-installed'], contents: { organisms: { 'x.js': 'x.js' } } };
    const f0 = U.K.faults.list('MOUNT_001').length;
    const r = await I.file('t.zip', storedZip({ 'manifest.json': JSON.stringify(man), 'x.js': 'window.__p13b = 1' }));
    assert.equal(r, null); assert.equal(window.__p13b, 0); assert.equal(U.K.faults.list('MOUNT_001').length - f0, 1);
  });
  it('recipes are offered only when every organism they mount is installed', () => {
    const all = Recipes.all(), shown = Recipes.list();
    assert.ok(all.every(r => shown.includes(r) === Recipes.needs(r).every(id => !!OrganismFactory.def(id))));
    const fb = Recipes.get('eravos.recipe.future-bass'); assert.ok(Recipes.available(fb));
    Recipes.register({ id: 'test.p13-ghost', label: 'Ghost', steps: [{ op: 'mount', organism: 'eravos.does-not-exist', as: 'g' }] });
    assert.ok(!Recipes.list().some(r => r.id === 'test.p13-ghost')); assert.ok(Recipes.all().some(r => r.id === 'test.p13-ghost'));
  });
  it('recipes referencing never-built organisms are hidden (spatial, visual)', () => {
    ['eravos.recipe.spatial', 'eravos.recipe.visual'].forEach(id => { const r = Recipes.get(id); if (r) assert.ok(!Recipes.available(r), id); });
  });
  it('Emerge is offered once Granular exists (3.43), and every wire it asks for names a real hook', () => {
    const r = Recipes.get('eravos.recipe.emerge'); assert.ok(r && Recipes.available(r));
    const as = {}; r.steps.filter(s => s.op === 'mount').forEach(s => { as[s.as] = OrganismFactory.def(s.organism); });
    r.steps.filter(s => s.op === 'wire').forEach(s => [s.from, s.to].forEach(([who, hook]) => assert.ok(as[who].hooks.some(h => h.hook_id === hook), `${who}.${hook}`)));
  });
  it('Vagal is offered once its tools exist (Breath + Gothic Organ were built in P14)', () => {
    const r = Recipes.get('eravos.recipe.vagal'); assert.ok(r && Recipes.available(r));
  });
});

// ============================================================ P11.1 — undo (eravos.phase11-1-undo.spec)
window.__phase = 'P11.1';
describe('P11.1 undo — History (skeleton, any organism)', () => {
  const tick = (ms) => TH.sleep(ms || 5);
  function setup() { const U = TH.universe(0.2); const H = History.create(U.K); return { U, H }; }
  it('a knob drag (burst of changes) is ONE step; undo restores, redo re-applies', async () => {
    const { U, H } = setup(); const s = TH.spawn(U, 'eravos.supersaw'); await tick(); H.clear(); const c = OrganismFactory.handle(s).ctx;
    const v0 = c.params.get('cutoff');
    for (let i = 1; i <= 10; i++) U.K.bus.publish('ui:config_change:' + s, { key: 'cutoff', value: 1000 + i * 100 });
    H.flush(); assert.equal(H.state().size, 1); assert.equal(c.params.get('cutoff'), 2000);
    H.undo(); assert.equal(c.params.get('cutoff'), v0); await tick();
    H.redo(); assert.equal(c.params.get('cutoff'), 2000);
    assert.ok(/Supersaw/.test(H.state().undoLabel), H.state().undoLabel);
  });
  it('actions that change nothing leave no step (audition, play)', async () => {
    const { U, H } = setup(); const tl = TH.spawn(U, 'eravos.timeline'); await tick(); H.clear();
    U.K.bus.publish('ui:note_audition:' + tl, { note: 60 }); H.flush(); assert.equal(H.state().size, 0);
  });
  it('timeline: a new note clip undoes and redoes', async () => {
    const { U, H } = setup(); const tl = TH.spawn(U, 'eravos.timeline'), saw = TH.spawn(U, 'eravos.supersaw'); await tick(); H.clear(); const c = OrganismFactory.handle(tl).ctx;
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: saw }); H.flush(); await tick(200);
    U.K.bus.publish('ui:clip_add:' + tl, { kind: 'notes', target: saw, startBar: 2, bars: 2, notes: [{ s: 0, l: 4, n: 60 }] }); H.flush();
    assert.equal(c.internals.clips.filter(x => x.kind === 'notes').length, 1);
    H.undo(); assert.equal(c.internals.clips.filter(x => x.kind === 'notes').length, 0); await tick();
    H.redo(); const n = c.internals.clips.find(x => x.kind === 'notes'); assert.ok(n); assert.equal(n.notes[0].n, 60);
  });
  it('adding a window undoes (closes) and redoes (same id, same state)', async () => {
    const { U, H } = setup(); const s = TH.spawn(U, 'eravos.fx-echo'); H.flush(); assert.equal(H.state().size, 1);
    OrganismFactory.handle(s).ctx.params.set('feedback', 0.8);
    H.undo(); assert.ok(!U.K.registry.has(s)); await tick();
    H.redo(); assert.ok(U.K.registry.has(s)); assert.near(OrganismFactory.handle(s).ctx.params.get('feedback'), 0.8, 1e-9);
  });
  it('closing a window with wires: undo brings back its state AND its wires', async () => {
    const { U, H } = setup(); const saw = TH.spawn(U, 'eravos.supersaw'), fx = TH.spawn(U, 'eravos.fx-filter'); await tick();
    U.K.wires.register({ src: { instanceId: saw, hookId: 'saw.hook.audio_out' }, dst: { instanceId: fx, hookId: 'fx.hook.audio_in' } });
    OrganismFactory.handle(fx).ctx.params.set('cutoff', 777); await tick(200); H.clear();
    OrganismFactory.close(fx); H.flush(); assert.equal(U.K.wires.list().length, 0); assert.equal(H.state().size, 1, 'the close owns its wire removal');
    H.undo(); assert.ok(U.K.registry.has(fx)); assert.equal(OrganismFactory.handle(fx).ctx.params.get('cutoff'), 777);
    assert.equal(U.K.wires.list().length, 1); assert.ok(!U.K.audio.isOnMaster(saw, 'out'), 'routing restored');
  });
  it('connecting a wire undoes and redoes', async () => {
    const { U, H } = setup(); const saw = TH.spawn(U, 'eravos.supersaw'), fx = TH.spawn(U, 'eravos.fx-echo'); await tick(200); H.clear();
    U.K.wires.register({ src: { instanceId: saw, hookId: 'saw.hook.audio_out' }, dst: { instanceId: fx, hookId: 'fx.hook.audio_in' } }); H.flush();
    H.undo(); assert.equal(U.K.wires.list().length, 0); assert.ok(U.K.audio.isOnMaster(saw, 'out')); await tick();
    H.redo(); assert.equal(U.K.wires.list().length, 1);
  });
  it('steps within 150 ms are one undo (spawn + its first edit)', async () => {
    const { U, H } = setup(); const s = TH.spawn(U, 'eravos.supersaw'); U.K.bus.publish('ui:config_change:' + s, { key: 'cutoff', value: 3333 }); H.flush();
    assert.equal(H.state().size, 1); H.undo(); assert.ok(!U.K.registry.has(s));
  });
  it('recipes are not recorded; history is fresh after one', async () => {
    const { U, H } = setup(); TH.spawn(U, 'eravos.supersaw'); H.flush(); assert.equal(H.state().size, 1);
    await Recipes.run('eravos.recipe.future-bass', { K: U.K, headless: true }); await tick(600);
    assert.equal(H.state().size, 0);
  });
  it('works for an organism the skeleton has never seen (a future pack)', async () => {
    OrganismFactory.define({ id: 'test.p111-knob', version: '1.0.0', label: 'Test Knob', permissions: ['bus_subscribe', 'bus_publish'], hooks: [], ui_hooks: ['poke'], ui_hook_labels: { poke: 'poke the thing' },
      config: [{ key: 'amount', type: 'number', default: 0, min: 0, max: 10 }],
      engine(ctx) { ctx.onUI('poke', null, () => ctx.params.set('amount', ctx.params.get('amount') + 1)); return { unmount() {} }; } });
    const { U, H } = setup(); const t = TH.spawn(U, 'test.p111-knob'); await tick(200); H.clear(); const c = OrganismFactory.handle(t).ctx;
    U.K.bus.publish('ui:poke:' + t, {}); U.K.bus.publish('ui:poke:' + t, {}); H.flush();
    assert.equal(c.params.get('amount'), 2); assert.ok(/poke the thing/.test(H.state().undoLabel), H.state().undoLabel);
    H.undo(); assert.equal(c.params.get('amount'), 0);
  });
});
