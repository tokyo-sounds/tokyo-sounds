import SpeedoMeter from "./SpeedoMeter";

interface FlightDashboardProps {
  flightSpeed: number;
  generativeEnabled: boolean;
  lyriaStatus: string;
  spatialAudioEnabled: boolean;
  spatialAudioStats: {
    total: number;
    active: number;
    culled: number;
  };
  multiplayerConnected?: boolean;
  playerCount?: number;
}

export default function FlightDashboard({
  flightSpeed,
  generativeEnabled,
  lyriaStatus,
  spatialAudioEnabled,
  spatialAudioStats,
  playerCount,
  multiplayerConnected,
}: FlightDashboardProps) {
  return (
    <div className="absolute top-4 left-4 bg-black/70 rounded p-3 text-white text-xs font-mono">
      <SpeedoMeter flightSpeed={flightSpeed} />
      <div className="flex items-center gap-3 mb-2">
        <span className="text-white/70">SPD</span>
        <span
          className={
            flightSpeed > 150
              ? "text-red-400"
              : flightSpeed > 80
              ? "text-amber-400"
              : "text-white"
          }
        >
          {flightSpeed}
        </span>
        {generativeEnabled && (
          <>
            <span className="text-white/30">|</span>
            <span className="text-white/70">♪ {lyriaStatus}</span>
          </>
        )}
        {spatialAudioEnabled && spatialAudioStats.total > 0 && (
          <>
            <span className="text-white/30">|</span>
            <span className="text-cyan-400/70">
              SFX {spatialAudioStats.active}/{spatialAudioStats.total}
            </span>
          </>
        )}
        <span className="text-white/30">|</span>
        <span
          className={
            multiplayerConnected ? "text-green-400/70" : "text-yellow-400/70"
          }
        >
          {multiplayerConnected ? `● ${playerCount}` : "○"}
        </span>
      </div>
      <div className="text-white/50 text-[10px] space-x-3">
        <span>W/S pitch</span>
        <span>A/D bank</span>
        <span>SHIFT boost</span>
        <span>SPACE freeze</span>
      </div>
    </div>
  );
}
