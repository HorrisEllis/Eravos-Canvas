# eravos.phase75-map.spec — 3.75: VOICE (T-Pain autotune and a full vocal chain) · AUDIO IN/OUT settings · SUITES as the
#   control surface of component tools · GENRES that contrast EDM — mapped 2026-10-25 · status mapped (nothing built)

## His words (2026-10-25), in order
  "t-pain like full autotune. i want production quality. the best quality you can possible generate for the ui." ·
  "Suites are supposed to be like the main control panel. like a synthesizer for each tool it's connected to. that way you can
  connect the suite to the timeline." · "I'm trying to make it as easy as possible to make music, while maintaining power and
  leverage." · "no each tool is sovereign." · "like full suite, and tools for voice. including settings for audio input and
  output like ableton or fruity loops but better." · "I want to start expanding to other genres. I want to contrast edm though."
  · "like each part of a tool should be broken into it's capabilities or components and connect to the control surface" ·
  "then update the specs. phase it all. then merge and push"

## Rules for this round (binding on every phase below)
  SOVEREIGN   every tool works alone, on its own window, with its own presets, packs, page and tests. A suite never absorbs a
              tool and never hides one. It only addresses tools (presets, knobs, wires, scenes, macros) the way the user
              could by hand, so all of it can be undone and is saved with the canvas.
  COMPONENTS  a tool is built as its CAPABILITIES: each capability is a tool of its own (a component), joined by real wires
              (audio for sound, modulation for control signals, notes for notes). The SUITE is the CONTROL SURFACE the
              components connect to: its Panel shows every component's controls, its macros turn several at once, its
              scenes set them all. The Wub family is the model (Wub Osc · Wub Filter · Wub Rate · Wub Sub → Wub Lab).
              Any component can be swapped for another tool with the same ports, or used alone. An existing all-in-one
              tool stays (suite.json "allInOne") so nothing that works today breaks.
  SIGNALS     control signals between components use the existing modulation wire with the range { min: -1, max: 1 }
              (unity scaling, audio rate). Pitch = MIDI note / 128 (0 = no pitch). Pitch offset = semitones / 24.
  QUALITY     "production quality" is measured, not claimed: every claim has a number and a test rendered offline.
  EASY        every component and suite opens playing something good (a starter preset / scene), says what it does in
              plain words, and needs no wiring knowledge: "Build the whole system" wires it.
  STYLE       the look does not change (eravos.themes.spec). New windows use the existing UI kit, tokens and drawn icons;
              "best quality UI" = live, measured displays (pitch graphs, meters), not a new theme.

## A · AUDIO IN / OUT — "like ableton or fruity loops but better"
  Ableton and FL bury this in a modal full of driver words. Here it is one page in plain words, and it tests itself.
  A1 AudioIO (music core, window.AudioIO): prefs() · set(o) · devices() → { inputs, outputs } (labels after the first
     permission) · openInput() → one shared MediaStreamAudioSourceNode for every tool that takes the mic (one prompt, one
     stream) · roundTrip() · reads/writes localStorage `eravos.audio`; read when the sound engine starts.
  A2 Options › Audio page:
     Output   device (AudioContext.setSinkId where the browser has it, else "your system's default", said plainly) ·
              test tone (440 Hz, 0.4 s, on the chosen device) · master level meter
     Input    device · channel (left, right, both summed, stereo) · input gain · live meter with a clip light ·
              Monitor (hear yourself; off by default; a headphone warning) · browser cleanup (echo cancel, noise
              suppression, auto gain) OFF by default: what you sing is what you get
     Timing   latency Lowest · Balanced · Safe (latencyHint) · sample rate Auto · 44.1 · 48 · 96 kHz · the numbers the
              browser reports (base + output latency, ms) · ROUND-TRIP TEST: a click out, the mic hears it, the delay is
              measured and saved as "Recording offset" so takes land on the beat
     A change that needs the sound engine to restart says so and offers the button. Web and desktop alike.
  A3 the components: MIC IN (tool: the shared input → audio out; gain, gate, channel, monitor, meter, record arm) and
     AUDIO OUT (tool: a second output to another device, e.g. headphones cue — only where setSinkId exists).
  Tests: prefs round-trip; openInput shared (two tools, one stream); a stubbed device list renders; round-trip measured on a
  loopback stub within ±1 ms; Monitor off by default.

