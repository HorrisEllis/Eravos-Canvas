/* eravos.midi-mapper 1.1.0 — MIDI Map (P8.5 · 3.35 pad roles)
 * 3.35: every pad has a ROLE — drum (default: the pad tool, as before) · drum on a chosen tool (split) · a note or a chord
 * in the song key on a chosen instrument · an ACTION (transport, markers, drop, pattern slots, octave, bank).
 * Layouts set all 16 at once (Drums · Keys · Chords + drums · Split · Perform); ✎ edits one pad (→ Custom).
 * Owns Web MIDI I/O. Pads: learn your controller's 16 pads once (hit each pad) → they play ERAVOS pads /
 * sample slices directly. Knobs/faders: LEARN = move a hardware control, then touch any ERAVOS knob → mapped.
 * Profiles: generic · Donner StarryPad (4×4 pads, knobs, faders — notes learned, not assumed) · Launchpad-style · APC-style.
 * Publishes midi:note (canonical source) ; drives ui:config_change:<target> ; LED feedback out (optional). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  // factory pad maps: a controller works the moment it is plugged in; LEARN only customises.
  // Donner StarryPad / DPD-16 factory notes (pad 1 bottom-left → 16 top-right), sent on channel 10; matched on any channel
  const STARRY = [36, 38, 40, 41, 43, 45, 47, 48, 50, 52, 53, 55, 57, 59, 60, 62];
  const PROFILES = {
    generic: { label: 'Generic (notes 36–51)', grid: [4, 4], bottomUp: true, led: false, pads: Array.from({ length: 16 }, (_, i) => ({ note: 36 + i, channel: 10 })), anyChannel: true },
    starrypad: { label: 'Donner StarryPad / DPD-16', grid: [4, 4], bottomUp: true, led: true, match: /starry|donner|dpd-?16/i, pads: STARRY.map(note => ({ note, channel: 10 })), anyChannel: true },
    launchpad: { label: 'Launchpad-style grid', grid: [8, 8], led: true, match: /launchpad/i },
    apc: { label: 'APC-style', grid: [8, 5], led: true, match: /apc/i },
  };
  // 3.35 pad actions — each is one bus event (the transport / timeline / drop builder / sequencer own the behaviour)
  const ACTIONS = {
    restart: '⏮ Restart (loop start / bar 1)', play: '▶ Play / stop', stop: '■ Stop', record: '⏺ Record', loop: '⟲ Loop on/off',
    metronome: '𝅘𝅥 Metronome on/off', tap: 'TAP tempo', marker_prev: '⏪ Previous marker', marker_next: '⏩ Next marker', drop: '💥 Fire the drop',
    slot_A: '▦ Pattern A', slot_B: '▦ Pattern B', slot_C: '▦ Pattern C', slot_D: '▦ Pattern D', slot_E: '▦ Pattern E', slot_F: '▦ Pattern F', slot_G: '▦ Pattern G', slot_H: '▦ Pattern H',
    fill: '✦ Sequencer fill on/off',
    oct_up: '▲ Pad octave up', oct_down: '▼ Pad octave down', bank_next: '⇆ Next knob bank',
  };
  const SHORT = { restart: '⏮', play: '▶■', stop: '■', record: '⏺', loop: '⟲', metronome: '𝅘𝅥', tap: 'TAP', fill: '✦ fill', marker_prev: '⏪', marker_next: '⏩', drop: '💥', oct_up: '▲ oct', oct_down: '▼ oct', bank_next: '⇆ bank' };
  // layouts: hardware pad index 0 = bottom-left … 15 = top-right (as the MIDI Map grid shows it); null = drum (default)
  const PERFORM = ['restart', 'play', 'record', 'loop', 'marker_prev', 'marker_next', 'drop', 'fill', 'slot_A', 'slot_B', 'slot_C', 'slot_D', 'slot_E', 'slot_F', 'slot_G', 'slot_H'];
  const LAYOUTS = {
    drums: () => new Array(16).fill(null),
    keys: () => Array.from({ length: 16 }, (_, i) => ({ kind: 'note', degree: i })),
    chords: () => Array.from({ length: 16 }, (_, i) => i < 8 ? { kind: 'chord', degree: i } : null),
    split: () => Array.from({ length: 16 }, (_, i) => i < 8 ? null : { kind: 'note', degree: i - 8 }),
    perform: () => PERFORM.map(a => ({ kind: 'action', action: a })),
  };
  const DRUM_TOOLS = ['eravos.pads', 'eravos.drum-forge', 'eravos.sample-player'];
  OrganismFactory.define({
    id: 'eravos.midi-mapper', domain: 'music', version: '1.1.0', label: 'MIDI Map', icon: '🎛', accent: '#ff6b00', phase: 'P8.5',
    category: 'Tools', blurb: 'Plug in your pad controller (e.g. Donner StarryPad): learn the pads once, map knobs by wiggling them.',
    size: { w: 640, h: 820 }, minSize: { w: 480, h: 420 },
    permissions: ['midi_in', 'midi_out', 'bus_publish', 'bus_subscribe', 'registry_read'], requires: [],
    provides: ['capability.midi_in', 'capability.midi_out', 'capability.hardware_control'],
    hooks: [
      S.event('mm.hook.midi_out_bus', 'out', 'midi:note', OrganismSDK.MIDI_SCHEMA, '1.0.0'),
      Object.assign(S.event('mm.hook.actions_out', 'out', 'ui:transport-play|ui:transport-stop|ui:transport-record|ui:transport-loop|ui:transport-metronome|ui:transport-tap|ui:transport-restart|ui:marker_jump|ui:drop_fire|seq:pattern_cue', { type: 'object' }, '1.0.0'), { rail: false, intent: 'pads as buttons: transport, markers, drop, pattern slots' }),
      Object.assign(S.event('mm.hook.transport_state_in', 'in', 'transport:state', { type: 'object' }, '1.0.0'), { rail: false, intent: 'loop / metronome state for toggle pads' }),
      Object.assign(S.event('mm.hook.status_out', 'out', 'midi:status', { type: 'object' }, '1.0.0'), { rail: false, intent: 'device + activity for the toolbar MIDI button' }),
      Object.assign(S.note_out('mm.hook.pads_out'), { intent: 'hardware pads → an instrument (no arming needed)' }),
      Object.assign(S.event('mm.hook.drive_out', 'out', 'ui:config_change', { type: 'object', required: ['key', 'value'] }, '1.0.0'), { rail: false }),
      Object.assign(S.event('mm.hook.feedback_in', 'in', 'pad:trigger|seq:fire', { type: 'object' }, '1.0.0'), { rail: false }),
    ],
    config: [
      { key: 'profile', type: 'enum', options: Object.keys(PROFILES), default: 'starrypad', label: 'Controller', group: 'DEVICE' },
      { key: 'input', type: 'string', default: '', label: 'Input', group: 'DEVICE', hidden: true },
      { key: 'output', type: 'string', default: '', label: 'Output', group: 'DEVICE', hidden: true },
      { key: 'bank', type: 'integer', default: 0, min: 0, max: 3, label: 'Map bank', group: 'MAP' },
      { key: 'padTarget', type: 'string', default: 'auto', label: 'Pads play', group: 'PADS', hidden: true },
      { key: 'velocityCurve', type: 'enum', options: ['soft', 'linear', 'hard', 'fixed'], default: 'linear', label: 'Velocity', group: 'PADS' },
      { key: 'padLayout', type: 'enum', options: ['drums', 'keys', 'chords', 'split', 'perform', 'custom'], default: 'drums', label: 'Pad layout', group: 'PADS', hint: 'drums: every pad plays the pad tool · keys: 16 notes in key · chords: 8 chords + 8 drums · split: 8 drums + 8 notes · perform: transport, markers, drop, pattern slots · custom: your own (✎)' },
      { key: 'keysTarget', type: 'string', default: 'auto', label: 'Notes play', group: 'PADS', hidden: true },
      { key: 'padOctave', type: 'integer', default: 3, min: 0, max: 7, label: 'Pad octave', group: 'PADS' },
      { key: 'chordType', type: 'enum', options: ['triad', 'seventh', 'add9', 'sus2', 'sus4', 'power'], default: 'triad', label: 'Chords', group: 'PADS' },
      { key: 'noteLength', type: 'number', default: 0.5, min: 0.05, max: 4, step: 0.05, unit: 's', label: 'Note length', group: 'PADS' },
      { key: 'ledFeedback', type: 'boolean', default: true, label: 'Light pads', group: 'PADS', hint: 'send note-on back to the controller when a pad plays (only if your hardware accepts it)' },
    ],
    ui_hooks: ['connect', 'select_io', 'learn_pads', 'learn_cancel', 'pads_factory', 'learn_map', 'map_edit', 'map_remove', 'pad_test', 'pad_role'],
    engine(ctx) {
      const P = ctx.params, K = ctx.K;
      let access = null, inPort = null, outPort = null;
      let padNotes = new Array(16).fill(null);      // learned note numbers (with channel) for pad 1..16
      let padLearn = -1;                             // index being learned
      let mappings = [[], [], [], []];               // per bank: {id, channel, type, number, target, key, min, max, curve, takeover, label}
      let mapLearn = null;                           // {stage:'source'|'target', src}
      const pickup = new Map();                      // mapping id → picked up?
      const lastCC = new Map();
      const monitor = [];
      function mon(text) { monitor.push({ t: Date.now(), text }); if (monitor.length > 60) monitor.shift(); ctx.emitUI('monitor', { lines: monitor.slice(-30) }); }
      function devices() { if (!access) return { inputs: [], outputs: [] }; const L = (m) => Array.from(m.values()).map(p => ({ id: p.id, name: p.name, state: p.state })); return { inputs: L(access.inputs), outputs: L(access.outputs) }; }
      function sync() { ctx.syncUI(); }
      function autoPick() {
        if (!access) return;
        const prof = PROFILES[P.get('profile')];
        const ins = Array.from(access.inputs.values()), outs = Array.from(access.outputs.values());
        const pick = (arr, want) => arr.find(p => p.id === want) || (prof.match ? arr.find(p => prof.match.test(p.name)) : null) || arr[0] || null;
        attachIn(pick(ins, P.get('input'))); outPort = pick(outs, P.get('output'));
      }
      function attachIn(port) {
        if (inPort && inPort !== port) inPort.onmidimessage = null;
        inPort = port;
        if (inPort) { inPort.onmidimessage = (e) => onMessage(e.data, inPort.id); mon('listening to ' + inPort.name); const prof = Object.keys(PROFILES).find(k => PROFILES[k].match && PROFILES[k].match.test(inPort.name)); if (prof && !learned() && prof !== P.get('profile')) P.set('profile', prof); }
        sync(); status();
      }
      // ---- MIDI access (P11): explicit, diagnosed. Browsers differ (see eravos.phase11-production.spec M-01…M-04):
      // Firefox refuses Web MIDI on file:// (needs a site; localhost prompts normally) and only sees devices present
      // when Firefox started; Chrome/Edge prompt on file:// and localhost; Safari has no Web MIDI.
      function midiEnv() {
        const nav = typeof navigator !== 'undefined' ? navigator : {}, loc = typeof location !== 'undefined' ? location : {};
        const ua = nav.userAgent || '';
        return { firefox: /firefox/i.test(ua), safari: /safari/i.test(ua) && !/chrome|chromium|edg|android/i.test(ua), file: loc.protocol === 'file:',
          secure: typeof isSecureContext === 'undefined' ? true : !!isSecureContext, api: !!(nav.requestMIDIAccess) };
      }
      const LAUNCH = 'close this tab and double-click “Start ERAVOS” in the ERAVOS folder — it opens http://localhost:4747';
      function explainMidi(err, env) {
        const msg = (err && err.message) || '', name = (err && err.name) || '';
        if (!env.api) {
          if (env.safari) return { error: 'Safari has no MIDI support.', help: ['Open ERAVOS in Chrome, Edge or Firefox.'] };
          if (!env.secure) return { error: 'MIDI needs ERAVOS to run from localhost or https.', help: [LAUNCH[0].toUpperCase() + LAUNCH.slice(1) + '.'] };
          return { error: 'This browser has no MIDI support.', help: ['Use Chrome, Edge or Firefox.'] };
        }
        if (env.firefox && env.file) return { error: 'Firefox blocks MIDI for pages opened straight from a file.', help: [LAUNCH[0].toUpperCase() + LAUNCH.slice(1) + '.', 'Or open this same file in Chrome or Edge — they allow MIDI from files.'] };
        if (env.firefox && /site permission|add-on/i.test(msg)) return { error: 'Firefox didn’t find a MIDI device (or access was declined).', help: ['Plug the pad in by USB.', 'Quit Firefox completely and reopen it — Firefox only sees MIDI devices that were connected when it started.', 'Press Connect MIDI again and choose Allow.'] };
        if (name === 'InvalidStateError') return { error: 'The computer’s MIDI system didn’t start.', help: ['Close other music apps (FL Studio, Ableton, other browser tabs) — on Windows only one app can use a MIDI device at a time.', 'Unplug and re-plug the pad, then press Connect MIDI.', 'Still failing: restart ERAVOS.'] };
        if (name === 'SecurityError' || name === 'NotAllowedError') return { error: 'MIDI access is blocked for this page.', help: [env.firefox ? 'Click the icon left of the address bar and remove the blocked MIDI permission.' : 'Click the icon left of the address bar → Site settings → MIDI devices → Allow.', 'Reload, then press Connect MIDI and choose Allow.'] };
        return { error: 'MIDI couldn’t start: ' + (msg || name || 'unknown error'), help: ['Unplug and re-plug the pad, then press Connect MIDI.', env.firefox ? 'If it still fails: quit Firefox fully and reopen it.' : 'If it still fails: close other music apps that may hold the device, then retry.'] };
      }
      ctx.explainMidi = explainMidi; ctx.midiEnv = midiEnv;
      function noDevicesHelp(env) { return { warn: 'Connected, but no MIDI device found.', help: ['Plug the pad in by USB.', env.firefox ? 'Then quit and reopen Firefox (it only sees devices present at startup).' : 'It appears here automatically once plugged in.'] }; }
      async function connect(injected) {
        const env = midiEnv();
        try {
          if (!K.permissions.enforce(ctx.id, 'midi_in', 'Web MIDI')) return false;
          if (!injected && !env.api) throw Object.assign(new Error('Web MIDI unavailable'), { name: 'NotSupportedError' });
          ctx.emitUI('status', { info: 'Asking the browser for MIDI access…' });
          const a = injected || await navigator.requestMIDIAccess({ sysex: false });
          if (access && !injected && access !== a) return true; // an injected/earlier access won the race
          access = a;
          access.onstatechange = (e) => { mon(`${e.port.name} ${e.port.state}`); autoPick(); if (!devices().inputs.length) ctx.emitUI('status', noDevicesHelp(env)); };
          autoPick(); mon('MIDI ready — ' + devices().inputs.length + ' input(s)');
          if (!devices().inputs.length) ctx.emitUI('status', noDevicesHelp(env));
          return true;
        } catch (e) {
          const x = explainMidi(e, env);
          ctx.fault('RUNTIME_001', 'MIDI: ' + x.error + ' (' + (e.name || '') + ' ' + (e.message || '') + ')');
          ctx.emitUI('status', x); return false;
        }
      }
      ctx.connect = connect;
      const velCurve = (v) => { const c = P.get('velocityCurve'); return c === 'fixed' ? 1 : c === 'soft' ? Math.sqrt(v) : c === 'hard' ? v * v : v; };
      function padTarget() {
        const t = P.get('padTarget');
        if (t && t !== 'auto') return K.registry.has(t) ? t : null;
        const r = K.registry.byOrganism('eravos.pads')[0] || K.registry.byOrganism('eravos.drum-forge')[0] || K.registry.byOrganism('eravos.sample-player')[0];
        return r ? r.instance_id : null;
      }
      ctx.padTarget = padTarget;
      // ---- 3.35 pad roles (hardware index → role; null = default drum)
      let roles = LAYOUTS.drums(), applying = false;
      const tstate = { loop: false, metronome: false };
      ctx.on('transport:state', { type: 'object' }, (s) => { if (s.loop) tstate.loop = !!s.loop.on; tstate.metronome = !!s.metronome; });
      const live = (id) => id && K.registry.has(id) ? id : null;
      const noteInstruments = () => K.registry.list().filter(r => (r.descriptor.provides || []).includes('capability.note_in') && r.descriptor.id !== 'eravos.midi-mapper');
      function keysTarget(want) {
        const w = live(want) || live(P.get('keysTarget') !== 'auto' ? P.get('keysTarget') : null); if (w) return w;
        const r = noteInstruments().filter(r => !DRUM_TOOLS.includes(r.descriptor.id)).pop(); return r ? r.instance_id : null; // the newest synth
      }
      ctx.keysTarget = keysTarget;
      function applyLayout(name) { if (!LAYOUTS[name]) return; roles = LAYOUTS[name](); sync(); }
      P.onChange('padLayout', (v) => { if (!applying && v !== 'custom') { applyLayout(v); remember(); } });
      const keyNow = () => ctx.key || { root: 9, scale: 'minor' };
      function pitches(role) {
        const MT = window.MusicTheory, k = keyNow(), o = P.get('padOctave');
        return role.kind === 'chord' ? MT.chord(role.degree + 1, k.root, k.scale, P.get('chordType'), o) : [MT.degreeToMidi(role.degree + 1, o, k.root, k.scale)];
      }
      function runAction(a) {
        if (a === 'restart') ctx.emit('ui:transport-restart', {});
        else if (a === 'play') ctx.emit('ui:transport-play', { toggle: true });
        else if (a === 'stop') ctx.emit('ui:transport-stop', {});
        else if (a === 'record') ctx.emit('ui:transport-record', {});
        else if (a === 'loop') { tstate.loop = !tstate.loop; ctx.emit('ui:transport-loop', { on: tstate.loop }); }
        else if (a === 'metronome') { tstate.metronome = !tstate.metronome; ctx.emit('ui:transport-metronome', { on: tstate.metronome }); }
        else if (a === 'tap') ctx.emit('ui:transport-tap', {});
        else if (a === 'marker_prev' || a === 'marker_next') ctx.emit('ui:marker_jump', { dir: a === 'marker_next' ? 1 : -1 });
        else if (a === 'drop') ctx.emit('ui:drop_fire', {});
        else if (a === 'fill') { const sq = K.registry.byOrganism('eravos.sequencer')[0]; if (!sq) { ctx.emitUI('status', { warn: 'Fill needs a Sequencer on the canvas.' }); return false; } ctx.emit('ui:config_change:' + sq.instance_id, { key: 'fill', value: !K.registry.readParam(ctx.id, sq.instance_id, 'fill'), _midi: true }); }
        else if (a.startsWith('slot_')) { const sq = K.registry.byOrganism('eravos.sequencer')[0]; if (sq) ctx.emit('seq:pattern_cue', { target: sq.instance_id, slot: a.slice(5) }); else ctx.emitUI('status', { warn: 'Pattern pads need a Sequencer on the canvas.' }); }
        else if (a === 'oct_up' || a === 'oct_down') P.set('padOctave', Math.max(0, Math.min(7, P.get('padOctave') + (a === 'oct_up' ? 1 : -1))));
        else if (a === 'bank_next') P.set('bank', (P.get('bank') + 1) % 4);
        else return false;
        mon('pad → ' + (ACTIONS[a] || a)); return true;
      }
      ctx.runAction = runAction;
      // one pad, pressed: hw = where it sits on the controller, si = the drum-tool pad it plays by default (screen order)
      function playPad(hw, si, vel) {
        const role = roles[hw], t = K.audio.ctx.currentTime;
        if (!role || role.kind === 'drum') { const tg = role && role.target ? live(role.target) : padTarget(); if (tg) ctx.emit('note:trigger', { target: tg, note: 36 + (role && typeof role.pad === 'number' ? role.pad : si), velocity: Math.max(0.01, vel), time: t, duration: 0.25 }); return; }
        if (role.kind === 'action') { runAction(role.action); return; }
        const tg = keysTarget(role.target); if (!tg) { ctx.emitUI('status', { warn: 'Note pads need an instrument — add a synth, or pick one under “Notes play”.' }); return; }
        pitches(role).forEach(n => ctx.emit('note:trigger', { target: tg, note: n, velocity: Math.max(0.01, vel), time: t, duration: P.get('noteLength') }));
      }
      ctx.playPad = playPad; ctx.roles = () => roles.slice();
      function roleLabel(r, hw) {
        if (!r) return 'drum';
        if (r.kind === 'action') return SHORT[r.action] || (r.action.startsWith('slot_') ? '▦ ' + r.action.slice(5) : r.action);
        if (r.kind === 'drum') return 'drum' + (r.target ? ' →' : '');
        const MT = window.MusicTheory, ns = pitches(r);
        return r.kind === 'chord' ? (MT.chordName ? MT.chordName(ns) : 'chord') : (MT.noteName ? MT.noteName(ns[0]) : 'n' + ns[0]);
      }
      const learned = () => padNotes.some(Boolean);
      function padMap() { return learned() ? padNotes : (PROFILES[P.get('profile')] || PROFILES.generic).pads; }
      function hwIndex(note, ch) {   // where the pad sits on the controller (learned order = hardware order)
        const prof = PROFILES[P.get('profile')] || PROFILES.generic, map = padMap();
        let i = map.findIndex(p => p && p.note === note && p.channel === ch);
        if (i < 0 && (prof.anyChannel || !learned())) i = map.findIndex(p => p && p.note === note);
        return i;
      }
      const screenOf = (hw) => hw < 0 || learned() ? hw : screen(hw, PROFILES[P.get('profile')] || PROFILES.generic);
      function padIndex(note, ch) { return screenOf(hwIndex(note, ch)); }
      ctx.hwIndex = hwIndex;
      // factory maps count pads from the BOTTOM-left (hardware); the Drum Machine counts from the TOP-left (screen):
      // flip the rows so the pad you hit is the pad you see. Learned maps are already in screen order.
      function screen(i, prof) { if (!prof || !prof.bottomUp) return i; const c = prof.grid[0], rows = prof.grid[1]; return (rows - 1 - Math.floor(i / c)) * c + (i % c); }
      ctx.screenIndex = screen;
      ctx.padIndex = padIndex; ctx.padMap = padMap;
      let lastStatus = 0;
      function status(extra) { const now = Date.now(); if (extra && extra.activity) { if (now - lastStatus < 40) return; lastStatus = now; } ctx.emit('midi:status', Object.assign({ connected: !!access, device: inPort ? inPort.name : null, profile: P.get('profile'), learned: learned() }, extra || {})); }
      ctx.status = status;
      function onMessage(data, deviceId) {
        const st = data[0] & 0xf0, ch = (data[0] & 0x0f) + 1, d1 = data[1], d2 = data[2] || 0;
        const isOn = st === 0x90 && d2 > 0, isOff = st === 0x80 || (st === 0x90 && d2 === 0), isCC = st === 0xb0;
        if (isOn || isCC) status({ activity: true });
        if (isOn || isOff || isCC) mon(`${isCC ? 'CC ' + d1 : (isOn ? 'note on ' : 'note off ') + d1} ${isCC || isOn ? 'val ' + d2 : ''} ch ${ch}`);
        // --- pad learn wizard
        if (padLearn >= 0 && isOn) {
          if (padNotes.some((p, i) => i !== padLearn && p && p.note === d1 && p.channel === ch)) { ctx.emitUI('status', { warn: `That pad is already pad ${padNotes.findIndex(p => p && p.note === d1 && p.channel === ch) + 1} — hit pad ${padLearn + 1}` }); return; }
          padNotes[padLearn] = { note: d1, channel: ch };
          ctx.emitUI('pad_hit', { index: padLearn, velocity: d2 / 127 });
          padLearn = padLearn < 15 ? padLearn + 1 : -1;
          if (padLearn < 0) { mon('all 16 pads learned ✔'); remember(); }
          sync(); return;
        }
        // --- param learn: stage 1 captures the hardware control
        if (mapLearn && mapLearn.stage === 'source' && (isCC || isOn)) { mapLearn = { stage: 'target', src: { channel: ch, type: isCC ? 'cc' : 'note', number: d1, deviceId } }; ctx.emitUI('status', { info: `Got ${isCC ? 'CC ' + d1 : 'note ' + d1}. Now move the ERAVOS knob you want it to control.` }); sync(); return; }
        // --- pads: learned map first, else the controller profile's factory map (no learning needed)
        const hw = hwIndex(d1, ch), pi = screenOf(hw);
        if ((isOn || isOff) && pi >= 0) {
          const vel = velCurve(d2 / 127);
          ctx.emit('midi:note', { note: 36 + pi, velocity: isOn ? vel : 0, on: isOn, channel: ch, deviceId, pad: pi });
          if (isOn) { playPad(hw, pi, vel); ctx.emitUI('pad_hit', { index: hw, velocity: vel }); }   // 3.35: the grid lights the pad you hit (hardware position)
          return;
        }
        // --- mapped controls
        const maps = mappings[P.get('bank')].filter(m => m.channel === ch && m.number === d1 && ((m.type === 'cc' && isCC) || (m.type === 'note' && isOn)));
        if (maps.length) { maps.forEach(m => applyMapping(m, isCC ? d2 / 127 : 1)); return; }
        // unmapped notes pass through as canonical midi:note (armed organisms play them)
        if (isOn || isOff) ctx.emit('midi:note', { note: d1, velocity: velCurve(d2 / 127), on: isOn, channel: ch, deviceId });
      }
      ctx.onMessage = onMessage;
      function cfgOf(m) { const r = K.registry.get(m.target); return r ? (r.descriptor.config || []).find(c => c.key === m.key) : null; }
      function applyMapping(m, n) {
        const c = cfgOf(m); if (!c) { ctx.fault('RUNTIME_002', `mapping ${m.label}: target gone`); return; }
        const now = performance.now(); if (now - (lastCC.get(m.id) || 0) < 1) return; lastCC.set(m.id, now);
        let u = m.curve === 'exp' ? n * n : m.curve === 'log' ? Math.sqrt(n) : n;
        u = m.min + (m.max - m.min) * u;
        let value;
        if (c.type === 'boolean') value = m.type === 'note' ? !K.registry.readParam(ctx.id, m.target, m.key) : u >= 0.5;
        else if (c.type === 'enum') value = c.options[Math.round(u * (c.options.length - 1))];
        else { value = c.min + u * (c.max - c.min); if (c.step) value = Math.round(value / c.step) * c.step; if (c.type === 'integer') value = Math.round(value); }
        if (m.takeover === 'pickup' && c.type !== 'boolean' && typeof value === 'number') {
          const cur = K.registry.readParam(ctx.id, m.target, m.key);
          if (!pickup.get(m.id)) { if (Math.abs(value - cur) > (c.max - c.min) * 0.03) return; pickup.set(m.id, true); }
        }
        ctx.emit('ui:config_change:' + m.target, { key: m.key, value, _midi: true });
      }
      ctx.applyMapping = applyMapping;
      // learn stage 2: the next UI knob touch anywhere
      ctx.on('ui:config_change:*', { type: 'object', required: ['key'] }, (p, topic) => {
        if (!mapLearn || mapLearn.stage !== 'target' || p._midi || p._auto) return;
        const target = topic.slice('ui:config_change:'.length); const r = K.registry.get(target); if (!r || target === ctx.id) return;
        const c = (r.descriptor.config || []).find(x => x.key === p.key); if (!c || !['number', 'integer', 'enum', 'boolean'].includes(c.type)) return;
        const m = Object.assign({ id: 'm' + Date.now().toString(36), target, key: p.key, min: 0, max: 1, curve: 'lin', takeover: 'jump', label: (r.descriptor.icon || '') + ' ' + r.descriptor.label + ' · ' + (c.label || p.key) }, mapLearn.src);
        mappings[P.get('bank')] = mappings[P.get('bank')].filter(x => !(x.channel === m.channel && x.number === m.number && x.type === m.type));
        mappings[P.get('bank')].push(m); mapLearn = null; remember();
        ctx.emitUI('status', { info: 'Mapped ✔ ' + m.label }); sync();
      });
      // LED feedback
      function led(i, vel) {
        const pn = padMap()[learned() ? i : screen(i, PROFILES[P.get('profile')])];
        if (!P.get('ledFeedback') || !outPort || !pn) return; const st = 0x90 | (pn.channel - 1);
        try { outPort.send([st, pn.note, Math.max(1, Math.round(vel * 127))]); outPort.send([0x80 | (pn.channel - 1), pn.note, 0], performance.now() + 120); } catch (e) { ctx.fault('RUNTIME_003', 'MIDI out: ' + e.message); }
      }
      ctx.on('pad:trigger', { type: 'object' }, (p) => { if (typeof p.index === 'number') led(p.index, p.velocity || 0.8); });
      ctx.on('seq:fire', { type: 'object' }, (p) => { if (typeof p.index === 'number') led(p.index, 0.6); });
      // UI hooks
      ctx.onUI('connect', null, () => connect());
      ctx.onUI('select_io', { type: 'object' }, (p) => { if (!access) return; if (p.input !== undefined) { P.set('input', p.input); attachIn(access.inputs.get(p.input) || null); } if (p.output !== undefined) { P.set('output', p.output); outPort = access.outputs.get(p.output) || null; sync(); } });
      ctx.onUI('learn_pads', { type: 'object' }, (p) => { padLearn = typeof p.from === 'number' ? p.from : 0; if (padLearn === 0 && !p.keep) padNotes = new Array(16).fill(null); ctx.emitUI('status', { info: 'Hit pad ' + (padLearn + 1) + ' on your controller' }); sync(); });
      ctx.onUI('learn_cancel', null, () => { padLearn = -1; mapLearn = null; sync(); });
      ctx.onUI('pads_factory', null, () => { padNotes = new Array(16).fill(null); padLearn = -1; remember(); mon('using the ' + (PROFILES[P.get('profile')] || PROFILES.generic).label + ' factory pad map'); sync(); });
      ctx.onUI('learn_map', null, () => { mapLearn = { stage: 'source' }; ctx.emitUI('status', { info: 'Move a knob or fader (or hit a button) on your controller…' }); sync(); });
      ctx.onUI('map_edit', { type: 'object', required: ['id', 'patch'] }, (p) => { const m = mappings[P.get('bank')].find(x => x.id === p.id); if (!m) return; ['min', 'max', 'curve', 'takeover'].forEach(k => { if (p.patch[k] !== undefined) m[k] = p.patch[k]; }); pickup.delete(m.id); sync(); });
      ctx.onUI('map_remove', { type: 'object', required: ['id'] }, (p) => { mappings[P.get('bank')] = mappings[P.get('bank')].filter(x => x.id !== p.id); sync(); });
      ctx.onUI('pad_test', { type: 'object', required: ['index'] }, (p) => { playPad(p.index, screenOf(p.index), 0.9); ctx.emitUI('pad_hit', { index: p.index, velocity: 0.9 }); });
      ctx.onUI('pad_role', { type: 'object', required: ['index'] }, (p) => {
        if (p.index < 0 || p.index > 15) return; const r = p.role || null;
        if (r && !((r.kind === 'drum') || (r.kind === 'action' && ACTIONS[r.action]) || ((r.kind === 'note' || r.kind === 'chord') && Number.isFinite(r.degree)))) { ctx.emitUI('status', { warn: 'That pad role is not valid.' }); return; }
        roles[p.index] = r; applying = true; P.set('padLayout', 'custom'); applying = false; remember(); sync();
      });
      P.onChange('bank', sync); P.onChange('profile', () => { autoPick(); sync(); });
      ['padOctave', 'chordType', 'keysTarget'].forEach(k => P.onChange(k, sync)); ctx.onKey && ctx.onKey(() => sync());
      ctx.stateExtra = () => ({
        connected: !!access, devices: devices(), inputId: inPort ? inPort.id : null, outputId: outPort ? outPort.id : null,
        padNotes: padMap(), learnedPads: learned(), padLearn, learning: mapLearn ? mapLearn.stage : null, mappings: mappings[P.get('bank')], profiles: Object.keys(PROFILES).map(k => ({ value: k, label: PROFILES[k].label })),
        padTargets: [{ value: 'auto', label: 'Auto (Drum Machine / Drum Forge)' }].concat(K.registry.list().filter(r => (r.descriptor.provides || []).includes('capability.note_in')).map(r => ({ value: r.instance_id, label: (r.descriptor.icon || '') + ' ' + r.descriptor.label + ' ' + r.instance_id.split('-').slice(-2).join('') }))),
        padTargetNow: padTarget(),
        roles: roles.slice(), roleLabels: roles.map((r, i) => roleLabel(r, i)), actions: Object.keys(ACTIONS).map(k => ({ value: k, label: ACTIONS[k] })),
        keysTargets: [{ value: 'auto', label: 'Auto (newest synth)' }].concat(noteInstruments().filter(r => !DRUM_TOOLS.includes(r.descriptor.id)).map(r => ({ value: r.instance_id, label: (r.descriptor.icon || '') + ' ' + r.descriptor.label + ' ' + r.instance_id.split('-').slice(-2).join('') }))),
        keysTargetNow: keysTarget(),
      });
      ctx.on('kernel:organism-mounted', null, sync); ctx.on('kernel:organism-unmounted', null, sync);
      ctx.saveExtra = () => ({ padNotes, mappings, roles });
      ctx.loadExtra = (x) => { if (!x) return; if (Array.isArray(x.padNotes)) padNotes = x.padNotes; if (Array.isArray(x.mappings)) mappings = x.mappings; if (Array.isArray(x.roles) && x.roles.length === 16) roles = x.roles; sync(); };
      // remember the learned controller: saved as the user preset "my controller" (SDK preset store, not a side channel);
      // a fresh MIDI Map with nothing learned picks it up. Workspace saves/autosave carry padNotes + mappings too.
      const MINE = 'my controller';
      function remember() { ctx.presets.save(MINE, { extra: true }); }
      // recall the remembered controller only onto a blank mapper: the IDB read is async and may resolve after a
      // workspace restore or after the user already mapped something — it must never overwrite that (P10 audit:
      // this race clobbered fresh mappings with stale ones pointing at unmounted organisms)
      const blank = () => !padNotes.some(Boolean) && mappings.every(b => !b.length) && !mapLearn && roles.every(r => !r);
      OrganismSDK.IDB.get('presets', ctx.descriptor.id).then(all => { if (!ctx.disposed && all && all[MINE] && blank()) ctx.presets.load('user:' + MINE); });
      // auto-connect only when this page already holds MIDI permission; otherwise wait for the Connect button (a user
      // gesture) — an unprompted request is refused or ignored by current browsers and just produced a confusing error
      ctx.autoConnect = async function () {
        const env = midiEnv();
        if (access || !env.api) { if (!env.api || (env.firefox && env.file)) ctx.emitUI('status', explainMidi(null, env)); return false; }
        if (env.firefox && env.file) { ctx.emitUI('status', explainMidi(null, env)); return false; }
        let state = 'prompt';
        try { const q = navigator.permissions && await navigator.permissions.query({ name: 'midi', sysex: false }); if (q) state = q.state; } catch (e) { state = 'unknown'; }
        if (state === 'granted' || (typeof window !== 'undefined' && window.ERAVOS_DESKTOP)) return connect();
        if (state === 'denied') { ctx.emitUI('status', explainMidi({ name: 'NotAllowedError' }, env)); return false; }
        return false;
      };
      if (typeof navigator !== 'undefined') ctx.timeout(() => { if (!access && !ctx.disposed) ctx.autoConnect(); }, 0);
      return { unmount() { if (inPort) inPort.onmidimessage = null; } };
    },
  });
})();
