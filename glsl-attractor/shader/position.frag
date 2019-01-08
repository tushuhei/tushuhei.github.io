precision mediump float;
uniform sampler2D prevTexture;
uniform vec2 resolution;
uniform float a;
const float b = -2.0;
const float c = 1.5;
const float d = -1.5;

void main(){
  vec2 coord = gl_FragCoord.st / resolution;
  vec4 prevPosition = texture2D(prevTexture, coord);
  float x = sin(a * prevPosition.y) - cos(b * prevPosition.x);
  float y = sin(c * prevPosition.x) - cos(d * prevPosition.y);
  gl_FragColor = vec4(x, y, prevPosition.z, prevPosition.w);
}
