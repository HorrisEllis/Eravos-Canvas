/* eravos.embodiment-lab 0.1.0 — Embodiment Lab · spec embodiment-lab.spec (template eravos.tool/1, sound flavour)
 * A listening and grounding experience: a slow drone built on IRRATIONAL ratios over a root (φ, √2, √3, π/2, e/2,
 * 2^(1/φ), the golden stack), a felt low layer, a body PULSE (heart-like throb, or locked to the tempo like the
 * Hanging Tree organ), and a BREATH cycle (inhale · hold · exhale · rest) that swells level and brightness — from its
 * own clock or from a Breath tool wired into its breath input. Each breath cycle can carry an attention cue that walks
 * up the body (feet → legs → belly → chest → throat → face → whole body), emitted as 'embody:cue'.
 * Plays until you end it: ▶ Begin / ■ End with long fades. Output passes a compressor and a soft ceiling (≤ 0.72).
 * No claims: it is sound to listen to and breathe with, nothing more. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const PHI = (1 + Math.sqrt(5)) / 2, G = Math.pow(2, 1 / PHI);
  // golden stack: φ (833.09 ¢) stacked five times and folded into the octave
  const STACK = [0, 1, 2, 3, 4].map(k => Math.pow(2, ((k * 1200 * Math.log2(PHI)) % 1200) / 1200)).sort((a, b) => a - b);
  // partial sets — ratios over the root (1 = root) and a relative weight
  const SETS = {
    'φ golden': [[1, 1], [PHI, 0.8], [2, 0.45], [PHI * PHI, 0.5], [PHI * PHI * PHI, 0.25]],
    '√2': [[1, 1], [Math.SQRT2, 0.7], [2, 0.55], [2 * Math.SQRT2, 0.35], [4, 0.2]],
    '√3': [[1, 1], [Math.sqrt(3), 0.75], [2, 0.4], [3, 0.4], [2 * Math.sqrt(3), 0.22]],
    'π/2': [[1, 1], [Math.PI / 2, 0.75], [Math.PI * Math.PI / 4, 0.45], [Math.PI, 0.35], [Math.PI * Math.PI / 2, 0.18]],
    'e/2': [[1, 1], [Math.E / 2, 0.75], [Math.E * Math.E / 4, 0.5], [Math.E, 0.35], [Math.E * Math.E / 2, 0.18]],
    '2^(1/φ)': [[1, 1], [G, 0.75], [2, 0.4], [G * G, 0.45], [G * G * G, 0.25]],
    'golden stack': STACK.map((r, i) => [r, i ? 0.7 - i * 0.08 : 1]).concat([[2, 0.4], [2 * STACK[2], 0.2]]),
  };
  const TONES = { pure: null, warm: [1, 0.22, 0.07], organ: [1, 0.38, 0.17, 0.09, 0.05, 0.03] };
  const REGIONS = [
    ['feet', 'Notice your feet, and where they meet the floor.'],
    ['legs', 'Let the weight settle down through your legs.'],
    ['belly', 'Feel the belly rise as the breath comes in.'],
    ['chest', 'Let the low sound sit in your chest.'],
    ['throat', 'Soften the throat. Let the breath pass through.'],
    ['face', 'Loosen the jaw, the eyes, the forehead.'],
    ['whole', 'The whole body, breathing. Stay here a while.'],
  ];
  const PHASES = ['inhale', 'hold', 'exhale', 'rest'];
  const CEIL = 0.88; // soft ceiling: y = c·tanh(x/c); inputs are clamped to ±1, so |out| ≤ c·tanh(1/c) ≈ 0.72
  // one cycle of a 0..1 pulse shape → Fourier series of (shape − mean); out gain = 1 − depth + depth·shape
  function shapeOf(kind, x) {
    if (kind === 'heartbeat') { const b = (c, w) => Math.exp(-Math.pow((x - c) / w, 2)); return Math.min(1, b(0.08, 0.06) + 0.62 * b(0.34, 0.07)); }
    if (kind === 'chop') return 0.5 + 0.5 * Math.tanh(Math.cos(2 * Math.PI * x) * 4) / Math.tanh(4);
    return 0.5 + 0.5 * Math.cos(2 * Math.PI * x); // throb
  }
  function series(kind, K, N) {
    K = K || 24; N = N || 1024; const s = Float32Array.from({ length: N }, (_, n) => shapeOf(kind, n / N)), re = new Float32Array(K + 1), im = new Float32Array(K + 1);
    let mean = 0; s.forEach(v => { mean += v; }); mean /= N;
    for (let k = 1; k <= K; k++) { let a = 0, b = 0; for (let n = 0; n < N; n++) { const w = 2 * Math.PI * k * n / N; a += s[n] * Math.cos(w); b += s[n] * Math.sin(w); } re[k] = 2 * a / N; im[k] = 2 * b / N; }
    return { re, im, mean };
  }
  const SERIES = {}; ['heartbeat', 'throb', 'chop'].forEach(k => { SERIES[k] = series(k); });

  OrganismFactory.define({
    id: 'eravos.embodiment-lab', preview: 'chord', domain: 'music', version: '0.1.0', label: 'Embodiment Lab', icon: '◉', accent: '#e0a77a',
    category: 'Xenharmonic', blurb: 'A slow irrational-ratio drone with a body pulse and a breath swell, and gentle cues that move your attention through the body. Choose a feeling and begin.',
    size: { w: 540, h: 600 }, minSize: { w: 380, h: 460 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.mod_source'],
    needs: { mode: 'music.lab', notes: ['Keep the volume comfortable and low. Stop whenever you like.'], works_with: ['eravos.breath', 'eravos.organ', 'eravos.xen-synth'] },
    hooks: [S.audio_out('embodiment-lab.hook.audio_out'), S.note_in('embodiment-lab.hook.note_in'), S.transport_in('embodiment-lab.hook.transport_in'),
      Object.assign(S.mod_in('embodiment-lab.hook.breath_in', 'breath'), { intent: 'breath 0..1 from a Breath tool — set “Breath from” to wired' }),
      Object.assign(S.mod_out('embodiment-lab.hook.breath_out', 'breath'), { intent: 'this tool’s own breath 0..1 — drive anything with it' }),
      S.event('embodiment-lab.hook.cue_out', 'out', 'embody:cue', { type: 'object', required: ['text', 'region', 'cycle'] }, '1.0.0')],
    config: [
      { key: 'rootNote', type: 'integer', default: 38, min: 24, max: 64, label: 'Root', group: 'DRONE', hint: 'the note the ratios stand on — a played note moves it' },
      { key: 'ratioSet', type: 'enum', options: Object.keys(SETS), default: 'φ golden', label: 'Ratios', group: 'DRONE', hint: 'the irrational ratios stacked over the root' },
      { key: 'tone', type: 'enum', options: Object.keys(TONES), default: 'warm', label: 'Tone', group: 'DRONE' },
      { key: 'brightness', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Brightness', group: 'DRONE' },
      { key: 'drift', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Drift', group: 'DRONE', hint: 'very slow detune and level wander of each partial' },
      { key: 'grit', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Grit', group: 'DRONE', hint: 'warm valve-like saturation' },
      { key: 'sub', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Low layer', group: 'DRONE', hint: 'a soft sine at 30–60 Hz, felt more than heard' },
      { key: 'pulse', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Pulse', group: 'PULSE', hint: 'a slow throb in the level' },
      { key: 'pulseShape', type: 'enum', options: ['heartbeat', 'throb', 'chop'], default: 'heartbeat', label: 'Shape', group: 'PULSE' },
      { key: 'pulseLock', type: 'enum', options: ['free', 'beat', '1/8'], default: 'free', label: 'Lock', group: 'PULSE', hint: 'free = the rate below · beat / 1/8 = locked to the tempo' },
      { key: 'pulseRate', type: 'number', default: 56, min: 40, max: 80, step: 1, unit: 'bpm', label: 'Rate', group: 'PULSE' },
      { key: 'clock', type: 'enum', options: ['own', 'wired'], default: 'own', label: 'Breath from', group: 'BREATH', hint: 'own = this tool’s breath clock · wired = a Breath tool plugged into the breath input' },
      { key: 'inhale', type: 'number', default: 4, min: 1, max: 12, step: 0.1, unit: 's', label: 'In', group: 'BREATH' },
      { key: 'hold', type: 'number', default: 1, min: 0, max: 12, step: 0.1, unit: 's', label: 'Hold', group: 'BREATH' },
      { key: 'exhale', type: 'number', default: 6, min: 1, max: 14, step: 0.1, unit: 's', label: 'Out', group: 'BREATH' },
      { key: 'rest', type: 'number', default: 1, min: 0, max: 12, step: 0.1, unit: 's', label: 'Rest', group: 'BREATH' },
      { key: 'breathDepth', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Swell', group: 'BREATH', hint: 'how much the level rises with the inhale' },
      { key: 'breathFilter', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Open', group: 'BREATH', hint: 'how much the sound brightens with the inhale' },
      { key: 'cues', type: 'boolean', default: true, label: 'Body cues', group: 'ATTENTION' },
      { key: 'cueEvery', type: 'integer', default: 2, min: 1, max: 6, label: 'Breaths per cue', group: 'ATTENTION' },
      { key: 'space', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Space', group: 'SPACE' },
      { key: 'stereo', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Stereo texture', group: 'SPACE', hint: 'a slightly different tone in each ear; on headphones it is heard as a slow wobble' },
      { key: 'beat', type: 'number', default: 4, min: 0.5, max: 12, step: 0.1, unit: 'Hz', label: 'Offset', group: 'SPACE', hint: 'how far apart the two stereo-texture tones are' },
      { key: 'fade', type: 'number', default: 4, min: 1, max: 8, step: 0.1, unit: 's', label: 'Fade', group: 'OUTPUT', hint: 'fade in on Begin, fade out on End' },
      { key: 'level', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Level', group: 'OUTPUT' },
      { key: 'glow', type: 'integer', default: 26, min: 0, max: 359, label: 'Glow hue', group: 'OUTPUT', hint: 'colour of the breathing light (no effect on the sound)' },
    ],
    ui_hooks: ['begin', 'end'],
    presets: {},
    defaultPreset: 'Feelings · Grounded',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, node = (n) => { ctx.track(n); return n; };
      const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
      // ---------------------------------------------------------------- signal chain
      // voice(s) → droneBus → grit → lp (brightness + breath) → pulseG → breathG → dry + space → sum → level → runG → hp → comp → ceiling → out
      const droneBus = node(ac.createGain()), gritPre = node(ac.createGain()), gritShaper = node(ac.createWaveShaper()), gritPost = node(ac.createGain());
      const lp = node(ac.createBiquadFilter()), pulseG = node(ac.createGain()), pulseD = node(ac.createGain()), breathG = node(ac.createGain());
      lp.type = 'lowpass'; lp.Q.value = 0.5; droneBus.connect(gritPre); gritPre.connect(gritShaper); gritShaper.connect(gritPost); gritPost.connect(lp); lp.connect(pulseG); pulseD.connect(pulseG.gain); pulseG.connect(breathG);
      const subG = node(ac.createGain()); subG.connect(pulseG); // the low layer skips the filter and grit but throbs and breathes
      const texG = node(ac.createGain()); texG.connect(breathG); // the stereo texture breathes but does not throb
      const dry = node(ac.createGain()), pre = node(ac.createDelay(0.2)), conv = node(ac.createConvolver()), wet = node(ac.createGain()), sum = node(ac.createGain());
      pre.delayTime.value = 0.03; breathG.connect(dry); dry.connect(sum); breathG.connect(pre); pre.connect(conv); conv.connect(wet); wet.connect(sum);
      { const n = Math.floor(ac.sampleRate * 5), b = ac.createBuffer(2, n, ac.sampleRate), r = dsp.mulberry32(2718); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let l = 0; for (let i = 0; i < n; i++) { const t = i / n; l += ((r() * 2 - 1) - l) * (0.35 - 0.3 * t); d[i] = l * Math.pow(1 - t, 2) * 0.9; } } conv.buffer = b; }
      const level = node(ac.createGain()), runG = node(ac.createGain()), hp = node(ac.createBiquadFilter()), comp = node(ac.createDynamicsCompressor()), ceil = node(ac.createWaveShaper()), out = node(ac.createGain());
      runG.gain.value = 0; hp.type = 'highpass'; hp.frequency.value = 24; hp.Q.value = 0.6;
      comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = 0.01; comp.release.value = 0.4;
      ceil.curve = Float32Array.from({ length: 4097 }, (_, i) => { const x = i / 2048 - 1; return CEIL * Math.tanh(x / CEIL); }); ceil.oversample = '2x';
      sum.connect(level); level.connect(runG); runG.connect(hp); hp.connect(comp); comp.connect(ceil); ceil.connect(out);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'Embodiment Lab', tail: 5 });

      // ---------------------------------------------------------------- breath: own clock + wired input → one 0..1 signal
      const own = node(ac.createConstantSource()); own.offset.value = 0; own.start();
      const ownGate = node(ac.createGain()), breathSum = node(ac.createGain()); own.connect(ownGate); ownGate.connect(breathSum);
      const wiredIn = ctx.modBus('breath', { min: 0, max: 1 }, { label: 'breath in' }), wiredGate = node(ac.createGain()); wiredIn.connect(wiredGate); wiredGate.connect(breathSum);
      ctx.port('breath', { kind: 'mod', direction: 'out', node: breathSum, range: { min: 0, max: 1 }, label: 'breath' });
      const toAmp = node(ac.createGain()), toCut = node(ac.createGain()), breathTap = node(ac.createAnalyser()); breathTap.fftSize = 256;
      breathSum.connect(toAmp); toAmp.connect(breathG.gain); breathSum.connect(toCut); toCut.connect(lp.frequency); breathSum.connect(breathTap);

      // ---------------------------------------------------------------- pulse: a persistent oscillator with an exact Fourier shape
      let pOsc = null, pShape = null; const toRate = node(ac.createGain()); breathSum.connect(toRate);
      const pulseHz = () => { const lk = P.get('pulseLock'), bpm = ctx.bpm || 120; if (lk === 'beat') { let b = bpm; while (b > 90) b /= 2; return b / 60; } if (lk === '1/8') return bpm / 30; return P.get('pulseRate') / 60; };
      function pulseStart(at) {
        const t = Math.max(at || 0, ac.currentTime), sh = SERIES[P.get('pulseShape')] || SERIES.heartbeat;
        if (pOsc) { const o = pOsc; try { o.stop(t); } catch (e) {} o.onended = () => { try { o.disconnect(); } catch (e) {} }; }
        pOsc = ac.createOscillator(); pOsc.setPeriodicWave(ac.createPeriodicWave(sh.re, sh.im, { disableNormalization: true })); pOsc.frequency.value = pulseHz();
        pOsc.connect(pulseD); toRate.connect(pOsc.frequency); pOsc.start(t); pShape = sh; applyPulse();
      }
      function applyPulse() {
        const d = P.get('pulse'), t = ac.currentTime, m = pShape ? pShape.mean : 0.5;
        pulseG.gain.setTargetAtTime(1 - d + d * m, t, 0.05); pulseD.gain.setTargetAtTime(d, t, 0.05);
        if (pOsc) pOsc.frequency.setTargetAtTime(pulseHz(), t, 0.05);
        toRate.gain.setTargetAtTime(P.get('pulseLock') === 'free' ? pulseHz() * 0.05 : 0, t, 0.05); // a free pulse quickens a touch on the inhale
      }

      // ---------------------------------------------------------------- the drone voice (rebuilt with a crossfade when ratios or tone change)
      const WAVES = {}; Object.keys(TONES).forEach(k => { const h = TONES[k]; if (!h) return; const re = new Float32Array(h.length + 1), im = new Float32Array(h.length + 1); h.forEach((a, i) => { im[i + 1] = a; }); WAVES[k] = ac.createPeriodicWave(re, im); });
      const rnd = dsp.mulberry32(1618);
      let voice = null;
      function rootHz() { return hz(P.get('rootNote')); }
      function subHz() { let f = rootHz(); while (f > 60) f /= 2; while (f < 30) f *= 2; return f; }
      function partialGain(i, w) { const b = P.get('brightness'); return w * Math.pow(1 / (1 + i), 1.6 - 1.3 * b); }
      function buildVoice(t) {
        const set = SETS[P.get('ratioSet')] || SETS['φ golden'], f0 = rootHz(), v = { g: ac.createGain(), parts: [], nodes: [] };
        v.g.gain.value = 0; v.g.connect(droneBus);
        let total = 0; set.forEach(([, w], i) => { total += partialGain(i, w); });
        const norm = 0.22 / Math.max(0.3, total);
        set.forEach(([r, w], i) => {
          const pg = ac.createGain(), pan = ac.createStereoPanner(); pan.pan.value = i === 0 ? 0 : (i % 2 ? -1 : 1) * Math.min(0.6, 0.15 * i);
          pg.gain.value = partialGain(i, w) * norm; pg.connect(pan); pan.connect(v.g);
          // level wander (very slow, per partial)
          const wl = ac.createOscillator(), wg = ac.createGain(); wl.frequency.value = 0.017 + rnd() * 0.05; wg.gain.value = 0; wl.connect(wg); wg.connect(pg.gain); wl.start(t);
          const oscs = [-1, 1].map(sgn => {
            const o = ac.createOscillator(); const pw = WAVES[P.get('tone')]; if (pw && f0 * r * 6 < ac.sampleRate * 0.45) o.setPeriodicWave(pw);
            o.frequency.value = f0 * r; o.detune.value = sgn * (1.5 + i * 0.6);
            const dl = ac.createOscillator(), dg = ac.createGain(); dl.frequency.value = 0.011 + rnd() * 0.035; dg.gain.value = 0; dl.connect(dg); dg.connect(o.detune); dl.start(t);
            const og = ac.createGain(); og.gain.value = 0.5; o.connect(og); og.connect(pg); o.start(t);
            v.nodes.push(o, dl, dg, og); return { o, dg };
          });
          v.parts.push({ r, w, i, pg, wg, oscs }); v.nodes.push(pg, pan, wl, wg);
        });
        // low layer
        const so = ac.createOscillator(), sg = ac.createGain(); so.frequency.value = subHz(); sg.gain.value = 1; so.connect(sg); sg.connect(v.g === null ? subG : subG); so.start(t); v.sub = so; v.nodes.push(so, sg);
        // stereo texture: one tone per ear, `beat` Hz apart, around a mid-low register
        const tf = (() => { let f = rootHz() * 2; while (f > 260) f /= 2; while (f < 130) f *= 2; return f; })();
        const merge = ac.createChannelMerger(2), tl = ac.createOscillator(), tr = ac.createOscillator(); tl.frequency.value = tf; tr.frequency.value = tf + P.get('beat');
        tl.connect(merge, 0, 0); tr.connect(merge, 0, 1); const tg = ac.createGain(); tg.gain.value = 1; merge.connect(tg); tg.connect(texG); tl.start(t); tr.start(t);
        v.tex = { tl, tr, tf }; v.subGate = sg; v.texGate = tg; v.nodes.push(merge, tl, tr, tg);
        v.g.gain.setValueAtTime(0, t); v.g.gain.setTargetAtTime(1, t, 0.6); sg.gain.setValueAtTime(0, t); sg.gain.setTargetAtTime(1, t, 0.6); tg.gain.setValueAtTime(0, t); tg.gain.setTargetAtTime(1, t, 0.6);
        applyVoice(v);
        return v;
      }
      function applyVoice(v) {
        if (!v) return; const t = ac.currentTime, dr = P.get('drift');
        let total = 0; v.parts.forEach(p => { total += partialGain(p.i, p.w); }); const norm = 0.22 / Math.max(0.3, total);
        v.parts.forEach(p => { const g = partialGain(p.i, p.w) * norm; p.pg.gain.setTargetAtTime(g, t, 0.3); p.wg.gain.setTargetAtTime(g * 0.35 * dr, t, 0.3); p.oscs.forEach(x => x.dg.gain.setTargetAtTime(dr * (6 + p.i * 3), t, 0.3)); });
      }
      function glideRoot(t) {
        if (!voice) return; t = Math.max(t || 0, ac.currentTime); const f0 = rootHz();
        voice.parts.forEach(p => p.oscs.forEach(x => x.o.frequency.setTargetAtTime(f0 * p.r, t, 0.9)));
        voice.sub.frequency.setTargetAtTime(subHz(), t, 0.9);
        let f = f0 * 2; while (f > 260) f /= 2; while (f < 130) f *= 2; voice.tex.tf = f;
        voice.tex.tl.frequency.setTargetAtTime(f, t, 0.9); voice.tex.tr.frequency.setTargetAtTime(f + P.get('beat'), t, 0.9);
      }
      function dropVoice(v, t, tau) {
        if (!v) return; t = Math.max(t || 0, ac.currentTime); tau = tau || 0.6;
        [v.g.gain, v.subGate.gain, v.texGate.gain].forEach(g => { if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t); g.setTargetAtTime(0, t, tau); });
        const end = t + tau * 7;
        v.nodes.forEach(n => { if (n.stop) try { n.stop(end); } catch (e) {} });
        const last = v.nodes.find(n => n.stop); if (last) last.onended = () => { v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); try { v.g.disconnect(); } catch (e) {} };
      }
      function rebuild() { if (!voice) return; const t = ac.currentTime; dropVoice(voice, t, 0.7); voice = buildVoice(t); }

      // ---------------------------------------------------------------- mix, space, brightness, breath depth
      let gritK = -1;
      function apply() {
        const t = ac.currentTime, b = P.get('brightness'), base = 180 * Math.pow(2, b * 5.2);
        lp.frequency.setTargetAtTime(base, t, 0.2);
        const ownOn = P.get('clock') === 'own'; ownGate.gain.setTargetAtTime(ownOn ? 1 : 0, t, 0.1); wiredGate.gain.setTargetAtTime(ownOn ? 0 : 1, t, 0.1);
        const bd = P.get('breathDepth'); breathG.gain.setTargetAtTime(1 - bd, t, 0.1); toAmp.gain.setTargetAtTime(bd, t, 0.1);
        toCut.gain.setTargetAtTime(P.get('breathFilter') * base * 1.6, t, 0.2);
        subG.gain.setTargetAtTime(P.get('sub') * 0.16, t, 0.2); texG.gain.setTargetAtTime(P.get('stereo') * 0.05, t, 0.2);
        const sp = P.get('space'); dsp.setSmooth(wet.gain, sp * 0.8, ac, 0.1); dsp.setSmooth(dry.gain, 1 - sp * 0.4, ac, 0.1);
        dsp.setSmooth(level.gain, P.get('level') * 1.6, ac, 0.05);
        const g = P.get('grit');
        if (g <= 0.001) { gritShaper.curve = null; gritK = -1; gritPre.gain.setTargetAtTime(1, t, 0.05); gritPost.gain.setTargetAtTime(1, t, 0.05); }
        else { if (Math.abs(g - gritK) > 0.01) { const k = 1 + g * 7, bias = 0.2 * g; gritShaper.curve = Float32Array.from({ length: 2048 }, (_, i) => { const x = i / 1023.5 - 1; return (Math.tanh(k * x + bias) - Math.tanh(bias)) / (Math.tanh(k + bias) - Math.tanh(bias)); }); gritK = g; }
          gritPre.gain.setTargetAtTime(1 + g * 2.5, t, 0.05); gritPost.gain.setTargetAtTime(1 / (1 + g * 2.2), t, 0.05); }
        if (voice) { voice.tex.tr.frequency.setTargetAtTime(voice.tex.tf + P.get('beat'), t, 0.3); applyVoice(voice); }
      }

      // ---------------------------------------------------------------- the breath clock + cues
      const ease = (n, up) => Float32Array.from({ length: n }, (_, i) => { const x = i / (n - 1), y = 0.5 - 0.5 * Math.cos(Math.PI * x); return up ? y : 1 - y; });
      const durations = () => [P.get('inhale'), P.get('hold'), P.get('exhale'), P.get('rest')];
      let running = false, nextAt = 0, phase = 0, cycle = 0, cueIdx = -1, cues = [], heldByNote = false, endTok = 0;
      function cueFor(c) {
        if (!P.get('cues') || c % P.get('cueEvery')) return null;
        const k = Math.floor(c / P.get('cueEvery')) % REGIONS.length;
        return { region: REGIONS[k][0], text: REGIONS[k][1], index: k };
      }
      function emitCue(c, t) {
        const q = cueFor(c); if (!q) return;
        const ev = { text: q.text, region: q.region, index: q.index, cycle: c, time: t };
        cues.push(ev); if (cues.length > 32) cues.shift();
        ctx.emit('embody:cue', ev);
      }
      function schedulePhase() {
        const d = durations(), len = d[phase], t = nextAt;
        if (phase === 0) emitCue(cycle, t);
        if (len > 0) {
          if (phase === 0) own.offset.setValueCurveAtTime(ease(64, true), t, len);
          else if (phase === 2) own.offset.setValueCurveAtTime(ease(64, false), t, len);
          else own.offset.setValueAtTime(phase === 1 ? 1 : 0, t);
        }
        nextAt = t + len; phase = (phase + 1) % 4; if (phase === 0) cycle++;
      }
      ctx.scheduleAhead = (sec) => { if (!running || P.get('clock') !== 'own') return; let guard = 0; while (nextAt < ac.currentTime + sec && guard++ < 256) schedulePhase(); };
      function restartClock(t) { t = Math.max(t || 0, ac.currentTime); own.offset.cancelScheduledValues(t); own.offset.setValueAtTime(0, t); nextAt = t; phase = 0; ctx.scheduleAhead(0.6); }

      // ---------------------------------------------------------------- Begin / End
      function begin(t, o) {
        t = Math.max(t || 0, ac.currentTime); endTok++;
        heldByNote = !!(o && o.byNote);
        if (!voice) voice = buildVoice(t);
        const g = runG.gain; if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); }
        g.linearRampToValueAtTime(1, t + P.get('fade'));
        if (!running) { running = true; cycle = 0; cues = []; cueIdx = -1; restartClock(t); }
        ctx.syncUI();
      }
      function end(t, o) {
        t = Math.max(t || 0, ac.currentTime); const fade = o && o.hard ? 0.25 : P.get('fade');
        if (!running && !voice) return;
        running = false; heldByNote = false;
        own.offset.cancelScheduledValues(t); own.offset.setValueAtTime(own.offset.value, t); own.offset.linearRampToValueAtTime(0, t + Math.min(fade, 2));
        const g = runG.gain; if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); }
        g.linearRampToValueAtTime(0, t + fade);
        const tok = ++endTok, v = voice;
        ctx.atAudioTime(t + fade + 0.05, () => { if (tok !== endTok || running) return; if (voice === v) { dropVoice(v, ac.currentTime, 0.05); voice = null; } });
        ctx.syncUI();
      }
      ctx.begin = begin; ctx.end = end; ctx.isRunning = () => running;
      ctx.onUI('begin', null, () => begin());
      ctx.onUI('end', null, () => end());
      ctx.onSilence((p) => end(p && p.time, { hard: !!(p && p.hard) }));
      ctx.onDispose(() => { if (voice) dropVoice(voice, ac.currentTime, 0.02); if (pOsc) try { pOsc.stop(); } catch (e) {} });

      // notes: while running the root glides to the played note; while ended a note begins it and ends after the note
      const fold = (n) => { while (n > 64) n -= 12; while (n < 24) n += 12; return n; };
      function noteIn(note, t, dur) {
        P.set('rootNote', fold(note)); glideRoot(t);
        if (!running) { begin(t, { byNote: true }); const tok = endTok; ctx.atAudioTime(t + Math.max(dur || 0, P.get('fade') + 1), () => { if (tok === endTok && heldByNote && running) end(); }); }
      }
      ctx.onNote((p) => noteIn(p.note, typeof p.time === 'number' ? p.time : ac.currentTime, p.duration));
      ctx.audition = (p) => noteIn(p.note || P.get('rootNote'), ac.currentTime, p.duration || 8);
      ctx.auditionOff = () => { if (heldByNote) end(); };

      // ---------------------------------------------------------------- params
      P.onChange('rootNote', () => glideRoot());
      ['ratioSet', 'tone'].forEach(k => P.onChange(k, rebuild));
      ['brightness', 'drift', 'grit', 'sub', 'stereo', 'beat', 'space', 'level', 'breathDepth', 'breathFilter', 'clock'].forEach(k => P.onChange(k, apply));
      ['pulse', 'pulseRate', 'pulseLock'].forEach(k => P.onChange(k, applyPulse)); P.onChange('pulseShape', () => pulseStart(ac.currentTime));
      ['inhale', 'hold', 'exhale', 'rest', 'clock'].forEach(k => P.onChange(k, () => { if (running) restartClock(); }));
      ctx.onBpm(() => applyPulse());
      apply(); pulseStart(ac.currentTime);

      // ---------------------------------------------------------------- live view: breath value, phase, current cue
      const tb = new Float32Array(breathTap.fftSize); let lastVal = 0, wiredCycle = 0, shownCue = null;
      ctx.interval(() => {
        ctx.scheduleAhead(0.8);
        breathTap.getFloatTimeDomainData(tb); let s = 0; for (let i = 0; i < tb.length; i++) s += tb[i]; const val = Math.max(0, Math.min(1, s / tb.length));
        if (running && P.get('clock') === 'wired' && lastVal < 0.5 && val >= 0.5) { emitCue(wiredCycle, ac.currentTime); wiredCycle++; }
        lastVal = val;
        const now = ac.currentTime, cur = cues.filter(c => c.time <= now + 0.05).pop() || null;
        if (cur && cur !== shownCue) { shownCue = cur; ctx.emitUI('cue', cur); }
        const own = P.get('clock') === 'own';
        ctx.emitUI('tick', { value: val, running, phase: own ? PHASES[(phase + 3) % 4] : (val > lastVal ? 'inhale' : 'exhale'), until: own ? Math.max(0, nextAt - now) : 0, cycle: own ? cycle : wiredCycle, pulseHz: pulseHz(), fade: runG.gain.value });
      }, 100);
      ctx.stateExtra = () => ({ running, cue: shownCue });
      ctx.cues = () => cues.slice();
      ctx.internals = { droneBus, lp, pulseG, breathG, runG, comp, ceil, breathSum, get voice() { return voice; }, get pulse() { return pOsc; } };
      return {};
    },
  });
})();
