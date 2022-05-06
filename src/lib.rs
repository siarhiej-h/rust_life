mod utils;
use rand::Rng;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StartMode {
    Blank = 0,
    Random = 1,
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ToggleMode {
    Point = 0,
    Glider = 1,
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GliderDirection {
    NW = 0,
    NE = 1,
    SW = 2,
    SE = 3,
}

#[wasm_bindgen]
pub struct Universe {
    columns: u32,
    rows: u32,
    cells: Vec<Cell>,
    cells_next: Vec<Cell>,
    cells_changed: Vec<u8>,
}

#[wasm_bindgen]
pub struct Glider {
    indexes: Vec<usize>,
    cells: Vec<Cell>,
}

#[wasm_bindgen]
impl Glider {
    pub fn indexes(&self) -> *const usize {
        self.indexes.as_ptr()
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }
}

impl Cell {
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        };
    }
}

#[wasm_bindgen]
impl Universe {
    pub fn columns(&self) -> u32 {
        self.columns
    }

    pub fn rows(&self) -> u32 {
        self.rows
    }

    fn size(&self) -> usize {
        return (self.rows * self.columns) as usize;
    }

    pub fn cells_changed(&self) -> *const u8 {
        self.cells_changed.as_ptr()
    }

    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.columns + column) as usize
    }

    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;

        let north = if row == 0 { self.rows - 1 } else { row - 1 };

        let south = if row == self.rows - 1 { 0 } else { row + 1 };

        let west = if column == 0 {
            self.columns - 1
        } else {
            column - 1
        };

        let east = if column == self.columns - 1 {
            0
        } else {
            column + 1
        };

        let nw = self.get_index(north, west);
        count += self.cells[nw] as u8;

        let n = self.get_index(north, column);
        count += self.cells[n] as u8;

        let ne = self.get_index(north, east);
        count += self.cells[ne] as u8;

        let w = self.get_index(row, west);
        count += self.cells[w] as u8;

        let e = self.get_index(row, east);
        count += self.cells[e] as u8;

        let sw = self.get_index(south, west);
        count += self.cells[sw] as u8;

        let s = self.get_index(south, column);
        count += self.cells[s] as u8;

        let se = self.get_index(south, east);
        count += self.cells[se] as u8;

        count
    }

    pub fn tick(&mut self) {
        for row in 0..self.rows {
            for col in 0..self.columns {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);

                match (cell, live_neighbors) {
                    (Cell::Alive, x) if x < 2 || x > 3 => {
                        self.cells_next[idx] = Cell::Dead;
                        self.cells_changed[idx] = 1;
                    }
                    (Cell::Dead, 3) => {
                        self.cells_next[idx] = Cell::Alive;
                        self.cells_changed[idx] = 2;
                    }
                    (otherwise, _) => {
                        self.cells_next[idx] = otherwise;
                        self.cells_changed[idx] = 0;
                    }
                };
            }
        }

        std::mem::swap(&mut self.cells, &mut self.cells_next);
    }

    pub fn toggle_cell(&mut self, row: u32, column: u32) -> Cell {
        let idx = self.get_index(row, column);
        self.cells[idx].toggle();
        return self.cells[idx];
    }

    pub fn toggle_glider(&mut self, row: u32, column: u32, direction: GliderDirection) -> Glider {
        let cells = match direction {
            GliderDirection::NW => vec![
                Cell::Alive,
                Cell::Alive,
                Cell::Alive,
                Cell::Alive,
                Cell::Dead,
                Cell::Dead,
                Cell::Dead,
                Cell::Alive,
                Cell::Dead,
            ],
            GliderDirection::NE => vec![
                Cell::Alive,
                Cell::Alive,
                Cell::Alive,
                Cell::Dead,
                Cell::Dead,
                Cell::Alive,
                Cell::Dead,
                Cell::Alive,
                Cell::Dead,
            ],
            GliderDirection::SW => vec![
                Cell::Dead,
                Cell::Alive,
                Cell::Dead,
                Cell::Alive,
                Cell::Dead,
                Cell::Dead,
                Cell::Alive,
                Cell::Alive,
                Cell::Alive,
            ],
            GliderDirection::SE => vec![
                Cell::Dead,
                Cell::Alive,
                Cell::Dead,
                Cell::Dead,
                Cell::Dead,
                Cell::Alive,
                Cell::Alive,
                Cell::Alive,
                Cell::Alive,
            ],
        };
        let up = (if row == 0 { self.rows } else { row }) - 1;
        let down = if row == (self.rows - 1) { 0 } else { row + 1 };
        let left = (if column == 0 { self.columns } else { column }) - 1;
        let right = if column == (self.columns - 1) {
            0
        } else {
            column + 1
        };
        let coords = [
            (left, up),
            (column, up),
            (right, up),
            (left, row),
            (column, row),
            (right, row),
            (left, down),
            (column, down),
            (right, down),
        ];
        let indexes: Vec<usize> = coords.iter().map(|x| self.get_index(x.1, x.0)).collect();
        for (i, cell) in cells.iter().enumerate() {
            let idx = indexes[i];
            self.cells[idx] = *cell;
        }
        return Glider { cells, indexes };
    }

    pub fn populate(mut universe: Universe, start_mode: StartMode) -> Universe {
        if let StartMode::Random = start_mode {
            for i in 0..universe.size() {
                let value: f32 = rand::thread_rng().gen_range(0.0..1.0);
                if value < 0.1 {
                    universe.cells[i] = Cell::Alive;
                    universe.cells_changed[i] = 2;
                } else {
                    universe.cells[i] = Cell::Dead;
                    universe.cells_changed[i] = 1;
                }
            }
        } else {
            for i in 0..universe.size() {
                universe.cells[i] = Cell::Dead;
                universe.cells_changed[i] = 1;
            }
        }

        return universe;
    }

    pub fn new(rows: u32, columns: u32) -> Universe {
        let size = rows * columns;
        let cells = vec![Cell::Dead; size as usize];
        let cells_next = vec![Cell::Dead; size as usize];
        let cells_changed = vec![0; size as usize];
        Universe {
            columns,
            rows,
            cells,
            cells_next,
            cells_changed,
        }
    }
}
