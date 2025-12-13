"use client";

import { Button } from "@/components/ui/button";
import { memo, useMemo, useEffect, useRef } from "react";

/** CompassBar
 *
 * Compass bar at top of viewport
 * @param heading - Heading
 * @param pitch - Pitch
 * @param roll - Roll
 * @returns null
 */
interface CompassBarProps {
  heading: number;
  pitch: number;
  roll: number;
  isGyroActive?: boolean;
  isGyroEnabled?: boolean;
  isGyroAvailable?: boolean;
  isMobile?: boolean;
  onRecalibrateGyro?: () => void;
}

// Static data moved outside component to prevent recreation on every render
const DIRECTIONS = [
  { label: "N", bearing: 0 },
  { label: "NE", bearing: 45 },
  { label: "E", bearing: 90 },
  { label: "SE", bearing: 135 },
  { label: "S", bearing: 180 },
  { label: "SW", bearing: 225 },
  { label: "W", bearing: 270 },
  { label: "NW", bearing: 315 },
] as const;

// Pre-compute tick array (0, 10, 20, ..., 350)
const TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

const VISIBLE_RANGE = 90;
const PIXEL_RANGE = 96; // (offset / visibleRange) * 96

// Constants for smooth animation
const SMOOTHING_FACTOR = 0.15; // Higher = faster response, lower = smoother
const MAX_VELOCITY = 500; // deg/s
const PREDICTION_HORIZON = 16; // ms ahead to predict
const PIXELS_PER_DEGREE = PIXEL_RANGE / VISIBLE_RANGE; // ~1.067 px/deg

// Extended range for static strip (covers visible range + wraparound)
const STRIP_RANGE = 1080; // -360 to 720 degrees
const STRIP_START = -360;

