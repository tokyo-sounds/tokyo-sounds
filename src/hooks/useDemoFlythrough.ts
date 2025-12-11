"use client";

/**
 * useDemoFlythrough Hook
 * Orchestrates a scenic flythrough of Tokyo landmarks for first-time visitors
 */

import { useRef, useCallback, useState, useEffect } from "react";
import * as THREE from "three";
import {
  DEMO_WAYPOINTS,
  DEMO_TRANSITION_TIME,
  DEMO_VISITED_KEY,
  TOKYO_CENTER,
  type DemoWaypoint,
} from "@/config/tokyo-config";
import { latLngAltToENU } from "@/lib/geo-utils";

const ORIGIN_LAT = TOKYO_CENTER.lat;
const ORIGIN_LNG = TOKYO_CENTER.lng;

export type DemoPhase = "idle" | "transitioning" | "orbiting" | "returning" | "complete";

export interface DemoState {
  active: boolean;
  phase: DemoPhase;
  currentWaypointIndex: number;
  currentWaypoint: DemoWaypoint | null;
  progress: number; // 0-1 within current phase
}

export interface UseDemoFlythroughOptions {
  enabled: boolean;
  onComplete?: () => void;
  onWaypointReached?: (waypoint: DemoWaypoint) => void;
}

/**
 * Smooth easing function for transitions
 */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Calculate orbit position around a waypoint
 * @param waypoint The waypoint to orbit
 * @param angle Orbit angle in radians
 * @returns Position in ENU coordinates
 */
function getOrbitPosition(waypoint: DemoWaypoint, angle: number): THREE.Vector3 {
  const center = latLngAltToENU(
    waypoint.lat,
    waypoint.lng,
    waypoint.orbitAltitude,
    ORIGIN_LAT,
    ORIGIN_LNG
  );

  const offsetX = Math.cos(angle) * waypoint.orbitRadius;
  const offsetZ = Math.sin(angle) * waypoint.orbitRadius;

  return new THREE.Vector3(
    center.x + offsetX,
    center.y,
    center.z + offsetZ
  );
}

/**
 * Get the lookAt target for a waypoint (center of the landmark)
 */
function getLookAtTarget(waypoint: DemoWaypoint): THREE.Vector3 {
  return latLngAltToENU(
    waypoint.lat,
    waypoint.lng,
    waypoint.lookAtAltitude,
    ORIGIN_LAT,
    ORIGIN_LNG
  );
}

/**
 * Check if this is the user's first visit
 */
function isFirstVisit(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_VISITED_KEY) !== "true";
}

/**
 * Mark the user as having visited
 */
function markVisited(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_VISITED_KEY, "true");
}

/**
 * Clear the visited flag (for debug/testing)
 */
export function clearVisitedFlag(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_VISITED_KEY);
}

