/* Tape Memory (eravos.tape-memory) — tests that travel with the tool. The contract is shared (tests/harness.js TH.toolContract):
 * spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is
 * obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.tape-memory');

// 3.135 the tape, measured (his words: "i also want to be able to make lofi" · "yes" to Tape Memory)
describe('tool · Tape Memory — the tape, measured', () => {
  const CLEAN = { mode: 'reel', wear: 0, generation: 1, wow: 0, flutter: 0, stereoWow: 0, speed: 1, hiss: 0, crackle: 0, dropouts: 0, lowCut: 20, highCut: 18000, drive: 0, bits: 16, rate: 48000, mix: 1, stopped: false };
  async function render(secs, o, src) {
    const U = TH.universe(secs, { bpm: 120 }), fx = TH.spawn(U, 'eravos.tape-memory'), c = OrganismFactory.handle(fx).ctx; await c.ready;
    Object.entries(Object.assign({}, CLEAN, o)).forEach(([k, v]) => c.params.set(k, v));
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(fx, 'out').node.connect(U.ctx.destination);
    if (src !== false) { const s = U.ctx.createOscillator(); s.frequency.value = (src && src.freq) || 440; const g = U.ctx.createGain(); g.gain.value = (src && src.amp) || 0.5; s.connect(g); g.connect(U.K.audio.port(fx, 'in').node); s.start(0); }
    if (o && o._at) o._at(U, c);
    const b = await TH.render(U); return { b, c, U, ch: b.getChannelData(0) };
  }
  const rms = (a, s0, s1) => { let s = 0, n = 0; for (let j = s0; j < s1; j++) { s += a[j] * a[j]; n++; } return Math.sqrt(s / n); };
  // zero crossings per second in a window = the pitch the tape plays at
  const pitch = (a, s0, s1) => { let z = 0; for (let j = s0 + 1; j < s1; j++) if (a[j - 1] < 0 && a[j] >= 0) z++; return z / ((s1 - s0) / 48000); };
  it('clean (no wear, no dust, reel): the sound comes through 15 ms late, unchanged in pitch and level', async () => {
    const { ch } = await render(1.5, {}); const SR = 48000;
    assert.near(pitch(ch, SR * 0.5, SR * 1.5), 440, 2, 'pitch steady at 440'); assert.near(rms(ch, SR * 0.5, SR * 1.5), 0.5 / Math.SQRT2, 0.03, 'level kept');
    assert.ok(Math.abs(ch[Math.round(SR * 0.0149)]) < 1e-3 || rms(ch, 0, 700) < rms(ch, SR, SR + 700) * 0.6, 'nothing before the tape reaches the head (~15 ms)');
  });
  it('Wow makes the pitch wander; Speed 0.8 plays 20 % lower; silence in stays silence with no dust, Hiss and Crackle add their own', async () => {
    const SR = 48000, w = (await render(4, { wow: 1, wear: 1, wowRate: 1.5 })).ch; const ps = []; for (let k = 0; k < 14; k++) ps.push(pitch(w, SR * (0.6 + k * 0.25), SR * (0.85 + k * 0.25)));
    assert.gt(Math.max(...ps) - Math.min(...ps), 6, `wow: the pitch moves (${Math.min(...ps).toFixed(0)}…${Math.max(...ps).toFixed(0)} Hz)`);
    const sp = (await render(2, { speed: 0.8 })).ch; assert.near(pitch(sp, SR * 1.2, SR * 2), 352, 6, 'speed 0.8: 352 Hz (while the lag builds, the read head runs slow)');
    const quiet = (await render(1, {}, false)).ch; assert.lt(rms(quiet, SR * 0.4, SR), 1e-5, 'no input, no dust: silence (after the settings have glided in)');
    const hiss = (await render(1, { hiss: 1, wear: 0.5 }, false)).ch; assert.gt(rms(hiss, 2000, SR), 3e-3, 'hiss: noise of its own');
    const cr = (await render(2, { crackle: 1, wear: 1 }, false)).ch; let clicks = 0; for (let j = 1; j < cr.length; j++) if (Math.abs(cr[j]) > 0.02 && Math.abs(cr[j - 1]) <= 0.02) clicks++; assert.gt(clicks, 5, `crackle: clicks (${clicks})`);
  });
  it('Tape stop: the tape slows to a stop (no more tone); dropouts dip the sound and come out on their port', async () => {
    const SR = 48000, st = (await render(3, { stopTime: 0.5, _at: (U, c) => U.K.bus.publish('ui:config_change:' + c.id, { key: 'stopped', value: true }) })).ch;
    assert.lt(rms(st, SR * 1.5, SR * 3), rms(st, 0, SR * 0.2) * 0.1, 'stopped: the tone is gone');
    const { b, c, U } = await render(2, { dropouts: 1, wear: 1, dropLen: 0.05 }); const ch = b.getChannelData(0);
    let low = 0; for (let k = 0; k < 40; k++) { const r = rms(ch, SR * 0.2 + k * 2000, SR * 0.2 + k * 2000 + 1000); if (r < 0.1) low++; } assert.gt(low, 0, 'dropouts: moments where the sound falls away');
    assert.ok(U.K.audio.port(c.id, 'dropout'), 'a dropout output to wire');
  });
  it('every shipped preset plays under full scale, finite', async () => {
    for (const name of Object.keys(OrganismFactory.def('eravos.tape-memory').presets)) {
      const U = TH.universe(1), fx = TH.spawn(U, 'eravos.tape-memory'), c = OrganismFactory.handle(fx).ctx; await c.ready;
      U.K.bus.publish('ui:preset_load:' + fx, { name }); U.K.audio.chain.out.gain.value = 0; U.K.audio.port(fx, 'out').node.connect(U.ctx.destination);
      const s = U.ctx.createOscillator(), g = U.ctx.createGain(); g.gain.value = 0.7; s.connect(g); g.connect(U.K.audio.port(fx, 'in').node); s.start(0);
      const ch = (await TH.render(U)).getChannelData(0); let pk = 0; for (let j = 0; j < ch.length; j++) { assert.ok(Number.isFinite(ch[j]), name + ': finite'); pk = Math.max(pk, Math.abs(ch[j])); }
      assert.lt(pk, 1.0, `${name}: peak ${pk.toFixed(3)} under full scale`);
    }
  });
});
