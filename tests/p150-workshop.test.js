/* P150 — the Workshop surface (canvas/runtime/workshop.js), W1 flat. His words, 2026-11-07: "can you make it more like photoshop? or like a 3d
 * renderer? … this could be the build surface for emerge." · "Yeah, we can just start with this. The small, like just the flat". A kind from
 * no domain at all (a square whose size is its one value) proves the surface is agnostic: it opens, edits, undoes, keeps a history, closes. */
window.__phase = 'P150';
describe('P150 the Workshop — any kind on one surface', () => {
  const SQUARE = { id: 'test.square', label: 'Square', layers: (d) => [{ id: 'size', group: 'SHAPE', type: 'value', label: 'Size', sub: d.size + ' px', fields: [{ key: 'size', label: 'Size', type: 'number', min: 1, max: 200, step: 1 }] }],
    get: (d, k) => d[k], set: (d, k, v) => Object.assign({}, d, { [k]: v }), draw: (g, W, H, d) => { g.fillStyle = '#00d4ff'; g.fillRect(10, 10, d.size, d.size); }, status: (d) => [['SIZE', d.size]] };
  it('a kind is checked: one missing a part is refused and the part named', () => {
    const bad = Workshop.addKind({ id: 'test.bad', label: 'Bad', layers: () => [], get: () => 0 }); assert.ok(!bad.ok, 'refused');
    assert.ok(bad.problems.some(p => /set/.test(p)) && bad.problems.some(p => /draw/.test(p)), 'it says what is missing: ' + bad.problems.join('; '));
    assert.ok(!Workshop.kinds().includes('test.bad'), 'and it is not added'); assert.ok(Workshop.addKind(SQUARE).ok, 'a whole kind is accepted');
  });
  it('it opens a document, edits it live, undoes, redoes, keeps a history, and closes (Esc)', async () => {
    const seen = []; const ws = Workshop.open('test.square', { size: 20 }, { onChange: (d) => seen.push(d.size) });
    assert.ok(document.querySelector('.ws-app .ws-canvas'), 'the surface is open with its viewport');
    assert.ok(/SIZE/.test(document.querySelector('.ws-status').textContent), 'the status bar shows what the kind says');
    ws.set('size', 50, 'Size'); assert.equal(ws.doc().size, 50, 'edited'); assert.deepEqual(seen, [50], 'the owner heard it at once (live)');
    ws.undo(); assert.equal(ws.doc().size, 20, 'undo'); ws.redo(); assert.equal(ws.doc().size, 50, 'redo'); assert.deepEqual(seen, [50, 20, 50], 'the owner followed both');
    assert.ok(ws.history().length >= 4 && /size · 50/i.test(ws.history().join('|')), 'the history: ' + ws.history().join(' · '));
    const inp = document.querySelector('.ws-ins .ws-num'); inp.value = '80'; inp.dispatchEvent(new Event('change')); assert.equal(ws.doc().size, 80, 'the options bar edits the selected layer');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await TH.sleep(10); assert.ok(!document.querySelector('.ws-app') && !Workshop.current, 'Esc closes it');
  });
});
