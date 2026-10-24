# eravos.phase69-map.spec — 3.69: a v10 theme to choose · songs by genre and subgenre · a pattern library · v10's
#   tools · what the five component zips give (mapped BEFORE building · status mapped · 2026-10-24)

## His words (2026-10-24)
  "this is a old version. strip anything useful and make it a tool … the theme though is what im after" ·
  "stop changing the style. make it look studio quality … animated and alive, and reactive" ·
  "what about instead of so many songs, we have a pattern library?" · "i want the tabs in the tool or suite pages to
  have tabs, not a long page" (DONE, 3.48.4) · "maybe add a new theme and add a options · Apply its theme · Port its
  features as tools" · "if anything in here is useful, migrate and remove as much friction as possible" (5 zips) ·
  "the songs have to much catagories, while not even haivng the genre or subgenre" · "map it. specs."

## Specs
  specs/eravos.themes.spec              the theme option (current = default, frozen) + v10 FINAL as a choice
  specs/eravos.songbook-genres.spec     8 genres → subgenres; collections become a filter
  specs/eravos.pattern-library.spec     Pattern Library · Scope (v10 OSC) · Clip Maker 2.0 (v10 CLIPS)
  specs/eravos.migration-components.spec  the 5 zips: migrate 4 parts (GPU particle field, phase space, voice
                                        analyser, live transcription), skip the rest (text/behaviour tools, can't run)

## Phases — one at a time, tested, screenshots, pushed                                                  status
  P69.1 THEMES — themes.js + theme-v10.css + bundled fonts + ⋯ Options switch; screenshots of both themes  mapped
  P69.2 SONGS BY GENRE — GENRE_OF table, every song genre + subgenre, 8 chips → subgenres, Collection menu  mapped
  P69.3 PATTERN LIBRARY — data model + generated library from patterns.js / Song Engine / Wub Rate / Arp,
        the page (types × genres, mini grids, ▶, Send to), Euclid generator, pattern packs, "Open as patterns"  mapped
  P69.4 SCOPE + PHASE SPACE — waveform · spectrum · Lissajous · phase space (M2)                         mapped
  P69.5 CLIP MAKER 2.0 — slice · reverse · normalize · stretch · pitch · chop ×8 → pads · record          mapped
  P69.6 PARTICLE FIELD GPU — ALK-GL (M1) with 2D fallback                                                mapped
  P69.7 VOICE — shared analyser (M3) into Clip Maker / Lyric Rhythm; live transcription in Lyric Rhythm (M4) mapped

## Order and why
  Themes first (the look he keeps asking for, isolated behind a switch so nothing else changes) → songs by genre (a
  complaint about what exists, small) → the pattern library (the big new idea) → the v10 tools → the migrations.

## Done in this round (before the map)
  3.48.4 tool and suite pages are tabs (one section at a time, the tab kept while the page repaints) — pushed
