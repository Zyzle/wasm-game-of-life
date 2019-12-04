import { Universe, Cell } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg';

const CELL_SIZE = 5;
const GRID_THICKNESS = 1;
const GRID_COLOR = '#ccc';
const DEAD_COLOR = '#fff';
const ALIVE_COLOR = '#000';

const universe = Universe.new(200, 100);
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

const getIndex = (row, column) => {
  return row * width + column;
};

// #FAD779
const deadCell = ctx.createImageData(CELL_SIZE, CELL_SIZE);
for (let i = 0; i < deadCell.data.length; i += 4) {
  deadCell.data[i] = 0xfa;
  deadCell.data[i+1] = 0xd7;
  deadCell.data[i+2] = 0x79;
  deadCell.data[i+3] = 0xff;
}

// #828B20
const aliveCell = ctx.createImageData(CELL_SIZE, CELL_SIZE);
for (let i = 0; i < aliveCell.data.length; i += 4) {
  aliveCell.data[i] = 0x82;
  aliveCell.data[i + 1] = 0x8b;
  aliveCell.data[i + 2] = 0x20;
  aliveCell.data[i + 3] = 0xff;
}

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  // ctx.beginPath();

  // ctx.fillStyle = ALIVE_COLOR;
  for(let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);
      if (cells[idx] !== Cell.Alive) {
        continue;
      }
      // ctx.fillRect(
      //   col * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS,
      //   row * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS,
      //   CELL_SIZE,
      //   CELL_SIZE
      // )
      ctx.putImageData(aliveCell, col * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS, row * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS);
    }
  }

  // ctx.fillStyle = DEAD_COLOR;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);
      if (cells[idx] !== Cell.Dead) {
        continue;
      }
      // ctx.fillRect(
      //   col * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS,
      //   row * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS,
      //   CELL_SIZE,
      //   CELL_SIZE
      // );
      ctx.putImageData(deadCell, col * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS, row * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS );
    }
  }

  // for (let row = 0; row < height; row++) {
  //   for (let col = 0; col < width; col++) {
  //     const idx = getIndex(row, col);

  //     ctx.fillStyle = cells[idx] === Cell.Dead ? DEAD_COLOR : ALIVE_COLOR;

  //     ctx.fillRect(
  //       col * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS,
  //       row * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS,
  //       CELL_SIZE,
  //       CELL_SIZE
  //     );
  //   }
  // }

  // ctx.stroke();
};

// const drawGrid = () => {
//   ctx.beginPath();
//   ctx.strokeStyle = GRID_COLOR;

//   for(let i = 0; i <= width; i++) {
//     ctx.moveTo(i * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS, 0);
//     ctx.lineTo(i * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS, (CELL_SIZE + GRID_THICKNESS) * height + GRID_THICKNESS);
//   }

//   for (let j = 0; j <= height; j++) {
//     ctx.moveTo(0, j * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS);
//     ctx.lineTo((CELL_SIZE + GRID_THICKNESS) * width + GRID_THICKNESS, j * (CELL_SIZE + GRID_THICKNESS) + GRID_THICKNESS);
//   }

//   ctx.stroke();
// };

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
