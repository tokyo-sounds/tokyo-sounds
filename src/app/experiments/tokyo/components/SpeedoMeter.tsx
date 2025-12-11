"use client";

/**
 * Speedometer Component
 * Analog-style speedometer with animated needle
 * Displays flight speed with smooth acceleration/deceleration animations
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import {
  speedToAngle,
  detectSpeedChange,
  getSpeedColor,
  getSpeedColorValue,
  getSpringConfig,
  generateSpeedMarks,
  type SpeedChangeDirection,
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
  size = 200,
}: SpeedoMeterProps) {
  const prevSpeedRef = useRef<number>(flightSpeed);
  const [direction, setDirection] = useState<SpeedChangeDirection>("stable");

  // Calculate current angle
  const targetAngle = useMemo(
    () => speedToAngle(flightSpeed, minSpeed, maxSpeed),
    [flightSpeed, minSpeed, maxSpeed]
  );

  // Detect speed change direction
  useEffect(() => {
    const newDirection = detectSpeedChange(
      prevSpeedRef.current,
      flightSpeed,
      0.1
    );
    setDirection(newDirection);
    prevSpeedRef.current = flightSpeed;
  }, [flightSpeed]);

  // Motion value for smooth animation
  const angle = useMotionValue(targetAngle);

  // Get spring config based on speed direction
  const springConfig = useMemo(() => getSpringConfig(direction), [direction]);

  // Apply spring animation to angle
  const springAngle = useSpring(angle, springConfig);

  // Update target angle when speed changes
  useEffect(() => {
    angle.set(targetAngle);
  }, [targetAngle, angle]);

  // Generate speed marks
  const speedMarks = useMemo(
    () => generateSpeedMarks(minSpeed, maxSpeed, 10),
    [minSpeed, maxSpeed]
  );

  // SVG constants
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  const needleLength = radius * 0.75;
  const needleWidth = 4; // Width of the triangle needle at its base
  const needleBaseOffset = 8; // Distance from center for the triangle base

  // Calculate mark positions
  // Needle starts pointing UP (-90° in SVG), then CSS rotates by speedToAngle
  // So mark positions need the same transformation: -90° + speedToAngle
  const getMarkPosition = (speed: number) => {
    const rotationAngle = speedToAngle(speed, minSpeed, maxSpeed);
    // SVG angle = needle's initial direction (-90° = up) + rotation angle
    const svgAngle = -90 + rotationAngle;
    const radian = (svgAngle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);
    return { x, y, svgAngle };
  };

  const speedColor = getSpeedColor(flightSpeed, minSpeed, maxSpeed);
  const speedColorValue = getSpeedColorValue(flightSpeed, minSpeed, maxSpeed);

  return (
    <div className="relative" style={{ width: size, height: size }}>
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

        {/* Speed marks */}
        {speedMarks.map((speed, index) => {
          const { x, y, svgAngle } = getMarkPosition(speed);
          const isMajor = speed % 50 === 0; // Show labels for every 50
          const markLength = isMajor ? 12 : 6;

          // Calculate mark endpoint (inner point) - same angle as outer point
          const radian = (svgAngle * Math.PI) / 180;
          const innerX = centerX + (radius - markLength) * Math.cos(radian);
          const innerY = centerY + (radius - markLength) * Math.sin(radian);

          // Calculate label position - extend further out from the mark
          const labelRadius = radius * 1.2;
          const labelX = centerX + labelRadius * Math.cos(radian);
          const labelY = centerY + labelRadius * Math.sin(radian);

          return (
            <g key={`mark-${speed}`}>
              {/* Mark line */}
              <line
                x1={innerX}
                y1={innerY}
                x2={x}
                y2={y}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={isMajor ? 2 : 1}
              />
              {/* Speed label for major marks */}
              {isMajor && (
                <text
                  x={labelX}
                  y={labelY}
                  fill="rgba(255, 255, 255, 0.6)"
                  fontSize="10"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-mono"
                >
                  {speed}
                </text>
              )}
            </g>
          );
        })}

        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill="rgba(255, 255, 255, 0.8)"
        />
      </svg>

      {/* Needle - separate SVG with CSS rotation for reliable animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          rotate: springAngle,
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Needle - thin triangular shape */}
          <path
            d={`M ${centerX} ${centerY - needleLength} 
                L ${centerX - needleWidth / 2} ${centerY - needleBaseOffset} 
                L ${centerX + needleWidth / 2} ${centerY - needleBaseOffset} 
                Z`}
            fill={speedColorValue}
          />
        </svg>
      </motion.div>

      {/* Speed display - positioned at center of the gauge */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          left: centerX,
          top: centerY + 10,
          transform: "translate(-50%, 0)",
        }}
      >
        <div className={`text-2xl font-mono font-bold ${speedColor}`}>
          {Math.round(flightSpeed)}
        </div>
        <div className="text-xs text-white/50 font-mono">km/h</div>
      </div>
    </div>
  );
}
