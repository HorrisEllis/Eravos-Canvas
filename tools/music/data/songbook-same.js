/* ERAVOS songs that repeat another (3.172) — data only. His words, 2026-11-12: "can you also remove duplicate songs in the songs library, a lot of
 * the same songs". Measured, not guessed: every song generated from its genre and seed, its notes compared with every other song of its genre
 * (each note as part · position · pitch class from the key's root — the key and tempo taken out), Jaccard overlap. A song that shares 80 % or
 * more of its notes with an earlier song of its genre plays the same song; it is hidden from the library (the earlier one stays).
 * Measured 2026-11-12 on 321 songs: 45 at >= 0.80 (85 at >= 0.70, 14 at >= 0.90). Nothing is deleted (axiom 9): each song stays in its songbook
 * and this list says what it repeats and how much — Songbook.same() lists them; Songbook.all({ same: true }) includes them.
 *   [id, title, the song it repeats (id), its title, overlap 0–1] */
(function () {
  'use strict';
  const LIST = [
    ["am6", "Raven, Rising", "am3", "Gate Opens", 0.954],
    ["bh-strobe", "Strobe Sermon", "bh-afterhours", "After Hours Wobble", 0.811],
    ["bw-headbang", "Neck Brace", "bw-stopstart", "Stop Start Stop", 0.950],
    ["bw-machine", "Robot Gate Riot", "bw-hiccup", "Hiccup Protocol", 0.950],
    ["bdf4", "Siren Inna Di Half-Time", "bdf3", "Yard to Drop", 0.898],
    ["dd-ghetto-gospel", "Selector Gospel", "dd-pressure-drop", "Pressure Drop Riddim", 0.850],
    ["dn-glass", "Glass Tunnel", "liquid", "Liquid Night", 0.822],
    ["ds-lights-out", "Lights Out at 140", "ds-thunder", "Thunder in the Pipes", 0.831],
    ["bonus-gap", "The Silence Before", "shake", "Give Your Head a Shake", 0.818],
    ["hx8", "For Her, Heavy", "hx7", "Deep End", 0.923],
    ["he17", "Low End Love", "he16", "Talk to the Bass", 0.916],
    ["he21", "174 Heartbeats", "he19", "Rolling With You", 0.822],
    ["ll-t4", "Every Colour of You", "ll10", "Last Light", 0.870],
    ["ll-t6", "Morning After Everything", "ll10", "Last Light", 0.846],
    ["ll-l6", "Wicked Lullaby", "ll-l5", "Loop of You", 0.876],
    ["ll-v3", "Feather to Floor", "ll8", "Raven Drop", 0.832],
    ["ll-k5", "Black Lace Static", "ll4", "Sweet Ruin", 0.817],
    ["ll-k6", "Ruin, Softly", "ll4", "Sweet Ruin", 0.804],
    ["mw-saltwater", "Saltwater Halo", "mw-afterglow", "Afterglow Wub", 0.828],
    ["nr-acid-rain", "Acid Rain Protocol", "neuro", "Neuro Grid", 0.830],
    ["oc-bd6", "Lungs Full of Bass", "oc-bd2", "Body Roller", 0.890],
    ["oc-cr5", "Chapel Pressure", "oc-cr4", "Pipes and Wubs", 0.909],
    ["oc-fd4", "Funeral Bashment", "oc-fd1", "Witches on the Dembow", 0.881],
    ["oc-fd5", "Requiem Riddim", "oc-fd1", "Witches on the Dembow", 0.830],
    ["oc-gg6", "Amen Broken", "oc-gg2", "Tape-Stop Hallelujah", 0.982],
    ["oc-gg4", "Seventh Heaven 1/16", "oc-gg2", "Tape-Stop Hallelujah", 0.984],
    ["oc-gd5", "Irrational Riddim", "oc-gd4", "Golden Sound System", 0.840],
    ["oc-hd5", "Dust on the Dub Plate", "oc-hd2", "Desert Dub Chamber", 0.834],
    ["oc-mc3", "Acid Requiem", "oc-mc2", "Ghosts in the Generator", 0.895],
    ["oc-mc4", "Choir Behind Glass", "oc-mc2", "Ghosts in the Generator", 0.895],
    ["oc-mc5", "Twelve-Bit Cathedral", "oc-mc2", "Ghosts in the Generator", 0.891],
    ["oc-st2", "Bells of Recursion", "oc-st1", "Fractal 808", 0.832],
    ["oc-st5", "Math in the Trunk", "oc-st3", "Slendro Slide", 0.803],
    ["oc-st6", "Octave Under", "oc-st1", "Fractal 808", 0.834],
    ["oc-ss5", "Brass and Dub Plates", "oc-ss1", "Miami Sound System", 0.886],
    ["oc-ss4", "Outrun the Siren", "oc-ss3", "Juno Bubble", 0.833],
    ["oc-xw6", "Off the Grid", "oc-xw4", "Garage of Irrationals", 0.809],
    ["oc-xw2", "Wobble at Phi", "oc-xw1", "Nineteen Steps", 0.844],
    ["rv-face-off", "Face Off", "rv-tag-team", "Tag Team", 0.925],
    ["rv-split", "Split Decision", "rv-handoff", "The Hand-off", 0.849],
    ["rv-two-mouths", "Two Mouths", "rv-rivals", "Rivals", 0.910],
    ["rw-trench", "Trench Bounce", "bp-riddim", "Riddim Warfare", 0.903],
    ["syn-fg3", "Ratio Two", "syn-fg1", "Two Oscillators, One Voice", 0.855],
    ["tk-mouthy", "Mouthy", "tk-yoi-yoi", "Yoi Yoi Yoi", 0.816],
    ["wr-cables", "Every Cable Counts", "wr-modular", "Modular Mood", 0.912],
  ];
  const ids = new Set(LIST.map(r => r[0]));
  window.SongbookSame = { measured: '2026-11-12', threshold: 0.8, list: () => LIST.map(([id, title, ofId, of, sim]) => ({ id, title, ofId, of, sim })), has: (id) => ids.has(id) };
})();
