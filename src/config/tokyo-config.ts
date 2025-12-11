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
  prompt: string; // default/afternoon prompt
  promptMorning?: string; // calm, tranquil morning variant
  promptEvening?: string; // energetic, lively evening variant
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
    promptMorning: "Gentle ambient piano, early morning Shinjuku calm before the rush, soft synth pads, peaceful Tokyo dawn, quiet city awakening",
    promptEvening: "Intense neon-soaked electronic, pulsing Shinjuku nightlife energy, vibrant synth leads, bustling izakaya atmosphere, electric Tokyo night fever",
    color: "#ff00ff",
  },
  {
    id: "shibuya",
    name: "Shibuya",
    nameJa: "渋谷",
    center: { lat: 35.6580, lng: 139.7016 }, // Shibuya Station
    radius: 700,
    prompt: "Trendy J-pop influenced electronic, upbeat and youthful, Shibuya crossing energy, fashion district vibes, bright and colorful synth melodies",
    promptMorning: "Soft lo-fi beats, peaceful Shibuya morning, gentle acoustic guitar, calm before the crossing crowds, serene Tokyo sunrise",
    promptEvening: "High-energy J-pop dance beats, Shibuya 109 shopping fever, youthful electronic anthems, crowded crossing excitement, vibrant nighttime fashion scene",
    color: "#00ffff",
  },
  {
    id: "tokyo",
    name: "Tokyo Station",
    nameJa: "東京駅",
    center: { lat: 35.6812, lng: 139.7671 }, // Tokyo Station
    radius: 600,
    prompt: "Grand central station atmosphere, historic brick architecture echoes, bustling commuter energy, Marunouchi business district sophistication",
    promptMorning: "Contemplative orchestral strings, quiet Tokyo Station dawn, elegant piano, peaceful Marunouchi morning, refined early commuter ambiance",
    promptEvening: "Dramatic orchestral swells, rush hour energy, powerful brass and strings, busy station announcements, evening commuter symphony",
    color: "#dc143c",
  },
  {
    id: "ikebukuro",
    name: "Ikebukuro",
    nameJa: "池袋",
    center: { lat: 35.7295, lng: 139.7109 },  // Ikebukuro Station
    radius: 700,
    prompt: "Energetic arcade game inspired music, anime soundtrack vibes, playful chiptune elements, otaku culture energy, Ikebukuro night adventure",
    promptMorning: "Gentle chiptune lullaby, sleepy Ikebukuro morning, soft 8-bit melodies, quiet anime cafe ambiance, peaceful otaku dawn",
    promptEvening: "Intense arcade game soundtrack, blazing chiptune energy, anime battle theme vibes, crowded game center excitement, Ikebukuro night fever",
    color: "#ffaa00",
  },
  {
    id: "ginza",
    name: "Ginza",
    nameJa: "銀座",
    center: { lat: 35.6717, lng: 139.7649 }, // Ginza Station
    radius: 500,
    prompt: "Sophisticated jazz lounge, upscale metropolitan elegance, smooth saxophone melodies, luxury shopping district ambiance, refined Tokyo nightlife",
    promptMorning: "Delicate jazz piano solo, quiet Ginza morning elegance, soft brushed drums, peaceful luxury district awakening, refined sunrise ambiance",
    promptEvening: "Swinging jazz ensemble, lively Ginza cocktail hour, energetic saxophone solos, bustling upscale nightlife, champagne celebration vibes",
    color: "#ffd700",
  },
  {
    id: "akihabara",
    name: "Akihabara",
    nameJa: "秋葉原",
    center: { lat: 35.6984, lng: 139.7731 }, // Akihabara Station
    radius: 500,
    prompt: "Intense 8-bit chiptune energy, electronic otaku paradise, anime theme song influences, bustling tech district sounds, neon electric atmosphere",
    promptMorning: "Soft synth arpeggios, quiet Akihabara morning, gentle electronic hum, peaceful tech district dawn, calm before the crowds",
    promptEvening: "Maximum chiptune intensity, blazing Akihabara electric night, anime opening theme energy, crowded maid cafe excitement, neon sensory overload",
    color: "#ff6b6b",
  },
  {
    id: "asakusa",
    name: "Asakusa",
    nameJa: "浅草",
    center: { lat: 35.7148, lng: 139.7967 }, // Asakusa Station / Senso-ji
    radius: 600,
    prompt: "Traditional Japanese festival music, taiko drums, shamisen strings, temple bell resonance, old Edo atmosphere, nostalgic Tokyo heritage sounds",
    promptMorning: "Serene temple bells, peaceful Senso-ji dawn meditation, gentle shakuhachi flute, tranquil Asakusa morning prayers, spiritual Tokyo sunrise",
    promptEvening: "Lively matsuri festival drums, energetic Asakusa night market, cheerful shamisen melodies, lantern-lit celebration, traditional Tokyo nightlife",
    color: "#8b4513",
  },
  {
    id: "roppongi",
    name: "Roppongi",
    nameJa: "六本木",
    center: { lat: 35.6627, lng: 139.7313 }, // Roppongi Station
    radius: 500,
    prompt: "International nightclub beats, cosmopolitan electronic fusion, deep house grooves, sophisticated club atmosphere, Roppongi after dark energy",
    promptMorning: "Ambient downtempo, quiet Roppongi morning after, soft deep house pads, peaceful international district awakening, calm cosmopolitan dawn",
    promptEvening: "Peak-time club bangers, Roppongi nightclub fever, driving house beats, international party energy, VIP lounge excitement",
    color: "#9400d3",
  },
  {
    id: "shinagawa",
    name: "Shinagawa",
    nameJa: "品川",
    center: { lat: 35.6284, lng: 139.7387 }, // Shinagawa Station
    radius: 600,
    prompt: "Shinkansen station energy, travel hub ambiance, modern transit sounds, business traveler atmosphere, gateway to Tokyo vibes",
    promptMorning: "Gentle train platform ambiance, peaceful Shinagawa dawn, soft announcement chimes, quiet early commuter moments, serene travel hub morning",
    promptEvening: "Exciting Shinkansen departure energy, busy platform rush, dramatic travel anticipation, evening business class atmosphere, gateway to adventure",
    color: "#20b2aa",
  },
  {
    id: "ueno",
    name: "Ueno",
    nameJa: "上野",
    center: { lat: 35.7141, lng: 139.7774 }, // Ueno Station
    radius: 600,
    prompt: "Park and museum atmosphere, cultural heritage sounds, pandas and nature, Ameyoko market bustle, nostalgic shitamachi vibes",
    promptMorning: "Birdsong and gentle breeze, peaceful Ueno Park dawn, soft traditional instruments, quiet museum district awakening, serene nature sounds",
    promptEvening: "Lively Ameyoko market energy, bustling shitamachi nightlife, cheerful vendor calls, nostalgic evening atmosphere, old Tokyo charm",
    color: "#228b22",
  },
  {
    id: "harajuku",
    name: "Harajuku",
    nameJa: "原宿",
    center: { lat: 35.6702, lng: 139.7027 }, // Harajuku Station
    radius: 400,
    prompt: "Kawaii pop culture beats, colorful Takeshita street energy, youth fashion vibes, sweet and playful electronic melodies, Meiji shrine serenity nearby",
    promptMorning: "Gentle Meiji shrine forest ambiance, peaceful Harajuku dawn, soft wind through trees, tranquil morning meditation, serene nature escape",
    promptEvening: "Ultra-kawaii pop explosion, Takeshita street maximum energy, colorful fashion parade beats, sweet electronic candy rush, Harajuku night sparkle",
    color: "#ff69b4",
  },
  {
    id: "ebisu",
    name: "Ebisu",
    nameJa: "恵比寿",
    center: { lat: 35.6467, lng: 139.7101 }, // Ebisu Station
    radius: 400,
    prompt: "Trendy gastropub atmosphere, craft beer and jazz fusion, sophisticated nightlife, Yebisu garden place elegance, relaxed urban vibes",
    promptMorning: "Soft acoustic coffee shop vibes, quiet Ebisu morning, gentle bossa nova, peaceful garden place dawn, refined breakfast ambiance",
    promptEvening: "Lively gastropub jazz, Ebisu craft beer celebration, upbeat fusion grooves, sophisticated dinner party energy, trendy Tokyo nightlife",
    color: "#daa520",
  },
];

