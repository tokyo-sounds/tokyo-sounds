"use client";

/**
 * TokyoSpatialAudio Component
 * Places spatial audio sources around Tokyo based on real-world coordinates
 * Uses distance-based culling to only play nearby sounds
 *
 * Supports both hand-placed sources (from config) and procedural sources
 * when enableProcedural is true.
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
import { useProceduralSources } from "@/hooks/useProceduralSources";

const CULL_DISTANCE_MULTIPLIER = 3.0; // maxDistance * this
const HYSTERESIS = 0.6; // Resume distance = cull distance * this
const FADE_OUT_DURATION_MS = 2000; // 2 seconds

// Gain-based culling thresholds
// With refDistance=20, rolloff=8.0, volume=0.6:
//   - 50m  → gain ~4.6%
//   - 100m → gain ~1.8%
//   - 150m → gain ~1.1%
//   - 200m → gain ~0.8%
const CULL_GAIN_THRESHOLD = 0.008; // Cull when gain drops below 0.8% (~200m)
const RESUME_GAIN_THRESHOLD = 0.015; // Resume when gain above 1.5% (~120m)
const ROLLOFF_FACTOR = 8.0;

const MIN_PLAY_DURATION_MS = 3000; // 3 secs
const HIGH_SPEED_THRESHOLD = 50; // m/s (~180 km/h)
const HIGH_SPEED_MIN_PLAY_DURATION_MS = 5000; // 5 secs

// Lazy loading configuration
const PRELOAD_DISTANCE_MULTIPLIER = 2.0; // Load audio when within maxDistance * this
const UNLOAD_DISTANCE_MULTIPLIER = 4.0; // Unload audio when beyond maxDistance * this
const MAX_CONCURRENT_LOADS = 3; // Maximum simultaneous audio file downloads
const MAX_BUFFER_CACHE_SIZE_MB = 400; // Cache size in MB (increased for larger ambient files)
const BUFFER_UNLOAD_IDLE_TIME_MS = 30000; // Unload buffers not used in last 30 seconds
const CACHE_EVICTION_TARGET_RATIO = 0.7; // When evicting, reduce to 70% of max

// Priority thresholds (distance multipliers from maxDistance)
const HIGH_PRIORITY_DISTANCE = 1.5; // Immediate playback range
const MEDIUM_PRIORITY_DISTANCE = 2.5; // Preload for upcoming area
const LOW_PRIORITY_DISTANCE = 4.0; // Background preload

type LoadingState = "not_loaded" | "loading" | "loaded" | "unloaded";

/**
 * Global audio buffer cache - shared across all TokyoSpatialAudio instances
 * Prevents re-fetching the same audio files for different sources
 */
interface CachedBuffer {
  buffer: AudioBuffer;
  sizeMB: number;
  refCount: number;
  lastUsedTime: number;
}

const globalBufferCache = new Map<string, CachedBuffer>();
const globalLoadingPromises = new Map<string, Promise<AudioBuffer>>();
let globalCacheSizeMB = 0;

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
  playStartTime: number;
}

