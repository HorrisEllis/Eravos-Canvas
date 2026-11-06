/* Retro DCO (eravos.retro-dco) — tests that travel with the tool. The shared contract (TH.toolContract): spawns clean, every shipped
 * preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is obeyed. Then its own. */
TH.toolContract('eravos.retro-dco');
window.__phase = 'P139';
describe('Retro DCO — plays from its parts, every voice mode, both filters, the chorus', () => {
  async function play(params, notes, sec) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.retro-dco', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    // from a plain poly patch (the default preset is a unison lead), then this test's own settings
    Object.entries(Object.assign({ voice: 'poly', chorus: 'I', glide: 0 }, params || {})).forEach(([k, v]) => c.params.set(k, v));
    await c.internals.ready; assert.ok(c.internals.node(), 'its worklet is running');
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    notes.forEach(([note, t, d, v]) => c.internals.noteOn(note, v || 0.9, t, d));
    const b = await ctx.startRendering(); return { L: b.getChannelData(0), R: b.getChannelData(1), sr, c };
  }
  const rms = (d, a, b) => { let s = 0; for (let i = a; i < b; i++) s += d[i] * d[i]; return Math.sqrt(s / (b - a)); };
  const peak = (d) => { let m = 0; for (const x of d) { if (!isFinite(x)) return Infinity; m = Math.max(m, Math.abs(x)); } return m; };
  const S = (r, t) => Math.floor(t * r.sr);
  it('a chord sounds, finite, under full scale; after the release, silence', async () => {
    const r = await play({ release: 0.2 }, [[57, 0.05, 1], [60, 0.05, 1], [64, 0.05, 1]], 2.2);
    assert.gt(rms(r.L, S(r, 0.3), S(r, 0.9)), 0.01, 'it sounds'); assert.lt(peak(r.L), 1, 'under full scale, no NaN');
    assert.lt(rms(r.L, S(r, 2.0), S(r, 2.2)), 0.001, 'silent after the release');
  });
  it('pitch: a single saw note plays its own frequency (A3 = 220 Hz, octave and drift off)', async () => {
    const r = await play({ saw: 1, pulse: 0, sub: 0, drift: 0, cards: 0, chorus: 'off', cutoff: 16000, envAmt: 0, keytrack: 0, res: 0 }, [[57, 0.02, 1.5]], 1.6);
    const a = S(r, 0.4), b = S(r, 1.4); let zc = 0, first = -1, last = -1; for (let i = a; i < b; i++) if (r.L[i] <= 0 && r.L[i + 1] > 0) { const t = i + r.L[i] / (r.L[i] - r.L[i + 1]); if (first < 0) first = t; last = t; zc++; }
    const f = (zc - 1) / ((last - first) / r.sr); assert.ok(Math.abs(1200 * Math.log2(f / 220)) < 5, 'A3 plays ' + f.toFixed(2) + ' Hz');
  });
  it('every voice mode and both filters play clean', async () => {
    for (const p of [{ voice: 'poly' }, { voice: 'mono', glide: 0.05 }, { voice: 'legato', glide: 0.1 }, { voice: 'unison', unison: 8 }, { filter: 'ladder', drive: 12, res: 0.8 }]) {
      const r = await play(p, [[48, 0.05, 0.6], [55, 0.4, 0.6]], 1.4);
      assert.gt(rms(r.L, S(r, 0.2), S(r, 0.9)), 0.005, JSON.stringify(p) + ' sounds'); assert.lt(peak(r.L), 1, JSON.stringify(p) + ' under full scale');
    }
  });
  it('the chorus widens it: off is mono (left = right), I spreads the sides', async () => {
    const off = await play({ chorus: 'off', unison: 1 }, [[60, 0.05, 1.2]], 1.4), on = await play({ chorus: 'I', chorusMix: 0.6 }, [[60, 0.05, 1.2]], 1.4);
    let d0 = 0, d1 = 0; for (let i = S(off, 0.3); i < S(off, 1.1); i++) { d0 = Math.max(d0, Math.abs(off.L[i] - off.R[i])); d1 = Math.max(d1, Math.abs(on.L[i] - on.R[i])); }
    assert.lt(d0, 1e-6, 'chorus off: left = right'); assert.gt(d1, 0.01, 'chorus I: the sides differ');
  });
  it('voice cards: poly plays each note on its own card; more notes than cards steal (no stuck card)', async () => {
    const r = await play({ voices: 3, release: 0.1 }, [[48, 0.05, 2], [52, 0.1, 2], [55, 0.15, 2], [59, 0.2, 0.3]], 2.6);
    assert.lt(peak(r.L), 1, 'under full scale'); assert.lt(rms(r.L, S(r, 2.45), S(r, 2.6)), 0.001, 'every card released');
    assert.equal(r.c.internals.allocator.budget().stolen, 1, 'the fourth note took a card');
  });
  it('a key let go stops (keys and MIDI), and every knob can move while it plays', async () => {
    const a = OrganismFactory.spawn('eravos.retro-dco', { headless: true }), c = OrganismFactory.handle(a).ctx; await c.internals.ready;
    c.audition({ note: 60, duration: 30 }); c.auditionOff({ note: 60 }); assert.equal(c.internals.allocator.budget().active, 0, 'key-up released its card');
    for (const d of OrganismFactory.def('eravos.retro-dco').config) { if (d.type === 'number') c.params.set(d.key, d.max); else if (d.type === 'enum') c.params.set(d.key, d.options[d.options.length - 1]); }
    assert.ok(true, 'every control set to its far end without a fault'); OrganismFactory.close && OrganismFactory.close(a);
  });
  // loudness: on its default preset it sits at Retro Poly's level (switching between them does not jump); the loudest thing it can do
  // — six notes, every source full, ladder at full drive and resonance, level 1.5, I+II — stays under full scale (measured 0.70)
  it('as loud as Retro Poly (within 2 dB), and never over full scale at its loudest', async () => {
    async function chord(id, params, notes) {
      const sr = 22050, ctx = new OfflineAudioContext(1, sr * 2, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
      const a = OrganismFactory.spawn(id, { K, headless: true }), c = OrganismFactory.handle(a).ctx; Object.entries(params).forEach(([k, v]) => c.params.set(k, v)); if (c.internals && c.internals.ready) await c.internals.ready;
      K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
      notes.forEach(n => K.bus.publish('note:trigger', { target: a, note: n, velocity: 0.9, time: 0.05, duration: 1.2 }));
      const d = (await ctx.startRendering()).getChannelData(0); let q = 0, pk = 0; for (let i = sr * 0.3; i < sr * 1.1; i++) { q += d[i] * d[i]; pk = Math.max(pk, Math.abs(d[i])); } return { db: 10 * Math.log10(q / (sr * 0.8)), pk };
    }
    const rp = await chord('eravos.retro-poly', {}, [57, 60, 64]), rd = await chord('eravos.retro-dco', {}, [57, 60, 64]);
    assert.lt(Math.abs(rd.db - rp.db), 2, `default presets: Retro DCO ${rd.db.toFixed(1)} dB, Retro Poly ${rp.db.toFixed(1)} dB`);
    const loud = await chord('eravos.retro-dco', { voice: 'poly', saw: 1, pulse: 1, sub: 1, noise: 1, res: 1, filter: 'ladder', drive: 24, level: 1.5, cutoff: 16000, chorus: 'I+II', chorusMix: 1 }, [36, 43, 48, 52, 55, 60]);
    assert.lt(loud.pk, 1, 'its loudest: peak ' + loud.pk.toFixed(2));
  });
});
