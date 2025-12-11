"use client";

/**
 * GoogleTilesScene Component
 * Renders Google 3D Tiles transformed to local ENU coordinates (flat Tokyo)
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TilesRenderer, TilesPlugin } from "3d-tiles-renderer/r3f";
import { WGS84_ELLIPSOID } from "3d-tiles-renderer/three";
import {
  GoogleCloudAuthPlugin,
  GLTFExtensionsPlugin,
} from "3d-tiles-renderer/plugins";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { TOKYO_CENTER, TimeOfDayPreset } from "@/config/tokyo-config";
import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";

interface GoogleTilesSceneProps {
  apiKey: string;
  onTilesLoaded?: () => void;
  onError?: (error: any) => void;
  onStatusChange?: (status: string) => void;
  showMeshes?: boolean;
  wireframe?: boolean;
  collisionGroupRef?: React.MutableRefObject<THREE.Group | null>;
}

/** getDRACOLoader
 *
 * Singleton DRACO loader
 * @returns DRACO loader
 */
let dracoLoaderInstance: DRACOLoader | null = null;
function getDRACOLoader() {
  if (!dracoLoaderInstance) {
    dracoLoaderInstance = new DRACOLoader();
    dracoLoaderInstance.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
    );
  }
  return dracoLoaderInstance;
}

/**
 * Build an ECEF -> local frame matrix using library ENU and a Y-up remap.
 *
 * - getEastNorthUpFrame returns ENU->ECEF (X=east, Y=north, Z=up).
 * - We invert it for ECEF->ENU.
 * - Then apply a remap to match Three.js Y-up world: X=east, Y=up, Z=north.
 */
function createECEFtoENUMatrix(
  centerLat: number,
  centerLng: number
): THREE.Matrix4 {
  const enuToECEF = new THREE.Matrix4();
  const latRad = THREE.MathUtils.degToRad(centerLat);
  const lngRad = THREE.MathUtils.degToRad(centerLng);
  WGS84_ELLIPSOID.getEastNorthUpFrame(latRad, lngRad, 0, enuToECEF); // ENU -> ECEF (expects radians)

  const ecefToENU = new THREE.Matrix4().copy(enuToECEF).invert(); // ECEF -> ENU (X=east, Y=north, Z=up)

  const enuToYUp = new THREE.Matrix4().set(
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    -1,
    0,
    0,
    0,
    0,
    0,
    1
  );

  const transformMatrix = new THREE.Matrix4().multiplyMatrices(
    enuToYUp,
    ecefToENU
  );
  return transformMatrix;
}

/** TilesTransformer
 *
 * Component to transform the tiles group
 * @param children - Children
 * @param groupRef - Group reference
 * @returns null
 */
function TilesTransformer({
  children,
  groupRef,
}: {
  children: React.ReactNode;
  groupRef?: React.RefObject<THREE.Group | null>;
}) {
  const internalRef = useRef<THREE.Group>(null);
  const transformAppliedRef = useRef(false);
  const ref = groupRef || internalRef;

  useEffect(() => {
    if (ref.current && !transformAppliedRef.current) {
      const transformMatrix = createECEFtoENUMatrix(
        TOKYO_CENTER.lat,
        TOKYO_CENTER.lng
      );
      ref.current.matrix.copy(transformMatrix);
      ref.current.matrixAutoUpdate = false;
      transformAppliedRef.current = true;
      console.log(
        "[GoogleTiles] Applied ENU transform - Tokyo is now at origin"
      );
    }
  }, [ref]);

  return <group ref={ref as React.RefObject<THREE.Group>}>{children}</group>;
}

/** SkyBox
 *
 * Sky with sun shader - responds to time of day
 * @returns null
 */
function SkyBox({ preset }: { preset: TimeOfDayPreset }) {
  const { scene } = useThree();
  const skyRef = useRef<Sky | null>(null);

  useEffect(() => {
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);
    skyRef.current = sky;

    return () => {
      scene.remove(sky);
      sky.geometry.dispose();
      (sky.material as THREE.ShaderMaterial).dispose();
    };
  }, [scene]);

  useEffect(() => {
    if (!skyRef.current) return;

    const uniforms = skyRef.current.material.uniforms;
    uniforms["turbidity"].value = preset.sky.turbidity;
    uniforms["rayleigh"].value = preset.sky.rayleigh;
    uniforms["mieCoefficient"].value = preset.sky.mieCoefficient;
    uniforms["mieDirectionalG"].value = preset.sky.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - preset.sunElevation);
    const theta = THREE.MathUtils.degToRad(preset.sunAzimuth);
    const sun = new THREE.Vector3();
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms["sunPosition"].value.copy(sun);
  }, [preset]);

  return null;
}

