# "Rumble" (Skrillex, Fred again.. & Flowdan, 2023): its methods, for ERAVOS

His words (2026-11-27): "look at the song rumble by skrillex. the frequencies how the collide. look deeply into the methods. the way it creates
ripples and tension. i want to be able to create what that song does. voice, sounds, all of it. like the contrast is where its at. like i want a
bunch of spacial tools and ui elements for components. tension, oscillations. wavelengths, emergence."

**Only the techniques.** What is taken is how it is made. No melody, lyric, vocal, sample or arrangement of the record is copied. This has been the
rule since 3.36: "technique not copies". The voice is **not** Flowdan's. ERAVOS makes a voice *character* (deep, dry, close, rhythmic) by synthesis
(Voice Lab, VL3), or he records his own voice. **Capability first** (2026-11-24, "eravos makes it, not you"): this file lists what ERAVOS must be
*able* to do. It does not describe a song for the coder to hand-build.

## What is known, what is heard, what is uncertain

- **Known (sources):** released 4 January 2023. Produced and programmed by Fred again.. and Skrillex; Skrillex mixed it. Flowdan, a grime MC, is
  on vocals. About 2:26 long. Described as dark and dubstep-leaning with grime in it: "heavy, predatory" sub-bass against "flickering machine gun
  kicks" (The Fader). Four Tet worked on it at first. Skrillex said Four Tet "made sure we didn't overproduce it" (MusicRadar). It won the Grammy
  for Best Dance/Electronic Recording (2024).
- **Heard (from listening, not confirmed by the producers):** everything in the method table below.
- **Uncertain:** the exact tempo and key, the synths, and the processing chain. No first-hand breakdown was found, and online tutorials are
  remakes, not the producers. Tempo is assumed to be about 140 BPM, played half time, like most UK dubstep and grime. **Measure it**; do not quote it.

## The core idea: contrast made from very few parts

The record is short and spare. Its strength comes from **few elements kept far apart**, not from piling on more. Four Tet's "don't overproduce" is
the method. Every pair below is a contrast you can hear. Each one is a dimension ERAVOS has to be able to move:

| Contrast | In the record (technique) | What it does to you |
|---|---|---|
| **full ↔ empty** | the voice alone over almost nothing, then the bass hits | the silence makes the hit large |
| **low ↔ mid** | a clean sub against a grinding, distorted mid-bass | the body is felt, the growl is heard, and they fight |
| **steady ↔ stutter** | a held groove broken by fast kick rolls (the "machine gun") | time seems to speed up, then lands |
| **dry/close ↔ wide/far** | the voice and sub dry and centred; hits and FX thrown wide and away | close means threat, far means scale |
| **voice ↔ machine** | the MC's line, then the bass answers like a second voice | call and answer: the bass "talks back" |
| **held ↔ released** | sections that refuse to drop, then a drop | tension is held until it is let go |
| **in tune ↔ beating** | low layers a few Hz apart, so they swell and empty | the "rumble": a ripple in the floor |

## How the frequencies collide: the methods

1. **Beating (the ripple).** Two tones at f and f + Δ add up to one tone whose loudness swells and empties Δ times a second. Under about 7 Hz you
   hear a swell, so the room breathes. Above that you hear roughness, a growl. A low layer detuned by **hertz** (not cents) gives the same swell
   rate on every note. Cents scale with pitch, so the swell rate would change from note to note. *ERAVOS:* unison-stack ✓ and
   oscillator-population ✓ detune in cents. They need a **Hz mode** (CS1).
2. **Intermodulation (the grind).** Distortion on a sound with two or more partials makes new ones at their sums and differences (f1 ± f2,
   2f1 − f2 …). A mid-bass driven hard grows harmonics that were never played, and they move whenever the notes or the filter move. The order
   matters: filter → drive grinds, drive → filter smooths. *ERAVOS:* saturator-tube ✓, saturator-tape ✓, bitcrusher ✓ are built; waveshaper, wavefolder, rectifier and ring-mod are specs.
   The order on the Field board is already swappable (3.204–3.206).
