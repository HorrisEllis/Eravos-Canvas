/* ERAVOS "Odd Couples" songbook (3.41) — data only. "make as creative songs as possible — the tools that normally go nowhere
 * near together." Twelve Song Engine genres, each built on a pairing that should not work: a cathedral organ over a riddim
 * wub rig, a 303 at a séance, golden-ratio bells over a dub sound system, a music box over tearout …  and the songs in them.
 *   oc-cathedral-riddim · oc-acid-seance · oc-golden-dub · oc-lullaby-tearout · oc-synthwave-steppers · oc-breathing-dnb
 *   oc-spectral-trap · oc-funeral-dancehall · oc-glitch-gospel · oc-xen-wobble · oc-machine-choir · oc-hanging-dub
 * Every tool in the music domain plays a part somewhere (a lane, an insert, a modulator or a follower), most of them with a
 * preset from its own "Odd Couples" pack (build/odd-couples.mjs). Every song opens her voice rig: a Clip Maker wired into a
 * Sample player (the break) AND into the Drop Builder — her clip lands on the drop and everything else dips under it
 * (Drop Builder 3.1 · "Her voice on top"). Bars come from the Bass Pack writer, so the Bass Pack loads first. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const tear = SE.genres().find(g => g.id === 'tearout'), bar = tear && tear.bar;   // the Bass Pack bar writer
  if (!bar) return;

  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const CLIMB = [6, 6, 7, 7, 4, 4, 5, 5];
  const KIT = (p, alt) => ({ role: 'drums', organism: 'eravos.pads', preset: alt ? [p, alt] : p, name: 'Drums' });
  const FORGE = (p) => ({ role: 'drums', organism: 'eravos.drum-forge', preset: p, name: 'Forge' });
  const O = (name) => 'Odd · ' + name;   // this songbook's own presets (each tool's Odd Couples pack)
  // her voice rig: Clip Maker → Sample player (plays her clip in the break) and → Drop Builder (lands it on the drop, on top)
  const HER = (drop) => [
    { organism: 'eravos.clip-maker', preset: O('Her words (tight)') },
    { organism: 'eravos.sample-player', preset: [O('Her Voice · Up Front'), O('Her Voice · Chopped Triplets')], wireFrom: ['mod0', 'clip.hook.asset_out'], wireTo: 'samp.hook.asset_in' },
    { organism: 'eravos.bass-drop-builder', preset: drop || O('Cathedral Drop'), wireFrom: ['mod0', 'clip.hook.asset_out'], wireTo: 'drop.hook.asset_in' },
  ];

  // ---------------------------------------------------------------- drum grids (16 steps: X loud · x normal · o ghost)
  const HALF = { kick: 'X.....x...x.....', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.x.x.x.', ohat: '..............x.' };
  const HALF_LIGHT = { kick: 'X.......X.......', hat: 'x...x...x...x...' };
  const STEPPERS = { kick: 'X...X...X...X...', snare: '........X.......', rim: '..x...x...x...x.', hat: 'x.x.x.x.x.x.x.x.', ohat: '..x.......x.....' };
  const ONEDROP = { kick: '........X.......', snare: '........X.......', rim: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' };
  const DEMBOW = { kick: 'X...X...X...X...', snare: '...x..x....x..x.', hat: 'x.x.x.x.x.x.x.x.', perc: '..o.......o.....' };
  const TRAP = { kick: 'X.........X.....', snare: '........X.......', clap: '........x.......', hat: 'x.x.x.x.x.xxx.xx' };
  const DNB = { kick: 'X.........x.X...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.', ohat: '..x.......x.....', shaker: 'oooooooooooooooo' };
  const HOUSE = { kick: 'X...X...X...X...', clap: '....x.......x...', hat: '..x...x...x...x.', shaker: 'oooooooooooooooo' };
  const UKG = { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.x.x.xox.x.x.xo', shaker: 'oooooooooooooooo' };
  const SPARSE = { kick: 'X.......X.......', perc: '......o.......o.' };

  // the drop arc every Odd Couple shares: intro → verse → build → pause → DROP (the Drop Builder fires here, her clip on top)
  // → switch → break (her voice, the Sample player) → build 2 → pause → drop 2 lifted → outro
  const ODD = (o) => [
    S('intro', 'intro', 8, o.intro, { drums: 'light' }),
    S('verse', 'verse', 16, o.verse, { prog: o.prog }),
    S('build', 'build', 8, o.build, { prog: CLIMB }),
    S('pause', 'pause', 1, o.pause || ['pad'], { prog: [5] }),
    S('drop', 'drop', 16, o.drop, { prog: o.prog, pat: o.pat1 }),
    S('switch', 'chorus', 8, o.sw || o.drop, { drums: o.swDrums || 'main', prog: o.prog, pat: o.patSw || o.pat1 }),
    S('her words', 'break', 8, o.brk || ['pad'], { prog: o.prog }),
    S('build 2', 'build', 8, o.build, { prog: CLIMB }),
    S('pause 2', 'pause', 1, o.pause || ['pad'], { prog: [5] }),
    S('drop 2', 'drop', 16, o.drop2 || o.drop, { prog: o.prog, lift: o.lift === undefined ? 2 : o.lift, pat: o.pat2 || o.pat1 }),
    S('outro', 'outro', 8, o.outro || o.intro, { drums: 'light' }),
  ];

  const GENRES = [
    // 1 — a church organ over the modular riddim wub rig. Organ chops in 1/16 triplets lock with the riddim stair.
    { id: 'oc-cathedral-riddim', label: 'Odd Couples · Cathedral Riddim', icon: '⛪', accent: '#b388ff', family: 'Odd Couples', bpm: [140, 140], roots: [4, 11], scales: ['phrygian', 'harmonic_minor'], progs: [[1, 1, 6, 2], [1, 7, 6, 2]],
      tagline: 'Gothic organ chords chopped in triplets over a riddim wub rig; a dub chamber swallows the organ in the break',
      drums: { main: HALF, light: HALF_LIGHT }, leadRhythm: 'sparse', bar,
      form: ODD({ intro: ['organ', 'drums'], verse: ['drums', 'organ', 'sub'], build: ['organ', 'drums', 'lead'], drop: ['drums', 'forge', 'wub', 'organ', 'sub'], pat1: { wub: ['stair', 'stairB', 'stair', 'tri'], sub: 'sub' },
        sw: ['drums', 'wub', 'sub'], patSw: { wub: ['bounce', 'bounceB'], sub: 'sub' }, brk: ['organ'], pat2: { wub: ['stairB', 'tri', 'stair', 'gunroll'], sub: 'sub' } }),
      parts: { drums: KIT(O('Cathedral Riddim'), 'Bass Music · Riddim Steel'), forge: FORGE(O('Chapel Dancehall')), wub: { role: 'bass', organism: 'eravos.wub-osc', preset: O('Cathedral FM'), style: 'half', name: 'Wub' },
        sub: { role: 'bass', organism: 'eravos.sub-engine', preset: O('Cathedral Floor'), style: 'half', name: 'Sub' },
        organ: { role: 'chords', organism: 'eravos.organ', preset: [O('Cathedral Riddim Organ'), O('Funeral Dancehall')], style: 'sustain', voicing: 'triad', octave: 4, name: 'Organ' },
        lead: { role: 'lead', organism: 'eravos.curve-synth', preset: O('Falling Coin'), octave: 5, name: 'Coin' } },
      fx: [{ organism: 'eravos.wub-filter', preset: O('Chapel Comb'), on: 'wub' }, { organism: 'eravos.dub-station', preset: O('Cathedral Sound System'), on: 'organ' }, { organism: 'eravos.fx-haunt', preset: O('Chapel Tape'), on: 'fx1' }],
      mods: HER(O('Cathedral Drop')).concat([{ organism: 'eravos.wub-rate', preset: O('Riddim Requiem Rate'), to: 'fx0', key: 'wub' }, { organism: 'eravos.wub-sub', preset: O('Cathedral Sub') }, { organism: 'eravos.fx-box', preset: O('Chapel Hits') }]),
      master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.24 } },

    // 2 — a 303 at a séance: an acid line under a chanting coven, witch-house trap drums, a pull-up rewind
    { id: 'oc-acid-seance', label: 'Odd Couples · Acid Séance', icon: '🕯️', accent: '#76ff03', family: 'Odd Couples', bpm: [126, 130], roots: [1, 6], scales: ['minor', 'phrygian'], progs: [[1, 6, 1, 7], [1, 2, 1, 7]],
      tagline: 'A squelching 303 under a chanting coven choir; the séance answers on a phone line, the drop rewinds',
      drums: { main: TRAP, light: SPARSE }, leadRhythm: 'synth', bar,
      form: ODD({ intro: ['choir', 'drums'], verse: ['drums', 'acid', 'choir'], build: ['choir', 'drums', 'arp'], drop: ['drums', 'acid', 'choir', 'arp', 'sub'], pat1: { sub: 'sub' }, brk: ['choir'] }),
      parts: { drums: KIT(O('Séance Trap'), 'Trap, Phonk & Dancehall · Phonk Cowbell'), acid: { role: 'bass', organism: 'eravos.acid-synth', preset: [O('Séance Squelch'), O('Dancehall Acid Stab')], style: 'acid', name: '303' },
        sub: { role: 'bass', organism: 'eravos.sub-engine', preset: O('Séance 808'), style: '808', name: '808' },
        choir: { role: 'chords', organism: 'eravos.coven', preset: O('Séance Over 303'), style: 'sustain', voicing: 'triad', octave: 4, name: 'Coven' },
        arp: { role: 'lead', organism: 'eravos.retro-poly', preset: O('Acid Arp Chapel'), octave: 5, name: 'Arp' } },
      fx: [{ organism: 'eravos.fx-haunt', preset: O('Séance Phone'), on: 'choir' }, { organism: 'eravos.fx-filter', preset: O('Acid Auto-Wah'), on: 'arp' }, { organism: 'eravos.dub-station', preset: O('Acid Rewind'), on: 'acid' }],
      mods: HER(O('Steppers Pull-up')).concat([{ organism: 'eravos.ratio-lattice', preset: O('Séance Lattice') }, { organism: 'eravos.breath', preset: O('Séance Breath') }]),
      master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.22 } },

    // 3 — golden-ratio bells over a dub sound system: not 12-tone on purpose; a φ siren and a just-intonation drone under it
    { id: 'oc-golden-dub', label: 'Odd Couples · Golden Dub', icon: '🌀', accent: '#ffd54f', family: 'Odd Couples', bpm: [72, 78], roots: [9, 2], scales: ['minor', 'dorian'], progs: [[1, 4, 1, 4], [1, 7, 6, 7]],
      tagline: 'Golden-ratio bells (not 12-tone) over a one-drop sound system; a siren wailing at φ Hz and a just drone underneath',
      drums: { main: ONEDROP, light: { rim: '....x.......x...', hat: 'x...x...x...x...' } }, leadRhythm: 'sparse', bar,
      form: ODD({ intro: ['skank', 'drums'], verse: ['drums', 'bass', 'skank'], build: ['skank', 'drums', 'bells'], drop: ['drums', 'bass', 'skank', 'bells', 'growl'], pat1: { growl: ['sub', 'dubsub'] }, brk: ['skank', 'bells'], lift: 0 }),
      parts: { drums: KIT('Breaks & World', O('Steppers Machine')), bass: { role: 'bass', organism: 'eravos.reese-bass', preset: O('Golden Reese'), style: 'onedrop', name: 'Bass' },
        skank: { role: 'chords', organism: 'eravos.pad-forge', preset: O('Dub Fog Bed'), style: 'skank', voicing: 'triad', octave: 4, name: 'Skank' },
        bells: { role: 'lead', organism: 'eravos.xen-synth', preset: O('Golden Dub Bells'), octave: 5, name: 'Golden bells' },
        growl: { role: 'bass', organism: 'eravos.bass-forge', preset: O('Golden Dub Growl'), style: 'half', name: 'Growl' } },
      fx: [{ organism: 'eravos.dub-station', preset: O('Golden Ratio Siren'), on: 'skank' }, { organism: 'eravos.fx-echo', preset: O('Golden Echo'), on: 'bells' }, { organism: 'eravos.fx-pitch', preset: O('Golden Fifth'), on: 'bells' }, { organism: 'eravos.fx-destroyer', preset: O('Golden Fold'), on: 'growl' }],
      mods: HER(O('Golden Gap')).concat([{ organism: 'eravos.ratio-lattice', preset: O('Dub Lattice Drone') }, { organism: 'eravos.lfo', preset: O('Golden LFO') }]),
      master: { compThresh: -12, compRatio: 2, reverbMix: 0.28 } },

    // 4 — a bouncing-ball music box over tearout: the sweetest sound in ERAVOS on top of the ugliest
    { id: 'oc-lullaby-tearout', label: 'Odd Couples · Lullaby Tearout', icon: '🧸', accent: '#f48fb1', family: 'Odd Couples', bpm: [150, 150], roots: [2, 7], scales: ['minor', 'harmonic_minor'], progs: [[1, 6, 4, 5], [1, 1, 6, 7]],
      tagline: 'A bouncing-ball music box and glass over tearout growls; the box keeps playing straight through the drop',
      drums: { main: HALF, light: HALF_LIGHT }, leadRhythm: 'pluck', bar,
      form: ODD({ intro: ['box', 'glass'], verse: ['drums', 'box', 'glass', 'sub'], build: ['box', 'drums', 'glass'], drop: ['drums', 'growl', 'box', 'sub'], pat1: { growl: ['wub', 'yoi', 'wubHi', 'gunroll'], sub: 'sub' },
        sw: ['drums', 'growl', 'wobble', 'sub'], patSw: { growl: ['bounce', 'bounceB'], wobble: ['wub', 'tri'], sub: 'sub' }, brk: ['box', 'glass'] }),
      parts: { drums: KIT('Bass Music · Tearout Concrete', 'Bass Music · Brostep Metal'), growl: { role: 'bass', organism: 'eravos.bass-forge', preset: O('Tearout Lullaby'), style: 'half', name: 'Tearout' },
        wobble: { role: 'bass', organism: 'eravos.wobble-bass', preset: O('Lullaby Wub'), style: 'half', name: 'Wobble' },
        sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Dubstep Sub Layer', style: 'half', name: 'Sub' },
        box: { role: 'lead', organism: 'eravos.curve-synth', preset: O('Music Box Bounce'), octave: 6, name: 'Music box' },
        glass: { role: 'chords', organism: 'eravos.pad-forge', preset: O('Lullaby Glass'), style: 'sustain', voicing: 'add9', octave: 5, name: 'Glass' } },
      fx: [{ organism: 'eravos.fx-phaser', preset: O('Lullaby Phase'), on: 'box' }, { organism: 'eravos.dub-station', preset: O('Lullaby Dub'), on: 'glass' }, { organism: 'eravos.sidechain-compressor', preset: O('Wobble Breathes With Kick'), on: 'wobble' }],
      mods: HER(O('Cathedral Drop')), master: { compThresh: -11, compRatio: 3, reverbMix: 0.18 } },

    // 5 — synthwave meets steppers dub: 80s brass and Juno bubble over a sound system, a triplet wobble in the drop
    { id: 'oc-synthwave-steppers', label: 'Odd Couples · Synthwave Steppers', icon: '🌴', accent: '#ff6e40', family: 'Odd Couples', bpm: [132, 136], roots: [5, 0], scales: ['minor', 'dorian'], progs: [[1, 6, 7, 1], [1, 4, 6, 5]],
      tagline: 'Juno keys as a reggae bubble, Miami brass answering dub sirens, steppers kicks — then a triplet wobble drop',
      drums: { main: STEPPERS, light: { kick: 'X...X...X...X...', hat: 'x.x.x.x.x.x.x.x.' } }, leadRhythm: 'anthem', bar,
      form: ODD({ intro: ['bubble', 'drums'], verse: ['drums', 'bubble', 'sub'], build: ['bubble', 'drums', 'brass'], drop: ['drums', 'wobble', 'bubble', 'brass', 'sub'], pat1: { wobble: ['wub', 'tri'], sub: 'sub' }, brk: ['bubble', 'pad'] }),
      parts: { drums: KIT(O('Steppers Machine'), 'Retro Machines · Synthwave Gated'), wobble: { role: 'bass', organism: 'eravos.wobble-bass', preset: O('Steppers Wobble'), style: 'half', name: 'Wobble' },
        sub: { role: 'bass', organism: 'eravos.sub-engine', preset: O('Steppers Sub'), style: 'onedrop', name: 'Sub' },
        bubble: { role: 'chords', organism: 'eravos.retro-poly', preset: O('Dub Juno Bubble'), style: 'bubble', voicing: 'triad', octave: 4, name: 'Bubble' },
        brass: { role: 'lead', organism: 'eravos.retro-poly', preset: O('Steppers Brass'), octave: 5, name: 'Brass' },
        pad: { role: 'chords', organism: 'eravos.supersaw', preset: O('Steppers Pluck'), style: 'stab', voicing: 'triad', octave: 5, name: 'Pluck' } },
      fx: [{ organism: 'eravos.dub-station', preset: O('Synthwave Steppers'), on: 'bubble' }, { organism: 'eravos.fx-echo', preset: O('Steppers Tape'), on: 'brass' }, { organism: 'eravos.fx-moddelay', preset: O('Steppers Flange'), on: 'drums' }, { organism: 'eravos.sidechain-compressor', preset: O('Steppers Pump 1/4'), on: 'pad' }],
      mods: HER(O('Steppers Pull-up')).concat([{ organism: 'eravos.wub-rate', preset: O('Steppers Switch') }, { organism: 'eravos.edm-lab', preset: O('Steppers Lab') }]),
      master: { compThresh: -11, compRatio: 2.5, reverbMix: 0.2 } },

    // 6 — a body-awareness drone that breathes, under a 174 drum & bass roller
    { id: 'oc-breathing-dnb', label: 'Odd Couples · Breathing Drum & Bass', icon: '🫁', accent: '#4dd0e1', family: 'Odd Couples', bpm: [172, 174], roots: [2, 7], scales: ['minor', 'dorian'], progs: [[1, 6, 3, 7], [1, 7, 6, 7]],
      tagline: 'The Embodiment Lab drone breathing once a bar under a 174 roller; a reese that breathes with it',
      drums: { main: DNB, light: { hat: 'x.x.x.x.x.x.x.x.', shaker: 'oooooooooooooooo' } }, leadRhythm: 'anthem', bar,
      form: ODD({ intro: ['drone', 'drums'], verse: ['drums', 'reese', 'drone'], build: ['drone', 'drums', 'lead'], drop: ['drums', 'reese', 'drone', 'lead', 'sub'], pat1: { reese: ['dnbroll', 'dnbroll', 'bounce', 'dnbroll'], sub: 'sub' }, brk: ['drone'] }),
      parts: { drums: KIT('Breaks & Jungle · DnB Roller', 'Breaks & Jungle · Jungle Pressure'), reese: { role: 'bass', organism: 'eravos.reese-bass', preset: O('Breathing Reese'), style: 'roll', name: 'Reese' },
        sub: { role: 'bass', organism: 'eravos.sub-engine', preset: O('Breath Sub'), style: 'offbeat', name: 'Sub' },
        drone: { role: 'chords', organism: 'eravos.embodiment-lab', preset: O('Breathing Drum & Bass'), style: 'sustain', voicing: 'triad', octave: 3, name: 'Body drone' },
        lead: { role: 'lead', organism: 'eravos.pad-forge', preset: O('Golden Orbit'), octave: 5, name: 'Halo' } },
      fx: [{ organism: 'eravos.fx-dynamics', preset: O('Breath Gate'), on: 'drone' }, { organism: 'eravos.fx-eq', preset: O('Make Room for Her'), on: 'reese' }],
      mods: HER(O('Golden Gap')).concat([{ organism: 'eravos.breath', preset: O('Drum & Bass Breath') }, { organism: 'eravos.recursive-spectra', preset: O('Breathing Spectrum') }, { organism: 'eravos.lfo', preset: O('Breath LFO (bar)') }]),
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.16 } },

    // 7 — a fractal spectrum drone under 808 trap: math music with a phone-speaker low end
    { id: 'oc-spectral-trap', label: 'Odd Couples · Spectral Trap', icon: '🔭', accent: '#7c4dff', family: 'Odd Couples', bpm: [140, 144], roots: [6, 1], scales: ['minor', 'phrygian'], progs: [[1, 6, 4, 5], [1, 1, 6, 7]],
      tagline: 'A recursive spectrum bell loop under sliding 808s and rolling hats; saws an octave under the choir',
      drums: { main: TRAP, light: { hat: 'x...x...x...x.x.', kick: 'X...............' } }, leadRhythm: 'sparse', bar,
      form: ODD({ intro: ['pad', 'drums'], verse: ['drums', 'sub', 'pad'], build: ['pad', 'drums', 'lead'], drop: ['drums', 'sub', 'pad', 'lead'], pat1: { sub: 'sub' }, brk: ['pad'] }),
      parts: { drums: KIT('Trap, Phonk & Dancehall · Trap 808 Glide', O('Séance Trap')), sub: { role: 'bass', organism: 'eravos.sub-engine', preset: O('Séance 808'), style: '808', name: '808' },
        pad: { role: 'chords', organism: 'eravos.syn-partials', preset: O('Spectral Glass Pad'), style: 'sustain', voicing: 'triad', octave: 4, name: 'Partials' },   // 3.43: drawn spectra evolving under the trap
        lead: { role: 'lead', organism: 'eravos.xen-synth', preset: O('Slendro Riddim Bells'), octave: 5, name: 'Slendro' } },
      fx: [{ organism: 'eravos.fx-pitch', preset: O('Octave Under the Choir'), on: 'pad' }, { organism: 'eravos.fx-glitch', preset: O('Gospel Stutter'), on: 'lead' }],
      mods: HER(O('Steppers Pull-up')).concat([{ organism: 'eravos.recursive-spectra', preset: O('Trap Spectrum Drone') }, { organism: 'eravos.harmonic-analyzer', preset: O('Organ + Wub (layers)') },
        { organism: 'eravos.particle-field', preset: O('Fractal 808 Well'), wireFrom: ['sub', 'sub.hook.audio_out'], wireTo: 'pf.hook.audio_in' }]),   // 3.54: the 808 pulls the field in, its notes dig the basins
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.18 } },

    // 8 — a funeral coven on the dembow: witches chatting on the dancehall triplet, a yoi wobble under them
    { id: 'oc-funeral-dancehall', label: 'Odd Couples · Funeral Dancehall', icon: '⚰️', accent: '#ffab00', family: 'Odd Couples', bpm: [96, 100], roots: [7, 2], scales: ['minor', 'harmonic_minor'], progs: [[1, 4, 1, 4], [1, 7, 6, 7]],
      tagline: 'Gothic organ and a chanting coven on the dembow; a yoi wobble and a 303 stab where the horns should be',
      drums: { main: DEMBOW, light: { kick: 'X...X...X...X...', hat: 'x.x.x.x.x.x.x.x.' } }, leadRhythm: 'synth', bar,
      form: ODD({ intro: ['organ', 'drums'], verse: ['drums', 'organ', 'coven', 'sub'], build: ['organ', 'drums', 'stab'], drop: ['drums', 'wobble', 'coven', 'stab', 'sub'], pat1: { wobble: ['yoi', 'bounce', 'yoi', 'bounceB'], sub: 'sub' }, brk: ['coven', 'organ'] }),
      parts: { drums: KIT('Trap, Phonk & Dancehall · Dancehall Bun', 'Breaks & World'), sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Sound-System Sub (reggae)', style: 'dembow', name: 'Sub' },
        wobble: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Dancehall Yoi Stabs', O('Cathedral Wub')], style: 'half', name: 'Yoi' },
        organ: { role: 'chords', organism: 'eravos.organ', preset: O('Funeral Dancehall'), style: 'skank', voicing: 'triad', octave: 4, name: 'Organ' },
        coven: { role: 'chords', organism: 'eravos.coven', preset: O('Dancehall Coven'), style: 'sustain', voicing: 'triad', octave: 4, name: 'Coven' },
        stab: { role: 'lead', organism: 'eravos.acid-synth', preset: O('Dancehall Acid Stab'), octave: 4, name: '303 stab' } },
      fx: [{ organism: 'eravos.fx-dynamics', preset: O('Choir Leveller'), on: 'coven' }, { organism: 'eravos.channel', preset: O('Organ Under'), on: 'organ' }],
      mods: HER(O('Steppers Pull-up')).concat([{ organism: 'eravos.lyric-rhythm', preset: O('Dancehall Chat') }]),
      master: { compThresh: -11, compRatio: 2.5, reverbMix: 0.18 } },

    // 9 — gospel sevenths and a tonewheel shuffle cut to pieces by a glitch engine, over house
    { id: 'oc-glitch-gospel', label: 'Odd Couples · Glitch Gospel', icon: '🙌', accent: '#00e676', family: 'Odd Couples', bpm: [122, 124], roots: [5, 10], scales: ['major', 'mixolydian'], progs: [[1, 4, 6, 5], [4, 5, 3, 6]],
      tagline: 'Gospel seventh stacks and a tonewheel shuffle, stuttered and tape-stopped by a glitch engine, on a four-on-the-floor',
      drums: { main: HOUSE, light: { hat: '..x...x...x...x.', shaker: 'o.o.o.o.o.o.o.o.' } }, leadRhythm: 'pluck', bar,
      form: ODD({ intro: ['organ', 'drums'], verse: ['drums', 'bass', 'organ'], build: ['stack', 'drums', 'organ'], drop: ['drums', 'bass', 'stack', 'organ'], pat1: { bass: 'bhA' }, brk: ['organ'], lift: 1 }),
      parts: { drums: KIT('House · Disco Room', 'House · Melodic House'), bass: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Club · Deep House Sub', style: 'offbeat', name: 'Bass' },
        organ: { role: 'chords', organism: 'eravos.organ', preset: O('Dub Bubble Hammond'), style: 'stab', voicing: 'seventh', octave: 4, name: 'Hammond' },
        stack: { role: 'chords', organism: 'eravos.syn-osc', preset: O('Gospel Morph Stack'), style: 'pulse', voicing: 'seventh', octave: 4, name: 'Gospel stack' } },   // 3.43: vowel tables, swept by its Envelope
      fx: [{ organism: 'eravos.fx-glitch', preset: O('Gospel Stutter'), on: 'stack' }, { organism: 'eravos.fx-glitch', preset: O('Organ Tape Stop'), on: 'organ' }, { organism: 'eravos.fx-moddelay', preset: O('Chapel Chorus'), on: 'fx1' }],
      mods: HER(O('Cathedral Drop')).concat([{ organism: 'eravos.xy-pad', preset: O('Organ ↔ Wub') }, { organism: 'eravos.macro-automation', preset: O('16-bar latch') }, { organism: 'eravos.syn-env', preset: O('Gospel Vowel Sweep'), to: 'stack', key: 'morph' }]),   // the Envelope follows the stack's chords by itself
      master: { compThresh: -14, compRatio: 3, reverbMix: 0.2 } },   // measured: −11 / 2.5 drove the master soft-clipper (13–32 samples a song)

    // 10 — a 19-tone lead over a φ-Hz wobble on UK garage: the notes between the notes, at a rate between the beats
    { id: 'oc-xen-wobble', label: 'Odd Couples · Xen Wobble Garage', icon: '🧬', accent: '#18ffff', family: 'Odd Couples', bpm: [130, 132], roots: [9, 4], scales: ['minor', 'dorian'], progs: [[1, 6, 3, 7], [1, 4, 6, 7]],
      tagline: 'A 19-tone lead and golden-orbit pads over a wobble free-running at φ Hz, on a 2-step garage shuffle',
      drums: { main: UKG, light: { hat: 'x.x.x.xox.x.x.xo', shaker: 'oooooooooooooooo' } }, leadRhythm: 'synth', bar,
      form: ODD({ intro: ['pad', 'drums'], verse: ['drums', 'wobble', 'pad'], build: ['pad', 'drums', 'lead'], drop: ['drums', 'wobble', 'pad', 'lead', 'sub'], pat1: { wobble: ['wub', 'wubHi', 'tri', 'wub'], sub: 'sub' }, brk: ['pad', 'lead'] }),
      parts: { drums: KIT('House · UKG Skip', 'Breaks & Jungle · Breakbeat Funk'), wobble: { role: 'bass', organism: 'eravos.wobble-bass', preset: O('Golden Wobble'), style: 'half', name: 'Wobble' },
        sub: { role: 'bass', organism: 'eravos.wub-osc', preset: O('Steppers Growl'), style: 'half', name: 'Growl' },
        pad: { role: 'chords', organism: 'eravos.pad-forge', preset: O('Golden Orbit'), style: 'sustain', voicing: 'add9', octave: 4, name: 'Pad' },
        lead: { role: 'lead', organism: 'eravos.xen-synth', preset: O('19-EDO Wobble Lead'), octave: 5, name: '19-tone' } },
      fx: [{ organism: 'eravos.fx-phaser', preset: O('Wobble Phase'), on: 'wobble' }, { organism: 'eravos.wub-filter', preset: O('Choir Mouth'), on: 'sub' }],
      mods: HER(O('Golden Gap')).concat([{ organism: 'eravos.wub-sub', preset: O('Steppers Sub (wub)') }]),
      master: { compThresh: -11, compRatio: 2.5, reverbMix: 0.18 } },

    // 11 — a machine that writes its own rhythm and bass (EDM Lab) under a ghost choir and an acid wobble
    { id: 'oc-machine-choir', label: 'Odd Couples · Machine Choir', icon: '🤖', accent: '#ff1744', family: 'Odd Couples', bpm: [140, 140], roots: [11, 4], scales: ['minor', 'phrygian'], progs: [[1, 6, 7, 1], [1, 1, 6, 7]],
      tagline: 'A golden ghost choir over an acid wobble; a generator writes its own roller underneath and nobody tells it the song',
      drums: { main: HALF, light: HALF_LIGHT }, leadRhythm: 'sparse', bar,
      form: ODD({ intro: ['choir'], verse: ['drums', 'choir', 'wobble'], build: ['choir', 'drums'], drop: ['drums', 'wobble', 'choir', 'organ'], pat1: { wobble: ['yoi', 'wub', 'stair', 'tri'] }, brk: ['choir'] }),
      parts: { drums: KIT(O('Cathedral Riddim'), 'Heavy (Dubstep/Trap)'), wobble: { role: 'bass', organism: 'eravos.wobble-bass', preset: O('Acid Wobble'), style: 'half', name: 'Acid wobble' },
        choir: { role: 'chords', organism: 'eravos.coven', preset: [O('Golden Ghost Choir'), O('Riddim Requiem')], style: 'sustain', voicing: 'triad', octave: 4, name: 'Choir' },
        organ: { role: 'chords', organism: 'eravos.organ', preset: O('Organ Into Wobble'), style: 'sustain', voicing: 'triad', octave: 3, name: 'Organ' } },
      fx: [{ organism: 'eravos.fx-filter', preset: O('Choir Behind Glass'), on: 'choir' }, { organism: 'eravos.wub-filter', preset: O('Acid Mouth'), on: 'wobble' }, { organism: 'eravos.fx-destroyer', preset: O('Organ Crush'), on: 'organ' }, { organism: 'eravos.granular', preset: O('Choir Grain Halo'), on: 'choir' }],   // 3.43: the choir scattered into a halo behind itself
      mods: HER(O('Cathedral Drop')).concat([{ organism: 'eravos.edm-lab', preset: O('Machine Choir Roller') }, { organism: 'eravos.wub-rate', preset: O('Golden Rate'), to: 'fx1', key: 'wub' }]),
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.2 } },

    // 12 — the hanging tree goes to the sound system: desert-goth organ drone, dub siren, a wub-sub floor, a synthwave chapel
    { id: 'oc-hanging-dub', label: 'Odd Couples · Hanging Tree Dub', icon: '🌵', accent: '#a1887f', family: 'Odd Couples', bpm: [68, 72], roots: [4, 9], scales: ['phrygian', 'minor'], progs: [[1, 2, 1, 7], [1, 1, 6, 7]],
      tagline: 'A desert-goth organ drone at a sound system: dub echoes, a wub-sub floor, a synthwave chapel answering',
      drums: { main: ONEDROP, light: { rim: '....x.......x...' } }, leadRhythm: 'sparse', bar,
      form: ODD({ intro: ['organ'], verse: ['drums', 'bass', 'organ'], build: ['organ', 'drums', 'chapel'], drop: ['drums', 'bass', 'organ', 'chapel', 'wub'], pat1: { wub: ['dubsub', 'sub'] }, brk: ['organ'], lift: 0 }),
      // measured in the song (tests: one render, every tool on its own channel): at 70 BPM the kit's accents land together at
      // +2.9 dBFS and the 5 s cathedral reverb feeds the master — the master input hit +6.9 dBFS. The kit sits 5 dB lower here.
      parts: { drums: Object.assign(KIT('Breaks & World', O('Steppers Machine')), { configure: { volume: 0.5 } }), forge: FORGE(O('Golden Steppers')), bass: { role: 'bass', organism: 'eravos.reese-bass', preset: O('Chapel Reese'), style: 'onedrop', name: 'Bass' },
        wub: { role: 'bass', organism: 'eravos.wub-osc', preset: O('Acid Saw Wub'), style: 'half', name: 'Wub' },
        organ: { role: 'chords', organism: 'eravos.organ', preset: ['Hanging Tree', O('Synthwave Chapel')], configure: { level: 0.45 }, style: 'sustain', voicing: 'triad', octave: 3, name: 'Organ' },   // held notes sustain since the organ fix: ≈4 dB down keeps the master clear
        chapel: { role: 'lead', organism: 'eravos.retro-poly', preset: O('Wobble Pad Glow'), octave: 5, name: 'Chapel' } },
      fx: [{ organism: 'eravos.dub-station', preset: O('Cathedral Sound System'), on: 'organ' }, { organism: 'eravos.fx-echo', preset: O('Cathedral Throw'), on: 'chapel' }, { organism: 'eravos.fx-eq', preset: O('Church Low Cut'), on: 'organ' }],
      mods: HER(O('Golden Gap')).concat([{ organism: 'eravos.wub-sub', preset: O('Cathedral Sub') }, { organism: 'eravos.embodiment-lab', preset: O('Hold Her Voice') }, { organism: 'eravos.master-fx', preset: O('Cathedral Master') }]),
      master: { compThresh: -16, compRatio: 3, reverbMix: 0.22 } },   // measured: −12 / 2 / 0.3 drove the master soft-clipper (≈400 samples a song) → ≈40
  ];
  GENRES.forEach(SE.addGenre);

  const HOWTO = 'Record or drop her clip into Clip Maker and trim it — it goes to the Sample player (the break) and to the Drop Builder (the drop, on top of everything).';
  const NOTES = {
    'oc-cathedral-riddim': { listen: 'An organ chopped in 1/16 triplets over a riddim stair; a coin falling in the chapel between bars.', drop: 'The Drop Builder lands her line on beat 1, the organ goes through a dub chamber and the wub rig talks underneath.', voice: 'Her words alone with the organ in the break; her line on the drop with everything ducked under it. ' + HOWTO },
    'oc-acid-seance': { listen: 'A 303 squelching under a chanting choir; the choir answers on a phone line.', drop: 'A sub swell in the gap, then 808, 303 and the choir together; the sound-system rewinds at the end.', voice: 'Her clip chopped in triplets in the break, or whole on the drop. ' + HOWTO },
    'oc-golden-dub': { listen: 'Bells in a golden-ratio tuning — not the 12 notes — over a one-drop; a siren wails at 6.18 Hz.', drop: 'Half a bar of total silence with only her voice, then the golden growl and the dub echoes.', voice: 'This one is built around the silent half bar: her voice alone in it. ' + HOWTO },
    'oc-lullaby-tearout': { listen: 'A bouncing-ball music box and glass; the box keeps playing straight through the tearout drop.', drop: 'Her line ends on beat 1 and the tearout growl comes in under the music box.', voice: 'Her clip through the Sample player in the break, next to the music box. ' + HOWTO },
    'oc-synthwave-steppers': { listen: 'Juno keys bubbling like a reggae organ, 80s brass answering dub sirens, steppers kicks.', drop: 'A triplet wobble arrives with the brass; the drums flange every half bar.', voice: 'Her line before the drop; in the break she sits over the bubble and the plucks. ' + HOWTO },
    'oc-breathing-dnb': { listen: 'A body drone that breathes once a bar under a 174 roller; the reese breathes with it.', drop: 'Silence for half a bar — her voice — then the roller and the reese.', voice: 'Her whole clip fits the break over the breathing drone. ' + HOWTO },
    'oc-spectral-trap': { listen: 'A fractal bell loop under sliding 808s; saws with a demon an octave under them; slendro bells stuttering.', drop: 'A sub swell, then 808 and saws together.', voice: 'Her clip dry and close in the break. ' + HOWTO },
    'oc-funeral-dancehall': { listen: 'A funeral organ skanking on the dembow, witches chatting on the triplet, a 303 where the horns should be.', drop: 'A yoi wobble and the coven together; the organ tucked under.', voice: 'Her clip chopped in triplets — dancehall chat — in the break and on the drop. ' + HOWTO },
    'oc-glitch-gospel': { listen: 'Gospel sevenths and a tonewheel shuffle on a four-on-the-floor, stuttered and tape-stopped.', drop: 'The stack stutters in 1/16s, the organ tape-stops into the downbeat.', voice: 'Her line rides the chorus of the organ in the break. ' + HOWTO },
    'oc-xen-wobble': { listen: 'A 19-tone lead — the notes between the notes — over a wobble free-running at φ Hz on a 2-step shuffle.', drop: 'The wobble never lines up with the beat; the 19-tone lead floats over it.', voice: 'Her voice in the silent half bar before each drop. ' + HOWTO },
    'oc-machine-choir': { listen: 'A golden ghost choir over an acid wobble; a generator plays its own roller underneath.', drop: 'The choir goes behind glass, the acid wobble opens, the organ is crushed to 12 bits.', voice: 'Her words in the break with only the choir. ' + HOWTO },
    'oc-hanging-dub': { listen: 'A desert-goth organ drone at a dub sound system; a synthwave chapel answers through a stone-room echo.', drop: 'Half a bar of silence with her voice, then the wub sub and the organ through the dub chamber.', voice: 'A held drone sits under her voice in the break. ' + HOWTO },
  };
  // [id, title, genre, seed, moods] — six per genre
  const SHELF = [
    ['oc-cr1', 'Organ in the Dance', 'oc-cathedral-riddim', 4101, ['heavy', 'goth', 'her']], ['oc-cr2', 'Requiem Stair', 'oc-cathedral-riddim', 4102, ['heavy', 'dark']], ['oc-cr3', 'Stained Glass Riddim', 'oc-cathedral-riddim', 4103, ['heavy', 'goth']],
    ['oc-cr4', 'Pipes and Wubs', 'oc-cathedral-riddim', 4104, ['heavy']], ['oc-cr5', 'Chapel Pressure', 'oc-cathedral-riddim', 4105, ['heavy', 'goth']], ['oc-cr6', 'Amen in Triplets', 'oc-cathedral-riddim', 4106, ['heavy', 'dark', 'her']],
    ['oc-as1', 'Three-Oh-Séance', 'oc-acid-seance', 4201, ['dark', 'goth', 'her']], ['oc-as2', 'Squelch the Candles', 'oc-acid-seance', 4202, ['dark', 'party']], ['oc-as3', 'Coven on the Line', 'oc-acid-seance', 4203, ['dark', 'goth']],
    ['oc-as4', 'Ouija Acid', 'oc-acid-seance', 4204, ['dark', 'party']], ['oc-as5', 'Rewind the Ghost', 'oc-acid-seance', 4205, ['dark', 'her']], ['oc-as6', 'Midnight Resonance', 'oc-acid-seance', 4206, ['dark', 'goth']],
    ['oc-gd1', 'Gold in the Dub', 'oc-golden-dub', 4301, ['island', 'calm', 'her']], ['oc-gd2', 'Phi Siren', 'oc-golden-dub', 4302, ['island', 'dark']], ['oc-gd3', 'Between the Keys', 'oc-golden-dub', 4303, ['island', 'calm']],
    ['oc-gd4', 'Golden Sound System', 'oc-golden-dub', 4304, ['island', 'heavy']], ['oc-gd5', 'Irrational Riddim', 'oc-golden-dub', 4305, ['island']], ['oc-gd6', 'Spiral One Drop', 'oc-golden-dub', 4306, ['island', 'calm', 'her']],
    ['oc-lt1', 'Music Box Massacre', 'oc-lullaby-tearout', 4401, ['heavy', 'her']], ['oc-lt2', 'Sweet Teeth', 'oc-lullaby-tearout', 4402, ['heavy', 'dark']], ['oc-lt3', 'Bounce, Little Ball', 'oc-lullaby-tearout', 4403, ['heavy']],
    ['oc-lt4', 'Glass Over Concrete', 'oc-lullaby-tearout', 4404, ['heavy', 'warm']], ['oc-lt5', 'Nursery Gnarl', 'oc-lullaby-tearout', 4405, ['heavy', 'dark']], ['oc-lt6', 'Lullaby for a Monster', 'oc-lullaby-tearout', 4406, ['heavy', 'her']],
    ['oc-ss1', 'Miami Sound System', 'oc-synthwave-steppers', 4501, ['80s', 'island', 'party']], ['oc-ss2', 'Neon Steppers', 'oc-synthwave-steppers', 4502, ['80s', 'island']], ['oc-ss3', 'Juno Bubble', 'oc-synthwave-steppers', 4503, ['80s', 'warm']],
    ['oc-ss4', 'Outrun the Siren', 'oc-synthwave-steppers', 4504, ['80s', 'party']], ['oc-ss5', 'Brass and Dub Plates', 'oc-synthwave-steppers', 4505, ['80s', 'island', 'her']], ['oc-ss6', 'Night Bus to Kingston', 'oc-synthwave-steppers', 4506, ['80s', 'island']],
    ['oc-bd1', 'Breathe at 174', 'oc-breathing-dnb', 4601, ['fast', 'calm', 'her']], ['oc-bd2', 'Body Roller', 'oc-breathing-dnb', 4602, ['fast']], ['oc-bd3', 'Exhale Into the Drop', 'oc-breathing-dnb', 4603, ['fast', 'warm']],
    ['oc-bd4', 'Heartbeat Jungle', 'oc-breathing-dnb', 4604, ['fast', 'heavy']], ['oc-bd5', 'Coherence', 'oc-breathing-dnb', 4605, ['fast', 'calm']], ['oc-bd6', 'Lungs Full of Bass', 'oc-breathing-dnb', 4606, ['fast', 'her']],
    ['oc-st1', 'Fractal 808', 'oc-spectral-trap', 4701, ['heavy', 'dark']], ['oc-st2', 'Bells of Recursion', 'oc-spectral-trap', 4702, ['heavy']], ['oc-st3', 'Slendro Slide', 'oc-spectral-trap', 4703, ['heavy', 'dark']],
    ['oc-st4', 'Spectrum Drip', 'oc-spectral-trap', 4704, ['heavy']], ['oc-st5', 'Math in the Trunk', 'oc-spectral-trap', 4705, ['heavy', 'her']], ['oc-st6', 'Octave Under', 'oc-spectral-trap', 4706, ['heavy', 'dark']],
    ['oc-fd1', 'Witches on the Dembow', 'oc-funeral-dancehall', 4801, ['island', 'goth', 'party']], ['oc-fd2', 'Coffin Skank', 'oc-funeral-dancehall', 4802, ['island', 'dark']], ['oc-fd3', 'Yoi in the Graveyard', 'oc-funeral-dancehall', 4803, ['island', 'heavy']],
    ['oc-fd4', 'Funeral Bashment', 'oc-funeral-dancehall', 4804, ['island', 'party', 'her']], ['oc-fd5', 'Requiem Riddim', 'oc-funeral-dancehall', 4805, ['island', 'goth']], ['oc-fd6', 'Dead Man Dutty Wine', 'oc-funeral-dancehall', 4806, ['island', 'party']],
    ['oc-gg1', 'Glory Glitch', 'oc-glitch-gospel', 4901, ['party', 'warm', 'her']], ['oc-gg2', 'Tape-Stop Hallelujah', 'oc-glitch-gospel', 4902, ['party']], ['oc-gg3', 'Stutter Sunday', 'oc-glitch-gospel', 4903, ['party', 'warm']],
    ['oc-gg4', 'Seventh Heaven 1/16', 'oc-glitch-gospel', 4904, ['party']], ['oc-gg5', 'Shuffle Choir', 'oc-glitch-gospel', 4905, ['party', 'warm']], ['oc-gg6', 'Amen Broken', 'oc-glitch-gospel', 4906, ['party', 'her']],
    ['oc-xw1', 'Nineteen Steps', 'oc-xen-wobble', 5001, ['party', 'her']], ['oc-xw2', 'Wobble at Phi', 'oc-xen-wobble', 5002, ['party', 'dark']], ['oc-xw3', 'Notes Between Notes', 'oc-xen-wobble', 5003, ['party']],
    ['oc-xw4', 'Garage of Irrationals', 'oc-xen-wobble', 5004, ['party', 'warm']], ['oc-xw5', 'Two-Step Fibonacci', 'oc-xen-wobble', 5005, ['party']], ['oc-xw6', 'Off the Grid', 'oc-xen-wobble', 5006, ['party', 'her']],
    ['oc-mc1', 'Nobody Told the Machine', 'oc-machine-choir', 5101, ['heavy', 'goth']], ['oc-mc2', 'Ghosts in the Generator', 'oc-machine-choir', 5102, ['heavy', 'dark']], ['oc-mc3', 'Acid Requiem', 'oc-machine-choir', 5103, ['heavy', 'goth']],
    ['oc-mc4', 'Choir Behind Glass', 'oc-machine-choir', 5104, ['heavy', 'her']], ['oc-mc5', 'Twelve-Bit Cathedral', 'oc-machine-choir', 5105, ['heavy', 'dark']], ['oc-mc6', 'The Machine Sings', 'oc-machine-choir', 5106, ['heavy', 'her']],
    ['oc-hd1', 'Hanging Tree Sound System', 'oc-hanging-dub', 5201, ['goth', 'island', 'calm']], ['oc-hd2', 'Desert Dub Chamber', 'oc-hanging-dub', 5202, ['goth', 'island']], ['oc-hd3', 'Chapel of Echoes', 'oc-hanging-dub', 5203, ['goth', 'calm']],
    ['oc-hd4', 'Rope and Reverb', 'oc-hanging-dub', 5204, ['goth', 'dark', 'her']], ['oc-hd5', 'Dust on the Dub Plate', 'oc-hanging-dub', 5205, ['goth', 'island']], ['oc-hd6', 'Silence Then Gold', 'oc-hanging-dub', 5206, ['goth', 'calm', 'her']],
  ];
  const SONGS = SHELF.map(([id, title, genre, seed, mood]) => Object.assign({ id, title, genre, seed, mood: ['odd'].concat(mood) }, NOTES[genre]));   // 'odd' → the 🧪 Odd Couples chip on the Songs page
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.OddCouplesSongbook = { genres: GENRES.map(g => g.id), songs: SONGS.map(s => s.id) };
})();
