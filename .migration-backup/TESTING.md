# Testing the Multiplayer Tetris Game

## Quick Start (Local Testing)

### Step 1: Start the WebSocket Server (Terminal 1)
```bash
cd "/Users/samuel/Desktop/ripoff tetrio"
npx ts-node server.ts
```
You should see:
```
WebSocket server running on ws://localhost:8080
Waiting for players to connect...
```

### Step 2: Start the Next.js Dev Server (Terminal 2)
```bash
cd "/Users/samuel/Desktop/ripoff tetrio"
npm run dev
```
You should see:
```
▲ Next.js 15.2.1
- Local:        http://localhost:3000
```

### Step 3: Open Two Browser Tabs/Windows

**Player 1:**
- Open `http://localhost:3000` in your browser
- Leave the server URL as `localhost:8080`
- Click "Connect & Play"

**Player 2:**
- Open `http://localhost:3000` in another browser tab/window
- Leave the server URL as `localhost:8080`
- Click "Connect & Play"

### Step 4: Play!
- **Arrow Keys**: Move pieces left/right
- **Up Arrow**: Rotate (with SRS wall kicks)
- **Space**: Hard drop
- Both players can start their game independently

## Testing Features

### Test Garbage System
1. Clear different numbers of lines and watch garbage sent to opponent
   - 1 line = 0 garbage
   - 2 lines = 1 garbage
   - 3 lines = 2 garbage
   - 4 lines (Tetris) = 4 garbage
   - Check the opponent's "Incoming Trash" counter

2. Test B2B (Back-to-Back)
   - Clear a Tetris (4 lines)
   - Clear another Tetris immediately after
   - Watch the B2B 🔥 indicator and extra garbage sent

3. Test Combos
   - Clear consecutive lines
   - Watch the combo multiplier increase
   - See garbage increase per combo level

### Test Spin System
1. Rotate pieces into tight corners
2. You should see the "SPIN! ⚡" indicator
3. Spins add +1 garbage bonus

### Test Opponent Interactions
- Send garbage to opponent (watch their screen)
- Receive garbage from opponent
- Watch game state sync in real-time

## Network Testing (With Your Friend)

### Find Your Local IP
```bash
ifconfig | grep inet
```
Look for an address like `192.168.x.x` (not 127.0.0.1 or ::1)

### On Your Computer (Server Host)
```bash
npx ts-node server.ts
```

### On Friend's Computer
1. Open `http://YOUR_IP:3000` in browser
2. In the game settings, enter: `YOUR_IP:8080` (replace YOUR_IP)
3. Click "Connect & Play"

Now you can play together!

## Troubleshooting

### "WebSocket connection failed"
- Check that the server is running (`npx ts-node server.ts`)
- Verify the server URL is correct
- If on network, ensure firewall isn't blocking port 8080

### "Game pieces aren't moving"
- Ensure game is started (click "Start Game" button)
- Make sure browser window is focused
- Try refreshing the page

### "Server says players connected but can't see opponent"
- Refresh both browser tabs
- Check browser console for errors (F12 Dev Tools)
- Restart both server and dev server

### "TypeScript errors" when running ts-node
- Install ts-node globally: `npm install -g ts-node typescript`
- Or use: `npx tsx server.ts` instead of `npx ts-node server.ts`

## Performance Tips

- Close other browser tabs to reduce lag
- Run on the same network for local testing
- Check network conditions if testing over internet (use `localhost` for best results)

## Code Changes Made

- **Garbage System**: Accurate 1/2/3/4 line mapping (0/1/2/4 garbage)
- **SRS Spins**: Full Super Rotation System with wall kicks on all pieces
- **Combo System**: +0.25× multiplier per combo level
- **B2B Bonus**: +1.5× multiplier for consecutive Tetris clears
- **Spin Detection**: Tracks spin rotations and adds +1 garbage

## Next Steps

Once you've tested locally:
1. Deploy the server to a cloud service (Heroku, Railway, AWS, etc.)
2. Deploy the Next.js frontend to Vercel or Netlify
3. Share the game URL with your friend!
