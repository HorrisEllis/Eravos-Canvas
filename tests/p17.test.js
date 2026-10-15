/* P11 production gates closed in 3.28 — E errors · A accessibility · S save safety · X export · P performance ·
 * F the five specced effects · D drum lanes. */
window.__phase = 'P11.G';
const G = {
  ctxOf: (inst) => OrganismFactory.handle(inst).ctx,
  set(U, inst, obj) { Object.keys(obj).forEach(k => U.K.bus.publish('ui:config_change:' + inst, { key: k, value: obj[k] })); },
  feed(U, fx, o) { o = o || {}; const src = U.ctx.createOscillator(); src.frequency.value = o.freq || 440; const g = U.ctx.createGain(); g.gain.value = o.amp === undefined ? 0.5 : o.amp; src.connect(g); g.connect(U.K.audio.port(fx, o.port || 'in').node); src.start(o.at || 0); if (o.stop) src.stop(o.stop); return g; },
  // probes the tool's OWN output (port.src) — before the canvas's DC filter, stop guard and volume trim
  probe(U, inst, port) { U.K.audio.chain.out.gain.value = 0; const p = U.K.audio.port(inst, port || 'out'); (p.src || p.node).connect(U.ctx.destination); },
  peakDb(b, a, z) { return TH.db(TH.peak(b, a, z)); },
};

// ------------------------------------------------------------------------------------------------ E
describe('gate E — every message a person sees is plain language', () => {
  const CODE = /\b[A-Z]{3,}_\d{3}\b/, JARGON = /\b(payload|schema|organism|hook|undefined|null|instance)\b|[a-z]+_[a-z]+/i;
  it('every fault family has plain wording with no code or internals', () => {
    Object.keys(Kernel.FAULTS).forEach(c => { const d = PlainErrors.describe({ fault_class: c, message: 'x_y payload_schema_invalid .hook.' }); assert.ok(d.text && !CODE.test(d.text) && !JARGON.test(d.text), c + ': ' + d.text); if (d.hint) assert.ok(!CODE.test(d.hint) && !JARGON.test(d.hint), c + ' hint: ' + d.hint); assert.ok(['show', 'quiet'].includes(d.level)); });
  });
  it('a tool’s own plain sentence is shown as is; a technical one is not', () => {
    assert.equal(PlainErrors.describe({ fault_class: 'RUNTIME_002', message: 'record source gone — recording the master instead' }).level, 'show');
    assert.equal(PlainErrors.describe({ fault_class: 'RUNTIME_002', message: 'slot_mode bad' }).level, 'quiet');
    assert.ok(!/pads-1-/.test(PlainErrors.describe({ fault_class: 'RUNTIME_003', message: 'track Bass: instrument pads-1-x9k not mounted' }).text));
  });
  it('file names survive into the sentence; the domain adds sharper wording', () => {
    assert.ok(/her voice\.mp3/.test(PlainErrors.describe({ fault_class: 'ASSET_002', message: 'decode failed: her voice.mp3' }).text));
    assert.ok(/microphone/.test(PlainErrors.describe({ fault_class: 'RUNTIME_001', message: 'microphone permission denied: NotAllowedError' }).text));
    assert.ok(/MIDI controller/.test(PlainErrors.describe({ fault_class: 'RUNTIME_001', message: 'MIDI: InvalidStateError' }).text));
  });
  it('a fault raised with quiet:true is logged but not announced twice', () => {
    const K = Kernel.create({ quiet: true }); const f = K.fault('MOUNT_005', { message: 'x', quiet: true }); assert.equal(PlainErrors.describe(f, K).level, 'quiet');
  });
  it('no shell code puts a fault code into a toast', () => {
    const SRC = window.__SOURCES || { skeleton: {}, organisms: {} }, bad = [];
    Object.entries(Object.assign({}, SRC.skeleton, SRC.organisms)).forEach(([f, t]) => t.split('\n').forEach((l, i) => { if (/toast\([^)]*(fault_class|\.fault\.name|\bf\.name\b[^)]*\bf\.message)/.test(l)) bad.push(f + ':' + (i + 1)); }));
    assert.equal(bad.length, 0, bad.join(', '));
  });
});

