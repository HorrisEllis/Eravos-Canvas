/* ERAVOS "Synthesis showcase" songbook (3.44) — data only. "add songs that show off and test the tools. the synthesis tools
 * are all new." Four Song Engine genres built ON the Synthesis tools (Morph Osc · Envelope · Partials · Granular), each one
 * pushing them somewhere different, and four named songs in each (Songs → 🧬 Synthesis showcase):
 *   syn-fm-garage   two Morph Oscs as FM pairs (one wired into the other's FM in), an Envelope scanning the bass's tables
 *   syn-bells       Partials doing what a sampler can't — stretched bells, an evolving choir — Granular shimmer on top
 *   syn-clouds      no drop, no kick for the first minute: Granular rain and reverse swells made from Morph Osc and Partials
 *   syn-fm-growl    140 half-time: a growl modulator FM-ing a vowel bass, a looping Envelope wobbling its morph, ×7 bells
 * Every song names the tools it shows off; playing them through is the listening test of those tools (tests/p44-synthesis-songs). */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;

  // drum grids (16 steps: X loud · x normal · o ghost)
  const TWOSTEP = { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.x.x.xox.x.x.xo', shaker: 'oooooooooooooooo' };
  const TWOSTEP_LIGHT = { hat: 'x.x.x.x.x.x.x.x.', kick: 'X...............' };
  const HOUSE = { kick: 'X...X...X...X...', clap: '....x.......x...', hat: '..x...x...x...x.', shaker: 'oxoxoxoxoxoxoxox' };
  const HOUSE_LIGHT = { kick: 'X.......X.......', hat: '..x...x...x...x.' };
  const AIR = { rim: '....x.......x...', shaker: '..o...o...o...o.' };
  const AIR_KICK = { kick: 'X.......x.......', rim: '....x.......x...', shaker: '..o...o...o...o.' };
  const HALF = { kick: 'X.........x.....', snare: '........X.......', clap: '........x.......', hat: 'x.x.x.x.x.x.x.x.', ohat: '..............x.' };
  const HALF_LIGHT = { hat: 'x.o.x.o.x.o.x.o.', kick: 'X...............' };

  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const DROP_FORM = (o) => [
    S('intro', 'intro', 8, o.intro),
    S('build', 'build', 8, o.build),
    S('drop', 'drop', 16, o.drop),
    S('break', 'break', 8, o.brk),
    S('build 2', 'build', 8, o.build),
    S('drop 2', 'drop', 16, o.drop2 || o.drop, o.bass2 ? { bassStyle: o.bass2 } : {}),
    S('outro', 'outro', 8, o.outro || o.intro),
  ];
  // the Synthesis tools as parts. `mods` with `into` wire the mod's own output into a part (FM: modulator → carrier's FM in);
  // with `to` + `key` an Envelope's violet output moves that part's knob on that part's own notes.
  const OSC = (preset, role, name, o) => Object.assign({ role, organism: 'eravos.syn-osc', preset, name }, o || {});
  const PART = (preset, role, name, o) => Object.assign({ role, organism: 'eravos.syn-partials', preset, name }, o || {});
  const FM = (preset, carrier) => ({ organism: 'eravos.syn-osc', preset, out: 'mosc.hook.audio_out', into: [carrier, 'mosc.hook.fm_in'] });
  const ENV = (preset, to, key) => ({ organism: 'eravos.syn-env', preset, to, key });
  const GRAIN = (preset, on) => ({ organism: 'eravos.granular', preset, on });

  const GENRES = [
    { id: 'syn-fm-garage', label: 'Synthesis · FM Garage', icon: '🧬', accent: '#00e5ff', family: 'Synthesis', category: 'synthesis', bpm: [130, 134], roots: [9, 2, 7], scales: ['minor', 'dorian'], progs: [[1, 6, 3, 7], [1, 4, 6, 5], [6, 4, 1, 5]],
      tagline: 'Two-step garage made only from Morph Oscs: an FM ×2 pair on the lead, a vowel bass whose tables an Envelope scans on every note',
      drums: { main: TWOSTEP, light: TWOSTEP_LIGHT }, leadRhythm: 'pluck',
      form: DROP_FORM({ intro: ['keys', 'drums'], build: ['keys', 'drums', 'lead'], drop: ['drums', 'bass', 'lead', 'keys'], brk: ['keys', 'lead'] }),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'EDM Core', name: 'Drums' },
        bass: OSC('Vowel Bass', 'bass', 'Vowel bass', { style: 'stutter' }),
        keys: PART('Glass Keys', 'chords', 'Glass keys', { style: 'stab', voicing: 'seventh', octave: 4 }),
        lead: OSC('Morph Lead', 'lead', 'FM lead', { octave: 5 }) },
      mods: [FM('FM Modulator ×2 (wire into FM in)', 'lead'), ENV('Morph Scan', 'bass', 'morph')],
      fx: [{ organism: 'eravos.fx-echo', preset: 'Ping-pong 1/8.', on: 'lead' }],
      master: { compThresh: -11, compRatio: 2.5, reverbMix: 0.16 } },

    { id: 'syn-bells', label: 'Synthesis · Additive Bells', icon: '🔔', accent: '#ffd54f', family: 'Synthesis', category: 'synthesis', bpm: [122, 126], roots: [5, 0, 7], scales: ['major', 'lydian', 'mixolydian'], progs: [[1, 5, 6, 4], [4, 1, 5, 6], [1, 3, 4, 4]],
      tagline: 'House built on Partials: an evolving choir that travels between two spectra, stretched tubular bells, a mallet answer — Granular shimmer over the top',
      drums: { main: HOUSE, light: HOUSE_LIGHT }, leadRhythm: 'anthem',
      form: DROP_FORM({ intro: ['choir', 'drums'], build: ['choir', 'drums', 'bell'], drop: ['drums', 'bass', 'bell', 'choir', 'mallet'], brk: ['choir', 'mallet'] }),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'EDM Core', name: 'Drums' },
        bass: OSC('Sub Sine', 'bass', 'Sub', { style: 'offbeat' }),
        choir: PART('Evolving Choir', 'chords', 'Choir', { style: 'sustain', voicing: 'seventh', octave: 4 }),
        bell: PART('Tubular Bell', 'lead', 'Bell', { octave: 5 }),
        mallet: PART('Mallet', 'chords', 'Mallet', { style: 'stab', octave: 5 }) },
      fx: [GRAIN('Shimmer Pad', 'choir'), { organism: 'eravos.fx-echo', preset: 'Ping-pong 1/8.', on: 'bell' }],
      master: { compThresh: -12, compRatio: 2, reverbMix: 0.22 } },

    { id: 'syn-clouds', label: 'Synthesis · Grain Clouds', icon: '☁️', accent: '#b39ddb', family: 'Synthesis', category: 'synthesis', bpm: [68, 76], roots: [4, 11, 2], scales: ['minor', 'dorian'], progs: [[1, 6, 4, 6], [1, 7, 6, 7], [6, 4, 1, 1]], impact: false,
      tagline: 'Ambient with no drop: a Morph Osc glass pad turned to rain by Granular, a Partials reed swelling in reverse, a slow Envelope opening the pad',
      drums: { main: AIR_KICK, light: AIR }, leadRhythm: 'sparse',
      form: [S('rain', 'intro', 8, ['pad'], { drums: 'none' }), S('reed', 'verse', 16, ['pad', 'reed', 'drums'], { drums: 'light' }), S('floor', 'chorus', 16, ['pad', 'reed', 'bass', 'drums']),
        S('clearing', 'break', 8, ['pad'], { drums: 'none' }), S('return', 'chorus', 16, ['pad', 'reed', 'bass', 'drums']), S('mist', 'outro', 8, ['pad'], { drums: 'none' })],
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'EDM Core', name: 'Drums' },
        bass: OSC('Sub Sine', 'bass', 'Sub', { style: 'pulse8' }),
        pad: OSC('Glass Pad', 'chords', 'Glass pad', { style: 'sustain', voicing: 'triad', octave: 4 }),
        reed: PART('Hollow Reed', 'lead', 'Reed', { octave: 5 }) },
      mods: [ENV('Slow Swell', 'pad', 'morph')],
      fx: [GRAIN('Rain', 'pad'), GRAIN('Reverse Swell', 'reed')],
      master: { compThresh: -14, compRatio: 1.8, reverbMix: 0.32 } },

    { id: 'syn-fm-growl', label: 'Synthesis · FM Growl', icon: '🐉', accent: '#ff3d00', family: 'Synthesis', category: 'synthesis', bpm: [140, 140], roots: [5, 9, 2], scales: ['minor', 'phrygian'], progs: [[1, 1, 6, 7], [1, 6, 3, 7], [1, 2, 1, 7]],
      tagline: '140 half-time: a ×1 growl modulator FM-ing a vowel bass, a looping Envelope wobbling its tables, ×7 FM bells stuttered by Granular',
      drums: { main: HALF, light: HALF_LIGHT }, leadRhythm: 'sparse',
      form: DROP_FORM({ intro: ['pad', 'drums'], build: ['pad', 'drums', 'bell'], drop: ['drums', 'bass', 'bell', 'pad'], brk: ['pad', 'bell'], bass2: 'stutter' }),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
        bass: OSC('Vowel Bass', 'bass', 'Growl bass', { style: 'half' }),
        pad: PART('Saw to Sine Pad', 'chords', 'Pad', { style: 'sustain', voicing: 'triad', octave: 4 }),
        bell: OSC('Pluck', 'lead', 'FM bell', { octave: 5 }) },
      mods: [FM('Growl Modulator ×1 (wire into FM in)', 'bass'), ENV('Note Wobble (loop)', 'bass', 'morph'), FM('Bell Modulator ×7 (wire into FM in)', 'bell')],
      fx: [GRAIN('Stutter 1/8', 'bell'), { organism: 'eravos.fx-destroyer', preset: 'Wub Grit · sub stays clean', on: 'bass' }],
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.14 } },
  ];
  GENRES.forEach(SE.addGenre);

  const TOOLS = {
    'syn-fm-garage': 'Morph Osc ×3 (FM lead pair, vowel bass) · Envelope (Morph Scan on the bass’s tables) · Partials (Glass Keys)',
    'syn-bells': 'Partials ×3 (Evolving Choir, Tubular Bell, Mallet) · Morph Osc (Sub Sine) · Granular (Shimmer Pad on the choir)',
    'syn-clouds': 'Morph Osc ×2 (Glass Pad, Sub Sine) · Partials (Hollow Reed) · Granular ×2 (Rain, Reverse Swell) · Envelope (Slow Swell)',
    'syn-fm-growl': 'Morph Osc ×4 (vowel bass + ×1 growl modulator, pluck + ×7 bell modulator) · Envelope (looping wobble) · Partials (pad) · Granular (Stutter 1/8)',
  };
  const NOTES = {
    'syn-fm-garage': { listen: 'The lead is two oscillators: one bends the other’s pitch (FM ×2) — listen for the bark on each note. The bass sweeps through its vowel tables every time it plays.', drop: 'Half a beat of silence, then the vowel bass and the FM lead together on the 2-step.', voice: 'Her clip sits in the break over the glass keys.' },
    'syn-bells': { listen: 'The choir starts as one spectrum and travels to another on every chord; the bell partials are stretched apart like real metal, so they ring instead of buzz.', drop: 'Crash + kick + sub; the tubular bell takes the melody, the mallet answers.', voice: 'Her clip in the break, with only the choir and mallet.' },
    'syn-clouds': { listen: 'No drop. The pad never plays a plain note — Granular breaks it into rain. The reed plays backwards into each phrase.', drop: 'No hard drop — the floor (a soft kick and sub) arrives and settles.', voice: 'Her clip through the Granular cloud: freeze a word and let it hang.' },
    'syn-fm-growl': { listen: 'The bass growls because a second oscillator, one ratio below, is FM-ing it; the looping Envelope moves its vowel 4–8 times a note. The bells are ×7 FM — metal, not a sample.', drop: 'Silence, then the growl bass, the destroyer grit and stuttered FM bells together.', voice: 'Her clip on the drop, the bass ducked under her.' },
  };
  // [id, title, genre, seed, moods]
  const SHELF = [
    ['syn-fg1', 'Two Oscillators, One Voice', 'syn-fm-garage', 6101, ['party', 'warm']], ['syn-fg2', 'Vowel Shuffle', 'syn-fm-garage', 6102, ['party']],
    ['syn-fg3', 'Ratio Two', 'syn-fm-garage', 6103, ['party', 'her']], ['syn-fg4', 'Tables Turning', 'syn-fm-garage', 6104, ['party', 'dark']],
    ['syn-bl1', 'Twenty-Four Harmonics', 'syn-bells', 6201, ['warm', 'party', 'her']], ['syn-bl2', 'Stretched Bells', 'syn-bells', 6202, ['warm']],
    ['syn-bl3', 'Spectrum A to B', 'syn-bells', 6203, ['warm', 'calm']], ['syn-bl4', 'Mallet Sunrise', 'syn-bells', 6204, ['party', 'warm']],
    ['syn-cl1', 'Glass Turned to Rain', 'syn-clouds', 6301, ['calm', 'her']], ['syn-cl2', 'Reed in Reverse', 'syn-clouds', 6302, ['calm']],
    ['syn-cl3', 'Frozen Weather', 'syn-clouds', 6303, ['calm', 'dark']], ['syn-cl4', 'Ten Thousand Grains', 'syn-clouds', 6304, ['calm', 'warm']],
    ['syn-gr1', 'The Modulator Below', 'syn-fm-growl', 6401, ['heavy', 'dark']], ['syn-gr2', 'Seven Times Metal', 'syn-fm-growl', 6402, ['heavy']],
    ['syn-gr3', 'Envelope on a Loop', 'syn-fm-growl', 6403, ['heavy', 'her']], ['syn-gr4', 'Growl Index Sixteen', 'syn-fm-growl', 6404, ['heavy', 'dark']],
  ];
  const SONGS = SHELF.map(([id, title, genre, seed, mood]) => Object.assign({ id, title, genre, seed, mood: ['synthesis'].concat(mood), tools: TOOLS[genre] }, NOTES[genre]));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.SynthesisSongbook = { genres: GENRES.map(g => g.id), songs: SONGS.map(s => s.id) };
})();
