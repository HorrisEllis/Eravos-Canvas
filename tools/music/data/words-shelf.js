/* ERAVOS music data — words-shelf.js → window.WordsShelf (3.232, 2026-11-26). His words: "I am a good writer. It would be cool to be able to import
 * my words." His writing, brought in as it is: plain text (.txt), Markdown (.md — a Notion export's pages included: the title from its heading,
 * the page id Notion adds to file names dropped, links and bold marks removed, an index page of links skipped), or a .zip of those (a whole
 * Notion export). Kept on this computer only (never shipped, never sent anywhere); a stanza break (a blank line) is kept as he wrote it.
 *   WordsShelf.list() → [{ id, title, text, at, source }] · add(title, text, source) · remove(id) · get(id)
 *   WordsShelf.importFiles(files) → Promise<{ added: [titles], skipped: [names] }> (File / Blob with .name, from a file picker or a drop)
 *   WordsShelf.parse(name, raw) → { title, text } | null (pure, for tests) */
(function (root) {
  'use strict';
  const KEY = 'eravos.words.v1';
  const read = () => { try { return JSON.parse(root.localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; } };
  const write = (L) => { try { root.localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) {} };
  const NOTION_ID = /\s+[0-9a-f]{32}$/i;
  function parse(name, raw) {
    const base = String(name || '').split('/').pop().replace(/\.(md|markdown|txt)$/i, '').replace(NOTION_ID, '').trim();
    let lines = String(raw || '').replace(/\r/g, '').split('\n');
    let title = base;
    const h = lines.findIndex(l => l.trim());
    if (h >= 0 && /^#{1,6}\s/.test(lines[h])) { title = lines[h].replace(/^#+\s*/, '').trim(); lines = lines.slice(h + 1); }
    const body = lines.filter(l => l.trim()), links = body.filter(l => /^\s*\[[^\]]*\]\([^)]*\)\s*$/.test(l));
    if (body.length && links.length / body.length > 0.6) return null;   // an index of links, not writing
    const clean = lines.map(l => l.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*|__|(?<![A-Za-z])_(?=\S)|(?<=\S)_(?![A-Za-z])|`/g, '').replace(/^>\s?/, '').replace(/^\s*[-*]\s+/, '').replace(/<\/?[a-z][^>]*>/gi, '').replace(/\s+$/, ''));
    const text = clean.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!text) return null;
    return { title: title.replace(/[:：]\s*$/, '').trim() || 'Untitled', text };
  }
  function add(title, text, source) {
    const L = read(), t = String(title || 'Untitled').trim(), x = String(text || '').trim(); if (!x) return null;
    const same = L.find(r => r.title === t && r.text === x); if (same) return same;   // the same piece twice is kept once
    const r = { id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: t, text: x, at: new Date().toISOString(), source: source || '' };
    L.unshift(r); write(L); return r;
  }
  async function importFiles(files) {
    const added = [], skipped = [];
    const take = (name, raw, src) => { const p = parse(name, raw); if (!p) { skipped.push(name); return; } const r = add(p.title, p.text, src); if (r) added.push(r.title); };
    for (const f of Array.from(files || [])) {
      const name = f.name || 'words';
      if (/\.zip$/i.test(name)) {
        if (!root.Intake || !root.Intake.unzip) { skipped.push(name); continue; }
        let files2; try { files2 = await root.Intake.unzip(await f.arrayBuffer()); } catch (e) { skipped.push(name); continue; }
        for (const [n2, e] of files2) { if (!/\.(md|markdown|txt)$/i.test(n2)) continue; try { take(n2, new TextDecoder().decode(await e.data()), name); } catch (er) { skipped.push(n2); } }
      } else if (/\.(md|markdown|txt)$/i.test(name) || /^text\//.test(f.type || '')) take(name, await f.text(), name);
      else skipped.push(name);
    }
    return { added, skipped };
  }
  root.WordsShelf = { list: read, get: (id) => read().find(r => r.id === id) || null, add, remove: (id) => write(read().filter(r => r.id !== id)), importFiles, parse, KEY };
  if (typeof module === 'object' && module.exports) module.exports = root.WordsShelf;
})(typeof window !== 'undefined' ? window : globalThis);
