/* ERAVOS music data — part-words.js → window.PartWords (3.216, 2026-11-24). Data beside the components, never in an engine (axiom 1).
 * His words (2026-11-24): "like maybe when you hover tells you what it is and the point of it and how it effects sound, in the simplest ways,
 * so even a child could understand it."
 * Each component the Field board can swap, said three ways, as simply as possible: what it is, what it is for, what moving it does to the
 * sound. One entry per component, so every tool that holds it says the same words. The board (tools/core/field/board.js, domain-free) asks
 * the domain's exchange: PartExchange.explain(component) → { name, what, point, sound } | null. A new component adds its entry here. */
(function (root) {
  'use strict';
  const W = {
    own: { name: 'its own part', what: 'The part this tool was born with.', point: 'It is how the tool sounds before you change anything.',
      sound: 'Put something else here and the tool changes; take it out and it comes back to this.' },
    'filter-svf': { name: 'SVF filter', what: 'A sieve for sound. It lets some of the sound through and holds the rest back.',
      point: 'It decides if the sound is dark or bright.', sound: 'Low = dark and muffled, like sound through a wall. High = bright and buzzy. Resonance makes it sing at one spot.' },
    'filter-ladder': { name: 'ladder filter', what: 'A warm, old-style sieve for sound, like the ones in old synths.',
      point: 'It makes the sound darker or brighter, with a round, thick feel.', sound: 'Low = deep and soft. High = open and bright. Turn its drive up and it gets fat and growly.' },
    'filter-formant': { name: 'vowel filter', what: 'A mouth for the sound.', point: 'It makes the sound say vowels — ooo, aaa, eee.',
      sound: 'Move it and the sound talks: "yoi", "wow", "eee".' },
    'saturator-tube': { name: 'tube drive', what: 'A warm squeeze, like an old radio turned up loud.', point: 'It makes the sound thicker and warmer.',
      sound: 'A little = warm. A lot = crunchy and dirty.' },
    'saturator-tape': { name: 'tape drive', what: 'A soft squeeze, like music played on an old tape.', point: 'It rounds the sound off and makes it fuller.',
      sound: 'More = smoother, fatter and a bit fuzzy, never harsh.' },
    bitcrusher: { name: 'bit crusher', what: 'A pixelator for sound, like an old video-game machine.', point: 'It makes the sound rough and robotic on purpose.',
      sound: 'Fewer bits = more crunchy and broken. Lower rate = more fizzy and metallic.' },
    'osc-noise': { name: 'noise', what: 'A hiss, like wind, rain or a radio between stations.', point: 'It adds air and grit on top of the note.',
      sound: 'A little = breathy. A lot = a rushing, stormy sound.' },
    'delay-line': { name: 'echo', what: 'An echo, like shouting in a big empty room.', point: 'It repeats the sound a moment later.',
      sound: 'Time = how long until it comes back. Feedback = how many times it comes back.' },
    'ensemble-core': { name: 'chorus', what: 'A copy machine that plays the sound a few times, slightly out of step.', point: 'It makes one sound feel wide, like many playing together.',
      sound: 'More = wider, shimmery and dreamy, like an old 80s synth.' },
    lfo: { name: 'wobble (LFO)', what: 'A slow hand that keeps turning a knob for you, back and forth.', point: 'It makes the sound move on its own.',
      sound: 'On the filter it goes wub-wub. Faster = quicker wobble. More depth = bigger wobble.' },
    'osc-va': { name: 'oscillator', what: 'The voice — the part that makes the note in the first place.', point: 'Everything else changes the sound it makes.',
      sound: 'Saw = bright and buzzy. Square = hollow, like a clarinet. Sine = soft and pure.' },
    'osc-sub': { name: 'sub oscillator', what: 'A second voice one or two steps lower.', point: 'It adds weight under the note.',
      sound: 'More = a deeper bottom you feel more than hear.' },
    'unison-stack': { name: 'unison', what: 'The same voice copied many times, each a little out of tune.', point: 'It makes one note sound huge.',
      sound: 'More voices and more detune = wider and thicker, like a crowd singing one note.' },
    'env-adsr': { name: 'envelope', what: 'The shape of a note over time: how it starts, holds and fades.', point: 'It decides if a note is a pluck, a hit or a slow swell.',
      sound: 'Short = plucky. Long = soft and swelling.' },
  };
  const explain = (c) => W[c] || null;
  const api = { explain, words: W };
  root.PartWords = api;
  if (root.PartExchange) root.PartExchange.explain = explain;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
