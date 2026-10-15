/* 3.28 stop contract — "some of them hang and don't stop playing and have no stop button" (the Tape Echo above all).
 * Every tool that makes sound must go quiet: Stop (soft — latches, drones and endless loops end; natural tails ring
 * out) and Stop all / a tool's ■ (hard — quiet within ~10 ms, until that tool is played or touched again).
 * RCAs: Tape Echo + Dub Station — a saturator INSIDE the feedback loop had 3.3× / 8.5× small-signal gain, so every
 * loop ran away forever; Destroyer — the mid-rise quantiser turned silence into a constant DC level; Ratio Lattice /
 * Recursive Spectra — drones that nothing could stop but a buried toggle. */
window.__phase = 'P11.S';
const ST = {
  at(U, t, fn) { U.ctx.suspend(t).then(() => { try { fn(); } finally { U.ctx.resume(); } }); },
  probe(U, inst) { U.K.audio.chain.out.gain.value = 0; const d = OrganismFactory.handle(inst).ctx.descriptor, h = (d.hooks || []).find(x => x.wire_type === 'audio' && x.direction === 'out'); const p = U.K.audio.port(inst, (h && h.port) || 'out') || U.K.audio.ports(inst).find(x => x.kind === 'audio' && x.direction === 'out'); p.node.connect(U.ctx.destination); return p; },
  sounding(d) { return (d.hooks || []).some(h => h.wire_type === 'audio' && h.direction === 'out'); },
  isFx: (d) => (d.hooks || []).some(h => h.wire_type === 'audio' && h.direction === 'in'),
  plays: (d) => (d.hooks || []).some(h => h.event_type === 'note:trigger' && h.direction === 'in'),
  async excite(U, d, inst) {
    const c = OrganismFactory.handle(inst).ctx; if (c.ready) await c.ready;
    if (ST.plays(d)) [36, 48, 55].forEach(n => TH.note(U, inst, n, 0.1, { duration: 0.6 }));
    if (ST.isFx(d)) { const ip = U.K.audio.port(inst, 'in'); if (ip) { const o = U.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 220; const g = U.ctx.createGain(); g.gain.value = 0.3; o.connect(g); g.connect(ip.node); o.start(0.1); o.stop(0.5); } }
    if (c.audition) try { c.audition({ note: 57, velocity: 0.9, duration: 0.5 }); } catch (e) {}
    return c;
  },
  tools: () => OrganismFactory.defined().filter(d => ST.sounding(d) && d.id !== 'eravos.lfo'),
};

