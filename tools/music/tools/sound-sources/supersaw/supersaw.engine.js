/* eravos.supersaw 2.1.0 — poly lead + chords (P2) · resolves F-11(supersaw) · amendment A-1 (arp → eravos.arp)
 * 8-voice allocator (steal oldest released, then oldest held) + chord engine (one key = in-key chord).
 * Per voice: unison saws with JP-8000 non-linear detune d(x)=x·(0.25+0.75x²), HP at note freq,
 * LP with filter ADSR, amp ADSR, stereo spread. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.supersaw', preview: 'lead', domain: 'music', version: '2.1.0', label: 'Supersaw', icon: '🌊', accent: '#00d4ff', phase: 'P2',
    category: 'Sound sources', blurb: 'Big festival lead & chords. Chord mode: press one key, get a full chord in key.',
    size: { w: 640, h: 560 }, minSize: { w: 460, h: 360 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.lead_voice'],
    hooks: [
      S.audio_out('saw.hook.audio_out'), S.note_in('saw.hook.note_in'), S.midi_in('saw.hook.midi_in'), S.theory_in('saw.hook.theory_in'),
      S.mod_in('saw.hook.mod_cutoff', 'cutoff'), S.mod_in('saw.hook.mod_detune', 'detune'),
    ],
    config: [
      { key: 'unison', type: 'integer', default: 7, min: 1, max: 9, label: 'Unison', group: 'OSC' },
      { key: 'detune', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Detune', group: 'OSC' },
      { key: 'mix', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Mix', group: 'OSC' },
      { key: 'spread', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Spread', group: 'OSC' },
      { key: 'cutoff', type: 'number', default: 6000, min: 200, max: 18000, step: 1, unit: 'Hz', label: 'Cutoff', group: 'FILTER' },
      { key: 'res', type: 'number', default: 0.8, min: 0.5, max: 20, step: 0.1, label: 'Reso', group: 'FILTER' },
      { key: 'fEnv', type: 'number', default: 1, min: 0, max: 4, step: 0.01, unit: 'oct', label: 'Env amt', group: 'FILTER' },
      { key: 'fA', type: 'number', default: 0.005, min: 0.001, max: 4, step: 0.001, unit: 's', label: 'F Att', group: 'FILTER' },
      { key: 'fD', type: 'number', default: 0.4, min: 0.01, max: 4, step: 0.01, unit: 's', label: 'F Dec', group: 'FILTER' },
      { key: 'fS', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'F Sus', group: 'FILTER' },
      { key: 'fR', type: 'number', default: 0.4, min: 0.01, max: 12, step: 0.01, unit: 's', label: 'F Rel', group: 'FILTER' },
      { key: 'aA', type: 'number', default: 0.01, min: 0.001, max: 10, step: 0.001, unit: 's', label: 'Attack', group: 'AMP' },
      { key: 'aD', type: 'number', default: 0.3, min: 0.01, max: 4, step: 0.01, unit: 's', label: 'Decay', group: 'AMP' },
      { key: 'aS', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'AMP' },
      { key: 'aR', type: 'number', default: 0.4, min: 0.01, max: 12, step: 0.01, unit: 's', label: 'Release', group: 'AMP' },
      { key: 'chordMode', type: 'enum', options: ['off', 'triad', 'seventh', 'add9', 'sus2', 'sus4', 'power'], default: 'off', label: 'Chord', group: 'CHORD' },
      { key: 'octave', type: 'integer', default: 0, min: -4, max: 4, label: 'Octave', group: 'CHORD' },
      { key: 'level', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Level', group: 'CHORD' },
    ],
    ui_hooks: ['key_down', 'key_up'],
    defaultPreset: 'Festival Lead',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const out = ac.createGain(); out.gain.value = P.get('level') * 0.5;
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'supersaw' });
      const cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 });
      const detMod = ctx.modBus('detune', { min: 0, max: 1 });
      const voices = []; // {notes, oscs, amp, lp, hp, start, released, end, note}
      const d = (x) => x * (0.25 + 0.75 * x * x);

      function makeVoice(note, vel, t, dur) {
        const hz = MT.hz(note + 12 * P.get('octave'));
        const n = P.get('unison'), det = P.get('detune') * 100, mix = P.get('mix'), sp = P.get('spread');
        const wDet = ctx.modWired('detune'), wCut = ctx.modWired('cutoff'); // gate P: only modulated voices pay for a-rate params
        // gate P: equal-power pan folded into two gains per saw (L/R sums → one merger) — the same law StereoPannerNode
        // applies to a mono input (L = cos θ, R = sin θ, θ = (pan + 1)·π/4), at a third of the per-saw cost
        const sumL = ac.createGain(), sumR = ac.createGain(), sum = ac.createChannelMerger(2); sumL.connect(sum, 0, 0); sumR.connect(sum, 0, 1);
        const oscs = [];
        for (let i = 0; i < n; i++) {
          const x = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
          const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz; o.detune.value = d(x) * det;
          let dm = null; if (wDet) { dm = ac.createGain(); dm.gain.value = d(x) * 100; detMod.connect(dm); dm.connect(o.detune); }
          const center = Math.abs(x) < 1e-6 || n === 1, lv = (center ? 1 - mix * 0.4 : mix) / Math.sqrt(n), th = (x * sp + 1) * Math.PI / 4;
          const gL = ac.createGain(), gR = ac.createGain(); gL.gain.value = lv * Math.cos(th); gR.gain.value = lv * Math.sin(th);
          o.connect(gL); o.connect(gR); gL.connect(sumL); gR.connect(sumR);
          o.start(t, Math.random() * 0.01);
          oscs.push({ o, dm });
        }
        const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hz * 0.7; hp.Q.value = 0.5;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = P.get('res');
        if (wCut) cutMod.connect(lp.detune);
        const amp = ac.createGain(); amp.gain.value = 0;
        sum.connect(hp); hp.connect(lp); lp.connect(amp); amp.connect(out);
        // ADSRs (linear decay → exact sustain at t+A+D)
        const A = P.get('aA'), D = P.get('aD'), Sus = P.get('aS');
        const peak = 0.35 + 0.65 * vel;
        amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(peak, t + A); amp.gain.linearRampToValueAtTime(peak * Sus, t + A + D);
        const c = P.get('cutoff'), fk = Math.min(20000, c * Math.pow(2, P.get('fEnv')));
        const fA = P.get('fA'), fD = P.get('fD'), fS = P.get('fS');
        lp.frequency.setValueAtTime(c, t); lp.frequency.linearRampToValueAtTime(fk, t + fA); lp.frequency.linearRampToValueAtTime(c + (fk - c) * fS, t + fA + fD);
        const v = { note, oscs, amp, lp, sum, start: t, released: false, end: Infinity, peak, sus: Sus };
        voices.push(v);
        if (dur !== undefined) release(v, t + Math.max(0.01, dur));
        return v;
      }
      function release(v, t) {
        if (v.released) return;
        v.released = true; v.relT = t;
        const R = P.get('aR'), fR = P.get('fR');
        if (typeof v.amp.gain.cancelAndHoldAtTime === 'function') { v.amp.gain.cancelAndHoldAtTime(t); v.lp.frequency.cancelAndHoldAtTime(t); }
        else { v.amp.gain.cancelScheduledValues(t); }
        v.amp.gain.setTargetAtTime(0, t, R / 4);
        v.lp.frequency.setTargetAtTime(P.get('cutoff'), t, fR / 4);
        v.end = t + R * 1.6 + 0.05;
        v.oscs.forEach(x => { try { x.o.stop(v.end); } catch (e) {} });
        ctx.atAudioTime(v.end + 0.1, () => cleanup(v));
      }
      function cleanup(v) {
        const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1);
        v.oscs.forEach(x => { try { if (x.dm) detMod.disconnect(x.dm); x.o.disconnect(); } catch (e) {} });
        try { v.amp.disconnect(); } catch (e) {} try { cutMod.disconnect(v.lp.detune); } catch (e) {}
        ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) });
      }
      function kill(v, t) { v.amp.gain.cancelScheduledValues(t); v.amp.gain.setTargetAtTime(0, t, 0.004); v.released = true; v.end = t + 0.03; v.oscs.forEach(x => { try { x.o.stop(t + 0.03); } catch (e) {} }); ctx.atAudioTime(t + 0.08, () => cleanup(v)); }
      function allocate(t) {
        const live = voices.filter(v => v.end > t);
        if (live.length < 8) return;
        const rel = live.filter(v => v.released).sort((a, b) => a.relT - b.relT);
        const victim = rel[0] || live.filter(v => !v.released).sort((a, b) => a.start - b.start)[0];
        if (victim) { const i = voices.indexOf(victim); voices.splice(i, 1); kill(victim, t); }
      }
      function notesFor(note) {
        const cm = P.get('chordMode');
        if (cm === 'off') return [note];
        const k = ctx.key; const dg = MT.degreeOf(note, k.root, k.scale);
        return MT.chord(dg.degree, k.root, k.scale, cm, dg.octave);
      }
      function noteOn(note, vel, t, dur) {
        t = Math.max(t, ac.currentTime);
        const made = [];
        notesFor(note).forEach(n => { allocate(t); const v = makeVoice(n, vel, t, dur); v.src = note; made.push(v); });
        ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) });
        return made;
      }
      function noteOff(note, t) { t = Math.max(t || ac.currentTime, ac.currentTime); voices.filter(v => v.src === note && !v.released).forEach(v => release(v, t)); ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) }); }
      ctx.noteOn = noteOn; ctx.noteOff = noteOff; ctx.voices = voices;
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration === undefined ? 0.25 : p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note); });
      ctx.onUI('key_down', { type: 'object', required: ['note'] }, (p) => noteOn(p.note, p.velocity || 0.85, ac.currentTime));
      ctx.onUI('key_up', { type: 'object', required: ['note'] }, (p) => noteOff(p.note));
      ctx.onKey(() => ctx.syncUI());
      P.onChange('level', (v) => out.gain.setTargetAtTime(v * 0.5, ac.currentTime, 0.01));
      ctx.audition = (p) => noteOn(p.note || 69, 0.85, ac.currentTime, 0.6);
      return { unmount() { voices.slice().forEach(v => kill(v, ac.currentTime)); } };
    },
  });
})();
