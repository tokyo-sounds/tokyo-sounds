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
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flight-dashboard-card px-6 py-4 rounded-md text-white text-center animate-pulse">
      <div className="flex items-center justify-center gap-2 text-xs text-white/50">
        {/*   <span>
          {demoState.phase === "transitioning"
            ? "Flying to..."
            : demoState.phase === "orbiting"
            ? "Orbiting"
            : "Returning..."}
        </span>
        <span className="text-white/30">|</span> */}
        <p className="text-primary-foreground/70 text-sm font-noto font-sans uppercase">
          <span className="hidden md:inline">クリック</span>
          <span className="inline md:hidden">ESC または SPACE</span>
          でスキップ
        </p>
      </div>
      {/* <div className="mt-2 w-full bg-white/20 rounded-full h-1">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-200"
          style={{
            width: `${
              (demoState.currentWaypointIndex / DEMO_WAYPOINTS.length) * 100
            }%`,
          }}
        />
      </div> */}
    </div>
  );
}