export function useDemoFlythrough({
  enabled,
  onComplete,
  onWaypointReached,
}: UseDemoFlythroughOptions) {
  const [state, setState] = useState<DemoState>({
    active: false,
    phase: "idle",
    currentWaypointIndex: 0,
    currentWaypoint: null,
    progress: 0,
  });

  const phaseRef = useRef<DemoPhase>("idle");
  const waypointIndexRef = useRef(0);
  const phaseTimeRef = useRef(0);
  const orbitAngleRef = useRef(0);
  const activeRef = useRef(false);

  const startPosRef = useRef(new THREE.Vector3());
  const targetPosRef = useRef(new THREE.Vector3());
  const startQuatRef = useRef(new THREE.Quaternion());
  const targetQuatRef = useRef(new THREE.Quaternion());

  const _lookTarget = useRef(new THREE.Vector3()).current;
  const _flipQuat = useRef(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)).current;

  useEffect(() => {
    if (enabled && isFirstVisit() && !activeRef.current) {
      startDemo();
    }
  }, [enabled]);

  /**
   * Start the demo flythrough
   */
  const startDemo = useCallback(() => {
    if (DEMO_WAYPOINTS.length === 0) return;

    activeRef.current = true;
    phaseRef.current = "transitioning";
    waypointIndexRef.current = 0;
    phaseTimeRef.current = 0;
    orbitAngleRef.current = 0;

    setState({
      active: true,
      phase: "transitioning",
      currentWaypointIndex: 0,
      currentWaypoint: DEMO_WAYPOINTS[0],
      progress: 0,
    });
  }, []);

  /**
   * Stop the demo and return control to user
   */
  const stopDemo = useCallback(() => {
    activeRef.current = false;
    phaseRef.current = "idle";
    markVisited();

    setState({
      active: false,
      phase: "complete",
      currentWaypointIndex: 0,
      currentWaypoint: null,
      progress: 0,
    });

    onComplete?.();
  }, [onComplete]);

  /**
   * Skip to the end of the demo
   */
  const skipDemo = useCallback(() => {
    stopDemo();
  }, [stopDemo]);

  /**
   * Update the demo (call from useFrame)
   * @param camera The camera/object to control
   * @param delta Delta time in seconds
   * @returns true if demo is actively controlling the camera
   */
  const update = useCallback(
    (camera: THREE.Object3D, delta: number): boolean => {
      if (!activeRef.current) return false;

      const dt = Math.min(delta, 0.1);
      phaseTimeRef.current += dt;

      const waypoint = DEMO_WAYPOINTS[waypointIndexRef.current];
      if (!waypoint) {
        stopDemo();
        return false;
      }

      switch (phaseRef.current) {
        case "transitioning": {
          const transitionDuration = DEMO_TRANSITION_TIME;
          const t = Math.min(phaseTimeRef.current / transitionDuration, 1);
          const eased = smoothstep(t);

          if (phaseTimeRef.current <= dt) {
            startPosRef.current.copy(camera.position);
            startQuatRef.current.copy(camera.quaternion);

            const targetPos = getOrbitPosition(waypoint, 0);
            targetPosRef.current.copy(targetPos);

            const tempObj = new THREE.Object3D();
            tempObj.position.copy(startPosRef.current);
            tempObj.lookAt(targetPos);
            targetQuatRef.current.copy(tempObj.quaternion).multiply(_flipQuat);
          }

          camera.position.lerpVectors(startPosRef.current, targetPosRef.current, eased);
          camera.quaternion.slerpQuaternions(startQuatRef.current, targetQuatRef.current, eased);

          if (t >= 1) {
            phaseRef.current = "orbiting";
            phaseTimeRef.current = 0;
            orbitAngleRef.current = 0;
            onWaypointReached?.(waypoint);
          }

          setState((prev) => ({
            ...prev,
            phase: "transitioning",
            progress: t,
          }));
          break;
        }

        case "orbiting": {
          const dwellTime = waypoint.dwellTime;
          const t = Math.min(phaseTimeRef.current / dwellTime, 1);

          const orbitSpeed = (Math.PI * 0.5) / dwellTime;
          orbitAngleRef.current += orbitSpeed * dt;

          const orbitPos = getOrbitPosition(waypoint, orbitAngleRef.current);
          camera.position.copy(orbitPos);

          _lookTarget.copy(getLookAtTarget(waypoint));
          camera.lookAt(_lookTarget);
          camera.quaternion.multiply(_flipQuat);

          if (t >= 1) {
            const nextIndex = waypointIndexRef.current + 1;

            if (nextIndex >= DEMO_WAYPOINTS.length) {
              phaseRef.current = "returning";
              phaseTimeRef.current = 0;

              startPosRef.current.copy(camera.position);
              startQuatRef.current.copy(camera.quaternion);

              const returnWaypoint = DEMO_WAYPOINTS[0];
              const targetPos = getOrbitPosition(returnWaypoint, 0);
              targetPosRef.current.copy(targetPos);

              const tempObj = new THREE.Object3D();
              tempObj.position.copy(startPosRef.current);
              tempObj.lookAt(targetPos);
              targetQuatRef.current.copy(tempObj.quaternion).multiply(_flipQuat);
            } else {
              waypointIndexRef.current = nextIndex;
              phaseRef.current = "transitioning";
              phaseTimeRef.current = 0;

              setState((prev) => ({
                ...prev,
                currentWaypointIndex: nextIndex,
                currentWaypoint: DEMO_WAYPOINTS[nextIndex],
              }));
            }
          }

          setState((prev) => ({
            ...prev,
            phase: "orbiting",
            progress: t,
          }));
          break;
        }

        case "returning": {
          const transitionDuration = DEMO_TRANSITION_TIME;
          const t = Math.min(phaseTimeRef.current / transitionDuration, 1);
          const eased = smoothstep(t);

          camera.position.lerpVectors(startPosRef.current, targetPosRef.current, eased);
          camera.quaternion.slerpQuaternions(startQuatRef.current, targetQuatRef.current, eased);

          if (t >= 1) {
            stopDemo();
          }

          setState((prev) => ({
            ...prev,
            phase: "returning",
            progress: t,
          }));
          break;
        }
      }

      return true;
    },
    [onWaypointReached, stopDemo]
  );

  return {
    state,
    startDemo,
    stopDemo,
    skipDemo,
    update,
    isFirstVisit: isFirstVisit(),
  };
}
