"use client";

import { useEffect, useRef, useState } from "react";
import {
  Rocket,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface VirtualControllerProps {
  /**
   * Whether the controller should be visible and active
   * @default true
   */
  enabled?: boolean;
}

/**
 * VirtualController Component
 * Provides touch/pointer-based flight controls by dispatching synthetic keyboard events
 * - Up/Down buttons: Pitch (W/S)
 * - Left/Right buttons: Roll (A/D)
 * - Boost button: Speed boost (ShiftLeft)
 */
export default function VirtualController({
  enabled = true,
}: VirtualControllerProps) {
  const [upActive, setUpActive] = useState(false);
  const [downActive, setDownActive] = useState(false);
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);
  const [boostActive, setBoostActive] = useState(false);
  const upActiveRef = useRef(false);
  const downActiveRef = useRef(false);
  const leftActiveRef = useRef(false);
  const rightActiveRef = useRef(false);
  const boostActiveRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    upActiveRef.current = upActive;
  }, [upActive]);

  useEffect(() => {
    downActiveRef.current = downActive;
  }, [downActive]);

  useEffect(() => {
    leftActiveRef.current = leftActive;
  }, [leftActive]);

  useEffect(() => {
    rightActiveRef.current = rightActive;
  }, [rightActive]);

  useEffect(() => {
    boostActiveRef.current = boostActive;
  }, [boostActive]);

  // Dispatch synthetic keyboard event
  const dispatchKeyEvent = (
    type: "keydown" | "keyup",
    code: string,
    preventDefault = true
  ) => {
    const event = new KeyboardEvent(type, {
      code,
      key: code,
      bubbles: true,
      cancelable: true,
    });

    if (preventDefault) {
      event.preventDefault();
    }

    window.dispatchEvent(event);
  };

  // Release boost
  const releaseBoost = () => {
    if (boostActiveRef.current) {
      dispatchKeyEvent("keyup", "ShiftLeft");
      setBoostActive(false);
      boostActiveRef.current = false;
    }
  };

  // Handle control button pointer down
  const handleControlPointerDown = (
    keyCode: "KeyW" | "KeyS" | "KeyA" | "KeyD"
  ) => {
    if (!enabled) return;

    dispatchKeyEvent("keydown", keyCode);

    switch (keyCode) {
      case "KeyW":
        setUpActive(true);
        break;
      case "KeyS":
        setDownActive(true);
        break;
      case "KeyA":
        setLeftActive(true);
        break;
      case "KeyD":
        setRightActive(true);
        break;
    }
  };

  // Handle control button pointer up
  const handleControlPointerUp = (
    keyCode: "KeyW" | "KeyS" | "KeyA" | "KeyD"
  ) => {
    dispatchKeyEvent("keyup", keyCode);

    switch (keyCode) {
      case "KeyW":
        setUpActive(false);
        break;
      case "KeyS":
        setDownActive(false);
        break;
      case "KeyA":
        setLeftActive(false);
        break;
      case "KeyD":
        setRightActive(false);
        break;
    }
  };

  // Handle boost button pointer down
  const handleBoostPointerDown = (e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering edge zone detection
    dispatchKeyEvent("keydown", "ShiftLeft");
    setBoostActive(true);
  };

  // Handle boost button pointer up
  const handleBoostPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation(); // Prevent triggering edge zone detection
    releaseBoost();
  };

  // Global pointer up/cancel handler to prevent stuck keys
  useEffect(() => {
    if (!enabled) return;

    const handleGlobalPointerUp = () => {
      if (upActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyW");
        setUpActive(false);
      }
      if (downActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyS");
        setDownActive(false);
      }
      if (leftActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyA");
        setLeftActive(false);
      }
      if (rightActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyD");
        setRightActive(false);
      }
      releaseBoost();
    };

    const handleGlobalPointerCancel = () => {
      if (upActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyW");
        setUpActive(false);
      }
      if (downActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyS");
        setDownActive(false);
      }
      if (leftActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyA");
        setLeftActive(false);
      }
      if (rightActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyD");
        setRightActive(false);
      }
      releaseBoost();
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerCancel);

    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerCancel);
    };
  }, [enabled]);

  // Cleanup on unmount or disable
  useEffect(() => {
    if (!enabled) {
      if (upActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyW");
        setUpActive(false);
      }
      if (downActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyS");
        setDownActive(false);
      }
      if (leftActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyA");
        setLeftActive(false);
      }
      if (rightActiveRef.current) {
        dispatchKeyEvent("keyup", "KeyD");
        setRightActive(false);
      }
      releaseBoost();
    }
  }, [enabled]);

  if (!enabled) return null;

  // ControlButton component - transparent until pressed
  const ControlButton = ({
    icon: Icon,
    keyCode,
    position,
    iconPosition,
    ariaLabel,
  }: {
    icon: React.ComponentType<{ strokeWidth?: number; className?: string }>;
    keyCode: "KeyW" | "KeyS" | "KeyA" | "KeyD";
    position: string;
    iconPosition?: string;
    ariaLabel: string;
  }) => {
    const isActive =
      (keyCode === "KeyW" && upActive) ||
      (keyCode === "KeyS" && downActive) ||
      (keyCode === "KeyA" && leftActive) ||
      (keyCode === "KeyD" && rightActive);

    return (
      <button
        className={`absolute ${position} size-60 rounded-full flight-dashboard-card flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-white active:bg-white/30 active:scale-95 transition-all select-none z-40 pointer-events-auto ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleControlPointerDown(keyCode);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleControlPointerUp(keyCode);
        }}
        onPointerCancel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleControlPointerUp(keyCode);
        }}
        aria-label={ariaLabel}
      >
        <Icon strokeWidth={1.2} className={`size-12 ${iconPosition}`} />
      </button>
    );
  };

  return (
    <div className="absolute inset-0 z-0 touch-none pointer-events-none select-none">
      {/* Up Button - Top Center */}
      <ControlButton
        icon={ChevronUp}
        keyCode="KeyW"
        position="top-0 -translate-y-3/5 left-1/2 -translate-x-1/2"
        iconPosition="translate-y-full"
        ariaLabel="Pitch Up"
      />

      {/* Down Button - Bottom Center (adjusted to avoid dashboard) */}
      <ControlButton
        icon={ChevronDown}
        keyCode="KeyS"
        position="bottom-0 translate-y-3/5 left-1/2 -translate-x-1/2"
        iconPosition="-translate-y-full"
        ariaLabel="Pitch Down"
      />

      {/* Left Button - Middle Left */}
      <ControlButton
        icon={ChevronLeft}
        keyCode="KeyA"
        position="left-0 -translate-x-3/5 top-1/2 -translate-y-1/2"
        iconPosition="translate-x-full"
        ariaLabel="Roll Left"
      />

      {/* Right Button - Middle Right */}
      <ControlButton
        icon={ChevronRight}
        keyCode="KeyD"
        position="right-0 translate-x-3/5 top-1/2 -translate-y-1/2"
        iconPosition="-translate-x-full"
        ariaLabel="Roll Right"
      />

      {/* Boost Button - Bottom Right */}
      <button
        className="absolute bottom-6 right-6 size-20 md:size-15 rounded-full flight-dashboard-card flex items-center justify-center text-white font-semibold text-sm shadow-lg active:bg-white/30 active:scale-95 active:shadow-white transition-all select-none pointer-events-auto z-50"
        onPointerDown={handleBoostPointerDown}
        onPointerUp={handleBoostPointerUp}
        onPointerCancel={handleBoostPointerUp}
        aria-label="Boost"
      >
        <Rocket strokeWidth={1.8} className="size-8 md:size-6" />
      </button>
    </div>
  );
}
