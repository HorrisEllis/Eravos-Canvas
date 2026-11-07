/* P149 — a note's pitch curve reaches the sound (his words, 2026-11-07: "when i connect the edges it plays flat. but not when i leave
 * them alone. like its not acknowledging the curve."). Connect edges, Sketch and a note's Bend send one note with a curve; the SDK's
 * pitch wheel bent only the oscillators a tool creates — a tool that makes its sound in an AudioWorklet (Retro DCO, Swarm) heard
 * nothing and played the first pitch. Each pitched instrument plays one note that glides up an octave; late in the note the pitch must
 * be near double. */
window.__phase = 'P149';
describe('P149 a note\'s curve bends every pitched instrument (Connect edges, Sketch, Bend)', () => {
  const pitchAt = (d, sr, t0, t1) => AudioMeasure.pitch(d, sr, t0, t1, { fmin: 60, fmax: 700 }).hz;
  async function glide(id, path) {
    const sr = 22050, ctx = new OfflineAudioContext(1, sr * 2, sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn(id, { K, headless: true }), c = OrganismFactory.handle(a).ctx; if (c.internals && c.internals.ready) await c.internals.ready;
    K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    const bend = path ? { from: 0, to: 12, shape: 'path', at: 0, path: [[0, 0], [0.25, 0], [0.6, 12], [1, 12]] } : { from: 0, to: 12, shape: 'early', at: 0.3 };
    K.bus.publish('note:trigger', { target: a, note: 45, velocity: 0.9, time: 0.05, duration: 1.8, bend });
    const d = (await ctx.startRendering()).getChannelData(0);
    return { start: pitchAt(d, sr, 0.12, 0.4), end: pitchAt(d, sr, 1.4, 1.65) };
  }
  for (const id of ['eravos.retro-dco', 'eravos.swarm-oscillator', 'eravos.retro-poly', 'eravos.supersaw', 'eravos.pad-forge']) {
    it(id + ': a Connect-edges path (and a plain Bend) glides up the octave', async () => {
      if (!OrganismFactory.def(id)) return;
      const p = await glide(id, true), r = p.end / p.start; assert.gt(r, 1.7, `path: ${p.start.toFixed(0)} Hz → ${p.end.toFixed(0)} Hz (×${r.toFixed(2)}, an octave is ×2)`);
      const b = await glide(id, false), rb = b.end / b.start; assert.gt(rb, 1.7, `bend: ${b.start.toFixed(0)} Hz → ${b.end.toFixed(0)} Hz (×${rb.toFixed(2)})`);
    });
  }
});
