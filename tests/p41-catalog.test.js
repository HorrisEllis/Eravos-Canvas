/* P38 catalog (built 3.41): metadata for every tool without loading it; gating; install order; ensure */
window.__phase = 'P41';
describe('catalog — install what you need (P38)', () => {
  it('offers every domain and tool as metadata (preview, files, category) without needing them loaded', () => {
    const ds = Catalog.domains(), ts = Catalog.tools();
    assert.ok(ds.length >= 5 && ts.length >= 50, `${ds.length} domains, ${ts.length} tools`);
    assert.ok(ts.every(t => t.files.length && t.files.some(f => f[0] === 'js')), 'every tool lists its files');
    assert.ok(ts.every(t => t.preview), 'every built tool has a thumbnail');
    assert.ok(ds.filter(d => !d.toolless).every(d => d.starter.every(id => Catalog.meta(id))), 'starter sets name real tools');
  });
  it('the suite runs in all-mode: every catalog tool is installed and defined', () => {
    assert.ok(Catalog.allMode()); assert.ok(Catalog.tools().every(t => OrganismFactory.def(t.id)), 'all defined');
    assert.equal(Catalog.available().length, 0);
  });
  it('ensure() names nothing when every tool a project needs is here', async () => {
    assert.deepEqual(await Catalog.ensure(['eravos.pads', 'eravos.sequencer', 'not.a.tool'], Kernel), []);
  });
  it('load() keeps order after the page has parsed (FIFO, nested loads included)', async () => {
    window.__catOrder = []; const u = (n, inner) => URL.createObjectURL(new Blob([`__catOrder.push(${n});` + (inner ? `Catalog.load(${JSON.stringify(inner)});` : '')], { type: 'application/javascript' }));
    const c = u(3), b = u(2, c); Catalog.load(u(1, b)); Catalog.load(u(4)); await Catalog.drained();
    assert.deepEqual(window.__catOrder, [1, 4, 2, 3], 'each file once, in queue order — a file a loaded file queues runs after what was already waiting');
  });
});
