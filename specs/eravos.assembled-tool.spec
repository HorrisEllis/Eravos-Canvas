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
