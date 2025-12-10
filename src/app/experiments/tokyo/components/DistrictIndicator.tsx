import { District } from "@/config/tokyo-config";

/** DistrictIndicator
 *
 * District indicator overlay
 * @param district - District
 * @returns null
 */
export default function DistrictIndicator({
  district,
}: {
  district: District | null;
}) {
  if (!district) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="bg-black/70 px-4 py-2 rounded text-white text-center font-mono">
        <div className="text-2xl font-bold" style={{ color: district.color }}>
          {district.nameJa}
        </div>
        <div className="text-xs text-white/70">{district.name}</div>
      </div>
    </div>
  );
}
