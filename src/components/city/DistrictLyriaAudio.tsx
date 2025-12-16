"use client";

/**
 * DistrictLyriaAudio Component
 * Lyria session that blends Tokyo district prompts based on real GPS camera position
 */

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  TOKYO_DISTRICTS,
  TOKYO_DISTRICTS_BASIC,
  TOKYO_CENTER,
  getDistrictDetails,
  type District,
  type DistrictBasic,
  getDistrictPrompt,
} from "@/config/tokyo-config";
import {
  calculateDistrictWeights,
  enuToLatLngAlt,
  getDistrictAtPosition,
} from "@/lib/geo-utils";
import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";

const CROSSFADE_MS = 5;

export interface DistrictDebugInfo {
  name: string;
  nameJa: string;
  weight: number;
  distance: number;
  color: string;
  cameraLat?: number;
  cameraLng?: number;
}

interface DistrictLyriaAudioProps {
  apiKey: string;
  enabled?: boolean;
  volume?: number; // Master volume for Lyria audio
  onStatusUpdate?: (status: string) => void;
  onDebugUpdate?: (districts: DistrictDebugInfo[]) => void;
  onCurrentDistrictChange?: (district: District | null) => void;
  debugUpdateInterval?: number; // Frame interval for debug updates (default: 30)
}

/** DistrictLyriaAudio
 * 
 * Lyria session that blends Tokyo district prompts based on real GPS camera position
 * @param apiKey - Lyria API key
 * @param enabled - Whether to enable the audio
 * @param volume - Audio volume
 * @param onStatusUpdate - Callback function to update the status
 * @param onDebugUpdate - Callback function to update the debug information
 * @param onCurrentDistrictChange - Callback function to update the current district
 * @returns 
 */
