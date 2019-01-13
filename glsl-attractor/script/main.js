/*
 * The De Jong Attractors
 * ref. https://www.algosome.com/articles/strange-attractors-de-jong.html
 */

const canvasElement = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext('webgl');
const mat = new matIV();
const ext = getWebGLExtensions();

const POINT_RESOLUTION = 512;
const POSITION_BUFFER_INDEX = 1;
const POINT_SIZE = 1.0;
const POINT_COLOR           = [0.1, 0.3, 0.6, 0.5];

let textures = [];
let loopCount = 0;
let resetPrg, scenePrg, positionPrg;

createTexture('./image/lenna.jpg', (textureObject) => {
  textures[0] = textureObject;

  loadShaderSource(
    './shader/scene.vert',
    './shader/scene.frag',
    (shader) => {
      let vs = createShader(shader.vs, gl.VERTEX_SHADER);
      let fs = createShader(shader.fs, gl.FRAGMENT_SHADER);
      let prg = createProgram(vs, fs);
      if (prg == null) return;
      scenePrg = new ProgramParameter(prg);
      loadCheck();
    }
  );
  loadShaderSource(
    './shader/reset.vert',
    './shader/reset.frag',
    (shader) => {
      let vs = createShader(shader.vs, gl.VERTEX_SHADER);
      let fs = createShader(shader.fs, gl.FRAGMENT_SHADER);
      let prg = createProgram(vs, fs);
      if (prg == null) return;
      resetPrg = new ProgramParameter(prg);
      loadCheck();
    }
  );
  loadShaderSource(
    './shader/position.vert',
    './shader/position.frag',
    (shader) => {
      let vs = createShader(shader.vs, gl.VERTEX_SHADER);
      let fs = createShader(shader.fs, gl.FRAGMENT_SHADER);
      let prg = createProgram(vs, fs);
      if (prg == null) return;
      positionPrg = new ProgramParameter(prg);
      loadCheck();
    }
  );
});

function loadCheck() {
  if (
    scenePrg != null &&
    resetPrg != null &&
    positionPrg != null) {
    init();
  }
}

