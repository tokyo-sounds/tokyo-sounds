"use client";

/**
 * Compass Component
 * Circular compass with rotating needle showing heading direction
 * Displays user's heading, cardinal direction, and geographic position
 * Shows nearby players as colored dots positioned by their relative direction
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { type PlayerState } from "@/types/multiplayer";
import * as THREE from "three";

// Module constants - avoid re-allocation on every render
const CARDINAL_DIRECTIONS = [
  { label: "N", angle: 0 },
  { label: "NE", angle: 45 },
  { label: "E", angle: 90 },
  { label: "SE", angle: 135 },
  { label: "S", angle: 180 },
  { label: "SW", angle: 225 },
  { label: "W", angle: 270 },
  { label: "NW", angle: 315 },
] as const;

const TICK_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);

const PLAYER_DOT_RADIUS = 4; // Size of player indicator dots
const PLAYER_DOT_DISTANCE_RATIO = 0.85; // Position dots at 85% of compass radius

interface CompassProps {
  heading: number; // 0-360 degrees (from CompassBar)
  size?: number; // Diameter of the compass in pixels
  nearbyPlayers?: PlayerState[];
  localPlayerPosition?: THREE.Vector3;
}

export default function Compass({
  heading,
  size = 240,
  nearbyPlayers,
  localPlayerPosition,
}: CompassProps) {
  // Track cumulative rotation to handle 0°/360° boundary crossing
  // This allows the rotation to take the shortest path instead of the long way
  const [displayAngle, setDisplayAngle] = useState(heading);
  const prevHeadingRef = useRef(heading);

  useEffect(() => {
    const prevHeading = prevHeadingRef.current;

    // Calculate the delta between new and previous heading
    let delta = heading - prevHeading;

    // Normalize delta to [-180, 180] range for shortest rotation path
    // e.g., going from 350° to 10° should be +20°, not -340°
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;

    // Add delta to display angle (can go beyond 0-360)
    setDisplayAngle((prev) => prev + delta);
    prevHeadingRef.current = heading;
  }, [heading]);

  // Convert heading to cardinal direction
  const getCardinal = (h: number) => {
    const normalized = ((h % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return "N";
    if (normalized >= 22.5 && normalized < 67.5) return "NE";
    if (normalized >= 67.5 && normalized < 112.5) return "E";
    if (normalized >= 112.5 && normalized < 157.5) return "SE";
    if (normalized >= 157.5 && normalized < 202.5) return "S";
    if (normalized >= 202.5 && normalized < 247.5) return "SW";
    if (normalized >= 247.5 && normalized < 292.5) return "W";
    return "NW";
  };

  // SVG constants - computed once per size
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.33;

  // Precompute tick mark geometry once - keyed by size (not heading)
  // This avoids recalculating trig on every 60fps update
  const ticksGeometry = useMemo(() => {
    return TICK_ANGLES.map((angle) => {
      const svgAngle = angle - 90;
      const radian = (svgAngle * Math.PI) / 180;
      const isCardinal = angle % 90 === 0;
      const markLength = isCardinal ? 12 : 6;
      
      // Outer point (on circle)
      const x = centerX + radius * Math.cos(radian);
      const y = centerY + radius * Math.sin(radian);
      
      // Inner point (mark endpoint)
      const innerX = centerX + (radius - markLength) * Math.cos(radian);
      const innerY = centerY + (radius - markLength) * Math.sin(radian);
      
      return {
        angle,
        x1: innerX,
        y1: innerY,
        x2: x,
        y2: y,
        strokeWidth: isCardinal ? 2 : 1,
      };
    });
  }, [size, centerX, centerY, radius]);

  // Precompute cardinal label positions once - keyed by size (not heading)
  const labelsGeometry = useMemo(() => {
    const labelRadius = radius * 1.2;
    return CARDINAL_DIRECTIONS.map((dir) => {
      const svgAngle = dir.angle - 90;
      const radian = (svgAngle * Math.PI) / 180;
      const labelX = centerX + labelRadius * Math.cos(radian);
      const labelY = centerY + labelRadius * Math.sin(radian);
      
      return {
        label: dir.label,
        x: labelX,
        y: labelY,
      };
    });
  }, [size, centerX, centerY, radius]);

  // Compute player dot positions based on relative bearing from local player
  const playerDots = useMemo(() => {
    if (!nearbyPlayers || !localPlayerPosition || nearbyPlayers.length === 0) {
      return [];
    }

    const dotRadius = radius * PLAYER_DOT_DISTANCE_RATIO;

    return nearbyPlayers.map((player) => {
      // Calculate direction from local player to this player (in XZ plane)
      const dx = player.position.x - localPlayerPosition.x;
      const dz = player.position.z - localPlayerPosition.z;

      // Calculate world bearing (0° = North/+Z, 90° = East/+X)
      // atan2 gives angle from +X axis, so we adjust for compass convention
      const worldBearing = (Math.atan2(dx, -dz) * 180) / Math.PI;

      // Convert to relative bearing (relative to player's heading)
      // Subtract heading so dots rotate with the compass
      const relativeBearing = worldBearing - heading;

      // Convert to SVG angle (0° = top/North = -90° in SVG coords)
      const svgAngle = relativeBearing - 90;
      const radian = (svgAngle * Math.PI) / 180;

      const dotX = centerX + dotRadius * Math.cos(radian);
      const dotY = centerY + dotRadius * Math.sin(radian);

      return {
        id: player.id,
        color: player.color,
        x: dotX,
        y: dotY,
        name: player.name,
      };
    });
  }, [nearbyPlayers, localPlayerPosition, heading, radius, centerX, centerY]);

  // Memoize plane style to avoid object allocation on every render
  const planeStyle = useMemo(
    () => ({
      transform: `rotate(${displayAngle}deg)`,
      transformOrigin: "center center" as const,
    }),
    [displayAngle]
  );

  return (
    <div
      className="relative rounded-full flight-dashboard-card font-mono drop-shadow-lg drop-shadow-black/50"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circles */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius * 0.6}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />

        {/* Minor tick marks - rendered from precomputed geometry */}
        {ticksGeometry.map((tick) => (
          <line
            key={`tick-${tick.angle}`}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={tick.strokeWidth}
          />
        ))}

        {/* Cardinal direction labels - rendered from precomputed geometry */}
        {labelsGeometry.map((label) => (
          <text
            key={label.label}
            x={label.x}
            y={label.y}
            className={`${
              label.label === "N" ? "fill-primary" : "fill-muted/80"
            } font-mono font-light`}
            fontSize="10"
            fontWeight={label.label === "N" ? "bold" : "normal"}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {label.label}
          </text>
        ))}

        {/* Nearby player dots - positioned by relative bearing */}
        {playerDots.map((dot) => (
          <g key={dot.id}>
            {/* Outer glow effect */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={PLAYER_DOT_RADIUS + 2}
              fill={dot.color}
              opacity={0.3}
            />
            {/* Main dot */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={PLAYER_DOT_RADIUS}
              fill={dot.color}
              stroke="rgba(0, 0, 0, 0.5)"
              strokeWidth={1}
            />
          </g>
        ))}
      </svg>

      {/* Indicator - Lucide Icon with CSS rotation for reliable animation */}
      {/* Plane icon rotates to point in the direction of heading (0° = North) */}
      {/* Uses displayAngle (cumulative) instead of heading to handle 0°/360° boundary */}
      {/* GPU-accelerated transform layer for smooth 60fps updates */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-150 ease-linear motion-reduce:transition-none transform-gpu will-change-[transform] backface-hidden flex items-center justify-center"
        style={planeStyle}
      >
        <SendHorizontal
          strokeWidth={1}
          className="size-8 md:size-12 text-primary -rotate-90"
        />
      </div>
    </div>
  );
}
