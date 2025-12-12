"use client";

/**
 * useFlight Hook
 * Reusable flight controls with two movement modes
 *
 * Elytra Mode Controls:
 * - W: Pitch up (climb)
 * - S: Pitch down (dive)
 * - A/D: Bank and turn smoothly
 * - SHIFT: Instant boost
 * - SPACE: Freeze/lock camera in place
 *
 * Simple Mode Controls:
 * - W/S: Move forward/backward
 * - A/D: Strafe left/right
 * - SPACE: Move up
 * - CTRL: Move down
 * - SHIFT: Sprint
 * - Mouse: Look around (when pointer locked)
 */

import { useRef, useEffect, useCallback, useState } from "react";
import * as THREE from "three";
import {
  damp,
  easeInOutQuad,
  lerp,
  smoothstep,
  degToRad,
  normalizeAngle,
  createFlightConfig,
  isGyroscopeAvailable,
  isGyroscopePermissionRequired,
  requestGyroscopePermission,
  FLY_TO_DURATION,
  type FlightKeyState,
  type FlightConfig,
  type MovementMode,
  type FlyToTarget,
} from "@/lib/flight";

export interface UseFlightOptions {
  camera: THREE.Camera | null;
  config?: FlightConfig;
  onSpeedChange?: (speed: number) => void;
  onModeChange?: (mode: MovementMode) => void;
}

export interface FlightState {
  speed: number;
  pitch: number;
  yaw: number;
  bank: number;
  isFrozen: boolean;
  mode: MovementMode;
  isFlying: boolean; // True if currently in a flyTo animation
  isPointerLocked: boolean;
  isGyroActive: boolean;
  isGyroAvailable: boolean;
  isGyroEnabled: boolean;
  needsGyroPermission: boolean;
}

/**
 * React hook providing advanced 3D flight and camera controls for a THREE.js camera,
 * supporting both "elytra" (free-flying/gliding) and "simple" (no-physics WASD+mouse) movement modes.
 * Integrates input from keyboard, mouse, and gyroscope (where available), along with pointer lock support.
 *
 * Use this hook to manage camera orientation, velocity, and position, as well as flight state management,
 * for e.g. first-person game cameras or immersive 3D navigation experiences.
 *
 * @param {UseFlightOptions} options - Configuration for the flight controls.
 * @param {THREE.Camera|null} options.camera - The THREE.js camera object to control.
 * @param {FlightConfig} [options.config] - Optional override config parameters.
 * @param {(speed: number) => void} [options.onSpeedChange] - Optional callback when speed changes.
 * @param {(mode: MovementMode) => void} [options.onModeChange] - Optional callback when movement mode toggles.
 * @returns {FlightState} - The current flight state.
 */
