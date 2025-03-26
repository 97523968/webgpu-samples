struct Uniforms {
  time: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) fragUV : vec2f,
}

@vertex
fn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  const pos = array(
    vec2( 1.0,  1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0, -1.0),
    vec2( 1.0,  1.0),
    vec2(-1.0, -1.0),
    vec2(-1.0,  1.0),
  );

  const uv = array(
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
  );

  var output : VertexOutput;
  output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
  output.fragUV = uv[VertexIndex];
  return output;
}

// Define the ACES tonemapping function
// Comments on the matrices were originally written at <https://github.com/TheRealMJP/BakingLab/blob/master/BakingLab/ACES.hlsl>.
fn aces_tonemap(color: vec3<f32>) -> vec3<f32> {
    // sRGB -> XYZ -> D65_2_D60 -> AP1 -> RRT_SAT
    let m1 = mat3x3<f32>(
        vec3<f32>(0.59719, 0.07600, 0.02840),
        vec3<f32>(0.35458, 0.90834, 0.13383),
        vec3<f32>(0.04823, 0.01566, 0.83777)
    );

    // ODT_SAT -> XYZ -> D60_2_D65 -> sRGB
    let m2 = mat3x3<f32>(
        vec3<f32>(1.60475, -0.10208, -0.00327),
        vec3<f32>(-0.53108, 1.10813, -0.07276),
        vec3<f32>(-0.07367, -0.00605, 1.07602)
    );

    // Apply tone mapping
    let v = m1 * color;
    let a = v * (v + 0.0245786) - 0.000090537;
    let b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return clamp(m2 * (a / b), vec3f(0.0), vec3f(1.0));
}

@fragment
fn frag_main(@location(0) fragUV : vec2f) -> @location(0) vec4f {
  // Calculate the zero-centered position of the current fragment
  var pos = fragUV * 2.0 - 1.0;

  pos.x += uniforms.time;

  // Calculate the color of the current fragment
  var color = pow(sin(pos.x * 4.0 + vec3f(0.0, 1.0, 2.0) * 3.1415 * 2.0 / 3.0) * 0.5 + 0.5, vec3f(2.0)) * (exp(abs(pos.y) * 4.0) - 1.0);

  // Apply the ACES tonemapping if the position is above the x-axis
  if (pos.y > 0.0) {
    color = aces_tonemap(color);
  }

  return vec4f(color, 1.0);
}
