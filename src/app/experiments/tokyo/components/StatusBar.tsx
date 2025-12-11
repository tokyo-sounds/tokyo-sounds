interface StatusBarProps {
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

export default function StatusBar({
  generativeEnabled,
  lyriaStatus,
  spatialAudioEnabled,
  spatialAudioStats,
  multiplayerConnected,
  playerCount,
}: StatusBarProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-3 bg-black/[0.3]  backdrop-blur-xs rounded-lg text-background text-xs font-sans">
      <div className="w-full flex items-center justify-between gap-2">
        {generativeEnabled && (
          <span className="text-white/70">♪ {lyriaStatus}</span>
        )}
        {spatialAudioEnabled && spatialAudioStats.total > 0 && (
          <>
            <span className="text-white/30">|</span>
            <span className="text-primary">
              SFX {spatialAudioStats.active}/{spatialAudioStats.total}
            </span>
          </>
        )}
        <span className="text-white/30">|</span>
        <span
          className={
            multiplayerConnected ? "text-green-400/70" : "text-destructive"
          }
        >
          {multiplayerConnected ? `● ${playerCount}` : "○"}
        </span>
      </div>
    </div>
  );
}
