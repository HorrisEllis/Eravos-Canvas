/* eravos.fx-echo 1.0.0 — Tape Echo (P10 · W-01) · spec eravos.organism.fx-echo · inherits STD.fx
 * in → throwGate → two delay lines (mono | ping-pong | offset) ; feedback loop per line:
 * HP 120 Hz → LP (head age) → tanh saturation → feedback gain ; wow (0.6 Hz) + flutter (7 Hz) on delayTime.
 * throw: gate opens for one division (dub throw), tail rings out. freeze: feedback → 1, input muted.
 * 3.28 (RCA, "the tape never stops"): the saturator sat INSIDE the loop with the 'soft' curve, whose small-signal gain
 * is ≈ 3.3× at the default setting — so feedback 0.45 was really ≈ 1.5 per repeat and every preset ran away forever.
 * The loop now uses the 'tape' curve (unity small-signal gain): the Feedback knob IS the loop gain. Above 1 (or
 * Freeze) it sustains on purpose — Stop fades that out, CLEAR / Stop all empties the tape at once. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const DIVS = ['1/4', '1/8', '1/8.', '1/16', '1/4t', '3/16', '1/2'];
  OrganismFactory.define({
    id: 'eravos.fx-echo', domain: 'music', version: '1.0.0', label: 'Tape Echo', icon: '⌁', accent: '#00ff44', phase: 'P10',
    category: 'Effects', blurb: 'Echo with character: dub throws, ping-pong, worn tape. Plug any sound into it.',
    size: { w: 460, h: 470 }, minSize: { w: 360, h: 360 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([
      S.event('echo.hook.throw_in', 'in', 'fx:throw', { type: 'object', required: ['target'] }, '1.0.0'),
      S.mod_in('echo.hook.mod_feedback', 'feedback'), S.mod_in('echo.hook.mod_age', 'age'),
    ]),
    config: [
      { key: 'div', type: 'enum', options: DIVS, default: '1/8.', label: 'Time', group: 'TIME' },
      { key: 'sync', type: 'boolean', default: true, label: 'Sync', group: 'TIME' },
      { key: 'timeFree', type: 'number', default: 300, min: 1, max: 2000, step: 1, unit: 'ms', label: 'Free time', group: 'TIME' },
      { key: 'stereo', type: 'enum', options: ['mono', 'pingpong', 'offset'], default: 'pingpong', label: 'Stereo', group: 'TIME' },
      { key: 'offsetRatio', type: 'number', default: 1.5, min: 0.5, max: 2, step: 0.01, label: 'R × time', group: 'TIME', hint: 'offset mode: right delay = left × this' },
      { key: 'feedback', type: 'number', default: 0.45, min: 0, max: 1.05, step: 0.01, label: 'Feedback', group: 'TAPE', hint: 'how much of each repeat comes back — above 1 it runs away and holds (Stop or CLEAR ends it)' },
      { key: 'age', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Age', group: 'TAPE', hint: 'darker repeats' },
      { key: 'wow', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01, label: 'Wow', group: 'TAPE' },
      { key: 'flutter', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01, label: 'Flutter', group: 'TAPE' },
      { key: 'sat', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Saturation', group: 'TAPE' },
      { key: 'throwMode', type: 'boolean', default: false, label: 'Throw only', group: 'THROW', hint: 'input only reaches the echo while THROW is pressed' },
      { key: 'freeze', type: 'boolean', default: false, label: 'Freeze', group: 'THROW', hint: 'loop the tail forever' },
    ].concat(SDK.STD_FX_CONFIG.map(c => c.key === 'mix' ? Object.assign({}, c, { default: 0.35 }) : c)),
    ui_hooks: ['throw', 'clear'],
    defaultPreset: 'Ping-pong 1/8.',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const fx = SDK.fxShell(ctx);
      const gate = ac.createGain(), split = ac.createChannelSplitter(2), mono = ac.createGain(), merge = ac.createChannelMerger(2);
      mono.channelCount = 1; mono.channelCountMode = 'explicit'; mono.channelInterpretation = 'speakers';
      const kill = ac.createGain(); fx.wetIn.connect(gate); gate.connect(mono); merge.connect(kill); kill.connect(fx.wetOut); ctx.track(kill);
      const fbMod = ctx.modBus('feedback', { min: -1, max: 1 }), ageMod = ctx.modBus('age', { min: -1, max: 1 });
      function line() {
        const d = ac.createDelay(4), hp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), sh = ac.createWaveShaper(), fb = ac.createGain(), inG = ac.createGain();
        hp.type = 'highpass'; hp.frequency.value = 120; lp.type = 'lowpass'; sh.oversample = '2x';
        inG.connect(d); d.connect(hp); hp.connect(lp); lp.connect(sh); sh.connect(fb);
        fbMod.connect(fb.gain); const ageDet = ac.createGain(); ageDet.gain.value = -2400; ageMod.connect(ageDet); ageDet.connect(lp.detune);
        [d, hp, lp, sh, fb, inG, ageDet].forEach(n => ctx.track(n));
        return { d, hp, lp, sh, fb, inG };
      }
      const L = line(), R = line();
      // 3.39: the 2x shaper in the loop adds 128 samples per pass (repeat 8 was 18.7 ms late at 48 kHz). The input enters
      // through a matching pre-delay and the line is shortened by it, so repeat n lands exactly at n × the set time.
      const OSL = dsp.osLatency(ac, '2x'), preL = ac.createDelay(0.1), preR = ac.createDelay(0.1); preL.delayTime.value = preR.delayTime.value = OSL; preL.connect(L.inG); preR.connect(R.inG); ctx.track(preL); ctx.track(preR);
      // wow + flutter → both delay times (seconds)
      const wow = ac.createOscillator(), flu = ac.createOscillator(), wowG = ac.createGain(), fluG = ac.createGain();
      wow.frequency.value = 0.6; flu.frequency.value = 7.3; wow.connect(wowG); flu.connect(fluG);
      [L, R].forEach(l => { wowG.connect(l.d.delayTime); fluG.connect(l.d.delayTime); });
      wow.start(); flu.start(); [wow, flu, wowG, fluG, gate, split, mono, merge].forEach(n => ctx.track(n));
      let mode = null;
      function wire() {
        const m = P.get('stereo'); if (m === mode) return; mode = m;
        [mono, L.fb, R.fb, L.d, R.d].forEach(n => { try { n.disconnect(); } catch (e) {} });
        L.d.connect(L.hp); R.d.connect(R.hp);
        mono.connect(preL);
        if (m === 'pingpong') { L.fb.connect(R.inG); R.fb.connect(L.inG); L.d.connect(merge, 0, 0); R.d.connect(merge, 0, 1); }
        else if (m === 'offset') { mono.connect(preR); L.fb.connect(L.inG); R.fb.connect(R.inG); L.d.connect(merge, 0, 0); R.d.connect(merge, 0, 1); }
        else { L.fb.connect(L.inG); L.d.connect(merge, 0, 0); L.d.connect(merge, 0, 1); }
      }
      const time = () => P.get('sync') ? MT.divisionSec(P.get('div'), ctx.bpm) : P.get('timeFree') / 1000;
      ctx.delayTime = time;
      function apply(now) {
        const t = ac.currentTime, base = Math.min(3.9, time()), sat = P.get('sat'), frz = P.get('freeze');
        const set = (prm, v, tc) => now === true ? prm.setValueAtTime(v, t) : prm.setTargetAtTime(v, t, tc || 0.02);
        set(L.d.delayTime, Math.max(0, base - OSL));
        set(R.d.delayTime, Math.max(0, Math.min(3.9, P.get('stereo') === 'offset' ? base * P.get('offsetRatio') : base) - OSL));
        // saturation bounds the loop: without it feedback is capped below 1
        const fbv = frz ? 1 : (sat > 0.01 ? P.get('feedback') : Math.min(0.98, P.get('feedback')));
        [L, R].forEach(l => {
          set(l.fb.gain, fbv);
          set(l.lp.frequency, 12000 * Math.pow(2500 / 12000, P.get('age')));
          l.sh.curve = sat > 0.01 || frz ? dsp.curve('tape', Math.max(0.05, sat)) : null;
        });
        set(wowG.gain, P.get('wow') * 0.004, 0.05); set(fluG.gain, P.get('flutter') * 0.0006, 0.05);
        set(gate.gain, frz || P.get('throwMode') ? 0 : 1, 0.005);
      }
      // exact start values: GainNodes default to 1, which would swing delayTime by a whole second at mount
      wire(); apply(true);
      ['div', 'sync', 'timeFree', 'feedback', 'age', 'wow', 'flutter', 'sat', 'offsetRatio', 'freeze', 'throwMode'].forEach(k => P.onChange(k, () => apply()));
      P.onChange('stereo', () => { wire(); apply(); });
      ctx.onBpm(() => apply());
      function doThrow(at) {
        const t0 = Math.max(ac.currentTime, at || ac.currentTime), len = time();
        gate.gain.cancelScheduledValues(t0); gate.gain.setValueAtTime(0, t0); gate.gain.linearRampToValueAtTime(1, t0 + 0.003);
        gate.gain.setValueAtTime(1, t0 + len - 0.003); gate.gain.linearRampToValueAtTime(P.get('throwMode') || P.get('freeze') ? 0 : 1, t0 + len);
        ctx.emitUI('thrown', { time: t0, len });
      }
      ctx.doThrow = doThrow;
      ctx.onUI('throw', null, () => doThrow());
      ctx.on('fx:throw', { type: 'object', required: ['target'] }, (p) => { if (ctx.isTarget(p)) doThrow(p.time); });
      // ---- stopping (3.28). clear = empty both tape loops: output muted and feedback cut for longer than the longest
      // line, then everything restored — the delay buffers hold only silence afterwards, so nothing can regrow.
      let clearing = 0;
      function clear(at, fadeSec) {
        const t = Math.max(ac.currentTime, at || 0), fade = Math.max(0.01, fadeSec || 0.01);
        const span = Math.min(3.9, Math.max(L.d.delayTime.value, R.d.delayTime.value, time() * Math.max(1, P.get('offsetRatio')))) + 0.06;
        const tEmpty = t + fade, tBack = tEmpty + span;
        kill.gain.cancelScheduledValues(t); kill.gain.setValueAtTime(1, t); kill.gain.linearRampToValueAtTime(0, tEmpty);
        [L, R].forEach(l => { l.fb.gain.cancelScheduledValues(t); l.fb.gain.setValueAtTime(l.fb.gain.value, t); l.fb.gain.linearRampToValueAtTime(fade > 0.05 ? 0.3 : 0, tEmpty); l.fb.gain.setValueAtTime(0, tEmpty); });
        gate.gain.cancelScheduledValues(t); gate.gain.setValueAtTime(0, t);
        kill.gain.setValueAtTime(0, tBack); kill.gain.linearRampToValueAtTime(1, tBack + 0.01);
        const frz = P.get('freeze'), fbv = frz ? 1 : P.get('feedback');
        [L, R].forEach(l => l.fb.gain.setValueAtTime(fbv, tBack));
        gate.gain.setValueAtTime(frz || P.get('throwMode') ? 0 : 1, tBack);
        clearing = tBack; ctx.emitUI('cleared', { at: t, until: tBack });
      }
      const runaway = () => P.get('freeze') || P.get('feedback') >= 0.99;
      ctx.onSilence((p) => {
        if (p.hard) return clear(p.time, 0.01);            // Stop all / ■: empty now
        if (runaway()) clear(p.time, 1.5);                 // Stop: a held/runaway loop fades over 1.5 s, then empties
        // a loop below 1 just rings out — a tail, not a hang
      });
      ctx.onUI('clear', null, () => clear(ac.currentTime, 0.02));
      ctx.clear = clear;
      ctx.internals = { L, R, gate, kill, get clearing() { return clearing; } };
      return { unmount() {} };
    },
  });
})();
