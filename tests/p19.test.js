/* 3.29 — Songbook, Learn, new Song Engine genres, the drop gap (spec eravos.phase16-map) */
window.__phase = 'P19';
describe('Song Engine genres (3.29): reggae · dancehall · hanging tree · phonk · lo-fi · ambient', () => {
  const NEW = ['reggae', 'dancehall', 'hanging-tree', 'phonk', 'lofi', 'ambient'];
  it('every new genre is registered as a Start card and its styles exist', () => {
    NEW.forEach(id => { assert.ok(SongEngine.genres().some(g => g.id === id), id); assert.ok(Recipes.get('eravos.recipe.engine.' + id), id + ' card'); });
    assert.ok(SongEngine.styles.bass.includes('onedrop') && SongEngine.styles.bass.includes('dembow') && SongEngine.styles.chords.includes('skank'));
  });
  it('reggae is a one-drop: in the main beat the kick only hits on beat 3; the drop switches to steppers', () => {
    const st = SongEngine.generate('reggae', 75), clips = st.filter(s => s.topic === 'clip_add' && s.payload.target === '@drums').map(s => s.payload);
    const verse = clips.find(c => /· verse$/.test(c.name)), drop = clips.find(c => /· drop$/.test(c.name));
    const kicks = (c, bar) => c.notes.filter(n => n.n === 36 && n.s >= bar * 16 && n.s < bar * 16 + 16).map(n => n.s - bar * 16);
    assert.deepEqual(kicks(verse, 1).filter(s => s !== 7 && s !== 11 && s !== 14), [8]);
    assert.ok([0, 4, 8, 12].every(s => kicks(drop, 1).includes(s)), 'steppers: kick on every beat');
  });
  it('dancehall bass follows the 3-3-2 (dembow) grid', () => {
    const st = SongEngine.generate('dancehall', 96), c = st.find(s => s.topic === 'clip_add' && s.payload.target === '@bass').payload;
    assert.deepEqual(c.notes.filter(n => n.s < 16).map(n => n.s), [0, 3, 6, 8, 11, 14]);
  });
  it('the reggae song builds headless with no faults and is audible', async () => {
    const U = TH.universe(3, { bpm: 76 });
    Recipes.get('eravos.recipe.engine.reggae')._pinned = 75;
    const r = await Recipes.run('eravos.recipe.engine.reggae', { K: U.K, headless: true });
    assert.equal(r.faults.length, 0, JSON.stringify(r.faults.map(f => f.message)));
    U.T.renderTicks(0, 36, 0.05); const buf = await TH.render(U); assert.gt(TH.rms(buf, 0.5, 2.8), 0.002, 'audible');
  }, { timeout: 40000 });
});
describe('the drop gap (3.29) — silence before every drop, crash + kick on beat 1', () => {
  it('every section that leads into a drop is silent for its last half beat, in every part', () => {
    SongEngine.genres().filter(g => g.impact !== false && g.form.some(s => (s.kind || s.name) === 'drop')).forEach(g => {
      const st = SongEngine.generate(g.id, 11);
      g.form.forEach((sec, i) => {
        const nx = g.form[i + 1]; if (!nx || (nx.kind || nx.name.replace(/\s*\d+$/, '')) !== 'drop') return;
        st.filter(s => s.topic === 'clip_add' && s.payload.name.endsWith('· ' + sec.name)).forEach(s => {
          const cut = (sec.bars - 1) * 16 + 14; assert.ok(s.payload.notes.every(n => n.s + n.l <= cut + 1e-9), `${g.id} ${s.payload.name} sounds in the gap`);
        });
      });
      const d = st.find(s => s.topic === 'clip_add' && s.payload.target === '@drums' && / drop$/.test(s.payload.name));
      if (d) assert.ok(d.payload.notes.some(n => n.s === 0 && n.n === 36 + 8 && n.v === 1), g.id + ' crash on drop 1');
    });
  });
});
describe('Songbook (3.29) — off the canvas', () => {
  it('every song points at a real genre (or recipe); locked songs name a real lesson', () => {
    Songbook.songs().forEach(s => {
      if (s.recipe) assert.ok(Recipes.get(s.recipe), s.id); else assert.ok(SongEngine.genres().some(g => g.id === s.genre), s.id + ' genre ' + s.genre);
      ['listen', 'drop', 'voice'].forEach(k => assert.ok(s[k] && s[k].length > 10, s.id + ' ' + k));
      if (s.lock) assert.ok(Learn.lessons().some(l => l.id === s.lock && l.unlock === s.id), s.id + ' lock ' + s.lock);
    });
  });
  it('a locked song does not write until its lesson is done', () => {
    const s = Songbook.songs().find(x => x.lock); assert.ok(Songbook.locked(s) === !Learn.done(s.lock)); if (Songbook.locked(s)) assert.equal(Songbook.write(s), false);
  });
});
describe('Learn (3.29) — lessons off the canvas, steps tick only on real events', () => {
  it('every step either has a real done-event, and every lesson ends on an open loop', () => {
    Learn.lessons().forEach(l => { assert.ok(l.loop, l.id + ' loop'); l.steps.forEach((st, i) => { assert.ok(st.done && [].concat(st.done).every(d => d.topic), `${l.id} step ${i}`); if (st.predict) assert.ok(st.predict.options[st.predict.answer] && st.predict.why, `${l.id} predict ${i}`); }); });
  });
  it('matcher: wildcard topic + topicOrganism + $organism (same grammar as the Coach)', () => {
    const U = TH.universe(0.1); const a = TH.spawn(U, 'eravos.organ');
    const pred = { topic: 'ui:config_change:*', topicOrganism: 'eravos.organ', where: { key: 'pulseRate' } };
    assert.ok(Learn._matches(U.K, pred, 'ui:config_change:' + a, { key: 'pulseRate', value: '1/8' }));
    assert.ok(!Learn._matches(U.K, pred, 'ui:config_change:' + a, { key: 'drive' }));
    assert.ok(Learn._matches(U.K, { topic: 'kernel:wire-registered', where: { 'dst.instanceId': { $organism: 'eravos.organ' } } }, 'kernel:wire-registered', { dst: { instanceId: a } }));
  });
});
describe('3.30 — drum kits, pad service, blank shell', () => {
  it('kit_load replaces the bank with a pack kit; pad_set puts one pad from another kit (mix & match)', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.pads'), c = OrganismFactory.handle(a).ctx;
    const phonk = KitPacks.kits().find(k => k.name === 'Phonk Cowbell'), witch = KitPacks.kits().find(k => k.name === 'Witch House');
    U.K.bus.publish('ui:kit_load:' + a, { pads: phonk.pads }); assert.equal(c.kitOf()[4].voice, 'cowbell');
    U.K.bus.publish('ui:pad_set:' + a, { index: 0, pad: witch.pads[5] }); assert.equal(c.kitOf()[0].voice, '808'); assert.equal(c.kitOf()[0].tune, -9);
    U.K.bus.publish('ui:pad_set:' + a, { index: 0, pad: { voice: 'banjo' } }); assert.equal(c.kitOf()[0].voice, '808', 'unknown voice refused');
  });
  it('every shipped kit has 16 pads with real voices and in-range values; packs switch off', () => {
    const V = ['kick', 'snare', 'hat', 'openhat', 'clap', '808', 'rim', 'tom', 'crash', 'perc', 'shaker', 'cowbell', 'sample'];
    KitPacks.list().filter(p => p.id !== 'mine').forEach(p => Object.keys(p.kits).forEach(n => { const k = p.kits[n]; assert.equal(k.length, 16, n); k.forEach(x => { assert.ok(V.includes(x.voice), n + ' ' + x.voice); if (x.tune !== undefined) assert.ok(x.tune >= -24 && x.tune <= 24, n + ' tune'); if (x.decay !== undefined) assert.ok(x.decay >= 0.02 && x.decay <= 4, n + ' decay'); }); }));
    const before = KitPacks.kits().length; KitPacks.toggle('dark', false); assert.ok(KitPacks.kits().length < before, 'dark off: ' + before + ' ' + KitPacks.kits().length); KitPacks.toggle('dark', true); assert.equal(KitPacks.kits().length, before);
  });
  it('a service instance runs without a window, is not saved, survives clearing the canvas, and can be given a window', () => {
    const id = OrganismFactory.spawn('eravos.midi-mapper', { service: true }); assert.ok(id);
    assert.ok(!document.querySelector('.wm-win[data-instance="' + id + '"]'));
    assert.ok(!Workspace.snapshot().organisms.some(o => o.instanceId === id), 'not saved');
    OrganismFactory.clearAll(Kernel); assert.ok(OrganismFactory.handle(id), 'kept');
    OrganismFactory.close(id);
  });
  it('Learn: “Make music for her” and “Express yourself” tracks exist; every lesson names the skill it gives', () => {
    const T = Learn.tracks().map(t => t.id); assert.ok(T.includes('her') && T.includes('express'));
    Learn.lessons().forEach(l => assert.ok(l.gives && l.leverage, l.id + ' skill'));
    Learn.tracks().forEach(t => assert.ok(t.reveal, t.id + ' reveal'));
  });
});
describe('3.31 — save songs, EDM tour, goals', () => {
  it('Song Recorder → 📖 Save to Songs emits the rendered song (audio + name) for the Songbook', async () => {
    const U = TH.universe(0.2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.song-recorder'), c = OrganismFactory.handle(a).ctx;
    const sr = 48000, b = new OfflineAudioContext(1, sr / 2, sr).createBuffer(1, sr / 2, sr), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = 0.3 * Math.sin(i / 20);
    await c.addAudio(AudioRecorder.encodeWAV(b, 24), 't.wav', null, 0);
    const got = await new Promise((res) => { U.K.bus.subscribe('song:saved', res); U.K.bus.publish('ui:config_change:' + a, { key: 'songName', value: 'mine' }); U.K.bus.publish('ui:save_song:' + a, {}); setTimeout(() => res(null), 8000); });
    assert.ok(got, 'song:saved'); assert.equal(got.name, 'mine'); assert.gt(got.audio.byteLength, 1000); assert.gt(got.duration, 0.4);
  }, { timeout: 15000 });
  it('the EDM tour has one lesson per EDM genre the engine knows, each ending on a rating', () => {
    const t = Learn.tracks().find(x => x.id === 'tour'); assert.ok(t);
    assert.ok(t.lessons.length >= 20, 'at least 20 EDM genres');
    t.lessons.forEach(l => { const g = l.id.slice(5); assert.ok(SongEngine.genres().some(x => x.id === g), g); assert.equal(l.steps[2].rate, g); });
  });
  it('goals unlock only on real events and there is always a next goal', () => {
    Goals._reset(); const before = Goals.list().filter(g => g.got).length; assert.equal(before, 0);
    assert.ok(Goals.next()); Kernel.bus.publish('ui:preset_save:nobody', { name: 'x' }); assert.ok(Goals.list().find(g => g.id === 'preset').got);
    Goals._reset();
  });
  it('every genre has a Songbook card (new genre packs appear by themselves)', () => {
    const cards = new Set(Songbook.all().map(s => s.genre)); SongEngine.genres().forEach(g => assert.ok(cards.has(g.id), g.id));
  });
});
describe('3.32 — ContentPacks: one registry for every pack', () => {
  it('a pack added BEFORE its tool is defined still lands in the preset menu; switching it off removes it', () => {
    ContentPacks.add({ id: 'test.late', label: 'Late', items: { 'eravos.test-late-tool': { presets: { One: { params: { amount: 0.3 } } } } } });
    OrganismFactory.define({ id: 'eravos.test-late-tool', domain: 'test', version: '0.0.1', label: 'Late', category: 'Test', hidden: true, hooks: [], config: [{ key: 'amount', type: 'number', default: 0, min: 0, max: 1 }], presets: {}, engine() { return {}; } });
    const d = OrganismFactory.def('eravos.test-late-tool'); assert.ok(d.presets['Late · One']);
    ContentPacks.setEnabled('test.late', false); assert.ok(!d.presets['Late · One']);
    ContentPacks.setEnabled('test.late', true); assert.ok(d.presets['Late · One']); ContentPacks.remove('test.late'); assert.ok(!d.presets['Late · One']);
  });
  it('preset packs and drum kit packs both live in ContentPacks', () => {
    const ids = ContentPacks.list().map(p => p.id); assert.ok(ids.includes('eravos.presets.80s')); assert.ok(ids.includes('kits.island'));
    assert.ok(ContentPacks.items('eravos.pads', 'kits').length >= 10);
  });
});
