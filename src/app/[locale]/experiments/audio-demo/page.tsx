/**
 * Audio Demo Page
 * 
 * This page demonstrates the audio system, library, and useAudio hooks.
 * Features: Multi-file upload, distance culling, memory optimization
 * 
 * IMPORTANT: THIS PAGE IS AI GENERATED - IT IS PRONE TO ERRORS. DO NOT USE IT AS A REFERENCE.
 */

'use client';

import { useRef, useEffect, useState, useContext, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AudioSessionContext, useParam, useCommit, useSpatial, useSpatialMode, usePreview, useDistanceCulling } from '@/hooks/useAudio';
import { createAudioSession, GraphSpec, createSharedAudioContext } from '@/lib/audio';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

function createMultiFileSpec(audioUrls: string[]): GraphSpec {
  const assets = audioUrls.map((url, i) => ({
    id: `sample${i + 1}`,
    kind: 'sample' as const,
    src: url,
    loop: true,
  }));

  const nodes = audioUrls.flatMap((_, i) => [
    {
      id: `player${i + 1}`,
      type: 'Player' as const,
      assetId: `sample${i + 1}`,
      params: { playbackRate: 1, loop: true, reverse: false },
    },
    {
      id: `filter${i + 1}`,
      type: 'Filter' as const,
      params: { frequency: 1000, Q: 1, type: 'lowpass' },
    },
    {
      id: `reverb${i + 1}`,
      type: 'Reverb' as const,
      params: { decay: 2, wet: 0.3 },
    },
    {
      id: `gain${i + 1}`,
      type: 'Gain' as const,
      params: { gain: 0.8 },
    },
  ]);

  const connections = audioUrls.flatMap((_, i) => [
    { from: { id: `player${i + 1}` }, to: { id: `filter${i + 1}` } },
    { from: { id: `filter${i + 1}` }, to: { id: `reverb${i + 1}` } },
    { from: { id: `reverb${i + 1}` }, to: { id: `gain${i + 1}` } },
  ]);

  return {
    version: '1.0.0',
    schema: 'graph@1',
    tempo: 120,
    seed: Date.now(),
    sampleRate: 44100,
    assets,
    nodes,
    connections,
    automations: [],
    buses: [],
    sends: [],
    mix: { masterGain: 0.9 },
    meta: {
      title: 'Audio Demo',
      author: 'Demo User',
      tags: ['demo', 'spatial', 'optimization'],
      createdAt: new Date().toISOString(),
    },
  };
}

