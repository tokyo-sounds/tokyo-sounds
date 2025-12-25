import { type DistrictDebugInfo } from "@/components/city/DistrictLyriaAudio";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Kbd } from "@/components/ui/kbd";

/** DistrictDebugPanel
 *
 * District debug panel
 * @param districts - Districts
 * @param collapsed - Collapsed state
 * @param onToggle - Callback function to handle toggle
 * @returns null
 */
export default function DistrictDebugPanel({
  districts,
  districtDebugCollapsed,
  setDistrictDebugCollapsed,
}: {
  districts: DistrictDebugInfo[];
  districtDebugCollapsed: boolean;
  setDistrictDebugCollapsed: (collapsed: boolean) => void;
}) {
  const cameraLat = districts[0]?.cameraLat;
  const cameraLng = districts[0]?.cameraLng;

  return (
    <AccordionItem value="districts" className="border-none">
      <AccordionTrigger className="py-2 items-center text-muted justify-center hover:no-underline cursor-pointer">
        <Kbd className="text-muted bg-transparent border font-mono">I</Kbd>
        <span>エリア情報</span>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-3">
        <div className="flex flex-col gap-2">
          {cameraLat !== undefined && cameraLng !== undefined && (
            <div className="pb-2 border-b border-white/20 text-[10px]">
              <span className="text-muted">GPS: </span>
              <span className="text-cyan-400">
                {cameraLat.toFixed(4)}, {cameraLng.toFixed(4)}
              </span>
            </div>
          )}

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {districts.slice(0, 8).map((d) => (
              <div
                key={d.name}
                className="flex justify-between items-center text-xs"
              >
                <span style={{ color: d.color }}>{d.nameJa}</span>
                <span className="text-muted">
                  {(d.weight * 100).toFixed(0)}% ({Math.round(d.distance)}
                  m)
                </span>
              </div>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
