# spec_id: eravos.wobble-builder · version 0.1.0 · status new · template eravos.tool/1
# His words (2026-11-20): "merge and push. I want to make like a wobble synthsize tool." — asked which: "A wobble builder" (a tool that synthesizes
# NEW wobble instruments: pick its parts, wire them, mutate, and it assembles into a full playable tool you can save and use like any other).
# Before it: "it needs to synthesize into a full tool. not just mutate endlessly" · "should also learn from each discard right?" · "null render used
# for creating friction, and repitition. so tools dont just replicate over and over, also regression gate" (2026-11-17, specs/eravos.compat-graph.spec).
# Map and spec first (axiom 8); its UI shown to him before it is built (CLAUDE.md › Next) — docs/previews/wobble-builder/.
identity:
  id: eravos.wobble-builder ; label: Wobble Builder ; domain: music ; family: bass / wobble ; kind: a tool that makes tools
  what: a wobble instrument as a chain of SLOTS, each filled by a shared component; the wobble (an LFO) wired into the filter's detune; swap any
    slot on the spot, mutate, keep or throw; SYNTHESIZE → a real tool (its own tool.json, its DAG, its presets) in Documents\ERAVOS\tools that
    opens on the canvas like any other — and explodes, mutates and swaps like any other (FieldMutate, the Field board).
  not: Wobble Bass (one hand-made engine, its own parts); not the Mutation Lab preview (any voice, offline). The builder is wobble-shaped: its
    slots are the parts a wobble is made of, its controls are the ones a wobble needs on the face (rate on the beat, depth, the mouth).
assembles (components, tools/music/components/<id>/ — never re-implemented here; each runs through its adapter, tools/music/compat/adapters.js):
  osc-va · osc-sub · lfo · filter-svf · filter-ladder · saturator-tube · saturator-tape · bitcrusher · delay-line · stereo-tools · env-adsr
slots (what each slot takes):
  SOURCE  osc-va (saw · square · triangle · sine · pulse) · osc-wavetable (when its adapter lands) · + osc-sub (a clean layer under it)
  DRIVE   none · saturator-tube · saturator-tape · bitcrusher
  MOUTH   filter-svf (lowpass / bandpass / notch / peak …, 12–36 dB) · filter-ladder (lp24 … hp24, drive in its loop) · filter-formant (vowels; adapter to write)
  WOBBLE  lfo → the MOUTH's detune (new 2026-11-20: filter-svf / filter-ladder detune in-port, control, cents; the edge's amount = Depth)
  FX      none · delay-line · saturator-tape · bitcrusher
  OUT     stereo-tools (width, mono below)
  the note: its pitch into SOURCE (and the sub), its gate restarts the wobble (lfo adapter: reset on the gate rising) and opens env-adsr (amp)
signal_dag (the default tool it opens with — "Classic Wobble"):
  note.pitch → osc-va(saw) ─┐
  note.pitch → osc-sub(−1 oct, sine) ──────────────────────────────┐ (clean, never through the drive or the mouth)
                            └→ DRIVE(saturator-tube) → MOUTH(filter-svf lp 24, 300 Hz, reso 0.5) → FX(none) → mix ← sub → env-adsr(amp) → OUT(stereo-tools) → out
  lfo(1/8 at the tempo, sine) ──(amount = Depth, cents)──→ MOUTH.detune
ports (as a tool on the canvas):
  in   note_in (play it) · midi_in · transport_in (the wobble on the beat)
  out  audio_out (stereo) · mod: wobble (the LFO, −1…1: wire it into anything)
  in   mod: every face control (Rate, Depth, Cutoff, Reso, Drive, Sub, Level)
