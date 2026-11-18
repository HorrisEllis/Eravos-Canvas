# spec_id: eravos.mind-domain · version 0.1.0 · status SPEC (mapped 2026-11-15; nothing built) · a domain: the ADHD Toolbox and Open Loops as tools
# his words (2026-11-15, verbatim): "spec the full adhd and open loops. no like each tool, is a whole component, can be combined with other
#   components. actually look at eravos canvas and the workshop. only use the exact tool in the repo, and style." · (04:34) "Preview. Like ui design.
#   Photoshop. Element mutation for combining and synthesizing tools. Like they literally change into something completely new. Like an endless way
#   to create." · (04:35) "Yes. All agnostic." · earlier (2026-11-14): "open loops was meant to track my open loops. adhd toolkit to account for my
#   deficits"
# Sources read 2026-11-15: HorrisEllis/ADHD-Toolbox (the zip he sent: nine pages, kernel/ = Open Loops v0.3, README's event bus table),
#   OPEN-LOOPS-SPEC.md (§1 the no-demand contract, §2 data model, §6/6b/6c bait, §11, §14–§17), open-loops v0.1/v0.2.
# Stands on: specs/eravos.compat-graph.spec (typed ports, slots, siblings, bridges, mutation ops, checker, lineage) · specs/eravos.workshop.spec and
#   the Field (tools/core/field/field.js: Workshop.addKind) · the tool format (tool.json schema eravos.tool/1, as tools/music/tools/generators/
#   pattern-field) · the domain format (domain.json schema eravos.domain/1, as tools/dataflow) · a domain's type table (tools/music/types.json).
# The domain's name is the coder's placeholder ("mind"), to confirm with him.

purpose: every ADHD Toolbox page and every Open Loops part becomes an Eravos tool or component: one thing, typed ports, wired on the canvas, opened
  in the Workshop, and combinable with any other tool of any domain through the compatibility graph — so a ritual can be timed by a rhythm, a
  pulse can set a pattern's density, a brain dump can be sorted by an agent. The no-demand contract (Open Loops §1) stops being a style rule
  and becomes part of the type table: a demand cannot be wired, because there is no type for one.

## what exists (measured from the sources, not invented)
pages (ADHD Toolbox, each one script, all on one bus BroadcastChannel('adhd-toolbox')):
  Now · Brain dump · Piggyback · Rituals · Prime · Gaps · Inbox · Devices · Settings
kernel (Open Loops v0.3, kernel/src): loops · baitEngine (curiosity, provocation, pattern) · models · concepts · vocab · commitments · rewind ·
  widgets · bus · store · server (the listener: dm_received, sms_received, appointment_detected, toolbox_event)
bus topics (README): dump.* · cue.* · piggy.* · ritual.* · prime.* spark.mode fuel.* · gaps.set.* gaps.member.* · appt.* · msg.* · kernel.* ·
  devices.output · body.hr body.nudge
