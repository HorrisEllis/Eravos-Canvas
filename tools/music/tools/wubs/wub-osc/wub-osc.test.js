/* Wub Osc (eravos.wub-osc) — tests that travel with the tool: the shared contract, then its own. */
TH.toolContract('eravos.wub-osc');
describe('tool · Wub Osc — the raw tone', () => {
  const setup = (sec, params) => { const U = TH.universe(sec || 1.2), id = TH.spawn(U, 'eravos.wub-osc'), c = OrganismFactory.handle(id).ctx; Object.entries(params || {}).forEach(([k, v]) => c.params.set(k, v)); return { U, id, c }; };
  it('a note sounds at its pitch: A1 at octave 0 → 55 Hz; octave −1 halves A2 → 55 Hz', async () => {
    for (const [note, oct] of [[33, 0], [45, -1]]) {
      const { U, id } = setup(1, { wave: 'saw', voices: 1, octave: oct, dive: 0 });
      TH.note(U, id, note, 0.05, { duration: 0.8 });
      const buf = await TH.render(U);
      assert.near(TH.acFreq(buf, 0.3, 0.7, 30, 400), 55, 1.5, `note ${note} octave ${oct}`);
    }
  });
  it('a slide glides to the new pitch without a gap', async () => {
    const { U, id } = setup(1.2, { wave: 'saw', voices: 1, octave: 0, glide: 0.1 });
    TH.note(U, id, 33, 0.05, { duration: 0.5 }); TH.note(U, id, 45, 0.5, { duration: 0.5, slide: true });
    const buf = await TH.render(U);
    assert.gt(TH.rms(buf, 0.48, 0.56), TH.rms(buf, 0.3, 0.45) * 0.6, 'level held through the slide');
    assert.near(TH.acFreq(buf, 0.75, 0.95, 30, 400), 110, 2, 'landed an octave up');
  });
  it('unison voices spread in stereo; one voice is centred', async () => {
    const diff = async (voices) => {
      const { U, id } = setup(0.8, { wave: 'saw', voices, width: 1, spread: 20 });
      TH.note(U, id, 45, 0.05, { duration: 0.6 }); const b = await TH.render(U);
      const L = b.getChannelData(0), R = b.getChannelData(1), s = Math.floor(0.2 * b.sampleRate), e = Math.floor(0.6 * b.sampleRate); let d = 0, a = 0;
      for (let i = s; i < e; i++) { d += (L[i] - R[i]) ** 2; a += L[i] ** 2; } return Math.sqrt(d / a);
    };
    assert.lt(await diff(1), 0.01, 'one voice: L = R'); assert.gt(await diff(5), 0.2, 'five voices: L ≠ R');
  });
  it('fm: index 0 is a plain sine, a high index is far brighter', async () => {
    const zc = async (index) => {
      const { U, id } = setup(0.8, { wave: 'fm', voices: 1, ratio: '1', index, octave: 0 });
      TH.note(U, id, 45, 0.05, { duration: 0.6 }); const b = await TH.render(U), d = b.getChannelData(0);
      let n = 0; for (let i = Math.floor(0.2 * b.sampleRate); i < 0.6 * b.sampleRate; i++) if ((d[i - 1] < 0) !== (d[i] < 0)) n++; return n;
    };
    const plain = await zc(0), bright = await zc(6);
    assert.near(plain, 2 * 110 * 0.4, 12, 'sine: two crossings per cycle'); assert.gt(bright, plain * 1.8);
  });
  it('changing wave or voices rebuilds the stack cleanly (no faults, still sounds)', async () => {
    const { U, id, c } = setup(0.6), n0 = U.K.faults.list().length;
    ['reese', 'fm', 'hollow', 'square', 'saw'].forEach(w => c.params.set('wave', w)); c.params.set('voices', 7); c.params.set('voices', 2);
    assert.equal(c.internals.stack.length, 2); assert.equal(U.K.faults.list().length, n0, 'faults');
    TH.note(U, id, 45, 0.05, { duration: 0.4 }); assert.gt(TH.rms(await TH.render(U), 0.1, 0.4), 0.01);
  });
});

describe('tool · Wub Osc — Pitch (3.50)', () => {
  it('Pitch −12 st drops a note an octave; +7 st goes up a fifth; 0 is unchanged', async () => {
    for (const [tr, hz] of [[0, 110], [-12, 55], [7, 110 * Math.pow(2, 7 / 12)]]) {
      const U = TH.universe(1), id = TH.spawn(U, 'eravos.wub-osc'), c = OrganismFactory.handle(id).ctx;
      Object.entries({ wave: 'saw', voices: 1, octave: 0, dive: 0, transpose: tr }).forEach(([k, v]) => c.params.set(k, v));
      TH.note(U, id, 45, 0.05, { duration: 0.8 });
      assert.near(TH.acFreq(await TH.render(U), 0.3, 0.7, hz * 0.75, hz * 1.33), hz, hz * 0.03, `Pitch ${tr} st`);
    }
  });
});
