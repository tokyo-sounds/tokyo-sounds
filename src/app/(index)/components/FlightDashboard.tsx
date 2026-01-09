"use client";

import Minimap from "./Minimap";
import Compass from "./Compass";
import CompassBar from "./CompassBar";
import AttitudeIndicator from "./AttitudeIndicator";
import InformationContainer from "./InformationContainer";
import TimeOfDayEffectsMenu from "./TimeOfDayEffectsMenu";
import { type PlaneControllerHandle } from "@/components/city/PlaneController";

import { type PlayerState } from "@/types/multiplayer";
import * as THREE from "three";
import { enuToLatLngAlt } from "@/lib/geo-utils";
import { TOKYO_CENTER } from "@/config/tokyo-config";

interface FlightDashboardProps {
  heading: number;
  speedoMeterSize: number;
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
  pitch: number;
  roll: number;
  cameraY: number;
  groundDistance: number | null;
  mapsApiKey: string;
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
  heading,
  speedoMeterSize,
  pitch,
  roll,
  cameraY,
  groundDistance,
  mapsApiKey,
  gyroState,
  planeControllerRef,
  isMobile,
  operationManualOpen,
  setOperationManualOpen,
  nearbyPlayers,
  localPlayerPosition,
}: FlightDashboardProps) {
  const coords = localPlayerPosition
    ? enuToLatLngAlt(
        localPlayerPosition,
        TOKYO_CENTER.lat,
        TOKYO_CENTER.lng,
        0
      )
    : null;

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
        nearbyPlayers={nearbyPlayers}
        localPlayerPosition={localPlayerPosition}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <AttitudeIndicator
          pitch={pitch}
          roll={roll}
          cameraY={cameraY}
          groundDistance={groundDistance}
          latitude={coords?.lat}
          longitude={coords?.lng}
        />
      </div>

      <div className="hidden md:block absolute top-18 left-4">
        <InformationContainer
          operationManualOpen={operationManualOpen}
          setOperationManualOpen={setOperationManualOpen}
        />
      </div>
      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 right-4 z-40">
        <TimeOfDayEffectsMenu />
      </div>
      <div className="hidden md:block absolute bottom-6 md:bottom-10 left-6 md:left-10">
        <Minimap
          heading={heading}
          size={speedoMeterSize}
          mapsApiKey={mapsApiKey}
          nearbyPlayers={nearbyPlayers}
          localPlayerPosition={localPlayerPosition}
        />
      </div>
    </div>
  );
}
