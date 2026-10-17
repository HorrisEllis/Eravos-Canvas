/* eravos.pad-forge 1.1.0 — Pad Forge · spec eravos.organism.pad-forge
 * Make pad sounds. Vector synthesis: four different sources sit on the corners of a square (swarm, glass, air, choir,
 * organ, strings, halo); a point inside the square mixes them, and that point ORBITS (circle, figure-8, drift) so the pad
 * keeps changing while you hold the chord. Bloom opens the filter over seconds; Hold latches chords; the shimmer space
 * is a long generated reverb whose tail is pitched up an octave and fed back — halos that build on themselves.
 * 1.1 (sound fix, measured): a 4-note chord drove the Warmth shaper to 0.5–3.4× full scale, so 17 of 30 presets hard-clipped
 * (buzz); the sources now mix in with headroom (−10 dB) and Warmth is the 'tape' curve (unity on quiet signal, rounds
 * only the peaks; 0 = clean). Width was L/R ± (11 ms − 17 ms delays) — a comb filter that made every pad hollow and
 * phasey; now each corner source has its own place in the stereo field (the pad moves as it orbits) plus a gentle stereo chorus. */
(function () {
  'use strict';
  const IR_CACHE = new WeakMap(); // AudioContext → Map(size → AudioBuffer)
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const SOURCES = ['swarm', 'glass', 'air', 'choir', 'organ', 'strings', 'halo'];
  const ORBITS = ['still', 'circle', 'figure-8', 'drift'];
  OrganismFactory.define({
    id: 'eravos.pad-forge', preview: 'chord', domain: 'music', version: '1.1.0', label: 'Pad Forge', icon: '☁', accent: '#8fd3ff', phase: 'P14',
    category: 'Sound sources', blurb: 'Make pads: blend four sources on an XY square that drifts by itself, blooming filter, chord hold, shimmer halos.',
    size: { w: 560, h: 640 }, minSize: { w: 440, h: 480 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.pad'],
    needs: { works_with: ['eravos.timeline', 'eravos.sequencer', 'eravos.fx-moddelay', 'eravos.sub-engine'] },
    hooks: [S.audio_out('pad.hook.audio_out'), S.note_in('pad.hook.note_in'), S.midi_in('pad.hook.midi_in'), S.theory_in('pad.hook.theory_in'),
      S.mod_in('pad.hook.mod_x', 'x'), S.mod_in('pad.hook.mod_y', 'y'), S.mod_in('pad.hook.mod_cutoff', 'cutoff')],
    config: [
      { key: 'cornerA', type: 'enum', options: SOURCES, default: 'swarm', label: '↖ A', group: 'CORNERS' },
      { key: 'cornerB', type: 'enum', options: SOURCES, default: 'glass', label: '↗ B', group: 'CORNERS' },
      { key: 'cornerC', type: 'enum', options: SOURCES, default: 'choir', label: '↙ C', group: 'CORNERS' },
      { key: 'cornerD', type: 'enum', options: SOURCES, default: 'air', label: '↘ D', group: 'CORNERS' },
      { key: 'x', type: 'number', default: 0.4, min: 0, max: 1, step: 0.001, label: 'X', group: 'VECTOR' },
      { key: 'y', type: 'number', default: 0.4, min: 0, max: 1, step: 0.001, label: 'Y', group: 'VECTOR' },
      { key: 'orbit', type: 'enum', options: ORBITS, default: 'circle', label: 'Orbit', group: 'VECTOR' },
      { key: 'orbitRate', type: 'number', default: 0.06, min: 0.002, max: 8, step: 0.001, unit: 'Hz', label: 'Orbit rate', group: 'VECTOR' },
      { key: 'orbitSize', type: 'number', default: 0.3, min: 0, max: 0.5, step: 0.001, label: 'Orbit size', group: 'VECTOR' },
      { key: 'cutoff', type: 'number', default: 3200, min: 120, max: 16000, step: 1, unit: 'Hz', label: 'Cutoff', group: 'TONE' },
      { key: 'bloom', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Bloom', group: 'TONE', hint: 'filter opens over a few seconds after each chord' },
      { key: 'warmth', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Warmth', group: 'TONE' },
      { key: 'width', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Width', group: 'TONE' },
      { key: 'attack', type: 'number', default: 1.2, min: 0.005, max: 10, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'release', type: 'number', default: 3, min: 0.05, max: 16, step: 0.01, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'hold', type: 'boolean', default: false, label: 'Hold', group: 'ENV', hint: 'chords ring until the next chord' },
      { key: 'space', type: 'number', default: 0.45, min: 0, max: 1, step: 0.01, label: 'Space', group: 'SHIMMER' },
      { key: 'shimmer', type: 'number', default: 0.35, min: 0, max: 0.85, step: 0.01, label: 'Shimmer', group: 'SHIMMER', hint: 'octave-up feedback in the tail' },
      { key: 'size', type: 'number', default: 6, min: 1, max: 14, step: 0.1, unit: 's', label: 'Size', group: 'SHIMMER' },
      { key: 'level', type: 'number', default: 0.7, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    defaultPreset: 'Her Essence',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      // each corner has its own place in the stereo field (A left · B right · C left-centre · D right-centre)
      const PAN = [-0.7, 0.7, -0.3, 0.3];
      const corners = [0, 1, 2, 3].map(() => { const g = ac.createGain(); g.gain.value = 0.25; ctx.track(g); return g; });
      const pans = corners.map((g) => { const p = ac.createStereoPanner(); g.connect(p); ctx.track(p); return p; });
      const pre = ac.createGain(), lp = ac.createBiquadFilter(), lp2 = ac.createBiquadFilter(), warm = ac.createWaveShaper(), body = ac.createGain(); lp.type = lp2.type = 'lowpass'; lp.Q.value = 0.6; lp2.Q.value = 0.5;
      pre.gain.value = 0.32; body.gain.value = 2.85; warm.oversample = '2x';   // headroom into the shaper, made up after it
      pans.forEach(p => p.connect(pre)); pre.connect(warm); warm.connect(lp); lp.connect(lp2); lp2.connect(body);
      const cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 }); cutMod.connect(lp.detune); cutMod.connect(lp2.detune);
      // width: the corners' stereo places (above) + a gentle stereo chorus — one slow-moving delay per side, ADDED to
      // the dry signal (never subtracted: L − R of two short delays is a comb filter, the 1.0 hollow sound)
      const split = ac.createChannelSplitter(2), merge = ac.createChannelMerger(2), dl = ac.createDelay(0.05), dlR = ac.createDelay(0.05), wob = ac.createOscillator(), wobG = ac.createGain();
      dl.delayTime.value = 0.013; dlR.delayTime.value = 0.019; wob.frequency.value = 0.23; wobG.gain.value = 0.0025; wob.connect(wobG); wobG.connect(dl.delayTime);
      const wobInv = ac.createGain(); wobInv.gain.value = -1; wobG.connect(wobInv); wobInv.connect(dlR.delayTime); wob.start();
      const dryMono = ac.createGain(), sideG = ac.createGain(), sideL = ac.createGain(), sideR = ac.createGain(), inv = ac.createGain();
      body.connect(dryMono); dryMono.connect(split); split.connect(merge, 0, 0); split.connect(merge, 1, 1);
      body.connect(dl); body.connect(dlR); dl.connect(sideL); dlR.connect(sideR);
      const chL = ac.createChannelSplitter(2), chR = ac.createChannelSplitter(2); sideL.connect(chL); sideR.connect(chR); chL.connect(merge, 0, 0); chR.connect(merge, 1, 1);
      [wobInv, chL, chR, body].concat(pans).forEach(n => ctx.track(n));
      // shimmer space: convolver (generated) + octave-up pitch feedback
      const verbIn = ac.createGain(), conv = ac.createConvolver(), verbOut = ac.createGain(), fb = ac.createGain(), out = ac.createGain();
      merge.connect(out); merge.connect(verbIn); verbIn.connect(conv); conv.connect(verbOut); verbOut.connect(out);
      let pitch = null;
      ctx.loadWorklet('eravos-pitch', dsp.PITCH_WORKLET).then(() => { if (ctx.disposed) return; pitch = new AudioWorkletNode(ac, 'eravos-pitch', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); pitch.parameters.get('ratio').value = 2; pitch.parameters.get('window').value = 0.08; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400; conv.connect(pitch); pitch.connect(hp); hp.connect(fb); fb.connect(verbIn); ctx.track(pitch); ctx.track(hp); }).catch((e) => ctx.K.fault('RUNTIME_003', { instance_id: ctx.id, message: 'Pad Forge shimmer unavailable — ' + e.message, quiet: !ac.audioWorklet }));
      const level = ac.createGain(); out.connect(level);
      [pre, lp, lp2, warm, split, merge, dl, dlR, wob, wobG, dryMono, sideG, inv, sideL, sideR, verbIn, conv, verbOut, fb, out, level].forEach(n => ctx.track(n));
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'pad', tail: 14 }); // tail: Stop all keeps it quiet until the longest space has emptied
      const LINEAR = new Float32Array([-1, 1]);
      let irSize = 0;
      function ir() {
        // 3.37 (QA: each preset change blocked the page 100–460 ms): the space's IR is cached per size (¼ s steps) and context
        const sec = Math.max(1, Math.round(P.get('size') * 4) / 4); if (sec === irSize) return; irSize = sec;
        let cache = IR_CACHE.get(ac); if (!cache) { cache = new Map(); IR_CACHE.set(ac, cache); }
        if (cache.has(sec)) { conv.buffer = cache.get(sec); return; }
        const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate), r = dsp.mulberry32(4242);
        for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lpS = 0; for (let i = 0; i < n; i++) { const t = i / n; lpS += ((r() * 2 - 1) - lpS) * (0.6 - 0.45 * t); d[i] = lpS * Math.pow(1 - t, 2.2) * (i < ac.sampleRate * 0.02 ? i / (ac.sampleRate * 0.02) : 1); } }
        cache.set(sec, b); conv.buffer = b;
      }
      function apply() {
        const t = ac.currentTime; ir();
        const wa = P.get('warmth'); warm.curve = wa < 0.01 ? LINEAR : dsp.curve('tape', wa * 0.9);   // unity on quiet signal, rounds the peaks
        const w = P.get('width'); pans.forEach((p, i) => p.pan.setTargetAtTime(PAN[i] * w, t, 0.05));
        lp2.frequency.setTargetAtTime(Math.min(18000, P.get('cutoff') * 2.2), t, 0.05);
        dsp.setSmooth(verbIn.gain, P.get('space'), ac); dsp.setSmooth(verbOut.gain, 0.6, ac); dsp.setSmooth(fb.gain, P.get('shimmer') * 0.55, ac);
        dsp.setSmooth(sideL.gain, w * 0.35, ac); dsp.setSmooth(sideR.gain, w * 0.35, ac); dsp.setSmooth(level.gain, P.get('level') * 0.8, ac);
        if (!bloomActive) lp.frequency.setTargetAtTime(P.get('cutoff'), t, 0.05);
      }
      let bloomActive = false;
      ['warmth', 'cutoff', 'space', 'shimmer', 'size', 'width', 'level'].forEach(k => P.onChange(k, apply)); apply();
      // vector: bilinear corner weights from (x, y) + orbit, at 30 Hz (pads move slowly; equal-power)
      let phase = 0, last = performance.now(), drift = { x: 0, y: 0, vx: 0, vy: 0 };
      const rnd = dsp.mulberry32(99);
      function vectorPoint(dt) {
        const o = P.get('orbit'), R = P.get('orbitSize'); phase += dt * P.get('orbitRate') * Math.PI * 2;
        let dx = 0, dy = 0;
        if (o === 'circle') { dx = Math.cos(phase) * R; dy = Math.sin(phase) * R; }
        else if (o === 'figure-8') { dx = Math.sin(phase) * R; dy = Math.sin(phase * 2) * R * 0.6; }
        else if (o === 'drift') { drift.vx += (rnd() - 0.5) * dt * P.get('orbitRate') * 4; drift.vy += (rnd() - 0.5) * dt * P.get('orbitRate') * 4; drift.vx *= 0.98; drift.vy *= 0.98; drift.x = Math.max(-R, Math.min(R, drift.x + drift.vx * dt)); drift.y = Math.max(-R, Math.min(R, drift.y + drift.vy * dt)); dx = drift.x; dy = drift.y; }
        return { x: Math.max(0, Math.min(1, P.get('x') + dx)), y: Math.max(0, Math.min(1, P.get('y') + dy)) };
      }
      let vp = { x: P.get('x'), y: P.get('y') };
      function updateVector() {
        const now = performance.now(), dt = Math.min(0.2, (now - last) / 1000); last = now; vp = vectorPoint(dt);
        const w = [(1 - vp.x) * (1 - vp.y), vp.x * (1 - vp.y), (1 - vp.x) * vp.y, vp.x * vp.y].map(Math.sqrt);
        const t = ac.currentTime; corners.forEach((g, i) => g.gain.setTargetAtTime(w[i], t, 0.06));
        if ((vecTick = (vecTick + 1) % 2) === 0) ctx.emitUI('vec', { x: vp.x, y: vp.y, w });
      }
      let vecTick = 0;
      ctx.interval(updateVector, 33); updateVector();
      ctx.stateExtra = () => ({ sources: SOURCES });
      ctx.vector = () => vp;
      // ---- sources (each a different way of making a sustained tone)
      const noise = dsp.noise(ac, 2, 'pink');
      // 1.1: each source calibrated to the same loudness (a 4-note chord measured alone, −16 dB RMS) — they spanned 16 dB
      const SRC_DB = { swarm: 4.9, glass: -8.1, air: 7.5, choir: 7.9, organ: -7.5, strings: 0.5, halo: -1.3 };
      function source(kind, f, dst0, t, nodes) {
        const cal = ac.createGain(); cal.gain.value = Math.pow(10, (SRC_DB[kind] || 0) / 20); cal.connect(dst0); nodes.push(cal); const dst = cal;
        const osc = (type, fr, det, gain, to) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = det || 0; const g = ac.createGain(); g.gain.value = gain; o.connect(g); g.connect(to || dst); o.start(t); nodes.push(o, g); return o; };
        switch (kind) {
          case 'swarm': [-18, -9, 0, 9, 18].forEach((d, i) => osc('sawtooth', f, d + (rnd() - 0.5) * 3, 0.07, null)); break;
          case 'glass': [[1, 0.5], [2.003, 0.22], [3.01, 0.12], [4.2, 0.07], [5.43, 0.05]].forEach(([k, a]) => osc('sine', f * k, 0, a)); break;
          case 'air': { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true; s.loopStart = rnd() * 1.5; const b1 = ac.createBiquadFilter(), b2 = ac.createBiquadFilter(), g = ac.createGain(); b1.type = b2.type = 'bandpass'; b1.frequency.value = f * 2; b2.frequency.value = f * 4; b1.Q.value = 18; b2.Q.value = 22; g.gain.value = 1.6; s.connect(b1); s.connect(b2); b1.connect(g); b2.connect(g); g.connect(dst); s.start(t, rnd() * 1.5); nodes.push(s, b1, b2, g); break; }
          case 'choir': { const sum = ac.createGain(); sum.gain.value = 1; [[730, 1], [1090, 0.5], [2440, 0.25]].forEach(([fr, a]) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = 7; const g = ac.createGain(); g.gain.value = a * 1.3; sum.connect(b); b.connect(g); g.connect(dst); nodes.push(b, g); }); [-12, 0, 11].forEach(d => osc('sawtooth', f, d, 0.12, sum)); nodes.push(sum); break; }
          case 'organ': [[1, 0.35], [2, 0.2], [3, 0.12], [4, 0.1], [6, 0.05], [8, 0.05]].forEach(([k, a]) => osc('sine', f * k, 0, a)); break;
          case 'strings': { const l = ac.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = Math.min(9000, f * 9); l.Q.value = 0.4; l.connect(dst); nodes.push(l); osc('sawtooth', f, -7, 0.11, l); osc('sawtooth', f, 7, 0.11, l); osc('sawtooth', f * 2, 3, 0.04, l); break; }
          case 'halo': default: [[2, 0.18], [4, 0.08], [3, 0.06]].forEach(([k, a]) => osc('sine', f * k, (rnd() - 0.5) * 8, a)); osc('triangle', f, 0, 0.12);
        }
      }
      const voices = []; let lastChordAt = -1;
      function noteOn(note, vel, t, dur) {
        t = Math.max(t || ac.currentTime, ac.currentTime);
        if (P.get('hold') && t - lastChordAt > 0.12) voices.filter(v => v.off === Infinity).forEach(v => release(v, t)); // a new chord replaces the held one
        lastChordAt = t;
        while (voices.length >= 8) kill(voices[0], t);
        const f = MT.hz(note), nodes = [], envs = corners.map(c => { const e = ac.createGain(); e.gain.value = 0; e.connect(c); nodes.push(e); return e; });
        const kinds = ['cornerA', 'cornerB', 'cornerC', 'cornerD'].map(k => P.get(k));
        kinds.forEach((k, i) => source(k, f, envs[i], t, nodes));
        const pk = 0.35 + 0.65 * vel;
        envs.forEach(e => { e.gain.setValueAtTime(0, t); e.gain.setTargetAtTime(pk, t, Math.max(0.002, P.get('attack') / 3)); });
        const v = { note, envs, nodes, off: Infinity }; voices.push(v);
        const bl = P.get('bloom'); if (bl > 0) { bloomActive = true; const c = P.get('cutoff'); lp.frequency.cancelScheduledValues(t); lp.frequency.setValueAtTime(Math.max(120, c * (1 - 0.85 * bl)), t); lp.frequency.setTargetAtTime(c, t, 0.4 + 2.5 * bl); setTimeout(() => { bloomActive = false; }, 4000); }
        if (dur !== undefined && !P.get('hold')) release(v, t + dur);
        return v;
      }
      function release(v, t) { if (v.off !== Infinity) return; v.off = t; const R = P.get('release'); v.envs.forEach(e => dsp.release(e.gain, t, R)); v.nodes.forEach(n => { if (n.stop) try { n.stop(t + R * 1.7 + 0.1); } catch (e) {} }); const last = v.nodes.filter(n => n.stop).pop(); const done = () => { v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); }; if (last) last.onended = done; else done(); }
      function kill(v, t) { const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); v.envs.forEach(e => { e.gain.cancelScheduledValues(t); e.gain.setTargetAtTime(0, t, 0.02); }); v.nodes.forEach(n => { if (n.stop) try { n.stop(t + 0.12); } catch (e) {} }); }
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity); else if (!P.get('hold')) voices.filter(v => v.note === p.note).forEach(v => release(v, ac.currentTime)); });
      // 3.28 stop contract: held / latched chords let go; the shimmer loop is cut while the tail empties so it can't regrow
      ctx.onSilence((p) => {
        const t = Math.max(ac.currentTime, p.time || 0), fade = p.hard ? 0.01 : 1.5;
        voices.filter(v => v.off === Infinity).forEach(v => release(v, t));
        fb.gain.cancelScheduledValues(t); fb.gain.setValueAtTime(fb.gain.value, t); fb.gain.linearRampToValueAtTime(0, t + fade);
        fb.gain.setValueAtTime(0, t + fade + P.get('size') + 0.5); fb.gain.linearRampToValueAtTime(P.get('shimmer') * 0.55, t + fade + P.get('size') + 0.6);
      });
      ctx.audition = (p) => noteOn(p.note || 57, p.velocity || 0.8, ac.currentTime, p.duration || 3);
      ctx.auditionOff = (p) => { if (!P.get('hold')) voices.filter(v => v.note === (p.note || 57)).forEach(v => release(v, ac.currentTime)); };
      ctx.onUI('release_all', null, () => voices.slice().forEach(v => release(v, ac.currentTime)));
      ctx.internals = { voices, corners, pre, warm, body, level, pans };
      ctx.onDispose(() => voices.slice().forEach(v => kill(v, ac.currentTime)));
      return {};
    },
    ui_hooks: ['release_all'],
  });
})();
