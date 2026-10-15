/* ERAVOS video domain — domain.js: the Video Editing mode, and dropped video files open in Video Clip. */
(function (global) {
  'use strict';
  const VID = /\.(mp4|m4v|webm|mov|mkv|ogv)$/i;
  if (global.Intake && global.Intake.defineHandler) global.Intake.defineHandler({
    id: 'video.video-file', domain: 'video', asset_type: 'video',
    match: (name, mime) => VID.test(name) || /^video\//.test(mime || ''),
    handle({ K, name, pos, asset }) {
      const id = global.OrganismFactory.spawn('eravos.video.video-clip', Object.assign({ K }, pos));
      if (id) K.bus.publish('ui:open_asset:' + id, { hash: asset.hash, name });
      return { kind: 'video', instanceId: id, asset };
    },
  });
  global.Kernel.use({
    id: 'video', version: '1.0.0', label: 'Video Editing', requires: ['dataflow'],
    install() {},
    shell(S) {
      if (typeof S.mode !== 'function') return;
      S.mode({ id: 'video', domain: 'video', label: 'Video Editing', icon: '🎬', accent: '#ff8fab', units: [], categories: ['Video', 'Image'],
        brand: { tagline: 'Clips you can wire: trim, play on the beat, grab frames into image tools, export.' },
        blurb: 'Open a video, scrub and trim it, play it locked to the song, send frames to Image Adjust, export the cut.' });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
