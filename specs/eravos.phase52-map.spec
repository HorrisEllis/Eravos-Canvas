# eravos.phase52-map.spec — 3.52: his song first; suites as pages; tool page first; copy/paste; a simpler timeline; full range
#   (mapped BEFORE building · 2026-10-22 · 3.50 Pitch and 3.51 Deep bass came in from his uncommitted zip, commit e0e59ff)

## His words (2026-10-22, verbatim)
  On the brainstorm: "the canvas as the app. looking glass as the engine. its already a bunch of apps using compartents?" then, to the
  coder's lean (the canvas is one app-layer, with the tools as compartments inside it): "I agree."
  With two screenshots of the suite window, his song file For_Her_Festival_1203.eravos.json and the zip:
  "here's a uncommited version. i hate this thing. remove it. each suite needs a page like the rest of the tools. udated icons for wubs.
  have the tool page be the default with a button under it that says add to canvas for a quick add t canvas. need to be able to copy
  and paste the same tool with the same preset. i need the timeline to be simpler, also maybe copy and paste the timeline notes. thats
  my best song for raven so far. the pad (yellow) is to high pitched though, and I need more control. I love the arp, need more bass, or
  like fire make it bun dem, at around 45 seconds, look everywhere, the presets for bun dem sound aweful same with odd couples. Look at
  all bass, wobble, all tools like I want to have full control over the entire dynamic range. also make sure it's crstal clear. also the"
  (the sentence ends there) "... more mods. i need this song badly, and the ability badly."

