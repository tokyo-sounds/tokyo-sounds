"use client";

/**
 * LocationSearch Component
 * Dropdown search box that geocodes addresses and teleports the camera
 */

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";

interface LocationSearchProps {
  apiKey: string;
  onTeleport: (lat: number, lng: number, alt: number) => void;
  disabled?: boolean;
  minimal?: boolean;
  dropdownPosition?: "above" | "below";
  dropdownClassName?: string;
}

interface GeocodingResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export function LocationSearch({
  apiKey,
  onTeleport,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const geocodeAddress = useCallback(
    async (address: string): Promise<GeocodingResult | null> => {
      if (!address.trim()) return null;

      const bounds = "35.5,139.5|35.8,139.9"; // Tokyo bounding box
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&bounds=${bounds}&key=${apiKey}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          return data.results[0];
        } else if (data.status === "ZERO_RESULTS") {
          throw new Error("No results found");
        } else if (data.status === "REQUEST_DENIED") {
          throw new Error("API key error - enable Geocoding API");
        } else {
          throw new Error(data.status || "Geocoding failed");
        }
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error("Network error");
      }
    },
    [apiKey]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || isLoading || !apiKey) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await geocodeAddress(query);
        if (result) {
          const { lat, lng } = result.geometry.location;
          onTeleport(lat, lng, 200);
          setLastResult(result.formatted_address);
          setQuery("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    },
    [query, isLoading, apiKey, geocodeAddress, onTeleport]
  );

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <InputGroup className="pr-2 border-border/40">
          <InputGroupInput
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="東京の地名を入力してテレポート"
            disabled={isLoading}
            autoComplete="off"
            data-1p-ignore="true"
            className="placeholder:text-muted/40 font-light tracking-loose"
          />
          <InputGroupButton
            type="submit"
            variant="ghost"
            disabled={isLoading || !query.trim()}
            className="bg-transparent hover:bg-muted/40 hover:text-white"
          >
            {isLoading ? (
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
          </InputGroupButton>
        </InputGroup>
      </form>

      {error && <div className="mt-2 text-red-400">{error}</div>}

      {lastResult && !error && (
        <div className="mt-2 text-white/50 truncate">Last: {lastResult}</div>
      )}

      <p className="mt-2 text-muted/50 text-xs text-center">
        シートベルトを締めて、いってらっしゃい！
      </p>
    </div>
  );
}
