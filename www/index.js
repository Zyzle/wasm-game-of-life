import { Universe, Cell } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg';

const CELL_SIZE = 1;
const GRID_THICKNESS = 0;
const GRID_COLOR = '#ccc';
const DEAD_COLOR = '#fff';
const ALIVE_COLOR = '#000';

const universe = Universe.new(1000, 1000);
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById('game-of-life-canvas');
const playPauseButton = document.getElementById('play-pause');
const randomizeButton = document.getElementById('make-random');
const clearButton = document.getElementById('clear');
const ffButton = document.getElementById('ff200');

canvas.height = (CELL_SIZE + GRID_THICKNESS) * height + GRID_THICKNESS;
canvas.width = (CELL_SIZE + GRID_THICKNESS) * width + GRID_THICKNESS;
canvas.offscreenCanvas = document.createElement('canvas');
canvas.offscreenCanvas.width = canvas.width;
canvas.offscreenCanvas.height = canvas.height;

const ctx = canvas.offscreenCanvas.getContext('2d');
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

const drawCells = () => {
  const imagePtr = universe.image();
  const image = new ImageData(
    new Uint8ClampedArray(
      memory.buffer, imagePtr, 4 * width * height
    ),
    width
  );

  ctx.putImageData(image, 0, 0);
};

let animationId = null;

const renderLoop = () => {
  fps.render();
  universe.tick();

  drawCells();
  canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);

  animationId = requestAnimationFrame(renderLoop);
};

const isPaused = () => {
  return animationId === null;
}

const play = () => {
  playPauseButton.textContent = 'pause';
  renderLoop();
}

const pause = () => {
  playPauseButton.textContent = 'play';
  cancelAnimationFrame(animationId);
  animationId = null;
}

playPauseButton.addEventListener('click', e => {
  if (isPaused()) {
    play();
  }
  else {
    pause();
  }
});

canvas.addEventListener('click', e => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (e.clientX - boundingRect.left) * scaleX;
  const canvasTop = (e.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + GRID_THICKNESS)), height - GRID_THICKNESS);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + GRID_THICKNESS)), width - GRID_THICKNESS);

  universe.toggle_cell(row, col);


  drawCells();
  canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);
});

randomizeButton.addEventListener('click', e => {
  universe.randomize();

  drawCells();
  canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);
});

clearButton.addEventListener('click', e => {
  universe.clear();
  drawCells();
  canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);
});

ffButton.addEventListener('click', e => {
  universe.fast_forward_to(200);
  fps.render();
  drawCells();
  canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);
});

const fps = new class {
  constructor() {
    this.fps = document.getElementById('fps');
    this.frames = [];
    this.lastFrameTimestamp = performance.now();
  }

  render() {
    const now = performance.now();
    const delta = now - this.lastFrameTimestamp;
    this.lastFrameTimestamp = now;
    const fps = 1 / delta * 1000;

    this.frames.push(fps);
    if (this.frames.length > 100) {
      this.frames.shift();
    }

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    for (let i = 0; i < this.frames.length; i++) {
      sum += this.frames[i];
      min = Math.min(this.frames[i], min);
      max = Math.max(this.frames[i], max);
    }

    let mean = sum / this.frames.length;

    let ticks = universe.ticks();
    let pop = universe.population();

    this.fps.textContent = `
Universe tick: ${ticks}
Universe population: ${pop}
Frames per second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
`.trim();
  }
};

drawCells();
canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);
