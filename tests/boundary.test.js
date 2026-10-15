/* Boundary tests — the skeleton (kernel/, runtime/, index.html, scripts.js) must stay domain-free, and
 * organisms must not reach into each other. Sources are handed in by run.mjs (window.__SOURCES).
 * The forbidden vocabulary is DERIVED from what the loaded domains actually register, so a new domain
 * automatically extends the check; a short fixed list backs it up. */
window.__phase = 'B';
describe('boundary — skeleton knows no domain', () => {
  const SRC = window.__SOURCES || { skeleton: {}, organisms: {} };
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function vocabulary() {
    const K = Kernel, terms = new Map(); // term → why
    const add = (t, why) => { if (t && t.length > 2) terms.set(t, why); };
    OrganismFactory.defined().forEach(d => {
      add(d.id, 'organism id');
      add(d.id.replace(/^eravos\./, ''), 'organism name');
      (d.hooks || []).forEach(h => String(h.event_type || '').split('|').forEach(e => { const ns = e.trim().split(':')[0]; if (e.includes(':')) add(ns + ':', `topic namespace (${d.id})`); }));
    });
    K.wires.types().filter(t => t.signal).forEach(t => add(t.type, 'signal wire type'));
    Kernel.registeredDomains().forEach(d => add(d.id, 'domain id'));
    Intake.handlers().forEach(h => add(h.id, 'file handler'));
    OrganismSDK.extensions().forEach(id => add(id, 'SDK extension'));
    ['audio', 'music', 'midi', 'bpm', 'tempo', 'reverb', 'sidechain', 'synth', 'chord', 'melody', 'drum', 'song', 'vocal', 'transport', 'AudioContext', 'Analyser', 'decodeAudioData'].forEach(t => add(t, 'domain word'));
    // core namespaces the skeleton legitimately owns
    ['ui:', 'org:', 'kernel:', 'asset:', 'canvas:', 'factory:', 'workspace:', 'recipe:', 'intake:'].forEach(t => terms.delete(t));
    return terms;
  }

  it('sources were handed in', () => {
    assert.gt(Object.keys(SRC.skeleton).length, 8, 'skeleton files'); assert.gt(Object.keys(SRC.organisms).length, 20, 'organism files');
  });
  it('no skeleton file mentions a domain term (organism ids, topics, wire types, domain words)', () => {
    const terms = vocabulary(), hits = [];
    Object.entries(SRC.skeleton).forEach(([file, text]) => {
      terms.forEach((why, t) => {
        const re = t.endsWith(':') ? new RegExp("['\"`/]" + esc(t)) : new RegExp('\\b' + esc(t) + '\\b', 'i');
        const lines = text.split('\n'); lines.forEach((l, i) => { if (re.test(l)) hits.push(`${file}:${i + 1} "${t}" (${why})`); });
      });
    });
    assert.equal(hits.length, 0, '\n' + hits.slice(0, 20).join('\n'));
  });
  it('organisms never read another organism\'s internals or keep side-channel state', () => {
    const bad = [];
    Object.entries(SRC.organisms).forEach(([file, text]) => text.split('\n').forEach((l, i) => {
      if (/\.extra\.(?!\w*Extra)/.test(l) && !/serialize\(\)\.extra/.test(l)) bad.push(`${file}:${i + 1} reads registry extra`);
      if (/\blocalStorage\b|\bsessionStorage\b/.test(l)) bad.push(`${file}:${i + 1} browser storage`);
      if (/window\.__/.test(l)) bad.push(`${file}:${i + 1} test hook global`);
    }));
    assert.equal(bad.length, 0, '\n' + bad.join('\n'));
  });
});

