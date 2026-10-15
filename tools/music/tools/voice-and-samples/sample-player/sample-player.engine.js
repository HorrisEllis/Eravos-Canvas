/* eravos.sample-player 2.0.0 — Sample / Chopper (P2) · resolves F-13
 * One audio file (Raven's voice clips are the primary use): whole, chromatic, looped, or sliced.
 * Buffer-domain engine: reversed COPY (never negative playbackRate), baked loop crossfade, 8-voice poly. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const MODES = ['oneshot', 'gate', 'loop', 'chromatic', 'slice'];

  OrganismFactory.define({
    id: 'eravos.sample-player', preview: 'hit', domain: 'music', version: '2.0.0', label: 'Sample', icon: '🎵', accent: '#aa44ff', phase: 'P2',
    category: 'Voice & samples', blurb: 'Load her voice clip: play it, pitch it, loop it or chop it into slices.',
    size: { w: 470, h: 300 }, minSize: { w: 340, h: 230 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'filesystem_read'],
    provides: ['capability.audio_out', 'capability.sample_source', 'capability.note_in'],
    hooks: [
      S.audio_out('samp.hook.audio_out'),
      S.note_in('samp.hook.note_in'),
      S.midi_in('samp.hook.midi_in'),
      S.event('samp.hook.trigger_in', 'in', 'pad:trigger', { type: 'object', required: ['index', 'bank'] }, '2.0.0'),
      S.event('samp.hook.clip_in', 'in', 'timeline:clip_play', { type: 'object', required: ['asset_id', 'position_sec'] }, '1.0.0'),
      S.mod_in('samp.hook.mod_pitch', 'pitch'),
      S.asset_out('samp.hook.asset_out'),
      S.asset_in('samp.hook.asset_in'),
    ],
    config: [
      { key: 'mode', type: 'enum', options: MODES, default: 'oneshot', label: 'Mode', group: 'PLAY', hint: 'oneshot = whole clip · gate = while held · loop · chromatic = play it as notes · slice = chop' },
      { key: 'gain', type: 'number', default: 1, min: 0, max: 2, step: 0.01, label: 'Gain', group: 'PLAY' },
      { key: 'pitch', type: 'number', default: 0, min: -24, max: 24, step: 0.01, unit: 'st', label: 'Pitch', group: 'PLAY' },
      { key: 'root', type: 'integer', default: 60, min: 0, max: 127, label: 'Root', group: 'PLAY' },
      { key: 'reverse', type: 'boolean', default: false, label: 'Reverse', group: 'PLAY' },
      { key: 'start', type: 'number', default: 0, min: 0, max: 1, step: 0.0001, label: 'Start', group: 'REGION', hidden: true },
      { key: 'end', type: 'number', default: 1, min: 0, max: 1, step: 0.0001, label: 'End', group: 'REGION', hidden: true },
      { key: 'loopStart', type: 'number', default: 0, min: 0, max: 1, step: 0.0001, label: 'Loop start', group: 'REGION', hidden: true },
      { key: 'loopEnd', type: 'number', default: 1, min: 0, max: 1, step: 0.0001, label: 'Loop end', group: 'REGION', hidden: true },
      { key: 'slices', type: 'enum', options: ['auto', 4, 8, 16, 'manual'], default: 'auto', label: 'Slices', group: 'SLICE' },
      { key: 'sensitivity', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Sensitivity', group: 'SLICE' },
      { key: 'attack', type: 'number', default: 0.002, min: 0, max: 2, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'release', type: 'number', default: 0.05, min: 0, max: 4, step: 0.001, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'xfade', type: 'number', default: 10, min: 0, max: 200, step: 1, unit: 'ms', label: 'Loop X-fade', group: 'ENV' },
      { key: 'padLink', type: 'enum', options: ['off', 'bank A', 'bank B', 'bank C'], default: 'off', label: 'Pad link', group: 'SLICE', hint: 'slices follow drum-machine pads of this bank' },
    ],
    ui_hooks: ['load', 'load_asset', 'play_press', 'stop_press', 'scrub', 'slice_edit', 'send'],
    engine(ctx) {
      const ac = ctx.ac, dsp = ctx.dsp, P = ctx.params;
      const out = ac.createGain(); out.gain.value = P.get('gain');
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'sample' });
      const pitchMod = ctx.modBus('pitch', { min: -2400, max: 2400 }); // cents
      let buf = null, rev = null, loopBuf = null, name = '', hash = null, analysis = null;
      let manual = []; // manual slice positions 0..1
      const voices = []; // {src, amp, t0, offset, rate, note, dir}
      let reportTimer = null;

      function slicePositions() {
        if (!buf) return [];
        const m = P.get('slices');
        if (m === 'manual') return [0].concat(manual.filter(x => x > 0 && x < 1).sort((a, b) => a - b));
        if (m === 'auto') {
          const on = (analysis && analysis.transients) || [];
          // one slice per transient; the first slice absorbs any pre-roll before the first hit
          const pos = on.map(t => t / buf.duration);
          if (!pos.length) return [0];
          pos[0] = 0;
          return pos;
        }
        const n = +m; return Array.from({ length: n }, (_, i) => i / n);
      }
      function sliceBounds(i) { const s = slicePositions(); if (i < 0 || i >= s.length) return null; return [s[i], i + 1 < s.length ? s[i + 1] : 1]; }

      function bakeLoop() {
        loopBuf = null;
        if (!buf) return;
        const src = P.get('reverse') ? rev : buf;
        const sr = src.sampleRate, a = Math.floor(P.get('loopStart') * src.length), b = Math.floor(P.get('loopEnd') * src.length);
        const L = b - a; if (L < 64) return;
        const X = Math.min(Math.floor(P.get('xfade') / 1000 * sr), a, Math.floor(L / 2));
        loopBuf = ac.createBuffer(src.numberOfChannels, L, sr);
        for (let c = 0; c < src.numberOfChannels; c++) {
          const s = src.getChannelData(c), d = loopBuf.getChannelData(c);
          for (let i = 0; i < L; i++) d[i] = s[a + i];
          // equal-power blend of the loop tail with the audio just before loopStart → seamless wrap
          for (let i = 0; i < X; i++) { const w = (i + 1) / X; d[L - X + i] = s[a + L - X + i] * Math.cos(w * Math.PI / 2) + s[a - X + i] * Math.sin(w * Math.PI / 2); }
        }
      }

      function steal() { if (voices.length >= 8) { const v = voices.shift(); kill(v, ac.currentTime, 0.005); } }
      function kill(v, t, r) {
        try { if (v.amp.gain.cancelAndHoldAtTime) v.amp.gain.cancelAndHoldAtTime(t); else v.amp.gain.cancelScheduledValues(t); v.amp.gain.linearRampToValueAtTime(0, t + Math.max(0.003, r)); v.src.stop(t + Math.max(0.003, r) + 0.01); } catch (e) {}
      }
      // play region [a,b] (normalized) at rate
      function playRegion(t, a, b, rate, vel, o) {
        if (!buf) return null;
        o = o || {};
        t = Math.max(t, ac.currentTime);
        steal();
        const reverse = P.get('reverse');
        const src = ac.createBufferSource();
        const amp = ac.createGain(), pan = ac.createStereoPanner();
        let offset, dur;
        if (o.loop && loopBuf) { src.buffer = loopBuf; src.loop = true; offset = 0; dur = Infinity; }
        else {
          src.buffer = reverse ? rev : buf;
          const D = buf.duration;
          // reversed copy: region [a,b] of the original = [1-b, 1-a] of the reversed buffer
          const ra = reverse ? 1 - b : a, rb = reverse ? 1 - a : b;
          offset = ra * D; dur = Math.max(0.001, (rb - ra) * D) / rate;
        }
        src.playbackRate.value = rate;
        pitchMod.connect(src.detune);
        const A = P.get('attack'), g = vel * 1;
        amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(g, t + Math.max(0.001, A));
        src.connect(amp); amp.connect(pan); pan.connect(out);
        src.start(t, offset);
        if (dur !== Infinity && !o.gate) {
          const R = Math.min(P.get('release'), dur * 0.5);
          amp.gain.setValueAtTime(g, t + Math.max(A, dur - R)); amp.gain.linearRampToValueAtTime(0, t + dur);
          src.stop(t + dur + 0.01);
        }
        const v = { src, amp, t0: t, offset, rate, note: o.note, a: reverse ? 1 - b : a, b: reverse ? 1 - a : b, reverse, loop: !!o.loop, dur };
        voices.push(v);
        src.onended = () => { const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); try { amp.disconnect(); pan.disconnect(); pitchMod.disconnect(src.detune); } catch (e) {} };
        startReporting();
        return v;
      }
      function rateFor(note) { const base = Math.pow(2, P.get('pitch') / 12); return note === undefined ? base : base * Math.pow(2, (note - P.get('root')) / 12); }
      function noteOn(note, vel, t, duration) {
        if (!buf) return;
        const mode = P.get('mode');
        let v;
        if (mode === 'slice') { const b = sliceBounds(note - 36); if (!b) return; v = playRegion(t, b[0], b[1], rateFor(), vel, { note }); }
        else if (mode === 'chromatic') v = playRegion(t, P.get('start'), P.get('end'), rateFor(note), vel, { note, gate: duration !== undefined });
        else if (mode === 'loop') v = playRegion(t, 0, 1, rateFor(), vel, { note, loop: true, gate: true });
        else if (mode === 'gate') v = playRegion(t, P.get('start'), P.get('end'), rateFor(), vel, { note, gate: true });
        else v = playRegion(t, P.get('start'), P.get('end'), rateFor(), vel, { note });
        if (v && duration !== undefined && (mode === 'gate' || mode === 'loop' || mode === 'chromatic')) kill(v, v.t0 + duration, P.get('release'));
        return v;
      }
      function noteOff(note, t) { voices.filter(v => v.note === note && (v.loop || v.dur === Infinity || P.get('mode') === 'gate' || P.get('mode') === 'chromatic')).forEach(v => kill(v, t || ac.currentTime, P.get('release'))); }
      ctx.noteOn = noteOn; ctx.playRegion = playRegion;

      function position(v) { // normalized playhead in ORIGINAL buffer orientation
        const el = Math.max(0, ac.currentTime - v.t0) * v.rate * (1 + 0);
        if (v.loop && loopBuf) { const L = loopBuf.duration; const p = (el % L) / buf.duration + P.get('loopStart'); return v.reverse ? 1 - p : p; }
        const p = v.offset / buf.duration + el / buf.duration;
        return v.reverse ? 1 - p : p;
      }
      ctx.position = position; ctx.voices = voices;
      function startReporting() {
        if (reportTimer) return;
        reportTimer = ctx.interval(() => {
          if (!voices.length) { clearInterval(reportTimer); reportTimer = null; ctx.emitUI('playhead_update', { position_normalized: -1 }); return; }
          const v = voices[voices.length - 1];
          ctx.emitUI('playhead_update', { position_normalized: Math.max(0, Math.min(1, position(v))) });
        }, 33);
      }

      async function load(ab, nm) {
        const asset = ctx.K.assets.register(ab, { name: nm, mime: 'audio/*' });
        return loadAsset(asset.hash, nm);
      }
      async function loadAsset(h, nm) {
        const a = ctx.K.assets.get(h);
        if (!a) { ctx.fault('ASSET_001', 'asset ' + h + ' not found'); return false; }
        const b = a.decoded || await ctx.K.assets.decode(h);
        if (!b) return false; // ASSET_002 already raised, organism stays mounted
        buf = b; rev = dsp.reverseBuffer(ac, b); hash = h; name = nm || a.source;
        analyse(); bakeLoop();
        ctx.emitUI('waveform_ready', { peaks: analysis.peaks, duration_sec: buf.duration, name, transients: analysis.transients, peakDb: analysis.peakDb, rmsDb: analysis.rmsDb });
        ctx.emitUI('slices', { positions: slicePositions() });
        ctx.emit('asset:ready', { hash, name, duration: buf.duration });
        ctx.syncUI();
        return true;
      }
      function analyse() {
        const d = buf.getChannelData(0); let pk = 0, sq = 0;
        for (let i = 0; i < d.length; i++) { const x = Math.abs(d[i]); if (x > pk) pk = x; sq += d[i] * d[i]; }
        analysis = { peaks: dsp.peaks(buf, 1024), transients: dsp.onsets(buf, P.get('sensitivity')), peakDb: 20 * Math.log10(pk + 1e-12), rmsDb: 10 * Math.log10(sq / d.length + 1e-24), duration: buf.duration };
      }
      ctx.load = load; ctx.loadAsset = loadAsset;
      ctx.slicePositions = slicePositions; ctx.sliceBounds = sliceBounds;
      Object.defineProperty(ctx, 'buffer', { get: () => buf });

      // hooks
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note); });
      ctx.on('pad:trigger', { type: 'object', required: ['index', 'bank'] }, (p) => {
        const link = P.get('padLink'); if (link === 'off') return;
        if (['bank A', 'bank B', 'bank C'].indexOf(link) !== p.bank) return;
        const b = sliceBounds(p.index); if (b) playRegion(p.time || ac.currentTime, b[0], b[1], rateFor(), p.velocity);
      });
      ctx.on('timeline:clip_play', { type: 'object', required: ['asset_id', 'position_sec'] }, (p) => {
        if (p.asset_id !== hash || (p.target && p.target !== ctx.id)) return;
        if (!buf) return;
        playRegion(p.time || ac.currentTime, Math.min(1, p.position_sec / buf.duration), 1, rateFor(), 1);
      });
      P.onChange('gain', (v) => dsp.setSmooth(out.gain, v, ac));
      ['loopStart', 'loopEnd', 'xfade', 'reverse'].forEach(k => P.onChange(k, bakeLoop));
      ['slices'].forEach(k => P.onChange(k, () => ctx.emitUI('slices', { positions: slicePositions() })));
      P.onChange('sensitivity', () => { if (buf) { analysis.transients = dsp.onsets(buf, P.get('sensitivity')); ctx.emitUI('waveform_ready', { peaks: analysis.peaks, duration_sec: buf.duration, name, transients: analysis.transients, peakDb: analysis.peakDb, rmsDb: analysis.rmsDb }); ctx.emitUI('slices', { positions: slicePositions() }); } });

      // asset:ready addressed to this player (target) or arriving over a wired event_bus route (clip-maker → sample)
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, (p) => {
        if (p._from === ctx.id) return;
        const wired = ctx.K.wires.list().some(w => w.dst.instanceId === ctx.id && w.dst.hookId === 'samp.hook.asset_in' && w.src.instanceId === p._from);
        if (p.target === ctx.id || wired) loadAsset(p.hash, p.name);
      });
      ctx.onUI('load', { type: 'object', required: ['arrayBuffer'] }, (p) => load(p.arrayBuffer, p.name || 'clip'));
      ctx.onUI('load_asset', { type: 'object', required: ['hash'] }, (p) => loadAsset(p.hash, p.name));
      ctx.onUI('play_press', null, (p) => {
        if (!buf) return;
        const mode = P.get('mode');
        if (mode === 'loop') playRegion(ac.currentTime, 0, 1, rateFor(), 1, { loop: true, gate: true, note: -1 });
        else if (p && typeof p.slice === 'number') { const b = sliceBounds(p.slice); if (b) playRegion(ac.currentTime, b[0], b[1], rateFor(), 1); }
        else playRegion(ac.currentTime, P.get('start'), P.get('end'), rateFor(), 1);
      });
      ctx.onUI('stop_press', null, () => voices.slice().forEach(v => kill(v, ac.currentTime, 0.02)));
      ctx.onUI('scrub', { type: 'object', required: ['position'], properties: { position: { type: 'number', minimum: 0, maximum: 1 } } }, (p) => { if (buf) playRegion(ac.currentTime, p.position, Math.min(1, p.position + 0.08), rateFor(), 0.9); });
      ctx.onUI('slice_edit', { type: 'object', required: ['op'] }, (p) => {
        if (p.op === 'add') { if (P.get('slices') !== 'manual') { manual = slicePositions().slice(1); P.set('slices', 'manual'); } manual.push(p.position); }
        else if (p.op === 'remove') { if (P.get('slices') !== 'manual') { manual = slicePositions().slice(1); P.set('slices', 'manual'); } let bi = -1, bd = 1; manual.forEach((m, i) => { const d = Math.abs(m - p.position); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0 && bd < 0.03) manual.splice(bi, 1); }
        else if (p.op === 'clear') { manual = []; }
        else return ctx.fault('RUNTIME_002', 'slice_edit op ' + p.op);
        ctx.emitUI('slices', { positions: slicePositions() });
      });
      ctx.onUI('send', { type: 'object', required: ['target'] }, (p) => { if (hash) ctx.emit('asset:ready', { hash, name, duration: buf.duration, target: p.target }); });

      ctx.audition = (p) => noteOn(p.note === undefined ? (P.get('mode') === 'slice' ? 36 : P.get('root')) : p.note, p.velocity || 1, ac.currentTime);
      ctx.stateExtra = () => ({ name, hash, loaded: !!buf, duration: buf ? buf.duration : 0, slicePositions: slicePositions(), sendTargets: null });
      ctx.saveExtra = () => ({ hash, name, manual });
      ctx.loadExtra = async (x) => { if (!x) return; manual = x.manual || []; if (x.hash) await loadAsset(x.hash, x.name); };
      return { unmount() { voices.slice().forEach(v => { try { v.src.stop(); } catch (e) {} }); } };
    },
  });
})();
