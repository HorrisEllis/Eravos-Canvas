# spec_id: eravos.organism.granular · version 1.0.0 · phase P44 (was planned P8.3 "Emerge") · status canonical
identity:
  id: eravos.granular ; label: Granular ; icon: ∞ ; accent: "#aaff44" ; category: Synthesis
  comp_intent: Scatter any sound into a cloud of grains — textures, drones, shimmering pads, stutters.
  novelty: LIVE — anything wired in (or the slot of a host it lives in as a mod) is the source; or a clip. One small tool, used everywhere.
engine:
  worklet 'eravos-grains': stereo ring buffer 12 s · ≤ 96 grains (oldest dropped) · per grain: start = position ± spray within the
    last MEMORY seconds (live; 1 = now) or within the clip ; length SIZE ; rate 2^(st/12), st = pitch + note + random ± pitch spray
    (In key: the spray lands on the song scale) ; reverse with REVERSE odds ; Tukey window (SHAPE 0…1 → taper 2…50 %) — every grain
    starts and ends at 0 ; mono grain, equal-power pan ± WIDTH ; sum × 1/√(rate × size) so density does not change loudness
  schedule: DENSITY grains/s (interval × 0.5…1.5 jitter) or SYNC = one grain per 1/4…1/32 (T) of the song's tempo
  live memory: what comes in is written unless FREEZE ; FEEDBACK writes the cloud back (tanh-limited)
  clip: Clip Maker wired into asset in, an asset addressed to it, or Load clip… ; SCAN moves the position (−2…2 × real time) ;
    the clip hash is part of its save ; ● Live returns to live input
  keys: with Keys on the cloud only plays while a note is held, pitched by it (C4 = as recorded)
  stop: Stop all (hard) clears every grain
config: position, spray, memory 0.25…12 s, scan, freeze, size 5…1000 ms, shape, density 0…400/s, sync [off,1/4,1/8,1/16,1/32,1/8T,1/16T],
  reverse, pitch ±24 st, pitchSpray 0…24, quantize, keys, width, feedback 0…0.95, level, STD mix (default 0.6)
hooks: STD.fx ; note_in ; asset_in ; theory_in ; mod_in position / density / pitch
presets: Voice Cloud, Frozen Word, Shimmer Pad, Rain, Glitch Dust, Octave Down Smear, Reverse Swell, Stutter 1/8, Played Cloud (keys)
ui: the grain field (x where each grain reads, y its pitch, fading over its life) over the spray band ; click = burst there ; ● Live / Load clip…
tests: contract ; makes a cloud of what is wired in ; freeze keeps sounding after the input stops ; pitch +12 = an octave up ;
  clip mode plays a loaded clip with nothing wired in ; works as a mod inside the Destroyer

