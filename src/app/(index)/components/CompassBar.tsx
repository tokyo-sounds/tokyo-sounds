import { LocationSearch } from "@/components/city/LocationSearch";
import { Button } from "@/components/ui/button";

/** CompassBar
 *
 * Compass bar at top of viewport
 * @param heading - Heading
 * @param pitch - Pitch
 * @param roll - Roll
 * @returns null
 */
interface CompassBarProps {
  heading: number;
  pitch: number;
  roll: number;
  apiKey: string;
  onTeleport: (lat: number, lng: number, alt: number) => void;
  searchDisabled?: boolean;
  isGyroActive?: boolean;
  isGyroEnabled?: boolean;
  isGyroAvailable?: boolean;
  isMobile?: boolean;
  onRecalibrateGyro?: () => void;
}

export default function CompassBar({
  heading,
  pitch,
  roll,
  apiKey,
  onTeleport,
  searchDisabled,
  isGyroActive,
  isGyroEnabled,
  isGyroAvailable,
  isMobile,
  onRecalibrateGyro,
}: CompassBarProps) {
  const directions = [
    { label: "N", bearing: 0 },
    { label: "NE", bearing: 45 },
    { label: "E", bearing: 90 },
    { label: "SE", bearing: 135 },
    { label: "S", bearing: 180 },
    { label: "SW", bearing: 225 },
    { label: "W", bearing: 270 },
    { label: "NW", bearing: 315 },
  ];

  const getCardinal = (h: number) => {
    const normalized = ((h % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return "N";
    if (normalized >= 22.5 && normalized < 67.5) return "NE";
    if (normalized >= 67.5 && normalized < 112.5) return "E";
    if (normalized >= 112.5 && normalized < 157.5) return "SE";
    if (normalized >= 157.5 && normalized < 202.5) return "S";
    if (normalized >= 202.5 && normalized < 247.5) return "SW";
    if (normalized >= 247.5 && normalized < 292.5) return "W";
    return "NW";
  };

  const getMarkerOffset = (bearing: number) => {
    let diff = bearing - heading;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  };

  const visibleRange = 90;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flight-dashboard-card p-3 rounded-lg font-mono">
      <div className="flex items-center justify-center gap-4 mb-1">
        {isMobile &&
          (isGyroActive || isGyroEnabled || isGyroAvailable) &&
          onRecalibrateGyro && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRecalibrateGyro}
              aria-label="Recalibrate gyroscope"
              className="hover:bg-red-500"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <path d="M2 12c0-3 2-5 5-5" />
                <path d="M22 12c0 3-2 5-5 5" />
                <polyline points="5 4 2 7 5 10" />
                <polyline points="19 20 22 17 19 14" />
              </svg>
            </Button>
          )}
        <div className="flex items-center gap-1 w-16">
          <span className="text-white/50">R</span>
          <span
            className={`w-10 text-right ${
              Math.abs(roll) > 30 ? "text-accent" : "text-background"
            }`}
          >
            {roll > 0 ? "+" : ""}
            {Math.round(roll)}°
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-white font-bold w-8 text-center">
            {Math.round(heading)}°
          </span>
          <span className="text-white/70 w-6">{getCardinal(heading)}</span>
        </div>

        <div className="flex items-center gap-1 w-16">
          <span className="text-white/50">P</span>
          <span
            className={`w-10 ${
              Math.abs(pitch) > 30 ? "text-accent" : "text-background"
            }`}
          >
            {pitch > 0 ? "+" : ""}
            {Math.round(pitch)}°
          </span>
        </div>
      </div>

      <div className="relative w-48 h-4 overflow-hidden mx-auto">
        <div className="absolute left-1/2 top-0 w-px h-full bg-white/50 transform -translate-x-1/2" />

        {directions.map((dir) => {
          const offset = getMarkerOffset(dir.bearing);
          if (Math.abs(offset) > visibleRange) return null;
          const pixelOffset = (offset / visibleRange) * 96;

          return (
            <div
              key={dir.label}
              className="absolute top-0 transform -translate-x-1/2 text-center"
              style={{ left: `calc(50% + ${pixelOffset}px)` }}
            >
              <div
                className={`text-[10px] ${
                  dir.label === "N"
                    ? "text-red-400"
                    : dir.label.length === 1
                    ? "text-white"
                    : "text-white/50"
                }`}
              >
                {dir.label}
              </div>
            </div>
          );
        })}

        {Array.from({ length: 36 }, (_, i) => i * 10).map((tick) => {
          const offset = getMarkerOffset(tick);
          if (Math.abs(offset) > visibleRange) return null;
          const pixelOffset = (offset / visibleRange) * 96;
          const isCardinal = tick % 90 === 0;

          return (
            <div
              key={tick}
              className={`absolute bottom-0 w-px transform -translate-x-1/2 ${
                isCardinal ? "h-2 bg-white/60" : "h-1 bg-white/30"
              }`}
              style={{ left: `calc(50% + ${pixelOffset}px)` }}
            />
          );
        })}
      </div>
    </div>
  );
}
