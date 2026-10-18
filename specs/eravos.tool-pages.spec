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
