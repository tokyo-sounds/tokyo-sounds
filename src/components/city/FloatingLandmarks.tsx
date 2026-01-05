"use client";

/**
 * FloatingLandmarks Component
 *
 * Renders floating landmark icons above actual landmark positions in the 3D scene.
 * Features:
 * - Icons float above landmarks at a set height
 * - Thin white line extends from icon to ground (fades near ground)
 * - Icons fade in as player approaches (visible at 1.5km, full opacity at 500m)
 * - Always faces the camera (billboard style)
 * - MS Flight Simulator inspired design
 */

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import Image from "next/image";
import { TOKYO_LANDMARKS, LANDMARK_VISIBILITY } from "@/config/landmarks-config";
import { latLngAltToENU } from "@/lib/geo-utils";
import { TOKYO_CENTER } from "@/config/tokyo-config";

// Constants
const ICON_HEIGHT_ABOVE_GROUND = 120; // Height of icon above ground level (meters)
const LINE_FADE_START = 80; // Start fading line at this height above ground
const LINE_FADE_END = 20; // Fully faded at this height above ground
const ICON_SIZE = 48; // Size of the icon in pixels (for HTML overlay)
const VISIBILITY_DISTANCE = LANDMARK_VISIBILITY.FLOATING_ICON_DISTANCE; // 1500m
const FULL_OPACITY_DISTANCE = 500; // Full opacity at 500m

interface LandmarkIconProps {
  landmark: {
    id: string;
    name: string;
    nameJa: string;
    icon: string;
    position: THREE.Vector3;
    groundAlt: number;
  };
}

/**
 * Individual floating landmark icon with ground line
 */
function LandmarkIcon({ landmark }: LandmarkIconProps) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);
  const { camera } = useThree();

  // Create line object with gradient (vertex colors)
  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const iconY = landmark.position.y + ICON_HEIGHT_ABOVE_GROUND;
    const groundY = landmark.position.y;
    
    // Create multiple segments for gradient effect
    const segments = 20;
    const positions: number[] = [];
    const colors: number[] = [];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = iconY - t * (iconY - groundY);
      
      positions.push(landmark.position.x, y, landmark.position.z);
      
      // Calculate alpha based on height (fade towards ground)
      const heightAboveGround = y - groundY;
      let alpha = 1;
      if (heightAboveGround < LINE_FADE_START) {
        alpha = Math.max(0, (heightAboveGround - LINE_FADE_END) / (LINE_FADE_START - LINE_FADE_END));
      }
      
      // White color with varying intensity to simulate alpha
      colors.push(alpha, alpha, alpha);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    
    return new THREE.Line(geometry, material);
  }, [landmark.position]);

  useFrame(() => {
    if (!groupRef.current) return;

    // Calculate distance to camera
    const distance = camera.position.distanceTo(landmark.position);

    // Calculate opacity based on distance
    let targetOpacity = 0;
    if (distance <= FULL_OPACITY_DISTANCE) {
      targetOpacity = 1;
    } else if (distance < VISIBILITY_DISTANCE) {
      // Linear interpolation
      targetOpacity = 1 - (distance - FULL_OPACITY_DISTANCE) / (VISIBILITY_DISTANCE - FULL_OPACITY_DISTANCE);
    }

    // Smooth opacity transition
    opacityRef.current += (targetOpacity - opacityRef.current) * 0.1;

    // Update line material opacity
    const material = lineObject.material as THREE.LineBasicMaterial;
    if (material) {
      material.opacity = opacityRef.current * 0.6; // Max 60% opacity for the line
    }

    // Hide if too transparent
    groupRef.current.visible = opacityRef.current > 0.01;
  });

  return (
    <group ref={groupRef}>
      {/* Gradient line from icon to ground */}
      <primitive object={lineObject} />

      {/* HTML overlay for the icon - positioned at icon height */}
      <Html
        position={[
          landmark.position.x,
          landmark.position.y + ICON_HEIGHT_ABOVE_GROUND,
          landmark.position.z,
        ]}
        center
        distanceFactor={20}
        occlude={false}
        style={{
          opacity: opacityRef.current,
          transition: "opacity 0.15s ease-out",
          pointerEvents: "none",
        }}
        zIndexRange={[100, 0]}
      >
        <div className="flex flex-col items-center">
          <div
            className="relative rounded-lg overflow-hidden shadow-lg"
            style={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }}
          >
            <Image
              src={landmark.icon}
              alt={landmark.name}
              width={ICON_SIZE}
              height={ICON_SIZE}
              className="object-cover"
              priority
            />
          </div>
          {/* Optional: Show name below icon */}
          <div
            className="mt-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-white text-xs font-medium whitespace-nowrap"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            }}
          >
            {landmark.nameJa}
          </div>
        </div>
      </Html>
    </group>
  );
}

interface FloatingLandmarksProps {
  enabled?: boolean;
}

/**
 * Renders all floating landmark icons in the scene
 */
export function FloatingLandmarks({ enabled = true }: FloatingLandmarksProps) {
  // Pre-calculate ENU positions for all landmarks
  const landmarksWithPositions = useMemo(() => {
    return TOKYO_LANDMARKS.map((landmark) => {
      const position = latLngAltToENU(
        landmark.lat,
        landmark.lng,
        landmark.groundAlt,
        TOKYO_CENTER.lat,
        TOKYO_CENTER.lng,
        0
      );

      return {
        id: landmark.id,
        name: landmark.name,
        nameJa: landmark.nameJa,
        icon: landmark.icon,
        position,
        groundAlt: landmark.groundAlt,
      };
    });
  }, []);

  if (!enabled) return null;

  return (
    <>
      {landmarksWithPositions.map((landmark) => (
        <LandmarkIcon key={landmark.id} landmark={landmark} />
      ))}
    </>
  );
}
