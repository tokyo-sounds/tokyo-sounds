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
    <div className="flex flex-col items-center justify-center gap-2 absolute top-4 left-4 p-6 bg-black/[0.1]  backdrop-blur-sm rounded-lg text-white text-xs font-mono">
      <div className="w-full flex items-center justify-between gap-2">
        {generativeEnabled && (
          <>
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
