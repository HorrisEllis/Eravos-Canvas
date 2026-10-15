/* eravos.clip-maker 1.0.0 — the clip factory (P8.5)
 * Sample-accurate destructive editing with undo (≤ 50 states, stored as diffs of changed ranges):
 * cut Raven's recordings to the exact word, fade, normalise, split on silence, then send the clips
 * to pads, sampler, timeline, drop builder or granular (asset:ready). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.clip-maker', tempo: false, domain: 'music', version: '1.0.0', label: 'Clip Maker', icon: '✂', accent: '#00ff88', phase: 'P8.5',
    category: 'Voice & samples', blurb: 'Trim her recording to the exact words, clean it up, split it into clips, send them anywhere.',
    size: { w: 760, h: 470 }, minSize: { w: 560, h: 360 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe', 'filesystem_read', 'filesystem_write'],
    provides: ['capability.sample_source', 'capability.audio_out'],
    hooks: [S.audio_in('clip.hook.audio_in', 'in'), S.asset_out('clip.hook.asset_out'), S.audio_out('clip.hook.audio_out'), S.transport_in('clip.hook.transport_in')],
    config: [
      { key: 'snapZero', type: 'boolean', default: true, label: 'Snap to zero', group: 'EDIT', hint: 'selection edges snap to zero crossings (no clicks)' },
      { key: 'normalizeTarget', type: 'number', default: -1, min: -24, max: 0, step: 0.1, unit: 'dB', label: 'Normalise to', group: 'EDIT' },
      { key: 'normalizeMode', type: 'enum', options: ['peak', 'loudness'], default: 'peak', label: 'Normalise by', group: 'EDIT' },
      { key: 'silenceThresh', type: 'number', default: -45, min: -60, max: -20, step: 1, unit: 'dB', label: 'Silence below', group: 'SPLIT' },
      { key: 'minGap', type: 'number', default: 150, min: 20, max: 2000, step: 10, unit: 'ms', label: 'Min gap', group: 'SPLIT' },
      { key: 'fadeShape', type: 'enum', options: ['lin', 'exp', 'S'], default: 'S', label: 'Fade shape', group: 'EDIT' },
      { key: 'source', type: 'enum', options: ['mic', 'input'], default: 'mic', label: 'Record from', group: 'RECORD' },
    ],
    ui_hooks: ['load', 'select', 'op', 'undo', 'redo', 'record', 'draw', 'send', 'split', 'play', 'stop', 'export', 'detect_bpm', 'trim_bars', 'clip_select'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, K = ctx.K, dsp = ctx.dsp;
      const out = ac.createGain(); ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'audition' });
      const inp = ac.createGain(); ctx.port('in', { kind: 'audio', direction: 'in', node: inp, label: 'record input' });
      let chans = [], sr = ac.sampleRate, name = 'clip', sel = null, clipboard = null, clips = [], markers = [];
      const undo = [], redo = [];
      const len = () => (chans[0] ? chans[0].length : 0);
      function toBuffer(a, b) { a = a || 0; b = b === undefined ? len() : b; const n = Math.max(1, b - a); const buf = ac.createBuffer(Math.max(1, chans.length), n, sr); chans.forEach((c, i) => buf.copyToChannel(c.subarray(a, a + n), i)); return buf; }
      function fromBuffer(buf) { chans = []; for (let c = 0; c < Math.min(2, buf.numberOfChannels); c++) chans.push(new Float32Array(buf.getChannelData(c))); sr = buf.sampleRate; }
      ctx.toBuffer = toBuffer; ctx.chans = () => chans;
      function sync(extra) {
        ctx.emitUI('wave', Object.assign({ name, length: len(), sr, duration: len() / sr, peaks: len() ? dsp.peaks(toBuffer(), 2000) : [], sel, clips, markers, canUndo: undo.length > 0, canRedo: redo.length > 0 }, extra || {}));
      }
      // ---- history as diffs of changed ranges: replace [a, a+oldLen) with new data (newLen)
      function replace(a, oldLen, newData, label) {
        const old = chans.map(c => c.slice(a, a + oldLen));
        const newLen = newData[0].length;
        apply(a, oldLen, newData);
        undo.push({ a, oldData: old, newLen, newData: newData.map(x => x.slice()), label }); if (undo.length > 50) undo.shift();
        redo.length = 0;
      }
      function apply(a, oldLen, newData) {
        chans = chans.map((c, i) => { const n = new Float32Array(c.length - oldLen + newData[i].length); n.set(c.subarray(0, a), 0); n.set(newData[i], a); n.set(c.subarray(a + oldLen), a + newData[i].length); return n; });
      }
      ctx.undoLen = () => undo.length;
      function doUndo() { const h = undo.pop(); if (!h) return; apply(h.a, h.newLen, h.oldData); redo.push(h); sel = { a: h.a, b: h.a + h.oldData[0].length }; sync(); }
      function doRedo() { const h = redo.pop(); if (!h) return; apply(h.a, h.oldData[0].length, h.newData); undo.push(h); sel = { a: h.a, b: h.a + h.newLen }; sync(); }
      ctx.undo = doUndo; ctx.redo = doRedo;
      function zc(i) { if (!P.get('snapZero') || !chans[0]) return i; const c = chans[0], w = Math.floor(sr * 0.005); let best = i, bd = Infinity; for (let k = Math.max(1, i - w); k < Math.min(c.length, i + w); k++) if ((c[k - 1] <= 0 && c[k] > 0) || (c[k - 1] >= 0 && c[k] < 0)) { const d = Math.abs(k - i); if (d < bd) { bd = d; best = k; } } return best; }
      function range() { if (!sel || sel.b <= sel.a) return { a: 0, b: len() }; return sel; }
      const mapRange = (fn, label) => { const { a, b } = range(); const nd = chans.map(c => { const x = c.slice(a, b); fn(x, a, b); return x; }); replace(a, b - a, nd, label); sync(); };
      function fadeCurve(u, shape) { return shape === 'exp' ? u * u : shape === 'S' ? 0.5 - 0.5 * Math.cos(Math.PI * u) : u; }
      function peakOf(a, b) { let p = 0; chans.forEach(c => { for (let i = a; i < b; i++) p = Math.max(p, Math.abs(c[i])); }); return p; }
      const OPS = {
        cut() { const { a, b } = range(); clipboard = chans.map(c => c.slice(a, b)); replace(a, b - a, chans.map(() => new Float32Array(0)), 'cut'); sel = { a, b: a }; sync(); },
        copy() { const { a, b } = range(); clipboard = chans.map(c => c.slice(a, b)); sync({ note: 'copied ' + ((b - a) / sr).toFixed(2) + ' s' }); },
        paste() { if (!clipboard) return; const at = sel ? sel.a : len(); const o = sel && sel.b > sel.a ? sel.b - sel.a : 0; replace(at, o, chans.map((_, i) => clipboard[Math.min(i, clipboard.length - 1)].slice()), 'paste'); sel = { a: at, b: at + clipboard[0].length }; sync(); },
        delete() { const { a, b } = range(); replace(a, b - a, chans.map(() => new Float32Array(0)), 'delete'); sel = { a, b: a }; sync(); },
        crop() { const { a, b } = range(); const keep = chans.map(c => c.slice(a, b)); replace(0, len(), keep, 'crop'); sel = null; sync(); },
        silence() { mapRange((x) => x.fill(0), 'silence'); },
        gain(o) { const g = dsp.dbToGain(o.db || 0); mapRange((x) => { for (let i = 0; i < x.length; i++) x[i] *= g; }, 'gain'); },
        normalise() {
          const { a, b } = range(); let g;
          if (P.get('normalizeMode') === 'peak') { const pk = peakOf(a, b); if (!pk) return; g = dsp.dbToGain(P.get('normalizeTarget')) / pk; }
          else { let s = 0, n = 0; chans.forEach(c => { for (let i = a; i < b; i++) { s += c[i] * c[i]; n++; } }); const lufs = -0.691 + 10 * Math.log10(s / Math.max(1, n) * chans.length + 1e-20); g = dsp.dbToGain(P.get('normalizeTarget') - lufs); const pk = peakOf(a, b); if (pk * g > 0.999) g = 0.999 / pk; }
          mapRange((x) => { for (let i = 0; i < x.length; i++) x[i] *= g; }, 'normalise');
        },
        fadeIn() { const sh = P.get('fadeShape'); mapRange((x) => { const n = x.length; for (let i = 0; i < n; i++) x[i] *= fadeCurve(i / n, sh); }, 'fade in'); },
        fadeOut() { const sh = P.get('fadeShape'); mapRange((x) => { const n = x.length; for (let i = 0; i < n; i++) x[i] *= fadeCurve(1 - i / n, sh); }, 'fade out'); },
        reverse() { mapRange((x) => x.reverse(), 'reverse'); },
        removeDC() { mapRange((x) => { let m = 0; for (let i = 0; i < x.length; i++) m += x[i]; m /= x.length || 1; for (let i = 0; i < x.length; i++) x[i] -= m; }, 'remove DC'); },
        pitch(o) { // pitch by resample (length changes)
          const { a, b } = range(); const r = Math.pow(2, (o.semitones || 0) / 12); const n = Math.max(1, Math.round((b - a) / r));
          const nd = chans.map(c => { const x = new Float32Array(n); for (let i = 0; i < n; i++) { const p = a + i * r, i0 = Math.floor(p), f = p - i0; x[i] = (c[i0] || 0) * (1 - f) + (c[i0 + 1] || 0) * f; } return x; });
          replace(a, b - a, nd, 'pitch'); sel = { a, b: a + n }; sync();
        },
      };
      ctx.op = (name, o) => { if (!OPS[name]) return ctx.fault('RUNTIME_002', 'op ' + name); if (!len() && name !== 'paste') return ctx.fault('RUNTIME_003', 'no audio loaded'); OPS[name](o || {}); };
      ctx.select = (a, b, snap) => { a = Math.max(0, Math.min(len(), Math.round(a))); b = Math.max(0, Math.min(len(), Math.round(b))); if (b < a) [a, b] = [b, a]; if (snap !== false) { a = zc(a); b = zc(b); } sel = { a, b }; return sel; };
      // ---- detection
      function silenceSplit() {
        const w = Math.max(1, Math.floor(sr * 0.01)), thr = P.get('silenceThresh'), gap = Math.floor(P.get('minGap') / 1000 * sr);
        const c = chans[0], n = len(), loud = [];
        for (let s = 0; s < n; s += w) { let q = 0; const e = Math.min(n, s + w); for (let i = s; i < e; i++) { let v = 0; chans.forEach(ch => { v = Math.max(v, Math.abs(ch[i])); }); q += v * v; } loud.push(10 * Math.log10(q / (e - s) + 1e-20) > thr); }
        const regs = []; let st = -1, quiet = 0;
        loud.forEach((l, k) => { if (l) { if (st < 0) st = k; quiet = 0; } else if (st >= 0) { quiet++; if (quiet * w >= gap) { regs.push([st * w, (k - quiet + 1) * w]); st = -1; quiet = 0; } } });
        if (st >= 0) regs.push([st * w, n]);
        clips = regs.filter(r => r[1] - r[0] >= sr * 0.05).map((r, i) => ({ id: i + 1, a: Math.max(0, r[0] - Math.floor(sr * 0.01)), b: Math.min(n, r[1] + Math.floor(sr * 0.02)), name: name.replace(/\.[a-z0-9]+$/i, '') + '-' + (i + 1) }));
        markers = dsp.onsets(toBuffer(), 0.4).map(t => Math.round(t * sr));
        sync(); return clips;
      }
      ctx.silenceSplit = silenceSplit;
      function detectBpm() {
        const on = dsp.onsets(toBuffer(), 0.5); if (on.length < 3) return null;
        const hist = new Map();
        for (let i = 0; i < on.length; i++) for (let j = i + 1; j < Math.min(on.length, i + 6); j++) { let bpm = 60 / (on[j] - on[i]); while (bpm < 80) bpm *= 2; while (bpm > 170) bpm /= 2; const k = Math.round(bpm); hist.set(k, (hist.get(k) || 0) + 1); }
        let best = null, bn = 0; hist.forEach((n, k) => { if (n > bn) { bn = n; best = k; } }); return best;
      }
      ctx.detectBpm = detectBpm;
      function trimBars(bars) { if (!len()) return ctx.fault('RUNTIME_003', 'no audio loaded'); const { a } = range(); const n = Math.round(bars * 240 / ctx.bpm * sr); sel = { a, b: Math.min(len(), a + n) }; if (a + n > len()) { const pad = chans.map(() => new Float32Array(a + n - len())); replace(len(), 0, pad, 'pad to bars'); } OPS.crop(); }
      ctx.trimBars = trimBars;
      // ---- load / record / draw
      async function loadAB(ab, nm) { const a = K.assets.register(ab, { name: nm, mime: 'audio/*' }); const b = await K.assets.decode(a.hash); if (!b) return false; fromBuffer(b); name = nm || a.source; undo.length = 0; redo.length = 0; sel = null; clips = []; markers = []; sync(); return true; }
      ctx.loadAB = loadAB; ctx.loadBuffer = (b, nm) => { fromBuffer(b); name = nm || 'clip'; undo.length = 0; sync(); };
      ctx.onUI('load', { type: 'object', required: ['arrayBuffer'] }, (p) => loadAB(p.arrayBuffer, p.name || 'clip'));
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, async (p) => { if (p.target !== ctx.id) return; const a = K.assets.get(p.hash); if (!a) return; const b = a.decoded || await K.assets.decode(p.hash); if (b) { fromBuffer(b); name = p.name || a.source; undo.length = 0; sel = null; clips = []; sync(); } });
      let rec = null, stream = null, micSrc = null;
      ctx.onUI('record', { type: 'object', required: ['on'] }, async (p) => {
        if (p.on && !rec) {
          let src = inp;
          if (P.get('source') === 'mic') {
            if (!ctx.K.permissions.enforce(ctx.id, 'audio_in', 'microphone')) return;
            try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); micSrc = ac.createMediaStreamSource(stream); src = micSrc; }
            catch (e) { return ctx.fault('RUNTIME_001', 'microphone permission denied: ' + e.message); }
          }
          rec = AudioRecorder.create(ac, src); await rec.ready; await rec.start(); ctx.emitUI('recording', { on: true });
        } else if (!p.on && rec) {
          const cs = await rec.stop(); const buf = rec.assemble(cs); rec.dispose(); rec = null;
          if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } if (micSrc) { micSrc.disconnect(); micSrc = null; }
          fromBuffer(buf); name = 'recording-' + new Date().toISOString().slice(11, 19) + '.wav'; undo.length = 0; sel = null; clips = []; sync(); ctx.emitUI('recording', { on: false });
        }
      });
      ctx.onUI('draw', { type: 'object', required: ['points'] }, (p) => { // pencil: [{i, v}] sample indices + values on zoomed view
        if (!p.points.length) return; const pts = p.points.slice().sort((x, y) => x.i - y.i); const a = Math.max(0, pts[0].i), b = Math.min(len(), pts[pts.length - 1].i + 1); if (b <= a) return;
        const nd = chans.map(c => { const x = c.slice(a, b); let k = 0; for (let i = a; i < b; i++) { while (k < pts.length - 1 && pts[k + 1].i <= i) k++; const p0 = pts[k], p1 = pts[Math.min(pts.length - 1, k + 1)]; const f = p1.i === p0.i ? 0 : (i - p0.i) / (p1.i - p0.i); x[i - a] = Math.max(-1, Math.min(1, p0.v + (p1.v - p0.v) * f)); } return x; });
        replace(a, b - a, nd, 'draw'); sync();
      });
      ctx.onUI('select', { type: 'object', required: ['a', 'b'] }, (p) => { ctx.select(p.a, p.b); sync(); });
      ctx.onUI('op', { type: 'object', required: ['name'] }, (p) => ctx.op(p.name, p));
      ctx.onUI('undo', null, doUndo); ctx.onUI('redo', null, doRedo);
      ctx.onUI('split', null, () => silenceSplit());
      ctx.onUI('detect_bpm', null, () => { const b = detectBpm(); sync({ note: b ? `sounds like ${b} BPM` : 'no clear tempo' }); });
      ctx.onUI('trim_bars', { type: 'object', required: ['bars'] }, (p) => trimBars(p.bars));
      ctx.onUI('clip_select', { type: 'object', required: ['id'] }, (p) => { const c = clips.find(x => x.id === p.id); if (c) { sel = { a: c.a, b: c.b }; sync(); } });
      // ---- audition / export / send
      let player = null;
      ctx.onUI('play', null, () => { if (!len()) return; if (player) try { player.stop(); } catch (e) {} const { a, b } = range(); player = ac.createBufferSource(); player.buffer = toBuffer(a, b); player.connect(out); player.start(); const t0 = ac.currentTime; ctx.emitUI('playhead', { from: a, t0, sr }); player.onended = () => ctx.emitUI('playhead', { from: -1 }); });
      ctx.onUI('stop', null, () => { if (player) try { player.stop(); } catch (e) {} });
      function sendRegion(a, b, nm, target) {
        const buf = toBuffer(a, b);
        const asset = K.audio.putBuffer(buf, { name: nm + '.wav', lineage: [{ operation: 'clip', source: name, params: { a, b } }] });
        ctx.emit('asset:ready', { hash: asset.hash, name: nm, duration: buf.duration, target: target || undefined });
        return asset;
      }
      ctx.sendRegion = sendRegion;
      ctx.onUI('send', { type: 'object' }, (p) => {
        const c = p.clip ? clips.find(x => x.id === p.clip) : null; const r = c ? c : range();
        const nm = p.name || (c ? c.name : name.replace(/\.[a-z0-9]+$/i, '') + (sel ? '-sel' : ''));
        if (p.target === 'new-sample') { const a = sendRegion(r.a, r.b, nm, null); ctx.emitUI('note', { text: 'spawn a Sample and load ' + nm }); return; }
        sendRegion(r.a, r.b, nm, p.target || null);
      });
      ctx.onUI('export', null, () => { const { a, b } = range(); ctx.emitUI('file_ready', { name: name.replace(/\.[a-z0-9]+$/i, '') + '-edit.wav', mime: 'audio/wav', data: AudioRecorder.encodeWAV(toBuffer(a, b), 24) }); });
      ctx.stateExtra = () => { setTimeout(() => sync(), 0); return {}; };
      ctx.saveExtra = () => { if (!len()) return null; const a = K.audio.putBuffer(toBuffer(), { name }); return { hash: a.hash, name, clips }; };
      ctx.loadExtra = async (x) => { if (!x || !x.hash) return; const a = K.assets.get(x.hash); if (!a) return; const b = a.decoded || await K.assets.decode(x.hash); if (b) { fromBuffer(b); name = x.name; clips = x.clips || []; sync(); } };
      return { unmount() { if (stream) stream.getTracks().forEach(t => t.stop()); if (rec) rec.dispose(); } };
    },
  });
})();