3. **Sub and mid as two parts.** One note is split in two: a clean sine or triangle sub under about 100–120 Hz, mono, steady; and a distorted
   mid layer above it that does all the moving. They meet at a crossover, and how they collide there is the sound. *ERAVOS:* osc-sub ✓ and stereo-tools ✓ (Bass mono) are
   built; multiband-splitter is a spec. Missing: a **view of where they collide** (masking-analyzer, spec only) and a **split that ducks only
   that band** (CS3).
4. **Sharing the low end in time.** The kick and the sub cannot both own 40–80 Hz at once. Either the sub steps aside on each kick (sidechain
   or ducking) or the kick gives up its tail. In a kick roll the sub stops completely, so the roll fills the hole. *ERAVOS:* the Sidechain tool ✓ (whole band);
   the ducker component is a spec. Missing: a **per-band duck** keyed from one part to another (CS3).
5. **Pitch dives and glides.** The bass falls into its note or drops an octave, so the frequencies sweep through each other and the beating
   speeds up and slows down as they pass. *ERAVOS:* pitch-path ✓, per-note bends ✓ (3.233), slew-lag (spec).
6. **Kick rolls (the machine gun).** Repeats that speed up (ratchets: 1/8 → 1/16 → 1/32), each one shorter, sometimes rising in pitch. Time
   gets denser just before the release. *ERAVOS:* the per-note ratchet that "speeds up" ✓ (W3d),
   Drum Forge ✓; the ratchet component is a spec.
7. **Negative space.** Silence is a part: whole bars where only the voice, or nothing, plays. Measured as an energy curve that drops to near
   zero on purpose. *ERAVOS:* energy-curve (spec). Missing: **silence as a parameter** of the song engine (CS8).
8. **The voice as rhythm.** A grime MC lands the words on the grid as a percussion line: deep, dry, close-mic, and level in pitch, so the force
   comes from the timing and the consonants, not from melody. *ERAVOS:* Lyrics → Rhythm ✓ puts his syllables on the beat. The voice itself is
   Voice Lab's CREATE (vocal-tract, spec). Missing: a **character** for it (deep, dry, close, level) as settings, not a copied person (CS7).
9. **Space by band and distance.** The sub stays mono in the middle; the growl sits a little wide; the air and throws go wide and far. Distance
   is heard as level, pre-delay, and how much high end is lost. *ERAVOS:* stereo-tools ✓, panner, early-reflections, reverb-fdn (specs). The
   planned Spatial Organism already lists them. Missing: **one view of the whole field** (CS4).
10. **Tension held, then released.** Several kinds of tension climb together (density, pitch, a filter opening, a riser, the kick roll), and
    at the drop they all let go in one moment. *ERAVOS:* tension-meter (spec), the planned Tension Field and Tension to Release tools,
    energy-curve. Missing: the **five kinds shown and driven as one** (CS5).

## Emergence: what comes out of the parts

The rumble cannot be found in any single layer. It comes from **relations**: two close notes make a swell, two bands make a collision, drive
on two partials makes notes nobody played, and a roll against silence makes acceleration. That is emergence: the whole has properties its parts
lack. ERAVOS already has one engine that works this way, oscillator-population (Swarm: voices that pull on each other, drift, beat, and lock,
with coherence as an output). The EMERGENCE element shows that agreement and sends it out as a signal any tool can follow (CS6).

Key: ✓ = built in ERAVOS today; everything else named is a spec, not yet code.

## Sources

- [Rumble (Skrillex, Fred Again and Flowdan song) — Wikipedia](https://en.wikipedia.org/wiki/Rumble_(Skrillex,_Fred_Again_and_Flowdan_song))
- [Skrillex shares "Rumble" featuring Fred again.. and Flowdan — The Fader](https://thefader.com/2023/01/04/skrillex-rumble-feat-fred-again-flowdan)
- [Skrillex on "Rumble": Four Tet made sure we didn't overproduce it — MusicRadar](https://musicradar.com/news/skrillex-four-tet-rumble)
- [Skrillex, Fred again.., Flowdan — Rumble — NPR](https://www.npr.org/sections/now-playing/2023/01/05/1147104279/skrillex-fred-again-flowdan-rumble)
- [Sound design tips: Skrillex's Rumble bass line — MI](https://www.mi.edu/in-the-know/sound-design-tips-make-skrillexs-rumble-bass-line/) (a remake, not the producers)
