# ============================================================
# ERAVOS PHASE 12 — DESKTOP CANVAS (ERAVOS.exe)
# spec_id:      eravos.phase12-desktop
# version:      1.0.0
# author:       James Brooks
# status:       canonical
# created_at:   2026-09-27
# pack:         3.22.0-alpha.1
# supersedes:   phase11 gate L's launcher as the primary way to run (serve.js stays for browser/dev use)
# ============================================================
#
# Intent (James, 2026-09-27): "it doesn't need node. it needs to be a canvas. or make the canvas an exe. i want the canvas
#   a exe. then all the rest drag and drop either on the canvas, or in the folder."

shape:
  ERAVOS.exe: the canvas — its own window, no browser, no Node, no installer (portable folder; runs from anywhere)
  runtime:    Electron (Chromium: Web Audio, AudioWorklet, Web MIDI identical to Chrome) — same stack as MASTERMIND/CodeFactory
  origin:     eravos://app/ — privileged standard+secure scheme → stable origin (saves persist), secure context (MIDI/mic),
              served straight from the app folder; nothing listens on any port
  permissions: granted by the app for its own origin only — midi, media (microphone); everything else denied;
              any other origin (links) opens in the system browser, never inside the canvas window

library ("the folder"): "ERAVOS Library" next to ERAVOS.exe (if that location is not writable, e.g. Program Files →
  Documents/ERAVOS Library). Created on first run with a READ ME.
  Drop Here/   anything placed here enters the canvas exactly like a canvas drop (sounds, .mid, packs .zip, projects
               .eravos.json) — at start and live while running. Files are never moved or deleted; an import ledger
               (.imported.json: name+size+mtime) prevents taking the same file twice (§0.3).
  Packs/       every .zip here installs on every start → tools/extensions persist. A pack dropped on the canvas is copied here.
  Projects/    Session → Save writes here (no download dialog).
  Exports/     Bounce / recordings (.wav, .mid, other) write here.
  .appdata/    browser storage (autosave, presets, samples) — lives in the folder, so the whole ERAVOS folder is copyable.

host bridge (renderer, runtime/desktop-bridge.js, domain-free, inert in a normal browser):
  window.eravosDesktop (preload, contextIsolation): library paths · onFile(cb) · keepPack(name, bytes) · openLibrary()
  files from the folder → ShellIntake.file(name, bytes, mime, centre-of-view)

window: single instance (second launch focuses the first) · size/position remembered · F11 full screen ·
        Ctrl+Shift+I dev tools · menu hidden (Alt shows it)

build: desktop/build.mjs assembles ERAVOS-win-x64/ from the official Electron win32-x64 release (ERAVOS.exe = renamed
       electron.exe, app in resources/app). No code signing yet → Windows SmartScreen shows "More info → Run anyway"
       on first launch (declared; signing needs a certificate James owns). Icon = Electron default until rcedit runs on Windows.

tests: electron smoke test on Linux (same main/preload): window opens eravos://app/, no page errors, midi permission
       granted & query → granted, Drop Here file lands on the canvas, Packs zip installs at start, Save lands in Projects,
       foreign origins blocked.

evidence (3.22.0-alpha.1, Electron 44.4.5 on Linux under Xvfb, driving the ASSEMBLED resources/app from build.mjs):
  window loads eravos://app/index.html · desktop bridge active · zero page errors
  Packs/hello-pack.zip installed at start with no prompt (its code ran once)
  Drop Here/kick.wav at start → Sample Player on the canvas + toast ; snare.wav copied in while running → taken in live
  .imported.json ledger written only after a successful take-in
  navigator.permissions midi → "granted"; requestMIDIAccess reached the OS layer (this container has no MIDI subsystem:
    InvalidStateError "Platform dependent initialization failed" — now diagnosed in plain words, incl. Windows exclusive-device)
  Save (.eravos.json) → Projects/, .wav → Exports/, confirmation toasts
  navigation to https://example.com from inside the window refused (stays on eravos://app)
  bug found & fixed during the run: Node's URL gives origin "null" for custom schemes → permission check refused MIDI;
    now compares scheme + host
NOT verified here (needs a Windows machine): ERAVOS.exe launch itself, SmartScreen flow, real USB MIDI device.
