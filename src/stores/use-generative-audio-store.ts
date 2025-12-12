/**
 * Generative Audio Store
 * Manages state for Lyria generative audio feature
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GenerativeAudioState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;

  apiKey: string;
  setApiKey: (apiKey: string) => void;

  volume: number;
  setVolume: (volume: number) => void;

  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
}

const getDefaultApiKey = (): string => {
  // API key is now passed from server component via props
  return "";
};

export const useGenerativeAudioStore = create<GenerativeAudioState>()(
  persist(
    (set, get) => ({
      enabled: false,
      apiKey: getDefaultApiKey(),
      volume: 0.5,
      showDebugInfo: false,

      setEnabled: (enabled) => set({ enabled }),
      setApiKey: (apiKey) => set({ apiKey }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setShowDebugInfo: (show) => set({ showDebugInfo: show }),
    }),
    {
      name: "generative-audio-storage",
      partialize: (state) => ({
        apiKey: state.apiKey,
        volume: state.volume,
        enabled: state.enabled,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        apiKey:
          persistedState?.apiKey || getDefaultApiKey() || currentState.apiKey,
      }),
    }
  )
);
