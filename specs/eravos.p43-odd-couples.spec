# spec_id: eravos.p43.odd-couples · version 1.0.0 · phase P43 · status BUILT · music
# "each tool has to add packs, and new songs. can you make as creative songs as possible? like the tools that normally go
#  no where near together" · "i love the dubs, wubs, wobble, tension" (desktop exe)

identity:
  songbook: tools/music/data/odd-couples-songbook.js (data only; loads after the Bass Pack writer and the Lost Love songbook)
  packs: build/odd-couples.mjs → tools/music/tools/<category>/<tool>/packs/odd-couples/pack.json (prefix "Odd")
  comp_intent: every song is a pairing that should not work, played so that it does; every tool in the domain plays somewhere.

## Packs — one per music tool (54 tools · 132 presets · 3 Pads kits · 2 Drum Forge kits)
each preset = an existing preset of the same tool (its base) + the knobs that make it its Odd Couples self. The intent of every
  preset is written next to it in build/odd-couples.mjs (DESIGN). Every value is checked against the tool's real config from
  the running engines (unknown knob, out of range, wrong option type → nothing is written), then by build/validate.mjs.
utilities get packs of their own settings (Session tempo/key templates, Timeline views, Mixer, XY Pad, Macro, Coach, Contrast
  Analyser, MIDI Map layouts, Clip Maker "Her words (tight)", Song Recorder master export).
kits: Pads — Cathedral Riddim · Steppers Machine · Séance Trap (16 pads in the Song Engine lane order: kick, snare, clap,
  hat, open hat, 808, rim, tom, crash, perc, shaker, cowbell …) · Drum Forge — Chapel Dancehall · Golden Steppers.

## Songbook — 12 genres × 6 songs (72), family "Odd Couples", 🧪 chip on the Songs page
form (shared): intro → verse → build → pause → DROP → switch → her words (break) → build 2 → pause 2 → drop 2 (lifted) → outro.
her voice rig in EVERY song: Clip Maker → Sample player (the break) and Clip Maker → Drop Builder (fires on the timeline's
  "drop" marker; her clip ends on beat 1 and the rest of the mix dips under it — Drop Builder 3.1).
  oc-cathedral-riddim    gothic organ (1/16-triplet chops) × riddim wub rig (Wub Osc FM → Wub Filter comb, Wub Rate stair,
                         Wub Sub) × Dub Station chamber on the organ × FX Haunt tape · Drum Forge layered under Pads · FX Box
  oc-acid-seance         303 × chanting Coven (septimal hex) × trap 808 × Retro Poly arp through an auto-wah · Dub Station
                         rewind · utonal Ratio Lattice drone · Breath (hanging tree)
  oc-golden-dub          Xen Synth golden-generator bells (not 12-tone) × one-drop sound system × siren at 6.18 Hz (φ) ×
                         Golden Reese / Golden Growl · 618 ms echo · just-intonation drone · φ LFO
  oc-lullaby-tearout     Curve Synth bouncing-ball music box × Bass Forge tearout × Pad Forge glass · Wobble switch-up
  oc-synthwave-steppers  Juno keys as a reggae bubble × 80s brass × steppers drums × triplet Wobble · EDM Lab shuffle
  oc-breathing-dnb       Embodiment Lab body drone (locked to the beat) × 174 roller × breathing Reese · Breath, Recursive
                         Spectra mirror choir, bar LFO
  oc-spectral-trap       Recursive Spectra bell loop × 808 trap × saws with a demon octave × slendro Xen bells stuttered ·
                         Harmonic Analyzer reading it
  oc-funeral-dancehall   funeral organ skanking on the dembow × chanting Coven × Dancehall Yoi wobble × 303 stab · Channel
                         tucking the organ · Lyric Rhythm dancehall chat
  oc-glitch-gospel       gospel seventh stacks (Supersaw) × tonewheel shuffle (Organ) × FX Glitch stutter and tape stop ×
                         house · XY Pad, Macro Automation
  oc-xen-wobble          19-EDO lead × Wobble free-running at φ Hz × UK garage 2-step · golden orbit pad · Wub Osc growl
                         through the choir mouth
  oc-machine-choir       EDM Lab writing its own roller × golden ghost Coven behind glass × acid Wobble through the acid
                         mouth × 12-bit organ · a 13-step Wub Rate
  oc-hanging-dub         desert-goth Organ drone × dub chamber × wub-sub floor × synthwave chapel through a stone throw ·
                         Embodiment Lab holding her voice · Master FX cathedral
not in songs (and why): Song Recorder (records the master), Mixer (the mix view), Coach, MIDI Map, Contrast Analyser, the
  Sequencer (songs are written on the Timeline). They still get Odd Couples packs.

## Tests — tests/p43-odd-couples.test.js
12 genres · 72 songs tagged odd · every music tool has its pack · every preset a song names exists (none falls back) · every
  tool plays somewhere (the list above aside) · every genre writes with zero faults and wires her clip to BOTH the Sample
  player and the Drop Builder. Song previews: rendered offline and measured like the rest (see the preview artifact).
