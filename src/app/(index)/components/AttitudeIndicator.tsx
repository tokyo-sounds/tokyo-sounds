"use client";

import { useRef, useEffect } from "react";

interface AttitudeIndicatorProps {
  pitch: number;
  roll: number;
  cameraY: number;
}

// Static SVG tick marks - generated once at module level
const ROLL_TICK_MARKS = Array.from({ length: 21 }, (_, i) => {
  const x = i * 5; // 0, 5, 10, ..., 100
  return (
    <line
      key={i}
      x1={x}
      y1="0"
      x2={x}
      y2="8"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className="text-muted text-shadow-sm text-shadow-black/50"
    />
  );
});

const PITCH_TICK_MARKS = Array.from({ length: 21 }, (_, i) => {
  const y = i * 5; // 0, 5, 10, ..., 100
  return (
    <line
      key={i}
      x1="0"
      y1={y}
      x2="8"
      y2={y}
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className="text-muted text-shadow-sm text-shadow-black/50"
    />
  );
});

// Smoothing factor for RAF interpolation (higher = faster response)
const SMOOTHING_FACTOR = 0.15; // ~15% per frame at 60fps ≈ smooth follow

export default function AttitudeIndicator({
  pitch,
  roll,
  cameraY,
}: AttitudeIndicatorProps) {
  // Refs for RAF interpolation
  const targetRollRef = useRef(roll);
  const targetPitchRef = useRef(pitch);
  const targetCameraYRef = useRef(cameraY);
  const currentRollRef = useRef(roll);
  const currentPitchRef = useRef(pitch);
  const currentCameraYRef = useRef(cameraY);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Refs for DOM elements that need direct style updates
  const wingsRef = useRef<HTMLDivElement>(null);
  const rollFillPositiveRef = useRef<HTMLDivElement>(null);
  const rollFillNegativeRef = useRef<HTMLDivElement>(null);
  const pitchFillPositiveRef = useRef<HTMLDivElement>(null);
  const pitchFillNegativeRef = useRef<HTMLDivElement>(null);
  const rollValueRef = useRef<HTMLHeadingElement>(null);
  const pitchValueRef = useRef<HTMLHeadingElement>(null);
  const cameraYValueRef = useRef<HTMLLabelElement>(null);

  // Update target values when props change
  useEffect(() => {
    targetRollRef.current = roll;
    targetPitchRef.current = pitch;
    targetCameraYRef.current = cameraY;
  }, [roll, pitch, cameraY]);

  // RAF interpolation loop
  useEffect(() => {
    const animate = (currentTime: number) => {
      const deltaTime = Math.min(
        (currentTime - lastFrameTimeRef.current) / 16.67,
        2
      ); // Cap at 2x normal frame time
      lastFrameTimeRef.current = currentTime;

      // Lerp current values toward targets
      const rollDiff = targetRollRef.current - currentRollRef.current;
      const pitchDiff = targetPitchRef.current - currentPitchRef.current;
      const cameraYDiff = targetCameraYRef.current - currentCameraYRef.current;

      // Exponential smoothing: alpha = 1 - exp(-k * dt)
      const alpha = 1 - Math.exp(-SMOOTHING_FACTOR * (deltaTime / 16.67));
      currentRollRef.current += rollDiff * alpha;
      currentPitchRef.current += pitchDiff * alpha;
      currentCameraYRef.current += cameraYDiff * alpha;

      const currentRoll = currentRollRef.current;
      const currentPitch = currentPitchRef.current;
      const currentCameraY = currentCameraYRef.current;

      // Update wings rotation via CSS variable
      if (wingsRef.current) {
        const rotation = -(currentRoll * 0.5);
        wingsRef.current.style.transform = `rotate(${rotation}deg)`;
      }

      // Update roll bar fills using transform (GPU-friendly)
      const rollPercent = Math.min(50, Math.abs(currentRoll / 90) * 50);
      const rollScale = rollPercent / 50;

      // Positive roll bar (extends left from center)
      if (rollFillPositiveRef.current) {
        if (currentRoll > 0) {
          rollFillPositiveRef.current.style.transform = `scaleX(${rollScale})`;
          rollFillPositiveRef.current.style.opacity = "1";
        } else {
          rollFillPositiveRef.current.style.transform = "scaleX(0)";
          rollFillPositiveRef.current.style.opacity = "0";
        }
      }

      // Negative roll bar (extends right from center)
      if (rollFillNegativeRef.current) {
        if (currentRoll < 0) {
          rollFillNegativeRef.current.style.transform = `scaleX(${rollScale})`;
          rollFillNegativeRef.current.style.opacity = "1";
        } else {
          rollFillNegativeRef.current.style.transform = "scaleX(0)";
          rollFillNegativeRef.current.style.opacity = "0";
        }
      }

      // Update pitch bar fills using transform (GPU-friendly)
      const pitchPercent = Math.min(50, Math.abs(currentPitch / 90) * 50);
      const pitchScale = pitchPercent / 50;

      // Positive pitch bar (extends up from center)
      if (pitchFillPositiveRef.current) {
        if (currentPitch > 0) {
          pitchFillPositiveRef.current.style.transform = `scaleY(${pitchScale})`;
          pitchFillPositiveRef.current.style.opacity = "1";
        } else {
          pitchFillPositiveRef.current.style.transform = "scaleY(0)";
          pitchFillPositiveRef.current.style.opacity = "0";
        }
      }

      // Negative pitch bar (extends down from center)
      if (pitchFillNegativeRef.current) {
        if (currentPitch < 0) {
          pitchFillNegativeRef.current.style.transform = `scaleY(${pitchScale})`;
          pitchFillNegativeRef.current.style.opacity = "1";
        } else {
          pitchFillNegativeRef.current.style.transform = "scaleY(0)";
          pitchFillNegativeRef.current.style.opacity = "0";
        }
      }

      // Update text values (only when changed significantly to reduce layout work)
      if (rollValueRef.current) {
        const roundedRoll = Math.round(currentRoll * 10) / 10;
        rollValueRef.current.textContent = `${roundedRoll.toFixed(1)}°`;
      }
      if (pitchValueRef.current) {
        const roundedPitch = Math.round(currentPitch * 10) / 10;
        pitchValueRef.current.textContent = `${roundedPitch.toFixed(1)}°`;
      }
      if (cameraYValueRef.current) {
        const roundedCameraY = Math.round(currentCameraY * 10) / 10;
        cameraYValueRef.current.textContent = `${roundedCameraY.toFixed(1)} m`;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
    lastFrameTimeRef.current = performance.now();

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-[90svw] max-w-xl h-[60svh]">
      {/* Background Circle */}
      <div className="relative size-48 md:size-60">
        {/* Flight attitude "wings" — rotate with roll */}
        <div className="relative size-48 md:size-60 rounded-full border contain-paint" />
        <div
          ref={wingsRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-between w-60 md:w-72 h-0 will-change-transform pointer-events-none"
          style={{
            transform: `rotate(${-roll}deg)`,
          }}
          aria-hidden="true"
        >
          <div className="h-0.5 w-3 md:w-5 bg-white/80 shadow-[0_0_10px_rgba(0,0,0,0.35)] rounded-full" />
          <div className="h-0.5 w-3 md:w-5 bg-white/80 shadow-[0_0_10px_rgba(0,0,0,0.35)] rounded-full" />
        </div>
      </div>
      {/* Roll Indicator */}
      <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-center gap-1">
        {/* Scale marks */}
        <svg
          className="w-full max-w-40 h-3"
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
        >
          {ROLL_TICK_MARKS}
        </svg>
        {/* Roll Indicator Bar */}
        <div
          className="w-full max-w-40 h-1 relative bg-muted/[0.4] rounded-full overflow-hidden"
          title="Roll"
        >
          {/* Positive roll bar (left side, extends left from center) */}
          <div
            ref={rollFillPositiveRef}
            className="absolute top-0 h-full bg-secondary/50 will-change-transform"
            style={{
              right: "50%",
              width: "50%",
              transformOrigin: "right center",
              transform: "scaleX(0)",
              opacity: "0",
            }}
          />
          {/* Negative roll bar (right side, extends right from center) */}
          <div
            ref={rollFillNegativeRef}
            className="absolute top-0 h-full bg-secondary/50 will-change-transform"
            style={{
              left: "50%",
              width: "50%",
              transformOrigin: "left center",
              transform: "scaleX(0)",
              opacity: "0",
            }}
          />
          <div className="absolute left-1/2 top-0 w-px h-full bg-white" />
        </div>
        {/* Roll Value */}
        <h3
          ref={rollValueRef}
          className="text-xs md:text-base text-muted text-center text-shadow-sm text-shadow-black/50 font-semibold font-mono tracking-wide"
        >
          {roll.toFixed(1)}°
        </h3>
      </div>

      {/* Pitch Indicator */}
      <div className="absolute top-0 bottom-0 right-0 flex items-center gap-2 w-26">
        {/* Scale marks */}
        <svg
          className="w-3 h-full max-h-40"
          viewBox="0 0 12 100"
          preserveAspectRatio="none"
        >
          {PITCH_TICK_MARKS}
        </svg>
        <div
          className="w-1 h-full max-h-40 relative bg-muted/[0.4] rounded-full overflow-hidden"
          title="Pitch"
        >
          {/* Positive pitch bar (bottom half, extends up from center) */}
          <div
            ref={pitchFillPositiveRef}
            className="absolute left-0 w-1 bg-secondary/50 will-change-transform"
            style={{
              bottom: "50%",
              height: "50%",
              transformOrigin: "center bottom",
              transform: "scaleY(0)",
              opacity: "0",
            }}
          />
          {/* Negative pitch bar (top half, extends down from center) */}
          <div
            ref={pitchFillNegativeRef}
            className="absolute left-0 w-1 bg-secondary/50 will-change-transform"
            style={{
              top: "50%",
              height: "50%",
              transformOrigin: "center top",
              transform: "scaleY(0)",
              opacity: "0",
            }}
          />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white" />
        </div>
        <h3
          ref={pitchValueRef}
          className="text-xs md:text-base text-muted text-center text-shadow-sm text-shadow-black/50 font-semibold font-mono tracking-wide"
        >
          {pitch.toFixed(1)}°
        </h3>
        <label
          ref={cameraYValueRef}
          className="absolute top-6 left-1/2 -translate-x-1/2 w-full text-xs md:text-sm text-muted text-shadow-sm text-shadow-black/50 font-mono"
        >
          {cameraY.toFixed(1)} m
        </label>
      </div>
    </div>
  );
}
