"use client";

import SpeedoMeter from "./SpeedoMeter";
import Compass from "./Compass";
import CompassBar from "./CompassBar";
import AttitudeIndicator from "./AttitudeIndicator";
import InformationContainer from "./InformationContainer";
import TimeOfDayEffectsMenu from "./TimeOfDayEffectsMenu";
import { type DemoState } from "@/hooks/useDemoFlythrough";
import { type PlaneControllerHandle } from "@/components/city/PlaneController";

import { type PlayerState } from "@/types/multiplayer";
import * as THREE from "three";

interface FlightDashboardProps {
  flightSpeed: number;
  heading: number;
  speedoMeterSize: number;
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
  pitch: number;
  roll: number;
  cameraY: number;
  groundDistance: number | null;
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
  nearbyPlayers?: PlayerState[];
  localPlayerPosition?: THREE.Vector3;
}

export default function FlightDashboard({
  flightSpeed,
  heading,
  speedoMeterSize,
  pitch,
  roll,
  cameraY,
  groundDistance,
  gyroState,
  planeControllerRef,
  isMobile,
  operationManualOpen,
  setOperationManualOpen,
  nearbyPlayers,
  localPlayerPosition,
}: FlightDashboardProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none select-none">
      <CompassBar
        heading={heading}
        pitch={pitch}
        roll={roll}
        isGyroActive={gyroState.isActive}
        isGyroEnabled={gyroState.isEnabled}
        isGyroAvailable={gyroState.isAvailable}
        isMobile={isMobile}
        onRecalibrateGyro={() => planeControllerRef.current?.recalibrateGyro()}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <AttitudeIndicator pitch={pitch} roll={roll} cameraY={cameraY} groundDistance={groundDistance} />
      </div>

      <div className="hidden md:block absolute top-18 left-4">
        <InformationContainer
          operationManualOpen={operationManualOpen}
          setOperationManualOpen={setOperationManualOpen}
        />
      </div>
      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 right-4">
        <TimeOfDayEffectsMenu />
      </div>
      <div className="hidden md:block absolute bottom-6 md:bottom-10 left-6 md:left-10">
        <SpeedoMeter flightSpeed={flightSpeed} size={speedoMeterSize} />
      </div>

      <div className="hidden md:block absolute bottom-6 md:bottom-10 right-6 md:right-10">
        <Compass
          heading={heading}
          size={speedoMeterSize}
          nearbyPlayers={nearbyPlayers}
          localPlayerPosition={localPlayerPosition}
        />
      </div>
    </div>
  );
}
