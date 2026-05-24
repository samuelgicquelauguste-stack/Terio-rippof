import React, { useEffect, useRef } from 'react';
import { getTetromino } from './gameLogic';

interface GameBoardProps {
  grid: number[][];
  currentPiece?: { type: number; x: number; y: number; rotation: number };
  isOpponent?: boolean;
  isDanger?: boolean;
  nextPieceType?: number;
}

const COLORS = [
  '#000000',
  '#00f0f0',
  '#0000f0',
  '#f0a000',
  '#f0f000',
  '#00f000',
  '#a000f0',
  '#f00000',
  '#555555'
];

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

export function GameBoard({ grid, currentPiece, isOpponent = false, isDanger = false, nextPieceType }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const BLOCK_SIZE = 24;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    if (currentPiece && currentPiece.type && grid) {
      const shape = getTetromino(currentPiece.type, currentPiece.rotation);
      
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

      let ghostY = currentPiece.y;
      while (checkFit(ghostY + 1)) {
        ghostY++;
      }

      if (ghostY > currentPiece.y) {
        ctx.save();
        ctx.globalAlpha = 0.25;
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

    if (isDanger && nextPieceType && nextPieceType > 0) {
      const spawnShape = getTetromino(nextPieceType, 0);
      const spawnX = 3;
      const spawnY = 0;
      ctx.save();
      spawnShape.forEach((row, dy) => {
        row.forEach((value, dx) => {
          if (value === 0) return;
          const cx = (spawnX + dx) * BLOCK_SIZE;
          const cy = (spawnY + dy) * BLOCK_SIZE;
          const cellAlreadyFilled = grid[spawnY + dy]?.[spawnX + dx] > 0;
          ctx.strokeStyle = cellAlreadyFilled ? '#ff2222' : '#ff6666';
          ctx.lineWidth = cellAlreadyFilled ? 2.5 : 1.5;
          ctx.globalAlpha = cellAlreadyFilled ? 0.9 : 0.5;
          const pad = 4;
          ctx.beginPath();
          ctx.moveTo(cx + pad, cy + pad);
          ctx.lineTo(cx + BLOCK_SIZE - 1 - pad, cy + BLOCK_SIZE - 1 - pad);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + BLOCK_SIZE - 1 - pad, cy + pad);
          ctx.lineTo(cx + pad, cy + BLOCK_SIZE - 1 - pad);
          ctx.stroke();
        });
      });
      ctx.restore();
    }
  }, [grid, currentPiece, isDanger, nextPieceType]);

  return (
    <div style={{
      padding: '8px',
      backgroundColor: '#1f2937',
      borderRadius: '8px',
      border: isDanger ? '2px solid #ef4444' : isOpponent ? '2px solid #ef4444' : '2px solid #3b82f6',
      animation: isDanger ? 'dangerBorder 2s ease-in-out infinite' : undefined,
      transition: 'border-color 0.2s',
    }}>
      <canvas ref={canvasRef} width={10 * 24} height={20 * 24} style={{ backgroundColor: '#111827', display: 'block' }} />
    </div>
  );
}
