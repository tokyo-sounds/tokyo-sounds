"use client";

/**
 * Tokyo Page
 * Real-world Google 3D Tiles flight experience with Lyria audio
 */

import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { TOKYO_DISTRICTS, type District } from "@/config/tokyo-config";
import { GoogleTilesScene } from "@/components/city/GoogleTilesScene";
import { DistrictLyriaAudio, type DistrictDebugInfo } from "@/components/city/DistrictLyriaAudio";
import { useFlight } from "@/hooks/useFlight";
import { useGenerativeAudioStore } from "@/stores/use-generative-audio-store";
import { type MovementMode } from "@/lib/flight";


// collision detection configuration
const COLLISION_DISTANCE = 2;
const COLLISION_PUSH_STRENGTH = 1;
const NUM_COLLISION_RAYS = 8;

/** FlightController
 * 
 * Flight controller using the standard useFlight hook (flat world)
 * @param onSpeedChange - Callback function to handle speed change
 * @param onModeChange - Callback function to handle mode change
 * @param onCameraYChange - Callback function to handle camera Y position change
 * @param onHeadingChange - Callback function to handle heading change
 * @param onPitchChange - Callback function to handle pitch change
 * @param onRollChange - Callback function to handle roll change
 * @param collisionGroup - Collision group object
 * @param collisionEnabled - Flag to enable collision detection
 * @param onCollision - Callback function to handle collision
 * @returns null
 */
function FlightController({
  onSpeedChange,
  onModeChange,
  onCameraYChange,
  onHeadingChange,
  onPitchChange,
  onRollChange,
  collisionGroup,
  collisionEnabled,
  onCollision,
}: {
  onSpeedChange?: (speed: number) => void;
  onModeChange?: (mode: MovementMode) => void;
  onCameraYChange?: (y: number) => void;
  onHeadingChange?: (heading: number) => void;
  onPitchChange?: (pitch: number) => void;
  onRollChange?: (roll: number) => void;
  collisionGroup?: THREE.Group | null;
  collisionEnabled?: boolean;
  onCollision?: (distance: number) => void;
}) {
  const { camera } = useThree();
  const frameCountRef = useRef(0);

  // cached obj
  const _forward = useRef(new THREE.Vector3()).current;
  const _right = useRef(new THREE.Vector3()).current;
  const _up = useRef(new THREE.Vector3()).current;
  const _rayDir = useRef(new THREE.Vector3()).current;
  const _pushBack = useRef(new THREE.Vector3()).current;
  const _raycaster = useRef(new THREE.Raycaster()).current;
  const _prevPosition = useRef(new THREE.Vector3()).current;
  const _euler = useRef(new THREE.Euler()).current;

  const { update } = useFlight({
    camera,
    config: {
      mode: "elytra",
      baseSpeed: 60,
      minSpeed: 20,
      maxSpeed: 300,
      boostImpulse: 80,
      gravityAccel: 50,
      gravityDecel: 35,
      drag: 0.985,
      enableBounds: false,
    },
    onSpeedChange,
    onModeChange,
  });

  useFrame((_, delta) => {
    _prevPosition.copy(camera.position);
    update(delta);
    
    if (collisionEnabled && collisionGroup) {
      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      _up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      
      let closestHit = Infinity;
      _pushBack.set(0, 0, 0);
      
      for (let i = 0; i < NUM_COLLISION_RAYS; i++) {
        const angle = (i / NUM_COLLISION_RAYS) * Math.PI * 2;
        const coneAngle = 0.3; // cone spread in radians
        
        _rayDir.copy(_forward);
        _rayDir.addScaledVector(_right, Math.cos(angle) * coneAngle);
        _rayDir.addScaledVector(_up, Math.sin(angle) * coneAngle);
        _rayDir.normalize();
        
        _raycaster.set(camera.position, _rayDir);
        _raycaster.far = COLLISION_DISTANCE * 3;
        
        const intersects = _raycaster.intersectObject(collisionGroup, true);
        
        if (intersects.length > 0) {
          const hit = intersects[0];
          if (hit.distance < COLLISION_DISTANCE) {
            closestHit = Math.min(closestHit, hit.distance);
            
            const pushStrength = (COLLISION_DISTANCE - hit.distance) / COLLISION_DISTANCE;
            _pushBack.addScaledVector(_rayDir, -pushStrength * COLLISION_PUSH_STRENGTH);
          }
        }
      }
      
      _raycaster.set(camera.position, _forward);
      _raycaster.far = COLLISION_DISTANCE * 5;
      const forwardHits = _raycaster.intersectObject(collisionGroup, true);
      
      if (forwardHits.length > 0 && forwardHits[0].distance < COLLISION_DISTANCE) {
        closestHit = Math.min(closestHit, forwardHits[0].distance);
        const pushStrength = (COLLISION_DISTANCE - forwardHits[0].distance) / COLLISION_DISTANCE;
        _pushBack.addScaledVector(_forward, -pushStrength * COLLISION_PUSH_STRENGTH * 2);
      }
      
      if (_pushBack.lengthSq() > 0.001) {
        camera.position.add(_pushBack);
        onCollision?.(closestHit);
      }
    }
    
    frameCountRef.current++;
    if (frameCountRef.current % 10 === 0) {
      onCameraYChange?.(camera.position.y);
      
      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      const heading = Math.atan2(_forward.x, -_forward.z) * (180 / Math.PI);
      onHeadingChange?.((heading + 360) % 360);
      
      _euler.setFromQuaternion(camera.quaternion, "YXZ");
      const pitch = _euler.x * (180 / Math.PI);
      const roll = _euler.z * (180 / Math.PI);
      onPitchChange?.(pitch);
      onRollChange?.(roll);
    }
  });

  return null;
}

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
function CompassBar({ heading, pitch, roll }: { heading: number; pitch: number; roll: number }) {
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
  debugTiles: boolean;
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

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.debugTiles}
            onChange={(e) => onOptionsChange("debugTiles", e.target.checked)}
            className="w-3 h-3"
          />
          <span className="text-white/70">Debug Tiles (bounds)</span>
        </label>
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