export interface TokyoSpatialAudioProps {
  enabled?: boolean;
  showDebug?: boolean;
  enableProcedural?: boolean;
  additionalSources?: SpatialAudioSource[];
  volume?: number; // Volume control for spatial audio (0.0 to 1.0)
  onStatsUpdate?: (stats: {
    total: number;
    active: number;
    culled: number;
    handPlaced: number;
    procedural: number;
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
    if (source.src.includes("東京駅")) return "#dc143c";
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
  enableProcedural = false,
  additionalSources = [],
  volume,
  onStatsUpdate,
}: TokyoSpatialAudioProps) {
  const { camera } = useThree();
  const [listener, setListener] = useState<THREE.AudioListener | null>(null);
  const [contextResumed, setContextResumed] = useState(false);
  const [audioStates, setAudioStates] = useState<AudioSourceState[]>([]);

  const proceduralSources = useProceduralSources({
    enabled: enabled && enableProcedural,
  });

  const allAdditionalSources = useMemo(() => {
    return [...additionalSources, ...proceduralSources];
  }, [additionalSources, proceduralSources]);

  const audioStatesRef = useRef<AudioSourceState[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const cameraPositionRef = useRef(new THREE.Vector3());
  const lastUpdateRef = useRef(0);

  // Loading queue management
  const loadingQueueRef = useRef<Set<string>>(new Set()); // IDs currently loading
  const loaderRef = useRef<THREE.AudioLoader | null>(null);

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
        playStartTime: 0,
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
        if (state.buffer) {
          const cached = globalBufferCache.get(state.source.src);
          if (cached) {
            cached.refCount = Math.max(0, cached.refCount - 1);
          }
          state.buffer = null;
          state.bufferSizeMB = 0;
        }
      });
      loadingQueueRef.current.clear();
    };
  }, [listener, contextResumed, initialStates]);

  const additionalSourcesMapRef = useRef<Map<string, AudioSourceState>>(
    new Map()
  );

  useEffect(() => {
    if (!listener || !contextResumed) return;

    const currentIds = new Set(allAdditionalSources.map((s) => s.id));
    const existingIds = new Set(additionalSourcesMapRef.current.keys());

    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        const state = additionalSourcesMapRef.current.get(id);
        if (state) {
          if (state.audio) {
            if (state.audio.isPlaying) {
              state.audio.stop();
            }
            state.audio.disconnect();
            groupRef.current?.remove(state.audio);
          }
          if (state.buffer) {
            const cached = globalBufferCache.get(state.source.src);
            if (cached) {
              cached.refCount = Math.max(0, cached.refCount - 1);
            }
          }
          additionalSourcesMapRef.current.delete(id);
        }
      }
    }

    for (const source of allAdditionalSources) {
      if (!additionalSourcesMapRef.current.has(source.id)) {
        const pos = latLngAltToENU(
          source.lat,
          source.lng,
          source.alt,
          TOKYO_CENTER.lat,
          TOKYO_CENTER.lng,
          0
        );
        const newState: AudioSourceState = {
          source,
          position: new THREE.Vector3(pos.x, pos.y, pos.z),
          buffer: null,
          audio: null,
          isPlaying: false,
          loadingState: "not_loaded" as LoadingState,
          error: null,
          lastUsedTime: 0,
          bufferSizeMB: 0,
          playStartTime: 0,
        };
        additionalSourcesMapRef.current.set(source.id, newState);
      }
    }

    const allStates = [
      ...initialStates,
      ...Array.from(additionalSourcesMapRef.current.values()),
    ];
    audioStatesRef.current = allStates;
  }, [listener, contextResumed, allAdditionalSources, initialStates]);

  /**
   * Calculate buffer size in MB
   *
   * @param buffer - The audio buffer.
   * @returns The buffer size in MB.
   */
  const calculateBufferSizeMB = useCallback((buffer: AudioBuffer): number => {
    // Float32 samples = 4 bytes per sample
    const bytes = buffer.length * buffer.numberOfChannels * 4;
    return bytes / (1024 * 1024);
  }, []);

  /**
   * Calculate the perceived gain at a given distance using inverse distance model
   * Formula: gain = refDistance / (refDistance + rolloffFactor * (distance - refDistance))
   * This matches Web Audio API's inverse distance model
   *
   * @param distance - The distance from the listener to the audio source.
   * @param refDistance - The reference distance of the audio source.
   * @param volume - The volume of the audio source.
   * @returns The perceived gain at the given distance.
   */
  const calculateGainAtDistance = useCallback(
    (distance: number, refDistance: number, volume: number): number => {
      if (distance <= refDistance) return volume;
      const gain =
        refDistance / (refDistance + ROLLOFF_FACTOR * (distance - refDistance));
      return gain * volume;
    },
    []
  );

  /**
   * Stop audio with a smooth fade-out to prevent abrupt cutoffs
   *
   * @param state - The audio source state.
   * @param immediate - Whether to stop the audio immediately.
   * @returns void.
   */
  const stopAudio = useCallback(
    (state: AudioSourceState, immediate = false) => {
      if (!state.audio || !state.isPlaying) return;

      const audio = state.audio;
      const gainNode = audio.gain;

      state.isPlaying = false;

      if (immediate || !gainNode) {
        try {
          if (audio.isPlaying) {
            audio.stop();
          }
          audio.disconnect();
          groupRef.current?.remove(audio);
        } catch (err) {
          console.error(
            `[SpatialAudio] Error stopping ${state.source.id}:`,
            err
          );
        }
        state.audio = null;
        console.log(`[SpatialAudio] Stopped: ${state.source.id}`);
      } else {
        const currentVolume = gainNode.gain.value;
        const fadeOutSeconds = FADE_OUT_DURATION_MS / 1000;

        gainNode.gain.setValueAtTime(currentVolume, audio.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          0,
          audio.context.currentTime + fadeOutSeconds
        );

        setTimeout(() => {
          try {
            if (audio.isPlaying) {
              audio.stop();
            }
            audio.disconnect();
            groupRef.current?.remove(audio);
          } catch (err) {}
          if (state.audio === audio) {
            state.audio = null;
          }
          console.log(`[SpatialAudio] Faded out: ${state.source.id}`);
        }, FADE_OUT_DURATION_MS + 100);
      }
    },
    []
  );

  /**
   * Unload audio source - decrements refCount in global cache
   *
   * @param state - The audio source state.
   * @returns void.
   */
  const unloadAudioSource = useCallback(
    (state: AudioSourceState) => {
      if (state.loadingState !== "loaded" || !state.buffer) return;

      if (state.isPlaying && state.audio) {
        stopAudio(state, true);
      }

      const srcUrl = state.source.src;
      const cached = globalBufferCache.get(srcUrl);
      if (cached) {
        cached.refCount = Math.max(0, cached.refCount - 1);
        cached.lastUsedTime = Date.now();
      }

      state.buffer = null;
      state.bufferSizeMB = 0;
      state.loadingState = "unloaded";
      state.lastUsedTime = 0;
      console.log(
        `[SpatialAudio] Unloaded source: ${state.source.id} (buffer still cached)`
      );
    },
    [stopAudio]
  );

  /**
   * Load audio source with priority support and global buffer caching
   *
   * @param state - The audio source state.
   * @param priority - The priority of the audio source.
   * @returns void.
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

      const srcUrl = state.source.src;

      const cached = globalBufferCache.get(srcUrl);
      if (cached) {
        cached.refCount++;
        cached.lastUsedTime = Date.now();
        state.buffer = cached.buffer;
        state.bufferSizeMB = cached.sizeMB;
        state.loadingState = "loaded";
        state.lastUsedTime = Date.now();
        state.error = null;
        console.log(
          `[SpatialAudio] Reused cached buffer for ${
            state.source.id
          } (${cached.sizeMB.toFixed(2)}MB, refCount=${cached.refCount})`
        );
        return;
      }

      const existingPromise = globalLoadingPromises.get(srcUrl);
      if (existingPromise) {
        state.loadingState = "loading";
        existingPromise
          .then((buffer) => {
            const cachedAfterLoad = globalBufferCache.get(srcUrl);
            if (cachedAfterLoad) {
              cachedAfterLoad.refCount++;
              cachedAfterLoad.lastUsedTime = Date.now();
              state.buffer = cachedAfterLoad.buffer;
              state.bufferSizeMB = cachedAfterLoad.sizeMB;
              state.loadingState = "loaded";
              state.lastUsedTime = Date.now();
              state.error = null;
              console.log(
                `[SpatialAudio] Reused buffer after wait for ${state.source.id}`
              );
            }
          })
          .catch((err) => {
            state.error = String(err);
            state.loadingState = "not_loaded";
          });
        return;
      }

      // Check concurrent load limit
      if (loadingQueueRef.current.size >= MAX_CONCURRENT_LOADS) {
        return;
      }

      if (globalCacheSizeMB >= MAX_BUFFER_CACHE_SIZE_MB) {
        const targetSize =
          MAX_BUFFER_CACHE_SIZE_MB * CACHE_EVICTION_TARGET_RATIO;

        const sortedEntries = [...globalBufferCache.entries()].sort((a, b) => {
          if (a[1].refCount === 0 && b[1].refCount !== 0) return -1;
          if (a[1].refCount !== 0 && b[1].refCount === 0) return 1;
          return a[1].lastUsedTime - b[1].lastUsedTime;
        });

        for (const [url, cached] of sortedEntries) {
          if (cached.refCount === 0) {
            globalCacheSizeMB -= cached.sizeMB;
            globalBufferCache.delete(url);
            console.log(
              `[SpatialAudio] Evicted LRU buffer: ${url} (freed ${cached.sizeMB.toFixed(
                2
              )}MB, cache now ${globalCacheSizeMB.toFixed(2)}MB)`
            );

            if (globalCacheSizeMB <= targetSize) {
              break;
            }
          }
        }

        if (globalCacheSizeMB >= MAX_BUFFER_CACHE_SIZE_MB * 1.1) {
          console.warn(
            `[SpatialAudio] Cache still at ${globalCacheSizeMB.toFixed(
              2
            )}MB, skipping load for ${state.source.id}`
          );
          return;
        }
      }

      state.loadingState = "loading";
      loadingQueueRef.current.add(state.source.id);

      const loadPromise = new Promise<AudioBuffer>((resolve, reject) => {
        loaderRef.current!.load(
          srcUrl,
          (buffer) => {
            const bufferSizeMB = calculateBufferSizeMB(buffer);

            if (globalCacheSizeMB + bufferSizeMB > MAX_BUFFER_CACHE_SIZE_MB) {
              const spaceNeeded =
                globalCacheSizeMB +
                bufferSizeMB -
                MAX_BUFFER_CACHE_SIZE_MB * CACHE_EVICTION_TARGET_RATIO;
              let freedSpace = 0;

              const sortedEntries = [...globalBufferCache.entries()].sort(
                (a, b) => {
                  if (a[1].refCount === 0 && b[1].refCount !== 0) return -1;
                  if (a[1].refCount !== 0 && b[1].refCount === 0) return 1;
                  return a[1].lastUsedTime - b[1].lastUsedTime;
                }
              );

              for (const [url, cached] of sortedEntries) {
                if (cached.refCount === 0) {
                  globalCacheSizeMB -= cached.sizeMB;
                  freedSpace += cached.sizeMB;
                  globalBufferCache.delete(url);
                  console.log(
                    `[SpatialAudio] Post-load eviction: ${url} (freed ${cached.sizeMB.toFixed(
                      2
                    )}MB)`
                  );

                  if (freedSpace >= spaceNeeded) break;
                }
              }

              if (
                globalCacheSizeMB + bufferSizeMB >
                MAX_BUFFER_CACHE_SIZE_MB * 1.2
              ) {
                state.loadingState = "not_loaded";
                state.error = "Memory limit exceeded";
                loadingQueueRef.current.delete(state.source.id);
                globalLoadingPromises.delete(srcUrl);
                console.warn(
                  `[SpatialAudio] Memory limit exceeded after eviction: ${
                    state.source.id
                  } (need ${bufferSizeMB.toFixed(
                    2
                  )}MB, cache at ${globalCacheSizeMB.toFixed(2)}MB)`
                );
                reject(new Error("Memory limit exceeded"));
                return;
              }
            }

            globalBufferCache.set(srcUrl, {
              buffer,
              sizeMB: bufferSizeMB,
              refCount: 1,
              lastUsedTime: Date.now(),
            });
            globalCacheSizeMB += bufferSizeMB;

            state.buffer = buffer;
            state.bufferSizeMB = bufferSizeMB;
            state.loadingState = "loaded";
            state.lastUsedTime = Date.now();
            state.error = null;
            loadingQueueRef.current.delete(state.source.id);
            globalLoadingPromises.delete(srcUrl);
            console.log(
              `[SpatialAudio] Loaded & cached: ${
                state.source.id
              } (${bufferSizeMB.toFixed(
                2
              )}MB, total cache: ${globalCacheSizeMB.toFixed(2)}MB)`
            );
            resolve(buffer);
          },
          undefined,
          (err) => {
            state.error = String(err);
            state.loadingState = "not_loaded";
            loadingQueueRef.current.delete(state.source.id);
            globalLoadingPromises.delete(srcUrl);
            console.error(
              `[SpatialAudio] Failed to load ${state.source.id}:`,
              err
            );
            reject(err);
          }
        );
      });

      globalLoadingPromises.set(srcUrl, loadPromise);
    },
    [calculateBufferSizeMB]
  );

  /**
   * Get loading priority based on distance
   *
   * @param distance - The distance from the listener to the audio source.
   * @param maxDistance - The maximum distance of the audio source.
   * @returns The loading priority.
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

  /**
   * Start audio
   *
   * @param state - The audio source state.
   * @returns void.
   */
  const startAudio = useCallback(
    (state: AudioSourceState) => {
      if (!listener || !groupRef.current || !state.buffer || state.isPlaying)
        return;

      const audio = new THREE.PositionalAudio(listener);

      audio.setBuffer(state.buffer);
      audio.setRefDistance(state.source.refDistance);
      audio.setRolloffFactor(ROLLOFF_FACTOR);
      audio.setMaxDistance(state.source.maxDistance);
      audio.setDistanceModel("inverse");
      audio.setLoop(state.source.loop);
      // Use the volume prop if provided, otherwise use the source's default volume
      const effectiveVolume =
        typeof volume !== "undefined" ? volume : state.source.volume;
      audio.setVolume(effectiveVolume);

      const panner = audio.getOutput() as PannerNode;
      if (panner?.panningModel !== undefined) {
        panner.panningModel = "HRTF";
      }

      audio.position.copy(state.position);
      groupRef.current.add(audio);

      audio.updateMatrixWorld(true);

      try {
        audio.play();
        state.audio = audio;
        state.isPlaying = true;
        state.lastUsedTime = Date.now();
        state.playStartTime = Date.now();

        const fileName = state.source.src.split("/").pop() || state.source.src;
        console.log(
          `[SpatialAudio] Started: ${state.source.id} | file: ${fileName} | loop: ${state.source.loop}`
        );
      } catch (err) {
        console.error(`[SpatialAudio] Failed to play ${state.source.id}:`, err);
        groupRef.current.remove(audio);
      }
    },
    [listener, volume]
  );

  // Update volume when volume prop changes for all playing audio
  useEffect(() => {
    if (!enabled || !contextResumed) {
      return;
    }

    const states = audioStatesRef.current;

    for (const state of states) {
      if (state.isPlaying && state.audio) {
        // Update the volume of currently playing audio
        const effectiveVolume =
          typeof volume !== "undefined" ? volume : state.source.volume;
        state.audio.setVolume(effectiveVolume);
      }
    }
  }, [volume, enabled, contextResumed]);

  const lastDebugLogRef = useRef(0);

  const lastCameraPositionRef = useRef(new THREE.Vector3());
  const velocityRef = useRef(0);
  const lastVelocityUpdateRef = useRef(0);

  useFrame(() => {
    if (!enabled || !contextResumed) return;

    const now = performance.now();
    const states = audioStatesRef.current;

    if (listener) {
      listener.updateMatrixWorld(true);
    }

    for (const state of states) {
      if (state.isPlaying && state.audio) {
        state.audio.updateMatrixWorld(true);
      }
    }

    if (now - lastUpdateRef.current < 100) return;
    const deltaTime = (now - lastUpdateRef.current) / 1000; // seconds
    lastUpdateRef.current = now;

    camera.getWorldPosition(cameraPositionRef.current);
    const camPos = cameraPositionRef.current;

    if (lastVelocityUpdateRef.current > 0) {
      const displacement = camPos.distanceTo(lastCameraPositionRef.current);
      const instantVelocity = deltaTime > 0 ? displacement / deltaTime : 0;
      velocityRef.current = velocityRef.current * 0.8 + instantVelocity * 0.2;
    }
    lastCameraPositionRef.current.copy(camPos);
    lastVelocityUpdateRef.current = now;

    const currentVelocity = velocityRef.current;
    const minPlayDuration =
      currentVelocity > HIGH_SPEED_THRESHOLD
        ? HIGH_SPEED_MIN_PLAY_DURATION_MS
        : MIN_PLAY_DURATION_MS;

    if (now - lastDebugLogRef.current > 5000) {
      lastDebugLogRef.current = now;
      const playingStates = states.filter((s) => s.isPlaying);
      if (playingStates.length > 0) {
        console.log(
          `[SpatialAudio Debug] Camera at (${camPos.x.toFixed(
            1
          )}, ${camPos.y.toFixed(1)}, ${camPos.z.toFixed(1)}), velocity: ${(
            currentVelocity * 3.6
          ).toFixed(0)} km/h`
        );

        if (listener) {
          const ctx = listener.context;
          const webAudioListener = ctx.listener;
          if (webAudioListener.positionX) {
            console.log(
              `  WebAudio Listener: (${webAudioListener.positionX.value.toFixed(
                1
              )}, ${webAudioListener.positionY.value.toFixed(
                1
              )}, ${webAudioListener.positionZ.value.toFixed(1)})`
            );
          }
        }

        playingStates.slice(0, 3).forEach((s) => {
          const dist = camPos.distanceTo(s.position);
          const playTime = Date.now() - s.playStartTime;
          let pannerInfo = "";
          if (s.audio) {
            const panner = s.audio.getOutput() as PannerNode;
            if (panner?.positionX) {
              pannerInfo = ` | panner: (${panner.positionX.value.toFixed(
                1
              )}, ${panner.positionY.value.toFixed(
                1
              )}, ${panner.positionZ.value.toFixed(1)})`;
            }
          }
          console.log(
            `  - ${s.source.id}: pos (${s.position.x.toFixed(
              1
            )}, ${s.position.y.toFixed(1)}, ${s.position.z.toFixed(
              1
            )}), dist=${dist.toFixed(1)}m, played=${(playTime / 1000).toFixed(
              1
            )}s${pannerInfo}`
          );
        });
      }
    }

    let activeCount = 0;

    // Separate states by priority for loading
    const highPriorityStates: AudioSourceState[] = [];
    const mediumPriorityStates: AudioSourceState[] = [];
    const lowPriorityStates: AudioSourceState[] = [];

    for (const state of states) {
      const distance = camPos.distanceTo(state.position);
      const unloadDistance =
        state.source.maxDistance * UNLOAD_DISTANCE_MULTIPLIER;

      const perceivedGain = calculateGainAtDistance(
        distance,
        state.source.refDistance,
        state.source.volume
      );

      const playDuration = state.isPlaying
        ? Date.now() - state.playStartTime
        : 0;
      const hasPlayedMinimum = playDuration >= minPlayDuration;

      if (state.isPlaying) {
        if (perceivedGain < CULL_GAIN_THRESHOLD && hasPlayedMinimum) {
          stopAudio(state);
        } else {
          activeCount++;
          state.lastUsedTime = Date.now();
        }
      } else {
        if (perceivedGain > RESUME_GAIN_THRESHOLD && state.buffer) {
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

    const handPlacedCount = TOKYO_SPATIAL_AUDIO_SOURCES.length;
    const proceduralCount = states.length - handPlacedCount;

    onStatsUpdate?.({
      total: states.length,
      active: activeCount,
      culled: states.length - activeCount,
      handPlaced: handPlacedCount,
      procedural: proceduralCount,
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
      {showDebug
        ? audioStates.map((state) => (
            <DebugMarker
              key={`debug-${state.source.id}`}
              position={state.position}
              source={state.source}
              isPlaying={state.isPlaying}
              loadingState={state.loadingState}
            />
          ))
        : null}
    </group>
  );
}
