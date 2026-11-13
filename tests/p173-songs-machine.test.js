/* P173 — songs in his three categories, built like Floor Falls Out and wired through all of ERAVOS. His words, 2026-11-13: "6? also they sound
 * horrible. more like floor falls out." · "considering i said everything eravos could do including automation. way too shallow … also stop
 * making new catagories. i told you the catagories." Measured against Floor Falls Out itself (hd-heavy-drops #5901). */
window.__phase = 'P173';
describe('P173 the machine songs: lofi, synthwave, wobble bass — Floor Falls Out’s arc, everything wired', () => {
  const G3 = ['wub-floor-machine', 'synthwave-night-machine', 'lofi-tape-machine'], SHELF = { 'wub-floor-machine': 'dubstep', 'synthwave-night-machine': '80s', 'lofi-tape-machine': 'chill' };
  // per bar: level, the 30–60 Hz share, above 150 Hz (P72's measure), and the share of samples at the clipper
  function bars(buf, barSec, n, t0) {
    const L0 = buf.getChannelData(0), R0 = buf.getChannelData(1), sr = buf.sampleRate, per = Math.round(barSec * sr), out = [];
    const a1 = 1 - Math.exp(-2 * Math.PI * 30 / sr), a2 = 1 - Math.exp(-2 * Math.PI * 60 / sr); let l30 = 0, l30b = 0, l60 = 0, l60b = 0;
    const w = 2 * Math.PI * 150 / sr, al = Math.sin(w) / (2 * 0.7071), cw = Math.cos(w), a0 = 1 + al, B0 = (1 + cw) / 2 / a0, B1 = -(1 + cw) / a0, B2 = B0, A1 = -2 * cw / a0, A2 = (1 - al) / a0;
    const hp = () => { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; return (x) => { const y = B0 * x + B1 * x1 + B2 * x2 - A1 * y1 - A2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }; }, h1 = hp(), h2 = hp();
    for (let b = 0; b < n; b++) { let e = 0, band = 0, above = 0, clip = 0; const s0 = Math.round(t0 * sr) + b * per;
      for (let i = s0; i < s0 + per && i < L0.length; i++) { const m = (L0[i] + R0[i]) / 2; l30 += a1 * (m - l30); l30b += a1 * (l30 - l30b); l60 += a2 * (m - l60); l60b += a2 * (l60 - l60b);
        const bd = l60b - l30b, hh = h2(h1(m)); e += m * m; band += bd * bd; above += hh * hh; if (Math.abs(L0[i]) > 0.98 || Math.abs(R0[i]) > 0.98) clip++; }
      out.push({ db: 10 * Math.log10(e / per + 1e-12), deep: band / (e + 1e-12), above: 10 * Math.log10(above / per + 1e-12), clip: clip / per }); }
    return out;
  }
  async function playAround(genre, seed, marker, nBars) {   // write the song, play from one bar before `marker` for nBars, measured per bar
    const rec = Recipes.get('eravos.recipe.engine.' + genre); rec._pinned = seed;
    const g = SongEngine.genres().find(x => x.id === genre), st = SongEngine.generate(genre, seed), bpm = st.find(x => x.op === 'bpm').bpm, barSec = 240 / bpm;
    const U = TH.universe(0.2 + barSec * nBars, { bpm }), n0 = U.K.faults.list().length;
    await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
    const faults = U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message);
    const tl = OrganismFactory.handle(U.K.registry.byOrganism('eravos.timeline')[0].instance_id).ctx, m = tl.internals.markers.find(x => x.name === marker), s0 = (m.bar - 2) * 16, sd = barSec / 16;
    for (let k = 0; k < nBars * 16; k++) { const t = 0.1 + k * sd; U.ctx.suspend(Math.max(0, Math.floor((t - 0.03) * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate)).then(() => { U.T.renderTicks(s0 + k, s0 + k + 1, t); U.ctx.resume(); }); }
    const buf = await TH.render(U); return { faults, B: bars(buf, barSec, nBars, 0.1), tl, U };
  }
  it('24 songs, eight a genre, on HIS shelves (no new category); every tool and preset real', () => {
    const all = Songbook.all({ same: true }).filter(s => G3.includes(s.genre)); assert.equal(all.length, 24, all.length + ' songs');
    G3.forEach(g => assert.equal(all.filter(s => s.genre === g).length, 8, g));
    all.forEach(s => assert.equal(Songbook.categoryOf(s), SHELF[s.genre], s.title + ' on ' + SHELF[s.genre]));
    assert.ok(!Songbook.categories().some(c => c.id === 'now'), 'no ✨ ERAVOS Now shelf');
    all.forEach(s => SongEngine.generate(s.genre, s.seed).filter(x => x.op === 'mount').forEach(x => { assert.ok(OrganismFactory.def(x.organism), x.organism);
      if (x.preset) assert.ok(Object.keys(OrganismFactory.def(x.organism).presets || {}).includes(x.preset), s.title + ': “' + x.preset + '” on ' + x.organism); }));
  });
  it('the full extent: curves on instruments, effects and modulators; LFOs, the XY Pad, routes out of a tool and an effect; the Arp wired; the Drop Builder', () => {
    G3.forEach(g => { const st = SongEngine.generate(g, g === 'wub-floor-machine' ? 9101 : g === 'synthwave-night-machine' ? 9201 : 9301), alias = {};
      st.filter(x => x.op === 'mount').forEach(x => { alias[x.as] = x.organism; });
      const lanes = st.filter(x => x.op === 'event' && x.topic === 'lane_add' && x.payload.kind === 'auto').map(x => x.payload), on = (pre) => lanes.filter(l => l.target.startsWith('@' + pre));
      assert.gt(lanes.length, 9, g + ': ' + lanes.length + ' curve lanes');
      assert.ok(on('fx').length >= 2, g + ': curves on effects (' + on('fx').map(l => l.target + ':' + l.key).join(' ') + ')');
      assert.ok(lanes.some(l => alias[l.target.slice(1)] === 'eravos.xy-pad'), g + ': curves move the XY Pad');
      const mods = st.filter(x => x.op === 'modulate'); assert.gt(mods.length, 2, g + ': ' + mods.length + ' modulation wires');
      assert.ok(mods.some(x => alias[x.from] === 'eravos.xy-pad' && x.out === 'x') && mods.some(x => alias[x.from] === 'eravos.xy-pad' && x.out === 'y'), g + ': X and Y each drive a knob');
      assert.ok(mods.some(x => alias[x.from] === 'eravos.lfo'), g + ': an LFO');
      assert.ok(mods.some(x => !/lfo|xy-pad/.test(alias[x.from])), g + ': a tool or an effect modulates another (' + mods.map(x => alias[x.from]).join(', ') + ')'); });
    const sw = SongEngine.generate('synthwave-night-machine', 9201); assert.ok(sw.some(x => x.op === 'wire' && x.from[0] === 'arp'), 'the Arp plays the DCO pluck');
    assert.ok(SongEngine.generate('wub-floor-machine', 9101).some(x => x.op === 'mount' && x.organism === 'eravos.bass-drop-builder'), 'the Drop Builder');
  });
  it('the songs of a genre are different songs (under 80 % shared notes) — and none is hidden as a repeat', () => {
    const hidden = Songbook.same().filter(x => G3.some(g => x.id && Songbook.all({ same: true }).find(s => s.id === x.id && s.genre === g)));
    assert.equal(hidden.length, 0, hidden.map(x => x.title).join(' | '));
  });
  const FFO = { genre: 'hd-heavy-drops', seed: 5901 };
  [['wub-floor-machine', 9101], ['synthwave-night-machine', 9202], ['lofi-tape-machine', 9301]].forEach(([g, seed]) => it(g + ' #' + seed + ': writes with no fault; the pause is a hole, the drop lands, nothing clips (measured beside Floor Falls Out)', async () => {
    const me = await playAround(g, seed, 'pause', 4), ffo = await playAround(FFO.genre, FFO.seed, 'pause', 4);
    assert.equal(me.faults.join(' | '), '', 'no fault');
    const fmt = (B) => B.map(x => x.db.toFixed(1) + 'dB/' + (x.deep * 100).toFixed(0) + '%/' + x.above.toFixed(1) + (x.clip ? '/clip ' + (x.clip * 100).toFixed(2) + '%' : '')).join('  ');
    window.__p173 = (window.__p173 || []).concat([g + ' #' + seed + ': ' + fmt(me.B), 'FFO #5901: ' + fmt(ffo.B)]);
    const [build, pause, drop1, drop2] = me.B, say = fmt(me.B) + '  ·  FFO ' + fmt(ffo.B);
    assert.ok(Math.max(...me.B.map(x => x.clip)) < 0.003, 'clipping no worse than Floor Falls Out’s own (≈ 0.1 %): ' + say);
    assert.ok(pause.above < drop1.above - 3, 'the pause is a hole above 150 Hz, the drop fills it (FFO: 3.8 dB): ' + say);
    if (g === 'lofi-tape-machine') assert.ok(pause.db < drop1.db - 10, 'the tape’s move empties the bar: ' + say);
    else assert.ok(drop1.db > build.db + 2.5 && drop1.db > -9, 'the drop lands above the build, near Floor Falls Out’s level (−7 dB): ' + say);
    if (g === 'wub-floor-machine') assert.ok(drop1.deep > 0.1 && drop1.above < -16, 'Floor Falls Out’s weight: low end > 10 %, above 150 Hz < −16 dB (FFO 21 %, −19): ' + say);
  }));
});
