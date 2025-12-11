/**
 * Random Ambient Audio Generator
 * Generates random spatial audio sources across the Tokyo map
 */

import { 
  TOKYO_MAP_BOUNDS, 
  RANDOM_AMBIENT_AUDIO_POOL,
  type RandomAmbientAudioConfig,
  DEFAULT_RANDOM_AMBIENT_CONFIG,
  type SpatialAudioSource 
} from "@/config/tokyo-config";
import { haversineDistance } from "./geo-utils";

/**
 * Generate random positions with minimum distance constraint
 * @param count - Number of positions to generate
 * @param minDistance - Minimum distance between positions in meters
 * @returns Array of {lat, lng} positions
 */
function generateRandomPositions(
  count: number,
  minDistance: number
): Array<{ lat: number; lng: number }> {
  const positions: Array<{ lat: number; lng: number }> = [];
  const maxAttempts = count * 100; // Prevent infinite loops
  let attempts = 0;

  while (positions.length < count && attempts < maxAttempts) {
    attempts++;
    
    // Generate random position within bounds
    const lat = TOKYO_MAP_BOUNDS.minLat + 
      Math.random() * (TOKYO_MAP_BOUNDS.maxLat - TOKYO_MAP_BOUNDS.minLat);
    const lng = TOKYO_MAP_BOUNDS.minLng + 
      Math.random() * (TOKYO_MAP_BOUNDS.maxLng - TOKYO_MAP_BOUNDS.minLng);

    // Check if position is too close to existing positions
    let tooClose = false;
    for (const existing of positions) {
      const distance = haversineDistance(lat, lng, existing.lat, existing.lng);
      if (distance < minDistance) {
        tooClose = true;
        break;
      }
    }

    // Add position if it meets distance requirement
    if (!tooClose) {
      positions.push({ lat, lng });
    }
  }

  return positions;
}

/**
 * Simple seeded random number generator
 * Uses linear congruential generator for reproducibility
 * @param seed - Initial seed value
 * @returns Function that returns random numbers between 0 and 1
 */
function seededRandom(seed: number): () => number {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Generate random ambient audio sources
 * @param config - Configuration options (partial, merges with defaults)
 * @returns Array of spatial audio sources
 */
export function generateRandomAmbientAudio(
  config: Partial<RandomAmbientAudioConfig> = {}
): SpatialAudioSource[] {
  const finalConfig = { ...DEFAULT_RANDOM_AMBIENT_CONFIG, ...config };
  const positions = generateRandomPositions(
    finalConfig.count,
    finalConfig.minDistance
  );

  return positions.map((pos, index) => {
    // Randomly select audio file from pool
    const audioFile = RANDOM_AMBIENT_AUDIO_POOL[
      Math.floor(Math.random() * RANDOM_AMBIENT_AUDIO_POOL.length)
    ];

    // Add random altitude variation
    const altitude = finalConfig.altitude + 
      (Math.random() - 0.5) * 2 * finalConfig.altitudeVariation;

    return {
      id: `random_ambient_${index}`,
      name: `Random Ambient ${index + 1}`,
      nameJa: `ランダム環境音 ${index + 1}`,
      lat: pos.lat,
      lng: pos.lng,
      alt: Math.max(5, altitude), // Minimum 5m above ground
      src: audioFile,
      volume: finalConfig.volume,
      refDistance: finalConfig.refDistance,
      maxDistance: finalConfig.maxDistance,
      loop: true,
    };
  });
}

/**
 * Generate random ambient audio with seed for reproducibility
 * @param seed - Seed value for deterministic generation
 * @param config - Configuration options (partial, merges with defaults)
 * @returns Array of spatial audio sources
 */
export function generateRandomAmbientAudioWithSeed(
  seed: number,
  config: Partial<RandomAmbientAudioConfig> = {}
): SpatialAudioSource[] {
  // Initialize random number generator with seed
  const rng = seededRandom(seed);
  
  const finalConfig = { ...DEFAULT_RANDOM_AMBIENT_CONFIG, ...config };
  const positions: Array<{ lat: number; lng: number }> = [];
  const maxAttempts = finalConfig.count * 100;
  let attempts = 0;

  // Generate positions using seeded RNG
  while (positions.length < finalConfig.count && attempts < maxAttempts) {
    attempts++;
    
    const lat = TOKYO_MAP_BOUNDS.minLat + 
      rng() * (TOKYO_MAP_BOUNDS.maxLat - TOKYO_MAP_BOUNDS.minLat);
    const lng = TOKYO_MAP_BOUNDS.minLng + 
      rng() * (TOKYO_MAP_BOUNDS.maxLng - TOKYO_MAP_BOUNDS.minLng);

    // Check distance constraint
    let tooClose = false;
    for (const existing of positions) {
      const distance = haversineDistance(lat, lng, existing.lat, existing.lng);
      if (distance < finalConfig.minDistance) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      positions.push({ lat, lng });
    }
  }

  // Create audio sources with seeded random selection
  return positions.map((pos, index) => {
    const audioFile = RANDOM_AMBIENT_AUDIO_POOL[
      Math.floor(rng() * RANDOM_AMBIENT_AUDIO_POOL.length)
    ];

    const altitude = finalConfig.altitude + 
      (rng() - 0.5) * 2 * finalConfig.altitudeVariation;

    return {
      id: `random_ambient_${seed}_${index}`,
      name: `Random Ambient ${index + 1}`,
      nameJa: `ランダム環境音 ${index + 1}`,
      lat: pos.lat,
      lng: pos.lng,
      alt: Math.max(5, altitude),
      src: audioFile,
      volume: finalConfig.volume,
      refDistance: finalConfig.refDistance,
      maxDistance: finalConfig.maxDistance,
      loop: true,
    };
  });
}

