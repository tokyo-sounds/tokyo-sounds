"use client";

/**
 * OtherPlayers Component
 *
 * Renders other players' planes in the 3D scene.
 *
 * - Smooth interpolation between position updates
 * - Distance-based opacity (fade out 300-500m)
 * - Custom plane color per player
 * - Small name label above each plane
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  type PlayerState,
  VISIBILITY_RADIUS,
  FADE_START_DISTANCE,
} from "@/types/multiplayer";

const PLANE_SCALE = 0.1;
const DEFAULT_MODEL_PATH = "/models/plane_balance.glb";
const INTERPOLATION_SPEED = 10; // faster catch-up
const HALO_RADIUS = 1.2;
const HALO_OPACITY = 0.6;
const HALO_Y_OFFSET = -0.3; // slightly below the plane

interface OtherPlayerPlaneProps {
  player: PlayerState;
  localPlayerPosition: THREE.Vector3;
}

/**
 * PlayerHalo Component
 *
 * Renders an emissive halo beneath the plane for visibility.
 * Uses a ref for opacity to avoid triggering re-renders every frame.
 */
function PlayerHalo({ color, opacityRef }: { color: string; opacityRef: React.MutableRefObject<number> }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.opacity = opacityRef.current * HALO_OPACITY;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, HALO_Y_OFFSET, 0]}>
      <ringGeometry args={[HALO_RADIUS * 0.3, HALO_RADIUS, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={HALO_OPACITY}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * OtherPlayerPlane Component
 *
 * Renders a plane for a nearby player.
 *
 * @param player - The player state.
 * @param localPlayerPosition - The position of the local player.
 * @returns A React component that renders a plane for a nearby player.
 */
function OtherPlayerPlane({
  player,
  localPlayerPosition,
}: OtherPlayerPlaneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(DEFAULT_MODEL_PATH);

  const currentPos = useRef(
    new THREE.Vector3(player.position.x, player.position.y, player.position.z)
  );
  const currentQuat = useRef(
    new THREE.Quaternion(
      player.quaternion.x,
      player.quaternion.y,
      player.quaternion.z,
      player.quaternion.w
    )
  );
  const currentOpacity = useRef(1);

  const targetPos = useRef(
    new THREE.Vector3(player.position.x, player.position.y, player.position.z)
  );
  const targetQuat = useRef(
    new THREE.Quaternion(
      player.quaternion.x,
      player.quaternion.y,
      player.quaternion.z,
      player.quaternion.w
    )
  );

  useEffect(() => {
    targetPos.current.set(
      player.position.x,
      player.position.y,
      player.position.z
    );
    targetQuat.current.set(
      player.quaternion.x,
      player.quaternion.y,
      player.quaternion.z,
      player.quaternion.w
    );
  }, [
    player.position.x,
    player.position.y,
    player.position.z,
    player.quaternion.x,
    player.quaternion.y,
    player.quaternion.z,
    player.quaternion.w,
  ]);

  const coloredScene = useMemo(() => {
    const clone = scene.clone();

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((mat) => {
            const newMat = mat.clone();
            if ("color" in newMat) {
              newMat.color = new THREE.Color(player.color);
            }
            if ("transparent" in newMat) {
              newMat.transparent = true;
            }
            return newMat;
          });
        } else {
          const newMat = child.material.clone();
          if ("color" in newMat) {
            newMat.color = new THREE.Color(player.color);
          }
          if ("transparent" in newMat) {
            newMat.transparent = true;
          }
          child.material = newMat;
        }
      }
    });

    return clone;
  }, [scene, player.color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    currentPos.current.lerp(
      targetPos.current,
      Math.min(1, delta * INTERPOLATION_SPEED)
    );
    groupRef.current.position.copy(currentPos.current);

    currentQuat.current.slerp(
      targetQuat.current,
      Math.min(1, delta * INTERPOLATION_SPEED)
    );
    groupRef.current.quaternion.copy(currentQuat.current);

    const distance = currentPos.current.distanceTo(localPlayerPosition);

    let targetOpacity = 1;
    if (distance > FADE_START_DISTANCE) {
      const fadeRange = VISIBILITY_RADIUS - FADE_START_DISTANCE;
      const fadeProgress = (distance - FADE_START_DISTANCE) / fadeRange;
      targetOpacity = Math.max(0, 1 - fadeProgress);
    }

    currentOpacity.current +=
      (targetOpacity - currentOpacity.current) * Math.min(1, delta * 5);

    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if ("opacity" in mat) {
              mat.opacity = currentOpacity.current;
            }
          });
        } else if ("opacity" in child.material) {
          child.material.opacity = currentOpacity.current;
        }
      }
    });

    groupRef.current.visible = currentOpacity.current > 0.05;
  });

  if (currentOpacity.current <= 0.05) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <PlayerHalo color={player.color} opacityRef={currentOpacity} />

      <primitive
        object={coloredScene}
        scale={[PLANE_SCALE, PLANE_SCALE, PLANE_SCALE]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      <Html
        position={[0, 0.15, 0]}
        center
        distanceFactor={15}
        occlude={false}
        style={{
          opacity: currentOpacity.current,
          transition: "opacity 0.1s",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            color: player.color,
            // padding: "2px 8px",
            // borderRadius: "4px",
            fontSize: "36px",
            fontFamily: "monospace",
            fontWeight: "semibold",
            whiteSpace: "nowrap",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {/* TODO: 多言語対応 */}
          {player.name || "名無し"}
        </div>
      </Html>
    </group>
  );
}

interface OtherPlayersProps {
  players: PlayerState[];
  localPlayerPosition: THREE.Vector3;
}

/**
 * Renders all nearby players in the 3D scene
 */
export function OtherPlayers({
  players,
  localPlayerPosition,
}: OtherPlayersProps) {
  return (
    <>
      {players.map((player) => (
        <OtherPlayerPlane
          key={player.id}
          player={player}
          localPlayerPosition={localPlayerPosition}
        />
      ))}
    </>
  );
}

useGLTF.preload(DEFAULT_MODEL_PATH);
