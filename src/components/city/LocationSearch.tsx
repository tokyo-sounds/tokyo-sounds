"use client";

/**
 * LocationSearch Component
 * Dropdown search box that geocodes addresses and teleports the camera
 */

import { useState, useRef, useEffect, useCallback } from "react";

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

export function LocationSearch({ apiKey, onTeleport, disabled, minimal, dropdownPosition = "above", dropdownClassName }: LocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const geocodeAddress = useCallback(async (address: string): Promise<GeocodingResult | null> => {
    if (!address.trim()) return null;

    const bounds = "35.5,139.5|35.8,139.9"; // Tokyo bounding box
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&bounds=${bounds}&key=${apiKey}`;

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
  }, [apiKey]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
        setIsOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading, apiKey, geocodeAddress, onTeleport]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          ${minimal ? "w-6 h-6" : "w-10 h-10 rounded-lg border"} 
          flex items-center justify-center transition-all
          ${isOpen 
            ? "text-cyan-400" 
            : "text-white/70 hover:text-white"
          }
          ${!minimal && (isOpen 
            ? "bg-cyan-500/30 border-cyan-500/50" 
            : "bg-black/70 border-white/20 hover:border-white/40"
          )}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title="Search location"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={minimal ? "w-3.5 h-3.5" : "w-5 h-5"}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {isOpen && (
        <div className={`${dropdownClassName || `absolute ${dropdownPosition === "below" ? "top-8 left-1/2 -translate-x-1/2" : "bottom-12 left-0"}`} bg-black/70 rounded p-3 w-72 text-white text-xs font-mono z-50`}>
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter address or place..."
                className="flex-1 px-2 py-1.5 bg-white/10 rounded text-white text-xs font-mono placeholder-white/40 focus:outline-none focus:bg-white/15"
                disabled={isLoading}
                autoComplete="off"
                data-1p-ignore="true"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-2 py-1.5 bg-cyan-500/80 hover:bg-cyan-500 disabled:bg-white/10 disabled:cursor-not-allowed rounded text-white text-xs font-mono transition-colors"
              >
                {isLoading ? (
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Go"
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-2 text-red-400">
              {error}
            </div>
          )}

          {lastResult && !error && (
            <div className="mt-2 text-white/50 truncate">
              Last: {lastResult}
            </div>
          )}

          <div className="mt-2 text-white/30 text-[10px]">
            Press Enter to teleport
          </div>
        </div>
      )}
    </div>
  );
}
