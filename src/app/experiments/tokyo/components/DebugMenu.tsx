import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";
import { TimeOfDay } from "@/config/tokyo-config";
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
import { CodeXml } from "lucide-react";

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
  collapsed,
  onToggle,
  cameraY,
  collisionDistance,
  apiKey,
  onTeleport,
  searchDisabled,
}: {
  options: DebugOptions;
  onOptionsChange: (key: keyof DebugOptions, value: boolean) => void;
  collapsed: boolean;
  onToggle: () => void;
  cameraY: number;
  collisionDistance: number | null;
  apiKey: string;
  onTeleport: (lat: number, lng: number, alt: number) => void;
  searchDisabled: boolean;
}) {
  const { currentTime, setTimeOfDay } = useTimeOfDayStore();
  const timeOptions: TimeOfDay[] = ["morning", "afternoon", "evening"];
  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              onClick={onToggle}
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
      <SheetContent className="bg-black/70 backdrop-blur-xs px-4 text-white font-mono border-none">
        <SheetHeader>
          <SheetTitle className="text-white/70">DEBUG</SheetTitle>
        </SheetHeader>
        <div className="text-white/70 text-xs mb-2 space-y-1">
          <div>
            Y: <span className="text-white">{cameraY.toFixed(1)}</span>
          </div>
          {options.collision && collisionDistance !== null && (
            <div>
              Hit:{" "}
              <span className="text-red-400">
                {collisionDistance.toFixed(1)}m
              </span>
            </div>
          )}
        </div>

        <div className="mb-3 pb-2 border-b border-white/20">
          <div className="text-white/50 mb-1">Time of Day</div>
          <div className="flex gap-1">
            {timeOptions.map((time) => (
              <button
                key={time}
                onClick={() => setTimeOfDay(time)}
                className={`flex-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  currentTime === time
                    ? "bg-cyan-500/80 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
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
              onChange={(e) => onOptionsChange("showMeshes", e.target.checked)}
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
              onChange={(e) => onOptionsChange("showBounds", e.target.checked)}
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
      </SheetContent>
    </Sheet>
  );
}
