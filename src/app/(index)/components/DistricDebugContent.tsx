"use client";
/**
 * District Debug Content Component
 * Displays district information in console-style format matching DebugMenu aesthetic
 * Real-time updates when menu is open (no memo to ensure updates are visible)
 */
import { type DistrictDebugInfo } from "@/components/city/DistrictLyriaAudio";
import { useMemo, memo } from "react";
export default function DistrictDebugContent({
  districts,
}: {
  districts: DistrictDebugInfo[];
}) {
  // Memoize GPS coordinates extraction
  const gpsInfo = useMemo(() => {
    const firstDistrict = districts[0];
    if (!firstDistrict) return null;
    const { cameraLat, cameraLng } = firstDistrict;
    if (cameraLat === undefined || cameraLng === undefined) return null;
    return { lat: cameraLat, lng: cameraLng };
  }, [districts]);

  // Memoize limited district list for rendering
  const limitedDistricts = useMemo(() => districts.slice(0, 8), [districts]);

  return (
    <div className="bg-neutral-950 p-3 rounded-md space-y-2">
      {gpsInfo && (
        <div className="pb-2 flex justify-between items-center text-xs">
          <h5 className="text-muted">
            現在地<span className="text-primary"> GPS </span>
          </h5>
          <p className="font-mono text-right text-accent/70">
            {gpsInfo.lat.toFixed(4)}, {gpsInfo.lng.toFixed(4)}
          </p>
        </div>
      )}
      <div className="space-y-1 max-h-[300px] overflow-y-auto relative">
        {limitedDistricts.map((district) => (
          <DistrictItem key={district.name} district={district} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual District Item Component
 * Memoized to prevent unnecessary re-renders
 */
const DistrictItem = memo(function DistrictItem({
  district,
}: {
  district: DistrictDebugInfo;
}) {
  const percentage = Math.round(district.weight * 100);

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* District name with color */}
      <span
        className="min-w-[80px] text-left"
        style={{ color: district.color }}
      >
        {district.nameJa}
      </span>

      {/* Progress bar container */}
      <div className="flex-1 relative h-2 bg-neutral-900/50 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 transition-all duration-150 ease-out"
          style={{
            backgroundColor: district.color,
            width: `${percentage}%`,
            opacity: 0.6,
          }}
        />
      </div>

      {/* Percentage and distance */}
      <p className="text-muted/40 font-mono min-w-[70px] text-right">
        <span className="text-muted/70">{percentage}%</span> ({Math.round(district.distance)}m)
      </p>
    </div>
  );
});
