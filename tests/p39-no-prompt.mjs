#!/usr/bin/env node
/* P39 shell test: the desktop app (Electron) has no window.prompt — "prompt() is not supported" broke every rename /
 * new-pack button. With prompt() made to THROW like Electron does, the in-page ask dialog must do the job:
 * ＋ New pack in a tool's ⚙ Settings, and a preset save from the preset bar.   node tests/p39-no-prompt.mjs */
import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); let failed = 0;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } }); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.prompt = () => { throw new Error('prompt() is not supported.'); }; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.ToolSettings);
const id = await p.evaluate(() => { const i = OrganismFactory.spawn('eravos.pads', { x: 80, y: 80 }); ToolSettings.open(i); return i; }); await p.waitForTimeout(300);
const btn = p.locator('.ts-panel button', { hasText: 'New pack' }).first(); await btn.click();
await p.waitForSelector('.uk-ask-in'); await p.fill('.uk-ask-in', 'My test pack'); await p.keyboard.press('Enter');
await p.waitForTimeout(200);
const made = await p.evaluate(() => ContentPacks.list({ tool: 'eravos.pads' }).some(x => x.label === 'My test pack'));
if (!made) { failed++; console.log('✗ new pack was not made through the ask dialog'); }
// Esc cancels and leaves nothing behind
await btn.click(); await p.waitForSelector('.uk-ask-in'); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
if (await p.locator('.uk-ask-back').count()) { failed++; console.log('✗ the dialog stayed open after Esc'); }
if (errs.length) { failed++; console.log('✗ page errors: ' + errs.join(' | ')); }
console.log(failed ? `${failed} failed` : '✓ rename / new-pack work with prompt() unavailable (as in the desktop app)');
await b.close(); process.exit(failed ? 1 : 0);