export const DEFAULT_DISTRICT_PROMPT = "Ambient Tokyo cityscape, gentle urban hum, distant traffic sounds, modern Japanese metropolis atmosphere, calm urban exploration";
export const DEFAULT_DISTRICT_PROMPT_MORNING = "Peaceful Tokyo dawn, soft ambient pads, gentle city awakening, tranquil urban morning, serene Japanese cityscape";
export const DEFAULT_DISTRICT_PROMPT_EVENING = "Vibrant Tokyo nightlife, energetic urban pulse, lively city sounds, exciting metropolitan evening, dynamic Japanese metropolis";

/**
 * Get the appropriate prompt for a district based on time of day
 */
export function getDistrictPrompt(district: District, timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "morning":
      return district.promptMorning || district.prompt;
    case "evening":
      return district.promptEvening || district.prompt;
    case "afternoon":
    default:
      return district.prompt;
  }
}

/**
 * Get the default prompt based on time of day
 */
export function getDefaultPrompt(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "morning":
      return DEFAULT_DISTRICT_PROMPT_MORNING;
    case "evening":
      return DEFAULT_DISTRICT_PROMPT_EVENING;
    case "afternoon":
    default:
      return DEFAULT_DISTRICT_PROMPT;
  }
}

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
  train_station: ["/audio/池袋/train-apraoching-ikebukuro.mp3", "/audio/池袋/bilingual-train-annoucement.mp3"],
  subway_station: ["/audio/池袋/train-apraoching-ikebukuro.mp3"],
  // temple: ["/audio/tokyo-street.mp3"], // TODO: Add temple audio
  // shrine: ["/audio/tokyo-street.mp3"], // TODO: Add shrine audio
  shopping_mall: ["/audio/tokyo-street.mp3"],
  default: ["/audio/tokyo-street.mp3"],
};

