"use client";

/**
 * PlaneController Component
 * Renders a plane model as the player object with chase camera following behind
 * Switches between default and speed model when boosting (Shift)
 * Supports demo flythrough mode for first-time visitors
 */

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useFlight } from "@/hooks/useFlight";
import { useDemoFlythrough, type DemoState } from "@/hooks/useDemoFlythrough";
import { type MovementMode } from "@/lib/flight";
import { type DemoWaypoint } from "@/config/tokyo-config";

const CAMERA_DISTANCE = 0.6; // distance behind plane
const CAMERA_HEIGHT = 0.2; // height above plane
const CAMERA_LAG = 0.92; // lower = more responsive (0.9 = fast, 0.95 = slow)
const CAMERA_LAG_BOOST = 0.85; // slightly tighter follow during boost (not too aggressive)
const LAG_TRANSITION_SPEED = 3.0; // how fast to transition between lag values
const PLANE_RESPONSIVENESS = 1.1; // plane turns slightly faster than camera follows
const PLANE_SCALE = 0.1; // 10% of original size (90% reduction)
const DEMO_CAMERA_LAG = 0.95; // slower, more cinematic movement
const DEFAULT_MODEL_PATH = "/models/plane_blence.glb";
const SPEED_MODEL_PATH = "/models/plane_speed.glb";

interface PlaneControllerProps {
  onSpeedChange?: (speed: number) => void;
  onModeChange?: (mode: MovementMode) => void;
  onCameraYChange?: (y: number) => void;
  onHeadingChange?: (heading: number) => void;
  onPitchChange?: (pitch: number) => void;
  onRollChange?: (roll: number) => void;
  collisionGroup?: THREE.Group | null;
  collisionEnabled?: boolean;
  onCollision?: (distance: number) => void;
  onPlanePositionChange?: (position: THREE.Vector3) => void;
  demoEnabled?: boolean;
  onDemoStateChange?: (state: DemoState) => void;
  onDemoWaypointReached?: (waypoint: DemoWaypoint) => void;
  onDemoComplete?: () => void;
}

const COLLISION_DISTANCE = 2;
const COLLISION_PUSH_STRENGTH = 1;
const NUM_COLLISION_RAYS = 8;

export function PlaneController({
  onSpeedChange,
  onModeChange,
  onCameraYChange,
  onHeadingChange,
  onPitchChange,
  onRollChange,
  collisionGroup,
  collisionEnabled,
  onCollision,
  onPlanePositionChange,
  demoEnabled = true,
  onDemoStateChange,
  onDemoWaypointReached,
  onDemoComplete,
}: PlaneControllerProps) {
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

  const smoothRoll = useRef(0);
  const smoothLag = useRef(CAMERA_LAG);

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

  useEffect(() => {
    virtualCameraRef.current.position.copy(camera.position);
    virtualCameraRef.current.quaternion.copy(camera.quaternion);
    smoothCameraPos.current.copy(camera.position);
    smoothCameraQuat.current.copy(camera.quaternion);
  }, [camera]);

  const { update: updateFlight, keysRef, currentMode } = useFlight({
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
      pitchSpeedMin: 0.6 * PLANE_RESPONSIVENESS,
      pitchSpeedMax: 2.0 * PLANE_RESPONSIVENESS,
    },
    onSpeedChange,
    onModeChange,
  });

  useEffect(() => {
    if (!demoState.active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "Space") {
        skipDemo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [demoState.active, skipDemo]);

  useFrame((_, delta) => {
    if (!planeRef.current) return;

    const virtualCam = virtualCameraRef.current;
    const isDemoActive = demoState.active;

    if (isDemoActive) {
      updateDemo(virtualCam, delta);
    } else {
      updateFlight(delta);
    }

    const boosting = !isDemoActive && keysRef.current.boost;
    if (boosting !== isBoosting) {
      setIsBoosting(boosting);
    }

    if (!isDemoActive && collisionEnabled && collisionGroup) {
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
            const pushStrength = (COLLISION_DISTANCE - hit.distance) / COLLISION_DISTANCE;
            _pushBack.addScaledVector(_rayDir, -pushStrength * COLLISION_PUSH_STRENGTH);
          }
        }
      }

      _raycaster.set(virtualCam.position, _forward);
      _raycaster.far = COLLISION_DISTANCE * 5;
      const forwardHits = _raycaster.intersectObject(collisionGroup, true);

      if (forwardHits.length > 0 && forwardHits[0].distance < COLLISION_DISTANCE) {
        closestHit = Math.min(closestHit, forwardHits[0].distance);
        const pushStrength = (COLLISION_DISTANCE - forwardHits[0].distance) / COLLISION_DISTANCE;
        _pushBack.addScaledVector(_forward, -pushStrength * COLLISION_PUSH_STRENGTH * 2);
      }

      if (_pushBack.lengthSq() > 0.001) {
        virtualCam.position.add(_pushBack);
        onCollision?.(closestHit);
      }
    }

    planeRef.current.position.copy(virtualCam.position);
    planeRef.current.quaternion.copy(virtualCam.quaternion);

    onPlanePositionChange?.(virtualCam.position);

    const isSimpleMode = currentMode === "simple";

    if (isDemoActive) {
      smoothCameraPos.current.lerp(virtualCam.position, 1 - DEMO_CAMERA_LAG);
      camera.position.copy(smoothCameraPos.current);

      smoothCameraQuat.current.slerp(virtualCam.quaternion, 1 - DEMO_CAMERA_LAG);
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
      smoothLag.current += (targetLag - smoothLag.current) * Math.min(1, delta * LAG_TRANSITION_SPEED);

      smoothCameraPos.current.lerp(_targetCameraPos, 1 - smoothLag.current);

      _euler.setFromQuaternion(virtualCam.quaternion, "YXZ");
      const planeRoll = _euler.z;

      smoothRoll.current += (planeRoll - smoothRoll.current) * (1 - smoothLag.current);

      camera.position.copy(smoothCameraPos.current);

      camera.lookAt(virtualCam.position);

      _rollQuat.setFromAxisAngle(_rollAxis, smoothRoll.current);
      camera.quaternion.multiply(_rollQuat);
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

  const activeScene = isBoosting ? speedScene : defaultScene;

  const isDemoActive = demoState.active;
  const showPlane = !isDemoActive && currentMode === "elytra";

  return (
    <group ref={planeRef}>
      {showPlane && (
        <primitive
          object={activeScene.clone()}
          scale={[PLANE_SCALE, PLANE_SCALE, PLANE_SCALE]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      )}
    </group>
  );
}

useGLTF.preload(DEFAULT_MODEL_PATH);
useGLTF.preload(SPEED_MODEL_PATH);
