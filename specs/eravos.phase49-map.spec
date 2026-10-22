# eravos.phase49-map.spec — 3.49: any knob moves · every tool grows · large tools become parts
#   (mapped BEFORE building · 2026-10-22 · the phases left open in eravos.phase48-map are re-phased here; that map is kept, §0.3)

## His words (2026-10-22, verbatim)
  "Motion core: any knob can be moved by an LFO or envelope. Windows that grow (keyboards up to 88 keys) not just paino. each
  ;arge tool rebuilt as parts if it can be used by another suite or tool"
  Context: the coder had just listed the 3.48 phases. Two were his from 10-19 and still open: P48.2 Motion core and P48.7, the
  growth he asked for on 10-21 ("anything else that can be expanded per tool"), which was built only for keyboards. He also
  had his decomposition rule from 10-21 ("anything form a tool that other tools can use need to be decomposed, and grouped by
  the tool suite").

## What the code shows (read 2026-10-22, not guessed)
  K1 A knob moves from outside only where its tool built a mod input (ctx.modBus): Destroyer 3 of 13 settings, Retro Poly 2 of 31,
     Gothic Organ 1 of 27, Dub Station 2 of 21 (eravos.motion.spec F1). The LFO, Envelope, Wub Rate, XY Pad and Macro tools exist,
     and all send to those inputs only.
  K2 The Envelope already plays on the notes of the tools it is wired into (syn-env "follow"). An LFO follows the tempo.
  K3 Params have one value (organism-sdk.js params). Any change is saved, echoed to the window and undoable (ui:config_change).
     There is no value that moves without being saved.
  K4 Growth: keyboards grow (P48.7). Spectrum and scope displays follow their size. The piano roll observes resizes. Nothing else
     shows more of its range when its window is bigger. Not yet measured tool by tool, so P49.3 measures it.
  K5 Size, from specs/eravos.decomposition.spec (knobs, then the jobs another tool also does): Drop Builder 61 · Wobble Bass 39
     (motion, filter, envelope: Wub Lab already has them as parts) · Gothic Organ 35 (drawbars, motion, envelope, rotary, space) ·
     Bass Forge 32 (FM, envelope, filter, LFO, pitch) · Retro Poly 31 (envelope, arpeggiator) · Embodiment Lab 26 · Reese Bass 21 ·
     Granular 21 · Xen Synth 21 · Pad Forge 20 · Dub Station 19 · Supersaw 18 (filter, envelope, chords) … The audit reads group
     names, so it misses logic without knobs and misreads some names (Destroyer's SHAPER is not an envelope). Each tool's phase
     starts by reading its engine.

## The coder's reading (to confirm where marked)
  R1 "any knob can be moved by an LFO or envelope": every knob of every tool can take a wire from the LFO, Envelope, Wub Rate, XY
     Pad or Macro tool, the same parts as today. Right-click any knob → "Move with: LFO · Envelope · Wub Rate …" opens that tool
     beside the window, wired to that knob. Or pick one that is already on the canvas. The knob shows where it is now; the saved
     value stays the knob's own.
     This changes eravos.motion.spec M1 (10-19). M1 designed motion inside each knob, with a motion engine of its own. R1 uses the
     LFO and Envelope tools instead. Reasons: they exist (§8.6 reuse before build), and his parts rule says what other tools can use
     is a part. M1 is kept and superseded by an addendum there. To confirm: if he wanted the motion inside the knob without a
     window, that is M1's design and can come back.
  R2 "Windows that grow ... not just paino": every tool shows more of its range when its window is bigger. More steps, pads,
     channels, lanes, bars, octaves, harmonics: whatever that tool has a range of, not stretched pixels.
  R3 "each large tool rebuilt as parts if it can be used by another suite or tool": one tool at a time, largest and most shared
     first. The pieces another tool can use become part tools (or are the existing tool that already does the job). The large tool
     becomes a suite of them, kept as "all-in-one" until he says otherwise, as EDM Lab was (D-48.10).

## Phases                                                                                               status
  P49.1 MOTION CORE: any knob takes an LFO or Envelope                                                  built (2026-10-22)
        depends_on: [P48.8]
        files: canvas/runtime/organism-sdk.js (params.live) · canvas/runtime/organism-factory.js (view.onLive) ·
               canvas/runtime/ui-kit.js (paramControl: the knob's live dot, UIKit.knobMenu hook) ·
               tools/music/core/sdk-music.js (knob inputs) · tools/music/core/ui-music.js (the "Move with" menu) ·
               tests/p49-motion.test.js
        - params.live(key, v | null): the value the engine hears now. get() returns it and onChange runs, but it is not saved,
          not undoable and not echoed as a setting. null hands the knob back to its own value. The window hears 'param_live'.
        - knob inputs: at define time, every number, integer, enum and boolean setting that has no mod input of its own gets one.
          Hook knob.<key> (modulation in, off the dot rail: the menu wires it). It is skipped for hidden or settings-only
          settings, motion: false, and files, samples and texts. Port mod.knob.<key> has range −1…1. The sdk samples it about
          60× a second, only while something is wired in: live = own value + signal × half the knob's range, clamped. Enums
          and booleans step. Knobs that already have a mod input keep their audio-rate path, unchanged.
        - the menu: right-click a knob (or long-press) → Move with LFO / Envelope / Wub Rate / XY Pad (opens it beside the
          window, wired) · any modulator already on the canvas · Stop moving (removes the wire). All undoable actions.
        built: also canvas.move / canvas.unmove on ERAVOS Glass (an agent has the menu). Proof: tests/p49-motion.test.js 5
        (live audio clock: Wub Sub's Low-pass moves 150 ± 80+ Hz under an LFO while saved stays 150 and no setting is sent;
        its wave steps sine/triangle/warm; an Envelope moves it on a note; the menu adds and stops an LFO) · host 17 · full suite
        1047/1047. Found while building: (1) inside a running tool, ctx.descriptor is the registry's copy, which carries hooks but
        not define-time extras, so no knob port opened, and a catch that returned hid it (§1.2). Now read from the hooks, and a
        failure is a fault. (2) Comments in canvas/ that named "LFO" broke the domain-free boundary; reworded as "a mover".
        acceptance: an LFO wired to a knob with no mod input of its own moves what the tool does, while its saved value and the
        undo history stay as they were; unwired, the knob is its own value again; the Envelope moves a knob on each note of
        the tool; the audio-rate knobs are unchanged; every tool's knob inputs exist and no hook id collides.
  P49.2 GLIDE AND MORPH (eravos.motion.spec M4)                                                          mapped
        depends_on: [P49.1]
        every knob change ramps; a preset can morph over 0–8 bars; A/B on a crossfader
  P49.3 EVERY TOOL GROWS (R2)                                                                            mapped
        depends_on: [P48.7]
        files: build/grow-audit.mjs → specs/eravos.growth.spec (generated), then one phase per tool it names
        Measured, not guessed. Clear Glass's driver opens each tool at 520 and 1400 px wide and counts what it shows (keys,
        steps, pads, channels, lanes, bars). Same count and the tool has a range → a candidate. Each candidate gets its own phase
        (P49.3.<tool>), and shares a primitive where several need the same one (the keyboard's rule: its own range is the floor,
        grow in whole units around its centre).
        Candidates seen while reading (to be measured): sequencer and wub-rate steps · Pads banks (4 × 16 shown at once) ·
        mixer channels · Groove's bars · drop-builder lanes · harmonic analyzer range · xen and lattice keyboards.
  P49.4 LARGE TOOLS AS PARTS (R3), one tool per phase, each in the order: read its engine → its own map entry (each inner piece:
        an existing tool, a new part, or stays) → the new parts → its suite → the old tool kept as "all-in-one"
        depends_on: [P48.10, P49.1]   (motion first: once every knob is an input, the parts need no extra mod buses)
        P49.4a ARPEGGIATOR: the one gap with no tool, inside Retro Poly and Ratio Lattice. An Arp part (notes in → notes out,
               as Chords and Bassline are)                                                                  mapped
        P49.4b WOBBLE BASS → Wub Lab: its parts already exist (wub-osc, wub-filter, wub-rate, wub-sub). Only the link is
               missing: Wobble Bass is named "all-in-one" and pointed at the suite. No new code.                mapped
        P49.4c GOTHIC ORGAN: drawbars (an organ voice part), Rotary (a new effect any tool can use), its space (FX Haunt
               if it does the job), its breath motion (an LFO)                                               mapped
        P49.4d BASS FORGE: FM voice, shape, filter, LFO, pitch, most of them existing parts                    mapped
        P49.4e RETRO POLY: the voice, its envelope (Envelope), the Arp from P49.4a, chorus                      mapped
        P49.4f DROP BUILDER (61 knobs): build, riser, pause, impact, her voice, read first: the audit sees no shared job
               by name                                                                                       mapped
        P49.4g DUB STATION: echo (Tape Echo?), spring, siren, skank (read first)                               mapped
        P49.4h the rest by size: Reese Bass, Supersaw (its chord job → Chords), Pad Forge, Granular, Xen Synth, Coven …
                                                                                                             mapped
  P49.5 MACROS + PERFORM PAD for every tool (motion M2, M3: was P48.3)                                    mapped
        depends_on: [P49.1]
  P49.6 THE STATIC TOOLS' motion (was P48.4). Now mostly done by P49.1: their "new buses" are knob inputs. What stays is
        each tool's own macros and pad (motion M5).                                                    mapped
        depends_on: [P49.5]
  Order: P49.1 → P49.3 audit → P49.4a → P49.4b → P49.2 → the rest of P49.3 and P49.4 one tool at a time → P49.5 → P49.6.
  Why: motion first, because every later part leans on it. The growth audit is cheap (the driver does the work) and tells the rest
  of P49.3 what to build. The arpeggiator is the only gap that blocks two tools. Wobble Bass costs nothing.

## decisions (decided by his axioms; his to overturn)
  D-49.1  Motion sources are the existing part tools, and every knob gets an input (R1). §8.6 reuse before build, and his parts rule
          (2026-10-21). eravos.motion.spec M1's inline motion engine is superseded and kept (§0.3); to confirm with him.
  D-49.2  A moving value is live, never saved (params.live). §0.0 truth: the saved project is what he set, not where an LFO
          happened to be. REVERSIBILITY: unwire it and the knob is exactly his again.
  D-49.3  The control-rate path samples at about 60 Hz, only while wired. That is enough for any knob that is not already
          audio-rate, and it costs nothing when nothing is wired (§leverage: fewest resources for the most power).
  D-49.4  Growth is measured by the driver before it is built (P49.3), because §0.1 is evidence over memory.
