"use client";

/**
 * Fireworks Component for R3F
 * Spawns fireworks at multiple geographic locations in Tokyo
 * Only active when camera is within proximity of each location
 * Includes sample-based explosion sounds with distance attenuation
 */

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TOKYO_CENTER } from "@/config/tokyo-config";
import { latLngAltToENU } from "@/lib/geo-utils";

// Firework launch locations in Tokyo
const FIREWORKS_LOCATIONS = [
  {
    name: "明治神宮外苑", // Meiji Jingu Gaien
    lat: 35.6764,
    lng: 139.7177,
    alt: 0,
  },
  {
    name: "隅田川", // Sumida River (famous for Sumida River Fireworks Festival)
    lat: 35.7147,
    lng: 139.8027,
    alt: 0,
  },
  {
    name: "東京ドーム", // Tokyo Dome
    lat: 35.7056,
    lng: 139.7519,
    alt: 0,
  },
];

// Firework configuration - matched to firework.tsx demo
const CONFIG = {
  particleCountMin: 15000, // Min particles per explosion
  particleCountMax: 20000, // Max particles per explosion
  particleSize: 0.8, // Visual size of each particle (matched to demo)
  fadeSpeed: 0.00482, // How fast particles fade out
  explosionForceMin: 2.5, // Min explosion force
  explosionForceMax: 4.0, // Max explosion force
  hoverDuration: 1.5, // Seconds particles hover before falling
  gravity: 0.00265, // Downward acceleration
  friction: 0.95494, // Velocity damping (matched to demo)
  launchInterval: 1800, // ms between launches per location
  maxActiveFireworks: 12, // Increased for 3 locations (4 per location)
  explosionHeightMin: 120, // Min meters above ground
  explosionHeightMax: 280, // Max meters above ground
  spreadRadius: 500, // meters - horizontal spread for launch positions
  proximityRadius: 2500, // meters - camera must be within this to trigger
  rocketSpeed: 4.0, // meters per frame upward
  // Audio configuration
  audioRefDistance: 100, // meters - distance at which volume starts to drop
  audioMaxDistance: 2000, // meters - beyond this, sound is inaudible
};

// ============================================================
// SAMPLE-BASED AUDIO SYSTEM - Uses pre-recorded explosion sounds
// ============================================================
/**
 * Audio system using real firework samples for natural sound.
 * Selects between close/distant samples based on camera distance.
 * Uses exponential distance falloff for realistic attenuation.
 */

// Audio sample paths
const AUDIO_SAMPLES = {
  close: ["/audio/fireworks/close_01.wav", "/audio/fireworks/close_02.wav"],
  distant: [
    "/audio/fireworks/distant_01.wav",
    "/audio/fireworks/distant_02.wav",
  ],
};

interface FireworksAudioSystem {
  ctx: AudioContext | null;
  initialized: boolean;
  closeBuffers: AudioBuffer[];
  distantBuffers: AudioBuffer[];
  loadingPromise: Promise<void> | null;
}

const audioSystem: FireworksAudioSystem = {
  ctx: null,
  initialized: false,
  closeBuffers: [],
  distantBuffers: [],
  loadingPromise: null,
};

/**
 * Load an audio file and decode it into an AudioBuffer
 */
async function loadAudioBuffer(
  ctx: AudioContext,
  url: string
): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

/**
 * Initialize the audio system and preload all samples
 * Must be called after user interaction for AudioContext to work
 */
async function initAudioSystem(
  listenerContext?: AudioContext
): Promise<boolean> {
  if (audioSystem.initialized && audioSystem.ctx) {
    if (audioSystem.ctx.state === "suspended") {
      await audioSystem.ctx.resume().catch(() => {});
    }
    return true;
  }

  // If already loading, wait for it
  if (audioSystem.loadingPromise) {
    await audioSystem.loadingPromise;
    return audioSystem.initialized;
  }

  audioSystem.loadingPromise = (async () => {
    try {
      const ctx =
        listenerContext ||
        new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();

      audioSystem.ctx = ctx;

      // Load all samples in parallel
      const [closeBuffers, distantBuffers] = await Promise.all([
        Promise.all(AUDIO_SAMPLES.close.map((url) => loadAudioBuffer(ctx, url))),
        Promise.all(
          AUDIO_SAMPLES.distant.map((url) => loadAudioBuffer(ctx, url))
        ),
      ]);

      audioSystem.closeBuffers = closeBuffers;
      audioSystem.distantBuffers = distantBuffers;
      audioSystem.initialized = true;

      console.log(
        "[Fireworks Audio] Loaded",
        closeBuffers.length,
        "close +",
        distantBuffers.length,
        "distant samples"
      );
    } catch (err) {
      console.warn("[Fireworks Audio] Failed to initialize:", err);
    }
  })();

  await audioSystem.loadingPromise;
  return audioSystem.initialized;
}

