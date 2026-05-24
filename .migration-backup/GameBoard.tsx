'use client';
import React, { useEffect, useRef } from 'react';
import { getTetromino } from './gameLogic';

interface GameBoardProps {
  grid: number[][];
  currentPiece?: { type: number; x: number; y: number; rotation: number };
  isOpponent?: boolean;
}

const COLORS = [
  '#000000', // 0: Empty
  '#00f0f0', // 1: Cyan (I)
  '#0000f0', // 2: Blue (J)
  '#f0a000', // 3: Orange (L)
  '#f0f000', // 4: Yellow (O)
  '#00f000', // 5: Green (S)
  '#a000f0', // 6: Purple (T)
  '#f00000', // 7: Red (Z)
  '#555555'  // 8: Grey (Garbage)
];

// --- DISPLAY MINI-GRIDS FOR HOLD & NEXT BLOCKS ---
export function MiniGrid({ pieceId }: { pieceId: number | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1f2937'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (pieceId && pieceId > 0) {
      const shape = getTetromino(pieceId, 0);
      ctx.fillStyle = COLORS[pieceId];
      
      const padX = (4 - shape.length) / 2;
      const padY = (4 - shape.length) / 2;

      shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value > 0) {
            ctx.fillRect(
              Math.floor(x + padX) * 16,
              Math.floor(y + padY) * 16,
              15,
              15
            );
          }
        });
      });
    }
  }, [pieceId]);

  return <canvas ref={canvasRef} width={64} height={64} style={{ backgroundColor: '#1f2937', display: 'block', borderRadius: '4px' }} />;
}

// --- MAIN PLAYING FIELD CANVASES ---
export function GameBoard({ grid, currentPiece, isOpponent = false }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const BLOCK_SIZE = 24;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Arena Floor
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Static Grid Matrix
    if (grid && Array.isArray(grid)) {
      grid.forEach((row, y) => {
        if (Array.isArray(row)) {
          row.forEach((value, x) => {
            if (value > 0) {
              ctx.fillStyle = COLORS[value] || '#555555';
              ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
          });
        }
      });
    }

    // --- GHOST PIECE PROJECTION CALCULATOR ENGINE ---
    if (currentPiece && currentPiece.type && grid) {
      const shape = getTetromino(currentPiece.type, currentPiece.rotation);
      
      // Local helper function to verify placement boundaries locally inside the canvas frame
      const checkFit = (testY: number) => {
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 0) continue;
            const targetX = currentPiece.x + col;
            const targetY = testY + row;
            if (targetX < 0 || targetX >= 10 || targetY < 0 || targetY >= 20) return false;
            if (grid[targetY] && grid[targetY][targetX] !== 0) return false;
          }
        }
        return true;
      };

      // Slide a virtual piece down row-by-row until it strikes the floor or an existing row stack
      let ghostY = currentPiece.y;
      while (checkFit(ghostY + 1)) {
        ghostY++;
      }

      // Draw Ghost Piece Projection Outline
      if (ghostY > currentPiece.y) {
        ctx.save();
        ctx.globalAlpha = 0.25; // Set translucency shadow alpha opacity level
        ctx.fillStyle = COLORS[currentPiece.type];
        
        shape.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value > 0) {
              ctx.fillRect(
                (currentPiece.x + x) * BLOCK_SIZE,
                (ghostY + y) * BLOCK_SIZE,
                BLOCK_SIZE - 1,
                BLOCK_SIZE - 1
              );
            }
          });
        });
        ctx.restore();
      }

      // Draw the Real Active Falling Block Matrix Piece over the top of the projection
      shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value > 0) {
            ctx.fillStyle = COLORS[currentPiece.type] || '#f00000';
            ctx.fillRect(
              (currentPiece.x + x) * BLOCK_SIZE,
              (currentPiece.y + y) * BLOCK_SIZE,
              BLOCK_SIZE - 1,
              BLOCK_SIZE - 1
            );
          }
        });
      });
    }
  }, [grid, currentPiece]);

  return (
    <div style={{ padding: '8px', backgroundColor: '#1f2937', borderRadius: '8px', border: isOpponent ? '2px solid #ef4444' : '2px solid #3b82f6' }}>
      <canvas ref={canvasRef} width={10 * 24} height={20 * 24} style={{ backgroundColor: '#111827', display: 'block' }} />
    </div>
  );
}
