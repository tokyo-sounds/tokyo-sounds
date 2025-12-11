"use client";

/* Lyria Realtime Generative Proximity Audio
 * 
 * This component uses the Lyria Realtime API to generate audio based on the camera position.
 * 
 * Weights are defined in the @/lib/proximity-weights.ts file.
 * Prompts are defined in the @/config/building-prompts.ts file.
*/

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { PROXIMITY_CONFIG } from "@/config/building-prompts";
import {
  getWeightedPromptsForLyria,
  hasSignificantChange,
  calculateBuildingWeights,
  refreshBuildingPositionsFromScene,
  buildingAnchorsResolved,
  type WeightedPrompt
} from "@/lib/proximity-weights";

const SCHEDULE_AHEAD = 3.0; // seconds of audio to keep scheduled
const CROSSFADE_MS = 5; // small fade to avoid clicks between buffers

interface LyriaRealtimeGenProxProps {
  apiKey: string;
  enabled?: boolean;
  volume?: number;
  updateInterval?: number;
  onDebugUpdate?: (weights: { id: string; prompt: string; weight: number; distance: number }[]) => void;
  onStatusUpdate?: (status: string) => void;
}

export function LyriaRealtimeGenProx({
  apiKey,
  enabled = true,
  volume = 0.5,
  updateInterval = 200,
  onDebugUpdate,
  onStatusUpdate,
}: LyriaRealtimeGenProxProps) {
  const { camera, scene } = useThree();
  const [, setStatus] = useState<string>("Initializing...");
  const [, setError] = useState<string | null>(null);

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    onStatusUpdate?.(newStatus);
  };

  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef<number>(0);
  const previousPromptsRef = useRef<WeightedPrompt[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const initStartedRef = useRef(false);
  const positionSyncTimeRef = useRef<number>(0);
  const positionsResolvedRef = useRef(false);
  const cameraWorldRef = useRef(new Vector3());
  const lastDebugSnapshotRef = useRef<string[]>([]);
  const smoothedWeightsRef = useRef<Map<string, number>>(new Map());
  const lastSmoothingTimeRef = useRef<number>(0);

  const startSessionIfNeeded = async () => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;
    await initializeLyriaSession();
  };

  const initializeLyriaSession = async () => {
    try {
      updateStatus("Connecting to Lyria...");

      refreshBuildingPositionsFromScene(scene);
      positionsResolvedRef.current = positionsResolvedRef.current || buildingAnchorsResolved();

      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({
        apiKey,
        apiVersion: "v1alpha",
      });

      const session = await client.live.music.connect({
        model: "models/lyria-realtime-exp",
        callbacks: {
          onmessage: (message: any) => {
            if (message.serverContent?.audioChunks) {
              for (const chunk of message.serverContent.audioChunks) {
                if (chunk.data && audioContextRef.current) {
                  try {
                    // decode base64 PCM16
                    const binaryString = atob(chunk.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }

                    const pcm16 = new Int16Array(bytes.buffer);
                    const numChannels = 2;
                    const numFrames = pcm16.length / numChannels;

                    const audioBuffer = audioContextRef.current.createBuffer(
                      numChannels,
                      numFrames,
                      chunk.sampleRate ?? 48000
                    );

                    const leftChannel = audioBuffer.getChannelData(0);
                    const rightChannel = audioBuffer.getChannelData(1);

                    for (let i = 0; i < numFrames; i++) {
                      leftChannel[i] = pcm16[i * 2] / 32768.0;
                      rightChannel[i] = pcm16[i * 2 + 1] / 32768.0;
                    }

                    audioQueueRef.current.push(audioBuffer);
                    
                    const audioCtx = audioContextRef.current;
                    if (!isPlayingRef.current) {
                      playNextBuffer();
                    }
                  } catch (err) {
                    console.error("Error processing audio chunk:", err);
                  }
                }
              }
            }
          },
          onerror: (err: any) => {
            console.error("Lyria error:", err);
            setError(err.message || "Unknown error");
            updateStatus("Error: " + (err.message || "Unknown"));
          },
          onclose: (event: any) => {
            console.log("Connection closed:", event);
            updateStatus("Disconnected");
          },
        },
      });

      sessionRef.current = session;
      console.log("WebSocket opened");
      updateStatus("Connected!");

      await session.setMusicGenerationConfig({
        musicGenerationConfig: {
          bpm: 120,
          temperature: 1.1,
          guidance: 4.0,
        },
      });

      const cameraWorldPos = camera.getWorldPosition(cameraWorldRef.current);
      const initialPrompts = getWeightedPromptsForLyria(cameraWorldPos);

      let prompts: WeightedPrompt[];
      if (initialPrompts.length > 0) {
        console.log("Using proximity prompts:", initialPrompts);
        prompts = initialPrompts;
      } else {
        console.log("No buildings in range, using default ambient prompt");
        prompts = [
          { text: "Ambient Tokyo city atmosphere, distant sounds, peaceful", weight: 1.0 }
        ];
      }

      await session.setWeightedPrompts({ weightedPrompts: prompts });
      previousPromptsRef.current = prompts;

      await session.play();
      updateStatus("Playing");
      console.log("Lyria started successfully");

    } catch (err) {
      console.error("Failed to initialize Lyria:", err);
      setError(err instanceof Error ? err.message : String(err));
      updateStatus("Failed to start");
      initStartedRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled || !apiKey) return;

    const init = async () => {
      try {
        console.log("Initializing Lyria Proximity Audio...");
        updateStatus("Creating AudioContext...");

        const audioContext = new AudioContext({ sampleRate: 48000 });
        audioContextRef.current = audioContext;

        if (audioContext.state === "suspended") {
          updateStatus("Waiting for user interaction (move camera)...");
          console.log("AudioContext suspended, waiting for user gesture");
          return;
        }

        console.log("AudioContext ready, state:", audioContext.state);
        await startSessionIfNeeded();

      } catch (err) {
        console.error("Failed to initialize:", err);
        setError(err instanceof Error ? err.message : String(err));
        updateStatus("Failed to start");
      }
    };

    init();

    return () => {
      if (sessionRef.current) {
        try {
          sessionRef.current.stop();
        } catch (err) {
          console.error("Error stopping session:", err);
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [enabled, apiKey, camera.position]);

  const playNextBuffer = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (nextStartTimeRef.current === 0) {
      nextStartTimeRef.current = audioContext.currentTime;
    }

    while (audioQueueRef.current.length > 0) {
      const buffer = audioQueueRef.current.shift()!;

      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = audioContext.createGain();
      
      const now = audioContext.currentTime;
      const startTime = Math.max(now + 0.05, nextStartTimeRef.current);
      
      const fade = CROSSFADE_MS / 1000;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + fade);
      const fadeOutStart = Math.max(startTime, startTime + buffer.duration - fade);
      gainNode.gain.setValueAtTime(volume, fadeOutStart);
      gainNode.gain.linearRampToValueAtTime(0, startTime + buffer.duration);

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      source.start(startTime);
      source.onended = () => {
        if (audioQueueRef.current.length > 0) {
          playNextBuffer();
        } else {
          isPlayingRef.current = false;
        }
      };

      nextStartTimeRef.current = startTime + buffer.duration - (CROSSFADE_MS / 1000); // Overlap slightly for crossfade

      isPlayingRef.current = true;

      if (nextStartTimeRef.current - now > 0.5) {
        break;
      }
    }

    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
    }
  };

  const rawWeightsRef = useRef<Map<string, number>>(new Map());

  useFrame((state, delta) => {
    if (!enabled) return;

    const nowPerf = performance.now();
    const shouldRefreshPositions =
      !positionsResolvedRef.current || nowPerf - positionSyncTimeRef.current > 1000;

    if (shouldRefreshPositions) {
      const updated = refreshBuildingPositionsFromScene(scene);
      positionSyncTimeRef.current = nowPerf;
      if (updated || buildingAnchorsResolved()) {
        positionsResolvedRef.current = buildingAnchorsResolved();
      }
    }

    if (audioContextRef.current && audioContextRef.current.state === "suspended" && !initStartedRef.current) {
      audioContextRef.current
        .resume()
        .then(async () => {
          console.log("AudioContext resumed after user gesture");
          if (!sessionRef.current) {
            updateStatus("AudioContext resumed! Connecting to Lyria...");
            await startSessionIfNeeded();
          }
        })
        .catch(err => {
          console.log("Still waiting for user gesture:", err);
        });
    }

    const now = Date.now();
    const shouldUpdate = now - lastUpdateTimeRef.current >= updateInterval;

    const cameraWorldPos = camera.getWorldPosition(cameraWorldRef.current);
    
    if (cameraWorldPos.lengthSq() === 0) {
      return;
    }

    const rawBuildingWeights = calculateBuildingWeights(cameraWorldPos);

    for (const bw of rawBuildingWeights) {
        const prev = rawWeightsRef.current.get(bw.id);
        if (prev !== undefined && Math.abs(prev - bw.weight) > 0.5) {
             if (Math.random() < 0.05) console.warn(`⚠️ Unstable weight jump for ${bw.id}: ${prev.toFixed(3)} -> ${bw.weight.toFixed(3)}`);
        }
        rawWeightsRef.current.set(bw.id, bw.weight);
    }
    
    const safeDelta = Math.min(delta, 0.1); // Cap delta at 100ms
    const LERP_FACTOR = 1.0 - Math.pow(0.1, safeDelta);

    const buildingWeights = rawBuildingWeights.map(bw => {
      const current = smoothedWeightsRef.current.get(bw.id) || 0;
      
      let next = current + (bw.weight - current) * LERP_FACTOR;
      
      if (Math.abs(next - current) < 0.005) {
         next = current;
      }
      
      if (Math.abs(next - bw.weight) < 0.01) {
         next = bw.weight;
      }
      
      if (next < 0.01) next = 0;

      smoothedWeightsRef.current.set(bw.id, next);
      
      return {
        ...bw,
        weight: next
      };
    }).sort((a, b) => b.weight - a.weight);

    if (onDebugUpdate) {
      const snapshot = buildingWeights.map(b => `${b.id}:${b.weight.toFixed(3)}:${Math.round(b.surfaceDistance)}`);
      const changed =
        snapshot.length !== lastDebugSnapshotRef.current.length ||
        snapshot.some((entry, idx) => entry !== lastDebugSnapshotRef.current[idx]);

      if (changed) {
        lastDebugSnapshotRef.current = snapshot;
        
        if (Math.random() < 0.01) {
             console.log("DEBUG: Camera Pos:", cameraWorldPos);
             console.log("DEBUG: Building Weights:", buildingWeights.map(b => ({ id: b.id, dist: b.distance, surf: b.surfaceDistance, w: b.weight })));
        }

        onDebugUpdate(buildingWeights.map(b => ({
          id: b.id,
          prompt: b.prompt.substring(0, 40) + "...",
          weight: b.weight,
          distance: b.surfaceDistance
        })));
      }
    }

    if (!sessionRef.current || !shouldUpdate) return;

    lastUpdateTimeRef.current = now;

    const currentPrompts: WeightedPrompt[] = buildingWeights
      .filter(b => b.weight >= PROXIMITY_CONFIG.MIN_WEIGHT_THRESHOLD)
      .slice(0, PROXIMITY_CONFIG.MAX_ACTIVE_PROMPTS)
      .map(b => ({
        text: b.prompt,
        weight: b.weight
      }));

    if (hasSignificantChange(previousPromptsRef.current, currentPrompts, 0.1)) {
      console.log("Proximity changed, updating prompts:", currentPrompts);

      const prompts = currentPrompts.length > 0 ? currentPrompts : [
        { text: "Ambient Tokyo city atmosphere, distant sounds, peaceful", weight: 1.0 }
      ];

      sessionRef.current.setWeightedPrompts({ weightedPrompts: prompts });
      previousPromptsRef.current = currentPrompts;
    }
  });

  return null;
}
