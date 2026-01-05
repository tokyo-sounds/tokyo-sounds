/**
 * Pose to Flight Control Mapping
 *
 * Converts MediaPipe Pose landmarks into flight control signals.
 * Maps body posture to pitch, bank, and boost controls.
 *
 * Control mapping:
 * - Arms UP (Y pose) → Pitch UP (climb)
 * - Arms DOWN (inverted Y) → Pitch DOWN (dive)
 * - Lean shoulders left/right → Bank left/right
 * - Both hands FORWARD (in front of body) → Boost
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// Connections for drawing the skeleton
export const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // Left arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  // Right arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  // Left leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  // Right leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  // Face
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.RIGHT_EAR, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.MOUTH_LEFT, POSE_LANDMARKS.MOUTH_RIGHT],
];

/**
 * Configuration for pose-to-flight control mapping
 */
export interface PoseFlightConfig {
  // Pitch control (arm angle up/down)
  pitchSensitivity: number; // Multiplier for pitch response (default: 1.0)
  pitchDeadZone: number; // Ignore arm angles in neutral zone (0-1, default: 0.15)
  invertPitch: boolean; // Swap up/down (default: false)
  pitchMaxAngle: number; // Degrees from horizontal for full pitch (default: 60)

  // Bank control (shoulder tilt)
  bankSensitivity: number; // Multiplier for bank response (default: 0.8)
  bankDeadZone: number; // Ignore tilt angles below this (0-1, default: 0.25)
  invertBank: boolean; // Swap left/right (default: false)
  bankMaxTilt: number; // Max shoulder tilt ratio for full bank (default: 0.4)

  // Boost control (hands forward at chest level)
  boostZThreshold: number; // How far forward hands must be (Z difference, default: 0.08)
  boostMinConfidence: number; // Minimum wrist visibility for boost detection (default: 0.5)
  boostPitchDamping: number; // How much to reduce pitch when boosting (0-1, default: 0.1)

  // Smoothing - higher = smoother but laggier
  smoothingFactor: number; // 0-1 (default: 0.7)
  
  // Additional smoothing for output ramping
  outputSmoothing: number; // 0-1, smooths final output (default: 0.85)

  // Confidence threshold
  minConfidence: number; // Minimum visibility to use a landmark (0-1, default: 0.5)
}

/**
 * Processed flight control input from pose detection
 */
export interface PoseFlightInput {
  pitch: number; // -1 to 1 (negative = dive, positive = climb)
  bank: number; // -1 to 1 (negative = left, positive = right)
  boost: boolean; // Hands forward detected
  confidence: number; // 0-1, overall detection confidence
  raw: {
    // Raw values before processing (for debugging)
    shoulderTilt: number;
    avgArmAngle: number; // Average arm angle from horizontal (positive = up)
    handsForwardZ: number; // Average Z difference of hands vs shoulders
    handsAtChestLevel: boolean; // Whether hands are near chest/shoulder height
    handsCloseToTorso: boolean; // Whether hands are close together near body center
    boostAmount: number; // 0-1, how much boost is being applied
  };
}

/**
 * Model variants available for pose detection
 */
export type PoseModelVariant = "lite" | "full" | "heavy";

/**
 * Model URLs for different variants
 */
export const POSE_MODEL_URLS: Record<PoseModelVariant, string> = {
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  heavy:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
};

/**
 * Default configuration for pose-to-flight mapping
 * Tuned for gradual, proportional control
 */
export const DEFAULT_POSE_FLIGHT_CONFIG: PoseFlightConfig = {
  pitchSensitivity: 1.0,
  pitchDeadZone: 0.2, // 20% dead zone around neutral
  invertPitch: false,
  pitchMaxAngle: 50, // Degrees from horizontal for full pitch

  bankSensitivity: 0.7, // Reduced - was way too sensitive
  bankDeadZone: 0.25, // 25% dead zone - ignore small tilts
  invertBank: false,
  bankMaxTilt: 0.5, // Shoulder tilt ratio for full bank (need significant lean)

  boostZThreshold: 0.06, // Hands need to be this far forward (normalized Z)
  boostMinConfidence: 0.5,
  boostPitchDamping: 0.1, // When boosting, pitch is reduced to 10% sensitivity

  smoothingFactor: 0.75, // High smoothing for gradual response
  outputSmoothing: 0.88, // Additional output smoothing

  minConfidence: 0.5,
};

