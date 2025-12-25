"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { AudioSessionContext } from "@/hooks/useAudio";
import { createSharedAudioContext, createAudioSession, GraphSpec } from "@/lib/audio";
import { type MovementMode } from "@/lib/flight";
import { CityScene } from "@/components/city/CityScene";
import { FlightControls } from "@/components/city/FlightControls";
import { CityUI } from "@/components/city/CityUI";
import { DebugPanel, type SpatialDebugInfo } from "@/components/city/DebugPanel";
import type { PlateDebugInfo } from "@/components/city/CityLyriaAudio";
import { useGenerativeAudioStore } from "@/stores/use-generative-audio-store";

interface AudioFileInfo {
  name: string;
  url: string;
}

function createCityAudioSpec(audioFiles: AudioFileInfo[]): GraphSpec {
  const assets: GraphSpec["assets"] = audioFiles.map((file, i) => ({
    id: `city_asset_${i}`,
    kind: "sample" as const,
    src: file.url,
    loop: true,
  }));

  const nodes: GraphSpec["nodes"] = audioFiles.flatMap((_, i) => [
    {
      id: `player_building_${i}`,
      type: "Player" as const,
      assetId: `city_asset_${i}`,
      params: { playbackRate: 1, loop: true, reverse: false },
    },
    {
      id: `filter_building_${i}`,
      type: "Filter" as const,
      params: { frequency: 2000, Q: 1, type: "lowpass" },
    },
    {
      id: `reverb_building_${i}`,
      type: "Reverb" as const,
      params: { decay: 1.5, wet: 0.25 },
    },
    {
      id: `gain_building_${i}`,
      type: "Gain" as const,
      params: { gain: 0.7 },
    },
  ]);

  const connections: GraphSpec["connections"] = audioFiles.flatMap((_, i) => [
    { from: { id: `player_building_${i}` }, to: { id: `filter_building_${i}` } },
    { from: { id: `filter_building_${i}` }, to: { id: `reverb_building_${i}` } },
    { from: { id: `reverb_building_${i}` }, to: { id: `gain_building_${i}` } },
  ]);

  return {
    version: "1.0.0",
    schema: "graph@1",
    tempo: 120,
    seed: Date.now(),
    sampleRate: 44100,
    assets,
    nodes,
    connections,
    automations: [],
    buses: [],
    sends: [],
    mix: { masterGain: 0.85 },
    meta: {
      title: "City Flight Audio",
      author: "City Flight",
      tags: ["spatial", "city", "ambient"],
      createdAt: new Date().toISOString(),
    },
  };
}

const Loader = () => (
  <mesh>
    <boxGeometry args={[2, 2, 2]} />
    <meshStandardMaterial color="#ff6b9d" emissive="#ff6b9d" emissiveIntensity={0.3} />
  </mesh>
);

