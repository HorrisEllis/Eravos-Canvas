/* ERAVOS runtime — updates.js (3.99) → window.Updates. Domain-free.
 * Asked: "an update service to check GitHub for updates with a toast asking to update it".
 * In the app (desktop/updater.js does the checking and the swap): when a newer release is out, a toast stays until answered —
 *   Update now (downloads it, puts it in place, ERAVOS restarts — your projects and exports stay) · What's new · Later (this version
 *   is not asked again). ⋯ Options → Check for updates asks now.
 * In a browser (no app around it) the same check runs against GitHub; Update now opens the release page.
 *   Updates.show(info) · check() · REPO */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const REPO = 'HorrisEllis/Eravos-Canvas', D = () => global.eravosDesktop, SKIP = 'eravos.update.skip';
  let card = null;
  const say = (m, k, ms) => { if (global.Shell && global.Shell.toast) global.Shell.toast(m, k || '', ms || 4000); };
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  function close() { if (card) { card.remove(); card = null; } }
  function show(u) {
    if (!u || !u.version) return null; close();
    const box = doc.body;   // its own place (top right): the toasts list drops its oldest, and this one stays until answered
    card = el('div', 'toast upd-toast'); card.setAttribute('role', 'alertdialog'); card.setAttribute('aria-label', 'Update available');
    const head = el('div', 'upd-head'); head.append(el('b', '', 'ERAVOS ' + u.version + ' is out'), el('span', 'upd-cur', u.current ? 'you have ' + u.current : ''));
    const notes = el('div', 'upd-notes', (u.notes || '').split('\n').filter(Boolean).slice(0, 4).join(' · ')); notes.hidden = !u.notes;
    const row = el('div', 'upd-row'), go = el('button', 'tb-btn pri', 'Update now'), what = el('button', 'tb-btn', 'What’s new'), later = el('button', 'tb-btn', 'Later');
    [go, what, later].forEach(b => { b.type = 'button'; row.appendChild(b); });
    go.onclick = async () => {
      if (D() && D().installUpdate) { go.disabled = true; go.textContent = 'Downloading…'; const ok = await D().installUpdate(); if (!ok) { go.disabled = false; go.textContent = 'Update now'; } }
      else if (u.page) global.open(u.page, '_blank');
    };
    what.onclick = () => { if (u.page) global.open(u.page, '_blank'); };
    later.onclick = () => { try { global.localStorage.setItem(SKIP, u.version); } catch (e) {} close(); };
    card.append(head, notes, row); box.appendChild(card); return card;
  }
  function onMessage(m) {
    if (!m) return;
    if (m.state === 'available') { let skip = null; try { skip = global.localStorage.getItem(SKIP); } catch (e) {} if (skip !== m.version || m.manual) show(m); }
    else if (m.state === 'current') say('ERAVOS ' + m.version + ' is the newest.', 'good');
    else if (m.state === 'downloading') say('Downloading ERAVOS ' + m.version + '…', '', 6000);
    else if (m.state === 'restarting') say('ERAVOS ' + m.version + ' is ready — restarting…', 'good', 6000);
    else if (m.state === 'error') say('Could not check for updates: ' + m.message, 'bad');
  }
  // a browser: ask GitHub directly (the page's own version is the app's when it runs inside it; here, the newest release seen before)
  async function webCheck(manual) {
    try {
      const r = await global.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } }); if (!r.ok) throw new Error('GitHub said ' + r.status);
      const rel = await r.json(), v = String(rel.tag_name || '').replace(/^v/i, ''); let seen = null; try { seen = global.localStorage.getItem('eravos.update.seen'); } catch (e) {}
      if (!seen) { try { global.localStorage.setItem('eravos.update.seen', v); } catch (e) {} if (manual) onMessage({ state: 'current', version: v }); return; }
      if (seen !== v) onMessage({ state: 'available', version: v, current: seen, notes: rel.body, page: rel.html_url, manual });
      else if (manual) onMessage({ state: 'current', version: v });
    } catch (e) { if (manual) onMessage({ state: 'error', message: e.message }); }
  }
  async function check() {
    if (D() && D().checkUpdate) { const u = await D().checkUpdate(); if (u) onMessage(Object.assign({ state: 'available', manual: true }, u)); return u; }
    return webCheck(true);
  }
  function entry() {
    const slot = doc.getElementById('slot-options'); if (!slot) return false; if (doc.getElementById('updBtn')) return true;
    const b = el('button', 'tb-btn', 'Check for updates'); b.id = 'updBtn'; b.type = 'button'; b.title = 'ask GitHub for a newer ERAVOS';
    b.onclick = () => { const m = doc.getElementById('optMenu'); if (m) m.hidden = true; check(); };
    slot.appendChild(b); return true;
  }
  function boot() {
    if (!entry()) { setTimeout(boot, 300); return; }
    if (D() && D().onUpdate) D().onUpdate(onMessage);
    else if (/^https?:$/.test(global.location.protocol) && !global.ERAVOS_NO_UPDATE_CHECK) setTimeout(() => webCheck(false), 20000);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
  global.Updates = { show, check, close, REPO };
})(typeof window !== 'undefined' ? window : globalThis);
