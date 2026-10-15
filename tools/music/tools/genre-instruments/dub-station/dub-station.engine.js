/* eravos.dub-station 1.0.0 — Dub Station · spec eravos.organism.dub-station
 * A sound-system in one window — reggae, dub, dancehall ("bun dem" energy):
 *   SKANK   offbeat chord chops locked to the transport (one-drop chop · organ bubble · dancehall stab) following a
 *           progression in the song key
 *   SIREN   the dub siren — hold to wail; rate, depth, shape, rising sweep
 *   HORN    synthesized air horn blasts
 *   DUB FX  wire any tool in: the BIG KNOB (resonant high-pass over the whole riddim), a SPRING tank (dispersive
 *           all-pass chirp + feedback combs), a DUB ECHO whose feedback runs through a sweepable resonant band-pass
 *   PULL UP the rewind: grabs the last seconds of the master, spins it backwards accelerating, stops the riddim and
 *           (optionally) drops it back in from bar 1 — the selector's "wheel up". */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const RING = `
class EravosRing extends AudioWorkletProcessor {
  constructor() { super(); this.N = sampleRate * 10 | 0; this.L = new Float32Array(this.N); this.R = new Float32Array(this.N); this.w = 0;
    this.port.onmessage = (e) => { if (e.data && e.data.grab) { const n = Math.min(this.N, Math.round(e.data.grab * sampleRate)), L = new Float32Array(n), R = new Float32Array(n); for (let i = 0; i < n; i++) { const k = (this.w - n + i + this.N) % this.N; L[i] = this.L[k]; R[i] = this.R[k]; } this.port.postMessage({ L, R }, [L.buffer, R.buffer]); } }; }
  process(inputs) { const i = inputs[0]; if (i && i[0]) { const a = i[0], b = i[1] || i[0]; for (let k = 0; k < a.length; k++) { this.L[this.w] = a[k]; this.R[this.w] = b[k]; this.w = (this.w + 1) % this.N; } } return true; }
}
registerProcessor('eravos-ring', EravosRing);`;
  const PROGS = { 'i–iv': [0, 3], 'i–VII': [0, 6], 'i–VI–VII': [0, 5, 6, 6], 'I–IV–V': [0, 3, 4, 3], 'i–v (minor dub)': [0, 4], 'one chord': [0] };
  OrganismFactory.define({
    id: 'eravos.dub-station', preview: 'hit', domain: 'music', version: '1.0.0', label: 'Dub Station', icon: '📢', accent: '#00c853', phase: 'P14',
    category: 'Genre instruments', blurb: 'Reggae / dub / dancehall sound-system: offbeat skank, dub siren, air horn, spring, big-knob filter, dub echo, PULL UP rewind.',
    size: { w: 620, h: 640 }, minSize: { w: 480, h: 480 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx', 'capability.generator'],
    needs: { notes: ['Wire your riddim (drums, bass) into its input for the big knob, spring and echo.', 'Pull Up grabs the last seconds of everything you hear.'], works_with: ['eravos.drum-forge', 'eravos.sub-engine', 'eravos.pads', 'eravos.sequencer'] },
    hooks: [
      Object.assign(S.audio_in('dub.hook.audio_in', 'in'), { intent: 'the riddim to dub (big knob, spring, echo)' }),
      S.audio_out('dub.hook.audio_out'), S.transport_in('dub.hook.transport_in'), S.theory_in('dub.hook.theory_in'),
      Object.assign(S.event('dub.hook.transport_out', 'out', 'ui:transport-stop|ui:transport-play|ui:transport-seek', { type: 'object' }, '1.0.0'), { rail: false }),
      S.mod_in('dub.hook.mod_knob', 'bigKnob'), S.mod_in('dub.hook.mod_sweep', 'echoSweep'),
    ],
    config: [
      { key: 'skankOn', type: 'boolean', default: false, label: 'Skank', group: 'SKANK', hint: 'plays the offbeat while the transport runs' },
      { key: 'skankStyle', type: 'enum', options: ['one-drop chop', 'organ bubble', 'dancehall stab'], default: 'one-drop chop', label: 'Style', group: 'SKANK' },
      { key: 'prog', type: 'enum', options: Object.keys(PROGS), default: 'i–iv', label: 'Chords', group: 'SKANK' },
      { key: 'skankTone', type: 'number', default: 2400, min: 400, max: 8000, step: 1, unit: 'Hz', label: 'Tone', group: 'SKANK' },
      { key: 'skankLevel', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Level', group: 'SKANK' },
      { key: 'sirenPitch', type: 'number', default: 620, min: 120, max: 2000, step: 1, unit: 'Hz', label: 'Pitch', group: 'SIREN' },
      { key: 'sirenRate', type: 'number', default: 3.2, min: 0.1, max: 16, step: 0.01, unit: 'Hz', label: 'Rate', group: 'SIREN' },
      { key: 'sirenDepth', type: 'number', default: 7, min: 0, max: 24, step: 0.1, unit: 'st', label: 'Depth', group: 'SIREN' },
      { key: 'sirenShape', type: 'enum', options: ['sine', 'square', 'saw up', 'saw down'], default: 'square', label: 'Shape', group: 'SIREN' },
      { key: 'sirenRise', type: 'number', default: 5, min: -12, max: 24, step: 0.1, unit: 'st', label: 'Rise', group: 'SIREN', hint: 'pitch climbs this much while held' },
      { key: 'sirenLevel', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Level', group: 'SIREN' },
      { key: 'hornLevel', type: 'number', default: 0.45, min: 0, max: 1, step: 0.01, label: 'Horn', group: 'SIREN' },
      { key: 'bigKnob', type: 'number', default: 20, min: 20, max: 3000, step: 1, unit: 'Hz', label: 'Big knob', group: 'DUB', hint: 'resonant high-pass over the riddim — sweep it up for the drop-out' },
      { key: 'spring', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Spring', group: 'DUB' },
      { key: 'echo', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Echo send', group: 'DUB' },
      { key: 'echoDiv', type: 'enum', options: ['1/4', '1/8.', '3/16', '1/2', '1/8'], default: '1/8.', label: 'Echo time', group: 'DUB' },
      { key: 'echoFeedback', type: 'number', default: 0.62, min: 0, max: 1.08, step: 0.01, label: 'Feedback', group: 'DUB', hint: 'above 1 it runs away (saturated) — ride it' },
      { key: 'echoSweep', type: 'number', default: 1400, min: 150, max: 6000, step: 1, unit: 'Hz', label: 'Sweep', group: 'DUB', hint: 'centre of the band-pass inside the echo loop' },
      { key: 'rewindLen', type: 'number', default: 3, min: 1, max: 8, step: 0.1, unit: 's', label: 'Rewind', group: 'PULL UP' },
      { key: 'rewindRestart', type: 'boolean', default: true, label: 'From the top', group: 'PULL UP', hint: 'after the rewind, play again from bar 1' },
      { key: 'level', type: 'number', default: 0.8, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    ui_hooks: ['siren', 'horn', 'rewind', 'throw'],
    defaultPreset: 'Roots One Drop',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory, K = ctx.K;
      const node = (n) => { ctx.track(n); return n; };
      const inp = node(ac.createGain()), out = node(ac.createGain()), level = node(ac.createGain());
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, label: 'riddim' });
      // big knob: resonant HPF over the riddim (dry)
      const knob = node(ac.createBiquadFilter()); knob.type = 'highpass'; knob.Q.value = 3.5;
      const knobMod = ctx.modBus('bigKnob', { min: -3600, max: 4800 }); knobMod.connect(knob.detune);
      inp.connect(knob); knob.connect(out);
      const gen = node(ac.createGain()); gen.connect(out);                      // generators (skank, siren, horn)
      // sends
      const springSend = node(ac.createGain()), echoSend = node(ac.createGain());
      knob.connect(springSend); gen.connect(springSend); knob.connect(echoSend); gen.connect(echoSend);
      // spring tank: dispersion all-pass chain → two feedback combs → dark tone
      let x = springSend; const aps = [];
      for (let i = 0; i < 10; i++) { const a = node(ac.createBiquadFilter()); a.type = 'allpass'; a.frequency.value = 900 + i * 260; a.Q.value = 0.35; x.connect(a); x = a; aps.push(a); }
      const springOut = node(ac.createGain()); springOut.gain.value = 0.9;
      [[0.0371, 0.72], [0.0449, 0.7], [0.0523, 0.66]].forEach(([d, f]) => { const dl = node(ac.createDelay(0.2)), fb = node(ac.createGain()), lp = node(ac.createBiquadFilter()); dl.delayTime.value = d; fb.gain.value = f; lp.type = 'lowpass'; lp.frequency.value = 3800; x.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(springOut); });
      const springHP = node(ac.createBiquadFilter()); springHP.type = 'highpass'; springHP.frequency.value = 250; springOut.connect(springHP); springHP.connect(out);
      // dub echo: feedback through a sweepable resonant band-pass + soft clip
      const eDl = node(ac.createDelay(4)), eBP = node(ac.createBiquadFilter()), eSat = node(ac.createWaveShaper()), eFb = node(ac.createGain()), eOut = node(ac.createGain());
      eBP.type = 'bandpass'; eBP.Q.value = 1.4; eSat.curve = dsp.curve('tape', 0.25); // 3.28: unity small-signal gain — 'soft' (8.5×) made the loop scream forever from the first sound
      const sweepMod = ctx.modBus('echoSweep', { min: -2400, max: 2400 }); sweepMod.connect(eBP.detune);
      echoSend.connect(eDl); eDl.connect(eBP); eBP.connect(eSat); eSat.connect(eFb); eFb.connect(eDl); eSat.connect(eOut); eOut.connect(out);
      out.connect(level);
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'sound system' });
      function apply() {
        const t = ac.currentTime;
        knob.frequency.setTargetAtTime(P.get('bigKnob'), t, 0.03);
        dsp.setSmooth(springSend.gain, P.get('spring') * 0.6, ac); dsp.setSmooth(echoSend.gain, P.get('echo') * 0.8, ac);
        eDl.delayTime.setTargetAtTime(Math.min(3.9, MT.divisionSec(P.get('echoDiv'), ctx.bpm)), t, 0.05);
        dsp.setSmooth(eFb.gain, P.get('echoFeedback') * 1.25, ac); eBP.frequency.setTargetAtTime(P.get('echoSweep'), t, 0.03);
        dsp.setSmooth(level.gain, P.get('level'), ac); dsp.setSmooth(eOut.gain, 1.3, ac);
      }
      ['bigKnob', 'spring', 'echo', 'echoDiv', 'echoFeedback', 'echoSweep', 'level'].forEach(k => P.onChange(k, apply)); apply();
      ctx.onBpm(() => apply());
      // throw: momentary full echo send
      ctx.onUI('throw', { type: 'object' }, (p) => { const t = ac.currentTime; echoSend.gain.cancelScheduledValues(t); echoSend.gain.setTargetAtTime(p.on ? 1.2 : P.get('echo') * 0.8, t, 0.01); });
      // ---- SKANK (transport-locked)
      function chordNotes(stepIdx) {
        const key = ctx.key || { root: 9, scale: 'minor' }, prog = PROGS[P.get('prog')] || [0];
        const deg = prog[Math.floor(stepIdx / 16) % prog.length];
        const sc = MT.SCALES[key.scale] || MT.SCALES.minor || [0, 2, 3, 5, 7, 8, 10];
        const at = (d) => { const o = Math.floor(d / sc.length); return 60 + key.root + sc[((d % sc.length) + sc.length) % sc.length] + 12 * o - (key.root > 5 ? 12 : 0); };
        return [at(deg), at(deg + 2), at(deg + 4)];
      }
      function chop(t, notes, style, vel) {
        const tone = P.get('skankTone'), lv = P.get('skankLevel') * vel, dur = style === 'organ bubble' ? 0.11 : style === 'dancehall stab' ? 0.09 : 0.075;
        const g = ac.createGain(), f = ac.createBiquadFilter(); f.type = style === 'organ bubble' ? 'lowpass' : 'bandpass'; f.frequency.value = tone; f.Q.value = style === 'organ bubble' ? 0.7 : 1.1; g.connect(gen); f.connect(g);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv * 0.28, t + 0.003); g.gain.setTargetAtTime(0, t + dur * 0.4, dur / 3);
        const nodes = [g, f];
        notes.forEach((n, i) => {
          const fr = MT.hz(n + (style === 'dancehall stab' ? 12 : 0));
          if (style === 'organ bubble') [1, 2, 4].forEach((k, j) => { const o = ac.createOscillator(); o.frequency.value = fr * k; const og = ac.createGain(); og.gain.value = [0.5, 0.25, 0.12][j]; o.connect(og); og.connect(f); o.start(t); o.stop(t + dur * 3); nodes.push(o, og); });
          else { const o = ac.createOscillator(); o.type = style === 'dancehall stab' ? 'sawtooth' : 'square'; o.frequency.value = fr; o.detune.value = (i - 1) * 4; o.connect(f); o.start(t); o.stop(t + dur * 3); nodes.push(o); }
        });
        const last = nodes[nodes.length - 1]; last.onended = () => nodes.forEach(n => { try { n.disconnect(); } catch (e) {} });
      }
      ctx.onTick((tk) => {
        if (!P.get('skankOn')) return;
        const s = tk.step16 % 16, style = P.get('skankStyle'), notes = chordNotes(tk.step16);
        if (style === 'one-drop chop' && (s === 6 || s === 14)) chop(tk.time, notes, style, 1);
        else if (style === 'dancehall stab' && (s === 2 || s === 6 || s === 10 || s === 14)) chop(tk.time, notes, style, s % 8 === 6 ? 1 : 0.75);
        else if (style === 'organ bubble' && s % 2 === 0) { const hi = s % 4 === 2; chop(tk.time, hi ? notes : [notes[0] - 12, notes[0]], style, hi ? 0.9 : 0.6); }
      });
      // ---- SIREN (hold)
      let siren = null;
      function sirenOn(t) {
        if (siren) return; t = t || ac.currentTime;
        const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain(), hp = ac.createBiquadFilter();
        o.type = P.get('sirenShape') === 'sine' ? 'triangle' : 'square'; o.frequency.value = P.get('sirenPitch');
        lfo.type = { sine: 'sine', square: 'square', 'saw up': 'sawtooth', 'saw down': 'sawtooth' }[P.get('sirenShape')]; lfo.frequency.value = P.get('sirenRate');
        lg.gain.value = P.get('sirenDepth') * 100 * (P.get('sirenShape') === 'saw down' ? -1 : 1); lfo.connect(lg); lg.connect(o.detune);
        o.detune.setValueAtTime(0, t); o.detune.linearRampToValueAtTime(P.get('sirenRise') * 100, t + 2.5);
        hp.type = 'highpass'; hp.frequency.value = 180; o.connect(hp); hp.connect(g); g.connect(gen);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(P.get('sirenLevel') * 0.3, t + 0.02);
        o.start(t); lfo.start(t); siren = { o, lfo, lg, g, hp };
      }
      function sirenOff(t) { if (!siren) return; t = t || ac.currentTime; const s = siren; siren = null; s.g.gain.setTargetAtTime(0, t, 0.04); s.o.stop(t + 0.3); s.lfo.stop(t + 0.3); s.o.onended = () => [s.o, s.lfo, s.lg, s.g, s.hp].forEach(n => { try { n.disconnect(); } catch (e) {} }); }
      ctx.onUI('siren', { type: 'object', required: ['on'] }, (p) => p.on ? sirenOn() : sirenOff());
      // ---- stopping (3.28): the siren lets go; the dub echo empties (hard: now · Stop: a runaway loop fades 1.5 s first)
      function clearEcho(at, fade) {
        const t = Math.max(ac.currentTime, at || 0), tE = t + Math.max(0.01, fade), span = Math.min(3.9, eDl.delayTime.value) + 0.06;
        eOut.gain.cancelScheduledValues(t); eOut.gain.setValueAtTime(eOut.gain.value, t); eOut.gain.linearRampToValueAtTime(0, tE);
        eFb.gain.cancelScheduledValues(t); eFb.gain.setValueAtTime(eFb.gain.value, t); eFb.gain.linearRampToValueAtTime(0, tE);
        eOut.gain.setValueAtTime(0, tE + span); eOut.gain.linearRampToValueAtTime(1.3, tE + span + 0.01); eFb.gain.setValueAtTime(P.get('echoFeedback') * 1.25, tE + span);
      }
      ctx.onSilence((p) => {
        sirenOff(p.time || undefined);
        if (p.hard) clearEcho(p.time, 0.01); else if (P.get('echoFeedback') * 1.25 >= 0.99) clearEcho(p.time, 1.5);
      });
      ctx.sirenOn = sirenOn; ctx.sirenOff = sirenOff;
      // ---- HORN: three detuned brassy saws, pitch blip, nasal formant
      function horn(t) {
        t = t || ac.currentTime; const base = 233, g = ac.createGain(), bp = ac.createBiquadFilter(), bp2 = ac.createBiquadFilter(); bp.type = bp2.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 2; bp2.frequency.value = 2400; bp2.Q.value = 3;
        g.connect(gen); bp.connect(g); bp2.connect(g); const nodes = [g, bp, bp2];
        [0, 1, 2].forEach(i => { const o = ac.createOscillator(); o.type = 'sawtooth'; const f = base * [1, 1.26, 1.5][i]; o.frequency.setValueAtTime(f * 0.94, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); o.detune.value = (i - 1) * 9; o.connect(bp); o.connect(bp2); o.start(t); o.stop(t + 0.62); nodes.push(o); });
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(P.get('hornLevel') * 0.5, t + 0.015); g.gain.setValueAtTime(P.get('hornLevel') * 0.5, t + 0.45); g.gain.linearRampToValueAtTime(0, t + 0.6);
        nodes[nodes.length - 1].onended = () => nodes.forEach(n => { try { n.disconnect(); } catch (e) {} });
      }
      ctx.onUI('horn', { type: 'object' }, (p) => { const n = Math.max(1, Math.min(4, p.times || 1)); for (let i = 0; i < n; i++) horn(ac.currentTime + i * 0.22); });
      ctx.horn = horn;
      // ---- PULL UP: ring buffer on the master, played backwards, accelerating
      let ring = null;
      ctx.loadWorklet('eravos-ring', RING).then(() => { if (ctx.disposed || !K.audio.output) return; ring = new AudioWorkletNode(ac, 'eravos-ring', { numberOfInputs: 1, numberOfOutputs: 0, channelCount: 2, channelCountMode: 'explicit' }); K.audio.output.connect(ring); ctx.onDispose(() => { try { K.audio.output.disconnect(ring); } catch (e) {} }); }).catch((e) => ctx.K.fault('RUNTIME_003', { instance_id: ctx.id, message: 'Dub Station rewind capture unavailable — ' + e.message, quiet: !ac.audioWorklet }));
      function grab(sec) { return new Promise((res) => { if (!ring) return res(null); ring.port.onmessage = (e) => res(e.data); ring.port.postMessage({ grab: sec }); setTimeout(() => res(null), 500); }); }
      async function rewind() {
        const len = P.get('rewindLen'), d = await grab(len); const t = ac.currentTime + 0.02;
        ctx.emit('ui:transport-stop', {});
        if (!d || !d.L.length) { horn(t); return false; }
        const b = ac.createBuffer(2, d.L.length, ac.sampleRate); b.copyToChannel(d.L.slice().reverse(), 0); b.copyToChannel(d.R.slice().reverse(), 1);
        const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = b; src.connect(g); g.connect(out);
        const dur = len / 2.2; src.playbackRate.setValueAtTime(0.6, t); src.playbackRate.exponentialRampToValueAtTime(3.2, t + dur);
        g.gain.setValueAtTime(0.9, t); g.gain.setValueAtTime(0.9, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur);
        src.start(t); src.stop(t + dur + 0.05);
        src.onended = () => { try { src.disconnect(); g.disconnect(); } catch (e) {} if (P.get('rewindRestart')) { ctx.emit('ui:transport-seek', { bar: 1 }); ctx.emit('ui:transport-play', {}); } };
        ctx.emitUI('rewound', { seconds: len });
        return true;
      }
      ctx.rewind = rewind;
      ctx.onUI('rewind', null, () => rewind());
      ctx.audition = () => horn();
      ctx.internals = { chordNotes, knob, eFb, gen };
      ctx.onDispose(() => sirenOff());
      return {};
    },
  });
})();
