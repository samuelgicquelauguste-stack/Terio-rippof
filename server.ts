import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const PORT = process.env.PORT || 8080;

interface Player {
  id: string;
  ws: WebSocket;
  gameState: any;
}

const players: Map<string, Player> = new Map();

// Create HTTP server for WebSocket
const server = http.createServer();

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "join") {
        const playerId = data.playerId;
        players.set(playerId, {
          id: playerId,
          ws,
          gameState: null,
        });

        console.log(`Player ${playerId} joined. Total players: ${players.size}`);

        // Notify all players
        broadcastMessage({
          type: "playerJoined",
          playerId,
          totalPlayers: players.size,
        });
      } else if (data.type === "gameState") {
        const player = Array.from(players.values()).find(
          (p) => p.ws === ws
        );
        if (player) {
          player.gameState = data.data;

          // Broadcast to other players
          broadcastToOthers(ws, data);
        }
      } else if (data.type === "gameOver") {
        broadcastToOthers(ws, data);
      } else if (data.type === "chat") {
        broadcastMessage({
          type: "chat",
          playerId: data.playerId,
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  });

  ws.on("close", () => {
    // Find and remove player
    let playerId: string | null = null;
    for (const [id, player] of players.entries()) {
      if (player.ws === ws) {
        playerId = id;
        players.delete(id);
        break;
      }
    }

    if (playerId) {
      console.log(`Player ${playerId} disconnected. Total players: ${players.size}`);
      broadcastMessage({
        type: "playerLeft",
        playerId,
        totalPlayers: players.size,
      });
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

function broadcastMessage(message: any) {
  const data = JSON.stringify(message);
  for (const player of players.values()) {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data);
    }
  }
}

function broadcastToOthers(senderWs: WebSocket, message: any) {
  const data = JSON.stringify(message);
  for (const player of players.values()) {
    if (player.ws !== senderWs && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data);
    }
  }
}

server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log("Waiting for players to connect...");
});
