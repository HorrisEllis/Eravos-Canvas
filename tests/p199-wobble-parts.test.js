/* P199 — Wobble Bass's sockets, swapped and mutated (wobble-bass.engine.js PARTS 4.3; tools/core/field/board.js; his words, 2026-11-20: "okay now i
 * want to be able to mutate, and swap components for the wobble bass."). Its own parts by default (nothing built, the null render holds — measured
 * with tests/null-render.mjs, 34 of 34); a shared component swapped into a socket is built from its tested kernel and is what plays; on the board a
 * ⇄ chip on the gate of the part it stands in for, ⚄ MUTATE (one undo step, never the same twice), ✓ KEEP / ✗ THROW (throw = back), and it learns. */
window.__phase = 'P199';
describe('P199 Wobble Bass — swap a component in, mutate, keep or throw', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('sockets swap live, the board mutates, learns, and throws back', async () => {
    host(); try { localStorage.removeItem('eravos.mutate.eravos.wobble-bass'); localStorage.removeItem('eravos.fieldboard.eravos.wobble-bass'); } catch (e) {}
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), h = OrganismFactory.handle(a), P = h.ctx.params, I = h.ctx.internals;
    try {
      await TH.sleep(300);
      assert.equal(P.get('partFilter'), 'own', 'its own filter by default'); assert.equal(P.get('partDrive'), 'own', 'its own drive by default');
      assert.deepEqual(h.ctx.parts.built, { filter: [], drive: [], noise: [], insert: [] }, 'nothing new built while its own parts play');
      assert.equal(I.ownF.gain.value, 1, 'its own filter path at exactly 1'); assert.equal(I.ownD.gain.value, 1, 'its own drive path at exactly 1');
      h.view.emit('config_change', { key: 'partFilter', value: 'filter-ladder' }); assert.ok(await h.ctx.parts.ready('filter'), 'the ladder is built');
      await TH.sleep(120);
      assert.ok(I.parts.filter['filter-ladder'].g.gain.value > 0.9 && I.ownF.gain.value < 0.1, 'and is what plays (own filter faded out)');
      h.view.emit('config_change', { key: 'partFilter', value: 'own' }); await TH.sleep(120); assert.ok(I.ownF.gain.value > 0.9, 'and back to its own');
      // the board: chips where the parts are, the dock under the core
      const r = FieldBoard.explode(a, 'eravos.wobble-bass'); assert.deepEqual(r.missing, [], 'every piece found');
      const chips = [...document.querySelectorAll('.fb-gate.fb-comp')].filter(g => g.querySelector('.fb-tile')).map(g => g.dataset.piece).sort();   // 2026-11-20: a tile in each component box (no ⇄ chips)
      assert.ok(['filter-vowels', 'grit', 'noise', 'squash'].every(x => chips.includes(x)), 'a tile in the box of each part a socket stands in for (filter, drive, noise, insert): ' + chips);
      assert.ok(document.querySelector('.fb-mut .fm-go'), '⚄ MUTATE under the core');
      const hist = Kernel.history ? Kernel.history.state().undo : null;
      document.querySelector('.fm-go').click(); await TH.sleep(80);
      assert.ok(/→/.test(document.querySelector('.fm-line').textContent), 'a mutation changed something');
      assert.ok(!document.querySelector('.fm-keep').disabled && !document.querySelector('.fm-throw').disabled, 'keep / throw offered');
      assert.ok(/→/.test(document.querySelector('.fm-line').textContent), 'it says what changed: ' + document.querySelector('.fm-line').textContent);
      const before = JSON.stringify(Object.fromEntries(['partFilter', 'partDrive', 'partNoise', 'partInsert', 'cutoff', 'res', 'drive'].map(k => [k, 0])));
      document.querySelector('.fm-throw').click(); await TH.sleep(80);
      assert.equal(P.get('partFilter'), 'own', 'thrown: back to before'); assert.equal(P.get('partDrive'), 'own', 'thrown: back to before'); assert.equal(P.get('partNoise'), 'own', 'thrown: back to before'); assert.equal(P.get('partInsert'), 'none', 'thrown: back to before');
      let L = FieldBoard.learned('eravos.wobble-bass'); assert.equal(L.thrown, 1, 'it learned the throw'); assert.equal(L.seen.length, 1, 'and remembers it was tried');
      assert.ok(Object.values(L.w).some(v => v < 0), 'the thrown choices weigh less');
      const sigs = new Set(); for (let i = 0; i < 12; i++) { const m = FieldBoard.mutate(a, 'eravos.wobble-bass'); assert.ok(m, 'a mutation'); assert.ok(!sigs.has(m.sig) && !L.seen.includes(m.sig), 'never the same twice'); sigs.add(m.sig); }
      document.querySelector('.fm-go').click(); await TH.sleep(80); document.querySelector('.fm-keep').click();
      L = FieldBoard.learned('eravos.wobble-bass'); assert.equal(L.kept, 1, 'it learned the keep'); assert.ok(Object.values(L.w).some(v => v > 0), 'the kept choices weigh more');
      if (hist != null) assert.ok(Kernel.history.state().undo > hist, 'mutations are undo steps');
      await FieldBoard.assemble(a, { now: true }); assert.equal(document.querySelectorAll('.fb-tile').length, 0, 'put back: the tiles go with the board');
    } finally { if (FieldBoard.isOpen(a)) await FieldBoard.assemble(a, { now: true }); OrganismFactory.close ? OrganismFactory.close(a) : CanvasWM.close && CanvasWM.close(a); try { localStorage.removeItem('eravos.mutate.eravos.wobble-bass'); } catch (e) {} }
  });
});
