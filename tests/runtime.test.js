window.__phase = 'P1';
(function () {
  let unmountCount = 0;
  OrganismFactory.define({
    id: 'test.dummy', label: 'Dummy', size: { w: 200, h: 120 }, permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    hooks: [OrganismSDK.STD.audio_out('d.out'), OrganismSDK.STD.audio_in('d.in', 'in')],
    config: [{ key: 'x', type: 'number', default: 0.5, min: 0, max: 1 }, { key: 'mode', type: 'enum', default: 'a', options: ['a', 'b'] }],
    engine(ctx) {
      const g = ctx.ac.createGain(); const i = ctx.ac.createGain(); i.connect(g);
      ctx.port('out', { kind: 'audio', direction: 'out', node: g }); ctx.port('in', { kind: 'audio', direction: 'in', node: i });
      ctx.onTick(() => {});
      return { unmount() { unmountCount++; } };
    },
  });
  window.__unmountCount = () => unmountCount;
})();

describe('runtime — music theory', () => {
  it('C minor degree 1..7 octave 4 → [60,62,63,65,67,68,70]', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(d => MusicTheory.degreeToMidi(d, 4, 0, 'minor')), [60, 62, 63, 65, 67, 68, 70]);
  });
  it('degree wraps octaves (8 → 72, 0 → 58)', () => { assert.equal(MusicTheory.degreeToMidi(8, 4, 0, 'minor'), 72); assert.equal(MusicTheory.degreeToMidi(0, 4, 0, 'minor'), 58); });
  it('quantize ties go down', () => { assert.equal(MusicTheory.quantize(61, 0, 'major'), 60); assert.equal(MusicTheory.quantize(66, 0, 'major'), 65); });
  it('chord C major degree 2 triad → [62,65,69]', () => assert.deepEqual(MusicTheory.chord(2, 0, 'major', 'triad'), [62, 65, 69]));
  it('divisionSec 1/4@120=0.5, 1/8.@120=0.375, 1/8t@120=1/6, 2/1@120=4', () => {
    assert.near(MusicTheory.divisionSec('1/4', 120), 0.5, 1e-9); assert.near(MusicTheory.divisionSec('1/8.', 120), 0.375, 1e-9);
    assert.near(MusicTheory.divisionSec('1/8t', 120), 1 / 6, 1e-9); assert.near(MusicTheory.divisionSec('2/1', 120), 4, 1e-9);
  });
  it('MIDI write → parse round trip', () => {
    const song = { ppq: 96, tempo: 140, tracks: [{ name: 'kick', events: [{ tick: 0, note: 36, vel: 1, dur: 24 }, { tick: 96, note: 36, vel: 0.5, dur: 24 }] }, { name: 'bass', events: [{ tick: 48, note: 45, vel: 0.8, dur: 90 }] }] };
    const p = MusicTheory.midi.parse(MusicTheory.midi.write(song));
    assert.equal(p.ppq, 96); assert.near(p.tempo, 140, 0.01); assert.equal(p.tracks.length, 2);
    assert.deepEqual(p.tracks[0].events.map(e => [e.tick, e.note, e.dur]), [[0, 36, 24], [96, 36, 24]]);
    assert.near(p.tracks[0].events[1].vel, 0.5, 0.01); assert.equal(p.tracks[1].name, 'bass');
  });
});

