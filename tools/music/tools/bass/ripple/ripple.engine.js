/* eravos.ripple 1.2.0 — Ripple: the rumble (spec: ripple.spec · the direction: specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2))
 * His words (2026-11-27): "the frequencies how the collide … the way it creates ripples and tension" · "yes build them use the null renderer to
 * make sure its novel in relation to the rest of eravos".
 *
 * A bass made of two parts that meet: a CLEAN SUB (a sine on the note, mono, never driven) and a GRIND above it — 2…7 voices spread in HERTZ
 * (unison-stack 1.1 hz: the outer two voices Beat Hz apart, so they swell Beat times a second on EVERY note — the ripple), driven through a
 * tube (saturator-tube: the voices' sums and differences become new partials that move as the ripple moves), filtered with an envelope.
 * Dive: every note can fall into its pitch (Dive semitones over Dive time), sub and grind together, so the frequencies sweep through each other.
 * Out: stereo audio · ripple (mod): the swell itself, |cos(π·Beat·t)| 0…1, so any other tool can move with the ripple.
 * Components (tools/music/components — never re-implemented here): unison-stack (layout: Hz offsets, cents, equal-power pans, levels) ·
 * saturator-tube (its worklet, its kernel) · the rest is Web Audio's own oscillators and filters, as Supersaw.
 * Every control reaches sounding notes (axiom 4: "Tools, keys and values can be adjusted while playing them"). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const WAVES = { saw: 'sawtooth', square: 'square', triangle: 'triangle', sine: 'sine' }, MAXV = 6;
  OrganismFactory.define({
    id: 'eravos.ripple', preview: 'bass', domain: 'music', version: '1.2.0', label: 'Ripple', icon: '≈', accent: '#ff5a3c',
    category: 'Bass', blurb: 'The rumble: a clean sub under a driven grind whose voices are a few hertz apart, so the floor swells. Dive into each note.',
    size: { w: 620, h: 620 }, minSize: { w: 460, h: 380 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in'],
    hooks: [S.audio_out('ripple.hook.audio_out'), S.note_in('ripple.hook.note_in'), S.midi_in('ripple.hook.midi_in'), S.theory_in('ripple.hook.theory_in'),
      S.mod_in('ripple.hook.mod_beat', 'beat'), S.mod_in('ripple.hook.mod_cutoff', 'cutoff'), S.mod_in('ripple.hook.mod_drive', 'drive'),
      S.mod_out('ripple.hook.ripple_out', 'ripple')],
    config: [
      { key: 'wave', type: 'enum', options: Object.keys(WAVES), default: 'saw', label: 'Wave', group: 'GRIND' },
      { key: 'voices', type: 'integer', default: 3, min: 2, max: 7, label: 'Voices', group: 'RIPPLE', element: 'unison-stack' },
      { key: 'beat', type: 'number', default: 1.6, min: 0, max: 12, step: 0.01, unit: 'Hz', label: 'Beat', group: 'RIPPLE', element: 'unison-stack', hint: 'How many times a second the voices swell together; under 7 Hz a swell, above it a growl' },
      { key: 'detune', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Detune', group: 'RIPPLE', element: 'unison-stack', hint: 'Cents on top (they scale with the note; Beat does not)' },
      { key: 'width', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Width', group: 'RIPPLE', element: 'unison-stack' },
      { key: 'midOct', type: 'enum', options: ['0', '+1', '+2'], default: '+1', label: 'Grind octave', group: 'GRIND' },
      { key: 'drive', type: 'number', default: 14, min: 0, max: 24, step: 0.1, unit: 'dB', label: 'Drive', group: 'GRIND', element: 'saturator-tube' },
      { key: 'bias', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Bias', group: 'GRIND', element: 'saturator-tube', hint: 'Asymmetry: even harmonics' },
      { key: 'grind', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Grind', group: 'GRIND', hint: 'The grind’s level against the sub' },
      { key: 'sub', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Sub', group: 'SUB', hint: 'A clean sine on the note: never driven, always mono' },
      { key: 'cutoff', type: 'number', default: 1400, min: 80, max: 12000, step: 1, unit: 'Hz', label: 'Cutoff', group: 'FILTER' },
      { key: 'res', type: 'number', default: 2, min: 0.5, max: 14, step: 0.1, label: 'Reso', group: 'FILTER' },
      { key: 'fEnv', type: 'number', default: 1.5, min: -4, max: 4, step: 0.01, unit: 'oct', label: 'Env amt', group: 'FILTER', hint: 'Above 0 each note starts bright and closes; below 0 it starts dark and opens in' },
      { key: 'fDec', type: 'number', default: 0.35, min: 0.02, max: 3, step: 0.01, unit: 's', label: 'Env dec', group: 'FILTER' },
      { key: 'dive', type: 'number', default: 0, min: -24, max: 24, step: 0.1, unit: 'st', label: 'Dive', group: 'DIVE', hint: 'Above 0 each note falls this far into its pitch; below 0 it rises in from under it' },
      { key: 'diveTime', type: 'number', default: 0.12, min: 0.01, max: 4, step: 0.01, unit: 's', label: 'Dive time', group: 'DIVE' },
      { key: 'collideFrom', type: 'number', default: 0, min: 0, max: 80, step: 0.1, unit: 'Hz', label: 'Collide from', group: 'COLLIDE', element: 'unison-stack', hint: 'Each note starts with its voices this far apart (a clash) and slides to Beat (a ripple); 0 = off' },
      { key: 'collideTime', type: 'number', default: 0.6, min: 0.01, max: 8, step: 0.01, unit: 's', label: 'Collide time', group: 'COLLIDE', hint: 'How long the clash takes to slow into the ripple' },
      // 3.255 the recipe he pasted (2026-11-28, not his words): "Modulation from a square wave two octaves higher" — a modulator per voice (FM): it bends each voice's
      // frequency at Mod ratio × the voice's frequency (4 = two octaves up); Mod amount is the FM index (the bend = amount × the modulator's
      // frequency). Mod amount 0 = as before.
      { key: 'modAmt', type: 'number', default: 0, min: 0, max: 4, step: 0.01, label: 'Mod amount', group: 'MOD', hint: 'How far the modulator bends each voice (the FM index): 0 = off, 1 = a bend as wide as the modulator\u2019s own pitch, higher = more screech' },
      { key: 'modRatio', type: 'number', default: 4, min: 0.25, max: 8, step: 0.01, label: 'Mod ratio', group: 'MOD', hint: 'The modulator\u2019s pitch against the note: 2 = an octave up, 4 = two octaves up, 0.5 = an octave down' },
      { key: 'modWave', type: 'enum', options: ['square', 'sine', 'saw', 'triangle'], default: 'square', label: 'Mod wave', group: 'MOD' },
      { key: 'aA', type: 'number', default: 0.004, min: 0.001, max: 2, step: 0.001, unit: 's', label: 'Attack', group: 'AMP' },
      { key: 'aD', type: 'number', default: 0.3, min: 0.01, max: 4, step: 0.01, unit: 's', label: 'Decay', group: 'AMP' },
      { key: 'aS', type: 'number', default: 0.85, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'AMP' },
      { key: 'aR', type: 'number', default: 0.18, min: 0.01, max: 6, step: 0.01, unit: 's', label: 'Release', group: 'AMP' },
      { key: 'octave', type: 'integer', default: -1, min: -3, max: 2, label: 'Octave', group: 'OUT' },
      { key: 'level', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    ui_hooks: ['key_down', 'key_up'],
    defaultPreset: 'Floor Swell',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory, US = MP.UnisonStack();
      const lvl = ac.createGain(); lvl.gain.value = P.get('level') * 0.5; const hr = ctx.dsp.headroom(ac), out = ac.createGain();
      lvl.connect(hr.input); hr.output.connect(out); hr.nodes.forEach(n => ctx.track(n)); ctx.track(lvl);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'Ripple' });
      // the grind's bus → the tube (one, after the voices: their sums and differences are made here) → level; the sub goes round it
      const grindBus = ac.createGain(), grindLvl = ac.createGain(), subBus = ac.createGain(); grindLvl.gain.value = P.get('grind'); subBus.gain.value = P.get('sub');
      grindBus.connect(lvl); grindLvl.connect(grindBus); subBus.connect(lvl); [grindBus, grindLvl, subBus].forEach(n => ctx.track(n));
      // the starting levels scheduled on the audio clock (not only .value): an offline render then repeats to the sample (the null render)
      lvl.gain.setValueAtTime(P.get('level') * 0.5, 0); grindLvl.gain.setValueAtTime(P.get('grind'), 0); subBus.gain.setValueAtTime(P.get('sub'), 0);
      let tube = null;
      ctx.ready = ctx.loadWorklet('eravos-saturator-tube', MP.TUBESAT_WORKLET).then(() => {
        if (ctx.disposed) return;
        tube = new AudioWorkletNode(ac, 'eravos-saturator-tube', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); ctx.track(tube);
        tube.parameters.get('drive').setValueAtTime(P.get('drive'), 0); tube.parameters.get('bias').setValueAtTime(P.get('bias'), 0);
        driveMod.connect(tube.parameters.get('drive'));
        grindLvl.disconnect(grindBus); grindLvl.connect(tube); tube.connect(grindBus);
      }).catch(er => ctx.fault('RUNTIME_003', 'ripple tube: ' + er.message));
      const beatMod = ctx.modBus('beat', { min: -6, max: 6 }), cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 }), driveMod = ctx.modBus('drive', { min: -12, max: 12 });
      // out: the ripple itself — |cos(π·Beat·t)| = |sin| of an oscillator at Beat/2, through an absolute-value curve
      const rOsc = ac.createOscillator(); rOsc.frequency.value = P.get('beat') / 2; const abs = ac.createWaveShaper(); const cv = new Float32Array(1025); for (let i = 0; i < 1025; i++) cv[i] = Math.abs(i / 512 - 1); abs.curve = cv;
      rOsc.connect(abs); rOsc.start(); ctx.track(rOsc); ctx.track(abs); ctx.port('ripple', { kind: 'mod', direction: 'out', node: abs, label: 'Ripple' });
      const layout = () => US.layout(P.get('voices'), P.get('detune'), 2, P.get('width'), 0.5, 2, 7, P.get('beat'));
      const voices = [];
      function makeVoice(note, vel, t, dur) {
        const f = MT.hz(note + 12 * P.get('octave')), fm = f * Math.pow(2, +P.get('midOct')), L = layout(), n = L.count, dive = P.get('dive') * 100, dT = P.get('diveTime');
        const sumL = ac.createGain(), sumR = ac.createGain(), sum = ac.createChannelMerger(2); sumL.connect(sum, 0, 0); sumR.connect(sum, 0, 1);
        const wBeat = ctx.modWired('beat'), oscs = [];
        for (let i = 0; i < n; i++) {
          const o = ac.createOscillator(); o.type = WAVES[P.get('wave')]; o.frequency.value = fm + L.offsetHz[i];
          // 3.250 Collide: the voices start Collide-from Hz apart (outer two) and slide to Beat — a clash slowing into a ripple; 0 = as before
          const cf = P.get('collideFrom'); if (cf > 0) { o.frequency.setValueAtTime(fm + L.pos[i] * cf / 2, t); o.frequency.linearRampToValueAtTime(fm + L.offsetHz[i], t + P.get('collideTime')); }
          o.detune.setValueAtTime(L.cents[i] + dive, t); if (dive) o.detune.linearRampToValueAtTime(L.cents[i], t + dT);
          let bm = null; if (wBeat) { bm = ac.createGain(); bm.gain.value = L.pos[i] / 2; beatMod.connect(bm); bm.connect(o.frequency); }
          const gL = ac.createGain(), gR = ac.createGain(); gL.gain.value = L.gainL[i]; gR.gain.value = L.gainR[i];
          // the modulator (FM): only made when Mod amount is above 0 at the note's start, so a note without it is built exactly as before
          let mo = null, mg = null; const ma = P.get('modAmt'); if (ma > 0) { mo = ac.createOscillator(); mo.type = WAVES[P.get('modWave')]; mo.frequency.value = (fm + L.offsetHz[i]) * P.get('modRatio');
            mo.detune.setValueAtTime(L.cents[i] + dive, t); if (dive) mo.detune.linearRampToValueAtTime(L.cents[i], t + dT);   // it rises / dives with its voice, so the ratio holds
            mg = ac.createGain(); mg.gain.value = ma * fm * P.get('modRatio'); mo.connect(mg); mg.connect(o.frequency); mo.start(t); }
          o.connect(gL); o.connect(gR); gL.connect(sumL); gR.connect(sumR); o.start(t, L.phase[i] / Math.max(1, fm)); oscs.push({ o, bm, gL, gR, i, mo, mg });
        }
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = P.get('res'); if (ctx.modWired('cutoff')) cutMod.connect(lp.detune);
        const amp = ac.createGain(), sAmp = ac.createGain(), so = ac.createOscillator(); amp.gain.value = 0; sAmp.gain.value = 0;
        so.type = 'sine'; so.frequency.value = f; so.detune.setValueAtTime(dive, t); if (dive) so.detune.linearRampToValueAtTime(0, t + dT); so.connect(sAmp); sAmp.connect(subBus); so.start(t);
        sum.connect(lp); lp.connect(amp); amp.connect(grindLvl);
        const A = P.get('aA'), D = P.get('aD'), Sus = P.get('aS'), peak = 0.35 + 0.65 * vel;
        [amp, sAmp].forEach(g => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + A); g.gain.linearRampToValueAtTime(peak * Sus, t + A + D); });
        const c = P.get('cutoff'), fk = Math.min(18000, c * Math.pow(2, P.get('fEnv')));
        lp.frequency.setValueAtTime(fk, t); lp.frequency.setTargetAtTime(c, t + 0.002, P.get('fDec') / 3);
        const v = { note, f, fm, oscs, so, amp, sAmp, lp, sum, start: t, released: false, end: Infinity, c0: Math.max(1, c) };
        voices.push(v); if (dur !== undefined) release(v, t + Math.max(0.01, dur)); return v;
      }
      function release(v, t) {
        if (v.released) return; v.released = true; v.relT = t; const R = P.get('aR');
        [v.amp, v.sAmp].forEach(g => { if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(t); else g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, R / 4); });
        v.end = t + R * 1.6 + 0.05; v.oscs.forEach(x => { try { x.o.stop(v.end); if (x.mo) x.mo.stop(v.end); } catch (e) {} }); try { v.so.stop(v.end); } catch (e) {}
        ctx.atAudioTime(v.end + 0.1, () => cleanup(v));
      }
      function cleanup(v) {
        const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1);
        v.oscs.forEach(x => { try { if (x.bm) beatMod.disconnect(x.bm); x.o.disconnect(); if (x.mo) { x.mo.disconnect(); x.mg.disconnect(); } } catch (e) {} });
        try { v.so.disconnect(); v.amp.disconnect(); v.sAmp.disconnect(); } catch (e) {} try { cutMod.disconnect(v.lp.detune); } catch (e) {}
        ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) });
      }
      function kill(v, t) { [v.amp, v.sAmp].forEach(g => { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.004); }); v.released = true; v.end = t + 0.03;
        v.oscs.forEach(x => { try { x.o.stop(t + 0.03); if (x.mo) x.mo.stop(t + 0.03); } catch (e) {} }); try { v.so.stop(t + 0.03); } catch (e) {} ctx.atAudioTime(t + 0.1, () => cleanup(v)); }
      function noteOn(note, vel, t, dur) {
        t = Math.max(t, ac.currentTime);
        const live = voices.filter(v => v.end > t); if (live.length >= MAXV) { const rel = live.filter(v => v.released).sort((a, b) => a.relT - b.relT), victim = rel[0] || live.sort((a, b) => a.start - b.start)[0]; kill(victim, t); }
        const v = makeVoice(note, vel === undefined ? 0.85 : vel, t, dur); ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) }); return v;
      }
      function noteOff(note, t) { t = Math.max(t || ac.currentTime, ac.currentTime); voices.filter(v => v.note === note && !v.released).forEach(v => release(v, t)); ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) }); }
      ctx.noteOn = noteOn; ctx.noteOff = noteOff; ctx.voices = voices;
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration === undefined ? 0.25 : p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note); });
      ctx.onUI('key_down', { type: 'object', required: ['note'] }, (p) => noteOn(p.note, p.velocity || 0.85, ac.currentTime));
      ctx.onUI('key_up', { type: 'object', required: ['note'] }, (p) => noteOff(p.note));
      // ---- every control, live (sounding notes follow)
      const now = () => ac.currentTime;
      // a change glides while it plays; before the clock has moved (an offline render being set up) it is set exactly — a glide that starts at
      // time 0 starts from whatever value the audio thread last reported, so two renders of one preset could differ (−70 dB)
      const glide = (prm, val) => { if (ac.currentTime === 0) { prm.cancelScheduledValues(0); prm.setValueAtTime(val, 0); } else prm.setTargetAtTime(val, now(), 0.012); };
      const relayout = () => { const L = layout(); voices.forEach(v => v.oscs.forEach(x => { if (x.i >= L.count) return; glide(x.o.frequency, v.fm + L.offsetHz[x.i]); glide(x.o.detune, L.cents[x.i]); glide(x.gL.gain, L.gainL[x.i]); glide(x.gR.gain, L.gainR[x.i]); })); };
      ['beat', 'detune', 'width'].forEach(k => P.onChange(k, relayout));
      P.onChange('beat', (b) => glide(rOsc.frequency, b / 2));
      P.onChange('wave', (w) => voices.forEach(v => v.oscs.forEach(x => { x.o.type = WAVES[w]; })));
      P.onChange('drive', (d) => { if (tube) glide(tube.parameters.get('drive'), d); });
      P.onChange('bias', (b) => { if (tube) glide(tube.parameters.get('bias'), b); });
      P.onChange('grind', (g) => glide(grindLvl.gain, g)); P.onChange('sub', (s) => glide(subBus.gain, s));
      P.onChange('level', (l) => glide(lvl.gain, l * 0.5));
      P.onChange('res', (q) => voices.forEach(v => glide(v.lp.Q, q)));
      P.onChange('cutoff', (c) => voices.forEach(v => v.lp.detune.setTargetAtTime(1200 * Math.log2(Math.max(1, c) / v.c0), now(), 0.012)));
      P.onChange('aS', (sv) => voices.forEach(v => { if (v.released || now() < v.start + P.get('aA') + P.get('aD')) return; [v.amp, v.sAmp].forEach(g => { g.gain.cancelScheduledValues(now()); glide(g.gain, sv); }); }));
      P.onChange('midOct', (o) => voices.forEach(v => { v.fm = v.f * Math.pow(2, +o); })); P.onChange('midOct', relayout);
      P.onChange('modAmt', (a) => voices.forEach(v => v.oscs.forEach(x => { if (x.mg) glide(x.mg.gain, a * v.fm * P.get('modRatio')); })));
      P.onChange('modRatio', (r) => { const L = layout(); voices.forEach(v => v.oscs.forEach(x => { if (x.mo) { glide(x.mo.frequency, (v.fm + L.offsetHz[x.i]) * r); glide(x.mg.gain, P.get('modAmt') * v.fm * r); } })); });
      P.onChange('modWave', (w) => voices.forEach(v => v.oscs.forEach(x => { if (x.mo) x.mo.type = WAVES[w]; })));
      ctx.onKey(() => ctx.syncUI());
      ctx.audition = (p) => noteOn(p.note || 45, 0.85, ac.currentTime, 0.9);
      return { unmount() { voices.slice().forEach(v => kill(v, ac.currentTime)); } };
    },
  });
})();