export function GoogleTilesScene({
  apiKey,
  onTilesLoaded,
  onError,
  onStatusChange,
  showMeshes = true,
  wireframe = false,
  collisionGroupRef,
}: GoogleTilesSceneProps) {
  const [modelCount, setModelCount] = useState(0);
  const tilesGroupRef = useRef<THREE.Group>(null);
  const wireframeRef = useRef(wireframe);
  const preset = useTimeOfDayStore((state) => state.preset);

  useEffect(() => {
    if (collisionGroupRef) {
      collisionGroupRef.current = tilesGroupRef.current;
    }
  }, [collisionGroupRef, modelCount]);

  const handleLoadTileset = useCallback(() => {
    console.log("[GoogleTiles] Tileset loaded!");
    onTilesLoaded?.();
    onStatusChange?.("Tileset loaded");
  }, [onTilesLoaded, onStatusChange]);

  const handleLoadError = useCallback(
    (event: any) => {
      const errorMsg = event?.error?.message || "Unknown error";
      console.error("[GoogleTiles] Load error:", errorMsg);
      onError?.(event);
    },
    [onError]
  );

  useEffect(() => {
    if (modelCount > 0 && modelCount % 10 === 0) {
      onStatusChange?.(`${modelCount} tiles loaded`);
    }
  }, [modelCount, onStatusChange]);

  // toggle mesh visibility
  useEffect(() => {
    if (tilesGroupRef.current) {
      tilesGroupRef.current.visible = showMeshes;
    }
  }, [showMeshes]);

  // toggle wireframe mode
  useEffect(() => {
    wireframeRef.current = wireframe;
    if (tilesGroupRef.current) {
      tilesGroupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          materials.forEach((mat) => {
            if (
              mat instanceof THREE.MeshStandardMaterial ||
              mat instanceof THREE.MeshBasicMaterial
            ) {
              mat.wireframe = wireframe;
            }
          });
        }
      });
    }
  }, [wireframe]);

  const handleLoadModel = useCallback(() => {
    setModelCount((c) => {
      const newCount = c + 1;
      if (newCount <= 3 || newCount % 50 === 0) {
        console.log(`[GoogleTiles] Loaded ${newCount} models`);
      }
      return newCount;
    });

    if (tilesGroupRef.current) {
      tilesGroupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          obj.receiveShadow = true;
          obj.castShadow = true;
          
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          materials.forEach((mat) => {
            if (
              mat instanceof THREE.MeshStandardMaterial ||
              mat instanceof THREE.MeshBasicMaterial
            ) {
              if (wireframeRef.current) {
                mat.wireframe = true;
              }
            }
          });
        }
      });
    }
  }, []);

  if (!apiKey) return null;

  const sunPhi = THREE.MathUtils.degToRad(90 - preset.sunElevation);
  const sunTheta = THREE.MathUtils.degToRad(preset.sunAzimuth);
  const lightDistance = 200;
  const lightX = lightDistance * Math.sin(sunPhi) * Math.sin(sunTheta);
  const lightY = lightDistance * Math.cos(sunPhi);
  const lightZ = lightDistance * Math.sin(sunPhi) * Math.cos(sunTheta);

  return (
    <>
      <SkyBox preset={preset} />

      <TilesTransformer groupRef={tilesGroupRef}>
        <TilesRenderer
          onLoadTileSet={handleLoadTileset}
          onLoadError={handleLoadError}
          onLoadModel={handleLoadModel}
        >
          <TilesPlugin
            plugin={GLTFExtensionsPlugin}
            args={{ dracoLoader: getDRACOLoader() }}
          />
          <TilesPlugin
            plugin={GoogleCloudAuthPlugin}
            args={{ apiToken: apiKey }}
          />
        </TilesRenderer>
      </TilesTransformer>

      <ambientLight
        intensity={preset.ambient.intensity}
        color={preset.ambient.color}
      />
      <directionalLight
        position={[lightX, lightY, lightZ]}
        intensity={preset.directional.intensity}
        color={preset.directional.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={1000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
        shadow-bias={-0.0001}
      />
      <hemisphereLight
        args={[
          preset.hemisphere.skyColor,
          preset.hemisphere.groundColor,
          preset.hemisphere.intensity,
        ]}
      />
    </>
  );
}
