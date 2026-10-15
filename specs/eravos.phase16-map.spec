# eravos.phase16-map.spec — Songbook · Learn · new genres · the drop gap (3.29) — everything here is OFF the canvas
# Axioms: nothing pretends to work; each tool is its own first. Every item below is checked by tests/p19.test.js.

## 0. Rule for this phase: separate from the canvas
  Nothing in 3.29 changes the canvas, the window manager or any tool window. New things are pages of their own
  (full-screen overlays) and data. Songs still land ON the canvas when you choose one, through SongEngine / Recipes.
  Files: domains/music/data/songbook.js · domains/music/data/learn.js · song-engine.js (styles + gap) · music.css ·
  domain.js (one toolbar unit: music.studio → 📖 Songs · 🧠 Learn).

## 1. Songbook (📖 Songs) — DONE 3.29
  A page of finished songs to start from, filtered by mood (For her · Heavy · Dark · Goth · 80s · Island · Warm ·
  Party · Calm · Fast). Each song = genre + pinned seed (same song every time) + LISTEN FOR + THE DROP + HER VOICE CLIPS
  (where her clips go in that song). ▶ Write this song (replaces the canvas; Ctrl+Z undoes) · 🎲 Another like it.
  Songs: Make a song for her · Give Your Head a Shake · Bun Dem · Yard Riddim · Midnight Drive · Under the Hanging Tree ·
  Coven at 70 · Cold Ballroom · Robot Riddim · Golden Hour Drop · Liquid Night · Neuro Grid · Monstercat Morning ·
  Ice 808 · Cowbell Drift · Four to the Floor · Acid Hours · Tape for Her · Breathe With Me
  + 3 locked songs opened by finishing a Learn lesson (The Silence Before · Spinning Cathedral · Steppers at Dawn).
  Songbook.add({...}) adds a song (a pack can too).

## 2. New Song Engine genres — DONE 3.29
  Reggae Dub (Bun Dem) 72–80: one-drop (kick + rim on 3 only), skank on 2 & 4, organ bubble, sound-system sub,
    dub break (drums + bass), drop = steppers (kick every beat); Dub Station echo on the skank, Dub Throw on the lead.
  Dancehall Riddim 92–100: dembow (kick every beat, snare 3-3-2), 3-3-2 bass; Dub Station "Bun Dem" on the hook.
  Hanging Tree (desert goth) 72–80: Gothic Organ (Hanging Tree / Lanegan Drone), fuzz rumble, dry drums, bell + Haunt.
  Phonk 128–140: cowbell lane, 808, choir haze through Haunt "Telephone From Below".
  Lo-fi Chopped 70–86: swung hats, sevenths, Haunted Cassette; no drop gap (impact: false).
  Breath Ambient 60–68: no drums; the "drop" is the harmony opening.
  Engine styles added: bass onedrop · dembow; chords skank · bubble. SongEngine.styles lists them.

## 3. The drop gap — DONE 3.29 (the head-shake)
  Every section that leads into a drop goes silent for its last half beat in every part; drop beat 1 gets crash + kick
  at full velocity. Genres opt out with impact: false (lo-fi, ambient).

## 4. Learn (🧠 Learn) — DONE 3.29 (first 10 lessons)
  A map page: tracks Beats · The Drop · Sound Design · Systems; start anywhere. A lesson runs in a strip at the
  bottom-left of the window, outside the canvas.
  sound first · predict → press (3 choices, hit rate kept) · open loop at the end of every lesson (the next lesson
  answers it) · hints in rungs · "Do it for me" performs the real action · a step ticks only when its event really
  happens on the bus (K.bus.tap; same matcher grammar as the Coach) · finishing a lesson can unlock a Songbook song.
  Lessons: The beat with a hole · Swing is a delay · Steal a genre's DNA · Silence is the loudest part · Her voice right
  before the hit · Tension you can tune · The organ that breathes on the beat · Two saws arguing · Everything is a
  signal flow · Feedback is a loop.
  Progress + predictions are kept in this browser (localStorage 'eravos.learn.v1').

## 4b. 3.30 — DONE
  Pads: a pad controller works with NO window open (MIDI Map runs as a background service; the MIDI button gives it
    its window). Factory maps count from the hardware's bottom-left; rows are flipped so the pad you hit is the pad you
    see (top-left hardware pad = Drum Machine pad 1).
  Shell: blank on open — Start · Add · Options (eravos.playground.spec § 1).
  Learn: 17 lessons in 6 tracks — Make music for her · Express yourself · Beats · The Drop · Sound Design · Systems.
    Each lesson names the skill it gives and the leverage it opens; each track ends on a hidden node (✦ ? ? ?) that
    reveals what you can now build when the track is done (pattern incompleteness → open loop → payoff).
  Sounds page: presets of every tool by pack · drum KIT PACKS (Island · 80s · Street · Dark · Mine) you switch on/off,
    load, mix pad-by-pad, save as your own · CAPTURE: arm, play any tool, the first note starts a 1 beat–2 bar recording
    that lands on a Drum Machine pad.
  Exe: ERAVOS Library/Mods/<Domain>/ — one folder per domain (Music packs ship in Mods/Music).

## 4c. 3.31 — DONE
  Song Recorder → 📖 Save to Songs: renders the song (MP3 192, FLAC fallback), keeps the audio AND the whole canvas as a
    project (♪ name). Songbook → 📖 My songs: listen, ⟲ open back onto the canvas, delete.
  EDM genre pack (data/genres-edm.js): Trance · Progressive House · Deep House · Tech House · UK Garage · Hardstyle ·
    Jungle · Breakbeat · Electro House · Big Room · Moombahton · Psytrance · Future Garage (+ styles psy, gallop).
  Taste: rate any genre 💜 / 🙂 / 🙅 (Songbook or the tour) → Songbook "For you" shows your genres first.
  EDM tour (Learn): one lesson per EDM genre (22) — write it, hear it, rate it. New genre packs join the tour by themselves.
  Goals: 15 achievements that unlock only on real events; "Next goal" always says the one thing to do next and how.
  Domain map: specs/eravos.domains.map.spec + 4 domain specs + 44 tool specs (image 12 · video 9 · UI/web 11 ·
    automation 12), generated from specs/src/domains.mjs by build/domain-specs.mjs. Status MAPPED until each is built.

## 5. Next (not built)
  P16.6 more lesson tracks: Bass (6), Sound Design (+6), Xenharmonic (4), Systems (+2: modulation, arrangement as tension).
  P16.7 Songbook: a 10-second preview per song (rendered offline) so you can hear before you write.
  P16.8 her voice: a "voice slot" in every Songbook song — drop a clip on the card and it is placed where the card says.
  P16.9 presets: +6–10 per tool, genre-tagged (preset-packs.js), each tested non-silent and non-clipping.
