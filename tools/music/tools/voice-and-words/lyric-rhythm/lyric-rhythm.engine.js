/* eravos.lyric-rhythm 1.0.0 — Lyrics → Rhythm · spec lyric-rhythm.spec · template eravos.tool/1
 * Words become rhythm. Lyrics are split into syllables (English heuristics + a lexicon), each syllable gets a stress
 * (weak · strong · accent), and a FLOW places them on the bar grid — spoken, on-beat chant, syncopated, rap triplets,
 * dancehall, ballad. Positions are in 16ths and may be fractional (triplets), so playback is sample-accurate: on each
 * transport tick the syllables that fall inside that 16th are sent with their exact time.
 * DRUMS mode: stressed → kick / snare (alternating by beat), accent adds a clap, weak → hat, phrase ends → perc.
 * MELODY mode: a contour in the song key — stress climbs, questions rise, line ends come home to the root.
 * Out: notes to the wired instrument (or the chosen / first suitable one) · a note clip to the Timeline. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MT = () => window.MusicTheory;
  // ---------------------------------------------------------------- syllables
  const LEX = { // word → syllables split by '-' and stressed syllable(s) in CAPS (lexicon wins over the rules)
    fire: 'FIRE', hour: 'HOUR', our: 'our', flower: 'FLOW-er', power: 'POW-er', every: 'EV-ery', everything: 'EV-ery-thing', everyone: 'EV-ery-one',
    beautiful: 'BEAU-ti-ful', people: 'PEO-ple', little: 'LIT-tle', heaven: 'HEAV-en', forever: 'for-EV-er', baby: 'BA-by', believe: 'be-LIEVE',
    remember: 're-MEM-ber', together: 'to-GETH-er', tonight: 'to-NIGHT', today: 'to-DAY', tomorrow: 'to-MOR-row', alone: 'a-LONE', always: 'AL-ways',
    inside: 'in-SIDE', outside: 'out-SIDE', maybe: 'MAY-be', really: 'REAL-ly', being: 'BE-ing', because: 'be-CAUSE', again: 'a-GAIN', away: 'a-WAY',
    around: 'a-ROUND', above: 'a-BOVE', alive: 'a-LIVE', awake: 'a-WAKE', apart: 'a-PART', without: 'with-OUT', within: 'with-IN', into: 'IN-to',
    only: 'ON-ly', over: 'O-ver', under: 'UN-der', never: 'NEV-er', ever: 'EV-er', even: 'E-ven', open: 'O-pen', broken: 'BRO-ken', heart: 'HEART',
    quiet: 'QUI-et', poem: 'PO-em', real: 'REAL', idea: 'i-DE-a', family: 'FAM-i-ly', different: 'DIF-ferent', diamond: 'DIA-mond', violent: 'VIO-lent',
    lady: 'LA-dy', body: 'BOD-y', nobody: 'NO-bod-y', somebody: 'SOME-bod-y', anybody: 'AN-y-bod-y', money: 'MON-ey', honey: 'HON-ey', crazy: 'CRA-zy',
    darling: 'DAR-ling', lover: 'LOV-er', loving: 'LOV-ing', loved: 'LOVED', lonely: 'LONE-ly', shadow: 'SHAD-ow', window: 'WIN-dow',
    yellow: 'YEL-low', follow: 'FOL-low', sorrow: 'SOR-row', morning: 'MORN-ing', evening: 'EVE-ning', music: 'MU-sic', magic: 'MAG-ic', river: 'RIV-er',
    water: 'WA-ter', mother: 'MOTH-er', father: 'FA-ther', brother: 'BROTH-er', sister: 'SIS-ter', woman: 'WOM-an', women: 'WOM-en', golden: 'GOLD-en',
    whisper: 'WHIS-per', silence: 'SI-lence', moment: 'MO-ment', promise: 'PROM-ise', feeling: 'FEEL-ing', nothing: 'NOTH-ing', something: 'SOME-thing',
    anything: 'AN-y-thing', everybody: 'EV-ery-bod-y', hello: 'hel-LO', okay: 'o-KAY', beneath: 'be-NEATH', between: 'be-TWEEN', before: 'be-FORE',
    behind: 'be-HIND', beyond: 'be-YOND', begin: 'be-GIN', become: 'be-COME', return: 're-TURN', release: 're-LEASE', desire: 'de-SIRE', alright: 'al-RIGHT',
    gonna: 'GON-na', wanna: 'WAN-na', gotta: 'GOT-ta', lemme: 'LEM-me', yeah: 'YEAH', oh: 'OH', ooh: 'OOH', hey: 'HEY', la: 'LA', na: 'NA',
    shake: 'SHAKE', head: 'HEAD', give: 'GIVE', your: 'your', you: 'you', the: 'the', a: 'a',
    // 3.34.1: words the rules split wrongly (silent e inside a compound, odd stress)
    universe: 'U-ni-verse', universal: 'u-ni-VER-sal', emerge: 'e-MERGE', emerged: 'e-MERGED', restored: 're-STORED', imperfect: 'im-PER-fect',
    somehow: 'SOME-how', someone: 'SOME-one', somewhere: 'SOME-where', sometimes: 'SOME-times', someday: 'SOME-day',
    anyhow: 'AN-y-how', anyone: 'AN-y-one', anywhere: 'AN-y-where', everywhere: 'EV-ery-where', nowhere: 'NO-where',
  };
  const WEAK = new Set(('a an the of to in on at for and but or nor so as is am are was were be been it its i you he she we they me him her us them my your his our their '
    + "this that these those with from by if not no do does did can could will would shall should may might must just like than then there here what when who whom how "
    + "all up out off oh yeah im i'm you're we're they're it's that's don't can't won't i'll you'll i've you've i'd you'd").split(' '));
  const PREFIX = /^(re|be|de|a|un|to|for|in|en|ex|con|com|pre|pro)/;
  const SUFFIXES = [['less', 3], ['ness', 3], ['ment', 4], ['ful', 3], ['ly', 4]]; // [suffix, shortest base that may carry it]
  function syllables(word) {
    const raw = word.toLowerCase().replace(/[’`]/g, "'"), w = raw.replace(/[^a-z']/g, ''); if (!w) return [];
    if (LEX[w]) return LEX[w].split('-').map(s => ({ text: s.toLowerCase(), stress: s === s.toUpperCase() && /[A-Z]/.test(s) ? 1 : 0 }));
    const core = w.replace(/'/g, '');
    if (/^\d+$/.test(core)) return [{ text: core, stress: 1 }];
    // 3.34.1: a plain suffix is its own weak syllable and the base is read on its own — this is what makes the silent e in
    // "complete-ly" / "love-ly" / "state-ment" silent (the vowel-group rules alone counted it) and gives per-fect-ly / count-less-ly
    for (const [suf, min] of SUFFIXES) {
      if (core.length - suf.length >= min && core.endsWith(suf)) {
        const base = syllables(core.slice(0, -suf.length));
        if (base.length) { if (!base.some(b => b.stress)) base[0].stress = 1; return base.concat([{ text: suf, stress: 0 }]); }
      }
    }
    // split on vowel groups (y counts as a vowel after a consonant); silent final e; -le; -ed/-es that don't add a syllable
    let s = core, tail = '';
    if (/[^aeiouy]le$/.test(s) && s.length > 3) { tail = s.slice(-3); s = s.slice(0, -3); }
    else if (/[^aeiouyl]e$/.test(s) && s.length > 3) { /* silent e stays attached */ }
    const groups = []; let i = 0;
    const isV = (k) => /[aeiou]/.test(s[k]) || (s[k] === 'y' && k > 0 && !/[aeiou]/.test(s[k - 1]));
    // hiatus: a vowel group that is really two syllables — y + vowel (cry-ing), i + a/o not after t/s/c (li-on, pi-ano), e + o (vid-eo), u + a/o (du-al)
    const hiatus = (a, b, prev) => (a === 'y' && /[aeiou]/.test(b)) || (a === 'i' && /[ao]/.test(b) && !/[tsc]/.test(prev || '')) || (a === 'e' && b === 'o') || (a === 'u' && /[ao]/.test(b) && prev !== 'q' && prev !== 'g');
    while (i < s.length) { let j = i; while (j < s.length && !isV(j)) j++; let k = j; while (k < s.length && isV(k)) { if (k > j && hiatus(s[k - 1], s[k], s[k - 2])) break; k++; } if (k === j && j < s.length) k = j + 1; groups.push([i, j, k]); i = k; }
    // a trailing silent e / -ed / -es is not its own syllable
    let parts = groups.filter(g => g[2] > g[1]);
    const last = parts[parts.length - 1];
    if (parts.length > 1 && last && s.slice(last[1]) === 'e') parts.pop();
    if (parts.length > 1 && /[^td]ed$/.test(s) && s.slice(last[1], last[2]) === 'e') parts.pop();
    if (parts.length > 1 && /[^sxzhg]es$/.test(s) && s.slice(last[1], last[2]) === 'e' && !/(ch|sh|ce|ge|se|ze|xe)s$/.test(s)) parts.pop();
    if (!parts.length) return [{ text: core, stress: 1 }];
    // cut points: V-CV, VC-CV (one consonant goes right, two split)
    const cuts = [0]; for (let p = 1; p < parts.length; p++) { const prevEnd = parts[p - 1][2], vStart = parts[p][1], cons = vStart - prevEnd; cuts.push(cons <= 1 ? prevEnd : prevEnd + Math.floor(cons / 2)); }
    const out = cuts.map((c, p) => ({ text: s.slice(c, p + 1 < cuts.length ? cuts[p + 1] : s.length), stress: 0 }));
    if (tail) out.push({ text: tail, stress: 0 });
    // stress: one syllable → by word class; two+ → first, unless a light prefix; -tion/-sion → before it
    if (out.length === 1) out[0].stress = WEAK.has(w) ? 0 : 1;
    else { let k = PREFIX.test(core) && out.length >= 2 && out[0].text.length <= 3 ? 1 : 0; const t = out.findIndex(x => /^(tion|sion|cian)/.test(x.text)); if (t > 0) k = t - 1; else if (/ity$/.test(core) && out.length >= 3 && out[out.length - 1].text === 'ty') k = out.length - 3; out[k].stress = 1; }
    return out;
  }
  function analyse(text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean), out = [];
    lines.forEach((line, li) => {
      const words = line.match(/[A-Za-z0-9'’]+|[!?]/g) || [];
      const question = /\?\s*$/.test(line); let wi = 0;
      words.forEach((wd, k) => {
        if (wd === '!' || wd === '?') { const prev = out[out.length - 1]; if (prev && wd === '!') prev.stress = 2; return; }
        const caps = wd.length > 1 && wd === wd.toUpperCase() && /[A-Z]/.test(wd);
        syllables(wd).forEach((sy, si, all) => out.push({ text: sy.text, word: wd, line: li, wi, si, stress: caps && sy.stress ? 2 : sy.stress, last: false, question, wordEnd: si === all.length - 1 }));
        wi++;
      });
      if (out.length) out[out.length - 1].last = true;
    });
    return out;
  }
  // ---------------------------------------------------------------- flows: syllables → positions in 16ths (fractional allowed)
  const FLOWS = ['spoken', 'on-beat chant', 'syncopated', 'rap triplets', 'dancehall', 'ballad'];
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function place(sylls, flow, seed) {
    const r = rng(seed || 1), out = []; let pos = 0;
    const nextBeat = (p, q) => Math.ceil(p / q - 1e-9) * q;
    sylls.forEach((s, i) => {
      let len;
      switch (flow) {
        case 'on-beat chant': if (s.stress && pos % 4) pos = nextBeat(pos, 4); len = 2; break;
        case 'syncopated': if (s.stress) { if (pos % 4 === 0) pos += 1; len = 2; } else len = 1; break;
        case 'rap triplets': { const tq = 16 / 12; if (s.stress && Math.abs(pos / 4 - Math.round(pos / 4)) > 1e-6 && r() < 0.6) pos = nextBeat(pos, 4); len = tq; break; }
        case 'dancehall': { const inGroup = pos % 8, hot = [0, 3, 6]; if (s.stress && !hot.includes(Math.round(inGroup))) { const nx = hot.map(h => Math.floor(pos / 8) * 8 + h).concat([Math.floor(pos / 8) * 8 + 8]).find(h => h >= pos); pos = nx; } len = 1; break; }
        case 'ballad': if (s.stress && pos % 4) pos = nextBeat(pos, 4); len = s.stress ? 4 : 2; break;
        default: if (s.stress && pos % 2) pos += 1; len = s.stress ? 2 : 1; // spoken
      }
      if (seed && !s.stress && r() < 0.25 && flow !== 'rap triplets') pos += 1; // vary: a breath here and there
      out.push(Object.assign({}, s, { s: pos, l: len }));
      pos += len;
      if (s.last) pos = flow === 'ballad' ? nextBeat(pos + 0.01, 16) : nextBeat(pos + 0.01, 8); // phrase end → rest to the next half bar (ballad: next bar)
    });
    return { notes: out, steps: Math.max(16, nextBeat(pos, 16)) };
  }
  ctxHelpers();
  function ctxHelpers() { window.LyricRhythm = { syllables, analyse, place, FLOWS }; }

  OrganismFactory.define({
    id: 'eravos.lyric-rhythm', domain: 'music', version: '1.0.0', label: 'Lyrics → Rhythm', icon: '✎', accent: '#ff7eb6',
    category: 'Voice & samples', blurb: 'Type the words — they become a rhythm (drums) or a melody line in key, on the beat. Send it to the Timeline.',
    size: { w: 620, h: 600 }, minSize: { w: 440, h: 420 },
    permissions: ['bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.note_out', 'capability.words'],
    needs: { works_with: ['eravos.pads', 'eravos.supersaw', 'eravos.retro-poly', 'eravos.timeline'] },
    hooks: [S.note_out('lyr.hook.note_out'), S.transport_in('lyr.hook.transport_in'), S.theory_in('lyr.hook.theory_in'),
      Object.assign(S.event('lyr.hook.clip_out', 'out', 'ui:clip_add', { type: 'object', required: ['kind'] }, '1.0.0'), { rail: false, intent: 'the rhythm as a note clip on the Timeline' }),
      Object.assign(S.event('lyr.hook.seq_out', 'out', 'seq:pattern_suggest|ui:chain_edit|ui:slot_select|ui:config_change', { type: 'object' }, '1.0.0'), { rail: false, intent: '3.36: the rhythm as Sequencer patterns (4 bars per slot, chained)' })],
    config: [
      { key: 'text', type: 'string', default: 'Give your head a shake\nYou know you light the dark\nEvery night I call your name\nFire in my heart', label: 'Lyrics', group: 'WORDS', hidden: true },
      { key: 'flow', type: 'enum', options: FLOWS, default: 'spoken', label: 'Flow', group: 'RHYTHM' },
      { key: 'mode', type: 'enum', options: ['drums', 'melody'], default: 'drums', label: 'Plays as', group: 'RHYTHM' },
      { key: 'bars', type: 'integer', default: 0, min: 0, max: 32, label: 'Bars (0 = fit)', group: 'RHYTHM' },
      { key: 'vary', type: 'integer', default: 0, min: 0, max: 999, label: 'Vary', group: 'RHYTHM', hint: '0 = exact · any other number = a different but repeatable feel' },
      { key: 'octave', type: 'integer', default: 4, min: 1, max: 7, label: 'Octave', group: 'MELODY' },
      { key: 'range', type: 'integer', default: 5, min: 2, max: 10, label: 'Range (degrees)', group: 'MELODY' },
      { key: 'gate', type: 'number', default: 0.85, min: 0.2, max: 1, step: 0.01, label: 'Note length', group: 'MELODY' },
      { key: 'target', type: 'string', default: 'auto', label: 'Plays', group: 'OUT', hidden: true },
      { key: 'level', type: 'number', default: 0.9, min: 0, max: 1, step: 0.01, label: 'Velocity', group: 'OUT' },
      { key: 'songGenre', type: 'enum', options: ['darkwave', 'synthwave', 'witch-house', 'house', 'techno', 'future-bass', 'melodic', 'dubstep', 'riddim', 'dnb', 'neuro', 'trap'], default: 'darkwave', label: 'Song style', group: 'SONG', hint: 'the kind of music your rhythm grows into (♫ Make a song)' },
    ],
    ui_hooks: ['syl_edit', 'reset_edits', 'preview', 'send_timeline', 'expand_song', 'send_sequencer'],
    presets: {},
    engine(ctx) {
      const P = ctx.params, K = ctx.K;
      let edits = {}, plan = null;
      const keyOf = (s) => s.line + ':' + s.wi + ':' + s.si;
      function build() {
        const sylls = analyse(P.get('text')).map(s => { const e = edits[keyOf(s)]; return e && typeof e.stress === 'number' ? Object.assign({}, s, { stress: e.stress }) : s; });
        const pl = place(sylls, P.get('flow'), P.get('vary'));
        pl.notes.forEach(n => { const e = edits[keyOf(n)]; if (e && e.nudge) n.s = Math.max(0, n.s + e.nudge); });
        const steps = P.get('bars') ? P.get('bars') * 16 : pl.steps;
        plan = { notes: pl.notes.filter(n => n.s < steps), steps };
        melody(); ctx.syncUI(); return plan;
      }
      function melody() {
        const mt = MT(); if (!mt || !plan) return; const k = ctx.key, range = P.get('range'), r = rng((P.get('vary') || 0) + 7);
        let deg = 1; plan.notes.forEach((n, i) => {
          if (n.stress) deg += r() < 0.65 ? 1 + Math.floor(r() * 2) : -1; else deg += r() < 0.5 ? 0 : (r() < 0.5 ? 1 : -1);
          if (n.last) deg = n.question ? deg + 2 : 1;
          deg = Math.max(1, Math.min(range, deg));
          n.deg = deg; n.mel = mt.degreeToMidi(deg, P.get('octave'), k.root, k.scale);
          n.drum = 36 + (n.last && !n.stress ? 9 : n.stress ? (Math.floor(n.s / 4) % 2 ? 1 : 0) : 3);
        });
      }
      ctx.plan = () => plan || build();
      function target() {
        const w = K.wires.list().find(x => x.src.instanceId === ctx.id && x.src.hookId === 'lyr.hook.note_out'); if (w) return w.dst.instanceId;
        const t = P.get('target'); if (t && t !== 'auto') return K.registry.has(t) ? t : null;
        const pref = P.get('mode') === 'drums' ? ['eravos.pads', 'eravos.drum-forge'] : ['eravos.supersaw', 'eravos.retro-poly', 'eravos.pad-forge', 'eravos.organ', 'eravos.coven', 'eravos.acid-synth'];
        for (const id of pref) { const r = K.registry.byOrganism(id)[0]; if (r) return r.instance_id; }
        return null;
      }
      ctx.target = target;
      function fire(n, time, stepDur, tg) {
        const v = Math.max(0.05, Math.min(1, P.get('level') * (n.stress === 2 ? 1 : n.stress ? 0.85 : 0.55)));
        const drums = P.get('mode') === 'drums';
        ctx.emit('note:trigger', { target: tg, note: drums ? n.drum : n.mel, velocity: v, time, duration: drums ? 0.2 : Math.max(0.05, n.l * stepDur * P.get('gate')) });
        if (drums && n.stress === 2) ctx.emit('note:trigger', { target: tg, note: 38, velocity: v * 0.8, time, duration: 0.2 });
        ctx.atAudioTime(time, () => ctx.emitUI('syl', { i: plan.notes.indexOf(n), velocity: v }));
      }
      // transport: every 16th, send the syllables that start inside it, at their exact time
      ctx.onTick((p) => {
        const pl = plan || build(); if (!pl.notes.length) return; const tg = target(); if (!tg) return;
        const L = pl.steps, a = ((p.step16 % L) + L) % L, sd = p.stepDur || 60 / ctx.bpm / 4;
        pl.notes.forEach(n => { if (n.s >= a && n.s < a + 1) fire(n, p.time + (n.s - a) * sd, sd, tg); });
        ctx.emitUI('pos', { step: a, steps: L });
      });
      ctx.onUI('preview', null, () => { const pl = plan || build(), tg = target(); if (!tg) return ctx.emitUI('status', { warn: 'Nothing to play it — add a Drum Machine or a synth (or wire ⇢ to one).' }); const sd = 60 / ctx.bpm / 4, t0 = ctx.ac.currentTime + 0.08; pl.notes.forEach(n => fire(n, t0 + n.s * sd, sd, tg)); });
      ctx.onUI('syl_edit', { type: 'object', required: ['key'] }, (p) => { const e = edits[p.key] = Object.assign({}, edits[p.key] || {}); if (typeof p.stress === 'number') e.stress = Math.max(0, Math.min(2, p.stress)); if (typeof p.nudge === 'number') e.nudge = Math.max(-16, Math.min(16, (e.nudge || 0) + p.nudge)); build(); });
      ctx.onUI('reset_edits', null, () => { edits = {}; build(); });
      // 3.34.1 ♫ Make a song: the rhythm of the words grows into a whole song (data/rhythm-expand.js builds it from Song Engine's parts).
      // Nothing is cleared: the song is written BELOW everything already on the canvas, so these words stay where they are.
      ctx.onUI('expand_song', null, () => {
        const text = String(P.get('text') || '').trim();
        if (!text) return ctx.emitUI('status', { warn: 'Type or paste some words first.' });
        if (!window.RhythmExpand) return ctx.emitUI('status', { warn: 'The song builder is not loaded.' });
        let bottom = 0; const WM = window.CanvasWM;
        if (WM && WM.rectOf) K.registry.list().forEach(r => { const q = WM.rectOf(r.instance_id); if (q && isFinite(q.y + q.h)) bottom = Math.max(bottom, q.y + q.h); });
        try {
          window.RhythmExpand.write(text, { genre: P.get('songGenre'), flow: P.get('flow'), seed: P.get('vary') || 1, reuse: true, run: { clear: false, origin: { x: 40, y: bottom ? bottom + 80 : 40 } } });
          ctx.emitUI('status', { info: 'Building your song below — press Space to hear it.' });
        } catch (e) { ctx.emitUI('status', { warn: e.message }); }
      });
      ctx.onUI('send_timeline', { type: 'object' }, (p) => {
        const pl = plan || build(), tl = (p && p.timeline) || ((K.registry.byOrganism('eravos.timeline')[0] || {}).instance_id), tg = target();
        if (!tl) return ctx.emitUI('status', { warn: 'No Timeline on the canvas — add one, then Send again.' });
        const drums = P.get('mode') === 'drums', notes = [];
        pl.notes.forEach(n => { const v = Math.round(P.get('level') * (n.stress === 2 ? 1 : n.stress ? 0.85 : 0.55) * 100) / 100; notes.push({ s: n.s, l: drums ? 1 : Math.max(0.25, n.l * P.get('gate')), n: drums ? n.drum : n.mel, v }); if (drums && n.stress === 2) notes.push({ s: n.s, l: 1, n: 38, v: v * 0.8 }); });
        ctx.emit('ui:clip_add:' + tl, { kind: 'notes', target: tg, startBar: (p && p.startBar) || 1, bars: Math.ceil(pl.steps / 16), name: 'words · ' + (pl.notes[0] ? pl.notes.slice(0, 4).map(n => n.text).join('') : ''), notes });
        ctx.emitUI('status', { info: `Sent ${pl.notes.length} syllables to the Timeline (${Math.ceil(pl.steps / 16)} bars).` });
      });
      // 3.36 ⇢ Sequencer: your words' rhythm becomes Sequencer lanes you can keep building on — 4 bars per slot (A, B, C …),
      // chained in order, song mode on. Drums: kick / snare / hat / perc / clap lanes as the words place them; melody: one
      // in-key lane; plus a "her voice" lane that fires on the first syllable of every line (load her clip in a Sample Player).
      // The Sequencer's grid is 16ths: triplet / nudged positions round to the nearest 16th (said in the status line).
      ctx.onUI('send_sequencer', { type: 'object' }, (p) => {
        const pl = plan || build(), seq = (p && p.sequencer) || ((K.registry.byOrganism('eravos.sequencer')[0] || {}).instance_id);
        if (!seq) return ctx.emitUI('status', { warn: 'No Sequencer on the canvas — add one (＋ Add → Drums & rhythm), then send again.' });
        if (!pl.notes.length) return ctx.emitUI('status', { warn: 'Type or paste some words first.' });
        const drums = P.get('mode') === 'drums', SL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], bars = Math.ceil(pl.steps / 16), nSlots = Math.min(8, Math.ceil(bars / 4));
        const voice = (K.registry.byOrganism('eravos.sample-player')[0] || {}).instance_id || null, tg = target();
        const lv = (n) => Math.round(P.get('level') * (n.stress === 2 ? 1 : n.stress ? 0.85 : 0.55) * 100) / 100;
        let rounded = 0; const lanes = {};
        const put = (name, i, step) => { (lanes[name] = lanes[name] || [])[i] = step; };
        pl.notes.forEach(n => {
          const i = Math.round(n.s); if (Math.abs(i - n.s) > 1e-6) rounded++;
          if (drums) {
            const nm = { 36: 'words kick', 37: 'words snare', 39: 'words hat', 45: 'words perc' }[n.drum] || 'words hat'; put(nm, i, { on: true, vel: lv(n), accent: n.stress === 2 });
            if (n.stress === 2) put('words clap', i, { on: true, vel: lv(n) * 0.8 });
          } else put('words melody', i, { on: true, degree: Math.max(1, Math.min(14, n.deg || 1)), vel: lv(n), gate: Math.max(0.25, Math.min(4, n.l * P.get('gate'))), accent: n.stress === 2 });
          if (n.wi === 0 && n.si === 0) put('her voice', i, { on: true, vel: 0.95 });
        });
        const DRUMNOTE = { 'words kick': 36, 'words snare': 37, 'words clap': 38, 'words hat': 39, 'words perc': 45, 'her voice': 36 };
        Object.keys(lanes).forEach(name => {
          for (let k = 0; k < nSlots; k++) {
            const len = Math.min(64, Math.max(16, (Math.min(bars, (k + 1) * 4) - k * 4) * 16)), len2 = [16, 32, 48, 64].find(x => x >= len) || 64;
            const steps = Array.from({ length: len2 }, (_, j) => lanes[name][k * 64 + j] || { on: false });
            const sug = { target: seq, track: name, slot: SL[k], steps, length: len2 };
            if (name === 'her voice') Object.assign(sug, { drumNote: 36, instrument: voice });
            else if (drums) Object.assign(sug, { drumNote: DRUMNOTE[name], instrument: tg });
            else Object.assign(sug, { instrument: tg });
            ctx.emit('seq:pattern_suggest', sug);
          }
        });
        ctx.emit('ui:chain_edit:' + seq, { chain: SL.slice(0, nSlots).map(slot => ({ slot, repeats: 1 })) });
        if (nSlots > 1) ctx.emit('ui:config_change:' + seq, { key: 'chainOn', value: true });
        ctx.emit('ui:slot_select:' + seq, { slot: 'A' });
        ctx.emitUI('status', { info: `Sent ${pl.notes.length} syllables to the Sequencer — ${bars} bars in slot${nSlots > 1 ? 's A–' + SL[nSlots - 1] + ' (song mode on)' : ' A'}${pl.steps > 512 ? ' · first 32 bars only' : ''}${rounded ? ' · ' + rounded + ' off-grid syllables rounded to 16ths' : ''}${voice ? '' : ' · add a Sample Player with her clip for the voice lane'}.` });
      });
      ['text', 'flow', 'bars', 'vary', 'mode', 'octave', 'range'].forEach(k => P.onChange(k, build));
      ctx.onKey && ctx.onKey(() => build());
      ctx.stateExtra = () => { const pl = plan || build(); return { plan: { steps: pl.steps, notes: pl.notes.map(n => ({ text: n.text, word: n.word, s: n.s, l: n.l, stress: n.stress, last: n.last, line: n.line, key: keyOf(n), deg: n.deg })) }, target: target() }; };
      ctx.saveExtra = () => ({ edits });
      ctx.loadExtra = (x) => { edits = (x && x.edits) || {}; build(); };
      build();
      return {};
    },
  });
})();
