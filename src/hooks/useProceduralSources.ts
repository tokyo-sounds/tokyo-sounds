/**
 * useProceduralSources Hook
 * Generates dynamic SpatialAudioSource[] based on player position
 * Uses deterministic grid-based spawning with velocity-adaptive range
 * 
 * These sources are fed into TokyoSpatialAudio as additionalSources
 * 
 * IMPORTANT: Sources are kept alive until they're far enough away that
 * the spatial audio system will have naturally faded them out. This prevents
 * abrupt audio cutoffs when flying past sounds.
 * 
 * Spawning strategy:
 * 1. Forward cone: Higher probability, longer range (for path ahead)
 * 2. Ambient (sides/behind): Lower probability, shorter range (for liveliness)
 */

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  TOKYO_CENTER,
  PROCEDURAL_AUDIO_CONFIG,
  type SpatialAudioSource,
} from "@/config/tokyo-config";
import { enuToLatLngAlt } from "@/lib/geo-utils";
import {
  getCellsInRadius,
  filterCellsByHeading,
  generateCellData,
  hashString,
  type ProceduralAudioGridConfig,
} from "@/lib/procedural-audio-grid";

const CELL_REMOVAL_DISTANCE_MULTIPLIER = 5.0; // Remove cells when 5x maxDistance away (~1km)

