/**
 * Flight Library
 * Constants and utility functions for flight mechanics
 * 
 * Supports three movement modes:
 * 1. "elytra" - Flight sim/Minecraft Elytra mechanics with pitch, bank, gravity
 * 2. "simple" - Simple WASD XYZ movement like first-person games
 * 3. "globe" - Globe mode for Google 3D Tiles; based on "elytra" mode with ECEF support
 */

export type MovementMode = "elytra" | "simple" | "globe";

export const BASE_SPEED = 60;
export const MIN_SPEED = 20;
export const MAX_SPEED = 300;
export const BOOST_IMPULSE = 80;
export const GRAVITY_ACCEL = 50;
export const GRAVITY_DECEL = 35;
export const DRAG = 0.985;

export const PITCH_SPEED_MIN = 0.3;
export const PITCH_SPEED_MAX = 2.0;
export const BANK_SPEED_MIN = 0.4;
export const BANK_SPEED_MAX = 2.5;
export const TURN_FROM_BANK = 1.2;

export const RAMP_UP_TIME = 0.8;
export const INPUT_SMOOTHING = 6.0;
export const ROTATION_SMOOTHING = 5.0;
export const BANK_RECOVERY_SMOOTHING = 3.0;

export const MAX_PITCH = Math.PI / 4;
export const MAX_BANK = Math.PI / 3.5;

export const SIMPLE_MOVE_SPEED = 100;
export const SIMPLE_SPRINT_MULTIPLIER = 2.0;
export const SIMPLE_LOOK_SPEED = 0.003;
export const SIMPLE_VERTICAL_SPEED = 80;

export const DEFAULT_MIN_HEIGHT = 0;
export const DEFAULT_MAX_HEIGHT = 10000;
export const DEFAULT_MIN_PITCH = -Math.PI / 2;
export const DEFAULT_MAX_PITCH_SIMPLE = Math.PI / 2;

export const FLY_TO_DURATION = 1.5; // seconds
export const FLY_TO_EASE = 0.05; // smoothing factor

export const GYRO_SENSITIVITY_DEFAULT = 0.3; // lower = less aggressive
export const GYRO_SMOOTHING = 8.0;
export const GYRO_DEAD_ZONE = 3.0; // degrees

export const GLOBE_BASE_SPEED = 100; // m/s (~360 km/h like a small plane)
export const GLOBE_MIN_SPEED = 20; // m/s
export const GLOBE_MAX_SPEED = 500; // m/s (~1800 km/h)
export const GLOBE_BOOST_IMPULSE = 150; // m/s
export const GLOBE_MIN_ALTITUDE = 50; // meters above ground
export const GLOBE_MAX_ALTITUDE = 5000; // meters above ground
export const GLOBE_GRAVITY_ACCEL = 30; // m/s² when diving
export const GLOBE_GRAVITY_DECEL = 20; // m/s² when climbing

export const EARTH_RADIUS = 6378137; // WGS84 equatorial radius in meters

/**
 * Exponential damping function for smooth interpolation
 * @param current Current value
 * @param target Target value
 * @param smoothing Smoothing factor (higher = faster)
 * @param dt Delta time in seconds
 * @returns Interpolated value
 */
export function damp(current: number, target: number, smoothing: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-smoothing * dt));
}

/**
 * Ease in-out quadratic function for smooth acceleration/deceleration
 * @param t Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export interface FlightKeyState {
  pitchDown: boolean;
  pitchUp: boolean;
  bankLeft: boolean;
  bankRight: boolean;
  boost: boolean;
  freeze: boolean;
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  sprint: boolean;
}

export interface FlightConfig {
  mode?: MovementMode;

  baseSpeed?: number;
  minSpeed?: number;
  maxSpeed?: number;
  boostImpulse?: number;
  gravityAccel?: number;
  gravityDecel?: number;
  drag?: number;
  pitchSpeedMin?: number;
  pitchSpeedMax?: number;
  bankSpeedMin?: number;
  bankSpeedMax?: number;
  turnFromBank?: number;
  rampUpTime?: number;
  inputSmoothing?: number;
  rotationSmoothing?: number;
  bankRecoverySmoothing?: number;
  maxPitch?: number;
  maxBank?: number;

  simpleMoveSpeed?: number;
  simpleSprintMultiplier?: number;
  simpleLookSpeed?: number;
  simpleVerticalSpeed?: number;

  minHeight?: number;
  maxHeight?: number;
  enableBounds?: boolean;

  enableMouseLook?: boolean;
  mouseSensitivity?: number;
  invertMouseY?: boolean;

  enableGyroscope?: boolean;
  gyroSensitivity?: number;
  gyroSmoothing?: number;
  gyroDeadZone?: number;
  invertGyroPitch?: boolean;
  invertGyroYaw?: boolean;

  toggleModeKey?: string;

  globeBaseSpeed?: number;
  globeMinSpeed?: number;
  globeMaxSpeed?: number;
  globeBoostImpulse?: number;
  globeMinAltitude?: number;
  globeMaxAltitude?: number;
  globeGravityAccel?: number;
  globeGravityDecel?: number;
}

/**
 * Create flight config with defaults
 * @param overrides Override values for the config
 * @returns The flight config
 */