describe('boundary — a bare universe', () => {
  function plain() {
    if (!OrganismFactory.def('test.plain')) OrganismFactory.define({
      id: 'test.plain', label: 'Plain', permissions: ['bus_publish', 'bus_subscribe'],
      hooks: [OrganismSDK.STD.event('p.out', 'out', 'plain:said'), OrganismSDK.STD.event('p.in', 'in', 'plain:said')],
      config: [{ key: 'word', type: 'string', default: 'hello' }],
      engine(ctx) { ctx.onUI('say', null, () => ctx.emit('plain:said', { word: ctx.params.get('word') })); return {}; },
      ui_hooks: ['say'],
    });
  }
  it('Kernel.create({domains: []}) has no domain services, port kinds or signal wire types', () => {
    const K = Kernel.create({ quiet: true, domains: [] });
    assert.equal(K.audio, undefined); assert.equal(K.music, undefined);
    assert.equal(K.ports.kinds().length, 0);
    assert.deepEqual(K.wires.types().filter(t => t.signal), []);
    assert.equal(K.domains.list().length, 0);
    assert.ok(!K.permissions.known().includes('audio_out'));
  });
  it('a domain-free organism spawns, keeps params and talks on the bus with no domain installed', () => {
    plain(); const K = Kernel.create({ quiet: true, domains: [] });
    const a = OrganismFactory.spawn('test.plain', { K, headless: true }); assert.ok(a, JSON.stringify(K.faults.list()));
    const got = []; K.bus.subscribe('plain:said', (p) => got.push(p.word));
    K.bus.publish('ui:config_change:' + a, { key: 'word', value: 'hi' }); K.bus.publish('ui:say:' + a, {});
    assert.deepEqual(got, ['hi']);
    OrganismFactory.close(a);
  });
  it('a music organism in a bare universe is refused (DOMAIN_001), not half-mounted', () => {
    const K = Kernel.create({ quiet: true, domains: [] });
    const id = OrganismFactory.spawn('eravos.supersaw', { K, headless: true });
    assert.equal(id, null); assert.equal(K.faults.list('DOMAIN_001').length, 1); assert.equal(K.registry.list().length, 0);
  });
  it('a signal wire type no domain defined → WIRE_005', () => {
    plain(); const K = Kernel.create({ quiet: true, domains: [] });
    K.registry.register('x', { id: 't.x', hooks: [{ hook_id: 'o', direction: 'out', wire_type: 'audio', port: 'o' }] });
    K.registry.register('y', { id: 't.y', hooks: [{ hook_id: 'i', direction: 'in', wire_type: 'audio', port: 'i' }] });
    assert.fault(K, 'WIRE_005', () => K.wires.register({ src: { instanceId: 'x', hookId: 'o' }, dst: { instanceId: 'y', hookId: 'i' } }));
  });
  it('a dropped file no installed domain understands → ASSET_004', async () => {
    const K = Kernel.create({ quiet: true, domains: [] });
    const I = Intake.create(K); const wav = AudioRecorder.encodeWAV(new OfflineAudioContext(1, 480, 48000).createBuffer(1, 480, 48000), 16);
    const n = K.faults.list('ASSET_004').length; await I.file('x.wav', wav, 'audio/wav'); assert.equal(K.faults.list('ASSET_004').length, n + 1);
  });
  it('K-3: another organism\'s params are only readable through the kernel, with registry_read', () => {
    plain(); const K = Kernel.create({ quiet: true, domains: [] });
    const a = OrganismFactory.spawn('test.plain', { K, headless: true });
    assert.equal(K.registry.get(a).extra.getParam, undefined, 'no back door on the registry record');
    K.registry.register('reader', { id: 't.reader', permissions: ['registry_read'] });
    K.registry.register('nosy', { id: 't.nosy', permissions: [] });
    assert.equal(K.registry.readParam('reader', a, 'word'), 'hello');
    assert.fault(K, 'RUNTIME_001', () => K.registry.readParam('nosy', a, 'word'));
    OrganismFactory.close(a);
  });
  it('a domain cannot claim a core kernel name (DOMAIN_002)', () => {
    const K = Kernel.create({ quiet: true, domains: [] });
    assert.fault(K, 'DOMAIN_002', () => K.extend('bus', {}));
  });
});