// ------------------------------------------------------------------------------------------------ A
describe('gate A — keyboard reachable, named controls', () => {
  it('knobs are sliders with names and values, and arrow keys move them', () => {
    let v = null; const k = UIKit.Knob({ label: 'Cutoff', min: 20, max: 20000, default: 1000, value: 1000, unit: 'Hz', onChange: (x) => { v = x; } });
    assert.equal(k.el.getAttribute('role'), 'slider'); assert.equal(k.el.getAttribute('tabindex'), '0'); assert.equal(k.el.getAttribute('aria-label'), 'Cutoff'); assert.ok(k.el.getAttribute('aria-valuetext'));
    k.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); assert.ok(v > 1000, 'up');
    k.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })); assert.equal(v, 1000, 'reset');
    k.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); assert.equal(v, 20000, 'end');
  });
  it('segmented controls are radio groups you can arrow through; toggles report pressed', () => {
    let v = 'a'; const s = UIKit.Segmented({ label: 'Mode', options: ['a', 'b', 'c'], value: 'a', onChange: (x) => { v = x; } }); const g = s.el.querySelector('[role=radiogroup]') || s.el;
    assert.equal(g.getAttribute('role'), 'radiogroup'); g.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); assert.equal(v, 'b');
    assert.equal(g.querySelectorAll('[role=radio][aria-checked=true]').length, 1);
    const t = UIKit.Toggle({ label: 'Sync', value: true }); assert.equal(t.el.getAttribute('aria-pressed'), 'true');
  });
  it('a symbol-only button gets its name from its tooltip', () => {
    const b = UIKit.h('button', { title: 'play / stop', text: '▶' }); assert.equal(b.getAttribute('aria-label'), 'play / stop');
    const w = UIKit.h('button', { title: 'x', text: 'Save' }); assert.ok(!w.hasAttribute('aria-label'), 'a worded button keeps its words');
  });
  it('every tool’s UI: no unnamed focusable control', () => {
    const bad = [];
    OrganismFactory.defined().filter(d => d.domain === 'music' || !d.domain).forEach(d => {
      const U = TH.universe(0.1); const inst = TH.spawn(U, d.id); const rec = OrganismFactory.handle(inst); const root = document.createElement('div');
      try { OrganismFactory.mountUI(rec, root); } catch (e) { bad.push(d.id + ' ui: ' + e.message); return; }
      root.querySelectorAll('button, select, input, [role=slider], [role=spinbutton], [tabindex="0"]').forEach(el => {
        const name = (el.getAttribute('aria-label') || '').trim() || (el.textContent || '').replace(/\s+/g, ' ').trim() || (el.getAttribute('title') || '').trim() || (el.closest('label') ? el.closest('label').textContent.trim() : '');
        if (!/[A-Za-z0-9]/.test(name) && el.type !== 'file' && el.type !== 'hidden') bad.push(d.id + ': <' + el.tagName.toLowerCase() + ' class=' + el.className + '>');
      });
      OrganismFactory.close(inst);
    });
    assert.equal(bad.length, 0, '\n' + bad.slice(0, 80).join('\n'));
  }, { timeout: 60000 });
});