export function DistrictLyriaAudio({
  apiKey,
  enabled = true,
  volume = 0.5,
  onStatusUpdate,
  onDebugUpdate,
  onCurrentDistrictChange,
  debugUpdateInterval = 30,
}: DistrictLyriaAudioProps) {
  const { camera } = useThree();
  const [status, setStatus] = useState<string>("Initializing...");
  const currentTime = useTimeOfDayStore((state) => state.currentTime);

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    onStatusUpdate?.(newStatus);
  };

  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef<number>(0);
  const initStartedRef = useRef(false);

  const previousWeightsRef = useRef<Map<string, number>>(new Map());
  const smoothedWeightsRef = useRef<Map<string, number>>(new Map());
  const lastUpdateTimeRef = useRef<number>(0);
  const isMountedRef = useRef(false);
  const instanceIdRef = useRef(0);

  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);
  const MAX_RECONNECT_ATTEMPTS = 10;
  const BASE_RECONNECT_DELAY = 2000;

  const masterGainRef = useRef<GainNode | null>(null);
  const oldGainRef = useRef<GainNode | null>(null);
  const newGainRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const savedWeightsRef = useRef<Map<string, number> | null>(null);
  const CROSSFADE_DURATION = 3.0;
  const isFirstSessionRef = useRef(true);

  const currentDistrictRef = useRef<District | null>(null);
  const currentTimeRef = useRef(currentTime);
  
  useEffect(() => {
    const previousTime = currentTimeRef.current;
    currentTimeRef.current = currentTime;
    
    if (previousTime !== currentTime && sessionRef.current) {
      console.log(`[DistrictLyria] Time of day changed: ${previousTime} -> ${currentTime}, updating prompts`);
      
      // Load details for districts with significant weight (synchronous - data in memory)
      const significantIds = Array.from(smoothedWeightsRef.current.entries())
        .filter(([_, weight]) => weight > 0.01)
        .map(([id]) => id);

      if (significantIds.length === 0) return;

      const detailsArray = significantIds.map((id) => getDistrictDetails(id));
      const weightedPrompts = detailsArray.map((details, idx) => ({
        text: getDistrictPrompt(details, currentTime),
        weight: Math.max(0.01, smoothedWeightsRef.current.get(significantIds[idx]) || 0.01),
      }));

      try {
        sessionRef.current?.setWeightedPrompts({
          weightedPrompts,
        });
      } catch (err) {
        console.warn("[DistrictLyria] Failed to update prompts on time change:", err);
      }
      
      try {
        sessionRef.current.setWeightedPrompts({
          weightedPrompts,
        });
      } catch (err) {
        console.warn("[DistrictLyria] Failed to update prompts on time change:", err);
      }
    }
  }, [currentTime]);

  // Update master gain when volume prop changes
  useEffect(() => {
    console.log(`[DistrictLyria] Lyria volume prop changed to: ${volume}, masterGain exists: ${!!masterGainRef.current}`);

    if (masterGainRef.current && typeof volume !== 'undefined') {
      const previousValue = masterGainRef.current.gain.value;
      masterGainRef.current.gain.value = volume;
      console.log(`[DistrictLyria] Master gain updated from ${previousValue} to: ${volume}`);

      // Verify the change was applied
      setTimeout(() => {
        if (masterGainRef.current) {
          console.log(`[DistrictLyria] Verified master gain is now: ${masterGainRef.current.gain.value}`);
        }
      }, 10);
    } else {
      console.log(`[DistrictLyria] Cannot update master gain - masterGain exists: ${!!masterGainRef.current}, volume defined: ${typeof volume !== 'undefined'}`);
    }
  }, [volume]);

  useEffect(() => {
    // Initialize weights using basic data (lightweight)
    TOKYO_DISTRICTS_BASIC.forEach((d) => {
      previousWeightsRef.current.set(d.id, 1 / TOKYO_DISTRICTS_BASIC.length);
      smoothedWeightsRef.current.set(d.id, 1 / TOKYO_DISTRICTS_BASIC.length);
    });
  }, []);

  const smoothWeights = (
    current: Map<string, number>,
    target: Array<{ district: District; weight: number }>,
    smoothing: number
  ): Map<string, number> => {
    const result = new Map<string, number>();
    target.forEach(({ district, weight }) => {
      const currentVal = current.get(district.id) || 0;
      result.set(district.id, currentVal + (weight - currentVal) * smoothing);
    });
    return result;
  };

  const hasSignificantChange = (
    prev: Map<string, number>,
    curr: Map<string, number>,
    threshold: number = 0.03
  ): boolean => {
    for (const [id, weight] of curr) {
      const prevWeight = prev.get(id) || 0;
      if (Math.abs(prevWeight - weight) > threshold) {
        return true;
      }
    }
    return false;
  };

  const initAudioRouting = (audioContext: AudioContext) => {
    if (!masterGainRef.current) {
      masterGainRef.current = audioContext.createGain();
      // Use the volume prop if provided, otherwise default to 0.5
      masterGainRef.current.gain.value = typeof volume !== 'undefined' ? volume : 0.5;
      masterGainRef.current.connect(audioContext.destination);
      console.log(`[DistrictLyria] Master gain initialized to: ${masterGainRef.current.gain.value}`);
    }

    const newGain = audioContext.createGain();
    newGain.gain.value = isFirstSessionRef.current ? 1.0 : 0.0;
    newGain.connect(masterGainRef.current);
    console.log(`[DistrictLyria] Initial gain set to: ${newGain.gain.value}`);

    if (newGainRef.current && !isFirstSessionRef.current) {
      oldGainRef.current = newGainRef.current;

      const now = audioContext.currentTime;
      oldGainRef.current.gain.setValueAtTime(oldGainRef.current.gain.value, now);
      oldGainRef.current.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);

      newGain.gain.setValueAtTime(0, now);
      newGain.gain.linearRampToValueAtTime(1.0, now + CROSSFADE_DURATION);

      console.log(`[DistrictLyria] Starting ${CROSSFADE_DURATION}s crossfade to new session`);

      setTimeout(() => {
        if (oldGainRef.current) {
          oldGainRef.current.disconnect();
          oldGainRef.current = null;
        }
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => {
          try {
            return s.context?.state !== "closed";
          } catch {
            return false;
          }
        });
      }, CROSSFADE_DURATION * 1000 + 500);
    }

    newGainRef.current = newGain;
    isFirstSessionRef.current = false;

    return newGain;
  };

  const playNextBuffer = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext || audioContext.state === "closed") return;

    if (!newGainRef.current) {
      initAudioRouting(audioContext);
    }

    if (nextStartTimeRef.current === 0) {
      nextStartTimeRef.current = audioContext.currentTime;
    }

    while (audioQueueRef.current.length > 0) {
      if (audioContext.state === "interrupted") return;

      const buffer = audioQueueRef.current.shift()!;

      try {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();

        const now = audioContext.currentTime;
        const startTime = Math.max(now + 0.05, nextStartTimeRef.current);

        const fade = CROSSFADE_MS / 1000;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1.0, startTime + fade);
        const fadeOutStart = Math.max(startTime, startTime + buffer.duration - fade);
        gainNode.gain.setValueAtTime(1.0, fadeOutStart);
        gainNode.gain.linearRampToValueAtTime(0, startTime + buffer.duration);

        source.connect(gainNode);
        gainNode.connect(newGainRef.current!);

        source.start(startTime);

        activeSourcesRef.current.push(source);

        source.onended = () => {
          const idx = activeSourcesRef.current.indexOf(source);
          if (idx > -1) activeSourcesRef.current.splice(idx, 1);

          if (audioQueueRef.current.length > 0 && audioContextRef.current?.state !== "closed") {
            playNextBuffer();
          } else {
            isPlayingRef.current = false;
          }
        };

        nextStartTimeRef.current = startTime + buffer.duration - CROSSFADE_MS / 1000;
        isPlayingRef.current = true;

        if (nextStartTimeRef.current - now > 0.5) {
          break;
        }
      } catch (err) {
        console.warn("[DistrictLyria] Error playing buffer:", err);
        break;
      }
    }

    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
    }
  };

  const scheduleReconnect = () => {
    if (!isMountedRef.current || !enabled || isReconnectingRef.current) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("[DistrictLyria] Max reconnection attempts reached");
      updateStatus("Connection failed - max retries exceeded");
      return;
    }

    savedWeightsRef.current = new Map(smoothedWeightsRef.current);
    console.log("[DistrictLyria] Saving weights for reconnect");

    isReconnectingRef.current = true;
    const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
    const cappedDelay = Math.min(delay, 30000);

    console.log(
      `[DistrictLyria] Scheduling reconnect in ${cappedDelay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
    );
    updateStatus(`Reconnecting in ${Math.round(cappedDelay / 1000)}s...`);

    reconnectTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current || !enabled) {
        isReconnectingRef.current = false;
        return;
      }

      reconnectAttemptsRef.current++;
      initStartedRef.current = false;
      isReconnectingRef.current = false;

      if (sessionRef.current) {
        try {
          sessionRef.current.stop();
        } catch (e) {
          /* ignore */
        }
        sessionRef.current = null;
      }

      audioQueueRef.current = [];
      nextStartTimeRef.current = 0;

      await initializeLyriaSession();
    }, cappedDelay);
  };

  const initializeLyriaSession = async () => {
    if (!apiKey || initStartedRef.current || !isMountedRef.current) return;
    initStartedRef.current = true;

    const isReconnect = savedWeightsRef.current !== null;

    try {
      updateStatus(isReconnect ? "Reconnecting to Lyria..." : "Connecting to Lyria...");

      if (!isMountedRef.current) return;

      let audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state === "closed") {
        audioContext = new AudioContext({ sampleRate: 48000 });
        audioContextRef.current = audioContext;
        isFirstSessionRef.current = true;
      }

      if (!isMountedRef.current) {
        if (isFirstSessionRef.current) audioContext.close();
        return;
      }

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      initAudioRouting(audioContext);

      if (!isMountedRef.current) {
        return;
      }

      const { GoogleGenAI } = await import("@google/genai");

      if (!isMountedRef.current) {
        return;
      }

      const client = new GoogleGenAI({
        apiKey,
        apiVersion: "v1alpha",
      });

      const session = await client.live.music.connect({
        model: "models/lyria-realtime-exp",
        callbacks: {
          onmessage: (message: any) => {
            if (!isMountedRef.current) return;

            if (message.serverContent?.audioChunks) {
              const ctx = audioContextRef.current;
              if (!ctx || ctx.state === "closed") {
                return;
              }

              for (const chunk of message.serverContent.audioChunks) {
                if (chunk.data) {
                  try {
                    const binaryString = atob(chunk.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }

                    const pcm16 = new Int16Array(bytes.buffer);
                    const numChannels = 2;
                    const numFrames = pcm16.length / numChannels;

                    const audioBuffer = ctx.createBuffer(
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

                    if (!isPlayingRef.current) {
                      playNextBuffer();
                    }
                  } catch (err) {
                    console.error("[DistrictLyria] Error processing audio:", err);
                  }
                }
              }
            }
          },
          onerror: (err: any) => {
            console.error("[DistrictLyria] Lyria error:", err);
            updateStatus("Error: " + (err?.message || "Unknown"));
            initStartedRef.current = false;
            scheduleReconnect();
          },
          onclose: (event: any) => {
            const reason = event?.reason || "Unknown";
            console.warn(`[DistrictLyria] Connection closed: ${reason}`);
            updateStatus("Disconnected");
            initStartedRef.current = false;
            sessionRef.current = null;

            if (isMountedRef.current && enabled) {
              scheduleReconnect();
            }
          },
        },
      });

      if (!isMountedRef.current) {
        session.stop();
        return;
      }

      sessionRef.current = session;

      await session.setMusicGenerationConfig({
        musicGenerationConfig: {
          bpm: 120,
          temperature: 1.1,
          guidance: 4.0,
        },
      });

      const weightsToUse = savedWeightsRef.current || smoothedWeightsRef.current;
      const timeOfDay = currentTimeRef.current;
      
      // Load details only for districts with significant weight
      const significantIds = Array.from(weightsToUse.entries())
        .filter(([_, weight]) => weight > 0.01)
        .map(([id]) => id);

      // If no significant districts, use all basic districts
      const idsToLoad = significantIds.length > 0 
        ? significantIds 
        : TOKYO_DISTRICTS_BASIC.map(d => d.id);

      // Load details synchronously (data is in memory)
      const detailsArray = idsToLoad.map(id => getDistrictDetails(id));
      
      const initialPrompts = detailsArray.map((details, idx) => ({
        text: getDistrictPrompt(details, timeOfDay),
        weight: weightsToUse.get(idsToLoad[idx]) || 1 / TOKYO_DISTRICTS_BASIC.length,
      }));

      console.log("[DistrictLyria] Setting prompts with weights:", initialPrompts);

      await session.setWeightedPrompts({
        weightedPrompts: initialPrompts,
      });

      if (savedWeightsRef.current) {
        smoothedWeightsRef.current = new Map(savedWeightsRef.current);
        previousWeightsRef.current = new Map(savedWeightsRef.current);
      }

      await session.play();
      updateStatus(isReconnect ? "Reconnected" : "Playing");

      reconnectAttemptsRef.current = 0;
      isReconnectingRef.current = false;
      savedWeightsRef.current = null;

      console.log(
        `[DistrictLyria] ${isReconnect ? "Reconnected" : "Started"} with ${TOKYO_DISTRICTS_BASIC.length} district prompts (lazy loaded)`
      );
    } catch (err) {
      console.error("[DistrictLyria] Failed to initialize:", err);
      updateStatus("Failed to connect");
      initStartedRef.current = false;

      if (isMountedRef.current && enabled) {
        scheduleReconnect();
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const currentInstance = ++instanceIdRef.current;

    if (enabled && apiKey) {
      setTimeout(() => {
        if (isMountedRef.current && currentInstance === instanceIdRef.current) {
          initializeLyriaSession();
        }
      }, 50);
    }

    return () => {
      isMountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      isReconnectingRef.current = false;
      savedWeightsRef.current = null;

      const sessionToStop = sessionRef.current;
      const contextToClose = audioContextRef.current;

      sessionRef.current = null;
      audioContextRef.current = null;
      initStartedRef.current = false;

      if (oldGainRef.current) {
        try {
          oldGainRef.current.disconnect();
        } catch {}
        oldGainRef.current = null;
      }
      if (newGainRef.current) {
        try {
          newGainRef.current.disconnect();
        } catch {}
        newGainRef.current = null;
      }
      if (masterGainRef.current) {
        try {
          masterGainRef.current.disconnect();
        } catch {}
        masterGainRef.current = null;
      }

      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop();
        } catch {}
      });
      activeSourcesRef.current = [];
      isFirstSessionRef.current = true;

      setTimeout(() => {
        if (sessionToStop) {
          try {
            sessionToStop.stop();
          } catch (e) {}
        }
        if (contextToClose && contextToClose.state !== "closed") {
          contextToClose.close();
        }
      }, 200);
    };
  }, [enabled, apiKey]);

  const cameraPosRef = useRef(new THREE.Vector3());
  const frameCountRef = useRef(0);
  const lastDebugInfoRef = useRef<DistrictDebugInfo[]>(
    TOKYO_DISTRICTS_BASIC.map((d) => ({
      name: d.name,
      nameJa: d.nameJa,
      weight: 1 / TOKYO_DISTRICTS_BASIC.length,
      distance: 0,
      color: d.color,
    }))
  );

  useFrame(() => {
    frameCountRef.current++;
    if (frameCountRef.current % 3 !== 0) return; // 20fps

    camera.getWorldPosition(cameraPosRef.current);
    
    // Camera is in local ENU coordinates (flat Tokyo), convert to lat/lng
    const geo = enuToLatLngAlt(
      cameraPosRef.current,
      TOKYO_CENTER.lat,
      TOKYO_CENTER.lng,
      0
    );

    // Calculate weights (lazy loads details only for significant districts)
    const districtWeights = calculateDistrictWeights(geo.lat, geo.lng);

    smoothedWeightsRef.current = smoothWeights(
      smoothedWeightsRef.current,
      districtWeights,
      0.3
    );

    // Get current district (lazy loads details only if found)
    const currentDistrict = getDistrictAtPosition(geo.lat, geo.lng);
    if (currentDistrict !== currentDistrictRef.current) {
      currentDistrictRef.current = currentDistrict;
      onCurrentDistrictChange?.(currentDistrict);

      console.log(
        `[DistrictLyria] Position: ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)} → ${currentDistrict?.name || "none"}`
      );
    }

    // Update debug info if callback provided
    if (onDebugUpdate && frameCountRef.current % debugUpdateInterval === 0) {
      const newDebugInfo: DistrictDebugInfo[] = districtWeights.map((dw) => ({
        name: dw.district.name,
        nameJa: dw.district.nameJa,
        weight: smoothedWeightsRef.current.get(dw.district.id) || 0,
        distance: dw.distance,
        color: dw.district.color,
        cameraLat: geo.lat,
        cameraLng: geo.lng,
      }));
      onDebugUpdate(newDebugInfo);
    }

    if (!sessionRef.current || !enabled) return;

    const now = performance.now();

    if (now - lastUpdateTimeRef.current < 500) return;
    lastUpdateTimeRef.current = now;

    if (hasSignificantChange(previousWeightsRef.current, smoothedWeightsRef.current, 0.03)) {
      previousWeightsRef.current = new Map(smoothedWeightsRef.current);

      const timeOfDay = currentTimeRef.current;
      // Load details for districts with significant weight (synchronous - data in memory)
      const significantIds = Array.from(smoothedWeightsRef.current.entries())
        .filter(([_, weight]) => weight > 0.01)
        .map(([id]) => id);

      if (significantIds.length === 0) return;

      const detailsArray = significantIds.map((id) => getDistrictDetails(id));
      const weightedPrompts = detailsArray.map((details, idx) => ({
        text: getDistrictPrompt(details, timeOfDay),
        weight: Math.max(0.01, smoothedWeightsRef.current.get(significantIds[idx]) || 0.01),
      }));

      try {
        sessionRef.current?.setWeightedPrompts({
          weightedPrompts,
        });
      } catch (err) {
        console.warn("[DistrictLyria] Failed to update prompts:", err);
      }

      try {
        sessionRef.current.setWeightedPrompts({
          weightedPrompts,
        });
      } catch (err) {
        console.warn("[DistrictLyria] Failed to update prompts:", err);
      }
    }
  });

  return null;
}

/** District
 * 
 * District type
 * @param id - District ID
 * @param name - District name
 * @param nameJa - District name in Japanese
 * @param prompt - District prompt
 * @param color - District color
 */
export type { District };

