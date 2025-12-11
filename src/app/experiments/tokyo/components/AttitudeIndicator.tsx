interface AttitudeIndicatorProps {
  pitch: number;
  roll: number;
}

export default function AttitudeIndicator({
  pitch,
  roll,
}: AttitudeIndicatorProps) {
  return (
    <div className="relative flex items-center justify-center w-[80dvw] md:w-xl h-[60dvh]">
      {/* Background Circle */}
      <div className="size-48 md:size-60 border rounded-full" />
      {/* Roll Indicator */}
      <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-center gap-1">
        <div
          className="w-full max-w-40 h-1 relative bg-muted/[0.2] rounded-full overflow-hidden"
          title="Roll"
        >
          <div
            className="absolute top-0 h-full bg-secondary/50 transition-all"
            style={{
              right: roll < 0 ? `${50 + (roll / 90) * 50}%` : "50%",
              width: `${Math.min(50, Math.abs(roll / 90) * 50)}%`,
            }}
          />
          <div className="absolute left-1/2 top-0 w-px h-full bg-white" />
        </div>
        <h3 className="text-xs md:text-sm text-muted text-center text-shadow-sm font-light font-mono">
          {roll.toFixed(0)}°
        </h3>
      </div>

      {/* Pitch Indicator */}
      <div className="absolute top-0 bottom-0 right-0 flex items-center justify-center gap-1">
        <div
          className="w-1 h-full max-h-40 relative bg-muted/[0.2] rounded-full overflow-hidden"
          title="Pitch"
        >
          <div
            className="absolute left-0 w-full bg-secondary/50 transition-all"
            style={{
              bottom: pitch > 0 ? "50%" : `${50 + (pitch / 90) * 50}%`,
              height: `${Math.min(50, Math.abs(pitch / 90) * 50)}%`,
            }}
          />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white" />
        </div>
        <h3 className="text-xs md:text-sm text-muted text-shadow-sm font-light font-mono">
          {pitch.toFixed(0)}°
        </h3>
      </div>
    </div>
  );
}
