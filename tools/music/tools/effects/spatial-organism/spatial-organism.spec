# spec_id: eravos.spatial-organism · version 1.0.0 · status built (3.244, 2026-11-27) · template eravos.tool/1
# planned as tools/music/planned/spatial-organism.spec (its assembles, adds, modes and packs kept); built for the Contrast setup
# his words (2026-11-27): "i want a bunch of spacial tools and ui elements for components" · "Okay but not one monolith" · "tool suite, each
#   tool, then each component for each tool" · "yes build them use the null renderer to make sure its novel in relation to the rest of eravos"
# direction: specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2); research docs/research/rumble-techniques.md (method 9: space by band and distance)
identity:
  id: eravos.spatial-organism ; label: Spatial Organism ; domain: music ; family: effects (space) ; icon: ◎ ; accent: "#5ac8ff"
  lineage: stereo imaging, binaural (ITD and head shadow), distance cues (level, air, arrival), early reflections, the rotary speaker's motion
  novelty: one point placed by angle AND distance with every distance cue at once; an orbit that can be a pendulum (lingers on a side); the
    room's echoes drawn where they come from; where it is goes out as a signal
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  panner · early-reflections · lfo · stereo-tools
signal_dag:
  in → panner
  lfo → panner
  panner → early-reflections
  panner → stereo-tools
  early-reflections → stereo-tools
  stereo-tools → out
engine: one AudioWorklet (the components' kernel text): mid (L+R)/2 → panner (angle = Angle + Swing width · lfo, distance = Distance + Swing
  away · the swing's reach; ears) → + early-reflections of it × Room → + the input's side × Width → MonoBelow (Bass mono) → STD.fx. Out 2: the
  angle now, 0…1. The orbit moves the point once a block (128 samples).
modes (planned: stereo · binaural · multichannel): stereo ✓ · binaural ✓ (Ears: ITD + head shadow; an HRTF is open) · multichannel: open
packs: factory — Moving Orbit · Wide Horizon · Narrow Pressure · Immersive Field · Mono Focus · Rotating Machine · Deep Space (the planned
  seven) · Lingering Right (the pendulum)
open: phase-correlation (the planned meter; stereo-tools' correlation() is there) · HRTF · multichannel · drawn motion paths (planned "adds")
acceptance (spatial-organism.test.js, P241):
  - all at rest (angle 0, distance 0, no orbit, no room, width 1, bass mono 0): a mono input comes out −3 dB a side, a side-only input unchanged
  - Angle 1: the left falls silent (ears 0); Distance 1 is ~18 dB quieter and 12 ms later than 0
  - the pendulum with Lean 0.8 spends most of its time on the right (the "where" output > 0.5 more than 60 % of the time)
  - Room adds energy after the dry sound has gone; Bass mono: a 50 Hz tone hard left comes out of both sides
