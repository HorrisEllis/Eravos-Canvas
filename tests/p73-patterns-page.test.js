/* 3.73 — James, 2026-10-24, on the Patterns page: "needs to be able to collapse tge catogaries. curves, deep drops. make it powerful." */
window.__phase = 'P73';
describe('🧩 Patterns page: families that fold, quick picks, sections (3.73)', () => {
  const L = () => PatternLibrary.all();
  const fresh = () => { try { localStorage.removeItem('eravos.patterns.page'); } catch (e) {} if (document.querySelector('.plib')) PatternLibrary.open(); const pg = PatternLibrary.open({ group: 'type' }); const ov = document.querySelector('.plib');   /* 3.82 the page opens by instrument; these are about sections by type */ ov.querySelector('.sbk-alt.sm:not(.plib-more)') && [...ov.querySelectorAll('button')].find(b => b.textContent === 'Clear').click(); return { pg, ov }; };
  const chips = (ov, sel) => [...ov.querySelectorAll(sel)];
  const typesShown = (ov) => new Set(chips(ov, '.plib-sec').map(s => s.dataset.sec));
  it('every genre belongs to a family; the deep-drop family holds Floor Falls and the tension studies', () => {
    const more = [...new Set(L().filter(p => PatternLibrary.familyOf(p.genre) === 'other').map(p => p.genre))];
    assert.equal(more.join(' · '), '', 'no genre left in More');
    ['hd-floor-falls', 'hd-heavy-drops', 'tension-drops', 'tension-study'].forEach(g => assert.equal(PatternLibrary.familyOf(g), 'deep', g));
    assert.equal(PatternLibrary.familyOf('ll-deep'), 'lost-love'); assert.equal(PatternLibrary.familyOf('dubstep-og'), 'dubstep');
  });
  it('genres start folded into families — no wall of chips; a caret opens one family, again folds it', () => {
    const { pg, ov } = fresh(); try {
      assert.ok(ov.querySelector('.plib-genres').hidden, 'no genre chips until a family opens');
      const fams = chips(ov, '.plib-fam'); assert.ok(fams.length >= 9 && fams.length <= 14, fams.length + ' families');
      ov.querySelector('.plib-fam[data-fam=dubstep] .plib-caret').click();
      const g = ov.querySelector('.plib-fgroup[data-fam=dubstep]'); assert.ok(g, 'dubstep opened'); assert.gt(g.querySelectorAll('.sbk-chip').length, 10);
      ov.querySelector('.plib-fam[data-fam=dubstep] .plib-caret').click();
      assert.ok(!ov.querySelector('.plib-fgroup[data-fam=dubstep]'), 'folded again');
    } finally { pg.close(); }
  });
  it('quick picks: Deep drops → only the deep family; Curves → only curves', () => {
    const { pg, ov } = fresh(); try {
      chips(ov, '.plib-q').find(b => /Deep drops/.test(b.textContent)).click();
      const want = L().filter(p => PatternLibrary.familyOf(p.genre) === 'deep').length;
      assert.ok(new RegExp('^' + want + ' shown').test(ov.querySelector('.sbk-row2 > .sbk-sub:last-child').textContent), 'all ' + want + ' deep ones');
      assert.ok(chips(ov, '.plib-card small:not(.plib-song)').every(s => /Floor Falls|Heavy Drops|Tension/.test(s.textContent)), 'only the deep family');
      chips(ov, '.plib-q').find(b => /Curves/.test(b.textContent)).click();
      assert.deepEqual([...typesShown(ov)], ['curve'], 'deep curves only');
      chips(ov, '.plib-q').find(b => /Deep drops/.test(b.textContent)).click();   // off again
      assert.equal(chips(ov, '.plib-card').length, Math.min(24, L().filter(p => p.type === 'curve').length), 'every curve');
    } finally { pg.close(); }
  });
  it('types pick several at once (shift-click adds), sections fold and stay folded on the next open', () => {
    const { pg, ov } = fresh(); try {
      const t = (re) => chips(ov, '.sbk-chip').find(b => re.test(b.textContent) && b.parentNode.querySelector('.plib-lbl').textContent === 'Type');
      t(/Drops/).click(); t(/Curves/).dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
      assert.deepEqual([...typesShown(ov)].sort(), ['curve', 'drop']);
      ov.querySelector('.plib-sec[data-sec=drop] .plib-sec-head').click();
      assert.ok(ov.querySelector('.plib-sec[data-sec=drop]').classList.contains('folded')); assert.ok(!ov.querySelector('.plib-sec[data-sec=drop] .plib-card'), 'its cards hidden');
    } finally { pg.close(); }
    const pg2 = PatternLibrary.open(); try {
      const ov = document.querySelector('.plib'); assert.ok(ov.querySelector('.plib-sec[data-sec=drop]').classList.contains('folded'), 'still folded'); assert.deepEqual([...typesShown(ov)].sort(), ['curve', 'drop'], 'the pick kept');
    } finally { pg2.close(); }
  });
  it('big sections show 24 and grow on “Show more”; search words narrow; BPM range; ★ favourites', () => {
    const { pg, ov } = fresh(); try {
      const drums = () => ov.querySelectorAll('.plib-sec[data-sec=drums] .plib-card').length;
      assert.equal(drums(), 24); ov.querySelector('.plib-sec[data-sec=drums] .plib-more').click(); assert.equal(drums(), 72);
      const q = ov.querySelector('input[type=search]'); q.value = 'floor falls drop'; q.dispatchEvent(new Event('input'));
      assert.ok(chips(ov, '.plib-card').length > 0 && chips(ov, '.plib-card').every(c => /floor falls/i.test(c.textContent) && /drop/i.test(c.textContent)), 'every word matched');
      q.value = ''; q.dispatchEvent(new Event('input'));
      const [lo, hi] = chips(ov, '.plib-bpm'); lo.value = '170'; lo.dispatchEvent(new Event('input')); hi.value = '175'; hi.dispatchEvent(new Event('input'));
      assert.ok(chips(ov, '.plib-card small:not(.plib-song)').every(s => { const b = +/(\d+) BPM/.exec(s.textContent)[1]; return b >= 170 && b <= 175; }), 'in range');
      const star = ov.querySelector('.plib-card .plib-star'), name = star.parentNode.querySelector('b').textContent; star.click();
      chips(ov, '.plib-q').find(b => /Favourites/.test(b.textContent)).click();
      assert.equal(chips(ov, '.plib-card').length, 1, 'only the starred one'); assert.equal(ov.querySelector('.plib-card b').textContent, name);
    } finally { pg.close(); try { localStorage.removeItem('eravos.patterns.page'); } catch (e) {} }
  });
});
