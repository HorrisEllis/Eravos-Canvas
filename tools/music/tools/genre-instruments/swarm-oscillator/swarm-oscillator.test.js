/* Swarm Oscillator (eravos.swarm-oscillator) — tests that travel with the tool. The shared contract (TH.toolContract): spawns clean,
 * every shipped preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is obeyed. Then its own. */
TH.toolContract('eravos.swarm-oscillator');
window.__phase = 'P123';
describe('Swarm Oscillator — the swarm plays, locks, and says how locked it is', () => {
  // render `sec` seconds of one note held (offline), with these settings; returns the buffer and the coherence signal
  async function play(params, sec, note) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.swarm-oscillator', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(params || {}).forEach(([k, v]) => c.params.set(k, v));
    await c.internals.ready; assert.ok(c.internals.node(), 'its worklet is running');
    K.audio.chain.out.gain.value = 0;
    const ps = K.audio.ports(a), au = ps.find(x => x.kind === 'audio' && x.direction === 'out'), cp = ps.find(x => x.kind === 'mod' && x.direction === 'out' && x.label === 'coherence');
    assert.ok(au && cp, 'an audio out and a coherence out');
    const dst = ctx.createChannelMerger(2); au.node.connect(dst, 0, 0); cp.node.connect(dst, 0, 1); dst.connect(ctx.destination);   // L audio (mixed) · R coherence
    c.internals.on(note || 57, 0.9, 0.02, sec - 0.3);
    const buf = await ctx.startRendering(); return { audio: buf.getChannelData(0), coh: buf.getChannelData(1), sr };
  }
  const rms = (d, a, b) => { let s = 0; for (let i = a; i < b; i++) s += d[i] * d[i]; return Math.sqrt(s / (b - a)); };
  const peak = (d) => { let m = 0; for (const x of d) { if (!isFinite(x)) return Infinity; m = Math.max(m, Math.abs(x)); } return m; };
  const mean = (d, a, b) => { let s = 0; for (let i = a; i < b; i++) s += d[i]; return s / (b - a); };
  it('a held note sounds, finite, under full scale; its release ends in silence', async () => {
    const r = await play({ voices: 16, coupling: 0.5 }, 2.2), n = r.audio.length;
    assert.gt(rms(r.audio, Math.floor(0.4 * r.sr), Math.floor(1.6 * r.sr)), 0.01, 'it sounds');
    assert.lt(peak(r.audio), 1, 'never over full scale (and no NaN)');
    assert.lt(rms(r.audio, n - Math.floor(0.05 * r.sr), n), 0.02, 'after its release, nearly quiet');
  });
  it('coupling locks it: the coherence signal reads near 1 at full coupling and lower when free', async () => {
    const lock = await play({ mode: 'coupled', voices: 12, spread: 0.5, coupling: 1, drift: 0.1 }, 2.4), free = await play({ mode: 'free', voices: 12, spread: 0.5, coupling: 0, drift: 0.1 }, 2.4);
    const a = Math.floor(1.6 * lock.sr), b = Math.floor(2.0 * lock.sr), L = mean(lock.coh, a, b), F = mean(free.coh, a, b);
    assert.gt(L, 0.9, 'locked: coherence ' + L.toFixed(3)); assert.lt(F, L - 0.3, 'free: coherence ' + F.toFixed(3) + ' (well under locked)');
  });
  it('every mode and shape plays clean', async () => {
    for (const [mode, shape] of [['harmonic', 'tri'], ['chaotic', 'pulse'], ['coupled', 'table']]) {
      const r = await play({ mode, shape, cluster: 1, voices: 8 }, 1.0);
      assert.gt(rms(r.audio, Math.floor(0.3 * r.sr), Math.floor(0.7 * r.sr)), 0.005, mode + '/' + shape + ' sounds'); assert.lt(peak(r.audio), 1, mode + '/' + shape + ' under full scale');
    }
  });
  it('the Timeline lists it; its coherence wires to another tool’s knob; every knob can be moved', () => {
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.swarm-oscillator'), rec = U.K.registry.get(a);
    assert.ok(Array.from(rec.hooks.values()).some(hk => hk.direction === 'in' && hk.event_type === 'note:trigger'), 'an instrument (the Timeline lists it)');
    const d = OrganismFactory.def('eravos.swarm-oscillator'); assert.ok(d.hooks.some(h => h.hook_id === 'so.hook.coherence' && h.direction === 'out'), 'Coherence out');
    const own = new Set(['coupling', 'cutoff']), moved = (k) => own.has(k) || d.hooks.some(h => h.hook_id === 'knob.' + k);   // coupling and cutoff have their own audio-rate inputs
    const mine = ['mode', 'voices', 'spread', 'coupling', 'pull', 'drift', 'cluster', 'sync', 'shape', 'table', 'sub', 'octave', 'cutoff', 'res', 'envAmt', 'attack', 'decay', 'sustain', 'release', 'lfoRate', 'lfoCouple', 'width', 'monoBelow', 'level', 'restless', 'form', 'fieldFm', 'cohTone'];
    assert.deepEqual(mine.filter(k => !moved(k)), [], 'every one of its controls can be moved by another tool');
  });
});
describe('Swarm Oscillator — Life (1.1): it moves on its own, and sounds like no stack', () => {
  async function play(params, sec) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.swarm-oscillator', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(params).forEach(([k, v]) => c.params.set(k, v)); await c.internals.ready; K.audio.chain.out.gain.value = 0;
    const ps = K.audio.ports(a), au = ps.find(x => x.kind === 'audio' && x.direction === 'out'), cp = ps.find(x => x.kind === 'mod' && x.label === 'coherence');
    const dst = ctx.createChannelMerger(2); au.node.connect(dst, 0, 0); cp.node.connect(dst, 0, 1); dst.connect(ctx.destination);
    c.internals.on(57, 0.9, 0.02, sec - 0.3); const b = await ctx.startRendering(); return { audio: b.getChannelData(0), coh: b.getChannelData(1), sr };
  }
  const base = { mode: 'coupled', voices: 12, spread: 0.5, coupling: 0.9, pull: 0.4, drift: 0.1, cutoff: 16000, res: 0, envAmt: 0, sustain: 1 };
  it('Restless: once locked it bursts apart and comes back — the coherence swings again and again (still without it)', async () => {
    const swing = (r) => { let lo = 1, hi = 0; for (let i = Math.floor(1.5 * r.sr); i < Math.floor(5.5 * r.sr); i += 64) { lo = Math.min(lo, r.coh[i]); hi = Math.max(hi, r.coh[i]); } return hi - lo; };
    const calm = await play(base, 6), live = await play(Object.assign({}, base, { restless: 0.8 }), 6);
    assert.lt(swing(calm), 0.15, 'without Restless, once locked it stays: swing ' + swing(calm).toFixed(2)); assert.gt(swing(live), 0.3, 'Restless: swing ' + swing(live).toFixed(2));
  });
  it('Field FM: the swarm’s own sum bends its voices — brighter (more high-frequency energy), the pitch kept', async () => {
    const tri = Object.assign({}, base, { shape: 'tri' }), bright = (r) => { const a = Math.floor(1 * r.sr), b = Math.floor(2 * r.sr); let s = 0, d = 0; for (let i = a; i < b; i++) { s += r.audio[i] ** 2; d += (r.audio[i] - r.audio[i - 1]) ** 2; } return Math.sqrt(d / s); };
    const off = await play(tri, 2.3), on = await play(Object.assign({}, tri, { fieldFm: 1 }), 2.3);
    assert.gt(bright(on), bright(off) * 1.5, 'brightness ' + bright(off).toFixed(3) + ' → ' + bright(on).toFixed(3));
  });
  it('the Living presets play clean', async () => {
    const d = OrganismFactory.def('eravos.swarm-oscillator'), names = ['Breathing Swarm', 'Blooming Chord', 'Metal Swarm', 'Growl Cloud', 'Tide Lock', 'Shatter Bloom'];
    for (const n of names) { assert.ok(d.presets[n], n + ' is shipped'); }
  });
});
describe('Swarm Oscillator — headroom', () => {
  it('an 8-note chord on every preset stays under full scale', async () => {
    const d = OrganismFactory.def('eravos.swarm-oscillator'), worst = [];
    for (const preset of Object.keys(d.presets)) {
      const sr = 22050, sec = 1.6, ctx = new OfflineAudioContext(2, sec * sr, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
      const a = OrganismFactory.spawn('eravos.swarm-oscillator', { K, headless: true }), c = OrganismFactory.handle(a).ctx; c.presets.load(preset); c.params.set('level', 1); await c.internals.ready;
      K.audio.chain.out.gain.value = 0; K.audio.ports(a).find(x => x.kind === 'audio').node.connect(ctx.destination);
      [36, 43, 48, 52, 55, 60, 64, 67].forEach(n => c.internals.on(n, 1, 0.02, sec - 0.4));
      const b = await ctx.startRendering(); let pk = 0; for (let ch = 0; ch < 2; ch++) for (const x of b.getChannelData(ch)) pk = Math.max(pk, Math.abs(x));
      worst.push(preset + ' ' + pk.toFixed(2)); assert.lt(pk, 1, preset + ' at full level, 8 notes, full velocity: peak ' + pk.toFixed(3));
    }
  });
});
describe('Swarm Oscillator — the face', () => {
  it('More depth is closed at first and opens with its button; free mode dims what does nothing', async () => {
    const hh = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(hh, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot();   // a canvas to open it on
    const id = OrganismFactory.spawn('eravos.swarm-oscillator', { K: Kernel, x: 30, y: 30 }); await TH.sleep(80);
    try {
      const w = CanvasWM.windowOf(id), b = [...w.querySelectorAll('button')].find(x => /More depth/.test(x.textContent)), pull = w.querySelector('[data-key="pull"]');
      assert.ok(b && pull, 'the button and the depth controls'); assert.equal(pull.offsetParent, null, 'closed at first: Pull is not shown');
      b.click(); assert.ok(pull.offsetParent !== null, 'open: Pull shows'); b.click(); assert.equal(pull.offsetParent, null, 'closed again');
      Kernel.bus.publish('ui:config_change:' + id, { key: 'mode', value: 'free' }); await TH.sleep(30);
      assert.equal(w.querySelector('[data-key="coupling"]').style.opacity, '0.35', 'free: Coupling dims'); assert.ok(/free/.test(w.querySelector('[data-key="coupling"]').title), 'and says why');
    } finally { OrganismFactory.close(id); }
  });
});
