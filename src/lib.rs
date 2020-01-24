mod timer;
mod utils;
use timer::Timer;

extern crate js_sys;
use js_sys::Math;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Represents a single cell in the Universe that can either be alive of dead
#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

impl Cell {
    /// Toggle a cells state between alive or dead
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        };
    }
}

/// The Universe in which the game is playing
#[wasm_bindgen]
pub struct Universe {
    /// The width, in cells, of the universe
    width: u32,
    /// The height, in cells, of the universe
    height: u32,
    /// The collection of cells that make up the universe
    cells: Vec<Cell>,
    /// How many animation 'ticks' the universe has gone through since its creation
    ticks: u32,
}

/// Private methods
impl Universe {
    /// Based on a given row and column number of a cell get its index in the cells Vector
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }

    /// Given a row and colum representing a particular cell, calculate the number of Cell::Alive
    /// adjacent cells
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

        let north = if row == 0 { self.height - 1 } else { row - 1 };

        let south = if row == self.height - 1 { 0 } else { row + 1 };

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

/// Public functions exposed to wasm
#[wasm_bindgen]
impl Universe {
    /// Construct a 'default' universe of height/width of 64 and a randomly distributed set
    /// of alive cells covering ~20% of the universe
    pub fn default() -> Universe {
        utils::set_panic_hook();

        let width = 64;
        let height = 64;
        let ticks = 0;

        let cells = (0..width * height)
            .map(|_| {
                if Math::random() < 0.2 {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect();

        Universe {
            width,
            height,
            cells,
            ticks,
        }
    }

    /// Create a new universe based on a given cell height and width
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
            ticks,
        }
    }

    /// Clear the current universe cells and replace them with a new randomly
    /// populated (~20% alive) Vector
    pub fn randomize(&mut self) {
        self.ticks = 0;
        self.cells = (0..self.width * self.height)
            .map(|_| {
                if Math::random() < 0.2 {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect();
    }

    /// Reset entire Universe to dead state
    pub fn clear(&mut self) {
        self.ticks = 0;
        self.cells = (0..self.width * self.height).map(|_| Cell::Dead).collect();
    }

    /// Update the Universe cells based on the Game of Life (rules)[https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life#Rules]
    pub fn tick(&mut self) {
        let _timer = Timer::new("Universe::tick");
        let mut next = {
            let _timer = Timer::new("allocate next cells");
            self.cells.clone()
        };

        {
            let _timer = Timer::new("new generation");
            for row in 0..self.height {
                for col in 0..self.width {
                    let idx = self.get_index(row, col);
                    let cell = self.cells[idx];
                    let live_neighbours = self.live_neighbour_count(row, col);

                    let next_cell = match (cell, live_neighbours) {
                        (Cell::Alive, x) if x < 2 => Cell::Dead,
                        (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                        (Cell::Alive, x) if x > 3 => Cell::Dead,
                        (Cell::Dead, 3) => Cell::Alive,
                        (otherwise, _) => otherwise,
                    };

                    next[idx] = next_cell;
                }
            }
        }

        self.ticks += 1;

        let _timer = Timer::new("free old cells");
        self.cells = next;
    }

    /// Get the current width of the Universe
    pub fn width(&self) -> u32 {
        self.width
    }

    /// Get the current height of the Universe
    pub fn height(&self) -> u32 {
        self.height
    }

    /// Return a pointer to the Universes cells Vector, allowing it to be consumed by the WASM host
    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    /// How many ticks the of the Universe have been calculated
    pub fn ticks(&self) -> u32 {
        self.ticks
    }

    /// Count the alive cells in the Universe
    pub fn population(&self) -> u32 {
        self.cells.iter().fold(0, |acc, &i| acc + (i as u32))
    }

    /// Update the width of the existing Universe, this also resets the unverse to a completely dead state
    pub fn set_width(&mut self, width: u32) {
        self.ticks = 0;
        self.width = width;
        self.cells = (0..width * self.height).map(|_i| Cell::Dead).collect();
    }

    /// Update the height of the existing Universe, this also resets the universe to a completely dead state
    pub fn set_height(&mut self, height: u32) {
        self.ticks = 0;
        self.height = height;
        self.cells = (0..self.width * height).map(|_i| Cell::Dead).collect();
    }

    /// Clear the current Universe setting all cells to dead
    pub fn reset_universe(&mut self) {
        self.ticks = 0;
        self.cells = (0..self.cells.len()).map(|_i| Cell::Dead).collect();
    }

    /// Allow cell state to be toggled by the wasm host by providing the cells row and column
    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        self.cells[idx].toggle();
    }

    /// fast forward `ticks` number of ticks in the Universe lifetime
    pub fn fast_forward_to(&mut self, ticks: u32) {
        (0..ticks).for_each(|_| self.tick());
    }

    // pub fn to_image_data(&mut self) -> *const [u32] {
        
    // }
}

/// Implementation containing methods for testing
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
