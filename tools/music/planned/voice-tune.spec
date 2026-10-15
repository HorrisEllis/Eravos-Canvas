# spec_id: eravos.organism.voice-tune · version 1.0.0 · phase P38 · status planned · category voice
# The pitch-correction tool: from invisible natural correction to the hard, stepped "robot" tune (the late-2000s
# R&B / hip-hop / trap vocal sound). Technique only: snap a sung line to the scale with zero retune time.
identity:
  id: eravos.voice-tune ; label: Tune ; icon: 🎤 ; accent: "#ff5cf0"
  comp_intent: Correct or stylise the pitch of a monophonic voice (or any mono source) to a key, a scale or MIDI notes, live.
  novelty: Only tool that re-pitches a live voice per period; others shift by a fixed interval.
engine:
  detect: pYIN on a 2048 window / 256 hop in an AudioWorklet (10.7 ms look-ahead in MIX mode, 0 in LIVE mode) ; voiced/unvoiced probability ; octave-error guard (median of 5 frames)
  target: nearest allowed note of scale(root, mode from STD.theory_in or own) · or MIDI notes held on note_in (MIDI mode: what you play is what it sings) · per-note bypass / remove map (12 toggles)
  retune: speed 0..400 ms (0 = hard tune: the stepped robotic sound) ; humanize 0..1 (long held notes get slower retune so sustained vowels stay natural) ; flex-tune threshold cents (leave notes alone that are already close)
  shift: PSOLA for ±7 st with formant preserve ; above that phase-vocoder with spectral-envelope (cepstral) formant correction ; transients bypass the shifter (no smearing on consonants)
  vibrato: keep / reduce / add (rate 3..8 Hz, depth 0..100 c, onset delay)
  extras: throat (formant ±4 st, independent) ; transpose ±24 st ; pitch → note:trigger out (sing a bass line) ; pitch curve out (data)
  quality bar: null test with speed=max & in-tune sine → < -60 dB residual ; no zipper at 0 ms ; CPU < 3 % of one core per instance ; latency reported to the mixer for delay compensation
config: mode enum live|mix def mix ; key/scale follow|own ; root ; scale (all MusicTheory scales + chromatic) ; speed ms def 20 ; humanize def 0.3 ; flexTune c def 0 ; vibrato enum keep|reduce|add ; vibratoRate ; vibratoDepth ; formantPreserve bool def on ; throat st ; transpose st ; midiMode bool ; mix 0..1
hooks: STD.audio_in ; STD.audio_out ; STD.theory_in ; STD.note_in (MIDI mode) ; note_out (note:trigger) ; data_out pitch (json {hz, note, cents, voiced})
ui: hero = live pitch graph (detected = grey, output = accent, target grid = scale lines, last 6 s) ; big SPEED knob with "HARD" detent at 0 ; 12-key note map (tap to remove a note) ; key/scale chips ; vibrato row ; LIVE/MIX switch with latency readout
packs: factory — Natural, Gentle Pop, Hard Tune (0 ms), Robot Trap, Melodic Rap, Gospel Runs, Chipmunk, Demon (−7 throat), Choir Tight, Bass Voice (−12, formant kept)
tests: A3 sung 30 c flat, speed 0 → output within ±3 c of A3 after 1 period ; speed 200 → reaches 50 % at ~100 ms ; MIDI mode: hold E4 → any input pitch lands on E4 ; unvoiced "s" passes unshifted (spectral centroid within 5 %) ; formant preserve: +5 st keeps F1/F2 within 8 %
