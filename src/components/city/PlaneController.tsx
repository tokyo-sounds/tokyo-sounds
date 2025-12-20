"use client";

/**
 * PlaneController Component
 * Renders a plane model as the player object with chase camera following behind
 * Switches between default and speed model when boosting (Shift)
 * Supports demo flythrough mode for first-time visitors
 */

import {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useFlight } from "@/hooks/useFlight";
import { useDemoFlythrough, type DemoState } from "@/hooks/useDemoFlythrough";
import { type MovementMode } from "@/lib/flight";
import { type DemoWaypoint } from "@/config/tokyo-config";

export interface PlaneControllerHandle {
  teleportTo: (position: THREE.Vector3, lookAt: THREE.Vector3) => void;
  flyTo: (
    position: THREE.Vector3,
    lookAt: THREE.Vector3,
    duration?: number
  ) => void;
  recalibrateGyro: () => void;
}

export interface GyroState {
  isActive: boolean;
  isAvailable: boolean;
  isEnabled: boolean;
  needsPermission: boolean;
  isMobile: boolean;
}

const CAMERA_DISTANCE = 3; // distance behind plane
const CAMERA_HEIGHT = 0.6; // height above plane
const CAMERA_LOOK_OFFSET = 1; // offset from plane forward direction
const CAMERA_LAG = 0.92; // lower = more responsive (0.9 = fast, 0.95 = slow)
const CAMERA_LAG_BOOST = 0.85; // slightly tighter follow during boost (not too aggressive)
const LAG_TRANSITION_SPEED = 3.0; // how fast to transition between lag values
const PLANE_RESPONSIVENESS = 1.1; // plane turns slightly faster than camera follows
const PLANE_SCALE = 0.15; // 15% of original size
const DEMO_CAMERA_LAG = 0.95; // slower, more cinematic movement
const DEFAULT_MODEL_PATH = "/models/plane_balance.glb";
const SPEED_MODEL_PATH = "/models/plane_speed.glb";

// Flying audio configuration
const FLYING_AUDIO_FILES = [
  "/audio/flying/flying_01.mp3",
  "/audio/flying/flying_02.mp3",
];
const FLYING_AUDIO_VOLUME = 0.15; // Reduced gain for flying sfx
const FLYING_AUDIO_FADE_DURATION = 0.5; // Fade in/out duration in seconds
const FLYING_AUDIO_STOP_SPEED_THRESHOLD = 5; // Speed below which audio fades out (m/s)

interface PlaneControllerProps {
  onSpeedChange?: (speed: number) => void;
  onModeChange?: (mode: MovementMode) => void;
  onCameraYChange?: (y: number) => void;
  onGroundDistanceChange?: (distance: number | null) => void;
  onHeadingChange?: (heading: number) => void;
  onPitchChange?: (pitch: number) => void;
  onRollChange?: (roll: number) => void;
  collisionGroup?: THREE.Group | null;
  collisionEnabled?: boolean;
  onCollision?: (distance: number) => void;
  localPlayerPositionRef?: React.RefObject<THREE.Vector3>;
  localPlayerQuaternionRef?: React.RefObject<THREE.Quaternion>;
  onPlanePositionChange?: (
    position: THREE.Vector3,
    quaternion: THREE.Quaternion
  ) => void;
  demoEnabled?: boolean;
  onDemoStateChange?: (state: DemoState) => void;
  onDemoWaypointReached?: (waypoint: DemoWaypoint) => void;
  onDemoComplete?: () => void;
  onGyroStateChange?: (state: GyroState) => void;
  planeColor?: string;
  flyingVolume?: number;
}

const COLLISION_DISTANCE = 2;
const COLLISION_PUSH_STRENGTH = 1;
const NUM_COLLISION_RAYS = 8;
const GROUND_RAYCAST_DISTANCE = 300; // Max distance to check for ground
const GROUND_RAYCAST_INTERVAL = 3; // Check every N frames (~20fps at 60fps)

export const PlaneController = forwardRef<
  PlaneControllerHandle,
  PlaneControllerProps
