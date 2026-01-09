"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { memo, useMemo, useEffect, useRef } from "react";
import { type PlayerState } from "@/types/multiplayer";
import * as THREE from "three";
import { latLngAltToENU } from "@/lib/geo-utils";
import { TOKYO_CENTER } from "@/config/tokyo-config";
import { TOKYO_LANDMARKS, LANDMARK_VISIBILITY } from "@/config/landmarks-config";

/** CompassBar
 *
 * Compass bar at top of viewport with nearby player indicators
 * @param heading - Heading
 * @param pitch - Pitch
 * @param roll - Roll
 * @param nearbyPlayers - Array of nearby multiplayer players
 * @param localPlayerPosition - Local player's position in ENU coordinates
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
  nearbyPlayers?: PlayerState[];
  localPlayerPosition?: THREE.Vector3;
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

// Constants for compass bar dimensions
const VISIBLE_RANGE = 90; // degrees visible in the bar
const COMPASS_WIDTH = 288; // pixels (was 192, now 50% wider)
const PIXELS_PER_DEGREE = COMPASS_WIDTH / VISIBLE_RANGE; // ~3.2 px/deg

// Constants for smooth animation
const SMOOTHING_FACTOR = 0.15; // Higher = faster response, lower = smoother
const MAX_VELOCITY = 500; // deg/s
const PREDICTION_HORIZON = 16; // ms ahead to predict

// Extended range for static strip (covers visible range + wraparound)
const STRIP_RANGE = 1080; // -360 to 720 degrees
const STRIP_START = -360;

// Player indicator constants
const PLAYER_DOT_SIZE = 4; // Size of player indicator dots
const PLAYER_ARROW_SIZE = 6; // Size of indicator container
const ALTITUDE_THRESHOLD = 20; // Meters difference to show altitude indicator

// Landmark indicator constants
const LANDMARK_ICON_SIZE = 18; // Size of landmark icons in pixels
const LANDMARK_FADE_START = LANDMARK_VISIBILITY.COMPASS_BAR_DISTANCE; // 5000m - starts appearing
const LANDMARK_FADE_END = 1000; // Fully visible at 1km

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
  nearbyPlayers,
  localPlayerPosition,
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
  const playerMarkersRef = useRef<HTMLDivElement>(null);
  const landmarkMarkersRef = useRef<HTMLDivElement>(null);

  // Data refs to avoid RAF dependency changes - explicit types
  const playerMarkersDataRef = useRef<Array<{
    id: string;
    color: string;
    name: string;
    bearing: number;
    heading: number;
    altitudeIndicator: "above" | "below" | "same";
  }>>([]);
  const landmarkMarkersDataRef = useRef<Array<{
    id: string;
    name: string;
    icon: string;
    bearing: number;
    distance: number;
    opacity: number;
  }>>([]);

  // Round pitch/roll for display (heading is smoothed)
  const roundedPitch = Math.round(pitch);
  const roundedRoll = Math.round(roll);

  // Calculate player marker data (positions relative to heading)
  const playerMarkers = useMemo(() => {
    if (!nearbyPlayers || !localPlayerPosition || nearbyPlayers.length === 0) {
      return [];
    }

    return nearbyPlayers.map((player) => {
      // Calculate direction from local player to this player (in XZ plane)
      const dx = player.position.x - localPlayerPosition.x;
      const dz = player.position.z - localPlayerPosition.z;

      // Calculate world bearing (0° = North/-Z, 90° = East/+X)
      // In ENU: +X = East, -Z = North
      const worldBearing = (Math.atan2(dx, -dz) * 180) / Math.PI;

      // Normalize to [0, 360)
      const normalizedBearing = normalizeHeading(worldBearing);

      // Calculate altitude difference (Y is up in ENU)
      const altitudeDiff = player.position.y - localPlayerPosition.y;
      
      // Determine if player is above, below, or at same level
      let altitudeIndicator: "above" | "below" | "same" = "same";
      if (altitudeDiff > ALTITUDE_THRESHOLD) {
        altitudeIndicator = "above";
      } else if (altitudeDiff < -ALTITUDE_THRESHOLD) {
        altitudeIndicator = "below";
      }

      return {
        id: player.id,
        color: player.color,
        name: player.name,
        bearing: normalizedBearing,
        heading: player.heading, // Player's facing direction for arrow
        altitudeIndicator,
      };
    });
  }, [nearbyPlayers, localPlayerPosition]);

  // Calculate landmark marker data (positions relative to heading with distance-based opacity)
  const landmarkMarkers = useMemo(() => {
    if (!localPlayerPosition) return [];

    return TOKYO_LANDMARKS.map((landmark) => {
      // Convert landmark lat/lng to ENU coordinates
      const landmarkENU = latLngAltToENU(
        landmark.lat,
        landmark.lng,
        landmark.groundAlt,
        TOKYO_CENTER.lat,
        TOKYO_CENTER.lng,
        0
      );

      // Calculate direction from local player to landmark (in XZ plane)
      const dx = landmarkENU.x - localPlayerPosition.x;
      const dz = landmarkENU.z - localPlayerPosition.z;

      // Calculate distance
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Calculate opacity based on distance (fade in from 5km to 1km)
      let opacity = 0;
      if (distance <= LANDMARK_FADE_END) {
        opacity = 1;
      } else if (distance < LANDMARK_FADE_START) {
        // Linear interpolation between fade start and fade end
        opacity = 1 - (distance - LANDMARK_FADE_END) / (LANDMARK_FADE_START - LANDMARK_FADE_END);
      }

      // Skip if not visible
      if (opacity <= 0) return null;

      // Calculate world bearing (0° = North/-Z, 90° = East/+X)
      const worldBearing = (Math.atan2(dx, -dz) * 180) / Math.PI;
      const normalizedBearing = normalizeHeading(worldBearing);

      return {
        id: landmark.id,
        name: landmark.name,
        icon: landmark.icon,
        bearing: normalizedBearing,
        distance,
        opacity,
      };
    }).filter((marker): marker is NonNullable<typeof marker> => marker !== null);
  }, [localPlayerPosition]);

  // Sync marker data to refs for stable RAF access
  useEffect(() => {
    playerMarkersDataRef.current = playerMarkers;
  }, [playerMarkers]);

  useEffect(() => {
    landmarkMarkersDataRef.current = landmarkMarkers;
  }, [landmarkMarkers]);

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

  // RAF animation loop - no dependencies to keep it stable like master branch
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

      // Update player marker positions (inline, reading from ref)
      const currentPlayerMarkers = playerMarkersDataRef.current;
      if (playerMarkersRef.current && currentPlayerMarkers.length > 0) {
        const children = playerMarkersRef.current.children;
        const halfRange = VISIBLE_RANGE / 2;
        const centerX = COMPASS_WIDTH / 2;

        for (let i = 0; i < currentPlayerMarkers.length && i < children.length; i++) {
          const marker = currentPlayerMarkers[i];
          const child = children[i] as HTMLElement;

          // Calculate relative bearing (how far off from current heading)
          const relativeBearing = shortestAngleDelta(displayHeading, marker.bearing);

          // Check if within visible range
          if (Math.abs(relativeBearing) <= halfRange) {
            // Position in pixels from center
            const pixelOffset = relativeBearing * PIXELS_PER_DEGREE;
            child.style.transform = `translateX(${centerX + pixelOffset}px) translateX(-50%)`;
            child.style.opacity = "1";
          } else {
            // Hide if outside visible range
            child.style.opacity = "0";
          }
        }
      }

      // Update landmark marker positions (inline, reading from ref)
      const currentLandmarkMarkers = landmarkMarkersDataRef.current;
      if (landmarkMarkersRef.current && currentLandmarkMarkers.length > 0) {
        const children = landmarkMarkersRef.current.children;
        const halfRange = VISIBLE_RANGE / 2;
        const centerX = COMPASS_WIDTH / 2;

        for (let i = 0; i < currentLandmarkMarkers.length && i < children.length; i++) {
          const marker = currentLandmarkMarkers[i];
          const child = children[i] as HTMLElement;

          // Calculate relative bearing (how far off from current heading)
          const relativeBearing = shortestAngleDelta(displayHeading, marker.bearing);

          // Check if within visible range
          if (Math.abs(relativeBearing) <= halfRange) {
            // Position in pixels from center
            const pixelOffset = relativeBearing * PIXELS_PER_DEGREE;
            child.style.transform = `translateX(${centerX + pixelOffset}px) translateX(-50%)`;
            child.style.opacity = String(marker.opacity);
          } else {
            // Hide if outside visible range
            child.style.opacity = "0";
          }
        }
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

      {/* Compass strip container - 50% wider (288px instead of 192px) */}
      <div
        className="relative h-6 overflow-hidden mx-auto"
        style={{ width: COMPASS_WIDTH }}
      >
        {/* Center line */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-white/50 transform -translate-x-1/2 z-10" />

        {/* Static pre-rendered compass strip */}
        <div
          ref={stripRef}
          className="absolute top-0 left-1/2 h-full will-change-transform"
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

          {/* Pre-render all tick marks in extended range (every 10°) */}
          {Array.from({ length: Math.ceil(STRIP_RANGE / 10) + 1 }, (_, i) => {
            const tick = STRIP_START + i * 10;
            const normalizedTick = normalizeHeading(tick);
            const isCardinal = normalizedTick % 90 === 0;

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

        {/* Player markers overlay - positioned absolutely, updated via RAF */}
        <div
          ref={playerMarkersRef}
          className="absolute inset-0 pointer-events-none z-20"
        >
          {playerMarkers.map((marker) => (
            <div
              key={marker.id}
              className="absolute top-1/2 -translate-y-1/2 transition-opacity duration-150"
              style={{ opacity: 0 }} // Initial hidden, RAF will show if visible
            >
              {/* Player indicator - circle with altitude chevron */}
              <svg
                width={PLAYER_ARROW_SIZE * 2}
                height={PLAYER_ARROW_SIZE * 4}
                viewBox={`0 0 ${PLAYER_ARROW_SIZE * 2} ${PLAYER_ARROW_SIZE * 4}`}
                className="drop-shadow-md"
                style={{
                  transform: `translateX(-50%)`,
                  marginTop: -PLAYER_ARROW_SIZE,
                }}
              >
                {/* Chevron above (if player is above) */}
                {marker.altitudeIndicator === "above" && (
                  <polyline
                    points={`${PLAYER_ARROW_SIZE - 4},${PLAYER_ARROW_SIZE * 0.7 + 2} ${PLAYER_ARROW_SIZE},${PLAYER_ARROW_SIZE * 0.7 - 2} ${PLAYER_ARROW_SIZE + 4},${PLAYER_ARROW_SIZE * 0.7 + 2}`}
                    fill="none"
                    stroke={marker.color}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {/* Outer glow */}
                <circle
                  cx={PLAYER_ARROW_SIZE}
                  cy={PLAYER_ARROW_SIZE * 2}
                  r={PLAYER_DOT_SIZE + 1}
                  fill={marker.color}
                  opacity={0.4}
                />
                {/* Main dot */}
                <circle
                  cx={PLAYER_ARROW_SIZE}
                  cy={PLAYER_ARROW_SIZE * 2}
                  r={PLAYER_DOT_SIZE}
                  fill={marker.color}
                />
                {/* Chevron below (if player is below) */}
                {marker.altitudeIndicator === "below" && (
                  <polyline
                    points={`${PLAYER_ARROW_SIZE - 4},${PLAYER_ARROW_SIZE * 3.3 - 2} ${PLAYER_ARROW_SIZE},${PLAYER_ARROW_SIZE * 3.3 + 2} ${PLAYER_ARROW_SIZE + 4},${PLAYER_ARROW_SIZE * 3.3 - 2}`}
                    fill="none"
                    stroke={marker.color}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>
          ))}
        </div>

        {/* Landmark markers overlay - positioned absolutely, updated via RAF */}
        <div
          ref={landmarkMarkersRef}
          className="absolute inset-0 pointer-events-none z-30"
        >
          {landmarkMarkers.map((marker) => (
            <div
              key={marker.id}
              className="absolute top-1/2 -translate-y-1/2 transition-opacity duration-150"
              style={{ opacity: 0 }} // Initial hidden, RAF will show if visible
            >
              <div
                className="relative"
                style={{
                  width: LANDMARK_ICON_SIZE,
                  height: LANDMARK_ICON_SIZE,
                  transform: "translateX(-50%)",
                  marginTop: -LANDMARK_ICON_SIZE / 2,
                }}
              >
                <Image
                  src={marker.icon}
                  alt={marker.name}
                  width={LANDMARK_ICON_SIZE}
                  height={LANDMARK_ICON_SIZE}
                  className="drop-shadow-md"
                  style={{
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export default memo(CompassBar, (prevProps, nextProps) => {
  // Compare raw heading (not rounded) since RAF handles smoothing
  const headingChanged = prevProps.heading !== nextProps.heading;
  const pitchChanged =
    Math.round(prevProps.pitch) !== Math.round(nextProps.pitch);
  const rollChanged = Math.round(prevProps.roll) !== Math.round(nextProps.roll);

  // Check if players changed
  const playersChanged =
    prevProps.nearbyPlayers !== nextProps.nearbyPlayers ||
    prevProps.localPlayerPosition !== nextProps.localPlayerPosition;

  return (
    !headingChanged &&
    !pitchChanged &&
    !rollChanged &&
    !playersChanged &&
    prevProps.isGyroActive === nextProps.isGyroActive &&
    prevProps.isGyroEnabled === nextProps.isGyroEnabled &&
    prevProps.isGyroAvailable === nextProps.isGyroAvailable &&
    prevProps.isMobile === nextProps.isMobile
  );
});
