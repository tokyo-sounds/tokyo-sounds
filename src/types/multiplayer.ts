/**
 * Multiplayer Types
 * Shared type definitions for WebSocket communication between client and server
 */

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PlayerState {
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

export interface LocalPlayerUpdate {
  position: Position3D;
  quaternion: Quaternion;
  heading: number;
  pitch: number;
  roll: number;
  speed: number;
}

export interface JoinMessage {
  type: "join";
  name: string;
  color: string;
}

export interface UpdateMessage {
  type: "update";
  position: Position3D;
  quaternion: Quaternion;
  heading: number;
  pitch: number;
  roll: number;
  speed: number;
}

export interface LeaveMessage {
  type: "leave";
}

export type ClientMessage = JoinMessage | UpdateMessage | LeaveMessage;

export interface WelcomeMessage {
  type: "welcome";
  id: string;
}

export interface PlayersMessage {
  type: "players";
  players: PlayerState[];
}

export interface PlayerJoinedMessage {
  type: "playerJoined";
  player: PlayerState;
}

export interface PlayerLeftMessage {
  type: "playerLeft";
  id: string;
}

export type ServerMessage =
  | WelcomeMessage
  | PlayersMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage;

export const VISIBILITY_RADIUS = 500;
export const FADE_START_DISTANCE = 300;
export const BROADCAST_INTERVAL_MS = 50;
export const CLIENT_UPDATE_INTERVAL_MS = 50;
export const STALE_PLAYER_TIMEOUT_MS = 10000;
export const RECONNECT_INTERVAL_MS = 5000;
