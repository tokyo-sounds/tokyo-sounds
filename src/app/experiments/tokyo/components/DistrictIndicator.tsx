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
    <div className="absolute top-1/6 left-1/2 transform -translate-x-1/2 pointer-events-none">
      <div className="text-white text-center space-y-1 *:text-shadow-lg *:text-shadow-black/50">
        <h2 className="text-sm text-white/70 font-sans font-light">{district.name}</h2>
        <h1 className="text-5xl font-semibold font-noto">{district.nameJa}</h1>
      </div>
    </div>
  );
}
