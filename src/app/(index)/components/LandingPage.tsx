/** LandingPage
 *
 * Landing page for Tokyo Sounds
 * @returns null
 */
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PASTEL_COLORS } from "../page";
import Nav from "@/components/layout/nav";
import HomeHero from "@/components/layout/HomeHero";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Send } from "lucide-react";
import { App_Info } from "@/lib/constraint";

// Lazy load the 3D preview component
const ModelPreview = dynamic(
  () => import("./ModelPreview"),
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
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch available models when dialog opens
  useEffect(() => {
    if (dialogOpen) {
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
    }
  }, [dialogOpen, planeModelPath, setPlaneModelPath]);

  return (
    <div className="w-full h-full min-h-svh relative flex flex-col items-center justify-center">
      <Nav />
      <HomeHero />
      <div className="flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl md:text-7xl text-white font-bold text-center text-shadow-lg animate-in fade-in slide-in-from-bottom duration-500">{App_Info.title_ja}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full translate-y-18 p-6"
            >
              <Send className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="flight-dashboard-card shadow-xl slide-in-from-bottom-2">
            <DialogHeader>
              <DialogTitle>プレイヤー設定</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="名前"
                maxLength={20}
                className="w-full text-primary-foreground placeholder:text-primary-foreground/60"
                suppressHydrationWarning
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
                  {dialogOpen && planeModelPath && (
                    <ModelPreview modelPath={planeModelPath} planeColor={planeColor} />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>音声設定</Label>
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
            </div>

            <DialogFooter className="flex flex-col gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleStart}
                className="group text-white font-bold bg-transparent hover:bg-primary/40"
              >
                <SendHorizontal className="size-4 group-hover:translate-x-1 transition-all" />
                <span>スタート</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
