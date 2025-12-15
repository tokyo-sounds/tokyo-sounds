"use client";

import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";

interface VirtualControllerProps {
  /**
   * Whether the controller should be visible and active
   * @default true
   */
  enabled?: boolean;
}

type ActiveKey = "KeyW" | "KeyS" | "KeyA" | "KeyD" | "ShiftLeft" | null;

/**
 * VirtualController Component
 * Provides touch/pointer-based flight controls by dispatching synthetic keyboard events
 * - Top/Bottom edges: Pitch (W/S)
 * - Left/Right edges: Roll (A/D)
 * - Boost button: Speed boost (ShiftLeft)
 * - Center area: Freeze/Pause (Space - toggle)
 */
export default function VirtualController({
  enabled = true,
}: VirtualControllerProps) {
  const [activeKey, setActiveKey] = useState<ActiveKey>(null);
  const [boostActive, setBoostActive] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const activeKeyRef = useRef<ActiveKey>(null);
  const boostActiveRef = useRef(false);
  const spacePressedRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  useEffect(() => {
    boostActiveRef.current = boostActive;
  }, [boostActive]);

  useEffect(() => {
    spacePressedRef.current = spacePressed;
  }, [spacePressed]);

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

  // Release any active key
  const releaseActiveKey = () => {
    if (activeKeyRef.current) {
      dispatchKeyEvent("keyup", activeKeyRef.current);
      setActiveKey(null);
      activeKeyRef.current = null;
    }
  };

  // Release boost
  const releaseBoost = () => {
    if (boostActiveRef.current) {
      dispatchKeyEvent("keyup", "ShiftLeft");
      setBoostActive(false);
      boostActiveRef.current = false;
    }
  };

  // Determine which zone the pointer is in
  const getZoneType = (
    x: number,
    y: number,
    width: number,
    height: number
  ): "top" | "bottom" | "left" | "right" | "center" => {
    const edgeThreshold = 0.25; // 25% of screen
    const topZone = y < height * edgeThreshold;
    const bottomZone = y > height * (1 - edgeThreshold);
    const leftZone = x < width * edgeThreshold;
    const rightZone = x > width * (1 - edgeThreshold);

    // Check if click is in boost button area (bottom-right corner, excluding button itself)
    const boostButtonSize = 80; // w-20 h-20 = 80px
    const boostButtonMargin = 24; // bottom-6 right-6 = 24px
    const isInBoostArea =
      x > width - boostButtonSize - boostButtonMargin &&
      x < width - boostButtonMargin &&
      y > height - boostButtonSize - boostButtonMargin &&
      y < height - boostButtonMargin;

    // Priority: Pitch (top/bottom) over Roll (left/right)
    if (topZone) {
      return "top";
    } else if (bottomZone && !isInBoostArea) {
      return "bottom";
    } else if (leftZone) {
      return "left";
    } else if (rightZone && !isInBoostArea) {
      return "right";
    } else {
      return "center";
    }
  };

  // Handle pointer down on edge zones or center area
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!enabled) return;

    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const zoneType = getZoneType(x, y, width, height);

    switch (zoneType) {
      case "top":
        releaseActiveKey();
        dispatchKeyEvent("keydown", "KeyW");
        setActiveKey("KeyW");
        break;

      case "bottom":
        releaseActiveKey();
        dispatchKeyEvent("keydown", "KeyS");
        setActiveKey("KeyS");
        break;

      case "left":
        releaseActiveKey();
        dispatchKeyEvent("keydown", "KeyA");
        setActiveKey("KeyA");
        break;

      case "right":
        releaseActiveKey();
        dispatchKeyEvent("keydown", "KeyD");
        setActiveKey("KeyD");
        break;

      case "center":
        // Center area - toggle freeze (Space key)
        // Space keydown toggles freeze in elytra mode
        if (!spacePressedRef.current) {
          dispatchKeyEvent("keydown", "Space");
          setSpacePressed(true);
          spacePressedRef.current = true;
        }
        break;

      default:
        // Should never reach here, but TypeScript requires exhaustive check
        break;
    }
  };

  // Handle pointer up
  const handlePointerUp = () => {
    releaseActiveKey();
    // Release Space if it was pressed
    if (spacePressedRef.current) {
      dispatchKeyEvent("keyup", "Space");
      setSpacePressed(false);
      spacePressedRef.current = false;
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
      releaseActiveKey();
      releaseBoost();
      // Release Space if pressed
      if (spacePressedRef.current) {
        dispatchKeyEvent("keyup", "Space");
        setSpacePressed(false);
        spacePressedRef.current = false;
      }
    };

    const handleGlobalPointerCancel = () => {
      releaseActiveKey();
      releaseBoost();
      // Release Space if pressed
      if (spacePressedRef.current) {
        dispatchKeyEvent("keyup", "Space");
        setSpacePressed(false);
        spacePressedRef.current = false;
      }
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
      releaseActiveKey();
      releaseBoost();
      // Release Space if pressed
      if (spacePressedRef.current) {
        dispatchKeyEvent("keyup", "Space");
        setSpacePressed(false);
        spacePressedRef.current = false;
      }
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 z-40 touch-none pointer-events-auto"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Boost Button - Bottom Right */}
      <button
        className="absolute bottom-6 right-6 size-20 rounded-full flight-dashboard-card flex items-center justify-center text-white font-semibold text-sm shadow-lg active:bg-white/30 active:scale-95 transition-all select-none z-50"
        onPointerDown={handleBoostPointerDown}
        onPointerUp={handleBoostPointerUp}
        onPointerCancel={handleBoostPointerUp}
        aria-label="Boost"
      >
        <Rocket strokeWidth={1.8} className="size-8" />
      </button>
    </div>
  );
}