/**
 * Spatial audio source definition
 * Each source has a location (lat/lng) and an audio file to play
 */
export interface SpatialAudioSource {
  id: string;
  name: string;
  nameJa: string;
  lat: number;
  lng: number;
  alt: number;
  src: string;
  volume: number;
  refDistance: number;
  maxDistance: number;
  loop: boolean;
}

/**
 * All spatial audio sources for Tokyo
 * Placed at their corresponding real-world locations
 */
export const TOKYO_SPATIAL_AUDIO_SOURCES: SpatialAudioSource[] = [
  // === 池袋 (Ikebukuro) ===
  {
    id: "ikebukuro_station",
    name: "Ikebukuro Station",
    nameJa: "池袋駅",
    lat: 35.7295,
    lng: 139.7109,
    alt: 30,
    src: "/audio/池袋/ikebukuro_station.mp3",
    volume: 0.8,
    refDistance: 30,
    maxDistance: 400,
    loop: true,
  },
  {
    id: "ikebukuro_train_announcement",
    name: "Train Announcement",
    nameJa: "電車アナウンス",
    lat: 35.7298,
    lng: 139.7105,
    alt: 25,
    src: "/audio/池袋/bilingual-train-annoucement.mp3",
    volume: 0.7,
    refDistance: 20,
    maxDistance: 300,
    loop: true,
  },
  {
    id: "ikebukuro_train_approaching",
    name: "Train Approaching",
    nameJa: "電車接近",
    lat: 35.7292,
    lng: 139.7112,
    alt: 25,
    src: "/audio/池袋/train-apraoching-ikebukuro.mp3",
    volume: 0.7,
    refDistance: 25,
    maxDistance: 350,
    loop: true,
  },
  {
    id: "ikebukuro_gacha",
    name: "Gacha Machine",
    nameJa: "ガチャ",
    lat: 35.7288,
    lng: 139.7095,
    alt: 20,
    src: "/audio/池袋/ガチャ.m4a",
    volume: 0.6,
    refDistance: 15,
    maxDistance: 150,
    loop: true,
  },
  {
    id: "ikebukuro_game_center",
    name: "Game Center",
    nameJa: "ゲームセンター",
    lat: 35.7301,
    lng: 139.7098,
    alt: 25,
    src: "/audio/池袋/ゲームセンター.m4a",
    volume: 0.7,
    refDistance: 20,
    maxDistance: 200,
    loop: true,
  },
  {
    id: "ikebukuro_pachinko",
    name: "Pachinko",
    nameJa: "パチンコ",
    lat: 35.7305,
    lng: 139.7115,
    alt: 20,
    src: "/audio/池袋/パチンコ.m4a",
    volume: 0.7,
    refDistance: 20,
    maxDistance: 180,
    loop: true,
  },
  {
    id: "ikebukuro_bic_camera_1",
    name: "Bic Camera",
    nameJa: "ビックカメラ",
    lat: 35.7290,
    lng: 139.7120,
    alt: 30,
    src: "/audio/池袋/ビックカメラ 池袋カメラ・パソコン館.m4a",
    volume: 0.6,
    refDistance: 25,
    maxDistance: 250,
    loop: true,
  },
  {
    id: "ikebukuro_bic_camera_2",
    name: "Bic Camera 2",
    nameJa: "ビックカメラ２",
    lat: 35.7283,
    lng: 139.7102,
    alt: 30,
    src: "/audio/池袋/ビックカメラ 池袋カメラ・パソコン館 2.m4a",
    volume: 0.6,
    refDistance: 25,
    maxDistance: 250,
    loop: true,
  },
  {
    id: "ikebukuro_famima_1",
    name: "FamilyMart",
    nameJa: "ファミマ",
    lat: 35.7278,
    lng: 139.7108,
    alt: 15,
    src: "/audio/池袋/ファミマ.m4a",
    volume: 0.5,
    refDistance: 10,
    maxDistance: 100,
    loop: true,
  },
  {
    id: "ikebukuro_famima_2",
    name: "FamilyMart 2",
    nameJa: "ファミマ２",
    lat: 35.7310,
    lng: 139.7095,
    alt: 15,
    src: "/audio/池袋/ファミマ２.m4a",
    volume: 0.5,
    refDistance: 10,
    maxDistance: 100,
    loop: true,
  },
  {
    id: "ikebukuro_money_exchange",
    name: "Money Exchange",
    nameJa: "両替",
    lat: 35.7296,
    lng: 139.7118,
    alt: 20,
    src: "/audio/池袋/両替.m4a",
    volume: 0.5,
    refDistance: 12,
    maxDistance: 120,
    loop: true,
  },

  // === 秋葉原 (Akihabara) ===
  {
    id: "akihabara_train_departing",
    name: "Train Departing",
    nameJa: "電車発車",
    lat: 35.6984,
    lng: 139.7731,
    alt: 25,
    src: "/audio/秋葉原/akihabara_train_departing.mp3",
    volume: 0.7,
    refDistance: 25,
    maxDistance: 350,
    loop: true,
  },
  {
    id: "akihabara_train_entering_1",
    name: "Train Entering 1",
    nameJa: "電車到着１",
    lat: 35.6988,
    lng: 139.7735,
    alt: 25,
    src: "/audio/秋葉原/akihabara_train_entering.mp3",
    volume: 0.7,
    refDistance: 25,
    maxDistance: 350,
    loop: true,
  },
  {
    id: "akihabara_train_entering_2",
    name: "Train Entering 2",
    nameJa: "電車到着２",
    lat: 35.6980,
    lng: 139.7728,
    alt: 25,
    src: "/audio/秋葉原/akihabara_train_entering2.mp3",
    volume: 0.7,
    refDistance: 25,
    maxDistance: 350,
    loop: true,
  },
  {
    id: "akihabara_train_entering_3",
    name: "Train Entering 3",
    nameJa: "電車到着３",
    lat: 35.6992,
    lng: 139.7725,
    alt: 25,
    src: "/audio/秋葉原/akihabara_train_entering3.mp3",
    volume: 0.7,
    refDistance: 25,
    maxDistance: 350,
    loop: true,
  },
  {
    id: "akihabara_gacha",
    name: "Gacha Machine",
    nameJa: "ガチャ",
    lat: 35.6978,
    lng: 139.7740,
    alt: 20,
    src: "/audio/秋葉原/gacha.mp3",
    volume: 0.6,
    refDistance: 15,
    maxDistance: 150,
    loop: true,
  },

  // === 原宿 (Harajuku) ===
  {
    id: "harajuku_station",
    name: "Harajuku Station",
    nameJa: "原宿駅",
    lat: 35.6702,
    lng: 139.7027,
    alt: 25,
    src: "/audio/原宿/harajuku_station.mp3",
    volume: 0.7,
    refDistance: 25,
    maxDistance: 350,
    loop: true,
  },

  // === 中野 (Nakano) ===
  {
    id: "nakano_station",
    name: "Nakano Station",
    nameJa: "中野駅",
    lat: 35.7056,
    lng: 139.6656,
    alt: 25,
    src: "/audio/中野/中野站 东京 _ 中野站 北口前 90stereo_Freesound_[cut_12sec].mp3",
    volume: 0.7,
    refDistance: 25,
    maxDistance: 350,
    loop: true,
  },
  {
    id: "nakano_ramen",
    name: "Ramen Shop",
    nameJa: "ラーメン屋",
    lat: 35.7060,
    lng: 139.6662,
    alt: 15,
    src: "/audio/中野/ramenya_slurping.mp3",
    volume: 0.5,
    refDistance: 10,
    maxDistance: 100,
    loop: true,
  },

  // === General Tokyo (ambient) ===
  {
    id: "tokyo_street_shinjuku",
    name: "Tokyo Street (Shinjuku)",
    nameJa: "東京の街（新宿）",
    lat: 35.6896,
    lng: 139.7006,
    alt: 20,
    src: "/audio/tokyo-street.mp3",
    volume: 0.4,
    refDistance: 50,
    maxDistance: 500,
    loop: true,
  },
  {
    id: "tokyo_street_shibuya",
    name: "Tokyo Street (Shibuya)",
    nameJa: "東京の街（渋谷）",
    lat: 35.6580,
    lng: 139.7016,
    alt: 20,
    src: "/audio/tokyo-street.mp3",
    volume: 0.4,
    refDistance: 50,
    maxDistance: 500,
    loop: true,
  },
];