## V · VOICE — components, then the Autotune suite and the Voice suite
  V1 PITCH TRACK (component): audio in → audio thru (delayed by the analysis lag, so it stays aligned with its pitch) +
     mod out "pitch". YIN (cumulative-mean-normalised difference + parabolic interpolation) on a 2× decimated copy,
     integration 512, hop 256, range 70–1000 Hz; voiced/unvoiced from aperiodicity + level gate; median-of-3 against
     octave jumps. Window: big note name + cents meter + a scrolling pitch line. Knobs: low/high Hz, sensitivity, gate.
     Measured: sine and sawtooth at 110 · 220 · 440 · 880 Hz within ±2 cents; white noise reads unvoiced.
  V2 SCALE SNAP (component): mod in "pitch" (any pitch signal) → mod out "shift" (the correction, semitones / 24).
     Target: the nearest note of the SONG'S KEY + scale (theory:key-change) · Chromatic · Custom (12 note toggles) · or
     NOTES IN (note:trigger from the Timeline or a keyboard force the target: the T-Pain trick, played).
     Retune 0 ms (the hard snap: T-Pain, Cher) … 400 ms (natural) · Humanize (sustained notes keep their own vibrato) ·
     Flex (beyond this many cents off, leave it alone) · hysteresis at note borders (no flutter) · Transpose ±12 ·
     Vibrato (depth, rate: a synthetic one, for the robot sound). Window: THE PITCH GRAPH — a scrolling piano roll, the
     key's notes as lanes, the voice thin, the corrected line bold, the target note lit; a big RETUNE knob (Robot ← →
     Natural); the 12 toggles drawn as a keyboard. Measured: retune 0 lands every held note within ±3 cents of its target
     in 1 block; 400 ms reaches 63% in 400 ± 20 ms; a key change retargets live.
  V3 VOICE SHIFT (component): audio in + mod in "shift" → audio out. TD-PSOLA: a 2-period Hann grain per pitch mark (marks
     on a pitch-synchronous grid, so grains stay coherent), re-spaced at the target period; formants stay where the voice
     put them. Formant (±12 st, resamples the grains: throat/chipmunk without changing pitch) · Keep formants on/off ·
     Shift (manual ±24) · Mix · the shift signal delayed by the shifter's own latency so it lands on the right grain;
     unvoiced = transparent overlap-add. Latency reported to the ledger. Measured: +5 st on a vowel → pitch within ±5 cents,
     spectral-envelope peak within 8% of the original; noise in → < 1 dB change; shift 0 → null test below −40 dB.
  V4 AUTOTUNE SUITE (control surface, tools/music/suites/autotune/suite.json): Pitch Track → Scale Snap → Voice Shift (shift
     in), Pitch Track thru → Voice Shift (audio in) → suite. Macros: Retune · Humanize · Formant · Mix. Scenes: T-Pain ·
     Hard snap · Natural · Subtle · Robot · Trap melodic · Choir. Opening it and pressing Build gives a T-Pain voice.
  V5 THE REST OF THE VOICE CHAIN, each a component: De-esser (split-band 4–10 kHz, listen-to-the-S button) · Vocal Rider (an
     evening gain that follows the level, before the compressor) · Doubler (two copies: ±8 cents, 12/19 ms, wide) ·
     Harmonizer (fx-pitch: already in key) · Vocal Space (plate + slap + a throw delay on the phrase end).
  V6 VOICE SUITE (tools/music/suites/voice/suite.json): Mic In → Pitch Track → Scale Snap / Voice Shift → De-esser → Rider →
     Comp (fx-dynamics) → Doubler → Vocal Space → suite. Scenes: T-Pain · Trap melodic · Natural pop · Robot · Choir · Raw.
     Record: the take goes to the Timeline as a vocal clip (with the round-trip offset applied).

## S · SUITES ARE THE CONTROL SURFACE (and reach the Timeline)
  S1 Panel as a synth face: every connected component's controls in one window, grouped by capability (source · shape ·
     motion · space), its live display beside its knobs (the pitch graph, meters), macros at the top. Tools stay sovereign:
     ↗ opens each one's own window; "Fold the part windows" hides only their windows.
  S2 Suite → Timeline: the suite's macros (m1…m4) become automation targets named after the macro ("Retune", not "Macro 1");
     a lane moves the macro and the macro moves its components' knobs at the same audio time (knob:live fanned out).
     "→ Timeline" on the Panel adds one lane per macro. Notes from the Timeline go to the components themselves (each keeps
     its own track); the Panel's keyboard keeps playing every note-taking component.
  S3 Any tool → components: the suite window of a tool's family opens from its page ("Open as components").
  Tests: a macro lane moves two components' knobs at one audio time; lanes are named after the macros; nothing in a
  component changes when the suite closes.

