/* 3.39 — "the bass drop tool must make her voice or clip a priority over the other sounds".
 * Drop Builder's vocal joins the master AFTER the ducks (bus 'priority'); while she speaks, everything else dips under
 * her clip's own loudness envelope (K.audio.duckUnder). Measured: a steady bed (the rest of the mix) against a two-word clip. */
window.__phase = 'P42';
describe('Drop Builder 3.1 — her voice on top', () => {
  const SR = TH.SR, WORD = [[0.10, 0.45], [0.75, 1.10]];   // two "words" (seconds inside the clip), silence between
  function clipWav() {
    const len = Math.round(1.3 * SR), b = new AudioBuffer({ numberOfChannels: 1, length: len, sampleRate: SR }), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) { const t = i / SR; if (WORD.some(([a, z]) => t >= a && t < z)) d[i] = 0.5 * Math.sin(2 * Math.PI * 1000 * t); }
    return AudioRecorder.encodeWAV(b, 16);
  }
  // L = the bed after the master ducks (the rest of the mix) · R = her vocal port. tension/build/pause/drop = 1/1/1/1 bars at 120.
  async function rig(priority) {
    const secs = 9, U = TH.universe(secs, { bpm: 120 }), a = TH.spawn(U, 'eravos.bass-drop-builder'), c = OrganismFactory.handle(a).ctx, ac = U.ctx, ch = U.K.audio.chain;
    ['tensionBars', 'buildBars', 'pauseBars', 'dropBars'].forEach(k => c.params.set(k, 1));
    c.params.set('vocalPriority', priority); c.params.set('vocalEndOnDrop', true); c.params.set('stutter', 0); c.params.set('throw', 0); c.params.set('vocalHpf', 20);
    const asset = U.K.assets.register(clipWav(), { name: 'her.wav', mime: 'audio/wav' }); await c.loadVocalHash(asset.hash, 'her.wav');
    U.K.audio.port(a, 'fx').node.disconnect();                                  // its own FX out of the way: the bed is the only "other sound"
    const bed = ac.createOscillator(); bed.frequency.value = 60; const bg = ac.createGain(); bg.gain.value = 0.25; bed.connect(bg); bg.connect(ch.masterIn); bed.start(0);
    ch.out.disconnect(ac.destination);
    const m = ac.createChannelMerger(2), bedTap = ac.createGain(), voxTap = ac.createGain(); bedTap.channelCount = 1; bedTap.channelCountMode = 'explicit'; voxTap.channelCount = 1; voxTap.channelCountMode = 'explicit';
    ch.vduck.connect(bedTap); U.K.audio.port(a, 'vocal').node.connect(voxTap); bedTap.connect(m, 0, 0); voxTap.connect(m, 0, 1); m.connect(ac.destination);
    c.arm({ atStep: 0 }); U.T.renderTicks(0, 16 * 5, 0.05);
    const buf = await TH.render(U), b = c.bounds(0, 0.05, 60 / 120 / 4);
    const clipStart = b.DROP.ts - 1.3;   // End on DROP: the clip ends exactly on drop beat 1
    return { buf, clipStart, c, U };
  }
  const lvl = (buf, ch, from, to) => TH.db(TH.rms(buf, from, to, ch));
  it('her vocal port joins the master after the ducks (bus priority)', async () => {
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.bass-drop-builder');
    assert.equal(U.K.audio.port(a, 'vocal').bus, 'priority');
  });
  it('while she speaks the rest of the mix dips ~9 dB under each word, and comes back between words and after', async () => {
    const { buf, clipStart } = await rig(9);
    const before = lvl(buf, 0, clipStart - 0.6, clipStart - 0.2);
    const w1 = lvl(buf, 0, clipStart + 0.2, clipStart + 0.4), w2 = lvl(buf, 0, clipStart + 0.85, clipStart + 1.05);
    const gap = lvl(buf, 0, clipStart + 0.62, clipStart + 0.68), after = lvl(buf, 0, clipStart + 2.6, clipStart + 3.0);
    assert.near(before - w1, 9, 0.6, `word 1 dip ${(before - w1).toFixed(2)} dB`); assert.near(before - w2, 9, 0.6, `word 2 dip ${(before - w2).toFixed(2)} dB`);
    assert.lt(before - gap, 4.5, `between words the bed comes back up (dip ${(before - gap).toFixed(2)} dB)`);
    assert.lt(Math.abs(before - after), 0.1, `after her clip the bed is back (diff ${(before - after).toFixed(3)} dB)`);
  });
  it('the dip leads the word (look-ahead): the bed is already down 10 ms into the first word', async () => {
    const { buf, clipStart } = await rig(9), before = lvl(buf, 0, clipStart - 0.6, clipStart - 0.2);
    assert.gt(before - lvl(buf, 0, clipStart + 0.11, clipStart + 0.13), 6);
  });
  it('her voice itself is never ducked: same level with priority 0 and 18 dB', async () => {
    const A = await rig(0), B = await rig(18), s = A.clipStart + 0.2, e = A.clipStart + 0.4;
    assert.lt(Math.abs(lvl(A.buf, 1, s, e) - lvl(B.buf, 1, s, e)), 0.05);
    assert.gt(lvl(A.buf, 1, s, e), -12, 'the vocal is actually there');
  });
  it('priority 0 leaves the mix alone', async () => {
    const { buf, clipStart } = await rig(0);
    assert.lt(Math.abs(lvl(buf, 0, clipStart - 0.6, clipStart - 0.2) - lvl(buf, 0, clipStart + 0.2, clipStart + 0.4)), 0.05);
  });
  it('Stop all releases the dip at once', async () => {
    const secs = 4, U = TH.universe(secs, { bpm: 120 }), ch = U.K.audio.chain, ac = U.ctx;
    const len = SR, b = new AudioBuffer({ numberOfChannels: 1, length: len, sampleRate: SR }); b.getChannelData(0).fill(0.5);
    U.K.audio.duckUnder(b, [{ t: 0.5, offset: 0, duration: 1 }], { depthDb: -12 }); U.K.silence({ hard: true, time: 0.8 });
    const bed = ac.createOscillator(); bed.frequency.value = 200; const bg = ac.createGain(); bg.gain.value = 0.25; bed.connect(bg); bg.connect(ch.masterIn); bed.start(0);
    ch.out.disconnect(ac.destination); ch.vduck.connect(ac.destination);
    const buf = await TH.render(U);
    assert.lt(Math.abs(TH.db(TH.rms(buf, 1.0, 1.4)) - TH.db(TH.rms(buf, 0.1, 0.4))), 0.2, 'back to full level 0.2 s after Stop');
  });
});
