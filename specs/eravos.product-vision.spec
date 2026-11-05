# spec_id: eravos.product-vision · version 0.1.0 · status proposed · 2026-11-03
# What ERAVOS Canvas becomes once the ecosystem (eravos.music-ecosystem.spec) is built. TARGET capabilities — not a claim
# that any of this exists today. Nothing here is marked implemented until its code and acceptance tests are inspected.

## The point
  ERAVOS becomes a programmable music-creation environment, not a collection of synthesizers and effects. The tools only add
  up to more through how they're integrated, the audio engine under them, and the workflows built on them — otherwise
  "impressive islands that don't form one continent". Foundation first: the audio engine + the universal tool contract.
  Every tool composable, automatable, inspectable, controllable.

## Layers
  sound generation        any electronic sound; no tool imposes a narrow sound identity — each exposes its oscillators,
                          harmonics, filters, modulation, distortion, movement and routing (a Wub Organism can make non-wub)
  relational sound design HIS PRIORITY. Knobs are not isolated: relationships between parameters, events, audio features and
                          other relationships (eravos.relational-modulation in tools/music/planned/). Examples: an oscillator
                          reacts to another's phase · a filter opens with rhythmic tension · a bass's harmonics change with its
                          movement · reverb expands in a transition and contracts on the drop · several sources combine on one
                          parameter through math operations · a rhythm drives a sound's evolution · one instrument's output is
                          another's control. A sound can be a network of relationships, not a fixed effect chain.
  musical evolution       tension, oscillation, contrast and rhythmic tension shape how a passage BEHAVES over time: density
                          rising into a drop · instability resolving into a locked groove · oscillators syncing and drifting ·
                          intensity alternating with space · variations that keep a chosen groove · transitions that respond
                          to the music, not only to a fixed time
  production              session, arrangement, audio + MIDI editing, sampling, automation, mixing, performance, sound design
                          from modular components — the infrastructure that puts ERAVOS in Ableton's category
  audio intelligence      import a finished track → tempo, rhythm, transient patterns, bass movement, harmony, melody, chords,
                          sections, transitions, spectra, likely techniques → an EDITABLE reconstruction (e.g. take the inferred
                          bass line, put a Wub Organism on it, change its modulation and rhythm, use it in your own song).
                          LIMIT: never recovers the original studio project from a stereo file; every result is a hypothesis
                          with a confidence.
  extensibility           users combine tools into instruments, build effects, modulation systems, sequencers and instrument
                          architectures, connect them by typed ports, package them as tools and packs, automate tool
                          creation through Emerge specifications — users become instrument designers
  packs                   HIS PRIORITY: every tool has its own packs, and EVERY PACK IS NOVEL. A pack = starting architectures
                          (presets, oscillator + filter configurations, modulation graphs, patterns, performance mappings,
                          evolution profiles, tool combinations) the user can fully take apart and rebuild. Never a re-skin:
                          unique names across the ecosystem, no product / artist / record names, novelty test passed
                          (eravos.music-ecosystem.spec §6).

## Better than Ableton — three levels
  1 feature parity        the essential production tasks Ableton users expect (list: eravos.music-ecosystem.spec §10 parity)
  2 capability advantage  more flexible, expressive or powerful in particular workflows
  3 workflow advantage    THE GOAL — whole processes that are cumbersome or impossible elsewhere: import a track, analyse its
                          structure, extract an approximate musical model, replace its sounds, wire new relationships between
                          instruments, generate variations, end with a new composition — without leaving ERAVOS

## Acceptance (when the vision is claimed met)
  - every §10 parity item closed and tested
  - the workflow-advantage example above runs end to end on a user's own track, every step editable
  - the relational and novelty requirements pass their tests in every shipped tool
