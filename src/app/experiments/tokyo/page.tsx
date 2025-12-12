"use client";

/**
 * Tokyo Page
 * Real-world Google 3D Tiles flight experience with Lyria audio
 */

import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, HueSaturation, BrightnessContrast, Sepia, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

import { TIME_OF_DAY_PRESETS, DEMO_WAYPOINTS, TOKYO_CENTER, type District, type TimeOfDay } from "@/config/tokyo-config";

// Pastel color options for plane customization
const PASTEL_COLORS = [
  { name: "Rose", hex: "#FFB3BA" },
  { name: "Peach", hex: "#FFDFBA" },
  { name: "Lemon", hex: "#FFFFBA" },
  { name: "Mint", hex: "#BAFFC9" },
  { name: "Sky", hex: "#BAE1FF" },
  { name: "Lavender", hex: "#E0BBE4" },
  { name: "Coral", hex: "#FFB3A7" },
  { name: "Butter", hex: "#FFF5BA" },
  { name: "Seafoam", hex: "#B5EAD7" },
  { name: "Periwinkle", hex: "#C4C3E0" },
  { name: "Blush", hex: "#FFC8DD" },
  { name: "Honey", hex: "#FFE5A0" },
  { name: "Sage", hex: "#C9E4C5" },
  { name: "Lilac", hex: "#DCD0FF" },
  { name: "Aqua", hex: "#B8F3FF" },
  { name: "Apricot", hex: "#FFDAB3" },
];
import { GoogleTilesScene } from "@/components/city/GoogleTilesScene";
import { DistrictLyriaAudio, type DistrictDebugInfo } from "@/components/city/DistrictLyriaAudio";
import { TokyoSpatialAudio } from "@/components/city/TokyoSpatialAudio";
import { PlaneController, type PlaneControllerHandle, type GyroState } from "@/components/city/PlaneController";
import { LocationSearch } from "@/components/city/LocationSearch";
import { MultiplayerManager } from "@/components/city/MultiplayerManager";
import { clearVisitedFlag, type DemoState } from "@/hooks/useDemoFlythrough";
import { useGenerativeAudioStore } from "@/stores/use-generative-audio-store";
import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";
import { type MovementMode } from "@/lib/flight";
import { latLngAltToENU } from "@/lib/geo-utils";

function Loader() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <boxGeometry args={[50, 50, 50]} />
      <meshStandardMaterial color="#ff6b9d" emissive="#ff6b9d" emissiveIntensity={0.5} />
    </mesh>
  );
}

/** CompassBar
 * 
 * Compass bar at top of viewport
 * @param heading - Heading
 * @param pitch - Pitch
 * @param roll - Roll
 * @returns null
 */
interface CompassBarProps {
  heading: number;
  pitch: number;
  roll: number;
  apiKey: string;
  onTeleport: (lat: number, lng: number, alt: number) => void;
  searchDisabled?: boolean;
  isGyroActive?: boolean;
  isGyroEnabled?: boolean;
  isGyroAvailable?: boolean;
  isMobile?: boolean;
  onRecalibrateGyro?: () => void;
}

