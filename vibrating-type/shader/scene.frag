precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform float points[400];
uniform float spikes[100];

void main(){
  float red = 0.0;
  float blue = 0.0;
  float size = 0.01;
  float amp = 0.1;

  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  for (int i = 1; i < 200; i++) {
    vec2 point1 = vec2(points[2 * (i - 1)], points[2 * (i - 1) + 1]);
    vec2 point2 = vec2(points[2 * i], points[2 * i + 1]);
    float theta = atan(p.y, p.x);
    float b = - (point1.x - point2.x) / (point1.y - point2.y);
    float c = - point1.x - b * point1.y;
    float dist = abs(p.x + b * p.y + c) / sqrt(1.0 + b * b);
    float dist_blue = abs((p.x + 0.01 * cos(theta) * sin(100.0 * time)) + b * (p.y + 0.01 * sin(theta) * sin(100.0 * time)) + c) / sqrt(1.0 + b * b);
    vec2 center = (point1 + point2) / 2.0;
    float r = distance(point1, center);
    if (r < 0.3) {
      float filter = 1.0 - step(1.5 * r, distance(p, center));
      red += pow(size / dist, 2.0) * filter;
      blue += pow(size / dist_blue, 2.0) * filter;
    }
  }
  gl_FragColor = vec4(red, blue, red, 1.0);
}
