import React, { useState, useEffect, useRef } from "react";
import { GameMessage, GameState } from "../gameConstants";
import { GameWebSocketClient } from "../websocketClient";
import { MultiplayerGame } from "../MultiplayerGame";

export default function Home() {
  const defaultServerUrl = import.meta.env.VITE_WS_SERVER_URL ?? `${window.location.host}/ws`;
  const [mounted, setMounted] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [connected, setConnected] = useState(false);
  const [opponentGameState, setOpponentGameState] = useState<GameState | null>(null);
  const [serverUrl, setServerUrl] = useState(defaultServerUrl);
  const [showSettings, setShowSettings] = useState(true);
  const [incomingGarbage, setIncomingGarbage] = useState(0);
  const wsClientRef = useRef<GameWebSocketClient | null>(null);

  useEffect(() => {
    setPlayerId(`player-${Math.random().toString(36).substring(7)}`);
    setMounted(true);
  }, []);

  const connectToServer = async () => {
    try {
      const client = new GameWebSocketClient(playerId);
      wsClientRef.current = client;

      client.on("gameState", (message) => {
        if (message.playerId !== playerId) {
          setOpponentGameState(message.data);
        }
      });

      client.on("sendGarbage", (message) => {
        if (message.playerId !== playerId && message.garbageLines) {
          setIncomingGarbage((prev) => prev + message.garbageLines);
        }
      });

      client.on("gameOver", (message) => {
        console.log("Opponent game over:", message);
      });

      client.on("chat", (message) => {
        console.log("Message:", message.message);
      });

      await client.connect(serverUrl);
      setConnected(true);
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to connect:", error);
      alert("Failed to connect to server. Check the URL and try again.");
    }
  };

  const handleSendMessage = (message: GameMessage) => {
    if (wsClientRef.current) {
      wsClientRef.current.send(message);
    }
  };

  const handleGarbageProcessed = () => {
    setIncomingGarbage(0);
  };

  useEffect(() => {
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-900" />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">
          🎮 Multiplayer Tetris
        </h1>

        {showSettings ? (
          <div className="flex flex-col items-center gap-4 bg-gray-800 p-8 rounded-lg max-w-md mx-auto shadow-xl">
            <h2 className="text-2xl font-bold">Game Setup</h2>

            <div className="w-full">
              <label className="block text-sm mb-2">Server Address:</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="localhost:8080"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Default: {defaultServerUrl}
              </p>
            </div>

            <div className="w-full text-sm text-gray-300">
              <p className="mb-2">Your Player ID:</p>
              <p className="font-mono bg-gray-700 p-2 rounded break-all">
                {playerId}
              </p>
            </div>

            <button
              onClick={connectToServer}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition"
            >
              Connect & Play
            </button>
          </div>
        ) : connected ? (
          <div>
            <div className="text-center mb-4 text-green-400 font-bold">
              ✓ Connected to server
            </div>
            <MultiplayerGame
              playerId={playerId}
              onSendMessage={handleSendMessage}
              opponentGameState={opponentGameState}
              incomingGarbage={incomingGarbage}
              onGarbageProcessed={handleGarbageProcessed}
            />
          </div>
        ) : (
          <div className="text-center text-red-500">
            Connecting...
          </div>
        )}

        <div className="mt-8 bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto shadow-md">
          <h3 className="text-xl font-bold mb-4 text-center">Controls</h3>
          <ul className="space-y-2 text-sm text-gray-300 text-center">
            <li>← → : Move left/right</li>
            <li>↑ : Rotate Shape</li>
            <li>Space : Hard Drop</li>
            <li>Shift : Hold Piece</li>
            <li>D : Counter-clockwise rotate</li>
            <li>W : 180° rotate</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
