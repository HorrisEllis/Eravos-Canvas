/* ERAVOS core — art/painter.js → window.ToolArt (3.227, 2026-11-25). Domain-free: it names no domain, tool or topic.
 * His words (2026-11-25): "i want the thumbnails back. and i want those generated per tool, mutated tool, consistent style."
 * The card paintings of build/tool-art.py (3.88: a sky, Bob Ross mountains, stars, pines, lit in the tool's colour), painted HERE, live, for
 * what is made on the canvas — a tool synthesized from others or mutated from one — so it gets a painting in the same style the moment it
 * exists. The same canvas (240 × 150), the same skies, the same ridges, stars, moon, sun, ground and pines (the formulas of tool-art.py, ported
 * one for one); its landmark is what it was made from: one aurora ribbon per tool it came from, in that tool's colour, braided across the sky
 * and meeting at a star — one ribbon and a scatter of sparks when it was mutated from a single tool.
 *   ToolArt.paint({ id, label, accents: ['#rrggbb', …], mutated? }) → '<svg …>' · ToolArt.url(o) → a data: URL for an <img> or a CSS url()
 * Seeded by the id: the same made tool always gets the same painting. */
(function (global) {
  'use strict';
  const W = 240, H = 150, DK = '#06061a';
  const STYLE = '<style>.tw{animation:tw 3.2s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}' +
    '.pu{animation:pu 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
    '@keyframes tw{from{opacity:.25;transform:scale(.7)}to{opacity:1;transform:scale(1.15)}}@keyframes pu{0%,100%{opacity:.18;transform:scale(.85)}50%{opacity:.8;transform:scale(1.12)}}' +
    '@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>';
  const SKIES = { night: ['#050818', '#141a48', '#2c2a6a'], dusk: ['#120a35', '#4a1f6e', '#c4547e'], sunset: ['#1b1446', '#b44b8c', '#ffb36b'],
    dawn: ['#1a1450', '#7a3f9a', '#ff9a8a'], aurora: ['#030a14', '#0f2a3a', '#1f4a52'], violet: ['#0d0828', '#3a2470', '#9a6ac0'] };
  const KINDS = Object.keys(SKIES);
  const hx = (c) => { c = String(c).replace('#', ''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) || 0); };
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0')).join(''); };
  const ok = (c) => /^#[0-9a-f]{6}$/i.test(String(c || '')) && String(c).toLowerCase() !== '#ffffff';
  function rng(seed) { let t = 0; for (let i = 0; i < seed.length; i++) t = (Math.imul(t ^ seed.charCodeAt(i), 0x9E3779B1) + 0x632BE5AB) | 0;
    const next = () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    return { u: (a, b) => a + (b - a) * next(), pick: (L) => L[Math.floor(next() * L.length) % L.length], next }; }
  const f1 = (x) => (+x).toFixed(1), f2 = (x) => (+x).toFixed(2);
  const sky = (kind, acc) => { const [a, b, c] = SKIES[kind]; return '<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset=".62" stop-color="' + mix(b, acc, .18) + '"/><stop offset="1" stop-color="' + c + '"/></linearGradient>'; };
  const glow = (id, c, a) => '<radialGradient id="' + id + '"><stop offset="0" stop-color="' + c + '" stop-opacity="' + a + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>';
  const stars = (r, n, y1) => Array.from({ length: n }, () => '<circle class="tw" style="animation-delay:-' + f1(r.u(0, 4)) + 's" cx="' + f1(r.u(3, W - 3)) + '" cy="' + f1(r.u(3, y1)) + '" r="' + f2(r.u(.35, 1.2)) + '" fill="#eef3ff"/>').join('');
  function spark(x, y, s, col, d) {
    const p = 'M' + x + ' ' + (y - s) + 'Q' + (x + s * .18) + ' ' + (y - s * .18) + ' ' + (x + s) + ' ' + y + 'Q' + (x + s * .18) + ' ' + (y + s * .18) + ' ' + x + ' ' + (y + s) + 'Q' + (x - s * .18) + ' ' + (y + s * .18) + ' ' + (x - s) + ' ' + y + 'Q' + (x - s * .18) + ' ' + (y - s * .18) + ' ' + x + ' ' + (y - s) + 'Z';
    return '<g class="tw" style="animation-delay:-' + (d || 1) + 's"><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(s * 1.5) + '" fill="' + col + '" opacity=".18"/><path d="' + p + '" fill="' + col + '"/></g>';
  }
  function ridge(r, base, amp, col, n, snow) {
    const xs = [0, W].concat(Array.from({ length: n }, () => r.u(10, W - 10))).sort((a, b) => a - b), pts = [], peaks = [];
    xs.forEach((x, i) => { const y = base - (i % 2 ? amp * r.u(.45, 1) : amp * r.u(0, .3)); pts.push([x, y]); if (i % 2) peaks.push([x, y]); });
    let o = '<path d="M0 ' + H + 'L' + pts.map(([x, y]) => f1(x) + ' ' + f1(y)).join('L') + 'L' + W + ' ' + H + 'Z" fill="' + col + '"/><polyline points="' + pts.map(([x, y]) => f1(x) + ',' + f1(y)).join(' ') + '" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width=".8"/>';
    if (snow) peaks.forEach(([x, y]) => { if (y < base - amp * .6) o += '<path d="M' + f1(x) + ' ' + f1(y) + 'l5 4.2-2.8-.8-2.2 2.6-2.4-2.8-2.8.8Z" fill="' + snow + '" opacity=".85"/>'; });
    return o;
  }
  const pine = (x, y, s, col) => '<path d="M' + f1(x) + ' ' + f1(y) + 'l' + f1(-s * .55) + ' ' + f1(s * .9) + 'h' + f1(s * .3) + 'l' + f1(-s * .35) + ' ' + f1(s * .6) + 'h' + f1(s * .3) + 'l' + f1(-s * .4) + ' ' + f1(s * .6) + 'h' + f1(s * 1.4) + 'l' + f1(-s * .4) + ' ' + f1(-s * .6) + 'h' + f1(s * .3) + 'l' + f1(-s * .35) + ' ' + f1(-s * .6) + 'h' + f1(s * .3) + 'Z" fill="' + col + '"/>';
  const ground = (col, y0) => '<path d="M0 ' + H + 'L0 ' + y0 + 'C60 ' + (y0 - 8) + ' 120 ' + (y0 - 6) + ' 170 ' + (y0 + 2) + 'S220 ' + (y0 - 2) + ' ' + W + ' ' + (y0 - 4) + 'L' + W + ' ' + H + 'Z" fill="' + col + '"/>';
  const trees = (r, col, y) => [[r.u(6, 20), r.u(10, 15)], [r.u(22, 34), r.u(7, 10)], [r.u(206, 222), r.u(10, 15)], [r.u(224, 236), r.u(7, 10)]].map(([x, s]) => pine(x, y + r.u(-2, 4), s, col)).join('');
  const moon = (x, y, rr, skyc) => '<circle cx="' + x + '" cy="' + f1(y) + '" r="' + f1(rr * 2.6) + '" fill="url(#mglow)"/><circle cx="' + x + '" cy="' + f1(y) + '" r="' + rr + '" fill="#ffe69a"/><circle cx="' + f1(x + rr * .45) + '" cy="' + f1(y - rr * .25) + '" r="' + f1(rr * .88) + '" fill="' + skyc + '"/>';
  const sun = (x, y, rr) => '<circle cx="' + x + '" cy="' + y + '" r="' + rr * 3 + '" fill="url(#sglow)"/><circle cx="' + x + '" cy="' + y + '" r="' + rr + '" fill="#fff0c2"/>';
  function wave(y, a, fq, ph, col, w, op, cls, x0, x1) {
    x0 = x0 || 0; x1 = x1 || W; const pts = [];
    for (let x = x0; x <= x1; x += 4) pts.push(x + ',' + f1(y + a * Math.sin((x - x0) / (x1 - x0) * Math.PI * 2 * fq + ph) * Math.sin((x - x0) / (x1 - x0) * Math.PI)));
    return '<polyline class="' + (cls || '') + '" points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" opacity="' + op + '" stroke-linecap="round"/>';
  }
  // the landmark of a made tool: one ribbon per tool it came from, braided, meeting at a star (mutated: one ribbon and a scatter of sparks)
  function made(r, accs, mutated) {
    let o = '<g filter="url(#blur)">';
    accs.forEach((c, i) => { o += wave(44 + i * 8, 13 - i * 2, 1.4 + i * .55, i * 2.1, c, 7 - Math.min(4, i * 1.5), '.5', 'pu'); });
    o += '</g>'; accs.forEach((c, i) => { o += wave(44 + i * 8, 13 - i * 2, 1.4 + i * .55, i * 2.1, mix(c, '#ffffff', .55), .7, '.75'); });
    const meet = accs.length > 1 ? mix(accs[0], accs[1], .5) : accs[0];
    o += '<circle cx="120" cy="50" r="30" fill="url(#ag)"/>' + spark(120, 50, 6, mix(meet, '#ffffff', .35), 2);
    if (mutated || accs.length === 1) for (let i = 0; i < 7; i++) o += spark(r.u(30, 210), r.u(22, 74), r.u(1.6, 3.2), r.pick([accs[0], '#fff3c4', mix(accs[0], '#ffffff', .5)]), r.u(0, 3).toFixed(1));
    return o;
  }
  function paint(o) {
    o = o || {}; const id = String(o.id || o.label || 'made'), accs = (o.accents || []).filter(ok).slice(0, 4); if (!accs.length) accs.push('#00d4ff');
    const r = rng(id), kind = o.sky && SKIES[o.sky] ? o.sky : KINDS[Math.floor(r.next() * KINDS.length) % KINDS.length], acc = accs[0], top = SKIES[kind][0], skyc = mix(SKIES[kind][1], acc, .18);
    let defs = sky(kind, acc) + glow('ag', accs.length > 1 ? mix(accs[0], accs[1], .5) : acc, .55) + glow('mglow', '#ffd86b', .45) + glow('sglow', '#ffd27a', .7) +
      '<filter id="blur" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>';
    let body = '<rect width="' + W + '" height="' + H + '" fill="url(#sk)"/>' + stars(r, ['night', 'aurora', 'violet'].includes(kind) ? 55 : 25, 80);
    if (kind === 'night' || kind === 'violet') body += moon(r.pick([30, 206]), r.u(18, 28), 7, top);
    if (kind === 'sunset' || kind === 'dawn' || kind === 'dusk') body += sun(r.pick([48, 192]), 98, 9);
    body += spark(r.u(20, 220), r.u(10, 30), 3, '#fff3c4', 1);
    const far = mix(SKIES[kind][1], '#1a1f50', .55), near = mix(far, '#05061a', .55);
    body += ridge(r, 104, r.u(16, 28), far, 6, mix('#d8e0ff', acc, .2));
    body += made(r, accs, !!o.mutated);
    body += ridge(r, 118, 10, near, 6) + ground(DK, 138) + trees(r, DK, 124);
    const label = String(o.label || id).replace(/[<&"]/g, '');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + label + ': a painting">' + STYLE + '<defs>' + defs + '</defs>' + body + '</svg>';
  }
  const url = (o) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(paint(o));
  const api = { paint, url, SKIES: KINDS, version: '1.0.0' };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (global) global.ToolArt = api;
})(typeof window !== 'undefined' ? window : null);
