# spec_id: eravos.organism.voice-recorder · version 1.0.0 · phase P38 · status planned · category voice
identity:
  id: eravos.voice-recorder ; label: Vocal Booth ; icon: 🎧 ; accent: "#ff4466"
  comp_intent: Record vocals the way studios do — punch in/out, loop takes, comp the best parts of every take into one.
  novelty: Take lanes + comping; Song Recorder records the whole mix.
engine: input from mic (getUserMedia, echoCancellation/noiseSuppression/autoGain OFF by default) at device rate, 32-bit float ; latency measurement (round-trip ping) and auto-compensation ; pre-roll / count-in ; punch range ; loop record → take lanes ; comp = swipe regions across lanes, 10 ms equal-power crossfades ; headphone cue mix (input monitoring with optional Tune/Vocal Chain in the monitor path) ; clip-guard (peak warn at −1 dBFS, input gain advice)
config: input device ; monitor bool ; countIn bars ; preRoll s ; punchIn/Out bars ; loop bool ; takeLimit
hooks: STD.audio_out (the comp) ; STD.transport_in ; data_out takes (json) ; asset output (comped clip → Timeline/Pads)
ui: take lanes under a ruler ; comp swipe ; big REC with arm states ; input meter + latency readout ; lyric line (from Lyric Rhythm, optional)
tests: loop 4 takes over 2 bars → 4 lanes, each 2 bars ±1 sample ; latency compensation aligns a click recorded through loopback within 1 ms ; comp of take2[0:1 bar]+take3[1:2] renders seam with no discontinuity > −40 dB
