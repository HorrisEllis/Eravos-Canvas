# His words, mapped

> "Make sure you’re mapping all of what I’ve said." (2026-11-06)

Every thing he said in the 2026-11-06 session, in his words, and where it stands: **done** (with proof), **rule** (standing, how it is
kept), or **open** (not done yet, and what is missing). Newest at the bottom. Add to it every session; never drop a line.

| # | His words (2026-11-06; exact times in specs/eravos.2026-11-06-session.map.spec) | Status | Where · proof |
|---|---|---|---|
| 1 | "Can you when picking empty canvas have every tool empty of presets?" | **done** 3.124 | Start › Empty canvas → every tool added opens with no preset; kept across restarts; other starts bring presets back. `OrganismFactory.blankStart` · `tests/p116-blank-start.test.js` |
| 2 | "Also love the synthwave tool." | noted | Retro Poly. The planned synthwave family (10 tools) is in `tools/music/planned/`; Swarm Oscillator is the first to build |
| 3 | "Tell me about the tools in planning … Tell me more about the future tools and what they can do." | answered | 160 specs in `tools/music/planned/`, by family; order: `docs/eco-graph.md` |
| 4 | "What about packs?" | answered | each planned spec names ≥ 6 packs (Swarm: 8). Empty canvas: packs stay installed and listed, none loads on its own |
| 5 | "Ui preview. What’s the highest leverage?" | **done** (preview) | LFO component (24 tools); Swarm Oscillator the highest-leverage tool of phase 1. `docs/previews/`, `tools/music/planned/swarm-oscillator.ui.md` |
| 6 | "Need to make sure the ui is consistent, supports reactive colors and can be added to the timeline and connected as mods or other tools when applicable." | **done** for Swarm (preview) · **rule** for every tool | measured in the live canvas: design rules D2–D5 clean, Timeline lists it, 22 knob inputs, LFO → Coupling wired, Coherence out → Retro Poly cutoff wired. `docs/previews/swarm-oscillator.check.mjs` |
| 7 | "Dynamic as possible. As much power and control as possible without making it overwhelming. Hardcoded or static earns its place." | **rule** | a face of what matters, the rest behind More depth ▸; a control that does nothing in the current state dims and says why; fixed lists only where each item is a different thing (modes) or a musical value. `docs/DESIGN-GUIDE.md` (rule W7), `swarm-oscillator.ui.md` |
| 8 | "What will this do in the end?" | answered | Swarm: unison voices that pull on each other — drift, beat, lock — with coherence as a signal for other tools |
| 9 | "Just want to make sure the tools don’t become monolith with packs or mods hard wired in." | **rule** · open: a guard | packs are data beside a tool (`packs/`), mods go in through `Mods.add` and come out again. Open: a test that fails when a tool's engine names another tool's preset or builds a mod in |
| 10 | "Themes and ui, components are any parts that other tools can use." | **rule** · done: shown | components live in `tools/music/components/`, shared, never copied; each tool's page lists the ones it holds (Components tab). Themes/UI are the canvas's (`canvas/runtime/themes.js`, `ui-kit.js`), used by every tool |
| 11 | "Suites are tools with each component wired in." | **done** 3.126 | suite kind "suite" = a tool and its components wired (Wub Lab = Wobble Bass as parts; Synthesis Lab) · `tests/p119-suites-rework.test.js` |
| 12 | "Tools, keys and values can be adjusted while playing them." | **rule** · open: a guard | every knob already changes live (ui:config_change while sounding). Open: a test that holds a note on every instrument and moves every knob |
| 13 | "Move along the piano to change the keys, each key needs to play its relative note." | **done** 3.125 | a slide across the keys plays every key, each its own note (keys outside the key used to snap to a neighbour) · `tests/p117-keys-own-note.test.js` |
| 14 | "the automation tool needs to have a bind button to bind a tool aspect to the automation tool, similar to the midi mapper." | **done** 3.125 | Automation › ⊕ Bind, then touch any knob on any tool → a lane · `tests/p118-automation-bind.test.js` |
| 15 | "Each tool with each component/ui/packs/mod/suite/etc all with a clear line of seperation all added to the tool page, suite page." | **done** on the tool page · open: suite page, UI tab | tool page tabs: Panel · Setup · Mods · Packs · Controls · In/Out · **Suites** · **Components**, each its own. Open: the same Components tab on a suite's page; a UI tab (its accent, its reactive-colour setting) |
| 16 | "can you clear out suites and make them the tool and its components wired together?" | **done** 3.126 | the 7 systems of whole tools are **setups** (Start › SETUPS, they open and build exactly as before); the Suites list holds only suites |
| 17 | "But also the ability to create them?" · "That or setups on the screen. Like what’s wired together." | **done** 3.126 | right-click any window › Save what is wired here as a suite… (parts, wires, settings; listed, kept, deletable); a tool's page › Suites › Open as suite |
| 18 | "This is meant to be a way to explore creatively. Like connecting things to things and seeing what can be made from it. Across domains." | **rule** · done: saving is domain-free | `Suites.capture` follows wires, not domains. Open: a saved suite opens in the music domain's suite window; a domain-free suite window when a second domain has tools |
| 19 | "Make sure you’re mapping all of what I’ve said." | **done** | this file |
| 20 | "Map, spec first" · "Each tool needs a spec with a dag." (07:27:37Z) | **done** | every tool spec (226) ends with a generated `dag:` block — `node build/spec-dag.mjs`; `specs/eravos.components.spec` ADDENDUM 2026-11-06 |
| 21 | "Make the swarm oscillator first. Since you were ready to." | **done** 3.127 | `tools/music/tools/genre-instruments/swarm-oscillator/` — 10/10 tests, design check clean; six new components, each its own test |
| 22 | "Update the specs so nothing is lost." | **done** | `specs/eravos.2026-11-06-session.map.spec` (every message, timed, verbatim); addenda: suites, components, macro-automation; the Swarm and component specs |
| 23 | "And then Add those axioms to a claude.md." | **done** | `CLAUDE.md` › Axioms |
| 24 | "Also ideas, choices and direction. All of me and what’s proof of competence and ownership, I want logged to a compotenxe and log. Timestamped and what came from it. The date and quotes exactly." | **done** | `docs/competence/` — `register.jsonl` (append-only) → `REGISTER.md`, `LOG.md`; `node build/competence.mjs --check` |
