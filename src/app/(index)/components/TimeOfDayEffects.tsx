"use client";

import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";
import { useMemo } from "react";
import {
  EffectComposer,
  Sepia,
  HueSaturation,
  BrightnessContrast,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/** TimeOfDayEffects
 *
 * Post-processing effects that respond to time of day
 * Applies color grading to create sunrise/sunset atmosphere
 */
export default function TimeOfDayEffects() {
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
