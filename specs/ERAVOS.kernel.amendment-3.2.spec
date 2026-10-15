# ============================================================
# ERAVOS KERNEL AMENDMENT 3.2 — DOMAIN PACKS
# status: canonical · supersedes: the placement (not the behaviour) of amendment 3.1 §AUDIO GRAPH and §MASTER CHAIN
# ============================================================
#
# "The kernel never learns what music is." (kernel spec, closing line)
# Amendment 3.1 put a signal graph and a music master chain (DJ filter, sidechain duck, compressor,
# limiter, reverb/shimmer, ping-pong delay) inside the kernel while calling it domain-free. It was not:
# a coding or research universe would have booted a reverb. 3.2 keeps every behaviour of 3.1 and moves
# it out of the kernel into a domain pack. The kernel's `domains` field (music | coding | video | research)
# is now literal.

skeleton:            # domain-free — may not name any organism, topic namespace, signal type or domain word
  kernel/kernel.js:  registry · bus · ledger · faults · permissions · mutations · contracts · assets · wires · ports · domains
  kernel/intake.js:  zip install sequence (steps 1–15) · json → intake:file · other files → domain file handlers
  runtime/:          organism SDK core · factory · canvas · wire rails · workspace · recipes · UI kit core · css
  index.html:        shell — canvas, Add palette, recipes, fault log, workspace, one key dispatcher, slots
  scripts.js:        skeleton load order, then domains/index.js

extension_slots:     # the only doors a domain has into the skeleton
  Kernel.use(domain {id, version, install(K, opts), prepare?(K), shell?(S)})
  K.extend(name, api)                       # DOMAIN_002 if the name is taken
  K.permissions.declare([...])              # granted by default unless the universe was given an explicit list
  K.ports.defineKind(kind, {directions, permission, validate, onRegister, onRemove})
  K.wires.defineType(type, {connect, disconnect, acyclic, color})     # WIRE_006 is now signal_cycle
  K.assets.defineDecoder({asset_type, mime, sniff, decode}) · K.assets.registerDecoded(bytes, decoded, meta)
  K.domains.prepare()                       # warm-up before capability checks (e.g. a context needing a gesture)
  OrganismSDK.extend({id, std, uiHooks, statics, ctx(ctx, api)})
  OrganismFactory.onDefine(fn) · extendView(fn) · allowObserve([prefixes])
  UIKit.extend({...}) · Recipes.defineOp(name, fn) · Workspace.contribute({id, save, restore, beforeRestore})
  Intake.defineHandler({id, domain, match, handle}) · Intake.definePackType(type, {spawnAssets})
  CanvasWM.addTitleAction({when, make}) · WireSystem.ambient([prefixes])
  Shell: slot(name) · brand({tagline, tip, categories}) · onActivate(fn) · bindKey(code, fn) · toast

new_rules:
  - descriptor.domain: an organism of a domain not installed in the universe is refused (DOMAIN_001)
  - K-3 enforcement: registry records no longer carry a param getter; K.registry.readParam(reader, target, key)
    is the only way to read another organism's params and requires registry_read (RUNTIME_001 otherwise)
  - K.state removed; the music domain owns K.music {bpm, key}
  - workspace snapshots store domain state under snap.domains[<id>]; 1.0.0 snapshots with top-level bpm/key still restore
  - recipes may be marked `featured` (the shell shows them as hero cards)

universes:
  Kernel.create(opts)                 # every registered domain
  Kernel.create({domains: []})        # bare kernel — must boot and run domain-free organisms (tested)

music_domain: domains/music/          # audio.js (graph + master chain, unchanged behaviour), sdk-music.js, ui-music.js,
                                      # music-theory, precision-clock, audio-recorder, master-transport, domain.js, data/, organisms/

tests: tests/boundary.test.js — the forbidden vocabulary is derived from what loaded domains register
       (organism ids, hook topic namespaces, signal wire types, domain ids, file handlers, SDK extensions) plus a fixed list.
