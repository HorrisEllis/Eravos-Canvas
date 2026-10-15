# spec_id: eravos.organism.live-drums · version 1.0.0 · phase P38 · status planned · category instruments
identity:
  id: eravos.live-drums ; label: Live Drums ; icon: 🥁 ; accent: "#e05a47"
  comp_intent: An acoustic drum kit that sounds played — kick, snare (with ghost notes, rimshots, flams), toms, hats (closed → open continuum), cymbals — with mic mixing.
  novelty: Modelled acoustic kit with continuous hi-hat pedal, round-robin variation and close/overhead/room mics.
engine: membrane modes (kick/snare/toms) with snare-wire model ; cymbals as modal noise banks ; hi-hat openness 0..1 continuous (CC4) with pedal chick ; every hit varied (strike position, velocity → timbre) — never machine-gun ; bleed between mics ; mic mixer: close, overheads, room, mono room crush ; groove humanize via Groove tool
config: kit enum studio|vintage|jazz|rock|brush ; tuning per drum ; damping ; mic levels ; room size ; humanize
hooks: STD.note_in (GM drum map) ; STD.midi_in ; STD.audio_out ; audio_out per mic bus (4)
ui: kit picture (click drums) ; mic faders ; hat pedal slider
packs: factory — Studio Pop, 70s Dry Funk, Jazz Brushes, Arena Rock, Indie Room, Boom Bap Breaks-style, Reggae One Drop Kit
tests: 16 identical snare hits → no two sample-identical, spectral variation < 1.5 dB ; hat openness 0→1 increases decay monotonically