/**
 * Set the master volume (no-op, volume applied per-sound)
 */
function setAudioVolume(_volume: number): void {
  // Volume is applied directly in playExplosionSound
}

/**
 * Calculate distance-based volume using exponential falloff
 * This creates a more natural sound dropoff than linear/inverse
 */
function calculateDistanceVolume(
  distance: number,
  refDistance: number,
  maxDistance: number,
  rolloffFactor: number = 1.5
): number {
  if (distance <= refDistance) {
    // Close range: full volume but capped to prevent ear-blasting
    return 1.0;
  }
  if (distance >= maxDistance) {
    return 0.0;
  }

  // Exponential rolloff: volume = (ref/distance)^rolloff
  // With rolloffFactor=1.5, volume drops faster than inverse distance
  const normalizedDistance = distance / refDistance;
  const attenuation = Math.pow(1 / normalizedDistance, rolloffFactor);

  return Math.max(0, Math.min(1, attenuation));
}

/**
 * Play explosion sound using pre-recorded samples
 * Crossfades between close/distant samples based on distance
 */
function playExplosionSound(
  explosionPosition: THREE.Vector3,
  cameraPosition: THREE.Vector3,
  volume: number
): void {
  if (
    !audioSystem.initialized ||
    !audioSystem.ctx ||
    audioSystem.closeBuffers.length === 0
  ) {
    return;
  }

  const ctx = audioSystem.ctx;

  // Resume context if suspended
  if (ctx.state === "suspended") {
    (ctx as AudioContext).resume().catch(() => {});
    return;
  }

  // Calculate distance
  const distance = explosionPosition.distanceTo(cameraPosition);

  // Skip if beyond max distance
  if (distance >= CONFIG.audioMaxDistance) {
    return;
  }

  // Calculate volume based on distance with exponential falloff
  const distanceVolume = calculateDistanceVolume(
    distance,
    CONFIG.audioRefDistance,
    CONFIG.audioMaxDistance,
    2.0 // Steeper rolloff for more realistic distance feel
  );

  // Skip if too quiet
  if (distanceVolume < 0.02) {
    return;
  }

  // Determine blend between close and distant samples
  // Close: 0-400m (100% close at 0m, 0% at 400m)
  // Distant: 200-2500m (0% distant at 200m, 100% at 800m+)
  const closeBlend = Math.max(0, 1 - distance / 400);
  const distantBlend = Math.min(1, Math.max(0, (distance - 200) / 600));

  // Base volume scaled by user setting and distance
  // Cap at 0.7 to prevent overwhelming volume even at close range
  const baseVolume = Math.min(0.7, volume) * distanceVolume;

  // Play close sample if in range
  if (closeBlend > 0.05 && audioSystem.closeBuffers.length > 0) {
    const buffer =
      audioSystem.closeBuffers[
        Math.floor(Math.random() * audioSystem.closeBuffers.length)
      ];
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = baseVolume * closeBlend;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
  }

  // Play distant sample if in range
  if (distantBlend > 0.05 && audioSystem.distantBuffers.length > 0) {
    const buffer =
      audioSystem.distantBuffers[
        Math.floor(Math.random() * audioSystem.distantBuffers.length)
      ];
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = baseVolume * distantBlend;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
  }
}

// ============================================================
// PARTICLE & FIREWORK INSTANCE INTERFACES
// ============================================================

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  baseColor: { r: number; g: number; b: number };
}

