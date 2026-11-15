/* Reese Bass (eravos.reese-bass) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.reese-bass');

describe('tool · Reese Bass — Octave + Pitch (3.50)', () => {
  const root = async (params) => {
    const U = TH.universe(1.2), id = TH.spawn(U, 'eravos.reese-bass'), c = OrganismFactory.handle(id).ctx;
    Object.entries(Object.assign({ voices: 2, detune: 0, sub: 0, combMix: 0, dist: 0, drift: 0, cutoff: 3000, envAmt: 0 }, params)).forEach(([k, v]) => c.params.set(k, v));
    TH.note(U, id, 57, 0.05, { duration: 1 });
    const b = await TH.render(U), want = 110 * Math.pow(2, ((params && params.octave) || 0) + ((params && params.transpose) || 0) / 12);
    return TH.acFreq(b, 0.35, 0.95, want * 0.75, want * 1.33);   // narrow window: the detector must not lock onto a sub-harmonic
  };
  it('defaults are unchanged (a note plays an octave under the key: A3 → 110 Hz); Octave −1 and Pitch −12 both halve it', async () => {
    const base = await root({});
    assert.near(base, 110, 3, 'default');
    assert.near(await root({ octave: -1 }), base / 2, 3, 'Octave −1');
    assert.near(await root({ transpose: -12 }), base / 2, 3, 'Pitch −12 st');
  });
});

describe('tool · Reese Bass — deep bass (3.51)', () => {
  // magnitude of one frequency (a single-bin DFT over 0.6 s from 0.35 s) — uses the buffer's own sample rate
  const mag = (b, hz) => { const d = b.getChannelData(0), sr = b.sampleRate, a = Math.floor(0.35 * sr), n = Math.floor(0.6 * sr); let re = 0, im = 0;
    for (let i = 0; i < n; i++) { const ph = 2 * Math.PI * hz * i / sr; re += d[a + i] * Math.cos(ph); im += d[a + i] * Math.sin(ph); } return Math.hypot(re, im) / n; };
  const render = async (params) => {
    const U = TH.universe(1.2), id = TH.spawn(U, 'eravos.reese-bass'), c = OrganismFactory.handle(id).ctx;
    Object.entries(Object.assign({ voices: 2, detune: 0, combMix: 0, dist: 0, drift: 0, cutoff: 60, res: 0.5, envAmt: 0, sub: 0.8, subOct: '-1', subWarm: 0 }, params)).forEach(([k, v]) => c.params.set(k, v));
    TH.note(U, id, 57, 0.05, { duration: 1.1 });   // stack A2 110 Hz, sub 55 Hz (Sub oct −1)
    return await TH.render(U);
  };
  it('Sub oct −2 moves the sub down an octave (55 Hz → 27.5 Hz); the default is unchanged (−1 = 55 Hz)', async () => {
    const one = await render({ subOct: '-1' }), two = await render({ subOct: '-2', keepRange: false });   // 3.77: Sub oct itself (Keep in range would lift 27.5 Hz)
    assert.gt(mag(one, 55), mag(one, 27.5) * 5, 'default: the sub is at 55 Hz');
    assert.gt(mag(two, 27.5), mag(two, 55) * 5, 'Sub oct −2: the sub is at 27.5 Hz');
  });
  it('Sub harmonics adds a 3rd overtone (165 Hz over a 55 Hz sub) that is not there with it off', async () => {
    const off = mag(await render({ subWarm: 0 }), 165), on = mag(await render({ subWarm: 1 }), 165);
    assert.gt(on, off * 5 + 1e-4, `165 Hz ${off.toExponential(2)} → ${on.toExponential(2)}`);
  });
  it('Deep Reese and Sub Floor Reese load and sound', async () => {
    for (const name of ['Deep Reese', 'Sub Floor Reese']) {
      const U = TH.universe(1), id = TH.spawn(U, 'eravos.reese-bass'), c = OrganismFactory.handle(id).ctx; c.presets.load(name);
      TH.note(U, id, 57, 0.05, { duration: 0.8 }); assert.gt(TH.rms(await TH.render(U), 0.3, 0.8), 0.005, name + ' sounds');
    }
  });
});

describe('tool · Reese Bass 2.1 — Deep Sub inside the Reese (RD1)', () => {
  const mag = (b, hz, from, len) => { const d = b.getChannelData(0), sr = b.sampleRate, a = Math.floor((from || 0.35) * sr), n = Math.floor((len || 0.6) * sr); let re = 0, im = 0;
    for (let i = 0; i < n; i++) { const ph = 2 * Math.PI * hz * i / sr; re += d[a + i] * Math.cos(ph); im += d[a + i] * Math.sin(ph); } return Math.hypot(re, im) / n; };
  // the stack shut (cutoff 30, no comb, no drive) so what is heard is the sub
  const render = async (params, secs) => {
    const U = TH.universe(secs || 1.2), id = TH.spawn(U, 'eravos.reese-bass'), c = OrganismFactory.handle(id).ctx;
    Object.entries(Object.assign({ voices: 2, detune: 0, combMix: 0, dist: 0, drift: 0, cutoff: 30, res: 0.5, envAmt: 0, sub: 0.8, subOct: '-1', subWarm: 0 }, params)).forEach(([k, v]) => c.params.set(k, v));
    TH.note(U, id, 57, 0.05, { duration: (secs || 1.2) - 0.1 });   // sub 55 Hz
    return { b: await TH.render(U), c };
  };
  it('defaults are today’s sub: sine at exactly 1, triangle and square at exactly 0, held, no floor', async () => {
    const { c } = await render({}); const I = c.internals;
    assert.equal(I.gS.gain.value, 1); assert.equal(I.gT.gain.value, 0); assert.equal(I.gQ.gain.value, 0);
    assert.equal(I.subEnv.gain.value, 1); assert.equal(I.flDry.gain.value, 1); assert.equal(I.flWet.gain.value, 0);
  });
  it('Sub shape 1 adds the 3rd harmonic (165 Hz) a sine does not have', async () => {
    const sine = (await render({})).b, sq = (await render({ subShape: 1 })).b;
    assert.gt(mag(sq, 165), mag(sine, 165) * 5 + 1e-4, `165 Hz ${mag(sine, 165).toExponential(2)} → ${mag(sq, 165).toExponential(2)}`);
  });
  it('Sub drop 12 st: the note starts an octave up (110 Hz) and lands on 55 Hz', async () => {
    const { b } = await render({ subDrop: 12, subDropTime: 0.3 });
    assert.gt(mag(b, 110, 0.06, 0.08), mag(b, 55, 0.06, 0.08), 'starts high');
    assert.gt(mag(b, 55, 0.6, 0.4), mag(b, 110, 0.6, 0.4) * 5, 'lands on the note');
  });
  it('Sub sustain 0.2: the sub falls away while the note is held', async () => {
    const held = (await render({})).b, fall = (await render({ subSustain: 0.2, subDecay: 0.2 })).b;
    assert.lt(TH.rms(fall, 0.8, 1.05), TH.rms(held, 0.8, 1.05) * 0.4, 'quieter late in the note');
  });
  it('Sub floor 45 Hz takes a 27.5 Hz sub down by more than 10 dB', async () => {
    const P = { subOct: '-2', keepRange: false }, off = (await render(P)).b, on = (await render(Object.assign({ subFloor: 45 }, P))).b;
    assert.gt(20 * Math.log10(mag(off, 27.5) / (mag(on, 27.5) + 1e-12)), 10);
  });
  it('Sub click puts a knock at the start of the note', async () => {
    const hi = (b) => { const d = b.getChannelData(0), sr = b.sampleRate, a = Math.floor(0.05 * sr); let e = 0; for (let i = a + 1; i < a + Math.floor(0.015 * sr); i++) e += (d[i] - d[i - 1]) ** 2; return e; };
    const off = (await render({})).b, on = (await render({ subClick: 1 })).b;
    assert.gt(hi(on), hi(off) * 4, 'more high energy in the first 15 ms');
  });
  it('the Deep Sub presets load and sound', async () => {
    for (const name of ['Deep Sub 808 Reese', 'Deep Sub Square Reese']) {
      const U = TH.universe(1), id = TH.spawn(U, 'eravos.reese-bass'), c = OrganismFactory.handle(id).ctx; c.presets.load(name);
      TH.note(U, id, 57, 0.05, { duration: 0.8 }); assert.gt(TH.rms(await TH.render(U), 0.3, 0.8), 0.005, name + ' sounds');
    }
  });
});
