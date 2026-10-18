#!/usr/bin/env node
/* Her recordings → voice/voice.js, which ERAVOS loads on start (data/her-voice.js adds each one once):
 *   put her recordings in voice/ (m4a, mp3, wav, ogg), then:  node build/voice-bundle.mjs
 * An .m4a also gets an .mp3 copy beside it in the bundle when ffmpeg is installed (some browsers can't read m4a).
 * voice/ is in .gitignore: her voice never goes into the repository. */
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DIR = path.join(ROOT, 'voice');
const MIME = { m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac' };
if (!fs.existsSync(DIR)) { fs.mkdirSync(DIR); console.log('made voice/ — put her recordings in it and run this again'); process.exit(0); }
const out = [];
for (const f of fs.readdirSync(DIR).sort()) {
  const ext = path.extname(f).slice(1).toLowerCase(); if (!MIME[ext]) continue;
  const name = path.basename(f, path.extname(f)).replace(/\s*-\s*Copy$/i, '').replace(/_/g, ' ');
  const files = [{ mime: MIME[ext], data: fs.readFileSync(path.join(DIR, f)).toString('base64') }];
  if (ext === 'm4a' || ext === 'aac') { try { files.push({ mime: 'audio/mpeg', data: execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(DIR, f), '-b:a', '256k', '-f', 'mp3', '-'], { maxBuffer: 1 << 28 }).toString('base64') }); } catch (e) {} }
  out.push({ name, files });
}
fs.writeFileSync(path.join(DIR, 'voice.js'), '/* her recordings (build/voice-bundle.mjs) — loaded by tools/music/data/her-voice.js */\nwindow.ERAVOS_VOICE = ' + JSON.stringify(out) + ';\n');
console.log(out.length + ' recording(s) → voice/voice.js: ' + out.map(o => o.name).join(', '));
