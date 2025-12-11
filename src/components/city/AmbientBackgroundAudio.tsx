"use client";

/**
 * AmbientBackgroundAudio Component
 * Lightweight background ambient audio system
 * - Random infinite playback of audio files from /audio root directory
 * - Volume adjusts linearly based on camera height (CameraY)
 * - Lazy loading for optimal initial load performance
 */

import { useRef, useEffect, useMemo, useCallback } from "react";

interface AmbientBackgroundAudioProps {
  cameraY: number;
  enabled?: boolean;
  minHeight?: number; // Minimum height for maximum volume (default: 0)
  maxHeight?: number; // Maximum height for minimum volume/silence (default: 1000)
  baseVolume?: number; // Base volume multiplier (0-1, default: 0.5)
}

// Known audio files in /audio root directory
// Only root directory files, not subdirectories
const AUDIO_FILES: readonly string[] = ["/audio/tokyo-street.mp3"];

const VOLUME_UPDATE_THROTTLE_MS = 100; // Throttle volume updates to avoid excessive updates

/**
 * Get random audio file from the list
 */
function getRandomAudioFile(): string {
  const files = AUDIO_FILES;
  return files[Math.floor(Math.random() * files.length)];
}

/**
 * Calculate volume based on camera height using linear decay
 */
function calculateVolume(
  cameraY: number,
  minHeight: number,
  maxHeight: number,
  baseVolume: number
): number {
  if (cameraY <= minHeight) {
    return baseVolume; // Maximum volume at or below minHeight
  }
  if (cameraY >= maxHeight) {
    return 0; // Silent at or above maxHeight
  }
  // Linear interpolation: volume decreases as height increases
  const normalizedHeight = (cameraY - minHeight) / (maxHeight - minHeight);
  const volume = baseVolume * (1 - normalizedHeight);
  return Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
}