function CompassBar({ heading, pitch, roll, apiKey, onTeleport, searchDisabled, isGyroActive, isGyroEnabled, isGyroAvailable, isMobile, onRecalibrateGyro }: CompassBarProps) {
  const directions = [
    { label: "N", bearing: 0 },
    { label: "NE", bearing: 45 },
    { label: "E", bearing: 90 },
    { label: "SE", bearing: 135 },
    { label: "S", bearing: 180 },
    { label: "SW", bearing: 225 },
    { label: "W", bearing: 270 },
    { label: "NW", bearing: 315 },
  ];

  const getCardinal = (h: number) => {
    const normalized = ((h % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return "N";
    if (normalized >= 22.5 && normalized < 67.5) return "NE";
    if (normalized >= 67.5 && normalized < 112.5) return "E";
    if (normalized >= 112.5 && normalized < 157.5) return "SE";
    if (normalized >= 157.5 && normalized < 202.5) return "S";
    if (normalized >= 202.5 && normalized < 247.5) return "SW";
    if (normalized >= 247.5 && normalized < 292.5) return "W";
    return "NW";
  };

  const getMarkerOffset = (bearing: number) => {
    let diff = bearing - heading;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  };

  const visibleRange = 90;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded px-4 py-2 text-white text-xs font-mono">
      <div className="flex items-center justify-center gap-4 mb-1">
        {isMobile &&(isGyroActive || isGyroEnabled || isGyroAvailable) && onRecalibrateGyro && (
          <button
            onClick={onRecalibrateGyro}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Recalibrate gyroscope"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <path d="M2 12c0-3 2-5 5-5" />
              <path d="M22 12c0 3-2 5-5 5" />
              <polyline points="5 4 2 7 5 10" />
              <polyline points="19 20 22 17 19 14" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-1 w-16">
          <span className="text-white/50">R</span>
          <span className={`w-10 text-right ${Math.abs(roll) > 30 ? "text-amber-400" : "text-white/70"}`}>
            {roll > 0 ? "+" : ""}{Math.round(roll)}°
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-white font-bold w-8 text-center">{Math.round(heading)}°</span>
          <span className="text-white/70 w-6">{getCardinal(heading)}</span>
        </div>
        
        <div className="flex items-center gap-1 w-16">
          <span className="text-white/50">P</span>
          <span className={`w-10 ${Math.abs(pitch) > 30 ? "text-amber-400" : "text-white/70"}`}>
            {pitch > 0 ? "+" : ""}{Math.round(pitch)}°
          </span>
        </div>

        <LocationSearch
          apiKey={apiKey}
          onTeleport={onTeleport}
          disabled={searchDisabled}
          minimal
          dropdownPosition="below"
          dropdownClassName="fixed top-24 left-1/2 -translate-x-1/2"
        />
      </div>
      
      <div className="relative w-48 h-4 overflow-hidden mx-auto">
        <div className="absolute left-1/2 top-0 w-px h-full bg-white/50 transform -translate-x-1/2" />
        
        {directions.map((dir) => {
          const offset = getMarkerOffset(dir.bearing);
          if (Math.abs(offset) > visibleRange) return null;
          const pixelOffset = (offset / visibleRange) * 96;
          
          return (
            <div
              key={dir.label}
              className="absolute top-0 transform -translate-x-1/2 text-center"
              style={{ left: `calc(50% + ${pixelOffset}px)` }}
            >
              <div className={`text-[10px] ${dir.label === "N" ? "text-red-400" : dir.label.length === 1 ? "text-white" : "text-white/50"}`}>
                {dir.label}
              </div>
            </div>
          );
        })}

        {Array.from({ length: 36 }, (_, i) => i * 10).map((tick) => {
          const offset = getMarkerOffset(tick);
          if (Math.abs(offset) > visibleRange) return null;
          const pixelOffset = (offset / visibleRange) * 96;
          const isCardinal = tick % 90 === 0;
          
          return (
            <div
              key={tick}
              className={`absolute bottom-0 w-px transform -translate-x-1/2 ${isCardinal ? "h-2 bg-white/60" : "h-1 bg-white/30"}`}
              style={{ left: `calc(50% + ${pixelOffset}px)` }}
            />
          );
        })}
      </div>

      <div className="mt-1 flex items-center justify-center gap-1">
        <div 
          className="w-24 h-1 bg-white/20 rounded-full relative overflow-hidden"
          title="Roll"
        >
          <div 
            className="absolute top-0 h-full bg-cyan-400/60 transition-all"
            style={{ 
              left: roll < 0 ? `${50 + (roll / 90) * 50}%` : "50%",
              width: `${Math.min(50, Math.abs(roll / 90) * 50)}%`
            }}
          />
          <div className="absolute left-1/2 top-0 w-px h-full bg-white/50" />
        </div>
        
        <div 
          className="w-1 h-6 bg-white/20 rounded-full relative overflow-hidden"
          title="Pitch"
        >
          <div 
            className="absolute left-0 w-full bg-cyan-400/60 transition-all"
            style={{ 
              bottom: pitch > 0 ? "50%" : `${50 + (pitch / 90) * 50}%`,
              height: `${Math.min(50, Math.abs(pitch / 90) * 50)}%`
            }}
          />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/50" />
        </div>
      </div>
    </div>
  );
}

/** DistrictIndicator
 * 
 * District indicator overlay
 * @param district - District
 * @returns null
 */
function DistrictIndicator({ district }: { district: District | null }) {
  if (!district) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="bg-black/70 px-4 py-2 rounded text-white text-center font-mono">
        <div className="text-2xl font-bold" style={{ color: district.color }}>{district.nameJa}</div>
        <div className="text-xs text-white/70">{district.name}</div>
      </div>
    </div>
  );
}

/** FlightBoundsHelper
 * 
 * Debug visualization (shows coordinate system and reference planes)
 * @param visible - Visibility
 * @returns null
 */
function FlightBoundsHelper({ 
  visible 
}: { 
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <group>
      <gridHelper args={[5000, 100, "#00ff00", "#00ff0030"]} position={[0, 0, 0]} />
      <gridHelper args={[5000, 50, "#ffff00", "#ffff0020"]} position={[0, 500, 0]} />
      <gridHelper args={[5000, 50, "#ff8800", "#ff880020"]} position={[0, 1000, 0]} />
      <gridHelper args={[5000, 50, "#ff0000", "#ff000020"]} position={[0, 2000, 0]} />

      <axesHelper args={[200]} />
    </group>
  );
}

/** TimeOfDayEffects
 * 
 * Post-processing effects that respond to time of day
 * Applies color grading to create sunrise/sunset atmosphere
 */
function TimeOfDayEffects() {
  const preset = useTimeOfDayStore((state) => state.preset);
  
  const effects = useMemo(() => {
    const { r, g, b } = preset.colorMultiplier;
    
    const orangeIntensity = Math.max(0, (r - b) / 1.1); // ~0 for afternoon, ~0.95 for sunset
    const sepiaIntensity = orangeIntensity * 0.6;
    const hueShift = -orangeIntensity * 0.12;
    const saturationBoost = orangeIntensity * 0.35;
    const brightnessAdjust = -orangeIntensity * 0.12;
    const contrastBoost = orangeIntensity * 0.2;
    const vignetteIntensity = orangeIntensity * 0.4;
    
    return {
      sepia: sepiaIntensity,
      hue: hueShift,
      saturation: saturationBoost,
      brightness: brightnessAdjust,
      contrast: contrastBoost,
      vignette: vignetteIntensity,
    };
  }, [preset]);

  return (
    <EffectComposer multisampling={0}>
      <Sepia
        intensity={effects.sepia}
        blendFunction={BlendFunction.NORMAL}
      />
      <HueSaturation
        blendFunction={BlendFunction.NORMAL}
        hue={effects.hue}
        saturation={effects.saturation}
      />
      <BrightnessContrast
        brightness={effects.brightness}
        contrast={effects.contrast}
      />
      <Vignette
        offset={0.3}
        darkness={effects.vignette}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

/** DebugMenu
 * 
 * Debug menu
 * @param options - Debug options
 * @param onOptionsChange - Callback function to handle options change
 * @param collapsed - Collapsed state
 * @param onToggle - Callback function to handle toggle
 * @param cameraY - Camera Y position
 * @param collisionDistance - Collision distance
 * @returns null
 */
interface DebugOptions {
  showMeshes: boolean;
  wireframe: boolean;
  showBounds: boolean;
  collision: boolean;
  demoEnabled: boolean;
}

function DebugMenu({ 
  options,
  onOptionsChange,
  collapsed,
  onToggle,
  cameraY,
  collisionDistance,
}: { 
  options: DebugOptions;
  onOptionsChange: (key: keyof DebugOptions, value: boolean) => void;
  collapsed: boolean;
  onToggle: () => void;
  cameraY: number;
  collisionDistance: number | null;
}) {
  const { currentTime, setTimeOfDay } = useTimeOfDayStore();
  const timeOptions: TimeOfDay[] = ["morning", "afternoon", "evening"];

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-4 right-4 bg-black/70 px-3 py-2 rounded text-white/70 hover:text-white text-xs font-mono"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 bg-black/70 rounded p-3 text-white text-xs font-mono min-w-[180px]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70">DEBUG</span>
        <button onClick={onToggle} className="text-white/50 hover:text-white">×</button>
      </div>
      
      <div className="text-white/70 mb-2 space-y-1">
        <div>Y: <span className="text-white">{cameraY.toFixed(1)}</span></div>
        {options.collision && collisionDistance !== null && (
          <div>Hit: <span className="text-red-400">{collisionDistance.toFixed(1)}m</span></div>
        )}
      </div>

      <div className="mb-3 pb-2 border-b border-white/20">
        <div className="text-white/50 mb-1">Time of Day</div>
        <div className="flex gap-1">
          {timeOptions.map((time) => (
            <button
              key={time}
              onClick={() => setTimeOfDay(time)}
              className={`flex-1 px-2 py-1 rounded text-[10px] transition-colors ${
                currentTime === time
                  ? "bg-cyan-500/80 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {TIME_OF_DAY_PRESETS[time].nameJa}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.showMeshes}
            onChange={(e) => onOptionsChange("showMeshes", e.target.checked)}
            className="w-3 h-3"
          />
          <span className="text-white/70">Meshes</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.wireframe}
            onChange={(e) => onOptionsChange("wireframe", e.target.checked)}
            className="w-3 h-3"
          />
          <span className="text-white/70">Wireframe</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.showBounds}
            onChange={(e) => onOptionsChange("showBounds", e.target.checked)}
            className="w-3 h-3"
          />
          <span className="text-white/70">Grids</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.collision}
            onChange={(e) => onOptionsChange("collision", e.target.checked)}
            className="w-3 h-3"
          />
          <span className="text-white/70">Collision</span>
        </label>

        <div className="mt-2 pt-2 border-t border-white/20">
          <button
            onClick={() => {
              clearVisitedFlag();
              window.location.reload();
            }}
            className="w-full px-2 py-1 bg-fuchsia-500/30 hover:bg-fuchsia-500/50 rounded text-[10px] text-fuchsia-300 transition-colors"
          >
            Restart Demo Tour
          </button>
        </div>
      </div>
    </div>
  );
}

/** DistrictDebugPanel
 * 
 * District debug panel
 * @param districts - Districts
 * @param collapsed - Collapsed state
 * @param onToggle - Callback function to handle toggle
 * @returns null
 */
function DistrictDebugPanel({ districts, collapsed, onToggle }: { 
  districts: DistrictDebugInfo[]; 
  collapsed: boolean;
  onToggle: () => void;
}) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded text-white/70 hover:text-white text-xs font-mono"
      >
        DISTRICTS
      </button>
    );
  }

  const cameraLat = districts[0]?.cameraLat;
  const cameraLng = districts[0]?.cameraLng;

  return (
    <div className="absolute bottom-4 left-4 bg-black/70 rounded p-3 text-white text-xs font-mono min-w-[220px] max-h-[350px] overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70">DISTRICTS</span>
        <button onClick={onToggle} className="text-white/50 hover:text-white">×</button>
      </div>
      
      {cameraLat !== undefined && cameraLng !== undefined && (
        <div className="mb-2 pb-2 border-b border-white/20 text-[10px]">
          <span className="text-white/50">GPS: </span>
          <span className="text-cyan-400">{cameraLat.toFixed(4)}, {cameraLng.toFixed(4)}</span>
        </div>
      )}
      
      <div className="space-y-1">
        {districts.slice(0, 8).map((d) => (
          <div key={d.name} className="flex justify-between items-center">
            <span style={{ color: d.color }}>{d.nameJa}</span>
            <span className="text-white/50">{(d.weight * 100).toFixed(0)}% ({Math.round(d.distance)}m)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ENV_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const ENV_LYRIA_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || "";

function getMultiplayerUrl(): string {
  if (typeof window === "undefined") return "ws://localhost:3001";
  
  const configuredUrl = process.env.NEXT_PUBLIC_MULTIPLAYER_URL || "";
  
  if (configuredUrl) {
    return configuredUrl;
  }
  
  const isHttps = window.location.protocol === "https:";
  const wsProtocol = isHttps ? "wss:" : "ws:";
  return `${wsProtocol}//${window.location.hostname}:3001`;
}

const ENV_MULTIPLAYER_URL = getMultiplayerUrl();

const STORAGE_KEYS = {
  playerName: "tokyo-sounds-player-name",
  planeColor: "tokyo-sounds-plane-color",
} as const;

export default function TokyoPage() {
  const [started, setStarted] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState(ENV_MAPS_API_KEY);
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.playerName) || "";
    }
    return "";
  });
  const [planeColor, setPlaneColor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.planeColor) || PASTEL_COLORS[4].hex;
    }
    return PASTEL_COLORS[4].hex;
  });
  const [status, setStatus] = useState("Ready");
  const [flightSpeed, setFlightSpeed] = useState(0);
  const [movementMode, setMovementMode] = useState<MovementMode>("elytra");
  const [currentDistrict, setCurrentDistrict] = useState<District | null>(null);
  const [districtDebug, setDistrictDebug] = useState<DistrictDebugInfo[]>([]);
  const [districtDebugCollapsed, setDistrictDebugCollapsed] = useState(true);
  const [lyriaStatus, setLyriaStatus] = useState("Idle");
  const [spatialAudioEnabled, setSpatialAudioEnabled] = useState(true);
  const [spatialAudioStats, setSpatialAudioStats] = useState({ total: 0, active: 0, culled: 0 });
  
  const [debugMenuCollapsed, setDebugMenuCollapsed] = useState(true);
  const [debugOptions, setDebugOptions] = useState<DebugOptions>({
    showMeshes: true,
    wireframe: false,
    showBounds: false,
    collision: true,
    demoEnabled: true,
  });
  const [cameraY, setCameraY] = useState(200);
  const [heading, setHeading] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [collisionDistance, setCollisionDistance] = useState<number | null>(null);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [gyroState, setGyroState] = useState<GyroState>({
    isActive: false,
    isAvailable: false,
    isEnabled: false,
    needsPermission: false,
    isMobile: false,
  });
  
  const collisionGroupRef = useRef<THREE.Group | null>(null);
  const planeControllerRef = useRef<PlaneControllerHandle | null>(null);
  const localPlayerPositionRef = useRef(new THREE.Vector3(0, 200, 100));
  const localPlayerQuaternionRef = useRef(new THREE.Quaternion());
  
  const flightDataRef = useRef({ heading: 0, pitch: 0, roll: 0, speed: 0 });
  
  useEffect(() => {
    flightDataRef.current = { heading, pitch, roll, speed: flightSpeed };
  }, [heading, pitch, roll, flightSpeed]);

  const {
    enabled: generativeEnabled,
    setEnabled: setGenerativeEnabled,
    apiKey: storeApiKey,
  } = useGenerativeAudioStore();
  
  const lyriaApiKey = storeApiKey || ENV_LYRIA_API_KEY;

  const [multiplayerConnected, setMultiplayerConnected] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  
  const handleMultiplayerConnectionChange = useCallback((connected: boolean, count: number) => {
    setMultiplayerConnected(connected);
    setPlayerCount(count);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.playerName, playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.planeColor, planeColor);
  }, [planeColor]);

  const handleStart = useCallback(async () => {
    if (!mapsApiKey) {
      alert("Please enter your Google Maps API key");
      return;
    }
    
    try {
      const DOE = window.DeviceOrientationEvent as any;
      const DME = window.DeviceMotionEvent as any;
      
      if (typeof DOE?.requestPermission === "function") {
        try {
          const permission = await DOE.requestPermission();
          if (permission === "granted") {
            setGyroState(prev => ({ ...prev, isEnabled: true, needsPermission: false }));
          }
        } catch (e) {
          console.error("[TokyoPage] Failed to request gyroscope permission:", e);
        }
      }
      
      if (typeof DME?.requestPermission === "function") {
        try {
          await DME.requestPermission();
        } catch (e) {
          console.error("[TokyoPage] Failed to request motion permission:", e);
        }
      }
    } catch (e) {
      console.error("[TokyoPage] Error requesting device permissions:", e);
    }
    
    setStatus("Loading...");
    setStarted(true);
  }, [mapsApiKey]);

  /**
   * Teleport to a location given lat/lng/alt
   * Positions camera behind the target (relative to current position) and above it
   */
  const handleTeleport = useCallback((lat: number, lng: number, alt: number) => {
    if (!planeControllerRef.current) return;
    
    const targetPosition = latLngAltToENU(
      lat, 
      lng, 
      alt,
      TOKYO_CENTER.lat,
      TOKYO_CENTER.lng,
      0
    );
    
    const CAMERA_OFFSET_DISTANCE = 150; // meters behind target
    const CAMERA_HEIGHT = 80; // meters above target altitude
    
    const cameraPosition = latLngAltToENU(
      lat - 0.0012,  // ~133m south
      lng, 
      alt + CAMERA_HEIGHT,
      TOKYO_CENTER.lat,
      TOKYO_CENTER.lng,
      0
    );
    
    planeControllerRef.current.flyTo(cameraPosition, targetPosition);
  }, []);

  const handleTilesLoaded = useCallback(() => {
    setStatus("Tiles loaded");
  }, []);

  useEffect(() => {
    if (collisionDistance !== null) {
      const timeout = setTimeout(() => setCollisionDistance(null), 100);
      return () => clearTimeout(timeout);
    }
  }, [collisionDistance]);

  const handleCollision = useCallback((dist: number) => {
    setCollisionDistance(dist);
  }, []);

  const initialCameraPosition: [number, number, number] = [0, 200, 100];

  if (!started) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className="text-center space-y-6 max-w-lg px-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tight bg-linear-to-r from-cyan-400 via-fuchsia-500 to-amber-400 bg-clip-text text-transparent">
              TOKYO SOUNDS
            </h1>
            <p className="text-slate-400">
              Fly through real Tokyo with AI-generated music
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-2xl space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Google Maps API Key</label>
              <input
                type="password"
                value={mapsApiKey}
                onChange={(e) => setMapsApiKey(e.target.value)}
                placeholder="Enter API key (Map Tiles API required)"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <label className="block text-slate-400 text-sm mb-2">Player Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name (optional)"
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-fuchsia-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Plane Color</label>
              <div className="grid grid-cols-8 gap-2">
                {PASTEL_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setPlaneColor(color.hex)}
                    className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                      planeColor === color.hex
                        ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                        : "hover:ring-1 hover:ring-white/50"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Selected: <span className="text-white">{PASTEL_COLORS.find(c => c.hex === planeColor)?.name}</span>
              </p>
            </div>

            <div className="border-t border-slate-700/50 pt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="lyria"
                checked={generativeEnabled}
                onChange={(e) => setGenerativeEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-fuchsia-500"
              />
              <label htmlFor="lyria" className="text-slate-300 text-sm">
                Enable Lyria Generative Audio
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="spatial"
                checked={spatialAudioEnabled}
                onChange={(e) => setSpatialAudioEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-500"
              />
              <label htmlFor="spatial" className="text-slate-300 text-sm">
                Enable Spatial Audio (ambient sounds)
              </label>
            </div>

            {generativeEnabled && !lyriaApiKey && (
              <p className="text-amber-400 text-xs">⚠️ Set NEXT_PUBLIC_GOOGLE_AI_API_KEY in .env.local</p>
            )}
            {generativeEnabled && lyriaApiKey && (
              <p className="text-green-400 text-xs">✓ Lyria API key detected</p>
            )}

            <div className="bg-slate-800/50 p-3 rounded-lg text-xs space-y-1">
              <p className="text-cyan-400 font-bold">CONTROLS</p>
              <div className="grid grid-cols-2 gap-x-4 text-slate-400">
                <span><span className="text-white font-mono">W/S</span> Pitch</span>
                <span><span className="text-white font-mono">A/D</span> Bank/Turn</span>
                <span><span className="text-white font-mono">SHIFT</span> Boost</span>
                <span><span className="text-white font-mono">SPACE</span> Freeze</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!mapsApiKey}
              className="w-full px-6 py-3 bg-linear-to-r from-cyan-500 via-fuchsia-500 to-amber-500 text-white font-bold rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              Enter Tokyo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <Canvas
        shadows="soft"
        camera={{
          position: initialCameraPosition,
          fov: 60,
          near: 1,
          far: 1e9,
        }}
        gl={{
          logarithmicDepthBuffer: true,
          antialias: false,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={<Loader />}>
          <GoogleTilesScene
            apiKey={mapsApiKey}
            onTilesLoaded={handleTilesLoaded}
            onStatusChange={setStatus}
            showMeshes={debugOptions.showMeshes}
            wireframe={debugOptions.wireframe}
            collisionGroupRef={collisionGroupRef}
          />

          <PlaneController
            ref={planeControllerRef}
            onSpeedChange={setFlightSpeed}
            onModeChange={setMovementMode}
            onCameraYChange={setCameraY}
            onHeadingChange={setHeading}
            onPitchChange={setPitch}
            onRollChange={setRoll}
            collisionGroup={collisionGroupRef.current}
            collisionEnabled={debugOptions.collision}
            onCollision={handleCollision}
            localPlayerPositionRef={localPlayerPositionRef}
            localPlayerQuaternionRef={localPlayerQuaternionRef}
            demoEnabled={debugOptions.demoEnabled}
            onDemoStateChange={setDemoState}
            onGyroStateChange={setGyroState}
            planeColor={planeColor}
          />

          <FlightBoundsHelper visible={debugOptions.showBounds} />

          {generativeEnabled && lyriaApiKey && (
            <DistrictLyriaAudio
              apiKey={lyriaApiKey}
              enabled={generativeEnabled}
              volume={0.6}
              onStatusUpdate={setLyriaStatus}
              onDebugUpdate={setDistrictDebug}
              onCurrentDistrictChange={setCurrentDistrict}
            />
          )}

          <TimeOfDayEffects />

          <TokyoSpatialAudio
            enabled={spatialAudioEnabled}
            showDebug={debugOptions.showBounds}
            onStatsUpdate={setSpatialAudioStats}
          />

          {/* Multiplayer - isolated state management */}
          <MultiplayerManager
            serverUrl={ENV_MULTIPLAYER_URL}
            playerName={playerName || "Anonymous"}
            planeColor={planeColor}
            enabled={started}
            localPlayerPositionRef={localPlayerPositionRef}
            localPlayerQuaternionRef={localPlayerQuaternionRef}
            flightDataRef={flightDataRef}
            onConnectionChange={handleMultiplayerConnectionChange}
          />
        </Suspense>
      </Canvas>

      <CompassBar 
        heading={heading} 
        pitch={pitch} 
        roll={roll}
        apiKey={mapsApiKey}
        onTeleport={handleTeleport}
        searchDisabled={demoState?.active}
        isGyroActive={gyroState.isActive}
        isGyroEnabled={gyroState.isEnabled}
        isGyroAvailable={gyroState.isAvailable}
        isMobile={gyroState.isMobile}
        onRecalibrateGyro={() => planeControllerRef.current?.recalibrateGyro()}
      />

      <div className="absolute top-4 left-4 bg-black/70 rounded p-3 text-white text-xs font-mono">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-white/70">SPD</span>
          <span className={flightSpeed > 150 ? "text-red-400" : flightSpeed > 80 ? "text-amber-400" : "text-white"}>
            {flightSpeed}
          </span>
          {generativeEnabled && (
            <>
              <span className="text-white/30">|</span>
              <span className="text-white/70">♪ {lyriaStatus}</span>
            </>
          )}
          {spatialAudioEnabled && spatialAudioStats.total > 0 && (
            <>
              <span className="text-white/30">|</span>
              <span className="text-cyan-400/70">
                SFX {spatialAudioStats.active}/{spatialAudioStats.total}
              </span>
            </>
          )}
          <span className="text-white/30">|</span>
          <span className={multiplayerConnected ? "text-green-400/70" : "text-yellow-400/70"}>
            {multiplayerConnected ? `● ${playerCount}` : "○"}
          </span>
        </div>
        <div className="text-white/50 text-[10px] space-x-3">
          <span>W/S pitch</span>
          <span>A/D bank</span>
          <span>SHIFT boost</span>
          <span>SPACE freeze</span>
        </div>
      </div>

      {currentDistrict && <DistrictIndicator district={currentDistrict} />}

      {demoState?.active && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-lg px-6 py-4 text-white text-center">
          <div className="text-fuchsia-400 text-lg font-bold mb-1">
            {demoState.currentWaypoint?.nameJa || "Tour"}
          </div>
          <div className="text-white/70 text-sm mb-2">
            {demoState.currentWaypoint?.name || ""}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-white/50">
            <span>{demoState.phase === "transitioning" ? "Flying to..." : demoState.phase === "orbiting" ? "Orbiting" : "Returning..."}</span>
            <span className="text-white/30">|</span>
            <span>Press ESC or SPACE to skip</span>
          </div>
          <div className="mt-2 w-full bg-white/20 rounded-full h-1">
            <div 
              className="bg-fuchsia-500 h-1 rounded-full transition-all duration-200"
              style={{ width: `${(demoState.currentWaypointIndex / DEMO_WAYPOINTS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {generativeEnabled && districtDebug.length > 0 && (
        <DistrictDebugPanel
          districts={districtDebug}
          collapsed={districtDebugCollapsed}
          onToggle={() => setDistrictDebugCollapsed(!districtDebugCollapsed)}
        />
      )}

      <DebugMenu
        options={debugOptions}
        onOptionsChange={(key, value) => setDebugOptions(prev => ({ ...prev, [key]: value }))}
        collapsed={debugMenuCollapsed}
        onToggle={() => setDebugMenuCollapsed(!debugMenuCollapsed)}
        cameraY={cameraY}
        collisionDistance={collisionDistance}
      />

      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-xs font-mono">
        {status} | {movementMode.toUpperCase()}
      </div>
    </div>
  );
}
