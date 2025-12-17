/** LandingPage
 *
 * Landing page for Tokyo Sounds
 * @returns null
 */
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PASTEL_COLORS } from "../page";
import HomeHero from "@/components/layout/HomeHero";
import Nav from "@/components/layout/nav";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, SendHorizontal } from "lucide-react";

// Lazy load the 3D preview component
const ModelPreview = dynamic(
  () => import("../../../(index)/components/ModelPreview"),
  { ssr: false, loading: () => <div className="w-full h-48 bg-neutral-900/50 rounded-lg animate-pulse" /> }
);

interface LandingPageProps {
  playerName: string;
  setPlayerName: (playerName: string) => void;
  planeColor: string;
  setPlaneColor: (planeColor: string) => void;
  planeModelPath: string;
  setPlaneModelPath: (planeModelPath: string) => void;
  generativeEnabled: boolean;
  setGenerativeEnabled: (generativeEnabled: boolean) => void;
  spatialAudioEnabled: boolean;
  setSpatialAudioEnabled: (spatialAudioEnabled: boolean) => void;
  handleStart: () => void;
}

interface ModelInfo {
  name: string;
  path: string;
}

export default function LandingPage({
  playerName,
  setPlayerName,
  planeColor,
  setPlaneColor,
  planeModelPath,
  setPlaneModelPath,
  generativeEnabled,
  setGenerativeEnabled,
  spatialAudioEnabled,
  setSpatialAudioEnabled,
  handleStart,
}: LandingPageProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [cardOpen, setCardOpen] = useState(true);

  // Fetch available models when component mounts
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          // Set default model if not already set
          if (!planeModelPath && data.models[0]) {
            setPlaneModelPath(data.models[0].path);
          }
        }
      })
      .catch((err) => {
        console.error("[LandingPage] Failed to fetch models:", err);
      });
  }, [planeModelPath, setPlaneModelPath]);

  return (
    <div className="w-full h-full min-h-svh flex flex-col items-center justify-center bg-linear-to-tr from-orange-600 to-red-800 overflow-hidden">
      <Nav />
      <HomeHero>
        <Card className="w-full max-w-sm absolute top-1/2 left-1/2 -translate-x-1/2 bg-transparent backdrop-blur-xs border-border/50 shadow-xl text-background/70 tracking-wider animate-in fade-in-0 slide-in-from-bottom duration-500">
          <CardContent className="space-y-4 **:text-xs">
            <div className="space-y-2">
              <Label htmlFor="playerName">名前</Label>
              <Input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name (optional)"
                maxLength={20}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>機体の色</Label>
              <div className="flex justify-center items-center gap-3">
                {PASTEL_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setPlaneColor(color.hex)}
                    className={`size-8 rounded-full transition-all hover:scale-105 cursor-pointer ${
                      planeColor === color.hex
                        ? "ring-1 ring-white ring-offset-1 ring-offset-card scale-105"
                        : "hover:ring-1 hover:ring-white/50"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>機体モデル</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {models.map((model) => (
                      <button
                        key={model.path}
                        onClick={() => setPlaneModelPath(model.path)}
                        className={`px-3 py-2 text-sm rounded transition-all text-left ${
                          planeModelPath === model.path
                            ? "bg-primary/20 ring-1 ring-primary"
                            : "bg-neutral-800/50 hover:bg-neutral-700/50"
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {cardOpen && planeModelPath && (
                    <ModelPreview modelPath={planeModelPath} planeColor={planeColor} />
                  )}
                </div>
              </div>
            </div>
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between gap-2 w-full cursor-pointer">
                <span>音声設定</span>
                <ChevronDown className="size-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                <Label
                  htmlFor="lyria"
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="lyria"
                    aria-label="Enable Lyria Generative Audio"
                    checked={generativeEnabled}
                    onChange={(e) => setGenerativeEnabled(e.target.checked)}
                    className="size-4 focus:ring-offset-1"
                  />
                  <span>AI生成音楽を有効にする</span>
                </Label>
                <Label
                  htmlFor="spatial"
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="spatial"
                    aria-label="Enable Spatial Audio"
                    checked={spatialAudioEnabled}
                    onChange={(e) => setSpatialAudioEnabled(e.target.checked)}
                    className="size-4 focus:ring-offset-1"
                  />
                  <span>空間音響を有効にする</span>
                </Label>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleStart}
              className="group w-full text-white font-bold bg-transparent hover:bg-primary/40"
            >
              <SendHorizontal className="size-4 group-hover:translate-x-1 transition-all" />
            </Button>
          </CardFooter>
        </Card>
      </HomeHero>
    </div>
  );
}
