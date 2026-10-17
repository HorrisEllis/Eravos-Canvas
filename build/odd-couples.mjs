#!/usr/bin/env node
/* Odd Couples (3.41) — one new pack per music tool, built for the Odd Couples songbook (tools/music/data/odd-couples-songbook.js):
 * songs that put together tools that normally go nowhere near each other. Every preset here has a job in one of those songs.
 *   node build/odd-couples.mjs            → tools/music/tools/<category>/<tool>/packs/odd-couples/pack.json for every tool
 * Each preset = an existing preset of the same tool (base) + the knobs that make it its Odd Couples self. Every value is checked
 * against the tool's real config (read from the running engines): unknown key, out of range or bad option → nothing is written.
 * Then: node build/index-tools.mjs && node build/validate.mjs && node tests/tool-audio.mjs --json s.json && node build/gain-stage.mjs s.json
 *   (ORDER MATTERS: this script rewrites the Odd Couples packs; gain-stage.mjs must run after it, or the levels it set are lost) */
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const P = (base, params, why) => ({ base, params: params || {}, why });
// ---------------------------------------------------------------- the design (tool → preset name → base + knobs + its job)
const DESIGN = {
  // ── genre instruments ──
  'eravos.organ': {
    'Cathedral Riddim Organ': P('Cathedral Full', { drive: 0.35, ampTone: 3200, perc: 0.4, percHarm: '3rd', pulse: 0.55, pulseRate: '1/16T', pulseShape: 'chop', space: 0.4, release: 0.25 }, 'the full cathedral, chopped in 1/16 triplets so it locks with a riddim stair'),
    'Dub Bubble Hammond': P('Desert Gospel', { pipe: 'tonewheel', d0: 8, d1: 8, d2: 8, d3: 0, d4: 0, d5: 0, d6: 0, d7: 0, d8: 0, perc: 0.7, percHarm: '2nd', rotary: 0.6, rotorSpeed: 'fast', space: 0.2, attack: 0.005, release: 0.08, pedal: false }, 'a 888 tonewheel bubble for the off-beat, the reggae organ shuffle played by a goth church'),
    'Funeral Dancehall': P('Funeral Pulse', { chord: true, celeste: 14, pulseRate: '1/8T', pulse: 0.7, drive: 0.2, dark: 1800, space: 0.5 }, 'gothic minor chords pumping on the dancehall triplet'),
    'Organ Into Wobble': P('Stoner Doom', { drive: 0.6, ampTone: 2400, rotary: 0.4, rotorSpeed: 'slow', scrape: 0.25, dark: 2200, level: 0.55 }, 'a doom organ that sits under a wobble without fighting it (cab rolled off at 2.4 kHz)'),
    'Synthwave Chapel': P('80s · Cathedral Synth-Pop', { chiff: 0.6, celeste: 9, tremDepth: 0.15, tremRate: 6.5, space: 0.65 }, 'the chapel in a 1985 drama, for the synthwave steppers'),
  },
  'eravos.coven': {
    'Séance Over 303': P('Séance Pad', { chant: 'O U A U', chantDiv: '1/8', hex: '7/4', hexMix: 0.35, dark: 2600, summon: 0.6, level: 0.6 }, 'a choir that chants eighths against an acid line, septimal hex ringing'),
    'Dancehall Coven': P('Witch House Choir', { chant: 'E A E O', chantDiv: '1/4t', screw: 3, voices: 5, spread: 24, static: 0.1, attack: 0.08, release: 0.6 }, 'witches chatting on the dancehall triplet'),
    'Riddim Requiem': P('Graveyard Chant (screwed)', { screw: 5, chantDiv: '1/2', summon: 0.8, hex: 'φ', hexMix: 0.3, dark: 1800 }, 'a slowed requiem that holds the riddim drop in a graveyard'),
    'Golden Ghost Choir': P('Crystal Coven', { hex: 'φ', hexMix: 0.55, chant: 'I E I A', vibrato: 0.15, release: 3.5 }, 'golden-ratio ghosts for the xenharmonic dub'),
  },
  'eravos.dub-station': {
    'Cathedral Sound System': P('Tubby Echo Chamber', { skankOn: true, skankStyle: 'organ bubble', prog: 'i–VI–VII', skankTone: 1800, spring: 0.55, echo: 0.4, echoDiv: '3/16', echoFeedback: 0.7, echoSweep: 900, bigKnob: 20 }, 'the dub chamber for a church organ: a bubble, a long spring, a 3/16 echo'),
    'Golden Ratio Siren': P('Sound System Siren', { sirenPitch: 1000, sirenRate: 6.18, sirenDepth: 12, sirenShape: 'sine', sirenRise: 7, echoDiv: '1/8.', echo: 0.35 }, 'a siren that wails at 6.18 Hz — φ — for the xenharmonic dub'),
    'Synthwave Steppers': P('Steppers Dub', { skankStyle: 'one-drop chop', prog: 'i–VII', skankTone: 3200, spring: 0.15, echo: 0.3, echoDiv: '1/8.', echoFeedback: 0.5 }, 'steppers chops at the synthwave tempo'),
    'Acid Rewind': P('Bun Dem (dancehall)', { rewindLen: 2, rewindRestart: true, hornLevel: 0.55, sirenLevel: 0.25, bigKnob: 260 }, 'pull-up and horns for the acid séance (big knob already half way)'),
    'Lullaby Dub': P('Roots One Drop', { skankStyle: 'organ bubble', skankTone: 1400, skankLevel: 0.35, spring: 0.4, echo: 0.45, echoFeedback: 0.6, echoSweep: 700, level: 0.7 }, 'a soft bubble and a dark echo under a music box'),
  },
  'eravos.retro-poly': {
    'Steppers Brass': P("Brass Stab '84", { chorus: 'I+II', release: 0.15, cutoff: 3600, envAmt: 0.6, level: 0.55 }, 'eighties brass that answers dub sirens'),
    'Acid Arp Chapel': P('80s · Stranger Arp', { arp: 'up-down', arpDiv: '1/16', arpOct: 2, arpGate: 0.4, cutoff: 1800, res: 6, level: 0.5 }, 'the Stranger Things arp, but in a chapel next to a 303'),
    'Dub Juno Bubble': P('Neon Keys', { attack: 0.002, decay: 0.15, sustain: 0, release: 0.08, cutoff: 2200, chorus: 'II', level: 0.55 }, 'Juno keys played as a reggae bubble'),
    'Wobble Pad Glow': P('EDM Pad · Neon Glow Pad', { cutoff: 1400, res: 2, attack: 0.6, release: 1.2, level: 0.45 }, 'a soft 80s glow above a wobble, filtered under 1.4 kHz so the wobble owns the mids'),
  },
  // ── sound sources ──
  'eravos.acid-synth': {
    'Séance Squelch': P('Phuture Squelch', { cutoff: 420, res: 0.82, envMod: 0.7, decay: 0.22, accent: 0.8, drive: 0.4, level: 0.85 }, 'the 303 that sits in the séance — resonant but under the choir'),
    'Golden Acid': P('Deep Minimal', { cutoff: 618, res: 0.618, envMod: 0.382, decay: 0.618, wave: 'square', level: 0.85 }, 'every knob on the golden ratio, for the xen dub'),
    'Acid Under Organ': P('Rolling Bassline', { cutoff: 280, res: 0.55, envMod: 0.45, drive: 0.25, octave: -1, level: 0.9 }, 'a rolling acid bass an octave down, under the cathedral'),
    'Dancehall Acid Stab': P('Rubber Square', { decay: 0.12, accent: 0.9, envMod: 0.8, cutoff: 500, level: 0.8 }, 'short squelches on the dembow'),
  },
  'eravos.curve-synth': {
    'Music Box Bounce': P('Ricochet', { wave: 'triangle', bounces: 5, restitution: 0.72, decay: 0.45, noise: 0.02, drive: 0, lowNote: 60, highNote: 96, level: 0.55 }, 'a bouncing-ball music box for the lullaby over tearout'),
    'Siren Into Drop': P('Siren', { duration: 1.6, wave: 'sawtooth', drive: 0.35, sustain: 0.6, level: 0.5 }, 'a long rising curve that becomes a dub siren into the drop'),
    'Falling Coin': P('Drop Whoop', { wave: 'sine', bounces: 7, restitution: 0.55, decay: 0.3, duration: 0.3, level: 0.5 }, 'a coin dropped in the chapel, ear candy between bars'),
  },
  'eravos.pad-forge': {
    'Chapel Haze': P('Dark Choir', { cornerD: 'organ', orbit: 'drift', orbitRate: 0.04, cutoff: 2400, space: 0.6, shimmer: 0.25, level: 0.6 }, 'choir and organ drifting in a dark chapel'),
    'Dub Fog Bed': P('Dub Chord Bed', { cornerA: 'air', cornerB: 'organ', cutoff: 1600, bloom: 0.7, space: 0.55, shimmer: 0.1, level: 0.55 }, 'fog under a dub skank'),
    'Lullaby Glass': P('Celestial Glass', { cornerB: 'halo', cornerC: 'glass', orbit: 'figure-8', orbitRate: 0.12, shimmer: 0.3, size: 5, level: 0.55 }, 'a music-box shimmer over a tearout floor'),
    'Golden Orbit': P('Her Essence', { orbit: 'circle', orbitRate: 0.0618, orbitSize: 0.382, x: 0.618, y: 0.382, shimmer: 0.4, level: 0.6 }, 'her essence pad orbiting on golden numbers'),
  },
  'eravos.supersaw': {
    'Gospel Stack': P('Chord Stab (triad)', { chordMode: 'seventh', unison: 5, detune: 0.25, cutoff: 4200, aR: 0.25, level: 0.6 }, 'gospel sevenths stacked as saws, for the glitch gospel'),
    'Acid Church Pad': P('Airy Sus Pad', { chordMode: 'sus4', cutoff: 2600, res: 1.5, level: 0.55 }, 'a sus4 cloud between the 303 and the choir'),
    'Steppers Pluck': P('Monstercat Pluck', { aD: 0.18, aS: 0, aR: 0.12, cutoff: 5200, level: 0.6 }, 'a pluck on the steppers off-beat'),
    'Wobble Halo Saws': P('EDM Pad · Melodic Dubstep Saws', { cutoff: 3200, aA: 0.4, level: 0.5 }, 'saws behind a wobble — lower, slower, never in the way'),
  },
  'eravos.reese-bass': {
    'Chapel Reese': P('Wide Rumble', { detune: 18, cutoff: 380, combMix: 0.25, dist: 0.25, sub: 0.6, level: 0.9 }, 'a wide rumble under organ chords'),
    'Breathing Reese': P('Neuro Flange', { combSync: true, combRate: '1/1', combFb: 0.7, combMix: 0.5, driftRate: 0.1, level: 0.85 }, 'a reese that breathes once a bar, for the breathing drum & bass'),
    'Golden Reese': P('Classic Reese', { detune: 16.18, width: 0.618, combTime: 6.18, combMix: 0.382, level: 0.9 }, 'golden numbers in the stack'),
  },
  'eravos.sub-engine': {
    'Cathedral Floor': P('Deep Sine', { phantom: 0.5, drive: 0.1, tone: 600, release: 0.3, level: 0.75 }, 'a clean floor under a church organ'),
    'Séance 808': P('808 Long Slide', { drop: 7, dropTime: 0.25, drive: 0.25, level: 0.7 }, 'a sliding 808 under a choir (level kept under full scale)'),
    'Steppers Sub': P('Sound-System Sub (reggae)', { shape: 0.05, phantom: 0.25, click: 0.1, level: 0.75 }, 'the steppers sub'),
    'Breath Sub': P('Garage Punch', { attack: 0.02, decay: 1.2, sustain: 0.6, release: 0.6, level: 0.7 }, 'a sub that swells like a breath'),
  },
  'eravos.wobble-bass': {
    'Cathedral Wub': P('Half-time Growl 1/4t', { filterMode: 'formant', vowelA: 'OO', vowelB: 'OH', formantShift: -3, drive: 0.5, level: 0.85 }, 'a wobble that sings like the choir it shares the song with'),
    'Steppers Wobble': P('Classic Wub 1/8', { div: '1/8t', res: 8, sub: 0.55, drive: 0.35, level: 0.85 }, 'a triplet wobble on steppers drums'),
    'Acid Wobble': P('Robot 1/16 square', { lfoShape: 'sawdown', cutoff: 420, res: 14, depth: 4, drive: 0.55, level: 0.8 }, 'a wobble that squelches like a 303'),
    'Golden Wobble': P('Free-run Growl 5.3 Hz', { lfoSync: false, lfoHz: 6.18, depth: 3.82, level: 0.85 }, 'free-running at φ Hz against the beat — the xen dub growl'),
    'Lullaby Wub': P('Wide Melodic Wub', { cutoff: 900, res: 4, drive: 0.15, shaper: 0.1, width: 0.6, level: 0.8 }, 'a soft melodic wub under a music box'),
  },
  'eravos.bass-forge': {
    'Tearout Lullaby': P('Tearout Metal', { comb: 0.3, formant: 0.55, lfoDiv: '1/8t', ott: 0.35, level: 0.75 }, 'the tearout half of the lullaby, triplet growl'),
    'Golden Dub Growl': P('Golden Growl (φ)', { lfoDiv: '1/4', drive: 0.2, ott: 0.25, cutoff: 1800, level: 0.75 }, 'a slower golden growl that leaves room for a dub echo'),
    'Organ Grinder': P('Riddim Stair', { wave: 'square', formant: 0.6, vowelA: 'OH', vowelB: 'EE', lfoDiv: '1/16t', level: 0.75 }, 'a riddim stair that grinds like organ pipes'),
  },
  'eravos.xen-synth': {
    'Golden Dub Bells': P('Golden Bells', { decay: 1.2, release: 1.5, shimmer: 0.25, level: 0.55 }, 'golden-generator bells for the xenharmonic dub (not 12-tone: on purpose)'),
    '19-EDO Wobble Lead': P('Carlos α Glass', { tuning: '19-EDO', spectrum: 'tuning-matched', attack: 0.005, decay: 0.4, sustain: 0.5, level: 0.5 }, 'a 19-tone lead over a wobble — the notes between the notes'),
    'Slendro Riddim Bells': P('Slendro Metallophone', { decay: 0.5, release: 0.4, level: 0.55 }, 'gamelan metallophone on a riddim'),
  },
  'eravos.ratio-lattice': {
    'Dub Lattice Drone': P('Harmonic Seventh 4:5:6:7', { baseHz: 110, timbre: 'organ', fade: 1.5, level: 0.35 }, 'a just-intonation drone under the golden dub'),
    'Séance Lattice': P('Utonal Minor 1/4:1/5:1/6', { baseHz: 98, timbre: 'glass', level: 0.3 }, 'utonal minor glass behind the séance'),
  },
  'eravos.recursive-spectra': {
    'Trap Spectrum Drone': P('Witch Bell Loop', { baseHz: 55, morph: 0.5, level: 0.35, release: 4 }, 'a fractal bell loop under an 808'),
    'Breathing Spectrum': P('Mirror Choir', { rate: '4 bars', baseHz: 73.42, level: 0.35 }, 'a mirrored choir that turns over every 4 bars'),
  },
  'eravos.embodiment-lab': {
    'Breathing Drum & Bass': P('Feelings · Awake', { pulseLock: 'beat', pulse: 0.25, grit: 0.15, level: 0.4 }, 'the body drone locked to the beat, under a 174 roller'),
    'Hold Her Voice': P('Feelings · Held', { level: 0.35, space: 0.6, cues: false }, 'a held drone under her voice in a break — no spoken cues'),
  },
  // ── wubs ──
  'eravos.wub-osc': {
    'Cathedral FM': P('FM Clang 3:1', { index: 4, voices: 3, spread: 18, level: 0.75 }, 'bell-like FM clang for the cathedral riddim'),
    'Steppers Growl': P('Dancehall Growl Stack (FM 1:1)', { index: 3, level: 0.75 }, 'a growl stack for steppers'),
    'Acid Saw Wub': P('Classic Wub Saw', { voices: 1, spread: 0, drift: 0.1, level: 0.8 }, 'one plain saw so the wub filter can squelch it like a 303'),
  },
  'eravos.wub-filter': {
    'Choir Mouth': P('Yoi Vowel (OO → AH)', { vowelA: 'OO', vowelB: 'OH', formant: -4, drive: 0.15, outGain: -3 }, 'a mouth that sings with the coven'),
    'Acid Mouth': P('Screech Reso', { cutoff: 220, res: 12, range: 5, drive: 0.15, outGain: -6 }, 'a squelchy mouth for the acid wobble (6 dB down: the reso ran over full scale)'),
    'Chapel Comb': P('Robot Comb', { comb: 0.7, cutoff: 300, outGain: -3 }, 'a combed, metallic chapel mouth'),
  },
  'eravos.wub-rate': {
    'Riddim Requiem Rate': P('Riddim Stabs', { length: 8, stepLen: '1/8', smooth: 0.1 }, 'the stair under the requiem'),
    'Steppers Switch': P('Dancehall Switch-up', { stepLen: '1/4', smooth: 0.2 }, 'switch-ups for steppers'),
    'Golden Rate': P('Triplet Roll', { steps: ['1/8t', '1/8t', '1/16', '1/8', '1/16t', '1/8t', '1/32', 'off', '1/8t', '1/16', '1/8', '1/16t', '1/8t', '1/16', '1/32', 'off'], length: 13, stepLen: '1/8' }, 'a 13-step sequence — a Fibonacci length against the bar'),
  },
  'eravos.wub-sub': {
    'Cathedral Sub': P('Clean Sine', { cut: 120, level: 0.75 }, 'clean under organ and wub'),
    'Steppers Sub (wub)': P('Warm Phone Sub', { level: 0.75 }, 'the phone-speaker sub for steppers'),
  },
  // ── effects ──
  'eravos.fx-haunt': {
    'Chapel Tape': P('Haunted Cassette', { screw: 2, vinyl: 0.35, ghost: 0.4, mix: 0.5, outGain: -4 }, 'organ through a haunted cassette (4 dB down: Witch Fog ran over full scale)'),
    'Séance Phone': P('Séance Radio', { tone: 'telephone', crush: 0.15, mix: 0.6, outGain: -3 }, 'the choir answering on a phone line'),
  },
  'eravos.fx-glitch': {
    'Gospel Stutter': P('Stutter 1/16', { repeats: 6, reverseProb: 0.1, mix: 0.7 }, 'a stutter on gospel stacks'),
    'Organ Tape Stop': P('Tape Stop Drop', { stopBeats: 1, mix: 0.9 }, 'the organ dying into the drop'),
  },
  'eravos.fx-pitch': {
    'Octave Under the Choir': P('Octave Down Demon', { harmLevel: 0.4, mix: 0.5 }, 'a demon an octave under the choir, half wet'),
    'Golden Fifth': P('Fifth Harmony', { cents: 2, mix: 0.45 }, 'a fifth, 2 cents wide, for the golden dub'),
  },
  'eravos.fx-echo': {
    'Cathedral Throw': P('Dub Throw', { div: '3/16', feedback: 0.7, age: 0.5, mix: 0.4 }, 'a 3/16 throw in a stone room'),
    'Steppers Tape': P('Worn Tape', { div: '1/8.', feedback: 0.55, wow: 0.2, mix: 0.35 }, 'a worn tape echo on the steppers horns'),
    'Golden Echo': P('Ping-pong 1/8.', { sync: false, timeFree: 618, feedback: 0.618, mix: 0.38 }, '618 ms and 0.618 feedback — off the grid on purpose, for the xen dub'),
  },
  'eravos.fx-moddelay': {
    'Chapel Chorus': P('Slow Shimmer', { depth: 0.4, mix: 0.4 }, 'a slow shimmer over the organ'),
    'Steppers Flange': P('Jet Flange', { sync: true, div: '1/2', mix: 0.4 }, 'a jet flange swept every half bar on the steppers drums'),
  },
  'eravos.fx-phaser': {
    'Lullaby Phase': P('Stereo Spin', { rate: 0.12, mix: 0.4 }, 'a slow spin on the music box'),
    'Wobble Phase': P('Dubstep Sweep 1/8', { mix: 0.35, outGain: -3 }, 'phase on the wobble, 3 dB down (the sweep ran over full scale)'),
  },
  'eravos.fx-filter': {
    'Choir Behind Glass': P('Muffled Intro', { cutoff: 900, res: 1.5, mix: 1 }, 'the choir heard through a church door'),
    'Acid Auto-Wah': P('Auto-Wah', { res: 8, lfoDiv: '1/16', lfoAmt: 2, outGain: -3 }, 'a 1/16 wah that turns anything into acid'),
  },
  'eravos.fx-destroyer': {
    'Organ Crush': P('Lo-fi 12-bit 22k', { mix: 0.5 }, 'half-crushed organ, a sampled church'),
    'Golden Fold': P('Fold Growl', { drive: 0.382, mix: 0.618 }, 'fold at the golden mix'),
  },
  'eravos.fx-dynamics': {
    'Choir Leveller': P('Vocal Level', { thresh: -22, ratio: 3 }, 'keeps a chanting choir even'),
    'Breath Gate': P('Tight Gate', { gateThresh: -42, gateRelease: 300 }, 'a gate that lets the breath in and closes behind it'),
  },
  'eravos.fx-eq': {
    'Make Room for Her': P('Vocal Clarity', { p2Freq: 2500, p2Gain: -4, p2Q: 1.2, hsGain: -2, outGain: -3 }, 'a 2.5 kHz pocket cut into a bed so her voice sits in it (3 dB down: Vocal Clarity ran over full scale)'),
    'Church Low Cut': P('Bass Mud Cut', { hpOn: true, hpFreq: 140, hpSlope: 24 }, 'an organ that stays out of the sub'),
  },
  'eravos.channel': {
    'Her Voice (on top)': P('Vocal', { hpf: 110, mid: 2, midFreq: 3000, sendRev: 0.15, trim: -3 }, 'her voice channel: air and presence, 3 dB down (the Vocal strip ran over full scale)'),
    'Organ Under': P('Pad / Lead', { low: -3, high: -2, fader: -4 }, 'the organ tucked under the wub'),
  },
  'eravos.sidechain-compressor': {
    'Wobble Breathes With Kick': P('Kick-triggered', { depth: 0.6, release: 160 }, 'the wobble gives way to the kick'),
    'Steppers Pump 1/4': P('Classic 1/4 Pump', { depth: 0.5, curve: 0.5 }, 'a gentle pump for steppers'),
  },
  'eravos.master-fx': {
    'Cathedral Master': P('Big Room', { reverbMix: 0.3, size: 5, decay: 5, ceiling: -1 }, 'a big stone room, ceiling at −1 dBFS'),
    'Sound System Master': P('Dry & Punchy', { delayMix: 0.25, delayDiv: '1/8.', ceiling: -1 }, 'dry and punchy with a dub delay'),
  },
  // ── modulation / tools / voice ──
  'eravos.lfo': {
    'Golden LFO': P('Slow Filter Sweep 2 bars', { sync: false, rate: 0.618 }, 'φ-ratio sweep, off the grid'),
    'Breath LFO (bar)': P('Pump 1/4', { div: '1/1', shape: 'smooth' }, 'one smooth breath a bar'),
  },
  'eravos.breath': {
    'Drum & Bass Breath': P('COHERENCE', { tempoLink: true, rise: 3 }, 'breath linked to the tempo, for the breathing drum & bass'),
    'Séance Breath': P('HANGING TREE', { level: 0.4 }, 'the hanging-tree breath behind the séance'),
  },
  'eravos.edm-lab': {
    'Machine Choir Roller': P('Neuro Roller', { energy: 0.7, tension: 0.6, harmonyLevel: 0.3, bassLevel: 0.6, rhythmLevel: 0.7 }, 'a roller that leaves room for a choir (levels down: Neuro Roller ran over full scale)'),
    'Steppers Lab': P('UKG Shuffle', { swing: 0.25, bassLevel: 0.55, rhythmLevel: 0.7 }, 'a shuffled lab under steppers'),
  },
  'eravos.sample-player': {
    'Her Voice · Up Front': P('Whole clip', { gain: 0.9, attack: 0.005, release: 0.12 }, 'her clip as it is, up front'),
    'Her Voice · Chopped Triplets': P('Chop 8', { slices: 8, gain: 0.85 }, 'her clip chopped for the dancehall triplet'),
  },
  'eravos.lyric-rhythm': {
    'Chant': P('Flows · Chant (on the beat)', { text: 'Organ in the dance\nChoir in the bass\nGold in the dub\nYou in every place' }, 'the Odd Couples chant'),
    'Dancehall Chat': P('Flows · Dancehall chat', { text: 'Pull up the organ\nWobble on the floor\nSiren in the chapel\nGive me one more' }, 'dancehall chat for the cathedral riddim'),
  },
  'eravos.harmonic-analyzer': {
    'Organ + Wub (layers)': P('Chords / layers', { layers: 4, maxPeaks: 32 }, 'read an organ chord and a wub at once'),
  },
  'eravos.bass-drop-builder': {
    'Odd · Cathedral Drop': P('Song for her (8/7¾/¼/16)', { tensionTone: 'pad', tChords: 'i → VI', tWave: 'sawtooth', tCutoff: 600, tCutoffEnd: 4000, gapSound: 'vocal tail', vocalPriority: 10 }, 'her clip ends on the drop, the organ chords rise under it, everything else ducks 10 dB under her'),
    'Odd · Steppers Pull-up': P('Classic 4/4/¼/8', { gapSound: 'sub swell', impactPitch: 50, vocalPriority: 9 }, 'a sub swell in the gap, then the steppers drop'),
    'Odd · Golden Gap': P('Quick hit 0/2/¼/8', { pauseBars: 0.5, gapSound: 'silence', vocalPriority: 12 }, 'half a bar of total silence — her voice alone — then the golden dub'),
  },
  'eravos.fx-box': {
    'Chapel Hits': P('Ear Candy', {}, 'ear candy for the cathedral riddim'),
  },
  'eravos.sequencer': {
    'Odd · Steppers Grid': P('Song · Riddim talk (automation)', { swing: 0.12 }, 'riddim talk with a little steppers swing'),
  },
};
// tools whose own presets carry no params (or none yet): their pack sets their knobs directly (no base)
const UTIL = {
  'eravos.session': { 'Cathedral Riddim · 140 E phrygian': { bpm: 140, root: 4, scale: 'phrygian' }, 'Golden Dub · 75 A minor': { bpm: 75, root: 9, scale: 'minor' }, 'Acid Séance · 128 C# minor': { bpm: 128, root: 1, scale: 'minor' }, 'Breathing DnB · 174 D minor': { bpm: 174, root: 2, scale: 'minor' } },
  'eravos.timeline': { 'Odd · Whole song (zoomed out)': { pxPerBar: 24, snap: 'bar', follow: true }, 'Odd · Drop loop (8 bars)': { loopOn: true, loopStartBar: 41, loopEndBar: 49, pxPerBar: 96, snap: '1/16' } },
  'eravos.mixer': { 'Odd · Wide with meters': { wide: true, meters: true, showLines: true } },
  'eravos.xy-pad': { 'Odd · Organ ↔ Wub': { curveX: 'exp', curveY: 'lin', loopBars: 4, inertia: true, friction: 0.9 }, 'Odd · Snap-back drop': { snapBack: true, returnTime: 0.6, homeX: 0.5, homeY: 0.2 } },
  'eravos.macro-automation': { 'Odd · 16-bar latch': { lengthBars: 16, quantize: '1/16', mode: 'latch' } },
  'eravos.coach': { 'Odd · Build and drop': { lesson: 'build-and-drop', showHints: true } },
  'eravos.contrast-analyser': { 'Odd · Two worlds': { fft: 8192, smoothing: 0.6, sensitivity: 0.55 } },
  'eravos.midi-mapper': { 'Odd · Perform pads': { padLayout: 'perform', velocityCurve: 'hard' }, 'Odd · Chords in key': { padLayout: 'chords', chordType: 'add9', padOctave: 3 } },
  'eravos.clip-maker': { 'Odd · Her words (tight)': { snapZero: true, normalizeTarget: -3, normalizeMode: 'loudness', silenceThresh: -40, minGap: 120, fadeShape: 'S' } },
  'eravos.song-recorder': { 'Odd · Master (−1 dBFS, 24-bit)': { format: 'wav24', range: 'song', tail: 4, level: 0.9 } },
};
// kits — 16 pads (Pads) and slot kits (Drum Forge): cross-genre machines
const PAD_KITS = {
  'Cathedral Riddim': [['kick', 'tearout', { tune: -2, decay: 0.45 }], ['snare', 'slam', { decay: 0.3 }], ['clap', 'stacked', { decay: 0.6, level: 0.8 }], ['hat', 'tick', { decay: 0.03, level: 0.6 }], ['openhat', 'fm', { decay: 0.25, level: 0.5 }], ['808', 'sub', { tune: -2 }], ['rim', 'classic', { tune: 2, level: 0.6 }], ['tom', 'tabla', { tune: -3, level: 0.7 }], ['crash', 'china', { decay: 2, level: 0.55 }], ['perc', 'clang', { tune: 7, decay: 1.8, level: 0.5 }], ['shaker', 'classic', { decay: 0.1, level: 0.5 }], ['cowbell', 'classic', { tune: -5, level: 0.35 }], ['crash', 'swell', { decay: 3, level: 0.5 }], ['snare', 'crack', { decay: 0.2, level: 0.75 }], ['perc', 'wood', { tune: 5, level: 0.5 }], ['sample', 'classic', {}]],
  'Steppers Machine': [['kick', '909', { decay: 0.35 }], ['snare', 'rimshot', { decay: 0.15 }], ['clap', '808', { level: 0.7 }], ['hat', '909', { decay: 0.04, level: 0.6 }], ['openhat', '909', { decay: 0.3, level: 0.55 }], ['808', 'classic', { tune: 0 }], ['rim', 'classic', { level: 0.75 }], ['tom', 'electro', { level: 0.6 }], ['crash', 'ride', { decay: 2.5, level: 0.45 }], ['perc', 'laser', { tune: 12, level: 0.4 }], ['shaker', 'classic', { decay: 0.08, level: 0.55 }], ['cowbell', 'classic', { level: 0.4 }], ['crash', 'classic', { decay: 1.8, level: 0.5 }], ['snare', 'electro', { decay: 0.18, level: 0.7 }], ['tom', 'conga', { tune: 2, level: 0.6 }], ['sample', 'classic', {}]],
  'Séance Trap': [['kick', '808', { decay: 0.6, sweep: 10 }], ['snare', 'lofi', { decay: 0.25 }], ['clap', 'snap', { level: 0.75 }], ['hat', 'lofi', { decay: 0.025, level: 0.55 }], ['openhat', 'lofi', { decay: 0.2, level: 0.5 }], ['808', 'dist', { tune: -3 }], ['rim', 'classic', { tune: -2, level: 0.55 }], ['tom', 'classic', { tune: -5, level: 0.6 }], ['crash', 'swell', { decay: 2.6, level: 0.5 }], ['perc', 'clang', { tune: -5, decay: 2.2, level: 0.45 }], ['shaker', 'classic', { decay: 0.14, level: 0.45 }], ['cowbell', 'classic', { tune: 3, level: 0.35 }], ['crash', 'china', { decay: 1.6, level: 0.45 }], ['snare', 'brush', { decay: 0.35, level: 0.6 }], ['perc', 'wood', { tune: -7, level: 0.45 }], ['sample', 'classic', {}]],
};
const FORGE_KITS = {   // [base kit, slot overrides by index]
  'Odd · Chapel Dancehall': ['Dancehall · Bun Dem', { 0: { drive: 0.2, decay: 0.4 }, 2: { tone: 0.6, decay: 0.2 }, 5: { tune: -2 } }],
  'Odd · Golden Steppers': ['Xen Percussion (φ, π, √2)', { 0: { decay: 0.3 }, 1: { level: 0.75 } }],
};

