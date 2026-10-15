/* eravos.mixer 1.0.0 — Mixer · spec mixer.spec (eravos.phase34-map §E)
 * The face of the music domain's mixer layer (K.audio.strip / K.audio.lines): a strip for every sound on the canvas,
 * lines you add (GROUP, AUX), the built-in Reverb and Echo returns, the master meter. It owns no audio of its own and
 * knows no other tool — strips appear and disappear with whatever is on the canvas. Settings → Output on any tool and
 * the title-bar volume drive the same strips (one layer, many faces). */
(function () {
  'use strict';
  OrganismFactory.define({
    id: 'eravos.mixer', domain: 'music', version: '1.0.0', label: 'Mixer', icon: '🎛', accent: '#7cc4ff', tempo: false,
    category: 'Mix', blurb: 'The whole mix in one place: a strip for every sound, add group and effect lines, send, pan, EQ, solo.',
    singleton: 'block', size: { w: 1000, h: 560 }, minSize: { w: 420, h: 320 },
    permissions: ['bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.mixer'],
    needs: { notes: ['Every sound on the canvas gets a strip by itself — nothing to wire.', '⤢ in the title bar fills the screen.'] },
    hooks: [],
    config: [
      { key: 'wide', type: 'boolean', default: false, label: 'Wide strips', group: 'VIEW' },
      { key: 'meters', type: 'boolean', default: true, label: 'Meters', group: 'VIEW' },
      { key: 'showLines', type: 'boolean', default: true, label: 'Show lines', group: 'VIEW' },
    ],
    ui_hooks: ['strip_set', 'line_add', 'line_set', 'line_remove', 'focus_tool'],
    ui_hook_labels: { strip_set: 'mix', line_add: 'add line', line_set: 'edit line', line_remove: 'remove line' },
    presets: {},
    engine(ctx) {
      const K = ctx.K, A = K.audio;
      const kids = () => K.registry.list().filter(r => r.instance_id !== ctx.id && !(r.descriptor && r.descriptor.system));
      function strips() {
        const out = [];
        kids().forEach(r => (A.ports(r.instance_id) || []).forEach(p => {
          if (p.kind !== 'audio' || p.direction !== 'out' || !p.trim) return;
          out.push({ inst: r.instance_id, port: p.port_id, label: r.descriptor.label || r.organism_id, icon: r.descriptor.icon || '', accent: r.descriptor.accent || '#7cc4ff',
            portLabel: p.port_id === 'out' ? '' : (p.label || p.port_id), routed: p.onPost ? 'song' : p.onMaster ? 'home' : 'wired', state: A.strip(r.instance_id, p.port_id).get() });
        }));
        return out;
      }
      const lines = () => A.lines.builtin().concat(A.lines.list());
      function snapshot() { return { strips: strips(), lines: lines() }; }
      let t = 0; const soon = () => { if (t) return; t = setTimeout(() => { t = 0; if (!ctx.disposed) ctx.emitUI('mix', snapshot()); }, 25); };
      ['audio:trim', 'audio:strip', 'audio:lines', 'kernel:organism-mounted', 'kernel:organism-unmounted', 'kernel:wire-registered', 'kernel:wire-removed']
        .forEach(tp => { const un = K.bus.subscribe(tp, soon, ctx.id); ctx.onDispose(un); });
      ctx.onDispose(() => clearTimeout(t));
      ctx.onUI('strip_set', { type: 'object', required: ['inst', 'patch'] }, (p) => { A.strip(p.inst, p.port || 'out').set(p.patch); soon(); });
      ctx.onUI('line_add', { type: 'object' }, (p) => { const id = A.lines.add({ kind: p.kind, fx: p.fx, name: p.name }); ctx.emitUI('line_added', { id }); soon(); });
      ctx.onUI('line_set', { type: 'object', required: ['id', 'patch'] }, (p) => { A.lines.set(p.id, p.patch); soon(); });
      ctx.onUI('line_remove', { type: 'object', required: ['id'] }, (p) => { A.lines.remove(p.id); soon(); });
      ctx.onUI('focus_tool', { type: 'object', required: ['inst'] }, (p) => K.bus.publish('canvas:focus-request', { instanceId: p.inst }));
      // the mix itself is the audio layer's data — the Mixer's snapshot is that data, so Ctrl+Z restores a mix move
      ctx.saveExtra = () => ({ mix: A.mixState() });
      ctx.loadExtra = (x) => { if (x && x.mix) { A.loadMix(x.mix); soon(); } };
      ctx.stateExtra = () => snapshot();
      ctx.internals = { strips, lines, snapshot };
      return {};
    },
  });
})();
