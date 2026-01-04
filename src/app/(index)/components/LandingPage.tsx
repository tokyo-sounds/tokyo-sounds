"use client";

import { useRef, Suspense, useState, useMemo, useEffect, ReactNode, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, useMotionValueEvent, MotionValue, AnimatePresence } from "motion/react";
import { ArrowDown, Plane, Music, Map, Sparkles, Users, Volume2, Github, Linkedin, Globe, Menu, X } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/widget/LanguageSwitcher";
import PlayerForm from "./PlayerForm";
import { useIsMobile } from "@/hooks/use-mobile";
import ChipTab from "@/components/common/ChipTab";
import FloatingNavbar from "@/components/layout/FloatingNavbar";
import SiteFooter from "@/components/layout/SiteFooter";

function ScrollableContent({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
    
    if (isAtTop || isAtBottom) {
      container.style.overflowY = 'hidden';
      setTimeout(() => {
        container.style.overflowY = 'auto';
      }, 100);
    }
  }, [isMobile]);
  
  return (
    <div 
      ref={containerRef}
      className={`${className} overscroll-y-contain`}
      onScroll={handleScroll}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      {children}
    </div>
  );
}
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const OptimizedMotionDiv = motion.div;

type TeamMember = {
  name: string;
  role: string;
  description: string;
  profileImage: string;
  socials: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
};

type Feature = {
  title: string;
  description: string;
};

type Technology = {
  name: string;
  category: string;
};

type Stat = {
  value: string;
  label: string;
};

const FEATURE_ICONS = [Map, Music, Volume2, Sparkles];

function FixedCard({ 
  children, 
  className = "", 
  index = 0,
  scrollYProgress,
  nextScrollYProgress,
}: { 
  children: React.ReactNode; 
  className?: string;
  index?: number;
  scrollYProgress: MotionValue<number>;
  nextScrollYProgress?: MotionValue<number>;
}) {
  const isMobile = useIsMobile();
  
  const translateY = useTransform(scrollYProgress, [0, 1], ["100vh", "0vh"]);
  
  const inset = useTransform(
    scrollYProgress, 
    [0.5, 1], 
    [40, 0]
  );
  const borderRadius = useTransform(
    scrollYProgress, 
    [0.5, 1], 
    [24, 0]
  );

  if (isMobile) {
    return null;
  }

  return (
    <motion.div 
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: index + 10,
        translateY,
        willChange: 'transform',
      }}
    >
      <motion.div 
        className={`absolute bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-auto ${className}`}
        style={{ 
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          borderRadius,
        }}
      >
        {children}
        
        {nextScrollYProgress && (
          <DarkeningOverlay scrollYProgress={nextScrollYProgress} />
        )}
      </motion.div>
    </motion.div>
  );
}

function DarkeningOverlay({ scrollYProgress, className = "" }: { scrollYProgress: MotionValue<number>; className?: string }) {
  const isMobile = useIsMobile();
  
  const opacity = useTransform(
    scrollYProgress, 
    [0, 0.7], 
    [0, 0.2]
  );
  
  if (isMobile) {
    return null;
  }
  
  return (
    <motion.div 
      className={`absolute inset-0 bg-black pointer-events-none z-50 ${className}`}
      style={{ opacity }}
    />
  );
}

function ScrollTrigger({ 
  id,
  children,
  onProgressReady,
}: { 
  id?: string;
  children: (scrollYProgress: MotionValue<number>) => React.ReactNode;
  onProgressReady?: (progress: MotionValue<number>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"]
  });

  useEffect(() => {
    if (onProgressReady) {
      onProgressReady(scrollYProgress);
    }
  }, [scrollYProgress, onProgressReady]);

  return (
    <>
      <div ref={ref} id={id} className="relative h-screen" />
      {children(scrollYProgress)}
    </>
  );
}

function HeroContent({ nextScrollYProgress }: { nextScrollYProgress?: MotionValue<number> }) {
  const t = useTranslations("LandingPage");

  return (
    <div className="w-full h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-white via-white to-orange-50" />
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-linear-to-t from-orange-100/60 to-transparent" />
      </div>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-orange-200/50 via-orange-100/20 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0 }}
        >
          <div className="w-8 h-px bg-linear-to-r from-transparent to-orange-400" />
          <span className="text-orange-400 text-sm sm:text-base tracking-[0.4em] font-medium">
            {t("hero.japaneseLabel")}
          </span>
          <div className="w-8 h-px bg-linear-to-l from-transparent to-orange-400" />
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        >
          <h1 className="text-[12vw] sm:text-[11vw] md:text-[10vw] lg:text-[9vw] font-black tracking-tight leading-[0.9] bg-linear-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
            {t("hero.title")}
          </h1>
        </motion.div>

        <motion.p 
          className="text-gray-500 text-base sm:text-lg md:text-xl mt-6 max-w-md text-center font-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {t("hero.subtitle")}
        </motion.p>

        <div className="mt-10 h-[52px]" />
      </div>

      {nextScrollYProgress && (
        <DarkeningOverlay scrollYProgress={nextScrollYProgress} className="z-20" />
      )}
    </div>
  );
}

