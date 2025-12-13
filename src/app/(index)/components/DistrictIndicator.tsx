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
    <div className="w-4/5 max-w-5xl h-[70svh] max-h-120 absolute top-30 md:top-26 left-1/2 transform -translate-x-1/2 pointer-events-none select-none">
      <div className="text-white text-center space-y-1 *:text-shadow-lg *:text-shadow-black/50 *:animate-in *:slide-in-from-bottom *:animate-out *:fade-out">
        <h2 className="text-sm text-white/70 font-sans font-light uppercase">
          {district.name}
        </h2>
        <h1 className="text-4xl md:text-5xl font-semibold font-noto">
          {district.nameJa}
        </h1>
      </div>
      <div className="absolute bottom-0 md:bottom-1/2 translate-y-0 md:translate-y-1/2 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0">
        <p className="w-xs px-3 py-2 flight-dashboard-card rounded-md text-muted text-xs md:text-sm text-justify font-noto text-shadow-lg leading-loose">
          {district.descriptionJa}
        </p>
      </div>
    </div>
  );
}
