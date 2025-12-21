"use client";

import { District } from "@/config/tokyo-config";
import { useState, useEffect, useRef, useCallback } from "react";

interface DistrictIndicatorProps {
  district: District | null;
  onVisibilityChange?: (isVisible: boolean) => void;
}

// Duration constants (in ms)
const FADE_DURATION = 500;
const DISPLAY_DURATION = 2700;
const DEBOUNCE_DELAY = 300;
const COOLDOWN_DURATION = 5000; // Cooldown after display ends before showing another

type Phase = "idle" | "fade-in" | "visible" | "fade-out" | "cooldown";

/** DistrictIndicator
 *
 * Cinematic district indicator overlay with fullscreen darkened background.
 * Shows area name centered with fade in/out transitions.
 * Debounces rapid area changes to prevent flashing.
 */
export default function DistrictIndicator({
  district,
  onVisibilityChange,
}: DistrictIndicatorProps) {
  const [displayedDistrict, setDisplayedDistrict] = useState<District | null>(
    null
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [opacity, setOpacity] = useState(0);

  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const displayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDistrictIdRef = useRef<string | null>(null);

  const clearAllTimers = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (displayTimerRef.current) {
      clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
    }
    if (fadeOutTimerRef.current) {
      clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const newDistrictId = district?.id ?? null;

    if (newDistrictId === lastDistrictIdRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!district) {
      lastDistrictIdRef.current = null;
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentPhase = phaseRef.current;

      if (currentPhase === "idle") {
        lastDistrictIdRef.current = district.id;
        setDisplayedDistrict(district);
        setPhase("fade-in");
        onVisibilityChange?.(true);
      } else if (currentPhase === "fade-out") {
        // 新しい district が来た場合、fade-out を中断して新しい表示を開始
        lastDistrictIdRef.current = district.id;
        clearAllTimers();
        setDisplayedDistrict(district);
        setPhase("fade-in");
        onVisibilityChange?.(true);
      } else if (currentPhase === "cooldown") {
        // cooldown 中でも新しい district が来たら表示を開始
        lastDistrictIdRef.current = district.id;
        clearAllTimers();
        setDisplayedDistrict(district);
        setPhase("fade-in");
        onVisibilityChange?.(true);
      } else if (currentPhase === "visible" || currentPhase === "fade-in") {
        // 同じ district の場合は何もしない（既に表示中）
        if (displayedDistrict?.id === district.id) {
          lastDistrictIdRef.current = district.id;
          return;
        }
        // 異なる district の場合は更新して表示時間をリセット
        lastDistrictIdRef.current = district.id;
        setDisplayedDistrict(district);

        if (displayTimerRef.current) {
          clearTimeout(displayTimerRef.current);
        }
        displayTimerRef.current = setTimeout(() => {
          setPhase("fade-out");
        }, DISPLAY_DURATION);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [district, onVisibilityChange, displayedDistrict, clearAllTimers]);

  useEffect(() => {
    if (phase === "fade-in") {
      requestAnimationFrame(() => {
        setOpacity(1);
      });

      const timer = setTimeout(() => {
        setPhase("visible");
      }, FADE_DURATION);
      return () => clearTimeout(timer);
    }

    if (phase === "visible") {
      setOpacity(1);
      displayTimerRef.current = setTimeout(() => {
        setPhase("fade-out");
      }, DISPLAY_DURATION);
      return () => {
        if (displayTimerRef.current) {
          clearTimeout(displayTimerRef.current);
        }
      };
    }

    if (phase === "fade-out") {
      setOpacity(0);
      fadeOutTimerRef.current = setTimeout(() => {
        setPhase("cooldown");
        setDisplayedDistrict(null);
        onVisibilityChange?.(false);
      }, FADE_DURATION);
      return () => {
        if (fadeOutTimerRef.current) {
          clearTimeout(fadeOutTimerRef.current);
        }
      };
    }

    if (phase === "cooldown") {
      cooldownTimerRef.current = setTimeout(() => {
        setPhase("idle");
      }, COOLDOWN_DURATION);
      return () => {
        if (cooldownTimerRef.current) {
          clearTimeout(cooldownTimerRef.current);
        }
      };
    }

    if (phase === "idle") {
      setOpacity(0);
    }
  }, [phase, onVisibilityChange]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  if (phase === "idle" || phase === "cooldown" || !displayedDistrict) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none select-none"
      style={{
        opacity,
        transition: `opacity ${FADE_DURATION}ms ease-in-out`,
      }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 text-center space-y-4 px-8 max-w-5xl">
        <h2 className="text-lg md:text-xl text-white/70 font-sans font-light uppercase tracking-widest">
          {displayedDistrict.name}
        </h2>

        <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-bold font-noto text-white text-shadow-xl text-shadow-black/50 whitespace-nowrap">
          {displayedDistrict.nameJa}
        </h1>

        <p className="text-sm md:text-base lg:text-lg text-white/80 font-noto leading-relaxed max-w-lg mx-auto">
          {displayedDistrict.descriptionJa}
        </p>
      </div>
    </div>
  );
}
