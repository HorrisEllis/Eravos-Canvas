/* ERAVOS image domain — domain.js: the Image Manipulation mode, and dropped image files open in Image Adjust. */
(function (global) {
  'use strict';
  const IMG = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;
  if (global.Intake && global.Intake.defineHandler) global.Intake.defineHandler({
    id: 'image.image-file', domain: 'image', asset_type: 'image',
    match: (name, mime) => IMG.test(name) || /^image\//.test(mime || ''),
    handle({ K, name, pos, asset }) {
      const id = global.OrganismFactory.spawn('eravos.image.image-adjust', Object.assign({ K }, pos));
      if (id) K.bus.publish('ui:open_asset:' + id, { hash: asset.hash, name });
      return { kind: 'image', instanceId: id, asset };
    },
  });
  global.Kernel.use({
    id: 'image', version: '1.0.0', label: 'Image Manipulation', requires: ['dataflow'],
    install() {},
    shell(S) {
      if (typeof S.mode !== 'function') return;
      S.mode({ id: 'image', domain: 'image', label: 'Image Manipulation', icon: '🖼', accent: '#6ee7f2', units: [], categories: ['Image'],
        brand: { tagline: 'Pictures you can wire: adjust, crop, grade — and feed them to video, code or AI.' },
        blurb: 'Non-destructive exposure, colour, tone, crop and rotate with before/after, exported as PNG, JPEG or WebP.' });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
