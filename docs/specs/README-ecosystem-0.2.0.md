# ERAVOS specs — ecosystem v0.2.0 + canvas/timeline handoff (2026-11-03)

Drop these folders onto the repo root; paths match Eravos-Canvas-main. Everything here is a TARGET, not built.

    specs/eravos.music-ecosystem.spec   the index: axioms, contracts, optimization, phases (every tool/component below is listed there)
    specs/eravos.product-vision.spec    what ERAVOS becomes; relational design and novel packs as the priorities
    specs/eravos.object-model.spec      one store, associations not ownership, one relationship graph
    specs/eravos.temporal.spec          one time model: beats, seconds, samples, tempo/meter/warp maps
    specs/eravos.timeline-depth.spec    seven resolution levels, clip depth, three automation scopes, timeline intelligence
    specs/eravos.canvas-family.spec     canvas within canvas; the Piano Canvas; notes as nodes of association
    tools/music/planned/<tool>.spec     one spec per tool (113) — the six dub specs are your originals, unchanged
    tools/music/components/<id>/<id>.spec   one spec per component (104), with which tools use it

Generated tool and component specs mark ports/params/limits "TO WRITE": those come from each tool's depth audit,
not invented here. Start: eravos.object-model + eravos.temporal, then components phase 0.
