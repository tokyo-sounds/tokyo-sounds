"use client";

/**
 * useMultiplayer Hook
 * 
 * Manages WebSocket connection to the multiplayer server.
 * Non-blocking with silent reconnection attempts.
 * 
 * - Auto-connect on mount (non-blocking)
 * - Silent retry every 5s on failure
 * - Sends player updates at 20Hz (throttled)
 * - Returns nearby players for rendering
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  type PlayerState,
  type LocalPlayerUpdate,
  type ServerMessage,
  type ClientMessage,
  CLIENT_UPDATE_INTERVAL_MS,
  RECONNECT_INTERVAL_MS,
} from "@/types/multiplayer";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface UseMultiplayerOptions {
  serverUrl: string;
  playerName: string;
  planeColor: string;
  enabled?: boolean;
}

export interface UseMultiplayerReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  nearbyPlayers: PlayerState[];
  sendUpdate: (update: LocalPlayerUpdate) => void;
  playerCount: number;
}

export function useMultiplayer({
  serverUrl,
  playerName,
  planeColor,
  enabled = true,
}: UseMultiplayerOptions): UseMultiplayerReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [nearbyPlayers, setNearbyPlayers] = useState<PlayerState[]>([]);
  const [playerCount, setPlayerCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const playerNameRef = useRef(playerName);
  const planeColorRef = useRef(planeColor);

  useEffect(() => {
    playerNameRef.current = playerName;
    planeColorRef.current = planeColor;
  }, [playerName, planeColor]);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as ServerMessage;

      switch (message.type) {
        case "welcome":
          playerIdRef.current = message.id;
          console.log(`[Multiplayer] Connected as ${message.id}`);
          break;

        case "players":
          setNearbyPlayers(message.players);
          setPlayerCount(message.players.length + 1);
          break;

        case "playerJoined":
          console.log(`[Multiplayer] Player joined: ${message.player.name}`);
          break;

        case "playerLeft":
          console.log(`[Multiplayer] Player left: ${message.id}`);
          setNearbyPlayers((prev) => prev.filter((p) => p.id !== message.id));
          break;
      }
    } catch (error) {
      console.error("[Multiplayer] Error parsing message:", error);
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !serverUrl) {
      console.log("[Multiplayer] Not connecting:", { enabled, serverUrl });
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    console.log("[Multiplayer] Attempting connection to:", serverUrl);
    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }

        setConnectionStatus("connected");
        console.log("[Multiplayer] Connected to server");

        sendMessage({
          type: "join",
          name: playerNameRef.current,
          color: planeColorRef.current,
        });
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        if (!mountedRef.current) return;

        console.log("[Multiplayer] Connection closed:", event.code, event.reason);
        setConnectionStatus("disconnected");
        setNearbyPlayers([]);
        setPlayerCount(0);
        wsRef.current = null;
        playerIdRef.current = null;

        if (enabled && mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && enabled) {
              connect();
            }
          }, RECONNECT_INTERVAL_MS);
        }
      };

      ws.onerror = (event) => {
        console.log("[Multiplayer] Connection error:", event);
      };
    } catch (error) {
      console.log("[Multiplayer] Failed to create WebSocket:", error);
      setConnectionStatus("disconnected");

      if (enabled && mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && enabled) {
            connect();
          }
        }, RECONNECT_INTERVAL_MS);
      }
    }
  }, [enabled, serverUrl, sendMessage, handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: "leave" });
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    playerIdRef.current = null;
    setConnectionStatus("disconnected");
    setNearbyPlayers([]);
    setPlayerCount(0);
  }, [sendMessage]);

  const sendUpdate = useCallback((update: LocalPlayerUpdate) => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < CLIENT_UPDATE_INTERVAL_MS) {
      return;
    }
    lastUpdateTimeRef.current = now;

    sendMessage({
      type: "update",
      ...update,
    });
  }, [sendMessage]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      const timeout = setTimeout(connect, 100);
      return () => {
        clearTimeout(timeout);
        mountedRef.current = false;
        disconnect();
      };
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  useEffect(() => {
    if (enabled && connectionStatus === "connected") {
      disconnect();
      connect();
    }
  }, [serverUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connectionStatus,
    isConnected: connectionStatus === "connected",
    nearbyPlayers,
    sendUpdate,
    playerCount,
  };
}
