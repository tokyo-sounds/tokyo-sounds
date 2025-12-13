"use client";

/**
 * Speedometer Component
 * Analog-style speedometer with animated needle
 * Displays flight speed with smooth acceleration/deceleration animations
 */

import { useMemo } from "react";
import {
  speedToAngle,
  getSpeedColor,
  generateSpeedMarks,
} from "@/lib/speedometer-utils";
import { MIN_SPEED, MAX_SPEED } from "@/lib/flight";

interface SpeedoMeterProps {
  flightSpeed: number;
  minSpeed?: number;
  maxSpeed?: number;
  size?: number; // Diameter of the speedometer in pixels
}

export default function SpeedoMeter({
  flightSpeed,
  minSpeed = MIN_SPEED,
  maxSpeed = MAX_SPEED,
  size = 240,
}: SpeedoMeterProps) {
  // Calculate current angle
  const targetAngle = useMemo(
    () => speedToAngle(flightSpeed, minSpeed, maxSpeed),
    [flightSpeed, minSpeed, maxSpeed]
  );

  // SVG constants - computed once per size
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.33;
  const needleLength = radius * 0.75;
  const needleWidth = 4; // Width of the triangle needle at its base
  const needleBaseOffset = 8; // Distance from center for the triangle base

  // Generate speed marks
  const speedMarks = useMemo(
    () => generateSpeedMarks(minSpeed, maxSpeed, 10),
    [minSpeed, maxSpeed]
  );

  // Precompute all mark geometry once - keyed by size/minSpeed/maxSpeed (not flightSpeed)
  // This avoids recalculating trig on every 60fps update
  const marksGeometry = useMemo(() => {
    const labelRadius = radius * 1.2;
    return speedMarks.map((speed) => {
      const rotationAngle = speedToAngle(speed, minSpeed, maxSpeed);
      // SVG angle = needle's initial direction (-90° = up) + rotation angle
      const svgAngle = -90 + rotationAngle;
      const radian = (svgAngle * Math.PI) / 180;
      
      const isMajor = speed % 50 === 0;
      const markLength = isMajor ? 12 : 6;
      
      // Outer point (on circle)
      const x = centerX + radius * Math.cos(radian);
      const y = centerY + radius * Math.sin(radian);
      
      // Inner point (mark endpoint)
      const innerX = centerX + (radius - markLength) * Math.cos(radian);
      const innerY = centerY + (radius - markLength) * Math.sin(radian);
      
      // Label position
      const labelX = centerX + labelRadius * Math.cos(radian);
      const labelY = centerY + labelRadius * Math.sin(radian);
      
      return {
        speed,
        isMajor,
        x1: innerX,
        y1: innerY,
        x2: x,
        y2: y,
        labelX,
        labelY,
        strokeWidth: isMajor ? 2 : 1,
      };
    });
  }, [size, minSpeed, maxSpeed, speedMarks, centerX, centerY, radius]);

  const speedColor = getSpeedColor(flightSpeed, minSpeed, maxSpeed);

  // Memoize needle style to avoid object allocation on every render
  const needleStyle = useMemo(
    () => ({
      transform: `rotate(${targetAngle}deg)`,
      transformOrigin: "center center" as const,
    }),
    [targetAngle]
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
        {/* Background circle */}
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

        {/* Speed marks - rendered from precomputed geometry */}
        {marksGeometry.map((mark) => (
          <g key={`mark-${mark.speed}`}>
            {/* Mark line */}
            <line
              x1={mark.x1}
              y1={mark.y1}
              x2={mark.x2}
              y2={mark.y2}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={mark.strokeWidth}
            />
            {/* Speed label for major marks */}
            {mark.isMajor && (
              <text
                x={mark.labelX}
                y={mark.labelY}
                fill="rgba(255, 255, 255, 0.8)"
                fontSize="8"
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono font-light"
              >
                {mark.speed}
              </text>
            )}
          </g>
        ))}

        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill="rgba(255, 255, 255, 0.8)"
        />
      </svg>

      {/* Needle - separate SVG with CSS rotation for reliable animation */}
      {/* GPU-accelerated transform layer for smooth 60fps updates */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-150 ease-linear motion-reduce:transition-none transform-gpu will-change-[transform] backface-hidden"
        style={needleStyle}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Needle - thin triangular shape */}
          <path
            d={`M ${centerX} ${centerY - needleLength} 
                L ${centerX - needleWidth / 2} ${centerY - needleBaseOffset} 
                L ${centerX + needleWidth / 2} ${centerY - needleBaseOffset} 
                Z`}
            className="fill-primary"
          />
        </svg>
      </div>

      {/* Speed display - positioned at center of the gauge */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          left: centerX,
          top: centerY + 10,
          transform: "translate(-50%, 0)",
        }}
      >
        <div
          className={`text-xl md:text-2xl font-sans font-semibold ${speedColor}`}
        >
          {Math.round(flightSpeed)}
        </div>
        <div className="text-xs text-muted font-mono">km/h</div>
      </div>
    </div>
  );
}
