"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { type PlayerState } from "@/types/multiplayer";
import * as THREE from "three";
import { enuToLatLngAlt } from "@/lib/geo-utils";
import { TOKYO_CENTER } from "@/config/tokyo-config";

const PLAYER_ARROW_SIZE = 12;

const MAP_ZOOM_LEVEL = 16;

const ROTATION_LERP_FACTOR = 0.15;

function getMetersPerPixel(latitude: number, zoom: number): number {
  const earthCircumference = 40075016.686; // meters at equator
  const metersPerPixelAtEquator = earthCircumference / (256 * Math.pow(2, zoom));
  return metersPerPixelAtEquator * Math.cos((latitude * Math.PI) / 180);
}

function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

function lerpAngle(current: number, target: number, factor: number): number {
  let delta = normalizeAngle(target - current);
  return current + delta * factor;
}

interface MinimapProps {
  heading: number;
  size?: number;
  mapsApiKey: string;
  nearbyPlayers?: PlayerState[];
  localPlayerPosition?: THREE.Vector3;
}

function enuToCoords(position: THREE.Vector3): { lat: number; lng: number } {
  const coords = enuToLatLngAlt(position, TOKYO_CENTER.lat, TOKYO_CENTER.lng, 0);
  return { lat: coords.lat, lng: coords.lng };
}

function createArrowPath(
  cx: number,
  cy: number,
  size: number,
  rotation: number
): string {
  const tipY = cy - size * 0.6;
  const baseY = cy + size * 0.4;
  const halfWidth = size * 0.35;

  const points = [
    { x: cx, y: tipY }, // tip
    { x: cx - halfWidth, y: baseY }, // bottom left
    { x: cx + halfWidth, y: baseY }, // bottom right
  ];

  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotated = points.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  });

  return `M ${rotated[0].x} ${rotated[0].y} L ${rotated[1].x} ${rotated[1].y} L ${rotated[2].x} ${rotated[2].y} Z`;
}

