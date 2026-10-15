# ============================================================
# ERAVOS PHASE 11 — PRODUCTION GRADE ("anyone can use")
# spec_id:      eravos.phase11-production
# version:      1.0.0
# author:       James Brooks
# status:       canonical (living map — gates are ticked only with test evidence)
# created_at:   2026-09-27
# pack:         3.21.0-alpha.1 (P11 opened: M + L gates closed)
# ============================================================
#
# Intent (James, 2026-09-27): "i like how you can zoom in, i want this as professional and high leverage as possible,
#   like full production grade. anyone can use. also the permissions aren't working for the midi pad"
#
# Definition — ERAVOS is production grade when a first-time user, on a normal computer, can:
#   start it · make a track · fix mistakes · save and reopen it · export it · plug in a controller
#   without reading code, without a silent failure, and without losing work. Each gate below is one of those.

gates:
  L  launch:        one double-click start, stable address (storage keyed to it), works offline ........ CLOSED (3.21a1)
  M  MIDI:          controller works in Chrome/Edge/Firefox; every failure explains itself ................. CLOSED (3.21a1)
  U  undo:          Ctrl+Z / Ctrl+Shift+Z across the whole canvas (params, notes, clips, wires, windows) ... CLOSED (3.24a1, eravos.phase11-1-undo)
  E  errors:        every user-visible message is plain language; codes go to the fault log only ........... OPEN — P11.2
  S  save safety:   named projects, autosave recovery, save-before-close, project import across addresses . PARTIAL (autosave + .eravos.json exist)
  X  export:        WAV bounce (exists) + stems per track + MIDI export of note clips ....................... PARTIAL
  A  accessibility: keyboard reachable controls, ARIA labels on knobs/buttons, focus rings, reduced motion . OPEN (evidence: 0 ARIA attributes)
  P  performance:   CPU budget per organism, voice limits, no dropouts at 20 organisms on a mid laptop ...... UNMEASURED
  F  effects:       remaining specced FX: EQ, Dynamics, Glitch, Pitch, FX Box ............................... OPEN
  D  drums:         drum-lane view in the timeline (pad names, not piano keys) ................................ OPEN

order (nearest gap first, §16.1 — what blocks "anyone" hardest):
  P11.1 U undo   → a mistake nobody can take back is the #1 reason non-experts quit a tool
  P11.2 E errors → internal codes in toasts (e.g. "WIRE_005 port_kind…") read as "it's broken"
  P11.3 S save   → origin move file:// → localhost leaves old autosaves behind (see L-03)
  P11.4 A access · P11.5 P perf (measure first) · F / D / X features

# ------------------------------------------------------------ closed in 3.21.0-alpha.1
M-01: Firefox refuses Web MIDI on file:// pages (it gates MIDI behind a per-site permission add-on; localhost is exempt and
      prompts normally). Evidence: Mozilla intent-to-ship + bug 1752906; James's screenshot shows Firefox on file:///D:/…
      fix: launcher (L-01) + mapper diagnoses Firefox-on-file and says exactly what to do.
M-02: mapper called requestMIDIAccess at mount with no user gesture → refused/ignored, generic error.
      fix: auto-connect only when permissions.query says granted; otherwise the Connect button (a gesture) asks.
M-03: failures were one generic line ("MIDI not available: <browser text>").
      fix: explainMidi(err, env) → plain cause + numbered steps, per browser/case: Safari (no Web MIDI), insecure page,
      Firefox file://, Firefox add-on rejection (= no device at Firefox start, or declined), blocked permission, other.
M-04: Firefox only sees MIDI devices present when Firefox started; "connected, 0 inputs" was silent.
      fix: explicit warning with the restart step on Firefox.
L-01: no way to run ERAVOS except opening index.html from disk.
      fix: serve.js (Node built-ins only) + "Start ERAVOS.bat" (Windows) + start-eravos.sh (macOS/Linux) → http://localhost:4747
      fixed port on purpose (browser storage is per address); already-running → reuses it instead of moving port;
      loopback only (127.0.0.1 and ::1 — Windows often resolves localhost to ::1); path traversal refused; node_modules hidden.
L-02: README.md — how to start, MIDI per browser, where saves live.
L-03: KNOWN: saves made under file:// live in that address's storage and do not appear at localhost.
      workaround (documented): open the old file:// page once → Session → Save (.eravos.json) → open it at localhost.
      proper fix is P11.3.
