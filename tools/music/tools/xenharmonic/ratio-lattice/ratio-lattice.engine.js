/* eravos.ratio-lattice 1.0.0 — Ratio Lattice · spec eravos.organism.ratio-lattice
 * A just-intonation lattice: x = powers of 3, y = powers of 5, z-layer = powers of 7 / 11 / 13. Every node is an exact
 * ratio folded into one octave. Click nodes to sound them as drones; the readout shows the chord as an otonal
 * harmonic series (4:5:6:7), each pair's slowest beat rate, and total sensory dissonance (Sethares).
 * Sends exact frequencies as note:trigger { note: nearest key, freq } to any instrument (Xen Synth honours freq),
 * an arpeggiator over the chord (transport-locked), and exports the chord as a scale (xen:tuning). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, XT = window.XenTheory;
  const TIMBRES = {
    sine: [[1, 1]], harmonic: [[1, 1], [2, 0.5], [3, 0.33], [4, 0.25], [5, 0.2], [6, 0.16]],
    organ: [[1, 1], [2, 0.7], [3, 0.35], [4, 0.45], [6, 0.2], [8, 0.25]], glass: [[1, 1], [2.756, 0.45], [5.404, 0.2]],
  };
  const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
  function nodeRatio(a, b, c, z) {
    let num = 1, den = 1;
    [[3, a], [5, b], [z, c]].forEach(([p, e]) => { if (e > 0) num *= Math.pow(p, e); else if (e < 0) den *= Math.pow(p, -e); });
    while (num / den >= 2) den *= 2; while (num / den < 1) num *= 2;
    const g = gcd(num, den); return { p: num / g, q: den / g, r: num / den };
  }
  function otonal(rs) { // chord of p/q → smallest integer harmonic series a:b:c
    const lcm = (a, b) => a / gcd(a, b) * b;
    const D = rs.reduce((m, x) => lcm(m, x.q), 1); let ns = rs.map(x => x.p * D / x.q);
    const g = ns.reduce((m, n) => gcd(m, n), ns[0] || 1); ns = ns.map(n => n / g);
    return ns;
  }
  OrganismFactory.define({
    id: 'eravos.ratio-lattice', domain: 'music', version: '1.0.0', label: 'Ratio Lattice', icon: '⋕', accent: '#00ffcc', phase: 'P14',
    category: 'Xenharmonic', blurb: 'Click a just-intonation lattice (3 × 5 × 7/11/13) to build chords from exact ratios. Hear the beats, see the harmonic series.',
    size: { w: 640, h: 640 }, minSize: { w: 480, h: 480 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.audio_out', 'capability.note_out'],
    needs: { notes: ['Sends exact frequencies — Xen Synth plays them exactly; 12-TET instruments get the nearest key.'], works_with: ['eravos.xen-synth', 'eravos.recursive-spectra'] },
    hooks: [
      S.audio_out('lat.hook.audio_out'), S.note_out('lat.hook.note_out'), S.transport_in('lat.hook.transport_in'),
      S.event('lat.hook.tuning_out', 'out', 'xen:tuning', { type: 'object', required: ['steps', 'period'] }, '1.0.0'),
    ],
    config: [
      { key: 'baseHz', type: 'number', default: 196, min: 30, max: 880, step: 0.01, unit: 'Hz', label: '1/1 Hz', group: 'LATTICE' },
      { key: 'primeZ', type: 'enum', options: [7, 11, 13], default: 7, label: 'Z prime', group: 'LATTICE' },
      { key: 'layer', type: 'integer', default: 0, min: -2, max: 2, label: 'Z layer', group: 'LATTICE' },
      { key: 'timbre', type: 'enum', options: Object.keys(TIMBRES), default: 'harmonic', label: 'Timbre', group: 'SOUND' },
      { key: 'fade', type: 'number', default: 0.4, min: 0.01, max: 4, step: 0.01, unit: 's', label: 'Fade', group: 'SOUND' },
      { key: 'level', type: 'number', default: 0.5, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'SOUND' },
      { key: 'drone', type: 'boolean', default: true, label: 'Drone', group: 'SOUND', hint: 'active nodes sound continuously' },
      { key: 'arp', type: 'boolean', default: false, label: 'Arp', group: 'ARP', hint: 'step through the chord on the beat (needs the transport playing)' },
      { key: 'arpDiv', type: 'enum', options: ['1/4', '1/8', '1/16', '1/8t'], default: '1/8', label: 'Rate', group: 'ARP' },
      { key: 'arpOrder', type: 'enum', options: ['up', 'down', 'updown', 'random'], default: 'up', label: 'Order', group: 'ARP' },
      { key: 'sendTo', type: 'string', default: '', label: 'Send notes to', group: 'SEND' },
      { key: 'noteDur', type: 'number', default: 0.5, min: 0.05, max: 6, step: 0.01, unit: 's', label: 'Note length', group: 'SEND' },
    ],
    ui_hooks: ['node_toggle', 'clear', 'send_chord', 'export_scale'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const out = ac.createGain(); out.gain.value = P.get('level'); ctx.track(out);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'lattice' });
      P.onChange('level', v => dsp.setSmooth(out.gain, v, ac));
      let nodes = []; // [[a,b,c]]
      const drones = new Map(); // key → {oscs, amp}
      const key = (n) => n.join(',');
      const info = (n) => { const r = nodeRatio(n[0], n[1], n[2], P.get('primeZ')); return Object.assign(r, { f: P.get('baseHz') * r.r, n }); };
      function voice(f, peak) {
        const amp = ac.createGain(); amp.gain.value = 0; amp.connect(out);
        const tim = TIMBRES[P.get('timbre')] || TIMBRES.harmonic;
        const norm = 0.18 / Math.sqrt(tim.reduce((s, x) => s + x[1] * x[1], 0));
        const oscs = tim.filter(([k]) => f * k < ac.sampleRate * 0.45).map(([k, a]) => { const o = ac.createOscillator(); o.frequency.value = f * k; const g = ac.createGain(); g.gain.value = a * norm * (peak || 1); o.connect(g); g.connect(amp); o.start(); return { o, g }; });
        return { amp, oscs };
      }
      function stopVoice(v, t, fade) { v.amp.gain.cancelScheduledValues(t); v.amp.gain.setTargetAtTime(0, t, Math.max(0.005, fade / 3)); v.oscs.forEach(x => { x.o.stop(t + fade * 2 + 0.05); x.o.onended = () => { try { x.o.disconnect(); x.g.disconnect(); } catch (e) {} }; }); setTimeout(() => { try { v.amp.disconnect(); } catch (e) {} }, (fade * 2 + 0.2) * 1000); }
      function syncDrones() {
        const t = ac.currentTime, fade = P.get('fade'), want = P.get('drone') && !P.get('arp') ? new Set(nodes.map(key)) : new Set();
        drones.forEach((v, k) => { if (!want.has(k)) { stopVoice(v, t, fade); drones.delete(k); } });
        nodes.forEach(n => { const k = key(n); if (want.has(k) && !drones.has(k)) { const v = voice(info(n).f); v.amp.gain.setTargetAtTime(1, t, fade / 3); drones.set(k, v); } });
      }
      function rebuildAll() { const t = ac.currentTime; drones.forEach(v => stopVoice(v, t, 0.03)); drones.clear(); syncDrones(); ctx.syncUI(); }
      ['baseHz', 'primeZ', 'timbre'].forEach(k => P.onChange(k, rebuildAll));
      ['drone', 'arp'].forEach(k => P.onChange(k, () => { syncDrones(); ctx.syncUI(); }));
      P.onChange('layer', () => ctx.syncUI());
      function toggle(n) {
        const k = key(n), i = nodes.findIndex(x => key(x) === k);
        if (i >= 0) nodes.splice(i, 1); else nodes.push(n.slice(0, 3));
        syncDrones(); ctx.syncUI();
      }
      const nearestKey = (f) => Math.max(0, Math.min(127, Math.round(69 + 12 * Math.log2(f / 440))));
      function send(f, t, dur) { const target = P.get('sendTo'); if (!target) return; ctx.emit('note:trigger', { target, note: nearestKey(f), freq: f, velocity: 0.8, time: t, duration: dur }); }
      function chord() { return nodes.map(info).sort((a, b) => a.r - b.r); }
      ctx.onUI('node_toggle', { type: 'object', required: ['a', 'b', 'c'] }, (p) => toggle([p.a | 0, p.b | 0, p.c | 0]));
      ctx.onUI('clear', null, () => { nodes = []; syncDrones(); ctx.syncUI(); });
      // 3.28 stop contract: Stop / Stop all turn the drone off (the chord stays lit — Drone brings it back)
      ctx.onSilence(() => { if (P.get('drone')) P.set('drone', false); syncDrones(); ctx.syncUI(); });
      ctx.onUI('send_chord', null, () => { const t = ac.currentTime + 0.02; chord().forEach(x => send(x.f, t, P.get('noteDur') * 4)); });
      ctx.onUI('export_scale', null, () => {
        const cs = Array.from(new Set(chord().map(x => +XT.cents(x.r).toFixed(4)))).sort((a, b) => a - b);
        if (!cs.length) return ctx.fault('RUNTIME_002', 'export: no nodes selected');
        ctx.emit('xen:tuning', { steps: cs[0] === 0 ? cs : [0].concat(cs), period: 1200, name: 'lattice ' + otonal(chord()).join(':'), target: P.get('sendTo') || '*' });
      });
      // arpeggiator (transport ticks)
      let arpI = 0, dirUp = true;
      const rnd = dsp.mulberry32(77);
      ctx.onTick((tk) => {
        if (!P.get('arp') || !nodes.length) return;
        const div = P.get('arpDiv'), every = div === '1/4' ? 4 : div === '1/8' ? 2 : 1;
        const s16 = tk.step16 !== undefined ? tk.step16 : 0;
        if (div === '1/8t') { if (s16 % 4 !== 0) return; } else if (s16 % every !== 0) return;
        const ch = chord(); const ord = P.get('arpOrder');
        let idx;
        if (ord === 'down') idx = ch.length - 1 - (arpI % ch.length);
        else if (ord === 'updown') { if (ch.length < 2) idx = 0; else { const cyc = 2 * ch.length - 2; const m = arpI % cyc; idx = m < ch.length ? m : cyc - m; } }
        else if (ord === 'random') idx = Math.floor(rnd() * ch.length);
        else idx = arpI % ch.length;
        arpI++;
        const x = ch[idx], stepDur = 60 / ctx.bpm / 4 * every, times = div === '1/8t' ? [0, 1, 2].map(k => tk.time + k * (60 / ctx.bpm) / 3) : [tk.time];
        times.forEach((tt, j) => {
          const xx = div === '1/8t' ? ch[(idx + j) % ch.length] : x;
          const v = voice(xx.f, 1.2); v.amp.gain.setValueAtTime(0, tt); v.amp.gain.linearRampToValueAtTime(1, tt + 0.004); v.amp.gain.setTargetAtTime(0, tt + 0.01, Math.min(0.25, stepDur * 0.6));
          v.oscs.forEach(o => { o.o.stop(tt + Math.min(1.5, stepDur * 4)); o.o.onended = () => { try { o.o.disconnect(); o.g.disconnect(); } catch (e) {} }; });
          setTimeout(() => { try { v.amp.disconnect(); } catch (e) {} }, (tt - ac.currentTime + 2) * 1000);
          send(xx.f, tt, Math.min(P.get('noteDur'), stepDur * 0.9));
        });
      });
      ctx.saveExtra = () => ({ nodes: nodes.map(n => n.slice()) });
      ctx.loadExtra = (x) => { nodes = (x && Array.isArray(x.nodes) ? x.nodes : []).map(n => [n[0] | 0, n[1] | 0, n[2] | 0]); rebuildAll(); };
      ctx.stateExtra = () => {
        const ch = chord(), pairs = [];
        for (let i = 0; i < ch.length; i++) for (let j = i + 1; j < ch.length; j++) { const b = XT.beat(ch[i].f, ch[j].f, 8); pairs.push({ a: ch[i].p + '/' + ch[i].q, b: ch[j].p + '/' + ch[j].q, beat: b ? +b.hz.toFixed(2) : null, at: b ? b.m + '·' + b.n : '' }); }
        const parts = []; ch.forEach(x => (TIMBRES.harmonic).forEach(([k, a]) => parts.push({ f: x.f * k, a })));
        return {
          nodes: nodes.map(n => n.slice()),
          chord: ch.map(x => ({ n: x.n, p: x.p, q: x.q, f: +x.f.toFixed(3), cents: +XT.cents(x.r).toFixed(2), et: XT.describeRatio(x.r).et12.offset, name: XT.NAMES[x.p + '/' + x.q] || '' })),
          otonal: ch.length ? otonal(ch).join(':') : '', pairs, dissonance: ch.length > 1 ? XT.dissonance(parts) : 0,
        };
      };
      ctx.internals = { get nodes() { return nodes; }, drones, nodeRatio, otonal };
      ctx.onDispose(() => { drones.forEach(v => stopVoice(v, ac.currentTime, 0.01)); drones.clear(); });
      return {};
    },
  });
})();