/**
 * Create a pose flight config with optional overrides
 */
export function createPoseFlightConfig(
  overrides?: Partial<PoseFlightConfig>
): PoseFlightConfig {
  return { ...DEFAULT_POSE_FLIGHT_CONFIG, ...overrides };
}

/**
 * Get a landmark if it meets the minimum confidence threshold
 */
function getLandmark(
  landmarks: NormalizedLandmark[],
  index: number,
  minConfidence: number
): NormalizedLandmark | null {
  const landmark = landmarks[index];
  if (!landmark) return null;

  const visibility = landmark.visibility ?? 1.0;
  if (visibility < minConfidence) return null;

  return landmark;
}

/**
 * Calculate distance between two points (2D)
 */
function getDistance2D(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Apply dead zone with smooth transition
 * Returns 0 within dead zone, then smoothly ramps up
 */
function applyDeadZone(value: number, deadZone: number): number {
  const absValue = Math.abs(value);
  if (absValue < deadZone) return 0;
  
  // Smooth ramp after dead zone using smoothstep-like function
  const normalized = (absValue - deadZone) / (1 - deadZone);
  // Apply slight curve for more natural feel
  const curved = normalized * normalized * (3 - 2 * normalized); // smoothstep
  return Math.sign(value) * curved;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number = -1, max: number = 1): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Smooth interpolation (exponential moving average)
 */
function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * (1 - factor);
}

/**
 * Calculate angle of arm from horizontal (in degrees)
 * Positive = arm pointing up, Negative = arm pointing down
 */
function calculateArmAngle(
  shoulder: NormalizedLandmark,
  elbow: NormalizedLandmark,
  wrist: NormalizedLandmark
): number {
  // Use wrist position relative to shoulder
  // In normalized coords: Y increases downward
  const dy = shoulder.y - wrist.y; // Positive when wrist is above shoulder
  const dx = Math.abs(wrist.x - shoulder.x); // Horizontal distance
  
  // Calculate angle from horizontal
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);
  
  return angleDeg; // Positive = up, Negative = down
}

/**
 * Previous values for smoothing (module-level state)
 */
let prevPitch = 0;
let prevBank = 0;
let prevOutputPitch = 0;
let prevOutputBank = 0;
let prevBoostAmount = 0;
let boostDebounceFrames = 0;

/**
 * Calculate flight control input from pose landmarks
 *
 * Control scheme:
 * - Arms UP (Y pose) → Pitch UP (climb)
 * - Arms DOWN (inverted Y) → Pitch DOWN (dive)
 * - Shoulder tilt left/right → Bank left/right
 * - Both hands FORWARD → Boost
 *
 * @param landmarks - Array of 33 pose landmarks from MediaPipe
 * @param config - Configuration for control mapping
 * @returns Flight control input values
 */