function HeroInteractiveLayer({ 
  playerFormProps 
}: { 
  playerFormProps: any;
}) {
  const t = useTranslations("LandingPage");
  const isMobile = useIsMobile();
  const { scrollY } = useScroll();
  
  const opacity = useTransform(scrollY, [100, 400], [1, 0]);
  const [isVisible, setIsVisible] = useState(true);
  const lastUpdateRef = useRef(0);
  
  useMotionValueEvent(scrollY, "change", (latest: number) => {
    const now = Date.now();
    if (isMobile && now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;
    
    setIsVisible(latest < 300);
  });

  return (
    <motion.div 
      className="hidden md:fixed md:inset-0 md:z-7 md:block"
      style={{ 
        opacity,
        pointerEvents: isVisible ? "none" : "none",
      }}
    >
      <div className="w-full h-screen flex flex-col items-center justify-center px-4">
        <div className="flex items-center gap-3 mb-4 invisible">
          <div className="w-8 h-px" />
          <span className="text-sm sm:text-base tracking-[0.4em]">{t("hero.japaneseLabel")}</span>
          <div className="w-8 h-px" />
        </div>
        <div className="text-center">
          <div className="text-[12vw] sm:text-[11vw] md:text-[10vw] lg:text-[9vw] font-black tracking-tight leading-[0.9] invisible">
            {t("hero.title")}
          </div>
        </div>
        <div className="text-base sm:text-lg md:text-xl mt-6 max-w-md invisible">
          {t("hero.subtitle")}
        </div>

        <motion.div
          className="mt-10"
          style={{ pointerEvents: isVisible ? "auto" : "none" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <PlayerForm {...playerFormProps} />
        </motion.div>
      </div>

      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ pointerEvents: isVisible ? "auto" : "none" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2 text-orange-500 cursor-pointer group"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          onClick={() => {
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="text-xs tracking-[0.2em] uppercase font-medium group-hover:text-orange-600 transition-colors">
            {t("hero.scroll")}
          </span>
          <ArrowDown className="w-5 h-5 group-hover:text-orange-600 transition-colors" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function GlassCard({ 
  children, 
  className = "",
  index = 0,
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  index?: number;
  onClick?: () => void;
}) {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const mobileDelay = isMobile ? Math.min(index * 0.05, 0.15) : index * 0.1;
  const animationY = isMobile ? 30 : 60;

  return (
    <motion.div
      ref={ref}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white
        border border-gray-100
        shadow-lg shadow-gray-200/50
        ${className}
      `}
      initial={{ opacity: 0, y: animationY }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: isMobile ? 0.4 : 0.6, 
        delay: mobileDelay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

function LazyCanvas({ 
  children, 
  className = "",
  threshold = 0.1,
}: { 
  children: ReactNode;
  className?: string;
  threshold?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin: '100px' }
    );
    
    observer.observe(container);
    return () => observer.disconnect();
  }, [threshold]);
  
  return (
    <div ref={containerRef} className={className}>
      {isVisible && children}
    </div>
  );
}

function RevealText({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: isMobile ? 20 : 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: isMobile ? 0.4 : 0.6, 
        delay: isMobile ? delay * 0.5 : delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
}

const contrailGeometry1 = new THREE.ConeGeometry(0.5, 12, 8, 1, true);
const contrailGeometry2 = new THREE.ConeGeometry(0.24, 10, 8, 1, true);
const contrailGeometry3 = new THREE.ConeGeometry(0.12, 8, 8, 1, true);

const smallContrailGeometry1 = new THREE.ConeGeometry(0.4, 10, 8, 1, true);
const smallContrailGeometry2 = new THREE.ConeGeometry(0.2, 8, 8, 1, true);
const smallContrailGeometry3 = new THREE.ConeGeometry(0.1, 6, 8, 1, true);

const sharedBuildingGeometry = new THREE.BoxGeometry(1, 1, 1);

const buildingMaterialBase = new THREE.MeshStandardMaterial({ color: "#f3f4f6" });
const buildingMaterialActive1 = new THREE.MeshStandardMaterial({ color: "#f97316", emissive: "#f97316", emissiveIntensity: 0.3 });
const buildingMaterialActive2 = new THREE.MeshStandardMaterial({ color: "#fb923c", emissive: "#fb923c", emissiveIntensity: 0.3 });
const buildingMaterialActive3 = new THREE.MeshStandardMaterial({ color: "#fdba74", emissive: "#fdba74", emissiveIntensity: 0.3 });
const activeMaterials = [buildingMaterialActive1, buildingMaterialActive2, buildingMaterialActive3];

const indicatorRingGeometry = new THREE.RingGeometry(0.4, 0.6, 16);

const globalStartTime = Date.now();
const getGlobalTime = () => (Date.now() - globalStartTime) / 1000;

const baseColor = new THREE.Color("#f3f4f6");
const activeColors = [
  new THREE.Color("#f97316"),
  new THREE.Color("#fb923c"),
  new THREE.Color("#fdba74"),
];

function FadingBuilding({
  position,
  size,
  activeMaterialIndex,
  isActive,
}: {
  position: [number, number, number];
  size: [number, number, number];
  activeMaterialIndex: number;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const fadeRef = useRef(0); // 0 = base color, 1 = active color
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor.clone(),
      emissive: new THREE.Color("#000000"),
      emissiveIntensity: 0,
    });
    materialRef.current = mat;
    return mat;
  }, []);
  
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);
  
  useFrame(() => {
    if (!materialRef.current) return;
    
    const targetFade = isActive ? 1 : 0;
    const fadeSpeed = 3;
    const delta = 1 / 60;
    
    fadeRef.current += (targetFade - fadeRef.current) * fadeSpeed * delta;
    
    fadeRef.current = Math.max(0, Math.min(1, fadeRef.current));
    
    const activeColor = activeColors[activeMaterialIndex];
    materialRef.current.color.copy(baseColor).lerp(activeColor, fadeRef.current);
    
    materialRef.current.emissive.copy(new THREE.Color("#000000")).lerp(activeColor, fadeRef.current);
    materialRef.current.emissiveIntensity = fadeRef.current * 0.3;
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[position[0], size[1] / 2, position[2]]}
      scale={[size[0], size[1], size[2]]}
      geometry={sharedBuildingGeometry}
      material={material}
    />
  );
}

function SoundIndicator({ 
  position, 
  buildingHeight, 
  buildingWidth,
  materialIndex,
  isActive,
}: { 
  position: [number, number, number]; 
  buildingHeight: number;
  buildingWidth: number;
  materialIndex: number;
  isActive: boolean;
}) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const fadeRef = useRef(0);
  
  const ringMaterials = useMemo(() => {
    const color = activeColors[materialIndex];
    return [
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide }),
    ];
  }, [materialIndex]);
  
  useEffect(() => {
    return () => {
      ringMaterials.forEach(mat => mat.dispose());
    };
  }, [ringMaterials]);
  
  useFrame(() => {
    const t = getGlobalTime();
    
    const targetFade = isActive ? 1 : 0;
    const fadeSpeed = 3;
    const delta = 1 / 60;
    fadeRef.current += (targetFade - fadeRef.current) * fadeSpeed * delta;
    fadeRef.current = Math.max(0, Math.min(1, fadeRef.current));
    
    const fadeAmount = fadeRef.current;
    
    const rings = [ring1Ref, ring2Ref, ring3Ref];
    const phaseOffsets = [0, 2.1, 4.2];
    const baseScales = [1.0, 1.3, 1.6];
    const baseOpacities = [0.5, 0.35, 0.2];
    
    rings.forEach((ringRef, i) => {
      if (!ringRef.current) return;
      
      const pulse = Math.sin(t * 3 + phaseOffsets[i]) * 0.5 + 0.5;
      const scale = baseScales[i] + pulse * 0.4;
      ringRef.current.scale.set(scale * buildingWidth * 2, scale * buildingWidth * 2, 1);
      ringMaterials[i].opacity = baseOpacities[i] * (0.5 + pulse * 0.5) * fadeAmount;
    });
  });
  
  return (
    <group position={[position[0], buildingHeight + 0.05, position[2]]}>
      <mesh 
        ref={ring1Ref}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={indicatorRingGeometry}
        material={ringMaterials[0]}
      />
      <mesh 
        ref={ring2Ref}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={indicatorRingGeometry}
        material={ringMaterials[1]}
      />
      <mesh 
        ref={ring3Ref}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={indicatorRingGeometry}
        material={ringMaterials[2]}
      />
    </group>
  );
}

function FloatingPlane() {
  const { scene } = useGLTF("/models/plane_balance.glb");
  const meshRef = useRef<THREE.Group>(null);
  
  const { clonedScene, material } = useMemo(() => {
    const cloned = scene.clone();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.4,
      envMapIntensity: 0.5,
    });
    
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = mat;
      }
    });
    
    return { clonedScene: cloned, material: mat };
  }, [scene]);
  
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const baseRotationY = Math.PI * 0.25;
  const baseRotationX = Math.PI * 0.11;

  useFrame(() => {
    if (!meshRef.current) return;
    const t = getGlobalTime();
    
    meshRef.current.position.y = -0.2 + Math.sin(t * 0.5) * 0.08;
    meshRef.current.position.x = Math.sin(t * 0.3) * 0.05;
    
    meshRef.current.rotation.x = baseRotationX + Math.sin(t * 0.6) * 0.03;
    meshRef.current.rotation.y = baseRotationY + Math.sin(t * 0.2) * 0.05;
    meshRef.current.rotation.z = Math.sin(t * 0.4) * 0.04;
  });

  return (
    <group ref={meshRef} scale={[0.35, 0.35, 0.35]}>
      <primitive object={clonedScene} />
    </group>
  );
}

function FloatingPlaneCanvas() {
  const isMobile = useIsMobile();
  
  // Skip 3D rendering on mobile for performance
  if (isMobile) {
    return null;
  }
  
  return (
    <LazyCanvas className="absolute top-0 left-0 right-0 h-[60%] pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fff5e6" />
        <directionalLight position={[-4, 4, 3]} intensity={0.8} color="#e6f0ff" />
        <directionalLight position={[0, 2, -5]} intensity={0.6} color="#ffffff" />
        <hemisphereLight args={['#b3d9ff', '#ffe6cc', 0.4]} />
        <Suspense fallback={null}>
          <FloatingPlane />
        </Suspense>
      </Canvas>
    </LazyCanvas>
  );
}

function AboutSectionContent() {
  const t = useTranslations("LandingPage");
  const isMobile = useIsMobile();
  const features = t.raw("about.features") as Feature[];

  return (
    <ScrollableContent className="relative w-full h-full overflow-auto bg-white">
      <FloatingPlaneCanvas />
      
      <div className="absolute top-0 left-0 right-0 h-[60%] bg-white/40 pointer-events-none" />
      
      {/* Reduced blur radius on mobile for performance */}
      <div className={`absolute top-20 left-10 w-72 h-72 bg-orange-100 rounded-full opacity-60 ${isMobile ? 'blur-[60px]' : 'blur-[100px]'}`} />
      <div className={`absolute bottom-20 right-10 w-96 h-96 bg-orange-200 rounded-full opacity-40 ${isMobile ? 'blur-[80px]' : 'blur-[120px]'}`} />

      <div className="relative flex flex-col items-center justify-end min-h-full px-6 py-24">
        <div className="text-center mb-16">
          <RevealText delay={0}>
            <span className="text-orange-500 text-sm font-semibold tracking-[0.3em] uppercase">
              {t("about.sectionLabel")}
            </span>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mt-4 mb-6">
              {t("about.titlePrefix")}{" "}
              <span className="text-orange-500">{t("about.titleHighlight")}</span>
            </h2>
          </RevealText>
          <RevealText delay={0.2}>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              {t("about.description")}
            </p>
          </RevealText>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
          {features.map((feature, index) => {
            const IconComponent = FEATURE_ICONS[index];
            return (
              <GlassCard key={feature.title} index={index} className="p-6 group hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <IconComponent className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </ScrollableContent>
  );
}

function HoveringPaperPlane() {
  const { scene } = useGLTF("/models/plane_balance.glb");
  const groupRef = useRef<THREE.Group>(null);
  
  const { clonedScene, material, contrailMaterials } = useMemo(() => {
    const cloned = scene.clone();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Orange-500
      metalness: 0.1,
      roughness: 0.3,
    });
    
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = mat;
      }
    });
    
    const cMats = [
      new THREE.MeshBasicMaterial({ color: "#f97316", transparent: true, opacity: 0.25, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: "#f97316", transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: "#f97316", transparent: true, opacity: 0.05, side: THREE.DoubleSide }),
    ];
    
    return { clonedScene: cloned, material: mat, contrailMaterials: cMats };
  }, [scene]);
  
  useEffect(() => {
    return () => {
      material.dispose();
      contrailMaterials.forEach(m => m.dispose());
    };
  }, [material, contrailMaterials]);
  
  useFrame(() => {
    if (!groupRef.current) return;
    const t = getGlobalTime();
    
    groupRef.current.position.y = 1.0 + Math.sin(t * 1.5) * 0.05;
    groupRef.current.position.x = Math.sin(t * 0.8) * 0.03;
    
    groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.05;
    groupRef.current.rotation.x = 0.2 + Math.sin(t * 0.9) * 0.03;
  });
  
  return (
    <group ref={groupRef} position={[0, 1.0, 0]} rotation={[0.2, -Math.PI * 0.5, 0]}>
      <group scale={[0.125, 0.125, 0.125]}>
        <primitive object={clonedScene} />
        
        <group position={[10, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh geometry={contrailGeometry1} material={contrailMaterials[0]} />
          <mesh position={[0, 8, 0]} geometry={contrailGeometry2} material={contrailMaterials[1]} />
          <mesh position={[0, 16, 0]} geometry={contrailGeometry3} material={contrailMaterials[2]} />
        </group>
      </group>
    </group>
  );
}

function WingmanPlane({ color, side }: { color: number; side: 'left' | 'right' }) {
  const { scene } = useGLTF("/models/plane_balance.glb");
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const contrailMaterialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  
  const colorHex = color === 0x06b6d4 ? "#06b6d4" : "#eab308";
  const sideMultiplier = side === 'left' ? -1 : 1;
  
  const { clonedScene, contrailMaterials } = useMemo(() => {
    const cloned = scene.clone();
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.1,
      roughness: 0.3,
      transparent: true,
      opacity: 1,
    });
    
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = mat;
      }
    });
    
    materialRef.current = mat;
    
    const cMats = [
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.2, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.04, side: THREE.DoubleSide }),
    ];
    contrailMaterialsRef.current = cMats;
    
    return { clonedScene: cloned, contrailMaterials: cMats };
  }, [scene, color, colorHex]);
  
  useEffect(() => {
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      contrailMaterialsRef.current.forEach(m => m.dispose());
    };
  }, []);
  
  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t: number) => t * t * t;
  
  useFrame(() => {
    if (!groupRef.current) return;
    const t = getGlobalTime();
    
    const cycleTime = t % 18;
    
    let x: number, y: number, z: number;
    let rotY = -Math.PI * 0.5; // Base rotation (facing forward)
    let rotZ = 0;
    let rotX = 0.2;
    let opacity = 1;
    
    const formationX = sideMultiplier * 0.8;
    const formationY = 0.95;
    const formationZ = 1.2;
    
    if (cycleTime < 4) {
      const progress = easeOutCubic(cycleTime / 4);
      
      opacity = Math.min(1, cycleTime / 0.8);
      
      const startX = sideMultiplier * 2.5;
      const startY = 0.5;
      const startZ = 4;
      
      x = startX + (formationX - startX) * progress;
      y = startY + (formationY - startY) * progress + Math.sin(cycleTime * 1.5) * 0.02;
      z = startZ + (formationZ - startZ) * progress;
      
      const aimProgress = easeInOutCubic(Math.min(1, cycleTime / 2));
      const straightenProgress = easeInOutCubic(Math.max(0, (cycleTime - 2) / 2));
      rotY = -Math.PI * 0.5 + sideMultiplier * (0.25 * (1 - straightenProgress) * aimProgress);
      rotZ = sideMultiplier * (1 - progress) * 0.15;
      rotX = 0.2 + (1 - progress) * 0.08;
      
    } else if (cycleTime < 10) {
      const formationTime = cycleTime - 4;
      const hover1 = Math.sin(formationTime * 1.1 + sideMultiplier * 0.5) * 0.02;
      const hover2 = Math.sin(formationTime * 0.7) * 0.015;
      const hover3 = Math.sin(formationTime * 1.4 + sideMultiplier * 1.5) * 0.012;
      
      x = formationX + hover1;
      y = formationY + hover2;
      z = formationZ + hover3;
      
      rotY = -Math.PI * 0.5;
      rotZ = sideMultiplier * 0.02 + Math.sin(formationTime * 0.9) * 0.015;
      rotX = 0.2 + Math.sin(formationTime * 0.6) * 0.015;
      
      opacity = 1;
      
    } else if (cycleTime < 14) {
      const breakTime = cycleTime - 10;
      const progress = easeInCubic(breakTime / 4);
      
      opacity = 1 - easeInCubic(breakTime / 4);
      
      x = formationX + sideMultiplier * progress * 4;
      y = formationY + progress * progress * 1.2;
      z = formationZ - progress * 5;
      
      const turnProgress = easeInOutCubic(Math.min(1, breakTime / 2));
      rotY = -Math.PI * 0.5 - sideMultiplier * turnProgress * 0.5; // Turn away from center
      
      const bankProgress = breakTime < 2 ? easeOutCubic(breakTime / 2) : easeInCubic((breakTime - 2) / 2);
      rotZ = sideMultiplier * (breakTime < 2 ? bankProgress * 0.35 : (1 - bankProgress) * 0.35 + bankProgress * 0.1);
      rotX = 0.2 - progress * 0.12;
      
    } else {
      x = sideMultiplier * 5;
      y = 2.2;
      z = -5;
      rotY = -Math.PI * 0.5 - sideMultiplier * 0.5;
      rotZ = sideMultiplier * 0.1;
      rotX = 0.08;
      opacity = 0;
    }
    
    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.set(rotX, rotY, rotZ);
    
    if (materialRef.current) {
      materialRef.current.opacity = opacity;
    }
    
    const baseOpacities = [0.2, 0.1, 0.04];
    contrailMaterialsRef.current.forEach((mat, i) => {
      if (mat) {
        mat.opacity = baseOpacities[i] * opacity;
      }
    });
  });
  
  return (
    <group ref={groupRef} position={[sideMultiplier * 2.5, 0.5, 4]} rotation={[0.2, -Math.PI * 0.5, 0]}>
      <group scale={[0.1, 0.1, 0.1]}>
        <primitive object={clonedScene} />
        
        <group position={[10, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh geometry={smallContrailGeometry1} material={contrailMaterials[0]} />
          <mesh position={[0, 6, 0]} geometry={smallContrailGeometry2} material={contrailMaterials[1]} />
          <mesh position={[0, 12, 0]} geometry={smallContrailGeometry3} material={contrailMaterials[2]} />
        </group>
      </group>
    </group>
  );
}

function CityStreetScene() {
  const streetGroupRef = useRef<THREE.Group>(null);
  const [activeBuildings, setActiveBuildings] = useState<number[]>([]);
  const timeoutIdsRef = useRef<number[]>([]);
  const lastActivationTime = useRef(0);
  const recentlyActivated = useRef<Set<number>>(new Set());
  
  const streetLength = 18;
  
  const buildings = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const xPos = side * (0.8 + Math.random() * 4);
      const zPos = (i / 40) * streetLength - streetLength / 2;
      const height = 0.3 + Math.random() * 1.0;
      const width = 0.2 + Math.random() * 0.3;
      const depth = 0.2 + Math.random() * 0.3;
      const activeMaterialIndex = Math.floor(Math.random() * 3);
      return {
        position: [xPos, 0, zPos] as [number, number, number],
        size: [width, height, depth] as [number, number, number],
        activeMaterialIndex,
      };
    }), [streetLength]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const roadGeometry = useMemo(() => new THREE.PlaneGeometry(1.5, streetLength), [streetLength]);
  const roadMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f3f4f6" }), []);

  useEffect(() => {
    return () => {
      roadGeometry.dispose();
      roadMaterial.dispose();
    };
  }, [roadGeometry, roadMaterial]);

  useFrame(() => {
    if (!streetGroupRef.current) return;
    const t = getGlobalTime();
    const speed = 2;
    streetGroupRef.current.position.z = (t * speed) % streetLength;
    
    if (t - lastActivationTime.current > 0.5 && Math.random() < 0.15 && activeBuildings.length < 3) {
      lastActivationTime.current = t;
      
      let attempts = 0;
      let randomIdx = -1;
      while (attempts < 10) {
        const candidate = Math.floor(Math.random() * buildings.length);
        if (!activeBuildings.includes(candidate) && !recentlyActivated.current.has(candidate)) {
          randomIdx = candidate;
          break;
        }
        attempts++;
      }
      
      if (randomIdx !== -1) {
        recentlyActivated.current.add(randomIdx);
        
        setActiveBuildings(prev => [...prev, randomIdx]);
        
        const timeoutId = window.setTimeout(() => {
          setActiveBuildings(prev => prev.filter(i => i !== randomIdx));
        }, 1200);
        
        const cooldownId = window.setTimeout(() => {
          recentlyActivated.current.delete(randomIdx);
        }, 4200);
        
        timeoutIdsRef.current.push(timeoutId, cooldownId);
      }
    }
  });

  return (
    <group>
      <HoveringPaperPlane />
      
      <WingmanPlane color={0x06b6d4} side="left" />
      <WingmanPlane color={0xeab308} side="right" />
      
      <group ref={streetGroupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} geometry={roadGeometry} material={roadMaterial} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -streetLength]} geometry={roadGeometry} material={roadMaterial} />
        
        {[0, -streetLength].map((zOffset) => (
          <group key={zOffset} position={[0, 0, zOffset]}>
            {buildings.map((building, i) => {
              const isActive = activeBuildings.includes(i);
              
              return (
                <group key={i}>
                  <FadingBuilding
                    position={building.position}
                    size={building.size}
                    activeMaterialIndex={building.activeMaterialIndex}
                    isActive={isActive}
                  />
                  <SoundIndicator
                    position={building.position}
                    buildingHeight={building.size[1]}
                    buildingWidth={building.size[0]}
                    materialIndex={building.activeMaterialIndex}
                    isActive={isActive}
                  />
                </group>
              );
            })}
          </group>
        ))}
      </group>
    </group>
  );
}

function CitySceneCanvas() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return null;
  }
  
  return (
    <LazyCanvas className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none">
      <Canvas
        camera={{ position: [0, 4, 6], fov: 50, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#f9fafb', 3, 12]} />
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <hemisphereLight args={['#ffffff', '#f3f4f6', 0.6]} />
        <Suspense fallback={null}>
          <CityStreetScene />
        </Suspense>
      </Canvas>
    </LazyCanvas>
  );
}

function TechSectionContent() {
  const t = useTranslations("LandingPage");
  const technologies = t.raw("tech.technologies") as Technology[];
  const stats = t.raw("tech.stats") as Stat[];

  return (
    <div className="relative w-full h-full overflow-hidden bg-linear-to-br from-gray-50 to-orange-50/30">
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(249,115,22,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
      <CitySceneCanvas />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        <div className="text-center mb-8">
          <RevealText delay={0}>
            <span className="text-orange-500 text-sm font-semibold tracking-[0.3em] uppercase">
              {t("tech.sectionLabel")}
            </span>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mt-4">
              {t("tech.titlePrefix")} <span className="text-orange-500">{t("tech.titleHighlight")}</span>
            </h2>
          </RevealText>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-4xl">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              className="px-5 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all cursor-default"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <span className="text-gray-800 font-medium text-sm">{tech.name}</span>
              <span className="text-gray-400 text-xs ml-2">{tech.category}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberModalContent({ member }: { member: TeamMember }) {
  return (
    <>
      <div className="relative h-32 bg-linear-to-br from-orange-400 via-orange-500 to-orange-600 -mx-6 -mt-6 rounded-t-lg">
        <div className="absolute top-4 right-4 w-20 h-20 border border-white/20 rounded-full" />
        <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/10 rounded-full blur-lg" />
      </div>
      
      <div className="relative flex justify-center -mt-16">
        <div className="relative">
          <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-30 scale-150" />
          
          <div className="relative w-28 h-28 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl ring-4 ring-white overflow-hidden">
            {member.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={member.profileImage} 
                alt={member.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Users className={`w-14 h-14 text-white ${member.profileImage ? 'hidden' : ''}`} />
          </div>
        </div>
      </div>
      
      <div className="pt-6 pb-2 text-center">
        <DialogTitle className="text-2xl font-bold text-gray-900">
          {member.name}
        </DialogTitle>
        
        <DialogDescription className="text-orange-500 font-semibold mt-1 text-base">
          {member.role}
        </DialogDescription>
        
        <p className="text-gray-600 mt-4 leading-relaxed">{member.description}</p>
        
        {(member.socials?.github || member.socials?.linkedin || member.socials?.website) && (
          <div className="flex justify-center gap-4 mt-6">
            {member.socials.github && (
              <a 
                href={member.socials.github} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group"
              >
                <Github className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </a>
            )}
            {member.socials.linkedin && (
              <a 
                href={member.socials.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group"
              >
                <Linkedin className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </a>
            )}
            {member.socials.website && (
              <a 
                href={member.socials.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group"
              >
                <Globe className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function TeamSectionContent() {
  const t = useTranslations("LandingPage");
  const tAbout = useTranslations("AboutPage");
  const isMobile = useIsMobile();
  const members = tAbout.raw("memberList") as TeamMember[];
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <ScrollableContent className="relative w-full h-full overflow-auto bg-white">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100 rounded-full opacity-50 ${isMobile ? 'blur-[80px]' : 'blur-[150px]'}`} />

      <div className="relative flex flex-col items-center justify-center min-h-full px-6 py-16">
        <div className="text-center mb-12">
          <RevealText delay={0}>
            <span className="text-orange-500 text-sm font-semibold tracking-[0.3em] uppercase">
              {t("team.sectionLabel")}
            </span>
          </RevealText>
          <RevealText delay={0.1}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mt-4">
              {t("team.titlePrefix")} <span className="text-orange-500">{t("team.titleHighlight")}</span>
            </h2>
          </RevealText>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl w-full">
          {members.map((member, index) => (
            <GlassCard 
              key={member.name} 
              index={index} 
              className="aspect-square group relative overflow-hidden hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedMember(member)}
            >
              <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 scale-150" />
                  
                  <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-orange-200/50 transition-all duration-300 overflow-hidden">
                    {member.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={member.profileImage} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Users className={`w-8 h-8 text-white ${member.profileImage ? 'hidden' : ''}`} />
                  </div>
                </div>
                
                <h3 className="text-gray-900 font-bold text-lg leading-tight">{member.name}</h3>
                
                <p className="text-orange-500 text-sm font-medium mt-1">{member.role}</p>
                
                {(member.socials?.github || member.socials?.linkedin || member.socials?.website) && (
                  <div className="flex gap-3 mt-4">
                    {member.socials.github && (
                      <a 
                        href={member.socials.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group/social"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github className="w-4 h-4 text-gray-500 group-hover/social:text-white transition-colors" />
                      </a>
                    )}
                    {member.socials.linkedin && (
                      <a 
                        href={member.socials.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group/social"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Linkedin className="w-4 h-4 text-gray-500 group-hover/social:text-white transition-colors" />
                      </a>
                    )}
                    {member.socials.website && (
                      <a 
                        href={member.socials.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-500 transition-all duration-200 group/social"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-4 h-4 text-gray-500 group-hover/social:text-white transition-colors" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl overflow-hidden">
          {selectedMember && <MemberModalContent member={selectedMember} />}
        </DialogContent>
      </Dialog>
    </ScrollableContent>
  );
}

function CTASectionContent({ onStartClick }: { onStartClick?: () => void }) {
  const t = useTranslations("LandingPage");

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-linear-to-br from-orange-500 to-orange-600">
      <div className="absolute top-10 left-10 w-40 h-40 border border-white/20 rounded-full" />
      <div className="absolute bottom-10 right-10 w-60 h-60 border border-white/10 rounded-full" />
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-xl" />

      <div className="relative max-w-3xl mx-auto text-center px-6">
        <RevealText delay={0}>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            {t("cta.title")}
          </h2>
        </RevealText>
        <RevealText delay={0.1}>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-lg mx-auto">
            {t("cta.description")}
          </p>
        </RevealText>
        
        <motion.button
          className="relative flex items-center gap-2.5 px-6 py-3 bg-white text-orange-500 font-semibold rounded-xl shadow-lg shadow-black/10 overflow-hidden group cursor-pointer mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          onClick={onStartClick}
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-orange-100 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          
          <div className="absolute inset-0 bg-linear-to-t from-orange-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Plane className="relative z-10 w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
          <span className="relative z-10">{t("startFlying")}</span>
        </motion.button>
      </div>
    </div>
  );
}

interface LandingPageProps {
  playerName: string;
  setPlayerName: (playerName: string) => void;
  planeColor: string;
  setPlaneColor: (planeColor: string) => void;
  generativeEnabled: boolean;
  setGenerativeEnabled: (generativeEnabled: boolean) => void;
  spatialAudioEnabled: boolean;
  setSpatialAudioEnabled: (spatialAudioEnabled: boolean) => void;
  handleStart: () => void;
}

function MobileNavMenu() {
  const t = useTranslations("LandingPage");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("");
  
  const navItems = [
    { label: t("navbar.about"), href: "/about" },
    { label: t("navbar.changelog"), href: "/patch" },
    { label: t("navbar.help"), href: "/chat" },
  ];

  const handleNavClick = (href: string, label: string) => {
    setSelected(label);
    setIsOpen(false);
    setTimeout(() => {
      router.push(href);
    }, 150);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100"
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5 text-gray-700" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-18 right-4 z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-2 flex flex-col gap-1 min-w-[140px]">
              {navItems.map((item) => (
                <div
                  key={item.href}
                  onClick={() => handleNavClick(item.href, item.label)}
                  className="px-1 py-1"
                >
                  <ChipTab
                    text={item.label}
                    selected={selected === item.label}
                    setSelected={() => {}}
                  />
                </div>
              ))}
              
              <div className="pt-2 mt-1 border-t border-gray-100 px-2">
                <LanguageSwitcher variant="dark" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function MobileSection({ 
  children, 
  className = "",
  allowScroll = false
}: { 
  children: React.ReactNode; 
  className?: string;
  allowScroll?: boolean;
}) {
  return (
    <section 
      className={`w-full snap-start snap-always ${allowScroll ? 'min-h-screen' : 'h-screen'} ${className}`}
      style={allowScroll ? undefined : { height: '100svh' }}
    >
      {children}
    </section>
  );
}

function MobileLandingPage({
  playerName,
  setPlayerName,
  planeColor,
  setPlaneColor,
  generativeEnabled,
  setGenerativeEnabled,
  spatialAudioEnabled,
  setSpatialAudioEnabled,
  handleStart,
}: LandingPageProps) {
  const t = useTranslations("LandingPage");
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  
  const playerFormProps = {
    playerName,
    setPlayerName,
    planeColor,
    setPlaneColor,
    generativeEnabled,
    setGenerativeEnabled,
    spatialAudioEnabled,
    setSpatialAudioEnabled,
    handleStart,
    isOpen: isPreflightOpen,
    setIsOpen: setIsPreflightOpen,
  };

  return (
    <div 
      className="w-full min-h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-white"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
    >
      <MobileSection className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-b from-white via-white to-orange-50" />
          <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-linear-to-t from-orange-100/60 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-linear-to-r from-transparent to-orange-400" />
            <span className="text-orange-400 text-xs tracking-[0.3em] font-medium uppercase">
              {t("hero.japaneseLabel")}
            </span>
            <div className="w-8 h-px bg-linear-to-l from-transparent to-orange-400" />
          </div>
          
          <h1 className="text-[13vw] font-black tracking-tight leading-[0.95] bg-linear-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent text-center mb-6">
            {t("hero.title")}
          </h1>
          
          <p className="text-gray-500 text-base mt-4 max-w-xs text-center font-light leading-relaxed">
            {t("hero.subtitle")}
          </p>
          
          <div className="mt-10">
            <PlayerForm {...playerFormProps} />
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2 text-orange-500 animate-bounce">
              <span className="text-xs tracking-[0.15em] uppercase font-medium">
                {t("hero.scroll")}
              </span>
              <ArrowDown className="w-5 h-5" />
            </div>
          </div>
        </div>
      </MobileSection>

      <MobileSection className="relative bg-gray-50 overflow-hidden">
        <MobileAboutContent />
      </MobileSection>

      <MobileSection className="relative bg-white overflow-hidden">
        <MobileTechContent />
      </MobileSection>

      <MobileSection className="relative bg-gray-50 overflow-hidden" allowScroll>
        <MobileTeamContent />
      </MobileSection>

      <MobileSection className="relative bg-linear-to-br from-orange-500 to-orange-600 overflow-hidden">
        <div className="flex items-center justify-center h-full px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              {t("cta.title")}
            </h2>
            <p className="text-white/80 text-base mb-8 max-w-xs mx-auto leading-relaxed">
              {t("cta.description")}
            </p>
            <button
              onClick={() => setIsPreflightOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-orange-500 font-semibold rounded-2xl shadow-lg shadow-orange-700/20 active:scale-95 transition-transform"
            >
              <Plane className="w-5 h-5" />
              <span>{t("startFlying")}</span>
            </button>
          </div>
        </div>
      </MobileSection>

      <div className="bg-gray-900 py-8 px-6">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-4">
            {t("footer.copyright")}
          </div>
          <div className="flex items-center justify-center gap-6">
            <a href="/about" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
              {t("footer.about")}
            </a>
            <a href="/patch" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
              {t("footer.changelog")}
            </a>
            <a href="/chat" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
              {t("footer.help")}
            </a>
          </div>
        </div>
      </div>
      
      <MobileNavMenu />
    </div>
  );
}

function MobileAboutContent() {
  const t = useTranslations("LandingPage");
  const features = t.raw("about.features") as Feature[];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <div className="text-center mb-8">
        <span className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase">
          {t("about.sectionLabel")}
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mt-3 mb-3 leading-tight">
          {t("about.titlePrefix")}{" "}
          <span className="text-orange-500">{t("about.titleHighlight")}</span>
        </h2>
        <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
          {t("about.description")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {features.map((feature, index) => {
          const IconComponent = FEATURE_ICONS[index];
          return (
            <div 
              key={feature.title} 
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                <IconComponent className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-gray-900 font-semibold text-sm mb-1.5">{feature.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileTechContent() {
  const t = useTranslations("LandingPage");
  const technologies = t.raw("tech.technologies") as Technology[];
  const stats = t.raw("tech.stats") as Stat[];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <div className="text-center mb-8">
        <span className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase">
          {t("tech.sectionLabel")}
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mt-3 leading-tight">
          {t("tech.titlePrefix")} <span className="text-orange-500">{t("tech.titleHighlight")}</span>
        </h2>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-xs">
        {technologies.slice(0, 8).map((tech) => (
          <div
            key={tech.name}
            className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200"
          >
            <span className="text-gray-700 font-medium text-xs">{tech.name}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-2xl">
            <div className="text-2xl font-bold text-orange-500 mb-1">
              {stat.value}
            </div>
            <div className="text-gray-500 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileTeamContent() {
  const t = useTranslations("LandingPage");
  const tAbout = useTranslations("AboutPage");
  const members = tAbout.raw("memberList") as TeamMember[];
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <div className="flex flex-col items-center justify-start h-full px-6 py-12 overflow-y-auto">
      <div className="text-center mb-8">
        <span className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase">
          {t("team.sectionLabel")}
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mt-3 leading-tight">
          {t("team.titlePrefix")} <span className="text-orange-500">{t("team.titleHighlight")}</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm pb-4">
        {members.map((member) => (
          <div 
            key={member.name}
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center active:scale-95 transition-transform cursor-pointer"
            onClick={() => setSelectedMember(member)}
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-3 overflow-hidden shadow-md shadow-orange-200">
              {member.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={member.profileImage} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-7 h-7 text-white" />
              )}
            </div>
            <h3 className="text-gray-900 font-semibold text-sm leading-tight">{member.name}</h3>
            <p className="text-orange-500 text-xs mt-1">{member.role}</p>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl overflow-hidden">
          {selectedMember && <MemberModalContent member={selectedMember} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LandingPage({
  playerName,
  setPlayerName,
  planeColor,
  setPlaneColor,
  generativeEnabled,
  setGenerativeEnabled,
  spatialAudioEnabled,
  setSpatialAudioEnabled,
  handleStart,
}: LandingPageProps) {
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  
  const [aboutProgress, setAboutProgress] = useState<MotionValue<number> | null>(null);
  const [techProgress, setTechProgress] = useState<MotionValue<number> | null>(null);
  const [teamProgress, setTeamProgress] = useState<MotionValue<number> | null>(null);
  const [ctaProgress, setCtaProgress] = useState<MotionValue<number> | null>(null);
  
  const [isOnColoredSection, setIsOnColoredSection] = useState(false);
  
  useEffect(() => {
    if (!ctaProgress) return;
    
    const unsubscribe = ctaProgress.on("change", (value: number) => {
      setIsOnColoredSection(value > 0.5);
    });
    
    return () => unsubscribe();
  }, [ctaProgress]);
  
  const playerFormProps = {
    playerName,
    setPlayerName,
    planeColor,
    setPlaneColor,
    generativeEnabled,
    setGenerativeEnabled,
    spatialAudioEnabled,
    setSpatialAudioEnabled,
    handleStart,
    isOpen: isPreflightOpen,
    setIsOpen: setIsPreflightOpen,
  };
  
  return (
    <>
      <div className="md:hidden">
        <MobileLandingPage
          playerName={playerName}
          setPlayerName={setPlayerName}
          planeColor={planeColor}
          setPlaneColor={setPlaneColor}
          generativeEnabled={generativeEnabled}
          setGenerativeEnabled={setGenerativeEnabled}
          spatialAudioEnabled={spatialAudioEnabled}
          setSpatialAudioEnabled={setSpatialAudioEnabled}
          handleStart={handleStart}
        />
      </div>
      
      <div className="hidden md:block w-full bg-gray-100" style={{ touchAction: 'pan-y' }}>
        <FloatingNavbar onStartClick={() => setIsPreflightOpen(true)} delay={0.3} />
        
        <div className="hidden md:block md:fixed md:top-4 md:right-4 md:z-100">
          <LanguageSwitcher variant={isOnColoredSection ? "light" : "dark"} />
        </div>

        <div className="hidden md:fixed md:inset-0 md:z-5 md:block">
          <HeroContent nextScrollYProgress={aboutProgress ?? undefined} />
        </div>

        <HeroInteractiveLayer playerFormProps={playerFormProps} />

        <div className="relative z-6">
          <div className="h-screen" />

          <ScrollTrigger id="about" onProgressReady={setAboutProgress}>
            {(progress) => (
              <FixedCard 
                index={1} 
                scrollYProgress={progress}
                nextScrollYProgress={techProgress ?? undefined}
              >
                <AboutSectionContent />
              </FixedCard>
            )}
          </ScrollTrigger>

          <ScrollTrigger onProgressReady={setTechProgress}>
            {(progress) => (
              <FixedCard 
                index={2} 
                scrollYProgress={progress}
                nextScrollYProgress={teamProgress ?? undefined}
              >
                <TechSectionContent />
              </FixedCard>
            )}
          </ScrollTrigger>

          <ScrollTrigger onProgressReady={setTeamProgress}>
            {(progress) => (
              <FixedCard 
                index={3} 
                scrollYProgress={progress}
                nextScrollYProgress={ctaProgress ?? undefined}
              >
                <TeamSectionContent />
              </FixedCard>
            )}
          </ScrollTrigger>

          <ScrollTrigger onProgressReady={setCtaProgress}>
            {(progress) => (
              <FixedCard index={4} scrollYProgress={progress}>
                <CTASectionContent onStartClick={() => setIsPreflightOpen(true)} />
              </FixedCard>
            )}
          </ScrollTrigger>

          <div className="relative z-60 bg-gray-900">
            <SiteFooter />
          </div>
        </div>
      </div>
    </>
  );
}

// Preload the plane model
useGLTF.preload("/models/plane_balance.glb");
