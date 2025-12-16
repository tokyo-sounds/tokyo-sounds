"use client";

import React from "react";
import { useSpatialVolume, useLyriaVolume, useAmbientVolume } from "@/hooks/useAudio";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function AudioVolumeControls() {
  const [spatialVolume, setSpatialVolume] = useSpatialVolume();
  const [lyriaVolume, setLyriaVolume] = useLyriaVolume();
  const [ambientVolume, setAmbientVolume] = useAmbientVolume();

  const handleSpatialVolumeChange = (value: number[]) => {
    setSpatialVolume(value[0]);
  };

  const handleLyriaVolumeChange = (value: number[]) => {
    setLyriaVolume(value[0]);
  };

  const handleAmbientVolumeChange = (value: number[]) => {
    setAmbientVolume(value[0]);
  };

  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="spatial-volume" className="text-xs text-muted-foreground">
            空間音響ボリューム
          </Label>
          <span className="text-xs text-muted-foreground w-10 text-right">
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="lyria-volume" className="text-xs text-muted-foreground">
            Lyria音楽ボリューム
          </Label>
          <span className="text-xs text-muted-foreground w-10 text-right">
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="ambient-volume" className="text-xs text-muted-foreground">
            環境音ボリューム
          </Label>
          <span className="text-xs text-muted-foreground w-10 text-right">
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
    </div>
  );
}