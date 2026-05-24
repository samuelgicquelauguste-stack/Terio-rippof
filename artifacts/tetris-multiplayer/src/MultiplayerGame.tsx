import React, { useState, useEffect, useRef } from "react";
import { GameBoard, MiniGrid } from "./GameBoard";
import {
  createInitialGameState,
  movePieceDown,
  movePieceLeft,
  movePieceRight,
  rotatePieceWithKick,
  placePiece,
  clearLines,
  canPlacePiece,
  calculateGarbageSent,
  getNextPieceFromBag,
  generateShuffledBag,
} from "./gameLogic";
import { GameState } from "./gameConstants";

interface MultiplayerGameProps {
  playerId: string;
  onSendMessage: (msg: any) => void;
  opponentGameState: GameState | null;
  incomingGarbage: number;
  onGarbageProcessed: () => void;
}

export function MultiplayerGame({
  playerId,
  onSendMessage,
  opponentGameState,
  incomingGarbage,
  onGarbageProcessed,
}: MultiplayerGameProps) {
  const [gameState, setGameState] = useState(createInitialGameState());
  const [isGameActive, setIsGameActive] = useState(false);
  const [opponentGameOver, setOpponentGameOver] = useState(false);
  const dasDelay = 170;
  const arrRate = 30;
  const dasTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  const lastWasSpinRef = useRef<boolean>(false);
  const softDropIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockDelayLimit = 500;
  const maxLockResets = 15;
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockResetCountRef = useRef<number>(0);

  const stateRef = useRef(gameState);

  const finalizePiecePlacement = () => {
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = null;
    }
    lockResetCountRef.current = 0;

    let finalizedGrid = placePiece(stateRef.current.grid, stateRef.current.currentPiece);
    const { grid: clearedGrid, cleared } = clearLines(finalizedGrid);

    setGameState((prev: any) => {
      let workingBag = [...(prev.bag || [])];
      if (workingBag.length < 5) {
        workingBag = [...workingBag, ...generateShuffledBag()];
      }

      const activeQueue = [...(prev.nextPiece || [])];
      const spawnType = activeQueue.shift() || Math.floor(Math.random() * 7) + 1;
      
      const freshNextPiece = workingBag.shift()!;
      activeQueue.push(freshNextPiece);

      const spawnPiece = { type: spawnType, x: 3, y: 0, rotation: 0 };
      const hasToppedOut = !canPlacePiece(clearedGrid, spawnPiece);

      const isLineClear = cleared > 0;
      const currentCombo = isLineClear ? (prev.combo || 0) + 1 : 0;

      const isTSpin = lastWasSpinRef.current && prev.currentPiece.type === 6;
      const isPowerClear = cleared === 4 || isTSpin;

      let currentB2B = prev.backToBack;
      if (isLineClear) {
        currentB2B = isPowerClear ? true : false;
      }

      let garbageToSend = calculateGarbageSent(cleared);
      if (isTSpin && isLineClear) {
        garbageToSend += cleared * 2;
      }
      if (currentCombo > 1) {
        garbageToSend += Math.floor((currentCombo - 1) / 2);
      }
      if (currentB2B && isPowerClear && prev.backToBack) {
        garbageToSend += 1;
      }

      if (garbageToSend > 0) {
        onSendMessage({ type: "sendGarbage", playerId, garbageLines: garbageToSend });
      }

      lastWasSpinRef.current = false;

      const freshState = {
        ...prev,
        grid: clearedGrid,
        currentPiece: spawnPiece,
        nextPiece: activeQueue,
        bag: workingBag,
        hasHeldThisTurn: false,
        combo: currentCombo,
        backToBack: currentB2B,
        lines: prev.lines + cleared,
        level: Math.floor((prev.lines + cleared) / 10) + 1,
        score: prev.score + (cleared === 4 ? 1200 : cleared * 100),
        gameOver: hasToppedOut
      };

      if (hasToppedOut) {
        setIsGameActive(false);
        onSendMessage({ type: "gameOver", playerId, data: freshState });
      } else {
        onSendMessage({ type: "gameState", playerId, data: freshState });
      }
      return freshState;
    });
  };

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (opponentGameState?.gameOver) {
      setOpponentGameOver(true);
    }
  }, [opponentGameState]);

  useEffect(() => {
    if (incomingGarbage > 0 && isGameActive && !gameState.gameOver) {
      setGameState((prev: any) => {
        const updatedGrid = prev.grid.map((row: number[]) => [...row]);
        for (let i = 0; i < incomingGarbage; i++) {
          updatedGrid.shift();
          const garbageRow = Array(10).fill(8);
          garbageRow[Math.floor(Math.random() * 10)] = 0;
          updatedGrid.push(garbageRow);
        }
        return { ...prev, grid: updatedGrid };
      });
      onGarbageProcessed();
    }
  }, [incomingGarbage, isGameActive, onGarbageProcessed, gameState.gameOver]);

  useEffect(() => {
    if (!isGameActive || gameState.gameOver) return;

    let lastTime = 0;
    let dropCounter = 0;
    let animationFrameId: number;

    const gameTick = (time = 0) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;

      if (dropCounter > Math.max(50, 1000 - (stateRef.current.level * 80))) {
        const nextMove = movePieceDown(stateRef.current.grid, stateRef.current.currentPiece);
        
        if (nextMove) {
          setGameState((prev: any) => ({ ...prev, currentPiece: nextMove }));
          onSendMessage({ type: "gameState", playerId, data: { ...stateRef.current, currentPiece: nextMove } });
          
          if (lockTimeoutRef.current) {
            clearTimeout(lockTimeoutRef.current);
            lockTimeoutRef.current = null;
          }
        } else {
          if (!lockTimeoutRef.current) {
            lockTimeoutRef.current = setTimeout(() => {
              finalizePiecePlacement();
            }, lockDelayLimit);
          }
        }
        dropCounter = 0;
      }
      animationFrameId = requestAnimationFrame(gameTick);
    };

    animationFrameId = requestAnimationFrame(gameTick);
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, [isGameActive, gameState.gameOver, playerId, onSendMessage]);

  useEffect(() => {
    const handleLockDelayReset = () => {
      const resting = !movePieceDown(stateRef.current.grid, stateRef.current.currentPiece);
      if (resting && lockTimeoutRef.current && lockResetCountRef.current < maxLockResets) {
        clearTimeout(lockTimeoutRef.current);
        lockResetCountRef.current += 1;
        lockTimeoutRef.current = setTimeout(() => {
          finalizePiecePlacement();
        }, lockDelayLimit);
      }
    };

    const triggerLateralMove = (key: string) => {
      setGameState((prev: any) => {
        let updatedPiece = prev.currentPiece;
        if (key === "ArrowLeft") updatedPiece = movePieceLeft(stateRef.current.grid, stateRef.current.currentPiece);
        if (key === "ArrowRight") updatedPiece = movePieceRight(stateRef.current.grid, stateRef.current.currentPiece);
        return { ...prev, currentPiece: updatedPiece };
      });
      setTimeout(handleLockDelayReset, 0);
    };

    const triggerSoftDropMove = () => {
      setGameState((prev: any) => {
        const downMove = movePieceDown(stateRef.current.grid, stateRef.current.currentPiece);
        if (downMove) {
          return { ...prev, currentPiece: downMove };
        }
        return prev;
      });
    };

    const clearDasTimers = () => {
      if (dasTimeoutRef.current) { clearTimeout(dasTimeoutRef.current); dasTimeoutRef.current = null; }
      if (arrIntervalRef.current) { clearInterval(arrIntervalRef.current); arrIntervalRef.current = null; }
    };

    const clearSoftDropTimer = () => {
      if (softDropIntervalRef.current) {
        clearInterval(softDropIntervalRef.current);
        softDropIntervalRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameActive || stateRef.current.gameOver) return;

      const gameKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Shift", "w", "W", "d", "D"];
      if (gameKeys.includes(e.key)) e.preventDefault();

      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && activeKeyRef.current !== e.key) {
        clearDasTimers();
        activeKeyRef.current = e.key;
        triggerLateralMove(e.key);

        dasTimeoutRef.current = setTimeout(() => {
          arrIntervalRef.current = setInterval(() => {
            triggerLateralMove(e.key);
          }, arrRate);
        }, dasDelay);
      }

      if (e.key === "ArrowDown" && !softDropIntervalRef.current) {
        triggerSoftDropMove();
        softDropIntervalRef.current = setInterval(() => {
          triggerSoftDropMove();
        }, 15);
      } else if (e.key === "ArrowUp") {
        const { piece: rotatedPiece, wasSpin } = rotatePieceWithKick(stateRef.current.grid, stateRef.current.currentPiece, "cw");
        setGameState((prev: any) => ({ ...prev, currentPiece: rotatedPiece }));
        lastWasSpinRef.current = wasSpin;
        setTimeout(handleLockDelayReset, 0);
      } else if (e.key === "d" || e.key === "D") {
        const { piece: ccwPiece, wasSpin } = rotatePieceWithKick(stateRef.current.grid, stateRef.current.currentPiece, "ccw");
        setGameState((prev: any) => ({ ...prev, currentPiece: ccwPiece }));
        lastWasSpinRef.current = wasSpin;
        setTimeout(handleLockDelayReset, 0);
      } else if (e.key === "w" || e.key === "W") {
        const { piece: flippedPiece, wasSpin } = rotatePieceWithKick(stateRef.current.grid, stateRef.current.currentPiece, "180");
        setGameState((prev: any) => ({ ...prev, currentPiece: flippedPiece }));
        lastWasSpinRef.current = wasSpin;
        setTimeout(handleLockDelayReset, 0);
      } else if (e.key === "Shift") {
        if (stateRef.current.hasHeldThisTurn) return;
        if (lockTimeoutRef.current) {
          clearTimeout(lockTimeoutRef.current);
          lockTimeoutRef.current = null;
          lockResetCountRef.current = 0;
        }
        setGameState((prev: any) => {
          let workingBag = [...(prev.bag || [])];
          let activeQueue = [...(prev.nextPiece || [])];
          let spawningType = prev.currentPiece.type;

          if (prev.heldPiece === null) {
            spawningType = activeQueue.shift()!;
            if (workingBag.length < 5) workingBag = [...workingBag, ...generateShuffledBag()];
            activeQueue.push(workingBag.shift()!);
          } else {
            spawningType = prev.heldPiece;
          }

          const freshState = {
            ...prev,
            heldPiece: prev.currentPiece.type,
            currentPiece: { type: spawningType, x: 3, y: 0, rotation: 0 },
            nextPiece: activeQueue,
            bag: workingBag,
            hasHeldThisTurn: true
          };
          onSendMessage({ type: "gameState", playerId, data: freshState });
          return freshState;
        });
      } else if (e.key === " ") {
        if (lockTimeoutRef.current) {
          clearTimeout(lockTimeoutRef.current);
          lockTimeoutRef.current = null;
          lockResetCountRef.current = 0;
        }
        let currentPiece = { ...stateRef.current.currentPiece };
        let currentGrid = stateRef.current.grid;
        
        let testPiece = movePieceDown(currentGrid, currentPiece);
        while (testPiece !== null) {
          currentPiece = testPiece;
          testPiece = movePieceDown(currentGrid, currentPiece);
        }

        let finalizedGrid = placePiece(currentGrid, currentPiece);
        const { grid: clearedGrid, cleared } = clearLines(finalizedGrid);
        
        setGameState((prev: any) => {
          let workingBag = [...(prev.bag || [])];
          if (workingBag.length < 5) workingBag = [...workingBag, ...generateShuffledBag()];

          const activeQueue = [...(prev.nextPiece || [])];
          const spawnType = activeQueue.shift() || Math.floor(Math.random() * 7) + 1;
          
          const freshNextPiece = workingBag.shift()!;
          activeQueue.push(freshNextPiece);

          const spawnPiece = { type: spawnType, x: 3, y: 0, rotation: 0 };
          const hasToppedOut = !canPlacePiece(clearedGrid, spawnPiece);

          const isLineClear = cleared > 0;
          const currentCombo = isLineClear ? (prev.combo || 0) + 1 : 0;
          const isTSpin = lastWasSpinRef.current && prev.currentPiece.type === 6;
          const isPowerClear = cleared === 4 || isTSpin;

          let currentB2B = prev.backToBack;
          if (isLineClear) {
            currentB2B = isPowerClear ? true : false;
          }

          let garbageToSend = calculateGarbageSent(cleared);
          if (isTSpin && isLineClear) garbageToSend += cleared * 2; 
          if (currentCombo > 1) garbageToSend += Math.floor((currentCombo - 1) / 2);
          if (currentB2B && isPowerClear && prev.backToBack) garbageToSend += 1;

          if (garbageToSend > 0) {
            onSendMessage({ type: "sendGarbage", playerId, garbageLines: garbageToSend });
          }

          lastWasSpinRef.current = false;

          const freshState = {
            ...prev,
            grid: clearedGrid,
            currentPiece: spawnPiece,
            nextPiece: activeQueue,
            bag: workingBag,
            hasHeldThisTurn: false,
            combo: currentCombo,
            backToBack: currentB2B,
            lines: prev.lines + cleared,
            level: Math.floor((prev.lines + cleared) / 10) + 1,
            score: prev.score + (cleared === 4 ? 1200 : cleared * 100) + 20,
            gameOver: hasToppedOut
          };
          
          if (hasToppedOut) {
            setIsGameActive(false);
            onSendMessage({ type: "gameOver", playerId, data: freshState });
          } else {
            onSendMessage({ type: "gameState", playerId, data: freshState });
          }
          return freshState;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === activeKeyRef.current) {
        clearDasTimers();
        activeKeyRef.current = null;
      }
      if (e.key === "ArrowDown") {
        clearSoftDropTimer();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearDasTimers();
      clearSoftDropTimer();
    };
  }, [isGameActive, playerId, onSendMessage]);

  const resetGame = () => {
    setGameState(createInitialGameState());
    setOpponentGameOver(false);
    setIsGameActive(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <div className="bg-gray-800 border-4 border-red-500 p-8 rounded-xl text-center max-w-sm shadow-2xl">
            <h2 className="text-4xl font-extrabold text-red-500 tracking-wider mb-2">💥 DEFEAT</h2>
            <p className="text-gray-400 mb-6 text-sm font-medium">You stacked out up to the ceiling!</p>
            <div className="bg-gray-900/50 rounded-lg p-3 mb-6 text-left border border-gray-700">
              <div className="text-xs text-gray-400">Final Record Score:</div>
              <div className="text-2xl font-bold text-yellow-400">{gameState.score} pts</div>
            </div>
            <button onClick={resetGame} className="px-6 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-lg w-full text-white shadow-lg">
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {opponentGameOver && !gameState.gameOver && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <div className="bg-gray-800 border-4 border-green-500 p-8 rounded-xl text-center max-w-sm shadow-2xl">
            <h2 className="text-4xl font-extrabold text-green-400 tracking-wider mb-2">👑 VICTORY</h2>
            <p className="text-gray-400 mb-6 text-sm font-medium">Your opponent topped out first!</p>
            <button onClick={resetGame} className="px-6 py-3 bg-green-600 hover:bg-green-700 font-bold rounded-lg w-full text-white shadow-lg">
              START NEW MATCH
            </button>
          </div>
        </div>
      )}

      <div className="flex-row-layout" style={{ maxWidth: '1200px', backgroundColor: '#030712', padding: '24px', borderRadius: '16px', border: '1px solid #1f2937', margin: '0 auto' }}>
        <div className="sidebar-panel">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ textAlign: 'center' }}>Hold</h3>
          <MiniGrid pieceId={gameState.heldPiece} />
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2 text-blue-400">You ({playerId})</h2>
          <GameBoard grid={gameState.grid} currentPiece={gameState.currentPiece} />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center bg-gray-800 p-3 rounded-lg w-full">
            <div><p className="text-xs text-gray-400">Score</p><p className="text-lg font-bold text-yellow-400">{gameState.score}</p></div>
            <div><p className="text-xs text-gray-400">Lines</p><p className="text-lg font-bold text-white">{gameState.lines}</p></div>
            <div><p className="text-xs text-gray-400">Level</p><p className="text-lg font-bold text-cyan-400">{gameState.level}</p></div>
          </div>
        </div>

        <div className="sidebar-panel">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3" style={{ textAlign: 'center' }}>Next</h3>
          <div className="next-queue-stack">
            {Array.isArray(gameState.nextPiece) && gameState.nextPiece.map((pieceId: number, index: number) => (
              <div key={index} style={{ transform: index === 0 ? 'scale(1)' : 'scale(0.8)', opacity: index === 0 ? 1 : 0.4 }}>
                <MiniGrid pieceId={pieceId} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2 text-red-400">Opponent {opponentGameOver && "🚨 TOUT"}</h2>
          <GameBoard 
            grid={opponentGameState ? opponentGameState.grid : Array(20).fill(null).map(() => Array(10).fill(0))} 
            currentPiece={opponentGameState?.currentPiece}
            isOpponent={true} 
          />
        </div>
      </div>

      {!gameState.gameOver && !opponentGameOver && (
        <button
          onClick={() => setIsGameActive((prev: boolean) => !prev)}
          className={`mt-8 px-8 py-3 rounded-lg font-bold text-lg text-white transform active:scale-95 transition-all ${
            isGameActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isGameActive ? "PAUSE MATCH" : "START MATCH"}
        </button>
      )}
    </div>
  );
}
