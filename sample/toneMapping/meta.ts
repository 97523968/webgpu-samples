export default {
  name: 'ACES Tone Mapping',
  description: 'This example shows how to do ACES tone mapping in WebGPU. It was originally written in WebGL at <https://www.shadertoy.com/view/XsGfWV>.',
  filename: __DIRNAME__,
  sources: [
    { path: 'main.ts' },
    { path: 'shaders.wgsl' },
  ],
};
