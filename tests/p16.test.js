/* P16 tests (3.26 + 3.27) — studio modes, Reese in her song, Wobble 2.1, whole-piece presets, recorder playback,
 * Song Engine, preset packs. UI-only behaviour (Connect menu, fit-to-content, start-screen sections) is checked in
 * tests/p16-ui.mjs against the real shell. */
window.__phase = 'P16';
const P16 = {
  ctxOf: (inst) => OrganismFactory.handle(inst).ctx,
  set(U, inst, obj) { Object.keys(obj).forEach(k => U.K.bus.publish('ui:config_change:' + inst, { key: k, value: obj[k] })); },
};

describe('studio modes (3.26)', () => {
  it('song-making tools live in Music Production; xenharmonic, analysis and breath in Lab', () => {
    const mode = (id) => MusicDeps.resolve(OrganismFactory.def(id)).mode;
    ['eravos.wobble-bass', 'eravos.reese-bass', 'eravos.sequencer', 'eravos.drum-forge', 'eravos.bass-forge', 'eravos.organ', 'eravos.fx-echo'].forEach(id => assert.equal(mode(id), 'music', id));
    ['eravos.xen-synth', 'eravos.ratio-lattice', 'eravos.recursive-spectra', 'eravos.harmonic-analyzer', 'eravos.breath'].forEach(id => assert.equal(mode(id), 'music.lab', id));
  });
});

describe('“Make a song for her” uses the Reese (3.26)', () => {
  it('the recipe mounts Reese with “Her Drop”, no Wobble', () => {
    const st = Recipes.get('eravos.recipe.raven-drop').steps.filter(s => s.op === 'mount');
    assert.ok(st.some(s => s.organism === 'eravos.reese-bass' && s.preset === 'Her Drop (dubstep reese)'));
    assert.ok(!st.some(s => s.organism === 'eravos.wobble-bass'));
    assert.ok(OrganismFactory.def('eravos.reese-bass').presets['Her Drop (dubstep reese)']);
  });
});

describe('eravos.wobble-bass 2.1', () => {
  it('free rate: Sync off → the LFO runs at Free rate Hz, not the grid', () => {
    const U = TH.universe(1, { bpm: 140 }); const a = TH.spawn(U, 'eravos.wobble-bass');
    P16.set(U, a, { lfoSync: false, lfoHz: 5.3 });
    assert.near(P16.ctxOf(a).internals.lfo.frequency.value, 5.3, 1e-3);
    P16.set(U, a, { lfoSync: true, div: '1/4' });
    assert.near(P16.ctxOf(a).internals.lfo.frequency.value, 140 / 60, 1e-3);
  });
  it('width pans the unison saws apart; noise, vol wub and pitch wub reach their nodes', () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.wobble-bass'); const I = P16.ctxOf(a).internals;
    P16.set(U, a, { width: 0.8, noise: 0.5, ampMod: 0.6, vibrato: 40, spread: 25 });
    return TH.render(U).then(() => {
      assert.near(I.panA.pan.value, -0.8, 0.02); assert.near(I.panB.pan.value, 0.8, 0.02);
      assert.near(I.noiseG.gain.value, 0.5 * 0.35, 0.01); assert.near(I.vibG.gain.value, 80, 1); assert.near(I.saw2.detune.value, 25, 0.5);
    });
  });
  it('every new preset loads and plays (non-silent, no faults)', async () => {
    const names = ['Riddim Square 1/16t', 'Tearout Screech', 'Laser Dive Wub', 'Wide Melodic Wub', 'Free-run Growl 5.3 Hz', 'Off-beat Yoi (phase ½)', 'Wobble Vibrato Lead', 'Trap Wub 808', 'Sub Quake (-2 oct)', 'Vowel Morph (shifted down)', '80s Synth Wub'];
    for (const n of names) {
      const U = TH.universe(1.2, { bpm: 140 }); const a = TH.spawn(U, 'eravos.wobble-bass');
      assert.noFault(U.K, () => U.K.bus.publish('ui:preset_load:' + a, { name: n }), n);
      TH.note(U, a, 45, 0.05, { duration: 0.9 }); const buf = await TH.render(U);
      assert.gt(TH.rms(buf, 0.1, 0.9), 0.005, n + ' is silent');
    }
  }, { timeout: 60000 });
  it('pitch dive: the note starts above and lands on pitch', async () => {
    const U = TH.universe(1.2); const a = TH.spawn(U, 'eravos.wobble-bass');
    P16.set(U, a, { pitchDive: 12, diveTime: 0.2, octave: 0, sub: 0, osc2: 0, filterMode: 'lowpass', cutoff: 8000, depth: 0, drive: 0, shaper: 0, noise: 0, spread: 0 });
    TH.note(U, a, 45, 0.05, { duration: 1 }); const buf = await TH.render(U);
    const early = TH.acFreq(buf, 0.06, 0.12, 60, 400), late = TH.acFreq(buf, 0.6, 0.9, 60, 400);
    assert.gt(early, late * 1.2, `early ${early.toFixed(1)} vs late ${late.toFixed(1)}`); assert.near(late, 110, 6);
  });
});