interface FireworkInstance {
  phase: "rocket" | "explode";
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetY: number;
  timer: number;
  particles: Particle[];
  colors: THREE.Color[];
  isDead: boolean;
  particleCount: number;
  explosionForce: number;
}

// ============================================================
// COLOR PALETTE & PARTICLE GENERATION
// ============================================================

/**
 * Generate a random color palette for a firework explosion
 * Uses HSL color space for vibrant, varied colors
 */
function generateColorPalette(): THREE.Color[] {
  const colors: THREE.Color[] = [];
  const baseHue = Math.random();
  const paletteType = Math.floor(Math.random() * 4);

  for (let i = 0; i < 5; i++) {
    let hue: number;
    switch (paletteType) {
      case 0: // Analogous
        hue = (baseHue + i * 0.05) % 1;
        break;
      case 1: // Complementary
        hue = (baseHue + (i % 2) * 0.5) % 1;
        break;
      case 2: // Triadic
        hue = (baseHue + (i % 3) * 0.333) % 1;
        break;
      default: // Random warm
        hue = (baseHue + Math.random() * 0.2) % 1;
    }

    const saturation = 0.7 + Math.random() * 0.3;
    const lightness = 0.5 + Math.random() * 0.3;
    const color = new THREE.Color();
    color.setHSL(hue, saturation, lightness);
    colors.push(color);
  }

  return colors;
}

/**
 * Create explosion particles with spherical distribution
 */
function createExplosionParticles(
  center: THREE.Vector3,
  colors: THREE.Color[],
  particleCount: number,
  explosionForce: number
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    // Spherical distribution
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const speed = explosionForce * (0.5 + Math.random() * 0.5);

    const velocity = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed,
      Math.cos(phi) * speed
    );

    // Pick a random color from the palette
    const color = colors[Math.floor(Math.random() * colors.length)];

    particles.push({
      position: center.clone(),
      velocity,
      lifetime: 0.8 + Math.random() * 0.4,
      baseColor: { r: color.r, g: color.g, b: color.b },
    });
  }

  return particles;
}

export interface FireworksProps {
  /** Volume multiplier for explosion sounds (0.0 to 1.0). Defaults to 0.6 */
  volume?: number;
}

/**
 * Fireworks component - renders fireworks at multiple Tokyo locations
 * Only spawns when camera is within proximity of each location
 */
