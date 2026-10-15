# eravos.phase33-map.spec — 3.33: living surfaces · Drop Builder 3 · Lyrics → Rhythm · Embodiment Lab · Timeline
# Mapped BEFORE building (user rule: map it all first). Axioms: nothing pretends to work; each tool is its own first.
# Status per item: MAPPED → BUILDING → DONE (only when its acceptance passes).

## A. Living surfaces (shared)  — DONE
  UI.alive(view, {events}) in domains/music/ui-music.js: CSS vars on each window from its own sound and events —
  --live (loudness) · --peak (transients) · --tone (brightness → hue shift --acc2) · --flash (event pulse) · --acc.
  music.css: border glow, layered radial light + fine grain texture driven by those vars. Reduced motion → static.
  One layer for every tool — no tool invents its own (nothing repeated).
  acceptance: a sounding Pad Forge sets --live > 0.5 and --tone in 0..1; silent → decays to 0.

## B. Pad Forge — new face  — DONE
  Corner sources as glowing textured stones sized by their live weight · luminous mix-point trail · spectrum strip
  reacting with --tone · all controls kept (vector square drag, corners, orbit, hold, release all, 12 knobs, keys).
  acceptance: every former control still reachable; no page errors; screenshot reviewed.

## C. Dub Station — new face  — DONE
  A sound-system desk: breathing speaker cone (--live), hero BIG KNOB, performance pads SIREN (hold) · HORN · THROW
  (hold) · PULL UP that light on use, spring/echo and skank sections. All params, presets, S/H/T/P keys kept.
  acceptance: as B.

## D. Drop Builder 3 — every part editable, voice-first  — DONE
  The user's line: “you still can't edit the tension … every aspect editable … it's where I put her voice clip.”
  1. VOICE lane on top, big: drop her clip (or Send clip to… → Drop Builder), waveform, ▶ hear, trim start/end,
     gain, low cut, stutter ×, reverb throw, end-on-DROP or free placement by drag.
  2. Every SECTION has its own full editor (click the section; one panel at a time, nothing hidden off-window):
       TENSION  sound (the 2.2 tension voice: 22 params) + its starts-from list + ▶ hear + cue (pattern/DJ/mutes)
       BUILD    riser (level, octaves, wave, curve, noise mix) · snare roll (level, curve, start rate, end rate,
                pitch rise, voice) · filter sweep (from/to) · cue
       PAUSE    length · what sounds in the gap (silence | reverse cymbal | vocal tail | sub swell) · level
       DROP     impact (level, sub boom pitch/length, crash) · downlifter (level, length) · cue · after-drop pattern
  3. Section lengths: drag edges (exists) + numeric fields.
  4. The window scrolls inside itself; the section editor is always fully reachable (fix: the 2.2 tension editor
     could sit below the window edge — the reason it looked “not editable”).
  acceptance: each listed param exists in config, changes the rendered sound it names (test renders), visible in its
  section panel; window content reachable at minSize.

## E. Lyrics → Rhythm (new tool, new layout: tools/voice-and-words/lyric-rhythm)  — DONE
  in: text (lyrics) · transport · note_in (none) · out: note_out (to any instrument) · timeline clip (event)
  1. Syllables: English heuristic splitter (vowel groups, silent e, -le, -ed/-es, contractions, numbers) + stress
     (≈300-word lexicon, content vs function words, punctuation, CAPS/!).
  2. FLOW places syllables on a 16th grid: spoken · on-beat chant · syncopated · rap triplets · dancehall ·
     ballad (half-time). Line break = phrase end (rest). Deterministic per text + settings; Vary seed.
  3. MODES: drums (stressed → kick/snare, unstressed → hat/perc) · melody (contour in the song key: questions rise,
     line ends fall, stress = higher degree) — plays on the transport, sample-accurate.
  4. Send to Timeline as a note clip; Send to Sequencer is P34.
  5. UI: lyrics box · syllable chips on the beat grid (stressed bigger) · playhead · click = accent toggle,
     drag = nudge ±steps · flow · bars · mode · target. Living accents pulse per syllable.
  acceptance: syllable counts/stress on a fixed word list; same text+settings → same grid; ticks fire notes at the
  placed steps to the target; timeline payload accepted by the Timeline.

## F. Embodiment Lab (new tool, new layout: tools/embodiment/embodiment-lab)  — DONE
  A listening and grounding experience — NO medical or therapeutic claims anywhere.
  Drone on irrational ratio sets (φ, √2, √3, π/2, e/2, 2^(1/φ), golden stack) · felt low layer · body pulse
  (heartbeat · throb · chop, free or tempo-locked like the Hanging Tree organ) · breath cycle (in/hold/out/rest, own
  clock or a wired Breath tool) swelling level + brightness · attention cues walking the body (feet → whole) as
  'embody:cue' · Begin/End with long fades · soft ceiling ≤ 0.72 · feelings as presets (Grounded, Held, Heavy Heart,
  Ache, Longing, Wonder, Release, Awake, Safe, Calm Fire, Hanging Tree).
  UI: breathing orb + body silhouette lighting the cued region + cue text; feeling chips first, “deeper” params after.
  acceptance: non-silent after Begin, peak ≤ 0.9, breath period matches settings, cues advance per cycle, every
  feeling renders without clipping, End fades to silence.

## G. Timeline — clicks land where you click  — DONE
  Root cause: hit-testing ignored the canvas zoom (rect is scaled, drawing is not) → offsets grew with x; plus drags
  that lost their pointer stayed stuck. Fix: shared toContent()/mapPoint() mapping by layout size vs live rect;
  drags end on pointerup / pointercancel / lostpointercapture / button-less move. tests/p20-timeline-hit.test.js.
  The mapping now lives in runtime/ui-kit.js (UIKit.toContent / mapPoint) and the Drop Builder uses it too;
  remaining canvas-drawn tools are audited in P34.

## H. Timeline vs Song Recorder — decision (build in P34, not 3.33)
  Yes: in a DAW they are one thing. Plan: ONE “Song” timeline in the bottom dock with lane types —
  notes (today's Timeline lanes + piano roll), audio (today's Song Recorder takes), markers/sections (the Drop
  Builder's TENSION/BUILD/PAUSE/DROP shown as regions you can drag) — one transport, one export, one Save to Songs.
  Migration: Timeline clips → note lanes; Recorder lanes → audio lanes; saved projects converted on open.
  Keeps: piano roll precision, Drop Builder as a section/voice editor that writes into the Song timeline.
