/* eravos.syn-osc 1.0.0 — Morph Osc (P44 · synthesis) · spec eravos.organism.syn-osc
 * A small oscillator built to be combined. Per voice: unison oscillators, each a bank of 6 wavetables (PeriodicWaves,
 * RMS-matched) crossfaded by MORPH — the crossfade windows are WaveShapers on one shared morph signal, so morph moves
 * sample-accurately under modulation (wire an Envelope or an LFO into it) at no per-voice cost.
 * Its two audio INPUTS are how small tools combine into bigger sounds:
 *   FM in   — any sound wired here bends every voice's pitch, scaled by FM index × the voice's own frequency
 *             (so FM stays in tune over the keyboard): Morph Osc → Morph Osc = 2-operator FM, chain three for 3-op
 *   RING in — any sound wired here multiplies the output (ring / AM by Ring amount)
 * FOLLOW (links): while this tool's output is wired into other tools, it also plays the notes those tools are sent —
 * pitch × Ratio. Wire a Morph Osc into another's FM in, play the second: the first follows as its modulator. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const NT = 6, H = 48;   // tables per bank · harmonics per table
  // FM input sensitivity: a Morph Osc at Level 1 peaks at 0.707 · 0.6 — that much input = exactly FM index (deviation = index · f)
  const FM_SENS = 1 / (Math.SQRT1_2 * 0.6);
  const harm = (fn) => { const a = new Float32Array(H + 1); for (let k = 1; k <= H; k++) a[k] = fn(k); return a; };
  const formant = (centers) => harm(k => centers.reduce((s, [c, w, g]) => s + g * Math.exp(-((k - c) * (k - c)) / (2 * w * w)), 0) / Math.pow(k, 0.35));
  // each bank: 6 harmonic spectra (sine amplitudes, k = 1..48), morphed left → right
  const BANKS = {
    analog: [harm(k => k === 1 ? 1 : 0), harm(k => k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / (k * k) : 0), harm(k => 1 / k), harm(k => k % 2 ? 1 / k : 0),
      harm(k => Math.sin(Math.PI * k * 0.25) / k), harm(k => Math.sin(Math.PI * k * 0.1) / k)],
    vocal: [formant([[1, 0.6, 1], [3, 0.8, 0.3]]), formant([[2, 0.8, 1], [4, 1, 0.5]]), formant([[3, 1, 1], [5, 1, 0.7]]), formant([[2, 0.7, 1], [8, 1.5, 0.6]]),
      formant([[1, 0.6, 1], [10, 2, 0.5], [14, 2, 0.3]]), formant([[1, 0.6, 0.8], [12, 2.5, 0.7], [18, 3, 0.4]])],
    digital: [harm(k => k === 1 ? 1 : k === 2 ? 0.5 : 0), harm(k => Math.exp(-((k - 6) ** 2) / 6) + (k === 1 ? 0.6 : 0)), harm(k => k % 3 === 0 ? 1 / Math.sqrt(k) : k === 1 ? 1 : 0),
      harm(k => (k % 2 ? 1 : 0.15) / Math.sqrt(k)), harm(k => Math.exp(-((k - 16) ** 2) / 20) + (k === 1 ? 0.5 : 0)), harm(k => ((k * 2654435761) % 1000) / 1000 / Math.sqrt(k))],
    organ: [harm(k => [0, 1, 0.6, 0, 0.4][k] || 0), harm(k => [0, 1, 0, 0.7, 0, 0, 0, 0, 0.5][k] || 0), harm(k => [0, 1, 0.8, 0.6, 0.5, 0, 0.4, 0, 0.3][k] || 0),
      harm(k => k <= 8 ? 0.7 / Math.sqrt(k) : 0), harm(k => [1, 2, 3, 4, 6, 8, 10, 12, 16].includes(k) ? 0.6 : 0), harm(k => k <= 16 ? 1 / Math.sqrt(k) : 0)],
  };
  const tableCache = new WeakMap();
  function tables(ac, bank) {
    let m = tableCache.get(ac); if (!m) { m = {}; tableCache.set(ac, m); }
    if (m[bank]) return m[bank];
    m[bank] = (BANKS[bank] || BANKS.analog).map(a => {
      // RMS-match every table (sum of squares of sine amplitudes / 2) so morphing never jumps in level
      let e = 0; for (let k = 1; k <= H; k++) e += a[k] * a[k];
      const g = 0.5 / Math.sqrt(Math.max(1e-9, e / 2)), re = new Float32Array(H + 1), im = new Float32Array(H + 1);
      for (let k = 1; k <= H; k++) im[k] = a[k] * g;
      return ac.createPeriodicWave(re, im, { disableNormalization: true });
    });
    return m[bank];
  }
  // triangular crossfade window k of N on the shared morph signal (−1..1 ↔ morph 0..1); its ends hold
  function windowCurve(k) { const n = 1025, c = new Float32Array(n); for (let i = 0; i < n; i++) { const m = (i / (n - 1)) * (NT - 1); c[i] = Math.max(0, 1 - Math.abs(m - k)); } return c; }

  OrganismFactory.define({
    id: 'eravos.syn-osc', domain: 'music', version: '1.0.0', label: 'Morph Osc', icon: '🌀', accent: '#3ad6c4', phase: 'P44',
    category: 'Synthesis', blurb: 'Wavetable oscillator that morphs. Wire sounds into its FM / Ring inputs, or wire it into another Morph Osc to make FM.',
    size: { w: 560, h: 560 }, minSize: { w: 420, h: 380 },
    // its suite (canvas/runtime/tool-page.js)
    suite: { label: 'Morph voice', blurb: 'A second Morph Osc into its FM input, an Envelope scanning the morph on every note, and an Echo after it.',
      members: [
        { tool: 'eravos.syn-osc', as: 'linked', preset: 'FM Modulator ×2 (wire into FM in)', wire: { from: ['self', 'mosc.hook.audio_out'], to: ['host', 'mosc.hook.fm_in'] }, why: 'its FM modulator — follows its notes ×2' },
        { tool: 'eravos.syn-env', as: 'linked', preset: 'Morph Scan', wire: { from: ['self', 'env.hook.mod_out'], to: ['host', 'mosc.hook.mod_morph'] }, why: 'every note scans the wavetable' },
        { tool: 'eravos.fx-echo', as: 'linked', preset: 'Ping-pong 1/8.', wire: { from: ['host', 'mosc.hook.audio_out'], to: ['self', 'fx.hook.audio_in'] }, why: 'space after it' },
      ] },
    permissions: ['audio_out', 'audio_in', 'midi_in', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.oscillator'],
    noMod: true,   // it makes sound from notes; as a mod inside an effect it would just go quiet
    hooks: [
      S.audio_out('mosc.hook.audio_out'), S.note_in('mosc.hook.note_in'), S.midi_in('mosc.hook.midi_in'),
      Object.assign(S.audio_in('mosc.hook.fm_in', 'fm'), { label: 'fm in', intent: 'a sound that bends this one’s pitch (FM)' }),
      Object.assign(S.audio_in('mosc.hook.ring_in', 'ring'), { label: 'ring in', intent: 'a sound this one is multiplied by (ring / AM)' }),
      S.mod_in('mosc.hook.mod_morph', 'morph'), S.mod_in('mosc.hook.mod_pitch', 'pitch'), S.mod_in('mosc.hook.mod_fm', 'fmIndex'),
    ],
    face: ['bank', 'morph', 'fmIndex', 'ratio', 'unison', 'level'],
    links: [
      { with: 'eravos.syn-osc', dir: 'in', face: ['bank', 'morph', 'ratio', 'fine', 'level'], hint: 'feeds this one — as its FM modulator it follows these notes × its Ratio' },
      { with: 'eravos.syn-env', dir: 'in', face: ['attack', 'decay', 'sustain', 'release', 'depth'], hint: 'the envelope shaping this one' },
    ],
    config: [
      { key: 'bank', type: 'enum', options: Object.keys(BANKS), default: 'analog', label: 'Tables', group: 'WAVE', hint: 'analog: sine → triangle → saw → square → pulses · vocal: u → o → a → e → i · digital · organ' },
      { key: 'morph', type: 'number', default: 0.4, min: 0, max: 1, step: 0.001, label: 'Morph', group: 'WAVE' },
      { key: 'octave', type: 'integer', default: 0, min: -4, max: 4, label: 'Octave', group: 'PITCH' },
      { key: 'ratio', type: 'enum', options: ['0.25', '0.5', '0.75', '1', '1.414', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '11', '13'], default: '1', label: 'Ratio', group: 'PITCH', hint: 'pitch × this — a modulator at 2 or 3 growls, 1.5 / 3.5 / 7 ring like metal' },
      { key: 'fine', type: 'number', default: 0, min: -100, max: 100, step: 1, unit: 'c', label: 'Fine', group: 'PITCH' },
      { key: 'glide', type: 'number', default: 0, min: 0, max: 4, step: 0.001, unit: 's', label: 'Glide', group: 'PITCH' },
      { key: 'unison', type: 'integer', default: 1, min: 1, max: 8, label: 'Unison', group: 'UNISON' },
      { key: 'detune', type: 'number', default: 12, min: 0, max: 50, step: 0.1, unit: 'c', label: 'Detune', group: 'UNISON' },
      { key: 'width', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Width', group: 'UNISON' },
      { key: 'fmIndex', type: 'number', default: 1, min: 0, max: 32, step: 0.01, label: 'FM index', group: 'INPUTS', hint: 'how far a sound wired into FM in bends the pitch' },
      { key: 'ring', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Ring', group: 'INPUTS', hint: 'how much a sound wired into Ring in multiplies this one' },
      { key: 'follow', type: 'boolean', default: true, label: 'Follow', group: 'INPUTS', hint: 'also play the notes of the tools this one is wired into (as a modulator)' },
      { key: 'attack', type: 'number', default: 0.005, min: 0.001, max: 4, step: 0.001, unit: 's', label: 'Attack', group: 'AMP' },
      { key: 'decay', type: 'number', default: 0.3, min: 0.01, max: 6, step: 0.01, unit: 's', label: 'Decay', group: 'AMP' },
      { key: 'sustain', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'AMP' },
      { key: 'release', type: 'number', default: 0.25, min: 0.01, max: 8, step: 0.01, unit: 's', label: 'Release', group: 'AMP' },
      { key: 'velocity', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Velocity', group: 'AMP', hint: 'how much playing harder plays louder' },
      { key: 'level', type: 'number', default: 0.7, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'AMP' },
    ],
    defaultPreset: 'Morph Lead',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory, K = ctx.K, MAXV = 8;
      const T = (n) => { ctx.track(n); return n; };
      const out = T(ac.createGain()), ringVca = T(ac.createGain()), sum = T(ac.createGain()), level = T(ac.createGain());
      sum.connect(ringVca); ringVca.connect(level); level.connect(out); level.gain.value = P.get('level') * 0.6;
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'morph osc' });
      // inputs: FM (shared → per-voice depth) and RING (multiplies the sum: gain = 1 − amt + amt·ring)
      const fmIn = T(ac.createGain()), ringIn = T(ac.createGain()), ringAmt = T(ac.createGain());
      fmIn.channelCount = 1; fmIn.channelCountMode = 'explicit'; ringIn.channelCount = 1; ringIn.channelCountMode = 'explicit';
      ctx.port('fm', { kind: 'audio', direction: 'in', node: fmIn, label: 'fm in' });
      ctx.port('ring', { kind: 'audio', direction: 'in', node: ringIn, label: 'ring in' });
      ringIn.connect(ringAmt); ringAmt.connect(ringVca.gain);
      const wired = (port) => K.wires.list().some(w => w.dst.instanceId === ctx.id && w.dst.hookId === 'mosc.hook.' + port + '_in');
      function ringGain() { const on = wired('ring'), a = on ? P.get('ring') : 0; ringVca.gain.setTargetAtTime(1 - a, ac.currentTime, 0.01); ringAmt.gain.setTargetAtTime(a, ac.currentTime, 0.01); }
      // MORPH: one shared signal (−1..1) → 6 window shapers → every oscillator's table gain
      const morphSrc = T(ac.createConstantSource()); morphSrc.offset.value = P.get('morph') * 2 - 1; morphSrc.start();
      const morphSum = T(ac.createGain()); morphSrc.connect(morphSum);
      const morphMod = ctx.modBus('morph', { min: -1, max: 1 }); morphMod.connect(morphSum);
      const windows = []; for (let k = 0; k < NT; k++) { const w = T(ac.createWaveShaper()); w.curve = windowCurve(k); morphSum.connect(w); windows.push(w); }
      const pitchMod = ctx.modBus('pitch', { min: -1200, max: 1200 }), fmMod = ctx.modBus('fmIndex', { min: -8, max: 8 });
      let bank = tables(ac, P.get('bank'));
      const voices = [];
      const ratio = () => +P.get('ratio') || 1;
      const hzOf = (note) => MT.hz(note + 12 * P.get('octave')) * ratio() * Math.pow(2, P.get('fine') / 1200);

      function makeVoice(note, vel, t) {
        const f = hzOf(note), n = P.get('unison'), det = P.get('detune'), wd = P.get('width');
        // the oscillators carry the note's frequency themselves; hz carries only what moves it (glide, FM) — an oscillator
        // fed its WHOLE frequency by a node starting mid-block stays silent until the next 128-sample block (1.3 ms late)
        const hz = ac.createConstantSource(); hz.offset.value = 0; hz.start(t);
        const fmG = ac.createGain(); fmG.gain.value = P.get('fmIndex') * f * FM_SENS; fmIn.connect(fmG); fmG.connect(hz.offset);
        const fmModG = ac.createGain(); fmModG.gain.value = f * FM_SENS; fmIn.connect(fmModG);   // FM index modulation: (index + mod) · f · input
        const fmVca = ac.createGain(); fmVca.gain.value = 0; fmModG.connect(fmVca); fmMod.connect(fmVca.gain); fmVca.connect(hz.offset);
        const amp = ac.createGain(); amp.gain.value = 0;
        const merge = ac.createChannelMerger(2), oscs = [], gains = [], wPitch = ctx.modWired('pitch');   // gate P: only a wired pitch input makes detune a-rate
        for (let u = 0; u < n; u++) {
          const x = n === 1 ? 0 : (u / (n - 1)) * 2 - 1, th = (x * wd + 1) * Math.PI / 4, lv = 1 / Math.sqrt(n);
          const gL = ac.createGain(), gR = ac.createGain(); gL.gain.value = lv * Math.cos(th) * Math.SQRT2; gR.gain.value = lv * Math.sin(th) * Math.SQRT2;
          gL.connect(merge, 0, 0); gR.connect(merge, 0, 1);
          const ph = Math.random() * 0.01;
          for (let k = 0; k < NT; k++) {
            const o = ac.createOscillator(); o.setPeriodicWave(bank[k]); o.frequency.value = f; o.detune.value = x * det;
            hz.connect(o.frequency); if (wPitch) pitchMod.connect(o.detune);
            const g = ac.createGain(); g.gain.value = 0; windows[k].connect(g.gain); gains.push([k, g]);
            o.connect(g); g.connect(gL); g.connect(gR); o.start(t, ph); oscs.push(o);
          }
        }
        merge.connect(amp); amp.connect(sum);
        const peak = (1 - P.get('velocity')) + P.get('velocity') * vel, A = P.get('attack'), D = P.get('decay'), Sus = P.get('sustain');
        amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(peak, t + A); amp.gain.setTargetAtTime(peak * Sus, t + A, D / 3);
        const v = { note, f, hz, fmG, fmModG, fmVca, amp, oscs, gains, wPitch, start: t, released: false, end: Infinity };
        voices.push(v); return v;
      }
      function release(v, t) {
        if (v.released) return; v.released = true; v.relT = t;
        const R = P.get('release'); const g = v.amp.gain;
        if (typeof g.cancelAndHoldAtTime === 'function') g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
        g.setTargetAtTime(0, t, R / 4); v.end = t + R * 1.6 + 0.05;
        v.oscs.forEach(o => { try { o.stop(v.end); } catch (e) {} }); try { v.hz.stop(v.end); } catch (e) {}
        ctx.atAudioTime(v.end + 0.1, () => cleanup(v));
      }
      function kill(v, t) { const g = v.amp.gain; g.cancelScheduledValues(t); g.setTargetAtTime(0, t, 0.004); v.released = true; v.end = t + 0.03; v.oscs.forEach(o => { try { o.stop(t + 0.03); } catch (e) {} }); try { v.hz.stop(t + 0.03); } catch (e) {} ctx.atAudioTime(t + 0.08, () => cleanup(v)); }
      function cleanup(v) {
        const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1);
        try { fmIn.disconnect(v.fmG); fmIn.disconnect(v.fmModG); fmMod.disconnect(v.fmVca.gain); } catch (e) {}
        v.gains.forEach(([k, g]) => { try { windows[k].disconnect(g.gain); } catch (e) {} });
        v.oscs.forEach(o => { try { o.disconnect(); if (v.wPitch) pitchMod.disconnect(o.detune); } catch (e) {} }); try { v.amp.disconnect(); v.hz.disconnect(); } catch (e) {}
        ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) });
      }
      function noteOn(note, vel, t, dur) {
        t = Math.max(t, ac.currentTime);
        const live = voices.filter(v => v.end > t);
        if (live.length >= MAXV) { const victim = live.filter(v => v.released).sort((a, b) => a.relT - b.relT)[0] || live.sort((a, b) => a.start - b.start)[0]; const i = voices.indexOf(victim); voices.splice(i, 1); kill(victim, t); }
        const gl = P.get('glide'), prev = voices.filter(v => !v.released).slice(-1)[0];
        const v = makeVoice(note, vel, t);
        if (gl > 0 && prev) { const f = hzOf(note), f0 = hzOf(prev.note); v.hz.offset.setValueAtTime(f0 - f, t); v.hz.offset.linearRampToValueAtTime(0, t + gl); }
        if (dur !== undefined) release(v, t + Math.max(0.01, dur));
        ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) });
        return v;
      }
      function noteOff(note, t) { t = Math.max(t || ac.currentTime, ac.currentTime); voices.filter(v => v.note === note && !v.released).forEach(v => release(v, t)); }
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration === undefined ? 0.25 : p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note); });
      ctx.audition = (p) => noteOn(p.note || 57, p.velocity || 0.85, ac.currentTime, p.duration || 0.6);
      ctx.auditionOff = (p) => noteOff(p.note);
      // FOLLOW: the notes of the tools this one feeds (its out links) — as a modulator it plays along, × Ratio
      let followed = new Set();
      ctx.onLinks((links) => { followed = new Set(links.filter(l => l.dir === 'out').map(l => l.peer)); ringGain(); });
      ctx.on('note:trigger', null, (p) => {
        if (!P.get('follow') || !p || !followed.has(p.target) || typeof p.note !== 'number') return;
        noteOn(p.note, typeof p.velocity === 'number' ? p.velocity : 0.8, typeof p.time === 'number' ? p.time : ac.currentTime, typeof p.duration === 'number' ? p.duration : 0.25);
      });
      P.onChange('morph', (v) => morphSrc.offset.setTargetAtTime(v * 2 - 1, ac.currentTime, 0.01));
      P.onChange('level', (v) => level.gain.setTargetAtTime(v * 0.6, ac.currentTime, 0.01));
      P.onChange('ring', ringGain);
      P.onChange('bank', (b) => { bank = tables(ac, b); voices.forEach(v => { let i = 0; v.oscs.forEach(o => o.setPeriodicWave(bank[i++ % NT])); }); });
      P.onChange('fmIndex', (x) => voices.forEach(v => v.fmG.gain.setTargetAtTime(x * v.f * FM_SENS, ac.currentTime, 0.01)));
      ctx.internals = { voices, windows, fmIn, ringIn, banks: () => Object.keys(BANKS) };
      return { unmount() { voices.slice().forEach(v => kill(v, ac.currentTime)); } };
    },
    tables: { BANKS, NT, H },   // the UI draws the morphed wave from the same spectra
  });
})();
