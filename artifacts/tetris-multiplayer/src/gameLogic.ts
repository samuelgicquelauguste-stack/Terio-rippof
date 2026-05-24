import {
  GRID_WIDTH,
  GRID_HEIGHT,
  TETROMINOES,
  GameState,
  CurrentPiece,
} from "./gameConstants";

const SRS_KICKS_DEFAULT: { [key: string]: [number, number][] } = {
  "0_1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1_0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1_2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2_1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2_3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3_2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3_0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0_3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};

const SRS_KICKS_I: { [key: string]: [number, number][] } = {
  "0_1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1_0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1_2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2_1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2_3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3_2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3_0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0_3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

export function createEmptyGrid(): number[][] {
  return Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(0));
}

export function generateShuffledBag(): number[] {
  const pieces = [1, 2, 3, 4, 5, 6, 7];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

export function getNextPieceFromBag(currentBag: number[]): { piece: number; updatedBag: number[] } {
  let workingBag = currentBag ? [...currentBag] : [];
  if (workingBag.length === 0) {
    workingBag = generateShuffledBag();
  }
  const piece = workingBag.shift()!;
  return { piece, updatedBag: workingBag };
}

export function createInitialGameState(): any {
  let initialBag = generateShuffledBag();
  const firstPiece = initialBag.shift()!;
  
  if (initialBag.length < 5) {
    initialBag = [...initialBag, ...generateShuffledBag()];
  }
  
  const nextQueue = initialBag.slice(0, 5);
  const remainingBag = initialBag.slice(5);

  return {
    grid: createEmptyGrid(),
    currentPiece: {
      type: firstPiece,
      x: Math.floor(GRID_WIDTH / 2) - 2,
      y: 0,
      rotation: 0,
    },
    nextPiece: nextQueue,
    bag: remainingBag,
    heldPiece: null,
    hasHeldThisTurn: false,
    score: 0,
    lines: 0,
    gameOver: false,
    level: 1,
    combo: 0,
    spikeLines: 0,
    backToBack: 0,
    garbageQueue: 0,
    garbageSent: 0,
    lastWasSpin: false,
  };
}

function rotateClockwise(tetromino: number[][]): number[][] {
  if (!tetromino || tetromino.length === 0 || !tetromino[0]) return [];
  
  const n = tetromino.length;
  const m = tetromino[0].length;
  
  const rotated: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      rotated[j][n - 1 - i] = tetromino[i][j];
    }
  }
  return rotated;
}

export function getTetromino(type: number, rotation: number): number[][] {
  let shape = TETROMINOES[type] || [];
  if (shape.length === 0) return [];
  
  const positiveRotation = ((rotation % 4) + 4) % 4;
  
  for (let i = 0; i < positiveRotation; i++) {
    shape = rotateClockwise(shape);
  }
  return shape;
}

export function canPlacePiece(
  grid: number[][],
  piece: CurrentPiece
): boolean {
  const shape = getTetromino(piece.type, piece.rotation);
  if (!shape || shape.length === 0) return false;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) continue;

      const x = piece.x + col;
      const y = piece.y + row;

      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        return false;
      }

      if (grid[y] && grid[y][x] !== 0) {
        return false;
      }
    }
  }

  return true;
}

export function placePiece(
  grid: number[][],
  piece: CurrentPiece
): number[][] {
  const newGrid = grid.map((row) => [...row]);
  const shape = getTetromino(piece.type, piece.rotation);

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) continue;

      const x = piece.x + col;
      const y = piece.y + row;

      if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
        newGrid[y][x] = piece.type;
      }
    }
  }

  return newGrid;
}

export function clearLines(grid: number[][]): { grid: number[][]; cleared: number } {
  let cleared = 0;
  const newGrid = grid.filter((row) => {
    if (row.every((cell) => cell !== 0)) {
      cleared++;
      return false;
    }
    return true;
  });

  while (newGrid.length < GRID_HEIGHT) {
    newGrid.unshift(Array(GRID_WIDTH).fill(0));
  }

  return { grid: newGrid, cleared };
}

export function movePieceDown(
  grid: number[][],
  piece: CurrentPiece
): CurrentPiece | null {
  const newPiece = { ...piece, y: piece.y + 1 };
  return canPlacePiece(grid, newPiece) ? newPiece : null;
}

export function movePieceLeft(
  grid: number[][],
  piece: CurrentPiece
): CurrentPiece {
  const newPiece = { ...piece, x: piece.x - 1 };
  return canPlacePiece(grid, newPiece) ? newPiece : piece;
}

export function movePieceRight(
  grid: number[][],
  piece: CurrentPiece
): CurrentPiece {
  const newPiece = { ...piece, x: piece.x + 1 };
  return canPlacePiece(grid, newPiece) ? newPiece : piece;
}

