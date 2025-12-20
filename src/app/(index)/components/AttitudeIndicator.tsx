"use client";

import { useRef, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface AttitudeIndicatorProps {
  pitch: number;
  roll: number;
  cameraY: number;
  groundDistance: number | null;
  latitude?: number;
  longitude?: number;
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
  groundDistance,
  latitude,
  longitude,
}: AttitudeIndicatorProps) {
  // Refs for RAF interpolation
  const targetRollRef = useRef(roll);
  const targetPitchRef = useRef(pitch);
  const targetCameraYRef = useRef(cameraY);
  const targetLatitudeRef = useRef(latitude ?? 0);
  const targetLongitudeRef = useRef(longitude ?? 0);
  const currentRollRef = useRef(roll);
  const currentPitchRef = useRef(pitch);
  const currentCameraYRef = useRef(cameraY);
  const currentLatitudeRef = useRef(latitude ?? 0);
  const currentLongitudeRef = useRef(longitude ?? 0);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Refs for DOM elements that need direct style updates
  const wingsRef = useRef<HTMLDivElement>(null);
  const rollFillPositiveRef = useRef<HTMLDivElement>(null);
  const rollFillNegativeRef = useRef<HTMLDivElement>(null);
  const pitchFillPositiveRef = useRef<HTMLDivElement>(null);
  const pitchFillNegativeRef = useRef<HTMLDivElement>(null);
  const rollValueLeftRef = useRef<HTMLHeadingElement>(null);
  const rollValueRightRef = useRef<HTMLHeadingElement>(null);
  const pitchValueRef = useRef<HTMLHeadingElement>(null);
  const cameraYValueRef = useRef<HTMLSpanElement>(null);
  const coordsValueRef = useRef<HTMLHeadingElement>(null);
  const warningContainerRef = useRef<HTMLDivElement>(null);
  const pullUpWarningRef = useRef<HTMLDivElement>(null);

  // Ref for ground distance
  const groundDistanceRef = useRef<number | null>(groundDistance);
  groundDistanceRef.current = groundDistance;

  // Warning state with hysteresis
  const warningVisibleRef = useRef(false);
  const warningCooldownRef = useRef(0);
  const WARNING_SHOW_DELAY = 200; // ms
  const WARNING_HIDE_DELAY = 500; // ms

  // Warning thresholds
  const LOW_ALTITUDE_THRESHOLD = 100; // Fallback for sea-level altitude
  const LOW_GROUND_DISTANCE_THRESHOLD = 10; // Distance to actual ground/buildings

  // Update target values when props change
  useEffect(() => {
    targetRollRef.current = roll;
    targetPitchRef.current = pitch;
    targetCameraYRef.current = cameraY;
    if (latitude !== undefined) targetLatitudeRef.current = latitude;
    if (longitude !== undefined) targetLongitudeRef.current = longitude;
  }, [roll, pitch, cameraY, latitude, longitude]);

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
      const latDiff = targetLatitudeRef.current - currentLatitudeRef.current;
      const lngDiff = targetLongitudeRef.current - currentLongitudeRef.current;

      // Exponential smoothing: alpha = 1 - exp(-k * dt)
      const alpha = 1 - Math.exp(-SMOOTHING_FACTOR * (deltaTime / 16.67));
      currentRollRef.current += rollDiff * alpha;
      currentPitchRef.current += pitchDiff * alpha;
      currentCameraYRef.current += cameraYDiff * alpha;
      currentLatitudeRef.current += latDiff * alpha;
      currentLongitudeRef.current += lngDiff * alpha;

      const currentRoll = currentRollRef.current;
      const currentPitch = currentPitchRef.current;
      const currentCameraY = currentCameraYRef.current;
      const currentLat = currentLatitudeRef.current;
      const currentLng = currentLongitudeRef.current;

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
      if (rollValueLeftRef.current) {
        const roundedRoll = Math.round(currentRoll * 10) / 10;
        rollValueLeftRef.current.textContent =
          roundedRoll > 0 ? `${Math.abs(roundedRoll).toFixed(1)}°` : "";
      }
      if (rollValueRightRef.current) {
        const roundedRoll = Math.round(currentRoll * 10) / 10;
        rollValueRightRef.current.textContent =
          roundedRoll < 0 ? `${Math.abs(roundedRoll).toFixed(1)}°` : "";
      }
      if (pitchValueRef.current) {
        const roundedPitch = Math.round(currentPitch * 10) / 10;
        pitchValueRef.current.textContent = `${roundedPitch.toFixed(1)}°`;
      }
      if (cameraYValueRef.current) {
        const roundedCameraY = Math.round(currentCameraY * 10) / 10;
        cameraYValueRef.current.textContent = `${roundedCameraY.toFixed(1)} m`;
      }
      if (coordsValueRef.current) {
        coordsValueRef.current.textContent = `${currentLat.toFixed(
          4
        )}, ${currentLng.toFixed(4)}`;
      }

      // Update warning indicator based on ground distance (or altitude as fallback)
      if (warningContainerRef.current) {
        const currentGroundDistance = groundDistanceRef.current;
        const isDescending = currentPitch < 0;
        const frameDeltaMs = deltaTime * 16.67;

        let isLowAltitude = false;
        if (currentGroundDistance !== null) {
          isLowAltitude = currentGroundDistance < LOW_GROUND_DISTANCE_THRESHOLD;
        } else {
          isLowAltitude = currentCameraY < LOW_ALTITUDE_THRESHOLD;
        }

        // Hysteresis: require sustained condition before changing state
        if (isLowAltitude && !warningVisibleRef.current) {
          warningCooldownRef.current += frameDeltaMs;
          if (warningCooldownRef.current >= WARNING_SHOW_DELAY) {
            warningVisibleRef.current = true;
            warningCooldownRef.current = 0;
          }
        } else if (!isLowAltitude && warningVisibleRef.current) {
          warningCooldownRef.current += frameDeltaMs;
          if (warningCooldownRef.current >= WARNING_HIDE_DELAY) {
            warningVisibleRef.current = false;
            warningCooldownRef.current = 0;
          }
        } else {
          warningCooldownRef.current = 0;
        }

        if (warningVisibleRef.current) {
          warningContainerRef.current.style.opacity = "1";
          // Red warning when descending, yellow when level or climbing
          if (isDescending) {
            warningContainerRef.current.dataset.severity = "critical";
          } else {
            warningContainerRef.current.dataset.severity = "warning";
          }
        } else {
          warningContainerRef.current.style.opacity = "0";
        }

        if (pullUpWarningRef.current) {
          pullUpWarningRef.current.style.opacity = warningVisibleRef.current
            ? "1"
            : "0";
        }
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

      {/* PULL UP Warning Box */}
      <div
        ref={pullUpWarningRef}
        className="absolute left-1/2 -translate-x-1/2 bottom-[-3rem] md:bottom-[-4rem] flex items-center gap-2 px-3 py-1.5 backdrop-blur-md bg-black/30 rounded-md border-2 border-red-500 transition-opacity duration-200"
        style={{ opacity: 0 }}
      >
        <AlertTriangle className="size-4 md:size-5 text-red-500" />
        <span className="text-red-500 font-bold text-sm md:text-base tracking-wider">
          プールアップ
        </span>
        <AlertTriangle className="size-4 md:size-5 text-red-500" />
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
        <div className="w-full flex items-center justify-center gap-2">
          {/* Left roll value (shown when tilting left, i.e., roll < 0) */}
          <h3
            ref={rollValueLeftRef}
            className="w-12 text-xs md:text-base text-muted text-left text-shadow-sm text-shadow-black/50 font-semibold font-mono tracking-wide"
          >
            {roll > 0 ? Math.abs(roll).toFixed(1) + "°" : ""}
          </h3>
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
          {/* Right roll value (shown when tilting right, i.e., roll > 0) */}
          <h3
            ref={rollValueRightRef}
            className="w-12 text-xs md:text-base text-muted text-right text-shadow-sm text-shadow-black/50 font-semibold font-mono tracking-wide"
          >
            {roll < 0 ? Math.abs(roll).toFixed(1) + "°" : ""}
          </h3>
        </div>
        {/* GPS Value */}
        <h3
          ref={coordsValueRef}
          className="text-[8pt] text-muted text-center text-shadow-sm text-shadow-black/50 font-mono tracking-wide"
        >
          {latitude?.toFixed(4) ?? "0.0"}, {longitude?.toFixed(4) ?? "0.0"}
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
        <label className="absolute top-6 left-1/2 -translate-x-1/2 w-full text-xs md:text-sm text-muted text-shadow-sm text-shadow-black/50 font-mono flex items-center justify-center gap-1">
          <span ref={cameraYValueRef}>{cameraY.toFixed(1)} m</span>
          {/* Low altitude warning indicator */}
          <span
            ref={warningContainerRef}
            className="transition-opacity duration-200 data-[severity=critical]:text-red-500 data-[severity=warning]:text-amber-500"
            style={{
              opacity: (
                groundDistance !== null ? groundDistance < 10 : cameraY < 100
              )
                ? 1
                : 0,
            }}
            data-severity={
              (groundDistance !== null ? groundDistance < 10 : cameraY < 100)
                ? pitch < 0
                  ? "critical"
                  : "warning"
                : undefined
            }
          >
            <AlertTriangle className="size-3 md:size-4" />
          </span>
        </label>
      </div>
    </div>
  );
}