export interface UseProceduralSourcesOptions {
  enabled?: boolean;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getSpawnRange(velocity: number): { min: number; max: number } {
  const config = PROCEDURAL_AUDIO_CONFIG;
  const t = Math.min(velocity / config.velocityForMaxRange, 1);

  return {
    min: lerp(config.minSpawnDistance, config.minSpawnDistance * 4, t),
    max: lerp(config.minSpawnDistance * 4, config.maxSpawnDistance, t),
  };
}

function getHeadingFromCamera(camera: THREE.Camera): number {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  return Math.atan2(direction.x, -direction.z);
}

/**
 * Hook that generates procedural spatial audio sources based on player position
 * Returns an array of SpatialAudioSource that can be passed to TokyoSpatialAudio
 * 
 * @param enabled - Whether to enable the hook.
 * @returns An array of SpatialAudioSource.
 */
export function useProceduralSources({
  enabled = true,
}: UseProceduralSourcesOptions = {}): SpatialAudioSource[] {
  const { camera } = useThree();
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  const [sources, setSources] = useState<SpatialAudioSource[]>([]);

  const lastPositionRef = useRef(new THREE.Vector3());
  const cameraPosRef = useRef(new THREE.Vector3());
  const lastUpdateTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const activeCellsRef = useRef<Set<string>>(new Set());
  const cellPlayCountsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const fetchAudioFiles = async () => {
      try {
        const response = await fetch("/api/audio-files");
        const data = await response.json();
        setAudioFiles(data.files || []);
      } catch (err) {
        console.error("[ProceduralSources] Failed to fetch audio files:", err);
        setAudioFiles([]);
      }
    };

    fetchAudioFiles();
  }, [enabled]);

  useFrame(() => {
    if (!enabled || audioFiles.length === 0) return;

    const now = performance.now();
    if (now - lastUpdateTimeRef.current < PROCEDURAL_AUDIO_CONFIG.updateThrottleMs) {
      return;
    }

    const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
    lastUpdateTimeRef.current = now;

    const cameraPos = cameraPosRef.current;
    camera.getWorldPosition(cameraPos);

    const displacement = cameraPos.distanceTo(lastPositionRef.current);
    const instantVelocity = deltaTime > 0 ? displacement / deltaTime : 0;
    velocityRef.current = lerp(velocityRef.current, instantVelocity, 0.1);
    lastPositionRef.current.copy(cameraPos);

    const geo = enuToLatLngAlt(
      cameraPos,
      TOKYO_CENTER.lat,
      TOKYO_CENTER.lng,
      0
    );

    if (geo.alt >= PROCEDURAL_AUDIO_CONFIG.altitudeFadeEnd) {
      if (activeCellsRef.current.size > 0) {
        activeCellsRef.current.clear();
        setSources([]);
      }
      return;
    }

    const spawnRange = getSpawnRange(velocityRef.current);
    const heading = getHeadingFromCamera(camera);

    const allCells = getCellsInRadius(
      geo.lat,
      geo.lng,
      spawnRange.max,
      PROCEDURAL_AUDIO_CONFIG.cellSizeDegrees
    );

    const gridConfig: ProceduralAudioGridConfig = {
      cellSizeDegrees: PROCEDURAL_AUDIO_CONFIG.cellSizeDegrees,
      spawnProbability: PROCEDURAL_AUDIO_CONFIG.spawnProbability,
      audioFileCount: audioFiles.length,
    };

    const ambientGridConfig: ProceduralAudioGridConfig = {
      cellSizeDegrees: PROCEDURAL_AUDIO_CONFIG.cellSizeDegrees,
      spawnProbability: PROCEDURAL_AUDIO_CONFIG.ambientSpawnProbability,
      audioFileCount: audioFiles.length,
    };

    const forwardCells = filterCellsByHeading(
      allCells,
      geo.lat,
      geo.lng,
      heading,
      PROCEDURAL_AUDIO_CONFIG.spawnAngleDegrees,
      PROCEDURAL_AUDIO_CONFIG.cellSizeDegrees
    );
    const forwardCellSet = new Set(forwardCells);

    const removalDistance = PROCEDURAL_AUDIO_CONFIG.maxDistance * CELL_REMOVAL_DISTANCE_MULTIPLIER;
    const cellsToRemove: string[] = [];
    
    for (const cellId of activeCellsRef.current) {
      const playCount = cellPlayCountsRef.current.get(cellId) || 0;
      const cellData = generateCellData(cellId, gridConfig, playCount);
      
      if (!cellData.hasSound) {
        const ambientCellData = generateCellData(cellId, ambientGridConfig, playCount);
        if (!ambientCellData.hasSound) {
          cellsToRemove.push(cellId);
          continue;
        }
      }
      
      const dLat = (cellData.lat - geo.lat) * 111000;
      const dLng = (cellData.lng - geo.lng) * 111000 * Math.cos(geo.lat * Math.PI / 180);
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);
      
      if (distance > removalDistance) {
        cellsToRemove.push(cellId);
      }
    }
    
    for (const cellId of cellsToRemove) {
      activeCellsRef.current.delete(cellId);
    }

    const canAddMore = () => activeCellsRef.current.size < PROCEDURAL_AUDIO_CONFIG.maxActiveSources;

    for (const cellId of forwardCells) {
      if (!canAddMore()) break;
      if (activeCellsRef.current.has(cellId)) continue;

      const playCount = cellPlayCountsRef.current.get(cellId) || 0;
      const cellData = generateCellData(cellId, gridConfig, playCount);

      if (!cellData.hasSound) continue;

      const dLat = (cellData.lat - geo.lat) * 111000;
      const dLng = (cellData.lng - geo.lng) * 111000 * Math.cos(geo.lat * Math.PI / 180);
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distance < spawnRange.min || distance > spawnRange.max) continue;

      activeCellsRef.current.add(cellId);
    }

    const ambientMinDist = PROCEDURAL_AUDIO_CONFIG.ambientMinSpawnDistance;
    const ambientMaxDist = PROCEDURAL_AUDIO_CONFIG.ambientMaxSpawnDistance;
    
    for (const cellId of allCells) {
      if (!canAddMore()) break;
      if (activeCellsRef.current.has(cellId)) continue;
      if (forwardCellSet.has(cellId)) continue;

      const playCount = cellPlayCountsRef.current.get(cellId) || 0;
      
      const ambientHash = hashString(cellId + ":ambient", 99999);
      const shouldSpawnAmbient = ambientHash < PROCEDURAL_AUDIO_CONFIG.ambientSpawnProbability;
      
      if (!shouldSpawnAmbient) continue;

      const cellData = generateCellData(cellId, ambientGridConfig, playCount);

      const dLat = (cellData.lat - geo.lat) * 111000;
      const dLng = (cellData.lng - geo.lng) * 111000 * Math.cos(geo.lat * Math.PI / 180);
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distance < ambientMinDist || distance > ambientMaxDist) continue;

      activeCellsRef.current.add(cellId);
    }

    const allSources: SpatialAudioSource[] = [];
    for (const cellId of activeCellsRef.current) {
      const playCount = cellPlayCountsRef.current.get(cellId) || 0;
      const cellData = generateCellData(cellId, gridConfig, playCount);

      const hasMainSound = cellData.hasSound;
      const ambientHash = hashString(cellId + ":ambient", 99999);
      const hasAmbientSound = ambientHash < PROCEDURAL_AUDIO_CONFIG.ambientSpawnProbability;
      
      if (!hasMainSound && !hasAmbientSound) continue;

      const fileIndex = cellData.audioFileIndex % audioFiles.length;
      const audioUrl = audioFiles[fileIndex];

      allSources.push({
        id: `procedural-${cellId}`,
        name: `Procedural ${cellId}`,
        nameJa: `手続き的 ${cellId}`,
        lat: cellData.lat,
        lng: cellData.lng,
        alt: 5,
        src: audioUrl,
        volume: PROCEDURAL_AUDIO_CONFIG.baseVolume,
        refDistance: PROCEDURAL_AUDIO_CONFIG.refDistance,
        maxDistance: PROCEDURAL_AUDIO_CONFIG.maxDistance,
        loop: cellData.isLooping,
      });
    }

    setSources(allSources);
  });

  return sources;
}
