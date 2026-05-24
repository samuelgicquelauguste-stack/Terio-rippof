import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { logger } from "./lib/logger";

interface Player {
  id: string;
  ws: WebSocket;
  gameState: any;
}

const players: Map<string, Player> = new Map();

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    logger.info("New client connected");

    ws.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "join") {
          const playerId = data.playerId;
          players.set(playerId, {
            id: playerId,
            ws,
            gameState: null,
          });

          logger.info({ playerId, totalPlayers: players.size }, "Player joined");

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
            broadcastToOthers(ws, data);
          }
        } else if (data.type === "sendGarbage") {
          broadcastToOthers(ws, data);
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
        logger.error({ error }, "Failed to parse message");
      }
    });

    ws.on("close", () => {
      let playerId: string | null = null;
      for (const [id, player] of players.entries()) {
        if (player.ws === ws) {
          playerId = id;
          players.delete(id);
          break;
        }
      }

      if (playerId) {
        logger.info({ playerId, totalPlayers: players.size }, "Player disconnected");
        broadcastMessage({
          type: "playerLeft",
          playerId,
          totalPlayers: players.size,
        });
      }
    });

    ws.on("error", (error) => {
      logger.error({ error }, "WebSocket error");
    });
  });

  logger.info("WebSocket server set up at /ws");
  return wss;
}

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
