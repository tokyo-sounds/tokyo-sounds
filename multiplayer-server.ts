/**
 * Tokyo Sounds Multiplayer Server
 * 
 * Standalone WebSocket server for real-time multiplayer synchronization.
 * Run with: npx tsx multiplayer-server.ts
 * 
 * Features:
 * - Tracks all connected players
 * - Broadcasts nearby players (within 500m) every 50ms
 * - Cleans up stale connections after 10s
 * - Uses ENU coordinates for distance calculations
 */

import { WebSocketServer, WebSocket } from "ws";
import { networkInterfaces } from "os";
import { createServer as createHttpsServer } from "https";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Types (duplicated from src/types/multiplayer.ts to keep server standalone)

interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface PlayerState {
  id: string;
  name: string;
  color: string;
  position: Position3D;
  quaternion: Quaternion;
  heading: number;
  pitch: number;
  roll: number;
  speed: number;
  lastUpdate: number;
}

interface JoinMessage {
  type: "join";
  name: string;
  color: string;
}

interface UpdateMessage {
  type: "update";
  position: Position3D;
  quaternion: Quaternion;
  heading: number;
  pitch: number;
  roll: number;
  speed: number;
}

interface LeaveMessage {
  type: "leave";
}

type ClientMessage = JoinMessage | UpdateMessage | LeaveMessage;

const PORT = parseInt(process.env.PORT || "3001", 10);
const VISIBILITY_RADIUS = 500; // meters
const BROADCAST_INTERVAL_MS = 50; // 20Hz
const STALE_PLAYER_TIMEOUT_MS = 10000; // 10 seconds

const players = new Map<string, PlayerState>();
const sockets = new Map<string, WebSocket>();

let nextPlayerId = 1;

function generatePlayerId(): string {
  return `player_${nextPlayerId++}_${Date.now().toString(36)}`;
}

function calculateDistance(a: Position3D, b: Position3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getNearbyPlayers(playerId: string, radius: number): PlayerState[] {
  const player = players.get(playerId);
  if (!player) return [];

  const nearby: PlayerState[] = [];
  
  for (const [id, other] of players) {
    if (id === playerId) continue;
    
    const distance = calculateDistance(player.position, other.position);
    if (distance <= radius) {
      nearby.push(other);
    }
  }

  return nearby;
}

function handleJoin(ws: WebSocket, playerId: string, message: JoinMessage): void {
  const player: PlayerState = {
    id: playerId,
    name: message.name || "Anonymous",
    color: message.color || "#BAE1FF",
    position: { x: 0, y: 200, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    heading: 0,
    pitch: 0,
    roll: 0,
    speed: 0,
    lastUpdate: Date.now(),
  };

  players.set(playerId, player);
  sockets.set(playerId, ws);

  ws.send(JSON.stringify({ type: "welcome", id: playerId }));

  for (const [id, socket] of sockets) {
    if (id === playerId) continue;
    
    const otherPlayer = players.get(id);
    if (!otherPlayer) continue;

    const distance = calculateDistance(player.position, otherPlayer.position);
    if (distance <= VISIBILITY_RADIUS) {
      socket.send(JSON.stringify({ type: "playerJoined", player }));
    }
  }

  console.log(`[+] Player joined: ${player.name} (${playerId}) - Total: ${players.size}`);
}

function handleUpdate(playerId: string, message: UpdateMessage): void {
  const player = players.get(playerId);
  if (!player) return;

  player.position = message.position;
  player.quaternion = message.quaternion;
  player.heading = message.heading;
  player.pitch = message.pitch;
  player.roll = message.roll;
  player.speed = message.speed;
  player.lastUpdate = Date.now();
}

function handleLeave(playerId: string): void {
  const player = players.get(playerId);
  if (!player) return;

  players.delete(playerId);
  sockets.delete(playerId);

  for (const [, socket] of sockets) {
    socket.send(JSON.stringify({ type: "playerLeft", id: playerId }));
  }

  console.log(`[-] Player left: ${player.name} (${playerId}) - Total: ${players.size}`);
}

function handleMessage(ws: WebSocket, playerId: string, data: string): void {
  try {
    const message = JSON.parse(data) as ClientMessage;

    switch (message.type) {
      case "join":
        handleJoin(ws, playerId, message);
        break;
      case "update":
        handleUpdate(playerId, message);
        break;
      case "leave":
        handleLeave(playerId);
        break;
      default:
        console.warn(`Unknown message type from ${playerId}:`, message);
    }
  } catch (error) {
    console.error(`Error parsing message from ${playerId}:`, error);
  }
}

function broadcastNearbyPlayers(): void {
  for (const [playerId, socket] of sockets) {
    if (socket.readyState !== WebSocket.OPEN) continue;

    const nearbyPlayers = getNearbyPlayers(playerId, VISIBILITY_RADIUS);
    
    socket.send(JSON.stringify({
      type: "players",
      players: nearbyPlayers,
    }));
  }
}

function cleanupStalePlayers(): void {
  const now = Date.now();
  const staleIds: string[] = [];

  for (const [id, player] of players) {
    if (now - player.lastUpdate > STALE_PLAYER_TIMEOUT_MS) {
      staleIds.push(id);
    }
  }

  for (const id of staleIds) {
    const socket = sockets.get(id);
    if (socket) {
      socket.close();
    }
    handleLeave(id);
    console.log(`[x] Cleaned up stale player: ${id}`);
  }
}

const certPath = join(process.cwd(), "certificates");
const keyFile = join(certPath, "localhost-key.pem");
const certFile = join(certPath, "localhost.pem");
const hasSSL = existsSync(keyFile) && existsSync(certFile);

let wss: WebSocketServer;

if (hasSSL) {
  const httpsServer = createHttpsServer({
    key: readFileSync(keyFile),
    cert: readFileSync(certFile),
  });
  
  wss = new WebSocketServer({ server: httpsServer });
  httpsServer.listen(PORT, "0.0.0.0");
  console.log("[Server] Running in WSS (secure) mode");
} else {
  wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });
  console.log("[Server] Running in WS (insecure) mode");
  console.log("[Server] For WSS, run 'npm run dev:https' first to generate certificates");
}