export default function TokyoPage() {
  const [started, setStarted] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState(ENV_MAPS_API_KEY);
  const [status, setStatus] = useState("Ready");
  const [flightSpeed, setFlightSpeed] = useState(0);
  const [movementMode, setMovementMode] = useState<MovementMode>("elytra");
  const [currentDistrict, setCurrentDistrict] = useState<District | null>(null);
  const [districtDebug, setDistrictDebug] = useState<DistrictDebugInfo[]>([]);
  const [districtDebugCollapsed, setDistrictDebugCollapsed] = useState(true);
  const [lyriaStatus, setLyriaStatus] = useState("Idle");
  
  const [debugMenuCollapsed, setDebugMenuCollapsed] = useState(true);
  const [debugOptions, setDebugOptions] = useState<DebugOptions>({
    showMeshes: true,
    wireframe: false,
    showBounds: false,
    collision: true,  // default
    debugTiles: false,
  });
  const [cameraY, setCameraY] = useState(200);
  const [heading, setHeading] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [collisionDistance, setCollisionDistance] = useState<number | null>(null);
  
  const collisionGroupRef = useRef<THREE.Group | null>(null);

  const {
    enabled: generativeEnabled,
    setEnabled: setGenerativeEnabled,
    apiKey: storeApiKey,
  } = useGenerativeAudioStore();
  
  const lyriaApiKey = storeApiKey || ENV_LYRIA_API_KEY;

  const handleStart = useCallback(() => {
    if (!mapsApiKey) {
      alert("Please enter your Google Maps API key");
      return;
    }
    setStatus("Loading...");
    setStarted(true);
  }, [mapsApiKey]);

  // auto-start if Maps API key is set via env var
  useEffect(() => {
    if (ENV_MAPS_API_KEY && !started) {
      setStarted(true);
      setStatus("Loading...");
    }
  }, [started]);

  // auto-enable Lyria if API key is available via env var
  useEffect(() => {
    if (ENV_LYRIA_API_KEY && !generativeEnabled) {
      setGenerativeEnabled(true);
      console.log("[Tokyo] Auto-enabled Lyria (API key found in env)");
    }
  }, [generativeEnabled, setGenerativeEnabled]);

  const handleTilesLoaded = useCallback(() => {
    setStatus("Tiles loaded");
  }, []);

  useEffect(() => {
    if (collisionDistance !== null) {
      const timeout = setTimeout(() => setCollisionDistance(null), 100);
      return () => clearTimeout(timeout);
    }
  }, [collisionDistance]);

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

            <div className="flex items-center gap-3">
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
            debugTiles={debugOptions.debugTiles}
          />

          <FlightController
            onSpeedChange={setFlightSpeed}
            onModeChange={setMovementMode}
            onCameraYChange={setCameraY}
            onHeadingChange={setHeading}
            onPitchChange={setPitch}
            onRollChange={setRoll}
            collisionGroup={collisionGroupRef.current}
            collisionEnabled={debugOptions.collision}
            onCollision={(dist) => setCollisionDistance(dist)}
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
        </Suspense>
      </Canvas>

      <CompassBar heading={heading} pitch={pitch} roll={roll} />

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
        </div>
        <div className="text-white/50 text-[10px] space-x-3">
          <span>W/S pitch</span>
          <span>A/D bank</span>
          <span>SHIFT boost</span>
          <span>SPACE freeze</span>
        </div>
      </div>

      {currentDistrict && <DistrictIndicator district={currentDistrict} />}

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
