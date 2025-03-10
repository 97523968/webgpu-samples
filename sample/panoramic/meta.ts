export default {
  name: 'Panoramic',
  description:
    'This example shows how to render and sample from a panoramic texture. Panoramic image available under a Creative Commons Attribution license at <https://360sr.github.io/#ODV360>',
  filename: __DIRNAME__,
  sources: [
    { path: 'main.ts' },
    { path: 'basic.vert.wgsl' },
    { path: 'sampleCubemap.frag.wgsl' },
    { path: 'mesh.ts' },
  ],
};
