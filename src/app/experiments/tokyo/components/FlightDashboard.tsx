import StatusBar from "./StatusBar";
import SpeedoMeter from "./SpeedoMeter";
import Compass from "./Compass";
import OperationManual from "./OperationManual";

interface FlightDashboardProps {
  flightSpeed: number;
  heading: number;
  speedoMeterSize: number;
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
  heading,
  speedoMeterSize,
  generativeEnabled,
  lyriaStatus,
  spatialAudioEnabled,
  spatialAudioStats,
  playerCount,
  multiplayerConnected,
}: FlightDashboardProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
      <div className="absolute top-6 md:top-10 left-6 md:left-10">
        <OperationManual />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <StatusBar
          generativeEnabled={generativeEnabled}
          lyriaStatus={lyriaStatus}
          spatialAudioEnabled={spatialAudioEnabled}
          spatialAudioStats={spatialAudioStats}
          multiplayerConnected={multiplayerConnected}
          playerCount={playerCount}
        />
      </div>
      <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10">
        <SpeedoMeter flightSpeed={flightSpeed} size={speedoMeterSize} />
      </div>

      <div className="absolute bottom-6 md:bottom-10 right-6 md:right-10">
        <Compass heading={heading} size={speedoMeterSize} />
      </div>
    </div>
  );
}
