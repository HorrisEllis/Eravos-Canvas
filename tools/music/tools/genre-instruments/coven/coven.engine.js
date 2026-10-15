/* eravos.coven 1.0.0 — Coven · spec eravos.organism.coven
 * Weird, witchy music (witch house, dark wave, ritual drone). A choir that CHANTS: every held note is a small coven
 * of detuned voices (saws + breath) through a three-formant mouth; the mouth walks a vowel sequence you type
 * ("O A E A", "U O U I") one syllable per division, gliding between vowels. HEX rings the choir against a
 * sine at an (often irrational) ratio of the note — bells, ghosts. SCREW drags everything down in pitch and time
 * feel; STATIC crushes and decimates; SUMMON grows a drone (sub-octave + fifth) the longer a chord is held. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const VOWELS = { A: [800, 1150, 2900], E: [400, 2000, 2550], I: [280, 2250, 2890], O: [450, 800, 2830], U: [325, 700, 2530], Y: [300, 1700, 2400] };
  const HEX = { off: 0, 'φ': 1.6180339887, '√2': Math.SQRT2, 'π': Math.PI, '7/4': 1.75, '13/8': 1.625, 'e': Math.E };
  OrganismFactory.define({
    id: 'eravos.coven', preview: 'chord', domain: 'music', version: '1.0.0', label: 'Coven', icon: '⛧', accent: '#c4002f', phase: 'P14',
    category: 'Genre instruments', blurb: 'Witch-house choir that chants vowel spells on the beat: hex ring-mod, screw pitch-down, static, a drone that summons itself.',
    size: { w: 560, h: 600 }, minSize: { w: 440, h: 460 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.pad'],
    needs: { works_with: ['eravos.organ', 'eravos.fx-haunt', 'eravos.drum-forge', 'eravos.timeline'] },
    hooks: [S.audio_out('cov.hook.audio_out'), S.note_in('cov.hook.note_in'), S.midi_in('cov.hook.midi_in'), S.theory_in('cov.hook.theory_in'), S.transport_in('cov.hook.transport_in'), S.mod_in('cov.hook.mod_screw', 'screw')],
    config: [
      { key: 'chant', type: 'string', default: 'O A E A', label: 'Chant (vowels A E I O U Y)', group: 'CHANT' },
      { key: 'chantDiv', type: 'enum', options: ['1/1', '1/2', '1/4', '1/8', '1/4t'], default: '1/4', label: 'Syllable', group: 'CHANT' },
      { key: 'glide', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Mouth glide', group: 'CHANT' },
      { key: 'voices', type: 'integer', default: 4, min: 1, max: 7, label: 'Voices', group: 'CHOIR' },
      { key: 'spread', type: 'number', default: 18, min: 0, max: 60, step: 0.1, unit: '¢', label: 'Spread', group: 'CHOIR' },
      { key: 'breath', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Breath', group: 'CHOIR' },
      { key: 'vibrato', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Vibrato', group: 'CHOIR' },
      { key: 'hex', type: 'enum', options: Object.keys(HEX), default: 'off', label: 'Hex ratio', group: 'HEX' },
      { key: 'hexMix', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Hex', group: 'HEX' },
      { key: 'screw', type: 'number', default: 0, min: 0, max: 12, step: 0.1, unit: 'st', label: 'Screw', group: 'DARK', hint: 'drags the whole coven down' },
      { key: 'static', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Static', group: 'DARK' },
      { key: 'summon', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Summon', group: 'DARK', hint: 'drone grows under long-held chords' },
      { key: 'dark', type: 'number', default: 3200, min: 300, max: 12000, step: 1, unit: 'Hz', label: 'Darkness', group: 'DARK' },
      { key: 'attack', type: 'number', default: 0.6, min: 0.005, max: 6, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'release', type: 'number', default: 2.2, min: 0.05, max: 10, step: 0.01, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'level', type: 'number', default: 0.7, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    defaultPreset: 'Witch House Choir',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory, node = (n) => { ctx.track(n); return n; };
      // the mouth: three formant bands shared by the coven (one mouth, many throats)
      const throats = node(ac.createGain()), mouth = [0, 1, 2].map(i => { const b = node(ac.createBiquadFilter()); b.type = 'bandpass'; b.Q.value = [9, 11, 12][i]; const g = node(ac.createGain()); g.gain.value = [1.6, 0.9, 0.45][i]; throats.connect(b); b.connect(g); return { b, g }; });
      const mouthOut = node(ac.createGain()); mouth.forEach(m => m.g.connect(mouthOut));
      const raw = node(ac.createGain()); raw.gain.value = 0.12; throats.connect(raw); raw.connect(mouthOut);
      // hex ring modulation (carrier set per note; one global modulator follows the last note)
      const ringIn = node(ac.createGain()), ringOut = node(ac.createGain()), ringDry = node(ac.createGain()), carrier = node(ac.createOscillator()); ringIn.gain.value = 0; carrier.connect(ringIn.gain); carrier.start();
      mouthOut.connect(ringIn); ringIn.connect(ringOut); mouthOut.connect(ringDry);
      const sum = node(ac.createGain()); ringOut.connect(sum); ringDry.connect(sum);
      const crush = node(ac.createWaveShaper()), dark = node(ac.createBiquadFilter()), level = node(ac.createGain()); dark.type = 'lowpass'; dark.Q.value = 0.6;
      sum.connect(crush); crush.connect(dark); dark.connect(level);
      const droneBus = node(ac.createGain()); droneBus.connect(dark);
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'coven' });
      const screwMod = ctx.modBus('screw', { min: -1200, max: 1200 });
      function apply() {
        const t = ac.currentTime; dark.frequency.setTargetAtTime(P.get('dark'), t, 0.05);
        const hx = HEX[P.get('hex')] || 0, m = hx ? P.get('hexMix') : 0; dsp.setSmooth(ringOut.gain, m * 1.4, ac); dsp.setSmooth(ringDry.gain, 1 - m * 0.85, ac);
        const st = P.get('static'); crush.curve = st > 0 ? dsp.curve('crush', Math.max(2, Math.round(10 - st * 7))) : dsp.curve('soft', 0.05);
        dsp.setSmooth(level.gain, P.get('level') * 0.8, ac);
        voices.forEach(v => v.osc.forEach(o => o.detune.setTargetAtTime(o._det - P.get('screw') * 100, t, 0.4)));
      }
      // chant: the vowel walk, per division on the transport; still moves (slowly) without it
      let seq = [], idx = 0;
      function parse() { seq = String(P.get('chant')).toUpperCase().split(/[^AEIOUY]+/).join('').split('').filter(c => VOWELS[c]); if (!seq.length) seq = ['A']; idx = 0; }
      function vowelTo(v, t) { const F = VOWELS[v], g = Math.max(0.005, P.get('glide') * MT.divisionSec(P.get('chantDiv'), ctx.bpm) * 0.6); mouth.forEach((m, i) => { m.b.frequency.cancelScheduledValues(t); m.b.frequency.setTargetAtTime(F[i] * Math.pow(2, -P.get('screw') / 36), t, g / 3); }); ctx.emitUI('vowel', { v, i: idx }); }
      parse(); vowelTo(seq[0], ac.currentTime);
      P.onChange('chant', () => { parse(); vowelTo(seq[0], ac.currentTime); });
      let lastTickAt = -1;
      ctx.onTick((tk) => { lastTickAt = ac.currentTime; const st = Math.max(1, Math.round(MT.divisionBeats(P.get('chantDiv')) * 4)); if (tk.step16 % st === 0) { idx = (idx + 1) % seq.length; vowelTo(seq[idx], tk.time); } });
      ctx.interval(() => { if (ac.currentTime - lastTickAt < 1 || !voices.length || seq.length < 2) return; idx = (idx + 1) % seq.length; vowelTo(seq[idx], ac.currentTime); }, 1400); // free-running chant when nothing plays the clock
      // choir voices
      const voices = []; const rnd = dsp.mulberry32(666); let drone = null;
      function noteOn(note, vel, t, dur) {
        t = Math.max(t || ac.currentTime, ac.currentTime);
        while (voices.length >= 8) kill(voices[0], t);
        const f = MT.hz(note), env = ac.createGain(); env.gain.value = 0; env.connect(throats);
        const N = P.get('voices'), sp = P.get('spread'), osc = [], nodes = [env];
        for (let i = 0; i < N; i++) {
          const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o._det = N > 1 ? (i / (N - 1) - 0.5) * 2 * sp + (rnd() - 0.5) * sp * 0.3 : 0; o.detune.value = o._det - P.get('screw') * 100;
          screwMod.connect(o.detune);
          const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 4.2 + rnd() * 1.6; vg.gain.value = P.get('vibrato') * (12 + rnd() * 10); vib.connect(vg); vg.connect(o.detune);
          const og = ac.createGain(); og.gain.value = 0.28 / Math.sqrt(N); o.connect(og); og.connect(env); o.start(t); vib.start(t); osc.push(o); nodes.push(o, vib, vg, og);
        }
        const br = P.get('breath'); if (br > 0) { const n = dsp.noiseSource(ac, 'pink'), bg = ac.createGain(); bg.gain.value = br * 0.25; n.connect(bg); bg.connect(env); n.start(t, rnd()); osc.push(n); nodes.push(n, bg); }
        const hx = HEX[P.get('hex')]; if (hx) carrier.frequency.setValueAtTime(f * hx * Math.pow(2, -P.get('screw') / 12), t);
        env.gain.setValueAtTime(0, t); env.gain.setTargetAtTime(0.3 + 0.7 * vel, t, Math.max(0.002, P.get('attack') / 3));
        const v = { note, env, osc, nodes, off: Infinity, t }; voices.push(v);
        if (dur !== undefined) release(v, t + dur);
        summon(t); return v;
      }
      function summon(t) {
        const held = voices.filter(v => v.off === Infinity || v.off > t), amt = P.get('summon');
        if (!held.length || amt <= 0) { if (drone) { const d = drone; drone = null; d.g.gain.setTargetAtTime(0, t, 0.8); d.o.forEach(o => o.stop(t + 4)); } return; }
        const low = Math.min(...held.map(v => v.note)); if (drone && drone.note === low) return;
        if (drone) { const d = drone; d.g.gain.setTargetAtTime(0, t, 0.5); d.o.forEach(o => o.stop(t + 3)); }
        const f = MT.hz(low) * Math.pow(2, -P.get('screw') / 12), g = ac.createGain(); g.gain.value = 0; g.connect(droneBus);
        const o = [[0.5, 0.2], [0.75, 0.08], [0.25, 0.12]].map(([k, a]) => { const x = ac.createOscillator(); x.type = 'triangle'; x.frequency.value = f * k; const xg = ac.createGain(); xg.gain.value = a; x.connect(xg); xg.connect(g); x.start(t); return x; });
        g.gain.setTargetAtTime(amt * 0.8, t, 3 + 4 * amt); drone = { note: low, g, o };     // grows over seconds
      }
      let release = function (v, t) { if (v.off !== Infinity && v.off <= t) return; v.off = t; const R = P.get('release'); dsp.release(v.env.gain, t, R); v.osc.forEach(o => { try { o.stop(t + R * 1.7 + 0.1); } catch (e) {} }); v.nodes.forEach(n => { if (n.stop && !v.osc.includes(n)) try { n.stop(t + R * 1.7 + 0.1); } catch (e) {} }); v.osc[0].onended = () => { v.osc.forEach(o => { if (o.detune) try { screwMod.disconnect(o.detune); } catch (e) {} }); v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); }; setTimeout(() => summon(ac.currentTime), Math.max(0, (t - ac.currentTime) * 1000) + 10); }
      function kill(v, t) { const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); v.env.gain.cancelScheduledValues(t); v.env.gain.setTargetAtTime(0, t, 0.02); v.nodes.forEach(n => { if (n.stop) try { n.stop(t + 0.1); } catch (e) {} }); }
      ['dark', 'hex', 'hexMix', 'static', 'level', 'screw'].forEach(k => P.onChange(k, apply)); apply();
      // 3.28 (RCA: the Summon drone never ended — release() never re-checked it): re-check when each note lets go
      const _rel = release; release = function (v, t) { _rel(v, t); ctx.atAudioTime(t + 0.005, () => summon(ac.currentTime)); };
      ctx.onSilence((p) => { const t = Math.max(ac.currentTime, p.time || 0); voices.filter(v => v.off === Infinity || v.off > t).forEach(v => p.hard ? kill(v, t) : _rel(v, t)); summon(t + 0.001); if (drone) { const d = drone; drone = null; d.g.gain.cancelScheduledValues(t); d.g.gain.setTargetAtTime(0, t, p.hard ? 0.01 : 0.6); d.o.forEach(o => { try { o.stop(t + (p.hard ? 0.1 : 4)); } catch (e) {} }); } });
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => p.on ? noteOn(p.note, p.velocity) : voices.filter(v => v.note === p.note && v.off === Infinity).forEach(v => release(v, ac.currentTime)));
      ctx.audition = (p) => noteOn(p.note || 57, p.velocity || 0.8, ac.currentTime, p.duration || 3);
      ctx.auditionOff = (p) => voices.filter(v => v.note === (p.note || 57) && v.off === Infinity).forEach(v => release(v, ac.currentTime));
      ctx.internals = { voices, get seq() { return seq; }, mouth, get drone() { return drone; } };
      ctx.onDispose(() => voices.slice().forEach(v => kill(v, ac.currentTime)));
      return {};
    },
  });
})();
