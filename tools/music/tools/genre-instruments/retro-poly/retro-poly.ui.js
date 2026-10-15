/* eravos.retro-poly UI — sunset grid horizon (signature) whose sun pulses with the output and whose grid scrolls at
 * the tempo, live spectrum, sections, arp row, keyboard. */
OrganismFactory.reg('eravos.retro-poly', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const an = view.tap('out', 1024), td = new Float32Array(1024); let lv = 0;
  const sun = UI.Canvas(520, 86); const t0 = performance.now();
  UI.loop(sun, () => {
    const g = sun.g; sun.fit(); const W = sun.W, H = 86, hz = H * 0.58; an.getFloatTimeDomainData(td); let pk = 0; for (let i = 0; i < td.length; i += 4) pk = Math.max(pk, Math.abs(td[i])); lv = Math.max(pk, lv * 0.92);
    const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#12002a'); sky.addColorStop(1, '#5a0f5e'); g.fillStyle = sky; g.fillRect(0, 0, W, hz);
    const r = 26 + lv * 10, cx = W / 2, cy = hz; const sg = g.createLinearGradient(0, cy - r, 0, cy); sg.addColorStop(0, '#ffe66d'); sg.addColorStop(1, '#ff2bd6'); g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.fill();
    g.fillStyle = '#12002a'; for (let i = 0; i < 5; i++) g.fillRect(cx - r, cy - 4 - i * 6, r * 2, 1.5 + i * 0.4);
    g.fillStyle = '#0a0014'; g.fillRect(0, hz, W, H - hz);
    const bpm = view.bpm || 120, ph = ((performance.now() - t0) / 1000 * bpm / 60) % 1;
    g.strokeStyle = 'rgba(255,43,214,.75)'; g.lineWidth = 1;
    for (let i = 0; i < 8; i++) { const z = (i + ph) / 8, y = hz + (H - hz) * z * z; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(cx + i * 8, hz); g.lineTo(cx + i * 60, H); g.stroke(); }
  }, 30);
  const sel = (k) => UI.paramControl(view, cfg(k), { segMax: 6 }).el;
  UI.instrumentPanel(view, { color: '#ff2bd6', low: 48, high: 72, height: 56,
    header: [sel('chorus'), UI.paramControl(view, cfg('mono')).el],
    top: [sun, h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap' } }, [h('span', { class: 'org-label', text: 'ARP' }), sel('arp'), sel('arpDiv'), UI.paramControl(view, cfg('arpHold')).el])],
    keys: ['saw', 'pulse', 'width', 'pwm', 'pwmRate', 'sub', 'noise', 'drift', 'octave', 'cutoff', 'res', 'envAmt', 'keytrack', 'hpf', 'fA', 'fD', 'fS', 'attack', 'decay', 'sustain', 'release', 'unison', 'glide', 'arpOct', 'arpGate', 'level'],
    hint: 'Arp needs the transport playing: hold keys (or Latch) and it steps through them on the grid. Mono + Unison + Glide = the outrun lead.' });
});
