#!/usr/bin/env node
/* The competence and ownership register (his words, 2026-11-06T07:27:37Z: "Also ideas, choices and direction. All of me and what’s proof of
 * competence and ownership, I want logged to a compotenxe and log. Timestamped and what came from it. The date and quotes exactly.")
 *   docs/competence/register.jsonl   the record — one entry a line, APPEND-ONLY (a correction is a new entry with "amends": <id>)
 *   node build/competence.mjs          → docs/competence/REGISTER.md (by the five parts) and LOG.md (by time)
 *   node build/competence.mjs --check [--base <git ref>]  fails if: an entry already committed (at HEAD, or the base: CI uses the target branch) was changed or removed · a quote of his is not,
 *                                      word for word, in the source it names · a field is missing · a confidence is not one of the three levels
 * The ledger records evidence. It doesn't manufacture worth. (adopted by him from a pasted reply, 2026-11-06 — not his words)
 * Confidence is never one score: proposed (an idea) · demonstrated (built and tested here) · independently verified (outside validation). */
import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DIR = path.join(ROOT, 'docs', 'competence'), REG = path.join(DIR, 'register.jsonl');
const CHECK = process.argv.includes('--check'), bi = process.argv.indexOf('--base'), BASE = bi > 0 ? process.argv[bi + 1] : 'HEAD';   // CI: --base origin/main (what is already merged)
const raw = fs.readFileSync(REG, 'utf8'), lines = raw.split('\n').filter(Boolean), E = lines.map((l, i) => { try { return JSON.parse(l); } catch (e) { fail(`line ${i + 1}: not JSON`); } });
const LEVELS = ['proposed', 'demonstrated', 'independently verified'], NEED = ['id', 'at', 'said_by', 'origin', 'type', 'quote', 'development', 'outcome', 'evidence', 'confidence', 'source'];
let bad = 0; function fail(m) { bad++; console.error('✗ ' + m); }
// ---- append-only, against what git already holds
let before = []; try { before = execSync(`git show ${BASE}:docs/competence/register.jsonl`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n').filter(Boolean); } catch (e) { /* not committed yet */ }
before.forEach((l, i) => { if (lines[i] !== l) fail(`entry ${i + 1} (${(JSON.parse(l) || {}).id}) was changed or removed — the register is append-only: add a new entry with "amends"`); });
// ---- every entry: its fields, its level, and his quotes found word for word in their source
const ids = new Set();
E.forEach((e, i) => {
  NEED.forEach(k => { if (e[k] === undefined || e[k] === '') fail(`${e.id || 'line ' + (i + 1)}: missing ${k}`); });
  if (ids.has(e.id)) fail(`${e.id}: id used twice`); ids.add(e.id);
  if (e.origin !== 'external' && !LEVELS.includes(e.confidence)) fail(`${e.id}: confidence "${e.confidence}" is not one of ${LEVELS.join(' / ')}`);
  if (e.amends && !E.slice(0, i).some(x => x.id === e.amends)) fail(`${e.id}: amends ${e.amends}, which is not an earlier entry`);
  if (e.said_by === 'James Brooks') {
    const src = path.join(ROOT, e.source); if (!fs.existsSync(src)) fail(`${e.id}: source ${e.source} not found`);
    else if (!fs.readFileSync(src, 'utf8').includes(e.quote)) fail(`${e.id}: the quote is not word for word in ${e.source}: "${e.quote.slice(0, 80)}…"`);
  }
});
if (CHECK) { if (bad) { console.error(`${bad} problem(s) in the register`); process.exit(1); } console.log(`✓ competence register: ${E.length} entries, append-only, every quote of his found word for word in its source`); process.exit(0); }
if (bad) process.exit(1);
// ---- the pages
const PARTS = [
  ['Ideas', 'what he originated, proposed or identified', (e) => e.origin === 'user' && ['idea', 'principle', 'observation'].includes(e.type)],
  ['Choices and direction', 'decisions, the alternatives in front of him, and the way he set', (e) => e.origin === 'user' && ['decision', 'direction'].includes(e.type)],
  ['Competence', 'what is shown, at its own level — an idea, a built and tested idea, and outside validation are not the same thing', (e) => e.origin === 'user'],
  ['Ownership and provenance', 'whose each contribution is: his, the AI coder’s, or from outside', () => true],
  ['Outcomes', 'what came of each', (e) => !!e.outcome],
];
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const when = (e) => e.at.replace('T', ' ').replace(/\.\d+Z$|Z$/, ' UTC');
const ev = (e) => (e.evidence || []).map(x => '`' + x + '`').join(' · ');
let md = `# Competence and ownership register — James Brooks · ERAVOS

> His words (${when({ at: '2026-11-06T07:27:37.950Z' })}): "Also ideas, choices and direction. All of me and what’s proof of competence and ownership, I want logged to a compotenxe and log. Timestamped and what came from it. The date and quotes exactly."
>
> Adopted with it, from a reply he pasted (not his words): "The ledger records evidence. It doesn't manufacture worth."

**How to read it.** Each entry is one contribution: the exact words (checked word for word against their source by \`node build/competence.mjs --check\`), when, who it came from, what kind of thing it was, how it developed, what came of it, and the evidence a stranger can check. **Confidence is three separate levels, never one score**: *proposed* (an idea) · *demonstrated* (built and tested here — built by the AI coder to his direction: the idea and the call are his, the code is not claimed as his) · *independently verified* (validated outside this project — none yet). **Append-only**: an entry is never edited; a correction is a new entry that amends it. Generated from \`docs/competence/register.jsonl\` — do not edit this page. The record before this register (merged work since 2026-10-15, with merge times): \`docs/PROOF-OF-COMPETENCY.md\`.

`;
const counts = {}; E.forEach(e => { counts[e.origin] = (counts[e.origin] || 0) + 1; });
const lv = {}; E.filter(e => e.origin === 'user').forEach(e => { lv[e.confidence] = (lv[e.confidence] || 0) + 1; });
md += `**${E.length} entries** · his: ${counts.user || 0} (${LEVELS.map(l => `${lv[l] || 0} ${l}`).join(' · ')}) · the AI coder’s: ${counts.ai || 0} · outside: ${counts.external || 0}\n\n`;
PARTS.forEach(([title, sub, pick]) => {
  const xs = E.filter(pick); md += `## ${title}\n_${sub}_\n\n`;
  if (title === 'Competence') {
    LEVELS.forEach(l => { const ys = xs.filter(e => e.confidence === l); md += `**${l}** (${ys.length})\n\n` + (ys.length ? ys.map(e => `- ${e.id} · ${when(e)} · ${e.type} — “${e.quote}” → ${e.outcome} · evidence: ${ev(e)}`).join('\n') : '- none yet') + '\n\n'; });
    return;
  }
  if (title === 'Ownership and provenance') {
    md += '| id | when | from | said by | what |\n|---|---|---|---|---|\n' + xs.map(e => `| ${e.id} | ${when(e)} | ${e.origin} | ${esc(e.said_by)} | ${esc(e.type)}${e.alternatives ? ' — chosen from: ' + esc(e.alternatives.join(' · ')) : ''} |`).join('\n') + '\n\n';
    return;
  }
  md += '| id | when | his words (exact) | type | how it developed | what came of it | evidence | level |\n|---|---|---|---|---|---|---|---|\n' +
    xs.map(e => `| ${e.id} | ${when(e)} | “${esc(e.quote)}” | ${e.type}${e.alternatives ? '<br>from: ' + esc(e.alternatives.join(' · ')) : ''} | ${esc(e.development)} | ${esc(e.outcome)} | ${esc(ev(e))} | ${e.confidence} |`).join('\n') + '\n\n';
});
fs.writeFileSync(path.join(DIR, 'REGISTER.md'), md);
const log = `# Competence log — by time\n\nEvery entry of \`docs/competence/register.jsonl\`, oldest first (generated by \`node build/competence.mjs\`; the register is append-only). Times are UTC from the session transcript.\n\n` +
  E.slice().sort((a, b) => a.at.localeCompare(b.at)).map(e => `### ${when(e)} — ${e.id} · ${e.type} · ${e.origin === 'user' ? 'his' : e.origin === 'ai' ? 'the AI coder’s' : 'from outside'}\n> ${String(e.quote).split('\n').join('\n> ')}\n\n- said by: ${e.said_by}\n- developed: ${e.development}\n- came of it: ${e.outcome}\n- evidence: ${ev(e)}\n- level: ${e.confidence}${e.amends ? '\n- amends: ' + e.amends : ''}\n`).join('\n');
fs.writeFileSync(path.join(DIR, 'LOG.md'), log);
console.log(`competence register: ${E.length} entries → docs/competence/REGISTER.md, LOG.md`);
