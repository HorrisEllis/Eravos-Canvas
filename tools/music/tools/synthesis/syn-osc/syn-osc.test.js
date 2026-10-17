/* Morph Osc (eravos.syn-osc) — the shared contract, then its own: in pitch, morph, FM by wiring (with FOLLOW), ring */
TH.toolContract('eravos.syn-osc');
describe('tool · Morph Osc — small oscillator, wired into bigger sounds', () => {
  const SR = TH.SR;
  const solo = (U, inst) => { U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(inst, 'out').node.connect(U.ctx.destination); };
  const bright = (b, a, z) => { const d = b.getChannelData(0); let x = 0, dd = 0; for (let i = Math.floor(a * SR) + 1; i < z * SR; i++) { x += d[i] * d[i]; dd += (d[i] - d[i - 1]) ** 2; } return Math.sqrt(dd / Math.max(1e-12, x)); };
  async function play(params, note, wire) {
    const U = TH.universe(1), o = TH.spawn(U, 'eravos.syn-osc'), c = OrganismFactory.handle(o).ctx; c.params.setMany(Object.assign({ unison: 1 }, params || {}));
    if (wire) wire(U, o); solo(U, o); TH.note(U, o, note || 57, 0.05, { duration: 0.85 }); return TH.render(U);
  }
  it('plays A3 in tune on every bank', async () => {
    for (const bank of ['analog', 'vocal', 'digital', 'organ']) {
      const b = await play({ bank, morph: bank === 'analog' ? 0 : 0.5 }, 57); const hz = TH.acFreq(b, 0.3, 0.7, 60, 1000);
      assert.lt(Math.abs(1200 * Math.log2(hz / 220)), 15, `${bank}: ${hz.toFixed(1)} Hz`); assert.gt(TH.db(TH.rms(b, 0.3, 0.7)), -30, bank + ' heard');
    }
  });
  it('morph moves the sound from a sine to a bright saw, at about the same level', async () => {
    const a = await play({ morph: 0 }), z = await play({ morph: 0.4 });
    assert.gt(bright(z, 0.3, 0.7), bright(a, 0.3, 0.7) * 2, 'brighter'); assert.lt(Math.abs(TH.db(TH.rms(a, 0.3, 0.7)) - TH.db(TH.rms(z, 0.3, 0.7))), 3, 'level held');
  });
  it('FM by wiring: a second Morph Osc into FM in follows the notes on its own and makes the carrier brighter', async () => {
    const plain = await play({ morph: 0 });
    let mod = null;
    const fm = await play({ morph: 0, fmIndex: 3 }, 57, (U, o) => {
      mod = TH.spawn(U, 'eravos.syn-osc'); OrganismFactory.handle(mod).ctx.params.setMany({ morph: 0, ratio: '2', unison: 1, level: 1, sustain: 1 });   // Level 1 = exactly the carrier's FM index
      const w = U.K.wires.register({ src: { instanceId: mod, hookId: 'mosc.hook.audio_out' }, dst: { instanceId: o, hookId: 'mosc.hook.fm_in' } }); assert.ok(w.ok, 'wired');
    });
    assert.gt(bright(fm, 0.3, 0.7), bright(plain, 0.3, 0.7) * 2, 'sidebands');
    const noFollow = await play({ morph: 0, fmIndex: 3 }, 57, (U, o) => {
      const m2 = TH.spawn(U, 'eravos.syn-osc'); OrganismFactory.handle(m2).ctx.params.setMany({ morph: 0, ratio: '2', unison: 1, level: 1, sustain: 1, follow: false });
      U.K.wires.register({ src: { instanceId: m2, hookId: 'mosc.hook.audio_out' }, dst: { instanceId: o, hookId: 'mosc.hook.fm_in' } });
    });
    assert.lt(Math.abs(bright(noFollow, 0.3, 0.7) / bright(plain, 0.3, 0.7) - 1), 0.05, 'Follow off: the modulator gets no notes, so no FM');
    const hz = TH.acFreq(fm, 0.3, 0.7, 60, 1000);
    assert.lt(Math.abs(1200 * Math.log2(hz / 220)), 25, `still on the note: ${hz.toFixed(1)}`);
  });
  it('ring in multiplies: a silent ring input silences it, an open one lets it through', async () => {
    const quiet = await play({ ring: 1 }, 57, (U, o) => { const z = TH.spawn(U, 'eravos.fx-echo'); OrganismFactory.handle(z).ctx.params.set('mix', 1); U.K.wires.register({ src: { instanceId: z, hookId: 'fx.hook.audio_out' }, dst: { instanceId: o, hookId: 'mosc.hook.ring_in' } }); });
    assert.lt(TH.db(TH.rms(quiet, 0.3, 0.7)), -50, 'nothing in the ring input → nothing out');
    const half = await play({ ring: 0.5 }, 57, (U, o) => { const z = TH.spawn(U, 'eravos.fx-echo'); U.K.wires.register({ src: { instanceId: z, hookId: 'fx.hook.audio_out' }, dst: { instanceId: o, hookId: 'mosc.hook.ring_in' } }); });
    assert.gt(TH.db(TH.rms(half, 0.3, 0.7)), -30, 'ring 0.5 keeps half of it');
  });
});
