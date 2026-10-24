/* eravos.sub-engine 1.0.0 — Deep Sub · spec eravos.organism.sub-engine
 * Bass you feel AND hear. A clean mono sub (sine ↔ triangle ↔ rounded square) with an 808 pitch-drop envelope and
 * legato glide, kept pure below; above it, PHANTOM harmonics: the sub is folded into its 2nd–5th harmonics and
 * band-limited to 90–600 Hz, so the ear rebuilds the missing fundamental on phones and laptop speakers
 * (psychoacoustic bass). Transient click for definition, warm drive on a separate band, infrasonic floor + DC block. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.sub-engine', preview: 'bass', domain: 'music', version: '1.0.0', label: 'Deep Sub', icon: '◉', accent: '#7a5cff', phase: 'P14',
    category: 'Bass', blurb: 'The deepest bass: pure mono sub, 808 drops and slides, plus phantom harmonics so it is heard even on a phone.',
    size: { w: 520, h: 520 }, minSize: { w: 420, h: 400 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.bass'],
    needs: { works_with: ['eravos.sidechain-compressor', 'eravos.sequencer', 'eravos.timeline', 'eravos.reese-bass'] },
    hooks: [S.audio_out('sub.hook.audio_out'), S.note_in('sub.hook.note_in'), S.midi_in('sub.hook.midi_in'), S.theory_in('sub.hook.theory_in'), S.mod_in('sub.hook.mod_phantom', 'phantom'), S.mod_in('sub.hook.mod_level', 'level')],
    config: [
      { key: 'shape', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01, label: 'Shape', group: 'SUB', hint: '0 sine · 0.5 triangle · 1 rounded square' },
      { key: 'octave', type: 'integer', default: -2, min: -4, max: 1, label: 'Octave', group: 'SUB' },
      { key: 'floor', type: 'number', default: 24, min: 12, max: 45, step: 1, unit: 'Hz', label: 'Floor', group: 'SUB', hint: 'infrasonic cut — protects speakers' },
      { key: 'drop', type: 'number', default: 0, min: 0, max: 36, step: 0.5, unit: 'st', label: 'Drop', group: 'PITCH', hint: '808 punch: start this far above and fall' },
      { key: 'dropTime', type: 'number', default: 0.06, min: 0.005, max: 2, step: 0.001, unit: 's', label: 'Drop time', group: 'PITCH' },
      { key: 'glide', type: 'number', default: 0.08, min: 0, max: 1.5, step: 0.001, unit: 's', label: 'Glide', group: 'PITCH', hint: 'legato notes slide (808 slides)' },
      { key: 'phantom', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Phantom', group: 'TONE', hint: 'harmonics that make the sub audible on small speakers' },
      { key: 'drive', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01, label: 'Warmth', group: 'TONE' },
      { key: 'click', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Click', group: 'TONE' },
      { key: 'tone', type: 'number', default: 900, min: 120, max: 4000, step: 1, unit: 'Hz', label: 'Tone', group: 'TONE' },
      { key: 'attack', type: 'number', default: 0.004, min: 0.001, max: 1, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'decay', type: 'number', default: 0.8, min: 0.02, max: 6, step: 0.01, unit: 's', label: 'Decay', group: 'ENV' },
      { key: 'sustain', type: 'number', default: 0.85, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'ENV' },
      { key: 'release', type: 'number', default: 0.18, min: 0.01, max: 4, step: 0.01, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'level', type: 'number', default: 0.8, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    defaultPreset: 'Deep Sine',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const sine = ac.createOscillator(), tri = ac.createOscillator(), sq = ac.createOscillator(); sine.type = 'sine'; tri.type = 'triangle'; sq.type = 'square';
      const gS = ac.createGain(), gT = ac.createGain(), gQ = ac.createGain(), sqLP = ac.createBiquadFilter(); sqLP.type = 'lowpass'; sqLP.Q.value = 0.5;
      const sum = ac.createGain(); sine.connect(gS); tri.connect(gT); sq.connect(sqLP); sqLP.connect(gQ); [gS, gT, gQ].forEach(g => g.connect(sum));
      [sine, tri, sq].forEach(o => { o.frequency.value = 55; o.start(); ctx.track(o); });
      // pure band
      const amp = ac.createGain(); amp.gain.value = 0; sum.connect(amp);
      const pureLP = ac.createBiquadFilter(); pureLP.type = 'lowpass'; pureLP.frequency.value = 180; pureLP.Q.value = 0.5;
      const warm = ac.createWaveShaper(); warm.oversample = '2x';
      // phantom band: rectify-fold the sub → harmonics 2..5, keep 90–600 Hz
      const ph = ac.createWaveShaper(); ph.oversample = '4x';
      { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = 0.6 * Math.abs(x) + 0.4 * Math.tanh(3 * x * x * x); } ph.curve = c; } // f(0) = 0: silence in → silence out
      const phHP = ac.createBiquadFilter(), phLP = ac.createBiquadFilter(), phG = ac.createGain(); phHP.type = 'highpass'; phHP.frequency.value = 90; phLP.type = 'lowpass'; phLP.frequency.value = 600; phHP.Q.value = phLP.Q.value = 0.7;
      const phMod = ctx.modBus('phantom', { min: -1, max: 1 }); phMod.connect(phG.gain);
      // 3.39 alignment: pure (2x = 128 samples), phantom (4x = 192) and click (0) were summed out of time — the pure band and
      // its own harmonics 64 samples apart, the click 4 ms ahead of the body. All three now land at 192; notes start 192 early.
      const OS2 = dsp.osLatency(ac, '2x'), OS4 = dsp.osLatency(ac, '4x'), warmAl = ac.createDelay(0.05), clickAl = ac.createDelay(0.05);
      warmAl.delayTime.value = OS4 - OS2; clickAl.delayTime.value = OS4; ctx.track(warmAl); ctx.track(clickAl); ctx.latency = OS4;
      amp.connect(warm); warm.connect(warmAl); warmAl.connect(pureLP);
      amp.connect(ph); ph.connect(phHP); phHP.connect(phLP); phLP.connect(phG);
      // click
      const clickG = ac.createGain(); clickG.gain.value = 0;
      const out = ac.createGain(), floor = ac.createBiquadFilter(), toneLP = ac.createBiquadFilter(), level = ac.createGain();
      floor.type = 'highpass'; floor.Q.value = 0.707; toneLP.type = 'lowpass'; toneLP.Q.value = 0.5;
      pureLP.connect(out); phG.connect(out); clickG.connect(clickAl); clickAl.connect(out); out.connect(floor); floor.connect(toneLP); toneLP.connect(level);
      const levMod = ctx.modBus('level', { min: 0, max: 1.5 }); levMod.connect(level.gain);
      [gS, gT, gQ, sqLP, sum, amp, pureLP, warm, ph, phHP, phLP, phG, clickG, out, floor, toneLP, level].forEach(n => ctx.track(n));
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'sub' });
      function apply() {
        const s = P.get('shape'), t = ac.currentTime;
        const wS = Math.max(0, 1 - 2 * s), wT = 1 - Math.abs(2 * s - 1), wQ = Math.max(0, 2 * s - 1);
        dsp.setSmooth(gS.gain, wS * 0.9, ac); dsp.setSmooth(gT.gain, wT * 0.95, ac); dsp.setSmooth(gQ.gain, wQ * 0.75, ac);
        warm.curve = dsp.curve('tube', P.get('drive') * 0.8);
        dsp.setSmooth(phG.gain, P.get('phantom') * 0.55, ac);
        floor.frequency.setTargetAtTime(P.get('floor'), t, 0.01); toneLP.frequency.setTargetAtTime(P.get('tone'), t, 0.01);
        dsp.setSmooth(level.gain, P.get('level') * 0.9, ac);
      }
      ['shape', 'drive', 'phantom', 'floor', 'tone', 'level'].forEach(k => P.onChange(k, apply)); apply();
      let held = null, curF = 55;
      function setF(f, t, glide, drop) {
        const oscs = [sine, tri, sq];
        oscs.forEach(o => { o.frequency.cancelScheduledValues(t); });
        if (drop > 0) { const f0 = f * Math.pow(2, drop / 12); oscs.forEach(o => { o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f, t + P.get('dropTime')); }); }
        else if (glide > 0) oscs.forEach(o => { o.frequency.setValueAtTime(curF, t); o.frequency.exponentialRampToValueAtTime(f, t + glide); });
        else oscs.forEach(o => o.frequency.setValueAtTime(f, t));
        sqLP.frequency.setValueAtTime(Math.max(60, f * 3.5), t);
        curF = f;
      }
      function noteOn(note, vel, t, dur) {
        t = Math.max(t || ac.currentTime, ac.currentTime);
        const f = MT.hz(Math.max(0, note + 12 * P.get('octave')));
        const legato = held && held.off > t - 1e-4;
        setF(f, t, legato ? P.get('glide') : 0, legato ? 0 : P.get('drop'));
        // 3.53 legato: the note this one glides out of booked its release for ITS end, inside this note — unbook it (hold here,
        // settle back to sustain); this note books its own below. Before, overlapping notes went silent from the first old end.
        if (legato) { const a = amp.gain; if (typeof a.cancelAndHoldAtTime === 'function') a.cancelAndHoldAtTime(t); else a.cancelScheduledValues(t); a.setTargetAtTime(held.sus, t, 0.008); }
        const sus = legato ? held.sus : (0.25 + 0.75 * vel) * P.get('sustain');
        if (!legato) {
          dsp.adsr(amp.gain, t, { a: P.get('attack'), d: P.get('decay'), s: P.get('sustain'), peak: 0.25 + 0.75 * vel });
          const ck = P.get('click'); if (ck > 0) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f * 16, t); o.frequency.exponentialRampToValueAtTime(f * 2, t + 0.012); g.gain.setValueAtTime(ck * 0.35 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.018); o.connect(g); g.connect(clickG); clickG.gain.setValueAtTime(1, t); o.start(t); o.stop(t + 0.03); o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) {} }; }
        }
        held = { note, sus, off: dur !== undefined ? t + dur : Infinity };
        if (dur !== undefined) dsp.release(amp.gain, t + dur, P.get('release'));
        ctx.lastNote = { f, t };
      }
      function noteOff(note, t) { if (!held || held.note !== note) return; t = Math.max(t || ac.currentTime, ac.currentTime); held.off = t; dsp.release(amp.gain, t, P.get('release')); }
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => p.on ? noteOn(p.note, p.velocity) : noteOff(p.note));
      ctx.audition = (p) => noteOn(p.note || 45, p.velocity || 0.9, ac.currentTime, p.duration || 1.2);
      ctx.auditionOff = (p) => noteOff(p.note || 45);
      ctx.internals = { amp, phG, sine };
      return {};
    },
  });
})();
