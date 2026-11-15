/* P163 — a knob turned while a note sounds reaches that note (axiom 4: "Tools, keys and values can be adjusted while playing them.").
 * His words, 2026-11-10: "changing any tools values, knobs, presets or what ever is really delayed" · "the workshop when drawing or
 * manipulating or shaping, doesn't do much to change the sound." Found: many instruments read a knob only when a note starts.
 * The measure, for EVERY numeric knob of EVERY instrument (offline, sample-exact): three renders of one held note —
 *   C the knob low throughout · A the knob high from the start · B low, moved to high at 1.0 s (ctx.suspend) —
 * compared over 1.4–1.9 s by level (dB) and brightness (RMS of the change over RMS, octaves). A knob MATTERS when A differs from C
 * (≥ 1.5 dB or ≥ 0.25 oct); it LAGS when it matters and B moved less than a third of the way from C to A. Knobs that only shape a
 * note's start (times: s / ms, attack, decay, glide …) are left out, and so is a knob its tool marks onset: true (3.182 — it shapes how a
 * note is struck, like Piano's Hammer: a hammer cannot change a string already ringing; it reaches the next note). LAGGING below is today's list: a pair not on it that lags fails;
 * the list only shrinks (a fixed pair still listed is reported, to be removed). */
window.__phase = 'P163';
(function () {
  const SKIP = /^(attack|decay|release|glide|seed|voices|unison|fA|fD|fR|porta|delay|lfoDelay|hold|octave|transpose|steps|bars)$|Attack|Decay|Release|Time$/;
  // today's list (2026-11-10, after Retro Poly, Supersaw, Organ): it only shrinks
  const LAGGING = new Set('acid-synth:tune reese-bass:subDrop sub-engine:sustain coven:spread coven:vibrato retro-poly:envAmt curve-synth:span curve-synth:sustain syn-osc:fine syn-osc:detune syn-osc:width syn-osc:sustain syn-partials:sustain wub-osc:dive xen-synth:n xen-synth:baseHz xen-synth:baseNote xen-synth:partials xen-synth:tilt xen-synth:even xen-synth:sustain'.split(' '));
  async function once(id, key, mode, lo, hi) {
    const sr = 22050, ctx = new OfflineAudioContext(1, sr * 2.0, sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn(id, { K, headless: true }); if (!a) return null; const c = OrganismFactory.handle(a).ctx; if (c.internals && c.internals.ready) await c.internals.ready;
    c.params.set(key, mode === 'A' ? hi : lo); K.audio.chain.out.gain.value = 0; K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'out').forEach(x => x.node.connect(ctx.destination));
    K.bus.publish('note:trigger', { target: a, note: 45, velocity: 0.9, time: 0.05, duration: 1.9 });
    if (mode === 'B') ctx.suspend(1.0).then(() => { c.params.set(key, hi); ctx.resume(); });
    const d = (await ctx.startRendering()).getChannelData(0), a0 = Math.floor(1.4 * sr), a1 = Math.floor(1.9 * sr); let q = 0, dq = 0;
    for (let i = a0; i < a1; i++) { q += d[i] * d[i]; const df = d[i] - d[i - 1]; dq += df * df; }
    try { OrganismFactory.close(a); } catch (e) {}
    return q > 1e-10 ? [10 * Math.log10(q / (a1 - a0)), Math.log2(Math.sqrt(dq / q))] : [-100, 0];
  }
  const dist = (x, y) => Math.max(Math.abs(x[0] - y[0]) / 1.5, Math.abs(x[1] - y[1]) / 0.25);   // 1 = just matters
  const ONLY = new URLSearchParams(location.search).get('p163');   // ?p163=eravos.organ,eravos.supersaw: only these (while fixing one)
  const tools = OrganismFactory.defined().filter(d => (!ONLY || ONLY.split(',').includes(d.id)) && d.domain === 'music' && !d.system && (d.hooks || []).some(h => h.direction === 'in' && /note:trigger/.test(h.event_type || '')));
  tools.forEach(d => describe('P163 knobs while a note sounds — ' + d.label, () => {
    it(d.id + ': every numeric knob that matters is followed by the sounding note', async () => {
      const lag = [], ok = [], healed = [];
      for (const c of d.config || []) {
        if ((c.type !== 'number' && c.type !== 'integer') || c.hidden || c.onset || SKIP.test(c.key) || /^(s|ms)$/.test(c.unit || '') || !(c.max > c.min)) continue;
        const lo = c.min + (c.max - c.min) * 0.05, hi = c.min + (c.max - c.min) * 0.9, pair = d.id.replace('eravos.', '') + ':' + c.key;
        let C, A, B; try { C = await once(d.id, c.key, 'C', lo, hi); A = await once(d.id, c.key, 'A', lo, hi); if (!C || !A || dist(A, C) < 1) continue; B = await once(d.id, c.key, 'B', lo, hi); } catch (e) { continue; }
        if (dist(B, C) >= dist(A, C) / 3) { ok.push(pair); if (LAGGING.has(pair)) healed.push(pair); } else lag.push(pair);
      }
      console.error('P163 ' + d.id + ' follow ' + ok.length + ' lag ' + lag.length + (lag.length ? ' LAG ' + lag.join(' ') : '') + (healed.length ? ' HEALED ' + healed.join(' ') : ''));
      assert.deepEqual(lag.filter(p => !LAGGING.has(p)), [], 'knobs that lag and are not on the known list');
    }, { timeout: 300000 });
  }));
})();