// ------------------------------------------------------------------------------------------------ S
describe('gate S — save safety', () => {
  it('a named project saves and opens again exactly', async () => {
    const name = '__p17 project ' + Date.now();
    const K = Kernel; const before = K.registry.list().length;
    const a = OrganismFactory.spawn('eravos.supersaw', { K, headless: true }); OrganismFactory.handle(a).ctx.params.set('cutoff', 1234);
    assert.ok(await Workspace.projects.save(name)); assert.ok((await Workspace.projects.list()).some(p => p.name === name));
    OrganismFactory.close(a);
    assert.ok(await Workspace.projects.load(name));
    const r = K.registry.byOrganism('eravos.supersaw')[0]; assert.ok(r, 'came back'); assert.equal(OrganismFactory.handle(r.instance_id).ctx.params.get('cutoff'), 1234);
    await Workspace.projects.remove(name); assert.ok(!(await Workspace.projects.list()).some(p => p.name === name));
    OrganismFactory.clearAll(K);
  });
  it('changes mark the canvas unsaved; keeping a copy clears it', () => {
    if (!window.__p17ws) { Workspace.boot(Kernel, { interval: 0, headless: true }); window.__p17ws = true; }
    Workspace.markKept(); assert.equal(Workspace.dirty, false);
    const a = OrganismFactory.spawn('eravos.lfo', { K: Kernel, headless: true }); Kernel.bus.publish('ui:config_change:' + a, { key: 'depth', value: 0.7 });
    assert.equal(Workspace.dirty, true); Workspace.markKept(); assert.equal(Workspace.dirty, false); OrganismFactory.close(a);
  });
  it('a backup carries projects and presets to another address (import side)', async () => {
    const snap = { workspace_version: '1.0.0', organisms: [{ id: 'eravos.lfo', instanceId: 'lfo-x', state: {} }], wires: [], assets: {}, domains: {} };
    const r = await Workspace.importBackup({ eravos_backup: 1, origin: 'file://', latest: { time: Date.now(), snap }, history: [], projects: [{ name: '__p17 from file', time: Date.now(), snap }], presets: { 'eravos.lfo': { '__p17 preset': { params: { depth: 0.3 } } } }, preset_assets: {} });
    assert.equal(r.projects, 2); assert.ok(r.presets >= 1);
    const list = await Workspace.projects.list(); assert.ok(list.some(p => p.name === '__p17 from file')); assert.ok(list.some(p => /^Autosave from file:\/\//.test(p.name)));
    for (const p of list.filter(p => /__p17|Autosave from file/.test(p.name))) await Workspace.projects.remove(p.name);
  });
  it('a backup made here contains every kept project', async () => {
    await Workspace.projects.save('__p17 backup probe'); const b = await Workspace.backup();
    assert.equal(b.eravos_backup, 1); assert.ok(b.projects.some(p => p.name === '__p17 backup probe')); await Workspace.projects.remove('__p17 backup probe');
  });
});

// ------------------------------------------------------------------------------------------------ X
describe('gate X — export: MIDI of the note clips, stems', () => {
  it('Timeline → MIDI: one track per instrument lane, notes and timing exact, drums on channel 10, re-imports', async () => {
    const U = TH.universe(0.2, { bpm: 120 }); const tl = TH.spawn(U, 'eravos.timeline'), saw = TH.spawn(U, 'eravos.supersaw'), pads = TH.spawn(U, 'eravos.pads');
    const c = G.ctxOf(tl);
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: saw, name: 'Lead' }); U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: pads, name: 'Drums' });
    U.K.bus.publish('ui:clip_add:' + tl, { kind: 'notes', target: saw, startBar: 2, bars: 1, notes: [{ s: 0, l: 4, n: 60, v: 1 }, { s: 8, l: 2, n: 67, v: 0.5 }] });
    U.K.bus.publish('ui:clip_add:' + tl, { kind: 'notes', target: pads, startBar: 1, bars: 1, notes: [{ s: 0, l: 1, n: 36, v: 1 }, { s: 4, l: 1, n: 38, v: 0.8 }] });
    await TH.sleep(10);
    const song = c.midiSong(); assert.equal(song.tracks.length, 2);
    const lead = song.tracks.find(t => /Lead/.test(t.name)); assert.equal(lead.events[0].tick, 16 * 24); assert.equal(lead.events[1].tick, 16 * 24 + 8 * 24); assert.equal(lead.events[0].dur, 96);
    assert.ok(song.tracks.find(t => /Drums/.test(t.name)).drums, 'drums flagged');
    const bytes = new Uint8Array(MusicTheory.midi.write(song)); const back = MusicTheory.midi.parse(bytes.buffer);
    const notes = back.tracks.flatMap(t => t.notes || t.events || []); assert.ok(notes.length >= 4, 're-import: ' + JSON.stringify(back).slice(0, 120));
    // channel 10 for the drum track: a note-on byte 0x99 must exist
    assert.ok(Array.from(bytes).some((b, i) => b === 0x99 && bytes[i + 1] === 36), 'drum note-on on channel 10');
  });
  it('a tagged bounce (a stem) goes to the tool that asked for it, not the Session download', () => {
    const U = TH.universe(0.2); const s = TH.spawn(U, 'eravos.session'); let files = 0; U.K.bus.subscribe('ui:file_ready:' + s, () => files++);
    U.K.bus.publish('transport:recorded', { arrayBuffer: new ArrayBuffer(64), duration: 1, tag: 'stem:x:0' });
    return TH.sleep(20).then(() => assert.equal(files, 0));
  });
});

