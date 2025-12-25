"use client";

import React from "react";
import { useVolume } from "@/app/(index)/page"; // Import from the main page
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useTranslations } from "next-intl";
export default function AudioVolumeControls() {
  const t = useTranslations("AudioVolumeControls");
  const {
    spatialVolume,
    lyriaVolume,
    ambientVolume,
    flyingVolume,
    setSpatialVolume,
    setLyriaVolume,
    setAmbientVolume,
    setFlyingVolume,
  } = useVolume();

  const handleSpatialVolumeChange = (value: number[]) => {
    setSpatialVolume(value[0]);
  };

  const handleLyriaVolumeChange = (value: number[]) => {
    setLyriaVolume(value[0]);
  };

  const handleAmbientVolumeChange = (value: number[]) => {
    setAmbientVolume(value[0]);
  };

  const handleFlyingVolumeChange = (value: number[]) => {
    setFlyingVolume(value[0]);
  };

  return (
    <div className="space-y-2 p-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="spatial-volume"
            className="text-xs text-primary-foreground/50 font-light tracking-wide"
          >
            {t("spatialAudio")}
          </Label>
          <span className="text-xs text-primary-foreground/50 font-light tracking-wide w-10 text-right">
            {Math.round(spatialVolume * 100)}%
          </span>
        </div>
        <Slider
          id="spatial-volume"
          min={0}
          max={1}
          step={0.01}
          value={[spatialVolume]}
          onValueChange={handleSpatialVolumeChange}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="ambient-volume"
            className="text-xs text-primary-foreground/50 font-light tracking-wide"
          >
            {t("ambientAudio")}
          </Label>
          <span className="text-xs text-primary-foreground/50 font-light tracking-wide w-10 text-right">
            {Math.round(ambientVolume * 100)}%
          </span>
        </div>
        <Slider
          id="ambient-volume"
          min={0}
          max={1}
          step={0.01}
          value={[ambientVolume]}
          onValueChange={handleAmbientVolumeChange}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="lyria-volume"
            className="text-xs text-primary-foreground/50 font-light tracking-wide"
          >
            {t("lyriaAudio")}
          </Label>
          <span className="text-xs text-primary-foreground/50 font-light tracking-wide w-10 text-right">
            {Math.round(lyriaVolume * 100)}%
          </span>
        </div>
        <Slider
          id="lyria-volume"
          min={0}
          max={1}
          step={0.01}
          value={[lyriaVolume]}
          onValueChange={handleLyriaVolumeChange}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="flying-volume"
            className="text-xs text-primary-foreground/50 font-light tracking-wide"
          >
            {t("flyingAudio")}
          </Label>
          <span className="text-xs text-primary-foreground/50 font-light tracking-wide w-10 text-right">
            {Math.round(flyingVolume * 100)}%
          </span>
        </div>
        <Slider
          id="flying-volume"
          min={0}
          max={1}
          step={0.01}
          value={[flyingVolume]}
          onValueChange={handleFlyingVolumeChange}
          className="w-full"
        />
      </div>
    </div>
  );
}
