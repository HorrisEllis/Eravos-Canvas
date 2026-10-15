# spec_id: eravos.organism.groove · version 1.0.0 · phase P38 · status planned · category rhythm
identity:
  id: eravos.groove ; label: Groove ; icon: 🌀 ; accent: "#f4a261"
  comp_intent: Swing and feel as a thing you can steal and apply — extract the groove of a played loop and put it on any pattern.
  novelty: Groove templates (timing + velocity per 16th/32nd) extracted from audio or MIDI, applied to note streams.
engine: extract: onsets of an audio clip or notes of a MIDI part → offset & velocity per grid slot, averaged over bars ; apply: note:trigger stream in → shifted/re-velocitied out, amount 0..150 % ; templates: MPC-style swing 50–75 %, shuffle, laid-back, push, drunk (seeded) ; per-lane amount when used with Sequencer
config: template ; amount ; timing on ; velocity on ; grid 16|32 ; seed
hooks: STD.note_in ; note_out ; STD.transport_in ; audio_in (extract)
ui: grid with timing offsets as arrows ; template browser
packs: factory — Swing 54, 57, 62, 66 · Laid Back · Pushed · Boom Bap Lazy · Afrobeat 12/8-feel · Reggae Late Skank · Drunk Hands
tests: swing 66 at 16th → odd 16ths delayed by 1/3 of a 16th ±0.5 ms ; extract of a quantized loop = zero offsets
