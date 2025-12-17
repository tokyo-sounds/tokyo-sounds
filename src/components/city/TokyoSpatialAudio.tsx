"use client";

/**
 * TokyoSpatialAudio Component
 * Places spatial audio sources around Tokyo based on real-world coordinates
 * Uses distance-based culling to only play nearby sounds
 */

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  TOKYO_SPATIAL_AUDIO_SOURCES,
  TOKYO_CENTER,
  type SpatialAudioSource,
} from "@/config/tokyo-config";
import { latLngAltToENU } from "@/lib/geo-utils";

const CULL_DISTANCE_MULTIPLIER = 1.5; // Start playing when within maxDistance * this
const HYSTERESIS = 0.8; // Resume distance = cull distance * this (prevents rapid on/off)

// Lazy loading configuration
const PRELOAD_DISTANCE_MULTIPLIER = 2.0; // Load audio when within maxDistance * this
const UNLOAD_DISTANCE_MULTIPLIER = 3.0; // Unload audio when beyond maxDistance * this
const MAX_CONCURRENT_LOADS = 3; // Maximum simultaneous audio file downloads
const MAX_BUFFER_CACHE_SIZE_MB = 50; // Maximum total buffer cache size in MB
const BUFFER_UNLOAD_IDLE_TIME_MS = 60000; // Unload buffers not used in last 60 seconds

// Priority thresholds (distance multipliers from maxDistance)
const HIGH_PRIORITY_DISTANCE = 1.5; // Immediate playback range
const MEDIUM_PRIORITY_DISTANCE = 2.5; // Preload for upcoming area
const LOW_PRIORITY_DISTANCE = 4.0; // Background preload

type LoadingState = "not_loaded" | "loading" | "loaded" | "unloaded";

interface AudioSourceState {
  source: SpatialAudioSource;
  position: THREE.Vector3;
  buffer: AudioBuffer | null;
  audio: THREE.PositionalAudio | null;
  isPlaying: boolean;
  loadingState: LoadingState;
  error: string | null;
  lastUsedTime: number; // Timestamp when buffer was last used
  bufferSizeMB: number; // Size of buffer in MB
}

export interface TokyoSpatialAudioProps {
  enabled?: boolean;
  showDebug?: boolean;
  volume?: number; // Volume control for spatial audio (0.0 to 1.0)
  onStatsUpdate?: (stats: {
    total: number;
    active: number;
    culled: number;
  }) => void;
}

/**
 * Debug visualization for a single audio source
 */
