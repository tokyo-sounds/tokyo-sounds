"use client";

/**
 * DistrictTracker Component
 * Lightweight district detection without Lyria API dependency
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  TOKYO_DISTRICTS,
  TOKYO_CENTER,
  type District,
} from "@/config/tokyo-config";
import {
  calculateDistrictWeights,
  enuToLatLngAlt,
  getDistrictAtPosition,
} from "@/lib/geo-utils";
import type { DistrictDebugInfo } from "./DistrictLyriaAudio";

interface DistrictTrackerProps {
  onCurrentDistrictChange?: (district: District | null) => void;
  onDebugUpdate?: (districts: DistrictDebugInfo[]) => void;
}

/** DistrictTracker
 *
 * Tracks camera position and detects current district
 * @param onCurrentDistrictChange - Callback when district changes
 * @param onDebugUpdate - Optional callback for debug info
 * @returns null
 */
export function DistrictTracker({
  onCurrentDistrictChange,
  onDebugUpdate,
}: DistrictTrackerProps) {
  const { camera } = useThree();
  const cameraPosRef = useRef(new THREE.Vector3());
  const frameCountRef = useRef(0);
  const currentDistrictRef = useRef<District | null>(null);
  const lastDebugInfoRef = useRef<DistrictDebugInfo[]>(
    TOKYO_DISTRICTS.map((d) => ({
      name: d.name,
      nameJa: d.nameJa,
      weight: 0,
      distance: 0,
      color: d.color,
    }))
  );

  useFrame(() => {
    frameCountRef.current++;
    if (frameCountRef.current % 3 !== 0) return; // 20fps

    camera.getWorldPosition(cameraPosRef.current);

    // Convert ENU coordinates to lat/lng
    const geo = enuToLatLngAlt(
      cameraPosRef.current,
      TOKYO_CENTER.lat,
      TOKYO_CENTER.lng,
      0
    );

    // Detect current district
    const currentDistrict = getDistrictAtPosition(geo.lat, geo.lng);
    if (currentDistrict !== currentDistrictRef.current) {
      currentDistrictRef.current = currentDistrict;
      onCurrentDistrictChange?.(currentDistrict);

      console.log(
        `[DistrictTracker] Position: ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(
          4
        )} → ${currentDistrict?.name || "none"}`
      );
    }

    // Update debug info periodically
    if (onDebugUpdate && frameCountRef.current % 30 === 0) {
      const districtWeights = calculateDistrictWeights(geo.lat, geo.lng);
      districtWeights.forEach((dw, i) => {
        lastDebugInfoRef.current[i] = {
          name: dw.district.name,
          nameJa: dw.district.nameJa,
          weight: dw.weight,
          distance: dw.distance,
          color: dw.district.color,
          cameraLat: geo.lat,
          cameraLng: geo.lng,
        };
      });
      onDebugUpdate(lastDebugInfoRef.current);
    }
  });

  return null;
}
