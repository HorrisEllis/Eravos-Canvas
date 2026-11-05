# ERAVOS Design Guide

> "i want consistency across all of them. and a template or schema for a design guide or philospophy to maintain consistency."
> — James, 2026-11-05

This guide is the one place the look of ERAVOS is decided. Every rule comes from something he said, quoted with its date, and every
rule that can be measured is measured on every tool by `node tests/design-check.mjs` (report: `docs/design-check.md`). A new tool's UI
is written up with [`docs/templates/TOOL-UI.md`](templates/TOOL-UI.md) and shown to him **before** it is built.

## Philosophy

1. **The canvas is black; only colour is colour.** Surfaces disappear so the instruments can glow. Nothing carries a tint.
2. **Each tool has one colour, and stays in its family.** A tool is recognised by its colour. Its gradients are that colour, a shade
   either side, never another hue.
3. **One kit, everywhere.** The same button, toggle, segment, knob, select, label, card and window in every tool, at the kit's sizes.
   A tool is different in what it does, never in how a button looks.
4. **Everything with colour answers the music; nothing else does.** The reactive colours move the colours (and, in Beat, make them one).
5. **Deep, not cluttered.** Every control is reachable; the face shows what matters and the rest folds away ("More depth ▸").
6. **It's an instrument, not a toy.** It looks like what it is: live sound you shape (CLAUDE.md, No toys).

## Rules

Each rule: what it says · his words · how it is checked.

### Surfaces

| Rule | What | His words | Checked by |
|---|---|---|---|
| S1 | Every surface (page, canvas, window, card, panel, well, button fill, a display's background) is neutral near-black: `--bg #000`, `--bg2 #050505`, `--panel #0a0a0a`, `--panel2 #0f0f0f`, `--well #000` | "make them darker even. like black" (2026-11-05) | D1 · `black-surfaces.js` enforces it at runtime |
| S2 | No surface carries a tool's colour or a cast. A colour is mixed into a surface only by **Light over the tools**, which he turns on | "i dont like the tint. everything but the colors should be what they are" (2026-11-05) | D1 |
| S3 | Lines and separators use `--line` / `--line2` (neutral), never a literal blue-grey | — (follows S2) | D1 |
| S4 | A tool's code uses the tokens (`var(--panel2)`, `var(--line2)`), not literal hex for surfaces | — | D1, review |

### Colour

| Rule | What | His words | Checked by |
|---|---|---|---|
| C1 | One accent per tool (`tool.json` accent); everything that is a colour in that tool is the accent or its family | "the buttons in the tape echo look bad … bad gradient" (2026-11-05) | D6 |
| C2 | A gradient's stops stay within 40° of hue: the Dusk theme builds them as the accent turned ±9–18° (`--dk1…4`) | same | D6 |
| C3 | Text is neutral (`--text`, `--dim`, `--faint`); coloured text only for a title or an active value | — | review |
| C4 | Signal colours (a level meter's green / yellow / red, a fault's red) carry meaning and are exempt from C1 | — | D6 skips meters |
| C5 | Reactive colours: Static · Changing · Custom · **Beat** (one colour for everything, moving on the beat). Surfaces never react | "i want them to be the same color and change to the beat" (2026-11-05) | P102, P103 |

### The kit

| Rule | What | His words | Checked by |
|---|---|---|---|
| K1 | Controls come from `UIKit` (`UI.Button`, `UI.Toggle`, segments, `UI.Knob`, `UI.Fader`, selects). No one-off buttons | "i want consistency across all of them" (2026-11-05) | D4 (baseline: play surfaces still to move — see Known) |
| K2 | The kit's sizes only: normal, `big` (`kind: 'primary big'`), and `sm` for mixer-style lane controls (mute, solo, arm, remove). No inline height, width, padding or font on a kit control | same | D2 |
| K3 | One primary action per window — the thing the tool is for (Throw, Bounce, Connect) | — | D5 |
| K4 | Knob labels never collide: a knob is as wide as its label (50–76 px) and wraps at spaces | — | D3 |
| K5 | Labels: section titles and knob names in the mono face, uppercase, letter-spaced; buttons and text in Inter | — | review |

### Windows and pages

| Rule | What | His words | Checked by |
|---|---|---|---|
| W1 | Every tool window has the same chrome: title in the accent, version, the same right-hand controls | — | review |
| W2 | A tool's face is grouped in cards, each with a dot and a mono title; depth beyond the face sits behind "More depth ▸" | — | review |
| W3 | Tool pages: one fixed size for every tab, a compact head, no scroll inside the page, words not ids | "the ui is how i want it. except it the tool pages look horrible" → "that looks nice as hell" (2026-11-05) | P21, P45 |
| W4 | The look of the canvas as it is now is the reference. No restyle without his OK on a preview | "hell no on that ui. i like what it is now." (2026-11-05) | process |

### New tools

| Rule | What | His words | Checked by |
|---|---|---|---|
| N1 | Every new tool's UI is written up with the template and shown to him as a preview before it is built | "show the the ui before any tools get built" (2026-11-05) | process |
| N2 | A new tool breaks no rule (its line in `tests/design-baseline.json` is all zeros) | — | `design-check` fails on any new break |

## Known (measured 2026-11-05: 52 of 69 tools pass every rule)

- **D4, 119 one-off buttons in 17 tools** — nearly all are play surfaces (drum pads, Lyrics → Rhythm syllables, FX Box pads, Drum Forge pads,
  Suite chips). The kit needs a **Pad** part (a play surface: hit, hold, light on the beat, its colour from the tool) so they can move onto it.
  Until then the baseline holds them: none may be added.
- Colours a tool hard-codes outside the reactive variables (Wobble Bass's "Keep in range") do not follow Beat yet.

## How it is kept

- `node tests/design-check.mjs` opens every tool on the served build and measures D1–D6. A tool may improve, never get worse; a new tool
  must be clean. `--update` writes the baseline after a deliberate improvement. It runs on every pull request (`.github/workflows/checks.yml`).
- `canvas/runtime/black-surfaces.js` enforces S1–S2 as tools run, so a tool that forgets is still black.
- A change to this guide is his call; quote him in the rule.
