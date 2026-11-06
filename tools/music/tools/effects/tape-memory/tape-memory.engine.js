/* eravos.tape-memory 1.0.0 — Tape Memory · spec tape-memory.spec (design: tools/music/planned/tape-memory.spec · face: planned/tape-memory.ui.md)
 * His words: "i also want to be able to make lofi" (2026-11-05) · "Lofi tools: UI previews first." · "yes" (2026-11-06).
 * The tape itself, on the whole sound: wow, flutter, hiss, crackle, dropouts, copies of copies, the machine's character, tape stop.
 * Made of its seven components, wired (a suite when opened as components — Axiom 3), every timed value an AudioParam:
 *   in → saturator-tape → bitcrusher → delay-line L / R (time = 15 ms + the transport's lag + wow + flutter; R + L/R drift)
 *      → filter-svf high-pass (low cut) → filter-svf low-pass (high cut, lowered per copy and by Wear; VHS: head tilt sweeps it)
 *      → dropout gain (1 − the dropout gate)                                                      → sum → out (mix with the dry in)
 *   osc-noise pink (hiss, tone = tilt) → hiss level → sum · osc-noise crackle (random clicks) → filter-svf band-pass (their body) → sum
 *   random-source ×5: wow (smooth, Wow rate) · flutter (smooth, Flutter rate) · L/R drift · head tilt · dropout events (gate → dropout out)
 *   tape-transport: Speed, Tape stop / spin-up on its curve, the lag → the delay lines' time (so the pitch bends like tape)
 * WEAR scales wow, flutter, hiss, crackle, dropouts and the top end together; COPIES re-applies the wear per copy (softer, duller, noisier,
 * more wobble) — a number, not a chain of copies (decided in the spec). Dust is made live — never a recording (No toys). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const n = (key, label, group, def, min, max, step, unit, hint) => Object.assign({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group }, unit ? { unit } : {}, hint ? { hint } : {});
  const MODES = ['cassette', 'vhs', 'reel', 'dictaphone'];
  // each machine's character: its top end, how its wow and flutter go, its hiss, its head bump, a floor for low cut
  const MACHINE = {
    cassette:   { hf: 12000, wow: 1, flut: 1, hiss: 1, bump: 2, bumpF: 90, low: 30 },
    vhs:        { hf: 9000, wow: 0.8, flut: 1.4, hiss: 1.2, bump: 1.5, bumpF: 80, low: 40 },
    reel:       { hf: 18000, wow: 0.5, flut: 0.4, hiss: 0.6, bump: 3, bumpF: 60, low: 20 },
    dictaphone: { hf: 4500, wow: 1.3, flut: 2, hiss: 1.8, bump: 0, bumpF: 90, low: 300 },
  };
  OrganismFactory.define({
    id: 'eravos.tape-memory', domain: 'music', version: '1.0.0', label: 'Tape Memory', icon: '📼', accent: '#d6b37a',
    category: 'Effects', blurb: 'Lofi wear on anything: wow, flutter, hiss, crackle, dropouts — a copy of a copy, made live.',
    size: { w: 560, h: 600 }, minSize: { w: 440, h: 440 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([
      S.transport_in('tm.hook.transport_in'),
      S.mod_in('tm.hook.mod_wear', 'wear'), S.mod_in('tm.hook.mod_speed', 'speed'),
      S.mod_out('tm.hook.dropout', 'dropout'),
    ]),
    config: [
      { key: 'mode', type: 'enum', options: MODES, default: 'cassette', label: 'Machine', group: 'WEAR' },
      n('wear', 'Wear', 'WEAR', 0.35, 0, 1, 0.01, null, 'moves wow, flutter, dust and the top end together'), { key: 'generation', type: 'integer', default: 2, min: 1, max: 8, label: 'Copies', group: 'WEAR', hint: 'a copy of a copy: each one softer, duller, noisier' },
      n('wow', 'Wow', 'MOTION', 0.3, 0, 1), n('flutter', 'Flutter', 'MOTION', 0.2, 0, 1), n('speed', 'Speed', 'MOTION', 1, 0.5, 1.5, 0.001, '×', 'pitch and time together'),
      n('hiss', 'Hiss', 'DUST', 0.25, 0, 1), n('crackle', 'Crackle', 'DUST', 0.2, 0, 1), n('dropouts', 'Dropouts', 'DUST', 0.1, 0, 1),
      n('lowCut', 'Low cut', 'TONE', 60, 20, 400, 1, 'Hz'), n('highCut', 'High cut', 'TONE', 7000, 1500, 18000, 1, 'Hz'), n('drive', 'Saturate', 'TONE', 0.35, 0, 1),
      n('wowRate', 'Wow rate', 'MOTION+', 0.6, 0.05, 4, 0.01, 'Hz'), n('flutterRate', 'Flutter rate', 'MOTION+', 9, 3, 25, 0.1, 'Hz'), n('stereoWow', 'L/R drift', 'MOTION+', 0.2, 0, 1),
      { key: 'wowSync', type: 'enum', options: ['free', '1 bar', '2 bars', '1/2'], default: 'free', label: 'Wow on the beat', group: 'MOTION+' },
      n('crackleSize', 'Crackle size', 'DUST+', 0.4, 0, 1), n('dropLen', 'Dropout length', 'DUST+', 0.08, 0.01, 0.5, 0.01, 's'), n('hissTone', 'Hiss tone', 'DUST+', 0.5, 0, 1),
      n('head', 'Head tilt', 'TAPE+', 0, 0, 1, 0.01, null, 'VHS tracking: the top drops out in waves'),
      { key: 'bits', type: 'integer', default: 16, min: 4, max: 16, label: 'Bits', group: 'DIGITAL' }, n('rate', 'Sample rate', 'DIGITAL', 48000, 4000, 48000, 100, 'Hz'),
      n('stopTime', 'Stop time', 'STOP', 0.8, 0.1, 4, 0.01, 's'),
      { key: 'stopped', type: 'boolean', default: false, label: 'Tape stopped', group: 'STOP', hint: 'the tape slows to a stop over Stop time; off: it spins back up' },
    ].concat(SDK.STD_FX_CONFIG),
    ui_hooks: ['stop'],
    presets: {},
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MP = window.MusicParts, fx = SDK.fxShell(ctx), BASE = 0.015;
      fx.setLatency(BASE);   // the tape sits 15 ms behind: the blended dry waits for it
      const out = ac.createGain(); out.connect(fx.wetOut); ctx.track(out);
      const dropOut = ac.createGain(); ctx.track(dropOut); ctx.port('dropout', { kind: 'mod', direction: 'out', node: dropOut, label: 'dropout' });
      const wearMod = ctx.modBus('wear', { min: -1, max: 1 }), speedMod = ctx.modBus('speed', { min: -0.5, max: 0.5 });
      let N = null; const queue = [];
      const when = (f) => { if (N) f(); else queue.push(f); };
      const set = (prm, v, t) => { const at = t === undefined ? ac.currentTime : t; prm.cancelScheduledValues(at); prm.setTargetAtTime(v, at, 0.02); };
      const ready = Promise.all([
        MP.saturatorTape(ac), MP.bitcrusher(ac, { seed: 3 }), MP.delay(ac, { channels: 1, maxSeconds: 21 }), MP.delay(ac, { channels: 1, maxSeconds: 21 }),
        MP.svf(ac), MP.svf(ac), MP.svf(ac),
        MP.noise(ac, { seed: 11 }), MP.noise(ac, { seed: 12 }),
        MP.randomSource(ac, { seed: 21 }), MP.randomSource(ac, { seed: 22 }), MP.randomSource(ac, { seed: 23 }), MP.randomSource(ac, { seed: 24 }), MP.randomSource(ac, { seed: 25 }),
        MP.tapeTransport(ac),
      ]).then(([sat, crush, dL, dR, hp, lp, bp, hissN, crackN, wowR, flutR, driftR, headR, dropR, tr]) => {
        if (ctx.disposed) return null;
        [sat, crush, dL, dR, hp, lp, bp, hissN, crackN, wowR, flutR, driftR, headR, dropR, tr].forEach(x => ctx.track(x));
        const g = () => { const x = ac.createGain(); ctx.track(x); return x; }, split = ac.createChannelSplitter(2), merge = ac.createChannelMerger(2), tSplit = ac.createChannelSplitter(2), dSplit = ac.createChannelSplitter(2);
        [split, merge, tSplit, dSplit].forEach(x => ctx.track(x));
        const wowG = g(), flutG = g(), driftG = g(), headG = g(), hissG = g(), crackG = g(), dropG = g(), dropDepth = g(), wearWow = g(), wearHiss = g();
        // the tape path
        fx.wetIn.connect(sat); sat.connect(crush); crush.connect(split); split.connect(dL, 0); split.connect(dR, 1); dL.connect(merge, 0, 0); dR.connect(merge, 0, 1);
        merge.connect(hp); hp.connect(lp); lp.connect(dropG); dropG.connect(out);
        // dust
        hissN.connect(hissG); hissG.connect(out); crackN.connect(bp); bp.connect(crackG); crackG.connect(out);
        // what moves the read head: the transport's lag (ch1), wow and flutter on both sides, the L/R drift on the right
        tr.connect(tSplit); [dL, dR].forEach(d => { tSplit.connect(d.parameters.get('time'), 1); wowG.connect(d.parameters.get('time')); flutG.connect(d.parameters.get('time')); });
        wowR.connect(wowG); flutR.connect(flutG); driftR.connect(driftG); driftG.connect(dR.parameters.get('time'));
        headR.connect(headG); headG.connect(lp.parameters.get('detune'));
        // dropouts: the gate dips the tape path and goes out as a modulation
        dropR.connect(dSplit); dSplit.connect(dropDepth, 1); dropDepth.connect(dropG.gain); dSplit.connect(dropOut, 1);
        // modulation inputs: Speed into the transport; Wear into the wow and hiss depths
        speedMod.connect(tr.parameters.get('speed')); wearMod.connect(wearWow); wearWow.connect(wowG.gain); wearMod.connect(wearHiss); wearHiss.connect(hissG.gain);
        // fixed settings of the parts
        const fixed = (node, o) => Object.entries(o).forEach(([k, v]) => node.parameters.get(k).setValueAtTime(v, ac.currentTime));
        [dL, dR].forEach(d => fixed(d, { time: BASE, feedback: 0, mix: 1, mode: 0, damp: 22000, lowcut: 1, drive: 0, sync: 0, modDepth: 0 }));
        fixed(hp, { mode: 1, resonance: 0, stages: 1 }); fixed(lp, { mode: 0, resonance: 0.05, stages: 2 }); fixed(bp, { mode: 2, frequency: 2200, resonance: 0.3, stages: 1 });
        fixed(hissN, { colour: 1, width: 1, level: 1 }); fixed(crackN, { colour: 4, width: 1, level: 1 });
        fixed(wowR, { smooth: 1, depth: 1 }); fixed(flutR, { smooth: 1, depth: 1 }); fixed(driftR, { smooth: 1, depth: 1, rate: 0.23 }); fixed(headR, { smooth: 1, depth: 1, rate: 0.35, unipolar: 1 });
        fixed(dropR, { depth: 0 }); fixed(crush, { aa: 1, dither: 1, jitter: 0, mix: 1 }); fixed(sat, { mix: 1, hf: 24000 }); fixed(tr, { curve: 0.4, startTime: 0.35, maxLag: 20 });
        dropG.gain.value = 1;
        N = { sat, crush, dL, dR, hp, lp, bp, hissN, crackN, wowR, flutR, driftR, headR, dropR, tr, wowG, flutG, driftG, headG, hissG, crackG, dropDepth, wearWow, wearHiss };
        apply(true); queue.splice(0).forEach(f => f()); return N;
      }).catch(e => { ctx.fault('RUNTIME_003', 'tape memory: ' + e.message); return null; });
      let barRate = null;   // Wow on the beat: the transport's bar, from its ticks
      function apply(now) {
        if (!N) return;
        const t = ac.currentTime, m = MACHINE[P.get('mode')] || MACHINE.cassette, wear = P.get('wear'), gen = P.get('generation');
        const wf = 0.3 + 1.4 * wear, gf = 1 + 0.35 * (gen - 1), at = now || t < 0.05, sv = (prm, v) => at ? prm.setValueAtTime(v, t) : set(prm, v);   // before the sound starts: exact at once; while it plays: a 20 ms glide (no clicks)
        const wowSec = P.get('wow') * 0.006 * wf * m.wow * gf, flutSec = P.get('flutter') * 0.0004 * wf * m.flut * gf;
        const sync = P.get('wowSync'), wowRate = sync !== 'free' && barRate ? barRate * ({ '1 bar': 1, '2 bars': 0.5, '1/2': 2 }[sync]) : P.get('wowRate');
        sv(N.wowG.gain, wowSec); sv(N.flutG.gain, flutSec); sv(N.driftG.gain, P.get('stereoWow') * 0.004 * wf * gf);
        sv(N.wowR.parameters.get('rate'), wowRate); sv(N.flutR.parameters.get('rate'), P.get('flutterRate'));
        N.wearWow.gain.setValueAtTime(P.get('wow') * 0.006 * m.wow, t); N.wearHiss.gain.setValueAtTime(P.get('hiss') * 0.05 * m.hiss, t);
        sv(N.hissG.gain, P.get('hiss') * 0.05 * wf * m.hiss * Math.sqrt(gen)); sv(N.hissN.parameters.get('tilt'), P.get('hissTone') * 2 - 1);
        const cr = P.get('crackle'); sv(N.crackN.parameters.get('density'), Math.max(1, cr * 30 * wf)); sv(N.crackG.gain, cr * (0.25 + 0.5 * P.get('crackleSize')));
        const dens = P.get('dropouts') * 3 * wf; N.dropR.parameters.get('density').setValueAtTime(dens, t); N.dropR.parameters.get('eventLen').setValueAtTime(P.get('dropLen'), t); N.dropDepth.gain.setValueAtTime(dens > 0 ? -0.85 : 0, t);
        sv(N.hp.parameters.get('frequency'), Math.max(m.low, P.get('lowCut')));
        sv(N.lp.parameters.get('frequency'), Math.max(800, Math.min(P.get('highCut'), m.hf) * Math.pow(0.85, gen - 1) / (1 + 0.5 * wear)));
        sv(N.headG.gain, P.get('mode') === 'vhs' ? -P.get('head') * 2400 : 0);
        sv(N.sat.parameters.get('drive'), Math.min(24, P.get('drive') * 18 + 1.5 * (gen - 1))); sv(N.sat.parameters.get('bump'), m.bump); N.sat.parameters.get('bumpFreq').setValueAtTime(m.bumpF, t); sv(N.sat.parameters.get('bias'), 0.2); const dr = Math.min(24, P.get('drive') * 18 + 1.5 * (gen - 1)); sv(N.sat.parameters.get('out'), -(4.5 + m.bump) * Math.min(1, dr / 6));   // the saturation, its bias and the bump add level: trimmed as the drive comes in, so a hot input stays under full scale (clean = no trim)
        N.crush.parameters.get('bits').setValueAtTime(P.get('bits') >= 16 ? 24 : P.get('bits'), t); N.crush.parameters.get('rate').setValueAtTime(P.get('rate') >= 48000 ? Math.max(48000, ac.sampleRate) : P.get('rate'), t);
        sv(N.tr.parameters.get('speed'), P.get('speed')); N.tr.parameters.get('stopTime').setValueAtTime(P.get('stopTime'), t); N.tr.parameters.get('stop').setValueAtTime(P.get('stopped') ? 1 : 0, t);
      }
      P.onChange('*', () => apply(false));
      ctx.onTick((tk) => { const r = 1 / (16 * tk.stepDur); if (P.get('wowSync') !== 'free' && (!barRate || Math.abs(r - barRate) > 1e-6)) { barRate = r; apply(false); } else barRate = r; });
      ctx.onUI('stop', null, () => { P.set('stopped', !P.get('stopped')); ctx.syncUI(); });
      ctx.stateExtra = () => ({ ready: !!N, latency: BASE });
      ctx.ready = ready; ctx.internals = { ready, nodes: () => N, MACHINE, apply };
      return {};
    },
  });
})();