describe('stop contract — nothing plays forever', () => {
  it('Stop: every sounding tool is quiet (< −50 dB) 6 s after Stop — no hangs', async () => {
    const bad = [];
    for (const d of ST.tools()) {
      // a declared tail (spec.tail — Pad Forge's 14 s space) is a tail, not a hang: measured after it has had its time
      const U0 = TH.universe(0.1); const i0 = TH.spawn(U0, d.id); const tail = Math.max(0, ...U0.K.audio.ports(i0).map(p => +p.tail || 0)); const SEC = Math.max(8, 2 + tail + 2);
      const U = TH.universe(SEC, { bpm: 120 }); const inst = TH.spawn(U, d.id); ST.probe(U, inst); await ST.excite(U, d, inst);
      U.T.play(); ST.at(U, 1.0, () => U.T.stop());
      const b = await TH.render(U); const db = TH.db(TH.peak(b, SEC - 1, SEC)); if (db > -50) bad.push(`${d.label} (${d.id}): ${db.toFixed(1)} dB`);
    }
    assert.equal(bad.length, 0, '\n' + bad.join('\n'));
  }, { timeout: 240000 });
  it('Stop all: every sounding tool is quiet within 50 ms (< −80 dB), echoes and drones included', async () => {
    const bad = [];
    for (const d of ST.tools()) {
      const U = TH.universe(1.6, { bpm: 120 }); const inst = TH.spawn(U, d.id); ST.probe(U, inst); await ST.excite(U, d, inst);
      U.T.play(); ST.at(U, 0.8, () => U.K.silence({ hard: true }));
      const b = await TH.render(U); const db = TH.db(TH.peak(b, 0.85, 1.6)); if (db > -80) bad.push(`${d.label}: ${db.toFixed(1)} dB`);
    }
    assert.equal(bad.length, 0, '\n' + bad.join('\n'));
  }, { timeout: 240000 });
  it('after Stop all, playing a tool again brings it straight back', async () => {
    const U = TH.universe(2, { bpm: 120 }); const s = TH.spawn(U, 'eravos.supersaw'); ST.probe(U, s);
    TH.note(U, s, 57, 0.1, { duration: 3 }); ST.at(U, 0.5, () => { U.K.silence({ hard: true }); TH.note(U, s, 60, 1.0, { duration: 0.6 }); });
    const b = await TH.render(U); assert.lt(TH.db(TH.peak(b, 0.6, 0.95)), -80, 'quiet'); assert.gt(TH.db(TH.peak(b, 1.1, 1.5)), -30, 'back');
  });
  it('a tool’s ■ silences that tool only', async () => {
    const U = TH.universe(1.5); const a = TH.spawn(U, 'eravos.supersaw'), o = TH.spawn(U, 'eravos.retro-poly');
    TH.note(U, a, 57, 0.05, { duration: 3 }); TH.note(U, o, 57, 0.05, { duration: 3 });
    ST.at(U, 0.5, () => U.K.bus.publish('ui:silence:' + a, {}));
    U.K.audio.chain.out.gain.value = 0; const ga = U.ctx.createGain(), go = U.ctx.createGain(); const m = U.ctx.createChannelMerger(2);
    U.K.audio.port(a, 'out').node.connect(ga); U.K.audio.port(o, 'out').node.connect(go); ga.connect(m, 0, 0); go.connect(m, 0, 1); m.connect(U.ctx.destination);
    const b = await TH.render(U); const L = b.getChannelData(0), R = b.getChannelData(1), sr = b.sampleRate; let pl = 0, pr = 0;
    for (let i = Math.floor(0.6 * sr); i < Math.floor(1.2 * sr); i++) { pl = Math.max(pl, Math.abs(L[i])); pr = Math.max(pr, Math.abs(R[i])); }
    assert.lt(TH.db(pl), -80, 'the stopped tool'); assert.gt(TH.db(pr), -40, 'the other tool keeps playing');
  });
  it('Tape Echo: the Feedback knob IS the loop gain — 0.5 halves each repeat (± 1 dB)', async () => {
    const U = TH.universe(2.5, { bpm: 120 }); const fx = TH.spawn(U, 'eravos.fx-echo'); const c = OrganismFactory.handle(fx).ctx;
    c.params.setMany({ sync: false, timeFree: 400, feedback: 0.5, sat: 0.3, age: 0, wow: 0, flutter: 0, stereo: 'mono', mix: 1 }); ST.probe(U, fx);
    const o = U.ctx.createOscillator(); o.frequency.value = 1000; const g = U.ctx.createGain(); g.gain.value = 0.2; o.connect(g); g.connect(U.K.audio.port(fx, 'in').node); o.start(0.05); o.stop(0.15);
    const b = await TH.render(U); const r1 = TH.peak(b, 0.45, 0.56), r2 = TH.peak(b, 0.85, 0.96), r3 = TH.peak(b, 1.25, 1.36);
    assert.near(TH.db(r2 / r1), -6, 1, 'repeat 2 vs 1'); assert.near(TH.db(r3 / r2), -6, 1, 'repeat 3 vs 2');
  });
  it('Tape Echo: Infinite Freeze and runaway feedback hold until Stop, then empty — and CLEAR empties at once', async () => {
    for (const set of [{ feedback: 1.05, sat: 0.6 }, { freeze: true }]) {
      const U = TH.universe(6, { bpm: 120 }); const fx = TH.spawn(U, 'eravos.fx-echo'); const c = OrganismFactory.handle(fx).ctx;
      c.params.setMany({ div: '1/4', mix: 1 }); ST.probe(U, fx);
      const o = U.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 220; const g = U.ctx.createGain(); g.gain.value = 0.3; o.connect(g); g.connect(U.K.audio.port(fx, 'in').node); o.start(0.05); o.stop(0.3);
      ST.at(U, 0.6, () => c.params.setMany(set)); U.T.play(); ST.at(U, 2.0, () => U.T.stop());
      const b = await TH.render(U); assert.gt(TH.db(TH.peak(b, 1.5, 1.95)), -40, JSON.stringify(set) + ' holds'); assert.lt(TH.db(TH.peak(b, 5, 6)), -80, JSON.stringify(set) + ' empty after Stop');
    }
    const U = TH.universe(3, { bpm: 120 }); const fx = TH.spawn(U, 'eravos.fx-echo'); const c = OrganismFactory.handle(fx).ctx; c.params.setMany({ feedback: 1.05, sat: 0.6, div: '1/4', mix: 1 }); ST.probe(U, fx);
    const o = U.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 220; o.connect(U.K.audio.port(fx, 'in').node); o.start(0.05); o.stop(0.3);
    ST.at(U, 1.0, () => U.K.bus.publish('ui:clear:' + fx, {}));
    const b = await TH.render(U); assert.lt(TH.db(TH.peak(b, 1.1, 3)), -80, 'CLEAR');
  });
  it('Destroyer: silence in → exact silence out at every bit depth (no DC)', async () => {
    const U = TH.universe(0.5); const fx = TH.spawn(U, 'eravos.fx-destroyer'); const c = OrganismFactory.handle(fx).ctx; if (c.ready) await c.ready;
    c.presets.load('NES 8-bit'); ST.probe(U, fx); const b = await TH.render(U); assert.equal(TH.peak(b, 0.1, 0.5), 0);
  });
  it('drones (Ratio Lattice, Recursive Spectra) stop on Stop, show it, and start again from their button', async () => {
    for (const id of ['eravos.ratio-lattice', 'eravos.recursive-spectra']) {
      const U = TH.universe(4); const x = TH.spawn(U, id); const c = OrganismFactory.handle(x).ctx; c.presets.load(Object.keys(c.descriptor.presets)[0]); c.params.set('drone', true); ST.probe(U, x);
      ST.at(U, 1.0, () => U.T.stop());
      const b = await TH.render(U); assert.gt(TH.db(TH.peak(b, 0.5, 0.95)), -40, id + ' sounded'); assert.lt(TH.db(TH.peak(b, 3.5, 4)), -60, id + ' stopped'); assert.equal(c.params.get('drone'), false, id + ' shows stopped');
    }
  });
  it('EDM Pads pack: 40+ pads, every one loads and sounds', async () => {
    const pk = ContentPacks.list().find(p => p.id === 'eravos.presets.edm-pads'); assert.ok(pk);
    const all = []; pk.for.forEach(id => ContentPacks.items(id, 'presets').filter(x => x.pack === pk.id).forEach(x => all.push([id, 'EDM Pad · ' + x.name]))); assert.gt(all.length, 39);
    for (const [id, name] of all) {
      const U = TH.universe(1.2); const x = TH.spawn(U, id); const c = OrganismFactory.handle(x).ctx; assert.ok(c.descriptor.presets[name], name); c.presets.load(name); ST.probe(U, x);
      TH.note(U, x, 57, 0.05, { duration: 1 }); const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.6, 1.1)), -45, name + ' silent');
    }
  }, { timeout: 120000 });
});
