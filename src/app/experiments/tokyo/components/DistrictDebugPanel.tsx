import { type DistrictDebugInfo } from "@/components/city/DistrictLyriaAudio";

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
  collapsed,
  onToggle,
}: {
  districts: DistrictDebugInfo[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded text-white/70 hover:text-white text-xs font-mono"
      >
        DISTRICTS
      </button>
    );
  }

  const cameraLat = districts[0]?.cameraLat;
  const cameraLng = districts[0]?.cameraLng;

  return (
    <div className="absolute bottom-4 left-4 bg-black/70 rounded p-3 text-white text-xs font-mono min-w-[220px] max-h-[350px] overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70">DISTRICTS</span>
        <button onClick={onToggle} className="text-white/50 hover:text-white">
          ×
        </button>
      </div>

      {cameraLat !== undefined && cameraLng !== undefined && (
        <div className="mb-2 pb-2 border-b border-white/20 text-[10px]">
          <span className="text-white/50">GPS: </span>
          <span className="text-cyan-400">
            {cameraLat.toFixed(4)}, {cameraLng.toFixed(4)}
          </span>
        </div>
      )}

      <div className="space-y-1">
        {districts.slice(0, 8).map((d) => (
          <div key={d.name} className="flex justify-between items-center">
            <span style={{ color: d.color }}>{d.nameJa}</span>
            <span className="text-white/50">
              {(d.weight * 100).toFixed(0)}% ({Math.round(d.distance)}m)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
