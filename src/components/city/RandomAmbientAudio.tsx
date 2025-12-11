"use client";

/**
 * RandomAmbientAudio Component
 * Manages randomly distributed ambient audio sources across the map
 */

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TOKYO_CENTER } from "@/config/tokyo-config";
import { latLngAltToENU } from "@/lib/geo-utils";
import {
  generateRandomAmbientAudio,
  generateRandomAmbientAudioWithSeed,
} from "@/lib/random-ambient-audio";
import type {
  SpatialAudioSource,
  RandomAmbientAudioConfig,
} from "@/config/tokyo-config";

const CULL_DISTANCE_MULTIPLIER = 1.5; // Start playing when within maxDistance * this
const HYSTERESIS = 0.8; // Resume distance = cull distance * this (prevents rapid on/off)
const MAX_CONCURRENT_PLAYING = 8; // Maximum number of audio sources playing simultaneously
const LOAD_BATCH_SIZE = 3; // Load audio files in batches to avoid overwhelming the browser

interface AudioSourceState {
  source: SpatialAudioSource;
  position: THREE.Vector3;
  buffer: AudioBuffer | null;
  audio: THREE.PositionalAudio | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RandomAmbientAudioProps {
  enabled?: boolean;
  tilesLoaded?: boolean; // Wait for tiles to load before initializing
  config?: Partial<RandomAmbientAudioConfig>;
  seed?: number; // Optional seed for reproducible random distribution
  showDebug?: boolean;
  onStatsUpdate?: (stats: {
    total: number;
    active: number;
    culled: number;
  }) => void;
}

/**
 * Debug visualization for random audio sources
 */
function DebugMarker({
  position,
  isPlaying,
}: {
  position: THREE.Vector3;
  isPlaying: boolean;
}) {
  return (
    <group position={[position.x, position.y + 5, position.z]}>
      <mesh>
        <sphereGeometry args={[5, 8, 8]} />
        <meshBasicMaterial
          color={isPlaying ? "#00ff00" : "#666666"}
          transparent
          opacity={isPlaying ? 0.4 : 0.2}
        />
      </mesh>
    </group>
  );
}

/**
 * Main Random Ambient Audio component
 * Manages all random audio sources with distance-based culling
 */
export function RandomAmbientAudio({
  enabled = true,
  tilesLoaded = false,
  config,
  seed,
  showDebug = false,
  onStatsUpdate,
}: RandomAmbientAudioProps) {
  const { camera } = useThree();
  const [listener, setListener] = useState<THREE.AudioListener | null>(null);
  const [contextResumed, setContextResumed] = useState(false);
  const [audioStates, setAudioStates] = useState<AudioSourceState[]>([]);

  const audioStatesRef = useRef<AudioSourceState[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const cameraPositionRef = useRef(new THREE.Vector3());
  const lastUpdateRef = useRef(0);
  const [initialStates, setInitialStates] = useState<AudioSourceState[]>([]);
  const [sourcesGenerated, setSourcesGenerated] = useState(false);

  // Audio buffer cache to share buffers for same audio files
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  // Track loading queue for batch loading
  const loadingQueueRef = useRef<AudioSourceState[]>([]);
  const loadingInProgressRef = useRef(false);

  // Generate random audio sources only after tiles are loaded and on client side
  useEffect(() => {
    if (sourcesGenerated || typeof window === "undefined" || !tilesLoaded)
      return;

    // Small delay to ensure map is fully ready
    const timer = setTimeout(() => {
      let randomSources: SpatialAudioSource[];
      if (seed !== undefined) {
        // Use seeded generation for reproducibility
        randomSources = generateRandomAmbientAudioWithSeed(seed, config);
      } else {
        randomSources = generateRandomAmbientAudio(config);
      }

      // Convert sources to initial states with ENU positions
      const states = randomSources.map((source) => {
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

      setInitialStates(states);
      setSourcesGenerated(true);
      console.log(
        `[RandomAmbientAudio] Generated ${states.length} audio sources after tiles loaded`
      );
    }, 500); // 500ms delay to ensure map is stable

    return () => clearTimeout(timer);
  }, [config, seed, sourcesGenerated, tilesLoaded]);

  // Initialize AudioListener
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
          console.log("[RandomAmbientAudio] AudioContext resumed");
        } catch (err) {
          console.error(
            "[RandomAmbientAudio] Failed to resume AudioContext:",
            err
          );
        }
      }
      setContextResumed(true);
    };

    resumeContext();

    // Resume context on user interaction
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

  // Load audio files with buffer caching and batch loading
  // Only load audio when source is close enough to be played
  const loadAudioForSource = useCallback((state: AudioSourceState) => {
    if (state.buffer || state.isLoading) return; // Already loaded or loading

    const cachedBuffer = bufferCacheRef.current.get(state.source.src);
    if (cachedBuffer) {
      // Reuse cached buffer
      state.buffer = cachedBuffer;
      state.isLoading = false;
      return;
    }

    // Add to loading queue for batch processing
    if (!loadingQueueRef.current.includes(state)) {
      loadingQueueRef.current.push(state);
    }
  }, []);

  // Process loading queue in batches
  useEffect(() => {
    if (loadingInProgressRef.current || loadingQueueRef.current.length === 0)
      return;

    const processBatch = async () => {
      loadingInProgressRef.current = true;
      const batch = loadingQueueRef.current.splice(0, LOAD_BATCH_SIZE);

      const loader = new THREE.AudioLoader();

      for (const state of batch) {
        if (state.buffer || state.isLoading) continue;

        const cachedBuffer = bufferCacheRef.current.get(state.source.src);
        if (cachedBuffer) {
          state.buffer = cachedBuffer;
          continue;
        }

        state.isLoading = true;

        try {
          const buffer = await new Promise<AudioBuffer>((resolve, reject) => {
            loader.load(state.source.src, resolve, undefined, reject);
          });

          // Cache the buffer for reuse
          bufferCacheRef.current.set(state.source.src, buffer);
          state.buffer = buffer;
          state.isLoading = false;
          console.log(`[RandomAmbientAudio] Loaded: ${state.source.id}`);
        } catch (err) {
          state.error = String(err);
          state.isLoading = false;
          console.error(
            `[RandomAmbientAudio] Failed to load ${state.source.id}:`,
            err
          );
        }
      }

      loadingInProgressRef.current = false;

      // Process next batch if queue is not empty
      if (loadingQueueRef.current.length > 0) {
        setTimeout(() => processBatch(), 100); // Small delay between batches
      }
    };

    processBatch();
  }, [initialStates]);

  // Initialize states (but don't load audio yet)
  useEffect(() => {
    if (!listener || !contextResumed || initialStates.length === 0) return;

    const states = [...initialStates];
    audioStatesRef.current = states;
    setAudioStates(states);
  }, [listener, contextResumed, initialStates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioStatesRef.current.forEach((state) => {
        if (state.audio) {
          if (state.audio.isPlaying) {
            state.audio.stop();
          }
          state.audio.disconnect();
          groupRef.current?.remove(state.audio);
          state.audio = null;
        }
      });
      // Clear buffer cache and loading queue on unmount
      bufferCacheRef.current.clear();
      loadingQueueRef.current = [];
      loadingInProgressRef.current = false;
    };
  }, []);