// ------------------------------------------------------------------------------------------------ P
describe('gate P — performance ceilings', () => {
  it('a flood of notes is capped per tool (no runaway voices), and counted', async () => {
    const U = TH.universe(0.5); const a = TH.spawn(U, 'eravos.supersaw'); const c = G.ctxOf(a); let got = 0;
    const orig = c.noteOn; // count what reaches the engine through the SDK gate
    U.K.bus.subscribe('note:trigger', () => {}); for (let i = 0; i < 200; i++) TH.note(U, a, 48 + (i % 24), 0.05, { duration: 0.4 });
    assert.ok(c.notesDropped >= 200 - 32, 'dropped ' + c.notesDropped); assert.ok(c.notesDropped <= 200 - 32);
  });
  // HONEST + HERMETIC (3.37): an absolute time limit measured the MACHINE, not ERAVOS (the same build took 4.2 s on one
  // VM and 9.7 s on another). The guard is a RATIO to a fixed reference graph rendered in the same run on the same
  // machine (96 saw oscillators → 96 low-pass filters, 4 s). Baseline: 3.36 measured 18.0–22.0 (3 runs) and 3.37 18.7–19.1
  // on the 2-core test VM — see specs/eravos.performance.spec. Fails if ERAVOS gets 30 % heavier relative to the machine.
  it('20 tools playing: no more than 30 % heavier than the 3.36 baseline, relative to a reference graph on the same machine', async () => {
    const ids = ['eravos.supersaw', 'eravos.reese-bass', 'eravos.wobble-bass', 'eravos.retro-poly', 'eravos.pad-forge', 'eravos.organ', 'eravos.sub-engine', 'eravos.acid-synth', 'eravos.pads', 'eravos.coven',
      'eravos.fx-echo', 'eravos.fx-filter', 'eravos.fx-moddelay', 'eravos.fx-phaser', 'eravos.fx-destroyer', 'eravos.fx-eq', 'eravos.fx-dynamics', 'eravos.master-fx', 'eravos.channel', 'eravos.sidechain-compressor'];
    async function calib() { const c = new OfflineAudioContext(2, 4 * 44100, 44100); for (let i = 0; i < 96; i++) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55 + i * 7; const f = c.createBiquadFilter(); f.frequency.value = 800 + i * 40; o.connect(f); f.connect(c.destination); o.start(); } const t0 = performance.now(); await c.startRendering(); return performance.now() - t0; }
    async function scene() { const U = TH.universe(4, { bpm: 128 }); const insts = ids.map(id => TH.spawn(U, id)); for (const i of insts) { const c = G.ctxOf(i); if (c.ready) await c.ready; }
      insts.slice(0, 10).forEach((a, k) => { for (let b = 0; b < 8; b++) TH.note(U, a, 48 + ((k * 3 + b * 5) % 24), 0.1 + b * 0.45, { duration: 0.4 }); });
      const t0 = performance.now(); await TH.render(U); return performance.now() - t0; }
    await calib(); const cal = Math.min(await calib(), await calib()), ms = await scene(), ratio = ms / cal;
    window.__perf20 = { ms, cal, ratio }; assert.lt(ratio, 19.5 * 1.3, `scene ${ms.toFixed(0)} ms / reference ${cal.toFixed(0)} ms = ${ratio.toFixed(2)} (baseline 19.5)`);
  }, { timeout: 60000 });
});

