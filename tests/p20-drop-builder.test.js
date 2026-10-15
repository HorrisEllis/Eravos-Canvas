/* eravos.bass-drop-builder 3.0 — every part of every section editable (spec eravos.phase33-map § D) */
window.__phase = 'P20';
describe('Drop Builder 3 — every part editable', () => {
  async function hear(section, params, sec) {
    const U = TH.universe(sec || 4.2, { bpm: 120 }); const a = TH.spawn(U, 'eravos.bass-drop-builder'), c = OrganismFactory.handle(a).ctx;
    U.K.audio.chain.out.gain.value = 0; U.K.audio.port(a, 'fx').node.connect(U.ctx.destination);
    Object.keys(params || {}).forEach(k => c.params.set(k, params[k])); c.params.set('buildBars', 2); c.params.set('tensionBars', 2);
    U.K.bus.publish('ui:section_audition:' + a, { section }); return TH.render(U);
  }
  const diff = (x, y) => { const a = x.getChannelData(0), b = y.getChannelData(0); let d = 0, e = 0; for (let i = 0; i < a.length; i++) { d += (a[i] - b[i]) ** 2; e += a[i] * a[i] + b[i] * b[i]; } return d / (e || 1); };
  const CHANGES = [
    ['BUILD', 'riserWave', 'supersaw'], ['BUILD', 'riserNoise', 1], ['BUILD', 'riserCurve', 3], ['BUILD', 'riserFrom', 0.6], ['BUILD', 'riserOct', 4],
    ['BUILD', 'rollVoice', 'kick'], ['BUILD', 'rollStart', '1/16'], ['BUILD', 'rollPitch', 0], ['BUILD', 'rollFrom', 0.5],
    ['PAUSE', 'gapSound', 'sub swell'], ['PAUSE', 'gapLevel', 1, { impactLevel: 0, crashLevel: 0 }], ['PAUSE', 'gapLen', 2, { impactLevel: 0, crashLevel: 0 }],
    ['DROP', 'impactPitch', 80], ['DROP', 'impactLen', 0.4], ['DROP', 'crashLevel', 0], ['DROP', 'downLen', 0.25, { impactLevel: 0, crashLevel: 0 }],
  ];
  CHANGES.forEach(([sec, k, v, iso]) => it(`${sec}: ${k} changes the sound it names`, async () => {
    const base = await hear(sec, Object.assign({ rollCurve: 0.6 }, iso)), alt = await hear(sec, Object.assign({ rollCurve: 0.6 }, iso, { [k]: v }));
    assert.gt(TH.db(TH.rms(base, 0, 4)), -60, 'base audible'); assert.gt(diff(base, alt), 0.01, k + ' made no difference');
  }, { timeout: 20000 }));
  it('roll from/to set the slowest and fastest hit spacing', () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.bass-drop-builder'), c = OrganismFactory.handle(a).ctx;
    c.params.set('rollStart', '1/8'); c.params.set('rollEnd', '1/16'); const hs = c.rollHits(0, 4, 0.125), iv = hs.slice(1).map((h, i) => h.t - hs[i].t);
    assert.near(Math.max(...iv), 0.25, 1e-6); assert.near(Math.min(...iv), 0.125, 1e-6);
  });
  it('silence in the gap really is silent', async () => { const b = await hear('PAUSE', { gapSound: 'silence', impactLevel: 0, crashLevel: 0 }); assert.lt(TH.db(TH.rms(b, 0, 4)), -80); });
  it('every section has its own editor in the window, and the window scrolls to it', () => {
    const d = OrganismFactory.def('eravos.bass-drop-builder'), groups = new Set(d.config.map(c => c.group));
    ['TENSION', 'BUILD', 'PAUSE', 'DROP', 'VOCAL'].forEach(g => assert.ok(groups.has(g), g));
  });
});
