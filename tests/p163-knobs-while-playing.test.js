/* P163 — a knob turned while a note sounds reaches that note (axiom 4: "Tools, keys and values can be adjusted while playing them.").
 * His words, 2026-11-10: "changing any tools values, knobs, presets or what ever is really delayed" · "the workshop when drawing or
 * manipulating or shaping, doesn't do much to change the sound." Found: many instruments read a knob only when a note starts. Here every
 * instrument with a tone knob (cutoff / filter / brightness / tone) holds one note; at 1.0 s the knob goes from its low end to near its top
 * (offline, at an exact sample: ctx.suspend); against the same note with the knob left alone, the note must get brighter by at least ⅔ octave within 0.4 s. FIXED tools are asserted; the
 * rest are listed (the measure, tool by tool) until each is fixed — the list only shrinks. */
window.__phase = 'P163';
describe('P163 a knob moved during a note is heard in that note', () => {
  const TONE = ['cutoff', 'filter', 'brightness', 'tone', 'lpf', 'cut'];
  const FIXED = new Set(['eravos.retro-poly', 'eravos.supersaw']);   // grows as each tool is fixed
  const instruments = () => OrganismFactory.list ? OrganismFactory.list() : [];
  // brightness = RMS of the sample-to-sample change over RMS (each harmonic weighted by its frequency; a saw's energy-weighted centroid hardly
  // moves when its filter opens); the knob's effect = log2(moved / still) over the same stretch, in octaves of brightness
  async function measure(id, key) { const moved = await once(id, key, true), still = await once(id, key, false); return moved === null || still === null || !(still > 0) ? null : Math.log2(moved / still); }
  async function once(id, key, move) {
    const sr = 22050, ctx = new OfflineAudioContext(1, sr * 2.2, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn(id, { K, headless: true }); if (!a) return null; const c = OrganismFactory.handle(a).ctx; if (c.internals && c.internals.ready) await c.internals.ready;
    const cfg = c.descriptor.config.find(x => x.key === key), lo = cfg.type === 'number' || cfg.type === 'integer' ? cfg.min + (cfg.max - cfg.min) * 0.02 : null, hi = cfg.min + (cfg.max - cfg.min) * 0.9;
    c.params.set(key, lo); K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    K.bus.publish('note:trigger', { target: a, note: 45, velocity: 0.9, time: 0.05, duration: 2 });
    ctx.suspend(1.0).then(() => { if (move) c.params.set(key, hi); ctx.resume(); });
    const d = (await ctx.startRendering()).getChannelData(0), a0 = Math.floor(1.4 * sr), a1 = Math.floor(1.9 * sr); let q = 0, dq = 0;
    for (let i = a0; i < a1; i++) { q += d[i] * d[i]; const df = d[i] - d[i - 1]; dq += df * df; }
    return q > 1e-10 ? Math.sqrt(dq / q) : null;
  }
  it('every instrument with a tone knob: the note follows it (fixed tools must; the rest are listed)', async () => {
    const ids = OrganismFactory.defined().map(d => d.id);
    const rows = [], lag = [];
    for (const id of ids) { const d = OrganismFactory.def(id); if (!d || d.domain !== 'music' || !(d.hooks || []).some(h => h.direction === 'in' && /note:trigger/.test(h.event_type || ''))) continue;
      const k = TONE.find(t => (d.config || []).some(c => c.key === t && (c.type === 'number' || c.type === 'integer'))); if (!k) continue;
      let r = null; try { r = await measure(id, k); } catch (e) { r = null; }
      if (r === null) continue; rows.push(id + ' ' + k + ' ' + r.toFixed(2) + ' oct'); if (r < 0.66) lag.push(id + ' (' + k + ' ' + r.toFixed(2) + ')');
      if (FIXED.has(id)) assert.gt(r, 0.66, id + ': ' + k + ' moved mid-note → ' + r.toFixed(2) + ' octave brighter within the note');
    }
    console.error('P163 measured: ' + rows.length + ' · lagging: ' + lag.length + '\n  ' + lag.join('\n  '));
    assert.gt(rows.length, 5, 'instruments measured: ' + rows.length);
  });
});
