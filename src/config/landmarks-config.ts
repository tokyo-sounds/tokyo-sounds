/**
 * Landmark Configuration
 * Icons and positions for notable Tokyo landmarks
 * Used in minimap, compass bar, and 3D floating icons
 */

export interface Landmark {
  id: string;
  name: string;
  nameJa: string;
  icon: string; // Path to icon image
  lat: number;
  lng: number;
  groundAlt: number; // Approximate ground altitude (meters)
}

/**
 * Tokyo Landmarks with their precise locations
 * Coordinates sourced from actual station/landmark positions
 */
export const TOKYO_LANDMARKS: Landmark[] = [
  {
    id: "akihabara",
    name: "Akihabara",
    nameJa: "秋葉原",
    icon: "/images/landmarks/akihabara.png",
    lat: 35.6984,
    lng: 139.7731,
    groundAlt: 5,
  },
  {
    id: "asakusa",
    name: "Asakusa",
    nameJa: "浅草",
    icon: "/images/landmarks/asakusa.png",
    lat: 35.7148,
    lng: 139.7967,
    groundAlt: 5,
  },
  {
    id: "hal",
    name: "HAL Tokyo",
    nameJa: "HAL東京",
    icon: "/images/landmarks/hal.png",
    lat: 35.6896,
    lng: 139.6982, // Near Shinjuku Station
    groundAlt: 5,
  },
  {
    id: "ikebukuro",
    name: "Ikebukuro",
    nameJa: "池袋",
    icon: "/images/landmarks/ikebukuro.png",
    lat: 35.7295,
    lng: 139.7109,
    groundAlt: 5,
  },
  {
    id: "meiji_jingu",
    name: "Meiji Shrine",
    nameJa: "明治神宮",
    icon: "/images/landmarks/meiji_jingu.png",
    lat: 35.6764,
    lng: 139.6993,
    groundAlt: 35,
  },
  {
    id: "odaiba_ferris_wheel",
    name: "Odaiba Ferris Wheel",
    nameJa: "お台場観覧車",
    icon: "/images/landmarks/odaiba_ferris_wheel.png",
    lat: 35.6262,
    lng: 139.7784,
    groundAlt: 5,
  },
  {
    id: "shibuya",
    name: "Shibuya",
    nameJa: "渋谷",
    icon: "/images/landmarks/shibuya.png",
    lat: 35.658,
    lng: 139.7016,
    groundAlt: 20,
  },
  {
    id: "shinjuku_station",
    name: "Shinjuku Station",
    nameJa: "新宿駅",
    icon: "/images/landmarks/shinjuku_station.png",
    lat: 35.6896,
    lng: 139.7006,
    groundAlt: 35,
  },
  {
    id: "skytree",
    name: "Tokyo Skytree",
    nameJa: "東京スカイツリー",
    icon: "/images/landmarks/skytree.png",
    lat: 35.7101,
    lng: 139.8107,
    groundAlt: 5,
  },
  {
    id: "tokyo_station",
    name: "Tokyo Station",
    nameJa: "東京駅",
    icon: "/images/landmarks/tokyo_station.png",
    lat: 35.6812,
    lng: 139.7671,
    groundAlt: 5,
  },
  {
    id: "tokyo_tower",
    name: "Tokyo Tower",
    nameJa: "東京タワー",
    icon: "/images/landmarks/tokyo_tower.png",
    lat: 35.6586,
    lng: 139.7454,
    groundAlt: 20,
  },
  {
    id: "yoyogi_gymnasium",
    name: "Yoyogi Gymnasium",
    nameJa: "代々木体育館",
    icon: "/images/landmarks/yoyogi_gymnasium.png",
    lat: 35.6672,
    lng: 139.6997,
    groundAlt: 35,
  },
];

// Visibility thresholds in meters
export const LANDMARK_VISIBILITY = {
  /** Distance at which landmark appears in compass bar (meters) */
  COMPASS_BAR_DISTANCE: 5000,
  /** Distance at which floating 3D icon appears (meters) */
  FLOATING_ICON_DISTANCE: 1500,
  /** Distance at which landmarks appear in minimap (meters) - always visible */
  MINIMAP_DISTANCE: Infinity,
};
