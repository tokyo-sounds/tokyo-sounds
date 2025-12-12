/**
 * Tokyo Configuration
 * District definitions (station-centered with radii), Lyria prompts, and coordinate settings
 */
import { LucideIcon } from "lucide-react";
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
    prompt:
      "Pulsing electronic beats, neon-soaked synths, late night Tokyo energy, Shinjuku nightlife vibes, dense urban soundscape with distant train announcements",
    promptMorning:
      "Gentle ambient piano, early morning Shinjuku calm before the rush, soft synth pads, peaceful Tokyo dawn, quiet city awakening",
    promptEvening:
      "Intense neon-soaked electronic, pulsing Shinjuku nightlife energy, vibrant synth leads, bustling izakaya atmosphere, electric Tokyo night fever",
    color: "#ff00ff",
  },
  {
    id: "shibuya",
    name: "Shibuya",
    nameJa: "渋谷",
    center: { lat: 35.658, lng: 139.7016 }, // Shibuya Station
    radius: 700,
    prompt:
      "Trendy J-pop influenced electronic, upbeat and youthful, Shibuya crossing energy, fashion district vibes, bright and colorful synth melodies",
    promptMorning:
      "Soft lo-fi beats, peaceful Shibuya morning, gentle acoustic guitar, calm before the crossing crowds, serene Tokyo sunrise",
    promptEvening:
      "High-energy J-pop dance beats, Shibuya 109 shopping fever, youthful electronic anthems, crowded crossing excitement, vibrant nighttime fashion scene",
    color: "#00ffff",
  },
  {
    id: "tokyo",
    name: "Tokyo Station",
    nameJa: "東京駅",
    center: { lat: 35.6812, lng: 139.7671 }, // Tokyo Station
    radius: 600,
    prompt:
      "Grand central station atmosphere, historic brick architecture echoes, bustling commuter energy, Marunouchi business district sophistication",
    promptMorning:
      "Contemplative orchestral strings, quiet Tokyo Station dawn, elegant piano, peaceful Marunouchi morning, refined early commuter ambiance",
    promptEvening:
      "Dramatic orchestral swells, rush hour energy, powerful brass and strings, busy station announcements, evening commuter symphony",
    color: "#dc143c",
  },
  {
    id: "ikebukuro",
    name: "Ikebukuro",
    nameJa: "池袋",
    center: { lat: 35.7295, lng: 139.7109 }, // Ikebukuro Station
    radius: 700,
    prompt:
      "Energetic arcade game inspired music, anime soundtrack vibes, playful chiptune elements, otaku culture energy, Ikebukuro night adventure",
    promptMorning:
      "Gentle chiptune lullaby, sleepy Ikebukuro morning, soft 8-bit melodies, quiet anime cafe ambiance, peaceful otaku dawn",
    promptEvening:
      "Intense arcade game soundtrack, blazing chiptune energy, anime battle theme vibes, crowded game center excitement, Ikebukuro night fever",
    color: "#ffaa00",
  },
  {
    id: "ginza",
    name: "Ginza",
    nameJa: "銀座",
    center: { lat: 35.6717, lng: 139.7649 }, // Ginza Station
    radius: 500,
    prompt:
      "Sophisticated jazz lounge, upscale metropolitan elegance, smooth saxophone melodies, luxury shopping district ambiance, refined Tokyo nightlife",
    promptMorning:
      "Delicate jazz piano solo, quiet Ginza morning elegance, soft brushed drums, peaceful luxury district awakening, refined sunrise ambiance",
    promptEvening:
      "Swinging jazz ensemble, lively Ginza cocktail hour, energetic saxophone solos, bustling upscale nightlife, champagne celebration vibes",
    color: "#ffd700",
  },
  {
    id: "akihabara",
    name: "Akihabara",
    nameJa: "秋葉原",
    center: { lat: 35.6984, lng: 139.7731 }, // Akihabara Station
    radius: 500,
    prompt:
      "Intense 8-bit chiptune energy, electronic otaku paradise, anime theme song influences, bustling tech district sounds, neon electric atmosphere",
    promptMorning:
      "Soft synth arpeggios, quiet Akihabara morning, gentle electronic hum, peaceful tech district dawn, calm before the crowds",
    promptEvening:
      "Maximum chiptune intensity, blazing Akihabara electric night, anime opening theme energy, crowded maid cafe excitement, neon sensory overload",
    color: "#ff6b6b",
  },
  {
    id: "asakusa",
    name: "Asakusa",
    nameJa: "浅草",
    center: { lat: 35.7148, lng: 139.7967 }, // Asakusa Station / Senso-ji
    radius: 600,
    prompt:
      "Traditional Japanese festival music, taiko drums, shamisen strings, temple bell resonance, old Edo atmosphere, nostalgic Tokyo heritage sounds",
    promptMorning:
      "Serene temple bells, peaceful Senso-ji dawn meditation, gentle shakuhachi flute, tranquil Asakusa morning prayers, spiritual Tokyo sunrise",
    promptEvening:
      "Lively matsuri festival drums, energetic Asakusa night market, cheerful shamisen melodies, lantern-lit celebration, traditional Tokyo nightlife",
    color: "#8b4513",
  },
  {
    id: "roppongi",
    name: "Roppongi",
    nameJa: "六本木",
    center: { lat: 35.6627, lng: 139.7313 }, // Roppongi Station
    radius: 500,
    prompt:
      "International nightclub beats, cosmopolitan electronic fusion, deep house grooves, sophisticated club atmosphere, Roppongi after dark energy",
    promptMorning:
      "Ambient downtempo, quiet Roppongi morning after, soft deep house pads, peaceful international district awakening, calm cosmopolitan dawn",
    promptEvening:
      "Peak-time club bangers, Roppongi nightclub fever, driving house beats, international party energy, VIP lounge excitement",
    color: "#9400d3",
  },
  {
    id: "shinagawa",
    name: "Shinagawa",
    nameJa: "品川",
    center: { lat: 35.6284, lng: 139.7387 }, // Shinagawa Station
    radius: 600,
    prompt:
      "Shinkansen station energy, travel hub ambiance, modern transit sounds, business traveler atmosphere, gateway to Tokyo vibes",
    promptMorning:
      "Gentle train platform ambiance, peaceful Shinagawa dawn, soft announcement chimes, quiet early commuter moments, serene travel hub morning",
    promptEvening:
      "Exciting Shinkansen departure energy, busy platform rush, dramatic travel anticipation, evening business class atmosphere, gateway to adventure",
    color: "#20b2aa",
  },
  {
    id: "ueno",
    name: "Ueno",
    nameJa: "上野",
    center: { lat: 35.7141, lng: 139.7774 }, // Ueno Station
    radius: 600,
    prompt:
      "Park and museum atmosphere, cultural heritage sounds, pandas and nature, Ameyoko market bustle, nostalgic shitamachi vibes",
    promptMorning:
      "Birdsong and gentle breeze, peaceful Ueno Park dawn, soft traditional instruments, quiet museum district awakening, serene nature sounds",
    promptEvening:
      "Lively Ameyoko market energy, bustling shitamachi nightlife, cheerful vendor calls, nostalgic evening atmosphere, old Tokyo charm",
    color: "#228b22",
  },
  {
    id: "harajuku",
    name: "Harajuku",
    nameJa: "原宿",
    center: { lat: 35.6702, lng: 139.7027 }, // Harajuku Station
    radius: 400,
    prompt:
      "Kawaii pop culture beats, colorful Takeshita street energy, youth fashion vibes, sweet and playful electronic melodies, Meiji shrine serenity nearby",
    promptMorning:
      "Gentle Meiji shrine forest ambiance, peaceful Harajuku dawn, soft wind through trees, tranquil morning meditation, serene nature escape",
    promptEvening:
      "Ultra-kawaii pop explosion, Takeshita street maximum energy, colorful fashion parade beats, sweet electronic candy rush, Harajuku night sparkle",
    color: "#ff69b4",
  },
  {
    id: "ebisu",
    name: "Ebisu",
    nameJa: "恵比寿",
    center: { lat: 35.6467, lng: 139.7101 }, // Ebisu Station
    radius: 400,
    prompt:
      "Trendy gastropub atmosphere, craft beer and jazz fusion, sophisticated nightlife, Yebisu garden place elegance, relaxed urban vibes",
    promptMorning:
      "Soft acoustic coffee shop vibes, quiet Ebisu morning, gentle bossa nova, peaceful garden place dawn, refined breakfast ambiance",
    promptEvening:
      "Lively gastropub jazz, Ebisu craft beer celebration, upbeat fusion grooves, sophisticated dinner party energy, trendy Tokyo nightlife",
    color: "#daa520",
  },
  {
    id: "okubo",
    name: "Okubo",
    nameJa: "大久保",
    center: { lat: 35.7008, lng: 139.7003 }, // Okubo Station
    radius: 500,
    prompt:
      "Multicultural Asian fusion beats, Korean and Thai restaurant vibes, diverse street food energy, international community atmosphere, warm and welcoming urban soundscape",
    promptMorning:
      "Gentle morning market sounds, peaceful Okubo dawn, soft Asian instrumental melodies, quiet multicultural neighborhood awakening, serene breakfast ambiance",
    promptEvening:
      "Lively Asian street food festival energy, bustling Korean and Thai restaurant atmosphere, vibrant multicultural nightlife, diverse community celebration, warm evening gathering vibes",
    color: "#ff8c00",
  },
  {
    id: "shin-okubo",
    name: "Shin-Okubo",
    nameJa: "新大久保",
    center: { lat: 35.7012, lng: 139.7005 }, // Shin-Okubo Station
    radius: 500,
    prompt:
      "K-pop influenced electronic beats, Korean town energy, vibrant K-POP culture vibes, Seoul street atmosphere in Tokyo, dynamic Korean nightlife sounds",
    promptMorning:
      "Soft K-pop ballad vibes, quiet Shin-Okubo morning, gentle Korean cafe ambiance, peaceful Korea town dawn, serene breakfast atmosphere",
    promptEvening:
      "High-energy K-pop dance beats, Shin-Okubo Korea town nightlife explosion, vibrant K-POP club energy, crowded Korean restaurant excitement, electric Seoul-in-Tokyo night fever",
    color: "#ff1493",
  },
  {
    id: "nakano",
    name: "Nakano",
    nameJa: "中野",
    center: { lat: 35.7056, lng: 139.6656 }, // Nakano Station
    radius: 600,
    prompt:
      "Retro anime soundtrack vibes, Nakano Broadway otaku paradise, nostalgic chiptune and synthwave fusion, vintage game center energy, classic anime culture atmosphere",
    promptMorning:
      "Gentle retro game music, peaceful Nakano Broadway morning, soft 8-bit lullaby, quiet otaku district awakening, serene anime cafe ambiance",
    promptEvening:
      "Intense anime opening theme energy, blazing Nakano Broadway nightlife, maximum chiptune intensity, crowded game center and anime shop excitement, nostalgic otaku night adventure",
    color: "#9370db",
  },
  {
    id: "yoyogi",
    name: "Yoyogi",
    nameJa: "代々木",
    center: { lat: 35.6831, lng: 139.702 }, // Yoyogi Station
    radius: 500,
    prompt:
      "Nature-meets-urban electronic fusion, Meiji Shrine tranquility meets city energy, peaceful park ambiance with modern beats, green oasis in the metropolis, balanced urban-natural soundscape",
    promptMorning:
      "Serene forest meditation sounds, peaceful Yoyogi Park dawn, gentle bird songs with soft synth pads, tranquil Meiji Shrine morning prayers, calm nature escape in the city",
    promptEvening:
      "Lively park gathering energy, Yoyogi evening festival vibes, nature sounds blending with urban beats, Meiji Shrine lantern-lit atmosphere, vibrant green space nightlife",
    color: "#32cd32",
  },
  {
    id: "takanawa-gateway",
    name: "Takanawa Gateway",
    nameJa: "高輪ゲートウェイ",
    center: { lat: 35.6285, lng: 139.7389 }, // Takanawa Gateway Station
    radius: 500,
    prompt:
      "Futuristic electronic soundscape, cutting-edge architecture ambiance, modern transit hub energy, sleek glass and steel atmosphere, next-generation Tokyo vibes",
    promptMorning:
      "Gentle ambient tech sounds, peaceful Takanawa Gateway dawn, soft digital chimes, quiet modern station awakening, serene futuristic morning",
    promptEvening:
      "Dynamic electronic pulse, Takanawa Gateway night energy, vibrant LED-lit architecture, bustling modern transit hub, electric future city atmosphere",
    color: "#00ced1",
  },
  {
    id: "tamachi",
    name: "Tamachi",
    nameJa: "田町",
    center: { lat: 35.6457, lng: 139.7474 }, // Tamachi Station
    radius: 500,
    prompt:
      "Business district sophistication, Keio University academic energy, corporate and student life fusion, modern office towers with campus vibes, professional yet youthful atmosphere",
    promptMorning:
      "Soft corporate ambient, peaceful Tamachi morning, gentle academic campus sounds, quiet business district awakening, serene commuter ambiance",
    promptEvening:
      "Lively business district energy, Tamachi evening rush, vibrant student nightlife, bustling office and campus fusion, dynamic professional-social atmosphere",
    color: "#4169e1",
  },
  {
    id: "hamamatsucho",
    name: "Hamamatsucho",
    nameJa: "浜松町",
    center: { lat: 35.655, lng: 139.757 }, // Hamamatsucho Station
    radius: 500,
    prompt:
      "Business district elegance, Tokyo Tower proximity vibes, corporate sophistication, waterfront energy, refined urban professional atmosphere",
    promptMorning:
      "Gentle business district awakening, peaceful Hamamatsucho dawn, soft corporate ambient, quiet waterfront morning, serene professional ambiance",
    promptEvening:
      "Sophisticated business district nightlife, Hamamatsucho evening elegance, vibrant corporate social scene, Tokyo Tower illuminated atmosphere, refined urban night energy",
    color: "#1e90ff",
  },
  {
    id: "shimbashi",
    name: "Shimbashi",
    nameJa: "新橋",
    center: { lat: 35.666, lng: 139.757 }, // Shimbashi Station
    radius: 600,
    prompt:
      "Classic salaryman district, traditional izakaya alley energy, after-work drinking culture, nostalgic Showa-era business district, authentic Tokyo working class atmosphere",
    promptMorning:
      "Gentle morning commuter sounds, peaceful Shimbashi dawn, soft traditional district awakening, quiet izakaya street before the rush, serene business district morning",
    promptEvening:
      "Lively izakaya nightlife explosion, Shimbashi salaryman celebration, vibrant after-work drinking culture, crowded traditional alley atmosphere, electric working-class Tokyo night",
    color: "#cd5c5c",
  },
  {
    id: "yurakucho",
    name: "Yurakucho",
    nameJa: "有楽町",
    center: { lat: 35.675, lng: 139.763 }, // Yurakucho Station
    radius: 500,
    prompt:
      "Upscale business district elegance, Ginza-adjacent sophistication, luxury shopping proximity, refined corporate atmosphere, polished metropolitan vibes",
    promptMorning:
      "Soft upscale district awakening, peaceful Yurakucho morning, gentle luxury shopping ambiance, quiet business district dawn, serene refined atmosphere",
    promptEvening:
      "Sophisticated business district nightlife, Yurakucho evening elegance, vibrant upscale dining scene, luxury shopping district energy, polished metropolitan night",
    color: "#b8860b",
  },
  {
    id: "kanda",
    name: "Kanda",
    nameJa: "神田",
    center: { lat: 35.6917, lng: 139.7709 }, // Kanda Station
    radius: 600,
    prompt:
      "Bookstore street intellectual energy, traditional and modern fusion, academic and tech district blend, classic Tokyo culture meets electronics, scholarly urban atmosphere",
    promptMorning:
      "Gentle bookstore street awakening, peaceful Kanda morning, soft academic ambient, quiet traditional district dawn, serene intellectual atmosphere",
    promptEvening:
      "Lively bookstore and electronics energy, Kanda evening intellectual buzz, vibrant traditional izakaya scene, classic Tokyo culture nightlife, scholarly urban night",
    color: "#8b008b",
  },
  {
    id: "okachimachi",
    name: "Okachimachi",
    nameJa: "御徒町",
    center: { lat: 35.7074, lng: 139.7745 }, // Okachimachi Station
    radius: 600,
    prompt:
      "Ameyoko market bustle, vibrant street food energy, bustling shopping district, traditional market atmosphere, lively Tokyo street culture",
    promptMorning:
      "Gentle market preparation sounds, peaceful Okachimachi dawn, soft vendor setup ambiance, quiet Ameyoko before the crowds, serene market morning",
    promptEvening:
      "Lively Ameyoko market energy, Okachimachi evening shopping fever, vibrant street food celebration, bustling traditional market nightlife, electric market atmosphere",
    color: "#ff4500",
  },
  {
    id: "uguisudani",
    name: "Uguisudani",
    nameJa: "鶯谷",
    center: { lat: 35.7203, lng: 139.778 }, // Uguisudani Station
    radius: 500,
    prompt:
      "Traditional ryokan district nostalgia, Showa-era atmosphere, historic Japanese inns, peaceful residential area, nostalgic Tokyo heritage sounds",
    promptMorning:
      "Serene traditional district awakening, peaceful Uguisudani dawn, gentle ryokan ambiance, quiet historic neighborhood morning, tranquil Showa-era atmosphere",
    promptEvening:
      "Nostalgic traditional district evening, Uguisudani ryokan street atmosphere, gentle historic neighborhood nightlife, peaceful traditional Tokyo night, serene heritage ambiance",
    color: "#6b8e23",
  },
  {
    id: "nippori",
    name: "Nippori",
    nameJa: "日暮里",
    center: { lat: 35.7281, lng: 139.7707 }, // Nippori Station
    radius: 600,
    prompt:
      "Fabric district craftsmanship, traditional textile market energy, Yanaka Ginza shopping street, old Tokyo shitamachi vibes, nostalgic artisan atmosphere",
    promptMorning:
      "Gentle fabric market awakening, peaceful Nippori dawn, soft textile district ambiance, quiet Yanaka Ginza morning, serene traditional craft atmosphere",
    promptEvening:
      "Lively fabric district energy, Nippori evening shopping buzz, vibrant traditional market nightlife, nostalgic shitamachi street culture, artisan district celebration",
    color: "#d2691e",
  },
  {
    id: "tabata",
    name: "Tabata",
    nameJa: "田端",
    center: { lat: 35.7371, lng: 139.7617 }, // Tabata Station
    radius: 500,
    prompt:
      "Quiet residential neighborhood, peaceful park surroundings, family-friendly atmosphere, serene local community vibes, calm Tokyo suburbia",
    promptMorning:
      "Serene residential awakening, peaceful Tabata dawn, gentle park morning sounds, quiet neighborhood morning, tranquil family district atmosphere",
    promptEvening:
      "Peaceful residential evening, Tabata neighborhood night, gentle local community atmosphere, serene family district nightlife, calm residential Tokyo night",
    color: "#9acd32",
  },
  {
    id: "komagome",
    name: "Komagome",
    nameJa: "駒込",
    center: { lat: 35.736, lng: 139.747 }, // Komagome Station
    radius: 500,
    prompt:
      "Traditional garden district, Rikugien Garden serenity, residential elegance, peaceful neighborhood atmosphere, refined Tokyo suburbia",
    promptMorning:
      "Serene garden district awakening, peaceful Komagome dawn, gentle Rikugien Garden ambiance, quiet residential morning, tranquil refined atmosphere",
    promptEvening:
      "Peaceful garden district evening, Komagome neighborhood night, gentle traditional garden atmosphere, serene residential nightlife, calm elegant Tokyo night",
    color: "#2e8b57",
  },
  {
    id: "sugamo",
    name: "Sugamo",
    nameJa: "巣鴨",
    center: { lat: 35.733, lng: 139.733 }, // Sugamo Station
    radius: 600,
    prompt:
      "Traditional shopping street nostalgia, elderly-friendly district, Jizo-dori shopping street, old Tokyo charm, nostalgic community atmosphere",
    promptMorning:
      "Gentle traditional shopping street awakening, peaceful Sugamo dawn, soft Jizo-dori morning ambiance, quiet nostalgic district morning, serene traditional atmosphere",
    promptEvening:
      "Lively traditional shopping street energy, Sugamo evening shopping buzz, vibrant Jizo-dori nightlife, nostalgic community celebration, traditional Tokyo night",
    color: "#a0522d",
  },
  {
    id: "otsuka",
    name: "Otsuka",
    nameJa: "大塚",
    center: { lat: 35.7312, lng: 139.7281 }, // Otsuka Station
    radius: 500,
    prompt:
      "Local residential charm, Arakawa tram line nostalgia, neighborhood shopping district, peaceful community vibes, authentic Tokyo living",
    promptMorning:
      "Serene residential awakening, peaceful Otsuka dawn, gentle tram line sounds, quiet neighborhood morning, tranquil local community atmosphere",
    promptEvening:
      "Peaceful residential evening, Otsuka neighborhood night, gentle local shopping district atmosphere, serene community nightlife, calm authentic Tokyo night",
    color: "#bc8f8f",
  },
  {
    id: "mejiro",
    name: "Mejiro",
    nameJa: "目白",
    center: { lat: 35.7203, lng: 139.7061 }, // Mejiro Station
    radius: 500,
    prompt:
      "Upscale residential elegance, Gakushuin University academic atmosphere, refined neighborhood vibes, sophisticated residential district, polished Tokyo suburbia",
    promptMorning:
      "Serene upscale district awakening, peaceful Mejiro dawn, gentle academic campus ambiance, quiet refined neighborhood morning, tranquil sophisticated atmosphere",
    promptEvening:
      "Peaceful upscale residential evening, Mejiro neighborhood night, gentle refined district atmosphere, serene academic community nightlife, calm elegant Tokyo night",
    color: "#c0c0c0",
  },
  {
    id: "takadanobaba",
    name: "Takadanobaba",
    nameJa: "高田馬場",
    center: { lat: 35.7126, lng: 139.7036 }, // Takadanobaba Station
    radius: 600,
    prompt:
      "Student district energy, Waseda University vibes, affordable dining and entertainment, youthful academic atmosphere, vibrant student nightlife",
    promptMorning:
      "Gentle student district awakening, peaceful Takadanobaba dawn, soft academic campus sounds, quiet student street morning, serene youthful atmosphere",
    promptEvening:
      "Lively student district nightlife, Takadanobaba evening student energy, vibrant affordable dining scene, crowded student entertainment, electric youthful Tokyo night",
    color: "#ff6347",
  },
  {
    id: "meguro",
    name: "Meguro",
    nameJa: "目黒",
    center: { lat: 35.6329, lng: 139.7156 }, // Meguro Station
    radius: 600,
    prompt:
      "Upscale residential sophistication, Meguro River cherry blossoms, refined neighborhood elegance, high-end dining and galleries, polished Tokyo living",
    promptMorning:
      "Serene upscale district awakening, peaceful Meguro dawn, gentle cherry blossom river ambiance, quiet refined neighborhood morning, tranquil sophisticated atmosphere",
    promptEvening:
      "Sophisticated upscale residential evening, Meguro neighborhood night, vibrant high-end dining scene, elegant gallery district nightlife, polished metropolitan night",
    color: "#4682b4",
  },
  {
    id: "gotanda",
    name: "Gotanda",
    nameJa: "五反田",
    center: { lat: 35.6264, lng: 139.7232 }, // Gotanda Station
    radius: 600,
    prompt:
      "Business and residential blend, diverse dining scene, commercial district energy, mixed-use urban atmosphere, dynamic Tokyo neighborhood",
    promptMorning:
      "Gentle mixed-use district awakening, peaceful Gotanda dawn, soft commercial and residential ambiance, quiet business district morning, serene urban atmosphere",
    promptEvening:
      "Lively business and residential evening, Gotanda nightlife energy, vibrant diverse dining scene, bustling commercial district night, dynamic Tokyo neighborhood night",
    color: "#708090",
  },
  {
    id: "osaki",
    name: "Osaki",
    nameJa: "大崎",
    center: { lat: 35.62, lng: 139.728 }, // Osaki Station
    radius: 500,
    prompt:
      "Modern business district, office tower concentration, corporate hub energy, sleek commercial atmosphere, contemporary Tokyo business center",
    promptMorning:
      "Gentle business district awakening, peaceful Osaki dawn, soft corporate ambient, quiet office district morning, serene professional atmosphere",
    promptEvening:
      "Sophisticated business district evening, Osaki corporate night energy, vibrant office district nightlife, modern business center atmosphere, polished commercial night",
    color: "#2f4f4f",
  },
  {
    id: "ochanomizu",
    name: "Ochanomizu",
    nameJa: "御茶ノ水",
    center: { lat: 35.6993, lng: 139.7651 }, // Ochanomizu Station
    radius: 600,
    prompt:
      "Musical instrument district harmony, academic campus energy, university and music shop fusion, scholarly musical atmosphere, intellectual Tokyo soundscape",
    promptMorning:
      "Gentle musical district awakening, peaceful Ochanomizu dawn, soft instrument shop ambiance, quiet academic campus morning, serene scholarly atmosphere",
    promptEvening:
      "Lively musical instrument district energy, Ochanomizu evening music scene, vibrant university nightlife, academic and musical fusion, intellectual Tokyo night",
    color: "#9932cc",
  },
  {
    id: "suidobashi",
    name: "Suidobashi",
    nameJa: "水道橋",
    center: { lat: 35.7022, lng: 139.7531 }, // Suidobashi Station
    radius: 500,
    prompt:
      "Tokyo Dome entertainment energy, sports and concert venue atmosphere, vibrant event district, dynamic entertainment hub, exciting Tokyo entertainment center",
    promptMorning:
      "Gentle entertainment district awakening, peaceful Suidobashi dawn, soft event venue ambiance, quiet sports district morning, serene entertainment atmosphere",
    promptEvening:
      "Lively Tokyo Dome energy, Suidobashi evening event excitement, vibrant sports and concert atmosphere, dynamic entertainment hub nightlife, electric event district night",
    color: "#c71585",
  },
  {
    id: "iidabashi",
    name: "Iidabashi",
    nameJa: "飯田橋",
    center: { lat: 35.7021, lng: 139.7454 }, // Iidabashi Station
    radius: 600,
    prompt:
      "Kagurazaka French quarter elegance, cobblestone street atmosphere, European-style dining, sophisticated cultural district, refined Tokyo charm",
    promptMorning:
      "Serene French quarter awakening, peaceful Iidabashi dawn, gentle cobblestone street ambiance, quiet Kagurazaka morning, tranquil refined atmosphere",
    promptEvening:
      "Sophisticated French quarter evening, Iidabashi Kagurazaka nightlife, vibrant European dining scene, elegant cultural district night, refined Tokyo charm night",
    color: "#da70d6",
  },
  {
    id: "ichigaya",
    name: "Ichigaya",
    nameJa: "市ヶ谷",
    center: { lat: 35.6917, lng: 139.7356 }, // Ichigaya Station
    radius: 500,
    prompt:
      "Moats and fishing spots, urban leisure oasis, historical military district, peaceful recreational area, unique Tokyo relaxation space",
    promptMorning:
      "Serene moat district awakening, peaceful Ichigaya dawn, gentle fishing spot ambiance, quiet recreational morning, tranquil leisure atmosphere",
    promptEvening:
      "Peaceful moat district evening, Ichigaya recreational night, gentle fishing and leisure atmosphere, serene historical district nightlife, calm unique Tokyo night",
    color: "#87ceeb",
  },
  {
    id: "yotsuya",
    name: "Yotsuya",
    nameJa: "四ツ谷",
    center: { lat: 35.686, lng: 139.7302 }, // Yotsuya Station
    radius: 500,
    prompt:
      "Historical and modern blend, Akasaka Palace proximity, mixed residential and commercial, elegant neighborhood atmosphere, refined Tokyo district",
    promptMorning:
      "Serene mixed district awakening, peaceful Yotsuya dawn, gentle historical and modern ambiance, quiet elegant neighborhood morning, tranquil refined atmosphere",
    promptEvening:
      "Sophisticated mixed district evening, Yotsuya neighborhood night, vibrant historical and modern fusion, elegant residential nightlife, refined Tokyo district night",
    color: "#b0c4de",
  },
  {
    id: "shinanomachi",
    name: "Shinanomachi",
    nameJa: "信濃町",
    center: { lat: 35.6811, lng: 139.7232 }, // Shinanomachi Station
    radius: 500,
    prompt:
      "Meiji Memorial Gallery historical atmosphere, quiet residential elegance, cultural heritage district, peaceful neighborhood vibes, refined Tokyo suburbia",
    promptMorning:
      "Serene historical district awakening, peaceful Shinanomachi dawn, gentle memorial gallery ambiance, quiet cultural neighborhood morning, tranquil refined atmosphere",
    promptEvening:
      "Peaceful historical district evening, Shinanomachi neighborhood night, gentle cultural heritage atmosphere, serene memorial district nightlife, calm refined Tokyo night",
    color: "#778899",
  },
  {
    id: "sendagaya",
    name: "Sendagaya",
    nameJa: "千駄ヶ谷",
    center: { lat: 35.6804, lng: 139.7121 }, // Sendagaya Station
    radius: 600,
    prompt:
      "National Stadium sports energy, athletic district atmosphere, sports event excitement, dynamic sports hub, vibrant Tokyo sports center",
    promptMorning:
      "Gentle sports district awakening, peaceful Sendagaya dawn, soft stadium ambiance, quiet athletic district morning, serene sports atmosphere",
    promptEvening:
      "Lively National Stadium energy, Sendagaya evening sports excitement, vibrant athletic district nightlife, dynamic sports hub atmosphere, electric sports center night",
    color: "#ff7f50",
  },
  {
    id: "koenji",
    name: "Koenji",
    nameJa: "高円寺",
    center: { lat: 35.7052, lng: 139.6492 }, // Koenji Station
    radius: 600,
    prompt:
      "Vintage fashion and music culture, bohemian district energy, indie music scene, thrift shop paradise, alternative Tokyo subculture atmosphere",
    promptMorning:
      "Gentle bohemian district awakening, peaceful Koenji dawn, soft vintage shop ambiance, quiet indie music scene morning, serene alternative atmosphere",
    promptEvening:
      "Lively vintage fashion and music energy, Koenji evening indie scene, vibrant thrift shop nightlife, bohemian district celebration, electric alternative Tokyo night",
    color: "#ba55d3",
  },
  {
    id: "asagaya",
    name: "Asagaya",
    nameJa: "阿佐ヶ谷",
    center: { lat: 35.7056, lng: 139.6356 }, // Asagaya Station
    radius: 600,
    prompt:
      "Tanabata festival nostalgia, Showa-era shopping street charm, traditional market atmosphere, nostalgic shitamachi vibes, retro Tokyo culture",
    promptMorning:
      "Gentle nostalgic shopping street awakening, peaceful Asagaya dawn, soft Tanabata festival ambiance, quiet Showa-era district morning, serene retro atmosphere",
    promptEvening:
      "Lively Tanabata festival energy, Asagaya evening shopping street buzz, vibrant nostalgic market nightlife, Showa-era celebration, traditional Tokyo culture night",
    color: "#ffb6c1",
  },
  {
    id: "ogikubo",
    name: "Ogikubo",
    nameJa: "荻窪",
    center: { lat: 35.7048, lng: 139.6201 }, // Ogikubo Station
    radius: 600,
    prompt:
      "Ramen shop district literary atmosphere, traditional noodle culture, bookish neighborhood vibes, authentic local dining scene, cultural Tokyo suburbia",
    promptMorning:
      "Gentle ramen district awakening, peaceful Ogikubo dawn, soft literary ambiance, quiet noodle shop morning, serene cultural atmosphere",
    promptEvening:
      "Lively ramen shop district energy, Ogikubo evening dining scene, vibrant traditional noodle culture, literary neighborhood nightlife, authentic Tokyo dining night",
    color: "#dda0dd",
  },
  {
    id: "kichijoji",
    name: "Kichijoji",
    nameJa: "吉祥寺",
    center: { lat: 35.7031, lng: 139.5795 }, // Kichijoji Station
    radius: 700,
    prompt:
      "Most livable Tokyo district, Inokashira Park natural beauty, vibrant shopping streets, perfect urban-nature balance, ideal Tokyo living atmosphere",
    promptMorning:
      "Serene park district awakening, peaceful Kichijoji dawn, gentle Inokashira Park ambiance, quiet shopping street morning, tranquil ideal living atmosphere",
    promptEvening:
      "Lively most livable district energy, Kichijoji evening shopping and dining, vibrant park and urban fusion, perfect balance nightlife, ideal Tokyo living night",
    color: "#98fb98",
  },
];

