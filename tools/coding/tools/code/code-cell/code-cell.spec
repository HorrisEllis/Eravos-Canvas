# spec_id: eravos.organism.coding.code-cell · version 1.0.0 · phase P37.1 · status BUILT · domain coding (Coding Environment)
identity:
  id: eravos.coding.code-cell ; label: Code Cell ; icon: ⌨ ; category: Code
  purpose: the one tool the Coding Environment stands on — your own code, running beside every other tool, wired in
    and out like any of them. Everything a "coding environment" grows into (cells that call cells, code that drives
    music or images, data pipelines) is built from wiring cells, not from new runtime.
contract:
  code: the BODY of an async function (input, log) — `return` sends the result on; `await` works; console.* captured.
  isolation: every run is a FRESH Web Worker (own thread; no DOM, canvas, kernel, other tools; no state between runs).
    Network (fetch, XMLHttpRequest, WebSocket, EventSource, importScripts) is removed unless "Network" is on — a
    convenience barrier, NOT a security boundary (a determined script can reach the network through other APIs);
    never paste code you don't trust.
  limits: time limit (100 ms – 60 s, default 2 s) → the worker is terminated and the run reported "stopped — time
    limit"; Stop terminates at once; Stop all (hard) stops a running cell; code ≤ 200 000 characters; log keeps 300 lines.
  results: undefined → nothing sent ("returned nothing"); functions/symbols → error; anything else is JSON-cloned and
    sent on "out" (json); text goes on "text" too (other values as pretty JSON text).
  errors: a thrown error, a syntax error or an un-cloneable result is a plain message in the log with its line number
    when known; the cell never takes the page down.
ports (data domain):
  in:  in (any type) → `input` · run (trigger) → run now
  out: out (json) · text (text)
params: auto (run on every input) · every (s, 0 = off) · timeout (ms) · network (off)
saved: the code (extra) + params; presets carry code (factory pack: pass-through, word count, JSON reshape, chord
  progression, fetch JSON, prompt builder).
acceptance (tests/p26-domains.test.js):
  - 2 + input returns 5 for input 3, sent on out; a string result goes on text and out
  - an infinite loop is stopped at the time limit, status "timeout", and the next run works
  - a thrown error is logged with a line number; nothing is sent
  - fetch is undefined when Network is off
  - wired: Code Cell → Code Cell carries the value; save/restore keeps the code