// ------------------------------------------------------------------------------------------------ F
describe('gate F — EQ, Dynamics, Glitch, Pitch, FX Box', () => {
  ['eravos.fx-eq', 'eravos.fx-dynamics', 'eravos.fx-glitch', 'eravos.fx-pitch'].forEach(id => {
    it(`${id}: mix 0 nulls against the input (STD.fx)`, async () => {
      const U = TH.universe(0.6); const fx = TH.spawn(U, id); const c = G.ctxOf(fx); if (c.ready) await c.ready;
      c.params.set('mix', 0); U.K.audio.chain.out.gain.value = 0;
      const g = G.feed(U, fx); const inv = U.ctx.createGain(); inv.gain.value = -1; g.connect(inv); inv.connect(U.ctx.destination); U.K.audio.port(fx, 'out').node.connect(U.ctx.destination);
      const b = await TH.render(U); assert.lt(TH.rms(b, 0.2, 0.6), 1e-4);
    });
    it(`${id}: wet signal is non-silent; every preset loads with no fault`, async () => {
      const U = TH.universe(1); const fx = TH.spawn(U, id); const c = G.ctxOf(fx); if (c.ready) await c.ready;
      Object.keys(OrganismFactory.def(id).presets).forEach(n => assert.noFault(U.K, () => U.K.bus.publish('ui:preset_load:' + fx, { name: n }), n));
      U.K.bus.publish('ui:preset_load:' + fx, { name: Object.keys(OrganismFactory.def(id).presets)[0] }); c.params.set('mix', 1);
      G.probe(U, fx); G.feed(U, fx, { freq: 220 }); const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.5, 1)), -40);
    });
  });
  it('EQ: peak +6 dB at 1 kHz Q 1 → +6 ± 0.3 dB measured', async () => {
    const U = TH.universe(1); const fx = TH.spawn(U, 'eravos.fx-eq'); const c = G.ctxOf(fx);
    c.params.setMany({ hpOn: false, lpOn: false, lsGain: 0, hsGain: 0, p1Gain: 0, p3Gain: 0, p2On: true, p2Freq: 1000, p2Gain: 6, p2Q: 1, mix: 1 });
    G.probe(U, fx); G.feed(U, fx, { freq: 1000, amp: 0.25 }); const b = await TH.render(U); assert.near(TH.db(TH.rms(b, 0.5, 1) / (0.25 / Math.SQRT2)), 6, 0.3);
  });
  it('EQ: HPF 48 dB/oct at 100 Hz → about −48 dB at 50 Hz', async () => {
    const U = TH.universe(1.2); const fx = TH.spawn(U, 'eravos.fx-eq'); const c = G.ctxOf(fx);
    c.params.setMany({ hpOn: true, hpFreq: 100, hpSlope: 48, lpOn: false, lsGain: 0, hsGain: 0, p1Gain: 0, p2Gain: 0, p3Gain: 0, mix: 1 });
    G.probe(U, fx); G.feed(U, fx, { freq: 50, amp: 0.5 }); const b = await TH.render(U); assert.near(TH.db(TH.rms(b, 0.6, 1.2) / (0.5 / Math.SQRT2)), -48, 3);
  });
  it('EQ: LISTEN solos one band; turning it off restores the curve', async () => {
    const U = TH.universe(0.2); const fx = TH.spawn(U, 'eravos.fx-eq'); const c = G.ctxOf(fx); c.params.set('listen', 'p2'); await TH.render(U);
    assert.near(c.internals.lgain.gain.value, 1, 0.05); c.params.set('listen', 'off'); assert.equal(c.params.get('listen'), 'off');
  });
  it('Dynamics: 4:1 at −18 dB, hard knee: a −6 dBFS sine comes out at −15 ± 0.5 dBFS', async () => {
    const U = TH.universe(1.2); const fx = TH.spawn(U, 'eravos.fx-dynamics'); const c = G.ctxOf(fx); await c.ready;
    c.params.setMany({ gateOn: false, compOn: true, thresh: -18, ratio: 4, knee: 0, attack: 1, release: 300, makeup: 0, mix: 1 });
    G.probe(U, fx); G.feed(U, fx, { freq: 200, amp: 0.5 }); const b = await TH.render(U); assert.near(G.peakDb(b, 0.8, 1.2), -15, 0.5);
  });
  it('Dynamics: KEY wired → a steady sound ducks while the key plays', async () => {
    const U = TH.universe(1.6); const fx = TH.spawn(U, 'eravos.fx-dynamics'); const c = G.ctxOf(fx); await c.ready;
    c.params.setMany({ gateOn: false, compOn: true, keyed: true, thresh: -30, ratio: 10, knee: 0, attack: 1, release: 50, makeup: 0, mix: 1 });
    G.probe(U, fx); G.feed(U, fx, { freq: 300, amp: 0.3 }); G.feed(U, fx, { port: 'key', freq: 60, amp: 0.8, at: 0.8 });
    const b = await TH.render(U); assert.gt(G.peakDb(b, 0.4, 0.75) - G.peakDb(b, 1.2, 1.55), 10, 'ducked by more than 10 dB');
  });
  it('Dynamics: gate attenuates quiet noise by its range', async () => {
    const U = TH.universe(1); const fx = TH.spawn(U, 'eravos.fx-dynamics'); const c = G.ctxOf(fx); await c.ready;
    c.params.setMany({ gateOn: true, gateThresh: -30, gateRange: 40, gateRelease: 20, compOn: false, mix: 1 });
    G.probe(U, fx); G.feed(U, fx, { freq: 300, amp: 0.001 }); const b = await TH.render(U); assert.lt(TH.db(TH.rms(b, 0.5, 1) / (0.001 / Math.SQRT2)), -38);
  });
  it('Pitch: 440 Hz in, +12 → 880 ± 3 Hz; −12 → 220 ± 2 Hz; latency = window / 2 reported', async () => {
    for (const [st, want, tol] of [[12, 880, 3], [-12, 220, 2]]) {
      const U = TH.universe(1.2); const fx = TH.spawn(U, 'eravos.fx-pitch'); const c = G.ctxOf(fx); await c.ready;
      c.params.setMany({ semitones: st, cents: 0, window: 50, glide: 0, harm1: 'off', harm2: 'off', mix: 1 });
      G.probe(U, fx); G.feed(U, fx, { freq: 440, amp: 0.5 }); const b = await TH.render(U); assert.near(TH.zcFreq(b, 0.5, 1.1), want, tol, st + ' st'); // zero-crossings: autocorrelation can't tell 880 from its 440 sub-period
    }
    const U = TH.universe(0.1); const fx = TH.spawn(U, 'eravos.fx-pitch'); const c = G.ctxOf(fx); await c.ready; c.params.set('window', 60);
    const lat = U.K.ledger.entries({ type: 'latency_reported' }).filter(e => e.instance_id === fx).pop(); assert.ok(lat, 'latency written to the ledger'); assert.near(lat.latency_sec, 0.03, 1e-6);
  });
  it('Glitch: repeat 1/16 × 4 replays the captured slice four times (± 3 ms splices)', async () => {
    const U = TH.universe(1.5, { bpm: 120 }); const fx = TH.spawn(U, 'eravos.fx-glitch'); const c = G.ctxOf(fx); await c.ready;
    c.params.setMany({ size: '1/16', repeats: 4, chaos: 0, pitchDrift: 0, mix: 1 }); G.probe(U, fx);
    // input: a click every 0.5 s → a slice of 1/16 (125 ms) ending at the event contains no click unless placed; use a ramp instead
    const n = U.ctx.length, buf = U.ctx.createBuffer(1, n, U.ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = ((i % 7919) / 7919) * 0.5; // prime period: live ≠ replay
    const s = U.ctx.createBufferSource(); s.buffer = buf; s.connect(U.K.audio.port(fx, 'in').node); s.start(0);
    const ev = c.internals.build('repeat', 0.75); c.internals.post(ev); await TH.sleep(40); // the worklet port is async: let the event arrive before an offline render races past it
    const b = await TH.render(U); const o = b.getChannelData(0), sr = b.sampleRate, len = Math.round(0.125 * sr), at = Math.round(0.75 * sr), mid = Math.round(len / 2);
    for (let k = 1; k < 4; k++) assert.near(o[at + k * len + mid], o[at + mid], 0.02, 'repeat ' + k);
    assert.near(o[at + mid], d[at - len + mid], 0.02, 'the replayed slice is the one just before the event');
  });
  it('Glitch: tape stop — the pitch falls steadily to zero', async () => {
    const U = TH.universe(2, { bpm: 120 }); const fx = TH.spawn(U, 'eravos.fx-glitch'); const c = G.ctxOf(fx); await c.ready; c.params.setMany({ stopBeats: 2, mix: 1 });
    G.probe(U, fx); G.feed(U, fx, { freq: 400, amp: 0.5 }); c.internals.post(c.internals.build('stop', 0.3)); await TH.sleep(40);
    const b = await TH.render(U); const f1 = TH.zcFreq(b, 0.35, 0.5), f2 = TH.zcFreq(b, 0.7, 0.85), f3 = TH.zcFreq(b, 1.05, 1.2);
    assert.gt(f1, f2); assert.gt(f2, f3); assert.near(f1, 400 * (1 - 0.125), 60);
  });
  it('FX Box: every algorithm makes sound; a 2-bar riser at 120 lasts 4.0 s; bounces alternate sides', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.fx-box'); const c = G.ctxOf(a); const algs = c.stateExtra().algs;
    for (const alg of algs) {
      const V = TH.universe(1.2, { bpm: 120 }); const x = TH.spawn(V, 'eravos.fx-box'); const cx = G.ctxOf(x);
      V.K.bus.publish('ui:slot_edit:' + x, { index: 0, key: 'alg', value: alg }); V.K.bus.publish('ui:slot_edit:' + x, { index: 0, key: 'length', value: 0.8 }); V.K.bus.publish('ui:slot_edit:' + x, { index: 0, key: 'unit', value: 's' });
      TH.note(V, x, 36, 0.05); const b = await TH.render(V); assert.gt(TH.db(TH.rms(b, 0.05, 0.9)), -60, alg + ' silent');
    }
    const V = TH.universe(5, { bpm: 120 }); const x = TH.spawn(V, 'eravos.fx-box'); ['alg:riser', 'unit:bars', 'length:2'].forEach(s => { const [k, v] = s.split(':'); V.K.bus.publish('ui:slot_edit:' + x, { index: 0, key: k, value: k === 'length' ? 2 : v }); });
    assert.near(G.ctxOf(x).internals.lenSec(G.ctxOf(x).internals.slots[0]), 4.0, 0.01);
    G.probe(V, x); TH.note(V, x, 36, 0.1); const b = await TH.render(V); const d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > 1e-3) last = i;
    assert.near(last / b.sampleRate - 0.1, 4.0, 0.03, 'riser length');
    const W = TH.universe(2); const y = TH.spawn(W, 'eravos.fx-box'); W.K.bus.publish('ui:slot_edit:' + y, { index: 0, key: 'alg', value: 'bounce' }); TH.note(W, y, 36, 0.05); await TH.render(W);
    const pans = G.ctxOf(y).internals.lastPans; assert.gt(pans.length, 2); for (let i = 1; i < pans.length; i++) assert.ok(Math.sign(pans[i]) !== Math.sign(pans[i - 1]), 'alternates');
  }, { timeout: 60000 });
});

