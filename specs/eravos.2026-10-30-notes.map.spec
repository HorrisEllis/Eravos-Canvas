# spec_id: eravos.2026-10-30-notes · status: notes (mapped, NOT built except 3.77 genre sort) · author: James Brooks
# His words: "Just need you to take notes." · "Can we have them sorted by genre." · "I started this to make EDM for my girl. Reverse
# engineering making music while making tools to make music." · "I have a coding language made, and would love a full tool set for it.
# I was thinking we could make code specific." · "I want to be able to experiment. Like what it they could mutate? That would be hard as
# hell, I feel like." · "this project is massive. My first song I made with it."

## 1. His first song — "Today's going to ripple." (Eravos, 2026 · tagged Dubstep · comment "For Raven." · cover: J+R heart, two ravens)
Measured from the MP3 (ffmpeg ebur128 + an FFT pass, mono 22.05 kHz, 4 s blocks). Numbers, not taste.
  length 2:19 · tempo ≈ 143.6 BPM (half-time feel ≈ 72) · key: A minor most likely (chroma peaks C, A; relative C major); sub sits around A1
  loudness −12.0 LUFS integrated · true peak −0.5 dBTP · loudness range 8.8 LU (real contrast for EDM)
  structure (energy in sub 30–60 Hz / bass 60–150 / mids / highs 2–10 kHz):
    0:00–0:12  intro: sub only under the mids, no highs
    0:12–0:32  highs come in, energy climbs
    0:32–0:40  BUILD: the sub is pulled out (−18 dB) while the highs peak — tension by removal
    0:40–1:08  DROP 1: sub + bass up ~4–5 dB, the loudest stretch
    1:08–1:20  BREAK: 1:12–1:20 nothing at all below 150 Hz — the floor falls out (true silence in the low end)
    1:20–1:36  BUILD 2: same move, sub pulled at 1:28–1:36, highs peak again
    1:36–2:04  DROP 2: as loud as drop 1, a touch more sub (+0.8 dB)
    2:04–2:19  outro: back to the intro's shape
  notes for the next one (observations, his call):
    - the drops are darker than the builds: highs ~9 dB lower in the drops than in the builds. Weight is in the low end. A brighter top in
      the drop would make it feel bigger on small speakers.
    - streaming services turn songs down to about −14 LUFS, so this plays ~2 dB quieter there; −1 dBTP is the usual ceiling for MP3/AAC
      (−0.5 can clip after encoding). (Industry practice, from memory — not measured here.)
    - the arrangement is the textbook dubstep map, done cleanly twice: the tools taught the form.

## 2. Sorted by genre — DONE 3.77 (read as: the ♪ patterns panel on each Timeline track)
  A–Z by genre with genre headings, and a genre picker (counts per genre). Open: if "them" meant songs or something else, say which.

## 3. A full tool set for his coding language ("code specific")
  GAP (ask): which language — its name, file extension, and where its grammar/spec lives. Not assumed.
  Map once known — each a tool on the canvas, in the coding domain, wireable like any other:
    Editor (syntax from the grammar) · Run · Gate inspector (event → gate → stream, live, with pending residue shown) · Ledger viewer ·
    Contract runner (PASS/FAIL per test, a verdict) · Formatter · REPL · Bridge: code ⇄ the canvas bus (code that plays notes, turns knobs).
  The canvas stays domain-free (boundary test): the language arrives as a domain, like music.

## 4. Experiment: things that MUTATE
  Less hard than it feels: the kernel already records every mutation in a ledger before it applies and checks constraints before and
  after (ERAVOS.kernel.spec K-6, Mutation, Constraints). What is missing is the loop that proposes changes.
  First slice (interactive evolution — the ear is the fitness test):
    a pattern → ⧬ Mutate → 4 children, each one small change: transpose a step in key · move a hit · drop/add a ghost note · change a wobble
    rate · flip a bend · reshape a curve → ▶ hear each → keep one → it becomes the parent. Lineage kept (parent id, the change, who kept it).
    Hard limits as constraints: stays in key, stays on the grid unless asked, no sub below ~18 Hz.
  Later: mutate a preset (knob values) · cross two patterns (breed) · mutate whole tools (component graphs, after 3.75 C).
  Ask: mutate what first — patterns, sounds, or tools?
