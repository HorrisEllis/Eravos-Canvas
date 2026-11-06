# spec_id: eravos.erv-format · version 0.1.0 · status spec (2026-11-06) · a canvas part (names no domain) · extension .erv
# His words (2026-11-06, UTC, verbatim — specs/eravos.2026-11-06-session.map.spec):
#   09:23:29 "Can we use yaml to save songs like a psd file. Like so it has layers? Like it saves what’s on the canvas?"
#   15:55:01 "Nice. That's exactly it. And then the PSD style YAML, maybe ERV as an extension for that."

## What it is
A project — everything on the canvas — saved as ONE readable YAML text file, `<name>.erv`, in LAYERS like a PSD: each layer one part of the
work (a tool, the wires, the canvas view, a domain's song state, the audio), each with its own switches. Text, so it can be read, compared
(diff) and merged; layers, so a song can be opened in part ("just the tools", "everything but the wires", "only the drums").

## Today (what it replaces as the file you keep)
Workspace.snapshot() → one JSON object { workspace_version, saved_at, domains, organisms[{ id, instanceId, x, y, w, h, state }], wires, assets
{ hash: base64 }, view } — kept in the app's own store (autosave, projects) and as .eravos.json backups. That object stays the in-memory form:
.erv is that object, laid out as layers; nothing is lost either way (proved: snapshot → .erv → snapshot is exact).

## The file
  erv: 1                       # the format's version
  name: Night Drive
  saved: 2026-11-06T16:00:00Z
  app: ERAVOS 0.2.10
  layers:                      # top to bottom, like a PSD's layer panel
    - { id: view, kind: canvas, label: Canvas view, on: true, locked: false, data: { x, y, z } }
    - kind: group, label: Tools, on: true, layers:          # a GROUP, like a PSD folder
        - { id: <instanceId>, kind: tool, tool: eravos.swarm-oscillator, label: Swarm Oscillator, on: true, locked: false,
            at: { x, y, w, h }, preset: Locked Unison, state: { … its settings, exactly … } }
    - { id: wires, kind: wires, label: Wires, on: true, data: [ { from: [inst, hook], to: [inst, hook], type } ] }
    - { id: domain:<id>, kind: domain, label: <its label>, on: true, data: { … what that domain saves: transport, key, … } }
    - { id: assets, kind: assets, label: Your files, on: true, data: { <hash>: { name, mime, type, base64 } } }   # inline (v1)
  Layer switches: on (false = left out when opened) · locked (kept in the file; read-only on open is NOT enforced yet — open gap) · note (yours) · colour (a label colour, like PSD).
  A tool's preset name is written as a label when it is known; opening restores every setting from `state`, never by the name.
  Unknown keys are kept and written back (a file edited by hand, or by a newer ERAVOS, loses nothing).

## Opening
  Drop a .erv on the canvas, or Start › Open. A layer that is off is not opened; the tools it would have wired to are opened unwired.
  Open in part: the open dialog lists the layers (like PSD's) with their switches before anything happens.
  Missing tools are installed first (as projects do today, Catalog.ensure), named in a toast.

## Saving
  Start › Save as .erv (and Ctrl+Shift+S) — a download in the browser; a file in Documents\ERAVOS\Projects on the desktop.
  The app's own autosave stays as it is (fast, binary-safe); .erv is the file you keep, share, and read.

## Decisions (2026-11-06)
  - YAML as he asked; parsed safely (no code, no custom tags): js-yaml 4.1.0 (MIT), vendored in canvas/runtime/vendor/ (the browser build has
    no npm) — loaded with its CORE schema only
  - the canvas writes the layers it knows (canvas, tools, wires, assets); a DOMAIN's layer is whatever its Workspace contributor saves —
    the canvas names no domain (boundary test)
  - audio inline as base64 in v1 (one file to carry); a sidecar folder (<name>.erv.d/) on the desktop later, for big recordings
  - tools are layers, grouped; later the Workshop's objects (a note, a pattern, an image) become layers inside their tool's layer — the
    same layer model at every scale (specs/eravos.workshop.spec)

## Acceptance
  - snapshot → .erv → snapshot: exact (deep-equal JSON) for a canvas of real tools, wires, a domain's state and audio
  - a layer switched off is left out when opened; unknown keys survive a round trip; a hand edit (a knob's value in the text) opens as edited
  - js-yaml loads with the CORE schema (a file cannot run code); a broken file says where it broke (line, column) and opens nothing
  - boundary test green; the file reads as plain text a person can follow
