/* ERAVOS image domain — core/image-core.js → window.ImageCore (pure functions; no DOM state; tested directly)
 * The adjustment pipeline every image tool shares, in this order:
 *   geometry  rotate 0/90/180/270 · flip · crop (normalised rect of the rotated picture) · scale to the target size
 *   per channel (3 lookup tables, built once per settings change): sRGB → linear light → white balance (temperature,
 *              tint) → exposure (EV, ×2^EV in LINEAR light, so +1 EV is exactly twice the light) → back to sRGB →
 *              levels (black / white point, gamma) → contrast (pivot 0.5)
 *   per pixel  shadows / highlights (luma-weighted lift / recovery, colour kept) → saturation + vibrance (luma kept)
 *              → vignette
 * process(source, params, { maxSide }) → HTMLCanvasElement | OffscreenCanvas with the result.
 * adjustImageData(imageData, params, w, h) → the same ImageData, adjusted in place (no geometry). */
(function (global) {
  'use strict';
  const toLin = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; toLin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  const SN = 4096, toS = new Float32Array(SN + 1); for (let i = 0; i <= SN; i++) { const l = i / SN; toS[i] = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055; }
  const linToS = (l) => l <= 0 ? 0 : l >= 1 ? 1 : toS[Math.round(l * SN)];
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  const DEFAULTS = { exposure: 0, contrast: 0, highlights: 0, shadows: 0, saturation: 0, vibrance: 0, temperature: 0, tint: 0, blackPoint: 0, whitePoint: 1, gamma: 1, vignette: 0, rotate: 0, flipH: false };
  function luts(p) {
    const wb = [Math.pow(2, 0.3 * p.temperature), Math.pow(2, -0.25 * p.tint), Math.pow(2, -0.3 * p.temperature)], ev = Math.pow(2, p.exposure);
    const bp = Math.min(p.blackPoint, p.whitePoint - 0.01), span = Math.max(0.01, p.whitePoint - bp), ig = 1 / Math.max(0.05, p.gamma), k = 1 + p.contrast;
    return [0, 1, 2].map(c => { const t = new Uint8ClampedArray(256); for (let i = 0; i < 256; i++) {
      let v = linToS(toLin[i] * wb[c] * ev);
      v = clamp01((v - bp) / span); if (ig !== 1) v = Math.pow(v, ig);
      v = clamp01(0.5 + (v - 0.5) * k);
      t[i] = Math.round(v * 255);
    } return t; });
  }
  function adjustImageData(img, params, w, h) {
    const p = Object.assign({}, DEFAULTS, params || {}), d = img.data, L = luts(p);
    const sh = p.shadows, hi = p.highlights, sat = p.saturation, vib = p.vibrance, vg = p.vignette, cx = (w - 1) / 2, cy = (h - 1) / 2, rmax = Math.hypot(cx, cy) || 1;
    const perPixel = sh || hi || sat || vib || vg;
    for (let i = 0, n = d.length; i < n; i += 4) {
      let r = L[0][d[i]] / 255, g = L[1][d[i + 1]] / 255, b = L[2][d[i + 2]] / 255;
      if (perPixel) {
        let Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (sh || hi) { const ws = (1 - Y) * (1 - Y), wh = Y * Y; let Yn = Y + 0.6 * sh * ws * (1 - Y) + 0.6 * hi * wh * (hi < 0 ? Y : 1 - Y); Yn = clamp01(Yn); if (Y > 1e-4) { const s = Yn / Y; r *= s; g *= s; b *= s; } else { r = g = b = Yn; } Y = Yn; }
        if (sat || vib) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), cs = mx > 0 ? (mx - mn) / mx : 0; const f = 1 + sat + vib * (1 - cs); r = Y + (r - Y) * f; g = Y + (g - Y) * f; b = Y + (b - Y) * f; }
        if (vg) { const px = (i >> 2) % w, py = ((i >> 2) / w) | 0, rr = Math.hypot(px - cx, py - cy) / rmax, m = 1 - vg * rr * rr; r *= m; g *= m; b *= m; }
      }
      d[i] = r * 255 + 0.5; d[i + 1] = g * 255 + 0.5; d[i + 2] = b * 255 + 0.5; // Uint8Clamped clamps
    }
    return img;
  }
  function makeCanvas(w, h) { if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h); const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // geometry: returns { w, h, draw(ctx2d) } for the rotated/flipped/cropped source at the target scale
  function geometry(src, p, maxSide) {
    const sw = src.width, sh = src.height, rot = ((+p.rotate || 0) % 360 + 360) % 360, swap = rot === 90 || rot === 270;
    const rw = swap ? sh : sw, rh = swap ? sw : sh, cr = p.crop || { x: 0, y: 0, w: 1, h: 1 };
    const cw = Math.max(1, Math.round(rw * cr.w)), ch = Math.max(1, Math.round(rh * cr.h));
    const scale = maxSide ? Math.min(1, maxSide / Math.max(cw, ch)) : 1, w = Math.max(1, Math.round(cw * scale)), h = Math.max(1, Math.round(ch * scale));
    return { w, h, draw(g) {
      g.save(); g.scale(scale, scale); g.translate(-cr.x * rw, -cr.y * rh);
      g.translate(rw / 2, rh / 2); g.rotate(rot * Math.PI / 180); if (p.flipH) g.scale(-1, 1); g.drawImage(src, -sw / 2, -sh / 2); g.restore();
    } };
  }
  function process(src, params, o) {
    const p = Object.assign({}, DEFAULTS, params || {}), gm = geometry(src, p, o && o.maxSide), c = makeCanvas(gm.w, gm.h), g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high'; gm.draw(g);
    const img = g.getImageData(0, 0, gm.w, gm.h); adjustImageData(img, p, gm.w, gm.h); g.putImageData(img, 0, 0);
    return c;
  }
  function histogram(canvas) { // 256-bin luma histogram, normalised to the tallest bin
    const g = canvas.getContext('2d', { willReadFrequently: true }), d = g.getImageData(0, 0, canvas.width, canvas.height).data, H = new Float32Array(256); let m = 0;
    for (let i = 0; i < d.length; i += 4) { const y = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) | 0; H[y]++; }
    for (let i = 0; i < 256; i++) m = Math.max(m, H[i]); if (m) for (let i = 0; i < 256; i++) H[i] /= m; return H;
  }
  global.ImageCore = { DEFAULTS, luts, adjustImageData, process, histogram, makeCanvas, geometry };
})(typeof window !== 'undefined' ? window : globalThis);