face (what a wobble needs, the rest per slot):
  RATE  1/1 1/2 1/4 1/4t 1/8 1/8t 1/16 1/16t 1/32 (the beat) · free Hz with Sync off · Shape (the LFO's shapes)
  DEPTH (octaves the mouth moves) · CUTOFF · RESO · DRIVE · SUB · GLIDE · LEVEL
  the CHAIN: each slot a gate (the Field board's look: dashed frame, label, ⇄ swap, its component's own controls), wired left → right; the
    wobble a wire from the LFO gate into the MOUTH gate (its thickness = Depth)
  ⚄ MUTATE · ✓ KEEP · ✗ THROW (FieldMutate: swaps slots, nudges settings, learns, never repeats) · ◆ SYNTHESIZE INTO A TOOL · the keys
decisions:
  D1 slots, not a free graph: a wobble is a chain; the builder offers what fits each slot (the compat graph: a component that covers the slot's
     ports). A free graph is the Mutation Lab's (later, his call).
  D2 every change is heard at once (a note on edit, his "hear each edit" from the Lab) — live through one generated worklet (below).
  D3 one engine: the DAG compiled into ONE AudioWorklet from the components' kernel text + adapters + assemble (the same code that renders
     offline renders live: what is tested is what plays). A slot swap = a new worklet built and cross-faded (no click).
  D4 SYNTHESIZE writes a tool: tool.json (id eravos.wb-<name>, its components announced from its DAG), its spec with the DAG (axiom 8), its
     presets pack, its engine = the builder's engine reading its DAG (no copied code: every made tool stands on the same builder engine + its
     DAG as data). Saved in Documents\ERAVOS\tools\<name>\ (the store's place, S3); the desktop serves it; the browser keeps it on this device.
  D5 friction against repetition (his 2026-11-17): before SYNTHESIZE, the made tool's presets are fingerprinted (build/novelty-core) against
     every tool in ERAVOS and every tool made before — TWIN is refused (not saved: "this is <tool> again"), CLOSE is said, novel is offered.
     A regression gate: a made tool's presets render (finite, not silent, never over full scale) or it is not saved.
  D6 guards: Level, the tempo and the key never mutate (the music guard); a part that does not build is never offered (D4 of the compat graph).
open gaps (to build, in this order, after his yes on the UI):
  WB1 the live engine: assemble's text in a worklet (one per made tool), parts swapped by rebuilding it; the null render: a DAG rendered offline
      and live, ≤ −60 dB apart.
  WB2 the builder window (the approved face), its slots, the chain board, mutate / keep / throw.
  WB3 SYNTHESIZE: tool.json + spec + pack written, loaded on the canvas at once, listed under Bass › Made by you; novelty + regression gates.
  WB4 adapters still missing for the slot lists: osc-wavetable, filter-formant, unison-stack (voices), env-msseg (drawn wobble), step-mod (wub seq).
acceptance:
  - the tool contract (TH.toolContract) for the builder and for a made tool: spawns clean · presets load in range · save → load exact · close clean
  - live = offline: a made tool's DAG rendered both ways, ≤ −60 dB apart (the null render)
  - every slot swap heard within a block, no click (no step over −40 dB at the swap)
  - SYNTHESIZE refuses a TWIN, saves a novel one, and the saved tool opens on the canvas, plays, explodes and mutates
  - design check clean (a new tool)

# ---- dependencies (2026-11-20): filter-svf 1.0 + filter-ladder 1.0 contracts gained the detune in-port; the lfo adapter (reset on the gate);
#      assemble edges carry an amount. node tests/compat.test.mjs 38 checks; tests/wobble-builder.test.mjs (the Classic Wobble assembled: its
#      brightness moves at the LFO's rate).

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 11 it stands on · 11 of 11 built (✓)
  layer 0: bitcrusher ✓ · delay-line ✓ · env-adsr ✓ · filter-ladder ✓ · filter-svf ✓ · lfo ✓ · osc-sub ✓ · osc-va ✓ · saturator-tape ✓ · saturator-tube ✓ · stereo-tools ✓
  tool: eravos.wobble-builder ← filter-svf + filter-ladder + saturator-tape + saturator-tube + bitcrusher + delay-line + osc-va + osc-sub + env-adsr + stereo-tools + lfo
  build order: bitcrusher ✓ → delay-line ✓ → env-adsr ✓ → filter-ladder ✓ → filter-svf ✓ → lfo ✓ → osc-sub ✓ → osc-va ✓ → saturator-tape ✓ → saturator-tube ✓ → stereo-tools ✓ → wobble-builder
  shared with: bitcrusher 5 · delay-line 17 · env-adsr 22 · filter-ladder 5 · filter-svf 42 · lfo 30 · osc-sub 11 · osc-va 27 · saturator-tape 6 · saturator-tube 5 · stereo-tools 19  (other tools on each)
  in it now: filter-svf · filter-ladder · saturator-tape · saturator-tube · bitcrusher · delay-line · osc-va · osc-sub · env-adsr · stereo-tools · lfo
  comes out of it: —
  planned: —
  signal_dag check: every node is one of its components ✓
  signal_dag check: components with no place in the flow yet: filter-ladder, saturator-tape, bitcrusher, delay-line

# ---- ADDENDUM 2026-11-21 — the Wobble Builder removed; its engine is what SYNTHESIZING tools together makes. His words: (to "If you meant the Wobble
#      Builder, say so and I'll hide it") "Don't hide it. What is it? And yes. I didn't ask for it." · "That's redundant." · "Do it. Then remove that
#      tool. Dont hide it." (this spec moved here from tools/music/tools/bass/wobble-builder/wobble-builder.spec; everything above kept verbatim)
removed: the tool eravos.wobble-builder (its window, packs, presets, its in-page tests) — not hidden: deleted (git history keeps it).
kept, as tools/music/core/assembled-tool.js → window.AssembledTool: the model (settings → DAG), Voice (offline = live), the one AudioWorklet
  ('eravos-assembled'), the regression + novelty gates, made tools (eravos.wb-<name>, kept by tools/music/data/made-tools.js, defined at start)
  with a plain kit face (their parts as cards), now also running ensemble-core (the Juno chorus), osc-noise and env-adsr into the mouth.
SYNTHESIZE TOGETHER, on the canvas (tools/core/field/board.js, domain-free): each blown-up tool's core carries a ◆ tile; drag it onto another
  blown-up tool's core → exchange.synthesize (AssembledTool.synthesize): each part from the tool it is most itself in (tools/music/data/
  tool-blend.js — Retro DCO's voice, mouth, chorus; Wobble Bass's wobble and drive), the gates (plays cleanly; a twin refused), named "<A> × <B>",
  spawned beside them and opened blown up — its parts as tiles you drag like any tool's (tools/music/data/part-exchange.js knows its parts).
