"use client";

/**
 * BodyControlPreview Component
 *
 * Displays webcam feed with pose skeleton overlay for body control visualization.
 * Shows detected landmarks, connections, and flight control values.
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { POSE_CONNECTIONS, type PoseFlightInput } from "@/lib/pose-to-flight";
import { cn } from "@/lib/utils";

interface BodyControlPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: NormalizedLandmark[] | null;
  flightInput: PoseFlightInput | null;
  fps?: number;
  className?: string;
  showControls?: boolean;
  isCalibrating?: boolean;
  calibrationProgress?: number;
}

/**
 * Get color based on landmark visibility/confidence
 * @param visibility - Visibility of the landmark
 * @returns Color string
 */
function getConfidenceColor(visibility: number): string {
  if (visibility > 0.8) return "#22c55e"; // green-500
  if (visibility > 0.5) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

/**
 * Component that renders webcam preview with pose skeleton overlay
 * @param videoRef - Ref to the video element
 * @param landmarks - Array of landmarks
 * @param flightInput - Flight input
 * @param fps - Frames per second
 * @param className - Class name
 * @param showControls - Whether to show controls
 * @returns BodyControlPreview component
 */
export default function BodyControlPreview({
  videoRef,
  landmarks,
  flightInput,
  fps = 0,
  className,
  showControls = true,
  isCalibrating = false,
  calibrationProgress = 0,
}: BodyControlPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mirrorStyle = useMemo(() => ({ transform: "scaleX(-1)" }), []);
  
  const horizonStyle = useMemo(() => ({
    transform: `rotate(${(flightInput?.bank ?? 0) * 30}deg)`,
  }), [flightInput?.bank]);
  
  const pitchBarStyle = useMemo(() => {
    const pitch = flightInput?.pitch ?? 0;
    return {
      height: `${Math.abs(pitch) * 50}%`,
      top: pitch >= 0 ? `${50 - Math.abs(pitch) * 50}%` : '50%',
    };
  }, [flightInput?.pitch]);
  
  const calibrationBarStyle = useMemo(() => ({
    width: `${calibrationProgress * 100}%`,
  }), [calibrationProgress]);

  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    if (videoRef) {
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = element;
    }
  }, [videoRef]);

  const drawPose = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    ctx.lineWidth = 2;
    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (!start || !end) continue;

      const startVis = start.visibility ?? 1;
      const endVis = end.visibility ?? 1;
      const avgVis = (startVis + endVis) / 2;

      if (avgVis < 0.3) continue;

      ctx.strokeStyle = getConfidenceColor(avgVis);
      ctx.globalAlpha = Math.max(0.3, avgVis);
      ctx.beginPath();
      ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
      ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];
      const visibility = landmark.visibility ?? 1;

      if (visibility < 0.3) continue;

      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      ctx.fillStyle = getConfidenceColor(visibility);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [landmarks, videoRef]);

  useEffect(() => {
    drawPose();
  }, [drawPose]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <video
        ref={setVideoRef}
        className="w-full h-auto rounded-md bg-neutral-900"
        playsInline
        muted
        style={mirrorStyle}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={mirrorStyle}
      />

      {flightInput && !isCalibrating && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="relative w-3/4 h-1"
            style={horizonStyle}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-400/80 to-transparent rounded-full" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-2 border-cyan-400 rounded-full bg-transparent" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 h-24 w-1 bg-neutral-700/50 rounded-full">
            <div
              className="absolute left-0 w-full bg-blue-400/80 rounded-full transition-all duration-75"
              style={pitchBarStyle}
            />
            <div className="absolute left-0 w-full h-0.5 bg-neutral-400/50 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {isCalibrating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
          <div className="text-center text-white">
            <div className="text-sm font-medium mb-2">Calibrating...</div>
            <div className="w-32 h-2 bg-neutral-700 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-cyan-400 transition-all duration-100"
                style={calibrationBarStyle}
              />
            </div>
            <div className="text-xs text-white/60 mt-2">Hold still in neutral position</div>
          </div>
        </div>
      )}

      {showControls && flightInput && (
        <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded-md p-2 text-xs font-mono text-white">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1">
              <div className="text-muted-foreground text-[10px] mb-0.5">
                PITCH
              </div>
              <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{
                    width: `${Math.abs(flightInput.pitch) * 50}%`,
                    marginLeft:
                      flightInput.pitch < 0
                        ? `${50 - Math.abs(flightInput.pitch) * 50}%`
                        : "50%",
                  }}
                />
              </div>
              <div className="text-[10px] text-center mt-0.5">
                {flightInput.pitch > 0 ? "UP" : flightInput.pitch < 0 ? "DOWN" : "-"}
              </div>
            </div>

            <div className="flex-1">
              <div className="text-muted-foreground text-[10px] mb-0.5">
                BANK
              </div>
              <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{
                    width: `${Math.abs(flightInput.bank) * 50}%`,
                    marginLeft:
                      flightInput.bank < 0
                        ? `${50 - Math.abs(flightInput.bank) * 50}%`
                        : "50%",
                  }}
                />
              </div>
              <div className="text-[10px] text-center mt-0.5">
                {flightInput.bank < 0 ? "LEFT" : flightInput.bank > 0 ? "RIGHT" : "-"}
              </div>
            </div>

            <div className="w-12 text-center">
              <div className="text-muted-foreground text-[10px] mb-0.5">
                BOOST
              </div>
              <div
                className={cn(
                  "h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors",
                  flightInput.boost
                    ? "bg-orange-500 text-white animate-pulse"
                    : "bg-neutral-700 text-neutral-400"
                )}
              >
                {flightInput.boost ? "ON" : "OFF"}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>
              Confidence: {(flightInput.confidence * 100).toFixed(0)}%
            </span>
            <span>
              {flightInput.raw.handsCloseToTorso && flightInput.raw.handsAtChestLevel ? "BOOST READY" : ""} 
              {flightInput.raw.boostAmount > 0 ? ` (${(flightInput.raw.boostAmount * 100).toFixed(0)}%)` : ""}
            </span>
            <span>{fps} FPS</span>
          </div>
        </div>
      )}

      {!landmarks && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
          <div className="text-white/60 text-sm text-center px-4">
            <div className="mb-1">No pose detected</div>
            <div className="text-xs text-white/40">
              Stand back so your body is visible
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
