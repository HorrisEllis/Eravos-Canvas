// node tools/music/components/note-release/note-release.test.mjs — same AudioParam calls as the five originals.
import { createRequire } from 'module'; const { releaseHeld, releaseVoices } = createRequire(import.meta.url)('./note-release.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const param = (hold) => { const log = [], g = { log, cancelScheduledValues: (t) => log.push(['cancel', t]), setTargetAtTime: (...a) => log.push(['target', ...a]) }; if (hold) g.cancelAndHoldAtTime = (t) => log.push(['hold', t]); return g; };
// ---- the ORIGINAL noteOff of wobble-bass / wub-osc / wub-sub, verbatim (closing over ac, amp, held, P) ----
const origHeld = (ac, amp, held, P) => function noteOff(note, t) {
  if (!held || held.note !== note) return;
  t = Math.max(t || ac.currentTime, ac.currentTime);
  if (typeof amp.gain.cancelAndHoldAtTime === 'function') amp.gain.cancelAndHoldAtTime(t); else amp.gain.cancelScheduledValues(t);
  amp.gain.setTargetAtTime(0, t, P.get('release') / 4); held.off = t;
};
for (const hold of [true, false]) for (const [heldNote, note] of [[45, 45], [45, 46], [null, 45]]) for (const t of [undefined, 0, 0.5, 2, 9.25]) for (const rel of [0.05, 0.4, 3]) {
  const ac = { currentTime: 1.0 }, P = { get: (k) => k === 'release' ? rel : 0 };
  const a = param(hold), b = param(hold), ha = heldNote === null ? null : { note: heldNote, off: Infinity }, hb = heldNote === null ? null : { note: heldNote, off: Infinity };
  origHeld(ac, { gain: a }, ha, P)(note, t); releaseHeld(ac, b, hb, note, t, P.get('release'));
  ok(JSON.stringify(a.log) === JSON.stringify(b.log) && JSON.stringify(ha) === JSON.stringify(hb), `held hold=${hold} ${heldNote}/${note} t=${t} rel=${rel}`);
}
// ---- the ORIGINAL noteOff of syn-osc / syn-partials ----
const origVoices = (ac, voices, release) => function noteOff(note, t) { t = Math.max(t || ac.currentTime, ac.currentTime); voices.filter(v => v.note === note && !v.released).forEach(v => release(v, t)); };
for (const t of [undefined, 0, 0.7, 5]) for (const note of [57, 60, 99]) {
  const ac = { currentTime: 1.0 }, mk = () => [{ note: 57, released: false, id: 1 }, { note: 57, released: true, id: 2 }, { note: 60, released: false, id: 3 }, { note: 57, released: false, id: 4 }];
  const la = [], lb = [];
  origVoices(ac, mk(), (v, tt) => la.push([v.id, tt]))(note, t); releaseVoices(ac, mk(), note, t, (v, tt) => lb.push([v.id, tt]));
  ok(JSON.stringify(la) === JSON.stringify(lb), `voices note ${note} t=${t}`);
}
console.log(`note-release: ${n} checks passed — the same AudioParam calls as the five originals`);
