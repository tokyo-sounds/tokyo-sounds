interface AttitudeIndicatorProps {
  pitch: number;
  roll: number;
  cameraY: number;
}

export default function AttitudeIndicator({
  pitch,
  roll,
  cameraY,
}: AttitudeIndicatorProps) {
  return (
    <div className="relative flex items-center justify-center w-[80svw] md:w-xl h-[60svh]">
      {/* Background Circle */}
      <div className="size-48 md:size-60 border rounded-full" />
      {/* Roll Indicator */}
      <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-center gap-1">
        {/* Scale marks */}
        <svg
          className="w-full max-w-40 h-3"
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 21 }, (_, i) => {
            const x = i * 5; // 0, 5, 10, ..., 100
            return (
              <line
                key={i}
                x1={x}
                y1="0"
                x2={x}
                y2="8"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted"
              />
            );
          })}
        </svg>
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
        <h3 className="text-xs md:text-sm text-muted text-center text-shadow-sm text-shadow-black/50 font-light font-mono">
          {roll.toFixed(1)}°
        </h3>
      </div>

      {/* Pitch Indicator */}
      <div className="absolute top-0 bottom-0 right-0 flex items-center justify-center gap-2">
        {/* Scale marks */}
        <svg
          className="w-3 h-full max-h-40"
          viewBox="0 0 12 100"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 21 }, (_, i) => {
            const y = i * 5; // 0, 5, 10, ..., 100
            return (
              <line
                key={i}
                x1="0"
                y1={y}
                x2="8"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted"
              />
            );
          })}
        </svg>
        <div
          className="w-1 h-full max-h-40 relative bg-muted/[0.2] rounded-full overflow-hidden"
          title="Pitch"
        >
          <div
            className="absolute left-0 w-1 bg-secondary/50 transition-all"
            style={{
              bottom: pitch > 0 ? "50%" : `${50 + (pitch / 90) * 50}%`,
              height: `${Math.min(50, Math.abs(pitch / 90) * 50)}%`,
            }}
          />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white" />
        </div>
        <h3 className="text-xs md:text-sm text-muted text-shadow-sm text-shadow-black/50 font-light font-mono">
          {pitch.toFixed(1)}°
        </h3>
        <label className="absolute top-6 left-1/2 -translate-x-1/2 w-full text-xs md:text-sm text-muted text-shadow-sm text-shadow-black/50 font-light font-mono">
          {cameraY.toFixed(1)} m

        </label>
      </div>
    </div>
  );
}