export function AmbientBackgroundAudio({
  cameraY,
  enabled = true,
  minHeight = 0,
  maxHeight = 1000,
  baseVolume = 0.5,
}: AmbientBackgroundAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const currentFileRef = useRef<string | null>(null);
  const volumeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVolumeRef = useRef<number>(0);
  const enabledRef = useRef(enabled);
  const minHeightRef = useRef(minHeight);
  const maxHeightRef = useRef(maxHeight);
  const baseVolumeRef = useRef(baseVolume);
  const cameraYRef = useRef(cameraY);
  const userInteractedRef = useRef(false);
  const isSwitchingRef = useRef(false); // Prevent concurrent calls to playNextAudio

  // Update refs when props change
  useEffect(() => {
    enabledRef.current = enabled;
    minHeightRef.current = minHeight;
    maxHeightRef.current = maxHeight;
    baseVolumeRef.current = baseVolume;
    cameraYRef.current = cameraY;
  }, [enabled, minHeight, maxHeight, baseVolume, cameraY]);

  // Memoize audio file list
  const audioFiles = useMemo(() => AUDIO_FILES, []);

  /**
   * Clean up audio element and remove event handlers
   */
  const cleanupAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    // Remove all event listeners by cloning the element
    audio.pause();
    audio.src = "";
    audio.load();
    // Clear event handlers
    audio.onerror = null;
    audio.onended = null;
    audio.ontimeupdate = null;
  }, []);

  /**
   * Load and play next random audio file
   */
  const playNextAudio = useCallback(() => {
    if (!enabledRef.current || audioFiles.length === 0) return;

    // Prevent concurrent calls
    if (isSwitchingRef.current) {
      console.log("[AmbientBackgroundAudio] Already switching, skipping");
      return;
    }
    isSwitchingRef.current = true;

    // Get random file (avoid same file if possible)
    let nextFile = getRandomAudioFile();
    if (audioFiles.length > 1 && nextFile === currentFileRef.current) {
      // If same file, try to get a different one
      const otherFiles = audioFiles.filter((f) => f !== currentFileRef.current);
      if (otherFiles.length > 0) {
        nextFile = otherFiles[Math.floor(Math.random() * otherFiles.length)];
      }
    }

    currentFileRef.current = nextFile;

    // Clean up current audio before switching
    const oldAudio = audioRef.current;
    cleanupAudio(oldAudio);

    // If we have a preloaded next audio, use it
    if (nextAudioRef.current) {
      audioRef.current = nextAudioRef.current;
      nextAudioRef.current = null;
    } else {
      // Create new audio element
      audioRef.current = new Audio(nextFile);
    }

    const audio = audioRef.current;
    if (!audio) {
      isSwitchingRef.current = false;
      return;
    }

    // Set initial volume using current cameraY from ref
    const volume = calculateVolume(
      cameraYRef.current,
      minHeightRef.current,
      maxHeightRef.current,
      baseVolumeRef.current
    );
    audio.volume = volume;
    lastVolumeRef.current = volume;

    // Handle errors
    audio.onerror = (e) => {
      console.error(`[AmbientBackgroundAudio] Failed to load ${nextFile}:`, e);
      isSwitchingRef.current = false;
      isPlayingRef.current = false;
      // Try next file after a short delay
      setTimeout(() => {
        if (enabledRef.current) playNextAudio();
      }, 1000);
    };

    // When current audio ends, play next
    audio.onended = () => {
      console.log(`[AmbientBackgroundAudio] Audio ended: ${nextFile}`);
      isSwitchingRef.current = false;
      isPlayingRef.current = false;
      if (enabledRef.current) {
        // Small delay to ensure cleanup
        setTimeout(() => {
          playNextAudio();
        }, 100);
      }
    };

    // Preload next audio when current is 80% complete
    audio.ontimeupdate = () => {
      if (
        audio.duration &&
        audio.currentTime / audio.duration > 0.8 &&
        !nextAudioRef.current
      ) {
        const nextFile = getRandomAudioFile();
        const nextAudio = new Audio(nextFile);
        nextAudio.preload = "auto";
        nextAudioRef.current = nextAudio;
        console.log(`[AmbientBackgroundAudio] Preloaded next: ${nextFile}`);
      }
    };

    // Start playing
    audio
      .play()
      .then(() => {
        isPlayingRef.current = true;
        isSwitchingRef.current = false;
        console.log(`[AmbientBackgroundAudio] Started playing: ${nextFile}`);
      })
      .catch((err) => {
        console.error(
          `[AmbientBackgroundAudio] Failed to play ${nextFile}:`,
          err
        );
        isSwitchingRef.current = false;
        isPlayingRef.current = false;
        // If autoplay was blocked, wait for user interaction
        if (
          err.name === "NotAllowedError" ||
          err.name === "NotSupportedError"
        ) {
          console.log(
            "[AmbientBackgroundAudio] Autoplay blocked, waiting for user interaction"
          );
        } else {
          // For other errors, try next file after a short delay
          setTimeout(() => {
            if (enabledRef.current) playNextAudio();
          }, 1000);
        }
      });
  }, [audioFiles, cleanupAudio]);

  // Handle user interaction to unlock audio playback
  useEffect(() => {
    if (userInteractedRef.current) return;

    const handleInteraction = () => {
      userInteractedRef.current = true;
      console.log(
        "[AmbientBackgroundAudio] User interaction detected, attempting to play audio"
      );
      // Try to play if enabled and not already playing
      if (
        enabledRef.current &&
        !isPlayingRef.current &&
        audioFiles.length > 0
      ) {
        playNextAudio();
      } else {
        console.log(
          `[AmbientBackgroundAudio] Skipping playback - enabled: ${enabledRef.current}, playing: ${isPlayingRef.current}, files: ${audioFiles.length}`
        );
      }
      // Remove listeners after first interaction
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [audioFiles.length, playNextAudio]);

  /**
   * Update volume with throttling
   */
  const updateVolume = useCallback(() => {
    if (volumeUpdateTimeoutRef.current) {
      clearTimeout(volumeUpdateTimeoutRef.current);
    }

    volumeUpdateTimeoutRef.current = setTimeout(() => {
      if (audioRef.current) {
        const volume = calculateVolume(
          cameraYRef.current,
          minHeightRef.current,
          maxHeightRef.current,
          baseVolumeRef.current
        );
        // Only update if volume changed significantly (avoid unnecessary updates)
        if (Math.abs(volume - lastVolumeRef.current) > 0.01) {
          audioRef.current.volume = volume;
          lastVolumeRef.current = volume;
        }
      }
      volumeUpdateTimeoutRef.current = null;
    }, VOLUME_UPDATE_THROTTLE_MS);
  }, []);

  // Initialize audio when enabled
  useEffect(() => {
    if (!enabled) {
      // Stop and cleanup
      cleanupAudio(audioRef.current);
      cleanupAudio(nextAudioRef.current);
      nextAudioRef.current = null;
      isPlayingRef.current = false;
      isSwitchingRef.current = false;
      return;
    }

    // Start playing if not already playing and user has interacted
    if (
      !isPlayingRef.current &&
      !isSwitchingRef.current &&
      audioFiles.length > 0 &&
      userInteractedRef.current
    ) {
      console.log("[AmbientBackgroundAudio] Enabled, starting playback");
      playNextAudio();
    } else if (!userInteractedRef.current) {
      console.log(
        "[AmbientBackgroundAudio] Waiting for user interaction to start playback"
      );
    }

    return () => {
      // Cleanup on unmount or disable
      cleanupAudio(audioRef.current);
      cleanupAudio(nextAudioRef.current);
      nextAudioRef.current = null;
    };
  }, [enabled, audioFiles.length, playNextAudio, cleanupAudio]);

  // Update volume when cameraY changes
  useEffect(() => {
    cameraYRef.current = cameraY;
    if (!enabled || !audioRef.current) return;
    updateVolume();
  }, [cameraY, enabled, updateVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (volumeUpdateTimeoutRef.current) {
        clearTimeout(volumeUpdateTimeoutRef.current);
      }
      cleanupAudio(audioRef.current);
      cleanupAudio(nextAudioRef.current);
      nextAudioRef.current = null;
    };
  }, [cleanupAudio]);

  // This component doesn't render anything
  return null;
}
