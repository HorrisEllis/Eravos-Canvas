# spec_id: eravos.ui-elements-and-combining · version 0.1.0 · status SPEC (2026-11-26; nothing built)
# his words (2026-11-26, verbatim): "I want to be able to change the ui elements to other styles, types, build components from combining two."
#   · "Expand the tools and engines maybe," · earlier: "No like more dimentions."
# Stands on: component contracts (each variable's UI element: tools/music/components/*/<id>.contract.json "element"), the UI kit
#   (canvas/runtime/ui-kit.js: knob, fader, segmented, toggle, XY, keys, number), Element synthesis ES1 (tools/core/elements/), the Look
#   choices (Settings › Look: theme, buttons, material, font), the assembled engine (tools/core/compat/assemble.js) and the Field board.

## UE — any control shown as another element, any element in another style (the look stays a CHOICE: today's is the default)
  UE1 TYPE: right-click any control › "Show as" → the elements its value allows, from its contract's role and range: a number → knob ·
      fader (vertical / horizontal) · number box · ring · XY (paired with another) · a stepped value → segmented · dropdown · dial with detents;
      a boolean → toggle · button · switch. Kept per tool, per control (on this computer); "As it was" puts it back.
  UE2 STYLE: per element kind, a style beside the theme (Settings › Look › Elements): knob = ring · cap · vintage · minimal · LED arc; fader =
      line · groove · bar; segmented = pills · tabs · LEDs. Shown to him as a sheet first (DESIGN-GUIDE: show first, or add).
  UE3 a tool's whole face re-laid from its elements (ES1's synthesiser) with his element choices — preview beside today's face.

## CB — build a component from combining two (the canvas's way: the DAG, gated)
  CB1 on the Field board: select two component boxes (Ctrl+click) › right-click › "Combine into one part": the two in series or parallel (or
      one modulating the other: an LFO into a filter's cutoff → a "wobble filter" part), as a small DAG of their two contracts.
  CB2 the new part gets a CONTRACT of its own, made from theirs (outer ports, both variable sets, the wire between named), a name ("lfo →
      filter-svf" until he names it), its own UI element card (UE), and passes the gates: it assembles, it plays, it is no twin of a part
      ERAVOS has. Kept as his (Documents\ERAVOS), deletable whole.
  CB3 a combined part appears in every place its outer ports fit (Replace with…, the parts tray, synthesis) — so it is mixed like any part.
  Needs: the composite node in assemble.js (a node that is a DAG) — the same step as ML3a (the engine's VOICE gaining unison and string).

## EX — the engines grow (so "what mixes with what" has more to say)
  EX1 the synthesis engine's places gain: VOICE (osc-va · unison-stack voice · karplus string · wavetable) · MOUTH (+ filter-formant: talking)
      · SPACE (a new place: delay / reverb / ensemble send) · SUB (osc-sub as its own place) — each a tool's character (ToolBlend.CHAR) too.
  EX2 more tools speak the character table (3.230): every built instrument and effect gets its style and what each of its places carries.

## order (proposed): CB1–CB2 with the composite node (it also unlocks EX1) → UE1 (right-click › Show as) → UE2 (styles, shown first) → EX1 → EX2
## open (his): which first — change elements (UE) or combine components (CB)?
