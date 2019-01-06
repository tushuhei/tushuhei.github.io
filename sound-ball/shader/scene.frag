precision mediump float;
uniform vec2 resolution;
uniform float time;
uniform float meter;

void main(){
  float red = 0.0;
  float green = 0.0;
  float blue = 0.0;
  float theta = 0.0;
  float volume = max(meter, 0.01);

  // normalize
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  theta = atan(p.y, p.x);
  red = 0.1 / abs(length(p) - 0.5 + (volume * sin(3.0 * time) + 0.04) * sin(3.0 * theta + time)) - 2.0;
  green = 0.1 / abs(length(p) - 0.5 + (volume * sin(5.0 * time) + 0.05) * sin(3.0 * theta + time + 0.1)) - 2.0;
  blue = 0.1 / abs(length(p) - 0.5 + (volume * sin(2.0 * time) + 0.06) * sin(3.0 * theta + time - 0.3)) - 2.0;
  gl_FragColor = vec4(vec3(1.0-red, 1.0-green, 1.0-blue), 0.8);
}