→ the topics ARE the ports: each page already emits and hears typed events. The tool level can be written at once (as compat-graph says of
  music's hooks).

## the type table (tools/mind/types.json, proposed) — the domain's port types; the canvas compares names only
  thought      a captured piece of text (a dump item, a loop's text), with its source
  loop         an Open Loops Loop { id, text, concepts, status, solvability }
  quest        a MicroQuest offered: { loop_id, prompt, bait_mode: curiosity | provocation | pattern, tier_required }
  response     one of yes | not_now | reframe — and nothing else: there is no "missed", "ignored" or "late"
  discharge    a loop closed { loop_id, mode: desk | outside } — the only counted event; counts only go up
  set          a PatternSet { label, members, expected_size? } — real sets only (Open Loops §6c)
  tier         the active exposure tier — written by the person only
  cue          a Piggyback cue ("after I make coffee") → its action
  step         one ritual step { label, seconds }
  commitment   { title, when, lead } — the one type allowed to alert for real (Open Loops §17)
  alert        a once-only notice (core's update(): fired before it is emitted)
  pulse        a body signal (BLE heart rate, bpm) — shared with any domain through a bridge
  message      an inbox message (dm, sms) { from, src, content }
  shared types from other domains, by bridge only: dataflow (text, json, number, trigger), music transport/tick, audio out
  NO TYPE for: demand, streak, missed, deficit, score-down. The checker cannot wire what has no type (§ the law).

bridges (the domain declares; the graph shows them, never hides them):
  thought → dataflow:text · dataflow:text → thought            (any domain can hand text in or read it out)
  transport:tick → step:advance                                 (a ritual can be timed by music's clock)
  pulse → control (0…1, from the person's own baseline ± σ)     (a heartbeat can drive any knob, as music's modulation)
  discharge → trigger                                           (a closed loop can fire anything: a sound, a stroke, a step)
  set → dataflow:json                                           (a set's shape to any viewer)

## the law (Open Loops §1 as a gate — checked by the compat-graph checker, a fifth check after types/builds/plays/new)
  L1 a `response` of not_now or reframe has no edge to anything that counts, ranks or remembers it as a failure (there is no such type; and
     a bridge to a counter from not_now/reframe is refused by name)
  L2 nothing writes `tier` but the person: no component has a tier out-port; a mutation that would add one is refused
  L3 counts only rise: a counter in this domain accepts `discharge` and `quest(yes)` only
  L4 provocation bait doubts the world, never the person: a provocation string is checked against the self-worth line before it ships
     (Open Loops §6b) — a mutant whose output fails it is never offered
  L5 commitments are the exception, and only they: `commitment` may alert for real (push, sound); every other type reaches the person as an
     offer that vanishes at no cost (Open Loops §14)
  A mutant that fails the law is refused with the line it broke, like a type mismatch: shown, never hidden.

## the tools (each a tools/mind/tools/<group>/<tool>/ folder: tool.json · <tool>.engine.js · <tool>.ui.js · <tool>.spec · <tool>.test.js ·
## preview.png · thumb.png — exactly the pattern-field layout)
  id                  label        from (page/part)    in ports                         out ports                               components
  eravos.now          Now          Now                 thought, cue, set, pulse, tier   quest, cue (selected), alert           cue-grid, spark
  eravos.brain-dump   Brain dump   Brain dump          thought, message                 thought, loop, set (member)            dump-list, rebucket, concept-extractor
  eravos.piggyback    Piggyback    Piggyback           cue                              cue, message (sms out)                 cue-table
  eravos.ritual       Ritual       Rituals             step, transport:tick (bridge)    step, discharge, alert                  step-timer
  eravos.prime        Prime        Prime               thought, pulse                   quest (spark mode), thought             fuel-list, spark
  eravos.gaps         Gaps         Gaps                set, thought                     set, quest (pattern bait)               pattern-set, gap-finder
  eravos.inbox        Inbox        Inbox + listener    message, commitment              loop (desk), commitment, alert          message-list, appointment-clock
  eravos.devices      Body         Devices             —                                pulse, audio out                        ble-heart-rate, audio-route
  eravos.open-loops   Open Loops   kernel              thought, message, response, tier quest, discharge, set, loop             loop-store, bait-curiosity,
                                                                                                                                bait-provocation, bait-pattern,
                                                                                                                                tier-ladder, rewind
  Settings stays the domain's settings page (domain.json pages), not a tool.

## the components (parts any tool uses; ports as data from the start — compat-graph CG1 is not owed here)
  loop-store        in thought → out loop (status open|desk_closed|outside_closed|dormant)
  concept-extractor in thought → out thought+concepts
  bait-curiosity    in loop, tier → out quest(curiosity)          — siblings: bait-provocation, bait-pattern (they fit the same slot)
  bait-provocation  in loop, tier → out quest(provocation)        — guarded by L4
  bait-pattern      in loop, set → out quest(pattern)             — real gaps only
  tier-ladder       in tier (person) → out tier                    — L2: no other writer
  commitment-clock  in commitment → out alert                      — L5
  rewind            in loop|set|tier → out the same, restored       — Open Loops §15
  step-timer        in step, trigger? → out step, discharge
  cue-grid · spark · dump-list · rebucket · cue-table · fuel-list · pattern-set · gap-finder · message-list · ble-heart-rate · audio-route
  (their ports are the pages' bus topics above, written as data in M3)
  SWAP works at once on the bait siblings: one Open Loops with its curiosity bait swapped for pattern bait is a mutation the Field can offer now.

## fusions to prove (each a candidate until the checker says it fits and the person keeps it; none is promised)
  ritual × music.pattern-field   the ritual's steps advance on the pattern's ticks (bridge transport:tick → step:advance): a routine that keeps time
  devices × music.pattern-field  the pulse sets the pattern's density (bridge pulse → control): music that follows the body
  brain-dump × agents.step       an agent sorts the dump into loops and desk/outside, shown as an offer, never auto-committed (Open Loops §3)
  gaps × image (brush)           a set's gaps drawn as missing strokes: the shape of what is open
  open-loops × ritual            a discharged loop fires the next ritual step (discharge → trigger)

## where it lives (sovereignty)
  the domain: tools/mind/ in Eravos Canvas (domain.json, types.json, core/, tools/) · the kernel's data stays the person's (never in the repo,
  never in the app folder: Documents\ERAVOS\mind\) · the kernel itself keeps running for the listener, on a port that is not Guardian's 7820
  · HorrisEllis/ADHD-Toolbox stays the pages' home until each page is a tool; then it points here

## phases (each its own PR, proved before the next; a dependency graph first, as every tool spec)
  M0  this spec                                                                                           depends_on: []
  M1  tools/mind/domain.json + types.json + bridges; the law (L1–L5) as data the checker reads           depends_on: [M0, CG2 of compat-graph]
  M2  Brain dump as the first tool (the smallest usable slice: capture, the loop inbox, Yes / Not now / Reframe) — the rest wait for a week of
      his use                                                                                             depends_on: [M1]
  M3  the kernel's parts as components with ports as data (loop-store, the three baits, tier-ladder, rewind, commitment-clock)  depends_on: [M2]
  M4  the law in the checker (a fifth check: refused with the line broken) and a test per line           depends_on: [M3, CG3]
  M5  the other pages as tools, one PR each, in the order he uses them                                   depends_on: [M4]
  M6  the fusions above, in the Field: each proved (fits, plays, new) or recorded as refused, with why   depends_on: [M5, the Field's MUTATE]

## acceptance
  - boundary test: the canvas and the Field name no word of this domain; this domain's tools open in the Workshop unchanged (two kinds, no new code there)
  - the law refuses, by name, a mutant that wires not_now to a counter, gives a component a tier out-port, or ships a provocation about the person
  - Brain dump round-trips: a thought in, a loop out, Not now leaves no trace but the thought itself
  - preview shown to him (Eravos style, the real tools' own previews) before M2 is built

## open (his)
  - the domain's name ("mind" is a placeholder)
  - whether Open Loops stays one tool or opens into its components on the canvas
  - which page is second after Brain dump