  // Start playing audio for a source
  const startAudio = useCallback(
    (state: AudioSourceState) => {
      if (!listener || !groupRef.current || !state.buffer || state.isPlaying)
        return;

      const audio = new THREE.PositionalAudio(listener);

      audio.setBuffer(state.buffer);
      audio.setRefDistance(state.source.refDistance);
      audio.setRolloffFactor(1.5);
      audio.setMaxDistance(state.source.maxDistance);
      audio.setDistanceModel("inverse");
      audio.setLoop(state.source.loop);
      audio.setVolume(state.source.volume);

      // Use HRTF panning for realistic spatial audio
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
      } catch (err) {
        console.error(
          `[RandomAmbientAudio] Failed to play ${state.source.id}:`,
          err
        );
        groupRef.current.remove(audio);
      }
    },
    [listener]
  );

  // Stop playing audio for a source
  const stopAudio = useCallback((state: AudioSourceState) => {
    if (!state.audio || !state.isPlaying) return;

    try {
      if (state.audio.isPlaying) {
        state.audio.stop();
      }
      state.audio.disconnect();
      groupRef.current?.remove(state.audio);
    } catch (err) {
      console.error(
        `[RandomAmbientAudio] Error stopping ${state.source.id}:`,
        err
      );
    }

    state.audio = null;
    state.isPlaying = false;
  }, []);

  // Update distance-based culling every frame
  useFrame(() => {
    if (!enabled || !contextResumed || initialStates.length === 0) return;

    const now = performance.now();
    // Throttle updates to every 100ms
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;

    camera.getWorldPosition(cameraPositionRef.current);
    const camPos = cameraPositionRef.current;

    let activeCount = 0;
    const states = audioStatesRef.current;

    // Calculate distances and prioritize sources by proximity
    const sourcesWithDistance = states
      .map((state) => ({
        state,
        distance: camPos.distanceTo(state.position),
      }))
      .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)

    let currentlyPlaying = 0;

    // Check distance for each audio source (closest first)
    for (const { state, distance } of sourcesWithDistance) {
      const cullDistance = state.source.maxDistance * CULL_DISTANCE_MULTIPLIER;
      const resumeDistance = cullDistance * HYSTERESIS;
      const loadDistance = resumeDistance * 1.2; // Load audio slightly before it's needed

      // Lazy load audio when getting close
      if (!state.buffer && !state.isLoading && distance < loadDistance) {
        loadAudioForSource(state);
      }

      if (!state.buffer) continue; // Skip if not loaded yet

      if (state.isPlaying) {
        // Stop only if too far away (don't stop due to concurrent limit)
        if (distance > cullDistance) {
          stopAudio(state);
        } else {
          activeCount++;
          currentlyPlaying++;
        }
      } else {
        // Start if close enough and we haven't exceeded max concurrent playing
        // Prioritize closest sources
        if (
          distance < resumeDistance &&
          currentlyPlaying < MAX_CONCURRENT_PLAYING
        ) {
          startAudio(state);
          if (state.isPlaying) {
            activeCount++;
            currentlyPlaying++;
          }
        }
      }
    }

    // Report statistics
    onStatsUpdate?.({
      total: states.length,
      active: activeCount,
      culled: states.length - activeCount,
    });
  });

  // Update debug markers periodically
  useEffect(() => {
    if (!showDebug) return;

    const interval = setInterval(() => {
      setAudioStates([...audioStatesRef.current]);
    }, 500);

    return () => clearInterval(interval);
  }, [showDebug]);

  if (!enabled || !listener || !contextResumed || initialStates.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef} name="random-ambient-audio">
      {showDebug &&
        audioStates.map((state) => (
          <DebugMarker
            key={`debug-${state.source.id}`}
            position={state.position}
            isPlaying={state.isPlaying}
          />
        ))}
    </group>
  );
}
