/* eravos.image.image-adjust 1.0.0 — Image Adjust · spec image-adjust.spec (domain image · Image Manipulation)
 * The one tool Image Manipulation stands on. A picture comes in (Open…, a dropped file, or the "in" port — e.g. a frame
 * from Video Clip); every adjustment is a parameter (non-destructive: the original is kept, as an asset, and saved with
 * the project); the result goes out on "out" (full resolution, re-sent when you stop changing things) and exports as
 * PNG / JPEG / WebP. Pipeline: ImageCore (tools/image/core/image-core.js). Before/after: hold "Original". */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const N = (key, label, min, max, def, step, group, hint, unit) => ({ key, type: 'number', default: def, min, max, step, label, group, hint, unit });
  OrganismFactory.define({
    id: 'eravos.image.image-adjust', domain: 'image', version: '1.0.0', label: 'Image Adjust', icon: '🖼', accent: '#6ee7f2', phase: 'P37',
    category: 'Image', blurb: 'Open a picture and shape it: exposure, colour, tone, crop, rotate — non-destructive, before/after, export PNG/JPEG/WebP.',
    size: { w: 720, h: 640 }, minSize: { w: 420, h: 420 },
    permissions: ['bus_publish', 'bus_subscribe'],
    provides: ['capability.image'],
    hooks: [
      S.data_in('img.hook.in', 'in', ['image'], 'a picture to adjust (e.g. a frame from Video Clip)'),
      S.data_out('img.hook.out', 'out', 'image', 'the adjusted picture, full resolution'),
      S.data_out('img.hook.stats', 'stats', 'json', 'size, mean brightness, clipped shadows/highlights'),
    ],
    config: [
      N('exposure', 'Exposure', -4, 4, 0, 0.01, 'LIGHT', 'stops of light (+1 = twice the light)', 'EV'),
      N('contrast', 'Contrast', -1, 1, 0, 0.01, 'LIGHT'),
      N('highlights', 'Highlights', -1, 1, 0, 0.01, 'LIGHT', 'negative recovers bright areas'),
      N('shadows', 'Shadows', -1, 1, 0, 0.01, 'LIGHT', 'positive lifts dark areas'),
      N('blackPoint', 'Black', 0, 0.5, 0, 0.005, 'LEVELS'), N('whitePoint', 'White', 0.5, 1, 1, 0.005, 'LEVELS'), N('gamma', 'Gamma', 0.3, 3, 1, 0.01, 'LEVELS'),
      N('temperature', 'Temperature', -1, 1, 0, 0.01, 'COLOUR', 'cool ← → warm'), N('tint', 'Tint', -1, 1, 0, 0.01, 'COLOUR', 'green ← → magenta'),
      N('saturation', 'Saturation', -1, 1, 0, 0.01, 'COLOUR'), N('vibrance', 'Vibrance', -1, 1, 0, 0.01, 'COLOUR', 'saturates the dull colours more than the bright ones'),
      N('vignette', 'Vignette', 0, 1, 0, 0.01, 'FINISH'),
      { key: 'rotate', type: 'enum', options: [0, 90, 180, 270], default: 0, label: 'Rotate', group: 'FRAME' },
      { key: 'flipH', type: 'boolean', default: false, label: 'Flip', group: 'FRAME' },
      { key: 'aspect', type: 'enum', options: ['free', '1:1', '4:5', '3:2', '16:9', '9:16'], default: 'free', label: 'Crop shape', group: 'FRAME' },
      { key: 'format', type: 'enum', options: ['png', 'jpeg', 'webp'], default: 'png', label: 'Export as', group: 'EXPORT' },
      N('quality', 'Quality', 0.5, 1, 0.92, 0.01, 'EXPORT', 'JPEG / WebP quality'),
    ],
    ui_hooks: ['open_file', 'open_asset', 'crop_set', 'crop_reset', 'export', 'reset_all', 'original', 'want_preview'],
    engine(ctx) {
      const K = ctx.K, P = ctx.params, IC = window.ImageCore;
      let src = null, srcHash = null, name = 'image', crop = { x: 0, y: 0, w: 1, h: 1 }, sendTimer = null, version = 0;
      const sendOut = ctx.dataOut('out', { type: 'image', label: 'picture' }), sendStats = ctx.dataOut('stats', { type: 'json', label: 'stats' });
      const KEYS = ['exposure', 'contrast', 'highlights', 'shadows', 'blackPoint', 'whitePoint', 'gamma', 'temperature', 'tint', 'saturation', 'vibrance', 'vignette', 'rotate', 'flipH'];
      const params = () => Object.assign(Object.fromEntries(KEYS.map(k => [k, k === 'rotate' ? +P.get(k) : P.get(k)])), { crop });
      async function decode(blobOrAb, mime) { const blob = blobOrAb instanceof Blob ? blobOrAb : new Blob([blobOrAb], { type: mime || 'image/*' }); return await createImageBitmap(blob); }
      async function setSource(bitmapOrCanvas, meta) {
        src = bitmapOrCanvas; name = (meta && meta.name) || name; crop = { x: 0, y: 0, w: 1, h: 1 }; version++;
        ctx.emitUI('source', { width: src.width, height: src.height, name }); changed(0);
      }
      async function openBytes(ab, nm, mime) {
        try { const bm = await decode(ab, mime); const a = K.assets.register(ab instanceof ArrayBuffer ? ab : await ab.arrayBuffer(), { name: nm, mime: mime || 'image/*', asset_type: 'image' }); srcHash = a.hash; await setSource(bm, { name: nm }); return true; }
        catch (e) { ctx.fault('RUNTIME_003', `${nm || 'That file'} couldn’t be opened as a picture (${e.message}).`); return false; }
      }
      const render = (maxSide) => src ? IC.process(src, params(), { maxSide }) : null;
      // the window's preview: rendered here (≤ 960 px), at most once per frame, and handed to the window as a bitmap
      let pvQueued = false, showOriginal = false;
      function preview() {
        if (pvQueued) return; pvQueued = true;
        setTimeout(async () => { pvQueued = false; if (!src || ctx.disposed) return; const c = showOriginal ? IC.process(src, { rotate: +P.get('rotate'), flipH: P.get('flipH'), crop }, { maxSide: 960 }) : render(960);
          const bm = typeof createImageBitmap === 'function' ? await createImageBitmap(c) : c; ctx.emitUI('preview', { bitmap: bm, width: c.width, height: c.height, hist: Array.from(IC.histogram(c)), original: showOriginal }); }, 16);
      }
      function changed(delay) { version++; preview(); clearTimeout(sendTimer); sendTimer = setTimeout(sendNow, delay === undefined ? 350 : delay); }
      async function sendNow() {
        if (!src) return; const c = render(0); if (!c) return;
        const bitmap = typeof createImageBitmap === 'function' ? await createImageBitmap(c) : c;
        sendOut({ width: c.width, height: c.height, bitmap, name });
        sendStats(stats(c));
      }
      function stats(c) {
        const s = IC.makeCanvas(Math.min(256, c.width), Math.max(1, Math.round(Math.min(256, c.width) * c.height / c.width))), g = s.getContext('2d', { willReadFrequently: true }); g.drawImage(c, 0, 0, s.width, s.height);
        const d = g.getImageData(0, 0, s.width, s.height).data; let sum = 0, lo = 0, hi = 0; const n = d.length / 4;
        for (let i = 0; i < d.length; i += 4) { const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; sum += y; if (y <= 2) lo++; if (y >= 253) hi++; }
        return { width: c.width, height: c.height, mean: +(sum / n / 255).toFixed(4), clippedShadows: +(lo / n).toFixed(4), clippedHighlights: +(hi / n).toFixed(4) };
      }
      KEYS.forEach(k => P.onChange(k, () => changed()));
      P.onChange('aspect', () => { applyAspect(); changed(); });
      function applyAspect() {
        const a = P.get('aspect'); if (a === 'free' || !src) return;
        const [aw, ah] = a.split(':').map(Number), rot = +P.get('rotate'), swap = rot === 90 || rot === 270, W = swap ? src.height : src.width, H = swap ? src.width : src.height;
        const want = aw / ah; let w = 1, h = (W / H) / want; if (h > 1) { w = 1 / h; h = 1; }
        crop = { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
      }
      ctx.dataIn('in', { accepts: ['image'], label: 'picture' }, (v) => { srcHash = null; setSource(v.bitmap, { name: v.name || 'from wire' }); });
      ctx.onUI('open_file', { type: 'object', required: ['arrayBuffer'] }, (p) => openBytes(p.arrayBuffer, p.name, p.type));
      ctx.onUI('open_asset', { type: 'object', required: ['hash'] }, async (p) => { const a = K.assets.get(p.hash); if (!a || !a.data) return ctx.fault('RUNTIME_003', 'That picture isn’t loaded any more — open it again.'); await openBytes(a.data, p.name || a.source, a.mime); });
      ctx.onUI('crop_set', { type: 'object', required: ['x', 'y', 'w', 'h'] }, (c) => {
        const v = ['x', 'y', 'w', 'h'].map(k => Number(c[k])); if (v.some(x => !Number.isFinite(x))) return ctx.fault('RUNTIME_002', 'crop needs numbers');
        let [x, y, w, h] = v; w = Math.max(0.02, Math.min(1, w)); h = Math.max(0.02, Math.min(1, h)); x = Math.max(0, Math.min(1 - w, x)); y = Math.max(0, Math.min(1 - h, y));
        crop = { x, y, w, h }; changed();
      });
      ctx.onUI('crop_reset', null, () => { crop = { x: 0, y: 0, w: 1, h: 1 }; if (P.get('aspect') !== 'free') P.set('aspect', 'free'); changed(); ctx.syncUI(); });
      ctx.onUI('reset_all', null, () => { KEYS.forEach(k => { const c = ctx.descriptor.config.find(x => x.key === k); P.set(k, c.default); }); crop = { x: 0, y: 0, w: 1, h: 1 }; changed(); ctx.syncUI(); });
      async function exportBlob() {
        if (!src) { ctx.fault('RUNTIME_003', 'Open a picture first.'); return null; }
        const c = render(0), fmt = P.get('format'), mime = 'image/' + fmt, q = P.get('quality');
        const blob = c.convertToBlob ? await c.convertToBlob({ type: mime, quality: q }) : await new Promise(res => c.toBlob(res, mime, q));
        if (!blob) { ctx.fault('RUNTIME_003', `This browser can’t write ${fmt.toUpperCase()} — choose PNG.`); return null; }
        return { blob, name: name.replace(/\.[a-z0-9]+$/i, '') + '-adjusted.' + (fmt === 'jpeg' ? 'jpg' : fmt), width: c.width, height: c.height };
      }
      ctx.exportBlob = exportBlob;
      ctx.onUI('export', null, async () => { const x = await exportBlob(); if (x) { window.Workspace.download(x.name, x.blob, x.blob.type); ctx.emitUI('exported', { name: x.name, bytes: x.blob.size, width: x.width, height: x.height }); } });
      ctx.onUI('original', { type: 'object', required: ['on'] }, (p) => { showOriginal = !!p.on; preview(); });
      ctx.onUI('want_preview', null, () => preview());
      ctx.render = render;
      ctx.saveExtra = () => ({ crop, srcHash, name });
      ctx.loadExtra = (x) => { if (!x) return; if (x.crop) crop = x.crop; if (x.name) name = x.name; if (x.srcHash) { srcHash = x.srcHash; const a = K.assets.get(x.srcHash); if (a && a.data) openBytes(a.data, name, a.mime).then(() => { if (x.crop) { crop = x.crop; changed(); } }); else ctx.emitUI('missing', { name }); } ctx.syncUI(); };
      ctx.stateExtra = () => ({ hasSource: !!src, width: src ? src.width : 0, height: src ? src.height : 0, name, crop });
      ctx.internals = { get src() { return src; }, get crop() { return crop; }, params, stats };
      return { unmount() { clearTimeout(sendTimer); } };
    },
  });
})();
