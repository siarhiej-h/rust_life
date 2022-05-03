import { memory } from "wasm-game-of-life/wasm_game_of_life_bg.wasm";
import { Universe, Cell, StartMode } from "wasm-game-of-life";
import Stats from "stats.module";

const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

let PIXEL_SIZE = 3;
let generations = 0;

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("lifeCanvas");

const ctx = canvas.getContext('2d');

const stats = new Stats();
const setupStats = () => {
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    stats.dom.style.left = '';
    stats.dom.style.right = '0px';
    stats.dom.style.transform = 'scale(1.5)';
    stats.dom.style.transformOrigin = 'top right';
    stats.dom.style.opacity = '1';
    document.body.appendChild(stats.dom);
};
setupStats();

const resizeCanvas = (canvas) => {
    const containerWidth = window.outerWidth * .97;
    const containerHeight = window.outerHeight * .85;
    const cols = 2 * Math.floor(containerWidth / (PIXEL_SIZE + 1) / 2);
    const rows = 2 * Math.floor(containerHeight / (PIXEL_SIZE + 1) / 2);

    canvas.width = (PIXEL_SIZE + 1) * cols + 1;
    canvas.height = (PIXEL_SIZE + 1) * rows + 1;

    return [rows, cols];
};

let [rows, columns] = resizeCanvas(canvas);
let startMode = StartMode.Blank;
let universe = Universe.new(rows, columns, startMode);

const getIndex = (row, column) => {
    return row * columns + column;
};

const drawCells = () => {
    const cellsPtr = universe.cells();    
    const cells = new Uint8Array(memory.buffer, cellsPtr, rows * columns);
    const cellsChangedPtr = universe.cells_changed();
    const cellsChanged = new Uint8Array(memory.buffer, cellsChangedPtr, rows * columns);

    ctx.beginPath();

    ctx.fillStyle = DEAD_COLOR;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const idx = getIndex(row, col);
            if (cellsChanged[idx] === 0) {
                continue;
            }

            if (cells[idx] === Cell.Alive) {
                continue;
            }

            let x = col * (PIXEL_SIZE + 1) + 1;
            let y = row * (PIXEL_SIZE + 1) + 1;
            let size = PIXEL_SIZE;
            ctx.fillRect(x, y, size, size);
        }
    }

    ctx.fillStyle = ALIVE_COLOR;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const idx = getIndex(row, col);
            if (cellsChanged[idx] === 0) {
                continue;
            }

            if (cells[idx] === Cell.Dead) {
                continue;
            }

            let x = col * (PIXEL_SIZE + 1) + 1;
            let y = row * (PIXEL_SIZE + 1) + 1;
            let size = PIXEL_SIZE;
            ctx.fillRect(x, y, size, size);
        }
    }

    ctx.stroke();
};

let startTime, endTime;

function start() {
  startTime = new Date();
};

function end(measure) {
  endTime = new Date();
  var timeDiff = endTime - startTime; //in ms
  console.log(`${timeDiff} ms per ${measure}`);
}

let animationId = null;

const generationsText = document.getElementById("lifeText");
const renderLoop = () => {
  stats.begin();

//   start();
  universe.tick();
//   end("tick");
  generations++;
  generationsText.textContent = `Generations passed ${generations}`;
  drawCells();
  animationId = requestAnimationFrame(renderLoop);
  stats.end();
};

const setupSlider = () => {
    const slider = document.getElementById("lifeSlider");
    slider.value = PIXEL_SIZE;
    slider.addEventListener("change", evt => {
        PIXEL_SIZE = parseInt(evt.target.value);
        [rows, columns] = resizeCanvas(canvas);
        universe = Universe.new(rows, columns, startMode);
        drawCells();
    });
};
setupSlider();

const setupDropDown = (initValue) => {
    const dropdown = document.getElementById("lifeStartDropDown");
    switch (initValue) {
        case StartMode.Blank:
            dropdown.value = "Blank";
            break;
        case StartMode.Random:
            dropdown.value = "Random";
            break;
    };
    dropdown.addEventListener("change", evt => {
        const value = evt.target.value;
        const current = startMode;
        switch (value) {
            case "Blank":
                startMode = StartMode.Blank;          
                break;
            case "Random":
                startMode = StartMode.Random;
                break;
        };
        if (current !== startMode) {
            universe = Universe.new(rows, columns, startMode);
            drawCells();
        }
    });
};
setupDropDown(startMode);

const setupLifeStartButton = () => {
    const button = document.getElementById("lifeStartButton");
    button.addEventListener("click", evt => {        
        generationsText.removeAttribute("hidden");
        const startModeDropdown = document.getElementById("lifeStartDropDown");
        startModeDropdown.setAttribute("hidden", "");
        const slider = document.getElementById("lifeSlider");
        slider.setAttribute("hidden", "");
        renderLoop();

        button.setAttribute("hidden", "");
        const stopButton = document.getElementById("lifeStopButton");
        stopButton.removeAttribute("hidden");
    });
};
setupLifeStartButton();

const setupLifeStopButton = () => {
    const button = document.getElementById("lifeStopButton");
    button.addEventListener("click", evt => {        
        cancelAnimationFrame(animationId);
        animationId = null;

        button.setAttribute("hidden", "");
        const resumeButton = document.getElementById("lifeResumeButton");
        resumeButton.removeAttribute("hidden");
        const resetButton = document.getElementById("lifeResetButton");
        resetButton.removeAttribute("hidden");
    });
};
setupLifeStopButton();

const setupLifeResumeButton = () => {
    const button = document.getElementById("lifeResumeButton");
    button.addEventListener("click", evt => {        
        renderLoop();

        button.setAttribute("hidden", "");
        const resetButton = document.getElementById("lifeResetButton");
        resetButton.setAttribute("hidden", "");
        const stopButton = document.getElementById("lifeStopButton");
        stopButton.removeAttribute("hidden");
    });
};
setupLifeResumeButton();

const setupLifeResetButton = () => {
    const button = document.getElementById("lifeResetButton");
    button.addEventListener("click", evt => {
        generations = 0;
        generationsText.setAttribute("hidden", "");
        universe = Universe.new(rows, columns, startMode);
        drawCells();

        button.setAttribute("hidden", "");
        const resumeButton = document.getElementById("lifeResumeButton");
        resumeButton.setAttribute("hidden", "");        

        const startModeDropdown = document.getElementById("lifeStartDropDown");
        startModeDropdown.removeAttribute("hidden");
        const startButton = document.getElementById("lifeStartButton");
        startButton.removeAttribute("hidden");
        const slider = document.getElementById("lifeSlider");
        slider.removeAttribute("hidden");
    });
};
setupLifeResetButton();