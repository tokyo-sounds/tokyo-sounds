import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";
import { TimeOfDay } from "@/config/tokyo-config";
import { type MovementMode } from "@/lib/flight";
import { TIME_OF_DAY_PRESETS } from "@/config/tokyo-config";
import { clearVisitedFlag } from "@/hooks/useDemoFlythrough";
import { LocationSearch } from "@/components/city/LocationSearch";
import { DebugOptions } from "../type/FlightPageTypes";
import { Button } from "@/components/ui/button";
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
import { CodeXml, SprayCan, Play, Pause } from "lucide-react";
import { useAmbientBackgroundAudio } from "@/components/city/AmbientBackgroundAudioContext";

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
}) {
  const { currentTime, setTimeOfDay } = useTimeOfDayStore();
  const timeOptions: TimeOfDay[] = ["morning", "afternoon", "evening"];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="absolute bottom-4 right-4 text-white/70 text-shadow-sm hover:text-white text-xs font-mono"
            >
              <CodeXml className="size-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>開発者メニュー</p>
        </TooltipContent>
      </Tooltip>
      <SheetContent className="bg-black/70 backdrop-blur-xs px-4 text-white border-none">
        <SheetHeader>
          <SheetTitle className="text-white/70 font-sans">DEBUG</SheetTitle>
        </SheetHeader>
        <div className="space-y-2">
          <div className="w-full flex justify-between">
            <span>Status:</span>
            <span className="font-light">{status}</span>
          </div>
          <div className="w-full flex justify-between">
            <span>Flight Mode:</span>
            <span className="font-light">{movementMode.toUpperCase()}</span>
          </div>
          <div className="w-full flex justify-between">
            <span>Camera Y:</span>
            <span className="font-light">{cameraY.toFixed(2)}</span>
          </div>
          <div className="w-full flex justify-between">
            <span>Collision Distance:</span>
            <span className="font-light">{collisionDistance?.toFixed(2)}m</span>
          </div>

          <div className="w-full pt-2 border-t border-white/20">
            <div className="text-white/50 mb-2">Background Audio</div>
            <AmbientAudioControl />
          </div>

          <div>
            <div className="text-white/50 mb-1">Time of Day</div>
            <div className="flex gap-1">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeOfDay(time)}
                  className={`flex-1 px-2 py-1 rounded text-sm transition-colors ${
                    currentTime === time
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground text-muted hover:bg-muted/50"
                  }`}
                >
                  {TIME_OF_DAY_PRESETS[time].nameJa}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 pb-2">
            <div className="text-white/50 mb-1">Location Search</div>
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.showMeshes}
                onChange={(e) =>
                  onOptionsChange("showMeshes", e.target.checked)
                }
                className="w-3 h-3"
              />
              <span className="text-white/70">Meshes</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.wireframe}
                onChange={(e) => onOptionsChange("wireframe", e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-white/70">Wireframe</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.showBounds}
                onChange={(e) =>
                  onOptionsChange("showBounds", e.target.checked)
                }
                className="w-3 h-3"
              />
              <span className="text-white/70">Grids</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.collision}
                onChange={(e) => onOptionsChange("collision", e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-white/70">Collision</span>
            </label>

            <div className="mt-2 pt-2 border-t border-white/20">
              <button
                onClick={() => {
                  clearVisitedFlag();
                  window.location.reload();
                }}
                className="w-full px-2 py-1 bg-fuchsia-500/30 hover:bg-fuchsia-500/50 rounded text-[10px] text-fuchsia-300 transition-colors"
              >
                Restart Demo Tour
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Ambient Audio Control Component
 * Displays current playing audio file and provides play/pause controls
 */
function AmbientAudioControl() {
  const { currentFileName, isPlaying, play, pause } =
    useAmbientBackgroundAudio();

  const handleToggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div className="space-y-2">
      <div className="w-full flex justify-between items-center">
        <span className="text-white/70">Current Track:</span>
        <span className="font-light text-xs text-white/50 truncate max-w-[200px]">
          {currentFileName || "None"}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          className="flex-1 text-xs border-white/20 text-white/70 hover:text-white hover:bg-white/10"
        >
          {isPlaying ? (
            <>
              <Pause className="size-3 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="size-3 mr-1" />
              Play
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