proof: P203 2/2 (the drag, the parts, blown up, a twin refused) · P202 8/8 on a synthesized tool (live = offline, knob live, swap live, make + twin)
  · tests/assembled-tool.test.mjs 32.

ADDENDUM 2026-11-24 (the original above kept verbatim)
His words (verbatim; specs/eravos.2026-11-24-session.map.spec 7–9): "i want to be able to mutate the tools, synthesize two or more cores, and
  make something completely new. like my goal is to add the capability to create a mix of the retro dcs and the wobble bass to make the retro
  wobble or something." · "eravos makes it, not you. only add capability. always capability first." · "like this is meant to be dynamic and
  fluid. also tools are isolated so if they cause instability they can be deleted."
BUILT 3.216: component boxes framed whole; the hover card (tools/music/data/part-words.js, PartExchange.explain); right-click › REPLACE WITH.
BUILT 3.217: a selected box is taken by what it is (ToolBlend.slotOfPiece — the oscillators are the VOICE); right-click a selection →
  "◆ … the rest from <tool>" (synthesizeParts(list, { restFrom })); Model.render. P217: the test only picks; ERAVOS makes it.
Phases (ML — the Mutation Lab, the Workbench, the Tool Builder; one engine, this one):
  - ML1 more tools trade parts: part-exchange.js + tool-blend.js profiles for Supersaw, Swarm Oscillator, Retro Poly, Piano, Tape Memory
    (those sharing the most components first); words for every component they hold (part-words.js).
  - ML2 two or more CORES at once: drag several cores together / select several whole tools → one made tool (each slot from the tool picked
    for it, the rest as he says).
  - ML3 more slots in the engine (unison, the sub, envelopes, the formant mouth, the wub sequence …) so fewer picked parts are "left behind".
  - ML4 THE MUTATION LAB: a shelf of every component and every core, drag onto a board, combine, mutate — spec + preview first.
  - ML5 THE WORKBENCH / TOOL BUILDER: an empty board, parts from the shelf, then the face — which UI element each control is (knob, fader,
    XY, keys, segmented …) and its theme — saved as a tool of its own (isolated: delete it whole). Spec + preview first.
  - ML6 the made tool as its own zip (the store's isolated tool, specs/eravos.store.spec) so a misbehaving one is deleted whole.
Tracked: docs/TODO-LEDGER.md T-25 … T-30.

ADDENDUM 2026-11-25 (the originals above kept verbatim)
His words (verbatim; specs/eravos.2026-11-24-session.map.spec 32): "tools when the can't synthesize, need to flash the reasons why. also expand
  the ability. its hard to tell what it will do when i synthesize. like the wobble and the retro could sound amazing. or the reese and the piano,
  or what about making the next highest leverage components and tools. like also the retro poly. also the packs, for each tool, have like lofi,
  dubstep, synthwave, edm, dubstep, i want to make music that sounds like make it bun dem by skrillex, thats my baseline of reverse engineering.
  like i want the dubstep tools, synthwave tools, like look deeply into trenke by skrillex, like continue making eravos huge. synthesis and
  mutation and the unqiue sounds and opening them in the lab"
BUILT 3.226 — WHAT IT WILL MAKE, AND WHY NOT:
  - One plan (AssembledTool.planParts / planPair): each of the engine's five places (VOICE · WOBBLE · MOUTH · DRIVE · FX), the tool and the part
    it comes from, what it is in words (from the made tool's settings), what is not taken, what stays behind (ToolBlend.behind).
  - ◇ What will it make? (right-click a selection): the plan + the gates run dry (nothing kept) → "new to ERAVOS" / "close to …", ▶ Hear it (the
    gates' own riff, rendered offline, played through the mix), ◆ Make it. Carrying one core over another shows its plan while it is over it.
  - Refused: every gate answers with a reason as data — { kind (twin · clips · silent · nan · build · none · load), title, why, steps, blame:
    [{ inst, piece? }], actions: [{ label, hint, opts | run }] }. The board (domain-free) flashes the blamed boxes / cores red three times and
    keeps a red ring while the card is up; the card sits beside them; its buttons do the fix: opts (flip · restFrom · override { slot: inst } ·
    tweak quieter / open / tame — applied to the made tool's settings only, never to a tool) or run (rest-from · slot-from · select-fit ·
    mutate-then-retry); ↻ Try again; ✕ / Esc closes. A twin made only from one tool says so and offers that tool's VOICE / MOUTH from another.
  - The ＋ Add catalog has no Modes page (domains are picked on Start, 3.220–3.225); it opens on All tools.
  proof: tests/p226-synthesis-why.test.js 2/2 (preview makes nothing; twin refused, blamed parts ringed, card beside them, fixed from the card;
    no-place parts named and the fitting ones picked; a tweak changes what is measured, never the tool; two-tool plan). P196–P218 green.
NEXT (specced, in this order — each shown first where it is seen):
  - ML3a THE VOICE GROWS: the engine's VOICE becomes a socket — osc-va (today) · unison (osc-va played per voice by unison-stack's layout: Reese
    Bass, Supersaw) · string (karplus-string excited per note: the Piano's strings). Adapters only call the components' kernels; a composite
    node (a logic component laying out a source) is a new kind for assemble.js — specced in specs/eravos.compat-graph.spec first. Profiles: Reese
    Bass (voice = unison, its detune / voices; its sub), Piano (voice = string, bright / stretch / decay), Supersaw's unison no longer left behind.
    Then Wobble × Retro and Reese × Piano carry both tools' voices. Null render: today's made tools unchanged (osc-va stays the default).
  - ML3b Retro Poly whole: poly voices (voice-allocator), PWM, its unison — the places it leaves behind today.
  - GP GENRE PACKS FOR EVERY TOOL: Lofi · Dubstep · Synthwave · EDM, as packs/ beside each tool (axiom 1), every preset settings the engine
    rebuilds (no toys), measured by the novelty report (no TWIN of another preset) and levelled. Dubstep first, its baseline (his):
    "Make It Bun Dem" (Skrillex & Damian Marley, 2012) — studied as technique only, never its tune or a recording: docs/research/ (the
    reggae-dubstep half-time at 140, the talking growl from formant + FM, the vocal-chop-as-instrument, the build into a riser and the
    drop's call-and-response bass). "trenke" — asked (which track); answered 2026-11-25 by his screenshot: the same record,
    "Make It Bun Dem" (Skrillex & Damian Marley, the After Hours EP).
  - LEVERAGE: the next set from docs/eco-graph.md (slew-lag, mpe-expression, relationship-graph, reverb-fdn, waveshaper; Ensemble Organism) —
    each tool's UI shown first.
  - THE LAB: a made sound opened in the Lab — asked (the Lab mode's analysis / spectra, or the Mutation Lab, ML4).
Tracked: docs/TODO-LEDGER.md T-39 … T-45.