describe('whole-piece user presets (3.26)', () => {
  it('a Sequencer preset keeps the pattern itself, and loading it brings the pattern back', () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.sequencer'); const c = P16.ctxOf(a);
    U.K.bus.publish('ui:starter_load:' + a, { name: 'trap 140' });
    const before = JSON.stringify(c.saveExtra().patterns.A);
    U.K.bus.publish('ui:preset_save:' + a, { name: '__p16 trap' });
    assert.ok(c.presets.user['__p16 trap'].extra, 'extra saved');
    U.K.bus.publish('ui:starter_load:' + a, { name: 'four-on-floor house' });
    assert.ok(JSON.stringify(c.saveExtra().patterns.A) !== before);
    U.K.bus.publish('ui:preset_load:' + a, { name: 'user:__p16 trap' });
    assert.equal(JSON.stringify(c.saveExtra().patterns.A), before);
  });
  it('{extra:false} still saves knobs only', () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.sequencer'); const c = P16.ctxOf(a);
    c.presets.save('__p16 knobs', { extra: false }); assert.ok(!c.presets.user['__p16 knobs'].extra);
  });
});

describe('Song Recorder plays only the takes (3.27)', () => {
  const tone = (sec) => { const sr = 48000, n = Math.floor(sr * sec), b = new OfflineAudioContext(1, n, sr).createBuffer(1, n, sr), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = 0.5 * Math.sin(2 * Math.PI * 330 * i / sr); return AudioRecorder.encodeWAV(b, 24); };
  it('the canvas transport does NOT play the takes by default (no doubling of what you recorded)', async () => {
    const U = TH.universe(2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.song-recorder'); const c = P16.ctxOf(a);
    await c.addAudio(tone(0.5), 'tone.wav', null, 2);
    U.T.renderTicks(0, 16, 0.1); const buf = await TH.render(U);
    assert.lt(TH.db(TH.rms(buf, 1.2, 1.5)), -60, 'take stayed silent under the canvas transport');
  });
  it('the recorder ▶ plays the takes on its own clock, with no transport', async () => {
    const U = TH.universe(2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.song-recorder'); const c = P16.ctxOf(a); let plays = 0;
    U.K.bus.subscribe('ui:transport-play', () => plays++);
    await c.addAudio(tone(0.5), 'tone.wav', null, 2);
    U.K.bus.publish('ui:play:' + a, {}); const buf = await TH.render(U);
    assert.equal(plays, 0, 'transport untouched'); assert.gt(TH.db(TH.rms(buf, 1.2, 1.5)), -20, 'take audible at beat 2');
  });
  it('its ▶ never starts the canvas transport; “Play with song” is off by default', () => {
    const U = TH.universe(1); const a = TH.spawn(U, 'eravos.song-recorder'); let plays = 0;
    U.K.bus.subscribe('ui:transport-play', () => plays++);
    U.K.bus.publish('ui:play:' + a, {});
    assert.equal(plays, 0); assert.equal(P16.ctxOf(a).params.get('withSong'), false);
  });
});

describe('Song Engine (3.27)', () => {
  it('every genre generates a full song: sections, tracks, notes; every preset it can pick exists', () => {
    const G = SongEngine.genres(); assert.gt(G.length, 10);
    G.forEach(g => {
      Object.values(g.parts).concat(g.fx || []).forEach(P => { const d = OrganismFactory.def(P.organism); assert.ok(d, g.id + ' ' + P.organism); [].concat(P.preset).forEach(pr => assert.ok(d.presets[pr], `${g.id}: ${P.organism} has no preset “${pr}”`)); });
      const st = SongEngine.generate(g.id, 4242);
      assert.gt(st.filter(s => s.topic === 'marker_edit').length, 4, g.id + ' sections');
      assert.gt(st.filter(s => s.topic === 'clip_add').length, 10, g.id + ' clips');
    });
  });
  it('pitched parts are always in the song key (drums excluded)', () => {
    SongEngine.genres().forEach(g => {
      const st = SongEngine.generate(g.id, 99), ses = st.find(s => s.op === 'configure' && s.target === 'session').params;
      st.filter(s => s.topic === 'clip_add' && g.parts[s.payload.target.slice(1)].role !== 'drums').forEach(s => s.payload.notes.forEach(n => assert.ok(MusicTheory.inScale(n.n, ses.root, ses.scale), `${g.id} ${s.payload.name}: ${n.n} not in ${ses.root} ${ses.scale}`)));
    });
  });
  it('same genre + seed = same song; a different seed = a different song', () => {
    const a = JSON.stringify(SongEngine.generate('synthwave', 7)), b = JSON.stringify(SongEngine.generate('synthwave', 7)), c = JSON.stringify(SongEngine.generate('synthwave', 8));
    assert.equal(a, b); assert.ok(a !== c);
  });
  it('a generated song builds headless with no faults and its timeline plays the instruments', async () => {
    const U = TH.universe(3, { bpm: 100 });
    Recipes.get('eravos.recipe.engine.synthwave')._pinned = 1234;
    const r = await Recipes.run('eravos.recipe.engine.synthwave', { K: U.K, headless: true });
    assert.equal(r.faults.length, 0, JSON.stringify(r.faults.map(f => f.message)));
    let notes = 0; U.K.bus.subscribe('note:trigger', () => notes++);
    U.T.play(); const buf = await TH.render(U);
    assert.gt(notes, 3, 'timeline sent notes (intro: pad + light drums)'); assert.gt(TH.rms(buf, 0.5, 2.8), 0.002, 'the song is audible');
  }, { timeout: 40000 });
});

describe('preset packs (3.27 → pack.json bundles in 3.37)', () => {
  const bundle = (id) => ContentPacks.list().find(p => p.id === id);
  it('every shipped pack preset names real keys with in-range values, and shows in its tool’s menu', () => {
    const bad = [];
    ContentPacks.list().forEach(pk => pk.for.forEach(id => {
      const d = OrganismFactory.def(id); if (!d) { bad.push(pk.id + ': no tool ' + id); return; }
      ContentPacks.items(id, 'presets').filter(x => x.pack === pk.id).forEach(x => {
        Object.entries((x.value && x.value.params) || {}).forEach(([k, v]) => {
          const c = d.config.find(c => c.key === k); if (!c) { bad.push(`${id} “${x.name}”: no param ${k}`); return; }
          if (c.options && !c.options.map(String).includes(String(v))) bad.push(`${id} “${x.name}”: ${k}=${v} not in ${c.options}`);
          if (typeof c.min === 'number' && !(v >= c.min && v <= c.max)) bad.push(`${id} “${x.name}”: ${k}=${v} outside ${c.min}..${c.max}`);
        });
      });
    }));
    assert.equal(bad.length, 0, '\n' + bad.slice(0, 20).join('\n'));
  });
  it('the 80s pack covers synths, effects and the master', () => {
    const pk = bundle('eravos.presets.80s'); assert.ok(pk, '80s bundle');
    ['eravos.retro-poly', 'eravos.supersaw', 'eravos.pad-forge', 'eravos.fx-echo', 'eravos.fx-moddelay', 'eravos.master-fx'].forEach(id => assert.ok(pk.for.includes(id), id));
  });
});
