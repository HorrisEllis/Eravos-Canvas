/* eravos.recursive-spectra 1.0.0 — Recursive Spectra · spec eravos.organism.recursive-spectra
 * Loop-recursive harmony: a seed spectrum S₀ (harmonic, bell, membrane, φ-series, primes, or one received from the
 * Harmonic Analyzer) is fed through a transform T again and again — S₁ = T(S₀), S₂ = T(S₁) … — and the oscillator
 * bank glides from generation to generation (per bar on the transport, or every N seconds), cycling, ping-ponging
 * or running free. Transforms: power (stretch), golden fold (×φ^a, reflected under a ceiling), sum–difference
 * (combination tones of the strongest pairs, pruned), mirror (log-reflection), spiral (golden rotation inside each
 * octave). Every generation can be sent on as a spectrum (xen:spectrum) or turned into a scale: the minima of its
 * own dissonance curve (xen:tuning) — the timbre writes its tuning. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, XT = window.XenTheory;
  const SEEDS = ['harmonic', 'odd', 'bell', 'membrane', 'bar', 'golden', 'prime', 'fibonacci', 'received'];
  const TRANSFORMS = ['power', 'golden-fold', 'sum-difference', 'mirror', 'spiral'];
  const RATES = ['1 bar', '2 bars', '4 bars', '8 bars', 'seconds'];

  // ---- the recursion (pure, deterministic — tests and the UI recompute the whole lineage)
  function step(spec, o) {
    const p = o.amount, L = Math.log(o.ceiling), PHI = XT.PHI;
    const reflect = (r) => { let l = Math.log(Math.max(1e-6, r)); for (let i = 0; i < 8 && (l > L || l < 0); i++) { if (l > L) l = 2 * L - l; if (l < 0) l = -l; } return Math.exp(l); };
    let next;
    switch (o.transform) {
      case 'power': next = spec.map(x => ({ r: reflect(Math.pow(x.r, 1 + 0.35 * (p * 2 - 1))), a: x.a })); break;
      case 'golden-fold': next = spec.map((x, i) => ({ r: i === 0 ? x.r : reflect(x.r * Math.pow(PHI, p)), a: x.a * (0.97 - 0.1 * p * (i / spec.length)) })); break;
      case 'mirror': next = spec.map(x => { const l = Math.log(x.r); return { r: Math.exp((1 - p * 0.5) * l + p * 0.5 * (L - l)), a: x.a }; }); break;
      case 'spiral': next = spec.map((x, i) => { if (i === 0) return x; const oct = Math.floor(Math.log2(x.r)), fr = Math.log2(x.r) - oct; return { r: Math.pow(2, oct + ((fr + p / PHI) % 1)), a: x.a }; }); break;
      case 'sum-difference': default: {
        const top = spec.slice().sort((a, b) => b.a - a.a).slice(0, 4); next = spec.map(x => ({ r: x.r, a: x.a * (1 - 0.3 * p) }));
        for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) {
          const amp = top[i].a * top[j].a * p;
          [top[i].r + top[j].r, Math.abs(top[i].r - top[j].r)].forEach(r => { if (r > 0.5) next.push({ r: reflect(r), a: amp }); });
        }
      }
    }
    // merge partials closer than 4 ¢, keep the strongest N, renormalise (max a = 1)
    next.sort((a, b) => a.r - b.r);
    const merged = [];
    next.forEach(x => { const last = merged[merged.length - 1]; if (last && Math.abs(XT.cents(x.r / last.r)) < 4) { last.a = Math.max(last.a, x.a) + Math.min(last.a, x.a) * 0.5; } else merged.push({ r: x.r, a: x.a }); });
    let keep = merged.sort((a, b) => b.a - a.a).slice(0, o.partials).sort((a, b) => a.r - b.r);
    const mx = Math.max(...keep.map(x => x.a)) || 1; keep = keep.map(x => ({ r: x.r, a: x.a / mx }));
    return keep;
  }
  function lineage(seed, o, depth) { const out = [seed]; for (let k = 1; k <= depth; k++) out.push(step(out[k - 1], o)); return out; }

  OrganismFactory.define({
    id: 'eravos.recursive-spectra', preview: 'chord', domain: 'music', version: '1.0.0', label: 'Recursive Spectra', icon: '⟲', accent: '#7cffb2', phase: 'P14',
    category: 'Xenharmonic', blurb: 'A spectrum fed through itself, generation after generation: evolving irrational drones, bells and pads that never repeat — or loop.',
    size: { w: 600, h: 620 }, minSize: { w: 460, h: 460 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.xen_in'],
    needs: { notes: ['Generations advance per bar while the transport plays, or every N seconds on their own.'], works_with: ['eravos.harmonic-analyzer', 'eravos.xen-synth', 'eravos.fx-haunt'] },
    hooks: [
      S.audio_out('rec.hook.audio_out'), S.note_in('rec.hook.note_in'), S.midi_in('rec.hook.midi_in'), S.transport_in('rec.hook.transport_in'),
      S.event('rec.hook.spectrum_in', 'in', 'xen:spectrum', { type: 'object' }, '1.0.0'),
      S.event('rec.hook.spectrum_out', 'out', 'xen:spectrum', { type: 'object', required: ['partials'] }, '1.0.0'),
      S.event('rec.hook.tuning_out', 'out', 'xen:tuning', { type: 'object', required: ['steps', 'period'] }, '1.0.0'),
      S.mod_in('rec.hook.mod_level', 'level'),
    ],
    config: [
      { key: 'seed', type: 'enum', options: SEEDS, default: 'harmonic', label: 'Seed', group: 'RECURSION' },
      { key: 'transform', type: 'enum', options: TRANSFORMS, default: 'golden-fold', label: 'Transform', group: 'RECURSION' },
      { key: 'amount', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Amount', group: 'RECURSION' },
      { key: 'depth', type: 'integer', default: 8, min: 1, max: 32, label: 'Depth', group: 'RECURSION' },
      { key: 'loop', type: 'enum', options: ['cycle', 'ping-pong', 'free', 'hold'], default: 'ping-pong', label: 'Loop', group: 'RECURSION' },
      { key: 'partials', type: 'integer', default: 10, min: 3, max: 16, label: 'Partials', group: 'RECURSION' },
      { key: 'ceiling', type: 'number', default: 12, min: 2, max: 32, step: 0.1, label: 'Ceiling ×', group: 'RECURSION', hint: 'highest partial ratio; above it partials reflect back down' },
      { key: 'rate', type: 'enum', options: RATES, default: 'seconds', label: 'Advance', group: 'TIME' },
      { key: 'seconds', type: 'number', default: 4, min: 0.25, max: 60, step: 0.01, unit: 's', label: 'Every', group: 'TIME' },
      { key: 'morph', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Morph', group: 'TIME', hint: 'how much of each generation is spent gliding' },
      { key: 'baseHz', type: 'number', default: 98, min: 20, max: 800, step: 0.01, unit: 'Hz', label: 'Drone Hz', group: 'SOUND' },
      { key: 'drone', type: 'boolean', default: true, label: 'Drone', group: 'SOUND' },
      { key: 'level', type: 'number', default: 0.5, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'SOUND' },
      { key: 'attack', type: 'number', default: 0.3, min: 0.001, max: 6, step: 0.001, unit: 's', label: 'Attack', group: 'NOTES' },
      { key: 'release', type: 'number', default: 2, min: 0.01, max: 12, step: 0.01, unit: 's', label: 'Release', group: 'NOTES' },
      { key: 'autoSend', type: 'boolean', default: false, label: 'Stream', group: 'SEND', hint: 'send every new generation as xen:spectrum' },
    ],
    ui_hooks: ['goto', 'send_spectrum', 'send_scale'],
    defaultPreset: 'Golden Drift',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp;
      const out = ac.createGain(), level = ac.createGain(); out.connect(level); level.gain.value = P.get('level');
      ctx.track(out); ctx.track(level);
      const levelMod = ctx.modBus('level', { min: 0, max: 1.5 }); levelMod.connect(level.gain);
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'recursive' });
      P.onChange('level', v => dsp.setSmooth(level.gain, v, ac));
      let received = null, lin = [], gen = 0, dir = 1, free = null;
      const opts = () => ({ transform: P.get('transform'), amount: P.get('amount'), ceiling: P.get('ceiling'), partials: P.get('partials') });
      function seed() {
        const k = P.get('seed');
        if (k === 'received' && received) return received.slice(0, P.get('partials'));
        return XT.spectrum(k === 'received' ? 'harmonic' : k, { partials: P.get('partials'), tilt: 0.9 });
      }
      function recompute() { lin = lineage(seed(), opts(), P.get('depth')); free = lin[lin.length - 1]; if (gen > lin.length - 1) gen = 0; applyGen(ac.currentTime, 0.05); ctx.syncUI(); }
      ['seed', 'transform', 'amount', 'depth', 'partials', 'ceiling'].forEach(k => P.onChange(k, recompute));
      function current() { return gen < lin.length ? lin[gen] : free; }
      // ---- drone bank: 16 oscillators, glide between generations
      const bank = Array.from({ length: 16 }, () => { const o = ac.createOscillator(), g = ac.createGain(); g.gain.value = 0; o.connect(g); g.connect(out); o.start(); ctx.track(o); ctx.track(g); return { o, g }; });
      function applyGen(t, glide) {
        const sp = current() || [], f0 = P.get('baseHz'), on = P.get('drone') ? 1 : 0, ny = ac.sampleRate * 0.45;
        const norm = 0.22 / Math.sqrt(sp.reduce((s, x) => s + x.a * x.a, 0) || 1);
        bank.forEach((b, i) => {
          const x = sp[i];
          const f = x ? Math.min(ny, f0 * x.r) : b.o.frequency.value, a = x && f0 * x.r < ny ? x.a * norm * on : 0;
          b.o.frequency.cancelScheduledValues(t); b.o.frequency.setValueAtTime(b.o.frequency.value || f, t);
          if (glide > 0.01 && b.o.frequency.value > 0) b.o.frequency.exponentialRampToValueAtTime(Math.max(1, f), t + glide); else b.o.frequency.setValueAtTime(Math.max(1, f), t);
          b.g.gain.cancelScheduledValues(t); b.g.gain.setTargetAtTime(a, t, Math.max(0.01, glide / 3));
        });
        notesFollow(t, glide);
      }
      P.onChange('drone', () => applyGen(ac.currentTime, 0.2));
      P.onChange('baseHz', () => applyGen(ac.currentTime, 0.05));
      function interval() { const r = P.get('rate'); return r === 'seconds' ? P.get('seconds') : parseInt(r, 10) * 4 * 60 / ctx.bpm; }
      function advance(t) {
        const mode = P.get('loop'), n = lin.length;
        if (mode === 'hold') return;
        if (mode === 'free') { if (gen < n - 1) gen++; else { free = step(free || lin[n - 1], opts()); gen = n; } }
        else if (mode === 'cycle') gen = (gen + 1) % n;
        else { if (gen + dir > n - 1 || gen + dir < 0) dir = -dir; gen = Math.max(0, Math.min(n - 1, gen + dir)); }
        applyGen(t, interval() * P.get('morph'));
        ctx.emitUI('gen', { gen, free: gen >= n, spectrum: current() });
        if (P.get('autoSend')) sendSpectrum();
      }
      // time base: seconds → own interval timer (audio clock checked); bars → transport ticks
      let nextAt = ac.currentTime + interval();
      ctx.interval(() => { if (P.get('rate') !== 'seconds') return; const now = ac.currentTime; if (now + 0.05 >= nextAt) { advance(Math.max(now, nextAt)); nextAt = Math.max(now, nextAt) + interval(); } }, 40);
      P.onChange('seconds', () => { nextAt = ac.currentTime + interval(); });
      ctx.onTick((tk) => { const r = P.get('rate'); if (r === 'seconds') return; const bars = parseInt(r, 10); if (tk.step16 % (16 * bars) === 0) advance(tk.time); });
      ctx.advance = advance;
      // ---- notes: poly voices that follow the generations while held
      const voices = [];
      function noteOn(f, vel, t, dur) {
        t = Math.max(t || ac.currentTime, ac.currentTime);
        while (voices.length >= 4) killVoice(voices[0], t);
        const sp = current() || [], amp = ac.createGain(); amp.gain.value = 0; amp.connect(out);
        const norm = 0.25 / Math.sqrt(sp.reduce((s, x) => s + x.a * x.a, 0) || 1), ny = ac.sampleRate * 0.45;
        const os = sp.filter(x => f * x.r < ny).map(x => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f * x.r; g.gain.value = x.a * norm; o.connect(g); g.connect(amp); o.start(t); return { o, g, r: x.r }; });
        dsp.adsr(amp.gain, t, { a: P.get('attack'), d: 0.3, s: 0.85, peak: 0.25 + 0.75 * vel });
        const v = { f, amp, os, off: Infinity }; voices.push(v);
        if (dur !== undefined) releaseVoice(v, t + dur);
        return v;
      }
      function notesFollow(t, glide) { const sp = current() || []; voices.forEach(v => v.os.forEach((x, i) => { const y = sp[i]; if (!y) return; x.o.frequency.cancelScheduledValues(t); x.o.frequency.setValueAtTime(x.o.frequency.value, t); x.o.frequency.exponentialRampToValueAtTime(Math.max(1, v.f * y.r), t + Math.max(0.02, glide)); })); }
      function releaseVoice(v, t) { if (v.off <= t) return; v.off = t; const R = P.get('release'); dsp.release(v.amp.gain, t, R); v.os.forEach(x => { x.o.stop(t + R * 1.6 + 0.05); }); const last = v.os[v.os.length - 1]; const done = () => { v.os.forEach(x => { try { x.o.disconnect(); x.g.disconnect(); } catch (e) {} }); try { v.amp.disconnect(); } catch (e) {} const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); }; if (last) last.o.onended = done; else done(); }
      function killVoice(v, t) { const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); v.amp.gain.cancelScheduledValues(t); v.amp.gain.setTargetAtTime(0, t, 0.01); v.os.forEach(x => { try { x.o.stop(t + 0.06); } catch (e) {} }); }
      const MT = window.MusicTheory;
      ctx.onNote((p) => noteOn(p.freq || MT.hz(p.note), p.velocity, p.time, p.duration));
      ctx.onMidi((p) => { if (p.on) { const v = noteOn(MT.hz(p.note), p.velocity); v.note = p.note; } else voices.filter(v => v.note === p.note && v.off === Infinity).forEach(v => releaseVoice(v, ac.currentTime)); });
      ctx.audition = (p) => noteOn(MT.hz(p.note || 57), p.velocity || 0.8, ac.currentTime, p.duration || 2);
      // ---- send
      function sendSpectrum() { const sp = current(); if (sp && sp.length) ctx.emit('xen:spectrum', { partials: sp.map(x => ({ r: x.r, a: x.a })), name: `${P.get('transform')} gen ${gen}`, target: '*' }); }
      function sendScale() {
        const sp = current(); if (!sp || !sp.length) return;
        const m = XT.minima(XT.dissonanceCurve(sp, P.get('baseHz') * 2, 0, 1250, 3), 0.015).map(x => x.c).filter(c => c < 1195);
        ctx.emit('xen:tuning', { steps: m.length ? m : [0], period: 1200, name: `timbre-scale gen ${gen}`, target: '*' });
        return m;
      }
      ctx.sendScale = sendScale;
      ctx.onUI('goto', { type: 'object', required: ['gen'] }, (p) => { gen = Math.max(0, Math.min(lin.length - 1, p.gen | 0)); applyGen(ac.currentTime, 0.3); ctx.emitUI('gen', { gen, spectrum: current() }); });
      ctx.onUI('send_spectrum', null, sendSpectrum);
      // 3.28 stop contract: Stop / Stop all turn the drone bank off and let held notes go (Drone brings it back)
      ctx.onSilence((p) => { const t = Math.max(ac.currentTime, p.time || 0); if (P.get('drone')) P.set('drone', false); applyGen(t, p.hard ? 0.02 : 0.4); voices.filter(v => v.off === Infinity).forEach(v => releaseVoice(v, t)); ctx.syncUI(); });
      ctx.onUI('send_scale', null, () => sendScale());
      ctx.on('xen:spectrum', { type: 'object' }, (p) => {
        if (p._from === ctx.id || (p.target && p.target !== '*' && p.target !== ctx.id) || !Array.isArray(p.partials) || !p.partials.length) return;
        const base = p.partials[0].r || 1; received = p.partials.filter(x => x && x.r > 0).map(x => ({ r: x.r / base, a: x.a === undefined ? 1 : x.a })).sort((a, b) => a.r - b.r).slice(0, 16);
        P.set('seed', 'received'); recompute();
      });
      ctx.saveExtra = () => ({ received, gen });
      ctx.loadExtra = (x) => { if (x && Array.isArray(x.received)) received = x.received; if (x && typeof x.gen === 'number') gen = x.gen; recompute(); };
      ctx.stateExtra = () => ({ lineage: lin.map(sp => sp.map(x => [+x.r.toFixed(5), +x.a.toFixed(4)])), gen, ceiling: P.get('ceiling') });
      ctx.internals = { get lineage() { return lin; }, get gen() { return gen; }, step, lineageOf: lineage, bank, voices };
      recompute();
      return {};
    },
  });
})();
