/* eravos.wub-osc 1.0.0 — Wub Osc · spec wub-osc.spec
 * The raw tone of a wobble bass, and nothing else: one monophonic voice (legato, glide, pitch dive) built from
 *   saw · square · reese (detuned saws that breathe) · fm (2-operator growl, ratio + index) · hollow (square + saw 8va)
 * with 1–7 unison copies spread in pitch and stereo. No filter, no LFO, no sub: wire its output into Wub Filter,
 * let Wub Rate open the filter, and put Wub Sub underneath. Its violet inputs bend pitch, FM index and spread.
 * Pitch lives on one ConstantSource (Hz) that every oscillator follows, so glide and dives move the whole stack. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const WAVES = ['saw', 'square', 'reese', 'fm', 'hollow'];
  const RATIOS = ['0.5', '1', '1.5', '2', '3', '4'];
  OrganismFactory.define({
    id: 'eravos.wub-osc', domain: 'music', version: '1.0.0', label: 'Wub Osc', icon: '〰', accent: '#ff2266',
    category: 'Wubs', blurb: 'The raw wobble tone — saw, square, reese, FM growl — mono, glide, unison. Wire it into Wub Filter.',
    size: { w: 520, h: 520 }, minSize: { w: 400, h: 360 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.wub_source'],
    slots: [{ id: 'tone', label: 'its own tone', wire_type: 'audio', hint: 'empty — a Destroyer or a Wub Filter here makes this one window a whole wub' }],   // 3.42 mods: any effect can live inside (canvas/runtime/mods.js)
    face: ['wave', 'octave', 'index', 'voices', 'spread', 'level'],
    links: [{ with: 'eravos.wub-filter', dir: 'out', face: ['mode', 'cutoff', 'range', 'res', 'position', 'drive'], hint: 'the mouth it speaks through' },
            { with: 'eravos.wub-sub', face: ['wave', 'octave', 'cut', 'level'], hint: 'the sub under it' }],

    hooks: [
      S.audio_out('wubo.hook.audio_out'), S.note_in('wubo.hook.note_in'), S.midi_in('wubo.hook.midi_in'),
      S.mod_in('wubo.hook.mod_pitch', 'pitch'), S.mod_in('wubo.hook.mod_fm', 'fm'), S.mod_in('wubo.hook.mod_spread', 'spread'),
    ],
    config: [
      { key: 'wave', type: 'enum', options: WAVES, default: 'saw', label: 'Wave', group: 'TONE' },
      { key: 'octave', type: 'integer', default: -1, min: -3, max: 1, label: 'Octave', group: 'TONE' },
      { key: 'fine', type: 'number', default: 0, min: -100, max: 100, step: 1, unit: 'c', label: 'Fine', group: 'TONE' },
      { key: 'ratio', type: 'enum', options: RATIOS, default: '1', label: 'FM ratio', group: 'FM', hint: 'modulator pitch ÷ carrier pitch: 1 and 2 growl, 1.5 and 3 clang' },
      { key: 'index', type: 'number', default: 2.5, min: 0, max: 12, step: 0.01, label: 'FM index', group: 'FM', hint: 'how hard the modulator bends the carrier: more = brighter, dirtier' },
      { key: 'voices', type: 'integer', default: 3, min: 1, max: 7, label: 'Unison', group: 'UNISON' },
      { key: 'spread', type: 'number', default: 14, min: 0, max: 60, step: 0.1, unit: 'c', label: 'Spread', group: 'UNISON' },
      { key: 'width', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Width', group: 'UNISON' },
      { key: 'drift', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Drift', group: 'UNISON', hint: 'slow movement in the spread — the reese breathing' },
      { key: 'glide', type: 'number', default: 0.05, min: 0, max: 0.6, step: 0.001, unit: 's', label: 'Glide', group: 'ENV' },
      { key: 'attack', type: 'number', default: 0.004, min: 0.001, max: 1, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'release', type: 'number', default: 0.1, min: 0.01, max: 2, step: 0.001, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'dive', type: 'number', default: 0, min: -24, max: 24, step: 0.1, unit: 'st', label: 'Dive', group: 'ENV', hint: 'each new note starts this far away and drops into pitch' },
      { key: 'diveTime', type: 'number', default: 0.08, min: 0.005, max: 1, step: 0.001, unit: 's', label: 'Dive time', group: 'ENV' },
      { key: 'level', type: 'number', default: 0.8, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    defaultPreset: 'Classic Wub Saw',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const hz = ac.createConstantSource(); hz.offset.value = 55; hz.start();                    // the pitch every oscillator follows
      const mix = ac.createGain(), amp = ac.createGain(), level = ac.createGain(); amp.gain.value = 0;
      mix.connect(amp); ctx.slot('tone', amp, { label: 'its own tone' }).connect(level);
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'wub tone' });
      const pitchMod = ctx.modBus('pitch', { min: -1200, max: 1200 });
      const fmMod = ctx.modBus('fm', { min: -6, max: 6 });
      const spreadMod = ctx.modBus('spread', { min: -40, max: 40 });
      const driftLfo = ac.createOscillator(); driftLfo.frequency.value = 0.23; driftLfo.start();
      const driftG = ac.createGain(); driftLfo.connect(driftG);
      [hz, mix, amp, level, driftLfo, driftG].forEach(n => ctx.track(n));

      // ---- the unison stack (rebuilt when wave / voices change)
      // every connection from a shared node (hz, the mod buses, drift) into a voice is recorded, so a rebuild unhooks it
      let stack = [], links = [];
      const link = (src, dst) => { src.connect(dst); links.push([src, dst]); };
      function teardown() {
        const t = ac.currentTime + 0.01;
        links.forEach(([a, b]) => { try { a.disconnect(b); } catch (e) {} }); links = [];
        stack.forEach(v => {
          v.oscs.forEach(o => { try { o.stop(t); } catch (e) {} o.onended = () => { try { o.disconnect(); } catch (e) {} ctx.untrack(o); }; });
          v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} ctx.untrack(n); });
        });
        stack = [];
      }
      function osc(type, nodes, oscs) { const o = ac.createOscillator(); o.type = type; o.frequency.value = 0; link(hz, o.frequency); link(pitchMod, o.detune); oscs.push(o); ctx.track(o); return o; }
      function build() {
        teardown();
        const wave = P.get('wave'), n = P.get('voices');
        for (let i = 0; i < n; i++) {
          const pos = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;                 // −1 … +1 across the stack
          const oscs = [], nodes = [], vg = ac.createGain(), pan = ac.createStereoPanner(), det = ac.createGain();
          vg.gain.value = 1 / Math.sqrt(n); nodes.push(vg, pan, det);
          det.gain.value = pos; link(spreadMod, det);                   // spread mod scaled by where the voice sits
          const dg = ac.createGain(); dg.gain.value = pos; link(driftG, dg); nodes.push(dg);
          const srcs = [];
          if (wave === 'fm') {
            const car = osc('sine', nodes, oscs), mod = osc('sine', nodes, oscs);
            const rg = ac.createGain(); rg.gain.value = +P.get('ratio'); link(hz, rg); rg.connect(mod.frequency);   // mod Hz = ratio · Hz
            hz.disconnect(mod.frequency); links = links.filter(([a, b]) => !(a === hz && b === mod.frequency));
            const amt = ac.createGain(); amt.gain.value = 0;                // amt = sin(mod) · (index · Hz)
            const idx = ac.createGain(); idx.gain.value = P.get('index'); link(hz, idx); idx.connect(amt.gain);
            const fmx = ac.createGain(); fmx.gain.value = 0; link(fmMod, fmx); link(hz, fmx.gain); fmx.connect(amt.gain); // + fm mod · Hz
            mod.connect(amt); amt.connect(car.frequency);
            nodes.push(rg, amt, idx, fmx); srcs.push([car, 1]); Object.assign(vg, { idx, rg });
          } else if (wave === 'hollow') {
            const a = osc('square', nodes, oscs), b = osc('sawtooth', nodes, oscs); b.detune.value = 1200;
            srcs.push([a, 0.7], [b, 0.45]);
          } else {
            srcs.push([osc(wave === 'square' ? 'square' : 'sawtooth', nodes, oscs), wave === 'square' ? 0.7 : 1]);
          }
          srcs.forEach(([o, g]) => { const gg = ac.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(vg); nodes.push(gg); det.connect(o.detune); dg.connect(o.detune); });
          vg.connect(pan); pan.connect(mix);
          stack.push({ pos, oscs, nodes, vg, pan, srcs });
          oscs.forEach(o => o.start());
        }
        nodes0(); spreadNow();
      }
      function nodes0() { stack.forEach(v => v.nodes.forEach(n => ctx.track(n))); }
      function spreadNow() {
        const now = ac.currentTime, sp = P.get('spread') * (P.get('wave') === 'reese' ? 1.8 : 1), w = P.get('width'), f = P.get('fine');
        stack.forEach(v => {
          v.srcs.forEach(([o], j) => o.detune.setTargetAtTime(v.pos * sp + f + (P.get('wave') === 'hollow' && j === 1 ? 1200 : 0), now, 0.02));
          v.pan.pan.setTargetAtTime(v.pos * w, now, 0.02);
          if (v.vg.idx) v.vg.idx.gain.setTargetAtTime(P.get('index'), now, 0.01);
          if (v.vg.rg) v.vg.rg.gain.setTargetAtTime(+P.get('ratio'), now, 0.01);
        });
        driftG.gain.setTargetAtTime(P.get('drift') * sp * (P.get('wave') === 'reese' ? 0.9 : 0.5), now, 0.05);
        level.gain.setTargetAtTime(0.32 * P.get('level') * (P.get('wave') === 'fm' ? 1.25 : 1), now, 0.01);
      }
      build();
      ['wave', 'voices'].forEach(k => P.onChange(k, build));
      ['spread', 'width', 'fine', 'index', 'ratio', 'drift', 'level'].forEach(k => P.onChange(k, spreadNow));

      // ---- notes: mono, last-note legato, glide on overlap or slide
      let held = null, curF = 55;
      function setHz(f, t, glide, from) {
        hz.offset.cancelScheduledValues(t);
        if (glide > 0) { hz.offset.setValueAtTime(from || curF, t); hz.offset.exponentialRampToValueAtTime(f, t + glide); }
        else hz.offset.setValueAtTime(f, t);
        curF = f;
      }
      const peak = (vel) => 0.08 + 0.92 * Math.pow(Math.max(0, Math.min(1, vel)), 1.5);
      function noteOn(note, vel, t, o) {
        o = o || {}; t = Math.max(t, ac.currentTime);
        const f = MT.hz(Math.max(0, Math.min(127, note + 12 * P.get('octave'))));
        const legato = held && held.off > t - 1e-4;
        if (o.slide && legato) setHz(f, t, Math.max(0.005, P.get('glide')));
        else {
          const dive = P.get('dive');
          if (dive && !legato) setHz(f, t, P.get('diveTime'), f * Math.pow(2, dive / 12));
          else setHz(f, t, legato ? Math.max(0.003, P.get('glide')) : 0);
          const g = amp.gain; g.cancelScheduledValues(t);
          if (!legato) g.setValueAtTime(0, t);
          g.linearRampToValueAtTime(peak(vel), t + P.get('attack'));
        }
        const off = o.duration !== undefined ? t + o.duration : Infinity;
        held = { note, off };
        if (off !== Infinity) { amp.gain.setValueAtTime(peak(vel), off); amp.gain.setTargetAtTime(0, off, P.get('release') / 4); }
        ctx.lastNote = { note, f, t, slide: !!o.slide };
      }
      function noteOff(note, t) {
        if (!held || held.note !== note) return;
        t = Math.max(t || ac.currentTime, ac.currentTime);
        if (typeof amp.gain.cancelAndHoldAtTime === 'function') amp.gain.cancelAndHoldAtTime(t); else amp.gain.cancelScheduledValues(t);
        amp.gain.setTargetAtTime(0, t, P.get('release') / 4); held.off = t;
      }
      ctx.noteOn = noteOn;
      ctx.onNote((p) => noteOn(p.note, p.velocity * (p.accent ? 1 : 0.9), p.time, { duration: p.duration, slide: p.slide }));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note, ac.currentTime); });
      ctx.allNotesOff = (p) => { const t = (p && typeof p.time === 'number') ? Math.max(p.time, ac.currentTime) : ac.currentTime; amp.gain.cancelScheduledValues(t); amp.gain.setTargetAtTime(0, t, p && p.hard ? 0.005 : P.get('release') / 4); if (held) held.off = t; };
      ctx.audition = (p) => noteOn(p.note || 45, p.velocity || 0.9, ac.currentTime, { duration: p.duration || 1.2 });
      ctx.auditionOff = (p) => noteOff(p.note || 45);
      ctx.internals = { hz, amp, level, mix, get stack() { return stack; } };
      return {};
    },
  });
})();
