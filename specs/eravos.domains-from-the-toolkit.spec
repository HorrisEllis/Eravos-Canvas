# spec_id: eravos.domains-from-the-toolkit · version 0.1.0 · status MAP (2026-11-25; nothing built) · which domains the canvas can hold next
# his words (2026-11-25, verbatim): "Use this to find domains we can use this canvas for" — with his Innovation Toolkit pasted (his own document:
#   creativity in the gaps, invariants as the skeleton, synthesis ↔ analysis, hostile verification, signal to noise, the weighting formula).
#   The toolkit itself is personal and is NOT copied into the repo; only its working methods and formulas are used here, named as his.
# Method: the toolkit run on the canvas itself — Section 0 (is it a framework problem? yes: a high-leverage choice with many unknowns) →
#   invariants (what the canvas proves in every domain) → the constraint field (what a domain must have to use them) → gaps → candidates
#   → his weighting → hostile verification → order. Scores are the coder's INFERENCE, not measurements (his rule: inference kept apart
#   from tested claims); each says what would test it.

## 1. the invariants — what the canvas already proves, domain-free (built, tested; each a pointer)
  I1 parts with typed contracts, wired (component contracts, the compat graph and its checker: tools/core/compat, build/component-contract.mjs)
  I2 explode → swap → mutate → synthesize, and a GATE that says "it works" and "it is not a twin" (tools/core/field/board.js,
     tools/music/core/assembled-tool.js; the novelty measure). This is his loop in code: synthesis ↔ analysis, hostile verification = the gate.
  I3 one unit shaped in layers over time, modulators on modulators (the Workshop / Field: tools/core/field/field.js, mod-tree)
  I4 everything changes while it runs (axiom 4)
  I5 the surface answers a signal (reactive colours, the Beat colour)
  I6 the document is readable layers (.erv) and evidence is append-only (docs/competence/ — his "ledger")
  I7 what is made is whole and deletable (made tools; the store's isolated zips)
  I8 priority follows what is on the canvas (contracts declare resources)

## 2. the constraint field — a domain uses the canvas fully only when (the boundary; everything else is noise)
  C1 its things break into PARTS with inputs and outputs, so a wire means something (I1)
  C2 a made thing can be RENDERED and MEASURED by a machine — "does it work", "is it new" — or mutation is noise (I2's gate)
  C3 it LIVES IN TIME or changes while it runs, so shaping and live edits matter (I3, I4)
  C4 it gains from crossing into another domain (his cross-domain synthesis; the port types in eravos.domains.map.spec)
  A domain that meets C1 alone is a filing cabinet; C1 + C2 is where mutation and synthesis start to pay.

## 3. the gaps (tension = leverage)
  G1 the gate is audio-only: the novelty fingerprint and "it plays" are music's. Every other domain's mutation would be ungated → noise.
  G2 "connect with people" is the v1 direction (CLAUDE.md, 2026-11-05) and nothing on the canvas is shared between two people yet.
  G3 image, video, agents: one tool built each; ui and dataflow mapped; mind specced (eravos.mind-domain.spec, M0).
  G4 the canvas's mechanisms ARE his framework (explode = deconstruct, gate = hostile verification, synthesis = convergence, the ledger) —
     and no domain lets him run the framework on a problem that is not sound.

## 4. the candidates (Weighting = Urgency × Importance × Fidelity × Slope, his formula; each 1–5, max 625)
  Fidelity = how much of the canvas it reuses as is (evidence: files above). Slope = novelty, just below what breaks.

  0. THE GATE, GENERALISED (a canvas capability, not a domain) — U4 I5 F5 S3 = 300
     A domain hands the canvas render(made) → { works, why, fingerprint }; the canvas keeps the twin / close / novel judgement and the
     reasons card (3.226) for every domain. Unlocks mutation + synthesis everywhere (G1). Test: image's twin refused by the same card.

  1. SYSTEMS — stocks, flows, delays, feedback loops (a model you can hear and shape) — U3 I4 F4 S5 = 240
     parts: stock · flow · rate · delay · feedback · threshold · noise · observer. render: run the model; gate: bounded, not dead, not a twin.
     Why it fits: the assembled engine already runs a graph of stateful nodes per block (tools/core/compat/assemble.js); a feedback loop
     near instability IS a filter near self-oscillation — his "optimal slope just below critical instability" made audible and measurable.
     cross-domain: a model's flows drive any knob (modulation port); sonify a model; his relationships / economics / attention as models.
     weakest assumption: that people want to model, not just play — test: one model (a two-person attention loop) in a session with him.

  2. FRAMEWORK — his toolkit as tools (the problem through the loop) — U3 I5 F4 S3 = 180
     parts: problem frame · invariant ledger (1 gap anomaly, 2 coincidence, 3 an invariant) · gap finder · leverage scorer (Tension × Weight ×
     f(Slope)) · horizontal import (another domain's method) · hostile verifier · somatic check · what-if / if-then · signal filter
     (alignment + fidelity + expansion). render: the scored map; gate: every claim marked tested / inferred / assumed — an untested claim
     cannot be wired in as an invariant (his Section 10 as a law, as the mind domain's no-demand law).
     cross-domain: a gap node opens a sound, an image, a model (C4); the competence register's append-only rule reused for the ledger.
     weakest assumption: that a formula's number helps more than it distracts — test: he scores one real decision both ways.

  3. CONNECTION — two people on one canvas (the v1 direction) — U4 I5 F2 S4 = 160
     parts: presence · a feeling set by its owner · a shared piece (a song, a board) · repair log · an indirect channel (low pressure).
     render: what both see; gate: CONSENT — nothing about a person is inferred or shown that they did not set themselves.
     Fidelity 2: no networking in the repo yet (his earlier p2p / WebRTC work is outside it). Feelings (tools/music/tools/embodiment/feelings)
     already turns a feeling into sound: two people's feelings → one song is the first bridge.
     weakest assumption: peer-to-peer through home networks without a relay — test: a two-machine connection before any UI.

  4. MIND — Open Loops + the ADHD Toolbox (already specced: eravos.mind-domain.spec) — U4 I4 F4 S2 = 128
     Shares a type table with FRAMEWORK (thought, loop, tension, invariant): build the types once, two domains on them.

  5. WORDS — lines, meter, rhyme, vocal rhythm — U3 I3 F4 S3 = 108
     parts: line · meter · rhyme set · syllable rhythm (lyric-rhythm exists) · voice. gate: measurable (syllables, stress, rhyme, distance).
     cross-domain: words → vocal chops → the dubstep tools (his baseline record, technique only).

  6. GENERATIVE PICTURES — the paintings, shaders, patterns — U2 I3 F5 S3 = 90
     The painter (tools/core/art/painter.js) is already parts + seed + accent; image fingerprints are cheap (histogram, structure). First
     domain to prove the generalised gate (0) outside sound.

  7. PLAY — game mechanics (rules, loops, economies) — U2 I3 F3 S4 = 72 · render = simulate a round; gate = balanced, not degenerate.
  8. BODY — breath, feelings, embodiment (tools exist under music/embodiment) — folded into MIND and CONNECTION, not its own domain.

## 5. hostile verification (what would break each — his Section 10)
  - every non-music domain without (0) mutates into noise → (0) first, or the domain ships without ⚄ / ◆.
  - CONNECTION and FRAMEWORK touch people: a tool that profiles another person ("map their baseline") without their consent fails the gate
    by construction; only what a person sets about themselves is shown.
  - SYSTEMS could become a toy (numbers that mean nothing): every stock carries a unit, a model shows its assumptions as parts.
  - numbers above are the coder's inference; his ear / body decides (Section 11) — the order below is a proposal.

## 6. the order (proposed; Priority = (Efficiency + Effectiveness) / Urgency in his words — most problems, least action, first)
  D0 the gate generalised (0) → proven on GENERATIVE PICTURES (6), the cheapest second domain
  D1 the shared type table for MIND + FRAMEWORK (one build, two domains) → FRAMEWORK's ledger + gap finder + leverage scorer (preview first)
  D2 SYSTEMS: stock / flow / feedback on the assembled engine; one model he names, heard
  D3 CONNECTION: the two-machine link proven headless, then presence + feelings → one shared song (preview first)
  D4 WORDS beside the dubstep tools
  Each: spec with a DAG first (axiom 8), UI shown first, the boundary test unchanged (the canvas names no domain).

## open (his)
  - which first: D0 → pictures, or straight to FRAMEWORK / SYSTEMS / CONNECTION?
  - the names (FRAMEWORK, SYSTEMS, CONNECTION are the coder's placeholders; "mind" is still a placeholder too)
  - may the toolkit's method names (gap, invariant, slope, hostile verification) be the tools' names on screen?
