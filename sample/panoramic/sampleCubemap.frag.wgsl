@group(0) @binding(1) var mySampler: sampler;
/*
@group(0) @binding(2) var myTexture: texture_external;
*/
@group(0) @binding(2) var myTexture: texture_2d<f32>;

/*
@fragment
fn main(
  @location(0) fragUV: vec2f
) -> @location(0) vec4f {
  var uv = fragUV;
  if (uv.x > 1.0) {
    uv.x -= 1.0;
  }
  if (uv.y > 1.0) {
    uv.y -= 1.0;
  }
  return textureSampleBaseClampToEdge(myTexture, mySampler, uv);
}
*/

@fragment
fn main(
  @location(0) fragUV: vec2f
) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, fragUV);
}