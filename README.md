# Multiplayer Tetris Game

A real-time multiplayer Tetris game built with Next.js, React, and WebSocket support for playing with friends over the network.

## Features

- **Two-Player Competitive Tetris**: Play against your friend in real-time
- **Network Support**: Play over LAN or the internet (with proper setup)
- **Real-time Synchronization**: Instant game state updates via WebSocket
- **Classic Tetris Mechanics**: Standard Tetris rules and scoring
- **Responsive UI**: Built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Node.js WebSocket server (ws)
- **Real-time Communication**: WebSocket
- **Package Manager**: npm

## Project Structure

```
.
├── app/                      # Next.js app directory
│   ├── page.tsx             # Main game page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── GameBoard.tsx        # Single player game board display
│   └── MultiplayerGame.tsx  # Multiplayer game logic
├── lib/                     # Utilities and logic
│   ├── gameConstants.ts     # Game constants and types
│   ├── gameLogic.ts         # Core Tetris game logic
│   └── websocketClient.ts   # WebSocket client
├── server.ts                # WebSocket server
├── package.json             # Dependencies
└── README.md                # This file
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript server:
```bash
npm run build:server
```

## Running the Game

### Option 1: Local Play (Same Computer)

1. Start the WebSocket server:
```bash
npm run server
```

The server will start at `ws://localhost:8080`

2. In another terminal, start the Next.js development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

4. Two browser windows can now connect to the same server and play against each other

### Option 2: Network Play (Different Computers)

#### Server Setup (on one computer):

1. Find your local IP address:
   - **macOS/Linux**: `ifconfig | grep inet`
   - **Windows**: `ipconfig`

2. Start the server:
```bash
npm run server
```

3. Note the server IP and port (default: 8080)

#### Client Setup (on other computers):

1. Start the Next.js dev server:
```bash
npm run dev
```

2. Open `http://localhost:3000` (or the computer's IP:3000)

3. In the game settings, enter the server address: `server-ip:8080`

4. Connect and play!

## Game Controls

- **← / →**: Move piece left/right
- **↑**: Rotate piece
- **Space**: Hard drop

## How to Play

1. Start the game by clicking "Start Game"
2. Move, rotate, and drop Tetris pieces
3. Complete horizontal lines to clear them and score points
4. Level increases for every 10 lines cleared
5. Game ends when pieces reach the top

## Scoring

- 1 line: 40 × level points
- 2 lines: 100 × level points
- 3 lines: 300 × level points
- 4 lines: 1200 × level points

### Multipliers
- **Combo**: Each consecutive clear adds 1.25× multiplier (capped at combo level)
- **Back-to-Back (B2B)**: Consecutive 4-line clears get 1.5× multiplier
- **Spin Bonus**: +1 for any spin rotation (uses SRS wall kick system)

## Garbage/Trash System

When you clear lines, you send garbage to your opponent:

| Lines Cleared | Garbage Sent | B2B Bonus | Spin Bonus |
|---|---|---|---|
| 1 line | 0 | - | - |
| 2 lines | 1 | - | +1 if spin |
| 3 lines | 2 | - | +1 if spin |
| 4 lines (Tetris) | 4 | +1 | +1 if spin |

**Garbage with Combos**: Each combo level (starting from 2) adds +1 garbage

**Example Scenarios**:
- 2 lines + no spin = 1 garbage
- 2 lines + spin = 2 garbage (1 base + 1 spin)
- 4 lines (Tetris) = 4 garbage
- 4 lines (B2B Tetris) = 5 garbage (4 base + 1 B2B bonus)
- 4 lines (B2B Tetris) + spin = 6 garbage (4 base + 1 B2B + 1 spin)
- 3 lines at combo ×5 = 5 garbage (2 base + 3 combo)

## Spin System

This game uses the **SRS (Super Rotation System)** with wall kicks, enabling advanced spin mechanics:

- **T-Spins**: Rotate the T-piece into tight spaces
- **Wall Kicks**: Pieces can "kick" off walls and blocks to rotate in constrained areas
- **Spin Bonus**: Any spin rotation gives +1 garbage to send to opponent

Spins are detected when a rotation succeeds using a wall kick offset (not the standard position).

## Development

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js for production
- `npm run start` - Start Next.js production server
- `npm run lint` - Run ESLint
- `npm run server` - Start WebSocket server (requires ts-node)
- `npm run build:server` - Build TypeScript server to JavaScript

### Adding Features

Some ideas for future enhancements:
- Garbage blocks sent to opponent
- Player chat system
- Game statistics and replay system
- Difficulty levels
- Sound effects and music
- Mobile touch controls

## Troubleshooting

### Can't connect to server
- Ensure the server is running on the correct port
- Check firewall settings if playing over network
- Verify the server URL format (should be `ip:port`)

### Pieces not moving
- Make sure the game is started (click "Start Game")
- Check that the window is focused
- Try refreshing the page

### Game state mismatch
- WebSocket connection issues may cause desync
- Try reloading and reconnecting

## Deployment

To deploy this game online:

1. **Frontend**: Deploy Next.js to Vercel, Netlify, or your own server
2. **Server**: Deploy the WebSocket server to a service like Heroku, Railway, or AWS

For Vercel deployment, note that WebSocket servers need to be hosted separately (serverless functions don't support persistent WebSocket connections).

## License

This project is open source and available for personal use.
