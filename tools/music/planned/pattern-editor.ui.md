# Tool UI — Pattern Editor

Written with `docs/templates/TOOL-UI.md`. **A preview, not built** — waiting for his yes.
Preview: `docs/previews/pattern-editor.preview.js` (the real kit, today's piano roll, the real components; silent) · picture: `node docs/previews/pattern-editor.shots.mjs`.

- **Tool:** `eravos.pattern-editor` · Arrange · spec: `tools/music/planned/pattern-editor.spec`
- **Accent:** `#3ddc97` — growth green (one accent; every drawn colour is a green of it)
- **Components:** pattern-store · seed-registry · scale-key (built 2026-11-06, each proving itself)
- **His words:** "The pattern and note editor are the same." (13:28:34Z) · "I keep envisioning like a whole ass extremely detailed note and pattern editor. Like fractals. Then can save for later. I’m struggling with the complicated patterns." (09:23:29Z) · "First." (13:30:25Z)

## What it is for, in one line
Write notes and patterns in one place — patterns inside patterns, grown and varied by seed — and keep them for later.

## The face
| Part | What is in it | Component |
|---|---|---|
| top row | View (notes · tree · library) · ⟳ Reroll · **Save** (the one primary) · ⧉ Pop out | seed-registry · pattern-store |
| NOTE VIEW | today's piano roll, kept whole (every tool, lane, bend, sketch, Scale lock, More ▾) — it edits the pattern's flattened notes | pattern-store · scale-key |
| PATTERN TREE | what is placed inside what, level by level; each block a place (drag = move, its label = its change: steps, reverse, invert, stretch, chance) | pattern-store |
| GROW | Grow depth 0–4 · Chance; depth 0…3 drawn side by side, the chosen one lit; Grow writes the result as notes you can edit | pattern-store · seed-registry |
| LIBRARY | your patterns, saved for later (every save a version; the old ones kept) | pattern-store |

## Checklist
- [x] Kit parts only; one accent; one primary (Save); the roll's own Scale lock (no second key lock)
- [ ] Shown to him — his answer quoted here
- [ ] What fails in today's note editor: reproduced and fixed first (asked him)
- [ ] After it is built: design check clean
