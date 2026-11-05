# spec_id: eravos.voice-architect · version 0.1.0 · status planned:vocoder.spec, talkbox.spec, voice-character.spec · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (musical_intelligence) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.voice-architect ; label: Voice Architect ; domain: music ; family: musical_intelligence
  lineage: vocoders, talk boxes, formant processing, choir synthesis
  family_from: harmony, voice leading and counterpoint traditions; arpeggiators; generative composition
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  vocal-tract · filter-bank · filter-formant · pitch-shifter · grain-cloud · pitch-tracker
adds (behaviour only this tool has):
  - vocoder with any carrier from the canvas
  - choir from one voice (pitch + formant spread)
  - speech-like synthesis from phoneme lanes
modes: vocoder · choir · synth-voice · formant
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  vocal-synthesis · formant-processing · granular-vocal-processing · vocoder · choir-synthesis
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Robotic Choir — vocoded choir pads
  - Human Ghost — breathy, distant voices
  - Formant Bass — talking bass via vocoder
  - Digital Choir — bright synthetic choirs
  - Glossolalia Engine — invented-language phrases
  - Choir Cathedral — massive choirs in space
  - Vocal Chop — pitched vocal chops for future bass and house
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)
