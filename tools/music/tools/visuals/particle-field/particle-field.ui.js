/* eravos.particle-field UI — the field (WebGL2 points with trails, or a 2D canvas when WebGL2 is missing), the
 * memory ring over it (the 12 basins on a circle of fifths, each as deep as it has been heard), live band meters,
 * Forget, full screen, and the knobs. The simulation runs here, one step per drawn frame (EravosField.step). */
OrganismFactory.reg('eravos.particle-field', function (view) {
  const UI = view.ui, h = UI.h, F = window.EravosField, MT = window.MusicTheory, st = view.state;
  const HUE = (pc) => pc < 0 ? -1 : F.FIFTHS.indexOf(pc) / 12;   // neighbours on the ring of fifths get neighbouring colours
  let drive = { bass: 0, mid: 0, high: 0, onset: 0, chroma: new Array(12).fill(0), depth: new Array(12).fill(0), deepest: -1 };
  let L = F.landscape(), world = F.world(st.count || 6000, 7), ang = 0, lastT = 0, kind = '';
  const H = 360, wrap = h('div', { class: 'pf-wrap', style: { position: 'relative', height: H + 'px', background: '#03050a', borderRadius: '6px', overflow: 'hidden' } });
  let glc = null, gl = null, prog = null, buf = null, data = null, quad = null, qprog = null, c2 = null;
  const over = UI.Canvas(600, H); Object.assign(over.style, { position: 'absolute', inset: '0', height: '100%', pointerEvents: 'none', background: 'transparent', border: '0' });

  // ---- renderers
  function mkGL() {
    const c = h('canvas', { role: 'img', 'aria-label': 'particle field' }); Object.assign(c.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    const g = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false }); if (!g) return null;
    const sh = (type, src) => { const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; };
    const link = (vs, fs) => { const p = g.createProgram(); g.attachShader(p, sh(g.VERTEX_SHADER, vs)); g.attachShader(p, sh(g.FRAGMENT_SHADER, fs)); g.linkProgram(p); if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p)); return p; };
    try {
      prog = link(`#version 300 es
        layout(location=0) in vec3 p; layout(location=1) in vec2 a;
        uniform vec2 rot; uniform float aspect, scale, size; uniform int pal; out vec3 col; out float al;
        vec3 hsv(float h, float s, float v) { vec3 k = clamp(abs(mod(h * 6.0 + vec3(0, 4, 2), 6.0) - 3.0) - 1.0, 0.0, 1.0); return v * mix(vec3(1), k, s); }
        void main() {
          float ca = cos(rot.x), sa = sin(rot.x), ct = cos(rot.y), stt = sin(rot.y);
          vec3 q = vec3(p.x * ca + p.z * sa, p.y, -p.x * sa + p.z * ca); q = vec3(q.x, q.y * ct - q.z * stt, q.y * stt + q.z * ct);
          float s = 22.0 / (22.0 + q.z); gl_Position = vec4(q.x * s * scale / aspect, q.y * s * scale, 0, 1); gl_PointSize = size * s;
          float sp = a.y;
          if (pal == 0) col = a.x < 0.0 ? vec3(0.35, 0.45, 0.6) + sp * 0.5 : hsv(a.x, 0.75 - sp * 0.4, 0.55 + sp * 0.45);
          else if (pal == 1) col = mix(vec3(0.5, 0.05, 0.02), vec3(1.0, 0.9, 0.4), sp);
          else if (pal == 2) col = mix(vec3(0.05, 0.2, 0.5), vec3(0.75, 1.0, 1.0), sp);
          else col = vec3(0.75 + sp * 0.25);
          al = 0.35 + sp * 0.55;
        }`, `#version 300 es
        precision mediump float; in vec3 col; in float al; out vec4 o;
        void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d); if (r > 0.25) discard; o = vec4(col, al * (1.0 - r * 4.0)); }`);
      qprog = link(`#version 300 es
        const vec2 v[3] = vec2[3](vec2(-1, -1), vec2(3, -1), vec2(-1, 3)); void main() { gl_Position = vec4(v[gl_VertexID], 0, 1); }`, `#version 300 es
        precision mediump float; uniform float fade; out vec4 o; void main() { o = vec4(0.012, 0.02, 0.04, fade); }`);
    } catch (e) { console.warn('Field: WebGL2 shaders failed, using 2D', e); return null; }
    buf = g.createBuffer(); quad = g.createVertexArray(); glc = c; gl = g; return c;
  }
  function useRenderer() {
    const want = st.renderer || 'auto'; [glc, c2].forEach(c => c && c.remove()); glc = gl = c2 = null;
    if (want !== '2d' && mkGL()) { kind = 'WebGL2'; wrap.prepend(glc); }
    else { c2 = UI.Canvas(600, H); Object.assign(c2.style, { position: 'absolute', inset: '0', height: '100%' }); kind = want === 'webgl' ? '2D (no WebGL2 here)' : '2D'; wrap.prepend(c2); }
    data = null;
  }
  function size(c) { const r = wrap.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(50, r.width), Hh = Math.max(50, r.height); if (c.width !== Math.round(W * dpr) || c.height !== Math.round(Hh * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(Hh * dpr); } return { W, H: Hh, dpr }; }
  function drawGL(rot) {
    const { W, H: Hh, dpr } = size(glc), N = world.N; gl.viewport(0, 0, glc.width, glc.height);
    if (!data || data.length !== N * 5) data = new Float32Array(N * 5);
    for (let i = 0, j = 0; i < N; i++, j += 5) { data[j] = world.px[i]; data[j + 1] = world.py[i]; data[j + 2] = world.pz[i]; data[j + 3] = HUE(world.pc[i]); data[j + 4] = world.sp[i]; }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(qprog); gl.bindVertexArray(quad); gl.uniform1f(gl.getUniformLocation(qprog, 'fade'), 1 - (st.trail || 0)); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);   // additive: dense places glow
    gl.useProgram(prog); gl.bindVertexArray(null); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    const u = (n) => gl.getUniformLocation(prog, n);
    gl.uniform2f(u('rot'), rot[0], rot[1]); gl.uniform1f(u('aspect'), W / Hh); gl.uniform1f(u('scale'), 0.95 / world.B); gl.uniform1f(u('size'), (st.size || 1.6) * dpr); gl.uniform1i(u('pal'), ['pitch', 'heat', 'ice', 'mono'].indexOf(st.palette || 'pitch'));
    gl.drawArrays(gl.POINTS, 0, N);
  }
  const COL2 = (pc, sp) => { const pal = st.palette || 'pitch'; if (pal === 'heat') return `hsl(${10 + sp * 40},100%,${30 + sp * 40}%)`; if (pal === 'ice') return `hsl(${200 - sp * 20},90%,${35 + sp * 50}%)`; if (pal === 'mono') return `hsl(0,0%,${70 + sp * 30}%)`; return pc < 0 ? `hsl(215,25%,${45 + sp * 35}%)` : `hsl(${HUE(pc) * 360},${75 - sp * 35}%,${45 + sp * 35}%)`; };
  function draw2D(rot) {
    const { W, H: Hh, dpr } = size(c2), g = c2.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(3,5,10,${1 - (st.trail || 0)})`; g.fillRect(0, 0, W, Hh);
    const ca = Math.cos(rot[0]), sa = Math.sin(rot[0]), ct = Math.cos(rot[1]), stt = Math.sin(rot[1]), sc = 0.95 / world.B * Hh / 2, z0 = (st.size || 1.6);
    g.globalCompositeOperation = 'lighter'; let cur = '';
    for (let i = 0; i < world.N; i++) {
      const x = world.px[i], y = world.py[i], z = world.pz[i], qx = x * ca + z * sa, qz = -x * sa + z * ca, qy = y * ct - qz * stt, qz2 = y * stt + qz * ct, s = 22 / (22 + qz2);
      const sp = Math.round(world.sp[i] * 3) / 3, c = COL2(world.pc[i], sp); if (c !== cur) { g.fillStyle = c; cur = c; }
      g.globalAlpha = 0.35 + sp * 0.55; const r = z0 * s; g.fillRect(W / 2 + qx * s * sc - r / 2, Hh / 2 - qy * s * sc - r / 2, r, r);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  // ---- the memory ring + meters, drawn over the field
  function drawOver(rot) {
    const g = over.g; over.fit(); const W = over.W, Hh = wrap.getBoundingClientRect().height || H; g.clearRect(0, 0, W, Hh);
    const sc = 0.95 / world.B * Hh / 2, ca = Math.cos(rot[0]), sa = Math.sin(rot[0]), ct = Math.cos(rot[1]), stt = Math.sin(rot[1]);
    for (let pc = 0; pc < 12; pc++) {   // projected exactly like the dots, so each ring sits on its basin
      const [bx, by] = F.basinXY(pc, world.B * 0.55), qz = -bx * sa, qy = by * ct - qz * stt, s = 22 / (22 + by * stt + qz * ct), d = L.depth[pc], x = W / 2 + bx * ca * s * sc, y = Hh / 2 - qy * s * sc, rr = 3 + d * 14;
      g.strokeStyle = `hsla(${HUE(pc) * 360},80%,65%,${0.15 + d * 0.7})`; g.lineWidth = 1 + d * 2; g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke();
      g.fillStyle = `hsla(${HUE(pc) * 360},70%,75%,${0.3 + d * 0.7})`; g.font = (pc === drive.deepest ? '700 ' : '') + '10px monospace'; g.textAlign = 'center'; g.fillText(MT ? MT.NAMES[pc] : pc, x, y - rr - 3);
    }
    const bar = (i, v, c, l) => { g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(8 + i * 16, Hh - 58, 10, 50); g.fillStyle = c; g.fillRect(8 + i * 16, Hh - 8 - v * 50, 10, v * 50); g.fillStyle = '#7f93a8'; g.font = '8px monospace'; g.textAlign = 'center'; g.fillText(l, 13 + i * 16, Hh - 61); };
    bar(0, drive.bass, '#ff2266', 'LO'); bar(1, drive.mid, '#ffaa00', 'MID'); bar(2, drive.high, '#7cf7ff', 'HI');
    g.textAlign = 'right'; g.fillStyle = '#4d5f73'; g.font = '9px monospace'; g.fillText(kind + ' · ' + world.N + ' dots' + (L.heard ? ' · heard ' + Math.round(L.heard) + ' s' : ''), W - 8, Hh - 8);
  }
  // ---- the loop: one physics step, then draw
  UI.loop(over, (t) => {
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;
    ang += dt * (st.spin || 0) * 0.6; const rot = [ang, st.tilt != null ? st.tilt : 0.35];
    F.step(world, dt, drive, { gravity: st.gravity, curl: st.curl, entropy: st.entropy, damping: st.damping, speed: st.speed, basins: st.basins }, L);
    drive.bass *= 0.97; drive.mid *= 0.97; drive.high *= 0.97; if (drive.pull) drive.pull *= 0.97;   // between frames from the engine the push eases off instead of sticking
    if (gl) drawGL(rot); else if (c2) draw2D(rot); drawOver(rot);
  }, 60);
  view.on('drive', (d) => {
    drive = d; L.depth.set(d.depth || L.depth);
    if (d.onset > 0) F.burst(world, d.onset * 2, 0, 0);   // from the centre: a ring through every basin, which then pull their dots back
  });
  view.on('state_sync', (s) => { if (s.depth) { L = F.landscape(s.depth); L.heard = s.heard || 0; } });
  view.bind('count', (v) => { world = F.world(v, 7); data = null; });
  view.bind('renderer', () => useRenderer());
  useRenderer(); wrap.append(over);
  const full = UI.Button({ label: '⛶', hint: 'full screen (Esc leaves)', onClick: () => { if (document.fullscreenElement) document.exitFullscreen(); else if (wrap.requestFullscreen) wrap.requestFullscreen().catch(() => {}); } });
  const forget = UI.Button({ label: 'Forget', hint: 'flatten the memory: the field starts learning the song again', onClick: () => view.emit('forget', {}) });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0 } }, [forget.el, full.el])]),
    wrap,
    UI.paramPanel(view, ['gravity', 'burst', 'curl', 'entropy', 'sensitivity', 'basins', 'memory', 'learn', 'count', 'speed', 'damping', 'trail', 'size', 'spin', 'tilt', 'palette', 'renderer'], { size: 28 }),
    UI.hint('Wire any sound into the left dot (a tap: the sound keeps going where it went). Bass pulls the field in, hits burst it out, mids swirl, highs shimmer. The ring is the memory: notes you keep playing dig deep basins that hold the field — change key and the old shape fades.'),
  );
});