// ------------------------------------------------------------------------------------------------ D
describe('gate D — drum lanes in the timeline', () => {
  it('the timeline learns each drum tool’s pad names (Drum Machine, Drum Forge, FX Box)', async () => {
    const U = TH.universe(0.2); const tl = TH.spawn(U, 'eravos.timeline'), p = TH.spawn(U, 'eravos.pads'), f = TH.spawn(U, 'eravos.drum-forge'), x = TH.spawn(U, 'eravos.fx-box');
    await TH.sleep(30); const names = G.ctxOf(tl).drumNames();
    assert.equal(names[p][0].name, 'kick'); assert.equal(names[p].length, 16); assert.equal(names[p][0].note, 36);
    assert.ok(names[f] && names[f].length === 16 && names[f][0].name, 'drum forge'); assert.ok(names[x] && names[x].length === 12 && /riser|laser/.test(names[x][0].name), 'fx box');
  });
  it('renaming happens live: a new kit renames the rows', async () => {
    const U = TH.universe(0.2); const tl = TH.spawn(U, 'eravos.timeline'), f = TH.spawn(U, 'eravos.drum-forge'); await TH.sleep(20);
    const before = G.ctxOf(tl).drumNames()[f].map(r => r.name).join(); U.K.bus.publish('ui:config_change:' + f, { key: 'kit', value: "Synthwave '84" }); await TH.sleep(20);
    assert.ok(G.ctxOf(tl).drumNames()[f].map(r => r.name).join() !== before);
  });
});
