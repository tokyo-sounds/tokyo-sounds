"use client";

/**
 * TokyoSpatialAudio Component
 * Places spatial audio sources around Tokyo based on real-world coordinates
 * Uses distance-based culling to only play nearby sounds
 */

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TOKYO_SPATIAL_AUDIO_SOURCES, TOKYO_CENTER, type SpatialAudioSource } from "@/config/tokyo-config";
import { latLngAltToENU } from "@/lib/geo-utils";

const CULL_DISTANCE_MULTIPLIER = 1.5; // Start playing when within maxDistance * this
const HYSTERESIS = 0.8; // Resume distance = cull distance * this (prevents rapid on/off)

interface AudioSourceState {
  source: SpatialAudioSource;
  position: THREE.Vector3;
  buffer: AudioBuffer | null;
  audio: THREE.PositionalAudio | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TokyoSpatialAudioProps {
  enabled?: boolean;
  showDebug?: boolean;
  onStatsUpdate?: (stats: { total: number; active: number; culled: number }) => void;
}

/**
 * Debug visualization for a single audio source
 */
function DebugMarker({ 
  position, 
  source, 
  isPlaying 
}: { 
  position: THREE.Vector3; 
  source: SpatialAudioSource; 
  isPlaying: boolean;
}) {
  const color = useMemo(() => {
    if (source.src.includes("池袋")) return "#ffaa00";
    if (source.src.includes("秋葉原")) return "#ff6b6b";
    if (source.src.includes("原宿")) return "#ff69b4";
    if (source.src.includes("中野")) return "#00ffff";
    return "#ffffff";
  }, [source.src]);

  return (
    <group position={[position.x, position.y + 10, position.z]}>
      <mesh>
        <sphereGeometry args={[8, 8, 8]} />
        <meshBasicMaterial 
          color={isPlaying ? color : "#666666"} 
          transparent 
          opacity={isPlaying ? 0.6 : 0.3} 
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[source.refDistance * 0.8, source.refDistance, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Main Tokyo Spatial Audio component
 * Manages all audio sources with distance-based culling
 */
export function TokyoSpatialAudio({
  enabled = true,
  showDebug = false,
  onStatsUpdate,
}: TokyoSpatialAudioProps) {
  const { camera } = useThree();
  const [listener, setListener] = useState<THREE.AudioListener | null>(null);
  const [contextResumed, setContextResumed] = useState(false);
  const [audioStates, setAudioStates] = useState<AudioSourceState[]>([]);
  
  const audioStatesRef = useRef<AudioSourceState[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const cameraPositionRef = useRef(new THREE.Vector3());
  const lastUpdateRef = useRef(0);

  const initialStates = useMemo(() => {
    return TOKYO_SPATIAL_AUDIO_SOURCES.map((source) => {
      const pos = latLngAltToENU(
        source.lat,
        source.lng,
        source.alt,
        TOKYO_CENTER.lat,
        TOKYO_CENTER.lng,
        0
      );
      return {
        source,
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        buffer: null,
        audio: null,
        isPlaying: false,
        isLoading: false,
        error: null,
      } as AudioSourceState;
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);
    setListener(audioListener);

    const resumeContext = async () => {
      const ctx = audioListener.context;
      if (ctx.state === "suspended") {
        try {
          await (ctx as AudioContext).resume();
          console.log("[TokyoSpatialAudio] AudioContext resumed");
        } catch (err) {
          console.error("[TokyoSpatialAudio] Failed to resume AudioContext:", err);
        }
      }
      setContextResumed(true);
    };

    resumeContext();

    const handleInteraction = () => {
      resumeContext();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      camera.remove(audioListener);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [camera, enabled]);

  useEffect(() => {
    if (!listener || !contextResumed) return;

    const loader = new THREE.AudioLoader();
    const states = [...initialStates];
    audioStatesRef.current = states;
    setAudioStates(states);

    states.forEach((state, index) => {
      state.isLoading = true;
      loader.load(
        state.source.src,
        (buffer) => {
          state.buffer = buffer;
          state.isLoading = false;
          console.log(`[SpatialAudio] Loaded: ${state.source.id}`);
        },
        undefined,
        (err) => {
          state.error = String(err);
          state.isLoading = false;
          console.error(`[SpatialAudio] Failed to load ${state.source.id}:`, err);
        }
      );
    });

    return () => {
      states.forEach((state) => {
        if (state.audio) {
          if (state.audio.isPlaying) {
            state.audio.stop();
          }
          state.audio.disconnect();
          groupRef.current?.remove(state.audio);
          state.audio = null;
        }
      });
    };
  }, [listener, contextResumed, initialStates]);

  const startAudio = useCallback((state: AudioSourceState) => {
    if (!listener || !groupRef.current || !state.buffer || state.isPlaying) return;

    const audio = new THREE.PositionalAudio(listener);
    
    audio.setBuffer(state.buffer);
    audio.setRefDistance(state.source.refDistance);
    audio.setRolloffFactor(1.5);
    audio.setMaxDistance(state.source.maxDistance);
    audio.setDistanceModel("inverse");
    audio.setLoop(state.source.loop);
    audio.setVolume(state.source.volume);

    const panner = audio.getOutput() as PannerNode;
    if (panner?.panningModel !== undefined) {
      panner.panningModel = "HRTF";
    }

    audio.position.copy(state.position);
    groupRef.current.add(audio);

    try {
      audio.play();
      state.audio = audio;
      state.isPlaying = true;
      console.log(`[SpatialAudio] Started: ${state.source.id}`);
    } catch (err) {
      console.error(`[SpatialAudio] Failed to play ${state.source.id}:`, err);
      groupRef.current.remove(audio);
    }
  }, [listener]);

  const stopAudio = useCallback((state: AudioSourceState) => {
    if (!state.audio || !state.isPlaying) return;

    try {
      if (state.audio.isPlaying) {
        state.audio.stop();
      }
      state.audio.disconnect();
      groupRef.current?.remove(state.audio);
    } catch (err) {
      console.error(`[SpatialAudio] Error stopping ${state.source.id}:`, err);
    }

    state.audio = null;
    state.isPlaying = false;
    console.log(`[SpatialAudio] Stopped: ${state.source.id}`);
  }, []);

  useFrame(() => {
    if (!enabled || !contextResumed) return;

    const now = performance.now();
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;

    camera.getWorldPosition(cameraPositionRef.current);
    const camPos = cameraPositionRef.current;

    let activeCount = 0;
    const states = audioStatesRef.current;

    for (const state of states) {
      if (!state.buffer) continue;

      const distance = camPos.distanceTo(state.position);
      const cullDistance = state.source.maxDistance * CULL_DISTANCE_MULTIPLIER;
      const resumeDistance = cullDistance * HYSTERESIS;

      if (state.isPlaying) {
        if (distance > cullDistance) {
          stopAudio(state);
        } else {
          activeCount++;
        }
      } else {
        if (distance < resumeDistance) {
          startAudio(state);
          if (state.isPlaying) activeCount++;
        }
      }
    }

    onStatsUpdate?.({
      total: states.length,
      active: activeCount,
      culled: states.length - activeCount,
    });
  });

  useEffect(() => {
    if (!showDebug) return;
    
    const interval = setInterval(() => {
      setAudioStates([...audioStatesRef.current]);
    }, 500);

    return () => clearInterval(interval);
  }, [showDebug]);

  if (!enabled || !listener || !contextResumed) {
    return null;
  }

  return (
    <group ref={groupRef} name="tokyo-spatial-audio">
      {showDebug && audioStates.map((state) => (
        <DebugMarker
          key={`debug-${state.source.id}`}
          position={state.position}
          source={state.source}
          isPlaying={state.isPlaying}
        />
      ))}
    </group>
  );
}
