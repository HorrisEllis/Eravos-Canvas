# Tool UI — <Tool name>

> The template every new tool's UI is written in **before it is built** (docs/DESIGN-GUIDE.md N1). Fill every section, make the
> preview, show it to him, and build only what he approves. Delete these quoted lines when filling it in.

- **Tool:** `eravos.<id>` · category · planned spec: `tools/music/planned/<id>.spec`
- **Accent:** `#rrggbb` (one colour — C1). Name it in words (e.g. "deep teal").
- **Components it assembles:** (from its spec's `assembles`) — each control below belongs to one of them
- **His words** that asked for it (quoted, dated):

## What it is for, in one line

> The one thing the tool does. This is its primary action (K3).

## The face (what shows when it opens)

> Cards, top to bottom, left to right. Each card: its mono title, what is in it, which component it drives. Keep to what matters;
> everything else goes in "More depth ▸" (W2).

| Card | Controls (kit parts only — K1) | Component |
|---|---|---|
| e.g. MOUTH | segment lowpass/formant/comb · knobs Cutoff, Reso | filter-svf |

**Primary action:** the one `primary` button (K3).
**Displays:** what it draws (a scope, a spectrum, a step grid) and what colour (the accent family — C1/C2).

## More depth ▸

> Every remaining control (nothing outside his control — the ecosystem's tool contract). Grouped like the face.

## Play surfaces

> Pads, keys, cells, a perform pad: what they do on hit / hold / drag, and how they light. (Until the kit has a Pad part, say which
> existing one it reuses — never a one-off button.)

## Sizes and layout

- Default window size and minimum size.
- Lane-style small controls use `sm` (K2). No inline sizes.

## Checklist (all must be true before it is built)

- [ ] Surfaces are tokens only (S1–S4); no literal hex for a surface
- [ ] One accent; every gradient within its family (C1–C2)
- [ ] Every control is a kit part at a kit size (K1–K2)
- [ ] One primary action (K3)
- [ ] Every knob label fits (K4)
- [ ] The preview was shown to him, and his answer is quoted here:
  > "…"
- [ ] After it is built: `node tests/design-check.mjs` reports it clean (N2)
