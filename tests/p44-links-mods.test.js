/* P44 · small tools inside small tools (mods) and tools that grow when wired (links) — spec eravos.links-and-mods */
window.__phase = 'P44';
describe('P44 · mods — any tool inside another', () => {
  const SR = TH.SR, F = () => OrganismFactory;
  const ctxOf = (id) => F().handle(id).ctx;
  function feedSaw(U, inst, hz, from, to) { const o = U.ctx.createOscillator(), g = U.ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = hz || 110; g.gain.value = 0.3; o.connect(g); g.connect(U.K.audio.port(inst, 'in').node); o.start(from || 0.02); o.stop(to || 0.9); }
  function solo(U, inst) { U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(inst, 'out').node.connect(U.ctx.destination); }
  const bright = (b, a, z) => { const d = b.getChannelData(0); let x = 0, dd = 0; for (let i = Math.floor(a * SR) + 1; i < z * SR; i++) { x += d[i] * d[i]; dd += (d[i] - d[i - 1]) ** 2; } return Math.sqrt(dd / Math.max(1e-12, x)); };

  it('every tool with slots gets internal send/return hooks and a hidden mods setting', () => {
    for (const id of ['eravos.fx-destroyer', 'eravos.wub-osc', 'eravos.wub-filter', 'eravos.wub-sub']) {
      const d = F().def(id); assert.ok(d.slots && d.slots.length, id);
      d.slots.forEach(sl => { ['send', 'return'].forEach(k => { const h = d.hooks.find(x => x.hook_id === `slot.${sl.id}.${k}`); assert.ok(h && h.internal && h.rail === false, `${id} slot.${sl.id}.${k}`); }); });
      const c = d.config.find(x => x.key === 'mods'); assert.ok(c && c.hidden && c.type === 'array', id + ' mods param');
    }
  });
  it('the picker offers tools that pass sound through (in and out), never the host itself or an instrument', () => {
    const U = TH.universe(0.2), d = TH.spawn(U, 'eravos.fx-destroyer'), list = Mods.compatible(d, 'after').map(t => t.id);
    assert.ok(list.includes('eravos.wub-filter') && list.includes('eravos.fx-echo'), list.join(','));
    assert.ok(!list.includes('eravos.fx-destroyer'), 'not itself'); assert.ok(!list.includes('eravos.wub-osc'), 'no instrument (no audio in)');
  });
  it('a Wub Filter inside the Destroyer shapes its sound; bypass gives the plain Destroyer back; no window, not a tool on the canvas', async () => {
    const run = async (withMod, bypass) => {
      const U = TH.universe(1), d = TH.spawn(U, 'eravos.fx-destroyer'), c = ctxOf(d); c.params.setMany({ shape: 'hard', drive: 0.5 }); if (c.ready) await c.ready;
      let kid = null;
      if (withMod) { const u = Mods.add(d, 'after', 'eravos.wub-filter'); kid = Mods.childOf(d, u); assert.ok(kid, 'spawned'); ctxOf(kid).params.setMany({ mode: 'lowpass', cutoff: 150, range: 0, position: 0, mix: 1 }); if (bypass) Mods.bypass(d, u, true); }
      solo(U, d); feedSaw(U, d); const b = await TH.render(U);
      if (kid) { const r = U.K.registry.get(kid); assert.ok(r.descriptor.system, 'hidden from tool lists'); assert.equal(F().handle(kid).win, null, 'no window'); assert.equal(F().handle(kid).hostId, d); }
      return bright(b, 0.3, 0.8);
    };
    const plain = await run(false), modded = await run(true), off = await run(true, true);
    assert.lt(modded, plain * 0.5, `the filter darkens it: ${modded.toFixed(3)} vs ${plain.toFixed(3)}`);
    assert.lt(Math.abs(off - plain) / plain, 0.02, `bypassed = plain: ${off.toFixed(4)} vs ${plain.toFixed(4)}`);
  });
  it('a chain plays in order and ↑ ↓ reorders it; insert wires are not links and not cables', () => {
    const U = TH.universe(0.2), h = TH.spawn(U, 'eravos.wub-filter');
    const a = Mods.add(h, 'after', 'eravos.fx-destroyer'), b = Mods.add(h, 'after', 'eravos.fx-echo');
    const order = () => { const w = U.K.wires.list().filter(x => x.meta && x.meta.insert && x.meta.host === h); const first = w.find(x => x.src.instanceId === h); return F().handle(first.dst.instanceId).modUid; };
    assert.equal(order(), a); Mods.move(h, b, -1); assert.equal(order(), b);
    assert.equal(U.K.wires.list().filter(x => x.meta && x.meta.insert && x.meta.host === h).length, 3, 'send → b → a → return');
    assert.equal(ctxOf(h).links().length, 0, 'mods are part of the tool, not links');
  });
  it('save → load brings the mods back with their own settings; closing the host closes its mods', () => {
    const U = TH.universe(0.2), h = TH.spawn(U, 'eravos.fx-destroyer'), u = Mods.add(h, 'after', 'eravos.wub-filter'), kid = Mods.childOf(h, u);
    ctxOf(kid).params.set('cutoff', 333);
    const snap = JSON.parse(JSON.stringify(ctxOf(h).serialize()));
    const U2 = TH.universe(0.2), h2 = TH.spawn(U2, 'eravos.fx-destroyer', { state: snap }), e = Mods.entries(h2);
    assert.equal(e.length, 1); assert.ok(e[0].child, 'respawned'); assert.equal(ctxOf(e[0].child).params.get('cutoff'), 333);
    F().close(h); assert.ok(!U.K.registry.has(kid), 'mod closed with its host');
  });
  it('a mod can host mods of its own (Wub Osc → Wub Filter → Destroyer), and the wub still sounds', async () => {
    const U = TH.universe(1), o = TH.spawn(U, 'eravos.wub-osc'), f = Mods.childOf(o, Mods.add(o, 'tone', 'eravos.wub-filter'));
    const dz = Mods.childOf(f, Mods.add(f, 'after', 'eravos.fx-destroyer')); assert.ok(dz, 'nested'); const c = ctxOf(dz); if (c.ready) await c.ready;
    solo(U, o); TH.note(U, o, 45, 0.05, { duration: 0.8 });
    const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.2, 0.8)), -40, 'sounds');
  });
  it('Stop all, then a note for the host: its mods wake with it', async () => {
    const U = TH.universe(1.6), o = TH.spawn(U, 'eravos.wub-osc'), kid = Mods.childOf(o, Mods.add(o, 'tone', 'eravos.fx-destroyer')), c = ctxOf(kid); if (c.ready) await c.ready;
    solo(U, o); TH.note(U, o, 45, 0.05, { duration: 1.4 });
    U.ctx.suspend(0.4).then(() => { U.K.silence({ hard: true, reason: 'test' }); U.ctx.resume(); });
    U.ctx.suspend(0.8).then(() => { TH.note(U, o, 45, 0.82, { duration: 0.6 }); U.ctx.resume(); });   // played again AFTER the stop
    const b = await TH.render(U); assert.lt(TH.db(TH.rms(b, 0.5, 0.75)), -60, 'stopped'); assert.gt(TH.db(TH.rms(b, 1.0, 1.35)), -40, 'heard again after the stop, through its mod');
  });
  it('⇲ a window on the canvas moves inside: its settings come along, and what fed it now feeds what it fed', () => {
    const U = TH.universe(0.2), o = TH.spawn(U, 'eravos.wub-osc'), e = TH.spawn(U, 'eravos.fx-echo'), d = TH.spawn(U, 'eravos.fx-destroyer');
    const W = (a, ah, b, bh) => assert.ok(U.K.wires.register({ src: { instanceId: a, hookId: ah }, dst: { instanceId: b, hookId: bh } }).ok);
    W(o, 'wubo.hook.audio_out', e, 'fx.hook.audio_in'); W(e, 'fx.hook.audio_out', d, 'fx.hook.audio_in'); ctxOf(e).params.set('feedback', 0.61);
    assert.ok(Mods.movable(d, 'after').some(t => t.instanceId === e), 'offered');
    const u = Mods.absorb(d, 'after', e); assert.ok(u, 'moved');
    assert.ok(!U.K.registry.has(e), 'its window is gone'); assert.equal(ctxOf(Mods.childOf(d, u)).params.get('feedback'), 0.61, 'settings came along');
    assert.ok(U.K.wires.list().some(w => w.src.instanceId === o && w.dst.instanceId === d && !(w.meta && w.meta.insert)), 'Wub Osc now feeds the Destroyer directly');
  });
  it('⇱ a mod pops out to its own window, wired straight after its host (before what the host fed)', () => {
    const U = TH.universe(0.2), d = TH.spawn(U, 'eravos.fx-destroyer'), e = TH.spawn(U, 'eravos.fx-echo');
    U.K.wires.register({ src: { instanceId: d, hookId: 'fx.hook.audio_out' }, dst: { instanceId: e, hookId: 'fx.hook.audio_in' } });
    const u = Mods.add(d, 'after', 'eravos.wub-filter'); ctxOf(Mods.childOf(d, u)).params.set('cutoff', 444);
    const f = Mods.popOut(d, u); assert.ok(f && U.K.registry.has(f), 'a tool of its own'); assert.equal(Mods.list(d).length, 0, 'gone from the rack');
    assert.equal(ctxOf(f).params.get('cutoff'), 444, 'same settings');
    const plainW = U.K.wires.list().filter(w => !(w.meta && w.meta.insert));
    assert.ok(plainW.some(w => w.src.instanceId === d && w.dst.instanceId === f), 'host → it'); assert.ok(plainW.some(w => w.src.instanceId === f && w.dst.instanceId === e), 'it → what the host fed');
    assert.ok(!plainW.some(w => w.src.instanceId === d && w.dst.instanceId === e), 'no bypass left behind');
  });
  it('a mod that delays its sound (a Destroyer inside a Wub Filter) is waited for: at mix 0.5 the dry no longer arrives early', async () => {
    const U = TH.universe(0.5), f = TH.spawn(U, 'eravos.wub-filter'), c = ctxOf(f); c.params.setMany({ mix: 0.5, mode: 'lowpass', cutoff: 8000, range: 0, position: 1 }); if (c.ready) await c.ready;
    const kid = Mods.childOf(f, Mods.add(f, 'after', 'eravos.fx-destroyer')); const kc = ctxOf(kid); kc.params.setMany({ mix: 1, drive: 0 }); await kc.ready;
    const own = OrganismSDK.dsp.osLatency(U.ctx, '4x'), mod = U.K.audio.latencyOf(kid); assert.gt(mod, 0, 'the mod delays');
    assert.near(U.K.audio.latencyOf(f), own + mod, 1e-6, 'the host reports its own delay plus its mod’s');
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(f, 'out').node.connect(U.ctx.destination);
    // a tone burst (a lone 1-sample impulse does not survive these offline graphs, before this change too): the first sound out
    // must come after the host's AND the mod's delay — before 3.43 the blended dry came through after the host's alone
    const o = U.ctx.createOscillator(), g = U.ctx.createGain(); o.frequency.value = 440; g.gain.value = 0.3; o.connect(g); g.connect(U.K.audio.port(f, 'in').node); o.start(0.1); o.stop(0.2);
    const x = (await TH.render(U)).getChannelData(0), s0 = Math.round(0.1 * SR), want = Math.round((own + mod) * SR);
    let first = -1; for (let i = s0; i < s0 + 4000; i++) if (Math.abs(x[i]) > 1e-3) { first = i - s0; break; }
    assert.gt(first, want - 8, `first sound ${first} samples after the input; host + mod delay = ${want}`); assert.gt(TH.db(TH.rms({ getChannelData: () => x, sampleRate: SR, duration: 0.5 }, 0.12, 0.2)), -40, 'and it is heard');
  });
  it('adding a mod is one undo step on the host; undo takes the mod out again', async () => {
    const U = TH.universe(0.2), Hs = History.create(U.K), h = TH.spawn(U, 'eravos.wub-filter');
    await TH.sleep(30); Mods.add(h, 'after', 'eravos.fx-destroyer'); await TH.sleep(520);
    assert.equal(Mods.list(h).length, 1); assert.ok(Hs.state().canUndo, 'undoable');
    Hs.undo(); await TH.sleep(30); assert.equal(Mods.list(h).length, 0, 'undone'); assert.equal(U.K.wires.list().filter(w => w.meta && w.meta.insert).length, 0, 'unwired');
    Hs.dispose && Hs.dispose();
  });
});

