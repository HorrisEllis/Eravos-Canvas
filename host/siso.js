/* ERAVOS host — siso.js · the event core (spec eravos.host). Node built-ins only.
 * SISO (→E→E→), the model COS and Clear Glass are built on, sized for ERAVOS:
 *   Event   { type, data, seq, ts }
 *   Gate    one event type → one gate. A second gate for the same type is a hard error (two handlers can't fight
 *           over a command). A gate's transform(event, stream) may return a value (the command's answer) or a promise.
 *   Stream  emit(type, data) → the gate's answer (or undefined if no gate claims it — the event still lands in the ring).
 *           A ring of the last N events (late SSE clients, `since(seq)`), onAny observers (they watch, never answer). */
'use strict';

class Event { constructor(type, data, seq) { this.type = type; this.data = data === undefined ? {} : data; this.seq = seq; this.ts = Date.now(); } }

class Gate {
  constructor(signature, transform, o) {
    if (!signature || typeof signature !== 'string') throw new Error('Gate: signature must be a non-empty string');
    this.signature = signature; this.describe = (o && o.describe) || ''; this.schema = (o && o.schema) || null;
    if (transform) this.transform = transform;
  }
  transform() { return undefined; }
}

class Stream {
  constructor(o) { o = o || {}; this.gates = new Map(); this.ring = []; this.cap = o.cap || 1000; this.seq = 0; this.observers = new Set(); }
  register(gate) {
    if (!(gate instanceof Gate)) throw new Error('Stream.register: not a Gate');
    if (this.gates.has(gate.signature)) throw new Error(`Stream.register: “${gate.signature}” already has a gate — one signature, one gate`);
    this.gates.set(gate.signature, gate); return () => { if (this.gates.get(gate.signature) === gate) this.gates.delete(gate.signature); };
  }
  gate(signature, transform, o) { return this.register(new Gate(signature, transform, o)); }
  signatures() { return Array.from(this.gates.values()).map(g => ({ type: g.signature, describe: g.describe, schema: g.schema })); }
  emit(type, data) {
    const ev = new Event(type, data, ++this.seq);
    this.ring.push(ev); if (this.ring.length > this.cap) this.ring.shift();
    this.observers.forEach(fn => { try { fn(ev); } catch (e) {} });
    const g = this.gates.get(type);
    if (!g) return undefined;
    if (g.schema) { const bad = check(g.schema, ev.data); if (bad) throw Object.assign(new Error(`${type}: ${bad}`), { code: 'SCHEMA' }); }
    return g.transform(ev, this);
  }
  onAny(fn) { this.observers.add(fn); return () => this.observers.delete(fn); }
  since(seq) { return this.ring.filter(e => e.seq > seq); }
  tail(n) { return this.ring.slice(-n); }
}

// a small schema check: { field: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any', 'field?': … optional }
function check(schema, data) {
  if (!data || typeof data !== 'object') return 'data must be an object';
  for (const k of Object.keys(schema)) {
    const opt = k.endsWith('?'), key = opt ? k.slice(0, -1) : k, want = schema[k], v = data[key];
    if (v === undefined) { if (opt) continue; return `missing “${key}”`; }
    const got = Array.isArray(v) ? 'array' : typeof v;
    if (want !== 'any' && got !== want) return `“${key}” must be ${want}, got ${got}`;
  }
  return null;
}

module.exports = { Event, Gate, Stream, check };
