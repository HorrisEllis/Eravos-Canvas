/* eravos.dub-station UI — a sound-system front: the speaker box breathes with the output, four performance pads
 * (SIREN hold · HORN · THROW hold · PULL UP), the BIG KNOB as the hero, and a desk of modules (skank · siren & horn ·
 * spring & echo · pull up). Keys while focused: S siren · H horn (shift: three) · T throw · P pull up.
 * Visuals read the shared living-accent vars (--live --peak --flash --tone) from UI.alive plus the tool's own output tap.
 * Styling is tool-local: one <style id="dub-style">, every class prefixed dub2-. */
(function () {
  'use strict';
  const CSS = `
.dub2 { --dub2-wood: #17120d; --dub2-panel: #1f1912; --dub2-raise: #2a2219; --dub2-edge: #3a2f22; --dub2-brass: #d9a441; --dub2-brass-hi: #f3cf7a;
  --dub2-red: #e2483a; --dub2-gold: #f0b429; --dub2-green: #34b86d; --dub2-cream: #f1e6cf; --dub2-dim: #a8977c; --dub2-faint: #6b5d4a;
  container-type: inline-size; display: flex; flex-direction: column; gap: 8px; color: var(--dub2-cream); font-family: var(--font); }
.wm-body.dub2.alive-body::before { background:
    radial-gradient(130% 60% at 50% 0%, color-mix(in srgb, var(--dub2-gold) calc(4% + var(--live) * 10%), transparent), transparent 70%),
    radial-gradient(80% 50% at 100% 100%, color-mix(in srgb, var(--dub2-red) calc(3% + var(--flash) * 18%), transparent), transparent 70%),
    linear-gradient(180deg, #15110c, #0e0b08); }
.dub2-head { display: flex; align-items: center; gap: 8px; min-height: 30px; }
.dub2-head .uk-presetbar { flex: 0 1 auto; }
.dub2-toast { flex: 1; text-align: right; font: 600 12px var(--font); color: var(--dub2-gold); opacity: 0; transform: translateY(-3px); transition: opacity .25s, transform .25s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dub2-toast.show { opacity: 1; transform: none; }
.dub2 .uk-toggle { background: var(--dub2-raise); border-color: var(--dub2-edge); color: var(--dub2-dim); border-radius: 7px; font-weight: 600; padding: 5px 10px 5px 24px; position: relative; }
.dub2 .uk-toggle::before { content: ''; position: absolute; left: 9px; top: 50%; width: 7px; height: 7px; margin-top: -3.5px; border-radius: 50%; background: #3b3024; box-shadow: inset 0 1px 1px rgba(0,0,0,.6); }
.dub2 .uk-toggle.on { background: color-mix(in srgb, var(--m, var(--dub2-green)) 16%, var(--dub2-raise)); border-color: color-mix(in srgb, var(--m, var(--dub2-green)) 60%, var(--dub2-edge)); color: var(--dub2-cream); }
.dub2 .uk-toggle.on::before { background: var(--m, var(--dub2-green)); box-shadow: 0 0 8px var(--m, var(--dub2-green)); }
.dub2 .uk-toggle:hover, .dub2 .uk-btn:hover { border-color: var(--dub2-brass); }
.dub2 .uk-select, .dub2 .uk-btn { background: var(--dub2-raise); border-color: var(--dub2-edge); color: var(--dub2-cream); }

/* hero: speaker box · pads · big knob */
.dub2-hero { display: grid; grid-template-columns: 128px minmax(0, 1fr) 140px; gap: 10px; align-items: stretch; }
.dub2-cab { position: relative; border-radius: 10px; padding: 7px; background:
    repeating-linear-gradient(90deg, rgba(255,255,255,.012) 0 2px, transparent 2px 4px), linear-gradient(180deg, #1b1611, #100c08);
  border: 1px solid var(--dub2-edge); box-shadow: inset 0 1px 0 rgba(255,255,255,.05), inset 0 -12px 24px rgba(0,0,0,.45), 0 6px 18px rgba(0,0,0,.45); }
.dub2-cab canvas { display: block; border-radius: 6px; }
.dub2-cab-badge { position: absolute; left: 12px; bottom: 11px; display: flex; gap: 3px; }
.dub2-cab-badge i { width: 14px; height: 3px; border-radius: 2px; opacity: calc(.45 + var(--live) * .55); }
.dub2-pads { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; }
.dub2-pad { --c: var(--dub2-cream); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 1px;
  padding: 10px 11px 9px; min-height: 66px; border-radius: 9px; cursor: pointer; touch-action: none; user-select: none; text-align: left;
  color: var(--dub2-cream); border: 1px solid #000; background: linear-gradient(180deg, #2e261c, #1d1711 70%);
  box-shadow: inset 0 1px 0 rgba(255,236,200,.09), inset 0 -2px 0 rgba(0,0,0,.4), 0 3px 0 #0a0805, 0 5px 12px rgba(0,0,0,.45);
  transition: transform .06s, box-shadow .06s, background .15s; }
.dub2-pad::before { content: ''; position: absolute; left: 11px; right: 11px; top: 9px; height: 4px; border-radius: 3px;
  background: color-mix(in srgb, var(--c) 28%, #120e0a); box-shadow: inset 0 1px 1px rgba(0,0,0,.6); transition: background .1s, box-shadow .1s; }
.dub2-pad::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .12s;
  background: radial-gradient(120% 90% at 50% 110%, color-mix(in srgb, var(--c) 45%, transparent), transparent 70%); }
.dub2-pad b { font: 800 19px/1 var(--font); letter-spacing: .02em; }
.dub2-pad small { font: 500 11px/1.25 var(--font); color: var(--dub2-dim); }
.dub2-pad kbd { position: absolute; right: 9px; bottom: 8px; font: 600 10px/1 var(--mono); color: var(--dub2-faint); border: 1px solid var(--dub2-edge); border-radius: 4px; padding: 2px 4px; }
.dub2-pad:hover { background: linear-gradient(180deg, #342b20, #211a13 70%); }
.dub2-pad:focus-visible { outline: 2px solid var(--dub2-brass); outline-offset: 2px; }
.dub2-pad.on { transform: translateY(2px); box-shadow: inset 0 1px 0 rgba(255,236,200,.06), inset 0 0 0 1px color-mix(in srgb, var(--c) 55%, transparent), 0 1px 0 #0a0805, 0 0 22px color-mix(in srgb, var(--c) 40%, transparent); }
.dub2-pad.on::before { background: var(--c); box-shadow: 0 0 10px var(--c), 0 0 2px #fff; }
.dub2-pad.on::after { opacity: 1; }
.dub2-pad.on small { color: var(--dub2-cream); }
.dub2-pad.siren { --c: var(--dub2-red); } .dub2-pad.horn { --c: var(--dub2-gold); } .dub2-pad.throw { --c: var(--dub2-green); } .dub2-pad.pull { --c: var(--dub2-cream); }
.dub2-pad.siren.on::after { animation: dub2-wail calc(1s / var(--dub2-rate, 3)) ease-in-out infinite alternate; }
@keyframes dub2-wail { from { opacity: .35; } to { opacity: 1; } }
.dub2-pad.throw .dub2-ripple { position: absolute; right: 14px; top: 22px; width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--c); opacity: 0; pointer-events: none; }
.dub2-pad.throw.on .dub2-ripple { animation: dub2-ripple 1s ease-out infinite; } .dub2-pad.throw.on .dub2-ripple.r2 { animation-delay: .33s; } .dub2-pad.throw.on .dub2-ripple.r3 { animation-delay: .66s; }
@keyframes dub2-ripple { from { transform: scale(.3); opacity: .9; } to { transform: scale(2.2); opacity: 0; } }
.dub2-pad.pull svg { position: absolute; right: 12px; top: 22px; width: 24px; height: 24px; fill: none; stroke: var(--dub2-dim); stroke-width: 2; stroke-linecap: round; }
.dub2-pad.pull.spin svg { stroke: var(--c); animation: dub2-spin .5s linear infinite; }
@keyframes dub2-spin { to { transform: rotate(-360deg); } }
.dub2-pad.pull.spin { --c: var(--dub2-gold); }

.dub2-knobwell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; border-radius: 10px; padding: 6px 4px 8px;
  background: radial-gradient(90% 70% at 50% 40%, #241d15, #120e0a); border: 1px solid var(--dub2-edge); box-shadow: inset 0 1px 0 rgba(255,255,255,.04), inset 0 -10px 20px rgba(0,0,0,.4); }
.dub2-bk { position: relative; width: 116px; height: 116px; display: grid; place-items: center; }
.dub2-bk::before { content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: repeating-conic-gradient(from -135deg, var(--dub2-faint) 0 1.2deg, transparent 1.2deg 9deg);
  -webkit-mask: radial-gradient(circle, transparent 53px, #000 53.5px, #000 57px, transparent 57.5px); mask: radial-gradient(circle, transparent 53px, #000 53.5px, #000 57px, transparent 57.5px);
  clip-path: polygon(50% 50%, 0 100%, 0 0, 100% 0, 100% 100%); }
.dub2-bk .uk-knob { width: auto; position: relative; z-index: 2; }
.dub2-bk .uk-knob svg { width: 104px; height: 104px; border-radius: 50%; position: relative; z-index: 2;
  background: radial-gradient(circle at 45% 36%, #fbe3a3 0, var(--dub2-brass-hi) 6%, var(--dub2-brass) 15%, #a7792a 23%, #6d4e1b 27.5%, transparent 28.2%); }
.dub2-bk-plate, .dub2-bk-skirt { position: absolute; left: 50%; top: 50%; border-radius: 50%; pointer-events: none; }
.dub2-bk-plate { width: 98px; height: 98px; margin: -49px 0 0 -49px; background: radial-gradient(circle, #0a0806 60%, #15100b 100%); box-shadow: inset 0 1px 2px rgba(0,0,0,.8), 0 1px 0 rgba(255,230,190,.05); }
.dub2-bk-skirt { z-index: 1; width: 70px; height: 70px; margin: -35px 0 0 -35px;
  background: radial-gradient(circle at 45% 35%, rgba(255,230,170,.18), transparent 60%), repeating-conic-gradient(#5b4219 0 5deg, #2e210c 5deg 10deg);
  box-shadow: 0 6px 12px rgba(0,0,0,.7), 0 0 0 1px #120d06, 0 0 calc(4px + var(--live) * 22px) color-mix(in srgb, var(--dub2-gold) calc(8% + var(--live) * 50%), transparent); }
.dub2-bk .uk-knob-track { stroke: #2b231a; stroke-width: 3.2; }
.dub2-bk .uk-knob-arc { stroke: var(--dub2-gold); stroke-width: 3.2; filter: drop-shadow(0 0 2px var(--dub2-gold)); }
.dub2-bk .uk-knob-dot { fill: #1a130a; r: 2; }
.dub2-bk .uk-knob-val, .dub2-bk .uk-knob-label { display: none; }
.dub2-bk .uk-knob:focus-visible { outline: none; } .dub2-bk .uk-knob:focus-visible svg { box-shadow: 0 0 0 2px var(--dub2-brass); }
.dub2-bk-name { font: 700 13px/1 var(--font); letter-spacing: .01em; color: var(--dub2-cream); }
.dub2-bk-val { font: 500 11px/1.2 var(--font); text-align: center; color: var(--dub2-gold); font-variant-numeric: tabular-nums; }

/* the desk */
.dub2-desk { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 8px; }
.dub2-desk.b { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); }
.dub2-mod { --m: var(--dub2-cream); position: relative; border-radius: 9px; padding: 8px 10px 8px; background: linear-gradient(180deg, var(--dub2-panel), #18130e);
  border: 1px solid var(--dub2-edge); box-shadow: inset 0 1px 0 rgba(255,236,200,.04); min-width: 0; }
.dub2-mod::before { content: ''; position: absolute; left: 10px; top: 0; width: 22px; height: 2px; border-radius: 0 0 2px 2px; background: var(--m); box-shadow: 0 0 8px color-mix(in srgb, var(--m) 60%, transparent); }
.dub2-mod-h { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px; min-height: 22px; }
.dub2-mod-h h4 { margin: 0; font: 650 12.5px/1 var(--font); color: var(--dub2-cream); white-space: nowrap; }
.dub2-mod.skank { --m: var(--dub2-green); } .dub2-mod.siren { --m: var(--dub2-red); } .dub2-mod.dub { --m: var(--dub2-gold); } .dub2-mod.pull { --m: var(--dub2-cream); }
.dub2-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 2px 0; }
.dub2-mod .uk-knob { width: 48px; }
.dub2-mod .uk-knob-arc { stroke: var(--m); filter: drop-shadow(0 0 2px color-mix(in srgb, var(--m) 70%, transparent)); }
.dub2-mod .uk-knob-track { stroke: #33291e; }
.dub2-mod .uk-knob-dot { fill: var(--dub2-cream); }
.dub2-mod .uk-knob-val { color: var(--dub2-cream); font-size: 10px; }
.dub2-mod .uk-knob-label { color: var(--dub2-dim); font-size: 10px; font-weight: 500; }
.dub2 .uk-seg { border-color: var(--dub2-edge); border-radius: 6px; background: #120e0a; }
.dub2 .uk-seg button { background: transparent; color: var(--dub2-dim); border-right-color: var(--dub2-edge); font: 500 10.5px var(--font); padding: 4px 7px; }
.dub2 .uk-seg button.on { background: color-mix(in srgb, var(--m, var(--dub2-gold)) 22%, #1a140e); color: var(--dub2-cream); box-shadow: inset 0 -2px 0 var(--m, var(--dub2-gold)); font-weight: 650; }
.dub2 .uk-field { display: flex; flex-direction: column; gap: 3px; } .dub2 .uk-field > span { font: 500 10px var(--font); color: var(--dub2-dim); text-transform: none; letter-spacing: 0; }
.dub2-ctl { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
.dub2-ctl .uk-seg { display: flex; } .dub2-ctl .uk-seg button { flex: 1; white-space: nowrap; }
.dub2-chords { flex: 1; min-width: 0; align-self: center; } .dub2-chords .uk-select { width: 100%; }
.dub2-mod canvas { display: block; }
.dub2-tank { width: 100%; border-radius: 6px; background: #0d0a07; box-shadow: inset 0 1px 3px rgba(0,0,0,.7); margin: 2px 0 4px; }
.dub2-dubgrid { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: end; }
.dub2-win { position: relative; height: 26px; margin: 2px 0 6px; border-radius: 6px; background: repeating-linear-gradient(90deg, rgba(255,230,190,.06) 0 1px, transparent 1px 12.5%), #0d0a07; box-shadow: inset 0 1px 3px rgba(0,0,0,.7); overflow: hidden; }
.dub2-win-fill { position: absolute; right: 0; top: 0; bottom: 0; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--dub2-cream) 22%, transparent)); border-left: 2px solid var(--dub2-cream); transition: width .15s; }
.dub2-win-txt { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font: 500 10.5px var(--font); color: var(--dub2-dim); }
.dub2.pulling .dub2-win-fill { animation: dub2-pullback .9s ease-in forwards; border-color: var(--dub2-gold); }
@keyframes dub2-pullback { to { transform: translateX(-100%); opacity: .2; } }
.dub2-sep { width: 1px; align-self: stretch; margin: 4px 6px; background: var(--dub2-edge); }
.dub2-foot { font: 400 11px/1.45 var(--font); color: var(--dub2-faint); }
.dub2-foot .uk-hint { color: var(--dub2-dim); font-size: 11px; }
.dub2-foot .uk-btn { padding: 0 6px; }
@container (max-width: 560px) {
  .dub2-hero { grid-template-columns: 104px minmax(0, 1fr) 128px; gap: 8px; }
  .dub2-pad b { font-size: 16px; } .dub2-pad small { display: none; }
  .dub2-desk, .dub2-desk.b { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) { .dub2-pad, .dub2-pad::after, .dub2-toast { transition: none; } .dub2-pad.on::after, .dub2-pad .dub2-ripple, .dub2-pad.pull.spin svg { animation: none !important; } }
`;
  function ensureStyle() {
    if (document.getElementById('dub-style')) return;
    const s = document.createElement('style'); s.id = 'dub-style'; s.textContent = CSS; document.head.appendChild(s);
  }

  OrganismFactory.reg('eravos.dub-station', function (view) {
    ensureStyle();
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
    const ctl = (k, o) => UI.paramControl(view, cfg(k), o || { size: 32 });
    const css = (name) => parseFloat(getComputedStyle(view.root).getPropertyValue(name)) || 0;
    view.root.classList.add('dub2');
    const live = UI.alive(view, { events: ['rewound'], accent: '#f0b429' });
    const an = view.tap('out', 1024), td = new Float32Array(1024);

    // ---------------------------------------------------------------- speaker box (canvas): horn + 15" cone
    const cab = UI.Canvas(114, 150); let lvl = 0, exc = 0;
    UI.loop(cab, () => {
      const g = cab.g; cab.fit(); const W = cab.W, H = 150;
      an.getFloatTimeDomainData(td); let pk = 0, sq = 0; for (let i = 0; i < td.length; i++) { const a = Math.abs(td[i]); if (a > pk) pk = a; sq += td[i] * td[i]; }
      lvl = Math.max(Math.min(1, pk * 1.3), lvl * 0.88);
      const fl = css('--flash'), rms = Math.min(1, Math.sqrt(sq / td.length) * 4);
      exc += (td[0] * 3 - exc) * 0.5; // the cone follows the waveform a little — it moves, not just glows
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#0c0907'; g.fillRect(0, 0, W, H);
      // baffle grain
      g.fillStyle = 'rgba(255,240,210,0.018)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
      // horn (tweeter): a rectangular flare
      const hx = W / 2, hy = 24, hw = Math.min(W - 16, 96), hh = 30;
      const hg = g.createLinearGradient(0, hy - hh / 2, 0, hy + hh / 2); hg.addColorStop(0, '#2a2219'); hg.addColorStop(0.5, '#0a0806'); hg.addColorStop(1, '#2a2219');
      g.fillStyle = '#050403'; roundRect(g, hx - hw / 2 - 3, hy - hh / 2 - 3, hw + 6, hh + 6, 6); g.fill();
      g.fillStyle = hg; roundRect(g, hx - hw / 2, hy - hh / 2, hw, hh, 4); g.fill();
      g.strokeStyle = 'rgba(255,230,190,0.06)'; g.lineWidth = 1; for (let k = 1; k <= 4; k++) { const f = k / 5; roundRect(g, hx - hw / 2 * f, hy - hh / 2 * f, hw * f, hh * f, 3); g.stroke(); }
      g.fillStyle = `rgba(240,180,41,${0.15 + Math.min(1, rms * 1.4) * 0.75})`; g.fillRect(hx - 9, hy - 2, 18, 4);
      // woofer
      const cx = W / 2, cy = 92, R = Math.min(W / 2 - 8, 46), push = lvl * 0.07 + exc * 0.02;
      g.fillStyle = '#050403'; g.beginPath(); g.arc(cx, cy, R + 5, 0, 7); g.fill();
      // mounting bolts
      g.fillStyle = '#3d3122'; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; g.beginPath(); g.arc(cx + Math.cos(a) * (R + 1.5), cy + Math.sin(a) * (R + 1.5), 1.3, 0, 7); g.fill(); }
      // surround (rubber roll)
      const sr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.7, cx, cy, R);
      sr.addColorStop(0, '#1a1510'); sr.addColorStop(0.6, '#2c241a'); sr.addColorStop(1, '#0a0806');
      g.fillStyle = sr; g.beginPath(); g.arc(cx, cy, R - 1, 0, 7); g.fill();
      // cone
      const Rc = R * 0.84 * (1 + push * 0.25);
      const cg = g.createRadialGradient(cx - Rc * 0.25 - push * 20, cy - Rc * 0.3 - push * 20, Rc * 0.1, cx, cy, Rc);
      cg.addColorStop(0, `rgb(${58 + lvl * 30},${48 + lvl * 20},${36 + lvl * 8})`); cg.addColorStop(0.55, '#1a150f'); cg.addColorStop(1, '#0d0a07');
      g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, Rc, 0, 7); g.fill();
      // cone ridges catch the light as it moves
      g.lineWidth = 1; for (let k = 1; k <= 3; k++) { g.strokeStyle = `rgba(255,220,170,${0.03 + lvl * 0.06})`; g.beginPath(); g.arc(cx, cy, Rc * (0.45 + k * 0.15), 0, 7); g.stroke(); }
      // ring light: gold glow that blooms with level, red kiss on events
      g.strokeStyle = `rgba(240,180,41,${0.12 + lvl * 0.7})`; g.lineWidth = 1.5 + lvl * 2; g.shadowColor = 'rgba(240,180,41,0.9)'; g.shadowBlur = 4 + lvl * 16;
      g.beginPath(); g.arc(cx, cy, R + 2.5, 0, 7); g.stroke(); g.shadowBlur = 0;
      if (fl > 0.02) { g.strokeStyle = `rgba(226,72,58,${fl * 0.8})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R + 2.5 + fl * 4, 0, 7); g.stroke(); }
      // dust cap (brass)
      const dr = R * 0.3 * (1 + push * 0.6);
      const dg = g.createRadialGradient(cx - dr * 0.35, cy - dr * 0.4, dr * 0.1, cx, cy, dr);
      dg.addColorStop(0, '#f6d78d'); dg.addColorStop(0.4, '#c8952f'); dg.addColorStop(1, '#4a3413');
      g.fillStyle = dg; g.beginPath(); g.arc(cx, cy, dr, 0, 7); g.fill();
      // reflex port
      g.fillStyle = '#030202'; roundRect(g, W / 2 - 22, H - 9, 44, 5, 2.5); g.fill();
    }, 40);
    function roundRect(g, x, y, w, hh, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    const cabEl = h('div', { class: 'dub2-cab', title: 'the speaker moves with what this window plays' }, [cab]);

    // ---------------------------------------------------------------- performance pads (hold behaviour preserved)
    const pads = {};
    const pad = (key, label, sub, kbd, cls, down, up, title, extra) => {
      const b = h('button', { class: 'dub2-pad ' + cls, title, 'aria-label': `${label} — ${title}` }, [h('b', { text: label }), h('small', { text: sub }), h('kbd', { text: kbd })].concat(extra || []));
      const press = (e) => { b.classList.add('on'); live.hit(0.7); down(e || {}); };
      const release = () => { if (!b.classList.contains('on')) return; b.classList.remove('on'); if (up) up(); };
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); press(e); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, (e) => { e.stopPropagation(); release(); }));
      b.addEventListener('click', (e) => e.stopPropagation());
      // Space / Enter on a focused pad acts like a finger on it
      b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); press(e); } });
      b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); release(); } });
      pads[key] = { el: b, press, release };
      return b;
    };
    const tapFlash = (b) => setTimeout(() => b.classList.remove('on'), 160);
    const rewindIcon = () => { const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
      const p = document.createElementNS(ns, 'path'); p.setAttribute('d', 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4'); s.appendChild(p); return s; };
    let spinT = 0;
    const padEl = h('div', { class: 'dub2-pads' }, [
      pad('s', 'SIREN', 'hold to wail', 'S', 'siren', () => view.emit('siren', { on: true }), () => view.emit('siren', { on: false }), 'hold to wail (S)'),
      pad('h', 'HORN', 'tap · shift for three', 'H', 'horn', (e) => { view.emit('horn', { times: e.shiftKey ? 3 : 1 }); tapFlash(pads.h.el); }, null, 'air horn — shift for three (H)'),
      pad('t', 'THROW', 'hold: all into the echo', 'T', 'throw', () => view.emit('throw', { on: true }), () => view.emit('throw', { on: false }), 'hold: everything into the echo (T)',
        [h('span', { class: 'dub2-ripple' }), h('span', { class: 'dub2-ripple r2' }), h('span', { class: 'dub2-ripple r3' })]),
      pad('p', 'PULL UP', 'rewind the riddim', 'P', 'pull', () => { view.emit('rewind'); tapFlash(pads.p.el); spin(); }, null, 'rewind the last seconds and bring it back from the top (P)', [rewindIcon()]),
    ]);
    function spin() { const b = pads.p.el; b.classList.add('spin'); view.root.classList.remove('pulling'); void view.root.offsetWidth; view.root.classList.add('pulling'); clearTimeout(spinT); spinT = setTimeout(() => { b.classList.remove('spin'); view.root.classList.remove('pulling'); }, (view.state.rewindLen || 3) * 1000 * 0.6 + 400); }
    view.bind('sirenRate', (v) => view.root.style.setProperty('--dub2-rate', String(Math.max(0.5, Math.min(16, v)))));

    // ---------------------------------------------------------------- the BIG KNOB
    const big = ctl('bigKnob', { big: true, size: 104 });
    const bigVal = h('div', { class: 'dub2-bk-val' });
    view.bind('bigKnob', (v) => { bigVal.textContent = v <= 21 ? 'wide open' : `cuts below ${UI.fmt(v, cfg('bigKnob'))} Hz`; });
    const knobWell = h('div', { class: 'dub2-knobwell' }, [h('div', { class: 'dub2-bk' }, [h('i', { class: 'dub2-bk-plate' }), h('i', { class: 'dub2-bk-skirt' }), big.el]), h('div', { class: 'dub2-bk-name', text: 'Big knob' }), bigVal]);

    // ---------------------------------------------------------------- header
    const toast = h('div', { class: 'dub2-toast', role: 'status', 'aria-live': 'polite' }); let toastT = 0;
    view.on('rewound', (r) => { toast.textContent = `Wheel up — ${r.seconds.toFixed(1)} s pulled back`; toast.classList.add('show'); spin(); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2600); });
    const head = h('div', { class: 'dub2-head' }, [UI.presetBar(view), toast]);

    // ---------------------------------------------------------------- desk modules
    const mod = (cls, title, right, body) => h('section', { class: 'dub2-mod ' + cls, 'aria-label': title }, [h('div', { class: 'dub2-mod-h' }, [h('h4', { text: title })].concat(right || [])), ...body]);
    const row = (keys, o) => h('div', { class: 'dub2-row' }, keys.map(k => ctl(k, o).el));
    const skOn = ctl('skankOn'); skOn.el.textContent = 'On'; skOn.el.setAttribute('aria-label', 'Skank on — plays the offbeat while the transport runs');
    const skank = mod('skank', 'Skank', [skOn.el], [
      h('div', { class: 'dub2-ctl' }, [ctl('skankStyle', { segMax: 3, noLabel: true }).el]),
      h('div', { class: 'dub2-row', style: { flexWrap: 'nowrap', gap: '8px' } }, [h('div', { class: 'dub2-chords' }, [ctl('prog', { segMax: 0 }).el]), ctl('skankTone').el, ctl('skankLevel').el]),
    ]);
    // the siren's pitch over two seconds: shape × rate × depth, climbing by Rise — it scrolls while the siren wails
    const wail = UI.Canvas(300, 34, 'dub2-tank'); let wailT = 0, held0 = 0;
    UI.loop(wail, (t) => {
      const g = wail.g; wail.fit(); const W = wail.W, H = 34, s = view.state, on = pads.s.el.classList.contains('on');
      if (on && !held0) held0 = t; if (!on) held0 = 0; wailT = on ? (t - held0) / 1000 : 0;
      g.clearRect(0, 0, W, H);
      const rate = s.sirenRate || 3, depth = (s.sirenDepth || 0) / 24, rise = (s.sirenRise || 0) / 24, shape = s.sirenShape || 'square';
      const lfo = (ph) => { const f = ph - Math.floor(ph); return shape === 'sine' ? Math.sin(f * Math.PI * 2) : shape === 'square' ? (f < 0.5 ? 1 : -1) : shape === 'saw up' ? f * 2 - 1 : 1 - f * 2; };
      g.strokeStyle = 'rgba(255,230,190,0.05)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, H / 2 + 0.5); g.lineTo(W, H / 2 + 0.5); g.stroke();
      g.strokeStyle = on ? '#e2483a' : 'rgba(226,72,58,0.55)'; g.lineWidth = on ? 1.8 : 1.3; if (on) { g.shadowColor = '#e2483a'; g.shadowBlur = 8; }
      g.beginPath();
      for (let x = 0; x <= W; x += 1) { const sec = x / W * 2 + wailT; const climb = Math.min(1, sec / 2) * rise; const y = H / 2 - (lfo(sec * rate) * depth * 0.5 + climb * 0.5 - rise * 0.25) * (H - 8); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.shadowBlur = 0;
    }, 30);
    const siren = mod('siren', 'Siren & horn', [ctl('sirenShape', { segMax: 4, noLabel: true }).el], [
      wail, row(['sirenPitch', 'sirenRate', 'sirenDepth', 'sirenRise', 'sirenLevel', 'hornLevel']),
    ]);
    // spring & echo: a little tank that shows the repeats (spacing = echo time, height = feedback, glow = sweep)
    const tank = UI.Canvas(220, 40, 'dub2-tank'); let throwOn = 0, wob = 0;
    const DIV = { '1/4': 1, '1/8.': 0.75, '3/16': 0.75, '1/2': 2, '1/8': 0.5 };
    UI.loop(tank, (t) => {
      const g = tank.g; tank.fit(); const W = tank.W, H = 40, s = view.state;
      const thr = pads.t.el.classList.contains('on') ? 1 : 0; throwOn += (thr - throwOn) * 0.15;
      g.clearRect(0, 0, W, H);
      // spring coil on the left third, jiggling with the output
      const cw = Math.min(90, W * 0.36), sp = s.spring || 0; wob = Math.max(lvl, wob * 0.93);
      g.strokeStyle = `rgba(217,164,65,${0.25 + sp * 0.6})`; g.lineWidth = 1.2; g.beginPath();
      for (let x = 0; x <= cw; x += 1) { const ph = x * 0.9 + t * 0.012 * (0.5 + wob * 3); const y = H / 2 + Math.sin(ph) * (5 + wob * sp * 9) * Math.sin(Math.PI * x / cw); x ? g.lineTo(6 + x, y) : g.moveTo(6 + x, y); }
      g.stroke();
      g.fillStyle = '#3d3122'; g.fillRect(3, H / 2 - 5, 3, 10); g.fillRect(cw + 6, H / 2 - 5, 3, 10);
      // echo repeats
      const x0 = cw + 20, span = W - x0 - 6, gap = Math.max(6, span / 12 * (DIV[s.echoDiv] || 0.75) * 1.4);
      const fb = Math.min(1.08, s.echoFeedback || 0), send = Math.min(1, (s.echo || 0) + throwOn * 0.8);
      const hue = 18 + Math.min(1, Math.log((s.echoSweep || 1400) / 150) / Math.log(40)) * 110; // red-ish (dark) → green-ish (bright)
      let a = 0.25 + send * 0.75;
      for (let i = 0, x = x0; x < W - 4 && i < 40; i++, x += gap) {
        const hh = Math.max(2, (H - 10) * Math.min(1, a) * (0.55 + lvl * 0.45));
        g.fillStyle = `hsla(${hue},78%,${48 + throwOn * 12}%,${0.25 + Math.min(1, a) * 0.75})`;
        g.fillRect(x, (H - hh) / 2, 3, hh); a *= Math.max(0.05, fb);
        if (a < 0.03) break;
      }
    }, 30);
    const dub = mod('dub', 'Spring & echo', [ctl('echoDiv', { segMax: 5, noLabel: true }).el], [
      tank, row(['spring', 'echo', 'echoFeedback', 'echoSweep']),
    ]);
    const winFill = h('i', { class: 'dub2-win-fill' }), winTxt = h('span', { class: 'dub2-win-txt' });
    view.bind('rewindLen', (v) => { winFill.style.width = (v / 8 * 100).toFixed(1) + '%'; winTxt.textContent = `last ${v.toFixed(1)} s of 8`; });
    const pull = mod('pull', 'Pull up & out', [ctl('rewindRestart').el], [
      h('div', { class: 'dub2-win', title: 'how much of what you just heard gets pulled back' }, [winFill, winTxt]),
      h('div', { class: 'dub2-row' }, [ctl('rewindLen').el, h('div', { class: 'dub2-sep' }), ctl('level').el]),
    ]);

    // ---------------------------------------------------------------- keys (S siren · H horn · T throw · P pull up)
    view.root.tabIndex = 0;
    const held = {};
    view.root.addEventListener('keydown', (e) => {
      if (e.repeat || /input|select|textarea/i.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 's') { pads.s.press(e); held.s = 1; }
      else if (k === 'h') pads.h.press(e);
      else if (k === 't') { pads.t.press(e); held.t = 1; }
      else if (k === 'p') pads.p.press(e);
      else return;
      e.preventDefault(); e.stopPropagation();
    });
    view.root.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 's' && held.s) { pads.s.release(); held.s = 0; }
      if (k === 't' && held.t) { pads.t.release(); held.t = 0; }
    });

    const routing = UI.audioRouting(view, { emptyIn: 'Wire a riddim in (drums, bass) to dub it through the big knob, spring and echo.' }).el;
    view.root.append(
      head,
      h('div', { class: 'dub2-hero' }, [cabEl, padEl, knobWell]),
      h('div', { class: 'dub2-desk' }, [skank, siren]),
      h('div', { class: 'dub2-desk b' }, [dub, pull]),
      h('div', { class: 'dub2-foot' }, [routing]),
    );
  });
})();
