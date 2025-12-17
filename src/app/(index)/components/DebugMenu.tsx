import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";
import { TimeOfDay } from "@/config/tokyo-config";
import { type MovementMode } from "@/lib/flight";
import { TIME_OF_DAY_PRESETS } from "@/config/tokyo-config";
import { clearVisitedFlag } from "@/hooks/useDemoFlythrough";
import { useAmbientBackgroundAudio } from "@/components/city/AmbientBackgroundAudioContext";
import { LocationSearch } from "@/components/city/LocationSearch";
import { type DistrictDebugInfo } from "@/components/city/DistrictLyriaAudio";
import DistrictDebugContent from "./DistricDebugContent";
import { DebugOptions } from "../type/FlightPageTypes";
import AudioVolumeControls from "@/components/audio/audio-volume-controls";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CodeXml, Play, Pause, Settings } from "lucide-react";

/** DebugMenu
 *
 * Debug menu
 * @param options - Debug options
 * @param onOptionsChange - Callback function to handle options change
 * @param collapsed - Collapsed state
 * @param onToggle - Callback function to handle toggle
 * @param cameraY - Camera Y position
 * @param collisionDistance - Collision distance
 * @returns null
 */

export default function DebugMenu({
  options,
  onOptionsChange,
  status,
  movementMode,
  cameraY,
  collisionDistance,
  apiKey,
  onTeleport,
  searchDisabled,
  open,
  onOpenChange,
  generativeEnabled,
  districts,
  lyriaStatus,
  spatialAudioEnabled,
  spatialAudioStats,
  pitch,
  roll,
  multiplayerConnected,
  playerCount,
}: {
  options: DebugOptions;
  onOptionsChange: (key: keyof DebugOptions, value: boolean) => void;
  status: string;
  movementMode: MovementMode;
  cameraY: number;
  collisionDistance: number | null;
  apiKey: string;
  onTeleport: (lat: number, lng: number, alt: number) => void;
  searchDisabled: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  generativeEnabled: boolean;
  districts: DistrictDebugInfo[];
  lyriaStatus: string;
  spatialAudioEnabled: boolean;
  spatialAudioStats: {
    total: number;
    active: number;
    culled: number;
  };
  pitch: number;
  roll: number;
  multiplayerConnected?: boolean;
  playerCount?: number;
}) {
  const { currentTime, setTimeOfDay } = useTimeOfDayStore();
  const timeOptions: TimeOfDay[] = ["morning", "afternoon", "evening"];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              aria-label="メニュー"
              size="icon"
              variant="ghost"
              className="absolute top-4 left-4 rounded-full text-white/70 text-shadow-sm hover:bg-black/30 hover:border hover:border-border/50 hover:text-white text-xs font-mono pointer-events-auto"
            >
              <Settings className="size-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>メニュー</p>
        </TooltipContent>
      </Tooltip>
      <SheetContent className="bg-black/70 backdrop-blur-xs px-4 text-white border-none">
        <SheetHeader className="pl-0">
          <SheetTitle className="text-white/70 text-lg font-noto inline-flex items-center gap-2">
            <Settings className="size-4" /> メニュー
          </SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="options" className="space-y-2 flex-1">
          <TabsList className="w-full">
            <TabsTrigger value="options" className="inline-flex gap-2 text-sm">
              <Settings className="size-4" />
              オプション
            </TabsTrigger>
            <TabsTrigger value="console" className="inline-flex gap-2 text-sm">
              <CodeXml className="size-4" />
              開発者オプション
            </TabsTrigger>
          </TabsList>
          <TabsContent value="options" className="flex-1 flex flex-col gap-2">
            <div>
              <DebugMenuLabel>時間設定</DebugMenuLabel>
              <DebugMenuDescription>
                時間帯の選択によって、AI生成音楽も変化します。
              </DebugMenuDescription>
              <div className="bg-muted/40 text-muted-foreground inline-flex h-9 w-full gap-1 items-center justify-center rounded-lg p-[3px]">
                {timeOptions.map((time) => (
                  <Button
                    key={time}
                    onClick={() => setTimeOfDay(time)}
                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center rounded-md border border-transparent text-sm font-medium ${
                      currentTime === time
                        ? "bg-primary hover:bg-primary/70 text-primary-foreground"
                        : "bg-transparent text-white/70 hover:bg-muted/40"
                    }`}
                  >
                    {TIME_OF_DAY_PRESETS[time].nameJa}
                  </Button>
                ))}
              </div>
            </div>
            {/* Remove background audio control for more display space */}
            {/* <div>
              <DebugMenuLabel>音声設定</DebugMenuLabel>
              <DebugMenuDescription>現在再生中の背景音。</DebugMenuDescription>
              <AmbientAudioControl />
            </div> */}
            <div>
              <DebugMenuLabel>音量設定</DebugMenuLabel>
              <AudioVolumeControls />
            </div>
            <div className="flex-1">
              <DebugMenuLabel>地域パラメーター</DebugMenuLabel>
              <DebugMenuDescription>
                現在地の地域情報解析結果。
              </DebugMenuDescription>
              {/* District Debug Panel Section */}
              {generativeEnabled && districts.length > 0 ? (
                <DistrictDebugContent districts={districts} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-center text-muted/50">
                  未設定またはAI生成音楽が無効です
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent
            value="console"
            className="flex-1 flex flex-col justify-between gap-2"
          >
            <div>
              <DebugMenuLabel>テレポート</DebugMenuLabel>
              <LocationSearch
                apiKey={apiKey}
                onTeleport={onTeleport}
                disabled={searchDisabled}
                minimal
                dropdownPosition="below"
                dropdownClassName="fixed top-24 left-1/2 -translate-x-1/2"
              />
            </div>
            <div className="space-y-1">
              <DebugMenuLabel>描画設定</DebugMenuLabel>
              <div className="grid grid-cols-2 space-y-1 text-xs **:font-mono">
                <label className="flex items-center gap-2 cursor-pointer px-2">
                  <input
                    type="checkbox"
                    checked={options.showMeshes}
                    onChange={(e) =>
                      onOptionsChange("showMeshes", e.target.checked)
                    }
                    className="size-3"
                  />
                  <span className="text-muted/50">Meshes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer px-2">
                  <input
                    type="checkbox"
                    checked={options.wireframe}
                    onChange={(e) =>
                      onOptionsChange("wireframe", e.target.checked)
                    }
                    className="size-3"
                  />
                  <span className="text-muted/50">Wireframe</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer px-2">
                  <input
                    type="checkbox"
                    checked={options.showBounds}
                    onChange={(e) =>
                      onOptionsChange("showBounds", e.target.checked)
                    }
                    className="size-3"
                  />
                  <span className="text-muted/50">Grids</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer px-2">
                  <input
                    type="checkbox"
                    checked={options.collision}
                    onChange={(e) =>
                      onOptionsChange("collision", e.target.checked)
                    }
                    className="size-3"
                  />
                  <span className="text-muted/50">Collision</span>
                </label>
              </div>
            </div>
            <div className="flex-1">
              <DebugMenuLabel>コンソール</DebugMenuLabel>
              <div className="bg-neutral-950 px-3 py-2 rounded-md *:text-xs *:data-[status-value]:font-mono *:data-[status-value]:text-right *:data-[status-value]:text-accent/70 **:data-[status-label]:text-primary **:data-[status-label]:font-mono">
                <h4>
                  状態 <span data-status-label>Status</span>
                </h4>
                <p data-status-value>{status}</p>
                <h4>
                  飛行モード <span data-status-label>Flight Mode</span>
                </h4>
                <p data-status-value>{movementMode.toUpperCase()}</p>
                <h4>
                  カメラ高さ <span data-status-label>Camera Y</span>
                </h4>
                <p data-status-value>{cameraY.toFixed(2)}</p>
                {generativeEnabled && (
                  <>
                    <h4>
                      AI生成音楽 <span data-status-label>Lyria</span>
                    </h4>
                    <p data-status-value>♪ {lyriaStatus}</p>
                  </>
                )}
                {spatialAudioEnabled && spatialAudioStats.total > 0 && (
                  <>
                    <h4>
                      空間音響 <span data-status-label>Spatial Audio</span>
                    </h4>
                    <p data-status-value>
                      {spatialAudioStats.active}/{spatialAudioStats.total}{" "}
                      (Culled: {spatialAudioStats.culled})
                    </p>
                  </>
                )}
                <h4>
                  ピッチ <span data-status-label>Pitch</span>
                </h4>
                <p data-status-value>{pitch.toFixed(2)}°</p>
                <h4>
                  ロール <span data-status-label>Roll</span>
                </h4>
                <p data-status-value>{roll.toFixed(2)}°</p>
                <h4>
                  マルチプレイヤー <span data-status-label>Multiplayer</span>
                </h4>
                <p data-status-value>
                  {multiplayerConnected ? (
                    <span className="text-green-400/70">● {playerCount}</span>
                  ) : (
                    <span className="text-destructive">○</span>
                  )}
                </p>
                {/* <h4>
                  衝突距離 <span data-status-label>Collision Distance</span>
                </h4>
                <p data-status-value>{collisionDistance?.toFixed(2)}m</p> */}
              </div>
            </div>

            <div className="space-y-2 pb-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  clearVisitedFlag();
                  window.location.reload();
                }}
                className="w-full space-x-2 hover:animate-pulse"
              >
                <Play className="size-4" />
                デモプレイ
              </Button>
              <h6 className="text-sm text-muted/40 flex justify-end items-center gap-1">
                <span className="text-[7pt] font-mono border border-muted/40 rounded px-1.5 py-1">
                  M
                </span>{" "}
                ドローンモード
              </h6>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// Debug Menu Label Component
function DebugMenuLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm text-muted mb-1">{children}</h3>;
}

// Debug Menu Section Description Component
function DebugMenuDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted/50 mb-1">{children}</p>;
}

/**
 * Ambient Audio Control Component
 * Displays current playing audio file and provides play/pause controls
 */
// function AmbientAudioControl() {
//   const { currentFileName, isPlaying, play, pause } =
//     useAmbientBackgroundAudio();

//   // Remove file extension from filename
//   const fileNameWithoutExtension = currentFileName
//     ? currentFileName.replace(/\.[^/.]+$/, "")
//     : null;

//   const handleToggle = () => {
//     if (isPlaying) {
//       pause();
//     } else {
//       play();
//     }
//   };

//   return (
//     <Button
//       variant="ghost"
//       size="lg"
//       onClick={handleToggle}
//       className="group w-full hover:bg-muted/[0.2] hover:border hover:border-border/70 hover:text-white transition-all"
//     >
//       {isPlaying ? (
//         <>
//           <span className="hidden group-hover:inline-flex items-center">
//             <Pause className="size-3 mr-1" />
//             停止
//           </span>
//           <span className="inline group-hover:hidden">
//             {fileNameWithoutExtension || "None"}
//           </span>
//         </>
//       ) : (
//         <>
//           <span className="hidden items-center group-hover:inline-flex">
//             <Play className="size-3 mr-1" />
//             再生
//           </span>
//           <span className="inline group-hover:hidden">
//             {fileNameWithoutExtension || "None"}
//           </span>
//         </>
//       )}
//     </Button>
//   );
// }
