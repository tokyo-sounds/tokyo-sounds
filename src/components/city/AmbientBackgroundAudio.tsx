"use client";

/**
 * AmbientBackgroundAudio Component
 * Lightweight background ambient audio system
 * - Random infinite playback of audio files from /audio/ambient-sounds/ directory
 * - Volume adjusts linearly based on camera height (CameraY)
 * - Lazy loading for optimal initial load performance
 */

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useAmbientBackgroundAudio } from "./AmbientBackgroundAudioContext";

interface AmbientBackgroundAudioProps {
  cameraY: number;
  enabled?: boolean;
  minHeight?: number; // Minimum height for maximum volume (default: 0)
  maxHeight?: number; // Maximum height for minimum volume/silence (default: 1000)
  baseVolume?: number; // Base volume multiplier (0-1, default: 0.7)
  masterVolume?: number; // Master volume control (0-1, default: 1.0)
}

const VOLUME_UPDATE_THROTTLE_MS = 100; // Throttle volume updates to avoid excessive updates
const AMBIENT_SOUNDS_DIR = "/audio/ambient-sounds/";

/**
 * Get random audio file from the list
 */
function getRandomAudioFile(files: readonly string[]): string {
  if (files.length === 0) return "";
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
  baseVolume = 0.7,
  masterVolume = 1.0,
}: AmbientBackgroundAudioProps) {
  const {
    setCurrentFileName,
    setIsPlaying: setContextIsPlaying,
    isPlaying: contextIsPlaying,
  } = useAmbientBackgroundAudio();
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
  const masterVolumeRef = useRef(masterVolume);
  const cameraYRef = useRef(cameraY);
  const userInteractedRef = useRef(false);
  const isSwitchingRef = useRef(false); // Prevent concurrent calls to playNextAudio
  const [audioFiles, setAudioFiles] = useState<readonly string[]>([]);
  const audioFilesRef = useRef<readonly string[]>([]);

  // Update refs when props change
  useEffect(() => {
    enabledRef.current = enabled;
    minHeightRef.current = minHeight;
    maxHeightRef.current = maxHeight;
    baseVolumeRef.current = baseVolume;
    masterVolumeRef.current = masterVolume;
    cameraYRef.current = cameraY;
  }, [enabled, minHeight, maxHeight, baseVolume, masterVolume, cameraY]);

  // Load audio files from API
  useEffect(() => {
    const loadAudioFiles = async () => {
      try {
        const response = await fetch("/api/audio-files");
        if (!response.ok) {
          console.warn("[AmbientBackgroundAudio] Failed to fetch audio files");
          return;
        }
        const data = await response.json();
        if (data.files && Array.isArray(data.files) && data.files.length > 0) {
          setAudioFiles(data.files);
          audioFilesRef.current = data.files;
          console.log(
            `[AmbientBackgroundAudio] Loaded ${data.files.length} audio files from ${AMBIENT_SOUNDS_DIR}`
          );
        } else {
          console.warn(
            `[AmbientBackgroundAudio] No audio files found in ${AMBIENT_SOUNDS_DIR}`
          );
          // Set empty array to prevent retries
          setAudioFiles([]);
          audioFilesRef.current = [];
        }
      } catch (error) {
        console.error(
          "[AmbientBackgroundAudio] Error loading audio files:",
          error
        );
        // Set empty array on error
        setAudioFiles([]);
        audioFilesRef.current = [];
      }
    };

    loadAudioFiles();
  }, []);

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
    const files = audioFilesRef.current;
    if (!enabledRef.current || files.length === 0) {
      if (files.length === 0) {
        console.log(
          "[AmbientBackgroundAudio] No audio files available, waiting..."
        );
      }
      return;
    }

    // Prevent concurrent calls
    if (isSwitchingRef.current) {
      console.log("[AmbientBackgroundAudio] Already switching, skipping");
      return;
    }
    isSwitchingRef.current = true;

    // Get random file (avoid same file if possible)
    let nextFile = getRandomAudioFile(files);
    if (files.length > 1 && nextFile === currentFileRef.current) {
      // If same file, try to get a different one
      const otherFiles = files.filter((f) => f !== currentFileRef.current);
      if (otherFiles.length > 0) {
        nextFile = otherFiles[Math.floor(Math.random() * otherFiles.length)];
      }
    }

    currentFileRef.current = nextFile;
    // Extract filename from path for display
    const fileName = nextFile.split("/").pop() || nextFile;
    setCurrentFileName(fileName);

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

    // Set initial volume using current cameraY from ref and master volume
    const volume = calculateVolume(
      cameraYRef.current,
      minHeightRef.current,
      maxHeightRef.current,
      baseVolumeRef.current
    );
    const finalVolume = volume * masterVolumeRef.current;
    audio.volume = finalVolume;
    console.log(`[AmbientBackgroundAudio] Initializing audio volume to: ${finalVolume} (height: ${cameraYRef.current}, base: ${volume}, master: ${masterVolumeRef.current})`);
    lastVolumeRef.current = finalVolume;

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
      setContextIsPlaying(false);
      if (enabledRef.current) {
        // Small delay to ensure cleanup
        setTimeout(() => {
          playNextAudio();
        }, 100);
      }
    };

    // Preload next audio when current is 80% complete
    audio.ontimeupdate = () => {
      const files = audioFilesRef.current;
      if (
        audio.duration &&
        audio.currentTime / audio.duration > 0.8 &&
        !nextAudioRef.current &&
        files.length > 0
      ) {
        const nextFile = getRandomAudioFile(files);
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
        setContextIsPlaying(true);
        console.log(`[AmbientBackgroundAudio] Started playing: ${nextFile}`);
      })
      .catch((err) => {
        console.error(
          `[AmbientBackgroundAudio] Failed to play ${nextFile}:`,
          err
        );
        isSwitchingRef.current = false;
        isPlayingRef.current = false;
        setContextIsPlaying(false);
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
  }, [cleanupAudio]);

  // Handle play/pause from context
  useEffect(() => {
    if (!audioRef.current) return;

    if (contextIsPlaying && !isPlayingRef.current) {
      // User wants to play
      audioRef.current
        .play()
        .then(() => {
          isPlayingRef.current = true;
        })
        .catch((err) => {
          console.error("[AmbientBackgroundAudio] Failed to play:", err);
          setContextIsPlaying(false);
        });
    } else if (!contextIsPlaying && isPlayingRef.current) {
      // User wants to pause
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  }, [contextIsPlaying, setContextIsPlaying]);

  // Try to start playback when files are loaded and conditions are met
  useEffect(() => {
    if (audioFiles.length === 0) return; // Wait for files to load

    console.log(
      `[AmbientBackgroundAudio] Files state updated: ${audioFiles.length} files, enabled: ${enabledRef.current}, interacted: ${userInteractedRef.current}, playing: ${isPlayingRef.current}, switching: ${isSwitchingRef.current}`
    );

    if (
      enabledRef.current &&
      audioFiles.length > 0 &&
      userInteractedRef.current &&
      !isPlayingRef.current &&
      !isSwitchingRef.current
    ) {
      console.log(
        `[AmbientBackgroundAudio] All conditions met, starting playback with ${audioFiles.length} files`
      );
      playNextAudio();
    } else {
      console.log(
        `[AmbientBackgroundAudio] Conditions not met - enabled: ${enabledRef.current}, files: ${audioFiles.length}, interacted: ${userInteractedRef.current}, playing: ${isPlayingRef.current}, switching: ${isSwitchingRef.current}`
      );
    }
  }, [audioFiles, playNextAudio]);

  // Handle user interaction to unlock audio playback
  useEffect(() => {
    if (userInteractedRef.current) return;

    const handleInteraction = () => {
      userInteractedRef.current = true;
      console.log(
        "[AmbientBackgroundAudio] User interaction detected, attempting to play audio"
      );
      // Try to play if enabled and not already playing
      const files = audioFilesRef.current;
      if (
        enabledRef.current &&
        !isPlayingRef.current &&
        !isSwitchingRef.current &&
        files.length > 0
      ) {
        playNextAudio();
      } else {
        console.log(
          `[AmbientBackgroundAudio] Skipping playback - enabled: ${enabledRef.current}, playing: ${isPlayingRef.current}, switching: ${isSwitchingRef.current}, files: ${files.length}`
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
  }, [playNextAudio]);

  /**
   * Update volume with throttling - including master volume changes
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
        // Apply master volume as well
        const finalVolume = volume * masterVolumeRef.current;

        // Only update if volume changed significantly (avoid unnecessary updates)
        if (Math.abs(finalVolume - lastVolumeRef.current) > 0.01) {
          audioRef.current.volume = finalVolume;
          console.log(`[AmbientBackgroundAudio] Setting volume to: ${finalVolume} (height: ${cameraYRef.current}, master: ${masterVolumeRef.current})`);
          lastVolumeRef.current = finalVolume;
        }
      }
      volumeUpdateTimeoutRef.current = null;
    }, VOLUME_UPDATE_THROTTLE_MS);
  }, []); // Reset to empty array since we're using refs that dynamically update

  // Effect to handle master volume changes specifically
  useEffect(() => {
    // Update the ref to track the current master volume
    masterVolumeRef.current = masterVolume;

    // Update the current audio volume if it exists
    if (audioRef.current) {
      const heightBasedVolume = calculateVolume(
        cameraYRef.current,
        minHeightRef.current,
        maxHeightRef.current,
        baseVolumeRef.current
      );
      const finalVolume = heightBasedVolume * masterVolume;

      const previousVolume = audioRef.current.volume;
      audioRef.current.volume = finalVolume;
      lastVolumeRef.current = finalVolume;
    }
  }, [masterVolume]);

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
    const files = audioFilesRef.current;
    if (
      !isPlayingRef.current &&
      !isSwitchingRef.current &&
      files.length > 0 &&
      userInteractedRef.current
    ) {
      console.log("[AmbientBackgroundAudio] Enabled, starting playback");
      playNextAudio();
    } else if (!userInteractedRef.current) {
      console.log(
        "[AmbientBackgroundAudio] Waiting for user interaction to start playback"
      );
    } else if (files.length === 0) {
      console.log(
        "[AmbientBackgroundAudio] Waiting for audio files to load..."
      );
    }

    return () => {
      // Cleanup on unmount or disable
      cleanupAudio(audioRef.current);
      cleanupAudio(nextAudioRef.current);
      nextAudioRef.current = null;
    };
  }, [enabled, playNextAudio, cleanupAudio]);

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
