const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext('webgl');
const mat = new matIV();
const ext = getWebGLExtensions();

window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const resumeInstructionEle = document.querySelector('.instruction--resume');
const talkInstructionEle = document.querySelector('.instruction--talk');

const resumeBtn = document.getElementById('resume-button');
resumeBtn.onclick = function(e) {
  audioContext.resume();
  resumeInstructionEle.classList.add('hidden');
}

const closeBtn = document.getElementById('close-button');
closeBtn.onclick = function(e) {
  talkInstructionEle.classList.add('hidden');
}

let scenePrg;
let startTime;
let nowTime;

let meter = null;

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
    let p =navigator.mediaDevices.getUserMedia({
        'audio': {
          'mandatory': {
            'googEchoCancellation': 'false',
            'googAutoGainControl': 'false',
            'googNoiseSuppression': 'false',
            'googHighpassFilter': 'false'
          },
          'optional': []
        },
      });
  p.then(function(stream) {
    let mediaStreamSource = audioContext.createMediaStreamSource(stream);
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);
    if (audioContext.state == 'running') {
      resumeInstructionEle.classList.add('hidden');
    }
  });
  p.catch(function(e) { console.log(e.name); });

  scenePrg.attLocation[0] = gl.getAttribLocation(scenePrg.program, 'position');
  scenePrg.attStride[0] = 3;
  scenePrg.uniLocation[0] = gl.getUniformLocation(scenePrg.program, 'resolution');
  scenePrg.uniType[0] = 'uniform2fv';
  scenePrg.uniLocation[1] = gl.getUniformLocation(scenePrg.program, 'time');
  scenePrg.uniType[1] = 'uniform1f';
  scenePrg.uniLocation[2] = gl.getUniformLocation(scenePrg.program, 'meter');
  scenePrg.uniType[2] = 'uniform1f';

  let VBO = [
    createVbo([
      1.0, 1.0, 0.0,
      -1.0, 1.0, 0.0,
      1.0, -1.0, 0.0,
      -1.0, -1.0, 0.0,
    ]),
  ];
  // インデックス配列から IBO（Index Buffer Object）を生成しておく @@@
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
    gl[scenePrg.uniType[2]](scenePrg.uniLocation[2], meter ? meter.volume : 0.0);
    setAttribute(VBO, scenePrg.attLocation, scenePrg.attStride, IBO);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
    gl.flush();
    requestAnimationFrame(render);
  }
}
