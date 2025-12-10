import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";
import { TimeOfDay } from "@/config/tokyo-config";
import { TIME_OF_DAY_PRESETS } from "@/config/tokyo-config";
import { clearVisitedFlag } from "@/hooks/useDemoFlythrough";
import { DebugOptions } from "../type/FlightPageTypes";

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
}: {
  options: DebugOptions;
  onOptionsChange: (key: keyof DebugOptions, value: boolean) => void;
  collapsed: boolean;
  onToggle: () => void;
  cameraY: number;
  collisionDistance: number | null;
}) {
  const { currentTime, setTimeOfDay } = useTimeOfDayStore();
  const timeOptions: TimeOfDay[] = ["morning", "afternoon", "evening"];

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-4 right-4 bg-black/70 px-3 py-2 rounded text-white/70 hover:text-white text-xs font-mono"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 bg-black/70 rounded p-3 text-white text-xs font-mono min-w-[180px]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70">DEBUG</span>
        <button onClick={onToggle} className="text-white/50 hover:text-white">
          ×
        </button>
      </div>

      <div className="text-white/70 mb-2 space-y-1">
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
    </div>
  );
}