wss.on("connection", (ws: WebSocket) => {
  const playerId = generatePlayerId();

  ws.on("message", (data: Buffer) => {
    handleMessage(ws, playerId, data.toString());
  });

  ws.on("close", () => {
    handleLeave(playerId);
  });

  ws.on("error", (error: Error) => {
    console.error(`WebSocket error for ${playerId}:`, error);
    handleLeave(playerId);
  });
});

const broadcastInterval = setInterval(broadcastNearbyPlayers, BROADCAST_INTERVAL_MS);

const cleanupInterval = setInterval(cleanupStalePlayers, 5000);

function getLocalIP(): string {
  const nets = networkInterfaces();
  
  const priorityInterfaces = ["en0", "en6", "en1", "eth0", "wlan0", "Wi-Fi", "Ethernet"];
  
  for (const preferred of priorityInterfaces) {
    const netList = nets[preferred];
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  
  const skipPatterns = ["bridge", "vmnet", "veth", "docker", "br-", "virbr"];
  for (const name of Object.keys(nets)) {
    if (skipPatterns.some(pattern => name.toLowerCase().includes(pattern))) continue;
    
    const netList = nets[name];
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  
  return "localhost";
}

const localIP = getLocalIP();
const protocol = hasSSL ? "wss" : "ws";

console.log(`
╔════════════════════════════════════════════════════════════╗
║           Tokyo Sounds Multiplayer Server                  ║
╠════════════════════════════════════════════════════════════╣
║  Status:     Running                                       ║
║  Mode:       ${hasSSL ? "WSS (secure)  " : "WS (insecure) "}${" ".repeat(32)}║
║  Port:       ${PORT.toString().padEnd(44)}║
║  Visibility: ${VISIBILITY_RADIUS}m radius${" ".repeat(33)}║
║  Broadcast:  ${BROADCAST_INTERVAL_MS}ms (${Math.round(1000 / BROADCAST_INTERVAL_MS)}Hz)${" ".repeat(35)}║
╠════════════════════════════════════════════════════════════╣
║  Local:      ${protocol}://localhost:${PORT}${" ".repeat(hasSSL ? 27 : 28)}║
║  Network:    ${protocol}://${localIP}:${PORT}${" ".repeat(Math.max(0, (hasSSL ? 35 : 36) - localIP.length))}║
╠════════════════════════════════════════════════════════════╣
║  Set NEXT_PUBLIC_MULTIPLAYER_URL in .env.local for mobile  ║
╚════════════════════════════════════════════════════════════╝
`);

process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  
  clearInterval(broadcastInterval);
  clearInterval(cleanupInterval);
  
  for (const [, socket] of sockets) {
    socket.close();
  }
  sockets.clear();
  players.clear();
  
  wss.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
  
  setTimeout(() => {
    console.log("Forcing exit...");
    process.exit(0);
  }, 2000);
});
