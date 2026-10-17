/* eravos.organ 1.0.0 — Gothic Organ · spec eravos.organism.organ (P8.3) + P14 extensions
 * Additive pipe organ: 9 drawbar ranks per voice at 16' 5⅓' 8' 4' 2⅔' 2' 1⅗' 1⅓' 1' (ratios 0.5 1.5 1 2 3 4 5 6 8),
 * levels 0–8, alternate ranks detuned ± celeste cents. Pipe character: chiff (band-passed noise on attack), wind
 * (low-passed noise while keys are held), tremulant. BREATH: a slow amplitude swell (4–20 s, or driven by the
 * Breath organism through the breath port) — the "Hanging Tree" breathing. Pedal: 16' + 32' under the lowest held
 * note. Poly 6, oldest stolen. P14 (ripped from v10 _registerQOTSASynths): GOTHIC CHORD mode (each key → a heavily
 * detuned minor triad), EERIE SCRAPE layer (narrow band-passed detuned saws with slow tremolo — bowed metal),
 * REED rank (trumpet stop), generated CATHEDRAL space.
 * 1.1 (Hanging Tree rebuilt — the clean breathing sines did not sound like it): PIPE tone (tonewheel · principal · flute ·
 * string periodic waves per rank), single-trigger PERCUSSION (2nd/3rd harmonic click-decay), AMP (asymmetric tube drive
 * into a cabinet roll-off), ROTARY speaker (horn/drum crossover at 800 Hz, doppler + AM + pan, slow/fast/stop with
 * realistic spin-up inertia), tempo-synced PULSE tremolo (phase-locked to the beat on play, smooth or chopped). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const RATIOS = [0.5, 1.5, 1, 2, 3, 4, 5, 6, 8], FEET = ["16'", "5⅓'", "8'", "4'", "2⅔'", "2'", "1⅗'", "1⅓'", "1'"];
  const DB = FEET.map((f, i) => ({ key: 'd' + i, type: 'integer', default: [8, 0, 8, 6, 0, 4, 0, 0, 2][i], min: 0, max: 8, label: f, group: 'DRAWBARS' }));
  OrganismFactory.define({
    id: 'eravos.organ', preview: 'chord', domain: 'music', version: '1.1.0', label: 'Gothic Organ', icon: '⛪', accent: '#8a2be2', phase: 'P14',
    category: 'Genre instruments', blurb: 'Dark organ: 9 drawbars, pipe tones, percussion, tube amp, spinning rotary speaker, beat-locked pulse, gothic chords, cathedral space.',
    size: { w: 600, h: 700 }, minSize: { w: 440, h: 460 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in'],
    needs: { works_with: ['eravos.breath', 'eravos.coven', 'eravos.fx-haunt', 'eravos.timeline'] },
    hooks: [S.audio_out('organ.hook.audio_out'), S.note_in('organ.hook.note_in'), S.midi_in('organ.hook.midi_in'), S.theory_in('organ.hook.theory_in'), S.transport_in('organ.hook.transport_in'),
      Object.assign(S.mod_in('organ.hook.breath_in', 'breath'), { intent: 'breath swell from the Breath organism' })],
    config: DB.concat([
      { key: 'pipe', type: 'enum', options: ['tonewheel', 'principal', 'flute', 'string'], default: 'principal', label: 'Pipe tone', group: 'PIPES', hint: 'the wave every drawbar rank speaks with' },
      { key: 'perc', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Percussion', group: 'PIPES', hint: 'click-decay harmonic on the first key of a phrase (single trigger)' },
      { key: 'percHarm', type: 'enum', options: ['2nd', '3rd'], default: '3rd', label: 'Perc harmonic', group: 'PIPES' },
      { key: 'celeste', type: 'number', default: 7, min: 0, max: 20, step: 0.1, unit: '¢', label: 'Celeste', group: 'PIPES' },
      { key: 'chiff', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Chiff', group: 'PIPES' },
      { key: 'wind', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Wind', group: 'PIPES' },
      { key: 'reed', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Reed', group: 'PIPES', hint: 'trumpet stop' },
      { key: 'tremRate', type: 'number', default: 5.5, min: 0.5, max: 9, step: 0.01, unit: 'Hz', label: 'Trem rate', group: 'MOTION' },
      { key: 'tremDepth', type: 'number', default: 0.08, min: 0, max: 0.6, step: 0.01, label: 'Trem depth', group: 'MOTION' },
      { key: 'breathPeriod', type: 'number', default: 10, min: 4, max: 20, step: 0.1, unit: 's', label: 'Breath', group: 'MOTION' },
      { key: 'breathDepth', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Breath depth', group: 'MOTION' },
      { key: 'pulse', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Pulse', group: 'PULSE', hint: 'tempo-locked tremolo — the hypnotic throb' },
      { key: 'pulseRate', type: 'enum', options: ['1/4', '1/8', '1/8T', '1/16', '1/16T'], default: '1/8', label: 'Pulse rate', group: 'PULSE' },
      { key: 'pulseShape', type: 'enum', options: ['smooth', 'chop'], default: 'chop', label: 'Pulse shape', group: 'PULSE' },
      { key: 'drive', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Amp drive', group: 'AMP', hint: 'asymmetric tube overdrive' },
      { key: 'ampTone', type: 'number', default: 4000, min: 1200, max: 12000, step: 1, unit: 'Hz', label: 'Cabinet', group: 'AMP', hint: 'speaker roll-off while driven' },
      { key: 'rotary', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Rotary', group: 'ROTARY', hint: 'spinning speaker cabinet (horn + drum)' },
      { key: 'rotorSpeed', type: 'enum', options: ['stop', 'slow', 'fast'], default: 'slow', label: 'Rotor', group: 'ROTARY', hint: 'switching speed ramps like a real rotor' },
      { key: 'chord', type: 'boolean', default: false, label: 'Gothic chord', group: 'GOTHIC', hint: 'each key plays a heavily detuned minor triad' },
      { key: 'scrape', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Eerie scrape', group: 'GOTHIC' },
      { key: 'pedal', type: 'boolean', default: true, label: 'Pedal', group: 'GOTHIC', hint: "16' + 32' under the lowest note" },
      { key: 'space', type: 'number', default: 0.55, min: 0, max: 1, step: 0.01, label: 'Cathedral', group: 'SPACE' },
      { key: 'dark', type: 'number', default: 2600, min: 400, max: 12000, step: 1, unit: 'Hz', label: 'Darkness', group: 'SPACE' },
      { key: 'attack', type: 'number', default: 0.08, min: 0.005, max: 3, step: 0.001, unit: 's', label: 'Attack', group: 'SPACE' },
      { key: 'release', type: 'number', default: 0.6, min: 0.02, max: 6, step: 0.01, unit: 's', label: 'Release', group: 'SPACE' },
      { key: 'level', type: 'number', default: 0.6, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'SPACE' },
    ]),
    defaultPreset: 'Hanging Tree',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const t0 = ac.currentTime, node = (n) => { ctx.track(n); return n; };
      const bus = node(ac.createGain()), dark = node(ac.createBiquadFilter()), trem = node(ac.createGain()), breath = node(ac.createGain()), dry = node(ac.createGain()), out = node(ac.createGain());
      dark.type = 'lowpass'; dark.Q.value = 0.5; breath.connect(dry); dry.connect(out);
      // AMP: pre-gain → asymmetric tube shaper → cabinet (HP 70 · LP ampTone) → makeup
      const ampPre = node(ac.createGain()), shaper = node(ac.createWaveShaper()), cabHP = node(ac.createBiquadFilter()), cabLP = node(ac.createBiquadFilter()), cabMid = node(ac.createBiquadFilter()), makeup = node(ac.createGain());
      shaper.oversample = '2x'; cabHP.type = 'highpass'; cabHP.frequency.value = 70; cabLP.type = 'lowpass'; cabLP.Q.value = 0.9; cabMid.type = 'peaking'; cabMid.frequency.value = 900; cabMid.Q.value = 0.8;
      bus.connect(ampPre); ampPre.connect(shaper); shaper.connect(cabHP); cabHP.connect(cabMid); cabMid.connect(cabLP); cabLP.connect(makeup); makeup.connect(dark);
      let curveK = -1;
      function ampCurve(drv) { const k = 1 + drv * 14, bias = 0.35 * drv, n = 2048, c = new Float32Array(n); let mx = 0; for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x + bias) - Math.tanh(bias); mx = Math.max(mx, Math.abs(c[i])); } for (let i = 0; i < n; i++) c[i] /= mx; return c; } // asymmetric (even harmonics), bounded ±1
      // PULSE: tempo-locked tremolo; restarts in phase with the beat on play
      const pulseG = node(ac.createGain()), pulseD = node(ac.createGain()); dark.connect(pulseG); pulseG.connect(trem); pulseD.connect(pulseG.gain);
      const cosWave = ac.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0]));
      const chopWave = (() => { const N = 12, re = new Float32Array(N), im = new Float32Array(N); for (let k = 1; k < N; k += 2) { const sig = Math.sin(Math.PI * k / N) / (Math.PI * k / N); re[k] = 4 / Math.PI * (((k - 1) / 2) % 2 ? -1 : 1) / k * sig; } return ac.createPeriodicWave(re, im); })();
      const DIV = { '1/4': 1, '1/8': 2, '1/8T': 3, '1/16': 4, '1/16T': 6 };
      let pOsc = null;
      const pulseHz = () => (ctx.bpm || 120) / 60 * (DIV[P.get('pulseRate')] || 2);
      function pulseStart(at) { const t = Math.max(at || 0, ac.currentTime); if (pOsc) { const o = pOsc; try { o.stop(t); } catch (e) {} o.onended = () => { try { o.disconnect(); } catch (e) {} }; } pOsc = ac.createOscillator(); pOsc.setPeriodicWave(P.get('pulseShape') === 'chop' ? chopWave : cosWave); pOsc.frequency.value = pulseHz(); pOsc.connect(pulseD); pOsc.start(t); }
      pulseStart(ac.currentTime);
      ctx.onPlay((p) => pulseStart(p.time)); ctx.onBpm(() => { if (pOsc) pOsc.frequency.setTargetAtTime(pulseHz(), ac.currentTime, 0.02); });
      // ROTARY: crossover 800 Hz → drum (low) + horn (high), each doppler (moving delay) + AM + pan; speeds ramp with inertia
      const rotIn = node(ac.createGain()), rotDry = node(ac.createGain()), rotWet = node(ac.createGain()), rotOut = node(ac.createGain()); trem.connect(rotIn); rotIn.connect(rotDry); rotDry.connect(rotOut); rotWet.connect(rotOut); rotOut.connect(breath);
      function rotor(type, depthAM, depthDop, pan) {
        const x = node(ac.createBiquadFilter()); x.type = type; x.frequency.value = 800; x.Q.value = 0.6;
        const d = node(ac.createDelay(0.05)), am = node(ac.createGain()), pn = node(ac.createStereoPanner()), l = node(ac.createOscillator()), gD = node(ac.createGain()), gA = node(ac.createGain()), gP = node(ac.createGain());
        d.delayTime.value = 0.005; am.gain.value = 1 - depthAM / 2; gD.gain.value = depthDop; gA.gain.value = depthAM / 2; gP.gain.value = pan;
        rotIn.connect(x); x.connect(d); d.connect(am); am.connect(pn); pn.connect(rotWet);
        l.connect(gD); gD.connect(d.delayTime); l.connect(gA); gA.connect(am.gain); l.connect(gP); gP.connect(pn.pan); l.frequency.value = 0.8; l.start();
        return l;
      }
      const horn = rotor('highpass', 0.45, 0.0009, 0.8), drum = rotor('lowpass', 0.2, 0.0004, 0.35);
      const SPEED = { stop: [0.0001, 0.0001], slow: [0.83, 0.7], fast: [6.8, 5.9] };
      function rotorSpeed() { const [h, d] = SPEED[P.get('rotorSpeed')] || SPEED.slow, t = ac.currentTime; horn.frequency.setTargetAtTime(h, t, 0.45); drum.frequency.setTargetAtTime(d, t, 1.6); }
      function applyAmp() {
        const drv = P.get('drive'), t = ac.currentTime;
        if (drv <= 0.001) { shaper.curve = null; curveK = -1; } else if (Math.abs(drv - curveK) > 0.005) { shaper.curve = ampCurve(drv); curveK = drv; }
        ampPre.gain.setTargetAtTime(1 + drv * 3, t, 0.03); makeup.gain.setTargetAtTime(drv > 0.001 ? 0.55 / (1 + drv * 0.6) : 1, t, 0.03);
        cabLP.frequency.setTargetAtTime(drv > 0.001 ? P.get('ampTone') : 20000, t, 0.03); cabMid.gain.setTargetAtTime(drv * 4, t, 0.03);
        const pd = P.get('pulse'); pulseG.gain.setTargetAtTime(1 - pd / 2, t, 0.02); pulseD.gain.setTargetAtTime(pd / 2, t, 0.02);
        const rm = P.get('rotary'); dsp.setSmooth(rotDry.gain, 1 - rm, ac); dsp.setSmooth(rotWet.gain, rm * 1.1, ac);
      }
      const tLfo = node(ac.createOscillator()), tG = node(ac.createGain()); tLfo.connect(tG); tG.connect(trem.gain); tLfo.start();
      const bLfo = node(ac.createOscillator()), bG = node(ac.createGain()); bLfo.connect(bG); bG.connect(breath.gain); bLfo.start();
      const breathMod = ctx.modBus('breath', { min: -1, max: 1 }); breathMod.connect(breath.gain);
      // cathedral
      const conv = node(ac.createConvolver()), wet = node(ac.createGain()), pre = node(ac.createDelay(0.2)); pre.delayTime.value = 0.045; breath.connect(pre); pre.connect(conv); conv.connect(wet); wet.connect(out);
      { const n = Math.floor(ac.sampleRate * 7), b = ac.createBuffer(2, n, ac.sampleRate), r = dsp.mulberry32(1313); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += ((r() * 2 - 1) - lp) * (0.5 - 0.42 * t); d[i] = lp * Math.pow(1 - t, 1.6); } } conv.buffer = b; }
      // wind (shared, gated by held keys)
      const wSrc = node(dsp.noiseSource(ac, 'pink')), wLP = node(ac.createBiquadFilter()), wG = node(ac.createGain()); wLP.type = 'lowpass'; wLP.frequency.value = 900; wG.gain.value = 0; wSrc.connect(wLP); wLP.connect(wG); wG.connect(trem); wSrc.start();
      const level = node(ac.createGain()); out.connect(level);
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'organ', tail: 7.5 });
      function apply() {
        const t = ac.currentTime; dark.frequency.setTargetAtTime(P.get('dark'), t, 0.05);
        tLfo.frequency.setTargetAtTime(P.get('tremRate'), t, 0.05); tG.gain.setTargetAtTime(P.get('tremDepth') / 2, t, 0.05); trem.gain.setTargetAtTime(1 - P.get('tremDepth') / 2, t, 0.05);
        bLfo.frequency.setTargetAtTime(1 / P.get('breathPeriod'), t, 0.05); bG.gain.setTargetAtTime(P.get('breathDepth') / 2, t, 0.05); breath.gain.setTargetAtTime(1 - P.get('breathDepth') / 2, t, 0.05);
        dsp.setSmooth(wet.gain, P.get('space') * 0.9, ac); dsp.setSmooth(dry.gain, 1 - P.get('space') * 0.35, ac); dsp.setSmooth(level.gain, P.get('level'), ac);
        updateWind(); applyAmp();
      }
      const voices = []; let pedalV = null;
      function updateWind() { const n = voices.filter(v => v.off === Infinity).length; dsp.setSmooth(wG.gain, P.get('wind') * 0.05 * Math.min(3, n), ac, 0.15); }
      const PIPES = { principal: [1, 0.38, 0.17, 0.09, 0.05, 0.03], flute: [1, 0.08, 0.12, 0.02], string: [1, 0.55, 0.42, 0.32, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08] };
      const WAVES = {}; Object.keys(PIPES).forEach(k => { const h = PIPES[k], re = new Float32Array(h.length + 1), im = new Float32Array(h.length + 1); h.forEach((a, i) => { im[i + 1] = a; }); WAVES[k] = ac.createPeriodicWave(re, im); });
      function rank(f, nodes, dst, t) {
        const cel = P.get('celeste'), parts = [];
        for (let i = 0; i < 9; i++) { const lv = P.get('d' + i); if (!lv) continue; const fr = f * RATIOS[i]; if (fr > ac.sampleRate * 0.45) continue; const o = ac.createOscillator(); const pw = WAVES[P.get('pipe')]; if (pw && fr * 10 < ac.sampleRate * 0.45) o.setPeriodicWave(pw); o.frequency.value = fr; o.detune.value = (i % 2 ? -1 : 1) * cel * (i === 2 ? 1 : 0.7); const g = ac.createGain(); g.gain.value = Math.pow(lv / 8, 1.5) * 0.11; o.connect(g); g.connect(dst); o.start(t); nodes.push(o, g); parts.push(o); }
        const rd = P.get('reed'); if (rd > 0) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(6000, f * 5); bp.Q.value = 1.2; const g = ac.createGain(); g.gain.value = rd * 0.12; o.connect(bp); bp.connect(g); g.connect(dst); o.start(t); nodes.push(o, bp, g); }
        const sc = P.get('scrape'); if (sc > 0) [1, 1.003, 0.997].forEach((k, j) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * 2 * k; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2 * k; bp.Q.value = 8; const g = ac.createGain(); g.gain.value = sc * 0.07; const tr = ac.createOscillator(), trg = ac.createGain(); tr.frequency.value = 0.6 + j * 0.15; trg.gain.value = sc * 0.03; tr.connect(trg); trg.connect(g.gain); o.connect(bp); bp.connect(g); g.connect(dst); o.start(t); tr.start(t); nodes.push(o, bp, g, tr, trg); });
        return parts;
      }
      function noteOn(note, vel, t, dur) {
        t = Math.max(t || ac.currentTime, ac.currentTime);
        while (voices.length >= 6) kill(voices[0], t);
        const f = MT.hz(note), nodes = [], env = ac.createGain(); env.gain.value = 0; env.connect(bus); nodes.push(env);
        const freqs = P.get('chord') ? [[1, 0], [1.189, -12], [1.189, 12], [1.498, 0], [1.498, -12], [1, 12]].map(([k, c]) => f * k * Math.pow(2, c / 1200)) : [f];
        freqs.forEach((ff, i) => rank(ff, nodes, env, t));
        const pc = P.get('perc'); if (pc > 0 && !voices.some(v => v.off === Infinity && v.t < t)) { const po = ac.createOscillator(), pg = ac.createGain(); po.frequency.value = f * (P.get('percHarm') === '2nd' ? 2 : 3); pg.gain.setValueAtTime(0, t); pg.gain.linearRampToValueAtTime(pc * 0.22 * vel, t + 0.002); pg.gain.setTargetAtTime(0, t + 0.002, 0.09); po.connect(pg); pg.connect(bus); po.start(t); po.stop(t + 0.7); nodes.push(po, pg); }
        const ch = P.get('chiff'); if (ch > 0) { const n = ac.createBufferSource(); n.buffer = dsp.noise(ac, 2, 'white'); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(9000, f * 4); bp.Q.value = 3; const g = ac.createGain(); g.gain.setValueAtTime(ch * 0.25 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); n.connect(bp); bp.connect(g); g.connect(bus); n.start(t, Math.random()); n.stop(t + 0.1); nodes.push(n, bp, g); }
        const peak = (0.4 + 0.6 * vel) / Math.sqrt(freqs.length);
        env.gain.setValueAtTime(0, t); env.gain.setTargetAtTime(peak, t, Math.max(0.002, P.get('attack') / 3));
        const v = { note, env, nodes, off: Infinity, t }; voices.push(v);
        if (dur !== undefined) release(v, t + dur);
        updatePedal(t); updateWind();
        return v;
      }
      function release(v, t) { if (v.off !== Infinity) return; v.off = t; const R = P.get('release'); dsp.release(v.env.gain, t, R); v.nodes.forEach(n => { if (n.stop) try { n.stop(t + R * 1.7 + 0.1); } catch (e) {} }); const last = v.nodes.filter(n => n.stop).pop(); const done = () => { v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); updatePedal(ac.currentTime); updateWind(); }; if (last) last.onended = done; else done(); setTimeout(() => { updatePedal(ac.currentTime); updateWind(); }, Math.max(0, (t - ac.currentTime) * 1000) + 5); }
      function kill(v, t) { const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); v.env.gain.cancelScheduledValues(t); v.env.gain.setTargetAtTime(0, t, 0.01); v.nodes.forEach(n => { if (n.stop) try { n.stop(t + 0.08); } catch (e) {} }); }
      function updatePedal(t) {
        const held = voices.filter(v => v.off === Infinity || v.off > ac.currentTime + 0.01), low = held.length && P.get('pedal') ? Math.min(...held.map(v => v.note)) : null;
        if (pedalV && pedalV.note === low) return;
        if (pedalV) { const p = pedalV; pedalV = null; p.g.gain.setTargetAtTime(0, t, P.get('release') / 3); p.o.forEach(o => o.stop(t + P.get('release') * 1.7 + 0.1)); p.o[0].onended = () => { p.o.forEach(o => { try { o.disconnect(); } catch (e) {} }); try { p.g.disconnect(); } catch (e) {} }; }
        if (low === null) return;
        const f = MT.hz(low), g = ac.createGain(); g.gain.value = 0; g.connect(bus); const o = [0.5, 0.25].map((k, i) => { const x = ac.createOscillator(); x.frequency.value = f * k; const xg = ac.createGain(); xg.gain.value = i ? 0.12 : 0.18; x.connect(xg); xg.connect(g); x.start(t); return x; });
        g.gain.setTargetAtTime(1, t, Math.max(0.01, P.get('attack') / 2)); pedalV = { note: low, g, o };
      }
      ['dark', 'tremRate', 'tremDepth', 'breathPeriod', 'breathDepth', 'space', 'level', 'wind'].forEach(k => P.onChange(k, apply)); ['drive', 'ampTone', 'pulse', 'rotary'].forEach(k => P.onChange(k, applyAmp)); P.onChange('rotorSpeed', rotorSpeed); ['pulseRate', 'pulseShape'].forEach(k => P.onChange(k, () => pulseStart(ac.currentTime))); rotorSpeed(); P.onChange('pedal', () => updatePedal(ac.currentTime)); apply();
      // 3.39: with Amp drive on, the whole organ passes the 2x shaper (128 samples) — notes start that much early (off: no shaper)
      Object.defineProperty(ctx, 'latency', { get: () => P.get('drive') > 0.001 ? dsp.osLatency(ac, '2x') : 0, configurable: true });
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity); else voices.filter(v => v.note === p.note && v.off === Infinity).forEach(v => release(v, ac.currentTime)); });
      ctx.audition = (p) => noteOn(p.note || 45, p.velocity || 0.8, ac.currentTime, p.duration || 3);
      ctx.auditionOff = (p) => voices.filter(v => v.note === (p.note || 45) && v.off === Infinity).forEach(v => release(v, ac.currentTime));
      ctx.breathPhase = () => ((ac.currentTime - t0) / P.get('breathPeriod')) % 1;
      ctx.internals = { bus, dry, out, level, ampPre, shaper, cabHP, cabMid, cabLP, makeup, dark, pulseG, trem, rotIn, rotDry, rotOut, voices, breath, horn, drum, shaper, get pulse() { return pOsc; }, get pedal() { return pedalV; } };
      ctx.onDispose(() => voices.slice().forEach(v => kill(v, ac.currentTime)));
      return {};
    },
  });
})();
