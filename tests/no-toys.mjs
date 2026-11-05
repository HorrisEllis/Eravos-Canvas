// node tests/no-toys.mjs — ERAVOS instruments are instruments, not toys replaying sounds.
// James, 2026-11-05: "It's not a toy replaying sounds" · "I want it to stay that way. No toys."
// Fails when:
//   1. a recording is shipped with ERAVOS (an audio file, or audio baked into code as a data: URI or base64 WAV/MP3/OGG header)
//   2. a tool's code loads recorded audio (decodeAudioData, new Audio(…), fetch of an audio file) — except the tools whose job IS
//      your own audio (SAMPLERS below), which only ever get it from you: a drop, the drop folder, the microphone, a recording.
// Allowed, because it is synthesis: buffers a tool fills in code (seeded noise for air/breath/chiff, impulse responses, wave
// tables) and buffers of the tool's own live signal (e.g. Dub Station's reverse). Wobble Bass makes every note live from
// oscillators, filters and shapers; this keeps every instrument that way.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// tools whose job is the user's own audio (and the core that decodes what the user drops in, and her own voice store)
const SAMPLERS = new Set([
  'tools/music/tools/voice-and-samples/sample-player', 'tools/music/tools/voice-and-samples/clip-maker',
  'tools/music/tools/drums-and-rhythm/pads', 'tools/music/tools/arrange/timeline', 'tools/music/tools/arrange/song-recorder',
]);
const CORE = new Set(['tools/music/core/audio.js', 'tools/music/data/her-voice.js', 'tools/music/data/songbook.js']);   // + Songs › My songs plays back your own saved bounce
const SKIP = /(^|\/)(node_modules|\.git)(\/|$)|^(dist|\.eravos|voice|projects|exports|drop|packs|\.appdata|tests\/null-baseline|tests\/out)(\/|$)/;   // your own folders (top level), never a tool's packs/
const AUDIO_FILE = /\.(wav|mp3|ogg|oga|flac|aif|aiff|m4a|aac|opus|wma)$/i;
const BAKED = /data:audio\/|UklGR[a-zA-Z0-9+/]{20,}|SUQz[a-zA-Z0-9+/]{40,}|T2dnUw[a-zA-Z0-9+/]{20,}/;   // data URI · base64 'RIFF' · 'ID3' · 'OggS'
const LOADS = /\bdecodeAudioData\s*\(|\bnew\s+Audio\s*\(|fetch\s*\(\s*[^)]*\.(wav|mp3|ogg|flac|m4a|opus)\b/i;
const shipped = [], loads = [], baked = [];
(function walk(dir) {
  for (const n of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = dir ? dir + '/' + n : n; if (SKIP.test(rel)) continue;
    const st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) { walk(rel); continue; }
    if (AUDIO_FILE.test(n)) { shipped.push(rel); continue; }
    if (!/^(canvas|tools)\//.test(rel) || !/\.(m?js|json)$/.test(n) || /\.test\.js$/.test(n)) continue;
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (BAKED.test(src)) baked.push(rel);
    if (LOADS.test(src) && !CORE.has(rel) && ![...SAMPLERS].some(s => rel.startsWith(s + '/')) && !/\/vendor\//.test(rel)) loads.push(rel);
  }
})('');
const bad = [['a recording is shipped', shipped], ['audio baked into code', baked], ['an instrument loads recorded audio', loads]].filter(([, l]) => l.length);
if (bad.length) { bad.forEach(([what, l]) => console.log('✗ ' + what + ':\n  ' + l.join('\n  '))); console.log('No toys: instruments make their sound live (see the top of tests/no-toys.mjs).'); process.exit(1); }
console.log('✓ no toys: no recordings shipped, none baked into code, no instrument loads recorded audio (' + SAMPLERS.size + ' sampler tools work only on your own audio)');
