/* ERAVOS music data — part-exchange.js → window.PartExchange (2026-11-20). Data beside the tools, never in their engines (axiom 1).
 * His words (2026-11-20): "Give Eravos the tools to swap tools components when they are blown up on the canvas. Like give me the ability to
 * mutate or synthesize tools together."
 * What each tool's PARTS are, in shared-component terms, so the Field board (tools/core/field/board.js, domain-free) can move a part from one
 * exploded tool into another: each slot says where it sits on the tool's board (near: a control's key, or title: its card), what is in it now
 * (read → a part: { kind, component, label, s: settings in one common form }), what it takes (kinds) and how a part becomes this tool's
 * settings (take → a patch of its settings: the tool's own engine then builds that component — nothing copied). A tool is read through its
 * saved settings (what a project keeps), never its internals.
 *   kinds: filter (filter-svf / filter-ladder) · drive (saturator-tube / saturator-tape / bitcrusher) · noise (osc-noise) · fx (delay-line,
 *          ensemble-core, …) · wobble (lfo into the filter)
 *   PartExchange.slots(toolId, params, bpm) → [{ id, label, find, kinds, part, own, clearable }] · PartExchange.take(toolId, slotId, part, params, bpm) → patch | null
 *   PartExchange.clear(toolId, slotId) → patch (delete: back to the tool's own part, or empty) */
