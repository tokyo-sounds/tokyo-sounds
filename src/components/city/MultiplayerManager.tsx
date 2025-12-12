"use client";

/**
 * MultiplayerManager Component
 * 
 * Encapsulates multiplayer state management inside the R3F Canvas.
 * This prevents multiplayer state updates (20Hz) from causing
 * re-renders of the parent component and other siblings.
 * 
 * Uses refs for position updates to avoid React re-renders entirely
 * for the high-frequency plane position updates.
 */

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { OtherPlayers } from "./OtherPlayers";
import { type LocalPlayerUpdate } from "@/types/multiplayer";

interface MultiplayerManagerProps {
  serverUrl: string;
  playerName: string;
  planeColor: string;
  enabled: boolean;
  localPlayerPositionRef: React.RefObject<THREE.Vector3>;
  localPlayerQuaternionRef: React.RefObject<THREE.Quaternion>;
  flightDataRef: React.RefObject<{ heading: number; pitch: number; roll: number; speed: number }>;
  onConnectionChange?: (connected: boolean, playerCount: number) => void;
}

/**
 * Manages multiplayer connection and renders other players.
 * All state updates are isolated within this component.
 */
export function MultiplayerManager({
  serverUrl,
  playerName,
  planeColor,
  enabled,
  localPlayerPositionRef,
  localPlayerQuaternionRef,
  flightDataRef,
  onConnectionChange,
}: MultiplayerManagerProps) {
  const {
    isConnected,
    nearbyPlayers,
    sendUpdate,
    playerCount,
  } = useMultiplayer({
    serverUrl,
    playerName,
    planeColor,
    enabled,
  });

  const prevConnectedRef = useRef(false);
  const prevPlayerCountRef = useRef(0);

  useEffect(() => {
    if (isConnected !== prevConnectedRef.current || playerCount !== prevPlayerCountRef.current) {
      prevConnectedRef.current = isConnected;
      prevPlayerCountRef.current = playerCount;
      onConnectionChange?.(isConnected, playerCount);
    }
  }, [isConnected, playerCount, onConnectionChange]);

  useFrame(() => {
    if (!isConnected) return;
    if (!localPlayerPositionRef.current || !localPlayerQuaternionRef.current) return;

    const pos = localPlayerPositionRef.current;
    const quat = localPlayerQuaternionRef.current;
    const flightData = flightDataRef.current || { heading: 0, pitch: 0, roll: 0, speed: 0 };

    const update: LocalPlayerUpdate = {
      position: { x: pos.x, y: pos.y, z: pos.z },
      quaternion: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
      heading: flightData.heading,
      pitch: flightData.pitch,
      roll: flightData.roll,
      speed: flightData.speed,
    };

    sendUpdate(update);
  });

  const fallbackPosition = useRef(new THREE.Vector3(0, 200, 100));

  return (
    <OtherPlayers
      players={nearbyPlayers}
      localPlayerPosition={localPlayerPositionRef.current ?? fallbackPosition.current}
    />
  );
}
