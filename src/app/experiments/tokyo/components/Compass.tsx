"use client";

/**
 * Compass Component
 * Circular compass with rotating needle showing heading direction
 * Displays user's heading, cardinal direction, and geographic position
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";

interface CompassProps {
  heading: number; // 0-360 degrees (from CompassBar)
  size?: number; // Diameter of the compass in pixels
}

export default function Compass({
  heading,
  size = 240,
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

  // SVG constants
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.33;

  // Generate cardinal directions and tick marks
  const cardinalDirections = [
    { label: "N", angle: 0 },
    { label: "NE", angle: 45 },
    { label: "E", angle: 90 },
    { label: "SE", angle: 135 },
    { label: "S", angle: 180 },
    { label: "SW", angle: 225 },
    { label: "W", angle: 270 },
    { label: "NW", angle: 315 },
  ];

  // Generate minor tick marks every 30 degrees
  const tickMarks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i * 30);
  }, []);

  // Calculate position for a given angle (0° = North, clockwise)
  const getPosition = (angle: number) => {
    // SVG coordinates: 0° is right (3 o'clock), so we need to adjust
    // For compass: 0° should be top (12 o'clock) = -90° in SVG
    const svgAngle = angle - 90;
    const radian = (svgAngle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);
    return { x, y, svgAngle };
  };

  // Format coordinates for display
  const formatCoordinate = (coord: number | undefined) => {
    if (coord === undefined) return null;
    return coord.toFixed(6);
  };

  return (
    <div
      className="relative rounded-full bg-black/[0.25] border border-border/50 backdrop-blur-xs text-white text-xs font-mono **:drop-shadow-lg **:drop-shadow-black/50"
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

        {/* Minor tick marks (every 30 degrees) */}
        {tickMarks.map((angle) => {
          const { x, y, svgAngle } = getPosition(angle);
          const isCardinal = angle % 90 === 0;
          const markLength = isCardinal ? 12 : 6;

          // Calculate mark endpoint (inner point)
          const radian = (svgAngle * Math.PI) / 180;
          const innerX = centerX + (radius - markLength) * Math.cos(radian);
          const innerY = centerY + (radius - markLength) * Math.sin(radian);

          return (
            <line
              key={`tick-${angle}`}
              x1={innerX}
              y1={innerY}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={isCardinal ? 2 : 1}
            />
          );
        })}

        {/* Cardinal direction labels */}
        {cardinalDirections.map((dir) => {
          const { x, y } = getPosition(dir.angle);
          const labelRadius = radius * 1.2;
          const svgAngle = dir.angle - 90;
          const radian = (svgAngle * Math.PI) / 180;
          const labelX = centerX + labelRadius * Math.cos(radian);
          const labelY = centerY + labelRadius * Math.sin(radian);

          return (
            <text
              key={dir.label}
              x={labelX}
              y={labelY}
              fill={dir.label === "N" ? "orange" : "rgba(255, 255, 255, 0.8)"}
              fontSize="10"
              fontWeight={dir.label === "N" ? "bold" : "normal"}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono font-light"
            >
              {dir.label}
            </text>
          );
        })}
      </svg>

      {/* Indicator - Lucide Icon with CSS rotation for reliable animation */}
      {/* Plane icon rotates to point in the direction of heading (0° = North) */}
      {/* Uses displayAngle (cumulative) instead of heading to handle 0°/360° boundary */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-500 ease-out flex items-center justify-center"
        style={{
          transform: `rotate(${displayAngle}deg)`,
          transformOrigin: "center center",
        }}
      >
        <SendHorizontal
          strokeWidth={1}
          className="size-8 md:size-12 text-white -rotate-90"
        />
      </div>
    </div>
  );
}