export default function Minimap({
  heading,
  size = 200,
  mapsApiKey,
  nearbyPlayers,
  localPlayerPosition,
}: MinimapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const scriptLoadedRef = useRef(false);

  const rotatingMapRef = useRef<HTMLDivElement>(null);
  const playersOverlayRef = useRef<SVGSVGElement>(null);
  const cardinalDirectionsRef = useRef<HTMLDivElement>(null);

  const currentAngleRef = useRef(-heading);
  const targetAngleRef = useRef(-heading);
  const animationFrameRef = useRef<number | null>(null);
  const prevHeadingRef = useRef(heading);

  const centerCoords = useMemo(() => {
    if (localPlayerPosition) {
      return enuToCoords(localPlayerPosition);
    }
    return { lat: TOKYO_CENTER.lat, lng: TOKYO_CENTER.lng };
  }, [localPlayerPosition]);

  useEffect(() => {
    const prevHeading = prevHeadingRef.current;
    let delta = heading - prevHeading;

    delta = normalizeAngle(delta);

    targetAngleRef.current -= delta;
    prevHeadingRef.current = heading;
  }, [heading]);

  const animate = useCallback(() => {
    const current = currentAngleRef.current;
    const target = targetAngleRef.current;

    const newAngle = lerpAngle(current, target, ROTATION_LERP_FACTOR);
    currentAngleRef.current = newAngle;

    const transform = `rotate(${newAngle}deg)`;
    
    if (rotatingMapRef.current) {
      rotatingMapRef.current.style.transform = transform;
    }
    if (playersOverlayRef.current) {
      playersOverlayRef.current.style.transform = transform;
    }
    if (cardinalDirectionsRef.current) {
      cardinalDirectionsRef.current.style.transform = transform;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    if (!mapsApiKey || scriptLoadedRef.current) return;

    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializeMap();
      };
      script.onerror = () => {
        console.error("[Minimap] Failed to load Google Maps script");
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || googleMapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: centerCoords,
        zoom: MAP_ZOOM_LEVEL,
        disableDefaultUI: true,
        gestureHandling: "none",
        keyboardShortcuts: false,
        mapTypeId: "roadmap",
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#2d2d44" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1a1a2e" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#3d3d5c" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0e1626" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#252540" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#1a2e1a" }],
          },
          {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2d2d44" }],
          },
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      googleMapRef.current = map;
      setMapLoaded(true);
    };

    loadGoogleMaps();
  }, [mapsApiKey, centerCoords]);

  useEffect(() => {
    if (googleMapRef.current && mapLoaded) {
      googleMapRef.current.panTo(centerCoords);
    }
  }, [centerCoords, mapLoaded]);

  const playerMarkers = useMemo(() => {
    if (!nearbyPlayers || !localPlayerPosition || nearbyPlayers.length === 0) {
      return [];
    }

    const centerX = size / 2;
    const centerY = size / 2;
    const metersPerPixel = getMetersPerPixel(TOKYO_CENTER.lat, MAP_ZOOM_LEVEL);

    return nearbyPlayers
      .map((player) => {
        const dx = player.position.x - localPlayerPosition.x; // East offset
        const dz = player.position.z - localPlayerPosition.z; // South offset (negative = North)
        const pixelOffsetX = dx / metersPerPixel;
        const pixelOffsetY = dz / metersPerPixel; // +Z = South = down in screen
        const markerX = centerX + pixelOffsetX;
        const markerY = centerY + pixelOffsetY;
        const distanceFromCenter = Math.sqrt(pixelOffsetX * pixelOffsetX + pixelOffsetY * pixelOffsetY);
        if (distanceFromCenter > size * 0.7) {
          return null;
        }

        const arrowRotation = player.heading;

        return {
          id: player.id,
          color: player.color,
          name: player.name,
          x: markerX,
          y: markerY,
          rotation: arrowRotation,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      color: string;
      name: string;
      x: number;
      y: number;
      rotation: number;
    }>;
  }, [nearbyPlayers, localPlayerPosition, size]);

  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div
      className="relative rounded-full flight-dashboard-card font-mono drop-shadow-lg drop-shadow-black/50 overflow-hidden opacity-75"
      style={{ width: size, height: size }}
    >
      <div
        ref={rotatingMapRef}
        className="absolute inset-0 transform-gpu will-change-transform"
        style={{ transformOrigin: "center center" }}
      >
        <div
          ref={mapRef}
          className="absolute"
          style={{
            width: size * 1.5,
            height: size * 1.5,
            left: -size * 0.25,
            top: -size * 0.25,
          }}
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, transparent 0%, transparent ${
            (size / 2 - 2) / (size / 2) * 100
          }%, rgba(0,0,0,0.8) ${(size / 2 - 2) / (size / 2) * 100}%, rgba(0,0,0,1) 100%)`,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
      />

      <svg
        ref={playersOverlayRef}
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none transform-gpu will-change-transform"
        viewBox={`0 0 ${size} ${size}`}
        style={{ transformOrigin: "center center" }}
      >
        {playerMarkers.map((marker) => (
          <g key={marker.id}>
            <path
              d={createArrowPath(
                marker.x,
                marker.y,
                PLAYER_ARROW_SIZE + 2,
                marker.rotation
              )}
              fill={marker.color}
              opacity={0.3}
            />
            <path
              d={createArrowPath(
                marker.x,
                marker.y,
                PLAYER_ARROW_SIZE,
                marker.rotation
              )}
              fill={marker.color}
              stroke="rgba(0, 0, 0, 0.5)"
              strokeWidth={1}
            />
          </g>
        ))}
      </svg>

      <svg
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
      >
        <g>
          <path
            d={createArrowPath(centerX, centerY, PLAYER_ARROW_SIZE + 4, 0)}
            className="fill-primary"
            opacity={0.3}
          />
          <path
            d={createArrowPath(centerX, centerY, PLAYER_ARROW_SIZE + 2, 0)}
            className="fill-primary"
            stroke="rgba(0, 0, 0, 0.6)"
            strokeWidth={1.5}
          />
        </g>
      </svg>

      <div
        ref={cardinalDirectionsRef}
        className="absolute inset-0 pointer-events-none transform-gpu will-change-transform"
        style={{ transformOrigin: "center center" }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 6 }}
        >
          <span className="text-xs font-bold text-primary drop-shadow-md">N</span>
        </div>
        <div
          className="absolute"
          style={{
            top: size * 0.146,
            right: size * 0.146,
            transform: "translate(50%, -50%) rotate(45deg)",
          }}
        >
          <span className="text-[10px] font-medium text-muted-foreground/70 drop-shadow-md">NE</span>
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ right: 4, transform: "translateY(-50%) rotate(90deg)" }}
        >
          <span className="text-xs font-medium text-muted-foreground/80 drop-shadow-md">E</span>
        </div>
        <div
          className="absolute"
          style={{
            bottom: size * 0.146,
            right: size * 0.146,
            transform: "translate(50%, 50%) rotate(135deg)",
          }}
        >
          <span className="text-[10px] font-medium text-muted-foreground/70 drop-shadow-md">SE</span>
        </div>
        <div
          className="absolute left-1/2"
          style={{ bottom: 6, transform: "translateX(-50%) rotate(180deg)" }}
        >
          <span className="text-xs font-medium text-muted-foreground/80 drop-shadow-md">S</span>
        </div>
        <div
          className="absolute"
          style={{
            bottom: size * 0.146,
            left: size * 0.146,
            transform: "translate(-50%, 50%) rotate(225deg)",
          }}
        >
          <span className="text-[10px] font-medium text-muted-foreground/70 drop-shadow-md">SW</span>
        </div>
        <div
          className="absolute top-1/2"
          style={{ left: 4, transform: "translateY(-50%) rotate(270deg)" }}
        >
          <span className="text-xs font-medium text-muted-foreground/80 drop-shadow-md">W</span>
        </div>
        <div
          className="absolute"
          style={{
            top: size * 0.146,
            left: size * 0.146,
            transform: "translate(-50%, -50%) rotate(315deg)",
          }}
        >
          <span className="text-[10px] font-medium text-muted-foreground/70 drop-shadow-md">NW</span>
        </div>
      </div>

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-xs text-muted">Loading...</div>
        </div>
      )}
    </div>
  );
}