function DebugMarker({
  position,
  source,
  isPlaying,
  loadingState,
}: {
  position: THREE.Vector3;
  source: SpatialAudioSource;
  isPlaying: boolean;
  loadingState: LoadingState;
}) {
  const color = useMemo(() => {
    if (source.src.includes("池袋")) return "#ffaa00";
    if (source.src.includes("秋葉原")) return "#ff6b6b";
    if (source.src.includes("原宿")) return "#ff69b4";
    if (source.src.includes("中野")) return "#00ffff";
    return "#ffffff";
  }, [source.src]);

  // Color based on loading state
  const stateColor = useMemo(() => {
    if (isPlaying) return color;
    if (loadingState === "loaded") return "#00ff00"; // Green for loaded
    if (loadingState === "loading") return "#ffff00"; // Yellow for loading
    if (loadingState === "unloaded") return "#888888"; // Gray for unloaded
    return "#666666"; // Dark gray for not loaded
  }, [isPlaying, loadingState, color]);

  const opacity = useMemo(() => {
    if (isPlaying) return 0.6;
    if (loadingState === "loaded") return 0.4;
    if (loadingState === "loading") return 0.5; // Pulse effect for loading
    return 0.2;
  }, [isPlaying, loadingState]);

  return (
    <group position={[position.x, position.y + 10, position.z]}>
      <mesh>
        <sphereGeometry args={[8, 8, 8]} />
        <meshBasicMaterial color={stateColor} transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[source.refDistance * 0.8, source.refDistance, 16]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
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
  volume,
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

  // Loading queue management
  const loadingQueueRef = useRef<Set<string>>(new Set()); // IDs currently loading
  const loaderRef = useRef<THREE.AudioLoader | null>(null);
  const totalBufferSizeMBRef = useRef(0); // Track total buffer cache size

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
        loadingState: "not_loaded" as LoadingState,
        error: null,
        lastUsedTime: 0,
        bufferSizeMB: 0,
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
          console.error(
            "[TokyoSpatialAudio] Failed to resume AudioContext:",
            err
          );
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

    loaderRef.current = new THREE.AudioLoader();
    const states = [...initialStates];
    audioStatesRef.current = states;
    setAudioStates(states);

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
        // Clear buffer and update cache size
        if (state.buffer) {
          totalBufferSizeMBRef.current -= state.bufferSizeMB;
          state.buffer = null;
          state.bufferSizeMB = 0;
        }
      });
      loadingQueueRef.current.clear();
    };
  }, [listener, contextResumed, initialStates]);

  /**
   * Calculate buffer size in MB
   */
  const calculateBufferSizeMB = useCallback((buffer: AudioBuffer): number => {
    // Float32 samples = 4 bytes per sample
    const bytes = buffer.length * buffer.numberOfChannels * 4;
    return bytes / (1024 * 1024);
  }, []);

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

  /**
   * Unload audio source to free memory
   */
  const unloadAudioSource = useCallback(
    (state: AudioSourceState) => {
      if (state.loadingState !== "loaded" || !state.buffer) return;

      // Stop playing if active
      if (state.isPlaying && state.audio) {
        stopAudio(state);
      }

      // Free buffer memory
      totalBufferSizeMBRef.current -= state.bufferSizeMB;
      state.buffer = null;
      state.bufferSizeMB = 0;
      state.loadingState = "unloaded";
      state.lastUsedTime = 0;
      console.log(`[SpatialAudio] Unloaded: ${state.source.id}`);
    },
    [stopAudio]
  );

  /**
   * Load audio source with priority support
   */
  const loadAudioSource = useCallback(
    (state: AudioSourceState, priority: "high" | "medium" | "low") => {
      if (
        !loaderRef.current ||
        state.loadingState === "loading" ||
        state.loadingState === "loaded"
      ) {
        return;
      }

      // Check concurrent load limit
      if (loadingQueueRef.current.size >= MAX_CONCURRENT_LOADS) {
        return;
      }

      // Check memory limit
      if (totalBufferSizeMBRef.current >= MAX_BUFFER_CACHE_SIZE_MB) {
        // Try to free up space by unloading distant buffers
        const states = audioStatesRef.current;
        for (const s of states) {
          if (s !== state && s.loadingState === "loaded" && !s.isPlaying) {
            const now = Date.now();
            if (now - s.lastUsedTime > BUFFER_UNLOAD_IDLE_TIME_MS) {
              unloadAudioSource(s);
              break;
            }
          }
        }
        // Still over limit? Skip loading
        if (totalBufferSizeMBRef.current >= MAX_BUFFER_CACHE_SIZE_MB) {
          return;
        }
      }

      state.loadingState = "loading";
      loadingQueueRef.current.add(state.source.id);

      loaderRef.current.load(
        state.source.src,
        (buffer) => {
          const bufferSizeMB = calculateBufferSizeMB(buffer);

          // Final memory check
          if (
            totalBufferSizeMBRef.current + bufferSizeMB >
            MAX_BUFFER_CACHE_SIZE_MB
          ) {
            state.loadingState = "not_loaded";
            state.error = "Memory limit exceeded";
            loadingQueueRef.current.delete(state.source.id);
            console.warn(
              `[SpatialAudio] Memory limit: skipping ${state.source.id}`
            );
            return;
          }

          state.buffer = buffer;
          state.bufferSizeMB = bufferSizeMB;
          state.loadingState = "loaded";
          state.lastUsedTime = Date.now();
          state.error = null;
          totalBufferSizeMBRef.current += bufferSizeMB;
          loadingQueueRef.current.delete(state.source.id);
          console.log(
            `[SpatialAudio] Loaded: ${state.source.id} (${bufferSizeMB.toFixed(
              2
            )}MB)`
          );
        },
        undefined,
        (err) => {
          state.error = String(err);
          state.loadingState = "not_loaded";
          loadingQueueRef.current.delete(state.source.id);
          console.error(
            `[SpatialAudio] Failed to load ${state.source.id}:`,
            err
          );
        }
      );
    },
    [calculateBufferSizeMB, unloadAudioSource]
  );

  /**
   * Get loading priority based on distance
   */
  const getLoadingPriority = useCallback(
    (
      distance: number,
      maxDistance: number
    ): "high" | "medium" | "low" | null => {
      const preloadDistance = maxDistance * PRELOAD_DISTANCE_MULTIPLIER;
      if (distance > preloadDistance) return null;

      if (distance <= maxDistance * HIGH_PRIORITY_DISTANCE) return "high";
      if (distance <= maxDistance * MEDIUM_PRIORITY_DISTANCE) return "medium";
      if (distance <= maxDistance * LOW_PRIORITY_DISTANCE) return "low";
      return null;
    },
    []
  );

  const startAudio = useCallback((state: AudioSourceState) => {
      if (!listener || !groupRef.current || !state.buffer || state.isPlaying)
        return;

      const audio = new THREE.PositionalAudio(listener);

      audio.setBuffer(state.buffer);
      audio.setRefDistance(state.source.refDistance);
      audio.setRolloffFactor(1.5);
      audio.setMaxDistance(state.source.maxDistance);
      audio.setDistanceModel("inverse");
      audio.setLoop(state.source.loop);
      // Use the volume prop if provided, otherwise use the source's default volume
      const effectiveVolume = typeof volume !== 'undefined' ? volume : state.source.volume;
      audio.setVolume(effectiveVolume);
      console.log(`[SpatialAudio] Setting volume for ${state.source.id} to: ${effectiveVolume}`);

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
        state.lastUsedTime = Date.now(); // Update last used time
        console.log(`[SpatialAudio] Started: ${state.source.id} at volume: ${effectiveVolume}`);
      } catch (err) {
        console.error(`[SpatialAudio] Failed to play ${state.source.id}:`, err);
        groupRef.current.remove(audio);
      }
    }, [listener, volume]);

  // Update volume when volume prop changes for all playing audio
  useEffect(() => {
    if (!enabled || !contextResumed) {
      return;
    }

    const states = audioStatesRef.current;

    for (const state of states) {
      if (state.isPlaying && state.audio) {
        // Update the volume of currently playing audio
        const effectiveVolume = typeof volume !== 'undefined' ? volume : state.source.volume;
        state.audio.setVolume(effectiveVolume);
      }
    }
  }, [volume, enabled, contextResumed]);

  useFrame(() => {
    if (!enabled || !contextResumed) return;

    const now = performance.now();
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;

    camera.getWorldPosition(cameraPositionRef.current);
    const camPos = cameraPositionRef.current;

    let activeCount = 0;
    const states = audioStatesRef.current;

    // Separate states by priority for loading
    const highPriorityStates: AudioSourceState[] = [];
    const mediumPriorityStates: AudioSourceState[] = [];
    const lowPriorityStates: AudioSourceState[] = [];

    for (const state of states) {
      const distance = camPos.distanceTo(state.position);
      const cullDistance = state.source.maxDistance * CULL_DISTANCE_MULTIPLIER;
      const resumeDistance = cullDistance * HYSTERESIS;
      const unloadDistance =
        state.source.maxDistance * UNLOAD_DISTANCE_MULTIPLIER;

      // Handle playing/stopping audio
      if (state.isPlaying) {
        if (distance > cullDistance) {
          stopAudio(state);
        } else {
          activeCount++;
          state.lastUsedTime = Date.now(); // Update last used time when playing
        }
      } else {
        if (distance < resumeDistance && state.buffer) {
          startAudio(state);
          if (state.isPlaying) activeCount++;
        }
      }

      // Handle loading/unloading based on distance
      if (state.loadingState === "loaded") {
        // Check if should unload (too far away and not playing)
        if (distance > unloadDistance && !state.isPlaying) {
          const idleTime = Date.now() - state.lastUsedTime;
          if (idleTime > BUFFER_UNLOAD_IDLE_TIME_MS) {
            unloadAudioSource(state);
          }
        }
      } else if (
        state.loadingState === "not_loaded" ||
        state.loadingState === "unloaded"
      ) {
        // Determine loading priority
        const priority = getLoadingPriority(distance, state.source.maxDistance);
        if (priority === "high") {
          highPriorityStates.push(state);
        } else if (priority === "medium") {
          mediumPriorityStates.push(state);
        } else if (priority === "low") {
          lowPriorityStates.push(state);
        }
      }
    }

    // Load audio sources by priority (high -> medium -> low)
    // Process high priority first, then medium, then low
    const allPriorityStates = [
      ...highPriorityStates,
      ...mediumPriorityStates,
      ...lowPriorityStates,
    ];
    for (const state of allPriorityStates) {
      const distance = camPos.distanceTo(state.position);
      const priority = getLoadingPriority(distance, state.source.maxDistance);
      if (priority) {
        loadAudioSource(state, priority);
        // Only load up to concurrent limit
        if (loadingQueueRef.current.size >= MAX_CONCURRENT_LOADS) {
          break;
        }
      }
    }

    onStatsUpdate?.({
      total: states.length,
      active: activeCount,
      culled: states.length - activeCount,
    });
  });

  // Update volume when volume prop changes for all playing audio
  useEffect(() => {
    if (!enabled || !contextResumed) return;

    const states = audioStatesRef.current;
    for (const state of states) {
      if (state.isPlaying && state.audio) {
        // Update the volume of currently playing audio
        state.audio.setVolume(typeof volume !== 'undefined' ? volume : state.source.volume);
        console.log(`[SpatialAudio] Updated volume for: ${state.source.id} to ${typeof volume !== 'undefined' ? volume : state.source.volume}`);
      }
    }
  }, [volume, enabled, contextResumed]);

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
      {showDebug &&
        audioStates.map((state) => (
          <DebugMarker
            key={`debug-${state.source.id}`}
            position={state.position}
            source={state.source}
            isPlaying={state.isPlaying}
            loadingState={state.loadingState}
          />
        ))}
    </group>
  );
}
