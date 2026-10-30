# spec_id: eravos.tool-pages · version 1.0.0 · phase P45 · status canonical
# "what about having a whole page for each tool. that has each mod, sound packs, like you can load in the entire
#  suite or the mods one by one."

page (canvas/runtime/tool-page.js → window.ToolPage, domain-free):
  opened from 📘 on every window (works on THAT window) or "📘 Its page" in ＋ Add (works on a window of that tool
  already on the canvas, or opens one the first time something is added). "Works on:" switches the window.
  sections, each in the jump bar:
    🧰 Suite     descriptor.suite — "＋ Load the whole suite" (header) or ＋ per member; ▶ hears a member's preset
    🧩 Mods      per slot: what is inside (⏻ ×) and every tool that fits (Mods.compatible), ＋ one at a time
    🔗 Plays with tools its link rules name, and tools whose rules name it — ＋ adds it next to this one, wired
    🎛 Packs     every preset by pack (built in first; a name two packs share is listed once) — ▶ preview · Load ·
                 a pack switch (ContentPacks.setEnabled)
    🎚 Controls  every non-hidden setting by group: range / options, default, hint; ∿ = an input can move it, ⚙ = settings only
    ⇄ In / out   every port that is not internal

descriptor.suite { label?, blurb?, members: [member] }
  member { tool, as: 'mod' | 'linked', slot? (mod), preset?, why?, wire?: { from: [ref, hook], to: [ref, hook] } | false }
  ref = 'host' | 'self' | another member's tool id (the one this page opened, else one on the canvas)
  linked with no wire → the first pair of ports that fit (event ports never), its rule's direction first ; wire: false → none
  loadSuite: linked members first (a later wire may name one), then mods ; every step is spawn / ui:* / kernel wire /
  Mods.add — undoable and saved like a hand edit.

suites shipped: Wobble Bass (The drop rig), Wub Osc (A whole wub), Morph Osc (Morph voice), Destroyer (Talking grit).

Wobble Bass 3.6: slot `growl` — after the post shaper on the wub layer only; the sub joins after it, delayed by whatever
  latency the mods report (onLatency), so the low end stays clean and in time.

tests: tests/p45-tool-page.test.js

3.48 (specs/eravos.suites.spec): suites become their own systems with their own page (canvas/runtime/suite-page.js);
  a tool page gains "Part of: <suite> 🧰" (opens the suite page). descriptor.suite stays as the tool's starter rig.
  Shared parts (preset lists, mod pickers, control tables) move into one module both pages use — no copy of the code.


# ADDENDUM 3.71–3.72 (2026-10-24) — his words: "with the tool pages to have tabs. load the default tab with the content and have the tabs
#   horizontal" · "the tool page to be the pink button, and the add to canvas under it".
#   Tabs: one horizontal row (the tab buttons shared the .tp-tab class with the Controls table, whose width:100% stacked them).
#   Panel opens by default with the tool LIVE even when none is on the canvas: a windowless sketch (ephemeral, headless) plays in the page;
#   Add to canvas carries what was set on it (serialize → deserialize); closing the page leaves nothing behind.
#   A tool adds its own tabs: view.pageTab(id, label, el, icon); a domain adds tabs for every tool: UIKit.pageTabsFor(view) (Motion, Perform).
#   + Add: the pink primary button opens the page; Add to canvas sits under it. 3.72: the page is a device (chassis, tabs along the top,
#   inset panels, the pink Add key). Tests: p71-motion (the page test). Numbers: these are main's names for this work (3.71 Motion + Perform, 3.72 look kit, 3.73 living UI, 3.76 Deep Sub + tool zips, 3.77 Destroyer + reactive modes + audit); the Pattern Library's 3.71–3.73 and 3.76 share numbers — tell them apart by title.
