import * as PIXI from 'pixi.js';

import { Universe, Cell } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg';

const CELL_SIZE = 5;
const LINE_THICKNESS = 1;
const GRID_COLOR = 0x563512;
const DEAD_COLOR = 0xffffcc;
const ALIVE_COLOR = 0x828B20;

const universe = Universe.new(1000, 1000);
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById('game-of-life-canvas');
const playPauseButton = document.getElementById('play-pause');
const randomizeButton = document.getElementById('make-random');


const app = new PIXI.Application({
  antialias: false,
  width: (CELL_SIZE + LINE_THICKNESS) * width + LINE_THICKNESS,
  height: (CELL_SIZE + LINE_THICKNESS) * height + LINE_THICKNESS,
  transparent: false,
  backgroundColor: 0xFFFFFF,
  view: canvas,
  forceCanvas: true
});

// document.body.appendChild(app.view);

// document.getElementById('game-of-life').appendChild(app.view);

// canvas.height = (CELL_SIZE + 1) * height + 1;
// canvas.width = (CELL_SIZE + 1) * width + 1;
// canvas.offscreenCanvas = document.createElement('canvas');
// canvas.offscreenCanvas.width = canvas.width;
// canvas.offscreenCanvas.height = canvas.height;

// const ctx = canvas.offscreenCanvas.getContext('2d', {alpha: false});

const getIndex = (row, column) => {
  return row * width + column;
};

// OP2
// using images in this way saves about 2fps compared to fillstyle
// const deadCell = ctx.createImageData(CELL_SIZE, CELL_SIZE);
// for (let i = 0; i < deadCell.data.length; i++) {
//   deadCell.data[i] = 255;
// }

// const aliveCell = ctx.createImageData(CELL_SIZE, CELL_SIZE);
// for (let i = 0; i < aliveCell.data.length; i++) {
//   aliveCell.data[i] = 0;
// }

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  let gAlive; // = new PIXI.Graphics();
  for (let row = 0; row < height; row++) {
    if ( row % 10 === 0) {
      console.log("new gAlive");
      gAlive = new PIXI.Graphics();
    }

    for (let col = 0; col < width; col++) {
      gAlive.beginFill(ALIVE_COLOR);
      const idx = getIndex(row, col);
      if (cells[idx] !== Cell.Alive) {
        continue;
      }
      gAlive.drawRect(
        col * (CELL_SIZE + LINE_THICKNESS) + LINE_THICKNESS,
        row * (CELL_SIZE + LINE_THICKNESS) + LINE_THICKNESS,
        CELL_SIZE,
        CELL_SIZE
      );
      gAlive.endFill();
    }
    app.stage.addChild(gAlive);
  }

  let gDead; // = new PIXI.Graphics();
  for (let row = 0; row < height; row++) {
    if (row % 10 === 0) {
      console.log('new gDead');
      gDead = new PIXI.Graphics();
    }

    for (let col = 0; col < width; col++) {
      gDead.beginFill(DEAD_COLOR);
      const idx = getIndex(row, col);
      if (cells[idx] !== Cell.Dead) {
        continue;
      }
      gDead.drawRect(
        col * (CELL_SIZE + LINE_THICKNESS) + LINE_THICKNESS,
        row * (CELL_SIZE + LINE_THICKNESS) + LINE_THICKNESS,
        CELL_SIZE,
        CELL_SIZE
      );
      gDead.endFill();
    }
    app.stage.addChild(gDead);
  }




//   ctx.beginPath();

//   ctx.fillStyle = ALIVE_COLOR;
//   for(let row = 0; row < height; row++) {
//     for (let col = 0; col < width; col++) {
//       const idx = getIndex(row, col);
//       if (cells[idx] !== Cell.Alive) {
//         continue;
//       }
//       ctx.fillRect(
//         col * (CELL_SIZE + 1) + 1,
//         row * (CELL_SIZE + 1) + 1,
//         CELL_SIZE,
//         CELL_SIZE
//       )
//       // ctx.putImageData(aliveCell, col * (CELL_SIZE + 1) + 1, row * (CELL_SIZE + 1) + 1); // OP2
//     }
//   }

