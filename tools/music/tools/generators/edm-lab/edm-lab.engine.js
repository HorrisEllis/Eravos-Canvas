/* eravos.edm-lab 4.0.0 — the groove workstation (rebuild of 3.0.0 · "rebuild the edm into a complete toolset")
 * Paint where the rhythm is busy, turn TENSION and ENERGY: an 8-lane drum kit, a bassline, chords and a lead follow — always
 * in key. 4.0 adds what a producer reaches for next:
 *   PATTERNS  four 2-bar density maps (A–D), copy between them, chain them (A·B, A·B·C·D, A·A·B·C …)
 *   KIT       8 kits (Lab, 808, 909, Breaks, Garage, Techno, Lo-fi, Trap) + per lane level · tune · decay · pan · mute · solo
 *   BASS      7 styles (follow kick, offbeat, rolling, octave pump, half-time, wobble, acid) · 4 waves · filter, drive, glide, sub
 *   CHORDS    12 progressions · 5 styles (pad, stabs, offbeat, pluck, arp) · octave, brightness, width, attack, release
 *   LEAD      a 4th voice + out port: arps, a seeded hook, chord tones · rate · octave · wave · glide · echo
 *   GROOVE    swing, humanize (seeded timing + velocity), sidechain PUMP from the lab's own kick
 *   ARRANGE   loop, or a 32-bar song (intro → build → drop → break) · FILL · BREAK · DROP with 1–8 bar builds and a riser
 *   OUT       PRINT → a Sequencer · ⤓ MIDI (drums, bass, chords, lead — what you hear, note for note)
 * Everything you hear comes from pure functions of (bar, step) — hits(), bassAt(), chordAt()/voicing(), leadAt() — so the
 * sound, PRINT and the MIDI file can never disagree. No private clock (transport:tick), own compact voices. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const ROWS = ['kick', 'snare', 'ghost', 'hat', 'openhat', 'clap', 'perc', 'shaker'];
  const PAD_OF = { kick: 0, snare: 1, ghost: 1, hat: 3, openhat: 4, clap: 2, perc: 9, shaker: 10 };
  const GM_OF = { kick: 36, snare: 38, ghost: 37, hat: 42, openhat: 46, clap: 39, perc: 64, shaker: 70 };   // General MIDI drums (ch 10)
  const PROG = {
    'i-VI-III-VII': [1, 6, 3, 7], 'i-iv-v-i': [1, 4, 5, 1], 'vi-IV-I-V': [6, 4, 1, 5], 'i-i-VI-VII': [1, 1, 6, 7],
    'I-V-vi-IV': [1, 5, 6, 4], 'i-VII-VI-VII': [1, 7, 6, 7], 'i-iv-VI-v': [1, 4, 6, 5], 'ii-V-I-vi': [2, 5, 1, 6],
    'i-III-VII-VI': [1, 3, 7, 6], 'IV-I-V-vi': [4, 1, 5, 6], 'i-v-VI-iv': [1, 5, 6, 4], 'i (drone)': [1, 1, 1, 1],
  };
  const SLOTS = ['A', 'B', 'C', 'D'];
  const CHAINS = { off: null, 'A·B': ['A', 'B'], 'A·B·C·D': ['A', 'B', 'C', 'D'], 'A·A·B·C': ['A', 'A', 'B', 'C'], 'A·B·A·C': ['A', 'B', 'A', 'C'], 'A·A·A·B': ['A', 'A', 'A', 'B'] };
  // kits: per-voice character — kick pitch from→to, sweep time, decay, click; snare tone/noise; hat brightness/decay …
  const KITS = {
    Lab: { k0: 160, k1: 48, ks: 0.08, kd: 0.38, kc: 0, sn: 210, snHp: 1500, snD: 0.18, hHp: 8000, hD: 0.045, ohD: 0.3, clBp: 1100, pc: 620, sh: 5500, drive: 0 },
    '808': { k0: 120, k1: 42, ks: 0.12, kd: 0.9, kc: 0, sn: 180, snHp: 1200, snD: 0.22, hHp: 7000, hD: 0.04, ohD: 0.45, clBp: 1000, pc: 800, sh: 6000, drive: 0.1 },
    '909': { k0: 230, k1: 52, ks: 0.05, kd: 0.45, kc: 0.6, sn: 240, snHp: 1800, snD: 0.2, hHp: 9000, hD: 0.06, ohD: 0.35, clBp: 1300, pc: 540, sh: 5000, drive: 0.25 },
    Breaks: { k0: 140, k1: 55, ks: 0.06, kd: 0.3, kc: 0.3, sn: 260, snHp: 900, snD: 0.25, hHp: 6000, hD: 0.07, ohD: 0.25, clBp: 900, pc: 700, sh: 4500, drive: 0.35 },
    Garage: { k0: 170, k1: 50, ks: 0.07, kd: 0.35, kc: 0.2, sn: 230, snHp: 2200, snD: 0.14, hHp: 9500, hD: 0.035, ohD: 0.2, clBp: 1500, pc: 900, sh: 7000, drive: 0.1 },
    Techno: { k0: 200, k1: 45, ks: 0.09, kd: 0.55, kc: 0.5, sn: 200, snHp: 1600, snD: 0.16, hHp: 10000, hD: 0.03, ohD: 0.28, clBp: 1200, pc: 480, sh: 6500, drive: 0.5 },
    'Lo-fi': { k0: 110, k1: 50, ks: 0.07, kd: 0.3, kc: 0, sn: 190, snHp: 800, snD: 0.2, hHp: 5000, hD: 0.05, ohD: 0.2, clBp: 800, pc: 500, sh: 4000, drive: 0.2 },
    Trap: { k0: 130, k1: 38, ks: 0.15, kd: 1.2, kc: 0.2, sn: 220, snHp: 2000, snD: 0.15, hHp: 9000, hD: 0.025, ohD: 0.4, clBp: 1400, pc: 1000, sh: 7500, drive: 0.15 },
  };
  const BASS_STYLES = ['follow kick', 'offbeat', 'rolling', 'octave pump', 'half-time', 'wobble', 'acid'];
  const CHORD_STYLES = ['pad', 'stabs', 'offbeat', 'pluck', 'arp'];
  const LEAD_STYLES = ['arp up', 'arp down', 'arp up-down', 'random', 'hook', 'chord tones'];
  const RATE_STEPS = { '1/4': 4, '1/8': 2, '1/16': 1 };
  const WOB = { '1/2': 0.5, '1/4': 1, '1/8': 2, '1/8T': 3, '1/16': 4 };   // wobbles per beat

  function blank() { return ROWS.map(() => new Array(32).fill(0)); }
  const MAP_KINDS = ['ukg', 'dubstep', 'house', 'neuro', 'lofi', 'techno', 'trance', 'dnb', 'trap', 'hardstyle', 'breakbeat', 'future', 'moombah', 'drill', 'empty'];
  function presetMap(kind) {
    const m = blank(); const set = (r, steps, v) => steps.forEach(s => { m[ROWS.indexOf(r)][s] = v; });
    const every = (n, off) => Array.from({ length: 32 }, (_, i) => i).filter(i => (i - (off || 0)) % n === 0);
    if (kind === 'empty') return m;
    if (kind === 'ukg') { set('kick', [0, 10, 16, 26], 1); set('snare', [4, 12, 20, 28], 0.95); set('hat', every(4, 2), 0.9); set('ghost', [7, 15, 23, 30], 0.5); set('shaker', every(2, 1), 0.4); set('perc', [3, 19], 0.5); }
    else if (kind === 'dubstep') { set('kick', [0, 10, 16, 22, 26], 1); set('snare', [8, 24], 1); set('clap', [8, 24], 0.8); set('hat', every(4, 2), 0.85); set('ghost', [14, 30], 0.45); set('openhat', [30], 0.5); }
    else if (kind === 'house') { set('kick', every(4), 1); set('clap', [4, 12, 20, 28], 0.9); set('openhat', every(4, 2), 0.85); set('hat', every(2, 1), 0.5); set('shaker', every(1), 0.3); }
    else if (kind === 'neuro') { set('kick', [0, 10, 16, 26], 1); set('snare', [4, 12, 20, 28], 1); set('hat', every(2), 0.7); set('ghost', [6, 14, 18, 22, 30], 0.5); set('perc', [11, 27], 0.4); }
    else if (kind === 'techno') { set('kick', every(4), 1); set('clap', [4, 12, 20, 28], 0.7); set('hat', every(4, 2), 1); set('openhat', [14, 30], 0.6); set('perc', [3, 7, 11, 19, 23, 27], 0.45); set('shaker', every(1), 0.25); }
    else if (kind === 'trance') { set('kick', every(4), 1); set('clap', [4, 12, 20, 28], 0.85); set('openhat', every(4, 2), 1); set('hat', every(1), 0.35); set('snare', [28, 29, 30, 31], 0.5); }
    else if (kind === 'dnb') { set('kick', [0, 10, 16, 26], 1); set('snare', [4, 12, 20, 28], 1); set('hat', every(2), 0.75); set('ghost', [7, 9, 15, 23, 25, 31], 0.4); set('shaker', every(1), 0.3); }
    else if (kind === 'trap') { set('kick', [0, 7, 10, 16, 23, 26], 0.95); set('snare', [8, 24], 1); set('clap', [8, 24], 0.9); set('hat', every(1), 0.75); set('openhat', [14, 30], 0.5); set('perc', [5, 21], 0.35); }
    else if (kind === 'hardstyle') { set('kick', every(4), 1); set('clap', [4, 12, 20, 28], 0.8); set('openhat', every(4, 2), 0.9); set('hat', every(2, 1), 0.4); }
    else if (kind === 'breakbeat') { set('kick', [0, 6, 10, 16, 19, 26], 0.95); set('snare', [4, 12, 20, 28], 1); set('ghost', [7, 14, 23, 31], 0.4); set('hat', every(2), 0.7); set('openhat', [10, 26], 0.4); }
    else if (kind === 'future') { set('kick', [0, 10, 16, 26], 1); set('snare', [8, 24], 1); set('clap', [8, 24], 0.9); set('hat', every(2), 0.55); set('perc', [6, 14, 22, 30], 0.45); set('shaker', every(2, 1), 0.35); }
    else if (kind === 'moombah') { set('kick', every(4), 1); set('snare', [3, 6, 11, 14, 19, 22, 27, 30], 0.85); set('hat', every(2), 0.5); set('perc', [2, 10, 18, 26], 0.5); }
    else if (kind === 'drill') { set('kick', [0, 11, 16, 27], 0.95); set('snare', [8, 24], 1); set('hat', [0, 3, 6, 8, 10, 12, 15, 16, 19, 22, 24, 26, 28, 31], 0.7); set('perc', [14, 30], 0.4); }
    else { set('kick', [0, 7, 10, 16, 23], 0.9); set('snare', [4, 12, 20, 28], 0.85); set('hat', every(2), 0.55); set('ghost', [15, 31], 0.35); set('shaker', every(4, 3), 0.3); }
    return m;
  }
  const LANE0 = () => ({ level: 1, tune: 0, decay: 1, pan: 0, mute: false, solo: false });
  const lanesBlank = () => ROWS.map(LANE0);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------------------------------------------------------------- a tiny Standard MIDI File writer (type 1, 96 ppq)
  function midiFile(tracks, bpm) {
    const vlq = (n) => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
    const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255], str = (s) => Array.from(s, c => c.charCodeAt(0) & 127);
    const chunk = (id, data) => str(id).concat(u32(data.length), data);
    const mpq = Math.round(60000000 / bpm);
    const head = chunk('MThd', [0, 1, 0, tracks.length + 1, 0, 96]);
    const tempo = chunk('MTrk', [0, 0xff, 0x51, 3, (mpq >> 16) & 255, (mpq >> 8) & 255, mpq & 255, 0, 0xff, 0x58, 4, 4, 2, 24, 8, 0, 0xff, 0x2f, 0]);
    const body = tracks.map(t => {
      const ev = []; t.notes.forEach(n => { ev.push({ at: n.at, on: true, n: n.n, v: n.v }); ev.push({ at: n.at + Math.max(1, n.len), on: false, n: n.n, v: 0 }); });
      ev.sort((a, b) => a.at - b.at || (a.on ? 1 : 0) - (b.on ? 1 : 0));
      const d = [0, 0xff, 0x03].concat(vlq(t.name.length), str(t.name)); let last = 0;
      ev.forEach(e => { d.push(...vlq(e.at - last), (e.on ? 0x90 : 0x80) | t.ch, e.n & 127, e.v & 127); last = e.at; });
      d.push(0, 0xff, 0x2f, 0); return chunk('MTrk', d);
    });
    return Uint8Array.from([].concat(head, tempo, ...body));
  }

  OrganismFactory.define({
    id: 'eravos.edm-lab', domain: 'music', version: '4.0.0', label: 'EDM Lab', icon: '⚗', accent: '#ff2266', phase: 'P6',
    category: 'Generators', blurb: 'A groove workstation: paint the drums, turn TENSION and ENERGY — kit, bass, chords and a lead follow in key. Patterns, chains, a 32-bar song, PRINT and MIDI.',
    size: { w: 980, h: 680 }, minSize: { w: 640, h: 460 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.audio_out', 'capability.generation'],
    hooks: [
      S.audio_out('lab.hook.out_rhythm', 'rhythm'), S.audio_out('lab.hook.out_bass', 'bass'), S.audio_out('lab.hook.out_harmony', 'harmony'), S.audio_out('lab.hook.out_lead', 'lead'),
      S.transport_in('lab.hook.transport_in'), S.theory_in('lab.hook.theory_in'),
      S.event('lab.hook.print_out', 'out', 'seq:pattern_suggest', { type: 'object', required: ['target', 'track', 'steps'] }, '1.0.0'),
      S.event('lab.hook.drop_out', 'out', 'edm:drop-fired', { type: 'object', required: ['time'] }, '1.0.0'),
      S.mod_in('lab.hook.mod_energy', 'energy'), S.mod_in('lab.hook.mod_tension', 'tension'), S.mod_in('lab.hook.mod_pump', 'pump'), S.mod_in('lab.hook.mod_cutoff', 'bassCutoff'),
    ],
    face: ['energy', 'tension', 'bassStyle', 'chordStyle', 'pump', 'swing'],
    config: [
      { key: 'energy', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'ENERGY', group: 'MACRO', hint: 'how busy and bright everything is — one knob arrangement' },
      { key: 'tension', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'TENSION', group: 'MACRO', hint: 'triads → add9 → sevenths → clusters' },
      { key: 'swing', type: 'number', default: 0.1, min: 0, max: 0.6, step: 0.01, label: 'Swing', group: 'GROOVE' },
      { key: 'humanize', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Humanize', group: 'GROOVE', hint: 'timing ±8 ms and velocity ±25 % — seeded, the same every play' },
      { key: 'density', type: 'number', default: 1, min: 0, max: 2, step: 0.01, label: 'Density', group: 'GROOVE', hint: '× every painted cell: 0 sparse … 2 everything you painted fires' },
      { key: 'seed', type: 'integer', default: 7, min: 1, max: 99999, label: 'Seed', group: 'GROOVE' },
      { key: 'pattern', type: 'enum', options: SLOTS, default: 'A', label: 'Pattern', group: 'PATTERN' },
      { key: 'chain', type: 'enum', options: Object.keys(CHAINS), default: 'off', label: 'Chain', group: 'PATTERN', hint: 'play the patterns in turn, 2 bars each' },
      { key: 'kit', type: 'enum', options: Object.keys(KITS), default: 'Lab', label: 'Kit', group: 'RHYTHM' },
      { key: 'kitDrive', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Drum drive', group: 'RHYTHM' },
      { key: 'bassStyle', type: 'enum', options: BASS_STYLES, default: 'follow kick', label: 'Bass style', group: 'BASS' },
      { key: 'bassWave', type: 'enum', options: ['saw', 'square', 'sine', 'fm'], default: 'saw', label: 'Wave', group: 'BASS' },
      { key: 'bassOctave', type: 'integer', default: 1, min: 0, max: 3, label: 'Octave', group: 'BASS' },
      { key: 'bassCutoff', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Cutoff', group: 'BASS' },
      { key: 'bassRes', type: 'number', default: 4, min: 0.5, max: 24, step: 0.1, label: 'Reso', group: 'BASS' },
      { key: 'bassEnv', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Env', group: 'BASS', hint: 'how far the filter opens on each note' },
      { key: 'bassDrive', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'BASS' },
      { key: 'bassGlide', type: 'number', default: 0.03, min: 0, max: 0.5, step: 0.005, unit: 's', label: 'Glide', group: 'BASS' },
      { key: 'bassSub', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Sub', group: 'BASS' },
      { key: 'wobble', type: 'enum', options: Object.keys(WOB), default: '1/8', label: 'Wobble', group: 'BASS', hint: 'rate of the wobble style, locked to the beat' },
      { key: 'progression', type: 'enum', options: Object.keys(PROG), default: 'i-VI-III-VII', label: 'Chords', group: 'HARMONY' },
      { key: 'chordBars', type: 'enum', options: [1, 2, 4], default: 1, label: 'Bars/chord', group: 'HARMONY' },
      { key: 'chordStyle', type: 'enum', options: CHORD_STYLES, default: 'pad', label: 'Style', group: 'HARMONY' },
      { key: 'chordOctave', type: 'integer', default: 3, min: 1, max: 6, label: 'Octave', group: 'HARMONY' },
      { key: 'chordBright', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Bright', group: 'HARMONY' },
      { key: 'chordWidth', type: 'number', default: 7, min: 0, max: 40, step: 0.5, unit: 'c', label: 'Width', group: 'HARMONY' },
      { key: 'chordAttack', type: 'number', default: 0.35, min: 0.002, max: 4, step: 0.001, unit: 's', label: 'Attack', group: 'HARMONY' },
      { key: 'chordRelease', type: 'number', default: 0.4, min: 0.02, max: 6, step: 0.01, unit: 's', label: 'Release', group: 'HARMONY' },
      { key: 'leadStyle', type: 'enum', options: LEAD_STYLES, default: 'arp up', label: 'Lead', group: 'LEAD' },
      { key: 'leadRate', type: 'enum', options: Object.keys(RATE_STEPS), default: '1/8', label: 'Rate', group: 'LEAD' },
      { key: 'leadOctave', type: 'integer', default: 5, min: 2, max: 7, label: 'Octave', group: 'LEAD' },
      { key: 'leadWave', type: 'enum', options: ['square', 'saw', 'triangle', 'sine'], default: 'square', label: 'Wave', group: 'LEAD' },
      { key: 'leadCutoff', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Bright', group: 'LEAD' },
      { key: 'leadGate', type: 'number', default: 0.6, min: 0.05, max: 1, step: 0.01, label: 'Gate', group: 'LEAD' },
      { key: 'leadGlide', type: 'number', default: 0, min: 0, max: 0.4, step: 0.005, unit: 's', label: 'Glide', group: 'LEAD' },
      { key: 'leadEcho', type: 'number', default: 0.3, min: 0, max: 0.9, step: 0.01, label: 'Echo', group: 'LEAD', hint: 'dotted-8th echo, locked to the tempo' },
      { key: 'pump', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'PUMP', group: 'GROOVE', hint: 'sidechain: bass, chords and lead duck on every kick' },
      { key: 'pumpRelease', type: 'number', default: 0.18, min: 0.03, max: 0.6, step: 0.01, unit: 's', label: 'Pump release', group: 'GROOVE' },
      { key: 'arrange', type: 'enum', options: ['loop', 'song'], default: 'loop', label: 'Arrange', group: 'ARRANGE', hint: 'song: a 32-bar arc — intro · build · drop · break — then round again' },
      { key: 'buildBars', type: 'enum', options: [1, 2, 4, 8], default: 1, label: 'Build bars', group: 'ARRANGE', hint: 'how long DROP builds (riser + snare roll) before the impact' },
      { key: 'riser', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Riser', group: 'ARRANGE' },
      { key: 'rhythmLevel', type: 'number', default: 0.9, min: 0, max: 1.5, step: 0.01, label: 'Drums', group: 'LEVELS' },
      { key: 'bassLevel', type: 'number', default: 0.8, min: 0, max: 1.5, step: 0.01, label: 'Bass', group: 'LEVELS' },
      { key: 'harmonyLevel', type: 'number', default: 0.5, min: 0, max: 1.5, step: 0.01, label: 'Chords', group: 'LEVELS' },
      { key: 'leadLevel', type: 'number', default: 0.45, min: 0, max: 1.5, step: 0.01, label: 'Lead', group: 'LEVELS' },
      { key: 'rhythmOn', type: 'boolean', default: true, label: 'Drums', group: 'LEVELS' },
      { key: 'bassOn', type: 'boolean', default: true, label: 'Bass', group: 'LEVELS' },
      { key: 'harmonyOn', type: 'boolean', default: true, label: 'Chords', group: 'LEVELS' },
      { key: 'leadOn', type: 'boolean', default: false, label: 'Lead', group: 'LEVELS' },
    ],
    ui_hooks: ['paint', 'clear', 'reseed', 'mutate', 'drop_arm', 'fill', 'break', 'print', 'pattern_copy', 'lane', 'map_kind', 'export_midi'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const node = (n) => { ctx.track(n); return n; };
      // ---- outs: voice → duck (sidechain) → level → port
      const outs = {}, duck = {};
      ['rhythm', 'bass', 'harmony', 'lead'].forEach(k => { const g = ac.createGain(); outs[k] = g; ctx.port(k, { kind: 'audio', direction: 'out', node: g, label: k }); if (k !== 'rhythm') { duck[k] = node(ac.createGain()); duck[k].connect(g); } });
      let breakOn = false, section = null;
      const secMul = (k) => { if (!section) return 1; const m = { intro: { rhythm: 0.7, bass: 0, harmony: 1, lead: 0 }, build: { rhythm: 0.85, bass: 0.5, harmony: 1, lead: 0.7 }, drop: { rhythm: 1, bass: 1, harmony: 0.8, lead: 1 }, break: { rhythm: 0, bass: 0, harmony: 1, lead: 1 } }[section]; return m ? m[k] : 1; };
      const levelOf = (k) => (P.get(k + 'On') ? P.get(k + 'Level') : 0) * ((breakOn && (k === 'rhythm' || k === 'bass')) ? 0 : 1) * secMul(k);
      const levels = (t) => ['rhythm', 'bass', 'harmony', 'lead'].forEach(k => outs[k].gain.setTargetAtTime(levelOf(k), t || ac.currentTime, 0.02));
      levels(); ['rhythmLevel', 'bassLevel', 'harmonyLevel', 'leadLevel', 'rhythmOn', 'bassOn', 'harmonyOn', 'leadOn'].forEach(k => P.onChange(k, () => levels()));
      // event-rate modulation inputs: summing bus sampled by an analyser at tick time
      const modIn = (key) => { const cs = ctx.modBus(key, { min: 0, max: 1 }); const an = ac.createAnalyser(); an.fftSize = 32; cs.connect(an); const b = new Float32Array(32); return () => { an.getFloatTimeDomainData(b); return b[b.length - 1] || 0; }; };
      const modE = modIn('energy'), modT = modIn('tension'), modP = modIn('pump'), modC = modIn('bassCutoff');
      let dropBoost = 0, secBoost = 0, dropArm = null, fillBar = null, fillNext = false;
      const energy = () => clamp(P.get('energy') + modE() + dropBoost + secBoost, 0, 1);
      const tension = () => clamp(P.get('tension') + modT(), 0, 1);
      const pump = () => clamp(P.get('pump') + modP(), 0, 1);

      // ---- patterns (A–D) + lanes, held in `extra`
      const patterns = { A: presetMap('dubstep'), B: presetMap('dubstep'), C: presetMap('empty'), D: presetMap('empty') };
      let lanes = lanesBlank();
      const cur = () => P.get('pattern');
      const patternAt = (bar) => { const ch = CHAINS[P.get('chain')]; return ch ? ch[Math.floor(bar / 2) % ch.length] : cur(); };
      const mapAt = (bar) => patterns[patternAt(bar)];
      const hitRand = (bar, row, step) => dsp.mulberry32((P.get('seed') * 7919 + bar * 131 + row * 17 + step) >>> 0)();
      ctx.hitRand = hitRand;
      const audible = (i) => { const solo = lanes.some(l => l.solo); return !lanes[i].mute && (!solo || lanes[i].solo); };
      // which rows fire at (bar, step16 within bar) — deterministic per seed + map + energy (+ fill / build roll)
      function hits(bar, step) {
        const m = mapAt(bar), s32 = (bar % 2) * 16 + step, e = energy(), dn = P.get('density');
        const out = ROWS.map((r, i) => m[i][s32] > 0 && hitRand(bar, i, step) < m[i][s32] * (0.35 + 0.65 * e) * dn * (r === 'kick' || r === 'snare' ? 1.4 : 1) ? m[i][s32] : 0);
        if (fillBar === bar && step >= 8) { out[1] = Math.max(out[1], 0.4 + 0.6 * (step - 8) / 7); if (step % 2 === 0) out[6] = Math.max(out[6], 0.6); }
        if (dropArm && dropArm.buildBar !== null && bar >= dropArm.buildBar && bar < dropArm.buildBar + dropArm.bars) {
          const k = (bar - dropArm.buildBar) / dropArm.bars, div = k < 0.5 ? 4 : k < 0.75 ? 2 : 1;   // the roll doubles as the build goes on
          if (step % div === 0) out[1] = Math.max(out[1], 0.3 + 0.7 * (k + step / 16 / dropArm.bars));
        }
        return out;
      }
      ctx.hits = hits;

      // ---- harmony: progression → chord → voicing (tension)
      function chordAt(bar) { const prog = PROG[P.get('progression')]; return prog[Math.floor(bar / P.get('chordBars')) % prog.length]; }
      ctx.chordAt = chordAt;
      function voicing(degree, ten) {
        const k = ctx.key, o = P.get('chordOctave'); const tri = MT.chord(degree, k.root, k.scale, 'triad', o); const r = tri[0];
        if (ten < 0.25) return { notes: tri.concat([tri[0] + 12]), cut: 1600 };
        if (ten < 0.5) return { notes: [tri[0], tri[1], tri[2], MT.degreeToMidi(degree + 8, o, k.root, k.scale)], cut: 2000 };             // add9
        if (ten < 0.75) { const s = MT.chord(degree, k.root, k.scale, 'sus4', o); return { notes: [s[0], s[1], s[2], MT.degreeToMidi(degree + 6, o, k.root, k.scale)], cut: 2400 }; } // 7sus4
        return { notes: [r, r + 6, r + 13, tri[2] + 12], cut: 900 };                                                                   // cluster: tritone + b9, squeezed
      }
      ctx.voicing = voicing;
      // chord gates per style: [{s, len}] in 16ths inside one bar
      function chordGates(style) {
        if (style === 'stabs') return [{ s: 0, l: 2 }, { s: 3, l: 2 }, { s: 6, l: 2 }, { s: 10, l: 2 }];
        if (style === 'offbeat') return [2, 6, 10, 14].map(s => ({ s, l: 1.5 }));
        if (style === 'pluck') return [0, 4, 8, 12].map(s => ({ s, l: 1 }));
        if (style === 'arp') return Array.from({ length: 16 }, (_, s) => ({ s, l: 0.9, arp: s }));
        return [{ s: 0, l: 16 * P.get('chordBars'), pad: true }];
      }

      // ---- bass: style → note at (bar, step) or null — {midi, len (16ths), glide, accent}
      const kickPeak = (m, s32) => { const kd = m[0]; return kd[s32] >= 0.5 && kd[s32] >= (kd[(s32 + 31) % 32] || 0) && kd[s32] >= (kd[(s32 + 1) % 32] || 0); };
      function bassAt(bar, step) {
        const k = ctx.key, deg = chordAt(bar), e = energy(), base = P.get('bassOctave'), st = P.get('bassStyle'), m = mapAt(bar), s32 = (bar % 2) * 16 + step;
        const at = (dOff, oct, len, glide, accent) => ({ midi: MT.degreeToMidi(deg + dOff, oct, k.root, k.scale), len, glide: !!glide, accent: !!accent });
        if (st === 'follow kick') { if (!kickPeak(m, s32)) return null; return at(0, step % 8 === 4 && e > 0.7 ? base + 1 : base, e > 0.6 ? 1.6 : 2.5, step % 4 !== 0); }
        if (st === 'offbeat') return step % 4 === 2 ? at(0, base, 1.5, false) : null;
        if (st === 'rolling') return kickPeak(m, s32) ? null : at(0, base, 0.9, false, step % 4 === 2);
        if (st === 'octave pump') return step % 2 === 0 ? at(0, step % 4 === 2 ? base + 1 : base, 1.6, false) : null;
        if (st === 'half-time') return step === 0 ? at(0, base, 9, false) : step === 10 ? at(0, base, 5, true) : null;
        if (st === 'wobble') return step === 0 ? at(0, base, 7.8, false) : step === 8 ? at(e > 0.7 && bar % 2 ? 4 : 0, base, 7.8, true) : null;
        if (st === 'acid') {   // seeded 16th line: rests, accents, slides, chord-tone and scale jumps
          const r = dsp.mulberry32((P.get('seed') * 104729 + bar % 2 * 31 + step * 7) >>> 0); if (r() > 0.45 + 0.4 * e) return null;
          const jump = [0, 0, 0, 2, 4, 7, 0, -1][Math.floor(r() * 8)], up = r() < 0.25 ? 1 : 0;
          return at(jump, base + up, 0.9, r() < 0.3, r() < 0.3);
        }
        return null;
      }
      ctx.bassAt = bassAt;

      // ---- lead: style → note at (bar, step) or null
      function leadAt(bar, step) {
        const rate = RATE_STEPS[P.get('leadRate')]; if (step % rate) return null;
        const k = ctx.key, deg = chordAt(bar), o = P.get('leadOctave'), st = P.get('leadStyle'), i = Math.floor(step / rate) + bar * (16 / rate);
        const tones = [0, 2, 4, 7].map(d => MT.degreeToMidi(deg + d, o, k.root, k.scale));
        const len = rate * P.get('leadGate');
        if (st === 'arp up') return { midi: tones[i % 4], len };
        if (st === 'arp down') return { midi: tones[3 - (i % 4)], len };
        if (st === 'arp up-down') { const seq = [0, 1, 2, 3, 2, 1]; return { midi: tones[seq[i % 6]], len }; }
        if (st === 'chord tones') return step % (rate * 2) === 0 ? { midi: tones[(Math.floor(i / 2) * 3) % 4], len: len * 2 } : null;
        const r = dsp.mulberry32((P.get('seed') * 15485863 + (st === 'hook' ? (bar % 2) * 64 + step : bar * 64 + step)) >>> 0);
        if (st === 'random') return r() < 0.7 ? { midi: tones[Math.floor(r() * 4)] + (r() < 0.2 ? 12 : 0), len } : null;
        // hook: a seeded 2-bar motif in the scale — the same phrase every time round, over the moving chords
        if (r() < 0.32) return null;
        return { midi: MT.degreeToMidi(deg + [0, 2, 4, 1, 3, 5, 7, 4][Math.floor(r() * 8)], o, k.root, k.scale), len: len * (r() < 0.3 ? 2 : 1) };
      }
      ctx.leadAt = leadAt;

      // ---------------------------------------------------------------- voices
      // drums: 8 lane strips (level · pan) → kit drive → rhythm
      // the drive stage is only in the path while it drives: an idle WaveShaper still costs the kick its first samples
      const kitBus = node(ac.createGain()), kitSh = node(ac.createWaveShaper()); kitSh.connect(outs.rhythm);
      const shapeKit = () => { const d = clamp(P.get('kitDrive') + KITS[P.get('kit')].drive * 0.5, 0, 1); try { kitBus.disconnect(); } catch (e) {} if (d > 0.01) { kitSh.curve = dsp.curve('tanh', d); kitBus.connect(kitSh); } else kitBus.connect(outs.rhythm); kitBus.gain.value = 1 / (1 + d * 0.6); };
      shapeKit(); ['kit', 'kitDrive'].forEach(k => P.onChange(k, shapeKit));
      const strips = ROWS.map(() => { const g = node(ac.createGain()), p = node(ac.createStereoPanner()); g.gain.value = Math.SQRT2; g.connect(p); p.connect(kitBus); return { g, p }; });
      // ×√2: an equal-power panner puts a centred mono hit at −3 dB a side — centred lanes stay as loud as the 3.0 lab
      const applyLanes = () => lanes.forEach((l, i) => { strips[i].g.gain.setTargetAtTime(audible(i) ? l.level * Math.SQRT2 : 0, ac.currentTime, 0.01); strips[i].p.pan.setTargetAtTime(l.pan, ac.currentTime, 0.01); });
      applyLanes();
      const noiseBuf = dsp.noise(ac, 1);
      const nz = (t, d) => { const n = ac.createBufferSource(); n.buffer = noiseBuf; n.start(t, Math.random() * 0.5); n.stop(t + d); return n; };
      const env = (g, t, pk, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0005, t + d); };
      const KT = () => KITS[P.get('kit')];
      const tn = (i) => Math.pow(2, lanes[i].tune / 12), dc = (i) => lanes[i].decay;
      const V = {
        kick(t, v, i) { const K = KT(), o = ac.createOscillator(); o.frequency.setValueAtTime(K.k0 * tn(i), t); o.frequency.exponentialRampToValueAtTime(K.k1 * tn(i), t + K.ks); const g = ac.createGain(); env(g, t, v, K.kd * dc(i)); o.connect(g); g.connect(strips[i].g); o.start(t); o.stop(t + K.kd * dc(i) + 0.05);
          if (K.kc) { const n = nz(t, 0.012), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000; const cg = ac.createGain(); env(cg, t, v * K.kc * 0.5, 0.01); n.connect(f); f.connect(cg); cg.connect(strips[i].g); } },
        snare(t, v, i) { const K = KT(), n = nz(t, 0.4), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = K.snHp; const g = ac.createGain(); env(g, t, v * 0.7, K.snD * dc(i)); n.connect(f); f.connect(g); g.connect(strips[i].g); const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = K.sn * tn(i); const og = ac.createGain(); env(og, t, v * 0.4, 0.08 * dc(i)); o.connect(og); og.connect(strips[i].g); o.start(t); o.stop(t + 0.1 * dc(i) + 0.05); },
        ghost(t, v, i) { const n = nz(t, 0.1), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2500 * tn(i); const g = ac.createGain(); env(g, t, v * 0.25, 0.07 * dc(i)); n.connect(f); f.connect(g); g.connect(strips[i].g); },
        hat(t, v, i) { const K = KT(), n = nz(t, 0.2), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = Math.min(18000, K.hHp * tn(i)); const g = ac.createGain(); env(g, t, v * 0.35, K.hD * dc(i)); n.connect(f); f.connect(g); g.connect(strips[i].g); },
        openhat(t, v, i) { const K = KT(), n = nz(t, 1), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = Math.min(18000, K.hHp * 0.88 * tn(i)); const g = ac.createGain(); env(g, t, v * 0.3, K.ohD * dc(i)); n.connect(f); f.connect(g); g.connect(strips[i].g); },
        clap(t, v, i) { const K = KT(), n = nz(t, 0.4), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = K.clBp * tn(i); f.Q.value = 1.5; const g = ac.createGain(); g.gain.setValueAtTime(0, t); [0, 0.009, 0.018].forEach(d => { g.gain.setValueAtTime(v * 0.8, t + d); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.008); }); g.gain.setValueAtTime(v * 0.5, t + 0.027); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18 * dc(i)); n.connect(f); f.connect(g); g.connect(strips[i].g); },
        perc(t, v, i) { const K = KT(), c = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(); c.frequency.value = K.pc * tn(i); m.frequency.value = K.pc * tn(i) * 1.41; mg.gain.setValueAtTime(900, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.12); m.connect(mg); mg.connect(c.frequency); const g = ac.createGain(); env(g, t, v * 0.35, 0.12 * dc(i)); c.connect(g); g.connect(strips[i].g); c.start(t); m.start(t); c.stop(t + 0.12 * dc(i) + 0.05); m.stop(t + 0.12 * dc(i) + 0.05); },
        shaker(t, v, i) { const K = KT(), n = nz(t, 0.3), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = Math.min(18000, K.sh * tn(i)); const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * 0.18, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.08 * dc(i)); n.connect(f); f.connect(g); g.connect(strips[i].g); },
      };

      // bass: osc (saw / square / sine / FM) + sub → LP (env, wobble LFO) → drive → amp → duck
      const bOsc = node(ac.createOscillator()), bSub = node(ac.createOscillator()); bSub.type = 'sine';
      const bFmOsc = node(ac.createOscillator()), bFmG = node(ac.createGain()); bFmOsc.connect(bFmG); bFmG.connect(bOsc.frequency); bFmG.gain.value = 0;
      const bLp = node(ac.createBiquadFilter()); bLp.type = 'lowpass'; const bSh = node(ac.createWaveShaper());
      const bAmp = node(ac.createGain()); bAmp.gain.value = 0; const bSubG = node(ac.createGain());
      const wob = node(ac.createOscillator()), wobG = node(ac.createGain()); wob.type = 'sine'; wobG.gain.value = 0; wob.connect(wobG); wobG.connect(bLp.frequency);
      bOsc.connect(bLp); bSub.connect(bSubG); bLp.connect(bSh); bSubG.connect(bSh); bSh.connect(bAmp); bAmp.connect(duck.bass);   // the sub shares the soft clip (3.0's level)
      [bOsc, bSub, bFmOsc].forEach(o => { o.frequency.value = 55; o.start(); }); wob.start();
      // Cutoff 0.5 = the 3.0 lab's tone; each 0.1 is ±0.6 octave (1/8× … 8×) — cutK scales every filter frequency below
      let tickBpm = null; const bpmNow = () => tickBpm || ctx.bpm;   // the tempo the ticks really run at (a sixteenth = 15 / bpm s)
      const cutK = () => Math.pow(2, 6 * (clamp(P.get('bassCutoff') + modC(), 0, 1) - 0.5)), bassCut = () => 300 * cutK();
      function voiceBass() {
        const w = P.get('bassWave'); bOsc.type = w === 'fm' ? 'sine' : w === 'saw' ? 'sawtooth' : w;
        bFmG.gain.setTargetAtTime(0, ac.currentTime, 0.01);
        bLp.Q.value = P.get('bassRes'); bSh.curve = dsp.curve('tanh', 0.05 + 0.95 * P.get('bassDrive')); bSubG.gain.value = P.get('bassSub');
        const wr = WOB[P.get('wobble')] * bpmNow() / 60; wob.frequency.setTargetAtTime(wr, ac.currentTime, 0.01);
        wobG.gain.setTargetAtTime(P.get('bassStyle') === 'wobble' ? bassCut() * 0.9 : 0, ac.currentTime, 0.02);
        if (P.get('bassStyle') !== 'wobble') bLp.frequency.setTargetAtTime(bassCut(), ac.currentTime, 0.05);
      }
      voiceBass(); ['bassWave', 'bassRes', 'bassDrive', 'bassSub', 'wobble', 'bassStyle', 'bassCutoff'].forEach(k => P.onChange(k, voiceBass)); ctx.onBpm(voiceBass);
      let bassLog = [];
      function bassNote(t, n, dur) {
        const f = MT.hz(n.midi), gl = P.get('bassGlide');
        if (n.glide && gl > 0) { bOsc.frequency.setTargetAtTime(f, t, gl / 3); bSub.frequency.setTargetAtTime(f / 2, t, gl / 3); bFmOsc.frequency.setTargetAtTime(f * 2, t, gl / 3); }
        else { bOsc.frequency.setValueAtTime(f, t); bSub.frequency.setValueAtTime(f / 2, t); bFmOsc.frequency.setValueAtTime(f * 2, t); }
        const e = energy(), envAmt = P.get('bassEnv') * (n.accent ? 1.4 : 1);
        if (P.get('bassWave') === 'fm') { bFmG.gain.cancelScheduledValues(t); bFmG.gain.setValueAtTime(f * (1 + 3 * envAmt * e), t); bFmG.gain.setTargetAtTime(f * 0.4, t + 0.01, 0.1); }
        if (P.get('bassStyle') !== 'wobble') { const k = cutK(); bLp.frequency.cancelScheduledValues(t); bLp.frequency.setValueAtTime(Math.min(18000, (200 + 2200 * e) * k * (0.4 + envAmt)), t); bLp.frequency.setTargetAtTime((120 + 300 * e) * k, t + 0.01, 0.08); }
        else wob.frequency.setValueAtTime(WOB[P.get('wobble')] * bpmNow() / 60, t);
        bAmp.gain.cancelScheduledValues(t); bAmp.gain.setValueAtTime(bAmp.gain.value, t); bAmp.gain.linearRampToValueAtTime(n.accent ? 0.7 : 0.55, t + 0.005); bAmp.gain.setTargetAtTime(0, t + dur, 0.03);
        bassLog.push({ t, midi: n.midi, name: MT.noteName(n.midi) }); if (bassLog.length > 32) bassLog.shift();
        ctx.emitUI('bass_note', { time: t, midi: n.midi, name: MT.noteName(n.midi) });
      }

      // harmony: 4 voices (triangle + detuned saw) → LP → duck
      const hLp = node(ac.createBiquadFilter()); hLp.type = 'lowpass'; hLp.frequency.value = 1800; hLp.Q.value = 0.7; hLp.connect(duck.harmony);
      const hVoices = Array.from({ length: 4 }, (_, i) => { const a = node(ac.createOscillator()), b = node(ac.createOscillator()); a.type = 'triangle'; b.type = 'sawtooth'; const bg = node(ac.createGain()); bg.gain.value = 0.25; const g = node(ac.createGain()); g.gain.value = 0; a.connect(g); b.connect(bg); bg.connect(g); g.connect(hLp); a.start(); b.start(); return { a, b, g, i }; });
      const widen = () => hVoices.forEach(v => { v.b.detune.value = P.get('chordWidth') * (v.i % 2 ? 1 : -1); }); widen(); P.onChange('chordWidth', widen);
      let lastChord = null;
      function setChord(t, degree) {
        const v = voicing(degree, tension()), e = energy();
        v.notes.forEach((n, i) => { const hv = hVoices[i]; hv.a.frequency.setTargetAtTime(MT.hz(n), t, 0.02); hv.b.frequency.setTargetAtTime(MT.hz(n), t, 0.02); });
        hLp.frequency.setTargetAtTime(v.cut * (0.5 + e) * Math.pow(2, 3 * (P.get('chordBright') - 0.5)), t, 0.3); hLp.Q.setTargetAtTime(tension() > 0.75 ? 6 : 0.7, t, 0.3);
        lastChord = { degree, notes: v.notes, name: MT.chordName(v.notes.slice().sort((a, b) => a - b)) };
        ctx.emitUI('chord', Object.assign({ time: t }, lastChord));
      }
      function gateChord(t, gate, sd) {
        const A = P.get('chordAttack'), R = P.get('chordRelease');
        hVoices.forEach((hv, i) => {
          if (gate.arp !== undefined && gate.arp % 4 !== i) return;
          hv.g.gain.cancelScheduledValues(t); hv.g.gain.setValueAtTime(hv.g.gain.value, t);
          if (gate.pad) { hv.g.gain.setTargetAtTime(0.12, t, A); return; }
          hv.g.gain.linearRampToValueAtTime(gate.arp !== undefined ? 0.2 : 0.14, t + Math.min(A, gate.l * sd * 0.5)); hv.g.gain.setTargetAtTime(0, t + gate.l * sd, R / 4);
        });
      }

      // lead: osc → LP → amp → (dry + tempo echo) → duck
      const lOsc = node(ac.createOscillator()), lLp = node(ac.createBiquadFilter()), lAmp = node(ac.createGain()), lDel = node(ac.createDelay(2)), lFb = node(ac.createGain()), lWet = node(ac.createGain());
      lLp.type = 'lowpass'; lLp.Q.value = 2; lAmp.gain.value = 0; lOsc.connect(lLp); lLp.connect(lAmp); lAmp.connect(duck.lead); lAmp.connect(lDel); lDel.connect(lFb); lFb.connect(lDel); lDel.connect(lWet); lWet.connect(duck.lead);
      lOsc.frequency.value = 440; lOsc.start();
      const voiceLead = () => { lOsc.type = P.get('leadWave') === 'saw' ? 'sawtooth' : P.get('leadWave'); lLp.frequency.setTargetAtTime(200 * Math.pow(2, 6.5 * P.get('leadCutoff')), ac.currentTime, 0.02); lDel.delayTime.setTargetAtTime(0.75 * 60 / bpmNow(), ac.currentTime, 0.05); lFb.gain.value = P.get('leadEcho') * 0.75; lWet.gain.value = P.get('leadEcho') * 0.8; };
      voiceLead(); ['leadWave', 'leadCutoff', 'leadEcho'].forEach(k => P.onChange(k, voiceLead)); ctx.onBpm(voiceLead);
      function leadNote(t, n, dur) {
        const f = MT.hz(n.midi), gl = P.get('leadGlide');
        lDel.delayTime.setValueAtTime(0.75 * 60 / bpmNow(), t);   // the echo follows the tempo as it is now, event or not
        if (gl > 0) lOsc.frequency.setTargetAtTime(f, t, gl / 3); else lOsc.frequency.setValueAtTime(f, t);
        lAmp.gain.cancelScheduledValues(t); lAmp.gain.setValueAtTime(lAmp.gain.value, t); lAmp.gain.linearRampToValueAtTime(0.32, t + 0.004); lAmp.gain.setTargetAtTime(0, t + dur, 0.025);
        ctx.emitUI('lead_note', { time: t, midi: n.midi, name: MT.noteName(n.midi) });
      }
      // sidechain pump: every lab kick ducks bass, chords and lead
      function pumpAt(t, v) { const p = pump(); if (p < 0.01) return; const R = P.get('pumpRelease'); ['bass', 'harmony', 'lead'].forEach(k => { const g = duck[k].gain; g.cancelScheduledValues(t); g.setValueAtTime(1 - p * clamp(v, 0.3, 1), t + 0.002); g.setTargetAtTime(1, t + 0.02, R / 3); }); }

      // ---- DROP (armed → next bar = build of `buildBars`, silent last beat, impact on the bar after) + riser
      function impact(t) {
        const o = ac.createOscillator(); o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.2); const g = ac.createGain(); env(g, t, 0.9, 1.3); o.connect(g); g.connect(outs.rhythm); o.start(t); o.stop(t + 1.4);
        const n = nz(t, 1.6), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500; const ng = ac.createGain(); env(ng, t, 0.35, 1.5); n.connect(f); f.connect(ng); ng.connect(outs.rhythm);
      }
      function riser(t, dur) {
        const lv = P.get('riser'); if (lv < 0.01 || dur <= 0) return;
        const n = nz(t, dur + 0.05), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(9000, t + dur);
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 * lv, t + dur); g.gain.setValueAtTime(0, t + dur + 0.01);
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + dur); const og = ac.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.06 * lv, t + dur); og.gain.setValueAtTime(0, t + dur + 0.01);
        n.connect(f); f.connect(g); g.connect(outs.rhythm); o.connect(og); og.connect(outs.rhythm); o.start(t); o.stop(t + dur + 0.05);
      }
      // ---- arrangement (song mode): 32 bars — intro 8 · build 8 · drop 8 · break 8
      const SECTIONS = [['intro', 0, -0.25], ['build', 8, -0.1], ['drop', 16, 0.3], ['break', 24, -0.2]];
      function sectionOf(bar) { if (P.get('arrange') !== 'song') return null; const b = bar % 32; let s = SECTIONS[0]; SECTIONS.forEach(x => { if (b >= x[1]) s = x; }); return s; }

      // humanize: a seeded jitter per (bar, step, lane)
      const human = (bar, step, i) => { const h = P.get('humanize'); if (!h) return [0, 1]; const r = dsp.mulberry32((P.get('seed') * 31337 + bar * 977 + step * 53 + i * 7) >>> 0); return [(r() * 2 - 1) * 0.008 * h, 1 + (r() * 2 - 1) * 0.25 * h]; };

      ctx.onTick((tk) => {
        const bar = Math.floor(tk.step16 / 16), step = tk.step16 % 16; tickBpm = 15 / tk.stepDur;
        // song arrangement
        const sec = sectionOf(bar);
        if (step === 0) {
          const name = sec ? sec[0] : null;
          if (name !== section) { section = name; secBoost = sec ? sec[2] : 0; levels(tk.time); ctx.emitUI('section', { section, bar: bar % 32, time: tk.time }); }
          if (sec && sec[0] === 'build' && bar % 32 === 8) riser(tk.time, 8 * 16 * tk.stepDur);
          if (sec && sec[0] === 'build') secBoost = -0.1 + 0.4 * ((bar % 32) - 8) / 8;
          if (sec && sec[0] === 'drop' && bar % 32 === 16) { impact(tk.time); ctx.emit('edm:drop-fired', { time: tk.time, bar: bar + 1 }); ctx.emitUI('drop', { time: tk.time }); }
        }
        if (fillNext && step === 0) { fillBar = bar; fillNext = false; }
        let silent = false;
        if (dropArm) {
          if (dropArm.buildBar === null && step === 0) { dropArm.buildBar = bar; riser(tk.time, dropArm.bars * 16 * tk.stepDur - 4 * tk.stepDur); }
          if (dropArm.buildBar !== null) {
            const last = dropArm.buildBar + dropArm.bars - 1;
            if (bar >= dropArm.buildBar && bar <= last) { const k = ((bar - dropArm.buildBar) * 16 + step) / (dropArm.bars * 16); dropBoost = -0.4 + 0.4 * k; ['rhythm', 'bass', 'harmony', 'lead'].forEach(x => outs[x].gain.setTargetAtTime(x === 'rhythm' ? 0.5 * P.get('rhythmLevel') : 0.3 * levelOf(x), tk.time, 0.05)); if (bar === last && step >= 12) silent = true; }
            if (bar === last + 1 && step === 0) { impact(tk.time); dropBoost = 0.4; levels(tk.time); ctx.emit('edm:drop-fired', { time: tk.time, bar: bar + 1 }); ctx.emitUI('drop', { time: tk.time }); dropArm = null; ctx.dropAt = tk.time; }
          }
        } else if (dropBoost > 0 && step === 0) dropBoost = Math.max(0, dropBoost - 0.1);
        if (silent) { ['rhythm', 'bass', 'harmony', 'lead'].forEach(k => outs[k].gain.setValueAtTime(0, tk.time)); return; }
        const swing = step % 2 === 1 ? P.get('swing') * tk.stepDur : 0, t = tk.time + swing;
        const h = hits(bar, step), e = energy();
        h.forEach((v, i) => { if (!v) return; const [dt, dv] = human(bar, step, i); V[ROWS[i]](Math.max(tk.time, t + dt), Math.min(1, v * (0.6 + 0.4 * e) * dv), i); });
        if (h[0] && audible(0)) pumpAt(t, h[0]);
        ctx.emitUI('hits', { step: (bar % 2) * 16 + step, rows: h.map(v => v > 0), time: tk.time, pattern: patternAt(bar) });
        if (fillBar !== null && bar > fillBar) fillBar = null;
        // chords: set the chord on its bar, gate it by style
        const cb = P.get('chordBars');
        if (step === 0 && bar % cb === 0) setChord(tk.time, chordAt(bar));
        const style = P.get('chordStyle');
        chordGates(style).forEach(g => { if (g.s === step && (!g.pad || bar % cb === 0)) gateChord(g.pad ? tk.time : t, g, tk.stepDur); });
        // bass + lead
        const b = bassAt(bar, step); if (b) bassNote(t, b, tk.stepDur * b.len);
        if (P.get('leadOn')) { const l = leadAt(bar, step); if (l) leadNote(t, l, tk.stepDur * l.len); }
      });
      ctx.onStop(() => { dropBoost = 0; secBoost = 0; dropArm = null; fillBar = null; fillNext = false; section = null; levels(); bAmp.gain.setTargetAtTime(0, ac.currentTime, 0.05); lAmp.gain.setTargetAtTime(0, ac.currentTime, 0.05); hVoices.forEach(v => v.g.gain.setTargetAtTime(0, ac.currentTime, 0.2)); });
      ctx.allNotesOff = () => { bAmp.gain.cancelScheduledValues(ac.currentTime); bAmp.gain.setTargetAtTime(0, ac.currentTime, 0.02); lAmp.gain.cancelScheduledValues(ac.currentTime); lAmp.gain.setTargetAtTime(0, ac.currentTime, 0.02); hVoices.forEach(v => { v.g.gain.cancelScheduledValues(ac.currentTime); v.g.gain.setTargetAtTime(0, ac.currentTime, 0.05); }); dropArm = null; };

      // ---------------------------------------------------------------- UI hooks
      const sendMap = () => ctx.emitUI('map', { map: patterns[cur()], pattern: cur(), filled: SLOTS.filter(s => patterns[s].some(r => r.some(v => v > 0))) });
      P.onChange('pattern', sendMap);
      ctx.onUI('paint', { type: 'object', required: ['row', 'step', 'value'], properties: { row: { type: 'integer', minimum: 0, maximum: 7 }, step: { type: 'integer', minimum: 0, maximum: 31 }, value: { type: 'number', minimum: 0, maximum: 1 } } }, (p) => {
        const map = patterns[cur()], r = Math.max(0, Math.min(8, p.radius || 0));
        for (let s = p.step - Math.ceil(r); s <= p.step + Math.ceil(r); s++) { if (s < 0 || s > 31) continue; const w = r ? Math.max(0, 1 - Math.abs(s - p.step) / (r + 1)) : (s === p.step ? 1 : 0); if (!w) continue; const c = map[p.row][s]; map[p.row][s] = +(c + (p.value - c) * w).toFixed(3); }
        sendMap();
      });
      ctx.onUI('clear', { type: 'object' }, (p) => { if (typeof p.row === 'number') patterns[cur()][p.row].fill(0); else patterns[cur()] = blank(); sendMap(); });
      ctx.onUI('map_kind', { type: 'object', required: ['kind'] }, (p) => { if (MAP_KINDS.includes(p.kind)) { patterns[cur()] = presetMap(p.kind); sendMap(); } });
      ctx.onUI('reseed', null, () => P.set('seed', Math.floor(Math.random() * 99998) + 1));
      // mutate: nudge painted cells and wake a few neighbours — the groove evolves without losing itself
      function mutate(amount) {
        const map = patterns[cur()], r = dsp.mulberry32((P.get('seed') * 2654435761 + Date.now()) >>> 0), a = amount || 0.25;
        map.forEach((row, i) => row.forEach((v, s) => { if (v > 0) { if (r() < 0.5) row[s] = +clamp(v + (r() * 2 - 1) * a, 0, 1).toFixed(3); } else if ((row[(s + 31) % 32] > 0 || row[(s + 1) % 32] > 0) && r() < a * 0.35) row[s] = +(0.2 + r() * 0.4).toFixed(3); }));
        sendMap();
      }
      ctx.mutate = mutate;
      ctx.onUI('mutate', null, () => mutate(0.25));
      ctx.onUI('pattern_copy', { type: 'object', required: ['to'] }, (p) => { if (!SLOTS.includes(p.to) || p.to === cur()) return; patterns[p.to] = JSON.parse(JSON.stringify(patterns[cur()])); sendMap(); });
      ctx.onUI('lane', { type: 'object', required: ['i', 'key'] }, (p) => {
        const l = lanes[p.i]; if (!l || !(p.key in l)) return;
        if (p.key === 'mute' || p.key === 'solo') l[p.key] = !!p.value; else l[p.key] = +clamp(+p.value, { level: 0, tune: -24, decay: 0.2, pan: -1 }[p.key], { level: 1.5, tune: 24, decay: 4, pan: 1 }[p.key]).toFixed(3);
        applyLanes(); ctx.emitUI('lanes', { lanes });
      });
      ctx.armDrop = (bars) => { dropArm = { buildBar: null, bars: +(bars || P.get('buildBars')) || 1 }; };
      ctx.onUI('drop_arm', null, () => { if (dropArm) dropArm = null; else ctx.armDrop(); ctx.emitUI('drop', { armed: !!dropArm }); });
      ctx.fill = (bar) => { fillBar = bar; };
      ctx.onUI('fill', null, () => { fillNext = true; ctx.emitUI('fill', { armed: true }); });   // the next bar ends in a fill
      ctx.onUI('break', null, () => { breakOn = !breakOn; levels(); ctx.emitUI('break', { on: breakOn }); });

      // ---- PRINT → sequencer (drum lanes + bass lane, 2 bars of the current pattern)
      function print(target) {
        if (!ctx.K.registry.has(target)) return ctx.fault('RUNTIME_003', 'print: sequencer not mounted');
        ROWS.forEach((r, i) => {
          if (!audible(i)) return;
          const steps = []; for (let bar = 0; bar < 2; bar++) for (let st = 0; st < 16; st++) { const v = hits(bar, st)[i]; steps.push({ on: v > 0, vel: r === 'ghost' ? 0.35 : Math.min(1, (0.6 + 0.4 * v) * lanes[i].level) }); }
          if (steps.some(s => s.on)) ctx.emit('seq:pattern_suggest', { target, track: 'lab ' + r, steps, drumNote: 36 + PAD_OF[r], length: 32 });
        });
        const bassSteps = [], k = ctx.key;
        for (let bar = 0; bar < 2; bar++) for (let st = 0; st < 16; st++) { const b = bassAt(bar, st); if (!b) { bassSteps.push({ on: false, degree: chordAt(bar), octave: 0, gate: 2 }); continue; } const d = MT.degreeOf(b.midi, k.root, k.scale); bassSteps.push({ on: true, degree: d.degree, octave: d.octave - P.get('bassOctave'), gate: Math.max(1, Math.round(b.len)) }); }
        const bassInst = ['eravos.wobble-bass', 'eravos.reese-bass', 'eravos.acid-synth'].map(id => ctx.K.registry.byOrganism(id)[0]).find(Boolean);
        ctx.emit('seq:pattern_suggest', { target, track: 'lab bass', steps: bassSteps, instrument: bassInst ? bassInst.instance_id : null, transpose: -2, length: 32 });
      }
      ctx.print = print;
      ctx.onUI('print', { type: 'object', required: ['target'] }, (p) => print(p.target));

      // ---- ⤓ MIDI: the same functions the sound uses, written out (96 ppq: one 16th = 24 ticks)
      function midi(bars) {
        bars = bars || 8; const T = 24, drums = [], bass = [], chords = [], lead = [], st = P.get('chordStyle'), cb = P.get('chordBars');
        const sw = (step) => step % 2 === 1 ? Math.round(P.get('swing') * T) : 0;
        for (let bar = 0; bar < bars; bar++) for (let step = 0; step < 16; step++) {
          const at = (bar * 16 + step) * T + sw(step);
          hits(bar, step).forEach((v, i) => { if (v && audible(i)) drums.push({ at, n: GM_OF[ROWS[i]], v: Math.round(clamp(v * lanes[i].level, 0.1, 1) * 120), len: 12 }); });
          const b = bassAt(bar, step); if (b) bass.push({ at, n: b.midi, v: b.accent ? 120 : 100, len: Math.round(b.len * T) });
          if (P.get('leadOn')) { const l = leadAt(bar, step); if (l) lead.push({ at, n: l.midi, v: 96, len: Math.max(6, Math.round(l.len * T)) }); }
          chordGates(st).forEach(g => { if (g.s !== step || (g.pad && bar % cb !== 0)) return; const ns = voicing(chordAt(bar), tension()).notes; (g.arp !== undefined ? [ns[g.arp % 4]] : ns).forEach(n => chords.push({ at: (bar * 16 + step) * T, n, v: 84, len: Math.round(Math.min(g.l, (bars - bar) * 16 - step) * T) })); });
        }
        const tracks = [{ name: 'EDM Lab drums', ch: 9, notes: drums }, { name: 'EDM Lab bass', ch: 0, notes: bass }, { name: 'EDM Lab chords', ch: 1, notes: chords }];
        if (lead.length) tracks.push({ name: 'EDM Lab lead', ch: 2, notes: lead });
        return midiFile(tracks, ctx.bpm);
      }
      ctx.midi = midi;
      ctx.onUI('export_midi', { type: 'object' }, (p) => { const bytes = midi(clamp(+(p && p.bars) || 8, 1, 64)); ctx.emitUI('midi_file', { name: 'edm-lab-' + P.get('seed') + '.mid', bytes: Array.from(bytes) }); });

      ctx.stateExtra = () => ({ map: patterns[cur()], rows: ROWS, kinds: MAP_KINDS, lanes, chord: lastChord, breakOn, section, filled: SLOTS.filter(s => patterns[s].some(r => r.some(v => v > 0))), sequencers: ctx.K.registry.byOrganism('eravos.sequencer').map(r => ({ value: r.instance_id, label: '⬛ Sequencer ' + r.instance_id.split('-').slice(-2).join('') })) });
      ctx.on('kernel:organism-mounted', null, () => ctx.syncUI());
      ctx.saveExtra = () => ({ map: patterns[cur()], patterns, lanes });
      ctx.loadExtra = (x) => {
        if (!x) return;
        if (x.patterns && typeof x.patterns === 'object') SLOTS.forEach(s => { const v = x.patterns[s]; if (typeof v === 'string') patterns[s] = presetMap(v); else if (Array.isArray(v)) patterns[s] = JSON.parse(JSON.stringify(v)); });
        if (typeof x.map === 'string') patterns[cur()] = presetMap(x.map); else if (Array.isArray(x.map)) patterns[cur()] = JSON.parse(JSON.stringify(x.map));
        if (Array.isArray(x.lanes)) lanes = ROWS.map((_, i) => Object.assign(LANE0(), x.lanes[i] || {})); else lanes = lanesBlank();
        applyLanes(); sendMap(); ctx.emitUI('lanes', { lanes });
      };
      ctx.internals = { get map() { return patterns[cur()]; }, set map(m) { patterns[cur()] = m; }, patterns, get lanes() { return lanes; }, presetMap, ROWS, KITS, PROG, midiFile };
      return {};
    },
  });
})();
