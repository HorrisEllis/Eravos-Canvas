/* eravos.drum-forge 1.0.0 — Drum Forge · spec eravos.organism.drum-forge
 * Design drum-pad sounds instead of picking them. 16 slots, each a synthesized one-shot built from one voice model
 * (kick, 808, snare, gated '84 snare, clap, closed / open hat, ride, crash, tom-syndrum, rim, FM perc with any —
 * often irrational — ratio, metal bar, zap, laser, riser, downlifter, impact, vinyl crackle) and the same handful
 * of shaping controls. A shared GATED room gives the 80s gated reverb per slot. Plays from notes 36–51 (and the
 * StarryPad through MIDI Map). Every voice is a pure function of (context, slot, time) so the same code renders
 * offline: one slot → WAV, or the whole kit → a ZIP of 16 WAVs for any sampler / pad controller, or straight onto
 * a Drum Machine pad / Sample Player. Kits: dancehall, roots one-drop, dubstep, riddim, synthwave '84, witch house,
 * industrial goth, xen percussion. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, dsp = OrganismSDK.dsp;
  const TYPES = ['kick', '808', 'snare', 'gated snare', 'clap', 'hat', 'open hat', 'ride', 'crash', 'tom', 'rim', 'fm perc', 'metal', 'zap', 'laser', 'riser', 'downlifter', 'impact', 'vinyl', 'shaker'];
  const D = { tune: 0, decay: 0.4, pitch: 0, ptime: 0.04, tone: 0.5, noise: 0.3, snap: 0.5, drive: 0, fm: 1.4142, fmi: 2, gate: 0, pan: 0, level: 0.9, choke: 0 };
  const slot = (type, name, o) => Object.assign({ type, name: name || type }, D, o || {});
  const KITS = {
    'Dancehall · Bun Dem': [slot('kick', 'kick', { decay: 0.32, pitch: 18, ptime: 0.03, snap: 0.7, drive: 0.35 }), slot('rim', 'rimshot', { tune: 3, decay: 0.07, snap: 0.9, level: 0.85 }), slot('snare', 'crack', { tune: 4, decay: 0.16, noise: 0.7, snap: 0.9, tone: 0.75 }), slot('hat', 'hat', { decay: 0.04, tone: 0.8 }),
      slot('open hat', 'open', { decay: 0.3, choke: 1 }), slot('tom', 'timbale hi', { tune: 14, decay: 0.18, pitch: 3, tone: 0.8 }), slot('tom', 'timbale lo', { tune: 7, decay: 0.22, pitch: 3, tone: 0.75 }), slot('clap', 'clap', { decay: 0.18, tone: 0.6 }),
      slot('808', 'boom', { tune: -5, decay: 1.2, pitch: 7, drive: 0.3 }), slot('fm perc', 'cow', { tune: 7, fm: 2.4, fmi: 1.2, decay: 0.2 }), slot('shaker', 'shaker', { decay: 0.09 }), slot('zap', 'gunshot zap', { decay: 0.25, pitch: 36 }),
      slot('impact', 'bomb', { decay: 1.6, tune: -7 }), slot('laser', 'laser', { decay: 0.4 }), slot('riser', 'rise', { decay: 2 }), slot('vinyl', 'vinyl', { decay: 1.5, level: 0.5 })],
    'Roots · One Drop': [slot('kick', 'kick', { decay: 0.45, pitch: 9, ptime: 0.05, tone: 0.3, snap: 0.3 }), slot('rim', 'cross-stick', { tune: -2, decay: 0.06, snap: 0.6, tone: 0.45 }), slot('snare', 'snare', { tune: -2, decay: 0.24, noise: 0.5, snap: 0.4, tone: 0.45 }), slot('hat', 'hat', { decay: 0.05, tone: 0.6, level: 0.75 }),
      slot('open hat', 'open', { decay: 0.35, choke: 1, tone: 0.6 }), slot('tom', 'tom hi', { tune: 5, decay: 0.3, pitch: 2 }), slot('tom', 'tom lo', { tune: -4, decay: 0.38, pitch: 2 }), slot('shaker', 'shaker', { decay: 0.11, level: 0.7 }),
      slot('ride', 'ride', { decay: 1.4, level: 0.6 }), slot('fm perc', 'bell', { tune: 12, fm: 3.5, fmi: 1.5, decay: 0.5 }), slot('snare', 'rimshot snare', { tune: 3, decay: 0.12, noise: 0.4, snap: 0.9 }), slot('clap', 'clap', { decay: 0.2 }),
      slot('808', 'sub', { tune: -7, decay: 1, pitch: 2 }), slot('crash', 'crash', { decay: 2.4, level: 0.6 }), slot('vinyl', 'dust', { decay: 2, level: 0.4 }), slot('tom', 'syndrum', { tune: 9, pitch: 12, ptime: 0.2, decay: 0.5 })],
    'Dubstep · Heavy': [slot('kick', 'kick', { decay: 0.5, pitch: 24, ptime: 0.035, snap: 0.8, drive: 0.55 }), slot('snare', 'snare', { tune: -3, decay: 0.38, noise: 0.75, snap: 0.8, tone: 0.55, drive: 0.35, gate: 0.25 }), slot('clap', 'clap', { decay: 0.3, gate: 0.2 }), slot('hat', 'hat', { decay: 0.035, tone: 0.85 }),
      slot('open hat', 'open', { decay: 0.4, choke: 1 }), slot('808', '808', { tune: -2, decay: 1.8, pitch: 9, drive: 0.45 }), slot('impact', 'impact', { decay: 2.2, drive: 0.4 }), slot('laser', 'laser', { decay: 0.35 }),
      slot('crash', 'crash', { decay: 2.8 }), slot('zap', 'zap', { decay: 0.2, pitch: 48 }), slot('riser', 'riser 4 bars', { decay: 7 }), slot('downlifter', 'downlifter', { decay: 2 }),
      slot('snare', 'snare 2', { tune: 5, decay: 0.16, noise: 0.85, snap: 1 }), slot('metal', 'metal', { tune: -5, decay: 0.6, drive: 0.4 }), slot('kick', 'sub kick', { tune: -5, decay: 0.9, pitch: 12 }), slot('vinyl', 'crackle', { decay: 1.5, level: 0.5 })],
    'Riddim · Stripped': [slot('kick', 'kick', { decay: 0.35, pitch: 20, snap: 0.9, drive: 0.6 }), slot('snare', 'snare', { decay: 0.2, noise: 0.85, snap: 1, tone: 0.65, drive: 0.5 }), slot('hat', 'hat', { decay: 0.025, tone: 0.95 }), slot('metal', 'clank', { tune: 2, decay: 0.25, drive: 0.6 }),
      slot('open hat', 'open', { decay: 0.22, choke: 1 }), slot('zap', 'zap', { decay: 0.12, pitch: 30 }), slot('clap', 'clap', { decay: 0.12 }), slot('rim', 'rim', { decay: 0.05 }),
      slot('impact', 'impact', { decay: 1.2 }), slot('fm perc', 'blip', { fm: 7.03, fmi: 3, decay: 0.08, tune: 12 }), slot('laser', 'laser', { decay: 0.2 }), slot('808', '808', { decay: 0.9, pitch: 5, drive: 0.6 }),
      slot('shaker', 'shaker', { decay: 0.06 }), slot('crash', 'crash', { decay: 1.6 }), slot('riser', 'riser', { decay: 3.5 }), slot('downlifter', 'down', { decay: 1.5 })],
    "Synthwave '84": [slot('kick', 'kick', { decay: 0.4, pitch: 14, snap: 0.5, tone: 0.4 }), slot('gated snare', 'gated snare', { decay: 0.3, noise: 0.6, gate: 0.8, tone: 0.5 }), slot('clap', 'clap', { decay: 0.22, gate: 0.6 }), slot('hat', 'hat', { decay: 0.05, tone: 0.7 }),
      slot('open hat', 'open', { decay: 0.32, choke: 1 }), slot('tom', 'syndrum hi', { tune: 12, pitch: 14, ptime: 0.18, decay: 0.45, gate: 0.4 }), slot('tom', 'syndrum lo', { tune: 3, pitch: 14, ptime: 0.2, decay: 0.55, gate: 0.4 }), slot('tom', 'tom', { tune: -3, pitch: 5, decay: 0.5, gate: 0.5 }),
      slot('ride', 'ride', { decay: 1.6 }), slot('crash', 'crash', { decay: 2.4 }), slot('fm perc', 'DX bell', { tune: 24, fm: 3.5, fmi: 2.5, decay: 0.7 }), slot('shaker', 'tamb', { decay: 0.14, tone: 0.9 }),
      slot('gated snare', 'big gate', { tune: -3, decay: 0.45, noise: 0.7, gate: 1 }), slot('laser', 'laser', { decay: 0.5 }), slot('808', 'bass drum', { decay: 0.7, pitch: 4 }), slot('rim', 'rim', { decay: 0.06, gate: 0.4 })],
    'Witch House': [slot('808', '808 slow', { tune: -5, decay: 2.6, pitch: 3, drive: 0.25 }), slot('snare', 'snare', { tune: -6, decay: 0.42, noise: 0.6, snap: 0.3, tone: 0.35, gate: 0.4 }), slot('clap', 'clap', { decay: 0.45, gate: 0.6, tone: 0.4 }), slot('hat', 'hat', { decay: 0.03, tone: 0.9, level: 0.7 }),
      slot('open hat', 'open', { decay: 0.5, choke: 1, level: 0.7 }), slot('metal', 'chain', { tune: -12, decay: 0.9, drive: 0.2 }), slot('fm perc', 'ritual bell', { tune: 5, fm: 1.618, fmi: 3, decay: 2.2 }), slot('impact', 'dread', { tune: -12, decay: 2.5 }),
      slot('vinyl', 'tape dust', { decay: 3, level: 0.5 }), slot('downlifter', 'fall', { decay: 3 }), slot('kick', 'kick', { decay: 0.6, pitch: 8, tone: 0.25 }), slot('rim', 'tick', { decay: 0.04, tune: 7 }),
      slot('laser', 'ghost laser', { decay: 1, tune: -12 }), slot('crash', 'reverse-ish crash', { decay: 3 }), slot('shaker', 'hiss', { decay: 0.3, tone: 0.3 }), slot('zap', 'bite', { pitch: 18, decay: 0.3 })],
    'Industrial Goth': [slot('kick', 'hammer', { decay: 0.4, pitch: 22, drive: 0.85, snap: 1 }), slot('metal', 'anvil', { tune: 0, decay: 0.8, drive: 0.5 }), slot('snare', 'pipe snare', { decay: 0.3, noise: 0.5, snap: 0.9, drive: 0.7, gate: 0.3 }), slot('metal', 'sheet', { tune: -9, decay: 1.6 }),
      slot('hat', 'grind hat', { decay: 0.06, drive: 0.8 }), slot('impact', 'collapse', { decay: 2.4, drive: 0.6 }), slot('fm perc', 'iron', { fm: 3.14159, fmi: 4, decay: 0.6 }), slot('clap', 'slam', { decay: 0.25, drive: 0.6 }),
      slot('tom', 'oil drum', { tune: -7, pitch: 4, decay: 0.6, drive: 0.4 }), slot('zap', 'spark', { pitch: 40, decay: 0.15 }), slot('vinyl', 'static', { decay: 2 }), slot('808', 'pressure', { tune: -9, decay: 1.6, drive: 0.7 }),
      slot('metal', 'bell tower', { tune: 7, decay: 3 }), slot('laser', 'cutter', { decay: 0.6 }), slot('crash', 'scrap', { decay: 1.8, drive: 0.5 }), slot('downlifter', 'sink', { decay: 2 })],
    'Xen Percussion (φ, π, √2)': [slot('fm perc', 'φ drum', { fm: 1.618, fmi: 2.5, decay: 0.5, pitch: 7 }), slot('fm perc', 'π block', { fm: 3.14159, fmi: 1.5, decay: 0.15, tune: 12 }), slot('fm perc', '√2 bell', { fm: 1.41421, fmi: 3, decay: 1.4, tune: 19 }), slot('metal', 'bar', { tune: 5, decay: 1 }),
      slot('fm perc', 'e gong', { fm: 2.71828, fmi: 4, decay: 2.5, tune: -12 }), slot('fm perc', 'silver', { fm: 2.41421, fmi: 2, decay: 0.6, tune: 7 }), slot('fm perc', 'plastic', { fm: 1.32472, fmi: 5, decay: 0.3 }), slot('tom', 'membrane', { tune: 3, pitch: 5, decay: 0.45 }),
      slot('kick', 'kick', { decay: 0.4, pitch: 14 }), slot('hat', 'hat', { decay: 0.04 }), slot('fm perc', 'φ² chime', { fm: 2.618, fmi: 1.2, decay: 2, tune: 24 }), slot('metal', 'bar low', { tune: -12, decay: 1.6 }),
      slot('rim', 'rim', { decay: 0.05 }), slot('fm perc', 'bronze', { fm: 3.30278, fmi: 3, decay: 1, tune: 0 }), slot('shaker', 'shaker', { decay: 0.08 }), slot('fm perc', '√3 tick', { fm: 1.73205, fmi: 6, decay: 0.05, tune: 31 })],
  };
  // ---- the voices (pure: any context — live or offline)
  function voice(A, s, t, vel, dst, noiseBuf, gateIn) {
    const nodes = [], g = A.createGain(), pan = A.createStereoPanner(); pan.pan.value = s.pan; g.connect(pan); pan.connect(dst); nodes.push(g, pan);
    let tail = g;
    if (s.drive > 0) { const sh = A.createWaveShaper(); sh.curve = dsp.curve('tube', s.drive); sh.oversample = '2x'; const pre = A.createGain(); pre.gain.value = 1 + s.drive * 3; pre.connect(sh); sh.connect(g); tail = pre; nodes.push(sh, pre); }
    if (s.gate > 0 && gateIn) { const sg = A.createGain(); sg.gain.value = s.gate; g.connect(sg); sg.connect(gateIn); nodes.push(sg); }
    const R = Math.pow(2, s.tune / 12), L = s.level * (0.35 + 0.65 * vel), dec = Math.max(0.01, s.decay);
    const osc = (type, f, to) => { const o = A.createOscillator(); o.type = type; o.frequency.value = f; o.connect(to || tail); o.start(t); o.stop(t + dec * 3 + 0.3); nodes.push(o); return o; };
    const amp = (to, peak, d, att) => { const e = A.createGain(); e.connect(to || tail); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(peak, t + (att || 0.0015)); e.gain.exponentialRampToValueAtTime(0.0001, t + (att || 0.0015) + d); nodes.push(e); return e; };
    const noise = (to, d, peak) => { const n = A.createBufferSource(); n.buffer = noiseBuf; n.loop = true; const e = amp(to, peak, d); n.connect(e); n.start(t, Math.random() * 1.5); n.stop(t + d + 0.1); nodes.push(n); return n; };
    const filt = (type, f, q, to) => { const b = A.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; b.connect(to || tail); nodes.push(b); return b; };
    const sweep = (p, f0, f1, d) => { p.setValueAtTime(f0, t); p.exponentialRampToValueAtTime(Math.max(1, f1), t + d); };
    switch (s.type) {
      case 'kick': case '808': {
        const f = (s.type === '808' ? 49 : 52) * R, o = osc('sine', f, amp(null, L, s.type === '808' ? dec * 1.1 : dec));
        sweep(o.frequency, f * Math.pow(2, (s.pitch || 0) / 12), f, Math.max(0.005, s.ptime));
        if (s.snap > 0) { const c = osc('triangle', f * 8, amp(null, L * 0.4 * s.snap, 0.012)); sweep(c.frequency, f * 14, f * 3, 0.012); }
        if (s.tone > 0.4) noise(filt('bandpass', 3500, 1), 0.006, L * (s.tone - 0.4));
        break;
      }
      case 'snare': case 'gated snare': {
        const f = 185 * R; [1, 1.62].forEach((k, i) => { const o = osc('triangle', f * k, amp(null, L * (0.45 - s.noise * 0.2) / (i + 1), dec * 0.45)); sweep(o.frequency, f * k * 1.5, f * k, 0.03); });
        noise(filt('highpass', 900 + s.tone * 3000, 0.7), s.type === 'gated snare' ? dec * 0.7 : dec, L * (0.3 + s.noise * 0.6));
        if (s.snap > 0) noise(filt('bandpass', 5500, 1.2), 0.02, L * 0.5 * s.snap);
        break;
      }
      case 'clap': { const bp = filt('bandpass', 1100 + s.tone * 1400, 1.3); [0, 0.011, 0.022, 0.036].forEach((d, i) => { const n = A.createBufferSource(); n.buffer = noiseBuf; const e = A.createGain(); n.connect(e); e.connect(bp); const tt = t + d, dd = i === 3 ? dec : 0.012; e.gain.setValueAtTime(0, tt); e.gain.linearRampToValueAtTime(L * 1.3, tt + 0.001); e.gain.exponentialRampToValueAtTime(0.0001, tt + dd); n.start(tt, Math.random()); n.stop(tt + dd + 0.05); nodes.push(n, e); }); break; }
      case 'hat': case 'open hat': case 'ride': case 'crash': {
        const metal = [205.3, 304.4, 369.6, 522.7, 540, 800], hp = filt('highpass', s.type === 'ride' ? 5000 : 7000 + s.tone * 2500, 0.8), e = amp(hp, L * (s.type === 'crash' ? 0.5 : 0.45), dec);
        const bp = filt('bandpass', 10000, 0.8, e); metal.forEach(m => osc('square', m * R * (s.type === 'ride' ? 1.4 : 1.7), bp));
        if (s.type === 'crash' || s.type === 'ride') noise(filt('highpass', 4000, 0.5), dec * 0.8, L * 0.25);
        break;
      }
      case 'tom': { const f = 110 * R, o = osc('sine', f, amp(null, L, dec)); sweep(o.frequency, f * Math.pow(2, (s.pitch || 3) / 12), f, Math.max(0.01, s.ptime * 2)); noise(filt('lowpass', 1500 + s.tone * 3000, 0.5), 0.03, L * 0.3 * s.tone); break; }
      case 'rim': { const f = 480 * R; osc('triangle', f, amp(filt('bandpass', f * 2, 3), L * 1.2, dec)); osc('square', f * 2.28, amp(filt('highpass', 2000, 1), L * 0.25 * (0.5 + s.snap), dec * 0.6)); break; }
      case 'fm perc': { const f = 220 * R, mod = A.createOscillator(), mg = A.createGain(), car = osc('sine', f, amp(null, L, dec)); mod.frequency.value = f * s.fm; mg.gain.setValueAtTime(f * s.fmi * 2, t); mg.gain.exponentialRampToValueAtTime(f * 0.01 + 0.001, t + dec * 0.8); mod.connect(mg); mg.connect(car.frequency); mod.start(t); mod.stop(t + dec * 3 + 0.3); nodes.push(mod, mg); if (s.pitch) sweep(car.frequency, f * Math.pow(2, s.pitch / 12), f, 0.04); break; }
      case 'metal': { const f = 180 * R; [1, 2.756, 5.404, 8.933, 1.41, 3.6].forEach((k, i) => osc('sine', f * k, amp(null, L * 0.3 / (1 + i * 0.4), dec / (1 + i * 0.35)))); noise(filt('bandpass', f * 9, 4), 0.02, L * 0.4); break; }
      case 'zap': { const o = osc('sawtooth', 100, amp(filt('lowpass', 6000, 2), L * 0.6, dec)); sweep(o.frequency, 100 * R * Math.pow(2, (s.pitch || 36) / 12), 60 * R, dec * 0.9); break; }
      case 'laser': { const o = osc('square', 2400 * R, amp(filt('bandpass', 1800, 4), L * 0.7, dec)); const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = 28; lg.gain.value = 600; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dec * 3 + 0.3); sweep(o.frequency, 2400 * R, 200 * R, dec); nodes.push(l, lg); break; }
      case 'riser': { const e = A.createGain(); e.connect(tail); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(L * 0.6, t + dec); e.gain.linearRampToValueAtTime(0, t + dec + 0.05); nodes.push(e); const bp = filt('bandpass', 300, 3, e); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dec); const n = A.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.connect(bp); n.start(t); n.stop(t + dec + 0.1); nodes.push(n); const o = osc('sawtooth', 110 * R, bp); sweep(o.frequency, 110 * R, 880 * R, dec); break; }
      case 'downlifter': { const bp = filt('bandpass', 9000, 2, amp(null, L * 0.7, dec)); bp.frequency.setValueAtTime(9000, t); bp.frequency.exponentialRampToValueAtTime(150, t + dec); const n = A.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.connect(bp); n.start(t); n.stop(t + dec + 0.1); nodes.push(n); break; }
      case 'impact': { const f = 44 * R, o = osc('sine', f, amp(null, L, dec)); sweep(o.frequency, f * 4, f * 0.7, dec * 0.6); noise(filt('lowpass', 2400, 0.5), dec * 0.5, L * 0.6); noise(filt('highpass', 3000, 0.5), 0.08, L * 0.5); break; }
      case 'vinyl': { const hp = filt('highpass', 1500, 0.5), e = amp(hp, L * 0.12, dec, 0.02); const n = A.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.connect(e); n.start(t); n.stop(t + dec + 0.1); nodes.push(n); const r = dsp.mulberry32(Math.floor(t * 1000)); for (let i = 0; i < dec * 18; i++) { const tt = t + r() * dec; const c = A.createBufferSource(); c.buffer = noiseBuf; const ce = A.createGain(); ce.gain.setValueAtTime(L * (0.2 + r() * 0.6), tt); ce.gain.exponentialRampToValueAtTime(0.0001, tt + 0.002); c.connect(ce); ce.connect(hp); c.start(tt, r()); c.stop(tt + 0.004); nodes.push(c, ce); } break; }
      case 'shaker': default: noise(filt('bandpass', 6000 + s.tone * 3000, 1.5), dec, L * 0.6); noise(filt('highpass', 9000, 0.7), dec * 0.5, L * 0.25); break;
    }
    // 3.37 (QA RCA: cleanup hung on the LAST-CREATED source — in an impact that is a 0.18 s noise burst, so the whole hit
    // was disconnected at 0.28 s mid-sound): tear down only when EVERY source has ended
    const srcs = nodes.filter(n => n.stop); let left = srcs.length;
    srcs.forEach(n => { const prev = n.onended; n.onended = (e) => { if (prev) try { prev(e); } catch (x) {} if (--left === 0) nodes.forEach(m => { try { m.disconnect(); } catch (x) {} }); }; });
    return { gain: g, end: t + dec * 3 + 0.3 };
  }
  function makeGate(A) { // gated room: short dense IR, gain gate opened by each hit
    const conv = A.createConvolver(), n = Math.floor(A.sampleRate * 0.9), b = A.createBuffer(2, n, A.sampleRate), r = dsp.mulberry32(1984);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, 1.2); }
    conv.buffer = b; const inG = A.createGain(), gate = A.createGain(), hp = A.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300; gate.gain.value = 0;
    inG.connect(conv); conv.connect(hp); hp.connect(gate);
    return { inG, gate, open(t, amount) { gate.gain.cancelScheduledValues(t); gate.gain.setValueAtTime(Math.max(gate.gain.value, 0), t); gate.gain.linearRampToValueAtTime(0.9 * Math.min(1, amount), t + 0.004); gate.gain.setValueAtTime(0.9 * Math.min(1, amount), t + 0.2); gate.gain.linearRampToValueAtTime(0, t + 0.23); } };
  }
  OrganismFactory.define({
    id: 'eravos.drum-forge', preview: 'hit', domain: 'music', version: '1.0.0', label: 'Drum Forge', icon: '⚒', accent: '#ff7b00', phase: 'P14',
    category: 'Sound Forge', blurb: 'Design your own drum-pad sounds: 16 synthesized one-shots, gated 80s room, genre kits — render a WAV or the whole kit for your pads.',
    size: { w: 600, h: 620 }, minSize: { w: 460, h: 460 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe', 'filesystem_write', 'registry_read'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.pad_trigger'],
    needs: { notes: ['Pads 1–16 = notes 36–51; the StarryPad plays it through MIDI Map.'], works_with: ['eravos.sequencer', 'eravos.midi-mapper', 'eravos.pads', 'eravos.dub-station'] },
    hooks: [S.audio_out('df.hook.audio_out'), S.note_in('df.hook.note_in'), S.midi_in('df.hook.midi_in'), S.asset_out('df.hook.asset_out'),
      S.event('df.hook.pad_trigger_out', 'out', 'pad:trigger', { type: 'object', required: ['index'] }, '1.0.0'),
      Object.assign(S.event('df.hook.bank_out', 'out', 'pad:bank-change', { type: 'object', required: ['pads'] }, '1.0.0'), { rail: false })],
    config: [
      { key: 'kit', type: 'enum', options: Object.keys(KITS), default: 'Dancehall · Bun Dem', label: 'Kit', group: 'KIT' },
      { key: 'sel', type: 'integer', default: 0, min: 0, max: 15, label: 'Slot', group: 'KIT' },
      { key: 'room', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Gated room', group: 'KIT' },
      { key: 'volume', type: 'number', default: 0.9, min: 0, max: 1.5, step: 0.01, label: 'Volume', group: 'KIT' },
      { key: 'sendTo', type: 'string', default: '', label: 'Send to', group: 'KIT', hidden: true },
    ],
    ui_hooks: ['hit', 'slot_edit', 'render', 'render_kit', 'send', 'preview'],
    ui_hook_labels: { slot_edit: 'edit drum sound' },
    defaultPreset: 'Dancehall · Bun Dem',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, K = ctx.K;
      let slots = KITS[P.get('kit')].map(s => Object.assign({}, s));
      const noiseBuf = dsp.noise(ac, 2, 'white');
      const mix = ac.createGain(); mix.gain.value = P.get('volume'); ctx.track(mix);
      const gate = makeGate(ac); gate.gate.connect(mix); [gate.inG, gate.gate].forEach(n => ctx.track(n));
      ctx.port('out', { kind: 'audio', direction: 'out', node: mix, label: 'drums' });
      P.onChange('volume', (v) => ctx.dsp.setSmooth(mix.gain, v, ac));
      P.onChange('room', () => {});
      P.onChange('kit', (k) => { if (KITS[k] && !loadingPreset) { slots = KITS[k].map(s => Object.assign({}, s)); ctx.syncUI(); } });
      let loadingPreset = false;
      const choking = new Map(); // group → [gain]
      function hit(i, vel, t, source) {
        const s = slots[i]; if (!s) return;
        t = Math.max(t || ac.currentTime, ac.currentTime);
        if (s.choke) { (choking.get(s.choke) || []).forEach(g => { try { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.006); } catch (e) {} }); choking.set(s.choke, []); }
        // 3.39: a driven slot's voice passes a 2x shaper (128 samples late) → it starts that much early and lands on the beat
        const tv = s.drive > 0 ? Math.max(ac.currentTime, t - ctx.dsp.osLatency(ac, '2x')) : t;
        const v = voice(ac, Object.assign({}, s, { gate: s.gate * P.get('room') }), tv, vel, mix, noiseBuf, gate.inG);
        if (s.gate > 0 && P.get('room') > 0) gate.open(t, s.gate * P.get('room'));
        if (s.choke) choking.get(s.choke).push(v.gain);
        // open hats are choked by closed hats in the same group (hat → group of the next open hat)
        if (s.type === 'hat') slots.forEach((o, j) => { if (o.type === 'open hat' && o.choke) (choking.get(o.choke) || []).forEach(g => { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.006); }); });
        ctx.emit('pad:trigger', { index: i, sound: s.type, velocity: vel, bank: 0, time: t, source: source || 'note' });
        ctx.emitUI('hit', { i, vel });
      }
      ctx.hit = hit;
      ctx.onNote((p) => { const i = p.note - 36; if (i >= 0 && i < 16) hit(i, p.velocity, p.time, 'note'); });
      ctx.onMidi((p) => { if (p.on && p.note >= 36 && p.note <= 51) hit(p.note - 36, p.velocity, ac.currentTime, 'midi'); });
      ctx.onUI('hit', { type: 'object', required: ['i'] }, (p) => { P.set('sel', p.i); hit(p.i, p.vel === undefined ? 0.9 : p.vel, ac.currentTime, 'ui'); });
      ctx.audition = (p) => hit(P.get('sel'), p.velocity || 0.9, ac.currentTime, 'ui');
      ctx.onUI('slot_edit', { type: 'object', required: ['i', 'patch'] }, (p) => {
        const s = slots[p.i]; if (!s) return;
        Object.keys(p.patch).forEach(k => { if (k === 'type' && TYPES.includes(p.patch[k])) s.type = p.patch[k]; else if (k === 'name') s.name = String(p.patch[k]).slice(0, 24); else if (k in D && typeof p.patch[k] === 'number' && Number.isFinite(p.patch[k])) s[k] = p.patch[k]; });
        ctx.syncUI(); if (p.audition) hit(p.i, 0.9, ac.currentTime, 'ui');
      });
      // ---- offline render (same voices)
      async function render(i) {
        const s = slots[i], len = Math.min(10, s.decay * 3 + (s.gate ? 0.5 : 0.3)), A = new OfflineAudioContext(2, Math.ceil(ac.sampleRate * len), ac.sampleRate);
        const m = A.createGain(); m.connect(A.destination); const g = makeGate(A); g.gate.connect(m);
        const nb = A.createBuffer(1, noiseBuf.length, noiseBuf.sampleRate); nb.copyToChannel(noiseBuf.getChannelData(0), 0);
        voice(A, Object.assign({}, s, { gate: s.gate * P.get('room') }), 0.005, 1, m, nb, g.inG); if (s.gate > 0) g.open(0.005, s.gate * P.get('room'));
        const b = await A.startRendering();
        let pk = 0; for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let k = 0; k < d.length; k++) pk = Math.max(pk, Math.abs(d[k])); }
        if (pk > 0.98) for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let k = 0; k < d.length; k++) d[k] *= 0.98 / pk; } // no clipped one-shots
        return b;
      }
      ctx.render = render;
      const fileName = (i) => `${String(i + 1).padStart(2, '0')} ${slots[i].name}`.replace(/[\\/:*?"<>|]+/g, '_');
      ctx.onUI('render', { type: 'object', required: ['i'] }, async (p) => { const b = await render(p.i); ctx.emitUI('file', { name: fileName(p.i) + '.wav', data: window.Codecs.wav(b, 24) }); });
      ctx.onUI('preview', { type: 'object', required: ['i'] }, async (p) => { const b = await render(p.i); ctx.emitUI('preview', { i: p.i, peaks: dsp.peaks(b, 400), dur: b.duration }); });
      ctx.onUI('render_kit', null, async () => { const files = []; for (let i = 0; i < 16; i++) files.push({ name: fileName(i) + '.wav', data: new Uint8Array(window.Codecs.wav(await render(i), 24)) }); ctx.emitUI('zip', { name: `${P.get('kit')} (Drum Forge).zip`.replace(/[\\/:*?"<>|·']+/g, '_'), blob: window.Codecs.zip(files) }); });
      ctx.onUI('send', { type: 'object', required: ['i', 'target'] }, async (p) => {
        const b = await render(p.i); const asset = K.audio.putBuffer(b, { name: slots[p.i].name + '.wav', lineage: [{ operation: 'drum-forge', source: slots[p.i].type, params: slots[p.i] }] });
        ctx.emit('asset:ready', { hash: asset.hash, name: slots[p.i].name, duration: b.duration, target: p.target, slot: p.slot });
      });
      ctx.saveExtra = () => ({ slots: slots.map(s => Object.assign({}, s)) });
      ctx.loadExtra = (x, o) => { if (x && Array.isArray(x.slots) && x.slots.length === 16) { slots = x.slots.map(s => Object.assign({}, D, s)); ctx.syncUI(); } };
      const load0 = ctx.presets.load; ctx.presets.load = (n) => { loadingPreset = true; try { return load0(n); } finally { loadingPreset = false; } };
      // P11 gate D: announce the pads by name, so a Timeline track playing this kit shows kick / snare / … rows
      let announced = '';
      const announce = (force) => { const pads = slots.map((s, i) => ({ note: 36 + i, name: s.name, sound: s.type })); const k = JSON.stringify(pads); if (!force && k === announced) return; announced = k; ctx.emit('pad:bank-change', { bank: 0, pads }); };
      ctx.timeout(() => announce(true), 0); ctx.on('kernel:organism-mounted', null, () => announce(true));
      ctx.stateExtra = () => { announce(false); return { slots, types: TYPES }; };
      ctx.internals = { get slots() { return slots; }, voice, KITS };
      return {};
    },
  });
})();
