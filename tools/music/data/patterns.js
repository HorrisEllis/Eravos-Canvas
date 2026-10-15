/* data/patterns.json (as JS for file://) — sequencer genre starters.
 * drum lane:  string, one char per 1/16: X accent(1.0) x(0.8) o ghost(0.45) . off  ('|' ignored)
 * melodic lane: space-separated tokens, one per 1/16: '.' off, or DEGREE[+|-...][g<gate>][w<div>][s][a]
 *   +/- octave · g gate in steps · w wobble division (8=1/8, 16, 8t, 4t, 2, 4, 32) · s slide · a accent
 * role: drum lanes use pad index (0 kick 1 snare 2 clap 3 hat 4 openhat 5 808 6 rim 7 tom 8 crash 9 perc 10 shaker 11 cowbell);
 * melodic lanes use role 'bass' | 'lead' | 'chords' — resolved to a mounted instrument at load time. */
window.ERAVOS_DATA = window.ERAVOS_DATA || {};
window.ERAVOS_DATA.patterns = {
  'four-on-floor house': {
    bpm: 124, swing: 0.08, bank: 0,
    slots: { A: { length: 16, lanes: [
      { name: 'kick', pad: 0, steps: 'X...x...x...x...' },
      { name: 'clap', pad: 2, steps: '....x.......x...' },
      { name: 'hat', pad: 3, steps: 'oxoxoxoxoxoxoxox' },
      { name: 'open hat', pad: 4, steps: '..x...x...x...x.' },
      { name: 'bass', role: 'bass', octave: -2, steps: '. . 1g2 . . . 1g2 . . . 1g2 . . . 3g2 .' },
    ] } },
  },
  'dubstep half-time 140': {
    bpm: 140, swing: 0, bank: 1, song: true,
    slots: {
      A: { name: 'intro', length: 32, lanes: [
        { name: 'kick', pad: 0, steps: 'X...............|X...............' },
        { name: 'snare', pad: 1, steps: '................|................' },
        { name: 'clap', pad: 2, steps: '................|................' },
        { name: 'hat', pad: 3, steps: 'o.o.x.o.o.o.x.o.|o.o.x.o.o.o.x.xo' },
        { name: 'crash', pad: 8, steps: 'x...............|................' },
        { name: 'bass', role: 'bass', octave: -2, steps: '1g16w2v20 . . . . . . . . . . . . . . . 6-g16w2v20 . . . . . . . . . . . . . . .' },
      ] },
      B: { name: 'build', length: 32, lanes: [
        { name: 'kick', pad: 0, steps: 'x...x...x...x...|x...x...x...x...' },
        { name: 'snare', pad: 1, steps: '........o.......|o...o...o.o.oxox' },
        { name: 'clap', pad: 2, steps: '................|................' },
        { name: 'hat', pad: 3, steps: 'o.o.o.o.o.o.o.o.|oooooooooooooooo' },
        { name: 'crash', pad: 8, steps: '................|................' },
        { name: 'bass', role: 'bass', octave: -2, steps: '1g8w4v30 . . . . . . . 1g8w8v40 . . . . . . . 1g8w16v50 . . . . . . . 1g8w32v60 . . . . . . .' },
      ] },
      C: { name: 'drop', length: 32, lanes: [
        { name: 'kick', pad: 0, steps: 'X.........X.....|X.....X...X.....' },
        { name: 'snare', pad: 1, steps: '........X.......|........X.......' },
        { name: 'clap', pad: 2, steps: '........x.......|........x.......' },
        { name: 'hat', pad: 3, steps: '..x...x...x...x.|..x...x...x.x.xx' },
        { name: 'crash', pad: 8, steps: 'X...............|................' },
        { name: 'bass', role: 'bass', octave: -2, steps: '1g3w8a . . 1g3w16 . . 1g2w8t . . . . . 1-g4w4 . . . 1g4w8a . . . 3g2w16 . 1g2w16 . . . 6-g2w8t . 7-g4w4 . . .' },
      ] },
      D: { name: 'outro', length: 32, lanes: [
        { name: 'kick', pad: 0, steps: 'X.......x.......|X.......x.......' },
        { name: 'snare', pad: 1, steps: '........X.......|........X.......' },
        { name: 'clap', pad: 2, steps: '................|................' },
        { name: 'hat', pad: 3, steps: 'x.o.x.o.x.o.x.o.|x.o.x.o.x.o.x.o.' },
        { name: 'crash', pad: 8, steps: '................|................' },
        { name: 'bass', role: 'bass', octave: -2, steps: '1g8w4v55 . . . . . . . . . . . . . . . 6-g8w4v55 . . . . . . . . . . . . . . .' },
      ] },
      E: { name: 'silence', length: 16, lanes: [] },
    },
  },
  'brostep 150 (Skrillex-style)': {
    bpm: 150, swing: 0, bank: 1, song: true,
    slots: {
      A: { name: 'intro', length: 32, lanes: [
        { name: 'kick', pad: 0, steps: 'X...............|X.......X.......' },
        { name: 'snare', pad: 1, steps: '................|................' },
        { name: 'hat', pad: 3, steps: 'x.x.x.x.x.x.x.x.|x.x.x.x.x.x.xxxx' },
        { name: 'bass', role: 'bass', octave: -2, steps: '1g8w4 . . . . . . . 1g8w8 . . . . . . . 1g8w8t . . . . . . . 1g8w16 . . . . . . .' },
      ] },
      B: { name: 'build', length: 32, lanes: [
        { name: 'kick', pad: 0, steps: 'x...x...x...x...|x.x.x.x.xxxxxxxx' },
        { name: 'snare', pad: 1, steps: 'x...x...x...x...|x.x.x.x.xxxxxxxx' },
        { name: 'hat', pad: 3, steps: 'xxxxxxxxxxxxxxxx|xxxxxxxxxxxxxxxx' },
        { name: 'bass', role: 'bass', octave: -2, steps: '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .' },
      ] },
      C: { name: 'drop', length: 32, lanes: [
        { name: 'kick', pad: 0, steps: 'X.....X...X.....|X.........X..X..' },
        { name: 'snare', pad: 1, steps: '........X.......|........X.....x.' },
        { name: 'hat', pad: 3, steps: 'x.x.x.x.x.x.x.x.|x.x.x.x.x.x.xxxx' },
        { name: 'bass', role: 'bass', octave: -2, steps: '1g2w16a . 1g1w32 1g1w32 . . 1+g2w8t . . . 5-g2w16 . 1g4w8 . . . 1g2w32a . . 3g2w16 . 1g2w8t . . . 1+g2w16a 1g2w16 . 7-g4w4 . . .' },
      ] },
      D: { name: 'outro', length: 32, lanes: [
        { name: 'kick', pad: 0, steps: 'X.......X.......|X.......X.......' },
        { name: 'snare', pad: 1, steps: '........X.......|........X.......' },
        { name: 'hat', pad: 3, steps: 'x.x.x.x.x.x.x.x.|x.x.x.x.x.x.x.x.' },
        { name: 'bass', role: 'bass', octave: -2, steps: '1g16w2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .' },
      ] },
      E: { name: 'silence', length: 16, lanes: [] },
    },
  },
  'DnB two-step 174': {
    bpm: 174, swing: 0, bank: 0,
    slots: { A: { length: 16, lanes: [
      { name: 'kick', pad: 0, steps: 'X.........X.....' },
      { name: 'snare', pad: 1, steps: '....X.......X...' },
      { name: 'hat', pad: 3, steps: 'x.x.x.xox.x.x.xo' },
      { name: 'shaker', pad: 10, steps: 'oooooooooooooooo' },
      { name: 'bass', role: 'bass', octave: -2, steps: '1g6 . . . . . 1g3 . . . 3-g6 . . . . .' },
    ] } },
  },
  'UKG 2-step': {
    bpm: 132, swing: 0.28, bank: 0,
    slots: { A: { length: 16, lanes: [
      { name: 'kick', pad: 0, steps: 'X.........x.....' },
      { name: 'snare', pad: 1, steps: '....X.......X...' },
      { name: 'hat', pad: 3, steps: '..x...x...x...xx' },
      { name: 'rim', pad: 6, steps: '.o...o.....o..o.' },
      { name: 'bass', role: 'bass', octave: -2, steps: '1g2 . . 1g1 . . 5-g2 . . . 1g2 . 3g1 . . .' },
    ] } },
  },
  'trap 140': {
    bpm: 140, swing: 0, bank: 1,
    slots: { A: { length: 32, lanes: [
      { name: 'kick', pad: 0, steps: 'X......X..X.....|X......X...X.X..' },
      { name: 'snare', pad: 1, steps: '........X.......|........X.......' },
      { name: 'hat', pad: 3, steps: 'x.x.x.x.x.xxx.x.|x.x.x.x.xxxxxxxx' },
      { name: 'open hat', pad: 4, steps: '..............x.|..............x.' },
      { name: '808', pad: 5, steps: 'X......X..X.....|X......X...X.X..' },
    ] } },
  },
  'lo-fi 85': {
    bpm: 85, swing: 0.3, bank: 2,
    slots: { A: { length: 16, lanes: [
      { name: 'kick', pad: 0, steps: 'X......x..X.....' },
      { name: 'snare', pad: 1, steps: '....X.......X..o' },
      { name: 'hat', pad: 3, steps: 'x.o.x.o.x.o.x.oo' },
      { name: 'bass', role: 'bass', octave: -2, steps: '1g4 . . . . . . . 6-g3 . . . 5-g3 . . .' },
    ] } },
  },
};