// Google Tiles API configuration
export const GOOGLE_TILES_CONFIG = {
  rootUrl: "https://tile.googleapis.com/v1/3dtiles/root.json",
  errorTarget: 12, // higher for photorealistic tiles
  maxDepth: 20,
};

export interface DemoWaypoint {
  id: string;
  name: string;
  nameJa: string;
  lat: number;
  lng: number;
  orbitAltitude: number; // meters above ground
  orbitRadius: number; // meters from center
  dwellTime: number; // seconds to orbit before moving on
  lookAtAltitude: number; // altitude of point to look at (ground level of landmark)
}

export const DEMO_WAYPOINTS: DemoWaypoint[] = [
  {
    id: "shinjuku",
    name: "Shinjuku Station",
    nameJa: "新宿駅",
    lat: 35.6896,
    lng: 139.7006,
    orbitAltitude: 150,
    orbitRadius: 200,
    dwellTime: 10,
    lookAtAltitude: 50,
  },
  {
    id: "shibuya",
    name: "Shibuya Station",
    nameJa: "渋谷駅",
    lat: 35.6580,
    lng: 139.7016,
    orbitAltitude: 150,
    orbitRadius: 200,
    dwellTime: 10,
    lookAtAltitude: 50,
  },
  {
    id: "tokyo-tower",
    name: "Tokyo Tower",
    nameJa: "東京タワー",
    lat: 35.6586,
    lng: 139.7454,
    orbitAltitude: 250, // Higher for the tower
    orbitRadius: 300,
    dwellTime: 10,
    lookAtAltitude: 150, // Look at mid-tower height
  },
  {
    id: "tokyo-station",
    name: "Tokyo Station",
    nameJa: "東京駅",
    lat: 35.6812,
    lng: 139.7671,
    orbitAltitude: 150,
    orbitRadius: 200,
    dwellTime: 10,
    lookAtAltitude: 50,
  },
  {
    id: "asakusa",
    name: "Asakusa",
    nameJa: "浅草",
    lat: 35.7148,
    lng: 139.7967,
    orbitAltitude: 150,
    orbitRadius: 200,
    dwellTime: 10,
    lookAtAltitude: 50,
  },
];