// Optimized cardinal direction lookup
const getCardinal = (h: number): string => {
  const normalized = ((h % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return "N";
  if (normalized < 67.5) return "NE";
  if (normalized < 112.5) return "E";
  if (normalized < 157.5) return "SE";
  if (normalized < 202.5) return "S";
  if (normalized < 247.5) return "SW";
  if (normalized < 292.5) return "W";
  return "NW";
};

// Optimized offset calculation
const getMarkerOffset = (bearing: number, heading: number): number => {
  let diff = bearing - heading;
  // Normalize to [-180, 180] range more efficiently
  if (diff > 180) diff -= 360;
  else if (diff < -180) diff += 360;
  return diff;
};

// Calculate shortest angle delta between two headings
const shortestAngleDelta = (from: number, to: number): number => {
  let delta = to - from;
  if (delta > 180) delta -= 360;
  else if (delta < -180) delta += 360;
  return delta;
};

// Normalize heading to [0, 360)
const normalizeHeading = (h: number): number => {
  return ((h % 360) + 360) % 360;
};

function CompassBar({
  heading,
  pitch,
  roll,
  isGyroActive,
  isGyroEnabled,
  isGyroAvailable,
  isMobile,
  onRecalibrateGyro,
}: CompassBarProps) {
  // Animation refs
  const targetHeadingRef = useRef(heading);
  const currentHeadingRef = useRef(heading);
  const velocityRef = useRef(0); // deg/ms
  const lastSampleRef = useRef<{ time: number; heading: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // DOM refs for imperative updates
  const stripRef = useRef<HTMLDivElement>(null);
  const headingTextRef = useRef<HTMLSpanElement>(null);
  const cardinalRef = useRef<HTMLSpanElement>(null);

  // Round pitch/roll for display (heading is smoothed)
  const roundedPitch = Math.round(pitch);
  const roundedRoll = Math.round(roll);

  // Update target heading and velocity when prop changes
  useEffect(() => {
    const now = performance.now();
    const prevSample = lastSampleRef.current;

    if (prevSample) {
      const dt = now - prevSample.time;
      if (dt > 0) {
        const delta = shortestAngleDelta(prevSample.heading, heading);
        const velocity = delta / dt; // deg/ms
        // Clamp velocity and apply exponential smoothing
        const clampedVelocity = Math.max(
          -MAX_VELOCITY / 1000,
          Math.min(MAX_VELOCITY / 1000, velocity)
        );
        velocityRef.current = velocityRef.current * 0.7 + clampedVelocity * 0.3;
      }
    }

    targetHeadingRef.current = heading;
    lastSampleRef.current = { time: now, heading };
  }, [heading]);

  // RAF animation loop
  useEffect(() => {
    const animate = () => {
      const target = targetHeadingRef.current;
      const current = currentHeadingRef.current;
      const velocity = velocityRef.current;

      // Predict future target using velocity
      const predictedTarget = target + velocity * PREDICTION_HORIZON;
      const delta = shortestAngleDelta(current, predictedTarget);

      // Smooth interpolation toward predicted target
      currentHeadingRef.current = normalizeHeading(
        current + delta * SMOOTHING_FACTOR
      );

      const displayHeading = currentHeadingRef.current;

      // Update strip transform
      if (stripRef.current) {
        // Ticks are positioned relative to strip center, so translate to align displayHeading with center
        const offset = -displayHeading * PIXELS_PER_DEGREE;
        stripRef.current.style.transform = `translateX(${offset}px)`;
      }

      // Update heading text (1 decimal)
      if (headingTextRef.current) {
        headingTextRef.current.textContent = `${displayHeading.toFixed(1)}°`;
      }

      // Update cardinal
      if (cardinalRef.current) {
        cardinalRef.current.textContent = getCardinal(displayHeading);
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Memoize computed values for pitch/roll display
  const displayValues = useMemo(
    () => ({
      pitchText: `${roundedPitch > 0 ? "+" : ""}${roundedPitch}°`,
      rollText: `${roundedRoll > 0 ? "+" : ""}${roundedRoll}°`,
      pitchWarning: Math.abs(roundedPitch) > 30,
      rollWarning: Math.abs(roundedRoll) > 30,
    }),
    [roundedPitch, roundedRoll]
  );

  // Memoize gyro button visibility check
  const showGyroButton = useMemo(
    () =>
      isMobile &&
      (isGyroActive || isGyroEnabled || isGyroAvailable) &&
      onRecalibrateGyro,
    [isMobile, isGyroActive, isGyroEnabled, isGyroAvailable, onRecalibrateGyro]
  );

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flight-dashboard-card p-3 rounded-lg font-mono">
      <div className="flex items-center justify-center gap-4 mb-1">
        {showGyroButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRecalibrateGyro}
            aria-label="Recalibrate gyroscope"
            className="hover:bg-red-500"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <path d="M2 12c0-3 2-5 5-5" />
              <path d="M22 12c0 3-2 5-5 5" />
              <polyline points="5 4 2 7 5 10" />
              <polyline points="19 20 22 17 19 14" />
            </svg>
          </Button>
        )}
        <div className="flex items-center gap-1 w-16">
          <span className="text-white/50">R</span>
          <span
            className={`w-10 text-right ${
              displayValues.rollWarning ? "text-accent" : "text-background"
            }`}
          >
            {displayValues.rollText}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span
            ref={headingTextRef}
            className="text-white font-bold w-8 text-center"
          >
            {heading.toFixed(1)}°
          </span>
          <span ref={cardinalRef} className="text-white/70 w-6">
            {getCardinal(heading)}
          </span>
        </div>

        <div className="flex items-center gap-1 w-16">
          <span className="text-white/50">P</span>
          <span
            className={`w-10 ${
              displayValues.pitchWarning ? "text-accent" : "text-background"
            }`}
          >
            {displayValues.pitchText}
          </span>
        </div>
      </div>

      <div className="relative w-48 h-4 overflow-hidden mx-auto">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-white/50 transform -translate-x-1/2 z-10" />

        {/* Static pre-rendered compass strip */}
        <div
          ref={stripRef}
          className="absolute top-0 left-1/2 will-change-transform"
          style={{
            width: `${STRIP_RANGE * PIXELS_PER_DEGREE}px`,
            marginLeft: `${-STRIP_RANGE * PIXELS_PER_DEGREE * 0.5}px`,
          }}
        >
          {/* Pre-render all direction labels in extended range */}
          {Array.from({ length: Math.ceil(STRIP_RANGE / 45) + 1 }, (_, i) => {
            const bearing = STRIP_START + i * 45;
            const normalizedBearing = normalizeHeading(bearing);
            const dir = DIRECTIONS.find((d) => d.bearing === normalizedBearing);
            if (!dir) return null;

            const labelClass =
              dir.label === "N"
                ? "text-red-400"
                : dir.label.length === 1
                ? "text-white"
                : "text-white/50";

            // Position relative to strip center (halfWidth from left)
            const halfWidth = (STRIP_RANGE * PIXELS_PER_DEGREE) / 2;
            const position = halfWidth + bearing * PIXELS_PER_DEGREE;

            return (
              <div
                key={`dir-${bearing}`}
                className="absolute top-0 transform -translate-x-1/2 text-center"
                style={{ left: `${position}px` }}
              >
                <div className={`text-[10px] ${labelClass}`}>{dir.label}</div>
              </div>
            );
          })}

          {/* Pre-render all tick marks in extended range */}
          {Array.from({ length: Math.ceil(STRIP_RANGE / 10) + 1 }, (_, i) => {
            const tick = STRIP_START + i * 10;
            const isCardinal = tick % 90 === 0;

            // Position relative to strip center (halfWidth from left)
            const halfWidth = (STRIP_RANGE * PIXELS_PER_DEGREE) / 2;
            const position = halfWidth + tick * PIXELS_PER_DEGREE;

            return (
              <div
                key={`tick-${tick}`}
                className={`absolute bottom-0 w-px transform -translate-x-1/2 ${
                  isCardinal ? "h-2 bg-white/60" : "h-1 bg-white/30"
                }`}
                style={{ left: `${position}px` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Memoize component to prevent re-renders when props haven't changed
// Note: Heading is now smoothed via RAF, so we compare raw values (not rounded)
export default memo(CompassBar, (prevProps, nextProps) => {
  // Compare raw heading (not rounded) since RAF handles smoothing
  const headingChanged = prevProps.heading !== nextProps.heading;
  const pitchChanged =
    Math.round(prevProps.pitch) !== Math.round(nextProps.pitch);
  const rollChanged = Math.round(prevProps.roll) !== Math.round(nextProps.roll);

  return (
    !headingChanged &&
    !pitchChanged &&
    !rollChanged &&
    prevProps.isGyroActive === nextProps.isGyroActive &&
    prevProps.isGyroEnabled === nextProps.isGyroEnabled &&
    prevProps.isGyroAvailable === nextProps.isGyroAvailable &&
    prevProps.isMobile === nextProps.isMobile
  );
});