export function useFlight({
  camera,
  config: configOverrides,
  onSpeedChange,
  onModeChange,
}: UseFlightOptions) {
  const config = createFlightConfig(configOverrides);
  const [currentMode, setCurrentMode] = useState<MovementMode>(config.mode);
  const modeRef = useRef<MovementMode>(config.mode);

  const keysRef = useRef<FlightKeyState>({
    // Elytra mode keys
    pitchDown: false,
    pitchUp: false,
    bankLeft: false,
    bankRight: false,
    boost: false,
    freeze: false,
    // Simple mode keys
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
  });

  const currentSpeedRef = useRef(config.baseSpeed);

  const targetPitchRef = useRef(0);
  const smoothPitchRef = useRef(0);

  const targetYawRef = useRef(0);
  const smoothYawRef = useRef(0);

  const targetBankRef = useRef(0);
  const smoothBankRef = useRef(0);

  const pitchHoldTimeRef = useRef(0);
  const bankHoldTimeRef = useRef(0);

  const smoothPitchVelocityRef = useRef(0);
  const smoothBankVelocityRef = useRef(0);

  const boostCooldownRef = useRef(0);
  const lastReportedSpeedRef = useRef(-1);

  // FlyTo animation state
  const flyToRef = useRef<{
    active: boolean;
    startPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    startQuaternion: THREE.Quaternion;
    targetQuaternion: THREE.Quaternion;
    progress: number;
    duration: number;
  } | null>(null);

  // reusable THREE objects to avoid GC pressure
  const tempEuler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const tempQuat = useRef(new THREE.Quaternion());
  const tempQuat2 = useRef(new THREE.Quaternion());
  const tempVec3 = useRef(new THREE.Vector3());
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3(0, 1, 0));
  const movementVec = useRef(new THREE.Vector3());
  const rollAxis = useRef(new THREE.Vector3(0, 0, 1));

  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mouseDeltaRef = useRef({ x: 0, y: 0 });

  const [isGyroAvailable, setIsGyroAvailable] = useState(false);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [isGyroEnabled, setIsGyroEnabled] = useState(false);
  const [needsGyroPermission, setNeedsGyroPermission] = useState(false);
  const gyroRef = useRef<{
    alpha: number | null; // Z-axis rotation (compass direction)
    beta: number | null; // X-axis rotation (front-back tilt)
    gamma: number | null; // Y-axis rotation (left-right tilt)
    initialAlpha: number | null;
    initialBeta: number | null;
  }>({
    alpha: null,
    beta: null,
    gamma: null,
    initialAlpha: null,
    initialBeta: null,
  });
  const gyroActiveRef = useRef(false);

  useEffect(() => {
    if (!camera) return;

    tempEuler.current.setFromQuaternion(camera.quaternion, "YXZ");
    targetPitchRef.current = tempEuler.current.x;
    smoothPitchRef.current = tempEuler.current.x;
    targetYawRef.current = tempEuler.current.y;
    smoothYawRef.current = tempEuler.current.y;
  }, [camera]);

  const handleToggleMode = useCallback(() => {
    const newMode: MovementMode =
      modeRef.current === "elytra" ? "simple" : "elytra";
    modeRef.current = newMode;
    setCurrentMode(newMode);
    onModeChange?.(newMode);

    if (newMode === "simple") {
      targetBankRef.current = 0;
      smoothBankRef.current = 0;
    }
  }, [onModeChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === config.toggleModeKey) {
        handleToggleMode();
        return;
      }

      switch (e.code) {
        case "KeyS":
          keysRef.current.pitchUp = true;
          keysRef.current.forward = true;
          break;
        case "KeyW":
          keysRef.current.pitchDown = true;
          keysRef.current.backward = true;
          break;
        case "KeyA":
          keysRef.current.bankLeft = true;
          keysRef.current.left = true;
          break;
        case "KeyD":
          keysRef.current.bankRight = true;
          keysRef.current.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          e.preventDefault();
          keysRef.current.boost = true;
          keysRef.current.sprint = true;
          break;
        case "Space":
          e.preventDefault();
          if (modeRef.current === "elytra") {
            keysRef.current.freeze = !keysRef.current.freeze;
          } else {
            keysRef.current.up = true;
          }
          break;
        case "ControlLeft":
        case "ControlRight":
          keysRef.current.down = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case "KeyW":
          keysRef.current.pitchDown = false;
          keysRef.current.backward = false;
          pitchHoldTimeRef.current = 0;
          break;
        case "KeyS":
          keysRef.current.pitchUp = false;
          keysRef.current.forward = false;
          pitchHoldTimeRef.current = 0;
          break;
        case "KeyA":
          keysRef.current.bankLeft = false;
          keysRef.current.left = false;
          if (!keysRef.current.bankRight) bankHoldTimeRef.current = 0;
          break;
        case "KeyD":
          keysRef.current.bankRight = false;
          keysRef.current.right = false;
          if (!keysRef.current.bankLeft) bankHoldTimeRef.current = 0;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.boost = false;
          keysRef.current.sprint = false;
          break;
        case "Space":
          keysRef.current.up = false;
          break;
        case "ControlLeft":
        case "ControlRight":
          keysRef.current.down = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [config.toggleModeKey, handleToggleMode]);

  useEffect(() => {
    if (!config.enableMouseLook) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;

      const sensitivity = config.mouseSensitivity;
      const yMultiplier = config.invertMouseY ? 1 : -1;

      mouseDeltaRef.current.x += e.movementX * sensitivity;
      mouseDeltaRef.current.y += e.movementY * sensitivity * yMultiplier;
    };

    const handlePointerLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };

    const handleClick = () => {
      if (modeRef.current === "simple" && !document.pointerLockElement) {
        document.body.requestPointerLock?.();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
      document.removeEventListener("click", handleClick);
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    };
  }, [config.enableMouseLook, config.mouseSensitivity, config.invertMouseY]);

  useEffect(() => {
    const available = isGyroscopeAvailable();
    const needsPermission = isGyroscopePermissionRequired();

    setIsGyroAvailable(available);
    setNeedsGyroPermission(available && needsPermission);

    if (available && !needsPermission) {
      setIsGyroEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!config.enableGyroscope) return;

    const available = isGyroscopeAvailable();
    if (!available) return;

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;

      if (!gyroActiveRef.current) {
        gyroActiveRef.current = true;
        setIsGyroEnabled(true);
        setNeedsGyroPermission(false);
        setIsGyroActive(true);
      }

      if (gyroRef.current.initialBeta === null) {
        gyroRef.current.initialAlpha = e.alpha;
        gyroRef.current.initialBeta = e.beta;
      }

      gyroRef.current.alpha = e.alpha;
      gyroRef.current.beta = e.beta;
      gyroRef.current.gamma = e.gamma;
    };

    window.addEventListener("deviceorientation", handleDeviceOrientation, true);

    return () => {
      window.removeEventListener(
        "deviceorientation",
        handleDeviceOrientation,
        true
      );
      gyroActiveRef.current = false;
      setIsGyroActive(false);
    };
  }, [config.enableGyroscope]);

  useEffect(() => {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsMobile(isTouchDevice);
    if (!isTouchDevice) return;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.closest("button") ||
        target.closest("input")
      ) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) return;

      const screenHeight = window.innerHeight;
      const touchY = touch.clientY;
      const isTopHalf = touchY < screenHeight / 2;

      if (isTopHalf) {
        keysRef.current.boost = true;
      } else {
        keysRef.current.freeze = !keysRef.current.freeze;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      let hasTopTouch = false;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.clientY < window.innerHeight / 2) {
          hasTopTouch = true;
          break;
        }
      }
      if (!hasTopTouch) {
        keysRef.current.boost = false;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const requestGyroPermission = useCallback(async () => {
    const granted = await requestGyroscopePermission();
    if (granted) {
      setIsGyroEnabled(true);
      setNeedsGyroPermission(false);
    }
    return granted;
  }, []);

  const recalibrateGyro = useCallback(() => {
    gyroRef.current.initialAlpha = gyroRef.current.alpha;
    gyroRef.current.initialBeta = gyroRef.current.beta;
  }, []);

  const updateElytra = useCallback(
    (dt: number) => {
      if (!camera) return;

      const keys = keysRef.current;

      if (keys.freeze) {
        if (lastReportedSpeedRef.current !== 0) {
          lastReportedSpeedRef.current = 0;
          onSpeedChange?.(0);
        }
        return;
      }

      let rawPitchInput = (keys.pitchDown ? 1 : 0) - (keys.pitchUp ? 1 : 0);
      let rawBankInput = (keys.bankRight ? 1 : 0) - (keys.bankLeft ? 1 : 0);

      if (
        config.enableGyroscope &&
        gyroActiveRef.current &&
        gyroRef.current.beta !== null &&
        gyroRef.current.gamma !== null
      ) {
        const gyro = gyroRef.current;
        const deadZone = config.gyroDeadZone;

        const betaNeutral = 50; // degrees typical holding angle
        const betaRange = 50; // degrees beyond dead zone for full input
        const betaDelta = (gyro.beta ?? betaNeutral) - betaNeutral;

        if (Math.abs(betaDelta) > deadZone) {
          const effectiveDelta =
            Math.sign(betaDelta) * (Math.abs(betaDelta) - deadZone);
          const normalizedBeta = Math.max(
            -1,
            Math.min(1, effectiveDelta / betaRange)
          );
          const pitchMultiplier = config.invertGyroPitch ? -1 : 1;
          rawPitchInput +=
            normalizedBeta * config.gyroSensitivity * pitchMultiplier;
        }

        const gammaRange = 70; // degrees beyond dead zone for full input
        const gammaDelta = gyro.gamma ?? 0;

        if (Math.abs(gammaDelta) > deadZone) {
          const effectiveDelta =
            Math.sign(gammaDelta) * (Math.abs(gammaDelta) - deadZone);
          const normalizedGamma = Math.max(
            -1,
            Math.min(1, effectiveDelta / gammaRange)
          );
          const bankMultiplier = config.invertGyroYaw ? -1 : 1;
          rawBankInput +=
            normalizedGamma * config.gyroSensitivity * bankMultiplier;
        }

        rawPitchInput = Math.max(-1, Math.min(1, rawPitchInput));
        rawBankInput = Math.max(-1, Math.min(1, rawBankInput));
      }

      if (rawPitchInput !== 0) {
        pitchHoldTimeRef.current += dt;
      }
      if (rawBankInput !== 0) {
        bankHoldTimeRef.current += dt;
      }

      const pitchRampT = Math.min(
        pitchHoldTimeRef.current / config.rampUpTime,
        1
      );
      const bankRampT = Math.min(
        bankHoldTimeRef.current / config.rampUpTime,
        1
      );

      const pitchRamp = easeInOutQuad(pitchRampT);
      const bankRamp = easeInOutQuad(bankRampT);

      const pitchSpeed =
        config.pitchSpeedMin +
        (config.pitchSpeedMax - config.pitchSpeedMin) * pitchRamp;
      const bankSpeed =
        config.bankSpeedMin +
        (config.bankSpeedMax - config.bankSpeedMin) * bankRamp;

      const targetPitchVelocity = rawPitchInput * pitchSpeed;
      const targetBankVelocity = rawBankInput * bankSpeed;

      smoothPitchVelocityRef.current = damp(
        smoothPitchVelocityRef.current,
        targetPitchVelocity,
        config.inputSmoothing,
        dt
      );
      smoothBankVelocityRef.current = damp(
        smoothBankVelocityRef.current,
        targetBankVelocity,
        config.inputSmoothing,
        dt
      );

      targetPitchRef.current += smoothPitchVelocityRef.current * dt;
      targetPitchRef.current = Math.max(
        -config.maxPitch,
        Math.min(config.maxPitch, targetPitchRef.current)
      );

      if (rawBankInput !== 0) {
        targetBankRef.current += smoothBankVelocityRef.current * dt;
        targetBankRef.current = Math.max(
          -config.maxBank,
          Math.min(config.maxBank, targetBankRef.current)
        );
      } else {
        targetBankRef.current = damp(
          targetBankRef.current,
          0,
          config.bankRecoverySmoothing,
          dt
        );
        if (Math.abs(targetBankRef.current) < 0.001) targetBankRef.current = 0;
      }

      const turnRate = smoothBankRef.current * config.turnFromBank;
      targetYawRef.current -= turnRate * dt;

      smoothPitchRef.current = damp(
        smoothPitchRef.current,
        targetPitchRef.current,
        config.rotationSmoothing,
        dt
      );
      smoothYawRef.current = damp(
        smoothYawRef.current,
        targetYawRef.current,
        config.rotationSmoothing,
        dt
      );
      smoothBankRef.current = damp(
        smoothBankRef.current,
        targetBankRef.current,
        config.rotationSmoothing,
        dt
      );

      tempEuler.current.set(
        smoothPitchRef.current,
        smoothYawRef.current,
        0,
        "YXZ"
      );
      tempQuat.current.setFromEuler(tempEuler.current);

      tempQuat2.current.setFromAxisAngle(
        rollAxis.current,
        -smoothBankRef.current
      );
      tempQuat.current.multiply(tempQuat2.current);

      camera.quaternion.slerp(
        tempQuat.current,
        1 - Math.exp(-config.rotationSmoothing * dt)
      );

      forwardVec.current.set(0, 0, -1);
      forwardVec.current.applyQuaternion(camera.quaternion);
      forwardVec.current.normalize();

      const verticalFactor = -forwardVec.current.y;

      if (verticalFactor > 0.05) {
        currentSpeedRef.current += verticalFactor * config.gravityAccel * dt;
      } else if (verticalFactor < -0.05) {
        currentSpeedRef.current += verticalFactor * config.gravityDecel * dt;
      }

      if (keys.boost && boostCooldownRef.current <= 0) {
        currentSpeedRef.current += config.boostImpulse;
        boostCooldownRef.current = 0.5;
      }

      if (boostCooldownRef.current > 0) {
        boostCooldownRef.current -= dt;
      }

      currentSpeedRef.current *= config.drag;
      currentSpeedRef.current = Math.max(
        config.minSpeed,
        Math.min(config.maxSpeed, currentSpeedRef.current)
      );

      const roundedSpeed = Math.round(currentSpeedRef.current);
      if (roundedSpeed !== lastReportedSpeedRef.current) {
        lastReportedSpeedRef.current = roundedSpeed;
        onSpeedChange?.(roundedSpeed);
      }

      camera.position.addScaledVector(
        forwardVec.current,
        currentSpeedRef.current * dt
      );

      if (config.enableBounds) {
        camera.position.y = Math.max(
          config.minHeight,
          Math.min(config.maxHeight, camera.position.y)
        );
      }
    },
    [camera, config, onSpeedChange]
  );

  const updateSimple = useCallback(
    (dt: number) => {
      if (!camera) return;

      const keys = keysRef.current;

      if (
        config.enableMouseLook &&
        (mouseDeltaRef.current.x !== 0 || mouseDeltaRef.current.y !== 0)
      ) {
        targetYawRef.current -= mouseDeltaRef.current.x;
        targetPitchRef.current += mouseDeltaRef.current.y;

        targetPitchRef.current = Math.max(
          -Math.PI / 2 + 0.01,
          Math.min(Math.PI / 2 - 0.01, targetPitchRef.current)
        );

        mouseDeltaRef.current.x = 0;
        mouseDeltaRef.current.y = 0;
      }

      if (
        config.enableGyroscope &&
        gyroActiveRef.current &&
        gyroRef.current.alpha !== null
      ) {
        const gyro = gyroRef.current;

        if (gyro.initialAlpha !== null && gyro.initialBeta !== null) {
          const deltaAlpha = normalizeAngle(
            (gyro.alpha ?? 0) - gyro.initialAlpha
          );
          const deltaBeta = normalizeAngle((gyro.beta ?? 0) - gyro.initialBeta);

          const effectiveAlpha =
            Math.abs(deltaAlpha) > config.gyroDeadZone ? deltaAlpha : 0;
          const effectiveBeta =
            Math.abs(deltaBeta) > config.gyroDeadZone ? deltaBeta : 0;

          const yawMultiplier = config.invertGyroYaw ? 1 : -1;
          const pitchMultiplier = config.invertGyroPitch ? -1 : 1;

          const targetYaw =
            degToRad(effectiveAlpha) * config.gyroSensitivity * yawMultiplier;
          const targetPitch =
            degToRad(effectiveBeta - 45) *
            config.gyroSensitivity *
            pitchMultiplier;

          targetYawRef.current = damp(
            targetYawRef.current,
            targetYaw,
            config.gyroSmoothing,
            dt
          );
          targetPitchRef.current = damp(
            targetPitchRef.current,
            targetPitch,
            config.gyroSmoothing,
            dt
          );

          targetPitchRef.current = Math.max(
            -Math.PI / 2 + 0.01,
            Math.min(Math.PI / 2 - 0.01, targetPitchRef.current)
          );
        }
      }

      smoothPitchRef.current = damp(
        smoothPitchRef.current,
        targetPitchRef.current,
        config.rotationSmoothing,
        dt
      );
      smoothYawRef.current = damp(
        smoothYawRef.current,
        targetYawRef.current,
        config.rotationSmoothing,
        dt
      );

      tempEuler.current.set(
        smoothPitchRef.current,
        smoothYawRef.current,
        0,
        "YXZ"
      );
      camera.quaternion.setFromEuler(tempEuler.current);

      const speed = keys.sprint
        ? config.simpleMoveSpeed * config.simpleSprintMultiplier
        : config.simpleMoveSpeed;

      forwardVec.current.set(0, 0, -1);
      forwardVec.current.applyQuaternion(camera.quaternion);
      forwardVec.current.y = 0;
      forwardVec.current.normalize();

      rightVec.current.set(1, 0, 0);
      rightVec.current.applyQuaternion(camera.quaternion);
      rightVec.current.y = 0;
      rightVec.current.normalize();

      movementVec.current.set(0, 0, 0);

      if (keys.forward) movementVec.current.add(forwardVec.current);
      if (keys.backward) movementVec.current.sub(forwardVec.current);
      if (keys.right) movementVec.current.add(rightVec.current);
      if (keys.left) movementVec.current.sub(rightVec.current);

      const vertScale = config.simpleVerticalSpeed / config.simpleMoveSpeed;
      if (keys.up) movementVec.current.y += vertScale;
      if (keys.down) movementVec.current.y -= vertScale;

      if (movementVec.current.lengthSq() > 0) {
        movementVec.current.normalize();
        camera.position.addScaledVector(movementVec.current, speed * dt);
      }

      if (config.enableBounds) {
        camera.position.y = Math.max(
          config.minHeight,
          Math.min(config.maxHeight, camera.position.y)
        );
      }

      const reportedSpeed =
        movementVec.current.lengthSq() > 0 ? Math.round(speed) : 0;
      if (reportedSpeed !== lastReportedSpeedRef.current) {
        lastReportedSpeedRef.current = reportedSpeed;
        onSpeedChange?.(reportedSpeed);
      }
    },
    [camera, config, onSpeedChange]
  );

  const updateFlyTo = useCallback(
    (dt: number) => {
      if (!camera || !flyToRef.current?.active) return false;

      const fly = flyToRef.current;
      fly.progress += dt / fly.duration;

      if (fly.progress >= 1) {
        camera.position.copy(fly.targetPosition);
        camera.quaternion.copy(fly.targetQuaternion);
        flyToRef.current = null;

        tempEuler.current.setFromQuaternion(camera.quaternion, "YXZ");
        targetPitchRef.current = tempEuler.current.x;
        smoothPitchRef.current = tempEuler.current.x;
        targetYawRef.current = tempEuler.current.y;
        smoothYawRef.current = tempEuler.current.y;
        targetBankRef.current = 0;
        smoothBankRef.current = 0;

        return false;
      }

      const t = smoothstep(fly.progress);

      camera.position.lerpVectors(fly.startPosition, fly.targetPosition, t);

      camera.quaternion.slerpQuaternions(
        fly.startQuaternion,
        fly.targetQuaternion,
        t
      );

      return true;
    },
    [camera]
  );

  const update = useCallback(
    (delta: number) => {
      if (!camera) return;
      const dt = Math.min(delta, 0.1);

      if (flyToRef.current?.active) {
        updateFlyTo(dt);
        return;
      }

      if (modeRef.current === "elytra") {
        updateElytra(dt);
      } else {
        updateSimple(dt);
      }
    },
    [camera, updateElytra, updateSimple, updateFlyTo]
  );

  const flyTo = useCallback(
    (target: FlyToTarget, duration: number = FLY_TO_DURATION) => {
      if (!camera) return;

      const startPosition = camera.position.clone();
      const targetPosition = new THREE.Vector3(...target.position);

      const startQuaternion = camera.quaternion.clone();

      let targetQuaternion: THREE.Quaternion;
      if (target.lookAt) {
        const tempCamera = camera.clone();
        tempCamera.position.copy(targetPosition);
        tempCamera.lookAt(new THREE.Vector3(...target.lookAt));
        targetQuaternion = tempCamera.quaternion.clone();
      } else {
        targetQuaternion = startQuaternion.clone();
      }

      flyToRef.current = {
        active: true,
        startPosition,
        targetPosition,
        startQuaternion,
        targetQuaternion,
        progress: 0,
        duration,
      };
    },
    [camera]
  );

  const cancelFlyTo = useCallback(() => {
    flyToRef.current = null;
  }, []);

  const setMode = useCallback(
    (newMode: MovementMode) => {
      if (newMode === modeRef.current) return;

      modeRef.current = newMode;
      setCurrentMode(newMode);
      onModeChange?.(newMode);

      if (newMode === "simple") {
        targetBankRef.current = 0;
        smoothBankRef.current = 0;
      }

      if (newMode === "elytra" && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    },
    [onModeChange]
  );

  const toggleMode = useCallback(() => {
    setMode(modeRef.current === "elytra" ? "simple" : "elytra");
  }, [setMode]);

  const syncFromCamera = useCallback(() => {
    if (!camera) return;

    tempEuler.current.setFromQuaternion(camera.quaternion, "YXZ");
    targetPitchRef.current = tempEuler.current.x;
    smoothPitchRef.current = tempEuler.current.x;
    targetYawRef.current = tempEuler.current.y;
    smoothYawRef.current = tempEuler.current.y;
    targetBankRef.current = 0;
    smoothBankRef.current = 0;
  }, [camera]);

  const getState = useCallback((): FlightState => {
    return {
      speed: currentSpeedRef.current,
      pitch: smoothPitchRef.current,
      yaw: smoothYawRef.current,
      bank: smoothBankRef.current,
      isFrozen: keysRef.current.freeze,
      mode: modeRef.current,
      isFlying: flyToRef.current?.active ?? false,
      isPointerLocked,
      isGyroActive,
      isGyroAvailable,
      isGyroEnabled,
      needsGyroPermission,
    };
  }, [
    isPointerLocked,
    isGyroActive,
    isGyroAvailable,
    isGyroEnabled,
    needsGyroPermission,
  ]);

  return {
    update,
    getState,
    setMode,
    toggleMode,
    flyTo,
    cancelFlyTo,
    syncFromCamera,
    requestGyroPermission,
    recalibrateGyro,
    keysRef,
    currentMode,
    isPointerLocked,
    isMobile,
    isGyroActive,
    isGyroAvailable,
    isGyroEnabled,
    needsGyroPermission,
  };
}
