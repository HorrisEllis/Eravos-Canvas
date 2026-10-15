/* eravos.session 1.0.0 — the song's settings and file operations (P4, new)
 * Only owner of song key/scale (theory:key-change source) and driver of Workspace persistence.
 * Singleton: a second Session → MOUNT_006 (blocking). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.session', domain: 'music', version: '1.0.0', label: 'Session', icon: '◎', accent: '#ffffff', phase: 'P4', singleton: 'block', restoreFirst: true,
    category: 'Start here', blurb: 'Song name, tempo, key (plain words), save/open, and BOUNCE to a WAV file.',
    size: { w: 420, h: 540 }, minSize: { w: 360, h: 420 },
    permissions: ['bus_publish', 'bus_subscribe', 'filesystem_read', 'filesystem_write'],
    provides: ['capability.song_state'], requires: [],
    hooks: [
      S.event('session.hook.theory_out', 'out', 'theory:key-change', OrganismSDK.THEORY_SCHEMA, '1.0.0'),
      Object.assign(S.event('session.hook.transport_out', 'out', 'ui:transport-bpm|ui:transport-record|ui:transport-bounce|ui:transport-metronome|ui:transport-stop', { type: 'object' }, '1.0.0'), { rail: false }),
      Object.assign(S.event('session.hook.recorded_in', 'in', 'transport:recorded', { type: 'object', required: ['arrayBuffer'] }, '1.0.0'), { rail: false }),
      Object.assign(S.event('session.hook.songlen_in', 'in', 'timeline:song_length|edm:drop-plan', { type: 'object', required: ['bars'] }, '1.0.0'), { rail: false }),
      Object.assign(S.asset_out('session.hook.asset_out'), { rail: false }),
    ],
    config: [
      { key: 'songName', type: 'string', default: 'untitled', label: 'Song name', group: 'SONG' },
      { key: 'bpm', type: 'number', default: 128, min: 40, max: 240, step: 1, label: 'BPM', group: 'SONG' },
      { key: 'root', type: 'integer', default: 9, min: 0, max: 11, label: 'Key', group: 'SONG' },
      { key: 'scale', type: 'enum', options: window.MusicTheory.scales, default: 'minor', label: 'Scale', group: 'SONG' },
      { key: 'metronome', type: 'boolean', default: false, label: 'Click', group: 'SONG' },
      { key: 'countIn', type: 'integer', default: 1, min: 0, max: 2, label: 'Count-in', group: 'SONG' },
      { key: 'bounceBars', type: 'integer', default: 8, min: 1, max: 512, label: 'Bars', group: 'EXPORT' },
      { key: 'bitDepth', type: 'enum', options: [16, 24], default: 24, label: 'Bits', group: 'EXPORT' },
      { key: 'autosave', type: 'boolean', default: true, label: 'Autosave', group: 'FILE' },
      { key: 'autoLength', type: 'boolean', default: true, label: 'Bars = song length', group: 'EXPORT' },
    ],
    ui_hooks: ['tap', 'save', 'open', 'new', 'bounce', 'record'],
    engine(ctx) {
      const P = ctx.params, K = ctx.K;
      const publishKey = () => ctx.emit('theory:key-change', { root: P.get('root'), scale: P.get('scale') });
      publishKey();
      P.onChange('root', publishKey); P.onChange('scale', publishKey);
      ctx.on('kernel:organism-mounted', null, (p) => { if (p.instanceId !== ctx.id) publishKey(); }); // late organisms sync
      P.onChange('bpm', (v) => { if (Math.round(v) !== Math.round(K.music.bpm)) ctx.emit('ui:transport-bpm', { bpm: v }); });
      ctx.onBpm((b) => { if (b !== P.get('bpm')) P.set('bpm', b, { silent: true }); });
      if (P.get('bpm') !== K.music.bpm) P.set('bpm', K.music.bpm, { silent: true });
      P.onChange('metronome', (v) => ctx.emit('ui:transport-metronome', { on: v, countIn: P.get('countIn') }));
      P.onChange('countIn', (v) => ctx.emit('ui:transport-metronome', { on: P.get('metronome'), countIn: v }));
      P.onChange('autosave', (v) => window.Workspace && window.Workspace.setAutosave(v));
      // tap tempo: mean of last 4 intervals, reset after 2 s idle
      let taps = [];
      function tap(now) {
        if (taps.length && now - taps[taps.length - 1] > 2) taps = [];
        taps.push(now); if (taps.length > 5) taps.shift();
        if (taps.length < 2) return null;
        const iv = []; for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
        const last = iv.slice(-4), m = last.reduce((a, b) => a + b, 0) / last.length;
        const bpm = Math.max(40, Math.min(240, Math.round(60 / m * 10) / 10));
        P.set('bpm', bpm); return bpm;
      }
      ctx.tap = tap;
      ctx.onUI('tap', { type: 'object' }, (p) => tap(typeof p.t === 'number' ? p.t : performance.now() / 1000));
      // song length (timeline / drop builder)
      const lens = new Map();
      ctx.on('timeline:song_length', { type: 'object', required: ['bars'] }, (p) => { lens.set(p._from || 'tl', p.bars); autoBars(); });
      ctx.on('edm:drop-plan', { type: 'object', required: ['bars'] }, (p) => { lens.set(p._from || 'drop', p.bars); autoBars(); });
      ctx.on('kernel:organism-unmounted', null, (p) => { if (lens.delete(p.instanceId)) autoBars(); });
      function autoBars() { if (!P.get('autoLength') || !lens.size) return; const b = Math.max(...lens.values()); P.set('bounceBars', Math.max(1, Math.min(512, Math.ceil(b)))); }
      // files
      const fname = (ext) => (P.get('songName') || 'untitled').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') + ext;
      ctx.onUI('save', null, () => {
        const snap = window.Workspace.snapshot();
        const data = JSON.stringify(snap);
        ctx.emitUI('file_ready', { name: fname('.eravos.json'), mime: 'application/json', data });
        ctx.emitUI('status', { text: `Saved ${snap.organisms.length} tools` + (Object.keys(snap.assets).length ? ` + ${Object.keys(snap.assets).length} audio clip(s) embedded` : '') });
      });
      ctx.onUI('open', { type: 'object', required: ['text'] }, async (p) => {
        let snap; try { snap = JSON.parse(p.text); } catch (e) { return ctx.fault('ASSET_001', 'project file is not JSON'); }
        if (!snap || !snap.workspace_version) return ctx.fault('ASSET_001', 'not an ERAVOS project (no workspace_version)');
        if (K.semver.parse(snap.workspace_version)[0] !== 1) return ctx.fault('MOUNT_005', 'workspace version ' + snap.workspace_version + ' unsupported');
        await window.Workspace.restore(snap); // this Session is replaced by the one in the file
      });
      ctx.onUI('new', null, async () => {
        await window.Workspace.restore({ workspace_version: '1.0.0', bpm: 128, key: 9, scale: 'minor', organisms: [{ id: 'eravos.session', instanceId: 'session-new-' + Date.now().toString(36), x: 40, y: 40, state: null }], wires: [], assets: {} });
      });
      // export
      let pendingBounce = false;
      ctx.onUI('bounce', null, () => { pendingBounce = true; ctx.emit('ui:transport-bounce', { bars: P.get('bounceBars'), bitDepth: P.get('bitDepth') }); });
      ctx.onUI('record', null, () => ctx.emit('ui:transport-record', { countIn: P.get('countIn') }));
      ctx.on('transport:bounce', { type: 'object' }, (p) => ctx.emitUI('progress', p));
      ctx.on('transport:recorded', { type: 'object', required: ['arrayBuffer'] }, (p) => {
        if (p.tag) return; // a tagged bounce (Timeline stems) belongs to the tool that asked for it
        const wasBounce = pendingBounce; pendingBounce = false;
        setTimeout(() => {
          if (p.claimed && !wasBounce) { ctx.emitUI('status', { text: 'Recording placed on the armed timeline lane' }); return; }
          const name = fname(wasBounce ? '.wav' : '-take.wav');
          ctx.emitUI('file_ready', { name, mime: 'audio/wav', data: p.arrayBuffer });
          const a = K.assets.register(p.arrayBuffer, { name, mime: 'audio/wav' }); if (p.buffer) a.decoded = p.buffer;
          ctx.lastExport = { name, duration: p.duration, hash: a.hash };
          ctx.emitUI('status', { text: `${wasBounce ? 'Bounced' : 'Recorded'} ${p.duration.toFixed(2)} s → ${name}` });
        }, 0);
      });
      ctx.on('workspace:autosaved', null, (p) => ctx.emitUI('autosaved', p));
      ctx.on('workspace:autosave-failed', null, (p) => ctx.emitUI('autosave_failed', p));
      ctx.stateExtra = () => ({ hint: window.MusicTheory.HINTS[P.get('scale')], lastExport: ctx.lastExport || null });
      ctx.audition = () => {};
      return {};
    },
  });
})();
