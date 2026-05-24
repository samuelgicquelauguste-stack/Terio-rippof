export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;
export const CELL_SIZE = 30;

export type Tetromino = number[][];

export const TETROMINOES: { [key: number]: number[][] } = {
  0: [],
  1: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  2: [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0]
  ],
  3: [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0]
  ],
  4: [
    [4, 4],
    [4, 4]
  ],
  5: [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0]
  ],
  6: [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  7: [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0]
  ]
};

export const COLORS: { [key: number]: string } = {
  0: "#1a1f3a",
  1: "#00f0f0",
  2: "#0000f0",
  3: "#f0a000",
  4: "#f0f000",
  5: "#00f000",
  6: "#a000f0",
  7: "#f00000",
  8: "#4a5568",
};

export interface GameState {
  grid: number[][];
  currentPiece: CurrentPiece;
  nextPiece: number[];
  heldPiece: number | null;
  hasHeldThisTurn: boolean;
  score: number;
  lines: number;
  gameOver: boolean;
  level: number;
  combo: number;
  spikeLines: number;
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