function init() {
  scenePrg.attLocation[0] = gl.getAttribLocation(scenePrg.program, 'texCoord');
  scenePrg.attStride[0]   = 2;
  scenePrg.uniLocation[0] = gl.getUniformLocation(scenePrg.program, 'mvpMatrix');
  scenePrg.uniLocation[1] = gl.getUniformLocation(scenePrg.program, 'pointSize');
  scenePrg.uniLocation[2] = gl.getUniformLocation(scenePrg.program, 'positionTexture');
  scenePrg.uniLocation[3] = gl.getUniformLocation(scenePrg.program, 'globalColor');
  scenePrg.uniType[0]     = 'uniformMatrix4fv';
  scenePrg.uniType[1]     = 'uniform1f';
  scenePrg.uniType[2]     = 'uniform1i';
  scenePrg.uniType[3]     = 'uniform4fv';

  resetPrg.attLocation[0] = gl.getAttribLocation(resetPrg.program, 'position');
  resetPrg.attStride[0]   = 3;
  resetPrg.uniLocation[0] = gl.getUniformLocation(resetPrg.program, 'resolution');
  resetPrg.uniType[0]     = 'uniform2fv';

  positionPrg.attLocation[0] = gl.getAttribLocation(positionPrg.program, 'position');
  positionPrg.attStride[0]   = 3;
  positionPrg.uniLocation[0] = gl.getUniformLocation(positionPrg.program, 'prevTexture');
  positionPrg.uniLocation[1] = gl.getUniformLocation(positionPrg.program, 'resolution');
  positionPrg.uniLocation[2] = gl.getUniformLocation(positionPrg.program, 'a');
  positionPrg.uniType[0]     = 'uniform1i';
  positionPrg.uniType[1]     = 'uniform2fv';
  positionPrg.uniType[2]     = 'uniform1f';

  let pointTexCoord = [];
  for (let i = 0; i < POINT_RESOLUTION; i++) {
    let t = i / POINT_RESOLUTION;
    for (let j = 0; j < POINT_RESOLUTION; j++) {
      let s = j / POINT_RESOLUTION;
      pointTexCoord.push(s, t);
    }
  }
  let pointVBO = [createVbo(pointTexCoord)];

  // vertices
  let planePosition = [
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
       1.0, -1.0,  0.0,
      -1.0, -1.0,  0.0
  ];
  let planeTexCoord = [
      1.0, 0.0,
      0.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
  ];
  let planeIndex = [
      0, 1, 2, 2, 1, 3
  ];
  let planeVBO = [createVbo(planePosition)];
  let planeIBO = createIbo(planeIndex);

  // matrix
  let mMatrix      = mat.identity(mat.create());
  let vMatrix      = mat.identity(mat.create());
  let pMatrix      = mat.identity(mat.create());
  let vpMatrix     = mat.identity(mat.create());
  let mvpMatrix    = mat.identity(mat.create());
  mat.lookAt([0.0, 0.0, 5.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
  mat.perspective(60, canvas.width / canvas.height, 0.1, 20.0, pMatrix);
  mat.multiply(pMatrix, vMatrix, vpMatrix);

  // framebuffer
  let positionFramebuffers = [
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION),
    createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION)
  ];

  // textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE0 + POSITION_BUFFER_INDEX);
  gl.bindTexture(gl.TEXTURE_2D, positionFramebuffers[0].texture);
  gl.activeTexture(gl.TEXTURE0 + POSITION_BUFFER_INDEX + 1);
  gl.bindTexture(gl.TEXTURE_2D, positionFramebuffers[1].texture);

  // reset framebuffers
  gl.useProgram(resetPrg.program);
  // pass POINT_RESOLUTION to the reset frag renderer.
  gl[resetPrg.uniType[0]](resetPrg.uniLocation[0], [POINT_RESOLUTION, POINT_RESOLUTION]);
  // bind VBO and IBO.
  setAttribute(planeVBO, resetPrg.attLocation, resetPrg.attStride, planeIBO);
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION);

  for (let i = 0; i < positionFramebuffers.length; i++) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, positionFramebuffers[i].framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);
  }

  // flags
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);

  render();

  function render() {
    loopCount++;
    let targetBufferIndex = loopCount % 2;
    let prevBufferIndex = 1 - targetBufferIndex;

    // update gpgpu buffers -------------------------------------------
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION);

    // position update
    gl.useProgram(positionPrg.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, positionFramebuffers[targetBufferIndex].framebuffer);
    setAttribute(planeVBO, positionPrg.attLocation, positionPrg.attStride, planeIBO);
    gl[positionPrg.uniType[0]](positionPrg.uniLocation[0], POSITION_BUFFER_INDEX + prevBufferIndex);
    gl[positionPrg.uniType[1]](positionPrg.uniLocation[1], [POINT_RESOLUTION, POINT_RESOLUTION]);
    gl[positionPrg.uniType[2]](positionPrg.uniLocation[2], 2 * Math.sin(loopCount * 0.001) + 2);
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0);

    // render to canvas -------------------------------------------
    gl.enable(gl.BLEND);
    gl.useProgram(scenePrg.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    setAttribute(pointVBO, scenePrg.attLocation, scenePrg.attStride);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // push and render
    mat.identity(mMatrix);
    mat.multiply(vpMatrix, mMatrix, mvpMatrix);
    gl[scenePrg.uniType[0]](scenePrg.uniLocation[0], false, mvpMatrix);
    gl[scenePrg.uniType[1]](scenePrg.uniLocation[1], POINT_SIZE);
    gl[scenePrg.uniType[2]](scenePrg.uniLocation[2], POSITION_BUFFER_INDEX + targetBufferIndex);
    gl[scenePrg.uniType[3]](scenePrg.uniLocation[3], POINT_COLOR);
    gl.drawArrays(gl.POINTS, 0, POINT_RESOLUTION * POINT_RESOLUTION);

    gl.flush();

    // animation loop
    requestAnimationFrame(render);
  }
}