describe('runtime — transport + clock', () => {
  it('16 ticks at 120 BPM: |t_n − t_expected| < 1 ms (realtime clock)', async () => {
    const K = Kernel.create({ quiet: true }); K.audio.boot(); await K.audio.ctx.resume();
    const T = MasterTransport.create(K, { bpm: 120 }); T.boot();
    const ticks = []; K.bus.subscribe('transport:tick', (t) => ticks.push(t));
    T.play(); await TH.sleep(2400); T.stop();
    assert.ok(ticks.length >= 16, 'got ' + ticks.length + ' ticks, mode ' + T.clockMode);
    const t0 = ticks[0].time;
    for (let i = 0; i < 16; i++) assert.lt(Math.abs(ticks[i].time - (t0 + i * 0.125)), 0.001);
    // scheduled ahead of audio time (lookahead), never late
    await K.audio.ctx.close();
  }, { timeout: 8000 });
  it('clock mode is worklet on file:// (F-06)', async () => {
    const K = Kernel.create({ quiet: true }); K.audio.boot();
    const T = MasterTransport.create(K, { bpm: 120 }); T.boot(); await TH.sleep(300);
    assert.equal(T.clockMode, 'worklet'); await K.audio.ctx.close();
  });
  it('BPM change mid-play: no restart, next tick uses new step length (F-08)', async () => {
    const K = Kernel.create({ quiet: true }); K.audio.boot(); await K.audio.ctx.resume();
    const T = MasterTransport.create(K, { bpm: 120 }); T.boot();
    const ticks = []; let plays = 0, stops = 0;
    K.bus.subscribe('transport:tick', (t) => ticks.push(t)); K.bus.subscribe('transport:play', () => plays++); K.bus.subscribe('transport:stop', () => stops++);
    T.play(); await TH.sleep(600);
    const n = ticks.length; K.bus.publish('ui:transport-bpm', { bpm: 150 });
    await TH.sleep(600); T.stop();
    assert.equal(plays, 1); assert.equal(stops, 1);
    const later = ticks.slice(n + 1);
    assert.ok(later.length > 3);
    assert.near(later[2].time - later[1].time, 60 / 150 / 4, 1e-6);
    for (let i = 1; i < ticks.length; i++) assert.equal(ticks[i].step16, ticks[i - 1].step16 + 1, 'steps continuous');
    await K.audio.ctx.close();
  }, { timeout: 5000 });
  it('bounce of 4 bars at 120 BPM → WAV length = 8.000 s ± 1 sample', async () => {
    const K = Kernel.create({ quiet: true }); K.audio.boot(); await K.audio.ctx.resume();
    const T = MasterTransport.create(K, { bpm: 120 }); T.boot();
    const o = K.audio.ctx.createOscillator(); o.connect(K.audio.masterIn); o.start();
    const r = await T.bounce(4, { bitDepth: 24 });
    assert.ok(r, 'recorded payload');
    const hdr = AudioRecorder.decodeWAVHeader(r.arrayBuffer);
    assert.equal(hdr.bits, 24); assert.equal(hdr.channels, 2);
    assert.lt(Math.abs(hdr.frames - 8 * hdr.sampleRate), 1.01);
    await K.audio.ctx.close();
  }, { timeout: 16000 });
  it('offline renderTicks: tick times exact, loop wraps', () => {
    const U = TH.universe(1, { bpm: 120 });
    const ts = []; U.K.bus.subscribe('transport:tick', t => ts.push(t));
    U.T.renderTicks(0, 32, 0.1);
    assert.equal(ts.length, 32); assert.near(ts[16].time, 0.1 + 2, 1e-9); assert.equal(ts[16].bar, 2);
  });
});

