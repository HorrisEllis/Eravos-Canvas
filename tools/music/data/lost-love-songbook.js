/* ERAVOS "Lost Love" songbook (3.40) — data only. The song set mapped in specs/eravos.p39-her-song.spec §1.1 (L1–L4),
 * built: nine Song Engine genres, one per family of the playlist "Lost love." (technique only — no melody, lyric, sample
 * or transcription of any record), and the songs in them, starting with LL1–LL10.
 *   ll-deep · ll-prog · ll-drive · ll-ruin · ll-flaws · ll-lullaby · ll-raven · ll-heartbeat · ll-last-light
 * Every song is made for her voice: keys sit on her speaking voice (C# / D# minor, spec §1.2), each has a break with room
 * for it, and each opens a Clip Maker already wired into a Sample player — record or drop her clip, send it, play it.
 * Bars come from the Bass Pack's writer (builds, pauses, lifts, bass patterns), so the Bass Pack loads first. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const tear = SE.genres().find(g => g.id === 'tearout'), bar = tear && tear.bar;   // the Bass Pack bar writer
  if (!bar) return;

  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const KIT = (p, alt) => ({ role: 'drums', organism: 'eravos.pads', preset: alt ? [p, alt] : p, name: 'Drums' });
  const PAD = (presets, o) => Object.assign({ role: 'chords', organism: 'eravos.pad-forge', preset: presets, style: 'sustain', voicing: 'add9', octave: 4, name: 'Pad' }, o || {});
  const SUB = (presets, style, o) => Object.assign({ role: 'bass', organism: 'eravos.sub-engine', preset: presets, style: style || 'offbeat', name: 'Bass' }, o || {});
  // her voice: a Clip Maker (record / trim / split her clip) wired into a Sample player that plays it in the song
  const HER = [{ organism: 'eravos.clip-maker' }, { organism: 'eravos.sample-player', preset: ['Whole clip', 'Melodic voice'], wireFrom: ['mod0', 'clip.hook.asset_out'], wireTo: 'samp.hook.asset_in' }];
  const EMOTIONAL = [6, 7, 5, 1], HEARTBREAK = [4, 6, 1, 7];   // the Timeline's chord fills of the same names
  const HER_KEYS = { roots: [1, 3, 1, 3, 8], scales: ['minor', 'dorian'] };   // C# / D# minor on her voice (G# for range)

  // ---------------------------------------------------------------- grids (16 steps: X loud · x normal · o ghost)
  const HOUSE = { kick: 'X...X...X...X...', clap: '....x.......x...', hat: '..x...x...x...x.', shaker: 'oooooooooooooooo', rim: '...o.....o....o.' };
  const HOUSE_LIGHT = { hat: '..x...x...x...x.', shaker: 'o.o.o.o.o.o.o.o.' };
  const HOUSE_STRIP = { kick: 'X...X...X...X...', hat: '..o...o...o...o.' };
  const HALF = { kick: 'X.....x...x.....', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.x.x.x.' };
  const DRIVE = { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
  const DRIVE_LIGHT = { kick: 'X.......X.......', hat: 'x.x.x.x.x.x.x.x.' };
  const COLD = { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.', perc: '.......o.......o' };
  const TRAP = { kick: 'X.........X.....', snare: '........X.......', clap: '........x.......', hat: 'x.x.x.x.x.xxx.xx' };
  const TRAP_LIGHT = { hat: 'x...x...x...x.x.', kick: 'X...............' };
  const BREATH = { rim: '........o.......', shaker: 'o...o...o...o...' };

  // ---------------------------------------------------------------- forms
  // house arc: intro → verse → build → (pause) → peak → break (her voice) → build 2 → peak 2 lifted → outro
  const HOUSE_FORM = (o) => [
    S('intro', 'intro', 8, ['pad', 'drums'], { drums: 'light' }),
    S('verse', 'verse', 16, ['drums', 'bass', 'pad', 'pluck'], { prog: o.prog }),
    S('build', 'build', 8, ['pad', 'drums', 'lead'], { prog: [6, 6, 7, 7, 4, 4, 5, 5] }),
    S('peak', 'drop', 16, ['drums', 'bass', 'pad', 'pluck', 'lead'], { prog: o.prog, pat: o.pat }),
    S('break', 'break', 8, ['pad'], { prog: o.prog }),
    S('build 2', 'build', 8, ['pad', 'drums', 'lead'], { prog: [6, 6, 7, 7, 4, 4, 5, 5] }),
    S('pause', 'pause', 1, ['pad'], { prog: [5] }),
    S('peak 2', 'drop', 16, ['drums', 'bass', 'pad', 'pluck', 'lead'], { prog: o.prog, lift: o.lift === undefined ? 2 : o.lift, pat: o.pat }),
    S('outro', 'outro', 8, ['pad', 'drums'], { drums: 'light' }),
  ];
  const SONG_FORM = (o) => [
    S('intro', 'intro', 8, ['pad', 'drums'], { drums: 'light' }),
    S('verse', 'verse', 16, ['drums', 'bass', 'pad'], { prog: o.prog }),
    S('chorus', 'chorus', 16, ['drums', 'bass', 'pad', 'lead', 'pluck'], { prog: o.prog }),
    S('verse 2', 'verse', 16, ['drums', 'bass', 'pad', 'pluck'], { prog: o.prog }),
    S('break', 'break', 8, ['pad'], { prog: o.prog }),
    S('chorus 2', 'chorus', 16, ['drums', 'bass', 'pad', 'lead', 'pluck'], { prog: o.prog, lift: 2 }),
    S('outro', 'outro', 8, ['pad', 'lead'], { drums: 'light' }),
  ];

  const GENRES = [
    // A deep — LL1: starts under water (muffled pad), opens up at the peak
    { id: 'll-deep', label: 'Lost Love · Deep (under water → sunrise)', icon: '🌊', accent: '#4fc3f7', family: 'Lost Love', bpm: [118, 122], ...HER_KEYS, progs: [EMOTIONAL, HEARTBREAK],
      tagline: 'Soft four-on-the-floor; the pad starts muffled, like under water, and the peak opens it into light',
      drums: { main: HOUSE, light: HOUSE_LIGHT, strip: HOUSE_STRIP }, leadRhythm: 'pluck', bar, form: HOUSE_FORM({ prog: EMOTIONAL, pat: { bass: 'bhA' } }),
      parts: { drums: KIT('Lost Love · Sunrise Under Water', 'House · Melodic House'), bass: SUB(['Club · Deep House Sub', 'Deep Sine']), pad: PAD(['Underwater', 'Her Essence', 'EDM Pad · Deep House Organ Pad']),
        pluck: { role: 'lead', organism: 'eravos.supersaw', preset: ['Monstercat Pluck', 'Trance Pluck'], octave: 5, name: 'Pluck' }, lead: { role: 'lead', organism: 'eravos.pad-forge', preset: 'Celestial Glass', octave: 5, riser: true, name: 'Glass' } },
      fx: [{ organism: 'eravos.fx-filter', preset: 'Muffled Intro', on: 'pad' }, { organism: 'eravos.fx-echo', preset: 'Future Pluck Echo', on: 'pluck' }, { organism: 'eravos.sidechain-compressor', preset: 'Club · House Pump 1/4 (deep)', on: 'fx0' }],
      mods: HER, master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.24 } },

    // A progressive — LL2 / LL6: long builds, a choir pad, the last peak lifts toward the relative major
    { id: 'll-prog', label: 'Lost Love · Progressive (heaven, the long way)', icon: '🌅', accent: '#ffb74d', family: 'Lost Love', bpm: [124, 126], ...HER_KEYS, progs: [HEARTBREAK, EMOTIONAL],
      tagline: 'Long builds, a choir pad, a big-room heart; the last peak lifts toward the light',
      drums: { main: HOUSE, light: HOUSE_LIGHT, strip: HOUSE_STRIP }, leadRhythm: 'anthem', bar, form: HOUSE_FORM({ prog: HEARTBREAK, pat: { bass: 'bhB' }, lift: 2 }),
      parts: { drums: KIT('Lost Love · Heaven Takes the Long Way', 'House · Progressive Drive'), bass: SUB(['Club · Deep House Sub', 'Garage Punch']), pad: PAD(['EDM Pad · Euphoric Choir', 'EDM Pad · Progressive Air', 'Golden Hour Strings']),
        pluck: { role: 'lead', organism: 'eravos.supersaw', preset: ['Monstercat Pluck', 'Chord Stab (triad)'], octave: 5, name: 'Stabs' }, lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Euphoric Lead', 'Festival Lead'], octave: 5, riser: true, name: 'Lead' } },
      fx: [{ organism: 'eravos.sidechain-compressor', preset: ['Classic 1/4 Pump', 'Club · House Pump 1/4 (deep)'], on: 'pad' }, { organism: 'eravos.fx-echo', preset: 'Ping-pong 1/8.', on: 'lead' }],
      mods: HER, master: { compThresh: -10, compRatio: 2.5, reverbMix: 0.22 } },

    // B synthwave — LL3: straight-8th drive, gated snare, arp; the last chorus lifts
    { id: 'll-drive', label: 'Lost Love · Night Drive (synthwave)', icon: '🌆', accent: '#ff4081', family: 'Lost Love', bpm: [100, 108], ...HER_KEYS, progs: [EMOTIONAL, [1, 6, 3, 7]],
      tagline: 'Straight-8th bass, gated snare, an arpeggio in the rear-view; the last chorus lifts',
      drums: { main: DRIVE, light: DRIVE_LIGHT, strip: { snare: '....X.......X...' } }, leadRhythm: 'anthem', bar, form: SONG_FORM({ prog: EMOTIONAL }),
      parts: { drums: KIT('Lost Love · Fly Back to Me (80s)', 'Retro Machines · Synthwave Gated'), bass: { role: 'bass', organism: 'eravos.retro-poly', preset: ['80s · Miami Night Bass', 'Synthwave Bass (arp)'], configure: { arp: 'off' }, style: 'pulse8', name: 'Drive bass' },
        pad: PAD(['Neon Juno Pad', '80s · Vangelis Glass'], { voicing: 'triad' }), pluck: { role: 'lead', organism: 'eravos.retro-poly', preset: ['80s · Stranger Arp', 'Arp Pluck'], octave: 5, name: 'Arp' },
        lead: { role: 'lead', organism: 'eravos.retro-poly', preset: ['Outrun Lead', '80s · Neon Sync Lead'], configure: { arp: 'off' }, octave: 5, name: 'Lead' } },
      fx: [{ organism: 'eravos.fx-echo', preset: '80s · Dotted Synthwave Delay', on: 'lead' }],
      mods: HER, master: { compThresh: -11, compRatio: 2.5, reverbMix: 0.2 } },

    // B dark — LL4: cold darkwave, flanged bass, spoken words in the verse
    { id: 'll-ruin', label: 'Lost Love · Sweet Ruin (darkwave)', icon: '🖤', accent: '#9575cd', family: 'Lost Love', bpm: [108, 112], ...HER_KEYS, progs: [HEARTBREAK, [1, 1, 6, 7]],
      tagline: 'Cold darkwave: a flanged bass line, post-punk drums, her spoken words in the verse',
      drums: { main: COLD, light: { hat: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...' }, strip: { kick: 'X.......X.......' } }, leadRhythm: 'sparse', bar, form: SONG_FORM({ prog: HEARTBREAK }),
      parts: { drums: KIT('Lost Love · Sweet Ruin (Dark)', 'Retro Machines · Darkwave Cold'), bass: { role: 'bass', organism: 'eravos.reese-bass', preset: ['Neuro Flange', '80s · Tron Grid Bass'], style: 'pulse8', name: 'Flanged bass' },
        pad: PAD(['Dark Choir', '80s · Cassette Choir'], { voicing: 'triad' }), pluck: { role: 'lead', organism: 'eravos.retro-poly', preset: ['Darksynth Saw', "80s · Gated Stab '85"], configure: { arp: 'off' }, octave: 4, name: 'Stabs' },
        lead: { role: 'lead', organism: 'eravos.organ', preset: ['Vampire Ballroom', 'Eerie Celeste'], octave: 5, name: 'Organ' } },
      fx: [{ organism: 'eravos.fx-echo', preset: "80s · Gated Slap '84", on: 'pluck' }],
      mods: HER, master: { compThresh: -11, compRatio: 2.5, reverbMix: 0.18 } },

    // C cinematic trap — LL5: half-time, sliding 808s, choir and glass swells, an intimate dry voice
    { id: 'll-flaws', label: 'Lost Love · Flaws (cinematic half-time)', icon: '🕯', accent: '#ef5350', family: 'Lost Love', bpm: [138, 142], ...HER_KEYS, progs: [HEARTBREAK, [1, 6, 4, 5]],
      tagline: 'Half-time 70/140: sliding 808s, rolling hats, choir swells — an intimate dry voice against a huge space',
      drums: { main: TRAP, light: TRAP_LIGHT, strip: { hat: 'x...x...x...x...' } }, leadRhythm: 'sparse', bar,
      form: SONG_FORM({ prog: HEARTBREAK }).map(s => s.name === 'break' ? Object.assign({}, s, { play: ['pad', 'lead'] }) : s),
      parts: { drums: KIT('Lost Love · Flaws (Half-Time)', 'Trap, Phonk & Dancehall · Trap 808 Glide'), bass: SUB(['808 Long Slide', '808 Boom'], '808', { name: '808' }), pad: PAD(['Dark Choir', 'EDM Pad · Cinematic Drop Pad', 'Frozen Halo (hold)'], { voicing: 'triad' }),
        pluck: { role: 'lead', organism: 'eravos.pad-forge', preset: ['Celestial Glass', 'EDM Pad · Glass Pluck Pad'], octave: 5, name: 'Glass' }, lead: { role: 'lead', organism: 'eravos.coven', preset: ['Ritual Bell', 'Crystal Coven'], octave: 5, name: 'Bell' } },
      fx: [{ organism: 'eravos.fx-echo', preset: ['Dub Throw', 'Infinite Freeze'], on: 'lead' }],
      mods: HER, master: { compThresh: -10, compRatio: 3, reverbMix: 0.2 } },

    // D × A — LL7: sweet and sinister plucks over soft house (string-like plucks until strings exist)
    { id: 'll-lullaby', label: 'Lost Love · Lullaby (sweet & sinister)', icon: '🎻', accent: '#81c784', family: 'Lost Love', bpm: [116, 120], ...HER_KEYS, progs: [[1, 6, 1, 7], EMOTIONAL],
      tagline: 'Bright, strange plucks stacked like a looped violin, over soft house — sweet on top, sinister underneath',
      drums: { main: HOUSE, light: HOUSE_LIGHT, strip: HOUSE_STRIP }, leadRhythm: 'pluck', bar, form: HOUSE_FORM({ prog: [1, 6, 1, 7], pat: { bass: 'pulse8' } }),
      parts: { drums: KIT('House · Melodic House', 'Lost Love · Sunrise Under Water'), bass: SUB(['Deep Sine', 'Club · Deep House Sub']), pad: PAD(['Golden Hour Strings', 'EDM Pad · Illenium Strings']),
        pluck: { role: 'lead', organism: 'eravos.retro-poly', preset: ['Arp Pluck', '80s · Stranger Arp'], octave: 5, name: 'Plucks' }, lead: { role: 'lead', organism: 'eravos.coven', preset: ['Crystal Coven', 'Ritual Bell'], octave: 6, riser: true, name: 'Music box' } },
      fx: [{ organism: 'eravos.fx-echo', preset: 'Ping-pong 1/8.', on: 'pluck' }, { organism: 'eravos.sidechain-compressor', preset: 'Subtle Glue', on: 'pad' }],
      mods: HER, master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.22 } },

    // F × A — LL8: house verses, then the drop goes half-time with a talking wobble (her name in the break)
    { id: 'll-raven', label: 'Lost Love · Raven Drop (house → half-time)', icon: '🐦‍⬛', accent: '#ff2266', family: 'Lost Love', bpm: [122, 126], ...HER_KEYS, progs: [EMOTIONAL, HEARTBREAK],
      tagline: 'Melodic house verses, then the floor drops to half-time and the wobble talks; her voice in the break',
      drums: { main: HOUSE, light: HOUSE_LIGHT, half: HALF, strip: HOUSE_STRIP }, leadRhythm: 'anthem', bar,
      form: [S('intro', 'intro', 8, ['pad', 'drums'], { drums: 'light' }), S('verse', 'verse', 16, ['drums', 'bass', 'pad', 'pluck'], { prog: EMOTIONAL }),
        S('build', 'build', 8, ['pad', 'drums', 'lead'], { prog: [6, 6, 7, 7, 4, 4, 5, 5] }), S('pause', 'pause', 1, ['pad'], { prog: [5] }),
        S('drop', 'drop', 16, ['drums', 'bass', 'wub', 'pad'], { drums: 'half', pat: { bass: 'sub', wub: ['yoi', 'wub', 'yoi', 'wubHi'] } }),
        S('break', 'break', 8, ['pad'], { prog: EMOTIONAL }), S('verse 2', 'verse', 8, ['drums', 'bass', 'pad', 'pluck'], { prog: EMOTIONAL }),
        S('build 2', 'build', 8, ['pad', 'drums', 'lead'], { prog: [6, 6, 7, 7, 4, 4, 5, 5] }), S('pause 2', 'pause', 1, ['pad'], { prog: [5] }),
        S('drop 2', 'drop', 16, ['drums', 'bass', 'wub', 'pad', 'lead'], { drums: 'half', lift: 2, pat: { bass: 'sub', wub: ['yoi', 'tri', 'wubHi', 'gunroll'] } }),
        S('outro', 'outro', 8, ['pad', 'drums'], { drums: 'light' })],
      parts: { drums: KIT('House · Melodic House', 'Lost Love · Heaven Takes the Long Way'), bass: SUB(['Dubstep Sub Layer', 'Club · Deep House Sub'], 'offbeat'),
        wub: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Wide Melodic Wub', 'Yoi Talker', 'Monstercat Wub 1/4'], style: 'half', name: 'Wub' },
        pad: PAD(['Her Essence', 'EDM Pad · Melodic Dubstep Halo', 'Golden Hour Strings']), pluck: { role: 'lead', organism: 'eravos.supersaw', preset: ['Monstercat Pluck', 'Trance Pluck'], octave: 5, name: 'Pluck' },
        lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Euphoric Lead', 'Festival Lead'], octave: 5, riser: true, name: 'Lead' } },
      fx: [{ organism: 'eravos.fx-echo', preset: 'Future Pluck Echo', on: 'pluck' }, { organism: 'eravos.sidechain-compressor', preset: 'Classic 1/4 Pump', on: 'pad' }],
      mods: HER, master: { compThresh: -10, compRatio: 3, reverbMix: 0.18 } },

    // A minimal — LL9: no kick, breath tempo, her spoken recording over pads
    { id: 'll-heartbeat', label: 'Lost Love · Heartbeat Only (no kick)', icon: '🫀', accent: '#f48fb1', family: 'Lost Love', bpm: [72, 86], ...HER_KEYS, progs: [EMOTIONAL, [1, 4, 6, 5]],
      tagline: 'No kick. Pads that breathe, a sub like a heartbeat, a glass melody — room for her whole recording',
      drums: { main: BREATH, light: { shaker: 'o.......o.......' }, strip: BREATH }, leadRhythm: 'sparse', bar,
      form: [S('first light', 'intro', 8, ['pad']), S('heartbeat', 'verse', 16, ['pad', 'bass', 'drums'], { prog: EMOTIONAL, pat: { bass: 'dubsub' } }),
        S('her words', 'break', 16, ['pad'], { prog: EMOTIONAL }), S('glass', 'chorus', 16, ['pad', 'bass', 'drums', 'lead'], { prog: EMOTIONAL, pat: { bass: 'dubsub' } }),
        S('still here', 'chorus', 16, ['pad', 'bass', 'drums', 'lead'], { prog: EMOTIONAL, lift: 2, pat: { bass: 'drone' } }), S('last breath', 'outro', 8, ['pad'])],
      parts: { drums: KIT('Lost Love · Heartbeat Only', 'Cinematic & Lo-fi · Ambient Glass'), bass: SUB(['Deep Sine', 'Phone-Speaker Sub'], 'drone', { name: 'Heartbeat' }), pad: PAD(['Her Essence', 'Frozen Halo (hold)', 'Celestial Glass']),
        lead: { role: 'lead', organism: 'eravos.pad-forge', preset: ['EDM Pad · Glass Pluck Pad', 'Celestial Glass'], octave: 5, name: 'Glass' } },
      fx: [{ organism: 'eravos.fx-echo', preset: ['Infinite Freeze', 'Dub Throw'], on: 'lead' }],
      mods: HER, master: { compThresh: -14, compRatio: 2, reverbMix: 0.3 } },

    // all families — LL10: from the heavy, dark start to the bright, lifted end
    { id: 'll-last-light', label: 'Lost Love · Last Light (every family)', icon: '🕊', accent: '#fff59d', family: 'Lost Love', bpm: [120, 124], ...HER_KEYS, progs: [HEARTBREAK, EMOTIONAL],
      tagline: 'Starts heavy and dark, ends bright and lifted: half-time to house to the last, highest chorus',
      drums: { main: HOUSE, light: HOUSE_LIGHT, half: HALF, strip: HOUSE_STRIP }, leadRhythm: 'anthem', bar,
      form: [S('dark', 'intro', 8, ['pad', 'drums'], { drums: 'half', prog: HEARTBREAK }), S('weight', 'verse', 16, ['drums', 'bass', 'pad'], { drums: 'half', prog: HEARTBREAK, pat: { bass: 'sub' } }),
        S('turning', 'build', 8, ['pad', 'drums', 'lead'], { prog: [6, 6, 7, 7, 4, 4, 5, 5] }), S('first light', 'drop', 16, ['drums', 'bass', 'pad', 'pluck', 'lead'], { prog: EMOTIONAL, pat: { bass: 'bhA' } }),
        S('her words', 'break', 8, ['pad'], { prog: EMOTIONAL }), S('rising', 'build', 8, ['pad', 'drums', 'lead'], { prog: [6, 6, 7, 7, 4, 4, 5, 5] }), S('held', 'pause', 1, ['pad'], { prog: [5] }),
        S('last light', 'drop', 16, ['drums', 'bass', 'pad', 'pluck', 'lead'], { prog: EMOTIONAL, lift: 4, pat: { bass: 'bhB' } }), S('after', 'outro', 8, ['pad', 'lead'], { drums: 'light' })],
      parts: { drums: KIT('Lost Love · Heaven Takes the Long Way', 'Lost Love · Sunrise Under Water'), bass: SUB(['Club · Deep House Sub', 'Dubstep Sub Layer']), pad: PAD(['EDM Pad · Euphoric Choir', 'Golden Hour Strings', 'Her Essence']),
        pluck: { role: 'lead', organism: 'eravos.supersaw', preset: ['Monstercat Pluck', 'Trance Pluck'], octave: 5, name: 'Pluck' }, lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Euphoric Lead', 'Festival Lead'], octave: 5, riser: true, name: 'Lead' } },
      fx: [{ organism: 'eravos.sidechain-compressor', preset: 'Classic 1/4 Pump', on: 'pad' }, { organism: 'eravos.fx-echo', preset: 'Ping-pong 1/8.', on: 'lead' }],
      mods: HER, master: { compThresh: -10, compRatio: 2.5, reverbMix: 0.22 } },
  ];
  GENRES.forEach(g => SE.addGenre(Object.assign(g, { voice: true })));   // 3.41: they sing with her recordings (data/her-voice.js)

  // ---------------------------------------------------------------- what to listen for, and where her voice goes, per genre
  const HOWTO = 'Her recordings from Songs → 🎤 Her voice land on the timeline by themselves; for more, drop a clip into Clip Maker, trim it, Send → the Sample player.';
  const NOTES = {
    'll-deep': { listen: 'Soft four-on-the-floor; the pad starts muffled, like hearing it under water, and the peak opens it up.', drop: 'The peak: the pump, the pluck echo and the glass lead arrive together; peak 2 lifts two steps.', voice: 'Her clip in the break, alone over the pad, then once more right before peak 2. ' + HOWTO },
    'll-prog': { listen: 'Long builds, a choir pad, stabs that pump with the kick.', drop: 'One held beat, then the lead; the last peak lifts toward the light.', voice: 'Her words in the break and in the held beat before the last peak. ' + HOWTO },
    'll-drive': { listen: 'Straight-8th bass, gated snare, an arpeggio like streetlights passing.', drop: 'No hard drop: the chorus lifts with the lead; the last chorus goes two steps higher.', voice: 'Her voice low and wide under the chorus, or alone in the break. ' + HOWTO },
    'll-ruin': { listen: 'Cold drums, a flanged bass line, gated stabs and an organ answering.', drop: 'The chorus opens the organ; chorus 2 lifts.', voice: 'Spoken, dry and close in the verses — right on the beat. ' + HOWTO },
    'll-flaws': { listen: 'Half-time: sliding 808s, rolling hats, choir and glass swells, a bell.', drop: 'The chorus brings the bell and the glass; the break is only the choir and the bell.', voice: 'Her clip dry and intimate in the break — the space is huge, she is close. ' + HOWTO },
    'll-lullaby': { listen: 'Bright plucks stacked like a looped violin, a music box on top, soft house underneath.', drop: 'The peak brings everything in; peak 2 lifts.', voice: 'Her clip through the Sample’s Melodic voice in the break, like another loop. ' + HOWTO },
    'll-raven': { listen: 'Melodic house verses; then one held beat and the floor drops to half-time under a talking wobble.', drop: 'Drop 2 lifts and ends on a machine-gun roll.', voice: 'Her name or her line in the held beat before each drop, and alone in the break. ' + HOWTO },
    'll-heartbeat': { listen: 'No kick: pads that breathe, a sub like a heartbeat, a glass melody.', drop: 'No drop — the glass melody arrives, then lifts in the last section.', voice: 'Her whole recording fits in “her words” — 16 bars of just the pad. ' + HOWTO },
    'll-last-light': { listen: 'It starts heavy and half-time, turns, and becomes bright house.', drop: '“First light” is the turn; “last light” lifts four steps — the highest the song goes.', voice: 'Her words in the break and in the held beat before the last light. ' + HOWTO },
  };
  // [id, title, genre, seed, moods] — LL1–LL10 first (spec order), then more in each family
  const SHELF = [
    ['ll1', 'Sunrise Under Water', 'll-deep', 101, ['her', 'warm', 'calm']], ['ll2', 'Heaven Takes the Long Way', 'll-prog', 102, ['her', 'warm']],
    ['ll3', 'Fly Back to Me', 'll-drive', 103, ['her', '80s', 'warm']], ['ll4', 'Sweet Ruin', 'll-ruin', 104, ['her', 'dark', 'goth']],
    ['ll5', 'Flaws', 'll-flaws', 105, ['her', 'dark', 'heavy']], ['ll6', 'More Than You Knew', 'll-prog', 106, ['her', 'party', 'warm']],
    ['ll7', 'Antichrist Lullaby', 'll-lullaby', 107, ['her', 'dark', 'calm']], ['ll8', 'Raven Drop', 'll-raven', 108, ['her', 'heavy']],
    ['ll9', 'Heartbeat Only', 'll-heartbeat', 109, ['her', 'calm']], ['ll10', 'Last Light', 'll-last-light', 110, ['her', 'warm', 'heavy']],
    ['ll-d2', 'Tide Lines', 'll-deep', 201, ['her', 'calm']], ['ll-d3', 'Blue Hour Pulse', 'll-deep', 202, ['her', 'warm']], ['ll-d4', 'Breathing Under', 'll-deep', 203, ['her', 'calm']],
    ['ll-d5', 'Salt in the Light', 'll-deep', 204, ['her', 'warm']], ['ll-d6', 'Surface', 'll-deep', 205, ['her', 'warm', 'party']],
    ['ll-p2', 'Hold the Last Chord', 'll-prog', 301, ['her', 'warm']], ['ll-p3', 'Somewhere Brighter', 'll-prog', 302, ['her', 'party']], ['ll-p4', 'Choir of Two', 'll-prog', 303, ['her', 'warm']],
    ['ll-p5', 'Arms Wide at Dawn', 'll-prog', 304, ['her', 'party', 'warm']], ['ll-p6', 'The Long Way Home', 'll-prog', 305, ['her', 'warm']],
    ['ll-r2', 'Rear-View Neon', 'll-drive', 401, ['her', '80s']], ['ll-r3', 'Outrun the Morning', 'll-drive', 402, ['her', '80s', 'warm']], ['ll-r4', 'Coastline 1986', 'll-drive', 403, ['her', '80s']],
    ['ll-r5', 'Headlights on Her', 'll-drive', 404, ['her', '80s', 'warm']], ['ll-r6', 'Last Exit Kiss', 'll-drive', 405, ['her', '80s', 'dark']],
    ['ll-k2', 'Velvet Wreck', 'll-ruin', 501, ['her', 'dark', 'goth']], ['ll-k3', 'Cold Ballroom Letters', 'll-ruin', 502, ['her', 'dark', '80s']], ['ll-k4', 'Beautiful Ruin', 'll-ruin', 503, ['her', 'dark', 'goth']],
    ['ll-k5', 'Black Lace Static', 'll-ruin', 504, ['her', 'dark', 'goth']], ['ll-k6', 'Ruin, Softly', 'll-ruin', 505, ['her', 'dark']],
    ['ll-f2', 'Sins in Slow Motion', 'll-flaws', 601, ['her', 'dark', 'heavy']], ['ll-f3', 'Glass Halo 808', 'll-flaws', 602, ['her', 'heavy']], ['ll-f4', 'Through the Spider Web', 'll-flaws', 603, ['her', 'dark', 'heavy']],
    ['ll-f5', 'Choir for One', 'll-flaws', 604, ['her', 'dark']], ['ll-f6', 'Weightless Fall', 'll-flaws', 605, ['her', 'heavy']],
    ['ll-l2', 'Music Box Heart', 'll-lullaby', 701, ['her', 'calm']], ['ll-l3', 'Sweet Little Monster', 'll-lullaby', 702, ['her', 'dark']], ['ll-l4', 'Strings Made of Light', 'll-lullaby', 703, ['her', 'warm']],
    ['ll-l5', 'Loop of You', 'll-lullaby', 704, ['her', 'warm', 'calm']], ['ll-l6', 'Wicked Lullaby', 'll-lullaby', 705, ['her', 'dark']],
    ['ll-v2', 'Raven, Wings Down', 'll-raven', 801, ['her', 'heavy']], ['ll-v3', 'Feather to Floor', 'll-raven', 802, ['her', 'heavy', 'party']], ['ll-v4', 'Dark Bird Rising', 'll-raven', 803, ['her', 'heavy', 'dark']],
    ['ll-v5', 'Her Name in the Drop', 'll-raven', 804, ['her', 'heavy', 'party']], ['ll-v6', 'Midnight Wings', 'll-raven', 805, ['her', 'heavy', 'dark']],
    ['ll-h2', 'Still Here', 'll-heartbeat', 901, ['her', 'calm']], ['ll-h3', 'Two Heartbeats', 'll-heartbeat', 902, ['her', 'calm', 'warm']], ['ll-h4', 'Pillow Talk Glass', 'll-heartbeat', 903, ['her', 'calm']],
    ['ll-h5', 'Breathe In, Breathe You', 'll-heartbeat', 904, ['her', 'calm']], ['ll-h6', 'Quiet Room', 'll-heartbeat', 905, ['her', 'calm', 'warm']],
    ['ll-t2', 'Dark to Dawn', 'll-last-light', 1001, ['her', 'heavy', 'warm']], ['ll-t3', 'Turning Point', 'll-last-light', 1002, ['her', 'warm']], ['ll-t4', 'Every Colour of You', 'll-last-light', 1003, ['her', 'warm', 'party']],
    ['ll-t5', 'From the Bottom Up', 'll-last-light', 1004, ['her', 'heavy', 'warm']], ['ll-t6', 'Morning After Everything', 'll-last-light', 1005, ['her', 'warm']],
  ];
  const SONGS = SHELF.map(([id, title, genre, seed, mood]) => Object.assign({ id, title, genre, seed, mood }, NOTES[genre]));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.LostLoveSongbook = { genres: GENRES.map(g => g.id), songs: SONGS.map(s => s.id) };
})();
