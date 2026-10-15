/* eravos.song-recorder 1.0.0 — Song Recorder · spec eravos.organism.song-recorder
 * The song, pinned to the bottom of the canvas (dock:'bottom'). Record what the canvas plays — the master you hear,
 * or one tool on its own — as takes on lanes, bar-aligned to the transport. Then edit: move, trim either edge, split,
 * duplicate, delete, fade, gain, mute / solo / volume per lane, drop audio files in. Every edit is undoable (Ctrl+Z).
 * Playback joins AFTER the master-output capture point (audio post bus): overdubbing never re-records earlier takes
 * and nothing is mastered twice. Export renders offline (fast, exact) to every codec in Codecs, or stems as a ZIP. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const COLORS = ['#ff3355', '#00d4ff', '#00ff88', '#ffaa00', '#b066ff', '#ff66cc', '#7cffb2', '#ffe066'];
  OrganismFactory.define({
    id: 'eravos.song-recorder', tempo: false, domain: 'music', version: '1.0.0', label: 'Song Recorder', icon: '⏺', accent: '#ff3355', phase: 'P14',
    category: 'Arrange', blurb: 'Pinned to the bottom: record the canvas (or one tool) into takes, edit them like a DAW, export WAV/FLAC/AIFF/MP3/Opus or stems.',
    dock: 'bottom', singleton: 'block', size: { w: 1200, h: 300 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe', 'filesystem_read', 'filesystem_write', 'registry_read'],
    provides: ['capability.audio_out', 'capability.recorder', 'capability.asset_in'],
    needs: { notes: ['Always docked at the bottom; drag its top edge to resize, double-click to fold.', 'Records the master you hear; its own playback is never re-recorded.'], works_with: ['eravos.timeline', 'eravos.session', 'eravos.clip-maker'] },
    hooks: [
      Object.assign(S.audio_out('songrec.hook.audio_out'), { intent: 'takes play here (after the master capture point)' }),
      S.transport_in('songrec.hook.transport_in'),
      S.asset_in('songrec.hook.asset_in'), S.asset_out('songrec.hook.asset_out'),
      Object.assign(S.event('songrec.hook.song_out', 'out', 'song:saved', { type: 'object', required: ['name'] }, '1.0.0'), { rail: false, intent: 'the finished song (audio) → the Songbook’s My songs' }),
      Object.assign(S.event('songrec.hook.transport_out', 'out', 'ui:transport-play|ui:transport-stop|ui:transport-seek', { type: 'object' }, '1.0.0'), { rail: false }),
    ],
    config: [
      { key: 'source', type: 'string', default: 'master', label: 'Record', group: 'RECORD' },
      { key: 'snap', type: 'enum', options: ['bar', 'beat', '1/8', '1/16', 'off'], default: 'beat', label: 'Snap', group: 'EDIT' },
      { key: 'zoom', type: 'number', default: 26, min: 4, max: 200, step: 0.5, label: 'Zoom', group: 'EDIT' },
      { key: 'follow', type: 'boolean', default: true, label: 'Follow', group: 'EDIT' },
      { key: 'format', type: 'enum', options: (window.Codecs ? window.Codecs.FORMATS.map(f => f.id) : ['wav24']), default: 'wav24', label: 'Format', group: 'EXPORT' },
      { key: 'range', type: 'enum', options: ['song', 'loop', 'selection'], default: 'song', label: 'Range', group: 'EXPORT' },
      { key: 'stems', type: 'boolean', default: false, label: 'Stems', group: 'EXPORT', hint: 'one file per lane, zipped' },
      { key: 'tail', type: 'number', default: 2, min: 0, max: 12, step: 0.1, unit: 's', label: 'Tail', group: 'EXPORT' },
      { key: 'songName', type: 'string', default: 'my song', label: 'Song name', group: 'EXPORT' },
      { key: 'level', type: 'number', default: 1, min: 0, max: 1.5, step: 0.01, label: 'Playback', group: 'OUT' },
      // 3.27: the recorder's ▶ plays ONLY the takes (the canvas stays silent). Takes join the song's transport only when this is on
      // (overdubbing) — otherwise a take of the master would play on top of the live canvas that made it (heard twice).
      { key: 'withSong', type: 'boolean', default: false, label: 'Play with song', group: 'OUT', hint: 'takes also play when the whole canvas plays (for overdubs)' },
    ],
    ui_hooks: ['record', 'play', 'stop', 'seek', 'clip_move', 'clip_trim', 'clip_split', 'clip_delete', 'clip_dup', 'clip_edit', 'lane_add', 'lane_edit', 'lane_delete', 'lane_arm', 'select', 'import', 'export', 'want_peaks', 'save_song'],
    ui_hook_labels: { clip_move: 'move clip', clip_trim: 'trim clip', clip_split: 'split clip', clip_delete: 'delete clip', clip_dup: 'duplicate clip', clip_edit: 'edit clip', lane_add: 'add lane', lane_edit: 'edit lane', lane_delete: 'delete lane', import: 'import audio', record: 'record take' },
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, K = ctx.K, dsp = ctx.dsp;
      const out = ac.createGain(); out.gain.value = P.get('level'); ctx.track(out);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'song', bus: 'post' });
      P.onChange('level', (v) => dsp.setSmooth(out.gain, v, ac));
      let lanes = [], clips = [], sel = [], nextId = 1, armed = null;
      const buffers = new Map(), peaks = new Map();
      const uid = (p) => p + (nextId++).toString(36);
      const spb = () => 60 / ctx.bpm;                                  // seconds per beat
      const durBeats = (c) => c.dur / spb();
      function newLane(name) { const l = { id: uid('L'), name: name || 'Take ' + (lanes.length + 1), mute: false, solo: false, vol: 0, color: COLORS[lanes.length % COLORS.length] }; lanes.push(l); return l; }
      // ---- buffers + overview peaks (sent once per asset)
      async function ensure(hash) {
        let b = buffers.get(hash);
        if (!b) { const a = K.assets.get(hash); if (!a) return null; b = a.decoded || await K.assets.decode(hash); if (!b) return null; buffers.set(hash, b); }
        if (!peaks.has(hash)) { peaks.set(hash, dsp.peaks(b, Math.max(64, Math.min(6000, Math.round(b.duration * 120))))); ctx.emitUI('peaks', { hash, peaks: peaks.get(hash), duration: b.duration }); }
        return b;
      }
      // ---- playback
      let playing = null; const active = new Set();
      const audible = (l) => !l.mute && (!lanes.some(x => x.solo) || l.solo);
      function stopAll(t) { active.forEach(n => { try { n.src.stop(t || 0); } catch (e) {} }); active.clear(); }
      function voice(dst, c, buf, t, fromSec, ctxA) {
        const A = ctxA || ac, src = A.createBufferSource(), g = A.createGain(); src.buffer = buf; src.connect(g); g.connect(dst);
        const gain = Math.pow(10, (c.gain || 0) / 20), len = c.dur - fromSec, fi = Math.min(c.fadeIn || 0, c.dur / 2), fo = Math.min(c.fadeOut || 0, c.dur / 2);
        const at = (x) => t + x - fromSec; // clip-local seconds → context time
        g.gain.setValueAtTime(fromSec < fi ? gain * fromSec / fi : gain, t);
        if (fromSec < fi) g.gain.linearRampToValueAtTime(gain, at(fi));
        if (fo > 0) { g.gain.setValueAtTime(gain, Math.max(t, at(c.dur - fo))); g.gain.linearRampToValueAtTime(0, at(c.dur)); }
        src.start(t, c.offset + fromSec, len);
        return { src, g };
      }
      function laneGains(A, dst) { const m = new Map(); lanes.forEach(l => { const g = A.createGain(); g.gain.value = audible(l) ? Math.pow(10, l.vol / 20) : 0; g.connect(dst); m.set(l.id, g); }); return m; }
      let liveLanes = null;
      function schedule(t0, fromBeat) {
        stopAll(t0); if (liveLanes) liveLanes.forEach(g => { try { g.disconnect(); } catch (e) {} });
        liveLanes = laneGains(ac, out);
        playing = { t0, b0: fromBeat };
        clips.forEach(c => {
          const buf = buffers.get(c.hash); if (!buf || c.mute) return;
          const end = c.start + durBeats(c); if (end <= fromBeat) return;
          const fromSec = Math.max(0, (fromBeat - c.start) * spb()), t = t0 + Math.max(0, c.start - fromBeat) * spb();
          const v = voice(liveLanes.get(c.lane), c, buf, Math.max(t, ac.currentTime), fromSec + Math.max(0, ac.currentTime - t)); active.add(v); v.src.onended = () => active.delete(v);
        });
        ctx.emitUI('clock', { t0, b0: fromBeat, bpm: ctx.bpm, playing: true });
      }
      function beatNow() { return playing ? playing.b0 + (ac.currentTime - playing.t0) / spb() : head; }
      let head = 0; // beat position when stopped
      function resched() { if (playing && !playing.silent) { const loc = playing.local; schedule(ac.currentTime + 0.03, beatNow() + 0.03 / spb()); playing.local = loc; } }
      // ---- 3.27 local playback: the takes alone, on the recorder's own clock — no transport, nothing else on the canvas plays
      let localEnd = 0;
      function songEndBeat() { let e = 0; clips.forEach(c => { if (!c.mute) e = Math.max(e, c.start + durBeats(c)); }); return e; }
      function playLocal() {
        const endB = songEndBeat(); if (!clips.length || endB <= 0) return ctx.emitUI('export_state', { error: 'Nothing recorded yet — press ⏺ and play.' });
        if (head >= endB - 0.01) head = 0;
        schedule(ac.currentTime + 0.03, head); playing.local = true;
        clearTimeout(localEnd); localEnd = setTimeout(() => { if (playing && playing.local) stopLocal(); }, ((endB - head) * spb() + 0.2) * 1000);
      }
      function stopLocal() { clearTimeout(localEnd); if (!playing || !playing.local) return; head = Math.min(beatNow(), songEndBeat()); stopAll(ac.currentTime); playing = null; ctx.emitUI('clock', { playing: false, head }); }
      ctx.onDispose(() => clearTimeout(localEnd));
      ctx.onPlay((p) => {
        if (playing && playing.local) stopLocal();
        if (P.get('withSong') || rec) schedule(p.time, (p.step16 || 0) / 4);
        else { playing = { t0: p.time, b0: (p.step16 || 0) / 4, silent: true }; ctx.emitUI('clock', { t0: p.time, b0: playing.b0, bpm: ctx.bpm, playing: true }); } // playhead follows, takes stay quiet
        if (rec && rec.waitPlay) { rec.startTime = p.time; rec.startBeat = (p.step16 || 0) / 4; rec.waitPlay = false; ctx.syncUI(); } });
      ctx.onStop((p) => { if (playing && playing.local) return; const t = p && p.time !== undefined ? p.time : ac.currentTime; if (playing) head = beatNow(); stopAll(t); playing = null; ctx.emitUI('clock', { playing: false, head }); if (rec && !rec.waitPlay) finishRecord(t); });
      ctx.on('transport:loop', { type: 'object' }, (p) => { if (typeof p.toStep16 === 'number' && playing && !playing.local) { if (playing.silent) { playing.t0 = p.time; playing.b0 = p.toStep16 / 4; ctx.emitUI('clock', { t0: p.time, b0: playing.b0, bpm: ctx.bpm, playing: true }); } else schedule(p.time, p.toStep16 / 4); } });
      let loopRange = null; ctx.on('transport:state', { type: 'object' }, (s) => { if (s.loop) loopRange = s.loop; if (!s.playing && typeof s.position16 === 'number' && !playing) { head = s.position16 / 4; ctx.emitUI('clock', { playing: false, head }); } });
      // ---- recording
      let rec = null;
      function sourceNode() {
        const s = P.get('source');
        if (!s || s === 'master') return K.audio.output;
        const pt = K.audio.port(s, 'out'); if (!pt) { ctx.fault('RUNTIME_002', 'record source gone — recording the master instead'); return K.audio.output; }
        return pt.node;
      }
      async function startRecord() {
        if (rec) return;
        const r = window.AudioRecorder.create(ac, sourceNode());
        rec = { r, startTime: null, startBeat: null, waitPlay: false, lane: armed && lanes.find(l => l.id === armed) ? armed : null, srcLabel: P.get('source') === 'master' ? 'master' : (K.registry.get(P.get('source')) || { descriptor: { label: 'tool' } }).descriptor.label };
        await r.ready; await r.start();
        if (playing && playing.local) stopLocal();
        if (playing) { rec.startTime = ac.currentTime + 0.01; rec.startBeat = beatNow() + 0.01 / spb(); }
        else { rec.waitPlay = true; ctx.emit('ui:transport-play', {}); }
        ctx.syncUI();
      }
      async function finishRecord(endT) {
        if (!rec) return null; const R = rec; rec = null; ctx.syncUI();
        const end = endT !== undefined ? endT : ac.currentTime;
        await new Promise(res => setTimeout(res, 160));
        const cs = await R.r.stop(); R.r.dispose();
        if (R.startTime === null) return null;
        const buf = R.r.assemble(cs, Math.round(R.startTime * ac.sampleRate), Math.round(end * ac.sampleRate));
        if (buf.duration < 0.05) return null;
        const asset = K.audio.putBuffer(buf, { name: `take ${nextId} (${R.srcLabel}).wav`, lineage: [{ operation: 'record', source: R.srcLabel }] });
        buffers.set(asset.hash, buf); await ensure(asset.hash);
        const lane = R.lane ? lanes.find(l => l.id === R.lane) : newLane('Take ' + (lanes.length + 1) + ' · ' + R.srcLabel);
        const c = { id: uid('C'), lane: lane.id, hash: asset.hash, name: 'take ' + clips.length, start: R.startBeat, offset: 0, dur: buf.duration, gain: 0, fadeIn: 0.005, fadeOut: 0.01, mute: false };
        clips.push(c); sel = [c.id]; ctx.syncUI(); ctx.emitUI('recorded', { id: c.id });
        return c;
      }
      ctx.recordTake = startRecord; ctx.finishRecord = finishRecord;
      // ---- clip edits (each is a ui: hook → automatically undoable)
      const clipById = (id) => clips.find(c => c.id === id);
      const snapB = (b) => { const s = P.get('snap'); const q = s === 'bar' ? 4 : s === 'beat' ? 1 : s === '1/8' ? 0.5 : s === '1/16' ? 0.25 : 0; return q ? Math.round(b / q) * q : b; };
      function edited() { ctx.syncUI(); resched(); }
      ctx.onUI('clip_move', { type: 'object', required: ['id'] }, (p) => { const c = clipById(p.id); if (!c) return; if (typeof p.start === 'number') c.start = Math.max(0, p.snap === false ? p.start : snapB(p.start)); if (p.lane && lanes.some(l => l.id === p.lane)) c.lane = p.lane; edited(); });
      ctx.onUI('clip_trim', { type: 'object', required: ['id', 'edge', 'beat'] }, (p) => {
        const c = clipById(p.id), buf = c && buffers.get(c.hash); if (!c || !buf) return;
        const b = p.snap === false ? p.beat : snapB(p.beat), min = 0.01;
        if (p.edge === 'left') { const end = c.start + durBeats(c); let nb = Math.min(b, end - min / spb()); let dOff = (nb - c.start) * spb(); if (c.offset + dOff < 0) { dOff = -c.offset; nb = c.start + dOff / spb(); } c.offset += dOff; c.dur -= dOff; c.start = nb; }
        else { const nd = Math.max(min, (b - c.start) * spb()); c.dur = Math.min(nd, buf.duration - c.offset); }
        edited();
      });
      function split(c, beat) {
        if (beat <= c.start || beat >= c.start + durBeats(c)) return null;
        const cut = (beat - c.start) * spb(), d = Object.assign({}, c, { id: uid('C'), start: beat, offset: c.offset + cut, dur: c.dur - cut, fadeIn: 0.005 });
        c.dur = cut; c.fadeOut = 0.005; clips.push(d); return d;
      }
      ctx.onUI('clip_split', { type: 'object' }, (p) => { const beat = typeof p.beat === 'number' ? p.beat : beatNow(); const ids = p.id ? [p.id] : sel.length ? sel : clips.map(c => c.id); const made = []; ids.map(clipById).filter(Boolean).forEach(c => { const d = split(c, beat); if (d) made.push(d.id); }); if (made.length) sel = made; edited(); });
      ctx.onUI('clip_delete', { type: 'object' }, (p) => { const ids = p.ids || sel; clips = clips.filter(c => !ids.includes(c.id)); sel = []; edited(); });
      ctx.onUI('clip_dup', { type: 'object' }, (p) => { const ids = p.ids || sel; const made = []; ids.map(clipById).filter(Boolean).forEach(c => { const d = Object.assign({}, c, { id: uid('C'), start: c.start + durBeats(c) }); clips.push(d); made.push(d.id); }); sel = made; edited(); });
      ctx.onUI('clip_edit', { type: 'object', required: ['id', 'patch'] }, (p) => { const c = clipById(p.id); if (!c) return; ['gain', 'fadeIn', 'fadeOut', 'name', 'mute'].forEach(k => { if (p.patch[k] !== undefined) c[k] = p.patch[k]; }); edited(); });
      ctx.onUI('lane_add', { type: 'object' }, (p) => { newLane(p.name); ctx.syncUI(); });
      ctx.onUI('lane_edit', { type: 'object', required: ['id', 'patch'] }, (p) => { const l = lanes.find(x => x.id === p.id); if (!l) return; ['name', 'mute', 'solo', 'vol', 'color'].forEach(k => { if (p.patch[k] !== undefined) l[k] = p.patch[k]; }); if (liveLanes) lanes.forEach(x => { const g = liveLanes.get(x.id); if (g) dsp.setSmooth(g.gain, audible(x) ? Math.pow(10, x.vol / 20) : 0, ac); }); ctx.syncUI(); });
      ctx.onUI('lane_delete', { type: 'object', required: ['id'] }, (p) => { lanes = lanes.filter(l => l.id !== p.id); clips = clips.filter(c => c.lane !== p.id); if (armed === p.id) armed = null; edited(); });
      ctx.onUI('lane_arm', { type: 'object' }, (p) => { armed = armed === p.id ? null : p.id || null; ctx.syncUI(); });
      ctx.onUI('select', { type: 'object' }, (p) => { sel = (p.ids || []).filter(id => clips.some(c => c.id === id)); ctx.syncUI(); });
      ctx.onUI('record', null, () => { rec ? (playing ? ctx.emit('ui:transport-stop', {}) : finishRecord()) : startRecord(); });
      ctx.onUI('play', null, () => { if (rec) return; if (playing && playing.local) stopLocal(); else if (playing) ctx.emit('ui:transport-stop', {}); else playLocal(); });
      ctx.onUI('stop', null, () => { if (playing && playing.local) stopLocal(); else ctx.emit('ui:transport-stop', {}); });
      ctx.onUI('seek', { type: 'object', required: ['beat'] }, (p) => { head = Math.max(0, p.beat); if (playing && playing.local) { playLocal(); return; } ctx.emit('ui:transport-seek', { bar: Math.floor(head / 4) + 1 }); ctx.emitUI('clock', { playing: !!playing, head }); });
      async function addAudio(ab, name, lane, beat) {
        const a = K.assets.register(ab, { name: name || 'clip' }); const b = await K.assets.decode(a.hash); if (!b) return ctx.fault('ASSET_001', 'could not decode ' + name);
        return place(a.hash, b, name, lane, beat);
      }
      async function place(hash, b, name, lane, beat) {
        buffers.set(hash, b); await ensure(hash);
        const L = (lane && lanes.find(l => l.id === lane)) || (armed && lanes.find(l => l.id === armed)) || newLane(String(name || 'audio').replace(/\.\w+$/, ''));
        const c = { id: uid('C'), lane: L.id, hash, name: String(name || 'audio').replace(/\.\w+$/, ''), start: typeof beat === 'number' ? snapB(beat) : snapB(beatNow()), offset: 0, dur: b.duration, gain: 0, fadeIn: 0.003, fadeOut: 0.01, mute: false };
        clips.push(c); sel = [c.id]; edited(); return c;
      }
      ctx.addAudio = addAudio;
      ctx.onUI('import', { type: 'object', required: ['arrayBuffer'] }, (p) => addAudio(p.arrayBuffer, p.name, p.lane, p.beat));
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, async (p) => { if (p.target !== ctx.id) return; const a = K.assets.get(p.hash); if (!a) return; const b = a.decoded || await K.assets.decode(p.hash); if (b) place(p.hash, b, p.name || a.source); });
      ctx.onUI('want_peaks', null, () => peaks.forEach((pk, hash) => ctx.emitUI('peaks', { hash, peaks: pk, duration: (buffers.get(hash) || {}).duration })));
      // ---- export (offline render — exact and faster than real time)
      function span() {
        const r = P.get('range'), endOf = (cs) => cs.reduce((m, c) => Math.max(m, c.start + durBeats(c)), 0);
        if (r === 'loop' && loopRange && loopRange.startBar) return { from: (loopRange.startBar - 1) * 4, to: (loopRange.endBar - 1) * 4 };
        if (r === 'selection' && sel.length) { const cs = clips.filter(c => sel.includes(c.id)); return { from: Math.min(...cs.map(c => c.start)), to: endOf(cs) }; }
        const from = clips.length ? Math.min(0, ...clips.map(c => c.start)) : 0; return { from, to: endOf(clips) };
      }
      async function render(onlyLane) {
        const { from, to } = span(); const sr = ac.sampleRate, sec = Math.max(0.1, (to - from) * spb() + P.get('tail'));
        await Promise.all(clips.map(c => ensure(c.hash)));
        const A = new OfflineAudioContext(2, Math.ceil(sec * sr), sr), master = A.createGain(); master.connect(A.destination);
        const lg = laneGains(A, master);
        if (onlyLane) lanes.forEach(l => { lg.get(l.id).gain.value = l.id === onlyLane ? Math.pow(10, l.vol / 20) : 0; });
        clips.forEach(c => {
          const buf = buffers.get(c.hash); if (!buf || c.mute) return; const end = c.start + durBeats(c); if (end <= from || c.start >= to + P.get('tail') / spb()) return;
          const fromSec = Math.max(0, (from - c.start) * spb()); voice(lg.get(c.lane), c, buf, Math.max(0, (c.start - from) * spb()), fromSec, A);
        });
        return A.startRendering();
      }
      ctx.render = render;
      let exporting = false;
      ctx.onUI('export', { type: 'object' }, async (p) => {
        if (exporting) return; if (!clips.length) return ctx.emitUI('export_state', { error: 'Nothing recorded yet — press ⏺ and play.' });
        exporting = true; const fmt = p.format || P.get('format'), name = (P.get('songName') || 'song').replace(/[\\/:*?"<>|]+/g, '_');
        try {
          ctx.emitUI('export_state', { busy: true, text: 'rendering…' });
          if (p.stems || P.get('stems')) {
            const files = [];
            for (const l of lanes) { if (!clips.some(c => c.lane === l.id)) continue; const b = await render(l.id); const r = await window.Codecs.encode(b, fmt.startsWith('opus') ? 'wav24' : fmt); files.push({ name: `${name} - ${l.name}.${r.ext}`.replace(/[\\/:*?"<>|]+/g, '_'), data: new Uint8Array(await r.blob.arrayBuffer()) }); ctx.emitUI('export_state', { busy: true, text: `stem ${files.length}/${lanes.length}` }); }
            const z = window.Codecs.zip(files); window.Codecs.download(z, name + ' (stems).zip'); ctx.emitUI('export_state', { done: true, text: `${files.length} stems · ${(z.size / 1048576).toFixed(1)} MB` });
          } else {
            const b = await render(); const r = await window.Codecs.encode(b, fmt, { onProgress: (x) => ctx.emitUI('export_state', { busy: true, text: `encoding ${Math.round(x * 100)}%` }) });
            window.Codecs.download(r.blob, `${name}.${r.ext}`); ctx.emitUI('export_state', { done: true, text: `${r.label} · ${b.duration.toFixed(1)} s · ${(r.bytes / 1048576).toFixed(2)} MB` });
            ctx.lastExport = r;
          }
        } catch (e) { ctx.emitUI('export_state', { error: e.message }); ctx.fault('RUNTIME_003', 'export: ' + e.message); }
        finally { exporting = false; }
      });
      // 3.31: Save to Songs — render, encode small (MP3 192, FLAC if MP3 is unavailable) and hand it to the Songbook
      ctx.onUI('save_song', { type: 'object' }, async () => {
        if (exporting) return; if (!clips.length) return ctx.emitUI('export_state', { error: 'Nothing recorded yet — press ⏺ and play.' });
        exporting = true; const name = String(P.get('songName') || 'my song').trim() || 'my song';
        try {
          ctx.emitUI('export_state', { busy: true, text: 'saving to Songs…' });
          const b = await render(); let r; try { r = await window.Codecs.encode(b, 'mp3-192'); } catch (e) { r = await window.Codecs.encode(b, 'flac16'); }
          const audio = await r.blob.arrayBuffer();
          ctx.emit('song:saved', { name, audio, mime: r.blob.type || 'audio/mpeg', duration: b.duration, bpm: ctx.bpm });
          ctx.emitUI('export_state', { done: true, text: `📖 “${name}” is in Songs → My songs (${b.duration.toFixed(1)} s)` });
        } catch (e) { ctx.emitUI('export_state', { error: e.message }); ctx.fault('RUNTIME_003', 'save to songs: ' + e.message); }
        finally { exporting = false; }
      });
      // ---- persistence (clips reference assets; the workspace carries the audio)
      ctx.saveExtra = () => ({ lanes: lanes.map(l => Object.assign({}, l)), clips: clips.map(c => Object.assign({}, c)), sel: sel.slice(), nextId, armed });
      ctx.loadExtra = (x) => {
        if (!x) return; lanes = (x.lanes || []).map(l => Object.assign({}, l)); clips = (x.clips || []).map(c => Object.assign({}, c)); sel = x.sel || []; nextId = Math.max(nextId, x.nextId || 1); armed = x.armed || null;
        Promise.all(clips.map(c => ensure(c.hash))).then(() => { ctx.syncUI(); resched(); });
        ctx.syncUI();
      };
      ctx.stateExtra = () => ({ lanes, clips, sel, armed, recording: rec ? { waiting: !!rec.waitPlay, startBeat: rec.startBeat, lane: rec.lane } : null, bpm: ctx.bpm, formats: window.Codecs ? window.Codecs.FORMATS.map(f => ({ value: f.id, label: f.label + (f.available() ? '' : ' (n/a here)') })) : [], head, playing: !!playing });
      ctx.internals = { get clips() { return clips; }, get lanes() { return lanes; }, buffers, split, beatNow, schedule, stopAll };
      ctx.onDispose(() => { stopAll(); if (rec) { try { rec.r.dispose(); } catch (e) {} } });
      return {};
    },
  });
})();
