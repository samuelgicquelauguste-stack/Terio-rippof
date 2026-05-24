# Multiplayer Tetris

A real-time multiplayer Tetris game where two players compete head-to-head via WebSocket. Players can send garbage lines to their opponent by clearing multiple lines at once.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API + WebSocket server (port 8080)
- `pnpm --filter @workspace/tetris-multiplayer run dev` — run the Vite frontend (port 25223)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/tetris-multiplayer)
- Backend: Express 5 + ws WebSocket server (artifacts/api-server)
- Routing: wouter
- Styling: Tailwind CSS v4

## Where things live

- `artifacts/tetris-multiplayer/src/` — React frontend
  - `pages/Home.tsx` — main page with server connection UI
  - `MultiplayerGame.tsx` — full game component with DAS/ARR engine
  - `GameBoard.tsx` — canvas-based board and mini-grid rendering
  - `gameLogic.ts` — SRS rotation, piece movement, line clearing
  - `gameConstants.ts` — tetromino shapes, game types
  - `websocketClient.ts` — WebSocket client with auto-reconnect
- `artifacts/api-server/src/websocket.ts` — WebSocket server (path: /ws)
- `artifacts/api-server/src/` — Express API server

## Architecture decisions

- WebSocket server runs on the same HTTP server as Express, mounted at `/ws`
- The `/ws` path is exposed in the API server's `artifact.toml` alongside `/api`
- Default server URL auto-detects `window.location.host + /ws` so it works in both dev and production
- Frontend uses `VITE_WS_SERVER_URL` env var to override the WebSocket URL

## Product

Two players connect to the same WebSocket server and play Tetris head-to-head. Clearing lines sends garbage rows to the opponent. Features include: 5-piece preview queue, hold piece, ghost piece, DAS/ARR engine, SRS wall kicks, T-spins, back-to-back bonuses, and combo multipliers.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The WS server path `/ws` must be listed in `artifacts/api-server/.replit-artifact/artifact.toml` paths for the proxy to route WebSocket upgrades correctly
- Do NOT run `pnpm dev` at workspace root — use workflow-specific commands

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
