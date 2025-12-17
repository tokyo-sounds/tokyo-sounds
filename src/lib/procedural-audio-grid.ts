/**
 * Procedural Audio Grid
 * Deterministic grid-based audio source generation for ambient city sounds
 */

export interface GridCell {
  id: string;
  lat: number;
  lng: number;
  hasSound: boolean;
  audioFileIndex: number;
  isLooping: boolean;
  playCount: number;
}

export interface ProceduralAudioGridConfig {
  cellSizeDegrees: number;
  spawnProbability: number;
  audioFileCount: number;
}

/**
 * Deterministic hash function (cyrb53)
 * Produces consistent results for the same input string
 * @param str Input string to hash
 * @param seed Optional seed for variation
 * @returns Hash value between 0 and 1
 */
export function hashString(str: string, seed: number = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined / Number.MAX_SAFE_INTEGER;
}

/**
 * Get the cell ID for a given lat/lng position
 * @param lat Latitude in degrees
 * @param lng Longitude in degrees
 * @param cellSize Cell size in degrees
 * @returns Cell ID string in format "cellLat:cellLng"
 */
export function getCellId(
  lat: number,
  lng: number,
  cellSize: number
): string {
  const cellLat = Math.floor(lat / cellSize);
  const cellLng = Math.floor(lng / cellSize);
  return `${cellLat}:${cellLng}`;
}

/**
 * Parse cell ID back to cell coordinates
 * @param cellId Cell ID string
 * @returns Object with cellLat and cellLng integers
 */
export function parseCellId(cellId: string): { cellLat: number; cellLng: number } {
  const [latStr, lngStr] = cellId.split(":");
  return {
    cellLat: parseInt(latStr, 10),
    cellLng: parseInt(lngStr, 10),
  };
}

/**
 * Get the center position of a cell with deterministic offset
 * @param cellId Cell ID string
 * @param cellSize Cell size in degrees
 * @returns Object with lat and lng of the audio source position within the cell
 */
export function getCellPosition(
  cellId: string,
  cellSize: number
): { lat: number; lng: number } {
  const { cellLat, cellLng } = parseCellId(cellId);
  
  const offsetHash1 = hashString(cellId, 7919);
  const offsetHash2 = hashString(cellId, 7927);
  
  const offsetLat = offsetHash1 * cellSize * 0.8 + cellSize * 0.1;
  const offsetLng = offsetHash2 * cellSize * 0.8 + cellSize * 0.1;
  
  return {
    lat: cellLat * cellSize + offsetLat,
    lng: cellLng * cellSize + offsetLng,
  };
}

/**
 * Determine if a cell should have a sound source
 * @param cellId Cell ID string
 * @param probability Probability threshold (0-1)
 * @returns True if the cell should have a sound
 */
export function cellHasSound(cellId: string, probability: number): boolean {
  const hash = hashString(cellId, 12345);
  return hash < probability;
}

/**
 * Get the audio file index for a cell
 * @param cellId Cell ID string
 * @param audioFileCount Total number of audio files available
 * @param playCount Number of times this cell has cycled through sounds
 * @returns Index into the audio files array (0 to audioFileCount-1)
 */
export function getAudioFileIndex(
  cellId: string,
  audioFileCount: number,
  playCount: number = 0
): number {
  const hash = hashString(cellId + ":" + playCount, 31337);
  return Math.floor(hash * audioFileCount);
}

/**
 * Determine if the audio should loop for this cell
 * @param cellId Cell ID string
 * @param playCount Number of times this cell has cycled through sounds
 * @returns True if the audio should loop
 */
export function shouldLoop(cellId: string, playCount: number = 0): boolean {
  const hash = hashString(cellId + ":loop:" + playCount, 54321);
  return hash < 0.5;
}

/**
 * Get all cells within a radius of a center point
 * @param centerLat Center latitude in degrees
 * @param centerLng Center longitude in degrees
 * @param radiusMeters Radius in meters
 * @param cellSize Cell size in degrees
 * @returns Array of cell IDs within the radius
 */
export function getCellsInRadius(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  cellSize: number
): string[] {
  const radiusDegrees = radiusMeters / 111000;
  
  const minLat = centerLat - radiusDegrees;
  const maxLat = centerLat + radiusDegrees;
  const minLng = centerLng - radiusDegrees;
  const maxLng = centerLng + radiusDegrees;
  
  const minCellLat = Math.floor(minLat / cellSize);
  const maxCellLat = Math.floor(maxLat / cellSize);
  const minCellLng = Math.floor(minLng / cellSize);
  const maxCellLng = Math.floor(maxLng / cellSize);
  
  const cells: string[] = [];
  
  for (let cellLat = minCellLat; cellLat <= maxCellLat; cellLat++) {
    for (let cellLng = minCellLng; cellLng <= maxCellLng; cellLng++) {
      cells.push(`${cellLat}:${cellLng}`);
    }
  }
  
  return cells;
}

/**
 * Filter cells to only those within a forward-facing hemisphere
 * @param cells Array of cell IDs
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param headingRad Heading in radians (0 = north, PI/2 = east)
 * @param angleDegrees Hemisphere angle in degrees (180 = full hemisphere)
 * @param cellSize Cell size in degrees
 * @returns Filtered array of cell IDs within the hemisphere
 */
export function filterCellsByHeading(
  cells: string[],
  centerLat: number,
  centerLng: number,
  headingRad: number,
  angleDegrees: number,
  cellSize: number
): string[] {
  const halfAngleRad = (angleDegrees / 2) * (Math.PI / 180);
  const headingX = Math.sin(headingRad);
  const headingZ = -Math.cos(headingRad);
  
  return cells.filter((cellId) => {
    const pos = getCellPosition(cellId, cellSize);
    const dLat = pos.lat - centerLat;
    const dLng = pos.lng - centerLng;
    
    const dx = dLng * Math.cos(centerLat * Math.PI / 180);
    const dz = -dLat;
    
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.0001) return true;
    
    const normX = dx / len;
    const normZ = dz / len;
    
    const dot = normX * headingX + normZ * headingZ;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    
    return angle <= halfAngleRad;
  });
}

/**
 * Generate complete cell data for a position
 * @param cellId Cell ID string
 * @param config Grid configuration
 * @param playCount Number of times this cell has cycled through sounds
 * @returns GridCell object with all deterministic properties
 */
export function generateCellData(
  cellId: string,
  config: ProceduralAudioGridConfig,
  playCount: number = 0
): GridCell {
  const position = getCellPosition(cellId, config.cellSizeDegrees);
  
  return {
    id: cellId,
    lat: position.lat,
    lng: position.lng,
    hasSound: cellHasSound(cellId, config.spawnProbability),
    audioFileIndex: getAudioFileIndex(cellId, config.audioFileCount, playCount),
    isLooping: shouldLoop(cellId, playCount),
    playCount,
  };
}
