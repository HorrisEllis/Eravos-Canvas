/* Sequencer (eravos.sequencer) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.sequencer');

window.__phase = 'P39';
describe('Sequencer 2.2 · grooves (sequencer.spec 3.0 §G §P1)', () => {
  const pats = () => window.ERAVOS_DATA.patterns;
  const GROOVES = () => Object.keys(pats()).filter(n => pats()[n].kit);
  it('≥ 20 grooves; every lane is 16 steps; every groove names a kit that exists as a Drum Machine preset', () => {
    const d = OrganismFactory.def('eravos.pads'), bad = []; assert.gt(GROOVES().length, 19);
    GROOVES().forEach(n => { const g = pats()[n]; if (!d.presets[g.kit]) bad.push(n + ': kit ' + g.kit);
      Object.values(g.slots).forEach(sl => sl.lanes.forEach(l => { if (l.pad !== undefined && l.steps.replace(/[|\s]/g, '').length !== 16) bad.push(n + '/' + l.name); })); });
    assert.equal(bad.join(' · '), '');
  });
  it('a four-on-floor groove is not a metronome: velocities vary, ghosts exist, and bar 4 is different', () => {
    const fam = ['four-on-floor house', 'melodic house 122 (her song)', 'progressive house 126', 'tech house 125', 'afro house 120', 'trance 138', 'disco 118', 'minimal techno 128', 'hard techno 150', 'hardstyle 150'];
    const bad = [];
    fam.forEach(n => { const g = pats()[n]; if (!g) return bad.push(n + ' missing');
      const vels = g.slots.A.lanes.filter(l => l.pad !== undefined).flatMap(l => l.steps.split('').filter(c => c !== '.').map(c => c === 'X' ? 10 : c === 'x' ? 8 : c === 'o' ? 4.5 : +c));
      const mean = vels.reduce((a, b) => a + b, 0) / vels.length, sd = Math.sqrt(vels.reduce((a, b) => a + (b - mean) ** 2, 0) / vels.length);
      if (sd < 1.2) bad.push(`${n}: velocity spread ${sd.toFixed(2)}`); if (!vels.some(v => v <= 4)) bad.push(n + ': no ghost notes');
      if (JSON.stringify(g.slots.A.lanes) === JSON.stringify(g.slots.B.lanes)) bad.push(n + ': no variation bar'); });
    assert.equal(bad.join(' · '), '');
  });
  it('loading a groove: velocity digits, lane push and swing, the kit on the Drum Machine, song mode with the variation bar', () => {
    const U = TH.universe(0.3, { bpm: 124 }), pads = TH.spawn(U, 'eravos.pads'), s = TH.spawn(U, 'eravos.sequencer'), c = OrganismFactory.handle(s).ctx;
    c.loadStarter('tech house 125'); const x = c.saveExtra();
    const hat = x.tracks.findIndex(t => t.name === 'hat'), clap = x.tracks.findIndex(t => t.name === 'clap');
    assert.near(x.patterns.A.steps[hat][1].vel, 0.6, 1e-9, 'digit 6 = 0.6'); assert.equal(x.tracks[hat].swing, 0.18); assert.equal(x.tracks[clap].push, 2);
    assert.equal(c.params.get('chainOn'), true); assert.deepEqual(x.chain.map(k => k.slot + k.repeats), ['A3', 'B1']);
    assert.equal(OrganismFactory.handle(pads).ctx.kitOf()[0].model, 'punch', 'House · Tech House Tops kick');
  });
  it('timing is exact: lane push +2 ms and step nudge +0.25 land where they say (± 1 sample)', () => {
    const U = TH.universe(0.3, { bpm: 120 }), pads = TH.spawn(U, 'eravos.pads'), s = TH.spawn(U, 'eravos.sequencer'), c = OrganismFactory.handle(s).ctx, pub = (k, p) => U.K.bus.publish('ui:' + k + ':' + s, p);
    pub('track_edit', { track: 0, patch: { push: 2 } }); pub('step_edit', { track: 0, step: 0, patch: { on: true } }); pub('step_edit', { track: 0, step: 4, patch: { on: true, nudge: 0.25 } });
    const got = []; U.K.bus.subscribe('note:trigger', (p) => { if (p.target === pads) got.push(p.time); }, 't');
    U.T.renderTicks(0, 8, 0.05);
    assert.near(got[0], 0.05 + 0.002, 1 / 48000); assert.near(got[1], 0.05 + 4 * 0.125 + 0.002 + 0.25 * 0.125, 1 / 48000);
  });
});
