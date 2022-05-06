import { memory } from "wasm-game-of-life/wasm_game_of_life_bg.wasm";
import { Cell, Glider, GliderDirection, Universe } from "wasm-game-of-life";
import { BehaviorSubject, fromEvent, skip } from 'rxjs';
import { initStats } from "./statsInit";
import { initButtons } from "./buttons";
import { initSlider } from "./slider";
import { start, end } from "./utils";
import { initGenerations } from "./generationsText";
import { initStartModeDropdown } from "./startMode";
import { initGliderControls, initGliderModeButton } from "./gliderControl";

const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
const PIXEL_SIZE = 3;
const PIXEL_BORDER_SIZE = 1;

let universe = null;

const pixelSizeSubject$ = new BehaviorSubject(PIXEL_SIZE);
const rowsColumnsSubject$ = new BehaviorSubject();
const startMode$ = initStartModeDropdown();
const generationsChangedSub$ = initGenerations(0);

const stats = initStats();
const canvas = document.getElementById("lifeCanvas");
const ctx = canvas.getContext('2d');

pixelSizeSubject$.subscribe(value => resizeCanvas(canvas, value));
startMode$.pipe(skip(1)).subscribe(populateUniverse);
rowsColumnsSubject$.subscribe(sizeChanged);

const gliderDirectionSub$ = initGliderControls();
const gliderModeSub$ = initGliderModeButton();

const canvasClick$ = fromEvent(canvas, "click");
canvasClick$.subscribe(evt => {
    if (!evt) {
        return;
    }
    const pixelSize = pixelSizeSubject$.value;
    const [rows, cols] = rowsColumnsSubject$.value;
    let col = Math.floor(evt.offsetX / (pixelSize + PIXEL_BORDER_SIZE));
    let row = Math.floor(evt.offsetY / (pixelSize + PIXEL_BORDER_SIZE));
    if (col < 0 || row < 0 || col >= cols || row >= rows) {
        return;
    }

    let direction = GliderDirection.NW;
    if (gliderModeSub$.value === true) {
        switch (gliderDirectionSub$.value) {
            case "UpLeft":
                direction = GliderDirection.NW;
                break;
            case "UpRight":
                direction = GliderDirection.NE;
                break;
            case "DownLeft":
                direction = GliderDirection.SW;
                break;
            case "DownRight":
                direction = GliderDirection.SE;
                break;
        }
        let glider = universe.toggle_glider(row, col, direction);
        drawGlider(glider.cells(), glider.indexes());
    }
    else {
        let cell = universe.toggle_cell(row, col);
        ctx.fillStyle = cell === Cell.Alive ? ALIVE_COLOR : DEAD_COLOR;
        drawCell(col, row, pixelSize);
    }
});

function drawGlider(cellsPtr, indexesPtr) {
    const cells = new Uint8Array(memory.buffer, cellsPtr, 9);
    const indexes = new Uint32Array(memory.buffer, indexesPtr, 9);
    
    const pixelSize = pixelSizeSubject$.value;    
    const [rows, cols] = rowsColumnsSubject$.value;
    
    ctx.fillStyle = DEAD_COLOR;
    for (let idx = 0; idx < 9; idx++) {
        let index = indexes[idx];
        let col = index % cols;
        let row = (index - col) / cols;
        if (cells[idx] === Cell.Dead) {
            drawCell(col, row, pixelSize);
        }
    }

    ctx.fillStyle = ALIVE_COLOR;
    for (let idx = 0; idx < 9; idx++) {
        let index = indexes[idx];
        let col = index % cols;
        let row = (index - col) / cols;
        if (cells[idx] === Cell.Alive) {
            drawCell(col, row, pixelSize);
        }
    }
}

function resizeCanvas(canvas, pixelSize) {
    const containerWidth = window.outerWidth * .97;
    const containerHeight = window.outerHeight * .85;
    const cols = 2 * Math.floor(containerWidth / (pixelSize + PIXEL_BORDER_SIZE) / 2);
    const rows = 2 * Math.floor(containerHeight / (pixelSize + PIXEL_BORDER_SIZE) / 2);

    canvas.width = (pixelSize + PIXEL_BORDER_SIZE) * cols + PIXEL_BORDER_SIZE;
    canvas.height = (pixelSize + PIXEL_BORDER_SIZE) * rows + PIXEL_BORDER_SIZE;

    rowsColumnsSubject$.next([rows, cols]);
};

function populateUniverse(startMode) {
    if (universe.ptr !== 0) {
        universe = Universe.populate(universe, startMode);
        console.log("populated");
        drawCells();
        generationsChangedSub$.next(0);
    }
}

function sizeChanged(value) {
    console.log(`${value} rows and columns`);
    let [rows, columns] = value;
    if (universe === null || universe.rows() !== rows || universe.columns() !== columns) {
        universe = Universe.new(rows, columns);        
        console.log("instantiated");
        populateUniverse(startMode$.value);
    }
}

function drawCells() {
    let [rows, columns] = rowsColumnsSubject$.value;
    let pixelSize = pixelSizeSubject$.value;
    const cellsChangedPtr = universe.cells_changed();
    const cellsChanged = new Uint8Array(memory.buffer, cellsChangedPtr, rows * columns);    
    ctx.beginPath();

    ctx.fillStyle = DEAD_COLOR;        
    let idx = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            // 1 is a code for changed + dead
            if (cellsChanged[idx] === 1) {
                drawCell(col, row, pixelSize);
            }
            idx++;
        }
    }

    ctx.fillStyle = ALIVE_COLOR;

    idx = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            // 2 is a code for changed + alive
            if (cellsChanged[idx] === 2) {
                drawCell(col, row, pixelSize);
            }
            idx++;
        }
    }
    ctx.stroke();
}

function drawCell(col, row, pixelSize) {
    let x = col * (pixelSize + PIXEL_BORDER_SIZE) + PIXEL_BORDER_SIZE;
    let y = row * (pixelSize + PIXEL_BORDER_SIZE) + PIXEL_BORDER_SIZE;
    let size = pixelSize;
    ctx.fillRect(x, y, size, size);
}

let animationId = null;

function renderLoop() {
    stats.begin();

    let startTime = start();
    universe.tick();
    end(startTime, "tick");

    generationsChangedSub$.next(generationsChangedSub$.value + 1);    
    
    drawCells();

    animationId = requestAnimationFrame(renderLoop);
    stats.end();
};

function startLife() {
    renderLoop();
}

function stopLife() {
    cancelAnimationFrame(animationId);
    animationId = null;
}

initButtons(() => populateUniverse(startMode$.value), startLife, stopLife);
initSlider(pixelSizeSubject$);