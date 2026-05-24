import { GameMessage } from "./gameConstants";

export class GameWebSocketClient {
  private ws: WebSocket | null = null;
  private playerId: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(playerId: string) {
    this.playerId = playerId;
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = url.startsWith("ws") ? url : `${protocol}//${url}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.send({
            type: "join",
            playerId: this.playerId,
          });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: GameMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.attemptReconnect(url);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      setTimeout(() => this.connect(url), delay);
    }
  }

  private handleMessage(message: GameMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  on(messageType: string, handler: (data: any) => void) {
    this.messageHandlers.set(messageType, handler);
  }

  send(message: GameMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
