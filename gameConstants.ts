// Tetris game constants and types

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;
export const CELL_SIZE = 30;

export type Tetromino = number[][];

// Tetromino shapes (0 = empty, 1-7 = different pieces)
// Standardized as clean matrices to keep the rotation centers perfectly balanced on both walls
export const TETROMINOES: { [key: number]: number[][] } = {
  0: [], // empty
  
  // 1: I - cyan (4x4 matrix for perfect center line tracking)
  1: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  
  // 2: J - blue (3x3 matrix)
  2: [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0]
  ],
  
  // 3: L - orange (3x3 matrix)
  3: [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0]
  ],
  
  // 4: O - yellow (2x2 matrix - square blocks never kick)
  4: [
    [4, 4],
    [4, 4]
  ],
  
  // 5: S - green (3x3 matrix)
  5: [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0]
  ],
  
  // 6: T - purple (3x3 matrix)
  6: [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  
  // 7: Z - red (3x3 matrix)
  7: [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0]
  ]
};


export const COLORS: { [key: number]: string } = {
  0: "#1a1f3a", // background
  1: "#00f0f0", // I - cyan
  2: "#0000f0", // L - blue
  3: "#f0a000", // J - orange
  4: "#f0f000", // O - yellow
  5: "#00f000", // S - green
  6: "#a000f0", // T - purple
  7: "#f00000", // Z - red
  8: "#4a5568", // garbage - gray
};

export interface GameState {
  grid: number[][];
  currentPiece: CurrentPiece;
  nextPiece: number[]; // Changed from number to number[] for the 5-piece preview queue
  heldPiece: number | null; // Tracks which piece index is sitting in the hold dock
  hasHeldThisTurn: boolean; // Locks shifting to prevent infinite swapping on a single turn
  score: number;
  lines: number;
  gameOver: boolean;
  level: number;
  combo: number;
  backToBack: boolean;
  garbageQueue: number;
  garbageSent: number;
  lastWasSpin: boolean;
}


export interface CurrentPiece {
  type: number;
  x: number;
  y: number;
  rotation: number;
}

export interface GameMessage {
  type: "move" | "rotate" | "drop" | "gameState" | "gameOver" | "join" | "chat" | "sendGarbage";
  playerId?: string;
  data?: any;
  message?: string;
  garbageLines?: number;
}
