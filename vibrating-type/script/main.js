const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const pathElement = document.getElementById('path');

const gl = canvas.getContext('webgl');
const ext = getWebGLExtensions();

let scenePrg;
let startTime;
let nowTime;

loadShaderSource(
  './shader/scene.vert',
  './shader/scene.frag',
  (shader) => {
    let vs = createShader(shader.vs, gl.VERTEX_SHADER);
    let fs = createShader(shader.fs, gl.FRAGMENT_SHADER);
    let prg = createProgram(vs, fs);
    scenePrg = new ProgramParameter(prg);
    init();
  }
);

function init() {
  opentype.load('./hiragana.otf', function(err, font) {
    if (err) {
      alert('Could not load font: ' + err);
    } else {
      const path = font.getPath('あ');
      const numSegments = path.commands.filter((c) => c.type == 'Z').length;
      pathElement.setAttribute('d', path.toPathData());
      const totalLength = pathElement.getTotalLength();
      const bbox = path.getBoundingBox();
      const steps = 200;
      let points = [];
      let distances = [];
      let spikes = [];
      for (let i = 0; i < steps; i++) {
        let point = pathElement.getPointAtLength(i / steps * totalLength);
        let x = (point.x - bbox.x1) / (bbox.x2 - bbox.x1) * 2 - 1;
        let y = -((point.y - bbox.y1) / (bbox.y2 - bbox.y1) * 2 - 1);
        if (i > 0) {
          let diff = Math.hypot(
            points[points.length - 2] - x,
            points[points.length - 1] - y);
          distances.push(diff);
        }
        points.push(x);
        points.push(y);
      }
      for (let i = 0; i < numSegments - 1; i++) {
        let idx = distances.indexOf(Math.max(...distances));
        spikes.push(idx + 1);
        distances[idx] = -1;
      }

      scenePrg.attLocation[0] = gl.getAttribLocation(scenePrg.program, 'position');
      scenePrg.attStride[0] = 2;
      scenePrg.uniLocation[0] = gl.getUniformLocation(scenePrg.program, 'resolution');
      scenePrg.uniType[0] = 'uniform2fv';
      scenePrg.uniLocation[1] = gl.getUniformLocation(scenePrg.program, 'time');
      scenePrg.uniType[1] = 'uniform1f';
      scenePrg.uniLocation[2] = gl.getUniformLocation(scenePrg.program, 'points');
      scenePrg.uniType[2] = 'uniform1fv';
      scenePrg.uniLocation[3] = gl.getUniformLocation(scenePrg.program, 'spikes');
      scenePrg.uniType[3] = 'uniform1fv';

      let VBO = [
        createVbo([
          1.0, 1.0,
          -1.0, 1.0,
          1.0, -1.0,
          -1.0, -1.0,
        ]),
      ];
      let index = [
        0, 1, 2, 2, 3, 1
      ];
      let IBO = createIbo(index);

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      startTime = Date.now();
      nowTime = 0;
      render();

      function render() {
        nowTime = (Date.now() - startTime) / 1000;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(scenePrg.program);
        gl[scenePrg.uniType[0]](scenePrg.uniLocation[0], [canvas.width, canvas.height]);
        gl[scenePrg.uniType[1]](scenePrg.uniLocation[1], nowTime);
        gl[scenePrg.uniType[2]](scenePrg.uniLocation[2], points);
        gl[scenePrg.uniType[3]](scenePrg.uniLocation[3], spikes);
        setAttribute(VBO, scenePrg.attLocation, scenePrg.attStride, IBO);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
        gl.flush();
        requestAnimationFrame(render);
      }
    }
  });

}
