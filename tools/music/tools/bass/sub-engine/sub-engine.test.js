/* Deep Sub (eravos.sub-engine) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.sub-engine');

// 3.53 — "the lead in the timeline isn't working fully. it keeps skipping notes": overlapping legato notes (the For Raven lead
// clip: notes 11–17 sixteenths long, a new one every 2–8) went silent from the first old note's end — that note's release
// stayed booked inside the next one. Every held sixteenth must sound.
window.__phase = 'P53';
describe('Sub Engine — legato never drops a held note', () => {
  it('overlapping notes: sound under every sixteenth a note is held', async () => {
    const notes = [[0, 17, 49], [8, 11, 61], [10, 15, 52], [16, 17, 52], [24, 11, 61], [26, 15, 56], [32, 17, 57], [40, 11, 69], [42, 15, 61], [48, 17, 59]];
    const bpm = 127, sd = 15 / bpm, sr = 22050, ctx = new OfflineAudioContext(1, Math.ceil((70 * sd + 1) * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm }).boot();
    const a = OrganismFactory.spawn('eravos.sub-engine', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries({ glide: 0.08 }).forEach(([k, v]) => c.params.set(k, v));
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    notes.forEach(([s, l, n]) => K.bus.publish('note:trigger', { target: a, note: n, velocity: 0.9, time: 0.1 + s * sd, duration: l * sd }));
    const d = (await ctx.startRendering()).getChannelData(0), silent = [];
    for (let s = 0; s < 65; s++) { const i0 = Math.floor((0.1 + s * sd) * sr), i1 = Math.floor((0.1 + (s + 1) * sd) * sr); let q = 0; for (let i = i0; i < i1; i++) q += d[i] * d[i]; if (10 * Math.log10(q / (i1 - i0) + 1e-12) < -50) silent.push(s); }
    assert.equal(silent.join(','), '', 'silent sixteenths while a note is held');
  });
});

describe('Deep Sub 1.1 · Keep in range (3.74c)', () => {
  const rig = (params) => { const U = TH.universe(1.2, { bpm: 120 }), id = TH.spawn(U, 'eravos.sub-engine'), c = OrganismFactory.handle(id).ctx; c.params.setMany(Object.assign({ phantom: 0, click: 0, drop: 0, drive: 0 }, params || {})); return { U, id, c }; };
  it('a note the songs write (A1, Octave −2 → 13.75 Hz, under the 24 Hz floor) is lifted to 55 Hz — heard, and not cut by the floor', async () => {
    const { U, id, c } = rig(); assert.near(c.subHz(33), 55, 0.01, 'two octaves up to 30–60 Hz');
    TH.note(U, id, 33, 0.05, { duration: 1.0 }); const b = await TH.render(U);
    assert.near(TH.zcFreq(b, 0.3, 1.0), 55, 2, 'the sub plays at 55 Hz'); assert.gt(TH.rms(b, 0.3, 1.0), 0.05, 'and it is loud, not filtered away');
  });
  it('a note already in range stays where Octave puts it; every lifted note lands at 30–60 Hz; the melody keeps its shape', () => {
    const { c } = rig(); assert.near(c.subHz(57), 55, 0.01, 'A3 −2 oct = 55 Hz: unchanged');
    for (let n = 24; n <= 60; n++) { const f = c.subHz(n); assert.ok(f >= 30 && f < 60.01 || f >= 60, n + ' → ' + f.toFixed(1)); }
    assert.ok(c.subHz(36) < c.subHz(38), 'a step up is still up');
  });
  it('off: exactly 1.0 — the note where Octave puts it (13.75 Hz)', () => {
    const { c } = rig({ keepRange: false }); assert.near(c.subHz(33), 13.75, 0.01);
  });
});