export default function CityCanvas() {
  const [session, setSession] = useState<any>(null);
  const [sharedContext, setSharedContext] = useState<AudioContext | null>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFileInfo[]>([]);
  const [stats, setStats] = useState({ totalSources: 0, activeSources: 0, culledSources: 0, estimatedMemoryMB: 0 });
  const [flightSpeed, setFlightSpeed] = useState(50);
  const [movementMode, setMovementMode] = useState<MovementMode>("elytra");
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [gyroState, setGyroState] = useState({
    isActive: false,
    isAvailable: false,
    isEnabled: false,
    needsPermission: false,
  });
  const [plateDebugInfo, setPlateDebugInfo] = useState<PlateDebugInfo[]>([]);
  const [spatialDebugInfo, setSpatialDebugInfo] = useState<SpatialDebugInfo[]>([]);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 100, z: 200 });
  const cameraRef = useRef<THREE.Camera | null>(null);
  const gyroControlsRef = useRef<{
    requestPermission: () => Promise<boolean>;
    recalibrate: () => void;
  } | null>(null);
  
  const { 
    enabled: generativeEnabled, 
    setEnabled: setGenerativeEnabled,
    apiKey,
    setApiKey 
  } = useGenerativeAudioStore();

  useEffect(() => {
    const loadAudioFiles = async () => {
      const knownFiles = [
        { name: "Tokyo Street", url: "/audio/tokyo-street.mp3" },
        { name: "Train Announcement", url: "/audio/bilingual-train-annoucement.mp3" },
        { name: "Train Approaching", url: "/audio/train-apraoching-ikebukuro.mp3" },
      ];

      const validatedFiles: AudioFileInfo[] = [];
      
      for (const file of knownFiles) {
        try {
          const response = await fetch(file.url, { method: "HEAD" });
          if (response.ok) {
            validatedFiles.push(file);
          }
        } catch {
          console.log(`Audio file not found: ${file.url}`);
        }
      }

      if (validatedFiles.length > 0) {
        setAudioFiles(validatedFiles);
      } else {
        setAudioFiles(knownFiles);
      }
    };

    loadAudioFiles();
  }, []);

  const initAudio = async () => {
    if (loading || ready) return;

    setLoading(true);
    setStarted(true);

    try {
      const DOE = window.DeviceOrientationEvent as any;
      const DME = window.DeviceMotionEvent as any;
      
      let gyroGranted = false;
      
      if (typeof DOE?.requestPermission === "function") {
        try {
          const permission = await DOE.requestPermission();
          gyroGranted = permission === "granted";
        } catch (e) {
          console.error("[CityPage] Failed to request gyroscope permission:", e);
        }
      }
      
      if (typeof DME?.requestPermission === "function") {
        try {
          await DME.requestPermission();
        } catch (e) {
          console.error("[CityPage] Failed to request motion permission:", e);
        }
      }
      
      if (gyroGranted) {
        setGyroState(prev => ({ ...prev, isEnabled: true, needsPermission: false }));
      }

      const audioContext = createSharedAudioContext({ sampleRate: 44100 });
      
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      
      setSharedContext(audioContext);

      const spec = createCityAudioSpec(audioFiles);
      const audioSession = await createAudioSession(spec, { context: audioContext });
      setSession(audioSession);
      setReady(true);
    } catch (err) {
      console.error("Failed to create audio session:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !session) return;

    const position = new THREE.Vector3();
    const audioPos = new THREE.Vector3();
    let lastCull = 0;
    let lastUIUpdate = 0;
    const CULL_INTERVAL = 50; // ms
    const UI_UPDATE_INTERVAL = 500; // ms

    let rafId: number;
    const update = (time: number) => {
      if (cameraRef.current && session) {
        cameraRef.current.getWorldPosition(position);
        
        if (time - lastCull >= CULL_INTERVAL) {
          session.updateSpatialCulling(position);
          lastCull = time;
        }
        
        if (time - lastUIUpdate >= UI_UPDATE_INTERVAL) {
          lastUIUpdate = time;
          
          const currentStats = session.getSpatialStats();
          setStats(currentStats);
          setCameraPosition({ x: position.x, y: position.y, z: position.z });
          
          const bindings = (session as any).spatialBindings;
          if (bindings instanceof Map) {
            const spatialInfo: SpatialDebugInfo[] = [];
            bindings.forEach((binding: any, nodeId: string) => {
              const audio = binding.audio as THREE.PositionalAudio | undefined;
              if (audio) {
                audio.getWorldPosition(audioPos);
                const distance = position.distanceTo(audioPos);
                
                const refDist = binding.options?.refDistance || 20;
                const maxDist = binding.options?.maxDistance || 500;
                let volume = 1;
                if (distance > refDist) {
                  volume = Math.max(0, 1 - (distance - refDist) / (maxDist - refDist));
                }
                
                const name = nodeId.replace("gain_building_", "").replace(/_/g, " ");
                const displayName = audioFiles[parseInt(nodeId.split("_").pop() || "0")]?.name || name;
                
                spatialInfo.push({
                  name: displayName,
                  distance,
                  volume,
                  culled: binding.isCulled || false,
                });
              }
            });
            setSpatialDebugInfo(spatialInfo);
          }
        }
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [ready, session, audioFiles]);

  if (!started) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className="text-center space-y-8 max-w-2xl px-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tight bg-linear-to-r from-cyan-400 via-fuchsia-500 to-amber-400 bg-clip-text text-transparent">
              CITY FLIGHT EXPERIMENT
            </h1>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl space-y-6">
            <div className="space-y-3 text-left">
              <div className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-cyan-400 font-mono font-bold">W</p>
                  <p className="text-slate-500 text-xs">Pitch up</p>
                </div>
                <p className="text-slate-300 text-sm">Aim higher</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-cyan-400 font-mono font-bold">S</p>
                  <p className="text-slate-500 text-xs">Pitch down</p>
                </div>
                <p className="text-slate-300 text-sm">Aim lower</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-fuchsia-400 font-mono font-bold">A / D</p>
                  <p className="text-slate-500 text-xs">Bank & turn</p>
                </div>
                <p className="text-slate-300 text-sm">Smooth turning</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-amber-400 font-mono font-bold">SHIFT</p>
                  <p className="text-slate-500 text-xs">Rocket boost</p>
                </div>
                <p className="text-slate-300 text-sm">Instant speed burst!</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 font-mono font-bold">SPACE</p>
                  <p className="text-slate-500 text-xs">Freeze camera</p>
                </div>
                <p className="text-slate-300 text-sm">Lock in place</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 text-center">
              Gravity affects your speed
            </p>

            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-slate-500 text-sm mb-4">
                {audioFiles.length} audio sources detected • {audioFiles.length} colored buildings
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="generative"
                    checked={generativeEnabled}
                    onChange={(e) => setGenerativeEnabled(e.target.checked)}
                    className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-fuchsia-500 focus:ring-fuchsia-500"
                  />
                  <label htmlFor="generative" className="text-slate-300">
                    Enable Generative Audio (Lyria)
                  </label>
                </div>

                {generativeEnabled && (
                  <input
                    type="password"
                    placeholder="Google AI API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                  />
                )}
              </div>

              <button
                onClick={initAudio}
                disabled={loading || audioFiles.length === 0}
                className="w-full mt-6 px-8 py-4 bg-linear-to-r from-cyan-500 via-fuchsia-500 to-amber-500 text-white font-bold text-lg rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20"
              >
                {loading ? "INITIALIZING..." : "ENTER CITY"}
              </button>
              
              <p className="text-[10px] text-slate-600 text-center mt-3">
                iOS: Safari required for gyroscope. Enable Motion & Orientation in Settings → Safari.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AudioSessionContext.Provider value={session}>
      <div className="w-full h-screen bg-slate-950 relative overflow-hidden">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ fov: 75, far: 10000, near: 0.1, position: [0, 100, 200] }}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
          }}
          frameloop="always"
        >
          <color attach="background" args={["#0a0a1a"]} />
          <fog attach="fog" args={["#0a0a1a", 200, 2000]} />

          <Suspense fallback={<Loader />}>
            <CityScene
              audioFiles={audioFiles}
              sharedContext={sharedContext}
              cameraRef={cameraRef}
              generativeEnabled={generativeEnabled}
              apiKey={apiKey}
              onGenerativeDebugUpdate={setPlateDebugInfo}
            />
          </Suspense>

          <FlightControls 
            cameraRef={cameraRef} 
            speed={flightSpeed} 
            config={{
              mode: movementMode,
              enableMouseLook: true,
              enableBounds: true,
              minHeight: 10,
              maxHeight: 1000,
              enableGyroscope: true,
            }}
            onSpeedChange={setFlightSpeed}
            onModeChange={setMovementMode}
            onPointerLockChange={setIsPointerLocked}
            onGyroStateChange={setGyroState}
            gyroControlsRef={gyroControlsRef}
          />

          {/* Environment and Bloom disabled for performance testing */}
        </Canvas>

        <CityUI
          stats={stats}
          flightSpeed={flightSpeed}
          ready={ready}
          audioFiles={audioFiles}
          generativeEnabled={generativeEnabled}
          movementMode={movementMode}
          isPointerLocked={isPointerLocked}
          isGyroActive={gyroState.isActive}
          onRecalibrateGyro={() => gyroControlsRef.current?.recalibrate()}
        />

        {ready && (
          <DebugPanel
            plateWeights={plateDebugInfo}
            spatialSources={spatialDebugInfo}
            cameraPosition={cameraPosition}
            generativeEnabled={generativeEnabled}
          />
        )}
      </div>
    </AudioSessionContext.Provider>
  );
}

