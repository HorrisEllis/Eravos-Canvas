/* ERAVOS music data — made-tools.js → window.MadeTools (2026-11-20). The tools a builder made (the Wobble Builder's SYNTHESIZE, WB3): kept in this
 * ERAVOS's own storage, across restarts and updates, beside the pattern library and the note library — a tool's own files keep no storage
 * (tests/boundary.test.js), so the builder hands its made tools here.
 *   MadeTools.list(builderKey) → [record] · MadeTools.save(builderKey, [record]) · records are the builder's (WobbleBuilder.make writes them) */
(function (root) {
  'use strict';
  const PREFIX = 'eravos.made-tools.';
  function list(key) { try { const v = JSON.parse(root.localStorage.getItem(PREFIX + key) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function save(key, L) { try { root.localStorage.setItem(PREFIX + key, JSON.stringify(L || [])); return true; } catch (e) { return false; } }
  root.MadeTools = { list, save, PREFIX };
})(typeof window !== 'undefined' ? window : globalThis);
