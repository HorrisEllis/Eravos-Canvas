# spec_id: eravos.host · version 1.0.0 · phase P46 · status canonical
# "Integrate with clearglass and cos and make it specifically Eravos."
# Nexus COS (the Compartment OS) and Clear Glass (the Nexus browser) brought in as ERAVOS's own host: no Nexus code is
# required at run time — the ideas are rebuilt here for this canvas, with Node built-ins only.

layers:
  the canvas (canvas/kernel + canvas/runtime)   stays the engine: one page, one sound graph, sample-accurate — unchanged
  host/                                          around it, on the machine:
    siso.js    the event core of COS and Clear Glass (→E→E→)
    cos.js     ERAVOS COS — compartments, birth gates, snapshots, the archetype
    glass.js   ERAVOS Glass — the canvas served with an event stream and one command door
    eravos.mjs the command line
  canvas/runtime/glass-link.js                   the page's side of Glass (domain-free; inert unless Glass serves it)
  desktop/                                       ERAVOS.exe runs Glass inside the app (the Clear Glass shape: a browser
                                                 shell whose behaviour is gates on a stream)

siso (host/siso.js):
  Event { type, data, seq, ts } · Gate(signature, transform, { schema?, describe? }) · Stream · Ledger (JSON lines)
  one signature → one gate: a second gate for the same type throws ("one signature, one gate")
  emit(type, data) → the gate's answer (value or promise) | undefined (no gate: the event is kept, not answered)
  schema { field: 'string'|'number'|'boolean'|'object'|'array'|'any', 'field?': … } checked before the gate runs (code SCHEMA)
  ring of 1000 (since(seq), tail(n)) · onAny observers watch, never answer

cos (host/cos.js) — Compartment OS, made ERAVOS:
  compartments: eravos.canvas (canvas/) + one per tool folder tools/<domain>/tools/<category>/<tool>/ (63 today)
  states: sandbox → integrated (every gate passed) | recycled (failures kept) — <data>/cos/state.json
  birth gates, tool:
    manifest  tool.json has id/version/label/domain/category; id = eravos.<folder> (or eravos.<domain>.<folder>);
              every file it names exists
    shape     <tool>.engine.js · <tool>.spec · <tool>.test.js · packs/
    sealed    its code reaches nothing outside its folder: no ../ paths, no require/import, no other tool's files
    packs     every preset sets only settings the tool has — read from its REAL descriptor (the engine run in a vm
              sandbox where every SDK global is a stand-in; define() captured), plus the settings its domain's SDK adds
    spec      its spec names it
    deep (--deep): tests (its own suites in Chromium via tests/run.mjs <label>) · sound (tests/tool-audio.mjs <id>)
  birth gates, canvas: boundary (no domain word in kernel/, runtime/, index.html, scripts.js) · scripts (every listed file exists)
  snapshots: <data>/cos/snapshots/<id>/<stamp>.json.gz — every file: path, size, sha256 AND contents (Nexus COS keeps the
    manifest only) · diff (changed / added / removed) · restore (a safety snapshot first; prune removes files added since;
    a path outside the compartment is refused)
  archetype <out>: the COS eravos-canvas archetype generated from this repo (canvas/, schemas/, templates/, build tools,
    host/, archetype.json with detection rules, compartment layout, gates and every tool) — never a stale copy

glass (host/glass.js) — Clear Glass, made ERAVOS:
  start({ root, port = 4747, data? }) → { url, port, stream, cos, close }   loopback only
  serves the folder like serve.js (same address → same saves) and puts window.ERAVOS_GLASS in every HTML page's <head>
  GET /glass/health · /glass/signatures · /glass/events?replay=n[&role=page] (SSE: { seq, type, data })
  POST /glass/cmd { type, data } → { ok, result } | { ok:false, error }   needs header X-Eravos-Glass: 1 (403 without),
    404 unknown command, 400 bad data, 409 no canvas open, 504 the canvas did not answer (8 s)
  POST /glass/reply (the page's answers) · /glass/emit (page:* events only)
  canvas.* commands travel to the open page (event canvas:cmd {id, cmd, data}) and wait for its reply:
    canvas.tools · canvas.state · canvas.spawn {tool, preset?, x?, y?} · canvas.set {instanceId, key+value | params} ·
    canvas.preset {instanceId, name} · canvas.wire {from, to} · canvas.unwire {wireId} · canvas.close {instanceId} ·
    canvas.suite {tool, instanceId?}
  cos.* commands run in the host: cos.list · cos.gate · cos.gateAll · cos.snapshot · cos.snapshots · cos.diff · cos.restore
  glass.signatures

glass-link (canvas/runtime/glass-link.js, domain-free):
  only when window.ERAVOS_GLASS exists: joins /glass/events as the page, carries out canvas.* the way a person would
  (spawn, ui:config_change / ui:preset_load, kernel wires, ToolPage.loadSuite — undoable, saved), refuses unknown tools,
  settings and presets by name, and reports page:opened / page:closed / page:wired back

desktop (ERAVOS.exe):
  main.js starts Glass on 127.0.0.1:4748 (ERAVOS_GLASS_PORT; ERAVOS_GLASS=0 turns it off) with its data in .appdata/eravos;
  eravos://app/glass/* is passed to it (same origin for the page); preload exposes ERAVOS_GLASS; build ships host/ beside
  canvas/ and tools/ (never served to the page). Not yet run in Electron here (no Electron in this container).

cli: node host/eravos.mjs glass [--port] [--open] · send <command> [json] · cos list | gate <id>|--all [--deep] |
  snapshot <id> [--note] | snapshots <id> | diff <id> [snap] | restore <id> [snap] [--prune] | archetype <out>

next: the Ollama DJ (pinned) drives the canvas through POST /glass/cmd — canvas.state to listen, canvas.set to turn knobs.

tests: tests/host.test.mjs (node; Chromium for Glass end to end)
