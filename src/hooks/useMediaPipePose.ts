"use client";

/**
 * useMediaPipePose Hook
 *
 * Manages MediaPipe Pose Landmarker for real-time body pose detection.
 * Provides webcam access, pose detection, and flight control input.
 *
 * State machine:
 * - idle: Initial state, no model loaded
 * - loading: Model is being downloaded/initialized
 * - ready: Model loaded, waiting for activation
 * - active: Webcam running, pose detection active
 * - error: Something went wrong
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  type PoseFlightInput,
  type PoseFlightConfig,
  type PoseModelVariant,
  calculatePoseFlightInput,
  createPoseFlightConfig,
  resetPoseSmoothing,
  POSE_MODEL_URLS,
} from "@/lib/pose-to-flight";

export type PoseControllerState =
  | "idle"
  | "loading"
  | "ready"
  | "active"
  | "error";

export interface UseMediaPipePoseOptions {
  config?: Partial<PoseFlightConfig>;
  modelVariant?: PoseModelVariant;
  onFlightInput?: (input: PoseFlightInput) => void;
}

export interface UseMediaPipePoseReturn {
  state: PoseControllerState;
  error: string | null;
  landmarks: NormalizedLandmark[] | null;
  flightInput: PoseFlightInput | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fps: number;

  prime: () => Promise<void>;
  activate: () => Promise<void>;
  deactivate: () => void;

  config: PoseFlightConfig;
  modelVariant: PoseModelVariant;
  updateConfig: (updates: Partial<PoseFlightConfig>) => void;
  setModelVariant: (variant: PoseModelVariant) => void;
}

/**
 * Hook for MediaPipe Pose detection with flight control output
 * 
 * @param options - Options for the hook
 * @returns UseMediaPipePoseReturn
 * @param options.config - Configuration for the pose detection
 * @param options.modelVariant - Variant of the pose detection model
 * @param options.onFlightInput - Callback to receive flight input
 * @returns UseMediaPipePoseReturn
 */
export function useMediaPipePose(
  options?: UseMediaPipePoseOptions
): UseMediaPipePoseReturn {
  const [state, setState] = useState<PoseControllerState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [flightInput, setFlightInput] = useState<PoseFlightInput | null>(null);
  const [fps, setFps] = useState(0);
  const [config, setConfig] = useState<PoseFlightConfig>(() =>
    createPoseFlightConfig(options?.config)
  );
  const [modelVariant, setModelVariant] = useState<PoseModelVariant>(
    options?.modelVariant ?? "full"
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsIntervalRef = useRef<number | null>(null);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const onFlightInputRef = useRef(options?.onFlightInput);
  useEffect(() => {
    onFlightInputRef.current = options?.onFlightInput;
  }, [options?.onFlightInput]);

  const prime = useCallback(async () => {
    if (state === "loading" || state === "ready" || state === "active") {
      return;
    }

    setState("loading");
    setError(null);

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL_URLS[modelVariant],
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseLandmarkerRef.current = poseLandmarker;
      setState("ready");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load pose model";
      setError(message);
      setState("error");
      console.error("Failed to initialize pose landmarker:", err);
    }
  }, [state, modelVariant]);

  const activate = useCallback(async () => {
    if (state !== "ready") {
      console.warn("Cannot activate: model not ready");
      return;
    }

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState("active");
      resetPoseSmoothing();

      frameCountRef.current = 0;
      fpsIntervalRef.current = window.setInterval(() => {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
      }, 1000);

      const detectLoop = () => {
        if (!videoRef.current || !poseLandmarkerRef.current) {
          animationFrameRef.current = requestAnimationFrame(detectLoop);
          return;
        }

        const video = videoRef.current;
        const now = performance.now();

        if (video.readyState >= 2 && now - lastFrameTimeRef.current > 33) {
          lastFrameTimeRef.current = now;
          frameCountRef.current++;

          try {
            const result = poseLandmarkerRef.current.detectForVideo(
              video,
              now
            );

            if (result.landmarks && result.landmarks.length > 0) {
              const detectedLandmarks = result.landmarks[0];
              setLandmarks(detectedLandmarks);

              const input = calculatePoseFlightInput(
                detectedLandmarks,
                configRef.current
              );
              setFlightInput(input);
              onFlightInputRef.current?.(input);
            } else {
              setLandmarks(null);
              setFlightInput(null);
            }
          } catch (err) {
            console.error("Pose detection error:", err);
          }
        }

        animationFrameRef.current = requestAnimationFrame(detectLoop);
      };

      animationFrameRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access webcam";
      setError(message);
      setState("ready");
      console.error("Failed to activate pose detection:", err);
    }
  }, [state]);

  const deactivate = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setLandmarks(null);
    setFlightInput(null);
    setFps(0);
    resetPoseSmoothing();

    if (state === "active") {
      setState("ready");
    }
  }, [state]);

  const updateConfig = useCallback((updates: Partial<PoseFlightConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSetModelVariant = useCallback(
    (variant: PoseModelVariant) => {
      if (variant === modelVariant) return;

      if (state === "active") {
        deactivate();
      }

      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }

      setModelVariant(variant);
      setState("idle");
    },
    [modelVariant, state, deactivate]
  );

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []);

  return {
    state,
    error,
    landmarks,
    flightInput,
    videoRef,
    fps,

    prime,
    activate,
    deactivate,

    config,
    modelVariant,
    updateConfig,
    setModelVariant: handleSetModelVariant,
  };
}
