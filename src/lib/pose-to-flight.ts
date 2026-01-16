/**
 * Pose to Flight Control Mapping
 *
 * Converts MediaPipe Pose landmarks into flight control signals.
 * Uses intuitive body-as-airplane control scheme.
 *
 * Control mapping:
 * - PITCH: Average arm angle from horizontal
 *   - Both arms UP → Pitch UP (climb)
 *   - Both arms DOWN → Pitch DOWN (dive)
 *   - Arms horizontal → Neutral
 * 
 * - BANK: Angle of the line from left wrist to right wrist
 *   - Right hand higher (tilt arms OR lean torso) → Bank RIGHT
 *   - Left hand higher → Bank LEFT
 *   - Hands level → Neutral
 * 
 * - BOOST: Both hands FORWARD at chest level
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
  // Pitch control (average arm angle from horizontal)
  pitchSensitivity: number; // Multiplier for pitch response (default: 1.0)
  pitchDeadZone: number; // Degrees of dead zone around neutral (default: 5)
  invertPitch: boolean; // Swap up/down (default: false)
  pitchMaxAngle: number; // Degrees from horizontal for full pitch (default: 45)

  // Bank control (angle of line from left wrist to right wrist)
  // Works with arm tilt, torso lean, or both combined
  bankSensitivity: number; // Multiplier for bank response (default: 1.0)
  bankDeadZone: number; // Degrees of dead zone around level (default: 5)
  invertBank: boolean; // Swap left/right (default: false)
  bankMaxAngle: number; // Degrees of tilt for full bank (default: 30)

  // Boost control (hands forward at chest level)
  boostZThreshold: number; // How far forward hands must be (Z difference, default: 0.05)
  boostMinConfidence: number; // Minimum wrist visibility for boost detection (default: 0.5)
  boostPitchDamping: number; // Pitch multiplier when boosting, 1.0 = no damping (default: 0.5)

  // Smoothing - lower = more responsive, higher = smoother
  // At 30fps with factor 0.3: reaches 90% of target in ~3 frames (~100ms)
  smoothingFactor: number; // 0-1, portion of previous value to keep (default: 0.3)

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
  freezeToggle: boolean; // TRUE only on the frame when freeze should toggle (edge-triggered event)
  confidence: number; // 0-1, overall detection confidence
  raw: {
    // Raw values before processing (for debugging)
    shoulderTilt: number;
    avgArmAngle: number; // Average arm angle from horizontal (positive = up)
    handsForwardZ: number; // Average Z difference of hands vs shoulders
    handsAtChestLevel: boolean; // Whether hands are near chest/shoulder height
    handsCloseToTorso: boolean; // Whether hands are close together near body center
    boostAmount: number; // 0-1, how much boost is being applied
    handsOverhead: boolean; // Whether hands are raised overhead (freeze gesture)
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
 * 
 * Tuned for 1:1, natural body control:
 * - Tilt the line between your hands (via arm tilt OR torso lean) = bank
 * - Raise/lower both arms = pitch
 * - 30° tilt = full bank, 45° arm angle = full pitch
 * - 5° dead zones filter noise without feeling unresponsive
 * - Low smoothing factor (0.3) for responsive, direct control
 */
