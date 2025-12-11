/**
 * Speedometer Utility Functions
 * Helper functions for speedometer calculations and animations
 */

import { MIN_SPEED, MAX_SPEED } from "./flight";

export type SpeedChangeDirection = "accelerating" | "decelerating" | "stable";

/**
 * Convert speed value to angle for speedometer needle
 * @param speed Current speed value
 * @param minSpeed Minimum speed (default: MIN_SPEED from flight.ts)
 * @param maxSpeed Maximum speed (default: MAX_SPEED from flight.ts)
 * @returns Angle in degrees (0° to 270° for 3/4 circle design)
 */
export function speedToAngle(
  speed: number,
  minSpeed: number = MIN_SPEED,
  maxSpeed: number = MAX_SPEED
): number {
  // Clamp speed to valid range
  const clampedSpeed = Math.max(minSpeed, Math.min(maxSpeed, speed));

  // Normalize speed to 0-1 range
  const normalized = (clampedSpeed - minSpeed) / (maxSpeed - minSpeed);

  // Convert to angle: 0° (bottom) to 270° (3/4 circle)
  // Start at -135° (left) and go to 135° (right) for better visual
  // Actually, for 270° design: -135° to 135° (270 degrees total)
  return -135 + normalized * 270;
}

/**
 * Detect speed change direction
 * @param prevSpeed Previous speed value
 * @param currentSpeed Current speed value
 * @param threshold Minimum change to detect (default: 0.1)
 * @returns Direction of speed change
 */
export function detectSpeedChange(
  prevSpeed: number,
  currentSpeed: number,
  threshold: number = 0.1
): SpeedChangeDirection {
  const diff = currentSpeed - prevSpeed;

  if (Math.abs(diff) < threshold) {
    return "stable";
  }

  return diff > 0 ? "accelerating" : "decelerating";
}

/**
 * Get Tailwind CSS color class based on speed (matching FlightDashboard color logic)
 * @param speed Current speed value
 * @param minSpeed Minimum speed (default: MIN_SPEED)
 * @param maxSpeed Maximum speed (default: MAX_SPEED)
 * @returns Tailwind CSS color class
 */
export function getSpeedColor(
  speed: number,
  minSpeed: number = MIN_SPEED,
  maxSpeed: number = MAX_SPEED
): string {
  // Match FlightDashboard logic: >150 = red, >80 = amber, else white
  if (speed > 150) {
    return "text-red-400";
  } else if (speed > 80) {
    return "text-amber-400";
  }
  return "text-white";
}

/**
 * Get actual color value (hex) based on speed for use in SVG
 * @param speed Current speed value
 * @param minSpeed Minimum speed (default: MIN_SPEED)
 * @param maxSpeed Maximum speed (default: MAX_SPEED)
 * @returns Hex color string
 */
export function getSpeedColorValue(
  speed: number,
  minSpeed: number = MIN_SPEED,
  maxSpeed: number = MAX_SPEED
): string {
  // Match FlightDashboard logic: >150 = red, >80 = amber, else white
  if (speed > 150) {
    return "#f87171"; // red-400
  } else if (speed > 80) {
    return "#fbbf24"; // amber-400
  }
  return "#ffffff"; // white
}

/**
 * Get spring animation config based on speed change direction
 * @param direction Speed change direction
 * @returns Spring configuration for framer-motion
 */
export function getSpringConfig(direction: SpeedChangeDirection): {
  stiffness: number;
  damping: number;
  mass: number;
} {
  switch (direction) {
    case "accelerating":
      // Higher stiffness, lower damping for quick response
      return {
        stiffness: 150,
        damping: 20,
        mass: 1,
      };
    case "decelerating":
      // Lower stiffness, higher damping for smooth deceleration
      return {
        stiffness: 80,
        damping: 30,
        mass: 1,
      };
    case "stable":
    default:
      // Balanced config for stable speed
      return {
        stiffness: 120,
        damping: 25,
        mass: 1,
      };
  }
}

/**
 * Generate speed marks for the speedometer
 * @param minSpeed Minimum speed
 * @param maxSpeed Maximum speed
 * @param interval Interval between marks (default: 50)
 * @returns Array of speed values for marks
 */
export function generateSpeedMarks(
  minSpeed: number = MIN_SPEED,
  maxSpeed: number = MAX_SPEED,
  interval: number = 10
): number[] {
  const marks: number[] = [];
  for (let speed = minSpeed; speed <= maxSpeed; speed += interval) {
    marks.push(speed);
  }
  return marks;
}