describe('runtime — organism factory, SDK, workspace', () => {
  it('config: clamp out-of-range, RUNTIME_002 on wrong type, enum validated', () => {
    const U = TH.universe(0.2); const id = TH.spawn(U, 'test.dummy');
    const ctx = OrganismFactory.handle(id).ctx;
    ctx.params.set('x', 5); assert.equal(ctx.params.get('x'), 1);
    ctx.params.set('x', -3); assert.equal(ctx.params.get('x'), 0);
    assert.fault(U.K, 'RUNTIME_002', () => ctx.params.set('x', 'loud'));
    assert.fault(U.K, 'RUNTIME_002', () => ctx.params.set('mode', 'z'));
    assert.equal(ctx.params.get('mode'), 'a');
  });
  it('serialize → deserialize → identical params', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'test.dummy');
    U.K.bus.publish('ui:config_change:' + a, { key: 'x', value: 0.25 });
    const s = OrganismFactory.handle(a).ctx.serialize();
    const b = TH.spawn(U, 'test.dummy', { state: s });
    assert.deepEqual(OrganismFactory.handle(b).ctx.params.all(), OrganismFactory.handle(a).ctx.params.all());
  });
  it('unmount → zero bus subscribers, zero ports, engine.unmount once (registry path)', () => {
    const U = TH.universe(0.2); const id = TH.spawn(U, 'test.dummy');
    const n0 = window.__unmountCount();
    assert.gt(U.K.bus.subscriberCount(id), 0);
    U.K.registry.unregister(id);
    assert.equal(window.__unmountCount() - n0, 1); assert.equal(U.K.bus.subscriberCount(id), 0); assert.equal(U.K.audio.ports(id).length, 0);
    U.K.bus.publish('canvas:window-closed', { instanceId: id });
    assert.equal(window.__unmountCount() - n0, 1, 'second trigger ignored');
  });
  it('unmount paths: window × and DOM removal (CLEAR ALL) each call unmount exactly once', async () => {
    const host = document.getElementById('wmhost');
    if (!window.CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    Kernel.audio.boot();
    const n0 = window.__unmountCount();
    const a = OrganismFactory.spawn('test.dummy', { x: 20, y: 20 });
    CanvasWM.windowOf(a).querySelector('.wm-x').click();
    assert.equal(window.__unmountCount() - n0, 1); assert.ok(!Kernel.registry.has(a)); assert.ok(!CanvasWM.windowOf(a));
    const b = OrganismFactory.spawn('test.dummy', { x: 20, y: 20 });
    CanvasWM.windowOf(b).remove();
    await TH.sleep(30);
    assert.equal(window.__unmountCount() - n0, 2); assert.ok(!Kernel.registry.has(b));
  });
  it('wire drag from out-dot to in-dot registers kernel audio wire', async () => {
    const a = OrganismFactory.spawn('test.dummy', { x: 20, y: 20 });
    const b = OrganismFactory.spawn('test.dummy', { x: 320, y: 20 });
    await TH.sleep(50);
    const out = CanvasWM.windowOf(a).querySelector('.rail.right .port-dot'), inn = CanvasWM.windowOf(b).querySelector('.rail.left .port-dot');
    const r1 = out.getBoundingClientRect(), r2 = inn.getBoundingClientRect();
    out.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r1.x + 5, clientY: r1.y + 5, pointerId: 1 }));
    assert.ok(inn.classList.contains('glow'), 'compatible in-dot glows');
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: r2.x + 5, clientY: r2.y + 5, pointerId: 1 }));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: r2.x + 6, clientY: r2.y + 6, pointerId: 1 }));
    const w = Kernel.wires.list().find(w => w.src.instanceId === a && w.dst.instanceId === b);
    assert.ok(w && w.wire_type === 'audio'); assert.ok(!Kernel.audio.isOnMaster(a, 'out'));
    OrganismFactory.close(a); OrganismFactory.close(b);
  });
  it('workspace snapshot → clear → restore reproduces organisms, positions, params, wires', async () => {
    const a = OrganismFactory.spawn('test.dummy', { x: 40, y: 50 });
    const b = OrganismFactory.spawn('test.dummy', { x: 400, y: 60 });
    Kernel.bus.publish('ui:config_change:' + a, { key: 'x', value: 0.11 });
    Kernel.wires.register({ src: { instanceId: a, hookId: 'd.out' }, dst: { instanceId: b, hookId: 'd.in' } });
    const snap = JSON.parse(JSON.stringify(Workspace.snapshot()));
    Workspace.boot(Kernel);
    await Workspace.restore(snap);
    const hs = OrganismFactory.handles().filter(r => r.K === Kernel);
    assert.equal(hs.length, 2);
    assert.equal(OrganismFactory.handle(a).ctx.params.get('x'), 0.11);
    assert.deepEqual([CanvasWM.rectOf(a).x, CanvasWM.rectOf(a).y], [40, 50]);
    assert.equal(Kernel.wires.list().filter(w => w.src.instanceId === a && w.dst.instanceId === b).length, 1);
    OrganismFactory.clearAll(Kernel);
  });
  it('UI event not declared in ui_hooks → RUNTIME_002 dropped', () => {
    const a = OrganismFactory.spawn('test.dummy', { x: 20, y: 20 });
    const v = OrganismFactory.handle(a).view;
    assert.fault(Kernel, 'RUNTIME_002', () => v.emit('self_destruct', {}));
    OrganismFactory.close(a);
  });
});
