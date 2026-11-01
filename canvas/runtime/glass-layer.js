/* ERAVOS runtime — glass-layer.js → window.GlassLayer. Domain-free. Looking Glass (his design, SPEC v0.3) inside the browser canvas:
 * step A2b of specs/eravos.2026-10-22-brainstorm.map.spec. James, 2026-10-31: "move to main. get to step 2".
 * Why: a colour written to the page restyles everything under it (measured: the page at 6.8 fps with every surface reacting, 48.5 with
 * none). Here the colours are variables the GPU reads every frame — nothing on the page is restyled.
 * The model, in Looking Glass's words:
 *   UI is typed data (2.1)        an element is { type, ...props }: 'wash' (the whole layer tinted) · 'glow' (a lit rounded box: rim,
 *                                 halo and a little light inside, placed on a page element — its anchor — or at a rect)
 *   variables (2.6)               GlassLayer.vars.set(name, value); any prop may be { var: name } instead of a literal
 *   layers at runtime (2.2)       GlassLayer.layer(id, { depth, blend }) makes one on first use; a layer with no elements is removed.
 *                                 blend is a CSS mix-blend-mode; leave it 'normal' unless it is needed: measured, 'screen' makes the
 *                                 browser re-blend the whole page each frame (13 fps vs 52 without a graphics card)
 *   motion is data (2.6)          numbers and colours ease toward what they were set to (tau, default 70 ms), every display frame
 *   motion budget (2.6, 6)        a layer draws only while something in it is lit; at rest it clears once and stops asking for frames
 *   renderer (2.4)                WebGPU with WGSL — the shader language of wgpu, so these shaders carry into the native Looking Glass —
 *                                 or a 2D canvas (the default until WebGPU is seen on a real graphics card). Same data, same picture.
 *   GlassLayer.layer(id, o) → { set(eid, el), remove(eid), clear(), size, el (the <canvas>) } · GlassLayer.layers() · GlassLayer.renderer
 *   GlassLayer.ready (a promise: the renderer chosen) · GlassLayer.stats() (frames drawn, frames skipped) · GlassLayer.frame(t) (tests) */
