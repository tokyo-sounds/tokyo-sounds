"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface AmbientBackgroundAudioContextType {
  currentFileName: string | null;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  setCurrentFileName: (fileName: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
}

const AmbientBackgroundAudioContext =
  createContext<AmbientBackgroundAudioContextType | null>(null);

export function useAmbientBackgroundAudio() {
  const context = useContext(AmbientBackgroundAudioContext);
  if (!context) {
    throw new Error(
      "useAmbientBackgroundAudio must be used within AmbientBackgroundAudioProvider"
    );
  }
  return context;
}

export function AmbientBackgroundAudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <AmbientBackgroundAudioContext.Provider
      value={{
        currentFileName,
        isPlaying,
        play,
        pause,
        setCurrentFileName,
        setIsPlaying,
      }}
    >
      {children}
    </AmbientBackgroundAudioContext.Provider>
  );
}

