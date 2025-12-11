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
import DashboardToggleButton from "./components/DashboardToggleButton";
import LandingPage from "./components/LandingPage";
import DemoTourGuide from "./components/DemoTourGuide";
import FlightDashboard from "./components/FlightDashboard";
import FlightBoundsHelper from "./components/FlightBoundsHelper";
import DistrictIndicator from "./components/DistrictIndicator";
import DistrictDebugPanel from "./components/DistrictDebugPanel";
import TimeOfDayEffects from "./components/TimeOfDayEffects";
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
// UI Components
import { Button } from "@/components/ui/button";
import { Eye, EyeClosed } from "lucide-react";
// Hooks
import { clearVisitedFlag, type DemoState } from "@/hooks/useDemoFlythrough";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useIsMobile } from "@/hooks/use-mobile";
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

// Multiplayer
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
  const isMobile = useIsMobile();
  const speedoMeterSize = isMobile ? 120 : 200; // size of the speed meter and compass
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
  const [dashboardVisible, setDashboardVisible] = useState(true);

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

      const CAMERA_OFFSET_DISTANCE = 100; // meters behind target
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

  // Keyboard Shortcuts
  const [operationManualOpen, setOperationManualOpen] = useState(true);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "h" || event.key === "H") {
        setOperationManualOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        setDashboardVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

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
    <div className="w-full h-dvh bg-black relative overflow-hidden">
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

      {dashboardVisible && (
        <FlightDashboard
          flightSpeed={flightSpeed}
          pitch={pitch}
          roll={roll}
          cameraY={cameraY}
          mapsApiKey={mapsApiKey}
          handleTeleport={handleTeleport}
          gyroState={gyroState}
          planeControllerRef={
            planeControllerRef as React.RefObject<PlaneControllerHandle>
          }
          operationManualOpen={operationManualOpen}
          setOperationManualOpen={setOperationManualOpen}
          generativeEnabled={generativeEnabled}
          lyriaStatus={lyriaStatus}
          spatialAudioEnabled={spatialAudioEnabled}
          spatialAudioStats={spatialAudioStats}
          multiplayerConnected={multiplayerConnected}
          playerCount={playerCount}
          heading={heading}
          speedoMeterSize={speedoMeterSize}
          isMobile={isMobile}
        />
      )}

      <DashboardToggleButton
        dashboardVisible={dashboardVisible}
        setDashboardVisible={setDashboardVisible}
      />

      {currentDistrict && <DistrictIndicator district={currentDistrict} />}

      {demoState?.active && <DemoTourGuide demoState={demoState} />}

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
        apiKey={mapsApiKey}
        onTeleport={handleTeleport}
        searchDisabled={demoState?.active || false}
      />

      <div className="absolute top-4 right-20 bg-black/70 text-white px-3 py-2 rounded text-xs font-mono z-50">
        {status} | {movementMode.toUpperCase()}
      </div>
    </div>
  );
}
