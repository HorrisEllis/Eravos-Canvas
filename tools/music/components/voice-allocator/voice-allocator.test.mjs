// node tools/music/components/voice-allocator/voice-allocator.test.mjs — which voice plays which note, proved on scripted playing.
import { createRequire } from 'module'; const { VoiceAllocator } = createRequire(import.meta.url)('./voice-allocator.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const snap = (r) => ({ voice: r.voice, note: r.note, retrigger: r.retrigger, stolen: r.stolen, stolenNote: r.stolenNote, glide: r.glide });
// ---- poly: free voices first, each note its own; a note-off releases its voice; a released voice is reused before any steal
{ const A = VoiceAllocator(4); const v = [60, 64, 67, 71].map((k, i) => A.noteOn(k, 1, i).voice);
  ok(new Set(v).size === 4, 'poly: four notes, four voices'); ok(A.budget().active === 4 && A.budget().free === 0, 'budget: 4 active');
  const off = snap(A.noteOff(64, 5)); ok(off.voice === v[1], 'note-off releases the voice that played it'); ok(A.budget().releasing === 1, 'budget: 1 releasing');
  const r = snap(A.noteOn(72, 1, 6)); ok(r.voice === v[1] && r.stolen === v[1] && r.stolenNote === 64, 'all busy: the released voice is taken first'); }
// ---- steal policies (no voice releasing)
const play = (pol, notes, levels) => { const A = VoiceAllocator(3); A.setSteal(pol); notes.forEach((k, i) => A.noteOn(k, 1, i)); if (levels) levels.forEach((x, v) => A.level(v, x)); return A; };
{ const A = play('oldest', [60, 64, 67]); const r = snap(A.noteOn(70, 1, 9)); ok(r.stolenNote === 60, 'oldest: the first note played goes'); }
{ const A = play('quietest', [60, 64, 67], [0.9, 0.2, 0.5]); const r = snap(A.noteOn(70, 1, 9)); ok(r.stolenNote === 64, 'quietest: the voice at 0.2 goes'); }
{ const A = play('same-note', [60, 64, 67]); const r = snap(A.noteOn(64, 1, 9)); ok(r.stolenNote === 64 && r.voice === A.voiceOf(64), 'same-note: replaying 64 takes 64\'s own voice'); const s = snap(A.noteOn(50, 1, 10)); ok(s.stolenNote === 60, 'same-note, a new note: the oldest goes'); }
{ const A = play('lowest', [64, 55, 67]); ok(snap(A.noteOn(70, 1, 9)).stolenNote === 55, 'lowest: the lowest note goes'); }
{ const A = play('highest', [64, 55, 67]); ok(snap(A.noteOn(50, 1, 9)).stolenNote === 67, 'highest: the highest note goes'); }
{ const A = VoiceAllocator(2); A.noteOn(60, 1, 0); A.noteOn(62, 1, 1); A.noteOn(64, 1, 2); A.noteOn(65, 1, 3); ok(A.budget().stolen === 2, 'budget counts every steal'); }
// ---- release timing: with release(0.5), a voice is free 0.5 s after its note-off (not before)
{ const A = VoiceAllocator(1); A.release(0.5); A.noteOn(60, 1, 0); A.noteOff(60, 1); A.noteOn(62, 1, 1.2); ok(A.budget().stolen === 1, 'inside its release: taken by a steal');
  const B = VoiceAllocator(1); B.release(0.5); B.noteOn(60, 1, 0); B.noteOff(60, 1); B.noteOn(62, 1, 1.6); ok(B.budget().stolen === 0, 'after its release: free again'); }
// ---- a note-off booked ahead (a sequenced note's length): until then the voice still sounds — the steal takes another
{ const A = VoiceAllocator(2); A.noteOn(60, 1, 0); A.noteOff(60, 4); A.noteOn(62, 1, 0.5); const r = snap(A.noteOn(64, 1, 1));
  ok(r.stolenNote === 60 || r.stolenNote === 62, 'both still sounding at t = 1'); ok(r.stolenNote === 60, 'oldest of the sounding ones (60 still sounds until t = 4)');
  const B = VoiceAllocator(2); B.noteOn(60, 1, 0); B.noteOn(62, 1, 0.5); B.noteOff(62, 4); B.noteOff(60, 0.8); ok(snap(B.noteOn(64, 1, 1)).stolenNote === 60, 'the one already released (60 at 0.8) goes first, not 62 (booked to end at 4)'); }
// ---- mono: every note retriggers; letting go returns to the last key still held; the last key up releases
{ const A = VoiceAllocator(8); A.setMode('mono');
  const a = snap(A.noteOn(60, 1, 0)), b = snap(A.noteOn(64, 1, 1)), c = snap(A.noteOn(67, 1, 2));
  ok(a.voice === 0 && b.voice === 0 && c.voice === 0 && a.retrigger && b.retrigger && c.retrigger, 'mono: one voice, every note retriggers');
  const d = snap(A.noteOff(67, 3)); ok(d.voice === 0 && d.note === 64 && d.glide, 'mono: let go of 67 → back to 64 (last-note priority)');
  const e = snap(A.noteOff(60, 4)); ok(e.voice === -1, 'mono: letting go of a key under the sounding one changes nothing');
  const f = snap(A.noteOff(64, 5)); ok(f.voice === 0 && f.note === 64 && !f.glide && A.budget().releasing === 1, 'mono: the last key up releases'); }
// ---- legato: a note over a held one glides without retriggering; a fresh note (nothing held) retriggers
{ const A = VoiceAllocator(); A.setMode('legato');
  const a = snap(A.noteOn(60, 1, 0)), b = snap(A.noteOn(63, 1, 1)); ok(a.retrigger && !a.glide, 'legato: the first note retriggers');
  ok(!b.retrigger && b.glide && b.voice === 0, 'legato: a note over a held one glides, no retrigger');
  A.noteOff(63, 2); A.noteOff(60, 3); const c = snap(A.noteOn(65, 1, 4)); ok(c.retrigger && !c.glide, 'legato: after all keys are up, the next note retriggers'); }
// ---- no allocation per note: the same result object every time; 32 voices; reset clears everything
{ const A = VoiceAllocator(32); const r1 = A.noteOn(1, 1, 0), r2 = A.noteOff(1, 1); ok(r1 === r2, 'one result object, reused');
  for (let k = 0; k < 40; k++) A.noteOn(20 + k, 1, k); ok(A.budget().active === 32 && A.budget().stolen === 9, '32 voices; 9 takes past them (the released one first, then 8 steals)');
  A.reset(); ok(A.budget().active === 0 && A.budget().stolen === 0, 'reset clears'); }
// ---- a long random performance never hands one voice two notes at once, never loses a held note in poly
{ const A = VoiceAllocator(6); let s = 1; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; const down = new Map(); let bad = 0;
  for (let i = 0; i < 20000; i++) { const k = 40 + Math.floor(rnd() * 30), t = i * 0.01;
    if (down.has(k) || rnd() < 0.45) { if (down.has(k)) { A.noteOff(k, t); down.delete(k); } }
    else { const r = A.noteOn(k, 1, t); if (r.stolen >= 0) for (const [kk, vv] of down) if (vv === r.voice) down.delete(kk); down.set(k, r.voice); }
    const seen = new Set(); for (const vv of down.values()) { if (seen.has(vv)) bad++; seen.add(vv); } }
  ok(bad === 0, 'a 20,000-event random performance: never two held notes on one voice'); }
console.log(`voice-allocator: ${n} checks pass`);
