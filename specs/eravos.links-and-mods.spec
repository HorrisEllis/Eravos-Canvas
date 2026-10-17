# spec_id: eravos.links-and-mods · version 1.0.0 · phase P44 · status canonical
# "I want the tools to dynamically expand when they connect to other tools … small tools with other small tools.
#  dynamic and creative, not rigid." — no monoliths: small tools that combine, three ways.

principle:
  every tool stays small and excellent at one thing; bigger instruments are COMBINATIONS, made three ways —
  1 WIRES  (the canvas)      tools side by side, cables between them — the open, visible way
  2 LINKS  (runtime/links.js) a wired tool grows: its window shows the tools it is wired to, and their controls in it
  3 MODS   (runtime/mods.js)  a tool lives INSIDE another — no window, a card in its host — one window, one sound
  and tools adapt to their neighbours (ctx.links / ctx.onLinks): FOLLOW plays the notes of what a tool is wired into.

links (domain-free):
  ctx.links() → [{ peer, organism, label, icon, provides, category, dir 'in'|'out', hook, peerHook, wire_type, wire_id }]
  ctx.onLinks(fn) — fn(links) now and on every wire / unwire / unmount touching this tool
  OrganismSDK.linksOf(K, id) — the same list for the runtime ; insert wires (meta.insert) are never links
  window strip: one chip per peer (⇠ it feeds this · ⇢ this feeds it · ⇄ both) ; click = unfold the peer's FACE here
  descriptor.face  [keys]  what this tool shows on other windows (default: its first six knobs, never mix/in/out/bypass/mods)
  descriptor.links [rule]  { with?, provides?, category?, dir?, face?, label?, hint? } — a matching peer unfolds on its
                           own when wired; `face` names the PEER's controls to show. A rule on the peer (about this tool)
                           opens it too, with the peer's own face.
  views mounted in another window are disposed with it (view.dispose) — no leaked subscriptions or render loops

mods (domain-free runtime + a domain helper):
  descriptor.slots [{ id, label, wire_type, accepts?: { provides?, category?, not?: [ids] }, max?, hint? }]
  at define: hooks slot.<id>.send (out) + slot.<id>.return (in), internal (no rail, never hand-wired) ;
             param mods: [{ uid, slot, tool, bypass, state }] hidden — saved, undone, carried by user presets
  the music domain: ctx.slot(id, fromNode) → node — empty it is a straight wire (sample-exact); while mods are wired
             the straight path closes (5 ms) ; send port is internal (no trim, no strip, never on the master) ;
             a tool with an audio slot gets audio_in + audio_out
  chain: send → mod 1 → … → mod n → return as kernel wires with meta.insert — not cables (wire-system skips them), not a
             cycle (kernel acyclic check skips them), not links ; bypassed mods are left out of the chain (kept alive)
  a mod: spawned ephemeral + headless (system, no window, not saved on its own, not in the mixer or tool lists) ;
             rec.hostId = its host ; closing the host closes its mods ; mods may host mods, 3 deep at most
  compatible tools: same signal in AND out, not singleton, not system, not noMod, not the host itself, accepts filter
  edits (add / remove / bypass / move) go through the host's own setting (ui:config_change mods) → one undo step ;
             a mod's own knob moves count as its host's (history maps hosted ids to their host)
  the host's save always carries its mods' current state (serialize refreshes the mods param first)
  Stop all: a note for the host wakes its mods too (insert wires followed, no loops)
  rack UI: 🧩 MODS · <slot> — ＋ mod (searchable, by category) ; card: ⏻ bypass · ↑ ↓ · ⤢ whole window / face · ▾ fold · ×

first users:
  Destroyer slot 'after' (inside the wet path, mixed by Mix) · Wub Osc 'tone' · Wub Filter 'after' · Wub Sub 'tone'
  faces + link rules: Destroyer, Wub Osc / Filter / Rate / Sub, Morph Osc, Envelope, Partials
  FOLLOW: Morph Osc (as an FM modulator, × Ratio) and Envelope (into any knob) play the notes of what they are wired into

tests: tests/p44-links-mods.test.js (hooks + param ; picker ; sound through a mod, bypass = plain ; order ; save → load ;
       nested ; Stop all wakes mods ; one undo step ; links both sides + onLinks ; default face) and each synthesis tool's own

in and out (3.43.1):
  ⇲ Mods.absorb(host, slot, instance) — a window already on the canvas moves inside (＋ mod lists them first): its state comes
       along, its window closes, and every tool that fed it is wired to every tool it fed (the chain closes behind it)
  ⇱ Mods.popOut(host, uid) — a mod becomes its own window beside its host with the same state, wired host → it → whatever the
       host fed (those wires move behind it)
  both are a handful of steps inside 150 ms → one undo step
latency (3.43.1):
  K.audio.setLatency / latencyOf / 'audio:latency' — how late a tool's processed sound is (the STD.fx shell reports own + extra)
  ctx.slot(id, node, { onLatency }) sums the delays of the mods in that slot's chain; an fx host passes fx.addLatency, so its
       blended dry waits for its own wet chain AND its mods (Destroyer, Wub Filter). Nested hosts report their totals upward.
next (mapped, not built): drag a window by its title onto a rack · modulation slots (an LFO / Envelope living inside a tool)
