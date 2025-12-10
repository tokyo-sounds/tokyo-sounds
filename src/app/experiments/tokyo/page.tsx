"use client";

/**
 * Tokyo Page
 * Real-world Google 3D Tiles flight experience with Lyria audio
 */

// Base Modules
import {
  Suspense,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import {
  EffectComposer,
  HueSaturation,
  BrightnessContrast,
  Sepia,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
// Config
import {
  TIME_OF_DAY_PRESETS,
  DEMO_WAYPOINTS,
  TOKYO_CENTER,
  type District,
  type TimeOfDay,
} from "@/config/tokyo-config";
import { DebugOptions } from "./type/FlightPageTypes";
// Components
import CompassBar from "./components/CompassBar";
import LandingPage from "./components/LandingPage";
import DemoTourGuide from "./components/DemoTourGuide";
import FlightDashboard from "./components/FlightDashboard";
import FlightBoundsHelper from "./components/FlightBoundsHelper";
import DebugMenu from "./components/DebugMenu";
import { GoogleTilesScene } from "@/components/city/GoogleTilesScene";
import {
  DistrictLyriaAudio,
  type DistrictDebugInfo,
} from "@/components/city/DistrictLyriaAudio";
import { TokyoSpatialAudio } from "@/components/city/TokyoSpatialAudio";
import {
  PlaneController,
  type PlaneControllerHandle,
  type GyroState,
} from "@/components/city/PlaneController";
import { OtherPlayers } from "@/components/city/OtherPlayers";
// Hooks
import { clearVisitedFlag, type DemoState } from "@/hooks/useDemoFlythrough";
import { useMultiplayer } from "@/hooks/useMultiplayer";
// Stores
import { useGenerativeAudioStore } from "@/stores/use-generative-audio-store";
import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";
// Utils
import { type MovementMode } from "@/lib/flight";
import { latLngAltToENU } from "@/lib/geo-utils";

// Pastel color options for plane customization
export const PASTEL_COLORS = [
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

function Loader() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <boxGeometry args={[50, 50, 50]} />
      <meshStandardMaterial
        color="#ff6b9d"
        emissive="#ff6b9d"
        emissiveIntensity={0.5}
      />
    </mesh>
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
        <div className="text-2xl font-bold" style={{ color: district.color }}>
          {district.nameJa}
        </div>
        <div className="text-xs text-white/70">{district.name}</div>
      </div>
    </div>
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
      <Sepia intensity={effects.sepia} blendFunction={BlendFunction.NORMAL} />
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

/** DistrictDebugPanel
 *
 * District debug panel
 * @param districts - Districts
 * @param collapsed - Collapsed state
 * @param onToggle - Callback function to handle toggle
 * @returns null
 */
function DistrictDebugPanel({
  districts,
  collapsed,
  onToggle,
}: {
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
        <button onClick={onToggle} className="text-white/50 hover:text-white">
          ×
        </button>
      </div>

      {cameraLat !== undefined && cameraLng !== undefined && (
        <div className="mb-2 pb-2 border-b border-white/20 text-[10px]">
          <span className="text-white/50">GPS: </span>
          <span className="text-cyan-400">
            {cameraLat.toFixed(4)}, {cameraLng.toFixed(4)}
          </span>
        </div>
      )}

      <div className="space-y-1">
        {districts.slice(0, 8).map((d) => (
          <div key={d.name} className="flex justify-between items-center">
            <span style={{ color: d.color }}>{d.nameJa}</span>
            <span className="text-white/50">
              {(d.weight * 100).toFixed(0)}% ({Math.round(d.distance)}m)
            </span>
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
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const isHttps = window.location.protocol === "https:";
  const wsProtocol = isHttps ? "wss:" : "ws:";

  if (isLocalhost) {
    return `${wsProtocol}//localhost:3001`;
  }

  if (configuredUrl) {
    return configuredUrl;
  }

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
      return (
        localStorage.getItem(STORAGE_KEYS.planeColor) || PASTEL_COLORS[4].hex
      );
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
  const [spatialAudioStats, setSpatialAudioStats] = useState({
    total: 0,
    active: 0,
    culled: 0,
  });

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
  const [collisionDistance, setCollisionDistance] = useState<number | null>(
    null
  );
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

  const {
    enabled: generativeEnabled,
    setEnabled: setGenerativeEnabled,
    apiKey: storeApiKey,
  } = useGenerativeAudioStore();

  const lyriaApiKey = storeApiKey || ENV_LYRIA_API_KEY;

  const {
    isConnected: multiplayerConnected,
    connectionStatus: multiplayerStatus,
    nearbyPlayers,
    sendUpdate: sendMultiplayerUpdate,
    playerCount,
  } = useMultiplayer({
    serverUrl: ENV_MULTIPLAYER_URL,
    playerName: playerName || "Anonymous",
    planeColor,
    enabled: started,
  });

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
            setGyroState((prev) => ({
              ...prev,
              isEnabled: true,
              needsPermission: false,
            }));
          }
        } catch (e) {
          console.error(
            "[TokyoPage] Failed to request gyroscope permission:",
            e
          );
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
  const handleTeleport = useCallback(
    (lat: number, lng: number, alt: number) => {
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
        lat - 0.0012, // ~133m south
        lng,
        alt + CAMERA_HEIGHT,
        TOKYO_CENTER.lat,
        TOKYO_CENTER.lng,
        0
      );

      planeControllerRef.current.flyTo(cameraPosition, targetPosition);
    },
    []
  );

  const handleTilesLoaded = useCallback(() => {
    setStatus("Tiles loaded");
  }, []);

  useEffect(() => {
    if (collisionDistance !== null) {
      const timeout = setTimeout(() => setCollisionDistance(null), 100);
      return () => clearTimeout(timeout);
    }
  }, [collisionDistance]);

  const handlePlanePositionChange = useCallback(
    (position: THREE.Vector3, quaternion: THREE.Quaternion) => {
      localPlayerPositionRef.current.copy(position);
      localPlayerQuaternionRef.current.copy(quaternion);

      sendMultiplayerUpdate({
        position: { x: position.x, y: position.y, z: position.z },
        quaternion: {
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w,
        },
        heading,
        pitch,
        roll,
        speed: flightSpeed,
      });
    },
    [sendMultiplayerUpdate, heading, pitch, roll, flightSpeed]
  );

  const initialCameraPosition: [number, number, number] = [0, 200, 100];

  if (!started) {
    return (
      <LandingPage
        mapsApiKey={mapsApiKey}
        setMapsApiKey={setMapsApiKey}
        playerName={playerName}
        setPlayerName={setPlayerName}
        planeColor={planeColor}
        setPlaneColor={setPlaneColor}
        generativeEnabled={generativeEnabled}
        setGenerativeEnabled={setGenerativeEnabled}
        spatialAudioEnabled={spatialAudioEnabled}
        setSpatialAudioEnabled={setSpatialAudioEnabled}
        lyriaApiKey={lyriaApiKey}
        handleStart={handleStart}
      />
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
            onCollision={(dist: number) => setCollisionDistance(dist)}
            onPlanePositionChange={handlePlanePositionChange}
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

          <OtherPlayers
            players={nearbyPlayers}
            localPlayerPosition={localPlayerPositionRef.current}
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

      <FlightDashboard
        flightSpeed={flightSpeed}
        generativeEnabled={generativeEnabled}
        lyriaStatus={lyriaStatus}
        spatialAudioEnabled={spatialAudioEnabled}
        spatialAudioStats={spatialAudioStats}
        multiplayerConnected={multiplayerConnected}
        playerCount={playerCount}
      />

      {currentDistrict && <DistrictIndicator district={currentDistrict} />}

      {demoState?.active && (
        <DemoTourGuide demoState={demoState} />
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
        onOptionsChange={(key, value) =>
          setDebugOptions((prev) => ({ ...prev, [key]: value }))
        }
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