// Transition time between waypoints (seconds)
export const DEMO_TRANSITION_TIME = 5;

export const DEMO_VISITED_KEY = "tokyo-sounds-visited";

// Places API configuration
export const PLACES_API_CONFIG = {
  radius: 1000, // Search radius in meters
  maxResults: 20,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
  minMovementForRefresh: 500, // Minimum movement (m) before refreshing POIs
};

// Time of day system
export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface TimeOfDayPreset {
  id: TimeOfDay;
  name: string;
  nameJa: string;
  // Sun position (spherical coords)
  sunElevation: number; // degrees above horizon
  sunAzimuth: number; // degrees from north (clockwise)
  // Sky shader uniforms
  sky: {
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
  };
  // Light settings
  ambient: {
    intensity: number;
    color: string;
  };
  directional: {
    intensity: number;
    color: string;
  };
  hemisphere: {
    skyColor: string;
    groundColor: string;
    intensity: number;
  };
  // Material color multiplier (applied to tile textures)
  // Values < 1 darken, > 1 brighten, can tint with RGB
  colorMultiplier: {
    r: number;
    g: number;
    b: number;
  };
  // Fog settings
  fog: {
    color: string;
    near: number;
    far: number;
  };
}

export const TIME_OF_DAY_PRESETS: Record<TimeOfDay, TimeOfDayPreset> = {
  morning: {
    id: "morning",
    name: "Sunrise",
    nameJa: "日の出",
    sunElevation: 5, // Very low sun for dramatic sunrise
    sunAzimuth: 85, // East, slightly south
    sky: {
      turbidity: 2,
      rayleigh: 1,
      mieCoefficient: 0.0001, // Very small sun disc
      mieDirectionalG: 0.9999, // Very tight sun
    },
    ambient: {
      intensity: 0.15, // Low ambient to let directional dominate
      color: "#ff9966",
    },
    directional: {
      intensity: 3.0, // Strong directional for long shadows
      color: "#ff6622", // Deep orange sunrise
    },
    hemisphere: {
      skyColor: "#ff8844",
      groundColor: "#331100",
      intensity: 0.3,
    },
    colorMultiplier: {
      r: 1.3, // Strong orange bake
      g: 0.7,
      b: 0.4,
    },
    fog: {
      color: "#ff7744",
      near: 200,
      far: 3000,
    },
  },
  afternoon: {
    id: "afternoon",
    name: "Afternoon",
    nameJa: "午後",
    sunElevation: 45,
    sunAzimuth: 220, // Southwest
    sky: {
      turbidity: 2,
      rayleigh: 1,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
    },
    ambient: {
      intensity: 0.6,
      color: "#ffffff",
    },
    directional: {
      intensity: 2.0,
      color: "#fff5e6",
    },
    hemisphere: {
      skyColor: "#87CEEB",
      groundColor: "#8b7355",
      intensity: 0.5,
    },
    colorMultiplier: {
      r: 1.0,
      g: 1.0,
      b: 1.0,
    },
    fog: {
      color: "#a8c8e8",
      near: 500,
      far: 5000,
    },
  },
  evening: {
    id: "evening",
    name: "Sunset",
    nameJa: "日没",
    sunElevation: 3, // Very low sun on horizon for sunset
    sunAzimuth: 275, // West, slightly north
    sky: {
      turbidity: 2,
      rayleigh: 1,
      mieCoefficient: 0.0001, // Very small sun disc
      mieDirectionalG: 0.9999, // Very tight sun
    },
    ambient: {
      intensity: 0.12, // Very low ambient for dramatic contrast
      color: "#ff7733",
    },
    directional: {
      intensity: 3.5, // Very strong directional for long dramatic shadows
      color: "#ff4400", // Deep red-orange sunset
    },
    hemisphere: {
      skyColor: "#ff5500",
      groundColor: "#220800",
      intensity: 0.25,
    },
    colorMultiplier: {
      r: 1.4, // Very strong orange/red bake
      g: 0.6,
      b: 0.35,
    },
    fog: {
      color: "#dd5522",
      near: 150,
      far: 2500,
    },
  },
};