export const DEFAULT_DISTRICT_PROMPT =
  "Ambient Tokyo cityscape, gentle urban hum, distant traffic sounds, modern Japanese metropolis atmosphere, calm urban exploration";
export const DEFAULT_DISTRICT_PROMPT_MORNING =
  "Peaceful Tokyo dawn, soft ambient pads, gentle city awakening, tranquil urban morning, serene Japanese cityscape";
export const DEFAULT_DISTRICT_PROMPT_EVENING =
  "Vibrant Tokyo nightlife, energetic urban pulse, lively city sounds, exciting metropolitan evening, dynamic Japanese metropolis";

/**
 * Get the appropriate prompt for a district based on time of day
 */
export function getDistrictPrompt(
  district: District,
  timeOfDay: TimeOfDay
): string {
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
  train_station: [
    "/audio/池袋/train-apraoching-ikebukuro.mp3",
    "/audio/池袋/bilingual-train-annoucement.mp3",
  ],
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
    lat: 35.729,
    lng: 139.712,
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
    lat: 35.731,
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
    lat: 35.698,
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
    lng: 139.774,
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
    lat: 35.706,
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
    lat: 35.658,
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
    lat: 35.658,
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
    nameJa: "朝",
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
    nameJa: "昼",
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
    nameJa: "夕方",
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
