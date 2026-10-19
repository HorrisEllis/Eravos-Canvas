#!/usr/bin/env node
/* ERAVOS local server — Node built-ins only. No dependencies.
 * Why: browsers grant MIDI, microphone and reliable storage to http://localhost, not to file:// pages
 * (Firefox refuses Web MIDI on file:// entirely). Serves this folder at a FIXED address, because browser
 * storage (autosaves, presets, samples) is keyed to the address — a changing port would orphan your saves.
 *   node serve.js            → http://localhost:4747
 *   node serve.js --open     → also opens it in your default browser
 *   node serve.js --port 5000
 * 3.48: it is ERAVOS Glass (host/glass.js) — the same server ERAVOS.exe runs inside itself — so the web build and the
 * app have the same canvas, the same event stream and the same command door (/glass/…). Nothing one has, the other lacks.
 * Binds 127.0.0.1 (and ::1 when the machine has IPv6) only: nothing on your network can reach it. */
'use strict';
const { exec } = require('child_process');
const argv = process.argv.slice(2);
const PORT = (() => { const i = argv.indexOf('--port'); const p = i >= 0 ? parseInt(argv[i + 1], 10) : 4747; return p > 0 && p < 65536 ? p : 4747; })();
const OPEN = argv.includes('--open');
const URL = `http://localhost:${PORT}/`;
function openBrowser() {
  const cmd = process.platform === 'win32' ? `start "" "${URL}"` : process.platform === 'darwin' ? `open "${URL}"` : `xdg-open "${URL}"`;
  exec(cmd, (e) => { if (e) console.log('Open this in your browser: ' + URL); });
}
require('./host/glass.js').start({ root: __dirname, port: PORT, also: ['::1'] }).then((g) => {
  console.log(`ERAVOS is running at ${URL}${g.also ? '' : '  (IPv4 only)'}`);
  console.log('Keep this window open while you make music. Close it (or press Ctrl+C) to stop.');
  if (OPEN) openBrowser();
}).catch((e) => {
  if (e.code === 'EADDRINUSE') {   // most likely ERAVOS is already running — reuse it rather than move port (saves are per address)
    console.log(`Port ${PORT} is already in use — ERAVOS is probably already running at ${URL}`);
    if (OPEN) openBrowser(); else process.exitCode = 1; return;
  }
  console.error('ERAVOS could not start: ' + e.message); process.exitCode = 1;
});
