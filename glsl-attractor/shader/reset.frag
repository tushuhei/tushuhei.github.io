precision mediump float;
uniform vec2  resolution;

void main(){
  vec2 p = gl_FragCoord.st / resolution;
  gl_FragColor = vec4(normalize(vec3(p.x, p.y, 0)), 0.0);
}
