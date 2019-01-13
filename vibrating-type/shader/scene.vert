attribute vec2 position;
uniform float time;

void main(){
  float theta = atan(position.y, position.x);
  gl_Position = vec4(position.x + 0.01 * abs(position.x) * cos(50.0 * (theta + time)),
      position.y + 0.01 * abs(position.y) * sin(50.0 * (theta + time)) , 0, 1.0);
  gl_PointSize = 2.0;
}
