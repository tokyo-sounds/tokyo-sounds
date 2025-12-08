/**
 * Tokyo Configuration
 * District definitions (station-centered with radii), Lyria prompts, and coordinate settings
 */

export const TOKYO_CENTER = {
  lat: 35.6762,
  lng: 139.6503,
  alt: 500, // starting altitude in meters
};

// camera initial position (in ECEF coordinates, will be calculated from lat/lng)
export const INITIAL_CAMERA = {
  lat: 35.6915849, // Shinjuku area
  lng: 139.6943858,
  alt: 700,
};

// altitude bounds (meters)
export const ALTITUDE_BOUNDS = {
  min: 50,
  max: 2000,
};

// Earth radius in meters (WGS84)
export const EARTH_RADIUS = 6378137;

export interface District {
  id: string;
  name: string;
  nameJa: string;
  center: { lat: number; lng: number }; // station/landmark coordinates
  radius: number; // district radius in meters
  prompt: string;
  color: string;
}

// Districts centered on actual train station coordinates with realistic radii
export const TOKYO_DISTRICTS: District[] = [
  {
    id: "shinjuku",
    name: "Shinjuku",
    nameJa: "新宿",
    center: { lat: 35.6896, lng: 139.7006 }, // Shinjuku Station
    radius: 800,
    prompt: "Pulsing electronic beats, neon-soaked synths, late night Tokyo energy, Shinjuku nightlife vibes, dense urban soundscape with distant train announcements",
    color: "#ff00ff",
  },
  {
    id: "shibuya",
    name: "Shibuya",
    nameJa: "渋谷",
    center: { lat: 35.6580, lng: 139.7016 }, // Shibuya Station
    radius: 700,
    prompt: "Trendy J-pop influenced electronic, upbeat and youthful, Shibuya crossing energy, fashion district vibes, bright and colorful synth melodies",
    color: "#00ffff",
  },
  {
    id: "tokyo",
    name: "Tokyo Station",
    nameJa: "東京駅",
    center: { lat: 35.6812, lng: 139.7671 }, // Tokyo Station
    radius: 600,
    prompt: "Grand central station atmosphere, historic brick architecture echoes, bustling commuter energy, Marunouchi business district sophistication",
    color: "#dc143c",
  },
  {
    id: "ikebukuro",
    name: "Ikebukuro",
    nameJa: "池袋",
    center: { lat: 35.7295, lng: 139.7109 },  // Ikebukuro Station
    radius: 700,
    prompt: "Energetic arcade game inspired music, anime soundtrack vibes, playful chiptune elements, otaku culture energy, Ikebukuro night adventure",
    color: "#ffaa00",
  },
  {
    id: "ginza",
    name: "Ginza",
    nameJa: "銀座",
    center: { lat: 35.6717, lng: 139.7649 }, // Ginza Station
    radius: 500,
    prompt: "Sophisticated jazz lounge, upscale metropolitan elegance, smooth saxophone melodies, luxury shopping district ambiance, refined Tokyo nightlife",
    color: "#ffd700",
  },
  {
    id: "akihabara",
    name: "Akihabara",
    nameJa: "秋葉原",
    center: { lat: 35.6984, lng: 139.7731 }, // Akihabara Station
    radius: 500,
    prompt: "Intense 8-bit chiptune energy, electronic otaku paradise, anime theme song influences, bustling tech district sounds, neon electric atmosphere",
    color: "#ff6b6b",
  },
  {
    id: "asakusa",
    name: "Asakusa",
    nameJa: "浅草",
    center: { lat: 35.7148, lng: 139.7967 }, // Asakusa Station / Senso-ji
    radius: 600,
    prompt: "Traditional Japanese festival music, taiko drums, shamisen strings, temple bell resonance, old Edo atmosphere, nostalgic Tokyo heritage sounds",
    color: "#8b4513",
  },
  {
    id: "roppongi",
    name: "Roppongi",
    nameJa: "六本木",
    center: { lat: 35.6627, lng: 139.7313 }, // Roppongi Station
    radius: 500,
    prompt: "International nightclub beats, cosmopolitan electronic fusion, deep house grooves, sophisticated club atmosphere, Roppongi after dark energy",
    color: "#9400d3",
  },
  {
    id: "shinagawa",
    name: "Shinagawa",
    nameJa: "品川",
    center: { lat: 35.6284, lng: 139.7387 }, // Shinagawa Station
    radius: 600,
    prompt: "Shinkansen station energy, travel hub ambiance, modern transit sounds, business traveler atmosphere, gateway to Tokyo vibes",
    color: "#20b2aa",
  },
  {
    id: "ueno",
    name: "Ueno",
    nameJa: "上野",
    center: { lat: 35.7141, lng: 139.7774 }, // Ueno Station
    radius: 600,
    prompt: "Park and museum atmosphere, cultural heritage sounds, pandas and nature, Ameyoko market bustle, nostalgic shitamachi vibes",
    color: "#228b22",
  },
  {
    id: "harajuku",
    name: "Harajuku",
    nameJa: "原宿",
    center: { lat: 35.6702, lng: 139.7027 }, // Harajuku Station
    radius: 400,
    prompt: "Kawaii pop culture beats, colorful Takeshita street energy, youth fashion vibes, sweet and playful electronic melodies, Meiji shrine serenity nearby",
    color: "#ff69b4",
  },
  {
    id: "ebisu",
    name: "Ebisu",
    nameJa: "恵比寿",
    center: { lat: 35.6467, lng: 139.7101 }, // Ebisu Station
    radius: 400,
    prompt: "Trendy gastropub atmosphere, craft beer and jazz fusion, sophisticated nightlife, Yebisu garden place elegance, relaxed urban vibes",
    color: "#daa520",
  },
];

export const DEFAULT_DISTRICT_PROMPT = "Ambient Tokyo cityscape, gentle urban hum, distant traffic sounds, modern Japanese metropolis atmosphere, calm urban exploration";

// POI types to fetch from Places API for audio placement
export const AUDIO_POI_TYPES = [
  "train_station",
  "subway_station",
  "temple",
  "shrine",
  "shopping_mall",
  "department_store",
  "night_club",
  "bar",
  "restaurant",
  "cafe",
  "park",
  "museum",
  "tourist_attraction",
];

// audio file mappings for POI types
export const POI_AUDIO_MAPPINGS: Record<string, string[]> = {
  train_station: ["/audio/train-apraoching-ikebukuro.mp3", "/audio/bilingual-train-annoucement.mp3"],
  subway_station: ["/audio/train-apraoching-ikebukuro.mp3"],
  // temple: ["/audio/tokyo-street.mp3"], // TODO: Add temple audio
  // shrine: ["/audio/tokyo-street.mp3"], // TODO: Add shrine audio
  shopping_mall: ["/audio/tokyo-street.mp3"],
  default: ["/audio/tokyo-street.mp3"],
  // TODO: add the rest of the audio files
};

// Google Tiles API configuration
export const GOOGLE_TILES_CONFIG = {
  rootUrl: "https://tile.googleapis.com/v1/3dtiles/root.json",
  errorTarget: 12, // higher for photorealistic tiles
  maxDepth: 20,
};

// Places API configuration
export const PLACES_API_CONFIG = {
  radius: 1000, // Search radius in meters
  maxResults: 20,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
  minMovementForRefresh: 500, // Minimum movement (m) before refreshing POIs
};

