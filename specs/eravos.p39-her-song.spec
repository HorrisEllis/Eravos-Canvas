# spec_id: eravos.p39.her-song · version 1.0.0 · phase P39 · status MAPPED · order 1
# "i want to build her a song. from my heart but im not good at this." — a guided path from nothing to a finished song,
# made of what ERAVOS already has (Song Engine, Songbook, Timeline, Song Recorder, Learn) plus one new page.

## Direction from the playlist "Lost love." (technique only — A3)
  heard in it: melodic house / progressive (RÜFÜS DU SOL "Underwater", Kygo "Sunrise", Axwell /\ Ingrosso "More Than You
  Know", Swedish House Mafia "Heaven Takes You Home") · synthwave / darkwave (GUNSHIP "Fly for Your Life", Vandal Moon "Sweet
  Disaster") · heavy cinematic emotion (Metro Boomin "Annihilate", Juice WRLD "Flaws and Sins", Serj Tankian "I'm in Heaven")
  · intimate odd-pop (Kishi Bashi). Liked Songs adds bass music (Skrillex "Make It Bun Dem", "Tranki").
  shared traits → defaults for her song: minor key (Song Engine picks; user can change) · 118–126 BPM (melodic house) with
  an optional half-time bass drop at the same tempo (bridges to the Skrillex side) · long pads, sidechained · a vocal/voice
  space in the break · emotional progressions already in the Timeline (Emotional 6–7–5–1, Heartbreak 4–6–1–7) · a big
  final lift. These are starting points the user changes by ear, never rules.

## The Her Song page (new page, music domain — pages/her-song/)
  A calm full-screen page with ONE question at a time, each answered by listening, never by theory:
    1 FEEL     pick 1–2 of: tender · longing · bittersweet · hopeful · euphoric · dark · heavy · dreamy (each ▶ a 10-s sketch)
    2 PULSE    pick a body: floating (no kick) · heartbeat (half-time) · dancing (four-on-floor, the NEW grooves of R4) ·
               running (synthwave drive) · breaking (bass drop) — each ▶ heard with the feel from 1
    3 HER      optional: drop her voice note / a laugh / a word (Song Recorder / Clip Maker) — becomes the hook in the break
    4 SHAPE    the song's arc as 5 cards (intro · verse · lift · drop/peak · end), drag to reorder, tap to make longer/shorter
    5 WRITE    Song Engine writes it with those answers (seeded; "another like it" re-rolls only what you didn't lock)
    6 MAKE IT YOURS — a short list of "change one thing" suggestions, each one click + ▶: "her melody higher", "softer drums
               in the verse", "hold the last chord longer", "her voice before the drop" … each maps to an existing edit
               (Timeline clip, preset swap, lock) so the user learns where things live by doing.
    7 KEEP     Save to Songs + export WAV/MP3 (exists) + "a note to her" text saved with the song (shown when it plays)
  Learn's track "Make music for her" links here; Start → "A song for her" opens it.
## Contracts
  config: feel[] ; pulse ; voiceClip? ; arc[5] ; seed ; locks{} ; note
  data out: a normal ERAVOS project (tools + Timeline + recipe) — nothing special to open, edit or export later.
  acceptance:
    - every step plays a ▶ sketch within 300 ms of the click; nothing requires reading a music term to answer
    - WRITE produces a song ≥ 2:30 with every section of the arc, in one key, no clipping (peak ≤ −1 dBFS on export)
    - re-roll keeps locked parts byte-identical; undo returns to the previous song exactly
    - a voice clip, when given, sounds in the break and before the peak, ducked under nothing
    - the finished project opens as ordinary tools on the canvas (no hidden state)
  gap G1: taste — ERAVOS can check structure and loudness; only the user can say "this is her". The page is built to make
  that judgement fast (▶ everywhere, one change at a time), not to replace it.

# ============================================================
# 1.1 — "LOST LOVE" IN DEPTH: the region every NEW song starts from (user 2026-10-16: "focus on that for new songs
# added. deeply, recursively, everything about it.")
# Method: the playlist is read top-down in levels; each level is derived ONLY from the one above it, and each ends in
# ERAVOS tools/data. Technique only (A3): titles, genres and production traits — no melody, lyric, sample or transcription.
# Confidence marks: [k] widely documented about the artist/genre · [i] inferred from title/genre, verify by ear.
# ============================================================
## L0 — the core (from the 10 titles as words) [i]
  heaven / home ("Heaven Takes You Home", "I'm in Heaven") · light after dark ("Sunrise", "Fly for Your Life") · depth,
  being under ("Underwater") · self-blame ("Flaws and Sins", "I Am the Antichrist to You") · devotion ("More Than You
  Know") · beautiful ruin ("Sweet Disaster"). One sentence: love that is lost, still felt as light, and blamed on oneself.
  musical translation (L0 → sound): minor key that lifts toward its relative major at the peak (darkness → sunrise) ·
  "under" = low-passed, muffled sections that open (Underwater) · "heaven" = wide, high, reverberant pads + choir-like
  tones · self-blame = intimate, dry, close voice (spoken or near-spoken) against huge space.
## L1 — five sonic families in the list [k]
  A melodic / progressive house — RÜFÜS DU SOL, Kygo, Axwell /\ Ingrosso, Swedish House Mafia (4 of 10)
  B synthwave / darkwave — GUNSHIP, Vandal Moon (2)
  C cinematic trap / emo-rap — Metro Boomin et al. (Spider-Verse soundtrack), Juice WRLD (2)
  D orchestral indie loop-pop — Kishi Bashi (violin looping) (1)
  E dramatic rock-crossover voice — Serj Tankian (1)
  + Liked Songs: F bass music × dancehall — Skrillex "Make It Bun Dem", "Tranki"
## L2 — technique per family (what each sounds like it is made of) → L3 the ERAVOS part that makes it
  A melodic house  rhythm: four-on-floor ~118–126, soft round kick, shaker/rim tops, long sidechain pump; harmony: minor
                   loops of 4 chords, piano or pluck stabs on off-beats; sound: warm detuned pads, plucks with delay, deep
                   rolling bass; form: long builds by filter + layers, breakdown with voice, emotional lift
                   → Drum Machine 3.0 "Melodic House" kit (pads.spec), Sequencer §G Melodic House 122 + Progressive 126,
                     Pad Forge + Supersaw (soft) + sidechain, Timeline chord fill "Emotional"/"Heartbreak", filter build
                     (Master / fx-filter automation), Song Engine genres melodic + progressive + deep-house (exist)
  B synthwave/dark rhythm: straight 8ths, gated big snare on 2/4, driving 8th bass; harmony: minor, arpeggios; sound:
                   analogue-style saws, chorus, gated reverb; darkwave adds colder tones, flanged bass, post-punk drums
                   → Retro Poly, 80s kit + 80s bundle (exist), Arp (planned/arp.spec), Song Engine synthwave + darkwave
  C cinematic trap rhythm: half-time ~70/140, rolling hats (1/16→1/32 rolls), long sliding 808; harmony: dark minor,
                   orchestral swells, choir; sound: huge sub, cinematic hits, reverse swells
                   → Drum Machine 808 slide + Trap kit, Sequencer ratchet ramps (§P5), Sub Engine, Song Engine trap,
                     Drum Machine crash "reverse swell" model (pads.spec)
  D violin loops   rhythm: loops layered live; harmony: bright and strange (sweet + sinister); sound: plucked + bowed
                   strings, looped and stacked → GAP: no string instrument (planned/strings-ensemble.spec, looper.spec)
  E rock voice     dramatic dynamics, big chorus, choir-like stacks → GAP: vocal chain (planned/vocal-chain.spec);
                   use the user's own voice clips meanwhile (Song Recorder / Clip Maker)
  F bass × dancehall half-time 140 drop under a dancehall/reggae vocal energy, sirens, dub throws
                   → Wobble 3.0, Dub Station, Bass Drop Builder, Contrast Engine v2 (Dembow / One-Drop skeletons)
## L3 gaps this region exposes (ranked by how many tracks need them)
  G-a strings (D, and pads of A/C) → strings-ensemble.spec first ; G-b vocal processing (A, C, E) → vocal-chain.spec ;
  G-c guitar strum intros (Axwell /\ Ingrosso style, A) → guitar.spec ; G-d choir pad (C, E, "heaven") → Pad Forge
  "Choir" model (new preset family, no new tool).
## L4 — the "Lost Love" song set (NEW SONGS DEFAULT HERE). Each = families crossed, one contrast axis pushed (I6
  sampling runs INSIDE this region: different from each other, all from this heart).
   LL1 Sunrise Under Water       A deep · 120 · starts muffled (low-pass "under"), opens to full at the peak (L0)
   LL2 Heaven Takes the Long Way A prog · 126 · long build, relative-major lift at the drop, choir pad
   LL3 Fly Back to Me            B · 104 · synthwave drive, gated snare, arp, minor → major last chorus
   LL4 Sweet Ruin                B dark · 110 · cold darkwave, flanged bass, spoken words in the verse
   LL5 Flaws                     C · 70/140 · half-time, 808 slides, piano + orchestral swells, intimate dry voice
   LL6 More Than You Knew        A × guitar (gap G-c until built: pluck stand-in) · 124 · big-room heart
   LL7 Antichrist Lullaby        D × A · 118 · sweet/sinister string-like plucks (Retro Poly until strings exist)
   LL8 Raven Drop                F × A · 140 half-time drop between 122 house verses (tempo halving, I6 corner 24) —
                                 her name/voice in the break if she is the Raven (ASK; recipe raven-drop exists)
   LL9 Heartbeat Only            A minimal · 60–90 free · no kick, breath tempo (I10), the spoken recording over pads
   LL10 Last Light               all families · the hurt dial (I5) swept 1 → 0 across the song
  every LL song ships: recipe + Timeline sections + kit + presets (in a "Lost Love" pack spanning the tools) + "what to
  listen for" + its nearest-neighbour distance (I6).
## L5 — recursion (how the region keeps growing without repeating)
  1 the user rates each LL song 💜 / 🙂 / 🙅 (Learn tour ratings exist) → 2 liked songs are bred (I11 at song level:
  crossover of section recipes + presets, seeded mutation) → 3 children are kept only if farther than d_min from every
  existing song (I6) and inside the Lost Love region (feature box from L1–L2) → 4 the region's box is re-fit to what was
  liked → back to 1. Same seed → same children; the family tree is visible in Songs.

## 1.2 — the recordings "Raven 1" (58 s) and "Raven 2" (10 s), measured 2026-10-16 (no words were transcribed: this
## environment has no speech-to-text model — the user is asked to type the words)
  measured: SPOKEN, not sung (held-pitch frames 8–19 %, no stable key) · voice centre ≈ 140–158 Hz (C#3–D#3), range
  ≈ D3–G#3 · pace ≈ 2.7–3.1 phrase onsets/s · voice active about half the time (natural pauses).
  use: (1) as AUDIO — drop the clip into the Song Recorder / Clip Maker → it sits in the break of any LL song, ducking
  the pads under it; (2) as WORDS — once typed, Lyrics → Rhythm (exists) turns them into the song's rhythm/melody;
  (3) KEY — the voice centre suggests C# minor / D# (E♭) minor for songs that carry the spoken clip (soft: r ≤ 0.41).
