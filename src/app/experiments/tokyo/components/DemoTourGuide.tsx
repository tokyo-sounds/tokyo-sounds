import { type DemoState } from "@/hooks/useDemoFlythrough";
import { DEMO_WAYPOINTS } from "@/config/tokyo-config";

/** DemoTourGuide
 *
 * Demo tour guide overlay
 * @param demoState - Demo state
 * @returns null
 */
export default function DemoTourGuide({ demoState }: { demoState: DemoState }) {
  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-lg px-6 py-4 text-white text-center">
      <div className="text-fuchsia-400 text-lg font-bold mb-1">
        {demoState.currentWaypoint?.nameJa || "Tour"}
      </div>
      <div className="text-white/70 text-sm mb-2">
        {demoState.currentWaypoint?.name || ""}
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-white/50">
        <span>
          {demoState.phase === "transitioning"
            ? "Flying to..."
            : demoState.phase === "orbiting"
            ? "Orbiting"
            : "Returning..."}
        </span>
        <span className="text-white/30">|</span>
        <span>Press ESC or SPACE to skip</span>
      </div>
      <div className="mt-2 w-full bg-white/20 rounded-full h-1">
        <div
          className="bg-fuchsia-500 h-1 rounded-full transition-all duration-200"
          style={{
            width: `${
              (demoState.currentWaypointIndex / DEMO_WAYPOINTS.length) * 100
            }%`,
          }}
        />
      </div>
    </div>
  );
}