export default function Fireworks({ volume = 0.6 }: FireworksProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const fireworksRef = useRef<FireworkInstance[]>([]);
  const particleTextureRef = useRef<THREE.Texture | null>(null);
  const listenerRef = useRef<THREE.AudioListener | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  // Per-location state: tracks proximity and last launch time for each location
  const locationStateRef = useRef<
    {
      isInProximity: boolean;
      lastLaunchTime: number;
    }[]
  >(FIREWORKS_LOCATIONS.map(() => ({ isInProximity: false, lastLaunchTime: 0 })));

  const { camera } = useThree();

  // Calculate base positions in ENU coordinates for all locations
  const basePositions = useMemo(() => {
    return FIREWORKS_LOCATIONS.map((loc) => {
      const pos = latLngAltToENU(
        loc.lat,
        loc.lng,
        loc.alt,
        TOKYO_CENTER.lat,
        TOKYO_CENTER.lng,
        0
      );
      console.log(`[Fireworks] ${loc.name} position (ENU):`, pos.x.toFixed(0), pos.y.toFixed(0), pos.z.toFixed(0));
      return { name: loc.name, position: pos };
    });
  }, []);

  // Initialize AudioListener attached to camera
  useEffect(() => {
    // Check if camera already has an AudioListener (shared by TokyoSpatialAudio)
    let existingListener: THREE.AudioListener | null = null;
    camera.children.forEach((child) => {
      if (child instanceof THREE.AudioListener) {
        existingListener = child;
      }
    });

    if (existingListener) {
      listenerRef.current = existingListener;
      console.log("[Fireworks] Using existing AudioListener from camera");
    } else {
      // Create our own listener if none exists
      const listener = new THREE.AudioListener();
      camera.add(listener);
      listenerRef.current = listener;
      console.log("[Fireworks] Created new AudioListener");
    }

    // Initialize singleton audio system and resume context on user interaction
    const initAndResume = async () => {
      if (listenerRef.current) {
        const ctx = listenerRef.current.context as AudioContext;
        // Initialize singleton audio system with the listener's context
        await initAudioSystem(ctx);
        
        if (ctx.state === "suspended") {
          try {
            await ctx.resume();
            console.log("[Fireworks] AudioContext resumed");
          } catch (err) {
            console.warn("[Fireworks] Failed to resume AudioContext:", err);
          }
        }
        setAudioReady(true);
      }
    };

    initAndResume();

    const handleInteraction = () => {
      initAndResume();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      // Don't remove listener if we didn't create it
      if (listenerRef.current && !existingListener) {
        camera.remove(listenerRef.current);
      }
    };
  }, [camera]);

  // Sync volume prop with singleton audio system
  useEffect(() => {
    setAudioVolume(volume);
  }, [volume]);

  // Create particle texture (matched to demo: 32x32 with radial gradient)
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;

    // Radial gradient matching demo
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,1)"); // Bright center
    gradient.addColorStop(0.3, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(0,0,0,0)"); // Transparent edge
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    particleTextureRef.current = new THREE.CanvasTexture(canvas);
    particleTextureRef.current.needsUpdate = true;

    return () => {
      particleTextureRef.current?.dispose();
    };
  }, []);

  // Create geometry with max particles buffer
  const geometry = useMemo(() => {
    const maxParticles = CONFIG.particleCountMax * CONFIG.maxActiveFireworks;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const colorAttr = new THREE.BufferAttribute(colors, 3);
    colorAttr.normalized = false;
    geo.setAttribute("color", colorAttr);

    return geo;
  }, []);

  // Launch a new firework at a specific location
  const launchFirework = (locationIndex: number) => {
    if (fireworksRef.current.length >= CONFIG.maxActiveFireworks) return;

    const location = basePositions[locationIndex];
    if (!location) return;

    const basePosition = location.position;

    // Randomize per-firework values
    const particleCount =
      CONFIG.particleCountMin +
      Math.floor(
        Math.random() * (CONFIG.particleCountMax - CONFIG.particleCountMin)
      );
    const explosionForce =
      CONFIG.explosionForceMin +
      Math.random() * (CONFIG.explosionForceMax - CONFIG.explosionForceMin);
    const explosionHeight =
      CONFIG.explosionHeightMin +
      Math.random() * (CONFIG.explosionHeightMax - CONFIG.explosionHeightMin);

    // Random offset from base position
    const offsetX = (Math.random() - 0.5) * CONFIG.spreadRadius;
    const offsetZ = (Math.random() - 0.5) * CONFIG.spreadRadius;

    const startPos = new THREE.Vector3(
      basePosition.x + offsetX,
      basePosition.y, // Ground level (Y is up)
      basePosition.z + offsetZ
    );

    const targetY = basePosition.y + explosionHeight;

    const firework: FireworkInstance = {
      phase: "rocket",
      position: startPos.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        CONFIG.rocketSpeed + Math.random() * 0.5, // Upward velocity (Y is up)
        (Math.random() - 0.5) * 0.5
      ),
      targetY,
      timer: 0,
      particles: [],
      colors: generateColorPalette(),
      isDead: false,
      particleCount,
      explosionForce,
    };

    fireworksRef.current.push(firework);
    console.log(
      `[Fireworks] Launched at ${location.name}! | Active:`,
      fireworksRef.current.length,
      "| Target Y:",
      targetY.toFixed(0),
      "| Particles:",
      particleCount
    );
  };

  // Update fireworks every frame
  useFrame((state, delta) => {
    const now = performance.now();
    const cameraPos = camera.position;

    // Check proximity to each fireworks location
    for (let locIdx = 0; locIdx < basePositions.length; locIdx++) {
      const location = basePositions[locIdx];
      const locState = locationStateRef.current[locIdx];
      const basePosition = location.position;

      const dx = cameraPos.x - basePosition.x;
      const dz = cameraPos.z - basePosition.z;
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

      const wasInProximity = locState.isInProximity;
      locState.isInProximity = horizontalDistance < CONFIG.proximityRadius;

      // Log proximity changes and trigger immediate launch on entry
      if (locState.isInProximity !== wasInProximity) {
        console.log(
          `[Fireworks] ${location.name} Proximity:`,
          locState.isInProximity ? "ENTERED" : "LEFT",
          "| Distance:",
          horizontalDistance.toFixed(0),
          "m"
        );

        // Launch immediately when entering proximity
        if (locState.isInProximity) {
          locState.lastLaunchTime = now - CONFIG.launchInterval; // Force immediate launch
        }
      }

      // Auto-launch fireworks only when in proximity
      if (
        locState.isInProximity &&
        now - locState.lastLaunchTime > CONFIG.launchInterval
      ) {
        locState.lastLaunchTime = now;
        launchFirework(locIdx);
      }
    }

    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    let particleIndex = 0;

    // Update each firework
    for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
      const fw = fireworksRef.current[i];

      if (fw.phase === "rocket") {
        // Update rocket position
        fw.position.add(fw.velocity);
        fw.velocity.y *= 0.985; // Slow down gradually

        // Check if reached target (Y is up)
        if (fw.velocity.y < 0.5 || fw.position.y >= fw.targetY) {
          // Explode!
          fw.phase = "explode";
          fw.timer = 0;
          fw.particles = createExplosionParticles(
            fw.position,
            fw.colors,
            fw.particleCount,
            fw.explosionForce
          );
          
          // Play explosion sound with spatial audio
          if (audioReady) {
            playExplosionSound(fw.position, camera.position, volume);
          }
          
          console.log(
            "[Fireworks] EXPLODE at Y:",
            fw.position.y.toFixed(0),
            "Particles:",
            fw.particleCount
          );
        }
      } else {
        // Update explosion particles
        fw.timer += delta;
        const isHovering = fw.timer < CONFIG.hoverDuration;
        const gravityFactor = THREE.MathUtils.smoothstep(
          fw.timer,
          CONFIG.hoverDuration,
          CONFIG.hoverDuration + 0.5
        );

        let aliveCount = 0;

        for (const particle of fw.particles) {
          if (particle.lifetime > 0) {
            aliveCount++;

            // Update position
            particle.position.add(particle.velocity);

            if (isHovering) {
              // Hover: just friction
              particle.velocity.multiplyScalar(CONFIG.friction);
            } else {
              // Fall: gravity + friction + fade
              particle.velocity.y -= CONFIG.gravity * gravityFactor;
              particle.velocity.multiplyScalar(0.98);
              particle.lifetime -= CONFIG.fadeSpeed;
            }

            // Update color with alpha fade (matched to demo: baseColor * alpha * 1.5)
            const alpha = Math.max(0, particle.lifetime);
            const r = particle.baseColor.r * alpha * 1.5;
            const g = particle.baseColor.g * alpha * 1.5;
            const b = particle.baseColor.b * alpha * 1.5;

            // Write to buffer
            if (
              particleIndex <
              CONFIG.particleCountMax * CONFIG.maxActiveFireworks
            ) {
              const idx = particleIndex * 3;
              positions[idx] = particle.position.x;
              positions[idx + 1] = particle.position.y;
              positions[idx + 2] = particle.position.z;
              colors[idx] = r;
              colors[idx + 1] = g;
              colors[idx + 2] = b;
              particleIndex++;
            }
          }
        }

        if (aliveCount === 0) {
          fw.isDead = true;
        }
      }

      // Remove dead fireworks
      if (fw.isDead) {
        fireworksRef.current.splice(i, 1);
      }
    }

    // Clear remaining buffer positions (hide unused particles)
    for (
      let i = particleIndex;
      i < CONFIG.particleCountMax * CONFIG.maxActiveFireworks;
      i++
    ) {
      const idx = i * 3;
      positions[idx] = 0;
      positions[idx + 1] = -10000; // Hide below scene
      positions[idx + 2] = 0;
      colors[idx] = 0;
      colors[idx + 1] = 0;
      colors[idx + 2] = 0;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={CONFIG.particleSize}
        map={particleTextureRef.current}
        transparent
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