describe('P44 · links — small tools grow when they meet', () => {
  it('wiring Wub Osc → Wub Filter: both see the link, with direction, and the rule names the face to show', () => {
    const U = TH.universe(0.2), o = TH.spawn(U, 'eravos.wub-osc'), f = TH.spawn(U, 'eravos.wub-filter'), seen = [];
    OrganismFactory.handle(f).ctx.onLinks(l => seen.push(l.length));
    const w = U.K.wires.register({ src: { instanceId: o, hookId: 'wubo.hook.audio_out' }, dst: { instanceId: f, hookId: 'fx.hook.audio_in' } }); assert.ok(w.ok);
    const lf = OrganismFactory.handle(f).ctx.links(), lo = OrganismFactory.handle(o).ctx.links();
    assert.equal(lf.length, 1); assert.equal(lf[0].dir, 'in'); assert.equal(lf[0].organism, 'eravos.wub-osc'); assert.equal(lo[0].dir, 'out');
    assert.deepEqual(seen, [0, 1], 'onLinks fires on connect');
    const fd = OrganismFactory.def('eravos.wub-filter'), rule = fd.links.find(r => Links.matches(r, lf[0]));
    assert.ok(rule, 'a rule matches'); assert.deepEqual(Links.faceKeys(OrganismFactory.def('eravos.wub-osc'), rule), rule.face);
    U.K.wires.remove(w.wire_id); assert.equal(seen[seen.length - 1], 0, 'and on disconnect');
  });
  it('a tool with no face declared still shows its first knobs (never mix / in / out / bypass)', () => {
    const keys = Links.faceKeys(OrganismFactory.def('eravos.fx-echo'));
    assert.gt(keys.length, 0); ['mix', 'inGain', 'outGain', 'bypass', 'mods'].forEach(k => assert.ok(!keys.includes(k), k));
  });
  it('every tool the ＋ mod picker offers passes the sound through (none silences the host) — 3.48.1', async () => {
    const ctxOf = (id) => OrganismFactory.handle(id).ctx;
    const solo = (U, inst) => { U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(inst, 'out').node.connect(U.ctx.destination); };
    const feedSaw = (U, inst, hz, from, to) => { const o = U.ctx.createOscillator(), g = U.ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = hz; g.gain.value = 0.3; o.connect(g); g.connect(U.K.audio.port(inst, 'in').node); o.start(from); o.stop(to); };
    const U0 = TH.universe(0.1), h0 = TH.spawn(U0, 'eravos.fx-destroyer'), list = Mods.compatible(h0, 'after').map(t => t.id);
    assert.ok(!list.includes('eravos.clip-maker'), 'Clip Maker records and plays clips — it is not a mod');
    const silent = [];
    for (const m of list) {
      const U = TH.universe(0.8), d = TH.spawn(U, 'eravos.fx-destroyer'), c = ctxOf(d); if (c.ready) await c.ready;
      const kid = Mods.childOf(d, Mods.add(d, 'after', m)), k = kid && ctxOf(kid); if (k && k.ready) await k.ready;
      solo(U, d); feedSaw(U, d, 110, 0.02, 0.75);
      const db = TH.db(TH.rms(await TH.render(U), 0.3, 0.7)); if (!kid || db < -50) silent.push(`${m} ${db.toFixed(1)} dB`);
    }
    assert.equal(silent.length, 0, 'silenced the host: ' + silent.join(', '));
  });
});