export function createFlightConfig(overrides: FlightConfig = {}): Required<FlightConfig> {
  return {
    mode: overrides.mode ?? "elytra",

    baseSpeed: overrides.baseSpeed ?? BASE_SPEED,
    minSpeed: overrides.minSpeed ?? MIN_SPEED,
    maxSpeed: overrides.maxSpeed ?? MAX_SPEED,
    boostImpulse: overrides.boostImpulse ?? BOOST_IMPULSE,
    gravityAccel: overrides.gravityAccel ?? GRAVITY_ACCEL,
    gravityDecel: overrides.gravityDecel ?? GRAVITY_DECEL,
    drag: overrides.drag ?? DRAG,
    pitchSpeedMin: overrides.pitchSpeedMin ?? PITCH_SPEED_MIN,
    pitchSpeedMax: overrides.pitchSpeedMax ?? PITCH_SPEED_MAX,
    bankSpeedMin: overrides.bankSpeedMin ?? BANK_SPEED_MIN,
    bankSpeedMax: overrides.bankSpeedMax ?? BANK_SPEED_MAX,
    turnFromBank: overrides.turnFromBank ?? TURN_FROM_BANK,
    rampUpTime: overrides.rampUpTime ?? RAMP_UP_TIME,
    inputSmoothing: overrides.inputSmoothing ?? INPUT_SMOOTHING,
    rotationSmoothing: overrides.rotationSmoothing ?? ROTATION_SMOOTHING,
    bankRecoverySmoothing: overrides.bankRecoverySmoothing ?? BANK_RECOVERY_SMOOTHING,
    maxPitch: overrides.maxPitch ?? MAX_PITCH,
    maxBank: overrides.maxBank ?? MAX_BANK,

    simpleMoveSpeed: overrides.simpleMoveSpeed ?? SIMPLE_MOVE_SPEED,
    simpleSprintMultiplier: overrides.simpleSprintMultiplier ?? SIMPLE_SPRINT_MULTIPLIER,
    simpleLookSpeed: overrides.simpleLookSpeed ?? SIMPLE_LOOK_SPEED,
    simpleVerticalSpeed: overrides.simpleVerticalSpeed ?? SIMPLE_VERTICAL_SPEED,

    minHeight: overrides.minHeight ?? DEFAULT_MIN_HEIGHT,
    maxHeight: overrides.maxHeight ?? DEFAULT_MAX_HEIGHT,
    enableBounds: overrides.enableBounds ?? false,

    enableMouseLook: overrides.enableMouseLook ?? true,
    mouseSensitivity: overrides.mouseSensitivity ?? SIMPLE_LOOK_SPEED,
    invertMouseY: overrides.invertMouseY ?? false,

    enableGyroscope: overrides.enableGyroscope ?? true,
    gyroSensitivity: overrides.gyroSensitivity ?? GYRO_SENSITIVITY_DEFAULT,
    gyroSmoothing: overrides.gyroSmoothing ?? GYRO_SMOOTHING,
    gyroDeadZone: overrides.gyroDeadZone ?? GYRO_DEAD_ZONE,
    invertGyroPitch: overrides.invertGyroPitch ?? false,
    invertGyroYaw: overrides.invertGyroYaw ?? false,

    toggleModeKey: overrides.toggleModeKey ?? "KeyM",

    globeBaseSpeed: overrides.globeBaseSpeed ?? GLOBE_BASE_SPEED,
    globeMinSpeed: overrides.globeMinSpeed ?? GLOBE_MIN_SPEED,
    globeMaxSpeed: overrides.globeMaxSpeed ?? GLOBE_MAX_SPEED,
    globeBoostImpulse: overrides.globeBoostImpulse ?? GLOBE_BOOST_IMPULSE,
    globeMinAltitude: overrides.globeMinAltitude ?? GLOBE_MIN_ALTITUDE,
    globeMaxAltitude: overrides.globeMaxAltitude ?? GLOBE_MAX_ALTITUDE,
    globeGravityAccel: overrides.globeGravityAccel ?? GLOBE_GRAVITY_ACCEL,
    globeGravityDecel: overrides.globeGravityDecel ?? GLOBE_GRAVITY_DECEL,
  };
}

export interface FlyToTarget {
  position: [number, number, number];
  lookAt?: [number, number, number];
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function isGyroscopeAvailable(): boolean {
  if (typeof window === "undefined") return false;
  if (!("DeviceOrientationEvent" in window)) return false;
  
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isChrome = /CriOS/.test(ua);
  
  if (isIOS && isChrome) {
    return false;
  }
  
  return true;
}

export function isGyroscopePermissionRequired(): boolean {
  if (typeof window === "undefined") return false;
  const DeviceOrientationEvent = window.DeviceOrientationEvent as any;
  return typeof DeviceOrientationEvent?.requestPermission === "function";
}

export function isSafariBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
}

export async function requestGyroscopePermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isChrome = /CriOS/.test(ua);
  
  if (isIOS && isChrome) {
    return false;
  }

  const DeviceOrientationEvent = window.DeviceOrientationEvent as any;
  if (typeof DeviceOrientationEvent?.requestPermission === "function") {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  }

  return isGyroscopeAvailable();
}

export function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

