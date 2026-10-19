# spec_id: eravos.host · version 1.1.0 · phase P46 · status canonical
# 1.1: "Each domain can be a nested compartment. Strip everything not needed." — canvas › domain › tool; snapshots, the
#      ledger and duplicate commands removed (git keeps history; the ring feeds late listeners).
# "Integrate with clearglass and cos and make it specifically Eravos."
# Nexus COS (the Compartment OS) and Clear Glass (the Nexus browser) brought in as ERAVOS's own host: no Nexus code is
# required at run time — the ideas are rebuilt here for this canvas, with Node built-ins only.

layers:
  the canvas (canvas/kernel + canvas/runtime)   stays the engine: one page, one sound graph, sample-accurate — unchanged
  host/                                          around it, on the machine:
    siso.js    the event core of COS and Clear Glass (→E→E→)
    cos.js     ERAVOS COS — nested compartments, birth gates, the archetype
    glass.js   ERAVOS Glass — the canvas served with an event stream and one command door
    eravos.mjs the command line
  canvas/runtime/glass-link.js                   the page's side of Glass (domain-free; inert unless Glass serves it)
  desktop/                                       ERAVOS.exe runs Glass inside the app (the Clear Glass shape: a browser
                                                 shell whose behaviour is gates on a stream)

siso (host/siso.js):
  Event { type, data, seq, ts } · Gate(signature, transform, { schema?, describe? }) · Stream
  one signature → one gate: a second gate for the same type throws ("one signature, one gate")
  emit(type, data) → the gate's answer (value or promise) | undefined (no gate: the event is kept, not answered)
  schema { field: 'string'|'number'|'boolean'|'object'|'array'|'any', 'field?': … } checked before the gate runs (code SCHEMA)
  ring of 1000 (since(seq), tail(n)) · onAny observers watch, never answer

cos (host/cos.js) — Compartment OS, made ERAVOS — compartments nest the way the project does:
  eravos.canvas                 canvas/                                   gates: boundary · scripts
    eravos.domain.<id>          tools/<id>/ (has domain.json; a folder of plans is not a compartment yet)
                                                                          gates: charter · loader · listed · walls
      eravos.<tool>             tools/<id>/tools/<category>/<tool>/       gates: manifest · shape · sealed · packs · spec
                                                                                 (+ --deep: tests · sound)
  today: 1 canvas · 6 domains (agents, coding, dataflow, image, music, video) · 62 tools = 69, all integrated
  states: sandbox → integrated | recycled — <data>/cos/state.json { state, at, failed[{gate, why}], holding[ids] }
  nesting: gating a compartment gates everything inside it; a parent is integrated only when its own gates pass AND every
    compartment inside is integrated (holding names the ones keeping it back). nested:false gates one alone and judges
    what is inside by its last recorded state.
  canvas gates: boundary (no domain word in kernel/, runtime/, index.html, scripts.js) · scripts (every listed file exists)
  domain gates:
    charter  domain.json is eravos.domain/1 with id (= folder), label, version; its core files exist; its starter tools are its own
    loader   index.js loads files that exist; tools/index.js loads exactly the tools in its folder (none missing, none stale)
    listed   tools/index.js ships it (ERAVOS_DOMAINS)
    walls    its own code (core/, domain.js, index.js) never reaches into another domain's folder, nor out with ../
  tool gates:
    manifest  tool.json has id/version/label/domain/category; id = eravos.<folder> (or eravos.<domain>.<folder>);
              every file it names exists
    shape     <tool>.engine.js · <tool>.spec · <tool>.test.js · packs/
    sealed    its code reaches nothing outside its folder: no ../ paths, no require/import, no other tool's files
    packs     every preset sets only settings the tool has — read from its REAL descriptor (the engine run in a vm
              sandbox where every SDK global is a stand-in; define() captured), plus the settings its domain's SDK adds
    spec      its spec names it
    deep: tests (its own suites in Chromium via tests/run.mjs <label>) · sound (tests/tool-audio.mjs <id>)
  archetype <out>: the COS eravos-canvas archetype generated from this repo (canvas/, schemas/, templates/, build tools,
    host/, archetype.json with detection rules, the nested layout, gates, every domain and tool) — never a stale copy
  stripped (1.1): snapshots / diff / restore — git keeps history

glass (host/glass.js) — Clear Glass, made ERAVOS:
  start({ root, port = 4747, data? }) → { url, port, stream, cos, close }   loopback only · data: COS state (default <root>/.eravos)
  serves the folder like serve.js (same address → same saves) and puts window.ERAVOS_GLASS in every HTML page's <head>
  GET /glass/health · /glass/signatures · /glass/events?replay=n[&role=page] (SSE: { seq, type, data })
  POST /glass/cmd { type, data } → { ok, result } | { ok:false, error }   needs header X-Eravos-Glass: 1 (403 without),
    404 unknown command, 400 bad data, 409 no canvas open, 504 the canvas did not answer (8 s)
  POST /glass/reply (the page's answers) · /glass/emit (page:* events only)
  canvas.* commands travel to the open page (event canvas:cmd {id, cmd, data}) and wait for its reply:
    canvas.tools · canvas.state · canvas.spawn {tool, preset?, x?, y?} · canvas.set {instanceId, key+value | params} ·
    canvas.preset {instanceId, name} · canvas.wire {from, to} · canvas.unwire {wireId} · canvas.close {instanceId} ·
    canvas.suite {tool, instanceId?}
  cos.* commands run in the host: cos.list (the tree) · cos.gate {id, deep?} (it and everything inside; eravos.canvas = all)
  stripped (1.1): the ledger file (the ring of 1000 serves late listeners), glass.signatures (GET /glass/signatures does it)

glass-link (canvas/runtime/glass-link.js, domain-free):
  only when window.ERAVOS_GLASS exists: joins /glass/events as the page, carries out canvas.* the way a person would
  (spawn, ui:config_change / ui:preset_load, kernel wires, ToolPage.loadSuite — undoable, saved), refuses unknown tools,
  settings and presets by name, and reports page:opened / page:closed / page:wired back

desktop (ERAVOS.exe):
  main.js starts Glass on 127.0.0.1:4748 (ERAVOS_GLASS_PORT; ERAVOS_GLASS=0 turns it off) with COS state in .appdata/eravos;
  eravos://app/glass/* is passed to it (same origin for the page); preload exposes ERAVOS_GLASS; build ships host/ beside
  canvas/ and tools/ (never served to the page). Not yet run in Electron here (no Electron in this container).

cli: node host/eravos.mjs glass [--port] [--open] · send <command> [json] · cos list (the tree) · cos gate [id] [--deep]
  (no id = the whole tree) · cos archetype <out>

next: the Ollama DJ (pinned) drives the canvas through POST /glass/cmd — canvas.state to listen, canvas.set to turn knobs.

tests: tests/host.test.mjs (node; Chromium for Glass end to end)

3.48 (specs/eravos.suites.spec, mapped): suites join the tree as grouping compartments under their domain —
  eravos.domain.<d> › eravos.suite.<d>.<name> — gates: members · wiring · scenes; integrated when its gates pass and every
  part tool is integrated. Tools stay children of their domain; a suite only lists them.
