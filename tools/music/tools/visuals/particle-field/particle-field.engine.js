/* eravos.particle-field 1.0.0 — Field · spec eravos.organism.particle-field
 * A particle field that moves with the music and remembers where the song has been.
 * Listens (a TAP: wiring a sound in never reroutes it) and turns each frame into forces:
 *   bass → GRAVITY (the field is pulled in toward the centre) · onsets → BURSTS (a push out from the centre)
 *   mids → CURL (swirl) · highs → ENTROPY (shimmer) · the notes (chroma) → BASINS on a circle of fifths.
 * The basins are the field's memory: every note heard deepens its basin, unheard ones fill back in over
 * Memory seconds. Play in one key for a while and the field settles into that key's shape; change key and the
 * old shape fades as the new one is dug. The memory is saved with the project.
 * Physics after the CFR kernel (curl noise, attractors, stress events, soft walls), written for ERAVOS:
 * seeded, so a test can replay it exactly. The picture is drawn by the UI (WebGL2, 2D canvas fallback). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];   // pitch class → its place on the ring is FIFTHS.indexOf(pc)
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---- the core: no DOM, no audio — pure functions over plain arrays (the UI and the tests use it directly)
  const Field = {
    FIFTHS,
    rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
    /** one analyser frame (dB per bin) → bands 0..1, chroma (12, sums to 1 or all 0), and the rise since last frame */
    features(db, sr, fftSize, prev) {
      const hz = sr / fftSize, lin = new Float32Array(db.length), chroma = new Float32Array(12);
      let bass = 0, nb = 0, mid = 0, nm = 0, high = 0, nh = 0, flux = 0, tot = 0, cen = 0;
      const lo = Math.max(55, hz / 0.03);   // a note only counts where a bin is narrower than half a semitone (else it smears into its neighbours)
      for (let k = 1; k < db.length; k++) {
        const f = k * hz, a = db[k] > -140 ? Math.pow(10, db[k] / 20) : 0; lin[k] = a;
        if (prev) { const d = a - prev[k]; if (d > 0) flux += d; }
        if (f >= 30 && f < 150) { bass += a * a; nb++; } else if (f >= 150 && f < 2000) { mid += a * a; nm++; } else if (f >= 2000 && f < 12000) { high += a * a; nh++; }
        if (f >= lo && f < 4000) { const pc = ((Math.round(12 * Math.log2(f / 440)) % 12) + 12 + 9) % 12; chroma[pc] += a * a; }
        tot += a; cen += a * f;
      }
      const lvl = (s, n) => n ? clamp((10 * Math.log10(s + 1e-12) + 70) / 60, 0, 1) : 0;   // the band's summed power (one loud tone counts in full): −70 dB → 0, −10 dB → 1
      let cs = 0; for (let i = 0; i < 12; i++) cs += chroma[i]; if (cs > 1e-12) for (let i = 0; i < 12; i++) chroma[i] /= cs; else chroma.fill(0);
      return { bass: lvl(bass, nb), mid: lvl(mid, nm), high: lvl(high, nh), flux: flux / Math.max(1, db.length) * 1000, chroma, centroid: tot > 1e-9 ? cen / tot : 0, lin };
    },
    /** onset picker: a rise well above its own recent average. sensitivity 0..1 */
    onsets(sensitivity) {
      let mean = -1, dev = 0, lastT = -1;
      return (flux, t) => {
        if (mean < 0) { mean = flux; dev = flux * 0.5; }   // learn the level from the first frame: a sound that is already playing is not a hit
        const k = 3.2 - 2.6 * clamp(sensitivity(), 0, 1), hit = flux > mean + k * dev && flux > 0.02 && (lastT < 0 || t - lastT > 0.08);
        const s = hit ? clamp((flux - mean) / (mean + k * dev + 1e-6) - 1, 0, 3) / 3 + 0.25 : 0;
        mean += (flux - mean) * 0.08; dev += (Math.abs(flux - mean) - dev) * 0.08;
        if (hit) lastT = t; return hit ? clamp(s, 0, 1) : 0;
      };
    },
    /** the memory: 12 basins. Each note heard digs its basin; all of them fill back in with a half-life of `memory` s */
    landscape(depth) { return { depth: Float32Array.from(depth && depth.length === 12 ? depth : new Array(12).fill(0)), heard: 0 }; },
    deposit(L, chroma, dt, memory, learn, loud) {
      const fill = Math.pow(0.5, dt / Math.max(0.5, memory));
      for (let i = 0; i < 12; i++) L.depth[i] = clamp(L.depth[i] * fill + chroma[i] * dt * learn * loud * 0.25, 0, 1);
      if (loud > 0) L.heard += dt; return L;
    },
    /** the strongest basin (its pitch class), or -1 if the landscape is flat */
    deepest(L) { let b = -1, v = 0.02; for (let i = 0; i < 12; i++) if (L.depth[i] > v) { v = L.depth[i]; b = i; } return b; },
    basinXY(pc, R) { const a = Math.PI / 2 - FIFTHS.indexOf(pc) / 12 * Math.PI * 2;   // C at the top, G clockwise from it
      return [Math.cos(a) * R, Math.sin(a) * R]; },

    world(n, seed) {
      const N = clamp(Math.round(n), 100, 60000), r = Field.rng(seed || 1), B = 9;
      const w = { N, B, rnd: r, t: 0, px: new Float32Array(N), py: new Float32Array(N), pz: new Float32Array(N), vx: new Float32Array(N), vy: new Float32Array(N), vz: new Float32Array(N), sp: new Float32Array(N), pc: new Int8Array(N), bursts: [] };
      for (let i = 0; i < N; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * B * 0.85; w.px[i] = Math.cos(a) * d; w.py[i] = Math.sin(a) * d; w.pz[i] = (r() - 0.5) * 6; w.pc[i] = -1; }
      return w;
    },
    // value noise and its curl: a swirl with no sources or sinks, so it stirs without bunching
    _h(x, y) { const v = Math.sin(x * 157.31 + y * 271.93) * 41813.17; return v - Math.floor(v); },
    _n(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), H = Field._h;
      const a = H(ix, iy), b = H(ix + 1, iy), c = H(ix, iy + 1), d = H(ix + 1, iy + 1); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; },
    /** advance by dt seconds. drive: {bass, mid, high, chroma, pull? (gravity; defaults to bass)}, knobs: {gravity, curl, entropy, damping, speed, basins}, L: landscape */
    step(w, dt, drive, k, L) {
      const f = Math.min(dt, 0.05) * 60 * k.speed, t = (w.t += dt * 0.12), N = w.N, B = w.B, R = B * 0.55, wall = B * 0.8;
      const grav = (drive.pull != null ? drive.pull : drive.bass) * k.gravity * 0.009, curl = (0.25 + drive.mid) * k.curl * 0.012, ent = (0.1 + drive.high) * k.entropy * 0.02, keep = 1 - clamp(k.damping, 0, 0.9) * 0.6, e = 0.09, Nn = Field._n;
      const bas = []; if (L && k.basins > 0) for (let pc = 0; pc < 12; pc++) { const m = (L.depth[pc] * 0.7 + (drive.chroma ? drive.chroma[pc] : 0) * 0.5) * k.basins; if (m > 0.01) { const [x, y] = Field.basinXY(pc, R); bas.push({ pc, x, y, m }); } }
      for (let i = 0; i < N; i++) {
        let x = w.px[i], y = w.py[i], z = w.pz[i], vx = w.vx[i], vy = w.vy[i], vz = w.vz[i];
        if (!(x === x && y === y && z === z)) { x = y = z = vx = vy = vz = 0; }
        if (curl > 0) { const sx = x * 0.3 + t, sy = y * 0.3 - t * 0.7; vx += (Nn(sx, sy + e) - Nn(sx, sy - e)) / (2 * e) * curl * f; vy -= (Nn(sx + e, sy) - Nn(sx - e, sy)) / (2 * e) * curl * f; vz += (Nn(sy + z * 0.2, sx) - 0.5) * curl * 0.4 * f; }
        const d0 = Math.sqrt(x * x + y * y) + 0.3;
        if (grav > 0) { vx -= x / d0 * grav * f * (0.4 + d0 / B); vy -= y / d0 * grav * f * (0.4 + d0 / B); vz -= z * grav * 0.3 * f; }
        let best = -1, bd = 1e9;
        for (let j = 0; j < bas.length; j++) { const b = bas[j], dx = b.x - x, dy = b.y - y, d2 = dx * dx + dy * dy + 1.5, d = Math.sqrt(d2), g = b.m * 0.035 / d2; vx += dx / d * g * f; vy += dy / d * g * f; if (d2 < bd) { bd = d2; best = b.pc; } }
        w.pc[i] = bd < 9 ? best : -1;
        for (let j = 0; j < w.bursts.length; j++) { const s = w.bursts[j], dx = x - s.x, dy = y - s.y, d = Math.sqrt(dx * dx + dy * dy) + 0.05, o = Math.abs(d - s.front); if (o < 1.2) { const g = s.s * s.life * (1 - o / 1.2) * 0.06; vx += dx / d * g * f; vy += dy / d * g * f; vz += (w.rnd() - 0.5) * g * f; } }   // a ripple: only the dots the front is passing get kicked
        if (ent > 0) { vx += (w.rnd() - 0.5) * ent * f; vy += (w.rnd() - 0.5) * ent * f; vz += (w.rnd() - 0.5) * ent * 0.5 * f; }
        if (d0 > wall) { const p = (d0 - wall) * 0.012 * f; vx -= x / d0 * p; vy -= y / d0 * p; }
        if (Math.abs(z) > 4) vz -= Math.sign(z) * (Math.abs(z) - 4) * 0.01 * f;
        vx *= keep; vy *= keep; vz *= keep;
        const v = Math.sqrt(vx * vx + vy * vy + vz * vz); if (v > 0.25) { const c = 0.25 / v; vx *= c; vy *= c; vz *= c; }
        x += vx * f; y += vy * f; z += vz * f;
        const lim = B * 1.1, dd = Math.sqrt(x * x + y * y); if (dd > lim) { x *= lim / dd; y *= lim / dd; vx *= -0.3; vy *= -0.3; }
        w.px[i] = x; w.py[i] = y; w.pz[i] = clamp(z, -6, 6); w.vx[i] = vx; w.vy[i] = vy; w.vz[i] = vz; w.sp[i] = Math.min(1, v * 6);
      }
      w.bursts.forEach(s => { s.front += 0.35 * f; s.life *= Math.pow(0.95, f); }); w.bursts = w.bursts.filter(s => s.life > 0.02 && s.front < B * 2.2);
      return w;
    },
    /** an onset: a ring that spreads out from (x, y) — from near the deepest basin when there is one, else from the centre */
    burst(w, strength, x, y) { w.bursts.push({ x: x || 0, y: y || 0, s: strength, front: 0, life: 1 }); if (w.bursts.length > 12) w.bursts.shift(); },
    stats(w) { let r = 0, s = 0; for (let i = 0; i < w.N; i++) { r += Math.sqrt(w.px[i] * w.px[i] + w.py[i] * w.py[i]); s += w.sp[i]; } return { radius: r / w.N, speed: s / w.N }; },
  };
  window.EravosField = Field;

  OrganismFactory.define({
    id: 'eravos.particle-field', domain: 'music', version: '1.0.0', label: 'Field', icon: '✺', accent: '#7cf7ff', phase: 'P54',
    category: 'Visuals', blurb: 'A particle field that moves with the music — bass pulls it in, hits burst it out — and remembers the song’s key as basins.',
    size: { w: 620, h: 600 }, minSize: { w: 360, h: 380 },
    permissions: ['audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.visual'],
    needs: { notes: ['Live input is a tap: the sound you wire in keeps going where it went. Wire the master or any tool into it.'], works_with: ['eravos.mixer', 'eravos.master-fx', 'eravos.timeline'] },
    hooks: [Object.assign(S.audio_in('pf.hook.audio_in', 'in', true), { intent: 'sound that moves the field (tap — never reroutes)' })],
    config: [
      { key: 'count', type: 'integer', default: 6000, min: 500, max: 40000, step: 100, label: 'Particles', group: 'FIELD', hint: 'more is denser — and heavier on slow machines' },
      { key: 'speed', type: 'number', default: 1, min: 0.1, max: 3, step: 0.01, label: 'Speed', group: 'FIELD' },
      { key: 'damping', type: 'number', default: 0.12, min: 0, max: 0.9, step: 0.01, label: 'Damping', group: 'FIELD', hint: 'how fast motion dies: low floats, high snaps back' },
      { key: 'gravity', type: 'number', default: 1, min: 0, max: 3, step: 0.01, label: 'Bass gravity', group: 'FORCES', hint: 'how hard the low end pulls the field in' },
      { key: 'burst', type: 'number', default: 1, min: 0, max: 3, step: 0.01, label: 'Hit burst', group: 'FORCES', hint: 'how hard each hit pushes it out' },
      { key: 'curl', type: 'number', default: 0.6, min: 0, max: 3, step: 0.01, label: 'Swirl', group: 'FORCES', hint: 'the mids stir the field' },
      { key: 'entropy', type: 'number', default: 0.4, min: 0, max: 3, step: 0.01, label: 'Shimmer', group: 'FORCES', hint: 'the highs shake it' },
      { key: 'sensitivity', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Hit sense', group: 'FORCES', hint: 'how small a hit still bursts' },
      { key: 'basins', type: 'number', default: 1, min: 0, max: 3, step: 0.01, label: 'Basin pull', group: 'MEMORY', hint: 'how strongly the notes heard hold the field (circle of fifths)' },
      { key: 'memory', type: 'number', default: 60, min: 1, max: 3600, step: 1, unit: 's', label: 'Memory', group: 'MEMORY', hint: 'half-life of a basin: short follows the chord, long keeps the whole song' },
      { key: 'learn', type: 'number', default: 1, min: 0, max: 4, step: 0.01, label: 'Learn', group: 'MEMORY', hint: 'how fast notes dig their basins (0: frozen)' },
      { key: 'trail', type: 'number', default: 0.82, min: 0, max: 0.98, step: 0.01, label: 'Trails', group: 'LOOK' },
      { key: 'size', type: 'number', default: 1.6, min: 0.5, max: 6, step: 0.1, unit: 'px', label: 'Dot size', group: 'LOOK' },
      { key: 'spin', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01, label: 'Spin', group: 'LOOK', hint: 'the camera turns around the field' },
      { key: 'tilt', type: 'number', default: 0.35, min: 0, max: 1.4, step: 0.01, label: 'Tilt', group: 'LOOK' },
      { key: 'palette', type: 'enum', options: ['pitch', 'heat', 'ice', 'mono'], default: 'pitch', label: 'Colour', group: 'LOOK', hint: 'pitch: each dot takes the colour of the basin (note) it is nearest' },
      { key: 'renderer', type: 'enum', options: ['auto', 'webgl', '2d'], default: 'auto', label: 'Renderer', group: 'LOOK', hint: 'auto: WebGL2 when the browser has it' },
    ],
    ui_hooks: ['forget'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const inp = ac.createGain(); ctx.track(inp);
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, tap: true, label: 'listen' });
      const an = ac.createAnalyser(); an.fftSize = 8192; an.smoothingTimeConstant = 0.35; an.minDecibels = -140; an.maxDecibels = 0; inp.connect(an); ctx.track(an);
      const db = new Float32Array(an.frequencyBinCount);
      let L = Field.landscape(), prev = null, lastT = -1, bassAvg = 0;
      const pick = Field.onsets(() => P.get('sensitivity'));
      /** one frame in → the drive for the picture, and the memory updated. Exposed so tests can feed frames. */
      function frame(dbs, t, sr, size) {
        const F = Field.features(dbs, sr, size, prev); prev = F.lin;
        const dt = lastT < 0 ? 0.033 : clamp(t - lastT, 0, 0.5); lastT = t;
        const loud = Math.max(F.bass, F.mid, F.high) > 0.12 ? 1 : 0, hit = loud ? pick(F.flux, t) : 0;
        Field.deposit(L, F.chroma, dt, P.get('memory'), P.get('learn'), loud);
        // gravity follows the PULSE of the low end (above its own recent level) plus a little of the level itself:
        // a steady bass would otherwise hold the whole field squeezed into a strand
        const pull = clamp(F.bass * 0.3 + Math.max(0, F.bass - bassAvg) * 3, 0, 1); bassAvg += (F.bass - bassAvg) * Math.min(1, dt * 1.5);
        const d = { time: t, pull: +pull.toFixed(4), bass: F.bass, mid: F.mid, high: F.high, onset: hit * P.get('burst'), chroma: Array.from(F.chroma, v => +v.toFixed(4)), depth: Array.from(L.depth, v => +v.toFixed(4)), deepest: Field.deepest(L), centroid: Math.round(F.centroid) };
        ctx.emitUI('drive', d); return d;
      }
      ctx.frame = frame;
      ctx.interval(() => { an.getFloatFrequencyData(db); frame(db, ac.currentTime, ac.sampleRate, an.fftSize); }, 33);
      ctx.onUI('forget', null, () => { L = Field.landscape(); ctx.emitUI('drive', { time: ac.currentTime, bass: 0, mid: 0, high: 0, onset: 0, chroma: new Array(12).fill(0), depth: new Array(12).fill(0), deepest: -1, centroid: 0 }); });
      // the memory travels with the project: reopen it and the field still knows the song
      ctx.stateExtra = () => ({ depth: Array.from(L.depth, v => +v.toFixed(4)), heard: +L.heard.toFixed(1) });
      ctx.loadExtra = (x) => { if (x && Array.isArray(x.depth) && x.depth.length === 12) { L = Field.landscape(x.depth.map(v => clamp(+v || 0, 0, 1))); L.heard = +x.heard || 0; } };
      ctx.internals = { get landscape() { return L; }, an, inp };
      return {};
    },
  });
})();
