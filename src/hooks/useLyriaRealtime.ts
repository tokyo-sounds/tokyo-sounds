/**
 * useLyriaRealtime Hook
 * Manages Lyria RealTime API connection and audio generation
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { WeightedPrompt } from "@/lib/proximity-weights";

// Types for Lyria API (based on @google/genai documentation)
interface LyriaSession {
  setWeightedPrompts: (config: {
    weightedPrompts: WeightedPrompt[];
  }) => Promise<void>;
  setMusicGenerationConfig: (config: MusicGenerationConfig) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  reset_context: () => Promise<void>;
}

interface MusicGenerationConfig {
  audioFormat?: "pcm16";
  sampleRateHz?: number;
  bpm?: number;
}

// Lyria API メッセージの型定義
interface LyriaMessage {
  data?: string;
  serverContent?: {
    audioChunks?: string[];
  };
  audioChunk?: string;
}

interface LyriaClient {
  live: {
    music: {
      connect: (config: {
        model: string;
        callbacks: {
          onmessage: (message: LyriaMessage) => void;
          onerror: (error: Error) => void;
          onclose: () => void;
        };
      }) => Promise<LyriaSession>;
    };
  };
}

interface UseLyriaRealtimeOptions {
  apiKey: string;
  enabled?: boolean;
  sampleRateHz?: number;
  bpm?: number;
  onAudioChunk?: (audioData: ArrayBuffer) => void;
}

interface UseLyriaRealtimeResult {
  isConnected: boolean;
  isPlaying: boolean;
  error: Error | null;
  updateWeightedPrompts: (prompts: WeightedPrompt[]) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  resetContext: () => Promise<void>;
}

export function useLyriaRealtime({
  apiKey,
  enabled = true,
  sampleRateHz = 44100,
  bpm = 120,
  onAudioChunk,
}: UseLyriaRealtimeOptions): UseLyriaRealtimeResult {
  const sessionRef = useRef<LyriaSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const decodeAudioData = useCallback((base64Data: string): ArrayBuffer => {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }, []);

  useEffect(() => {
    if (!enabled || !apiKey) return;

    let mounted = true;

    const initLyria = async () => {
      try {
        const { GoogleGenAI } = await import("@google/genai");

        const client = new GoogleGenAI({
          apiKey,
          apiVersion: "v1alpha",
        }) as unknown as LyriaClient;

        const session = await client.live.music.connect({
          model: "models/lyria-realtime-exp",
          callbacks: {
            onmessage: (message) => {
              console.log("Received Lyria message:", message);

              if (mounted && onAudioChunk) {
                const audioData =
                  message.data ||
                  message.serverContent?.audioChunks?.[0] ||
                  message.audioChunk;

                if (audioData) {
                  console.log("Processing audio data, type:", typeof audioData);
                  const audioBuffer = decodeAudioData(audioData);
                  onAudioChunk(audioBuffer);
                } else {
                  console.log("No audio data in message");
                }
              }
            },
            onerror: (err) => {
              console.error("Lyria API error:", err);
              if (mounted) {
                setError(err);
                setIsConnected(false);
              }
            },
            onclose: () => {
              console.log("Lyria connection closed");
              if (mounted) {
                setIsConnected(false);
                setIsPlaying(false);
              }
            },
          },
        });

        await session.setMusicGenerationConfig({
          audioFormat: "pcm16",
          sampleRateHz,
          bpm,
        });

        if (mounted) {
          sessionRef.current = session;
          setIsConnected(true);
          setError(null);

          console.log("Lyria session created. Available methods:", {
            hasPlay: typeof session.play === "function",
            hasPause: typeof session.pause === "function",
            hasStop: typeof session.stop === "function",
            hasSetWeightedPrompts:
              typeof session.setWeightedPrompts === "function",
            sessionKeys: Object.keys(session),
          });
        }
      } catch (err) {
        console.error("Failed to initialize Lyria:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsConnected(false);
        }
      }
    };

    initLyria();

    return () => {
      mounted = false;
      if (sessionRef.current && typeof sessionRef.current.stop === "function") {
        try {
          const stopPromise = sessionRef.current.stop();
          if (stopPromise && typeof stopPromise.catch === "function") {
            stopPromise.catch(console.error);
          }
        } catch (err) {
          console.error("Error stopping Lyria session:", err);
        } finally {
          sessionRef.current = null;
        }
      }
    };
  }, [apiKey, enabled, sampleRateHz, bpm, onAudioChunk, decodeAudioData]);

  const updateWeightedPrompts = useCallback(
    async (prompts: WeightedPrompt[]) => {
      if (!sessionRef.current) {
        console.warn("Cannot update prompts: Lyria session not connected");
        return;
      }

      try {
        await sessionRef.current.setWeightedPrompts({
          weightedPrompts: prompts,
        });
      } catch (err) {
        console.error("Failed to update weighted prompts:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    []
  );

  const play = useCallback(async () => {
    if (!sessionRef.current) {
      console.warn("Cannot play: Lyria session not connected");
      return;
    }

    try {
      console.log("Calling Lyria session.play()...");
      const result = await sessionRef.current.play();
      console.log("Lyria play() result:", result);
      setIsPlaying(true);
      console.log("isPlaying set to true");
    } catch (err) {
      console.error("Failed to start playback:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const pause = useCallback(async () => {
    if (!sessionRef.current) {
      console.warn("Cannot pause: Lyria session not connected");
      return;
    }

    try {
      await sessionRef.current.pause();
      setIsPlaying(false);
    } catch (err) {
      console.error("Failed to pause playback:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const stop = useCallback(async () => {
    if (!sessionRef.current) {
      console.warn("Cannot stop: Lyria session not connected");
      return;
    }

    try {
      await sessionRef.current.stop();
      setIsPlaying(false);
    } catch (err) {
      console.error("Failed to stop playback:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const resetContext = useCallback(async () => {
    if (!sessionRef.current) {
      console.warn("Cannot reset: Lyria session not connected");
      return;
    }

    try {
      await sessionRef.current.reset_context();
    } catch (err) {
      console.error("Failed to reset context:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  return {
    isConnected,
    isPlaying,
    error,
    updateWeightedPrompts,
    play,
    pause,
    stop,
    resetContext,
  };
}
