# spec_id: eravos.shell-expansion · version 1.0.0 · phase P14 · status canonical
# runtime/expansion.js + runtime/add-menu.js (domain-free) · domains/music/domain.js (units, modes, resolveNeeds)
axioms: the canvas starts AGNOSTIC (skeleton toolbar only) · nothing domain-specific paints until a mode is entered or a tool that needs it is added · every tool declares (or derives) its dependency list before it is added
api (Shell S): unit({id,label,icon,describes,requires,build}) · mode({id,label,icon,accent,blurb,units,categories,brand}) · needs(fn(descriptor)→{mode,units,services,notes}) · deps(id) · expand(units) · enterMode(id)
triggers: OrganismFactory.onBeforeSpawn → expand the tool's units · Recipes.onBeforeRun → enter the recipe's modes + expand · Workspace beforeRestore(K, snap) → re-enter saved modes/units
descriptor.needs (optional): { mode, units[], services[], works_with[], notes[] } merged over the derived list
derivation (music): any tool → engine · transport tick/play → transport + tempo · theory → key · audio out → meter · midi:note in → MIDI button
add menu: full-screen popup · rail (Modes · All tools · categories) · grid cards with mode + "+N toolbar" chips · detail = dependency list (mode, needs, toolbar ✚ new / ✓ built, inputs, outputs, follows, works-with, presets) · keys: type, arrows, Enter, Esc
dock: descriptor dock:'bottom' mounts pinned under the canvas (resizable, foldable, no wire rails)
tests: tests/p14.test.js + boundary (skeleton names no domain term)
