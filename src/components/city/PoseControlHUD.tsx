"use client";

/**
 * PoseControlHUD Component
 *
 * Floating HUD overlay in the bottom-right corner showing:
 * - Webcam feed with pose skeleton
 * - Flight control indicators
 * - Stop button to deactivate body control
 * 
 * Note: This component should be rendered when poseState is "ready" OR "active"
 * so the video element exists before activation. Use isVisible to control display.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { type PoseFlightInput } from "@/lib/pose-to-flight";
import BodyControlPreview from "./BodyControlPreview";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PoseControlHUDProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: NormalizedLandmark[] | null;
  flightInput: PoseFlightInput | null;
  fps: number;
  onDeactivate: () => void;
  isVisible?: boolean;
}

/**
 * Floating HUD for body control preview
 * Positioned in the bottom-right corner of the screen
 * 
 * @param videoRef - Ref to the video element
 * @param landmarks - Array of landmarks
 * @param flightInput - Flight input
 * @param fps - Frames per second
 * @param onDeactivate - Callback to deactivate body control
 * @param isVisible - Whether the HUD is visible
 * @returns PoseControlHUD component
 */
export default function PoseControlHUD({
  videoRef,
  landmarks,
  flightInput,
  fps,
  onDeactivate,
  isVisible = true,
}: PoseControlHUDProps) {
  return (
    <div 
      className={cn(
        "absolute bottom-4 right-4 z-50 w-64 pointer-events-auto transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
        <Button
          onClick={onDeactivate}
          size="icon"
          variant="ghost"
          className="absolute top-1 right-1 z-10 size-6 rounded-full bg-black/50 hover:bg-destructive/80 text-white/70 hover:text-white"
          aria-label="Stop body control"
        >
          <X className="size-3" />
        </Button>

        <BodyControlPreview
          videoRef={videoRef}
          landmarks={landmarks}
          flightInput={flightInput}
          fps={fps}
          showControls={true}
          className="rounded-lg"
        />
      </div>
    </div>
  );
}
