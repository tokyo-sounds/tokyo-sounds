"use client";

import StatusBar from "./StatusBar";
import SpeedoMeter from "./SpeedoMeter";
import Compass from "./Compass";
import CompassBar from "./CompassBar";
import AttitudeIndicator from "./AttitudeIndicator";
import InformationContainer from "./InformationContainer";
import TimeOfDayEffectsMenu from "./TimeOfDayEffectsMenu";
import { type DemoState } from "@/hooks/useDemoFlythrough";
import { type PlaneControllerHandle } from "@/components/city/PlaneController";
import { type DistrictDebugInfo } from "@/components/city/DistrictLyriaAudio";

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
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
  multiplayerConnected?: boolean;
  playerCount?: number;
  pitch: number;
  roll: number;
  cameraY: number;
  mapsApiKey: string;
  handleTeleport: (lat: number, lng: number, alt: number) => void;
  demoState?: DemoState;
  gyroState: {
    isActive: boolean;
    isAvailable: boolean;
    isEnabled: boolean;
    needsPermission: boolean;
  };
  isMobile: boolean;
  planeControllerRef: React.RefObject<PlaneControllerHandle>;
  districts: DistrictDebugInfo[];
  districtDebugCollapsed: boolean;
  setDistrictDebugCollapsed: (collapsed: boolean) => void;
}

export default function FlightDashboard({
  flightSpeed,
  heading,
  speedoMeterSize,
  generativeEnabled,
  lyriaStatus,
  spatialAudioEnabled,
  spatialAudioStats,
  pitch,
  roll,
  cameraY,
  mapsApiKey,
  handleTeleport,
  demoState,
  gyroState,
  planeControllerRef,
  playerCount,
  multiplayerConnected,
  isMobile,
  operationManualOpen,
  setOperationManualOpen,
  districts,
  districtDebugCollapsed,
  setDistrictDebugCollapsed,
}: FlightDashboardProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
      <CompassBar
        heading={heading}
        pitch={pitch}
        roll={roll}
        apiKey={mapsApiKey}
        onTeleport={handleTeleport}
        searchDisabled={demoState?.active}
        isGyroActive={gyroState.isActive}
        isGyroEnabled={gyroState.isEnabled}
        isGyroAvailable={gyroState.isAvailable}
        isMobile={isMobile}
        onRecalibrateGyro={() => planeControllerRef.current?.recalibrateGyro()}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <AttitudeIndicator pitch={pitch} roll={roll} cameraY={cameraY} />
      </div>
      <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2">
        <StatusBar
          generativeEnabled={generativeEnabled}
          lyriaStatus={lyriaStatus}
          spatialAudioEnabled={spatialAudioEnabled}
          spatialAudioStats={spatialAudioStats}
          pitch={pitch}
          roll={roll}
          multiplayerConnected={multiplayerConnected}
          playerCount={playerCount}
        />
      </div>
      <div className="hidden md:block absolute top-1/5 left-4">
        <InformationContainer
          districts={districts}
          districtDebugCollapsed={districtDebugCollapsed}
          setDistrictDebugCollapsed={setDistrictDebugCollapsed}
          operationManualOpen={operationManualOpen}
          setOperationManualOpen={setOperationManualOpen}
          generativeEnabled={generativeEnabled}
        />
      </div>
      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 right-4">
        <TimeOfDayEffectsMenu />
      </div>
      <div className="hidden md:block absolute bottom-6 md:bottom-10 left-6 md:left-10">
        <SpeedoMeter flightSpeed={flightSpeed} size={speedoMeterSize} />
      </div>

      <div className="hidden md:block absolute bottom-6 md:bottom-10 right-6 md:right-10">
        <Compass heading={heading} size={speedoMeterSize} />
      </div>
    </div>
  );
}
