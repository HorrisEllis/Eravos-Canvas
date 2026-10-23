/* eravos.retro-poly 1.0.0 — Retro Poly · spec eravos.organism.retro-poly
 * Synthwave / outrun / darksynth poly in the 80s DCO tradition: per voice a saw + a TRUE pulse-width-modulated pulse
 * (saw minus its own delayed copy — width = delay·f, so PWM is a moving delay), a sub square, noise, a 24 dB low-pass
 * with its own envelope and key-tracking, analog DRIFT (each voice wanders a few cents on its own slow path).
 * Global: high-pass, BBD-style chorus I / II / I+II, unison stack for leads, mono + glide, and a transport-locked
 * ARPEGGIATOR over held keys (up · down · up-down · random · as played; 1–3 octaves; gate). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.retro-poly', preview: 'chord', domain: 'music', version: '1.0.0', label: 'Retro Poly', icon: '🌆', accent: '#ff2bd6', phase: 'P14',
    category: 'Genre instruments', blurb: 'Synthwave poly: PWM pulse + saw + sub, analog drift, 24 dB filter, BBD chorus, unison, glide, arpeggiator.',
    size: { w: 580, h: 640 }, minSize: { w: 460, h: 480 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.lead_voice'],
    needs: { works_with: ['eravos.drum-forge', 'eravos.pad-forge', 'eravos.fx-echo', 'eravos.timeline'] },
    hooks: [S.audio_out('rp.hook.audio_out'), S.note_in('rp.hook.note_in'), S.midi_in('rp.hook.midi_in'), S.theory_in('rp.hook.theory_in'), S.transport_in('rp.hook.transport_in'),
      S.mod_in('rp.hook.mod_cutoff', 'cutoff'), S.mod_in('rp.hook.mod_pwm', 'pwm')],
    config: [
      { key: 'saw', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Saw', group: 'DCO' },
      { key: 'pulse', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Pulse', group: 'DCO' },
      { key: 'width', type: 'number', default: 0.35, min: 0.05, max: 0.5, step: 0.001, label: 'Width', group: 'DCO' },
      { key: 'pwm', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'PWM', group: 'DCO' },
      { key: 'pwmRate', type: 'number', default: 0.6, min: 0.05, max: 8, step: 0.01, unit: 'Hz', label: 'PWM rate', group: 'DCO' },
      { key: 'sub', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Sub', group: 'DCO' },
      { key: 'noise', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Noise', group: 'DCO' },
      { key: 'drift', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Drift', group: 'DCO' },
      { key: 'octave', type: 'integer', default: 0, min: -4, max: 4, label: 'Octave', group: 'DCO' },
      { key: 'cutoff', type: 'number', default: 2400, min: 60, max: 16000, step: 1, unit: 'Hz', label: 'Cutoff', group: 'VCF' },
      { key: 'res', type: 'number', default: 3, min: 0.3, max: 20, step: 0.1, label: 'Reso', group: 'VCF' },
      { key: 'envAmt', type: 'number', default: 0.5, min: -1, max: 1, step: 0.01, label: 'Env amt', group: 'VCF' },
      { key: 'keytrack', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Keytrack', group: 'VCF' },
      { key: 'hpf', type: 'integer', default: 0, min: 0, max: 3, label: 'HPF', group: 'VCF' },
      { key: 'fA', type: 'number', default: 0.005, min: 0.001, max: 4, step: 0.001, unit: 's', label: 'F att', group: 'ENV' },
      { key: 'fD', type: 'number', default: 0.35, min: 0.01, max: 6, step: 0.01, unit: 's', label: 'F dec', group: 'ENV' },
      { key: 'fS', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'F sus', group: 'ENV' },
      { key: 'attack', type: 'number', default: 0.005, min: 0.001, max: 5, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'decay', type: 'number', default: 0.5, min: 0.01, max: 6, step: 0.01, unit: 's', label: 'Decay', group: 'ENV' },
      { key: 'sustain', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'ENV' },
      { key: 'release', type: 'number', default: 0.4, min: 0.01, max: 8, step: 0.01, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'chorus', type: 'enum', options: ['off', 'I', 'II', 'I+II'], default: 'I', label: 'Chorus', group: 'FX' },
      { key: 'unison', type: 'integer', default: 1, min: 1, max: 4, label: 'Unison', group: 'FX' },
      { key: 'mono', type: 'boolean', default: false, label: 'Mono', group: 'FX' },
      { key: 'glide', type: 'number', default: 0, min: 0, max: 3, step: 0.001, unit: 's', label: 'Glide', group: 'FX' },
      { key: 'arp', type: 'enum', options: ['off', 'up', 'down', 'up-down', 'random', 'played'], default: 'off', label: 'Arp', group: 'ARP' },
      { key: 'arpDiv', type: 'enum', options: ['1/4', '1/8', '1/16', '1/8t', '1/16t'], default: '1/16', label: 'Rate', group: 'ARP' },
      { key: 'arpOct', type: 'integer', default: 1, min: 1, max: 3, label: 'Octaves', group: 'ARP' },
      { key: 'arpGate', type: 'number', default: 0.55, min: 0.05, max: 1, step: 0.01, label: 'Gate', group: 'ARP' },
      { key: 'arpHold', type: 'boolean', default: false, label: 'Latch', group: 'ARP' },
      { key: 'level', type: 'number', default: 0.6, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    defaultPreset: 'Outrun Lead',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory, node = (n) => { ctx.track(n); return n; };
      const bus = node(ac.createGain()), hp = node(ac.createBiquadFilter()); hp.type = 'highpass'; bus.connect(hp);
      const cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 }), pwmMod = ctx.modBus('pwm', { min: -1, max: 1 });
      // chorus: two BBD lines, stereo
      const merge = node(ac.createChannelMerger(2)), dryL = node(ac.createGain()), dryR = node(ac.createGain()); hp.connect(dryL); hp.connect(dryR); dryL.connect(merge, 0, 0); dryR.connect(merge, 0, 1);
      const ch = [0, 1].map(i => { const d = node(ac.createDelay(0.05)), l = node(ac.createOscillator()), g = node(ac.createGain()), w = node(ac.createGain()), inv = node(ac.createGain()); d.delayTime.value = 0.0045; l.connect(g); g.connect(d.delayTime); l.start(); hp.connect(d); d.connect(w); w.connect(merge, 0, i); d.connect(inv); inv.gain.value = -0.0; inv.connect(merge, 0, 1 - i); return { d, l, g, w }; });
      const level = node(ac.createGain()); merge.connect(level);
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'retro poly' });
      const pwmL = node(ac.createOscillator()); pwmL.start(); const pwmBus = node(ac.createGain()); pwmL.connect(pwmBus); pwmMod.connect(pwmBus);
      function apply() {
        const t = ac.currentTime, c = P.get('chorus');
        hp.frequency.setTargetAtTime([10, 120, 260, 520][P.get('hpf')], t, 0.02);
        ch[0].l.frequency.value = c === 'II' ? 0.83 : 0.51; ch[1].l.frequency.value = c === 'I' ? 0.51 * 1.03 : 0.83 * 1.02;
        ch.forEach((x, i) => { x.g.gain.setTargetAtTime(c === 'off' ? 0 : c === 'I+II' ? 0.0028 : 0.0019, t, 0.02); x.w.gain.setTargetAtTime(c === 'off' ? 0 : 0.6, t, 0.02); });
        pwmL.frequency.setTargetAtTime(P.get('pwmRate'), t, 0.02); dsp.setSmooth(level.gain, P.get('level') * 0.7, ac);
      }
      ['chorus', 'hpf', 'pwmRate', 'level'].forEach(k => P.onChange(k, apply)); apply();
      const rnd = dsp.mulberry32(84);
      const voices = [];
      function voice(f, t, vel) {
        const nodes = [], mk = (n) => { nodes.push(n); return n; }, pitched = [], unhook = [];
        const amp = mk(ac.createGain()), lp1 = mk(ac.createBiquadFilter()), lp2 = mk(ac.createBiquadFilter()); amp.gain.value = 0; lp1.type = lp2.type = 'lowpass'; lp1.Q.value = P.get('res'); lp2.Q.value = 0.7;
        cutMod.connect(lp1.detune); cutMod.connect(lp2.detune); unhook.push(() => { cutMod.disconnect(lp1.detune); cutMod.disconnect(lp2.detune); }); lp1.connect(lp2); lp2.connect(amp); amp.connect(bus);
        const oscs = [], U = P.get('mono') ? P.get('unison') : 1;
        for (let u = 0; u < U; u++) {
          const det = U > 1 ? (u - (U - 1) / 2) * 11 : 0;
          const saw = mk(ac.createOscillator()); saw.type = 'sawtooth'; saw.frequency.value = f; saw.detune.value = det;
          const sg = mk(ac.createGain()); sg.gain.value = P.get('saw') * 0.22 / Math.sqrt(U); saw.connect(sg); sg.connect(lp1);
          // true PWM: pulse = saw − saw delayed by width/f
          const dl = mk(ac.createDelay(0.1)), pos = mk(ac.createGain()), neg = mk(ac.createGain()); dl.delayTime.value = P.get('width') / f; pos.gain.value = P.get('pulse') * 0.2 / Math.sqrt(U); neg.gain.value = -P.get('pulse') * 0.2 / Math.sqrt(U);
          const pw = mk(ac.createGain()); pw.gain.value = P.get('pwm') * 0.4 * P.get('width') / f; pwmBus.connect(pw); unhook.push(() => pwmBus.disconnect(pw)); pw.connect(dl.delayTime);
          saw.connect(pos); saw.connect(dl); dl.connect(neg); pos.connect(lp1); neg.connect(lp1);
          oscs.push(saw); pitched.push({ o: saw, k: 1, dl }); saw.start(t);
        }
        const sub = mk(ac.createOscillator()); sub.type = 'square'; sub.frequency.value = f / 2; const sbg = mk(ac.createGain()); sbg.gain.value = P.get('sub') * 0.14; sub.connect(sbg); sbg.connect(lp1); sub.start(t); oscs.push(sub); pitched.push({ o: sub, k: 0.5 });
        if (P.get('noise') > 0) { const n = mk(dsp.noiseSource(ac, 'white')); const ng = mk(ac.createGain()); ng.gain.value = P.get('noise') * 0.1; n.connect(ng); ng.connect(lp1); n.start(t, rnd()); oscs.push(n); }
        // drift: each voice its own slow wander
        const dr = P.get('drift'); if (dr > 0) { const l = mk(ac.createOscillator()), lg = mk(ac.createGain()); l.frequency.value = 0.08 + rnd() * 0.25; lg.gain.value = dr * 9; l.connect(lg); oscs.forEach(o => { if (o.detune) lg.connect(o.detune); }); l.start(t); oscs.push(l); oscs.forEach(o => { if (o.detune) o.detune.value += (rnd() - 0.5) * dr * 6; }); }
        // filter env
        const base = Math.min(16000, P.get('cutoff') * Math.pow(f / 261.6, P.get('keytrack') * 0.8)), env = P.get('envAmt'), peak = Math.max(40, Math.min(18000, base * Math.pow(2, env * 5)));
        lp1.frequency.setValueAtTime(base, t); lp1.frequency.linearRampToValueAtTime(peak, t + P.get('fA')); lp1.frequency.setTargetAtTime(base + (peak - base) * P.get('fS'), t + P.get('fA'), P.get('fD') / 3);
        lp2.frequency.value = Math.min(18000, peak * 1.6);
        const top = 0.25 + 0.75 * vel; dsp.adsr(amp.gain, t, { a: P.get('attack'), d: P.get('decay'), s: P.get('sustain'), peak: top });
        return { amp, lp1, oscs, nodes, f, pitched, unhook, sus: top * P.get('sustain') };
      }
      function noteOn(note, vel, t, dur) {
        t = Math.max(t || ac.currentTime, ac.currentTime); const f = MT.hz(Math.max(0, note + 12 * P.get('octave')));
        if (P.get('mono') && voices.length) {
          const v = voices[voices.length - 1];
          if (v.off === Infinity || v.off > t) { const g = P.get('glide'); v.voice.pitched.forEach(({ o, k, dl }) => { o.frequency.cancelScheduledValues(t); o.frequency.setValueAtTime(o.frequency.value, t); if (g > 0) o.frequency.exponentialRampToValueAtTime(f * k, t + g); else o.frequency.setValueAtTime(f * k, t); if (dl) dl.delayTime.setTargetAtTime(P.get('width') / f, t, Math.max(0.005, g / 3)); }); v.voice.f = f; v.note = note;
            // 3.53 legato: the note this one takes over had its release (and its oscillators' stop) booked for ITS end — inside
            // this note. Unbook it: hold the level here and settle back to sustain; rel() below books the new end (a source may
            // be given a new stop time until it has stopped). Before, overlapping lead notes went silent from the first old end on.
            const a = v.voice.amp.gain; if (typeof a.cancelAndHoldAtTime === 'function') a.cancelAndHoldAtTime(t); else a.cancelScheduledValues(t); a.setTargetAtTime(v.voice.sus, t, 0.008);
            v.off = Infinity; if (dur !== undefined) rel(v, t + dur); else v.voice.oscs.forEach(o => { try { o.stop(t + 3600); } catch (e) {} }); return v; }
        }
        while (voices.length >= 6 || (P.get('mono') && voices.length)) kill(voices[0], t);
        const v = { note, voice: voice(f, t, vel), off: Infinity }; voices.push(v);
        if (dur !== undefined) rel(v, t + dur);
        return v;
      }
      function rel(v, t) { v.off = t; const R = P.get('release'); dsp.release(v.voice.amp.gain, t, R); v.voice.oscs.forEach(o => { try { o.stop(t + R * 1.7 + 0.1); } catch (e) {} }); const last = v.voice.oscs[0]; last.onended = () => { v.voice.unhook.forEach(fn => { try { fn(); } catch (e) {} }); v.voice.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); }; }
      function kill(v, t) { const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); v.voice.amp.gain.cancelScheduledValues(t); v.voice.amp.gain.setTargetAtTime(0, t, 0.006); v.voice.oscs.forEach(o => { try { o.stop(t + 0.05); } catch (e) {} }); v.voice.oscs[0].onended = () => { v.voice.unhook.forEach(fn => { try { fn(); } catch (e) {} }); v.voice.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); }; }
      function noteOff(note, t) { voices.filter(v => v.note === note && v.off === Infinity).forEach(v => rel(v, t || ac.currentTime)); }
      // ---- arpeggiator over held keys
      const held = []; let arpI = 0;
      function arpSeq() {
        const base = P.get('arp') === 'played' ? held.slice() : held.slice().sort((a, b) => a - b), seq = [];
        for (let o = 0; o < P.get('arpOct'); o++) base.forEach(n => seq.push(n + 12 * o));
        const m = P.get('arp'); if (m === 'down') seq.reverse(); if (m === 'up-down' && seq.length > 2) return seq.concat(seq.slice(1, -1).reverse());
        return seq;
      }
      const STEP = { '1/4': 4, '1/8': 2, '1/16': 1, '1/8t': 4 / 3, '1/16t': 2 / 3 };
      ctx.onTick((tk) => {
        if (P.get('arp') === 'off' || !held.length) return;
        const st = STEP[P.get('arpDiv')], sd = 60 / ctx.bpm / 4;
        const hits = st >= 1 ? (tk.step16 % Math.round(st) === 0 ? [0] : []) : st === 2 / 3 ? [0, 2 / 3] : [];
        const triplet = st === 4 / 3 ? (tk.step16 % 4 === 0 ? [0, 4 / 3, 8 / 3] : []) : null;
        (triplet || hits).forEach(off => { const seq = arpSeq(); if (!seq.length) return; const n = P.get('arp') === 'random' ? seq[Math.floor(rnd() * seq.length)] : seq[arpI++ % seq.length]; noteOn(n, 0.85, tk.time + off * sd, Math.max(0.02, st * sd * P.get('arpGate'))); });
      });
      const press = (note, vel, t, dur) => { if (P.get('arp') === 'off') return noteOn(note, vel, t, dur); if (!P.get('arpHold') || !held.length || held._released) { if (held._released) { held.length = 0; held._released = false; } } if (!held.includes(note)) held.push(note); if (dur !== undefined) setTimeout(() => lift(note), dur * 1000); };
      const lift = (note) => { if (P.get('arp') === 'off') return noteOff(note); if (P.get('arpHold')) { held._released = true; return; } const i = held.indexOf(note); if (i >= 0) held.splice(i, 1); };
      P.onChange('arp', (v) => { if (v === 'off') held.length = 0; arpI = 0; });
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));        // sequenced notes play directly
      ctx.onMidi((p) => p.on ? press(p.note, p.velocity) : lift(p.note));      // hands feed the arp
      ctx.audition = (p) => press(p.note || 60, p.velocity || 0.8, ac.currentTime, P.get('arp') === 'off' ? (p.duration || 1) : undefined);
      ctx.auditionOff = (p) => lift(p.note || 60);
      ctx.internals = { voices, held, arpSeq };
      ctx.onDispose(() => voices.slice().forEach(v => kill(v, ac.currentTime)));
      return {};
    },
  });
})();
