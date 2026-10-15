/* eravos.fx-box 1.0.0 — FX Box (P11 gate F) · spec eravos.organism.fx-box
 * Twelve playable one-shot sound effects for transitions and ear candy. Every slot is an algorithm with three macro
 * knobs (A · B · C), a length (seconds, or bars — then it follows the tempo), pitch, level and pan.
 *   laser · pew · zap · riser · downer · impact · scream · glitch · vinyl · scrape · bounce · ricochet
 * Play: click a pad, notes 36–47 (sequencer / timeline / MIDI pads). Every hit is synthesised fresh — no samples. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const ALGS = ['laser', 'pew', 'zap', 'riser', 'downer', 'impact', 'scream', 'glitch', 'vinyl', 'scrape', 'bounce', 'ricochet'];
  const MACROS = { // what A / B / C mean for each algorithm (shown on the knobs)
    laser: ['Sweep', 'Curve', 'Buzz'], pew: ['Ratio', 'FM', 'Noise'], zap: ['Sweep', 'Q', 'Saw'], riser: ['Start', 'Noise', 'Reso'],
    downer: ['Start', 'Noise', 'Reso'], impact: ['Boom', 'Crash', 'Sub len'], scream: ['Wobble', 'Q', 'Range'], glitch: ['Density', 'Spread', 'Grain'],
    vinyl: ['Crackle', 'Hiss', 'Tone'], scrape: ['Pitch', 'Feedback', 'Drag'], bounce: ['Count', 'Decay', 'Spacing'], ricochet: ['Slam', 'Echoes', 'Spacing'],
  };
  const slot = (alg, o) => Object.assign({ alg, A: 0.5, B: 0.5, C: 0.3, length: 0.6, unit: 's', pitch: 0, level: 0.8, pan: 0 }, o || {});
  const KITS = {
    'Transition Kit': [slot('riser', { length: 2, unit: 'bars', A: 0.3, B: 0.6, C: 0.5 }), slot('downer', { length: 1, unit: 'bars' }), slot('impact', { length: 2.5, A: 0.7, B: 0.6 }), slot('laser', { length: 0.5 }),
      slot('zap', { length: 0.3 }), slot('pew', { length: 0.25 }), slot('scream', { length: 1.2 }), slot('glitch', { length: 0.5 }), slot('vinyl', { length: 4 }), slot('scrape', { length: 1.5 }), slot('bounce', { length: 2 }), slot('ricochet', { length: 1.5 })],
    'Sci-fi': [slot('laser', { length: 0.35, A: 0.8, C: 0.6 }), slot('pew', { length: 0.18, A: 0.7, B: 0.8 }), slot('zap', { length: 0.4, A: 0.9, B: 0.8 }), slot('laser', { length: 0.9, A: 0.4, B: 0.2, pitch: -12 }),
      slot('glitch', { length: 0.8, A: 0.8, B: 0.9 }), slot('scream', { length: 1.6, A: 0.7, C: 0.8 }), slot('ricochet', { length: 1.2, A: 0.8 }), slot('bounce', { length: 1.6, A: 0.7 }),
      slot('scrape', { length: 2, A: 0.3, B: 0.8 }), slot('riser', { length: 1, unit: 'bars', A: 0.6 }), slot('downer', { length: 1, unit: 'bars', A: 0.6 }), slot('impact', { length: 3, A: 0.9 })],
    'Ear Candy': [slot('bounce', { length: 1.2, A: 0.4, pitch: 12 }), slot('ricochet', { length: 0.8, pitch: 7 }), slot('pew', { length: 0.15, pitch: 12, level: 0.6 }), slot('glitch', { length: 0.3, A: 0.4, level: 0.6 }),
      slot('vinyl', { length: 2, A: 0.3, B: 0.2 }), slot('laser', { length: 0.2, pitch: 12, level: 0.5 }), slot('zap', { length: 0.15, level: 0.5 }), slot('scrape', { length: 0.6, A: 0.7, level: 0.5 }),
      slot('scream', { length: 0.6, level: 0.5 }), slot('riser', { length: 0.5, unit: 'bars', level: 0.6 }), slot('downer', { length: 0.5, unit: 'bars', level: 0.6 }), slot('impact', { length: 1.2, A: 0.4, level: 0.6 })],
    'Build Tools': [slot('riser', { length: 4, unit: 'bars', A: 0.2, B: 0.5, C: 0.6 }), slot('riser', { length: 2, unit: 'bars', A: 0.4, B: 0.8 }), slot('riser', { length: 1, unit: 'bars', A: 0.6, B: 0.3 }), slot('downer', { length: 2, unit: 'bars' }),
      slot('impact', { length: 3, A: 0.9, B: 0.8 }), slot('scream', { length: 2, unit: 'bars', A: 0.5 }), slot('glitch', { length: 1, unit: 'bars', A: 0.9 }), slot('scrape', { length: 1, unit: 'bars' }),
      slot('vinyl', { length: 4, unit: 'bars' }), slot('laser', { length: 1, unit: 'bars', A: 0.9, B: 0.1 }), slot('bounce', { length: 1, unit: 'bars' }), slot('ricochet', { length: 1, unit: 'bars' })],
  };
  const kitPreset = (name) => ({ params: { sel: 0 }, extra: { slots: KITS[name].map(s => Object.assign({}, s)) } });
  OrganismFactory.define({
    id: 'eravos.fx-box', preview: 'hit', domain: 'music', version: '1.0.0', label: 'FX Box', icon: '💥', accent: '#ff44aa', phase: 'P11',
    category: 'Sound Forge', blurb: 'Twelve playable sound effects — risers, impacts, lasers, scrapes, bounces — for transitions and ear candy.',
    size: { w: 600, h: 520 }, minSize: { w: 460, h: 420 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in'],
    hooks: [S.audio_out('box.hook.audio_out'), S.note_in('box.hook.note_in'), S.midi_in('box.hook.midi_in'), S.transport_in('box.hook.transport_in'),
      Object.assign(S.event('box.hook.bank_out', 'out', 'pad:bank-change', { type: 'object', required: ['pads'] }, '1.0.0'), { rail: false })],
    config: [
      { key: 'sel', type: 'integer', default: 0, min: 0, max: 11, label: 'Slot', group: 'EDIT' },
      { key: 'volume', type: 'number', default: 0.9, min: 0, max: 1.5, step: 0.01, label: 'Volume', group: 'OUT' },
    ],
    ui_hooks: ['pad_press', 'slot_edit'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp;
      let slots = KITS['Transition Kit'].map(s => Object.assign({}, s));
      const out = ac.createGain(); out.gain.value = P.get('volume'); ctx.track(out);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'fx box' });
      P.onChange('volume', (v) => dsp.setSmooth(out.gain, v, ac));
      const NB = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); { const r = dsp.mulberry32(4242), d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; }
      const lenSec = (s) => s.unit === 'bars' ? s.length * 240 / ctx.bpm : s.length;
      const live = new Set(); let lastPans = [];
      function noise(t, dur) { const n = ac.createBufferSource(); n.buffer = NB; n.loop = true; n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.05); return n; }
      function osc(type, f, t, dur) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.05); return o; }
      function env(t, dur, a, peak) { const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak || 1, t + Math.max(0.002, a)); g.gain.setValueAtTime(peak || 1, t + Math.max(0.003, dur * 0.6)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur); return g; }
      function play(i, t, vel) {
        const s = slots[i]; if (!s) return;
        t = Math.max(t, ac.currentTime); const dur = Math.max(0.02, lenSec(s)), f0 = 440 * Math.pow(2, s.pitch / 12), A = s.A, B = s.B, C = s.C;
        const bus = ac.createGain(), pan = ac.createStereoPanner(); bus.gain.value = s.level * (vel === undefined ? 1 : 0.3 + 0.7 * vel); pan.pan.value = s.pan; bus.connect(pan); pan.connect(out);
        const nodes = [bus, pan]; const keep = (n) => { nodes.push(n); return n; };
        switch (s.alg) {
          case 'laser': { const hi = f0 * Math.pow(2, 1 + A * 4), lo = f0 * 0.5, tEnd = t + dur * (0.3 + B * 0.7), e = keep(env(t, dur, 0.002)); [['sine', 1], ['square', C * 0.25]].forEach(([ty, lv]) => { if (lv <= 0) return; const o = keep(osc(ty, hi, t, dur)), g = keep(ac.createGain()); o.frequency.exponentialRampToValueAtTime(lo, tEnd); g.gain.value = lv; o.connect(g); g.connect(e); }); e.connect(bus); break; }
          case 'pew': { const c = keep(osc('sine', f0 * 4, t, dur)), m = keep(osc('sine', f0 * 4 * (0.5 + A * 3), t, dur)), mg = keep(ac.createGain()); mg.gain.setValueAtTime(f0 * 4 * B * 3, t); mg.gain.exponentialRampToValueAtTime(1, t + dur); m.connect(mg); mg.connect(c.frequency); c.frequency.exponentialRampToValueAtTime(f0 * 0.25, t + dur); const e = keep(env(t, dur, 0.001)); c.connect(e); e.connect(bus); if (C > 0.05) { const nn = keep(noise(t, dur)), ng = keep(env(t, dur * 0.3, 0.001, C * 0.3)); nn.connect(ng); ng.connect(bus); } break; }
          case 'zap': { const nn = keep(noise(t, dur)), sw = keep(osc('sawtooth', f0, t, dur)), bp = keep(ac.createBiquadFilter()), sg = keep(ac.createGain()); bp.type = 'bandpass'; bp.Q.value = 1 + B * 20; bp.frequency.setValueAtTime(Math.min(18000, f0 * Math.pow(2, 2 + A * 4)), t); bp.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + dur); sg.gain.value = C; nn.connect(bp); sw.connect(sg); sg.connect(bp); const e = keep(env(t, dur, 0.001)); bp.connect(e); e.connect(bus); break; }
          case 'riser': case 'downer': {
            const up = s.alg === 'riser', lo = f0 * Math.pow(2, -2 + A * 2), hi = Math.min(16000, f0 * 8);
            const sw = keep(osc('sawtooth', up ? lo : hi, t, dur)), nn = keep(noise(t, dur)), lp = keep(ac.createBiquadFilter()), ng = keep(ac.createGain()), g = keep(ac.createGain());
            sw.frequency.exponentialRampToValueAtTime(up ? hi : lo, t + dur); lp.type = 'lowpass'; lp.Q.value = 0.7 + C * 12; lp.frequency.setValueAtTime(up ? 300 : 12000, t); lp.frequency.exponentialRampToValueAtTime(up ? 14000 : 200, t + dur);
            ng.gain.value = B; sw.connect(lp); nn.connect(ng); ng.connect(lp);
            // ends exactly at its length: a 5 ms fade that finishes ON t + dur (tempo-lengthed risers land on the downbeat)
            const fe = Math.max(t + 0.01, t + dur - 0.005);
            g.gain.setValueAtTime(up ? 0.0005 : 0.6, t); g.gain.exponentialRampToValueAtTime(up ? 0.6 : 0.0005, fe); g.gain.linearRampToValueAtTime(0, t + dur); g.gain.setValueAtTime(0, t + dur);
            lp.connect(g); g.connect(bus); break; }
          case 'impact': { const sub = keep(osc('sine', 120 * Math.pow(2, A), t, dur)); sub.frequency.exponentialRampToValueAtTime(30, t + 0.15 + C * 0.6); const se = keep(env(t, Math.min(dur, 0.4 + C * 2), 0.002, 1)); sub.connect(se); se.connect(bus); const nn = keep(noise(t, dur)), hp = keep(ac.createBiquadFilter()), ne = keep(env(t, dur, 0.001, B * 0.6)); hp.type = 'highpass'; hp.frequency.value = 2500; nn.connect(hp); hp.connect(ne); ne.connect(bus); break; }
          case 'scream': { const nn = keep(noise(t, dur)), bp = keep(ac.createBiquadFilter()), lfo = keep(osc('sine', 2 + A * 14, t, dur)), lg = keep(ac.createGain()); bp.type = 'bandpass'; bp.Q.value = 4 + B * 30; bp.frequency.setValueAtTime(f0 * 2, t); bp.frequency.exponentialRampToValueAtTime(f0 * Math.pow(2, 1 + C * 3), t + dur); lg.gain.value = f0 * 0.6; lfo.connect(lg); lg.connect(bp.frequency); const e = keep(env(t, dur, 0.02, 1.4)); nn.connect(bp); bp.connect(e); e.connect(bus); break; }
          case 'glitch': { const n = Math.max(3, Math.round(4 + A * 28 * dur)), grain = 0.005 + C * 0.05, r = dsp.mulberry32(Math.round(t * 1000) + i); for (let k = 0; k < n; k++) { const tt = t + r() * Math.max(0.01, dur - grain), o = keep(osc(r() < 0.5 ? 'square' : 'sawtooth', f0 * Math.pow(2, (r() * 2 - 1) * B * 3), tt, grain)), e = keep(env(tt, grain, 0.0005, 0.6)); o.connect(e); e.connect(bus); } break; }
          case 'vinyl': { const nn = keep(noise(t, dur)), lp = keep(ac.createBiquadFilter()), hg = keep(ac.createGain()); lp.type = 'lowpass'; lp.frequency.value = 1500 + C * 8000; hg.gain.value = B * 0.15; nn.connect(lp); lp.connect(hg); hg.connect(bus); const r = dsp.mulberry32(Math.round(t * 997)), cnt = Math.round(dur * (5 + A * 60)); for (let k = 0; k < cnt; k++) { const tt = t + r() * dur, c = keep(ac.createBufferSource()); c.buffer = NB; c.start(tt, r(), 0.002 + r() * 0.004); const cg = keep(ac.createGain()); cg.gain.value = 0.2 + r() * 0.6; c.connect(cg); cg.connect(bus); } break; }
          case 'scrape': { const nn = keep(noise(t, dur)), dl = keep(ac.createDelay(0.05)), fb = keep(ac.createGain()), lp = keep(ac.createBiquadFilter()); const per = 1 / (f0 * Math.pow(2, (A - 0.5) * 2)); dl.delayTime.setValueAtTime(Math.min(0.049, per), t); dl.delayTime.linearRampToValueAtTime(Math.min(0.049, per * (1 + C * 1.5)), t + dur); fb.gain.value = 0.5 + B * 0.45; lp.type = 'lowpass'; lp.frequency.value = 5000; const e = keep(env(t, dur, 0.05, 0.5)); nn.connect(e); e.connect(dl); dl.connect(fb); fb.connect(lp); lp.connect(dl); dl.connect(bus); break; }
          case 'bounce': { const n = Math.max(2, Math.round(3 + A * 13)), gap0 = 0.08 + C * 0.3; let tt = t, gap = gap0, amp = 1; lastPans = []; for (let k = 0; k < n && tt < t + dur; k++) { const o = keep(osc('sine', f0 * 2, tt, 0.08)), e = keep(env(tt, 0.08, 0.001, amp)), p = keep(ac.createStereoPanner()); const pv = (k % 2 ? 1 : -1) * Math.max(0.2, 0.9 - k * 0.05); p.pan.value = pv; lastPans.push(pv); o.connect(e); e.connect(p); p.connect(bus); tt += gap; gap *= 0.6 + B * 0.3; amp *= 0.55 + B * 0.35; } break; }
          case 'ricochet': { const o = keep(osc('triangle', f0, t, 0.25)); o.frequency.exponentialRampToValueAtTime(f0 * Math.pow(2, 1 + A * 3), t + 0.12); const e = keep(env(t, 0.25, 0.001)); o.connect(e); const echoes = Math.round(1 + B * 7), sp = 0.06 + C * 0.25; e.connect(bus); for (let k = 1; k <= echoes && k * sp < dur; k++) { const d = keep(ac.createDelay(4)), g = keep(ac.createGain()), p = keep(ac.createStereoPanner()); d.delayTime.value = k * sp; g.gain.value = Math.pow(0.6, k); p.pan.value = k % 2 ? 0.7 : -0.7; e.connect(d); d.connect(g); g.connect(p); p.connect(bus); } break; }
        }
        nodes.forEach(n => ctx.track(n));
        const v = { nodes, end: t + dur + 0.2 }; live.add(v);
        ctx.timeout(() => { live.delete(v); nodes.forEach(n => { try { n.disconnect(); } catch (e) {} ctx.untrack(n); }); }, (v.end - ac.currentTime) * 1000 + 600);
        ctx.emitUI('hit', { index: i, at: t, dur });
      }
      ctx.play = play;
      ctx.onNote((p) => { const i = p.note - 36; if (i >= 0 && i < 12) play(i, p.time, p.velocity); });
      ctx.onMidi((p) => { if (p.on && p.note >= 36 && p.note < 48) play(p.note - 36, ac.currentTime, p.velocity); });
      ctx.onUI('pad_press', { type: 'object', required: ['index'] }, (p) => { if (p.index < 0 || p.index > 11) return ctx.fault('RUNTIME_002', 'pad index'); P.set('sel', p.index); play(p.index, ac.currentTime + 0.005, 0.9); });
      const NUM = { A: [0, 1], B: [0, 1], C: [0, 1], length: [0.02, 16], pitch: [-24, 24], level: [0, 1.5], pan: [-1, 1] };
      ctx.onUI('slot_edit', { type: 'object', required: ['index', 'key'] }, (p) => {
        const s = slots[p.index]; if (!s) return ctx.fault('RUNTIME_002', 'slot index');
        if (p.key === 'alg') { if (!ALGS.includes(p.value)) return ctx.fault('RUNTIME_002', 'unknown algorithm'); s.alg = p.value; }
        else if (p.key === 'unit') { if (p.value !== 's' && p.value !== 'bars') return ctx.fault('RUNTIME_002', 'length unit'); s.unit = p.value; }
        else if (NUM[p.key]) { const v = Number(p.value); if (!Number.isFinite(v)) return ctx.fault('RUNTIME_002', 'number required'); s[p.key] = Math.max(NUM[p.key][0], Math.min(NUM[p.key][1], v)); }
        else return ctx.fault('RUNTIME_002', 'unknown slot setting');
        ctx.syncUI();
      });
      ctx.audition = (p) => play(P.get('sel'), ac.currentTime + 0.005, (p && p.velocity) || 0.9);
      ctx.saveExtra = () => ({ slots });
      ctx.loadExtra = (x) => { if (!x || !Array.isArray(x.slots) || x.slots.length !== 12) return ctx.fault('MOUNT_005', 'fx box: kit must have 12 slots'); slots = x.slots.map(s => slot(ALGS.includes(s.alg) ? s.alg : 'laser', s)); ctx.syncUI(); };
      let announced = '';
      const announce = (force) => { const pads = slots.map((s, i) => ({ note: 36 + i, name: (i + 1) + ' ' + s.alg, sound: s.alg })); const k = JSON.stringify(pads); if (!force && k === announced) return; announced = k; ctx.emit('pad:bank-change', { bank: 0, pads, kind: 'sfx' }); };
      ctx.timeout(() => announce(true), 0); ctx.on('kernel:organism-mounted', null, () => announce(true));
      ctx.stateExtra = () => { announce(false); return { slots, algs: ALGS, macros: MACROS, bpm: ctx.bpm }; };
      ctx.internals = { get slots() { return slots; }, get lastPans() { return lastPans; }, lenSec };
      return { unmount() { live.forEach(v => v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} })); live.clear(); } };
    },
  });
})();