## Decision recorded (his)
  D-52.0 Looking Glass is the engine, and the ERAVOS canvas is the app on it: one app-layer, its tools compartments inside it (the COS
         tree). The engine never knows what a tool is. ("I agree", 2026-10-22, to the coder's lean.) This sets A3–A5 of the 10-22
         brainstorm map. Nothing is built from it yet.

## What his song file shows (read 2026-10-22: For Her · Festival #1203, 127 BPM, C♯ minor, 83 bars, 14 tools)
  - The yellow Pad lane plays three-note chords C♯4–E5 (MIDI 61–76) into Reese Bass, which is mono and legato and sounds an octave
    under the written note. It plays one note of each chord, thin and high: "the pad (yellow) is to high pitched".
  - The Bass lane plays C♯1–A1 (MIDI 25–33) into Supersaw, a bright 9-voice lead at cutoff 7 kHz. There is no bass under the song:
    "need more bass".
  - 45 s at 127 BPM is bar 24.8: the pause (bar 25) before the drop (bar 26, 49 s). "make it bun dem, at around 45 seconds" = the drop.
  - Nothing plays Wobble Bass, Wub Osc, Wub Sub, Deep Sub or one of the Retro Polys (no lane, no wire). The Lead lane (C♯5–A6) goes
    to Retro Poly. Pattern 1 drives the Drum Machine.
  - Not found in the file: an arp (every arp is off; no Arp tool). "I love the arp" is most likely the Lead's fast line or the
    pattern. To confirm with him. Until then, everything except the Pad and Bass lanes is kept exactly as it is.

## Phases                                                                                              status
  P52.1 HIS SONG: a corrected copy, measured (his file is never overwritten; the copy is "For Her · Festival #1203 (bun dem)")
        Pad → Pad Forge playing the same chords an octave lower (the chords themselves are his and unchanged). Bass → Wobble Bass
        with Wub Sub under it, playing his bass notes, quiet before the drop and bun dem from bar 26 (the "drop" marker) to the
        break, again at "drop 2" (bar 59). Everything else untouched. Proof: an offline render of each section, measured against
        the original (pad register, low-end energy under 100 Hz, peak and loudness at the master: clear, no clipping).
  P52.2 BUN DEM AND ODD COUPLES PRESETS: every Bun Dem and Odd Couples preset of the bass tools is rendered and measured: clipping,
        harshness (energy above 6 kHz against the body), aliasing, level. The ones that measure badly are rebuilt, and a test now
        guards them. "crstal clear" = no clipping, no aliasing fizz, a clean sub. Each measured number is written next to the preset.
  P52.3 SUITES AS PAGES: the suite window (eravos.suite-hub) is removed, and he says why: "i hate this thing". Each suite gets a page
        like a tool's (canvas/runtime/tool-page.js): its parts, scenes, wiring, "Load the whole system" and macros. The parts are
        added straight to the canvas, wired to each other. Saved songs that contain a suite window open with it dropped and say so
        (§1.2).
  P52.4 THE TOOL PAGE FIRST: in ＋ Add, choosing a tool opens its page, with "Add to canvas" right under the title for a quick add.
  P52.5 COPY AND PASTE A TOOL: Ctrl+C / Ctrl+V (and Duplicate in the window's menu) copies a window with all its settings, mods and
        preset. It lands offset, unwired, as a new instance. Undoable.
  P52.6 THE TIMELINE: copy and paste notes and clips (between lanes too), then "simpler": to be mapped with him (which parts of the
        timeline get in his way).
  P52.7 WUB ICONS: new drawn icons for Wub Osc, Wub Filter, Wub Rate and Wub Sub.
  P52.8 FULL RANGE AND MORE MODS: "full control over the entire dynamic range" (the coder's reading: every knob reaches its useful
        extremes, plus a clean gain range on every bass tool). Unmerged branch claude/modest-dijkstra-sqa0gg already widened 74
        controls across 23 tools ("every tool reaches further"). It is ported here, not merged, because that branch also rebuilds EDM
        Lab differently. "more mods": more tools offered in the mod slots, and a mod slot on every bass tool. To confirm the reading.
  Order: P52.1 → P52.2 → P52.3 → P52.4 → P52.5 → P52.7 → P52.8 → P52.6 (after he names what to simplify).

## ADDENDUM 2026-10-22 (later) — his words while P52.1 was being built
  "taking forever. also like the static tools need to be rebuilt as adjustable. nothing static. timeline is a challenge to use, maybe
  have full adjustable notes in the timeline? What about curvature? like bending notes, drawing."
  - "taking forever": the song copy was sent the moment it measured clean (no clipping, pad an octave down, sub under the drops)
    rather than tuned further. The Wobble's loudness in the drops is left for his ear: the coder cannot judge it from numbers.
  - P52.9 NOTHING STATIC (was P49.6, now his order): every static tool rebuilt as adjustable. P49.1 already lets any knob be moved;
    what stays static is the tools' fixed internals (fixed voicings, fixed curves, fixed note patterns, hard-coded levels). Per tool,
    read first: Gothic Organ, Dub Station, Coven, Retro Poly, Destroyer.
  - P52.6 THE TIMELINE, reshaped by his words: "full adjustable notes" (every note's start, length, pitch, velocity and more, by hand
    on the note itself), and CURVATURE: notes that bend (pitch bends drawn as curves between and within notes), drawn freehand. The
    piano roll (P48.1) has exact placement and a velocity lane, but no per-note pitch curve. The engines take note:trigger with a
    single pitch, so a bend needs a pitch-curve event that the instruments follow (Wobble Bass, Reese and Wub Osc already glide).
    Mapped before building, with him: what "simpler" means to him, against what the piano roll has today.
  P52.1 status: song copy sent (2026-10-22): For_Her_Festival_1203_bun_dem.eravos.json. Measured bars 17–34 against his original:
    peak 0 dB → −1.5 (clipping gone); pad Reese at −9 dB, the loudest thing → Pad Forge at −17 dB, an octave down; drop under 100 Hz:
    40% → 43%, now Wub Sub (−15 dB, centre 44 Hz) instead of Supersaw. Wobble's Bun Dem lane is quiet (−32 dB alone; its notes are
    short 1/16 hits), so it is his to turn up (Level, Depth) or lengthen. Pad Forge gained Octave and Pitch for this (tests 10/10).
