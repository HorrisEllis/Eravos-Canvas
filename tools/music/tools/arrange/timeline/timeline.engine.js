/* eravos.timeline 2.1.0 — Arrangement (P4, P9) · resolves F-07, F-12, G-01, G-02
 * Audio lanes play real clips against song position (sample-accurate BufferSources);
 * pattern lanes cue sequencer slots one bar ahead; markers name sections; loop region; recording lane.
 * 2.1: instrument lanes — note clips play any organism with a note:trigger receiver (synths, drums),
 * edited in the piano roll (timeline.pianoroll.js); chord/progression fill, key-relative. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  let seq = 0; const uid = (p) => p + (++seq) + Math.random().toString(36).slice(2, 5);
  // ---- chord fill data (degrees are 1-based scale degrees of the song key)
  const PROGRESSIONS = {
    anthem: { label: 'Anthem 1–6–3–7', degrees: [1, 6, 3, 7] },
    emotional: { label: 'Emotional 6–7–5–1', degrees: [6, 7, 5, 1] },
    rise: { label: 'Rise 1–5–6–4', degrees: [1, 5, 6, 4] },
    heartbreak: { label: 'Heartbreak 4–6–1–7', degrees: [4, 6, 1, 7] },
    hold: { label: 'Hold 1–1–6–6', degrees: [1, 1, 6, 6] },
  };
  const FILL_STYLES = {
    sustain: { label: 'Sustained chords' },
    future: { label: 'Future-bass chops' },
    pluck: { label: 'Pluck 8ths' },
    bass: { label: 'Bass roots' },
  };
  const FUTURE_HITS = [[0, 3], [3, 3], [6, 2], [8, 2], [10, 2], [12, 3.5]]; // [step, length] per bar
  const isInstrument = (rec) => Array.from(rec.hooks.values()).some(hk => hk.direction === 'in' && hk.event_type === 'note:trigger');
  OrganismFactory.define({
    id: 'eravos.timeline', tempo: false, domain: 'music', version: '2.1.0', label: 'Timeline', icon: '📼', accent: '#00d4ff', phase: 'P4',
    category: 'Arrange', blurb: 'Make the song: instrument tracks with a piano roll, her vocal clips, pattern blocks, section markers.',
    size: { w: 1040, h: 620 }, minSize: { w: 640, h: 300 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'filesystem_read', 'registry_read'],
    provides: ['capability.timeline', 'capability.note_clips', 'capability.audio_out', 'capability.clip_store', 'capability.seek'],
    hooks: [
      S.audio_out('tl.hook.audio_out'), S.transport_in('tl.hook.transport_in'),
      Object.assign(S.event('tl.hook.recorded_in', 'in', 'transport:recorded', { type: 'object', required: ['arrayBuffer'] }, '1.0.0'), { rail: false }),
      S.asset_in('tl.hook.asset_in'),
      // P11 gate D: drum tools announce their pads (name, note, colour) — tracks playing them show pad rows, not piano keys
      Object.assign(S.event('tl.hook.pads_in', 'in', 'pad:bank-change', { type: 'object', required: ['pads'] }, '1.0.0'), { rail: false }),
      S.note_out('tl.hook.note_out'),
      // 3.53 automation lanes: a knob of any tool, moved over the song (sdk-music turns it into a live value at that time)
      Object.assign(S.event('tl.hook.knob_out', 'out', 'knob:live', { type: 'object', required: ['target', 'key'] }, '1.0.0'), { rail: false }),
      S.event('tl.hook.cue_out', 'out', 'seq:pattern_cue', { type: 'object', required: ['target', 'slot'] }, '1.0.0'),
      S.event('tl.hook.seek_out', 'out', 'timeline:seek', { type: 'object', required: ['position_sec', 'bar', 'beat'] }, '1.0.0'),
      S.event('tl.hook.clip_play_out', 'out', 'timeline:clip_play', { type: 'object', required: ['clip_id', 'lane_id', 'asset_id', 'position_sec'] }, '1.0.0'),
      Object.assign(S.event('tl.hook.loop_out', 'out', 'ui:transport-loop|ui:transport-seek|ui:transport-play|ui:transport-bounce|ui:transport-restart', { type: 'object' }, '1.0.0'), { rail: false }),
      Object.assign(S.event('tl.hook.marker_jump_in', 'in', 'ui:marker_jump', { type: 'object', required: ['dir'] }, '1.0.0'), { rail: false, intent: 'previous / next section marker (MIDI pads, keys)' }),
      S.event('tl.hook.marker_out', 'out', 'timeline:marker', { type: 'object', required: ['name', 'bar', 'time'] }, '1.0.0'),
      Object.assign(S.event('tl.hook.length_out', 'out', 'timeline:song_length', { type: 'object', required: ['bars'] }, '1.0.0'), { rail: false }),
    ],
    config: [
      { key: 'pxPerBar', type: 'number', default: 64, min: 8, max: 400, step: 1, label: 'Zoom', group: 'VIEW' },
      { key: 'snap', type: 'enum', options: ['none', 'bar', 'beat', '1/8', '1/16'], default: 'bar', label: 'Snap', group: 'VIEW' },
      { key: 'loopOn', type: 'boolean', default: false, label: 'Loop', group: 'LOOP' },
      { key: 'loopStartBar', type: 'number', default: 1, min: 1, max: 512, step: 1, label: 'Loop start', group: 'LOOP' },
      { key: 'loopEndBar', type: 'number', default: 5, min: 2, max: 513, step: 1, label: 'Loop end', group: 'LOOP' },
      { key: 'follow', type: 'boolean', default: true, label: 'Follow', group: 'VIEW' },
      { key: 'laneH', type: 'integer', default: 48, min: 28, max: 160, label: 'Lane height', group: 'VIEW', hint: 'taller lanes = bigger clips (Alt + wheel over the lanes)' },
      { key: 'songBars', type: 'integer', default: 64, min: 1, max: 512, label: 'Song bars', group: 'VIEW' },
    ],
    ui_hooks: ['transport_play', 'restart', 'seek', 'loop_set', 'lane_add', 'lane_edit', 'lane_remove', 'auto_points', 'rec_knobs', 'clip_add', 'clip_edit', 'clip_remove', 'clip_split', 'clip_duplicate', 'marker_edit', 'bounce', 'drop_file', 'export', 'note_audition', 'clip_fill', 'export_midi', 'export_stems'],
    ui_hook_labels: { clip_add: 'new clip', clip_edit: 'edit clip / notes', clip_remove: 'delete clip', clip_split: 'split clip', clip_duplicate: 'duplicate clip',
      clip_fill: 'fill chords', lane_add: 'new track', lane_edit: 'track settings', lane_remove: 'remove track', marker_edit: 'marker', drop_file: 'drop audio', loop_set: 'loop' },
    restoreTwice: true,
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, K = ctx.K, dsp = ctx.dsp, MT = window.MusicTheory;
      const out = ac.createGain(); ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'arrangement' });
      let lanes = [], clips = [], markers = [];
      const laneNodes = new Map(); // laneId → {gain, pan}
      const buffers = new Map();   // hash → AudioBuffer
      const peaksCache = new Map();
      let scheduled = [];          // {src, g, clipId}
      let playing = false, playT0 = 0, playPos = 1; // playPos in bars (1-based) at playT0
      const barSec = () => 240 / ctx.bpm;

      function laneNode(l) {
        if (!laneNodes.has(l.id)) { const g = ac.createGain(), p = ac.createStereoPanner(); g.connect(p); p.connect(out); laneNodes.set(l.id, { g, p }); ctx.track(g); ctx.track(p); }
        return laneNodes.get(l.id);
      }
      function applyLanes() {
        const solo = lanes.some(l => l.solo);
        lanes.forEach(l => { const n = laneNode(l); n.g.gain.setTargetAtTime((l.mute || (solo && !l.solo)) ? 0 : l.gain, ac.currentTime, 0.01); n.p.pan.setTargetAtTime(l.pan, ac.currentTime, 0.01); });
      }
      function addLane(kind, o) {
        const n = lanes.filter(l => l.kind === kind).length + 1;
        const name = kind === 'audio' ? 'Audio ' + n : kind === 'pattern' ? 'Pattern ' + n : kind === 'inst' ? 'Track ' + n : kind === 'auto' ? 'Automation ' + n : 'Markers';
        const color = kind === 'audio' ? '#aa44ff' : kind === 'pattern' ? '#00d4ff' : kind === 'inst' ? INST_COLORS[(n - 1) % INST_COLORS.length] : kind === 'auto' ? '#ffd24a' : '#ffaa00';
        const l = Object.assign({ id: uid('L'), kind, name, color, gain: 1, pan: 0, mute: false, solo: false, armed: false }, kind === 'inst' ? { target: null } : {}, kind === 'auto' ? { target: null, key: null, points: [], rec: false } : {}, o || {});
        if (kind === 'inst') { // tracks sit right under the markers, in the order they were added
          let at = 0; lanes.forEach((x, i) => { if (x.kind === 'marker' || x.kind === 'inst') at = i + 1; });
          lanes.splice(at, 0, l);
        } else if (kind === 'auto') { // under the track that plays its tool (and its other automation), else at the end
          let at = -1; lanes.forEach((x, i) => { if ((x.kind === 'inst' || x.kind === 'auto') && x.target === l.target) at = i; });
          if (at >= 0) lanes.splice(at + 1, 0, l); else lanes.push(l);
        } else lanes.push(l);
        if (kind === 'audio') laneNode(l); applyLanes(); return l;
      }
      const INST_COLORS = ['#ff66cc', '#66ffcc', '#ffcc44', '#66aaff', '#ff8855', '#bb88ff'];
      addLane('marker'); addLane('pattern'); addLane('audio'); addLane('audio');

      // ---- instruments + note clips (2.1)
      // 3.53: each instrument lane's knobs (what a note can set for itself — the piano roll's expression lanes)
      function knobsOf() {
        const o = {};
        lanes.forEach(l => { if ((l.kind !== 'inst' && l.kind !== 'auto') || !l.target || o[l.target]) return; const r = K.registry.get(l.target); if (!r) return;
          o[l.target] = (r.descriptor.config || []).filter(c => !c.hidden && !c.settingsOnly && (((c.type === 'number' || c.type === 'integer') && isFinite(c.min) && isFinite(c.max)) || (c.type === 'enum' && (c.options || []).length > 1)))
            .map(c => ({ key: c.key, label: c.label || c.key, group: c.group || '', type: c.type, min: c.min, max: c.max, step: c.step, unit: c.unit || '', options: c.options, def: c.default }));
          if (isInstrument(r)) o[l.target].unshift({ key: PITCH.key, label: '〰 Pitch (bend the track)', group: '', type: 'number', min: PITCH.min, max: PITCH.max, step: PITCH.step, unit: 'st', def: 0, lane: true }); });
        return o;
      }
      function instruments() {
        return K.registry.list().filter(r => r.instance_id !== ctx.id && isInstrument(r))
          .map(r => ({ value: r.instance_id, label: (r.descriptor.icon ? r.descriptor.icon + ' ' : '') + (r.descriptor.label || r.organism_id) + ' ·' + r.instance_id.split('-').slice(-1)[0], organism: r.organism_id }));
      }
      const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
      // 3.53 per-note settings: a note may carry p = { knob: value } — that tool's knob for this note only (numbers / strings,
      // at most 16 keys); the tool checks the values against its own ranges when the note plays
      function cleanP(p) {
        if (!p || typeof p !== 'object') return null; const o = {};
        Object.keys(p).slice(0, 16).forEach(k => { const v = p[k]; if (/^[A-Za-z][\w.]{0,40}$/.test(k) && ((typeof v === 'number' && isFinite(v)) || (typeof v === 'string' && v.length <= 40) || typeof v === 'boolean')) o[k] = v; });
        return Object.keys(o).length ? o : null;
      }
      // 3.56 a note's pitch curve: { from, to } semitones (±48), shape, at (where in the note the bend starts) — null if flat
      const BEND_SHAPES = ['smooth', 'linear', 'early', 'late'];
      function cleanB(b) {
        if (!b || typeof b !== 'object') return null; const r2 = (v) => Math.round(clamp(+v || 0, -48, 48) * 100) / 100;
        const o = { from: r2(b.from), to: r2(b.to), shape: BEND_SHAPES.includes(b.shape) ? b.shape : 'smooth', at: Math.round(clamp(+b.at || 0, 0, 0.95) * 100) / 100 };
        const os = cleanNoteOsc(b.osc); if (os) o.osc = os;
        return o.from || o.to || o.osc ? o : null;
      }
      // 3.57 a note's oscillation (vibrato, trill, siren, a wobble that speeds up): rate = a division or Hz, rateTo = where the rate ends
      const NOTE_DIVS = ['4/1', '2/1', '1/1', '1/2', '1/2t', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'], NOTE_OSC = ['sine', 'triangle', 'saw', 'square', 'random'];
      const okRate = (r) => typeof r === 'number' && isFinite(r) ? Math.round(clamp(r, 0.05, 50) * 100) / 100 : NOTE_DIVS.includes(r) ? r : null;
      function cleanNoteOsc(o) {
        if (!o || typeof o !== 'object') return null; const rate = okRate(o.rate), depth = Math.round(clamp(+o.depth || 0, 0, 24) * 100) / 100; if (!rate || !depth) return null;
        const out = { rate, depth, shape: NOTE_OSC.includes(o.shape) ? o.shape : 'sine', fade: Math.round(clamp(+o.fade || 0, 0, 1) * 100) / 100 }, rt = okRate(o.rateTo); if (rt && rt !== rate) out.rateTo = rt; return out;
      }
      function cleanNotes(arr, bars) {
        const max = bars * 16;
        return (Array.isArray(arr) ? arr : []).map(n => ({ s: +n.s, l: +n.l, n: Math.round(+n.n), v: n.v === undefined ? 0.85 : +n.v, p: cleanP(n.p), b: cleanB(n.b) }))
          .filter(n => isFinite(n.s) && isFinite(n.l) && isFinite(n.n) && isFinite(n.v) && n.s >= 0 && n.s < max)
          .map(n => Object.assign({ s: Math.round(n.s * 192) / 192, l: clamp(Math.round(n.l * 192) / 192, 0.125, max - n.s), n: clamp(n.n, 0, 127), v: clamp(n.v, 0.05, 1) }, n.p ? { p: n.p } : {}, n.b ? { b: n.b } : {}))   // 3.48: 1/192 step — exact for 1/64 and every triplet; 1/128-note minimum
          .sort((a, b) => a.s - b.s || a.n - b.n);
      }
      const snap16 = (b) => Math.max(1, 1 + Math.round((b - 1) * 16) / 16);
      function instLane(id, target) {
        let lane = lanes.find(l => l.id === id && l.kind === 'inst');
        if (!lane && target) lane = lanes.find(l => l.kind === 'inst' && l.target === target);
        return lane || lanes.find(l => l.kind === 'inst') || addLane('inst', { target: target || null });
      }
      function addNoteClip(o) {
        const lane = instLane(o.lane, o.target);
        const bars = clamp(Math.round(o.bars || 4), 1, 128);
        const c = { id: uid('C'), kind: 'notes', lane: lane.id, name: o.name || lane.name, startBar: snap16(o.startBar || 1), bars, notes: cleanNotes(o.notes, bars) };
        if (o.fill && typeof o.fill === 'object') fillNotes(c, o.fill.progression, o.fill.style, o.fill.voicing);
        clips.push(c); sync(); return c;
      }
      ctx.addNoteClip = addNoteClip;
      function fillNotes(c, progression, style, voicing) {
        const pr = PROGRESSIONS[progression] || PROGRESSIONS.anthem, st = FILL_STYLES[style] ? style : 'sustain';
        const vc = ['triad', 'seventh', 'add9', 'sus2', 'power', 'single'].includes(voicing) ? voicing : 'add9';
        const k = ctx.key, notes = [];
        for (let b = 0; b < c.bars; b++) {
          const dg = pr.degrees[b % pr.degrees.length], base = b * 16;
          const chord = vc === 'single' ? [MT.degreeToMidi(dg, 4, k.root, k.scale)] : MT.chord(dg, k.root, k.scale, vc, 4), root = MT.degreeToMidi(dg, 2, k.root, k.scale);
          if (st === 'sustain') chord.forEach(n => notes.push({ s: base, l: 16, n, v: 0.75 }));
          else if (st === 'future') FUTURE_HITS.forEach(([s, l], i) => chord.forEach(n => notes.push({ s: base + s, l, n, v: i === 0 ? 0.95 : 0.8 })));
          else if (st === 'pluck') for (let e = 0; e < 8; e++) notes.push({ s: base + e * 2, l: 1.5, n: chord[e % chord.length] + (e >= chord.length && e % 2 ? 12 : 0), v: e % 2 ? 0.7 : 0.9 });
          else for (let e = 0; e < 8; e++) notes.push({ s: base + e * 2, l: 1.75, n: root + (e === 7 ? 12 : 0), v: e % 2 ? 0.8 : 1 });
        }
        c.notes = cleanNotes(notes, c.bars);
      }
      ctx.fillNotes = fillNotes;
      const missingTargets = new Set();
      function playNotes(tk) {
        const solo = lanes.some(l => l.solo);
        clips.forEach(c => {
          if (c.kind !== 'notes') return;
          const lane = lanes.find(l => l.id === c.lane);
          if (!lane || lane.kind !== 'inst' || lane.mute || (solo && !lane.solo) || !lane.target) return;
          const local = tk.step16 - Math.round((c.startBar - 1) * 16);
          if (local < 0 || local >= c.bars * 16) return;
          if (!K.registry.has(lane.target)) {
            if (!missingTargets.has(lane.target)) { missingTargets.add(lane.target); ctx.fault('RUNTIME_003', `track ${lane.name}: instrument ${lane.target} not mounted — pick one in the lane header`); }
            return;
          }
          const sd = tk.stepDur || (60 / ctx.bpm / 4);
          c.notes.forEach(n => {
            if (Math.floor(n.s + 1e-9) !== local) return;
            const len = Math.min(n.l, c.bars * 16 - n.s);
            ctx.emit('note:trigger', Object.assign({ target: lane.target, note: n.n, velocity: n.v, time: tk.time + (n.s - local) * sd, duration: len * sd * 0.98 }, n.p ? { params: n.p } : {}, n.b ? { bend: n.b } : {}));
          });
        });
      }

      async function bufferOf(hash) {
        if (buffers.has(hash)) return buffers.get(hash);
        const a = K.assets.get(hash); if (!a) { ctx.fault('ASSET_001', 'timeline: asset ' + hash + ' not found'); return null; }
        const b = a.decoded || await K.assets.decode(hash); if (!b) return null;
        buffers.set(hash, b); peaksCache.set(hash, dsp.peaks(b, 400)); return b;
      }
      function songEnd() { let e = 1; clips.forEach(c => { e = Math.max(e, c.kind === 'audio' ? c.startBar + c.lengthSec / barSec() : c.startBar + c.bars); }); markers.forEach(m => { e = Math.max(e, m.bar); }); return Math.ceil(e - 1); }
      ctx.songEnd = songEnd;

      // ---- scheduling
      function stopAll(t) { scheduled.forEach(s => { try { s.src.stop(Math.max(t, ac.currentTime)); } catch (e) {} }); scheduled = []; }
      function scheduleFrom(posBar, t0) {
        playT0 = t0; playPos = posBar;
        const solo = lanes.some(l => l.solo);
        clips.filter(c => c.kind === 'audio').forEach(c => {
          const lane = lanes.find(l => l.id === c.lane); if (!lane) return;
          const b = buffers.get(c.assetHash); if (!b) return;
          const clipEndBar = c.startBar + c.lengthSec / barSec();
          if (clipEndBar <= posBar) return;
          const startIn = (c.startBar - posBar) * barSec();              // seconds from t0 (may be negative)
          const when = t0 + Math.max(0, startIn);
          const skip = Math.max(0, -startIn);                           // play from mid-clip: offset = P − clipStart
          const src = ac.createBufferSource(); src.buffer = b; src.loop = !!c.loop;
          if (c.loop) { src.loopStart = c.offsetSec; src.loopEnd = Math.min(b.duration, c.offsetSec + (c.loopLen || b.duration - c.offsetSec)); }
          const g = ac.createGain();
          const fi = c.fadeIn || 0, fo = c.fadeOut || 0, len = c.lengthSec;
          // gain envelope in clip-local time, shifted by skip
          const at = (x) => when + (x - skip);
          if (fi > 0 && skip < fi) { g.gain.setValueAtTime(c.gain * (skip / fi), when); g.gain.linearRampToValueAtTime(c.gain, at(fi)); } else g.gain.setValueAtTime(c.gain, when);
          if (fo > 0) { const s0 = Math.max(skip, len - fo); g.gain.setValueAtTime(c.gain * Math.min(1, (len - s0) / fo), at(s0)); g.gain.linearRampToValueAtTime(0, at(len)); }
          src.connect(g); g.connect(laneNode(lane).g);
          const offset = c.loop ? c.offsetSec + (skip % (src.loopEnd - src.loopStart || 1)) : c.offsetSec + skip;
          src.start(when, offset, c.loop ? undefined : Math.max(0, len - skip));
          if (c.loop) src.stop(at(len));
          scheduled.push({ src, g, clipId: c.id, when });
          ctx.track(src);
          src.onended = () => { try { g.disconnect(); } catch (e) {} ctx.untrack(src); };
          ctx.emit('timeline:clip_play', { clip_id: c.id, lane_id: lane.id, asset_id: c.assetHash, position_sec: offset, time: when });
        });
        markers.forEach(m => { if (m.bar >= posBar - 1e-6) ctx.emit('timeline:marker', { name: m.name, bar: m.bar, time: t0 + (m.bar - posBar) * barSec() }); });
        // pattern clips covering the start position → cue now
        clips.filter(c => c.kind === 'pattern' && c.startBar <= posBar + 1e-6 && c.startBar + c.bars > posBar).forEach(c => { if (c.target) ctx.emit('seq:pattern_cue', { target: c.target, slot: c.slot }); });
      }
      ctx.scheduleFrom = scheduleFrom; ctx.scheduled = () => scheduled;
      ctx.onPlay((p) => { playing = true; stopAll(p.time); scheduleFrom((p.step16 || 0) / 16 + 1, p.time); });
      ctx.onStop((p) => { playing = false; stopAll(p && p.time !== undefined ? p.time : ac.currentTime); ctx.emitUI('playhead_update', { bar: null }); releaseAuto(); endTakes(); });
      ctx.on('transport:loop', null, (p) => { if (!playing) return; stopAll(p.time); scheduleFrom(p.toStep16 / 16 + 1, p.time); });
      ctx.onTick((tk) => {
        curBar = tk.step16 / 16 + 1; lastTk = tk;
        playNotes(tk); playAuto(tk);
        // pattern clips: cue one bar ahead of their start bar
        if (tk.step16 % 16 === 0) clips.forEach(c => { if (c.kind === 'pattern' && c.target && Math.abs(c.startBar - (tk.bar + 1)) < 1e-6) ctx.emit('seq:pattern_cue', { target: c.target, slot: c.slot, bar: c.startBar }); });
        if (tk.sixteenth === 1 || tk.step16 % 4 === 0) ctx.emitUI('playhead_update', { bar: tk.bar + (tk.beat - 1) / 4, beat: tk.beat, position_sec: tk.step16 * tk.stepDur, time: tk.time });
      });

      // ---- asset / recording intake
      async function addAudioClip(hash, name, bar, laneId) {
        const b = await bufferOf(hash); if (!b) return null;
        let lane = lanes.find(l => l.id === laneId) || lanes.find(l => l.kind === 'audio' && !clips.some(c => c.lane === l.id && c.startBar < bar + b.duration / barSec() && c.startBar + c.lengthSec / barSec() > bar)) || addLane('audio');
        const c = { id: uid('C'), kind: 'audio', lane: lane.id, assetHash: hash, name: name || (K.assets.get(hash) || {}).source || 'clip', startBar: bar, offsetSec: 0, lengthSec: b.duration, gain: 1, fadeIn: 0, fadeOut: 0, loop: false };
        clips.push(c); sync(); return c;
      }
      ctx.addAudioClip = addAudioClip;
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, (p) => {
        const wired = K.wires.list().some(w => w.dst.instanceId === ctx.id && w.dst.hookId === 'tl.hook.asset_in' && w.src.instanceId === p._from);
        if (p.target !== ctx.id && !wired) return;
        addAudioClip(p.hash, p.name, typeof p.bar === 'number' ? p.bar : snapBar(currentBar()));
      });
      ctx.on('transport:recorded', { type: 'object', required: ['arrayBuffer'] }, (p) => {
        if (p.tag) { if (stemWait && p.tag === stemWait.tag) stemWait.res(p); return; }
        const lane = lanes.find(l => l.kind === 'audio' && l.armed); if (!lane) return;
        p.claimed = true;
        const a = K.assets.register(p.arrayBuffer, { name: 'recording-' + new Date().toISOString().slice(11, 19) + '.wav', mime: 'audio/wav' });
        if (p.buffer) { a.decoded = p.buffer; }
        addAudioClip(a.hash, a.source, (p.startStep16 || 0) / 16 + 1, lane.id);
      });
      function currentBar() { return playing ? playPos + Math.max(0, ac.currentTime - playT0) / barSec() : 1; }
      function snapBar(b) {
        const s = P.get('snap'); const q = { none: 0, bar: 1, beat: 0.25, '1/8': 0.125, '1/16': 0.0625 }[s];
        return q ? Math.max(1, 1 + Math.round((b - 1) / q) * q) : Math.max(1, b);
      }
      ctx.snapBar = snapBar;

      // ---- UI hooks
      const drumNames = new Map(); // instance → [{note, name, color}]
      ctx.on('pad:bank-change', { type: 'object', required: ['pads'] }, (p) => {
        if (!p._from || !Array.isArray(p.pads)) return;
        const list = p.pads.map((x, i) => ({ note: typeof x.note === 'number' ? x.note : 36 + i, name: String(x.name || x.sound || 'pad ' + (i + 1)), color: x.color || null }));
        const prev = drumNames.get(p._from); drumNames.set(p._from, list);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(list)) setTimeout(sync, 0);
      });
      function drumNamesLive() { const o = {}; drumNames.forEach((v, k) => { if (K.registry.has(k)) o[k] = v; }); return o; }
      ctx.drumNames = drumNamesLive;
      function sync() {
        applyLanes();
        const peaks = {}; clips.forEach(c => { if (c.kind === 'audio' && peaksCache.has(c.assetHash)) peaks[c.assetHash] = peaksCache.get(c.assetHash); });
        const end = songEnd();
        ctx.emitUI('arrangement_sync', { lanes, clips, markers, peaks, barSec: barSec(), songEnd: end, key: ctx.key, instruments: instruments(), drumNames: drumNamesLive(), knobs: knobsOf(), recKnobs: recAll,
          progressions: Object.keys(PROGRESSIONS).map(k => ({ value: k, label: PROGRESSIONS[k].label })), fillStyles: Object.keys(FILL_STYLES).map(k => ({ value: k, label: FILL_STYLES[k].label })), sequencers: K.registry.byOrganism('eravos.sequencer').map(r => ({ value: r.instance_id, label: '⬛ ' + r.instance_id.split('-').slice(-2).join('') })) });
        ctx.emit('timeline:song_length', { bars: Math.max(end, 1) });
      }
      ctx.sync = sync;
      ctx.onBpm(() => sync());
      ctx.onKey(() => sync());
      ctx.onUI('transport_play', null, () => ctx.emit('ui:transport-play', { toggle: true }));
      ctx.onUI('restart', null, () => ctx.emit('ui:transport-restart', {}));
      // 3.35: jump to the previous / next marker from where the playhead is (prev from just past a marker goes one further back)
      let curBar = 1;
      ctx.on('transport:loop', null, (p) => { if (p && typeof p.toStep16 === 'number') curBar = p.toStep16 / 16 + 1; });
      ctx.on('ui:marker_jump', { type: 'object', required: ['dir'] }, (p) => {
        const ms = markers.map(m => m.bar).sort((a, b) => a - b); if (!ms.length) return;
        const to = p.dir > 0 ? ms.find(b => b > curBar + 0.01) : ms.filter(b => b < curBar - 0.5).pop();
        const bar = to !== undefined ? to : (p.dir > 0 ? null : 1); if (bar === null) return;
        curBar = bar; ctx.emit('ui:transport-seek', { bar }); ctx.emitUI('playhead_update', { bar });
      });
      ctx.curBar = () => curBar;
      ctx.onUI('seek', { type: 'object', required: ['bar'], properties: { bar: { type: 'number', minimum: 1 } } }, (p) => {
        const bar = snapBar(p.bar); curBar = bar;
        ctx.emit('ui:transport-seek', { bar });
        ctx.emit('timeline:seek', { position_sec: (bar - 1) * barSec(), bar: Math.floor(bar), beat: Math.floor(((bar - 1) % 1) * 4) + 1 });
        ctx.emitUI('playhead_update', { bar });
      });
      ctx.onUI('loop_set', { type: 'object' }, (p) => {
        if (p.start !== undefined) P.set('loopStartBar', Math.max(1, Math.round(p.start)));
        if (p.end !== undefined) P.set('loopEndBar', Math.max(P.get('loopStartBar') + 1, Math.round(p.end)));
        if (p.on !== undefined) P.set('loopOn', !!p.on);
        ctx.emit('ui:transport-loop', { on: P.get('loopOn'), start: P.get('loopStartBar'), end: P.get('loopEndBar') });
      });
      function validTarget(t) { const r = t && K.registry.get(t); return !!(r && isInstrument(r)); }
      // ---- 3.53 AUTOMATION LANES — a knob of a tool over song position: points [[bar, value]] (bar 1 = the start; numbers
      // ramp straight between points, choices hold until the next point). Playing: every 16th, four values (each 1/64)
      // go out as knob:live at their audio time; the tool holds the knob there (a live value — never saved, never undone)
      // and gets it back when the song stops. RECORD WHAT YOU PLAY (the trajectory-recorder idea, made for ERAVOS): an armed
      // lane (●) writes the knob as you turn it while the song plays — over what was there in that stretch — thinned when
      // you stop; '⏺ knobs' arms everything: any knob you turn on a track's tool gets its own lane.
      let lastTk = null, recAll = false;
      // 3.57 PITCH — a virtual knob every instrument has: a lane on it bends the whole track over the song (sdk-music lanePitch)
      const PITCH = { key: '@pitch', label: 'Pitch', group: 'PITCH', type: 'number', min: -24, max: 24, step: 0.1, unit: 'st', default: 0 };
      const knobCfg = (target, key) => { const r = K.registry.get(target); if (!r) return null; if (key === '@pitch') return isInstrument(r) ? PITCH : null; return (r.descriptor.config || []).find(c => c.key === key); };
      function cleanPoints(pts, c) {
        const out = []; (Array.isArray(pts) ? pts : []).forEach(q => { if (!Array.isArray(q)) return; const b = +q[0]; let v = q[1]; if (!isFinite(b) || b < 1 || b > 2049) return;
          if (c && c.type === 'enum') { if (!(c.options || []).map(String).includes(String(v))) return; v = c.options.find(o => String(o) === String(v)); }
          else { v = +v; if (!isFinite(v)) return; if (c && isFinite(c.min) && isFinite(c.max)) v = clamp(v, c.min, c.max); }
          out.push([Math.round(b * 1e4) / 1e4, v]); });
        out.sort((a, b) => a[0] - b[0]); return out.filter((q, i) => !i || q[0] !== out[i - 1][0] || (out[i - 1] = q, false)).slice(0, 4000);
      }
      function valueAt(pts, bar, c) {
        if (!pts.length) return undefined; if (bar <= pts[0][0]) return pts[0][1]; const L = pts[pts.length - 1]; if (bar >= L[0]) return L[1];
        let i = 1; while (pts[i][0] < bar) i++; const a = pts[i - 1], b = pts[i];
        if (c && c.type === 'enum' || typeof a[1] !== 'number') return a[1];
        const v = a[1] + (b[1] - a[1]) * (bar - a[0]) / (b[0] - a[0]); return c && c.type === 'integer' ? Math.round(v) : +v.toFixed(6);
      }
      ctx.valueAt = valueAt;
      // 3.57 OSCILLATE — a lane can swing around its curve: rate (a note division, locked to the song) or Hz, depth in the knob's
      // own units (semitones on Pitch), a shape. The phase is the song position, so every pass through the bar sounds the same.
      const RATE_DIV = { '4/1': 1 / 16, '2/1': 1 / 8, '1/1': 0.25, '1/2': 0.5, '1/2t': 0.75, '1/4': 1, '1/4t': 1.5, '1/8': 2, '1/8t': 3, '1/16': 4, '1/16t': 6, '1/32': 8 };
      const OSC_SHAPES = ['sine', 'triangle', 'saw', 'square', 'random'];
      function cleanOsc(o, c) {
        if (!o || typeof o !== 'object' || !c || c.type === 'enum') return null;
        const rate = typeof o.rate === 'number' ? clamp(o.rate, 0.05, 20) : RATE_DIV[o.rate] ? o.rate : null, half = (c.max - c.min) / 2, depth = clamp(+o.depth || 0, 0, half);
        if (!rate || !depth) return null; return { rate, depth: +depth.toFixed(4), shape: OSC_SHAPES.includes(o.shape) ? o.shape : 'sine' };
      }
      const wave = (shape, ph) => { const f = ph - Math.floor(ph); if (shape === 'triangle') return 1 - 4 * Math.abs(f - 0.5); if (shape === 'saw') return 2 * f - 1; if (shape === 'square') return f < 0.5 ? 1 : -1;
        if (shape === 'random') { const x = Math.sin(Math.floor(ph) * 12.9898 + 78.233) * 43758.5453; return 2 * (x - Math.floor(x)) - 1; } return Math.sin(2 * Math.PI * f); };
      function oscAt(o, bar, beatSec, v, c) {
        const beats = (bar - 1) * 4, ph = typeof o.rate === 'number' ? beats * beatSec * o.rate : beats * RATE_DIV[o.rate];
        let x = v + o.depth * wave(o.shape, ph); x = clamp(x, c.min, c.max); return c.type === 'integer' ? Math.round(x) : +x.toFixed(4);
      }
      ctx.oscAt = oscAt; ctx.cleanOsc = cleanOsc;
      const sentAuto = new Map();   // lane id → last value sent
      function playAuto(tk) {
        const solo = lanes.some(l => l.solo);
        lanes.forEach(l => {
          if (l.kind !== 'auto' || l.mute || (solo && !l.solo) || !l.target || !l.key || (!l.points.length && !l.osc) || !K.registry.has(l.target)) return;
          if (l.rec && takes.has(l.id)) return;   // writing: your hand has the knob
          const c = knobCfg(l.target, l.key), os = l.osc && c && c.type !== 'enum' ? l.osc : null, N = os ? 8 : 4;
          if (os && !l.points.length && l._base === undefined) l._base = l.key === '@pitch' ? 0 : +K.registry.readParam(ctx.id, l.target, l.key) || 0;
          for (let k = 0; k < N; k++) {
            const bar = (tk.step16 + k / N) / 16 + 1; let v = l.points.length ? valueAt(l.points, bar, c) : l._base;
            if (os && v !== undefined) { v = oscAt(os, bar, tk.stepDur * 4, v, c); }
            if (v === undefined || sentAuto.get(l.id) === v) continue; sentAuto.set(l.id, v);
            ctx.emit('knob:live', { target: l.target, key: l.key, value: v, time: tk.time + k * tk.stepDur / N });
          }
        });
      }
      function releaseAuto() { lanes.forEach(l => { delete l._base; if (l.kind === 'auto' && l.target && l.key && sentAuto.has(l.id)) ctx.emit('knob:live', { target: l.target, key: l.key, value: null }); }); sentAuto.clear(); }
      ctx.playAuto = playAuto;
      // -- recording: a take per lane — points written while the song plays, thinned when it stops
      const takes = new Map(), watched = new Map();   // lane id → { from, pts } · target → unsubscribe
      const songBar = () => { if (!lastTk) return curBar || 1; const dt = Math.max(0, ac.currentTime - lastTk.time); return (lastTk.step16 + dt / (lastTk.stepDur || 0.125)) / 16 + 1; };
      ctx.songBar = songBar;
      function heard(target, p) {
        if (!playing || !p || typeof p.key !== 'string') return;
        let l = lanes.find(x => x.kind === 'auto' && x.target === target && x.key === p.key && x.rec);
        if (!l && recAll && lanes.some(x => x.kind === 'inst' && x.target === target)) { const c = knobCfg(target, p.key); if (!c || !(c.type === 'number' || c.type === 'integer' || c.type === 'enum')) return; l = addLane('auto', { target, key: p.key, name: (c.label || p.key), rec: true }); }
        if (!l) return;
        const c = knobCfg(target, p.key), bar = songBar(); let t = takes.get(l.id);
        if (!t) { t = { from: bar, pts: [] }; takes.set(l.id, t); }
        const v = c && c.type === 'enum' ? p.value : +p.value; if (v === undefined || (typeof v === 'number' && !isFinite(v))) return;
        t.pts.push([bar, v]);
        l.points = cleanPoints(l.points.filter(q => q[0] < t.from - 1e-6 || q[0] > bar + 1e-6).concat(t.pts), c);   // over what was there, live
        ctx.emitUI('auto_live', { id: l.id, points: l.points });
      }
      function thin(pts, eps) {   // Ramer–Douglas–Peucker on (bar, value): keeps the shape, drops the redundant points
        if (pts.length < 3 || typeof pts[0][1] !== 'number') return pts;
        const span = Math.max(1e-9, Math.max(...pts.map(q => q[1])) - Math.min(...pts.map(q => q[1]))), keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true;
        const st = [[0, pts.length - 1]];
        while (st.length) { const [a, b] = st.pop(); let mx = 0, at = -1; for (let i = a + 1; i < b; i++) { const t = (pts[i][0] - pts[a][0]) / ((pts[b][0] - pts[a][0]) || 1), y = pts[a][1] + (pts[b][1] - pts[a][1]) * t, d = Math.abs(pts[i][1] - y) / span; if (d > mx) { mx = d; at = i; } } if (mx > eps && at > 0) { keep[at] = true; st.push([a, at], [at, b]); } }
        return pts.filter((_, i) => keep[i]);
      }
      function endTakes() {
        if (!takes.size) return;
        takes.forEach((t, id) => { const l = lanes.find(x => x.id === id); if (!l) return; const c = knobCfg(l.target, l.key); const mine = l.points.filter(q => q[0] >= t.from - 1e-6 && q[0] <= t.pts[t.pts.length - 1][0] + 1e-6); l.points = cleanPoints(l.points.filter(q => !mine.includes(q)).concat(thin(mine, 0.005)), c); });
        takes.clear(); sync();
      }
      function watch() {   // listen to the knobs of every tool an armed lane (or ⏺ knobs) is recording
        const want = new Set(); lanes.forEach(l => { if (l.kind === 'auto' && l.rec && l.target) want.add(l.target); if (recAll && l.kind === 'inst' && l.target) want.add(l.target); });
        watched.forEach((un, t) => { if (!want.has(t)) { un(); watched.delete(t); } });
        want.forEach(t => { if (!watched.has(t)) watched.set(t, ctx.on('ui:config_change:' + t, null, (p) => heard(t, p))); });
      }
      ctx.onUI('auto_points', { type: 'object', required: ['id', 'points'] }, (p) => { const l = lanes.find(x => x.id === p.id && x.kind === 'auto'); if (!l) return ctx.fault('RUNTIME_002', 'automation lane ' + p.id); l.points = cleanPoints(p.points, knobCfg(l.target, l.key)); sentAuto.delete(l.id); sync(); });
      ctx.onUI('rec_knobs', { type: 'object', required: ['on'] }, (p) => { recAll = !!p.on; watch(); sync(); });
      ctx.onUI('lane_add', { type: 'object', required: ['kind'] }, (p) => {
        if (!['audio', 'pattern', 'marker', 'inst', 'auto'].includes(p.kind)) return ctx.fault('RUNTIME_002', 'lane kind');
        if (p.kind === 'auto') {
          const c = p.target && p.key && knobCfg(p.target, p.key); if (!c) return ctx.fault('RUNTIME_002', 'automation: ' + p.target + ' has no knob ' + p.key);
          addLane('auto', { target: p.target, key: p.key, name: p.name || c.label || p.key, points: cleanPoints(p.points, c), rec: !!p.rec }); watch(); sync(); return;
        }
        if (p.kind === 'inst') {
          if (p.target && !validTarget(p.target)) return ctx.fault('RUNTIME_002', 'lane target ' + p.target + ' is not an instrument');
          const r = p.target && K.registry.get(p.target), o = { target: p.target || null }, nm = p.name || (r && r.descriptor.label);
          if (nm) o.name = nm;
          addLane('inst', o);
        } else addLane(p.kind);
        sync();
      });
      ctx.onUI('lane_edit', { type: 'object', required: ['id', 'patch'] }, (p) => {
        const l = lanes.find(x => x.id === p.id); if (!l) return ctx.fault('RUNTIME_002', 'lane ' + p.id);
        if (p.patch.target !== undefined) {
          if (l.kind !== 'inst') return ctx.fault('RUNTIME_002', 'only instrument lanes have a target');
          if (p.patch.target !== null && !validTarget(p.patch.target)) return ctx.fault('RUNTIME_002', 'lane target ' + p.patch.target + ' is not an instrument');
          l.target = p.patch.target; missingTargets.delete(l.target);
        }
        ['name', 'color', 'gain', 'pan', 'mute', 'solo', 'armed'].forEach(k => { if (p.patch[k] !== undefined) l[k] = p.patch[k]; });
        if (l.kind === 'auto' && p.patch.rec !== undefined) { l.rec = !!p.patch.rec; watch(); }
        if (l.kind === 'auto' && p.patch.osc !== undefined) { const o = cleanOsc(p.patch.osc, knobCfg(l.target, l.key)); if (o) l.osc = o; else delete l.osc; delete l._base; sentAuto.delete(l.id); }
        if (l.kind === 'auto' && p.patch.mute && sentAuto.has(l.id)) { ctx.emit('knob:live', { target: l.target, key: l.key, value: null }); sentAuto.delete(l.id); }
        if (p.patch.armed) lanes.forEach(o => { if (o !== l) o.armed = false; }); sync();
      });
      ctx.onUI('lane_remove', { type: 'object', required: ['id'] }, (p) => { const gone = lanes.find(l => l.id === p.id); if (gone && gone.kind === 'auto' && gone.target && sentAuto.has(gone.id)) { ctx.emit('knob:live', { target: gone.target, key: gone.key, value: null }); sentAuto.delete(gone.id); } lanes = lanes.filter(l => l.id !== p.id); clips = clips.filter(c => c.lane !== p.id); const n = laneNodes.get(p.id); if (n) { n.g.disconnect(); n.p.disconnect(); laneNodes.delete(p.id); } sync(); });
      ctx.onUI('clip_add', { type: 'object', required: ['kind'] }, async (p) => {
        if (p.kind === 'audio') { if (!p.hash) return ctx.fault('RUNTIME_002', 'clip_add audio needs hash'); await addAudioClip(p.hash, p.name, snapBar(p.startBar || 1), p.lane); }
        else if (p.kind === 'notes') addNoteClip(p);
        else if (p.kind === 'pattern') { let lane = lanes.find(l => l.id === p.lane) || lanes.find(l => l.kind === 'pattern') || addLane('pattern'); clips.push({ id: uid('C'), kind: 'pattern', lane: lane.id, target: p.target || (K.registry.byOrganism('eravos.sequencer')[0] || {}).instance_id || null, slot: p.slot || 'A', startBar: Math.max(1, Math.round(p.startBar || 1)), bars: Math.max(1, Math.round(p.bars || 4)) }); sync(); }
      });
      ctx.onUI('clip_edit', { type: 'object', required: ['id', 'patch'] }, (p) => {
        const c = clips.find(x => x.id === p.id); if (!c) return ctx.fault('RUNTIME_002', 'clip ' + p.id);
        const ok = c.kind === 'audio' ? ['startBar', 'offsetSec', 'lengthSec', 'gain', 'fadeIn', 'fadeOut', 'loop', 'lane', 'name'] : c.kind === 'notes' ? ['startBar', 'bars', 'lane', 'name', 'notes'] : ['startBar', 'bars', 'slot', 'target', 'lane'];
        if (p.patch.lane !== undefined) { const nl = lanes.find(l => l.id === p.patch.lane); const want = c.kind === 'audio' ? 'audio' : c.kind === 'notes' ? 'inst' : 'pattern'; if (!nl || nl.kind !== want) return ctx.fault('RUNTIME_002', `clip ${c.id} cannot move to lane ${p.patch.lane}`); }
        Object.keys(p.patch).forEach(k => { if (ok.includes(k)) c[k] = p.patch[k]; });
        if (c.kind === 'audio') { const b = buffers.get(c.assetHash); c.startBar = Math.max(1, c.startBar); c.offsetSec = Math.max(0, Math.min(b ? b.duration - 0.01 : 1e9, c.offsetSec)); if (!c.loop && b) c.lengthSec = Math.max(0.01, Math.min(b.duration - c.offsetSec, c.lengthSec)); c.fadeIn = Math.max(0, Math.min(c.lengthSec, c.fadeIn)); c.fadeOut = Math.max(0, Math.min(c.lengthSec - c.fadeIn, c.fadeOut)); }
        else if (c.kind === 'notes') { c.startBar = snap16(+c.startBar || 1); c.bars = clamp(Math.round(+c.bars || 1), 1, 128); c.notes = cleanNotes(c.notes, c.bars); }
        else { c.startBar = Math.max(1, Math.round(c.startBar)); c.bars = Math.max(1, Math.round(c.bars)); }
        sync();
      });
      ctx.onUI('clip_remove', { type: 'object', required: ['id'] }, (p) => { clips = clips.filter(c => c.id !== p.id); sync(); });
      function split(id, bar) {
        const c = clips.find(x => x.id === id); if (!c) return null;
        if (c.kind === 'audio') {
          const cut = (bar - c.startBar) * barSec(); if (cut <= 0.005 || cut >= c.lengthSec - 0.005) return null;
          const d = Object.assign({}, c, { id: uid('C'), startBar: bar, offsetSec: c.offsetSec + cut, lengthSec: c.lengthSec - cut, fadeIn: 0 });
          c.lengthSec = cut; c.fadeOut = 0; clips.push(d); sync(); return [c, d];
        }
        const nb = Math.round(bar - c.startBar); if (nb <= 0 || nb >= c.bars) return null;
        if (c.kind === 'notes') {
          const cut = nb * 16, left = [], right = [];
          c.notes.forEach(n => { if (n.s < cut) left.push(Object.assign({}, n, { l: Math.min(n.l, cut - n.s) })); else right.push(Object.assign({}, n, { s: n.s - cut })); });
          const d = { id: uid('C'), kind: 'notes', lane: c.lane, name: c.name, startBar: c.startBar + nb, bars: c.bars - nb, notes: right };
          c.bars = nb; c.notes = left; clips.push(d); sync(); return [c, d];
        }
        const d = Object.assign({}, c, { id: uid('C'), startBar: c.startBar + nb, bars: c.bars - nb }); c.bars = nb; clips.push(d); sync(); return [c, d];
      }
      ctx.split = split;
      ctx.onUI('clip_split', { type: 'object', required: ['id', 'bar'] }, (p) => split(p.id, p.bar));
      ctx.onUI('clip_duplicate', { type: 'object', required: ['id'] }, (p) => {
        const c = clips.find(x => x.id === p.id); if (!c) return ctx.fault('RUNTIME_002', 'clip ' + p.id);
        const len = c.kind === 'audio' ? c.lengthSec / barSec() : c.bars;
        const d = JSON.parse(JSON.stringify(c)); d.id = uid('C');
        d.startBar = p.startBar !== undefined ? snapBar(p.startBar) : (c.kind === 'notes' ? snap16(c.startBar + len) : snapBar(c.startBar + len));
        clips.push(d); sync(); return d;
      });
      ctx.onUI('clip_fill', { type: 'object', required: ['id'] }, (p) => {
        const c = clips.find(x => x.id === p.id); if (!c || c.kind !== 'notes') return ctx.fault('RUNTIME_002', 'clip_fill needs a note clip');
        fillNotes(c, p.progression, p.style, p.voicing); sync();
      });
      ctx.onUI('note_audition', { type: 'object', required: ['note'] }, (p) => {
        const lane = lanes.find(l => l.id === p.lane); const target = (lane && lane.target) || p.target;
        if (!target || !K.registry.has(target)) return;
        const b = cleanB(p.bend), dur = b ? clamp(+p.duration || 0.9, 0.1, 4) : 0.3;   // 3.56: hear the curve while you shape it
        (Array.isArray(p.notes) ? p.notes : [p.note]).forEach(n => ctx.emit('note:trigger', Object.assign({ target, note: clamp(Math.round(n), 0, 127), velocity: 0.8, time: ac.currentTime + 0.01, duration: dur }, b ? { bend: b } : {})));
      });
      ctx.onUI('marker_edit', { type: 'object', required: ['op'] }, (p) => {
        if (p.op === 'add') markers.push({ bar: snapBar(p.bar || 1), name: p.name || 'marker' });
        else if (p.op === 'rename') { const m = markers[p.index]; if (m) m.name = p.name; }
        else if (p.op === 'move') { const m = markers[p.index]; if (m) m.bar = snapBar(p.bar); }
        else if (p.op === 'remove') markers.splice(p.index, 1);
        markers.sort((a, b) => a.bar - b.bar); sync();
      });
      ctx.onUI('bounce', null, () => ctx.emit('ui:transport-bounce', { bars: Math.max(1, songEnd()) }));
      ctx.onUI('drop_file', { type: 'object', required: ['arrayBuffer', 'bar'] }, async (p) => {
        const a = K.assets.register(p.arrayBuffer, { name: p.name || 'clip', mime: 'audio/*' });
        await addAudioClip(a.hash, p.name, snapBar(p.bar), p.lane);
      });
      ctx.onUI('export', null, () => ctx.emitUI('export_ready', { name: 'arrangement.json', mime: 'application/json', data: JSON.stringify({ eravos_arrangement: 1, lanes, clips, markers }, null, 1) }));
      // ---- P11 gate X: the song's notes as a Standard MIDI File — one track per instrument lane, drums on channel 10
      function midiSong() {
        const ppq = 96, tick16 = ppq / 4, tracks = [];
        lanes.filter(l => l.kind === 'inst').forEach(l => {
          const rec = l.target && K.registry.get(l.target), isDrums = !!(rec && /pad|drum/i.test(rec.organism_id || ''));
          const events = [];
          clips.filter(c => c.kind === 'notes' && c.lane === l.id).forEach(c => { const o16 = Math.round((c.startBar - 1) * 16); c.notes.forEach(n => events.push({ tick: Math.round((o16 + n.s) * tick16), dur: Math.max(1, Math.round(n.l * tick16)), note: n.n, vel: n.v })); });
          if (events.length) tracks.push({ name: l.name + (rec ? ' — ' + rec.descriptor.label : ''), events, drums: isDrums });
        });
        return { ppq, tempo: ctx.bpm, tracks };
      }
      ctx.midiSong = midiSong;
      ctx.onUI('export_midi', null, () => {
        const song = midiSong(); if (!song.tracks.length) return ctx.emitUI('export_state', { error: 'No note clips to export yet — add an instrument track with notes.' });
        const bytes = MT.midi.write(song);
        ctx.emitUI('export_ready', { name: 'song.mid', mime: 'audio/midi', data: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes) });
        ctx.emitUI('export_state', { done: true, text: `MIDI: ${song.tracks.length} track(s), ${song.tracks.reduce((a, t) => a + t.events.length, 0)} notes` });
      });
      // ---- P11 gate X: stems — each track bounced on its own (solo), in real time, then zipped
      let stemWait = null, stemsBusy = false;
      ctx.onUI('export_stems', null, async () => {
        if (stemsBusy) return; const bars = Math.max(1, songEnd());
        const which = lanes.filter(l => (l.kind === 'inst' && clips.some(c => c.lane === l.id)) || (l.kind === 'audio' && clips.some(c => c.lane === l.id)));
        if (!which.length) return ctx.emitUI('export_state', { error: 'Nothing on the tracks yet — add clips first.' });
        stemsBusy = true; const keep = lanes.map(l => [l, l.solo]), files = [];
        try {
          for (let i = 0; i < which.length; i++) {
            lanes.forEach(l => { l.solo = l === which[i]; }); applyLanes(); sync();
            ctx.emitUI('export_state', { progress: i / which.length, text: `Stem ${i + 1} of ${which.length}: ${which[i].name} (plays in real time)` });
            const tag = 'stem:' + ctx.id + ':' + i;
            const got = await new Promise(res => { stemWait = { tag, res }; ctx.emit('ui:transport-bounce', { bars, tag }); setTimeout(() => res(null), (bars * barSec() + 10) * 1000); });
            stemWait = null;
            if (!got) { ctx.fault('RUNTIME_003', `stem ${which[i].name}: the bounce didn’t finish`); continue; }
            files.push({ name: String(i + 1).padStart(2, '0') + ' ' + which[i].name.replace(/[^\w\- ]+/g, '') + '.wav', data: new Uint8Array(got.arrayBuffer) });
          }
        } finally { keep.forEach(([l, s]) => { l.solo = s; }); applyLanes(); sync(); stemsBusy = false; }
        if (!files.length) return ctx.emitUI('export_state', { error: 'No stems were made.' });
        const z = window.Codecs.zip(files);
        ctx.emitUI('export_ready', { name: 'song (stems).zip', mime: 'application/zip', data: z });
        ctx.emitUI('export_state', { done: true, text: `${files.length} stems zipped` });
      });
      ['loopOn', 'loopStartBar', 'loopEndBar'].forEach(k => P.onChange(k, () => ctx.emit('ui:transport-loop', { on: P.get('loopOn'), start: P.get('loopStartBar'), end: P.get('loopEndBar') })));
      ctx.on('kernel:organism-mounted', null, (p) => { if (p && p.instanceId) missingTargets.delete(p.instanceId); sync(); });
      ctx.on('kernel:organism-unmounted', null, () => sync());
      ctx.stateExtra = () => { setTimeout(sync, 0); return {}; };
      ctx.saveExtra = () => ({ lanes, clips, markers });
      ctx.loadExtra = async (x, o) => {
        if (!x) return;
        lanes = x.lanes || lanes; clips = x.clips || []; markers = x.markers || [];
        // 3.26: a saved arrangement (user preset) — tracks whose instrument is gone wait for you to pick one in the lane header
        if (o && o.preset) lanes.forEach(l => { if (l.target && !K.registry.has(l.target)) l.target = null; });
        lanes.forEach(l => { if (l.kind === 'audio') laneNode(l); if (l.kind === 'auto') { l.points = cleanPoints(l.points, l.target && knobCfg(l.target, l.key)); l.rec = !!l.rec; const o = cleanOsc(l.osc, l.target && knobCfg(l.target, l.key)); if (o) l.osc = o; else delete l.osc; } });
        watch();
        for (const c of clips) if (c.kind === 'audio') await bufferOf(c.assetHash);
        sync();
      };
      ctx.internals = { get recAll() { return recAll; }, get lanes() { return lanes; }, get clips() { return clips; }, get markers() { return markers; }, addLane, bufferOf, instruments, PROGRESSIONS, FILL_STYLES };
      setTimeout(sync, 0);
      return { unmount() { stopAll(ac.currentTime); } };
    },
  });
})();
