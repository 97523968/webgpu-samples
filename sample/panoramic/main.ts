import { mat4, vec3 } from 'wgpu-matrix';

import {
  cubeVertexArray,
  cubeVertexSize,
  cubeUVOffset,
  cubePositionOffset,
  cubeVertexCount,
} from './mesh';

import basicVertWGSL from './basic.vert.wgsl';
import sampleCubemapWGSL from './sampleCubemap.frag.wgsl';
import { quitIfWebGPUNotAvailable } from '../util';

// Set video element
const video = document.createElement('video');
video.loop = true;
video.playsInline = true;
video.autoplay = true;
video.muted = true;
video.src = '../../assets/video/0178.mp4';
await video.play();

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter?.requestDevice();
quitIfWebGPUNotAvailable(adapter, device);

const context = canvas.getContext('webgpu') as GPUCanvasContext;

const devicePixelRatio = window.devicePixelRatio;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device,
  format: presentationFormat,
});

// Create a vertex buffer from the cube data.
const verticesBuffer = device.createBuffer({
  size: cubeVertexArray.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true,
});
new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
verticesBuffer.unmap();

const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: device.createShaderModule({
      code: basicVertWGSL,
    }),
    buffers: [
      {
        arrayStride: cubeVertexSize,
        attributes: [
          {
            // position
            shaderLocation: 0,
            offset: cubePositionOffset,
            format: 'float32x4',
          },
          {
            // uv
            shaderLocation: 1,
            offset: cubeUVOffset,
            format: 'float32x2',
          },
        ],
      },
    ],
  },
  fragment: {
    module: device.createShaderModule({
      code: sampleCubemapWGSL,
    }),
    targets: [
      {
        format: presentationFormat,
      },
    ],
  },
  primitive: {
    topology: 'triangle-list',

    // Since we are seeing from inside of the cube
    // and we are using the regular cube geomtry data with outward-facing normals,
    // the cullMode should be 'front' or 'none'.
    cullMode: 'none',
  },
});

const uniformBufferSize = 4 * 16; // 4x4 matrix
const uniformBuffer = device.createBuffer({
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const sampler = device.createSampler({
  addressModeU: 'repeat',
  addressModeV: 'repeat',
  magFilter: 'linear',
  minFilter: 'linear',
});

const aspect = canvas.width / canvas.height;
const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 3000);

const modelMatrix = mat4.scaling(vec3.fromValues(1000, 1000, 1000));
const modelViewProjectionMatrix = mat4.create();
const viewMatrix = mat4.identity();

const tmpMat4 = mat4.create();

// Comppute camera movement:
// It rotates around Y axis with a slight pitch movement.
function updateTransformationMatrix() {
  const now = Date.now() / 800;

  mat4.rotate(
    viewMatrix,
    vec3.fromValues(1, 0, 0),
    (Math.PI / 10) * Math.sin(now),
    tmpMat4
  );
  mat4.rotate(tmpMat4, vec3.fromValues(0, 1, 0), /*now * 0.2*/ Math.PI/2, tmpMat4);

  mat4.multiply(tmpMat4, modelMatrix, modelViewProjectionMatrix);
  mat4.multiply(
    projectionMatrix,
    modelViewProjectionMatrix,
    modelViewProjectionMatrix
  );
}

/*
function frame() {
  updateTransformationMatrix();
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    modelViewProjectionMatrix.buffer,
    modelViewProjectionMatrix.byteOffset,
    modelViewProjectionMatrix.byteLength
  );

  const externalTextureSource = new VideoFrame(video);

  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: uniformBufferSize,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: device.importExternalTexture({
          source: externalTextureSource,
        }),
      },
    ],
  });

  const commandEncoder = device.createCommandEncoder();
  const textureView = context.getCurrentTexture().createView();

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: textureView,
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.setVertexBuffer(0, verticesBuffer);
  passEncoder.setBindGroup(0, uniformBindGroup);
  passEncoder.draw(cubeVertexCount);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);

  if (externalTextureSource instanceof VideoFrame) {
    externalTextureSource.close();
  }

  video.requestVideoFrameCallback(frame);
}
*/

function frame() {
  updateTransformationMatrix();
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    modelViewProjectionMatrix.buffer,
    modelViewProjectionMatrix.byteOffset,
    modelViewProjectionMatrix.byteLength
  );

  const externalTextureSource = new VideoFrame(video);

  const sphereTexture = device.createTexture({
    dimension: '2d',
    // Create a 2d array texture.
    // Assume each image has the same size.
    size: [externalTextureSource.codedWidth, externalTextureSource.codedHeight, 1],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture({
    source: externalTextureSource,
  }, {
    texture: sphereTexture,
    origin: [0, 0, 0],
  }, [externalTextureSource.codedWidth, externalTextureSource.codedHeight, 1])

  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: uniformBufferSize,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: sphereTexture.createView(),
      },
    ],
  });

  const commandEncoder = device.createCommandEncoder();
  const textureView = context.getCurrentTexture().createView();

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: textureView,
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.setVertexBuffer(0, verticesBuffer);
  passEncoder.setBindGroup(0, uniformBindGroup);
  passEncoder.draw(cubeVertexCount);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);

  if (externalTextureSource instanceof VideoFrame) {
    externalTextureSource.close();
  }

  video.requestVideoFrameCallback(frame);
}

video.requestVideoFrameCallback(frame);