export function rotatePieceWithKick(
  grid: number[][],
  piece: CurrentPiece,
  direction: "cw" | "ccw" | "180" = "cw"
): { piece: CurrentPiece; wasSpin: boolean } {
  const fromState = piece.rotation;
  let toState = fromState;

  if (direction === "cw") toState = (fromState + 1) % 4;
  else if (direction === "ccw") toState = (fromState + 3) % 4;
  else if (direction === "180") toState = (fromState + 2) % 4;

  if (fromState === toState) return { piece, wasSpin: false };

  if (piece.type === 4) {
    const testPiece = { ...piece, rotation: toState };
    return canPlacePiece(grid, testPiece) ? { piece: testPiece, wasSpin: false } : { piece, wasSpin: false };
  }

  const transitionKey = `${fromState}_${toState}`;
  const kickData = piece.type === 1 ? SRS_KICKS_I : SRS_KICKS_DEFAULT;
  const offsets = kickData[transitionKey] || [];

  for (const [offsetX, offsetY] of offsets) {
    const testPiece = {
      ...piece,
      x: piece.x + offsetX,
      y: piece.y + offsetY,
      rotation: toState,
    };

    if (canPlacePiece(grid, testPiece)) {
      const wasSpin = offsetX !== 0 || offsetY !== 0;
      return { piece: testPiece, wasSpin };
    }
  }

  return { piece, wasSpin: false };
}

export function rotatePiece(grid: number[][], piece: CurrentPiece): CurrentPiece {
  const { piece: rotated } = rotatePieceWithKick(grid, piece, "cw");
  return rotated;
}

export function rotateCounterClockwise(grid: number[][], piece: CurrentPiece): CurrentPiece {
  const { piece: rotated } = rotatePieceWithKick(grid, piece, "ccw");
  return rotated;
}

export function rotate180(grid: number[][], piece: CurrentPiece): CurrentPiece {
  const { piece: rotated } = rotatePieceWithKick(grid, piece, "180");
  return rotated;
}

export function calculateScore(linesCleared: number, combo: number = 0, isBackToBack: boolean = false): number {
  const baseScores = [0, 40, 100, 300, 1200];
  const base = baseScores[Math.min(linesCleared, 4)] || 0;
  const comboMultiplier = 1 + (Math.max(0, combo - 1) * 0.25);
  const b2bMultiplier = isBackToBack && linesCleared === 4 ? 1.5 : 1;
  return Math.floor(base * comboMultiplier * b2bMultiplier);
}

// Official garbage table — indexed by combo (0 = first isolated clear, 1 = second consecutive, …)
// Columns 0-20 match the official "Garbage sent at combo" table.
const GARBAGE_SINGLE    = [0,0,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3];
const GARBAGE_DOUBLE    = [1,1,1,1,1,2,2,2,2,2,3,3,3,3,4,4,4,5,5,5,5];
const GARBAGE_TRIPLE    = [2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12];
const GARBAGE_QUAD      = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
const GARBAGE_TSPIN1    = [2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12];   // T-Spin Single
const GARBAGE_TSPIN2    = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]; // T-Spin Double
const GARBAGE_TSPIN3    = [6,7,9,10,12,13,15,16,18,19,21,22,24,25,27,28,30,31,33,34,36]; // T-Spin Triple

// b2bLevel: 0 = not in B2B, 1 = chain 1-2, 2 = chain 3-7, 3 = chain 8-23, 4 = chain 24+
// combo: currentCombo value (1 = first isolated clear → table col 0)
export function calculateGarbageSent(
  linesCleared: number,
  isTSpin: boolean = false,
  b2bLevel: number = 0,
  combo: number = 1
): number {
  if (linesCleared <= 0) return 0;
  const col = Math.min(Math.max(combo - 1, 0), 20);
  const b2bBonus = b2bLevel; // +1/+2/+3/+4 for B2B levels 1-4
  let base: number;
  if (isTSpin) {
    if (linesCleared === 1)      base = GARBAGE_TSPIN1[col];
    else if (linesCleared === 2) base = GARBAGE_TSPIN2[col];
    else                         base = GARBAGE_TSPIN3[col];
    base += b2bBonus;
  } else {
    if (linesCleared === 1)      base = GARBAGE_SINGLE[col];
    else if (linesCleared === 2) base = GARBAGE_DOUBLE[col];
    else if (linesCleared === 3) base = GARBAGE_TRIPLE[col];
    else                         base = GARBAGE_QUAD[col];
    if (linesCleared === 4)      base += b2bBonus; // B2B bonus only on Quads for non-T-spin
  }
  return base;
}

export function addGarbageToGrid(grid: number[][], garbageLines: number): number[][] {
  if (garbageLines <= 0) return grid;
  const newGrid = grid.map((row) => [...row]);
  for (let i = 0; i < garbageLines && i < GRID_HEIGHT; i++) {
    newGrid.shift();
    const garbageRow = Array(GRID_WIDTH).fill(8);
    garbageRow[Math.floor(Math.random() * GRID_WIDTH)] = 0;
    newGrid.push(garbageRow);
  }
  return newGrid;
}

export function applyQueuedGarbage(grid: number[][], garbageQueue: number): { grid: number[][]; applied: number } {
  if (garbageQueue <= 0) return { grid, applied: 0 };
  const toApply = Math.min(garbageQueue, GRID_HEIGHT - 5);
  const newGrid = addGarbageToGrid(grid, toApply);
  return { grid: newGrid, applied: toApply };
}