//   ctx.fillStyle = DEAD_COLOR;
//   for (let row = 0; row < height; row++) {
//     for (let col = 0; col < width; col++) {
//       const idx = getIndex(row, col);
//       if (cells[idx] !== Cell.Dead) {
//         continue;
//       }
//       ctx.fillRect(
//         col * (CELL_SIZE + 1) + 1,
//         row * (CELL_SIZE + 1) + 1,
//         CELL_SIZE,
//         CELL_SIZE
//       );
//       // ctx.putImageData(deadCell, col * (CELL_SIZE + 1) + 1, row * (CELL_SIZE + 1) + 1 ); // OP2
//     }
//   }

//   // OP0
//   // This is less efficient that splitting out drawing of alive then dead cells 
//   // for (let row = 0; row < height; row++) {
//   //   for (let col = 0; col < width; col++) {
//   //     const idx = getIndex(row, col);

//   //     ctx.fillStyle = cells[idx] === Cell.Dead ? DEAD_COLOR : ALIVE_COLOR;

//   //     ctx.fillRect(
//   //       col * (CELL_SIZE + 1) + 1,
//   //       row * (CELL_SIZE + 1) + 1,
//   //       CELL_SIZE,
//   //       CELL_SIZE
//   //     );
//   //   }
//   // }

//   ctx.stroke();
};

const drawGrid = () => {
  console.log('drawing grid');
  const graphics = new PIXI.Graphics();
  graphics.lineStyle(LINE_THICKNESS, GRID_COLOR, 1);
  
  for (let i = 0; i <= width; i++) {
    graphics.moveTo(i * (CELL_SIZE + LINE_THICKNESS) + LINE_THICKNESS, 0);
    graphics.lineTo(i * (CELL_SIZE + LINE_THICKNESS) + LINE_THICKNESS, (CELL_SIZE + LINE_THICKNESS) * height + LINE_THICKNESS);
  }

  for (let j = 0; j <= height; j++) {
    graphics.moveTo(0, j * (CELL_SIZE + LINE_THICKNESS) + LINE_THICKNESS);
    graphics.lineTo((CELL_SIZE + LINE_THICKNESS) * width + LINE_THICKNESS, j * (CELL_SIZE + LINE_THICKNESS) + LINE_THICKNESS);
  }

  app.stage.addChild(graphics);
  // graphics.destroy();
  // ctx.beginPath();
  // ctx.strokeStyle = GRID_COLOR;

  // for(let i = 0; i <= width; i++) {
  //   ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
  //   ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  // }

  // for (let j = 0; j <= height; j++) {
  //   ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
  //   ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  // }

  // ctx.stroke();
};

// let animationId = null;

// const renderLoop = () => {
//   fps.render();
//   universe.tick();

//   // drawGrid();
//   drawCells();
//   canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);

//   animationId = requestAnimationFrame(renderLoop);
// };

// const isPaused = () => {
//   return animationId === null;
// }

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

// canvas.addEventListener('click', e => {
//   const boundingRect = canvas.getBoundingClientRect();

//   const scaleX = canvas.width / boundingRect.width;
//   const scaleY = canvas.height / boundingRect.height;

//   const canvasLeft = (e.clientX - boundingRect.left) * scaleX;
//   const canvasTop = (e.clientY - boundingRect.top) * scaleY;

//   const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
//   const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

//   universe.toggle_cell(row, col);

//   // drawGrid();
//   drawCells();
//   canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);
// });

randomizeButton.addEventListener('click', e => {
  universe.randomize();
  // drawGrid();
  drawCells();
  // canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);
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

    this.fps.textContent = `
Frames per second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(min)}
`.trim();
  }
};

// drawGrid();
// drawCells();
// canvas.getContext('2d').drawImage(canvas.offscreenCanvas, 0, 0);
// play();