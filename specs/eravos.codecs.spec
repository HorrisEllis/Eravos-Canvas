# spec_id: eravos.codecs · version 1.0.0 · phase P14 · status canonical · domains/music/codecs.js → window.Codecs
formats: wav24 · wav16 (TPDF dither) · wav32f · flac24 · flac16 (own encoder: fixed predictors 0–4, Rice2, CRC-8/16) · aiff24 · aiff16 · mp3 320/192/128 (vendor/lame.min.js, LGPL, separate file) · opus webm/ogg (MediaRecorder, real time, where available) · zip (stored) for stems
contract: encode(AudioBuffer, id, {onProgress}) → {blob, ext, mime, bytes, label}; unavailable formats report available() = false
guarantees: lossless outputs decode sample-identical to each other (same dither seed, interleaved order); verified with ffmpeg and in-browser decode
