# eravos.decouple.map.spec — ERAVOS stands alone: decoupled from Nexus; the tools in their own repo (mapped 2026-11-09 · status map, his calls open)
# His words (2026-11-09, verbatim): "Okay but I eventually want to create a repo for the tools. Like completely seperate them." · "Also Decouple from nexus."
# Before (kept, not changed): store D1 (2026-11-08) "like i want to make everything outside of the canvas, in a seperate repo. like a tool store." ·
#   step.spec (2026-11-08) "i want the tools compatable with eravos independantly. eravos is the build surface for nexus." ·
#   workshop.spec ADDENDUM 2026-11-07 ERV_D1 "ERAVOS joins Nexus by registration, never copied" (read as his call, to confirm).

## What was measured (main @ 84e369c, 2026-11-09)
  Runtime: ERAVOS calls nothing in Nexus. No import, no URL, no port, no shared file. host/glass.js (from Clear Glass), host/cos.js (from COS)
  and host/driver/glass.js (from clear-glass/src/driver) are COPIES that run on their own (eravos.host.spec: "no Nexus code is needed").
  The couplings are four kinds:
  C1 an EXPORT TO Nexus   host/cos.js archetype() writes a `nexus.cos.archetype/1` folder for Nexus's COS; `node host/eravos.mjs cos archetype`;
                          Nexus keeps a copy of the canvas in cos/archetype/eravos-canvas (in Nexus, not here).
  C2 CONTRACTS FOR Nexus  specs/eravos.nexus.build-contract.spec (how Nexus builds ERAVOS units from specs, under Nexus's axioms §1–§8);
                          the Workshop's ERV phases (ERAVOS registered in Nexus's COS; its kind schema checked by Nexus ERV4; ERV5 the field's view);
                          tools/agents step: "a pipeline … written by whoever owns it (Nexus writes it from its box shape)".
  C3 NAMES AND ORIGINS    "COS", "Glass", "Clear Glass driver" in host/, docs and the Glass API (`cos.list`, `cos.gate`, X-Eravos-Glass); file
                          headers saying "From Nexus …"; the driver's Nexus UUID.
  C4 THE v2 ROAD          ERAVOS v2 = Emerge + Looking Glass; CLAUDE.md and docs/eravos-v2-emerge-looking-glass.md place Emerge in HorrisEllis/Nexus
                          (emerge/) — Emerge now also has its own repository, HorrisEllis/Emerge.
  And the tools: tools/<domain>/ (six domains, music 28 MB, 66 built tools, 110 components) live in this repo beside the canvas; since 3.155 they
  are served from Documents\ERAVOS\tools, copied from the app folder (store S3).

## Proposed (the coder's reading; each his to confirm or overturn)
  D-DC1 ERAVOS depends on no Nexus repo, code, schema or contract: what came from Nexus is ERAVOS's own now (kept, renamed where the name points
        at Nexus), and anything that talks to Nexus is an ADAPTER that lives outside ERAVOS (in Nexus), reading ERAVOS's own published formats.
        → C1: the archetype export leaves host/cos.js (moved to Nexus, which reads ERAVOS's own manifests instead); C2: the build contract and the
          ERV phases become history (kept verbatim, marked superseded), the step tool's words say "an owner", not Nexus;
          C3: provenance stays in a line of history (nothing is lost), the working names become ERAVOS's own (open: which names — his);
          C4: Emerge is referred to by its own repo (HorrisEllis/Emerge), not Nexus.
  D-DC2 THE TOOLS REPO (store D1, already his): one repo for everything outside the canvas — domains, tools, components, packs, suites — built
        into units (zips with manifest: id, version, digest, needs) by its own CI; ERAVOS keeps the canvas (host, kernel, runtime, schemas, its UI
        elements) and installs units from the store into Documents\ERAVOS. Order, each proved before the next (the sound never changes — null render):
          T0 this map · T1 store S1: manifests v2 for every unit (version, digest, needs — generated) · T2 store S2: the resolver (plain node,
          tested) · T3 the canvas runs with tools/ absent from its own folder (only the library) — tested by a build with no tools/ · T4 he creates
          the repo (a session cannot make one); its history taken from here with `git filter-repo --path tools/` so every tool keeps its log ·
          T5 the store's CI publishes units; ERAVOS's release stops shipping tools/ (the bundle) and a fresh install opens the store (D2 his) ·
          T6 this repo's tools/ removed — only after T5 is green and a fresh install plays.
  The boundary rule already holds the line inside the canvas (tests/boundary.test.js: canvas/ names no domain); the decouple adds a guard:
  tests/no-nexus.mjs — no file outside history (specs' dated addenda, PROGRESS, competence, HIS-WORDS-MAP, PROOF) names Nexus.

## Open, his
  (1) "Decouple" — which reading: (a) ERAVOS needs nothing from Nexus and names it nowhere it works (adapters live in Nexus), or (b) also no
      link at all — Nexus stops carrying ERAVOS (its cos/archetype/eravos-canvas copy, its ERV phases, cos.exe starting ERAVOS).
  (2) The host's names: keep "Glass" and "COS" as ERAVOS's own words, or new names.
  (3) The tools repo's name (proposal: HorrisEllis/eravos-tools, or eravos-store as in store D1) and D2 (a fresh install: a starter set or nothing).

## ADDENDUM 2026-11-09 — his answers (nothing above is changed; the proposals stay as written, not taken up)
#   (1) decouple: "No. Forget I said it. As long as it doesn’t have any dependence." — measured above: ERAVOS has none (no import, URL, port,
#       shared file or schema it needs). Nothing is changed; D-DC1 is not taken up.
#   (2) the host's names: "Ignore my request." — Glass and COS stay as they are.
#   (3) the tools repo: "Just ant them to be zipped per tool. With a dag. This is future plans.  Not now. Continue the wokshop" — the line for
#       later: each tool its own zip with its DAG (store S1's manifests: version, digest, needs). D-DC2 / T0–T6 kept as the plan for then.