(function (global) {
  'use strict';
  const doc = global.document; if (!doc) return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // ---- variables
  const store = new Map(), watchers = new Set();
  const vars = {
    set(name, v) { if (store.get(name) === v) return; store.set(name, v); wake(); watchers.forEach(fn => { try { fn(name, v); } catch (e) {} }); },
    get: (name) => store.get(name), has: (name) => store.has(name), delete(name) { store.delete(name); wake(); },
    watch(fn) { watchers.add(fn); return () => watchers.delete(fn); },
  };
  const val = (p, d) => p && typeof p === 'object' && 'var' in p ? (store.has(p.var) ? store.get(p.var) : d) : (p === undefined ? d : p);
  // colours as linear-ish [r, g, b, a] 0…1 (eased in this space)
  function rgba(c) {
    if (Array.isArray(c)) return c; c = String(c || '').trim(); let m = /^#([0-9a-f]{3})$/i.exec(c); if (m) c = '#' + m[1].split('').map(x => x + x).join('');
    m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c); if (m) { const n = parseInt(m[1], 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, m[2] ? parseInt(m[2], 16) / 255 : 1]; }
    m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/.exec(c); return m ? [+m[1] / 255, +m[2] / 255, +m[3] / 255, m[4] === undefined ? 1 : +m[4]] : [1, 1, 1, 1];
  }
  // ---- layers and elements
  const LAYERS = new Map(); let raf = 0, lastT = 0, drawn = 0, skipped = 0, renderer = null, R = null;
  function makeLayer(id, o) {
    o = o || {}; const cv = doc.createElement('canvas'); cv.className = 'glass-layer'; cv.dataset.layer = id; cv.setAttribute('aria-hidden', 'true');
    Object.assign(cv.style, { position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: String(o.depth || 50), mixBlendMode: o.blend || 'normal' });
    const L = { id, el: cv, items: new Map(), tau: o.tau || 70, dirty: true, lit: false, gpu: null,
      set(eid, e) { const cur = L.items.get(eid); L.items.set(eid, { def: e, now: cur ? cur.now : null }); if (!cv.isConnected) doc.body.appendChild(cv); wake(); return L; },
      remove(eid) { L.items.delete(eid); if (!L.items.size) drop(L); else wake(); return L; },
      clear() { L.items.clear(); drop(L); return L; },
      get size() { return L.items.size; } };
    LAYERS.set(id, L); return L;
  }
  function drop(L) { LAYERS.delete(L.id); try { L.el.remove(); } catch (e) {} if (R && R.forget) R.forget(L); }   // 2.2: an empty layer is removed
  // what an element is right now: its props resolved (variables), its box measured, eased toward that
  function resolve(e, dt, tau) {
    const d = e.def, k = 1 - Math.exp(-dt / tau);
    let box = null;
    if (d.type === 'wash') box = [0, 0, global.innerWidth, global.innerHeight];
    else if (d.anchor) { if (!d.anchor.isConnected) return null; const r = d.anchor.getBoundingClientRect(); if (!r.width || !r.height) return null; box = [r.left, r.top, r.width, r.height]; }
    else if (d.rect) box = d.rect.slice();
    if (!box) return null;
    const tgt = { col: rgba(val(d.color, '#ffffff')), amt: clamp(+val(d.intensity, val(d.alpha, 0)) || 0, 0, 1) };
    if (!e.now) e.now = { col: tgt.col.slice(), amt: 0 };
    const n = e.now; for (let i = 0; i < 4; i++) n.col[i] += (tgt.col[i] - n.col[i]) * k; n.amt += (tgt.amt - n.amt) * k;
    if (Math.abs(tgt.amt - n.amt) < 0.002) n.amt = tgt.amt;
    return { box, col: n.col, amt: n.amt, settling: Math.abs(tgt.amt - n.amt) > 0.002,
      radius: +val(d.radius, d.type === 'wash' ? 0 : 6), spread: d.type === 'wash' ? 0 : +val(d.spread, 18), fill: d.type === 'wash' ? 1 : +val(d.fill, 0.06) };
  }
  // ---- the frame loop (the motion budget: runs only while something is lit or still easing)
  function wake() { if (!raf && LAYERS.size) raf = global.requestAnimationFrame(frame); }
  function frame(t) {
    raf = 0; const dt = lastT ? clamp(t - lastT, 1, 100) : 16; lastT = t; let any = false;
    LAYERS.forEach(L => {
      const list = []; L.items.forEach(e => { const r = resolve(e, dt, L.tau); if (r && (r.amt > 0.003 || r.settling)) list.push(r); if (r && r.settling) any = true; });
      const lit = list.some(r => r.amt > 0.003); if (lit) any = true;
      if (!lit && !L.lit) { skipped++; return; }   // at rest and already clear: nothing to draw
      if (R) { size(L); R.draw(L, list); drawn++; } L.lit = lit;
    });
    if (any) raf = global.requestAnimationFrame(frame); else lastT = 0;
  }
  function size(L) {
    const dpr = Math.min(2, global.devicePixelRatio || 1), w = Math.max(1, Math.round(global.innerWidth * dpr)), h = Math.max(1, Math.round(global.innerHeight * dpr));
    if (L.el.width !== w || L.el.height !== h) { L.el.width = w; L.el.height = h; L.resized = true; } L.dpr = dpr;
  }
  // ---- WebGPU (WGSL: one instanced quad per element; a rounded box as a signed distance field — crisp at any scale)
  const WGSL = `
struct U { vp: vec2f, dpr: f32, pad: f32 };
@group(0) @binding(0) var<uniform> u: U;
struct I { @location(0) rect: vec4f, @location(1) col: vec4f, @location(2) shape: vec4f };   // shape: radius, spread, fill, amount
struct O { @builtin(position) pos: vec4f, @location(0) p: vec2f, @location(1) half: vec2f, @location(2) col: vec4f, @location(3) shape: vec4f };
@vertex fn vs(@builtin(vertex_index) vi: u32, i: I) -> O {
  var c = array<vec2f, 6>(vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0), vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0));
  let pad = i.shape.y * 3.0 + 2.0;
  let px = i.rect.xy - vec2f(pad) + c[vi] * (i.rect.zw + vec2f(pad * 2.0));
  var o: O;
  o.pos = vec4f(px.x / u.vp.x * 2.0 - 1.0, 1.0 - px.y / u.vp.y * 2.0, 0.0, 1.0);
  o.half = i.rect.zw * 0.5; o.p = px - (i.rect.xy + o.half); o.col = i.col; o.shape = i.shape;
  return o;
}
fn box(p: vec2f, b: vec2f, r: f32) -> f32 { let q = abs(p) - b + vec2f(r); return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r; }
@fragment fn fs(o: O) -> @location(0) vec4f {
  let d = box(o.p, o.half, o.shape.x);
  let edged = step(0.0001, o.shape.y);
  let halo = select(pow(exp(-d / max(o.shape.y, 0.001)), 0.8), 0.0, d < 0.0) * 0.9;
  let rim = exp(-abs(d) / 2.0);
  let inside = select(0.0, o.shape.z, d < 0.0);
  let a = clamp((max(halo, rim) * edged + inside) * o.shape.w * o.col.a, 0.0, 1.0);
  return vec4f(o.col.rgb * a, a);
}`;
  async function webgpu() {
    if (!global.navigator || !navigator.gpu) return null;
    const ad = await navigator.gpu.requestAdapter(); if (!ad) return null; const dev = await ad.requestDevice(), fmt = navigator.gpu.getPreferredCanvasFormat();
    dev.addEventListener('uncapturederror', (e) => console.error('[ERAVOS] glass layer GPU:', e.error && e.error.message));
    const mod = dev.createShaderModule({ code: WGSL });
    const pipe = dev.createRenderPipeline({ layout: 'auto',
      vertex: { module: mod, entryPoint: 'vs', buffers: [{ arrayStride: 48, stepMode: 'instance', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }, { shaderLocation: 1, offset: 16, format: 'float32x4' }, { shaderLocation: 2, offset: 32, format: 'float32x4' }] }] },
      fragment: { module: mod, entryPoint: 'fs', targets: [{ format: fmt, blend: { color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] },
      primitive: { topology: 'triangle-list' } });
    const ubuf = dev.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const bind = dev.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: ubuf } }] });
    let ibuf = null, cap = 0;
    return { name: 'webgpu',
      draw(L, list) {
        if (!L.gpu) { L.gpu = L.el.getContext('webgpu'); L.gpu.configure({ device: dev, format: fmt, alphaMode: 'premultiplied' }); }
        const n = list.length; if (n > cap) { cap = Math.max(16, n * 2); if (ibuf) ibuf.destroy(); ibuf = dev.createBuffer({ size: cap * 48, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }); }
        const f = new Float32Array(Math.max(1, n) * 12);
        list.forEach((r, i) => { f.set(r.box, i * 12); f.set(r.col, i * 12 + 4); f.set([r.radius, r.spread, r.fill, r.amt], i * 12 + 8); });
        dev.queue.writeBuffer(ubuf, 0, new Float32Array([global.innerWidth, global.innerHeight, L.dpr, 0]));
        if (n) dev.queue.writeBuffer(ibuf, 0, f);
        const enc = dev.createCommandEncoder(), pass = enc.beginRenderPass({ colorAttachments: [{ view: L.gpu.getCurrentTexture().createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: 'store' }] });
        if (n) { pass.setPipeline(pipe); pass.setBindGroup(0, bind); pass.setVertexBuffer(0, ibuf); pass.draw(6, n); }
        pass.end(); dev.queue.submit([enc.finish()]);
      },
      forget(L) { L.gpu = null; } };
  }
  // ---- 2D canvas: the same elements. A glow's blur is drawn ONCE into a sprite (by size, spread and colour, in steps) and stamped each
  //      frame with its amount as transparency — a blur every frame was the cost (measured: 30 → see the 3.82 addendum)
  function canvas2d() {
    const cache = new Map(), MAX = 96, step = (v, n) => Math.round(v / n) * n;
    function sprite(w, h, r, spread, col, fill) {
      const W = step(w, 2), H = step(h, 2), S = step(spread, 4), c = col.map(x => Math.round(x * 15)), key = [W, H, r, S, c.join(','), step(fill, 0.02)].join('|');
      let sp = cache.get(key); if (sp) { cache.delete(key); cache.set(key, sp); return sp; }
      const pad = Math.ceil(S * 2.2) + 2; sp = doc.createElement('canvas'); sp.width = W + pad * 2; sp.height = H + pad * 2; sp.pad = pad;
      const g = sp.getContext('2d'), css = (al) => `rgba(${c[0] * 17},${c[1] * 17},${c[2] * 17},${al})`;
      g.beginPath(); g.roundRect ? g.roundRect(pad, pad, W, H, r) : g.rect(pad, pad, W, H);
      g.fillStyle = css(fill); g.fill(); g.shadowColor = css(1); g.shadowBlur = S * 2; g.lineWidth = 2; g.strokeStyle = css(1); g.stroke(); g.stroke(); g.shadowBlur = 0;
      cache.set(key, sp); if (cache.size > MAX) cache.delete(cache.keys().next().value); return sp;
    }
    return { name: '2d', cache,
      draw(L, list) {
        const g = L.el.getContext('2d'), s = L.dpr; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, L.el.width, L.el.height); g.setTransform(s, 0, 0, s, 0, 0);
        list.forEach(r => {
          const [x, y, w, h] = r.box, a = clamp(r.amt * r.col[3], 0, 1);
          if (!r.spread) { g.globalAlpha = 1; g.fillStyle = `rgba(${Math.round(r.col[0] * 255)},${Math.round(r.col[1] * 255)},${Math.round(r.col[2] * 255)},${(r.fill * a).toFixed(3)})`; g.fillRect(x, y, w, h); return; }
          const sp = sprite(w, h, r.radius, r.spread, r.col, r.fill); g.globalAlpha = a; g.drawImage(sp, x - sp.pad, y - sp.pad, w + sp.pad * 2, h + sp.pad * 2);
        });
        g.globalAlpha = 1;
      } };
  }
  // 3.82: the 2D canvas is the default. It is the one seen working (screenshots) and measured. WebGPU is chosen with use('webgpu')
  // (remembered): the test machine's software GPU never presents a WebGPU canvas — not even a plain red clear — so it is unverified
  // here until it runs on a real graphics card.
  async function choose(prefer) {
    let r = null; if (prefer === 'webgpu') { try { r = await webgpu(); } catch (e) { r = null; } }
    R = r || canvas2d(); renderer = R.name; LAYERS.forEach(L => { L.gpu = null; L.lit = true; }); wake(); return renderer;
  }
  let pref = global.ERAVOS_GLASS_RENDERER; try { pref = pref || global.localStorage.getItem('eravos.glass.renderer'); } catch (e) {}
  const ready = choose(pref || '2d');
  global.GlassLayer = {
    vars, ready,
    layer(id, o) { return LAYERS.get(id) || makeLayer(id, o); },
    has: (id) => LAYERS.has(id), layers: () => Array.from(LAYERS.keys()),
    get renderer() { return renderer; },
    use(name) { try { global.localStorage.setItem('eravos.glass.renderer', name); } catch (e) {} return choose(name); },   // '2d' | 'webgpu' (remembered)
    stats: () => ({ drawn, skipped, layers: LAYERS.size, running: !!raf, renderer }),
    frame(t) { if (raf) { global.cancelAnimationFrame(raf); raf = 0; } frame(t === undefined ? performance.now() : t); },   // tests: one frame now
    WGSL,
  };
})(typeof window !== 'undefined' ? window : globalThis);
