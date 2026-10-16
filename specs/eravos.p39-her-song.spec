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
