/* eravos.reese-bass 2.0.0 — Reese Bass (P2) · resolves F-11(reese)
 * Detuned saw stack with random start phase per note → M/S width → 24 dB LP (env + audio-rate
 * random-walk drift) → feedback COMB (neuro flange, swept) → asymmetric drive (4×) ; mono sub
 * bypasses width + comb. Monophonic legato. The movement is the instrument. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const DIVS = ['4/1', '2/1', '1/1', '1/2', '1/4', '1/8', '1/16'];
  OrganismFactory.define({
    id: 'eravos.reese-bass', preview: 'bass', domain: 'music', version: '2.0.0', label: 'Reese Bass', icon: '🔈', accent: '#ff2266', phase: 'P2',
    category: 'Bass', blurb: 'Huge rolling drum & bass / neuro bass — detuned saws that breathe and flange.',
    size: { w: 540, h: 400 }, minSize: { w: 420, h: 320 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in'],
    hooks: [
      S.audio_out('reese.hook.audio_out'), S.note_in('reese.hook.note_in'), S.midi_in('reese.hook.midi_in'), S.transport_in('reese.hook.transport_in'),
      S.mod_in('reese.hook.mod_cutoff', 'cutoff'), S.mod_in('reese.hook.mod_comb', 'combTime'), S.mod_in('reese.hook.mod_width', 'width'),
    ],
    config: [
      { key: 'voices', type: 'integer', default: 4, min: 2, max: 6, label: 'Voices', group: 'STACK' },
      { key: 'detune', type: 'number', default: 14, min: 0, max: 50, step: 0.1, unit: 'c', label: 'Detune', group: 'STACK' },
      { key: 'width', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Width', group: 'STACK' },
      { key: 'octave', type: 'integer', default: 0, min: -4, max: 2, label: 'Octave', group: 'PITCH', hint: '0 = as before (a bass octave under the key you play); −1 / −2 = deeper, +1 / +2 = higher' },
      { key: 'transpose', type: 'number', default: 0, min: -36, max: 24, step: 0.1, unit: 'st', label: 'Pitch', group: 'PITCH', hint: 'tune the whole instrument up or down in semitones (−36 … +24, three octaves down) — turn it down when everything sounds too high; decimals detune between notes' },
      { key: 'cutoff', type: 'number', default: 500, min: 30, max: 16000, step: 1, unit: 'Hz', label: 'Cutoff', group: 'FILTER' },
      { key: 'res', type: 'number', default: 1.5, min: 0.5, max: 20, step: 0.1, label: 'Reso', group: 'FILTER' },
      { key: 'envAmt', type: 'number', default: 1.5, min: 0, max: 4, step: 0.01, unit: 'oct', label: 'Env', group: 'FILTER' },
      { key: 'envDecay', type: 'number', default: 0.8, min: 0.05, max: 3, step: 0.01, unit: 's', label: 'Env decay', group: 'FILTER' },
      { key: 'drift', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Drift', group: 'FILTER' },
      { key: 'driftRate', type: 'number', default: 0.2, min: 0.05, max: 2, step: 0.01, unit: 'Hz', label: 'Drift rate', group: 'FILTER' },
      { key: 'combTime', type: 'number', default: 4, min: 1, max: 12, step: 0.01, unit: 'ms', label: 'Comb', group: 'COMB' },
      { key: 'combFb', type: 'number', default: 0.6, min: -0.95, max: 0.95, step: 0.01, label: 'Feedback', group: 'COMB' },
      { key: 'combSync', type: 'boolean', default: true, label: 'Sync', group: 'COMB' },
      { key: 'combRate', type: 'enum', options: DIVS, default: '1/2', label: 'Rate', group: 'COMB' },
      { key: 'combHz', type: 'number', default: 0.5, min: 0.02, max: 10, step: 0.01, unit: 'Hz', label: 'Hz', group: 'COMB' },
      { key: 'combMix', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Comb mix', group: 'COMB' },
      { key: 'dist', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'DRIVE+SUB' },
      { key: 'level', type: 'number', default: 1, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'DRIVE+SUB', hint: 'output level (every instrument has one)' },
      { key: 'sub', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Sub', group: 'DRIVE+SUB' },
      { key: 'keepRange', type: 'boolean', default: true, label: 'Keep in range', group: 'DRIVE+SUB', hint: 'the sub never under 30 Hz, the note never under 25 Hz — lifted by octaves, so it is heard (3.74d sound audit)' },
      { key: 'subOct', type: 'enum', options: ['0', '-1', '-2'], default: '-1', label: 'Sub oct', group: 'DRIVE+SUB', hint: 'the sub against the stack: −1 = an octave under (as before), −2 = two octaves (very deep), 0 = the same pitch' },
      { key: 'subWarm', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Sub harmonics', group: 'DRIVE+SUB', hint: 'adds overtones above the sub so a very deep note is still heard on laptop speakers, phones and headphones (needs Sub above 0)' },
      { key: 'glide', type: 'number', default: 0.08, min: 0, max: 2, step: 0.001, unit: 's', label: 'Glide', group: 'DRIVE+SUB' },
      { key: 'attack', type: 'number', default: 0.01, min: 0.001, max: 6, step: 0.001, unit: 's', label: 'Attack', group: 'DRIVE+SUB' },
      { key: 'release', type: 'number', default: 0.3, min: 0.01, max: 10, step: 0.01, unit: 's', label: 'Release', group: 'DRIVE+SUB' },
    ],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const stackBus = ac.createGain(); stackBus.channelCount = 2;
      const lp1 = ac.createBiquadFilter(), lp2 = ac.createBiquadFilter(); lp1.type = lp2.type = 'lowpass';
      stackBus.connect(lp1); lp1.connect(lp2);
      // audio-rate random-walk drift → cutoff detune
      const walk = ac.createBuffer(1, 64, ac.sampleRate); const r = dsp.mulberry32(77); const wd = walk.getChannelData(0); for (let i = 0; i < 64; i++) wd[i] = r() * 2 - 1;
      const walkSrc = ac.createBufferSource(); walkSrc.buffer = walk; walkSrc.loop = true; walkSrc.start(); ctx.track(walkSrc);
      const walkLp = ac.createBiquadFilter(); walkLp.type = 'lowpass'; walkLp.Q.value = 0.5;
      const walkLp2 = ac.createBiquadFilter(); walkLp2.type = 'lowpass'; walkLp2.Q.value = 0.5;
      const driftG = ac.createGain();
      walkSrc.connect(walkLp); walkLp.connect(walkLp2); walkLp2.connect(driftG); driftG.connect(lp1.detune); driftG.connect(lp2.detune);
      const cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 }); cutMod.connect(lp1.detune); cutMod.connect(lp2.detune);
      // comb (neuro flange)
      const combIn = ac.createGain(), dry = ac.createGain(), wet = ac.createGain();
      const delay = ac.createDelay(0.05), fb = ac.createGain();
      lp2.connect(combIn); combIn.connect(dry); combIn.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet);
      const combLfo = ac.createOscillator(); combLfo.start(); ctx.track(combLfo);
      const combDepth = ac.createGain(); combLfo.connect(combDepth); combDepth.connect(delay.delayTime);
      const combMod = ctx.modBus('combTime', { min: 0.001, max: 0.012 }); combMod.connect(delay.delayTime);
      const dsum = ac.createGain(); dry.connect(dsum); wet.connect(dsum);
      const sh = ac.createWaveShaper(); sh.oversample = '4x'; dsum.connect(sh);
      const sub = ac.createOscillator(); sub.type = 'sine'; sub.start(); ctx.track(sub);
      const subG = ac.createGain(); sub.connect(subG);
      const SUBK = { '0': 1, '-1': 0.5, '-2': 0.25 }, subHz = (h) => { const x = h * (SUBK[P.get('subOct')] || 0.5); return P.get('keepRange') !== false ? dsp.keepRange(x, 30) : x; };   // 3.51 Sub oct · 3.74d never under 30 Hz
      // 3.51 Sub harmonics: a symmetric soft clip of the clean sub → 3rd/5th overtones (82 Hz for a 27 Hz note) the ear rebuilds the low note from
      const warmSh = ac.createWaveShaper(), warmG = ac.createGain(); warmG.gain.value = 0; ctx.track(warmSh); ctx.track(warmG);
      { const wc = new Float32Array(2049), nm = Math.tanh(4); for (let i = 0; i < 2049; i++) wc[i] = Math.tanh(4 * (i / 1024 - 1)) / nm; warmSh.curve = wc; }
      subG.connect(warmSh); warmSh.connect(warmG);
      // 3.39 alignment: the stack reaches amp through the 4x shaper (192 samples late); the clean sub is delayed to match, and
      // everything BEFORE the shaper (stack, glides, filter env, sub pitch) is scheduled LAT early so the gate at t opens on the new note
      const LAT = dsp.osLatency(ac, '4x'), subAl = ac.createDelay(0.05); subAl.delayTime.value = LAT; ctx.track(subAl);
      const amp = ac.createGain(); amp.gain.value = 0; sh.connect(amp); subG.connect(subAl); warmG.connect(subAl); subAl.connect(amp);
      const out = ac.createGain(); out.gain.value = 0.5; amp.connect(out);
      const dcb = ac.createBiquadFilter(); dcb.type = 'highpass'; dcb.frequency.value = 18; dcb.Q.value = 0.5; out.connect(dcb); ctx.track(dcb); // P14: DC blocker (asym drive left offset)
      const lvlOut = ac.createGain(); lvlOut.gain.value = P.get('level'); dcb.connect(lvlOut); ctx.track(lvlOut); P.onChange('level', (v) => dsp.setSmooth(lvlOut.gain, v, ac));
      ctx.port('out', { kind: 'audio', direction: 'out', node: lvlOut, label: 'reese' });
      const widthMod = ctx.modBus('width', { min: 0, max: 1 });

      let stack = []; // {o, pan}
      let held = null, curHz = 55;
      function buildStack(t, hz) {
        stack.forEach(v => { try { v.o.stop(t + 0.02); } catch (e) {} });
        const old = stack; old.forEach(v => { v.o.onended = () => { try { v.o.disconnect(); v.pan.disconnect(); v.g.disconnect(); v.wm.disconnect(); } catch (e) {} ctx.untrack(v.o); }; });
        stack = [];
        const n = P.get('voices'), det = P.get('detune'), w = P.get('width');
        for (let i = 0; i < n; i++) {
          const x = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; // −1..1 symmetric
          const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz; o.frequency.setValueAtTime(hz, t); o.detune.value = x * det;
          const g = ac.createGain(); g.gain.value = 0.7 / Math.sqrt(n);
          const pan = ac.createStereoPanner(); const side = (i % 2 === 0 ? -1 : 1);
          pan.pan.value = side * w;
          const wm = ac.createGain(); wm.gain.value = side; widthMod.connect(wm); wm.connect(pan.pan);
          o.connect(g); g.connect(pan); pan.connect(stackBus);
          // start phase: golden-ratio spread, right side 0.2 period apart from left, ±3 % jitter for analog life.
          // (was fully random: width 1 swung from −0.71 (mono-cancelling) to +0.66 correlation note to note — P10 audit)
          const ph = (((i * 0.381966) + (side > 0 ? 0.2 : 0) + (Math.random() - 0.5) * 0.06) % 1 + 1) % 1;
          // 3.39: the phase was made by DELAYING the voice by ph of a period — up to 18 ms at A1, so every note started late
          // (right voices always 10.6 ms, the left one up to 17.6 ms when the jitter wrapped). Now the voice starts EARLY by the
          // rest of the period: at t it is exactly at phase ph, and the run-in is behind the closed gate. Live input (t = now)
          // cannot run in early — those voices start at once, phase unspread.
          o.start(Math.max(ac.currentTime, t - (1 - ph) / hz));
          ctx.track(o);
          stack.push({ o, pan, g, side, wm });
        }
      }
      function apply() {
        const now = ac.currentTime;
        lp1.frequency.setTargetAtTime(P.get('cutoff'), now, 0.01); lp2.frequency.setTargetAtTime(P.get('cutoff'), now, 0.01);
        lp1.Q.value = P.get('res'); lp2.Q.value = Math.min(2, P.get('res') * 0.3);
        driftG.gain.setTargetAtTime(P.get('drift') * 900, now, 0.05);
        const dr = P.get('driftRate'); walkSrc.playbackRate.value = dr / ac.sampleRate; walkLp.frequency.value = Math.max(0.05, dr * 2); walkLp2.frequency.value = Math.max(0.05, dr * 2);
        const ct = P.get('combTime') / 1000; delay.delayTime.setTargetAtTime(ct, now, 0.01); combDepth.gain.setTargetAtTime(ct * 0.45, now, 0.01);
        fb.gain.setTargetAtTime(P.get('combFb'), now, 0.01);
        const m = P.get('combMix'), ep = dsp.equalPower(m); dry.gain.setTargetAtTime(ep.dry, now, 0.01); wet.gain.setTargetAtTime(ep.wet * (1 - Math.abs(P.get('combFb')) * 0.5), now, 0.01);
        combLfo.frequency.setTargetAtTime(P.get('combSync') ? 1 / MT.divisionSec(P.get('combRate'), ctx.bpm) : P.get('combHz'), now, 0.01);
        sh.curve = dsp.curve('asym', P.get('dist')); subG.gain.setTargetAtTime(P.get('sub') * 0.8, now, 0.01); warmG.gain.setTargetAtTime(P.get('subWarm') * 0.3, now, 0.01);
        out.gain.setTargetAtTime(0.5 / (0.55 + dsp.curveRms(sh.curve) * 0.6), now, 0.02);
        stack.forEach((v, i) => { const n = stack.length, x = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; v.o.detune.setTargetAtTime(x * P.get('detune'), now, 0.01); v.pan.pan.setTargetAtTime(v.side * P.get('width'), now, 0.01); });
      }
      apply();
      ['cutoff', 'res', 'drift', 'driftRate', 'combTime', 'combFb', 'combMix', 'combSync', 'combRate', 'combHz', 'dist', 'sub', 'subWarm', 'detune', 'width'].forEach(k => P.onChange(k, apply));
      ctx.onBpm(() => apply());

      // 3.37 (QA RCA: a second note at the same time counted as legato and cancelAndHoldAtTime froze the gain at the attack's
      // starting 0 — silent chords, then a jump to full level at note-off = click): the envelope position is tracked
      // exactly, so legato and release always continue from where the envelope really is
      let env = { t0: -1, att: 0.001, peak: 0 };
      const envAt = (t) => t <= env.t0 ? 0 : t >= env.t0 + env.att ? env.peak : env.peak * (t - env.t0) / env.att;
      function releaseAt(t) { const g = amp.gain; g.cancelScheduledValues(t); g.setValueAtTime(envAt(t), t); g.setTargetAtTime(0, t, Math.max(0.002, P.get('release') / 4)); }
      const noteHz = (note) => { const f = Math.max(8, MT.hz(Math.max(0, note - 12 + 12 * P.get('octave'))) * Math.pow(2, P.get('transpose') / 12)); return P.get('keepRange') !== false ? dsp.keepRange(f, 25) : f; };   // 3.50 Octave + Pitch · 3.74d never under 25 Hz
      function noteOn(note, vel, t, o) {
        o = o || {};
        t = Math.max(t, ac.currentTime);
        const tp = Math.max(ac.currentTime, t - LAT);   // pre-shaper time
        const hz = noteHz(note);
        const legato = held && held.off > t - 1e-4;
        if (legato) {
          const gl = Math.max(0.005, P.get('glide'));
          stack.forEach(v => { v.o.frequency.cancelScheduledValues(tp); v.o.frequency.setValueAtTime(curHz, tp); v.o.frequency.exponentialRampToValueAtTime(hz, tp + gl); });
          sub.frequency.cancelScheduledValues(tp); sub.frequency.setValueAtTime(subHz(curHz), tp); sub.frequency.exponentialRampToValueAtTime(subHz(hz), tp + gl);
          const g = amp.gain, v = envAt(t); g.cancelScheduledValues(t); g.setValueAtTime(v, t);
          if (t < env.t0 + env.att) g.linearRampToValueAtTime(env.peak, env.t0 + env.att); else g.setValueAtTime(env.peak, t + 0.002);
        } else {
          buildStack(tp, hz);
          sub.frequency.cancelScheduledValues(tp); sub.frequency.setValueAtTime(subHz(hz), tp);
          env = { t0: t, att: Math.max(0.001, P.get('attack')), peak: 0.5 + 0.5 * vel };
          amp.gain.cancelScheduledValues(t); amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(env.peak, t + env.att);
          // filter env
          const c = P.get('cutoff'), pk = Math.min(18000, c * Math.pow(2, P.get('envAmt')));
          [lp1, lp2].forEach(b => { b.frequency.cancelScheduledValues(tp); b.frequency.setValueAtTime(pk, tp); b.frequency.setTargetAtTime(c, tp + 0.005, P.get('envDecay') / 3); });
        }
        curHz = hz;
        const off = o.duration !== undefined ? t + o.duration : Infinity;
        held = { note, off };
        if (off !== Infinity) { const g = amp.gain; if (off < env.t0 + env.att) { g.cancelScheduledValues(off); g.setValueAtTime(envAt(off), off); } g.setTargetAtTime(0, off, Math.max(0.002, P.get('release') / 4)); }
      }
      function noteOff(note, t) { if (!held || held.note !== note) return; t = Math.max(ac.currentTime, t || 0); releaseAt(t); held.off = t; }
      ['octave', 'transpose'].forEach(k => P.onChange(k, () => {   // retune a held note live
        if (!held || held.off <= ac.currentTime) return;
        const hz = noteHz(held.note), t = ac.currentTime;
        stack.forEach(v => { v.o.frequency.cancelScheduledValues(t); v.o.frequency.setValueAtTime(curHz, t); v.o.frequency.exponentialRampToValueAtTime(hz, t + 0.03); });
        sub.frequency.cancelScheduledValues(t); sub.frequency.setValueAtTime(subHz(curHz), t); sub.frequency.exponentialRampToValueAtTime(subHz(hz), t + 0.03);
        curHz = hz;
      }));
      P.onChange('subOct', () => { if (held && held.off > ac.currentTime) sub.frequency.setTargetAtTime(subHz(curHz), ac.currentTime, 0.02); });
      ctx.noteOn = noteOn;
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, { duration: p.duration }));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note); });
      ctx.audition = (p) => noteOn(p.note || 45, 0.9, ac.currentTime, { duration: p.duration || 1.5 });
      ctx.auditionOff = (p) => noteOff(p.note || 45);
      return {};
    },
  });
})();