export function calculatePoseFlightInput(
  landmarks: NormalizedLandmark[],
  config: PoseFlightConfig = DEFAULT_POSE_FLIGHT_CONFIG
): PoseFlightInput {
  // Default output for invalid input
  const defaultOutput: PoseFlightInput = {
    pitch: prevOutputPitch * 0.9, // Gradually return to neutral
    bank: prevOutputBank * 0.9,
    boost: false,
    confidence: 0,
    raw: { shoulderTilt: 0, avgArmAngle: 0, handsForwardZ: 0, handsAtChestLevel: false, handsCloseToTorso: false, boostAmount: 0 },
  };

  if (!landmarks || landmarks.length < 33) {
    prevOutputPitch *= 0.9;
    prevOutputBank *= 0.9;
    return defaultOutput;
  }

  // Get key landmarks
  const leftShoulder = getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER, config.minConfidence);
  const rightShoulder = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_SHOULDER, config.minConfidence);
  const leftElbow = getLandmark(landmarks, POSE_LANDMARKS.LEFT_ELBOW, config.minConfidence);
  const rightElbow = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_ELBOW, config.minConfidence);
  const leftWrist = getLandmark(landmarks, POSE_LANDMARKS.LEFT_WRIST, config.minConfidence);
  const rightWrist = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_WRIST, config.minConfidence);
  const leftHip = getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP, config.minConfidence);
  const rightHip = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_HIP, config.minConfidence);

  // Need at least shoulders for basic controls
  if (!leftShoulder || !rightShoulder) {
    prevOutputPitch *= 0.9;
    prevOutputBank *= 0.9;
    return defaultOutput;
  }

  // Calculate confidence as average visibility of key landmarks
  const keyLandmarks = [
    leftShoulder, rightShoulder,
    leftElbow, rightElbow,
    leftWrist, rightWrist,
    leftHip, rightHip,
  ].filter(Boolean) as NormalizedLandmark[];
  
  const confidence =
    keyLandmarks.reduce((sum, l) => sum + (l.visibility ?? 1), 0) / keyLandmarks.length;

  // === BOOST DETECTION (Hands Forward, Close to Torso, at Chest Level) ===
  // Detect this FIRST because it affects pitch sensitivity
  // T-pose (arms out) should be NEUTRAL - no boost
  // Boost only when hands are brought IN FRONT of body, close together
  const shoulderWidth = getDistance2D(leftShoulder, rightShoulder);
  const shoulderAvgX = (leftShoulder.x + rightShoulder.x) / 2; // Center of torso
  const shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderAvgZ = (leftShoulder.z + rightShoulder.z) / 2;
  
  let handsForwardZ = 0;
  let handsAtChestLevel = false;
  let handsCloseToTorso = false;
  let boostAmount = 0; // 0-1, smooth boost factor
  let boost = false;

  if (leftWrist && rightWrist) {
    const leftWristVis = leftWrist.visibility ?? 0;
    const rightWristVis = rightWrist.visibility ?? 0;
    
    if (leftWristVis >= config.boostMinConfidence && rightWristVis >= config.boostMinConfidence) {
      const wristAvgX = (leftWrist.x + rightWrist.x) / 2;
      const wristAvgY = (leftWrist.y + rightWrist.y) / 2;
      const wristAvgZ = (leftWrist.z + rightWrist.z) / 2;
      
      // Positive = hands are forward of shoulders (smaller Z = closer to camera)
      handsForwardZ = shoulderAvgZ - wristAvgZ;
      
      // Check if hands are at chest/shoulder level (not raised up or down)
      // Allow hands to be anywhere from shoulder level to slightly below (chest)
      const verticalOffset = wristAvgY - shoulderAvgY; // Positive = hands below shoulders
      handsAtChestLevel = verticalOffset > -0.05 && verticalOffset < shoulderWidth * 0.5;
      
      // Check if hands are close together horizontally (NOT spread out like T-pose)
      // Wrists should be within ~60% of shoulder width of each other
      const wristDistance = Math.abs(leftWrist.x - rightWrist.x);
      const handsCloseTogether = wristDistance < shoulderWidth * 0.7;
      
      // Check if hands are near the center of torso (not out to the sides)
      // Wrist center should be close to shoulder center
      const horizontalOffsetFromCenter = Math.abs(wristAvgX - shoulderAvgX);
      const handsNearCenter = horizontalOffsetFromCenter < shoulderWidth * 0.3;
      
      // Combined check: hands must be close together AND near body center
      handsCloseToTorso = handsCloseTogether && handsNearCenter;
      
      // Boost when:
      // 1. Hands are forward (Z threshold)
      // 2. Hands are at chest/shoulder level (not raised for pitch control)
      // 3. Hands are close to torso center (not spread out like T-pose)
      const forwardEnough = handsForwardZ > config.boostZThreshold;
      const boostDetected = forwardEnough && handsAtChestLevel && handsCloseToTorso;
      
      // Smooth boost amount for gradual pitch damping
      if (boostDetected) {
        // Calculate how much boost based on how far forward
        const forwardRatio = Math.min(1, (handsForwardZ - config.boostZThreshold) / 0.1);
        boostAmount = Math.min(1, prevBoostAmount + 0.15); // Ramp up
        boostAmount = Math.max(boostAmount, forwardRatio * 0.5); // At least proportional to forward
      } else {
        boostAmount = Math.max(0, prevBoostAmount - 0.1); // Ramp down
      }
      
      // Debounce boost boolean to prevent flickering
      if (boostDetected) {
        boostDebounceFrames = Math.min(boostDebounceFrames + 1, 5);
      } else {
        boostDebounceFrames = Math.max(boostDebounceFrames - 1, 0);
      }
      
      boost = boostDebounceFrames >= 2; // Need 2 consecutive frames
    }
  }
  
  // Store for next frame
  prevBoostAmount = boostAmount;

  // === BANK (Shoulder Tilt) ===
  // Positive tilt = right shoulder lower = bank right
  // Use bankMaxTilt to scale - need significant lean for full bank
  const shoulderTilt = (rightShoulder.y - leftShoulder.y) / Math.max(shoulderWidth, 0.1);
  
  // Scale by max tilt - so tilt of bankMaxTilt = full bank
  let rawBank = (shoulderTilt / config.bankMaxTilt) * config.bankSensitivity;
  rawBank = applyDeadZone(rawBank, config.bankDeadZone);
  rawBank = clamp(rawBank);
  if (config.invertBank) rawBank = -rawBank;

  // === PITCH (Arm Angle - Y pose / Inverted Y) ===
  let avgArmAngle = 0;
  let armCount = 0;

  // Calculate left arm angle
  if (leftShoulder && leftElbow && leftWrist) {
    const leftAngle = calculateArmAngle(leftShoulder, leftElbow, leftWrist);
    avgArmAngle += leftAngle;
    armCount++;
  }

  // Calculate right arm angle
  if (rightShoulder && rightElbow && rightWrist) {
    const rightAngle = calculateArmAngle(rightShoulder, rightElbow, rightWrist);
    avgArmAngle += rightAngle;
    armCount++;
  }

  if (armCount > 0) {
    avgArmAngle /= armCount;
  }

  // Convert arm angle to pitch (-1 to 1)
  // At pitchMaxAngle degrees up = full pitch up (+1)
  // At pitchMaxAngle degrees down = full pitch down (-1)
  let rawPitch = (avgArmAngle / config.pitchMaxAngle) * config.pitchSensitivity;
  rawPitch = applyDeadZone(rawPitch, config.pitchDeadZone);
  rawPitch = clamp(rawPitch);
  if (config.invertPitch) rawPitch = -rawPitch;
  
  // When boosting (hands forward at chest), greatly reduce pitch sensitivity
  // This prevents the twitchy pitch when trying to boost
  if (boostAmount > 0) {
    const pitchDamping = 1 - (boostAmount * (1 - config.boostPitchDamping));
    rawPitch *= pitchDamping;
  }

  // === SMOOTHING ===
  // First stage: smooth the raw input
  const smoothedPitch = lerp(prevPitch, rawPitch, config.smoothingFactor);
  const smoothedBank = lerp(prevBank, rawBank, config.smoothingFactor);
  
  prevPitch = smoothedPitch;
  prevBank = smoothedBank;

  // Second stage: additional output smoothing for even more gradual response
  const outputPitch = lerp(prevOutputPitch, smoothedPitch, config.outputSmoothing);
  const outputBank = lerp(prevOutputBank, smoothedBank, config.outputSmoothing);
  
  prevOutputPitch = outputPitch;
  prevOutputBank = outputBank;

  return {
    pitch: outputPitch,
    bank: outputBank,
    boost,
    confidence,
    raw: {
      shoulderTilt,
      avgArmAngle,
      handsForwardZ,
      handsAtChestLevel,
      handsCloseToTorso,
      boostAmount,
    },
  };
}

/**
 * Reset smoothing state (call when deactivating pose controls)
 */
export function resetPoseSmoothing(): void {
  prevPitch = 0;
  prevBank = 0;
  prevOutputPitch = 0;
  prevOutputBank = 0;
  prevBoostAmount = 0;
  boostDebounceFrames = 0;
}