>(function PlaneController(
  {
    onSpeedChange,
    onModeChange,
    onCameraYChange,
    onGroundDistanceChange,
    onHeadingChange,
    onPitchChange,
    onRollChange,
    collisionGroup,
    collisionEnabled,
    onCollision,
    localPlayerPositionRef,
    localPlayerQuaternionRef,
    onPlanePositionChange,
    demoEnabled = true,
    onDemoStateChange,
    onDemoWaypointReached,
    onDemoComplete,
    onGyroStateChange,
    planeColor,
    flyingVolume = FLYING_AUDIO_VOLUME,
  },
  ref
) {
  const { camera } = useThree();
  const planeRef = useRef<THREE.Group>(null);
  const frameCountRef = useRef(0);

  const [isBoosting, setIsBoosting] = useState(false);
  const { scene: defaultScene } = useGLTF(DEFAULT_MODEL_PATH);
  const { scene: speedScene } = useGLTF(SPEED_MODEL_PATH);

  const virtualCameraRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const smoothCameraPos = useRef(new THREE.Vector3(0, 200, 100));
  const smoothCameraQuat = useRef(new THREE.Quaternion());

  const _forward = useRef(new THREE.Vector3()).current;
  const _right = useRef(new THREE.Vector3()).current;
  const _up = useRef(new THREE.Vector3()).current;
  const _rayDir = useRef(new THREE.Vector3()).current;
  const _pushBack = useRef(new THREE.Vector3()).current;
  const _raycaster = useRef(new THREE.Raycaster()).current;
  const _euler = useRef(new THREE.Euler()).current;
  const _targetCameraPos = useRef(new THREE.Vector3()).current;
  const _planeForward = useRef(new THREE.Vector3()).current;
  const _rollQuat = useRef(new THREE.Quaternion()).current;
  const _rollAxis = useRef(new THREE.Vector3(0, 0, 1)).current;
  const _downDirection = useRef(new THREE.Vector3(0, -1, 0)).current;

  const smoothRoll = useRef(0);
  const smoothLag = useRef(CAMERA_LAG);

  const flyToActiveRef = useRef(false);
  const boostingRef = useRef(false);

  const _lookTarget = useRef(new THREE.Vector3()).current;

  // Flying audio state
  const flyingAudioRef = useRef<THREE.PositionalAudio | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<AudioBuffer[]>([]);
  const currentTrackIndexRef = useRef(0);
  const audioInitializedRef = useRef(false);
  const audioPlayingRef = useRef(false); // Whether audio should be playing
  const audioFadeRef = useRef(1); // Current fade level (0-1)
  const targetFadeRef = useRef(1); // Target fade level
  const lastSpeedRef = useRef(0); // Track speed for stopped detection
  const flyingVolumeRef = useRef(flyingVolume); // Ref for volume to avoid callback recreation

  // Keep ref in sync with prop
  useEffect(() => {
    flyingVolumeRef.current = flyingVolume;
  }, [flyingVolume]);

  const {
    state: demoState,
    update: updateDemo,
    skipDemo,
  } = useDemoFlythrough({
    enabled: demoEnabled,
    onComplete: onDemoComplete,
    onWaypointReached: onDemoWaypointReached,
  });

  useEffect(() => {
    onDemoStateChange?.(demoState);
  }, [demoState, onDemoStateChange]);

  // Play the next flying audio track (alternating between 01 and 02)
  const playNextFlyingTrack = useCallback(() => {
    const audio = flyingAudioRef.current;
    const buffers = audioBuffersRef.current;

    if (!audio || buffers.length === 0) return;

    // Don't start new track if we're supposed to be stopped
    if (!audioPlayingRef.current) return;

    // Stop current playback if any
    if (audio.isPlaying) {
      audio.stop();
    }

    // Get the next buffer (alternating 0 -> 1 -> 0 -> 1...)
    const buffer = buffers[currentTrackIndexRef.current];
    if (buffer) {
      audio.setBuffer(buffer);
      audio.setVolume(flyingVolumeRef.current * audioFadeRef.current);
      audio.setRefDistance(5);
      audio.setRolloffFactor(1);
      audio.setLoop(false); // Don't loop individual tracks
      audio.play();

      // Switch to next track for next play
      currentTrackIndexRef.current =
        (currentTrackIndexRef.current + 1) % buffers.length;
    }
  }, []);

  // Start flying audio with fade in
  const startFlyingAudio = useCallback(() => {
    if (audioPlayingRef.current) return;
    audioPlayingRef.current = true;
    targetFadeRef.current = 1;

    const audio = flyingAudioRef.current;
    if (audio && !audio.isPlaying && audioBuffersRef.current.length > 0) {
      playNextFlyingTrack();
    }
  }, [playNextFlyingTrack]);

  // Stop flying audio with fade out
  const stopFlyingAudio = useCallback(() => {
    if (!audioPlayingRef.current) return;
    audioPlayingRef.current = false;
    targetFadeRef.current = 0;
  }, []);

  // Initialize flying audio
  useEffect(() => {
    if (audioInitializedRef.current) return;
    if (!planeRef.current) return;

    const loadAudioBuffers = async () => {
      try {
        // Get or create AudioContext from the Three.js listener
        const listener = new THREE.AudioListener();
        camera.add(listener);

        // Create PositionalAudio and attach to plane
        const positionalAudio = new THREE.PositionalAudio(listener);
        positionalAudio.setRefDistance(5);
        positionalAudio.setRolloffFactor(1);
        positionalAudio.setVolume(FLYING_AUDIO_VOLUME);
        planeRef.current!.add(positionalAudio);
        flyingAudioRef.current = positionalAudio;

        // Get audio context
        const context = listener.context;
        audioContextRef.current = context;

        // Load both audio files
        const loadBuffer = async (url: string): Promise<AudioBuffer> => {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          return await context.decodeAudioData(arrayBuffer);
        };

        const buffers = await Promise.all(FLYING_AUDIO_FILES.map(loadBuffer));

        audioBuffersRef.current = buffers;
        audioInitializedRef.current = true;

        // Set up onEnded handler to play next track
        positionalAudio.onEnded = () => {
          // Only continue to next track if we're supposed to be playing
          if (audioPlayingRef.current) {
            playNextFlyingTrack();
          }
        };

        // Don't auto-start here - let useFrame handle it based on conditions
        // Audio will start when conditions are met (not in demo, not frozen, not simple mode)
      } catch (error) {
        console.error("[PlaneController] Failed to load flying audio:", error);
      }
    };

    // Small delay to ensure planeRef is ready
    const timer = setTimeout(loadAudioBuffers, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup audio on unmount
      if (flyingAudioRef.current) {
        if (flyingAudioRef.current.isPlaying) {
          flyingAudioRef.current.stop();
        }
        flyingAudioRef.current.disconnect();
      }
    };
  }, [camera, playNextFlyingTrack]);

  useEffect(() => {
    const initialYaw = -69 * (Math.PI / 180);
    const initialEuler = new THREE.Euler(0, initialYaw, 0, "YXZ");

    virtualCameraRef.current.position.copy(camera.position);
    virtualCameraRef.current.quaternion.setFromEuler(initialEuler);
    smoothCameraPos.current.copy(camera.position);
    smoothCameraQuat.current.copy(virtualCameraRef.current.quaternion);

    camera.quaternion.copy(virtualCameraRef.current.quaternion);
  }, [camera]);

  const {
    update: updateFlight,
    keysRef,
    currentMode,
    syncFromCamera,
    isMobile,
    isGyroActive,
    isGyroAvailable,
    isGyroEnabled,
    needsGyroPermission,
    recalibrateGyro,
  } = useFlight({
    camera: virtualCameraRef.current as unknown as THREE.Camera,
    config: {
      mode: "elytra",
      baseSpeed: 60,
      minSpeed: 20,
      maxSpeed: 300,
      boostImpulse: 80,
      gravityAccel: 50,
      gravityDecel: 35,
      drag: 0.985,
      enableBounds: false,
      enableMouseLook: true,
      bankSpeedMin: 0.8 * PLANE_RESPONSIVENESS,
      bankSpeedMax: 2.5 * PLANE_RESPONSIVENESS,
      pitchSpeedMin: 0.2 * PLANE_RESPONSIVENESS,
      pitchSpeedMax: 1.0 * PLANE_RESPONSIVENESS,
      rampUpTime: 1.5,
      inputSmoothing: 8.0,
      enableGyroscope: true,
      invertGyroPitch: false, // phone down → plane pitches down (natural)
      gyroSensitivity: 0.4, // reduced for subtle control
      gyroDeadZone: 8, // ignore small tilts (degrees)
    },
    onSpeedChange,
    onModeChange,
  });

  useEffect(() => {
    onGyroStateChange?.({
      isActive: isGyroActive,
      isAvailable: isGyroAvailable,
      isEnabled: isGyroEnabled,
      needsPermission: needsGyroPermission,
      isMobile,
    });
  }, [
    isGyroActive,
    isGyroAvailable,
    isGyroEnabled,
    needsGyroPermission,
    isMobile,
    onGyroStateChange,
  ]);

  useEffect(() => {
    if (!demoState.active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "Space") {
        skipDemo();
      }
    };

    const handlePointerDown = () => {
      skipDemo();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [demoState.active, skipDemo]);

  useFrame((_, delta) => {
    if (!planeRef.current) return;

    const virtualCam = virtualCameraRef.current;
    const isDemoActive = demoState.active;
    const isFlyToActive = flyToActiveRef.current;

    if (isDemoActive) {
      updateDemo(virtualCam, delta);
    } else if (!isFlyToActive) {
      updateFlight(delta);
    }

    const boosting = !isDemoActive && !isFlyToActive && keysRef.current.boost;
    const boostingChanged = boosting !== boostingRef.current;
    boostingRef.current = boosting;
    if (boostingChanged) {
      setIsBoosting(boosting);
    }

    if (!isDemoActive && !isFlyToActive && collisionEnabled && collisionGroup) {
      _forward.set(0, 0, -1).applyQuaternion(virtualCam.quaternion);
      _right.set(1, 0, 0).applyQuaternion(virtualCam.quaternion);
      _up.set(0, 1, 0).applyQuaternion(virtualCam.quaternion);

      let closestHit = Infinity;
      _pushBack.set(0, 0, 0);

      for (let i = 0; i < NUM_COLLISION_RAYS; i++) {
        const angle = (i / NUM_COLLISION_RAYS) * Math.PI * 2;
        const coneAngle = 0.3;

        _rayDir.copy(_forward);
        _rayDir.addScaledVector(_right, Math.cos(angle) * coneAngle);
        _rayDir.addScaledVector(_up, Math.sin(angle) * coneAngle);
        _rayDir.normalize();

        _raycaster.set(virtualCam.position, _rayDir);
        _raycaster.far = COLLISION_DISTANCE * 3;

        const intersects = _raycaster.intersectObject(collisionGroup, true);

        if (intersects.length > 0) {
          const hit = intersects[0];
          if (hit.distance < COLLISION_DISTANCE) {
            closestHit = Math.min(closestHit, hit.distance);
            const pushStrength =
              (COLLISION_DISTANCE - hit.distance) / COLLISION_DISTANCE;
            _pushBack.addScaledVector(
              _rayDir,
              -pushStrength * COLLISION_PUSH_STRENGTH
            );
          }
        }
      }

      _raycaster.set(virtualCam.position, _forward);
      _raycaster.far = COLLISION_DISTANCE * 5;
      const forwardHits = _raycaster.intersectObject(collisionGroup, true);

      if (
        forwardHits.length > 0 &&
        forwardHits[0].distance < COLLISION_DISTANCE
      ) {
        closestHit = Math.min(closestHit, forwardHits[0].distance);
        const pushStrength =
          (COLLISION_DISTANCE - forwardHits[0].distance) / COLLISION_DISTANCE;
        _pushBack.addScaledVector(
          _forward,
          -pushStrength * COLLISION_PUSH_STRENGTH * 2
        );
      }

      if (_pushBack.lengthSq() > 0.001) {
        virtualCam.position.add(_pushBack);
        onCollision?.(closestHit);
      }
    }

    if (
      collisionGroup &&
      frameCountRef.current % GROUND_RAYCAST_INTERVAL === 0
    ) {
      _raycaster.set(virtualCam.position, _downDirection);
      _raycaster.far = GROUND_RAYCAST_DISTANCE;

      const groundHits = _raycaster.intersectObject(collisionGroup, true);

      if (groundHits.length > 0) {
        onGroundDistanceChange?.(groundHits[0].distance);
      } else {
        onGroundDistanceChange?.(null);
      }
    }

    planeRef.current.position.copy(virtualCam.position);
    planeRef.current.quaternion.copy(virtualCam.quaternion);

    if (localPlayerPositionRef?.current) {
      localPlayerPositionRef.current.copy(virtualCam.position);
    }
    if (localPlayerQuaternionRef?.current) {
      localPlayerQuaternionRef.current.copy(virtualCam.quaternion);
    }

    onPlanePositionChange?.(virtualCam.position, virtualCam.quaternion);

    const isSimpleMode = currentMode === "simple";

    if (isFlyToActive) {
    } else if (isDemoActive) {
      const demoSmoothingSpeed = (1 - DEMO_CAMERA_LAG) * 60;
      const demoLerpFactor = 1 - Math.exp(-demoSmoothingSpeed * delta);

      smoothCameraPos.current.lerp(virtualCam.position, demoLerpFactor);
      camera.position.copy(smoothCameraPos.current);

      smoothCameraQuat.current.slerp(virtualCam.quaternion, demoLerpFactor);
      camera.quaternion.copy(smoothCameraQuat.current);
    } else if (isSimpleMode) {
      camera.position.copy(virtualCam.position);
      camera.quaternion.copy(virtualCam.quaternion);
    } else {
      _planeForward.set(0, 0, -1).applyQuaternion(virtualCam.quaternion);

      const camDistance = CAMERA_DISTANCE;
      const camHeight = CAMERA_HEIGHT;

      _targetCameraPos.copy(virtualCam.position);
      _targetCameraPos.addScaledVector(_planeForward, -camDistance);
      _targetCameraPos.y += camHeight;

      const targetLag = boosting ? CAMERA_LAG_BOOST : CAMERA_LAG;
      smoothLag.current +=
        (targetLag - smoothLag.current) *
        Math.min(1, delta * LAG_TRANSITION_SPEED);

      const smoothingSpeed = (1 - smoothLag.current) * 60;
      const lerpFactor = 1 - Math.exp(-smoothingSpeed * delta);

      smoothCameraPos.current.lerp(_targetCameraPos, lerpFactor);

      _euler.setFromQuaternion(virtualCam.quaternion, "YXZ");
      const planeRoll = _euler.z;

      smoothRoll.current += (planeRoll - smoothRoll.current) * lerpFactor;

      camera.position.copy(smoothCameraPos.current);

      _lookTarget.copy(virtualCam.position);
      _lookTarget.addScaledVector(_planeForward, CAMERA_LOOK_OFFSET);
      camera.lookAt(_lookTarget);

      _rollQuat.setFromAxisAngle(_rollAxis, smoothRoll.current);
      camera.quaternion.multiply(_rollQuat);
    }

    // Flying audio fade management
    // Check conditions: freeze (Space), simple mode, or very low speed
    const isFrozen = keysRef.current.freeze;
    const isSimple = currentMode === "simple";

    // Get current speed from onSpeedChange callback (we track it via lastSpeedRef)
    // Speed is updated via onSpeedChange prop, but we can estimate from position delta
    // For simplicity, use the freeze and mode checks primarily
    const shouldPlayAudio =
      !isDemoActive && !isFrozen && !isSimple && audioInitializedRef.current;

    if (shouldPlayAudio && !audioPlayingRef.current) {
      startFlyingAudio();
    } else if (!shouldPlayAudio && audioPlayingRef.current) {
      stopFlyingAudio();
    }

    // Update fade level
    const audio = flyingAudioRef.current;
    if (audio) {
      const fadeSpeed = delta / FLYING_AUDIO_FADE_DURATION;

      if (audioFadeRef.current < targetFadeRef.current) {
        audioFadeRef.current = Math.min(
          audioFadeRef.current + fadeSpeed,
          targetFadeRef.current
        );
      } else if (audioFadeRef.current > targetFadeRef.current) {
        audioFadeRef.current = Math.max(
          audioFadeRef.current - fadeSpeed,
          targetFadeRef.current
        );
      }

      // Apply volume with fade
      audio.setVolume(flyingVolumeRef.current * audioFadeRef.current);

      // Stop audio completely when faded out
      if (audioFadeRef.current <= 0 && audio.isPlaying) {
        audio.stop();
      }
    }

    frameCountRef.current++;
    if (frameCountRef.current % 10 === 0) {
      onCameraYChange?.(virtualCam.position.y);

      _forward.set(0, 0, -1).applyQuaternion(virtualCam.quaternion);
      const heading = Math.atan2(_forward.x, -_forward.z) * (180 / Math.PI);
      onHeadingChange?.((heading + 360) % 360);

      _euler.setFromQuaternion(virtualCam.quaternion, "YXZ");
      const pitch = _euler.x * (180 / Math.PI);
      const roll = _euler.z * (180 / Math.PI);
      onPitchChange?.(pitch);
      onRollChange?.(roll);
    }
  });

  useImperativeHandle(
    ref,
    () => ({
      teleportTo: (position: THREE.Vector3, lookAt: THREE.Vector3) => {
        const virtualCam = virtualCameraRef.current;
        virtualCam.position.copy(position);
        virtualCam.lookAt(lookAt);
        smoothCameraPos.current.copy(position);
        smoothCameraQuat.current.copy(virtualCam.quaternion);
        camera.position.copy(position);
        camera.lookAt(lookAt);
      },
      flyTo: (
        position: THREE.Vector3,
        lookAt: THREE.Vector3,
        duration?: number
      ) => {
        const virtualCam = virtualCameraRef.current;
        const startPos = virtualCam.position.clone();
        const startQuat = virtualCam.quaternion.clone();

        flyToActiveRef.current = true;

        const distance = startPos.distanceTo(position);
        const adaptiveDuration =
          duration ?? Math.max(1.5, Math.min(4, distance / 500));

        const horizontalDistance = Math.sqrt(
          (position.x - startPos.x) ** 2 + (position.z - startPos.z) ** 2
        );

        const arcHeight = Math.min(150, horizontalDistance * 0.1);

        const travelQuat = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        const lookMatrix = new THREE.Matrix4();
        lookMatrix.lookAt(startPos, position, up);
        travelQuat.setFromRotationMatrix(lookMatrix);

        const finalQuat = new THREE.Quaternion();
        const finalLookMatrix = new THREE.Matrix4();
        finalLookMatrix.lookAt(position, lookAt, up);
        finalQuat.setFromRotationMatrix(finalLookMatrix);

        const TURN_PHASE = 0.15; // 15% turning, 85% flying with gradual orientation blend

        const startTime = performance.now();

        const animate = () => {
          const now = performance.now();
          const elapsed = (now - startTime) / 1000;
          const t = Math.min(elapsed / adaptiveDuration, 1);

          const smooth = (x: number) => x * x * (3 - 2 * x);

          if (t < TURN_PHASE) {
            const turnT = smooth(t / TURN_PHASE);

            virtualCam.position.copy(startPos);
            virtualCam.quaternion.slerpQuaternions(
              startQuat,
              travelQuat,
              turnT
            );
          } else {
            const flyT = (t - TURN_PHASE) / (1 - TURN_PHASE);
            const smoothFlyT = smooth(flyT);

            virtualCam.position.lerpVectors(startPos, position, smoothFlyT);

            const arcT = Math.sin(smoothFlyT * Math.PI);
            virtualCam.position.y += arcHeight * arcT;

            const orientT = smoothFlyT * smoothFlyT;
            virtualCam.quaternion.slerpQuaternions(
              travelQuat,
              finalQuat,
              orientT
            );
          }
          smoothCameraPos.current.copy(virtualCam.position);
          smoothCameraQuat.current.copy(virtualCam.quaternion);
          camera.position.copy(virtualCam.position);
          camera.quaternion.copy(virtualCam.quaternion);

          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            flyToActiveRef.current = false;
            smoothRoll.current = 0;
            syncFromCamera();
          }
        };
        animate();
      },
      recalibrateGyro,
    }),
    [camera, syncFromCamera, recalibrateGyro]
  );

  const coloredScene = useMemo(() => {
    const activeScene = isBoosting ? speedScene : defaultScene;
    const clone = activeScene.clone();

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;

        const getBaseColor = (mat: THREE.Material): THREE.Color => {
          if (planeColor) {
            return new THREE.Color(planeColor);
          }
          if ("color" in mat && mat.color instanceof THREE.Color) {
            return mat.color.clone();
          }
          return new THREE.Color("#FAFAFA"); // Default paper white
        };

        const createPBRMaterial = (originalMat: THREE.Material) => {
          return new THREE.MeshStandardMaterial({
            color: getBaseColor(originalMat),
            roughness: 0.4,
            metalness: 0,
            envMapIntensity: 1.2,
            side: THREE.DoubleSide,
          });
        };

        if (Array.isArray(child.material)) {
          child.material = child.material.map(createPBRMaterial);
        } else {
          child.material = createPBRMaterial(child.material);
        }
      }
    });

    return clone;
  }, [isBoosting, speedScene, defaultScene, planeColor]);

  const isDemoActive = demoState.active;
  const showPlane = !isDemoActive && currentMode === "elytra";

  const modelsLoaded = useMemo(() => {
    let hasGeometry = false;
    defaultScene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.geometry &&
        child.geometry.attributes.position
      ) {
        hasGeometry = true;
      }
    });
    return hasGeometry;
  }, [defaultScene, speedScene]);

  return (
    <group ref={planeRef}>
      {showPlane && modelsLoaded && (
        <>
          <pointLight
            position={[0, 2, -3]}
            intensity={15}
            distance={20}
            color="#ffffff"
          />
          <primitive
            object={coloredScene}
            scale={[PLANE_SCALE, PLANE_SCALE, PLANE_SCALE]}
            rotation={[0, -Math.PI / 2, 0]}
          />
        </>
      )}
    </group>
  );
});

useGLTF.preload(DEFAULT_MODEL_PATH);
useGLTF.preload(SPEED_MODEL_PATH);