function AudioControls({ sharedContext, sourceCount }: { sharedContext: AudioContext | null; sourceCount: number }) {
  const session = useContext(AudioSessionContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSource, setSelectedSource] = useState(1);
  const [playbackRate, setPlaybackRate] = useParam(`player${selectedSource}`, 'playbackRate');
  const [frequency, setFrequency] = useParam(`filter${selectedSource}`, 'frequency');
  const [filterQ, setFilterQ] = useParam(`filter${selectedSource}`, 'Q');
  const [reverbWet, setReverbWet] = useParam(`reverb${selectedSource}`, 'wet');
  const [gain, setGain] = useParam(`gain${selectedSource}`, 'gain');
  const { commit, status, lastResult } = useCommit();
  const { mode, freeze, unfreeze } = useSpatialMode(`gain${selectedSource}`);
  
  const handleStartStopAll = () => {
    if (!session) return;
    
    if (isPlaying) {
      for (let i = 1; i <= sourceCount; i++) {
        const player = session.getNode(`player${i}`);
        if (player) {
          try {
            player.raw().stop();
          } catch (err) {
            console.warn(`Failed to stop player${i}:`, err);
          }
        }
      }
      setIsPlaying(false);
    } else {
      if (sharedContext && sharedContext.state === 'suspended') {
        sharedContext.resume();
      }
      
      for (let i = 1; i <= sourceCount; i++) {
        const player = session.getNode(`player${i}`);
        if (player) {
          try {
            player.raw().start("+0");
          } catch (err) {
            console.warn(`Failed to start player${i}:`, err);
          }
        }
      }
      setIsPlaying(true);
    }
  };

  const handleFreeze = async () => {
    try {
      const nodeId = `gain${selectedSource}`;
      const result = await commit({
        nodeId,  // Only render the chain for this specific source
        normalize: false,
        durationOverride: 10  // Reduced from 30s to save memory (looping ambient sounds)
      });
      freeze(result);
      console.log(`Frozen source ${selectedSource} (chain for ${nodeId})`);
    } catch (err) {
      console.error('Freeze failed:', err);
      alert(`Render failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleClearCache = () => {
    if (session) {
      session.clearCache();
      console.log('Cache cleared');
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg space-y-4">
      <h2 className="text-2xl font-bold mb-4">Audio Controls</h2>

      <div className="space-y-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
          <Button
            onClick={handleStartStopAll}
            className="w-full"
            variant={isPlaying ? "destructive" : "default"}
          >
            {isPlaying ? '⏹ Stop All Audio' : '▶ Start All Audio'}
          </Button>
          <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
            {isPlaying ? `${sourceCount} source(s) playing through 3D spheres` : 'Click to start playback through spatial audio'}
          </p>
        </div>

        <Separator />

        {sourceCount > 1 && (
          <>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <label className="block text-sm font-medium mb-2">
                Select Source ({sourceCount} total)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: sourceCount }, (_, i) => (
                  <Button
                    key={i + 1}
                    size="sm"
                    variant={selectedSource === i + 1 ? "default" : "outline"}
                    onClick={() => setSelectedSource(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        <div className={`p-3 rounded ${mode === 'live' ? 'bg-cyan-50 dark:bg-cyan-900' : 'bg-green-50 dark:bg-green-900'}`}>
          <p className="text-sm font-bold mb-1">
            {mode === 'live' ? '🔵 Live Mode' : '🟢 Frozen Mode'} (Source {selectedSource})
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {mode === 'live' 
              ? 'Real-time audio with Tone.js effects' 
              : 'Playing committed audio buffer'}
          </p>
        </div>

        <Separator />

        <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
          <p className="text-xs font-bold mb-1">🎧 3D Spatial Audio</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Player → Filter → Reverb → Gain → 3D Sphere
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Move camera around to hear positional audio!
          </p>
        </div>

        <Separator />

        <div>
          <label className="block text-sm font-medium mb-1">
            Playback Rate: {playbackRate.toFixed(2)}
          </label>
          <input
            title="Playback Rate"
            type="range"
            min="0.25"
            max="4"
            step="0.01"
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Separator />

        <div>
          <label className="block text-sm font-medium mb-1">
            Filter Frequency: {frequency.toFixed(0)} Hz
          </label>
          <input
            title="Filter Frequency"
            type="range"
            min="20"
            max="20000"
            step="10"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Filter Q: {filterQ.toFixed(2)}
          </label>
          <input
            title="Filter Q"
            type="range"
            min="0.1"
            max="36"
            step="0.1"
            value={filterQ}
            onChange={(e) => setFilterQ(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Separator />

        <div>
          <label className="block text-sm font-medium mb-1">
            Reverb Wet: {(reverbWet * 100).toFixed(0)}%
          </label>
          <input
            title="Reverb Wet"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={reverbWet}
            onChange={(e) => setReverbWet(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Separator />

        <div>
          <label className="block text-sm font-medium mb-1">
            Gain: {(gain * 100).toFixed(0)}%
          </label>
          <input
            title="Gain"
            type="range"
            min="0"
            max="4"
            step="0.01"
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Separator />

        <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
          {mode === 'live' ? (
            <>
              <Button
                onClick={handleFreeze}
                disabled={status === 'rendering'}
                className="w-full"
              >
                {status === 'rendering' ? 'Rendering...' : '❄️ Freeze Source ' + selectedSource}
              </Button>
              <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                Freeze current settings into a committed buffer
              </p>
            </>
          ) : (
            <>
              <Button
                onClick={() => unfreeze()}
                className="w-full"
                variant="outline"
              >
                🔥 Unfreeze Source {selectedSource}
              </Button>
              <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                Return to live mode for real-time editing
              </p>
            </>
          )}
        </div>

        <Separator />

        <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded">
          <p className="text-sm font-bold mb-2">🧹 Memory Management</p>
          <Button
            onClick={handleClearCache}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Clear Cache
          </Button>
        </div>

        {lastResult && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2">
              ✓ Spatial Audio Bound
            </p>
            <p className="text-xs">
              <strong>Duration:</strong> {lastResult.duration.toFixed(2)}s
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded text-xs">
          <p className="font-medium mb-1">💡 Features:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Multi-file:</strong> Upload multiple audio files</li>
            <li><strong>Live Path:</strong> Real-time Tone.js effects</li>
            <li><strong>Distance Culling:</strong> Auto-pause distant sources</li>
            <li><strong>Memory Optimized:</strong> 44.1kHz, LRU cache</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SoundSphere({
  index,
  audioReady,
  position,
  cameraRef,
  listenerRef
}: {
  index: number;
  audioReady: boolean;
  position: [number, number, number];
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  listenerRef: React.RefObject<THREE.AudioListener>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const session = useContext(AudioSessionContext);
  const [isCulled, setIsCulled] = useState(false);

  const { mode } = useSpatialMode(`gain${index}`);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);

  // Memoize spatial options to prevent recreating binding on every render
  const spatialOpts = useMemo(() => ({
    mode: 'live' as const,
    refDistance: 5,
    rolloffFactor: 1,
    distanceModel: 'inverse' as const,
    cullDistance: 100,
    resumeDistance: 80,
    enableCulling: true,
  }), []);

  useSpatial(
    `gain${index}`,
    meshRef as React.RefObject<THREE.Object3D>,
    listenerRef,
    spatialOpts,
    [] // No extra dependencies - binding should persist
  );

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x = position[0] + Math.sin(Date.now() * 0.0005) * 0.3;
      meshRef.current.position.z = position[2] + Math.cos(Date.now() * 0.0005) * 0.3;
    }

    if (session) {
      const binding = session.getSpatialBinding(`gain${index}`);
      if (binding) {
        setIsCulled(binding.isCulled);
      }
    }
  });

  const color = !audioReady
    ? '#6b7280'
    : isCulled
      ? '#ef4444'
      : mode === 'live'
        ? '#06b6d4'
        : mode === 'committed'
          ? '#4ade80'
          : '#6b7280';

  const emissiveIntensity = !audioReady ? 0.3 : isCulled ? 0.3 : mode === 'live' ? 0.6 : 0.5;

  return (
    <>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <pointLight
        position={position}
        intensity={isCulled ? 0.3 : 1}
        color={color}
      />
    </>
  );
}

function Scene({
  sourceCount,
  audioReady,
  sharedContext,
  spherePositions,
  cameraRef
}: {
  sourceCount: number;
  audioReady: boolean;
  sharedContext: AudioContext | null;
  spherePositions: [number, number, number][];
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
}) {
  const { camera } = useThree();
  const listenerRef = useRef<THREE.AudioListener | null>(null);

  // Create a single shared AudioListener attached to the camera
  useEffect(() => {
    if (camera && !listenerRef.current && sharedContext) {
      const listener = new THREE.AudioListener();

      if (listener.context !== sharedContext) {
        console.log('[Scene] Using MediaStream bridge for spatial audio');
      }

      listenerRef.current = listener;
      camera.add(listener);
      console.log('[Scene] Created shared AudioListener attached to camera');
    }

    return () => {
      if (listenerRef.current && camera) {
        camera.remove(listenerRef.current);
        console.log('[Scene] Removed shared AudioListener from camera');
      }
    };
  }, [camera, sharedContext]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);

  useDistanceCulling(cameraRef as React.RefObject<THREE.Camera>);

  return (
    <>
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {Array.from({ length: sourceCount }, (_, i) => (
        <SoundSphere
          key={i + 1}
          index={i + 1}
          audioReady={audioReady && !!listenerRef.current}
          position={spherePositions[i] || [0, 0, 0]}
          cameraRef={cameraRef}
          listenerRef={listenerRef as React.RefObject<THREE.AudioListener>}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      <gridHelper args={[20, 20, '#444', '#222']} position={[0, -0.99, 0]} />

      <OrbitControls makeDefault />
    </>
  );
}

function MemoryStatsDisplay({ stats }: { stats: { totalSources: number; activeSources: number; culledSources: number; estimatedMemoryMB: number } }) {
  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg text-sm max-w-xs">
      <h3 className="font-bold mb-2">Performance Stats</h3>
      <div className="space-y-1 text-xs">
        <p><strong>Total:</strong> {stats.totalSources}</p>
        <p className="text-green-600 dark:text-green-400"><strong>Active:</strong> {stats.activeSources}</p>
        <p className="text-yellow-600 dark:text-yellow-400"><strong>Culled:</strong> {stats.culledSources}</p>
        <p className="text-blue-600 dark:text-blue-400"><strong>Memory:</strong> {stats.estimatedMemoryMB.toFixed(2)} MB</p>
      </div>
      <Separator className="my-2" />
      <p className="text-xs text-gray-600 dark:text-gray-400">
        🔵 Cyan = Live | 🟢 Green = Frozen | 🔴 Red = Culled
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        Move camera to see distance culling in action!
      </p>
    </div>
  );
}

export default function AudioDemo() {
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharedContext, setSharedContext] = useState<AudioContext | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [stats, setStats] = useState({ totalSources: 0, activeSources: 0, culledSources: 0, estimatedMemoryMB: 0 });
  const cameraRef = useRef<THREE.Camera | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const audioFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/')) {
        audioFiles.push(file);
      }
    }

    if (audioFiles.length === 0) {
      alert('Please select at least one audio file');
      return;
    }

    audioUrls.forEach(url => URL.revokeObjectURL(url));
    
    const urls = audioFiles.map(file => URL.createObjectURL(file));
    setUploadedFiles(audioFiles);
    setAudioUrls(urls);
    console.log(`Selected ${audioFiles.length} audio file(s)`);
  };

  const initAudio = async () => {
    if (loading || ready) return;

    setLoading(true);
    setStarted(true);

    try {
      const audioContext = createSharedAudioContext({ sampleRate: 22050 });
      setSharedContext(audioContext);

      const sources = audioUrls.length > 0 
        ? audioUrls 
        : ['/audio/tokyo-street.mp3'];

      const spec = createMultiFileSpec(sources);

      const audioSession = await createAudioSession(spec, { context: audioContext });
      setSession(audioSession);
      setReady(true);
      console.log(`✓ Audio session initialized with ${sources.length} source(s)`);
    } catch (err) {
      console.error('Failed to create audio session:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      audioUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [audioUrls]);

  const sourceCount = audioUrls.length > 0 ? audioUrls.length : 1;

  const spherePositions: [number, number, number][] = [
    [0, 0, 0],
    [5, 0, 0],
    [-5, 0, 0],
    [0, 0, 5],
    [0, 0, -5],
    [3.5, 0, 3.5],
    [-3.5, 0, 3.5],
    [3.5, 0, -3.5],
    [-3.5, 0, -3.5],
  ];

  useEffect(() => {
    if (!ready || !session) return;

    let rafId: number;
    
    const updateStats = () => {
      // Check for camera on each frame (it might not be ready at effect start)
      if (cameraRef.current && session) {
        const position = new THREE.Vector3();
        cameraRef.current.getWorldPosition(position);
        session.updateSpatialCulling(position);
        const currentStats = session.getSpatialStats();
        setStats(currentStats);
      }
      rafId = requestAnimationFrame(updateStats);
    };

    rafId = requestAnimationFrame(updateStats);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ready, session]);

  return (
    <div className="flex h-screen w-screen bg-gray-100 dark:bg-gray-950">
      {!started ? (
        <div className="flex items-center justify-center w-full">
          <div className="text-center space-y-6 max-w-lg px-6">
            <h1 className="text-4xl font-bold">Audio System Demo</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Demonstrating Tone.js → Web Audio API → Three.js PositionalAudio pipeline with distance culling
            </p>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg space-y-4">
              <div className="space-y-2">
                <label htmlFor="audio-upload" className="block text-sm font-medium text-left">
                  Upload Audio Files (Optional, Multiple Allowed)
                </label>
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full"
                />
                {uploadedFiles.length > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 text-left">
                    <p className="font-bold">✓ Selected {uploadedFiles.length} file(s):</p>
                    <ul className="list-disc list-inside mt-1">
                      {uploadedFiles.map((file, i) => (
                        <li key={i}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Supports: MP3, WAV, FLAC, OGG, M4A. Each file gets its own 3D sphere!
                </p>
              </div>

              <Separator />

              <Button onClick={initAudio} size="lg" className="w-full">
                Start Audio Demo
              </Button>

              {uploadedFiles.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  No files selected? Will use default: <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">tokyo-street.mp3</code>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <AudioSessionContext.Provider value={session}>
          <div className="flex-shrink-0 p-6 overflow-y-auto">
            {ready && session ? (
              <AudioControls sharedContext={sharedContext} sourceCount={sourceCount} />
            ) : (
              <div className="w-80 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
                {error ? (
                  <div className="text-red-500">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p className="text-sm">{error.message}</p>
                  </div>
                ) : (
                  <p>Loading audio session...</p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
              <Scene
                sourceCount={sourceCount}
                audioReady={ready && !!session}
                sharedContext={sharedContext}
                spherePositions={spherePositions}
                cameraRef={cameraRef}
              />
            </Canvas>

            {ready && session && <MemoryStatsDisplay stats={stats} />}
          </div>
        </AudioSessionContext.Provider>
      )}
    </div>
  );
}
