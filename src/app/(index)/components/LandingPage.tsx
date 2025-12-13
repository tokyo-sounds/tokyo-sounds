/** LandingPage
 *
 * Landing page for Tokyo Sounds
 * @returns null
 */
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
  return (
    <div className="w-full h-full min-h-svh flex flex-col items-center justify-center bg-linear-to-tr from-orange-600 to-red-800 overflow-hidden">
      <Nav />
      <HomeHero>
        <Card className="w-full max-w-sm absolute top-1/2 left-1/2 -translate-x-1/2 flight-dashboard-card backdrop-blur-xs border-border/50 shadow-xl text-background/70 tracking-wider animate-in fade-in-0 slide-in-from-bottom duration-500">
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
                suppressHydrationWarning
              />
            </div>

            <div className="space-y-2">
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
