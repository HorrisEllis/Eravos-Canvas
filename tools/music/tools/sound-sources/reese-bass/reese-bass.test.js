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
    const one = await render({ subOct: '-1' }), two = await render({ subOct: '-2' });
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
