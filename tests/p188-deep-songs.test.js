/* P188 — the deep songs (specs/eravos.deep-songs.spec). His words (2026-11-14): "can you look at every major song of all synthwave, edm,
 * dubstep, electronic, etc to make a wide contrast of songs per catagory that are as complex and deep as eravos can be. like per note edits,
 * automation, tools wired to other tools, etc. curves, etc. as deep as possiblr" — six songs a shelf, each its own sub-style, each using all
 * of it. Measured from what each song writes (and two of them played). */
window.__phase = 'P188';
describe('P188 deep songs: a wide contrast per shelf, each as deep as ERAVOS goes', () => {
  const DS = () => window.DeepSongbook, songs = () => Songbook.all({ same: true }).filter(s => DS().genres.includes(s.genre));
  const write = (s) => SongEngine.generate(s.genre, s.seed);
  const notesOf = (st) => [].concat(...st.filter(x => x.op === 'event' && x.topic === 'clip_add').map(x => x.payload.notes || []));
  it('six songs a shelf, each its own genre, on HIS shelves (no new category); every tool, preset and curve knob real', () => {
    const all = songs(); assert.equal(all.length, 12, all.length + ' songs');
    [['80s', /^deepwave-/], ['dubstep', /^deepstep-/]].forEach(([shelf, re]) => { const on = all.filter(s => re.test(s.genre));
      assert.equal(on.length, 6, shelf + ': ' + on.length); assert.equal(new Set(on.map(s => s.genre)).size, 6, shelf + ': six genres');
      on.forEach(s => assert.equal(Songbook.categoryOf(s), shelf, s.title + ' on ' + shelf)); });
    all.forEach(s => { const st = write(s), alias = {};
      st.filter(x => x.op === 'mount').forEach(x => { alias[x.as] = x.organism; const d = OrganismFactory.def(x.organism); assert.ok(d, x.organism);
        if (x.preset) assert.ok(Object.keys(d.presets || {}).includes(x.preset), s.title + ': “' + x.preset + '” on ' + x.organism); });
      st.filter(x => x.op === 'event' && x.topic === 'lane_add' && x.payload.kind === 'auto').forEach(x => { const id = alias[x.payload.target.slice(1)], d = OrganismFactory.def(id), k = x.payload.key;
        assert.ok(k === '@pitch' || (d.config || []).some(c => c.key === k), s.title + ': the lane “' + x.payload.name + '” moves a real knob (' + id + ' · ' + k + ')'); });
      st.filter(x => x.op === 'modulate').forEach(x => { const d = OrganismFactory.def(alias[x.to]), k = String(x.key).replace(/^knob\./, '');
        assert.ok((d.config || []).some(c => c.key === k), s.title + ': ' + x.from + ' → ' + alias[x.to] + ' · ' + x.key + ' is a real knob'); }); });
  });
  it('every song uses every kind of per-note depth: knobs on a note, knob curves inside it, bends with their own LFO, chords from one note, plays on pass k, chance, ratchets that speed up, swing, humanize', () => {
    const KINDS = { 'a knob on the note (p)': n => n.p && Object.keys(n.p).length, 'a knob curve inside the note (c)': n => n.c && Object.keys(n.c).length, 'a bend with its own LFO': n => n.b && n.b.osc,
      'a chord from one note': n => n.x && n.x.iv, 'plays on pass k of every N': n => n.x && n.x.cond, 'chance': n => n.pr, 'a ratchet': n => n.rt > 1, 'a ratchet that speeds up / slows down': n => n.x && n.x.rs,
      'microtiming': n => n.mt, 'humanize': n => n.x && n.x.ht };
    const bad = songs().map(s => { const N = notesOf(write(s)), miss = Object.keys(KINDS).filter(k => !N.some(KINDS[k])); return miss.length ? s.title + ' lacks ' + miss.join(', ') : ''; }).filter(Boolean); assert.equal(bad.join(' · '), '', 'every song, every kind');
  });
  it('every song: ≥ 12 curve lanes on instruments, effects and the XY Pad; an LFO, the XY Pad’s X and Y, and a tool or effect driving another', () => {
    const few = []; songs().forEach(s => { const st = write(s), alias = {}; st.filter(x => x.op === 'mount').forEach(x => { alias[x.as] = x.organism; });
      const lanes = st.filter(x => x.op === 'event' && x.topic === 'lane_add' && x.payload.kind === 'auto').map(x => x.payload), on = (pre) => lanes.filter(l => l.target.startsWith('@' + pre));
      if (lanes.length < 12) few.push(s.title + ' ' + lanes.length); assert.ok(on('fx').length >= 2, s.title + ': lanes on effects');
      assert.ok(lanes.some(l => alias[l.target.slice(1)] === 'eravos.xy-pad'), s.title + ': lanes move the XY Pad'); assert.ok(lanes.some(l => alias[l.target.slice(1)] === 'eravos.lfo'), s.title + ': a lane moves the LFO');
      const mods = st.filter(x => x.op === 'modulate');
      assert.ok(mods.some(x => alias[x.from] === 'eravos.lfo'), s.title + ': an LFO');
      assert.ok(mods.some(x => alias[x.from] === 'eravos.xy-pad' && x.out === 'x') && mods.some(x => alias[x.from] === 'eravos.xy-pad' && x.out === 'y'), s.title + ': X and Y each drive a knob');
      assert.ok(mods.some(x => !/lfo|xy-pad/.test(alias[x.from])), s.title + ': a tool or an effect drives another (' + mods.map(x => alias[x.from] + ':' + x.out).join(', ') + ')'); });
    assert.equal(few.join(' · '), '', 'songs with fewer than 12 lanes');
  });
  it('contrast within a shelf: no two share a form or a lead sound; 80s tempos span ≥ 30 BPM', () => {
    [/^deepwave-/, /^deepstep-/].forEach(re => { const gs = SongEngine.genres().filter(g => re.test(g.id));
      const forms = gs.map(g => g.form.map(x => x.name + ':' + x.bars).join('|')); assert.equal(new Set(forms).size, gs.length, re + ': six forms');
      const sounds = gs.map(g => Object.values(g.parts).filter(p => p.role !== 'drums').map(p => p.organism + '·' + [].concat(p.preset || '')[0]).sort().join(',')); assert.equal(new Set(sounds).size, gs.length, re + ': six palettes'); });
    const bpms = SongEngine.genres().filter(g => /^deepwave-/.test(g.id)).map(g => g.bpm[0]); assert.ok(Math.max(...bpms) - Math.min(...bpms) >= 30, '80s tempos ' + bpms.join(' '));
  });
  it('no wire drives a feedback knob (a modulator on top of a feedback curve passed 1 and ran away into NaN — Sequence 84, 2026-11-14)', () => {
    const bad = []; songs().forEach(s => write(s).filter(x => x.op === 'modulate' && /feedback/i.test(String(x.key))).forEach(x => bad.push(s.title + ': ' + x.from + ' → ' + x.to + ' · ' + x.key)));
    assert.equal(bad.join(' · '), '', 'wires into feedback');
  });
  it('none is hidden as a repeat of another song', () => { const hidden = Songbook.same().filter(x => DS().songs.includes(x.id)); assert.equal(hidden.length, 0, hidden.map(x => x.title).join(' | ')); });
  it('every song writes on the canvas with no fault (tools mounted, wired, modulated, lanes added)', async () => {
    for (const s of songs()) { const rec = Recipes.get('eravos.recipe.engine.' + s.genre); rec._pinned = s.seed;
      const U = TH.universe(0.5, { bpm: 120 }), n0 = U.K.faults.list().length; await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
      assert.equal(U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | '), '', s.title + ': no fault'); }
  });
  const LOUDEST = { 'deepwave-nightdrive': 'chorus 3', 'deepwave-outrun': 'key change', 'deepwave-darksynth': 'drop 2', 'deepwave-dream': 'chorus 2', 'deepwave-italo': 'chorus 2', 'deepwave-slowfunk': 'hook 2',
    'deepstep-og': 'drop 2', 'deepstep-wobble': 'drop 2', 'deepstep-talker': 'drop 2', 'deepstep-riddim': 'drop 2', 'deepstep-melodic': 'drop 2', 'deepstep-tearout': 'drop 2' };
  Object.keys(LOUDEST).forEach(g => it(g + ' plays at its loudest (4 bars of ' + LOUDEST[g] + '): sound, no fault, nothing clipping', async () => {
    const marker = LOUDEST[g], seed = Songbook.all({ same: true }).find(s => s.genre === g).seed, rec = Recipes.get('eravos.recipe.engine.' + g); rec._pinned = seed;
    const st = SongEngine.generate(g, seed), bpm = st.find(x => x.op === 'bpm').bpm, barSec = 240 / bpm, U = TH.universe(0.2 + barSec * 4, { bpm }), n0 = U.K.faults.list().length;
    await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
    const tl = OrganismFactory.handle(U.K.registry.byOrganism('eravos.timeline')[0].instance_id).ctx, m = tl.internals.markers.find(x => x.name === marker), s0 = (m.bar - 1) * 16, sd = barSec / 16;
    for (let k = 0; k < 64; k++) { const t = 0.1 + k * sd; U.ctx.suspend(Math.max(0, Math.floor((t - 0.03) * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate)).then(() => { U.T.renderTicks(s0 + k, s0 + k + 1, t); U.ctx.resume(); }); }
    const buf = await TH.render(U), L = buf.getChannelData(0); let e = 0, clip = 0, pk = 0; for (const x of L) { e += x * x; pk = Math.max(pk, Math.abs(x)); if (Math.abs(x) > 0.98) clip++; }
    (window.__p188 = window.__p188 || []).push(g + ': ' + (20 * Math.log10(Math.sqrt(e / L.length))).toFixed(1) + ' dB rms, peak ' + pk.toFixed(2));
    assert.equal(U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | '), '', 'no fault');
    assert.gt(Math.sqrt(e / L.length), 0.01, 'it sounds'); assert.lt(clip / L.length, 0.001, 'clipping ' + (100 * clip / L.length).toFixed(3) + ' %');
  }));
});
