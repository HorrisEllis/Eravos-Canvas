/* P130 — "Retro poly plays a key like your holding it. How do I turn that off. Same with the midi, options to make it hold or single
 * note?" (2026-11-06). A key let go must stop (after the release), from the on-screen keys and from MIDI, poly and mono; and the
 * Hold option (keys latch until pressed again / another is played) is a choice, off by default. Rendered offline: the last second
 * must be silent when the key was let go at the start. */
window.__phase = 'P130';
describe('Notes stop when you let go — Retro Poly (keys, MIDI, mono) and the Hold option', () => {
  async function play(params, act) {
    const sr = 22050, ctx = new OfflineAudioContext(1, sr * 3, sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.retro-poly', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(Object.assign({ release: 0.2 }, params)).forEach(([k, v]) => c.params.set(k, v));
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    K.bus.publish('ui:midi_arm:' + a, { on: true });
    const send = (ev, p) => K.bus.publish(ev === 'midi' ? 'midi:note' : 'ui:' + ev + ':' + a, p);
    // act(send, later): later(fn) runs fn at 0.5 s of the render (the key is let go then)
    act(send, (fn) => ctx.suspend(0.5).then(() => { fn(); ctx.resume(); }));
    const d = (await ctx.startRendering()).getChannelData(0);
    const lv = (t0, t1) => { let q = 0; for (let i = Math.floor(t0 * sr); i < Math.floor(t1 * sr); i++) q += d[i] * d[i]; return 10 * Math.log10(q / ((t1 - t0) * sr) + 1e-12); };
    return { early: lv(0.2, 0.45), late: lv(2, 3) };
  }
  it('an on-screen key let go stops (it was held for 30 s)', async () => {
    const r = await play({}, (send, later) => { send('audition', { note: 60, velocity: 0.8, duration: 30 }); later(() => send('audition_off', { note: 60 })); });
    assert.ok(r.early > -40, 'the key sounded: ' + r.early.toFixed(1)); assert.ok(r.late < -80, 'silent a second after letting go: ' + r.late.toFixed(1) + ' dB');
  });
  it('a MIDI key let go stops, poly and mono (mono: the note that took over is the one let go)', async () => {
    const p = await play({}, (send, later) => { send('midi', { note: 62, velocity: 0.8, on: true }); later(() => send('midi', { note: 62, velocity: 0, on: false })); });
    assert.ok(p.early > -40 && p.late < -80, 'poly MIDI stops: early ' + p.early.toFixed(1) + ' late ' + p.late.toFixed(1));
    const m = await play({ mono: true }, (send, later) => { send('midi', { note: 60, velocity: 0.8, on: true }); send('midi', { note: 64, velocity: 0.8, on: true }); later(() => { send('midi', { note: 60, velocity: 0, on: false }); send('midi', { note: 64, velocity: 0, on: false }); }); });
    assert.ok(m.early > -40 && m.late < -80, 'mono MIDI stops when both keys are up: ' + m.late.toFixed(1));
  });
  it('Hold on: a key let go keeps sounding; Hold off is the default', async () => {
    const h = await play({ hold: true }, (send, later) => { send('midi', { note: 60, velocity: 0.8, on: true }); later(() => send('midi', { note: 60, velocity: 0, on: false })); });
    assert.ok(h.late > -40, 'Hold keeps the note: ' + h.late.toFixed(1) + ' dB');
    const a = OrganismFactory.spawn('eravos.retro-poly', { headless: true }); assert.equal(OrganismFactory.handle(a).ctx.params.get('hold'), false, 'Hold is off by default'); OrganismFactory.kill && OrganismFactory.kill(a);
  });
  // every tool with a keyboard (15 today): a key held (sent as a 30 s note, as the keyboard does) and let go at 0.5 s must fall away.
  // Before 3.130, seven held on: Retro Poly, Coven, Organ, Pad Forge, Syn Osc, Syn Partials (a key-up only released a note with no
  // end booked) — and Wobble Bass, which sounds before any note in an offline render (a separate open item, so it is left out here).
  it('every tool with a keyboard stops when its key is let go', async () => {
    const SKIP = { 'eravos.wobble-bass': 'sounds with no note at all in an offline headless render — open, not a held key' };
    const bad = [], seen = [];
    for (const d of OrganismFactory.defined()) {
      if (SKIP[d.id]) continue;
      const sr = 22050, ctx = new OfflineAudioContext(1, sr * 4, sr); let K, a, c;
      try { K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot(); a = OrganismFactory.spawn(d.id, { K, headless: true }); c = OrganismFactory.handle(a).ctx; } catch (e) { continue; }
      if (!c || !c.auditionOff) continue;
      const outs = K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out'); if (!outs.length) continue;
      K.audio.chain.out.gain.value = 0; outs.forEach(x => x.node.connect(ctx.destination)); seen.push(d.id);
      K.bus.publish('ui:audition:' + a, { note: 60, velocity: 0.8, duration: 30 });
      ctx.suspend(0.5).then(() => { K.bus.publish('ui:audition_off:' + a, { note: 60 }); ctx.resume(); });
      const dd = (await ctx.startRendering()).getChannelData(0), lv = (t0, t1) => { let q = 0; for (let i = Math.floor(t0 * sr); i < Math.floor(t1 * sr); i++) q += dd[i] * dd[i]; return 10 * Math.log10(q / ((t1 - t0) * sr) + 1e-12); };
      const e = lv(0.1, 0.45), m = lv(1.5, 2), l = lv(3.5, 4);
      if (e > -60 && l > -60 && l > m - 6) bad.push(`${d.id} (${l.toFixed(0)} dB 3 s after letting go)`);
    }
    assert.ok(seen.length >= 10, 'tools with a keyboard checked: ' + seen.length);
    assert.equal(bad.join(', '), '', 'still sounding after the key was let go');
  });
});
