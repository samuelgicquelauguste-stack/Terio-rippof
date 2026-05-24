import { WebSocketServer } from "ws";
import http from "http";

const PORT = process.env.PORT || 8080;
const players = new Map();

// Create a native HTTP base server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Multiplayer backend active\n');
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New player client connected!");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "join") {
        const playerId = data.playerId;
        players.set(playerId, {
          id: playerId,
          ws,
          gameState: null,
        });

        console.log(`Player ${playerId} joined. Total: ${players.size}`);

        broadcastMessage({
          type: "playerJoined",
          playerId,
          totalPlayers: players.size,
        });
      } else if (data.type === "gameState") {
        const player = Array.from(players.values()).find((p) => p.ws === ws);
        if (player) {
          player.gameState = data.data;
          broadcastToOthers(ws, data);
        }
      } else if (data.type === "gameOver") {
        console.log(`Player ${data.playerId} has topped out!`);
        broadcastToOthers(ws, {
          type: "gameState",
          playerId: data.playerId,
          data: { gameOver: true }
        });
      } else if (data.type === "sendGarbage") {
        // GARBAGE ROUTING FIX: Forward garbage lines to the opponent immediately
        console.log(`Forwarding ${data.garbageLines} lines of garbage from ${data.playerId}`);
        broadcastToOthers(ws, data);
      } else if (data.type === "chat") {
        broadcastMessage({
          type: "chat",
          playerId: data.playerId,
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Failed to process socket payload:", error);
    }
  });

  ws.on("close", () => {
    let playerId = null;
    for (const [id, player] of players.entries()) {
      if (player.ws === ws) {
        playerId = id;
        players.delete(id);
        break;
      }
    }

    if (playerId) {
      console.log(`Player ${playerId} left. Remaining: ${players.size}`);
      broadcastMessage({
        type: "playerLeft",
        playerId,
        totalPlayers: players.size,
      });
    }
  });

  ws.on("error", (err) => {
    console.error("Internal WebSocket error:", err);
  });
});

function broadcastMessage(message) {
  const data = JSON.stringify(message);
  for (const player of players.values()) {
    if (player.ws.readyState === 1) { // 1 = OPEN
      player.ws.send(data);
    }
  }
}

function broadcastToOthers(senderWs, message) {
  const data = JSON.stringify(message);
  for (const player of players.values()) {
    if (player.ws !== senderWs && player.ws.readyState === 1) {
      player.ws.send(data);
    }
  }
}

server.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 MULTIPLAYER MATCHMAKER ACTIVE`);
  console.log(`📡 Listening smoothly on ws://localhost:${PORT}`);
  console.log(`=================================================\n`);
});
