/* ERAVOS runtime — updates.js (3.99, rebuilt 3.101) → window.Updates. Domain-free.
 * Asked: "an update service to check GitHub for updates with a toast asking to update it" · then "It needs to run in the background?
 * … It closes the canvas and then doesn't apply the update". One card (top right) follows the update through, and nothing closes
 * until you say so:
 *   available    ERAVOS X is out          Update · What's new · Later (not asked again for X)
 *   downloading  a bar, while you keep working          unpacking   getting it ready
 *   ready        ERAVOS X is ready        Restart now · When I close ERAVOS
 *   failed       what went wrong          Open the log      (applied: a toast "Updated to X")
 * The app (desktop/updater.js) does the work; in a browser, Update opens the release page. ⋯ Options → Check for updates asks now.
 *   Updates.show(info) · on(message) · check() · close() · REPO */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const REPO = 'HorrisEllis/Eravos-Canvas', D = () => global.eravosDesktop, SKIP = 'eravos.update.skip';
  let card = null, info = {};
  const say = (m, k, ms) => { if (global.Shell && global.Shell.toast) global.Shell.toast(m, k || '', ms || 4000); };
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const mb = (n) => (n / 1048576).toFixed(n > 104857600 ? 0 : 1) + ' MB';
  function close() { if (card) { card.remove(); card = null; } }
  function btn(text, cls, fn) { const b = el('button', 'tb-btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; b.onclick = fn; return b; }
  // the one card, drawn for a state
  function draw(state, u) {
    info = Object.assign({}, info, u || {});
    if (!card) { card = el('div', 'toast upd-toast'); card.setAttribute('role', 'alertdialog'); card.setAttribute('aria-label', 'ERAVOS update'); doc.body.appendChild(card); }
    card.innerHTML = ''; card.dataset.state = state;
    const head = el('div', 'upd-head'), row = el('div', 'upd-row'); card.append(head);
    const v = info.version || '';
    if (state === 'available') {
      head.append(el('b', '', 'ERAVOS ' + v + ' is out'), el('span', 'upd-cur', info.current ? 'you have ' + info.current : ''));
      if (info.notes) card.append(el('div', 'upd-notes', String(info.notes).split('\n').map(s => s.replace(/^[#*\-\s]+/, '')).filter(Boolean).slice(0, 4).join(' · ')));
      row.append(btn('Update', 'pri', () => {
        if (D() && D().downloadUpdate) { draw('downloading', {}); D().downloadUpdate(); }
        else if (D() && D().installUpdate) D().installUpdate();
        else if (info.page) global.open(info.page, '_blank');
      }), btn('What’s new', '', () => { if (info.page) global.open(info.page, '_blank'); }),
      btn('Later', '', () => { try { global.localStorage.setItem(SKIP, v); } catch (e) {} close(); }));
      card.append(el('div', 'upd-sub', D() && D().downloadUpdate ? 'It downloads in the background — keep working.' : ''));
    } else if (state === 'downloading' || state === 'unpacking') {
      const pct = info.total ? Math.round(100 * info.got / info.total) : 0;
      head.append(el('b', '', state === 'unpacking' ? 'Getting ERAVOS ' + v + ' ready…' : 'Downloading ERAVOS ' + v + '…'),
        el('span', 'upd-cur', state === 'downloading' && info.total ? mb(info.got) + ' of ' + mb(info.total) : ''));
      const bar = el('div', 'upd-bar'), fill = el('i'); fill.style.width = (state === 'unpacking' ? 100 : pct) + '%'; bar.appendChild(fill); card.append(bar, el('div', 'upd-sub', 'Keep working — ERAVOS stays open.'));
      row.append(btn('Hide', '', close));
    } else if (state === 'ready') {
      head.append(el('b', '', 'ERAVOS ' + v + ' is ready'));
      card.append(el('div', 'upd-sub', 'Restart now, or it goes in by itself when you next close ERAVOS. Your projects, exports and settings stay.'));
      row.append(btn('Restart now', 'pri', () => { draw('restarting', {}); D() && D().applyUpdate && D().applyUpdate(); }),
        btn('When I close ERAVOS', '', () => { D() && D().updateLater && D().updateLater(); close(); say('ERAVOS ' + v + ' goes in when you close ERAVOS.', 'good'); }));
    } else if (state === 'restarting') {
      head.append(el('b', '', 'Restarting into ERAVOS ' + v + '…')); card.append(el('div', 'upd-sub', 'ERAVOS Update puts it in place and starts ERAVOS again.'));
    } else if (state === 'failed') {
      head.append(el('b', '', 'The update to ' + v + ' did not go in')); card.append(el('div', 'upd-notes', info.message || ''));
      row.append(btn('Open the log', '', () => { D() && D().openUpdateLog && D().openUpdateLog(); }), btn('Try again', 'pri', () => { draw('downloading', {}); D() && D().downloadUpdate && D().downloadUpdate(); }), btn('Close', '', close));
    }
    if (row.children.length) card.append(row);
    return card;
  }
  function show(u) { if (!u || !u.version) return null; return draw('available', u); }
  function on(m) {
    if (!m) return;
    if (m.state === 'available') { let skip = null; try { skip = global.localStorage.getItem(SKIP); } catch (e) {} if (skip !== m.version || m.manual) draw('available', m); }
    else if (m.state === 'downloading' || m.state === 'unpacking') { if (card) draw(m.state, m); }
    else if (m.state === 'ready' || m.state === 'restarting' || m.state === 'failed') draw(m.state, m);
    else if (m.state === 'applied') { close(); say('Updated to ERAVOS ' + m.version + '.', 'good', 6000); }
    else if (m.state === 'on-close') say('ERAVOS ' + m.version + ' goes in when you close ERAVOS.', 'good');
    else if (m.state === 'current') say('ERAVOS ' + m.version + ' is the newest.', 'good');
    else if (m.state === 'error') { if (card && card.dataset.state !== 'available') close(); say('Update: ' + m.message, 'bad', 7000); }
  }
  // a browser: ask GitHub directly
  async function webCheck(manual) {
    try {
      const r = await global.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } }); if (!r.ok) throw new Error(r.status === 404 ? 'no release is published yet' : 'GitHub said ' + r.status);
      const rel = await r.json(), v = String(rel.tag_name || '').replace(/^v/i, ''); let seen = null; try { seen = global.localStorage.getItem('eravos.update.seen'); } catch (e) {}
      if (!seen) { try { global.localStorage.setItem('eravos.update.seen', v); } catch (e) {} if (manual) on({ state: 'current', version: v }); return; }
      if (seen !== v) on({ state: 'available', version: v, current: seen, notes: rel.body, page: rel.html_url, manual });
      else if (manual) on({ state: 'current', version: v });
    } catch (e) { if (manual) on({ state: 'error', message: e.message }); }
  }
  async function check() {
    if (D() && D().checkUpdate) { const u = await D().checkUpdate(); return u; }
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
    if (D() && D().onUpdate) D().onUpdate(on);
    else if (/^https?:$/.test(global.location.protocol) && !global.ERAVOS_NO_UPDATE_CHECK) setTimeout(() => webCheck(false), 20000);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
  global.Updates = { show, on, check, close, REPO };
})(typeof window !== 'undefined' ? window : globalThis);
