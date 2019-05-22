mod utils;

extern crate js_sys;
use js_sys::Math;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1
}

impl Cell {
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead
        };
    }
}

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
    ticks: u32
}

impl Universe {
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }

    fn live_neighbour_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;

        // Old modulo based version, updating to longer but more branch predicatable
        // version should provide speedup
        // for delta_row in [self.height - 1, 0, 1].iter().cloned() {
        //     for delta_col in [self.width - 1, 0, 1].iter().cloned() {
        //         if delta_row == 0 && delta_col == 0 {
        //             continue;
        //         }
        //         let neighbour_row = (row + delta_row) % self.height;
        //         let neighbour_col = (column + delta_col) % self.width;
        //         let idx = self.get_index(neighbour_row, neighbour_col);
        //         count += self.cells[idx] as u8;
        //     }
        // }

        let north = if row == 0 {
            self.height - 1
        } else {
            row - 1
        };

        let south = if row == self.height - 1 {
            0
        } else {
            row + 1
        };

        let west = if column == 0 {
            self.width - 1
        } else {
            column - 1
        };

        let east = if column == self.width - 1 {
            0
        } else {
            column + 1
        };

        let n = self.get_index(north, column);
        count += self.cells[n] as u8;

        let ne = self.get_index(north, east);
        count += self.cells[ne] as u8;

        let e = self.get_index(row, east);
        count += self.cells[e] as u8;

        let se = self.get_index(south, east);
        count += self.cells[se] as u8;

        let s = self.get_index(south, column);
        count += self.cells[s] as u8;

        let sw = self.get_index(south, west);
        count += self.cells[sw] as u8;

        let w = self.get_index(row, west);
        count += self.cells[w] as u8;

        let nw = self.get_index(north, west);
        count += self.cells[nw] as u8;

        count
    }
}

#[wasm_bindgen]
impl Universe {

    pub fn default() -> Universe {
        utils::set_panic_hook();

        let width = 64;
        let height = 64;
        let ticks = 0;

        let cells = (0..width * height).map(|_| {
            if Math::random() < 0.2 {
                Cell::Alive
            } else {
                Cell::Dead
            }
        }).collect();

        Universe {
            width,
            height,
            cells,
            ticks
        }
    }

    pub fn new(width: u32, height: u32) -> Universe {
        utils::set_panic_hook();

        let width = width;
        let height = height;
        let ticks = 0;

        let cells = (0..width * height).map(|_| Cell::Dead).collect();

        Universe {
            width,
            height,
            cells,
            ticks
        }
    }

    pub fn randomize(&mut self) {
        self.cells = (0..self.width * self.height).map(|_| {
            if Math::random() < 0.2 {
                Cell::Alive
            } else {
                Cell::Dead
            }
        }).collect();
    }

    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbours = self.live_neighbour_count(row, col);

                let next_cell = match(cell, live_neighbours) {
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    (Cell::Dead, 3) => Cell::Alive,
                    (otherwise, _) => otherwise
                };

                next[idx] = next_cell;
            }
        }

        self.cells = next;
        self.ticks += 1;
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        self.cells = (0..width * self.height).map(|_i| Cell::Dead).collect();
    }

    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        self.cells = (0..self.width * height).map(|_i| Cell::Dead).collect();
    }

    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        self.cells[idx].toggle();
    }
}

impl Universe {
    pub fn get_cells(&self) -> &[Cell] {
        &self.cells
    }

    pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
        for (row, col) in cells.iter().cloned() {
            let idx = self.get_index(row, col);
            self.cells[idx] = Cell::Alive;
        }
    }
}
