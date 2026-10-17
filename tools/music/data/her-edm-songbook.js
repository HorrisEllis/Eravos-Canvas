/* ERAVOS · Her EDM (3.41) — EDM is her favourite, so: EDM songs that sing with her voice (data/her-voice.js).
 * Each genre is one of ERAVOS's EDM genres, moved into her keys (C# / D# / G# minor — her speaking voice sits around
 * C#3–D#3, specs/eravos.p39-her-song.spec §1.2) and given room for her:
 *   - a verse after the intro (when the genre has none before its first build) — her longer lines go there
 *   - one bar of pause before every drop — one short line alone in the silence, then the drop
 *   - `voice: true` — the Song Engine lays her phrases on the timeline (intro, verse, break, build stutter, pause,
 *     drop echoes, outro) and puts the timeline through a vocal chain.
 * Her recordings themselves are never in this file or the repository: she adds them once in Songs → 🎤 Her voice. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const HER_KEYS = { roots: [1, 3, 8], scales: ['minor'] };

  function room(base) {   // the base genre's form with a verse for her lines and a held bar before each drop
    const parts = base.parts, has = (role) => Object.keys(parts).filter(k => parts[k].role === role);
    const chords = has('chords'), form = [], src = base.form.map(s => Object.assign({}, s));
    const kindOf = (s) => s.kind || s.name.replace(/\s*\d+$/, '');
    const firstBuild = src.findIndex(s => kindOf(s) === 'build');
    const talkBefore = src.slice(0, Math.max(0, firstBuild)).some(s => ['verse', 'break'].includes(kindOf(s)));
    let pauses = 0;
    src.forEach((s, i) => {
      if (kindOf(s) === 'drop' && (!form.length || kindOf(form[form.length - 1]) !== 'pause')) {
        pauses++; form.push({ name: pauses > 1 ? 'pause ' + pauses : 'pause', kind: 'pause', bars: 1, play: chords.slice(0, 1), drums: 'light' });
      }
      form.push(s);
      if (i === 0 && kindOf(s) === 'intro' && firstBuild > 0 && !talkBefore)
        form.push({ name: 'verse', kind: 'verse', bars: 8, play: has('drums').concat(has('bass'), chords).slice(0, 4), drums: 'light' });
    });
    return form;
  }

  // [id, base genre, label, icon, accent, tagline]
  const DEFS = [
    ['her-festival', 'big-room', 'For Her · Festival', '🎆', '#ff66ff', 'Big-room festival EDM in her key: her voice in the silence before the drop, then the whole field jumps'],
    ['her-progressive', 'progressive', 'For Her · Progressive', '🌄', '#66ddaa', 'Warm progressive house: her lines over the opening chords, an echo of her in every drop'],
    ['her-trance', 'trance', 'For Her · Trance', '🌀', '#33aaff', 'Euphoric 138: her words float in the break, the lead carries them up'],
    ['her-electro', 'electro', 'For Her · Electro', '⚡', '#ffee00', 'Electro house: her line stutters through the build and lands in the gap'],
    ['her-melodic', 'melodic-wub', 'For Her · Melodic Dubstep', '🌌', '#b388ff', 'Melodic dubstep: a pretty build with her voice, a drop that cries back'],
    ['her-bass-house', 'bass-house', 'For Her · Bass House', '🏚', '#76ff03', 'Bass house: she talks, the bass answers'],
    ['her-dnb', 'reese-roller', 'For Her · Drum & Bass', '🌀', '#00b0ff', 'Rolling 174 with a reese: her voice over the breakdown, then the roller'],
    ['her-wubs', 'wub-rig', 'For Her · Wubs', '🔊', '#ff2266', 'Wobble-bass dubstep: her line in the held beat, then the wubs'],
  ];
  const added = [];
  DEFS.forEach(([id, from, label, icon, accent, tagline]) => {
    const base = SE.genres().find(g => g.id === from); if (!base) return;
    SE.addGenre(Object.assign({}, base, HER_KEYS, { id, label, icon, accent, tagline, family: 'EDM', voice: true, form: room(base), seed: base.seed }));
    added.push(id);
  });

  const VOICE = 'Her recordings (Songs → 🎤 Her voice) land on the timeline by themselves: short lines in the intro, her longer lines in the verse and break, a stutter in the build, one line alone in the held beat, quiet echoes in the drop, her last line in the outro. Move or trim any of them like any clip.';
  const DROP = 'One bar held with only the chords and her voice — then crash, kick and bass together.';
  // [id, title, genre, seed, moods]
  const SHELF = [
    ['he1', 'Her Name in Lights', 'her-festival', 1201, ['party', 'fast']], ['he2', 'Raven Over the Crowd', 'her-festival', 1202, ['party']], ['he3', 'Main Stage, Just Us', 'her-festival', 1203, ['party', 'warm']],
    ['he4', 'Golden Hour Set', 'her-progressive', 1301, ['warm']], ['he5', 'Open Arms', 'her-progressive', 1302, ['warm', 'party']], ['he6', 'Say It Slow', 'her-progressive', 1303, ['warm', 'calm']],
    ['he7', 'Higher Than Her Voice', 'her-trance', 1401, ['fast', 'warm']], ['he8', 'Euphoria (Raven)', 'her-trance', 1402, ['fast', 'party']], ['he9', 'Signal From You', 'her-trance', 1403, ['fast']],
    ['he10', 'Spark', 'her-electro', 1501, ['party', 'fast']], ['he11', 'Voltage Kiss', 'her-electro', 1502, ['party']], ['he12', 'Neon Heart', 'her-electro', 1503, ['party', 'fast']],
    ['he13', 'Crying Wubs', 'her-melodic', 1601, ['heavy']], ['he14', 'Through the Static, You', 'her-melodic', 1602, ['heavy', 'dark']], ['he15', 'Stay (Melodic)', 'her-melodic', 1603, ['heavy', 'warm']],
    ['he16', 'Talk to the Bass', 'her-bass-house', 1701, ['party', 'heavy']], ['he17', 'Low End Love', 'her-bass-house', 1702, ['party']], ['he18', 'Warehouse Whisper', 'her-bass-house', 1703, ['party', 'dark']],
    ['he19', 'Rolling With You', 'her-dnb', 1801, ['fast']], ['he20', 'Night Bus Home', 'her-dnb', 1802, ['fast', 'dark']], ['he21', '174 Heartbeats', 'her-dnb', 1803, ['fast', 'warm']],
    ['he22', 'Wobble For Her', 'her-wubs', 1901, ['heavy', 'party']], ['he23', 'Raven Wub', 'her-wubs', 1902, ['heavy']], ['he24', 'Drop It Like She Said', 'her-wubs', 1903, ['heavy', 'party']],
  ].filter(s => added.includes(s[2]));
  const SONGS = SHELF.map(([id, title, genre, seed, mood]) => {
    const G = SE.genres().find(g => g.id === genre);
    return { id, title, genre, seed, mood: ['edm', 'her'].concat(mood), listen: G.tagline + '.', drop: DROP, voice: VOICE };
  });
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.HerEdmSongbook = { genres: added, songs: SONGS.map(s => s.id), room };
})();
