/* eravos.video.video-clip 1.0.0 — Video Clip · spec video-clip.spec (domain video · Video Editing)
 * The one tool Video Editing stands on: open a video (Open…, a dropped file, saved with the project as an asset),
 * scrub and trim it (in / out), play it — on its own or locked to the song's transport when a music domain is
 * installed — send frames out as pictures (to Image Adjust or any tool that takes an image), and export the trimmed
 * cut as WebM (recorded in real time from the browser's own decoder: the export takes as long as the cut).
 * Robust to recorder files with no duration in their header (common with browser recordings): it probes to the end. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const MIMES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  OrganismFactory.define({
    id: 'eravos.video.video-clip', domain: 'video', version: '1.0.0', label: 'Video Clip', icon: '🎬', accent: '#ff8fab', phase: 'P37',
    category: 'Video', blurb: 'Open a video, scrub and trim it, play it on the song’s beat, send frames to image tools, export the cut.',
    size: { w: 720, h: 600 }, minSize: { w: 420, h: 380 },
    permissions: ['bus_publish', 'bus_subscribe'],
    provides: ['capability.video'],
    hooks: [
      S.data_out('vid.hook.frame', 'frame', 'image', 'the current frame as a picture'),
      S.data_out('vid.hook.info', 'info', 'json', 'name, size, duration, in, out'),
      S.data_in('vid.hook.play', 'play', ['trigger'], 'play the cut from its in point'),
      S.data_in('vid.hook.seek', 'seek', ['number'], 'go to this many seconds into the cut'),
    ],
    config: [
      { key: 'loop', type: 'boolean', default: true, label: 'Loop', group: 'PLAY', hint: 'play the cut round and round' },
      { key: 'rate', type: 'number', default: 1, min: 0.25, max: 2, step: 0.05, unit: '×', label: 'Speed', group: 'PLAY' },
      { key: 'volume', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Volume', group: 'PLAY' },
      { key: 'muted', type: 'boolean', default: false, label: 'Mute', group: 'PLAY' },
      { key: 'follow', type: 'boolean', default: false, label: 'Follow song', group: 'PLAY', hint: 'start and stop with the song’s transport (when music is installed)' },
      { key: 'frameFps', type: 'number', default: 0, min: 0, max: 30, step: 1, unit: 'fps', label: 'Frames out', group: 'OUT', hint: 'while playing, send this many frames a second (0 = only when you pause, scrub or grab)' },
    ],
    ui_hooks: ['open_file', 'open_asset', 'play', 'pause', 'seek', 'set_in', 'set_out', 'trim', 'grab', 'export', 'cancel_export', 'want_element'],
    engine(ctx) {
      const K = ctx.K, P = ctx.params;
      const v = document.createElement('video'); v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous'; v.className = 'vc-video';
      let url = null, hash = null, name = '', dur = 0, inT = 0, outT = 0, rec = null, raf = null, fpsTimer = null, ready = false;
      const sendFrame = ctx.dataOut('frame', { type: 'image', label: 'frame' }), sendInfo = ctx.dataOut('info', { type: 'json', label: 'info' });
      const info = () => ({ name, width: v.videoWidth, height: v.videoHeight, duration: +dur.toFixed(3), in: +inT.toFixed(3), out: +outT.toFixed(3) });
      const apply = () => { v.loop = false; v.playbackRate = P.get('rate'); v.volume = P.get('volume'); v.muted = P.get('muted'); };
      ['rate', 'volume', 'muted'].forEach(k => P.onChange(k, apply)); apply();
      const once = (ev, ms) => new Promise((res, rej) => { const t = setTimeout(() => { v.removeEventListener(ev, ok); rej(new Error(ev + ' timed out')); }, ms || 8000); const ok = () => { clearTimeout(t); v.removeEventListener(ev, ok); res(); }; v.addEventListener(ev, ok); });
      async function probeDuration() { // recorder WebMs report Infinity until the end has been seen
        if (Number.isFinite(v.duration) && v.duration > 0) return v.duration;
        v.currentTime = 1e7; try { await once('durationchange', 6000); } catch (e) {}
        const d = Number.isFinite(v.duration) ? v.duration : v.currentTime; v.currentTime = 0; try { await once('seeked', 4000); } catch (e) {}
        return d;
      }
      async function open(ab, nm, mime) {
        stop();
        try {
          const a = K.assets.register(ab, { name: nm, mime: mime || 'video/*', asset_type: 'video' }); hash = a.hash; name = nm || a.source || 'video';
          if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(new Blob([ab], { type: mime || 'video/webm' }));
          ready = false; v.src = url; await once('loadedmetadata', 15000);
          dur = await probeDuration(); if (!(dur > 0)) throw new Error('no playable length');
          inT = 0; outT = dur; ready = true; apply();
          ctx.emitUI('loaded', info()); sendInfo(info()); seek(0); thumbs(); ctx.syncUI(); return true;
        } catch (e) { ready = false; ctx.fault('RUNTIME_003', `${nm || 'That file'} can’t be played in this browser (${e.message}). WebM and MP4 (H.264) work best.`); ctx.syncUI(); return false; }
      }
      async function grab(at) {
        if (!ready || !v.videoWidth) return null;
        try { const bm = await createImageBitmap(v); const f = { width: bm.width, height: bm.height, bitmap: bm, at: +(at !== undefined ? at : v.currentTime).toFixed(3), name }; sendFrame(f); return f; }
        catch (e) { ctx.fault('RUNTIME_003', 'Couldn’t read a frame: ' + e.message); return null; }
      }
      async function seek(t) {
        if (!ready) return; const to = Math.max(inT, Math.min(outT, t)); v.currentTime = to;
        try { await once('seeked', 4000); } catch (e) {}
        ctx.emitUI('time', { t: v.currentTime }); grab();
      }
      function tick() {
        raf = null; if (v.paused) return;
        if (v.currentTime >= outT - 0.01) { if (P.get('loop') && !rec) { v.currentTime = inT; } else { v.pause(); v.currentTime = outT; ctx.emitUI('playing', { on: false }); grab(); if (rec) rec.finish(); return; } }
        ctx.emitUI('time', { t: v.currentTime }); raf = requestAnimationFrame(tick);
      }
      async function play(from) {
        if (!ready) return ctx.fault('RUNTIME_003', 'Open a video first.');
        if (from !== undefined || v.currentTime >= outT - 0.01 || v.currentTime < inT) { v.currentTime = from !== undefined ? from : inT; try { await once('seeked', 4000); } catch (e) {} }
        try { await v.play(); } catch (e) { return ctx.fault('RUNTIME_003', 'The browser didn’t start playback (' + e.message + ').'); }
        ctx.emitUI('playing', { on: true }); if (!raf) raf = requestAnimationFrame(tick); armFps();
      }
      function stop() { if (!v.paused) v.pause(); if (raf) cancelAnimationFrame(raf); raf = null; armFps(); ctx.emitUI('playing', { on: false }); }
      function armFps() { if (fpsTimer) { clearInterval(fpsTimer); fpsTimer = null; } const f = P.get('frameFps'); if (f > 0 && !v.paused) fpsTimer = ctx.interval(() => { if (!v.paused) grab(); else armFps(); }, 1000 / f); }
      P.onChange('frameFps', armFps);
      async function thumbs() { // a filmstrip of 10 frames, from a second element so playback is never disturbed
        const t = document.createElement('video'); t.muted = true; t.src = url; t.preload = 'auto';
        try { await new Promise((res, rej) => { t.onloadeddata = res; t.onerror = () => rej(new Error('thumbnails')); setTimeout(() => rej(new Error('thumbnails timed out')), 8000); }); } catch (e) { return; }
        const N = 10, out = [];
        for (let i = 0; i < N; i++) { t.currentTime = Math.min(dur - 0.01, (i + 0.5) * dur / N); await new Promise(r => { t.onseeked = r; setTimeout(r, 1500); }); try { out.push(await createImageBitmap(t, { resizeWidth: 96, resizeQuality: 'medium' })); } catch (e) { break; } }
        t.removeAttribute('src'); t.load(); if (!ctx.disposed) ctx.emitUI('thumbs', { frames: out, duration: dur });
      }
      async function exportCut() {
        if (!ready) return ctx.fault('RUNTIME_003', 'Open a video first.'); if (rec) return ctx.fault('RUNTIME_004', 'An export is already running.');
        if (typeof MediaRecorder === 'undefined' || !v.captureStream) return ctx.fault('RUNTIME_003', 'This browser can’t record video — export isn’t available here.');
        const mime = MIMES.find(m => MediaRecorder.isTypeSupported(m)); if (!mime) return ctx.fault('RUNTIME_003', 'This browser can’t write WebM.');
        stop(); v.currentTime = inT; try { await once('seeked', 4000); } catch (e) {}
        const stream = v.captureStream(), chunks = [], mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 });
        return await new Promise((resolve) => {
          let cancelled = false;
          rec = { mr, finish() { if (mr.state !== 'inactive') mr.stop(); }, cancel() { cancelled = true; this.finish(); } };
          mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
          mr.onstop = () => { const r = rec; rec = null; stop(); if (cancelled) { ctx.emitUI('export', { state: 'cancelled' }); return resolve(null); }
            const blob = new Blob(chunks, { type: 'video/webm' }), fname = name.replace(/\.[a-z0-9]+$/i, '') + `-cut-${inT.toFixed(1)}-${outT.toFixed(1)}.webm`;
            ctx.emitUI('export', { state: 'done', name: fname, bytes: blob.size }); resolve({ blob, name: fname, mime }); };
          const prog = ctx.interval(() => { if (!rec) return; ctx.emitUI('export', { state: 'recording', done: (v.currentTime - inT) / Math.max(0.01, outT - inT) }); }, 250);
          mr.addEventListener('stop', () => clearInterval(prog));
          mr.start(250); play(inT);
        });
      }
      ctx.exportCut = exportCut;
      ctx.onUI('open_file', { type: 'object', required: ['arrayBuffer'] }, (p) => open(p.arrayBuffer, p.name, p.type));
      ctx.onUI('open_asset', { type: 'object', required: ['hash'] }, (p) => { const a = K.assets.get(p.hash); if (!a || !a.data) return ctx.fault('RUNTIME_003', 'That video isn’t loaded any more — open it again.'); open(a.data, p.name || a.source, a.mime); });
      ctx.onUI('play', null, () => play()); ctx.onUI('pause', null, () => { stop(); grab(); });
      ctx.onUI('seek', { type: 'object', required: ['t'] }, (p) => seek(Number(p.t)));
      ctx.onUI('set_in', null, () => { if (!ready) return; inT = Math.min(v.currentTime, outT - 0.05); sendInfo(info()); ctx.syncUI(); });
      ctx.onUI('set_out', null, () => { if (!ready) return; outT = Math.max(v.currentTime, inT + 0.05); sendInfo(info()); ctx.syncUI(); });
      ctx.onUI('trim', { type: 'object', required: ['in', 'out'] }, (p) => { if (!ready) return; const a = Math.max(0, Math.min(dur, Number(p.in))), b = Math.max(0, Math.min(dur, Number(p.out))); if (!(b - a >= 0.05)) return ctx.fault('RUNTIME_002', 'the cut must be at least 0.05 s'); inT = a; outT = b; sendInfo(info()); ctx.syncUI(); });
      ctx.onUI('grab', null, () => grab());
      ctx.onUI('export', null, async () => { const x = await exportCut(); if (x) window.Workspace.download(x.name, x.blob, 'video/webm'); });
      ctx.onUI('cancel_export', null, () => { if (rec) rec.cancel(); });
      ctx.dataIn('play', { accepts: ['trigger'], label: 'play' }, () => play(inT));
      ctx.dataIn('seek', { accepts: ['number'], label: 'seek (s into the cut)' }, (s) => seek(inT + s));
      // follow the song (only when a domain publishes transport events — nothing happens without one)
      ctx.on('transport:play', null, () => { if (P.get('follow')) play(inT); });
      ctx.on('transport:stop', null, () => { if (P.get('follow')) { stop(); seek(inT); } });
      ctx.onSilence && ctx.onSilence((p) => { if (p.hard) stop(); });
      ctx.saveExtra = () => ({ hash, name, in: inT, out: outT });
      ctx.loadExtra = (x) => { if (!x || !x.hash) return; const a = K.assets.get(x.hash); if (!a || !a.data) { name = x.name || ''; ctx.emitUI('missing', { name }); return; } open(a.data, x.name || a.source, a.mime).then((ok) => { if (ok) { inT = Math.max(0, Math.min(dur, +x.in || 0)); outT = Math.max(inT + 0.05, Math.min(dur, +x.out || dur)); sendInfo(info()); ctx.syncUI(); } }); };
      ctx.stateExtra = () => ({ ready, name, duration: dur, in: inT, out: outT, playing: !v.paused, t: v.currentTime || 0, exporting: !!rec });
      ctx.emitUI('element', { el: v });
      ctx.onUI('want_element', null, () => ctx.emitUI('element', { el: v }));
      ctx.internals = { video: v, info, grab, play, stop, seek, get ready() { return ready; } };
      return { unmount() { stop(); if (rec) rec.cancel(); v.removeAttribute('src'); v.load(); if (url) URL.revokeObjectURL(url); } };
    },
  });
})();