export const DEFAULT_POSE_FLIGHT_CONFIG: PoseFlightConfig = {
  // Pitch: average arm angle from horizontal
  // Both arms 45° up = full pitch up, both arms 45° down = full pitch down
  pitchSensitivity: 1.0,
  pitchDeadZone: 5, // 5° dead zone
  invertPitch: false,
  pitchMaxAngle: 45, // 45° = full pitch

  // Bank: angle of wrist-to-wrist line
  // Direct 1:1 mapping: your lean angle = plane's bank angle
  // A 30° lean gives 30° equivalent bank (normalized to -1 to 1 range)
  bankSensitivity: 1.0,
  bankDeadZone: 3, // Small dead zone just for noise filtering
  invertBank: true, // Inverted for natural feel with mirrored video
  bankMaxAngle: 60, // 60° = full bank (but you'll rarely lean this far, so it's effectively 1:1)

  // Boost: hands forward at chest level
  boostZThreshold: 0.08, // Moderate threshold - hands clearly forward but not extreme
  boostMinConfidence: 0.5,
  boostPitchDamping: 0.5,

  // Smoothing: responsive but not twitchy
  smoothingFactor: 0.3, // 70% of new value per frame

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
 * Apply dead zone with linear ramp-out
 * Returns 0 within dead zone, then linear mapping to remaining range
 * 
 * @param angleDegrees - The input angle in degrees
 * @param deadZoneDegrees - Dead zone size in degrees
 * @param maxAngleDegrees - Maximum angle for full output
 * @returns Value from -1 to 1
 */
function applyDeadZoneLinear(
  angleDegrees: number,
  deadZoneDegrees: number,
  maxAngleDegrees: number
): number {
  const absAngle = Math.abs(angleDegrees);
  
  // Inside dead zone = zero output
  if (absAngle <= deadZoneDegrees) return 0;
  
  // Linear mapping from dead zone edge to max angle
  // e.g., if deadZone=5° and maxAngle=30°, then:
  //   5° → 0, 17.5° → 0.5, 30° → 1.0
  const angleAfterDeadZone = absAngle - deadZoneDegrees;
  const rangeAfterDeadZone = maxAngleDegrees - deadZoneDegrees;
  
  const normalized = angleAfterDeadZone / rangeAfterDeadZone;
  return Math.sign(angleDegrees) * Math.min(normalized, 1);
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number = -1, max: number = 1): number {
  return Math.max(min, Math.min(max, value));
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
 * Single-stage smoothing for responsive 1:1 control
 */
let prevPitch = 0;
let prevBank = 0;
let prevBoostAmount = 0;
let boostDebounceFrames = 0;

// Freeze state (hands overhead toggle - runway marshaller "stop" signal)
let handsOverheadHoldFrames = 0; // How many consecutive frames hands have been overhead
let handsNotOverheadFrames = 0; // How many consecutive frames hands have NOT been overhead
let freezeToggleFired = false; // TRUE after toggle fires, must exit pose to reset
const FREEZE_HOLD_THRESHOLD = 8; // Require ~0.27s hold at 30fps before triggering
const FREEZE_EXIT_THRESHOLD = 15; // Require ~0.5s OUT of pose before allowing re-trigger

/**
 * Reusable output object to avoid GC pressure
 * We mutate this object each frame instead of creating new ones
 */
const outputBuffer: PoseFlightInput = {
  pitch: 0,
  bank: 0,
  boost: false,
  freezeToggle: false,
  confidence: 0,
  raw: {
    shoulderTilt: 0,
    avgArmAngle: 0,
    handsForwardZ: 0,
    handsAtChestLevel: false,
    handsCloseToTorso: false,
    boostAmount: 0,
    handsOverhead: false,
  },
};

/**
 * Calibration state for adaptive dead zones
 * Measures jitter during first ~1 second to set appropriate dead zones
 */
interface CalibrationState {
  isCalibrating: boolean;
  isCalibrated: boolean;
  frameCount: number;
  maxFrames: number; // ~30 frames at 30fps = 1 second
  
  // Samples for measuring noise
  bankSamples: number[];
  pitchSamples: number[];
  
  // Calculated adaptive dead zones (in degrees)
  adaptiveBankDeadZone: number;
  adaptivePitchDeadZone: number;
  
  // Baseline values (user's natural "neutral" position)
  baselineBank: number;
  baselinePitch: number;
}

let calibration: CalibrationState = {
  isCalibrating: false,
  isCalibrated: false,
  frameCount: 0,
  maxFrames: 30,
  bankSamples: [],
  pitchSamples: [],
  adaptiveBankDeadZone: 5,
  adaptivePitchDeadZone: 5,
  baselineBank: 0,
  baselinePitch: 0,
};

/**
 * Start calibration process
 * Call this when pose control is activated
 */
export function startCalibration(): void {
  calibration = {
    isCalibrating: true,
    isCalibrated: false,
    frameCount: 0,
    maxFrames: 30,
    bankSamples: [],
    pitchSamples: [],
    adaptiveBankDeadZone: 5,
    adaptivePitchDeadZone: 5,
    baselineBank: 0,
    baselinePitch: 0,
  };
}

/**
 * Reusable calibration status object to avoid GC pressure
 */
const calibrationStatusBuffer = {
  isCalibrating: false,
  isCalibrated: false,
  progress: 0,
  adaptiveDeadZones: { bank: 5, pitch: 5 },
};

/**
 * Get current calibration status
 * Returns a cached object - only values are updated, not the reference
 */
export function getCalibrationStatus(): {
  isCalibrating: boolean;
  isCalibrated: boolean;
  progress: number;
  adaptiveDeadZones: { bank: number; pitch: number };
} {
  calibrationStatusBuffer.isCalibrating = calibration.isCalibrating;
  calibrationStatusBuffer.isCalibrated = calibration.isCalibrated;
  calibrationStatusBuffer.progress = calibration.frameCount / calibration.maxFrames;
  calibrationStatusBuffer.adaptiveDeadZones.bank = calibration.adaptiveBankDeadZone;
  calibrationStatusBuffer.adaptiveDeadZones.pitch = calibration.adaptivePitchDeadZone;
  return calibrationStatusBuffer;
}

/**
 * Calculate standard deviation using Welford's online algorithm
 * Single-pass, no intermediate arrays, numerically stable
 */
function standardDeviation(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  
  let mean = 0;
  let m2 = 0;
  
  for (let i = 0; i < n; i++) {
    const delta = values[i] - mean;
    mean += delta / (i + 1);
    const delta2 = values[i] - mean;
    m2 += delta * delta2;
  }
  
  return Math.sqrt(m2 / n);
}

/**
 * Process calibration frame
 * Returns true if still calibrating, false when done
 */
function processCalibration(rawBankAngle: number, rawPitchAngle: number, config: PoseFlightConfig): boolean {
  if (!calibration.isCalibrating) return false;
  
  calibration.bankSamples.push(rawBankAngle);
  calibration.pitchSamples.push(rawPitchAngle);
  calibration.frameCount++;
  
  if (calibration.frameCount >= calibration.maxFrames) {
    // Calibration complete - calculate adaptive dead zones
    
    // Calculate baseline (average position = user's neutral)
    calibration.baselineBank = calibration.bankSamples.reduce((a, b) => a + b, 0) / calibration.bankSamples.length;
    calibration.baselinePitch = calibration.pitchSamples.reduce((a, b) => a + b, 0) / calibration.pitchSamples.length;
    
    // Calculate noise as standard deviation
    const bankNoise = standardDeviation(calibration.bankSamples);
    const pitchNoise = standardDeviation(calibration.pitchSamples);
    
    // Set dead zone to 2.5x the noise level (covers ~99% of jitter)
    // But enforce minimum from config and maximum reasonable value
    const minDeadZone = 3; // At least 3° to feel stable
    const maxDeadZone = 15; // Cap at 15° to stay responsive
    
    calibration.adaptiveBankDeadZone = Math.min(
      maxDeadZone,
      Math.max(minDeadZone, config.bankDeadZone, bankNoise * 2.5)
    );
    calibration.adaptivePitchDeadZone = Math.min(
      maxDeadZone,
      Math.max(minDeadZone, config.pitchDeadZone, pitchNoise * 2.5)
    );
    
    calibration.isCalibrating = false;
    calibration.isCalibrated = true;
    
    console.log(`[Pose Calibration] Complete:
  Bank noise: ${bankNoise.toFixed(1)}° → dead zone: ${calibration.adaptiveBankDeadZone.toFixed(1)}°
  Pitch noise: ${pitchNoise.toFixed(1)}° → dead zone: ${calibration.adaptivePitchDeadZone.toFixed(1)}°
  Baseline bank: ${calibration.baselineBank.toFixed(1)}°, pitch: ${calibration.baselinePitch.toFixed(1)}°`);
    
    return false;
  }
  
  return true;
}

/**
 * Calculate flight control input from pose landmarks
 *
 * Control scheme:
 * - BANK = angle of wrist-to-wrist line (tilt arms or lean torso)
 * - PITCH = average arm angle (both arms up = climb, both down = dive)
 * - BOOST = hands forward at chest level
 *
 * @param landmarks - Array of 33 pose landmarks from MediaPipe
 * @param config - Configuration for control mapping
 * @returns Flight control input values
 */
export function calculatePoseFlightInput(
  landmarks: NormalizedLandmark[],
  config: PoseFlightConfig = DEFAULT_POSE_FLIGHT_CONFIG
): PoseFlightInput {
  // Reuse output buffer - mutate instead of creating new objects
  const out = outputBuffer;
  
  // Default output for invalid input - gradually return to neutral
  if (!landmarks || landmarks.length < 33) {
    prevPitch *= 0.9;
    prevBank *= 0.9;
    out.pitch = prevPitch;
    out.bank = prevBank;
    out.boost = false;
    out.freezeToggle = false; // No toggle event when landmarks invalid
    out.confidence = 0;
    out.raw.shoulderTilt = 0;
    out.raw.avgArmAngle = 0;
    out.raw.handsForwardZ = 0;
    out.raw.handsAtChestLevel = false;
    out.raw.handsCloseToTorso = false;
    out.raw.boostAmount = 0;
    out.raw.handsOverhead = false;
    return out;
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
    prevPitch *= 0.9;
    prevBank *= 0.9;
    out.pitch = prevPitch;
    out.bank = prevBank;
    out.boost = false;
    out.freezeToggle = false; // No toggle event when shoulders not visible
    out.confidence = 0;
    out.raw.shoulderTilt = 0;
    out.raw.avgArmAngle = 0;
    out.raw.handsForwardZ = 0;
    out.raw.handsAtChestLevel = false;
    out.raw.handsCloseToTorso = false;
    out.raw.boostAmount = 0;
    out.raw.handsOverhead = false;
    return out;
  }

  // Calculate confidence as average visibility of key landmarks
  // Inline calculation to avoid array allocation
  let visibilitySum = 0;
  let landmarkCount = 0;
  
  if (leftShoulder) { visibilitySum += leftShoulder.visibility ?? 1; landmarkCount++; }
  if (rightShoulder) { visibilitySum += rightShoulder.visibility ?? 1; landmarkCount++; }
  if (leftElbow) { visibilitySum += leftElbow.visibility ?? 1; landmarkCount++; }
  if (rightElbow) { visibilitySum += rightElbow.visibility ?? 1; landmarkCount++; }
  if (leftWrist) { visibilitySum += leftWrist.visibility ?? 1; landmarkCount++; }
  if (rightWrist) { visibilitySum += rightWrist.visibility ?? 1; landmarkCount++; }
  if (leftHip) { visibilitySum += leftHip.visibility ?? 1; landmarkCount++; }
  if (rightHip) { visibilitySum += rightHip.visibility ?? 1; landmarkCount++; }
  
  const confidence = landmarkCount > 0 ? visibilitySum / landmarkCount : 0;

  // === BOOST DETECTION (Hands Forward, Close to Torso, at Chest Level) ===
  // Detect this FIRST because it affects pitch sensitivity
  // T-pose (arms out) should be NEUTRAL - no boost
  // Boost only when hands are brought IN FRONT of body, close together
  const shoulderWidth = getDistance2D(leftShoulder, rightShoulder);
  const shoulderAvgX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderAvgZ = (leftShoulder.z + rightShoulder.z) / 2;
  
  let handsForwardZ = 0;
  let handsAtChestLevel = false;
  let handsCloseToTorso = false;
  let boostAmount = 0;
  let boostDetected = false;

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
      const verticalOffset = wristAvgY - shoulderAvgY;
      handsAtChestLevel = verticalOffset > -0.05 && verticalOffset < shoulderWidth * 0.5;
      
      // Check if hands are close together horizontally (NOT spread out like T-pose)
      const wristDistance = Math.abs(leftWrist.x - rightWrist.x);
      const handsCloseTogether = wristDistance < shoulderWidth * 0.5; // Hands within half shoulder width
      
      // Check if hands are near the center of torso
      const horizontalOffsetFromCenter = Math.abs(wristAvgX - shoulderAvgX);
      const handsNearCenter = horizontalOffsetFromCenter < shoulderWidth * 0.35;
      
      handsCloseToTorso = handsCloseTogether && handsNearCenter;
      
      // Boost when all conditions met
      const forwardEnough = handsForwardZ > config.boostZThreshold;
      boostDetected = forwardEnough && handsAtChestLevel && handsCloseToTorso;
    }
  }
  
  // Debounce and smoothing ALWAYS runs (even if wrists not visible)
  // This ensures boost turns OFF when hands move away
  if (boostDetected) {
    const forwardRatio = Math.min(1, (handsForwardZ - config.boostZThreshold) / 0.1);
    boostAmount = Math.min(1, prevBoostAmount + 0.15);
    boostAmount = Math.max(boostAmount, forwardRatio * 0.5);
    boostDebounceFrames = Math.min(boostDebounceFrames + 1, 5);
  } else {
    boostAmount = Math.max(0, prevBoostAmount - 0.1);
    boostDebounceFrames = Math.max(boostDebounceFrames - 1, 0);
  }
  
  const boost = boostDebounceFrames >= 2;
  prevBoostAmount = boostAmount;

  // === FREEZE DETECTION (Hands Overhead & Touching - Runway Marshaller "Stop" Signal) ===
  // Detect when user raises both hands into a small BOX directly above their head
  // This is a TOGGLE action - holding the pose triggers a flip, not hold-to-freeze
  // 
  // The "overhead box" is a spatial region:
  // - Horizontally: centered on body, about shoulder-width wide
  // - Vertically: above the head
  // 
  // This prevents conflicts with sharp pitch-up gestures where arms are raised
  // but angled outward - those won't enter the narrow overhead box.
  let handsOverhead = false;
  let handsInOverheadZone = false; // TRUE when BOTH hands are inside the overhead box
  
  if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
    const leftWristVis = leftWrist.visibility ?? 0;
    const rightWristVis = rightWrist.visibility ?? 0;
    
    if (leftWristVis >= config.minConfidence && rightWristVis >= config.minConfidence) {
      // Get reference positions
      const nose = getLandmark(landmarks, POSE_LANDMARKS.NOSE, config.minConfidence);
      const headY = nose ? nose.y : (leftShoulder.y + rightShoulder.y) / 2 - 0.15;
      const centerX = (leftShoulder.x + rightShoulder.x) / 2;
      
      // Define the "overhead box" - a rectangular zone directly above the head
      // X bounds: shoulder-width centered on body (can stretch arms up at angle and miss this)
      // Y bounds: above the head (wrist.y < headY since Y=0 is top of frame)
      const boxHalfWidth = shoulderWidth * 0.6; // Slightly wider than shoulders for comfort
      const boxLeft = centerX - boxHalfWidth;
      const boxRight = centerX + boxHalfWidth;
      
      // Check if each hand is inside the overhead box
      const leftInBox = leftWrist.y < headY && leftWrist.x > boxLeft && leftWrist.x < boxRight;
      const rightInBox = rightWrist.y < headY && rightWrist.x > boxLeft && rightWrist.x < boxRight;
      
      // Both hands must be in the box to trigger the overhead zone (for pitch suppression)
      handsInOverheadZone = leftInBox && rightInBox;
      
      // For freeze trigger: both hands in box AND close together (touching)
      if (handsInOverheadZone) {
        const wristDistance = getDistance2D(leftWrist, rightWrist);
        // Threshold: hands within 50% of shoulder width (fairly lenient)
        // This accounts for wrist landmark jitter when hands are together
        const handsTouching = wristDistance < shoulderWidth * 0.5;
        
        handsOverhead = handsTouching;
      }
    }
  }
  
  // Toggle freeze using HOLD-TO-TRIGGER approach with HYSTERESIS:
  // - User must hold hands-overhead-touching pose for FREEZE_HOLD_THRESHOLD frames to trigger
  // - After toggle fires, user must be OUT of the pose for FREEZE_EXIT_THRESHOLD frames
  //   before another toggle can occur (prevents flickering from brief detection drops)
  // - freezeToggle is TRUE only on the exact frame when toggle fires (edge-triggered event)
  // - Brief detection drops (1-2 frames) don't reset the hold counter - we decay slowly
  let freezeToggle = false;
  
  if (handsOverhead) {
    handsOverheadHoldFrames++;
    handsNotOverheadFrames = 0; // Reset exit counter when in pose
    
    // Trigger toggle when hold threshold is reached AND we haven't already fired
    if (handsOverheadHoldFrames >= FREEZE_HOLD_THRESHOLD && !freezeToggleFired) {
      freezeToggle = true; // Signal to useFlight to toggle its freeze state
      freezeToggleFired = true; // Prevent re-triggering until pose is exited
    }
  } else {
    // Decay hold counter slowly instead of resetting immediately
    // This makes the gesture robust to brief detection flickers (1-2 frames)
    if (handsOverheadHoldFrames > 0) {
      handsOverheadHoldFrames = Math.max(0, handsOverheadHoldFrames - 2);
    }
    handsNotOverheadFrames++;
    
    // Only reset the toggle lock after being OUT of the pose for enough frames
    // This prevents flickering detection from causing rapid re-triggers
    if (freezeToggleFired && handsNotOverheadFrames >= FREEZE_EXIT_THRESHOLD) {
      freezeToggleFired = false;
    }
  }

  // === BANK (Wrist-to-Wrist Line Angle) ===
  // Draw a line from left wrist to right wrist and measure its angle from horizontal.
  // This captures BOTH arm tilt AND torso lean in one simple measurement.
  // 
  // User expectation (with mirrored video):
  // - Left arm DOWN, right arm UP = bank RIGHT (positive)
  // - Left arm UP, right arm DOWN = bank LEFT (negative)
  let rawBank = 0;
  let wristLineAngle = 0; // For debugging
  
  if (leftWrist && rightWrist) {
    // leftWrist.y - rightWrist.y: positive when right wrist is higher (right arm up)
    // Right arm up = bank RIGHT (positive) ✓
    const wristDy = leftWrist.y - rightWrist.y;
    const wristDx = Math.abs(leftWrist.x - rightWrist.x);
    
    // Avoid division issues if wrists are very close horizontally
    if (wristDx > 0.01) {
      const angleRad = Math.atan2(wristDy, wristDx);
      wristLineAngle = angleRad * (180 / Math.PI);
    }
  }

  // === PITCH (Average Arm Angle) ===
  // Calculate individual arm angles, then average them
  let leftArmAngle = 0;
  let rightArmAngle = 0;
  let hasLeftArm = false;
  let hasRightArm = false;

  if (leftShoulder && leftElbow && leftWrist) {
    leftArmAngle = calculateArmAngle(leftShoulder, leftElbow, leftWrist);
    hasLeftArm = true;
  }

  if (rightShoulder && rightElbow && rightWrist) {
    rightArmAngle = calculateArmAngle(rightShoulder, rightElbow, rightWrist);
    hasRightArm = true;
  }

  let avgArmAngle = 0;
  if (hasLeftArm && hasRightArm) {
    avgArmAngle = (leftArmAngle + rightArmAngle) / 2;
  } else if (hasLeftArm) {
    avgArmAngle = leftArmAngle;
  } else if (hasRightArm) {
    avgArmAngle = rightArmAngle;
  }

  // === CALIBRATION ===
  // During calibration, collect samples to measure noise and baseline
  const stillCalibrating = processCalibration(wristLineAngle, avgArmAngle, config);
  
  // Use adaptive dead zones if calibrated, otherwise use config defaults
  const effectiveBankDeadZone = calibration.isCalibrated 
    ? calibration.adaptiveBankDeadZone 
    : config.bankDeadZone;
  const effectivePitchDeadZone = calibration.isCalibrated 
    ? calibration.adaptivePitchDeadZone 
    : config.pitchDeadZone;
  
  // Apply baseline offset for BANK only (user's natural stance may not be perfectly level)
  // PITCH baseline is NOT applied - arms horizontal (T-pose) is ALWAYS neutral pitch
  // This is more intuitive: T-pose = level flight, arms up = climb, arms down = dive
  const adjustedBankAngle = calibration.isCalibrated 
    ? wristLineAngle - calibration.baselineBank 
    : wristLineAngle;
  const adjustedPitchAngle = avgArmAngle; // No baseline adjustment - 0° (horizontal) = neutral
  
  // Store for debugging (repurposing shoulderTilt to show wrist line angle)
  const shoulderTilt = wristLineAngle;
  
  // During calibration, output neutral controls
  if (stillCalibrating) {
    // Still calibrating - return neutral with calibration progress indicator
    const smoothedPitch = prevPitch * 0.9;
    const smoothedBank = prevBank * 0.9;
    prevPitch = smoothedPitch;
    prevBank = smoothedBank;
    
    out.pitch = smoothedPitch;
    out.bank = smoothedBank;
    out.boost = false;
    out.freezeToggle = false; // No toggle event during calibration
    out.confidence = confidence;
    out.raw.shoulderTilt = shoulderTilt;
    out.raw.avgArmAngle = avgArmAngle;
    out.raw.handsForwardZ = handsForwardZ;
    out.raw.handsAtChestLevel = handsAtChestLevel;
    out.raw.handsCloseToTorso = handsCloseToTorso;
    out.raw.boostAmount = calibration.frameCount / calibration.maxFrames; // Show calibration progress
    out.raw.handsOverhead = false;
    return out;
  }

  // === APPLY DEAD ZONES AND MAPPING ===
  // Apply dead zone and linear mapping for bank
  rawBank = applyDeadZoneLinear(
    adjustedBankAngle,
    effectiveBankDeadZone,
    config.bankMaxAngle
  ) * config.bankSensitivity;
  
  rawBank = clamp(rawBank);
  if (config.invertBank) rawBank = -rawBank;

  // Apply dead zone and map to -1..1 with linear response for pitch
  // BUT: If hands are in the overhead zone, suppress pitch to neutral
  // This prevents the plane from pitching up when user is trying to freeze
  let rawPitch = 0;
  if (handsInOverheadZone) {
    // Hands above head = pitch dead zone, smoothly return to neutral
    rawPitch = 0;
  } else {
    rawPitch = applyDeadZoneLinear(
      adjustedPitchAngle,
      effectivePitchDeadZone,
      config.pitchMaxAngle
    ) * config.pitchSensitivity;
    
    rawPitch = clamp(rawPitch);
    if (config.invertPitch) rawPitch = -rawPitch;
  }
  
  // Reduce pitch sensitivity when boosting to prevent twitchiness
  if (boostAmount > 0) {
    const dampingMultiplier = 1 - (boostAmount * (1 - config.boostPitchDamping));
    rawPitch *= dampingMultiplier;
  }

  // === SINGLE-STAGE SMOOTHING ===
  // For 1:1 responsive control, we use minimal smoothing
  // smoothingFactor = portion of PREVIOUS value to keep
  // e.g., 0.3 means 30% old + 70% new = responsive
  const smoothedPitch = prevPitch * config.smoothingFactor + rawPitch * (1 - config.smoothingFactor);
  const smoothedBank = prevBank * config.smoothingFactor + rawBank * (1 - config.smoothingFactor);
  
  prevPitch = smoothedPitch;
  prevBank = smoothedBank;

  // Populate reusable output buffer
  out.pitch = smoothedPitch;
  out.bank = smoothedBank;
  out.boost = boost;
  out.freezeToggle = freezeToggle;
  out.confidence = confidence;
  out.raw.shoulderTilt = shoulderTilt;
  out.raw.avgArmAngle = avgArmAngle;
  out.raw.handsForwardZ = handsForwardZ;
  out.raw.handsAtChestLevel = handsAtChestLevel;
  out.raw.handsCloseToTorso = handsCloseToTorso;
  out.raw.boostAmount = boostAmount;
  out.raw.handsOverhead = handsOverhead;
  
  return out;
}

/**
 * Reset smoothing state (call when deactivating pose controls)
 */
export function resetPoseSmoothing(): void {
  prevPitch = 0;
  prevBank = 0;
  prevBoostAmount = 0;
  boostDebounceFrames = 0;
  
  // Reset freeze state
  freezeToggleFired = false;
  handsOverheadHoldFrames = 0;
  handsNotOverheadFrames = 0;
  
  // Also reset calibration state
  calibration = {
    isCalibrating: false,
    isCalibrated: false,
    frameCount: 0,
    maxFrames: 30,
    bankSamples: [],
    pitchSamples: [],
    adaptiveBankDeadZone: 5,
    adaptivePitchDeadZone: 5,
    baselineBank: 0,
    baselinePitch: 0,
  };
}