// ---------------------------------------------------------------- build
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const list = (dir, re) => fs.readdirSync(path.join(ROOT, dir)).filter(f => re.test(f)).map(f => dir + '/' + f);
const skeleton = [...list('canvas/kernel', /\.js$/), ...list('canvas/runtime', /\.(js|css)$/), 'canvas/index.html', 'canvas/scripts.js'];
const b = await chromium.launch(); const pg = await b.newPage();
await pg.addInitScript((s) => { window.__SOURCES = s; }, { skeleton: Object.fromEntries(skeleton.map(f => [f, read(f)])), organisms: {} });
await pg.goto('file://' + path.join(ROOT, 'tests/run.html') + '?auto=0'); await pg.waitForFunction(() => window.TH && OrganismFactory.def('eravos.wobble-bass'));
const defs = await pg.evaluate(() => { const o = {}; OrganismFactory.onDefine(d => { if (d.domain === 'music') o[d.id] = { config: d.config || [], presets: Object.fromEntries(Object.entries(d.presets || {}).map(([k, v]) => [k, v])) }; }); return o; });
await b.close();

const errors = [], made = [];
function check(id, name, params) {
  const cfg = Object.fromEntries(defs[id].config.map(c => [c.key, c]));
  for (const [k, v] of Object.entries(params)) {
    const c = cfg[k]; if (!c) { errors.push(`${id} · ${name}: unknown knob ${k}`); continue; }
    if (c.options && !c.options.includes(v)) errors.push(`${id} · ${name}: ${k}=${JSON.stringify(v)} not in [${c.options.map(x => JSON.stringify(x)).join('|')}] (type-exact, like build/validate.mjs)`);
    else if ((c.type === 'number' || c.type === 'integer') && (typeof v !== 'number' || (c.min !== undefined && v < c.min) || (c.max !== undefined && v > c.max))) errors.push(`${id} · ${name}: ${k}=${v} outside ${c.min}..${c.max}`);
    else if (c.type === 'boolean' && typeof v !== 'boolean') errors.push(`${id} · ${name}: ${k} must be true/false`);
  }
}
const toolDir = (id) => { for (const d of fs.readdirSync(path.join(ROOT, 'tools/music/tools')).filter(d => fs.statSync(path.join(ROOT, 'tools/music/tools', d)).isDirectory())) for (const t of fs.readdirSync(path.join(ROOT, 'tools/music/tools', d))) { const j = path.join(ROOT, 'tools/music/tools', d, t, 'tool.json'); if (fs.existsSync(j) && JSON.parse(fs.readFileSync(j, 'utf8')).id === id) return path.join(ROOT, 'tools/music/tools', d, t); } return null; };
const packs = {};
const add = (id, name, preset) => { (packs[id] = packs[id] || {})[name.replace(/^Odd · /, '')] = preset; };   // the pack's prefix adds "Odd · "   // a preset is { params, extra } only (schemas/pack.schema.json); its intent stays in DESIGN
for (const [id, presets] of Object.entries(DESIGN)) {
  if (!defs[id]) { errors.push(`${id}: no such tool`); continue; }
  for (const [name, d] of Object.entries(presets)) {
    const base = defs[id].presets[d.base]; if (!base) { errors.push(`${id} · ${name}: base preset "${d.base}" missing`); continue; }
    const bp = base.params || {}, params = Object.assign({}, bp, d.params); check(id, name, d.params);
    add(id, name, Object.assign({ params }, base.extra ? { extra: JSON.parse(JSON.stringify(base.extra)) } : {}), d.why);
  }
}
for (const [id, presets] of Object.entries(UTIL)) { if (!defs[id]) { errors.push(`${id}: no such tool`); continue; } for (const [name, params] of Object.entries(presets)) { check(id, name, params); add(id, name, { params }); } }
for (const [name, pads] of Object.entries(PAD_KITS)) add('eravos.pads', name, { params: { volume: 0.85 }, extra: { kit: pads.map(([voice, model, o]) => Object.assign({ voice, model }, o)) } }, 'a cross-genre kit for the Odd Couples songs');
for (const [name, [baseKit, over]] of Object.entries(FORGE_KITS)) {
  const base = defs['eravos.drum-forge'].presets[baseKit]; if (!base) { errors.push('drum-forge base kit ' + baseKit); continue; }
  const slots = base.extra.slots.map((s, i) => Object.assign({}, s, over[i] || {})); add('eravos.drum-forge', name, { params: { kit: baseKit }, extra: { slots } }, 'a cross-genre slot kit');
}
const missing = Object.keys(defs).filter(id => !packs[id]); if (missing.length) errors.push('tools without an Odd Couples pack: ' + missing.join(', '));
if (errors.length) { console.log(errors.map(e => '✗ ' + e).join('\n')); process.exit(1); }
let n = 0;
for (const [id, presets] of Object.entries(packs)) {
  const dir = toolDir(id); const short = id.replace('eravos.', '');
  const out = { schema: 'eravos.pack/1', id: short + '.odd-couples', version: '1.0.0', label: 'Odd Couples', prefix: 'Odd', author: 'James Brooks', tags: ['odd-couples', 'cross-genre', '3.41'], for: id,
    items: { [id]: { presets } } };
  fs.mkdirSync(path.join(dir, 'packs', 'odd-couples'), { recursive: true }); fs.writeFileSync(path.join(dir, 'packs', 'odd-couples', 'pack.json'), JSON.stringify(out, null, 1) + '\n');
  n += Object.keys(presets).length; made.push(short);
}
console.log(`✓ ${made.length} tools · ${n} presets → packs/odd-couples/pack.json`);