(function (root) {
  'use strict';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, +x || 0));
  const BEATS = { '1/1': 4, '1/2': 2, '1/4.': 1.5, '1/4': 1, '1/8.': 0.75, '1/4t': 2 / 3, '1/8': 0.5, '1/16.': 0.375, '1/8t': 1 / 3, '1/16': 0.25, '1/16t': 1 / 6, '1/32': 0.125, '1/64': 0.0625 };
  const hzOfDiv = (d, bpm) => 1 / ((BEATS[d] || 0.5) * 60 / (bpm || 120));
  const divOfHz = (hz, bpm, list) => { let best = list[0], e = 1e9; list.forEach(d => { const x = Math.abs(Math.log(hzOfDiv(d, bpm) / Math.max(0.01, hz))); if (x < e) { e = x; best = d; } }); return best; };
  const kHz = (x) => x >= 1000 ? (x / 1000).toFixed(1) + 'k' : Math.round(x) + '';
  const LADDER = ['lowpass 24', 'lowpass 12', 'bandpass 12', 'highpass 12', 'highpass 24'], LAD_WB = ['lp24', 'lp12', 'bp12', 'hp12', 'hp24'];
  const NAME = { 'filter-svf': 'SVF', 'filter-ladder': 'ladder', 'saturator-tube': 'tube', 'saturator-tape': 'tape', bitcrusher: 'crusher', 'osc-noise': 'noise', 'delay-line': 'echo', 'ensemble-core': 'chorus', lfo: 'wobble' };
  const label = (p) => {   // a part said in a few words: "ladder 1.4k · reso .40"
    const s = p.s || {};
    if (p.kind === 'filter') return NAME[p.component] + ' ' + kHz(s.cutoff) + ' · reso ' + (+s.reso).toFixed(2) + (p.component === 'filter-ladder' && s.drive ? ' · +' + s.drive + ' dB' : '');
    if (p.kind === 'drive') return NAME[p.component] + (p.component === 'bitcrusher' ? ' ' + s.bits + ' bits' : ' +' + (+s.drive).toFixed(1) + ' dB');
    if (p.kind === 'noise') return s.colour + ' noise';
    if (p.kind === 'fx') return p.component === 'ensemble-core' ? s.mode + ' chorus' : p.component === 'delay-line' ? 'echo ' + s.time : NAME[p.component] || p.component;
    if (p.kind === 'wobble') return 'wobble ' + (s.div || (+s.hz).toFixed(2) + ' Hz') + ' · ' + s.shape + ' · ' + (+s.depth).toFixed(1) + ' oct';
    return p.component;
  };
  const part = (kind, component, s, from) => { const p = { kind, component, s, from }; p.label = label(p); return p; };

  const PROFILES = {
    'eravos.wobble-bass': {
      slots: [
        { id: 'filter', label: 'the mouth', find: { near: ['filterMode', 'cutoff'] }, kinds: ['filter'], clear: () => ({ partFilter: 'own' }), own: (P) => !P.partFilter || P.partFilter === 'own', isClear: (P) => !P.partFilter || P.partFilter === 'own',
          read: (P) => P.partFilter === 'filter-ladder' ? part('filter', 'filter-ladder', { cutoff: P.cutoff, reso: clamp((P.res - 0.5) / 20, 0, 0.97), mode: LADDER[Math.max(0, LAD_WB.indexOf(P.pfLadMode))], drive: P.pfLadDrive, bass: P.pfBass })
            : part('filter', 'filter-svf', { cutoff: P.cutoff, reso: clamp((P.res - 0.5) / 20, 0, 0.97), mode: P.partFilter === 'filter-svf' ? P.pfSvfMode : (['bandpass', 'notch', 'highpass'].includes(P.filterMode) ? P.filterMode : 'lowpass'), stages: P.partFilter === 'filter-svf' ? P.pfStages : P.slope === '12' ? 1 : P.slope === '36' ? 3 : 2 }),
          take: (p) => Object.assign({ partFilter: p.component, cutoff: clamp(p.s.cutoff, 40, 8000), res: +(0.5 + clamp(p.s.reso, 0, 0.97) * 20).toFixed(1) },
            p.component === 'filter-ladder' ? { pfLadMode: LAD_WB[Math.max(0, LADDER.indexOf(p.s.mode))], pfLadDrive: clamp(p.s.drive, 0, 24), pfBass: clamp(p.s.bass === undefined ? 0.5 : p.s.bass, 0, 1) }
              : { pfSvfMode: p.s.mode || 'lowpass', pfStages: clamp(p.s.stages || 2, 1, 3) }) },
        { id: 'drive', label: 'the grit', find: { near: ['drive', 'gritMode'] }, kinds: ['drive'], clear: () => ({ partDrive: 'own' }), own: (P) => !P.partDrive || P.partDrive === 'own', isClear: (P) => !P.partDrive || P.partDrive === 'own',
          read: (P) => P.partDrive && P.partDrive !== 'own' ? part('drive', P.partDrive, { drive: P.pdDrive, bias: P.pdBias, tone: P.pdTone, bump: P.pdBump, bits: P.pdBits, rate: P.pdRate })
            : part('drive', 'saturator-tube', { drive: +(P.drive * 20).toFixed(1), bias: 0.3, tone: 0 }),   // its own pre-drive, as the nearest shared part
          take: (p) => ({ partDrive: p.component, pdDrive: clamp(p.s.drive, 0, 24), pdBias: clamp(p.s.bias === undefined ? 0.3 : p.s.bias, 0, 1), pdTone: clamp(p.s.tone, -1, 1), pdBump: clamp(p.s.bump === undefined ? 2 : p.s.bump, 0, 6),
            pdBits: clamp(p.s.bits || 8, 2, 24), pdRate: clamp(p.s.rate || 12000, 600, 48000), pdMix: 1 }) },
        { id: 'noise', label: 'the noise', find: { near: ['noise'] }, kinds: ['noise'], clear: () => ({ partNoise: 'own', noise: 0 }), own: (P) => P.partNoise !== 'osc-noise', isClear: (P) => P.partNoise !== 'osc-noise' && !(P.noise > 0),
          read: (P) => part('noise', 'osc-noise', { colour: P.partNoise === 'osc-noise' ? ({ band: 'band-limited' })[P.pnColour] || P.pnColour : 'white', tilt: P.partNoise === 'osc-noise' ? P.pnTilt : 0, amount: P.noise }),
          take: (p) => ({ partNoise: 'osc-noise', pnColour: ({ 'band-limited': 'band' })[p.s.colour] || p.s.colour || 'pink', pnTilt: clamp(p.s.tilt, -1, 1), noise: p.s.amount > 0 ? clamp(p.s.amount, 0, 1) : undefined }) },
        { id: 'insert', label: 'after the amp', find: { near: ['squash'] }, kinds: ['fx', 'drive'], clear: () => ({ partInsert: 'none' }), isClear: (P) => !P.partInsert || P.partInsert === 'none',
          read: (P) => P.partInsert === 'ensemble-core' ? part('fx', 'ensemble-core', { mode: P.peMode, mix: P.peMix }) : P.partInsert === 'delay-line' ? part('fx', 'delay-line', { time: P.piTime, feedback: P.piFeedback, mix: P.piMix })
            : P.partInsert && P.partInsert !== 'none' ? part('fx', P.partInsert, { drive: P.pdDrive, bits: P.pdBits, rate: P.pdRate }) : null,
          take: (p) => p.component === 'ensemble-core' ? { partInsert: 'ensemble-core', peMode: p.s.mode || 'juno I', peMix: clamp(p.s.mix === undefined ? 0.5 : p.s.mix, 0, 1) }
            : p.component === 'delay-line' ? { partInsert: 'delay-line', piTime: ['1/16', '1/8', '1/8.', '1/4', '1/4.', '1/2'].includes(p.s.time) ? p.s.time : '1/8.', piFeedback: clamp(p.s.feedback, 0, 0.9), piMix: clamp(p.s.mix, 0, 0.8) }
            : ['saturator-tube', 'saturator-tape', 'bitcrusher', 'filter-svf'].includes(p.component) ? { partInsert: p.component, pdDrive: clamp(p.s.drive || 6, 0, 24), pdBits: clamp(p.s.bits || 8, 2, 24), pdRate: clamp(p.s.rate || 12000, 600, 48000) } : null },
        { id: 'wobble', label: 'the wobble', find: { near: ['depth', 'rateBend'] }, kinds: ['wobble'], own: () => true,
          read: (P, bpm) => part('wobble', 'lfo', { div: P.lfoSync === false ? null : P.div, hz: P.lfoSync === false ? P.lfoHz : hzOfDiv(P.div, bpm), shape: ({ sine: 'sine', sawdown: 'saw down', square: 'square', yoy: 'triangle', draw: 'smooth random' })[P.lfoShape] || 'sine', depth: P.depth }),
          take: (p, P, bpm) => ({ div: p.s.div && BEATS[p.s.div] ? p.s.div : divOfHz(p.s.hz, bpm, ['1/1', '1/2', '1/4.', '1/4', '1/8.', '1/4t', '1/8', '1/16.', '1/8t', '1/16', '1/16t', '1/32', '1/64']), lfoSync: true,
            lfoShape: ({ sine: 'sine', 'saw down': 'sawdown', 'saw up': 'sawdown', square: 'square', triangle: 'yoy', 'sample & hold': 'square', 'smooth random': 'yoy' })[p.s.shape] || 'sine', depth: clamp(p.s.depth, 0, 8) }) },
      ],
    },
    'eravos.retro-dco': {
      slots: [
        { id: 'filter', label: 'the VCF', find: { title: '^VCF' }, kinds: ['filter'],
          read: (P) => part('filter', P.filter === 'ladder' ? 'filter-ladder' : 'filter-svf', P.filter === 'ladder' ? { cutoff: P.cutoff, reso: P.res, mode: 'lowpass 24', drive: P.drive, bass: 0.5 } : { cutoff: P.cutoff, reso: P.res, mode: 'lowpass', stages: 2 }),
          take: (p) => Object.assign({ filter: p.component === 'filter-ladder' ? 'ladder' : 'svf 24', cutoff: clamp(p.s.cutoff, 60, 16000), res: clamp(p.s.reso, 0, 1) }, p.component === 'filter-ladder' ? { drive: clamp(p.s.drive, 0, 24) } : {}) },
        { id: 'chorus', label: 'the chorus', find: { title: '^CHORUS' }, kinds: ['fx'], clear: () => ({ chorus: 'off' }), isClear: (P) => !P.chorus || P.chorus === 'off',
          read: (P) => P.chorus && P.chorus !== 'off' ? part('fx', 'ensemble-core', { mode: 'juno ' + P.chorus, mix: P.chorusMix }) : null,
          take: (p) => p.component === 'ensemble-core' ? { chorus: ({ 'juno I': 'I', 'juno II': 'II' })[p.s.mode] || 'I+II', chorusMix: clamp(p.s.mix === undefined ? 0.5 : p.s.mix, 0, 1) } : null },
        { id: 'noise', label: 'the noise', find: { title: 'NOISE' }, kinds: ['noise'], clear: () => ({ noise: 0 }), isClear: (P) => !(P.noise > 0),
          read: (P) => part('noise', 'osc-noise', { colour: P.noiseColour || 'white', amount: P.noise, tilt: 0 }),
          take: (p) => ({ noiseColour: ['white', 'pink', 'brown'].includes(p.s.colour) ? p.s.colour : p.s.colour === 'band-limited' ? 'brown' : 'white', noise: p.s.amount > 0 ? clamp(p.s.amount, 0, 1) : undefined }) },
        { id: 'wobble', label: 'the LFO', find: { title: '^LFO' }, kinds: ['wobble'], clear: () => ({ lfoCutoff: 0 }), isClear: (P) => !(P.lfoCutoff > 0),
          read: (P, bpm) => part('wobble', 'lfo', { div: null, hz: P.lfoRate, shape: ({ sine: 'sine', triangle: 'triangle', square: 'square', saw: 'saw up', random: 'sample & hold' })[P.lfoShape] || 'triangle', depth: (P.lfoCutoff || 0) / 1200 }),
          take: (p, P, bpm) => ({ lfoRate: clamp(p.s.div ? hzOfDiv(p.s.div, bpm) : p.s.hz, 0.05, 30), lfoShape: ({ sine: 'sine', triangle: 'triangle', square: 'square', 'saw up': 'saw', 'saw down': 'saw', 'sample & hold': 'random', 'smooth random': 'random' })[p.s.shape] || 'triangle',
            lfoCutoff: Math.round(clamp(p.s.depth * 1200, 0, 2400)), lfoDelay: 0 }) },
      ],
    },
  };
  const tempo = (bpm) => bpm || (root.Kernel && root.Kernel.music && root.Kernel.music.bpm) || 120;   // the canvas's tempo when the caller does not say
  // a tool SYNTHESIZED on the canvas (tools/music/core/assembled-tool.js: ids eravos.wb-*): its settings are the assembled engine's
  const ADIVS = ['1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  const MADE = { slots: [
    { id: 'filter', label: 'the mouth', find: { near: ['cutoff', 'mouth'] }, kinds: ['filter'],
      read: (P) => part('filter', P.mouth, P.mouth === 'filter-ladder' ? { cutoff: P.cutoff, reso: P.reso, mode: P.mLadMode, drive: P.mLadDrive, bass: P.mLadBass } : { cutoff: P.cutoff, reso: P.reso, mode: P.mSvfMode, stages: P.mSvfStages }),
      take: (p) => Object.assign({ mouth: p.component, cutoff: clamp(p.s.cutoff, 40, 3000), reso: clamp(p.s.reso, 0, 0.95) }, p.component === 'filter-ladder' ? { mLadMode: LADDER.includes(p.s.mode) ? p.s.mode : 'lowpass 24', mLadDrive: clamp(p.s.drive, 0, 18), mLadBass: clamp(p.s.bass === undefined ? 0.5 : p.s.bass, 0, 1) }
        : { mSvfMode: ['lowpass', 'bandpass', 'notch', 'peak'].includes(p.s.mode) ? p.s.mode : 'lowpass', mSvfStages: clamp(p.s.stages || 2, 1, 3) }) },
    { id: 'drive', label: 'the drive', find: { near: ['drive'] }, kinds: ['drive'], clear: () => ({ drive: 'none' }), isClear: (P) => P.drive === 'none',
      read: (P) => P.drive === 'none' ? null : part('drive', P.drive, P.drive === 'bitcrusher' ? { bits: P.dCrushBits, rate: P.dCrushRate } : P.drive === 'saturator-tape' ? { drive: P.dTapeDrive, bump: P.dTapeBump } : { drive: P.dTubeDrive, bias: P.dTubeBias, tone: P.dTubeTone }),
      take: (p) => p.component === 'bitcrusher' ? { drive: 'bitcrusher', dCrushBits: clamp(p.s.bits || 8, 3, 16), dCrushRate: clamp(p.s.rate || 12000, 2000, 40000) }
        : p.component === 'saturator-tape' ? { drive: 'saturator-tape', dTapeDrive: clamp(p.s.drive, 0, 20), dTapeBump: clamp(p.s.bump === undefined ? 2 : p.s.bump, 0, 6) }
        : { drive: 'saturator-tube', dTubeDrive: clamp(p.s.drive, 0, 20), dTubeBias: clamp(p.s.bias === undefined ? 0.3 : p.s.bias, 0, 1), dTubeTone: clamp(p.s.tone, -1, 1) } },
    { id: 'noise', label: 'the noise', find: { near: ['noise'] }, kinds: ['noise'], clear: () => ({ noise: 0 }), isClear: (P) => !(P.noise > 0),
      read: (P) => part('noise', 'osc-noise', { colour: P.noiseColour, amount: P.noise }),
      take: (p) => ({ noiseColour: p.s.colour || 'white', noise: p.s.amount > 0 ? clamp(p.s.amount, 0, 1) : 0.3 }) },
    { id: 'fx', label: 'after the mouth', find: { near: ['fx'] }, kinds: ['fx'], clear: () => ({ fx: 'none' }), isClear: (P) => P.fx === 'none',
      read: (P) => P.fx === 'ensemble-core' ? part('fx', 'ensemble-core', { mode: P.fEnsMode, mix: P.fEnsMix }) : P.fx === 'delay-line' ? part('fx', 'delay-line', { time: P.fDelTime, feedback: P.fDelFb, mix: P.fDelMix }) : P.fx === 'none' ? null : part('fx', P.fx, {}),
      take: (p) => p.component === 'ensemble-core' ? { fx: 'ensemble-core', fEnsMode: p.s.mode || 'juno I', fEnsMix: clamp(p.s.mix === undefined ? 0.5 : p.s.mix, 0, 1) }
        : p.component === 'delay-line' ? { fx: 'delay-line', fDelTime: ['1/16', '1/8', '1/8.', '1/4'].includes(p.s.time) ? p.s.time : '1/8.', fDelFb: clamp(p.s.feedback, 0, 0.8), fDelMix: clamp(p.s.mix, 0, 0.5) }
        : ['saturator-tape', 'bitcrusher'].includes(p.component) ? { fx: p.component } : null },
    { id: 'wobble', label: 'the wobble', find: { near: ['depth', 'rate'] }, kinds: ['wobble'], clear: () => ({ depth: 0 }), isClear: (P) => !(P.depth > 0),
      read: (P, bpm) => part('wobble', 'lfo', { div: P.rate, hz: hzOfDiv(P.rate, bpm), shape: P.lfoShape, depth: P.depth }),
      take: (p, P, bpm) => ({ rate: p.s.div && ADIVS.includes(p.s.div) ? p.s.div : divOfHz(p.s.div ? hzOfDiv(p.s.div, bpm) : p.s.hz, bpm, ADIVS), lfoShape: p.s.shape || 'sine', depth: clamp(p.s.depth, 0, 5) }) },
  ] };
  const profileOf = (id) => PROFILES[id] || (/^eravos\.wb-/.test(String(id)) ? MADE : null);
  const defaultsOf = (id) => { const d = root.OrganismFactory && root.OrganismFactory.def(id), o = {}; ((d && d.config) || []).forEach(c => { o[c.key] = c.default; }); return o; };
  function slots(toolId, params, bpm) {
    const pr = profileOf(toolId); if (!pr) return [];
    const P = Object.assign(defaultsOf(toolId), params || {});
    return pr.slots.map(sl => { let p = null; try { p = sl.read(P, tempo(bpm)); } catch (e) {} if (p) p.from = toolId; let own = false, isClear = true; try { own = sl.own ? !!sl.own(P) : false; isClear = sl.isClear ? !!sl.isClear(P) : true; } catch (e) {} return { id: sl.id, label: sl.label, find: sl.find, kinds: sl.kinds, part: p, own, clearable: !!sl.clear && !isClear }; });
  }
  function take(toolId, slotId, p, params, bpm) {
    const sl = profileOf(toolId) && profileOf(toolId).slots.find(x => x.id === slotId); if (!sl || !p || !sl.kinds.includes(p.kind)) return null;
    let patch = null; try { patch = sl.take(p, Object.assign(defaultsOf(toolId), params || {}), tempo(bpm)); } catch (e) { patch = null; }
    if (patch) Object.keys(patch).forEach(k => { if (patch[k] === undefined || (typeof patch[k] === 'number' && !isFinite(patch[k]))) delete patch[k]; });
    return patch && Object.keys(patch).length ? patch : null;
  }
  function clear(toolId, slotId) { const sl = profileOf(toolId) && profileOf(toolId).slots.find(x => x.id === slotId); return sl && sl.clear ? sl.clear() : null; }   // delete: back to its own part, or empty
  const api = { has: (id) => !!profileOf(id), slots, take, clear, label, kinds: ['filter', 'drive', 'noise', 'fx', 'wobble'] };
  root.PartExchange = api;
  if (root.FieldBoard && root.FieldBoard.setExchange) root.FieldBoard.setExchange(api);
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
