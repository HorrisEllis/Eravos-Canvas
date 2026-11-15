/* Piano (eravos.piano) — tests that travel with the tool. The shared contract (TH.toolContract): spawns clean, every shipped preset
 * loads in range, save → load is exact, closing leaves nothing behind, Stop all is obeyed. Then its own — the spec's acceptance:
 * A4's 12th partial sharp by 10–30 cents (a stiff string), the sympathetic strings ring with the pedal down (≥ −50 dB), a full chord
 * renders in budget; every key its own note; the pedal holds. */
TH.toolContract('eravos.piano');
window.__phase = 'P136';
describe('Piano — every model plays, in tune, stretched like a piano', () => {
  // render `sec` seconds of notes ([note, vel, at, dur]) with these settings (offline); returns L, R and the sample rate
  async function play(params, notes, sec, sr) {
    sr = sr || 48000; const ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.piano', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(params || {}).forEach(([k, v]) => c.params.set(k, v));
    await c.internals.ready; assert.ok(c.internals.node(), 'its worklet is running');
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).find(x => x.kind === 'audio' && x.direction === 'out').node.connect(ctx.destination);
    notes.forEach(([n, v, at, dur]) => c.internals.on(n, v, at, dur));
    const t0 = performance.now(), buf = await ctx.startRendering();
    return { L: buf.getChannelData(0), R: buf.getChannelData(1), sr, ms: performance.now() - t0, c };
  }
  const mono = (r) => r.L.map((x, i) => (x + r.R[i]) / 2);
  const rms = (d, a, b) => { let s = 0; for (let i = a; i < b; i++) s += d[i] * d[i]; return Math.sqrt(s / (b - a)); };
  const peak = (r) => { let m = 0; for (const d of [r.L, r.R]) for (const x of d) { if (!isFinite(x)) return Infinity; m = Math.max(m, Math.abs(x)); } return m; };
  const amp = (y, hz, sr, from, len) => { const w = 2 * Math.PI * hz / sr, cw = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let j = from; j < from + len; j++) { const s0 = y[j] + cw * s1 - s2; s2 = s1; s1 = s0; } return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - cw * s1 * s2)) * 2 / len; };
  const peakAt = (y, hz, sr, lo, hi, from, len) => { let best = -1, at = hz; for (let c = lo; c <= hi; c += 0.1) { const f = hz * Math.pow(2, c / 1200), a = amp(y, f, sr, from, len); if (a > best) { best = a; at = f; } } return 1200 * Math.log2(at / hz); };
  it('every model: a note sounds, finite, under full scale, and its release ends it', async () => {
    for (const model of ['tine', 'reed', 'felt', 'upright', 'honky', 'grand']) {
      const r = await play({ model }, [[57, 0.9, 0.02, 0.8]], 2.0, 22050), m = mono(r), n = m.length;
      assert.gt(rms(m, Math.floor(0.1 * r.sr), Math.floor(0.6 * r.sr)), 0.005, model + ' sounds');
      assert.lt(peak(r), 1, model + ' under full scale, no NaN');
      assert.lt(rms(m, n - Math.floor(0.1 * r.sr), n), rms(m, Math.floor(0.1 * r.sr), Math.floor(0.6 * r.sr)) * 0.01, model + ': let go, the damper stops it (−40 dB)');
    }
  });
  it('every key plays its own note: C2, A4 and C6 measured within 3 cents (grand and tine)', async () => {
    for (const model of ['grand', 'tine']) for (const note of [36, 69, 84]) {
      const r = await play({ model, decay: 10 }, [[note, 0.7, 0.01, 2]], 1.6), f = 440 * Math.pow(2, (note - 69) / 12), c = peakAt(mono(r), f, r.sr, -15, 15, Math.floor(0.3 * r.sr), Math.floor(1.2 * r.sr));
      assert.lt(Math.abs(c), 3, model + ' ' + note + ': ' + c.toFixed(2) + ' cents');
    }
  });
  it('a stiff string: A4’s 12th partial is 10–30 cents sharp (the grand, Stretch as it ships); Stretch 0 puts it back in tune', async () => {
    const at = async (inharm) => { const r = await play({ model: 'grand', inharm, hardness: 1, brightness: 1, decay: 10, detune: 0 }, [[69, 1, 0.01, 2.5]], 2.2);
      return peakAt(mono(r), 5280, r.sr, -10, 60, Math.floor(0.2 * r.sr), Math.floor(1.6 * r.sr)); };
    const s = await at(0.5), z = await at(0);
    assert.ok(s >= 10 && s <= 30, '12th partial ' + s.toFixed(1) + ' cents sharp'); assert.lt(Math.abs(z), 3, 'Stretch 0: ' + z.toFixed(1) + ' cents');
  });
  it('the pedal: a note let go rings on while it is down, and the sympathetic strings ring with it (≥ −50 dB)', async () => {
    const hold = async (pedal, sympathetic) => mono(await play({ model: 'grand', pedal, sympathetic, decay: 8, keyOff: 0, pedalNoise: 0 }, [[48, 0.9, 0.01, 0.2]], 1.8));
    const up = await hold(false, 0), down = await hold(true, 0), sym = await hold(true, 1), symUp = await hold(false, 1), sr = 48000, a = Math.floor(1.0 * sr), b = Math.floor(1.6 * sr);
    assert.gt(rms(down, a, b), rms(up, a, b) * 30, 'pedal down: still ringing a second later (' + (20 * Math.log10(rms(down, a, b) / rms(up, a, b))).toFixed(1) + ' dB over pedal up)');
    // what the sympathetic strings add = the same render with and without them (it is deterministic); at G4 (392 Hz, C3's 3rd partial)
    const diff = sym.map((x, i) => x - down[i]), diffUp = symUp.map((x, i) => x - up[i]), from = Math.floor(0.4 * sr), len = Math.floor(1.0 * sr);
    const fund = amp(down, 130.81, sr, from, len), s = 20 * Math.log10(amp(diff, 392, sr, from, len) / fund), su = 20 * Math.log10((amp(diffUp, 392, sr, from, len) + 1e-12) / fund);
    assert.gt(s, -50, 'sympathetic strings at G4: ' + s.toFixed(1) + ' dB against the note’s fundamental'); assert.lt(su, s - 15, 'pedal up, they are damped: ' + su.toFixed(1) + ' dB');
  });
  it('a 32-note chord (every voice) renders faster than real time, finite', async () => {
    const notes = Array.from({ length: 32 }, (_, i) => [33 + i * 2, 0.8, 0.01, 1.5]), r = await play({ model: 'grand', level: 0.4 }, notes, 2.0, 44100);
    assert.ok(r.L.every(Number.isFinite), 'finite'); assert.lt(r.ms, 2000, '2 s of 32 grand notes (96 strings + 24 sympathetic) in ' + r.ms.toFixed(0) + ' ms');
  });
  it('every control can be moved by another tool; the Timeline lists it', () => {
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.piano'), rec = U.K.registry.get(a), d = OrganismFactory.def('eravos.piano');
    assert.ok(Array.from(rec.hooks.values()).some(hk => hk.direction === 'in' && hk.event_type === 'note:trigger'), 'an instrument (the Timeline lists it)');
    const own = new Set(['brightness', 'trem']), moved = (k) => own.has(k) || d.hooks.some(h => h.hook_id === 'knob.' + k);
    assert.deepEqual(d.config.map(c => c.key).filter(k => !/^_|^tempo/.test(k) && !moved(k)), [], 'every one of its controls can be moved');
  });
});
describe('Piano — headroom', () => {
  it('an 8-note chord on every preset, full velocity, full level, stays under full scale', async () => {
    const d = OrganismFactory.def('eravos.piano');
    for (const preset of Object.keys(d.presets)) {
      const sr = 22050, sec = 1.6, ctx = new OfflineAudioContext(2, sec * sr, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
      const a = OrganismFactory.spawn('eravos.piano', { K, headless: true }), c = OrganismFactory.handle(a).ctx; c.presets.load(preset); c.params.set('level', 1); await c.internals.ready;
      K.audio.chain.out.gain.value = 0; K.audio.ports(a).find(x => x.kind === 'audio').node.connect(ctx.destination);
      [36, 43, 48, 52, 55, 60, 64, 67].forEach(n => c.internals.on(n, 1, 0.02, sec - 0.4));
      const b = await ctx.startRendering(); let pk = 0; for (let ch = 0; ch < 2; ch++) for (const x of b.getChannelData(ch)) pk = isFinite(x) ? Math.max(pk, Math.abs(x)) : Infinity;
      assert.lt(pk, 1, preset + ' at full level, 8 notes, full velocity: peak ' + pk.toFixed(3));
    }
  });
});
describe('Piano — the face', () => {
  it('More depth is closed at first and opens with its button; the grand dims what is the electric pianos’', async () => {
    const hh = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(hh, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot();
    const id = OrganismFactory.spawn('eravos.piano', { K: Kernel, x: 30, y: 30 }); await TH.sleep(80);
    try {
      const w = CanvasWM.windowOf(id), b = [...w.querySelectorAll('button')].find(x => /More depth/.test(x.textContent)), lid = w.querySelector('[data-key="lid"]');
      assert.ok(b && lid, 'the button and the depth controls'); assert.equal(lid.offsetParent, null, 'closed at first: Lid is not shown');
      b.click(); assert.ok(lid.offsetParent !== null, 'open: Lid shows'); b.click(); assert.equal(lid.offsetParent, null, 'closed again');
      Kernel.bus.publish('ui:config_change:' + id, { key: 'model', value: 'grand' }); await TH.sleep(30);
      const bell = w.querySelector('[data-key="bell"]'); assert.equal(bell.style.opacity, '0.35', 'grand: Bell dims'); assert.ok(/tine/.test(bell.title), 'and says why');
    } finally { OrganismFactory.close(id); }
  });
});
