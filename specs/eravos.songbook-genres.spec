# spec_id: eravos.songbook-genres · version 1.0.0 · phase P69 · status mapped (not built)
# "the songs have to much catagories, while not even haivng the genre or subgenre."

## Findings (tools/music/data/songbook.js, 2026-10-24)
  F1 16 categories in one row, mixing GENRES (Dubstep, DnB, House, Techno, Trap, Reggae, 80s, Goth, Chill) with
     COLLECTIONS (Heavy Drops, Arp & Motion, Synthesis showcase, For Her, Lost Love, Odd Couples, More) — plus a second
     row of 11 "moods". A Heavy Drops song is filed under Heavy Drops, never under its genre.
  F2 a song has one `genre` string that is sometimes a genre ('dubstep'), sometimes a collection id ('hd-…', 'oc-…'),
     sometimes a one-off ('hanging-tree', 'bun-dem-fire') — there is no subgenre at all.

## Model
  every song: genre (one of 8) · subgenre (one) · collection? (optional, where it came from) · bpm · key · mood tags
  GENRES (8): Dubstep · Drum & Bass · House · Techno & Trance · Trap & Hip-hop · Reggae & Dancehall · Synth & Dark ·
              Chill & Ambient
  SUBGENRES (from the ids the Song Engine already knows):
    Dubstep: Classic · Riddim · Tearout · Brostep · Melodic · Deathstep · Talker · Wub rig · Heavy (half-time)
    Drum & Bass: Liquid/Two-step · Neurofunk · Jungle · Breakbeat · Drumstep · Reese roller · Half-time
    House: House · Deep · Tech · Bass house · UK garage · Future garage · Electro · Big room
    Techno & Trance: Techno · Trance · Progressive · Psytrance · Hardstyle
    Trap & Hip-hop: Trap · Phonk · Future bass · Moombahton
    Reggae & Dancehall: Roots reggae · Dub · Dancehall · Reggae brostep (Bun Dem)
    Synth & Dark: Synthwave · Darkwave · Witch house · Gothic (Hanging Tree)
    Chill & Ambient: Lo-fi · Ambient · Showcase (synthesis demos)
  COLLECTIONS (a filter, not a category): Heavy Drops · Arp & Motion · Synthesis · For Her · Lost Love · Odd Couples ·
    Bun Dem Fire · Wubs — every collection song is given its real genre + subgenre in its own data file.
  a table GENRE_OF[id] = [genre, subgenre] in songbook.js maps every existing genre id; songs written by hand carry
  genre/subgenre themselves; a song with neither falls back to its id's mapping, never to "More".

## The page
  one row of 8 genre chips (+ All) with counts · picking a genre shows its subgenre chips · a small "Collection ▾" menu
  and the mood menu (one control, not a row) · search across name, genre, subgenre, collection, mood · sections =
  subgenres of the chosen genre (or genres when All) · each card shows "Genre · Subgenre", BPM, key
  Saved "My songs" keep working (they get their genre from the song they were made from).

## Acceptance
  no song in "More" · every card shows a genre and subgenre · chips: 8 genres, not 16 categories + 11 moods ·
  a Heavy Drops song appears under its genre AND under Collection › Heavy Drops · tests in p19 (Songs by category) updated

# ADDENDUM 3.73 — every genre's melodic parts now move (eravos.pattern-library.spec, addendum 3.73); a genre opts out with curve: false.

# ---- ADDENDUM 2026-11-13 — the machine songs; the Song Engine reaches effects and modulators (nothing above is changed)
#   his words: "6? also they sound horrible. more like floor falls out." · "considering i said everything eravos could do including automation.
#   way too shallow for how much depth ive been giving it. also stop making new catagories. i told you the catagories."
#   - categories: his three (2026-11-12: "lofi, synthwave, and wobblebass"), on the existing shelves — 🌙 Chill (lofi-*), 🌆 80s · Synth
#     (synthwave-*), 🔊 Dubstep & Wubs (wub-*). No new shelf (the 3.173 "✨ ERAVOS Now" shelf is removed).
#   - the Song Engine (additive; every existing genre writes byte-identical steps, measured on all genres, seed 4242):
#       G.curves may name an effect (fx<i>) or a modulator (mod<i>) as well as a part — automation on any tool in the song
#       G.routes [{ from, out?, to, key }] — any violet output (a part's, an effect's, a modulator's; `out` names it) into any knob
#       a modulator's own `out`; the modulate step also accepts a knob's port name (knob.fmIndex)
#   - three genres x eight songs on Floor Falls Out's arc, each song its own pause move (4 a genre), progression and phrase order;
#     measured beside Floor Falls Out (#5901): the drop's level, its 30–60 Hz share, above 150 Hz, the pause as a hole, clipping.
#     Found: Head Shaker over Earthquake Drop (also in Heavy Drops' own seeds) measures 3 % low end and −11 dB above 150 Hz — thin and
#     harsh; Floor Falls Out is Classic Wub 1/8 over Deep Sine (21 %, −19 dB). The wub songs use that sound.