/**
 * Tokyo map bounds for random ambient audio placement
 */
export const TOKYO_MAP_BOUNDS = {
  minLat: 35.60,  // South boundary
  maxLat: 35.80,  // North boundary
  minLng: 139.60, // West boundary
  maxLng: 139.85, // East boundary
};

/**
 * Available ambient audio files for random distribution
 */
export const RANDOM_AMBIENT_AUDIO_POOL: string[] = [
  "/audio/tokyo-street.mp3",
  "/audio/池袋/train-apraoching-ikebukuro.mp3",
  "/audio/池袋/bilingual-train-annoucement.mp3",
  "/audio/池袋/ガチャ.m4a",
  "/audio/池袋/ゲームセンター.m4a",
  "/audio/秋葉原/akihabara_train_departing.mp3",
  "/audio/秋葉原/akihabara_train_entering.mp3",
  "/audio/秋葉原/gacha.mp3",
  "/audio/原宿/harajuku_station.mp3",
  "/audio/中野/中野站 东京 _ 中野站 北口前 90stereo_Freesound_[cut_12sec].mp3",
  "/audio/中野/ramenya_slurping.mp3",
];

/**
 * Configuration for random ambient audio distribution
 */
export interface RandomAmbientAudioConfig {
  count: number;              // Total number of random audio sources
  minDistance: number;        // Minimum distance between sources in meters
  refDistance: number;        // Reference distance for audio falloff
  maxDistance: number;        // Maximum distance for audio playback
  volume: number;             // Volume level (0-1)
  altitude: number;           // Base altitude in meters
  altitudeVariation: number;  // Altitude variation range in meters
}

/**
 * Default configuration for random ambient audio
 */
export const DEFAULT_RANDOM_AMBIENT_CONFIG: RandomAmbientAudioConfig = {
  count: 20,                  // 20 random ambient sources (reduced for memory efficiency)
  minDistance: 300,           // At least 300m apart
  refDistance: 100,            // Reference distance 100m
  maxDistance: 600,           // Max distance 600m (reduced)
  volume: 0.3,                // 30% volume
  altitude: 20,                // 20m above ground
  altitudeVariation: 10,      // ±10m variation
};