## C · BREAK EXISTING TOOLS INTO COMPONENTS (the all-in-ones stay)
  An audit (C0) lists every music tool with its capabilities, and which already exist as components. Then one family per
  phase, each with a suite as its control surface, from the most used:
    C1 Drum Machine → Pad voice (one sample/synth voice), Kit bus, Groove (the step pattern), Humanize → Drum suite
    C2 Supersaw / Retro Poly / Pad Forge → Osc stack, Filter, Amp env, Chorus/Unison → Synth suite (reuses syn-osc,
       syn-env, syn-partials where they fit)
    C3 Reese / Acid / Sub → Bass voice, Drive, Filter, Sub → Bass suite
    C4 Effects that are chains (Haunt, Destroyer, Master FX) → their stages
  Each step: the component tools, the suite.json, a scene that matches the all-in-one's default within 1 dB (rendered).

## G · GENRES THAT CONTRAST EDM — instruments first (as components), then the genres
  Today every tool is a synth and every genre is electronic. Contrast needs played-sounding instruments:
    G1 KEYS     Hammer (exciter) · String bank (modal) · Soundboard (body) → Piano; Tine + Pickup + Bark → Electric piano;
                Keys suite. Measured: inharmonicity and decay per register match a piano curve (tested numbers).
    G2 GUITAR   Pluck (exciter: pick, finger, palm mute) · String (Karplus-Strong, 6 courses, strum spread) · Body · Amp ·
                Cab → Guitar suite; strum patterns as Pattern Library patterns.
    G3 ENSEMBLE Bow (sawtooth exciter + noise) · Formant body · Ensemble (chorus, vibrato) → Strings; Lip (exciter) · Bell
                (brass body) → Brass; Vowel (formant choir) → Choir; Orchestra suite.
    G4 KITS     acoustic kit, boom-bap kit, brushes, live percussion (shaker, conga, clap) as Drum Machine kits; log drum
                (amapiano) as a component voice.
    G5 THE GENRES, one family per push (Song Engine + Pattern Library + Songs page all get them):
       Hip-hop & R&B   boom bap · T-Pain era R&B (the Autotune suite on the lead) · neo-soul · trap soul
       Pop             piano ballad · upbeat pop
       Rock & Indie    indie rock · lo-fi indie · post-rock swell
       Jazz & Soul     jazz trio (swing, walking bass) · gospel
       World           afrobeats · amapiano · reggaeton · bossa nova
       Acoustic        folk · singer-songwriter
       Cinematic       orchestral swell · ambient score
  Contrast is measured with the Contrast analyser: each new genre's render sits away from the EDM centre (less sub share,
  more mid detail, more swing, more dynamic range); the test asserts the distance per genre.

## Phases — one at a time; each: build → tests (mutation-checked) → screenshots → push        status
  3.75  A1+A2   AudioIO + Options › Audio page (devices, meters, latency, round-trip test)        mapped
  3.76  A3      Mic In + Audio Out components                                                      mapped
  3.77  V1      Pitch Track                                                                        mapped
  3.78  V2      Scale Snap (the pitch graph)                                                       mapped
  3.79  V3      Voice Shift (PSOLA, formants)                                                      mapped
  3.80  V4      Autotune suite — T-Pain in one Build                                               mapped
  3.81  V5      De-esser · Vocal Rider · Doubler · Vocal Space                                     mapped
  3.82  V6      Voice suite + record to the Timeline                                               mapped
  3.83  S1      Suite Panel as a synth face                                                        mapped
  3.84  S2+S3   Suite macros on the Timeline · "Open as components"                                mapped
  3.85  C0      Component audit of every music tool                                                mapped
  3.86+ C1–C4   Drum · Synth · Bass · FX chains as components + suites                             mapped
  3.9x  G1–G4   Keys · Guitar · Ensemble · Kits (components + suites)                              mapped
  3.9x  G5      Genres that contrast EDM, one family per push                                      mapped
  Open (unchanged, eravos.phase69-map): P69.1 themes · P69.2 songs by genre · P69.4–P69.7.
  Order and why: audio in first (nothing vocal works without it) → the voice he asked for (Autotune) → the rest of the
  voice → the suite as control surface (now with real components to show) → components for the old tools → instruments
  that are not synths → the genres that use them.

## ADDENDUM 2026-10-26 — from the drum packs work (3.74b, specs/eravos.phase74b-map.spec); nothing above is changed
  James, 2026-10-25: "also each pack for the dumpad needs to be completely different sounds. every pack needs to be additive."
  - C1 (Drum Machine → Pad voice component) and G4 (KITS: acoustic, boom-bap, brushes, live percussion, log drum) now have substrate:
    core/drum-recipes.js lets a pack add its own drum sounds as data, played by the Drum Machine's recipe interpreter. A G4 kit should
    bring its sounds as recipes in data/drum-packs/<pack>.js and pass tests/p74b-drum-packs.test.js (≥ 6 dB per feature from every
    other sound), so each new genre's kit is its own sound, not a re-tune — his "completely different" rule.
  - A Pad voice component (C1) can play the same recipes: recipeVoice in pads.engine.js is the one interpreter to reuse (§8.6).
