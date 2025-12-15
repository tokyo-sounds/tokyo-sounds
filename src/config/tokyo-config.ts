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

// Basic district data - loaded immediately (lightweight, ~100 bytes each)
// Only contains data needed for distance calculations
export interface DistrictBasic {
  id: string;
  name: string;
  nameJa: string;
  center: { lat: number; lng: number }; // station/landmark coordinates
  radius: number; // district radius in meters
  color: string;
}

// Detailed district data - loaded on demand (heavyweight, ~800-1200 bytes each)
// Contains prompts and descriptions, only loaded when district is nearby
export interface DistrictDetails {
  prompt: string; // default/afternoon prompt
  promptMorning?: string; // calm, tranquil morning variant
  promptEvening?: string; // energetic, lively evening variant
  descriptionJa: string; // 40-50 character Japanese description
}

// Full district - combines basic + details (for backward compatibility)
export interface District extends DistrictBasic {
  prompt: string;
  promptMorning?: string;
  promptEvening?: string;
  descriptionJa: string;
}

// Cache for loaded district details (lazy loading)
// Details are already in memory, but we cache them for faster access
const districtDetailsCache = new Map<string, DistrictDetails>();

// Load district details on demand (synchronous - data is already in memory)
// Only loads details when district is nearby (weight > threshold)
export function getDistrictDetails(id: string): DistrictDetails {
  if (districtDetailsCache.has(id)) {
    return districtDetailsCache.get(id)!;
  }

  const details = DISTRICT_DETAILS[id];
  if (!details) {
    throw new Error(`District details not found: ${id}`);
  }

  districtDetailsCache.set(id, details);
  return details;
}

// Get full district data (combines basic + details)
export function getDistrictFull(id: string): District {
  const basic = TOKYO_DISTRICTS_BASIC.find((d) => d.id === id);
  if (!basic) {
    throw new Error(`District not found: ${id}`);
  }

  const details = getDistrictDetails(id);
  return { ...basic, ...details };
}

// Districts centered on actual train station coordinates with realistic radii
// NOTE: This is kept for backward compatibility but uses lazy loading internally
// For better performance, use TOKYO_DISTRICTS_BASIC for calculations
export const TOKYO_DISTRICTS: District[] = [
  {
    id: "shinjuku",
    name: "Shinjuku",
    nameJa: "新宿",
    center: { lat: 35.6896, lng: 139.7006 }, // Shinjuku Station
    radius: 1200,
    prompt:
      "Pulsing electronic beats, neon-soaked synths, late night Tokyo energy, Shinjuku nightlife vibes, dense urban soundscape with distant train announcements",
    promptMorning:
      "Gentle ambient piano, early morning Shinjuku calm before the rush, soft synth pads, peaceful Tokyo dawn, quiet city awakening",
    promptEvening:
      "Intense neon-soaked electronic, pulsing Shinjuku nightlife energy, vibrant synth leads, bustling izakaya atmosphere, electric Tokyo night fever",
    color: "#ff00ff",
    descriptionJa:
      "日本最大の繁華街、都庁展望台から富士山も見える！ネオン輝く不夜城の魅力",
  },
  {
    id: "shibuya",
    name: "Shibuya",
    nameJa: "渋谷",
    center: { lat: 35.658, lng: 139.7016 }, // Shibuya Station
    radius: 1200,
    prompt:
      "Trendy J-pop influenced electronic, upbeat and youthful, Shibuya crossing energy, fashion district vibes, bright and colorful synth melodies",
    promptMorning:
      "Soft lo-fi beats, peaceful Shibuya morning, gentle acoustic guitar, calm before the crossing crowds, serene Tokyo sunrise",
    promptEvening:
      "High-energy J-pop dance beats, Shibuya 109 shopping fever, youthful electronic anthems, crowded crossing excitement, vibrant nighttime fashion scene",
    color: "#00ffff",
    descriptionJa:
      "若者文化の発信地、世界一忙しいスクランブル交差点で東京の鼓動を感じよう",
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
    descriptionJa:
      "赤レンガの歴史ある駅、大正時代の美しい建築が復元された丸の内のシンボル",
  },
  {
    id: "ikebukuro",
    name: "Ikebukuro",
    nameJa: "池袋",
    center: { lat: 35.7295, lng: 139.7109 }, // Ikebukuro Station
    radius: 800,
    prompt:
      "Energetic arcade game inspired music, anime soundtrack vibes, playful chiptune elements, otaku culture energy, Ikebukuro night adventure",
    promptMorning:
      "Gentle chiptune lullaby, sleepy Ikebukuro morning, soft 8-bit melodies, quiet anime cafe ambiance, peaceful otaku dawn",
    promptEvening:
      "Intense arcade game soundtrack, blazing chiptune energy, anime battle theme vibes, crowded game center excitement, Ikebukuro night fever",
    color: "#ffaa00",
    descriptionJa:
      "アニメ・ゲームの聖地、サンシャイン60の展望台は緑あふれる空中公園に変身",
  },
  {
    id: "ginza",
    name: "Ginza",
    nameJa: "銀座",
    center: { lat: 35.6717, lng: 139.7649 }, // Ginza Station
    radius: 600,
    prompt:
      "Sophisticated jazz lounge, upscale metropolitan elegance, smooth saxophone melodies, luxury shopping district ambiance, refined Tokyo nightlife",
    promptMorning:
      "Delicate jazz piano solo, quiet Ginza morning elegance, soft brushed drums, peaceful luxury district awakening, refined sunrise ambiance",
    promptEvening:
      "Swinging jazz ensemble, lively Ginza cocktail hour, energetic saxophone solos, bustling upscale nightlife, champagne celebration vibes",
    color: "#ffd700",
    descriptionJa:
      "高級ブランド街、1872年の大火後に誕生したレンガ街が今も輝く洗練の銀座",
  },
  {
    id: "akihabara",
    name: "Akihabara",
    nameJa: "秋葉原",
    center: { lat: 35.6984, lng: 139.7731 }, // Akihabara Station
    radius: 600,
    prompt:
      "Intense 8-bit chiptune energy, electronic otaku paradise, anime theme song influences, bustling tech district sounds, neon electric atmosphere",
    promptMorning:
      "Soft synth arpeggios, quiet Akihabara morning, gentle electronic hum, peaceful tech district dawn, calm before the crowds",
    promptEvening:
      "Maximum chiptune intensity, blazing Akihabara electric night, anime opening theme energy, crowded maid cafe excitement, neon sensory overload",
    color: "#ff6b6b",
    descriptionJa:
      "電気街・オタク文化のメッカ、最新ガジェットから懐かしのゲーム機まで揃う聖地",
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
    descriptionJa:
      "浅草寺と下町情緒、東京最古の寺で江戸時代の風情を今に伝える伝統の街",
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
    descriptionJa:
      "国際的なナイトライフ、六本木ヒルズの展望台から東京タワーと街を一望できる",
  },
  {
    id: "shinagawa",
    name: "Shinagawa",
    nameJa: "品川",
    center: { lat: 35.6284, lng: 139.7387 }, // Shinagawa Station
    radius: 700,
    prompt:
      "Shinkansen station energy, travel hub ambiance, modern transit sounds, business traveler atmosphere, gateway to Tokyo vibes",
    promptMorning:
      "Gentle train platform ambiance, peaceful Shinagawa dawn, soft announcement chimes, quiet early commuter moments, serene travel hub morning",
    promptEvening:
      "Exciting Shinkansen departure energy, busy platform rush, dramatic travel anticipation, evening business class atmosphere, gateway to adventure",
    color: "#20b2aa",
    descriptionJa:
      "新幹線の玄関口、品川水族館や天王洲の運河でビジネスとレジャーが融合",
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
    descriptionJa:
      "上野公園とアメ横、パンダで有名な動物園と博物館が集まる文化の宝庫",
  },
  {
    id: "harajuku",
    name: "Harajuku",
    nameJa: "原宿",
    center: { lat: 35.6702, lng: 139.7027 }, // Harajuku Station
    radius: 600,
    prompt:
      "Kawaii pop culture beats, colorful Takeshita street energy, youth fashion vibes, sweet and playful electronic melodies, Meiji shrine serenity nearby",
    promptMorning:
      "Gentle Meiji shrine forest ambiance, peaceful Harajuku dawn, soft wind through trees, tranquil morning meditation, serene nature escape",
    promptEvening:
      "Ultra-kawaii pop explosion, Takeshita street maximum energy, colorful fashion parade beats, sweet electronic candy rush, Harajuku night sparkle",
    color: "#ff69b4",
    descriptionJa:
      "カワイイ文化の聖地、竹下通りで週末にはコスプレイヤーが集まる若者の楽園",
  },
  {
    id: "ebisu",
    name: "Ebisu",
    nameJa: "恵比寿",
    center: { lat: 35.6467, lng: 139.7101 }, // Ebisu Station
    radius: 500,
    prompt:
      "Trendy gastropub atmosphere, craft beer and jazz fusion, sophisticated nightlife, Yebisu garden place elegance, relaxed urban vibes",
    promptMorning:
      "Soft acoustic coffee shop vibes, quiet Ebisu morning, gentle bossa nova, peaceful garden place dawn, refined breakfast ambiance",
    promptEvening:
      "Lively gastropub jazz, Ebisu craft beer celebration, upbeat fusion grooves, sophisticated dinner party energy, trendy Tokyo nightlife",
    color: "#daa520",
    descriptionJa:
      "おしゃれなガストロパブ街、恵比寿ビール発祥の地でクラフトビールとジャズを楽しむ",
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
    descriptionJa:
      "多国籍料理が楽しめる、韓国・タイなどアジア各国の本格料理が味わえる国際色豊かな街",
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
    descriptionJa:
      "韓国タウン、K-POPグッズや韓国料理が満載！東京にいながらソウル気分を味わえる",
  },
  {
    id: "nakano",
    name: "Nakano",
    nameJa: "中野",
    center: { lat: 35.7056, lng: 139.6656 }, // Nakano Station
    radius: 1200,
    prompt:
      "Retro anime soundtrack vibes, Nakano Broadway otaku paradise, nostalgic chiptune and synthwave fusion, vintage game center energy, classic anime culture atmosphere",
    promptMorning:
      "Gentle retro game music, peaceful Nakano Broadway morning, soft 8-bit lullaby, quiet otaku district awakening, serene anime cafe ambiance",
    promptEvening:
      "Intense anime opening theme energy, blazing Nakano Broadway nightlife, maximum chiptune intensity, crowded game center and anime shop excitement, nostalgic otaku night adventure",
    color: "#9370db",
    descriptionJa:
      "中野ブロードウェイ、アニメ・アイドルグッズの宝庫！オタク文化の聖地として名高い",
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
    descriptionJa:
      "代々木公園と明治神宮、都会の真ん中で自然と都市が調和する緑のオアシス",
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
    descriptionJa:
      "最新の駅、2020年開業の未来型アーキテクチャが光る次世代の交通ハブ",
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
    descriptionJa:
      "慶應大学とビジネス街、学生の活気とビジネスマンの知性が交わる知的エリア",
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
    descriptionJa:
      "東京タワー近く、増上寺と現代ビルが共存する歴史と未来が交わるエレガントな街",
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
    descriptionJa:
      "サラリーマンの街、新橋の居酒屋横丁で終電まで飲み明かす昭和の風情が残る",
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
    descriptionJa:
      "銀座に隣接、有楽町マリオンや日比谷公園が近く上品なビジネス街として知られる",
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
    descriptionJa:
      "古書店街と電子部品街、神田古書祭で知られる学問と技術が融合する知的エリア",
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
    descriptionJa:
      "アメ横の活気、戦後の闇市から発展した庶民的な商店街で活気あふれる市場を体験",
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
    descriptionJa:
      "旅館街の情緒、上野と谷中を結ぶ静かな下町で歴史ある旅館が並ぶ風情ある街",
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
    descriptionJa:
      "布地問屋街、谷中銀座の「夕日階段」が有名な下町散策にぴったりの懐かしい街",
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
    descriptionJa:
      "閑静な住宅街、公園に囲まれた家族向けの落ち着いた住環境が自慢のエリア",
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
    descriptionJa:
      "六義園の庭園、江戸時代の大名庭園が残る上品な住宅街で四季の美しさを楽しむ",
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
    descriptionJa:
      "地蔵通り商店街、赤いパンツが縁起物として人気！お年寄りに優しい下町の温かさ",
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
    descriptionJa:
      "都電荒川線沿い、路面電車が走る懐かしい下町で温かみあるコミュニティが息づく",
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
    descriptionJa:
      "学習院大学、皇室ゆかりの学び舎がある上品な住宅街で落ち着いた雰囲気を満喫",
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
    descriptionJa:
      "早稲田大学、学生街の活気あふれる高田馬場でリーズナブルなグルメと青春を満喫",
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
    descriptionJa:
      "目黒川の桜、春には桜のトンネルが美しいおしゃれな住宅街で高級グルメも楽しめる",
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
    descriptionJa:
      "ビジネスと住宅の融合、多様な飲食店が集まる五反田で働く人と住む人が交わる街",
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
    descriptionJa:
      "オフィスビルが林立、大崎駅周辺に集まる現代的なビジネス街で未来の東京を体感",
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
    descriptionJa:
      "楽器店街、御茶ノ水は楽器の聖地！大学と音楽が融合する知的で文化的なエリア",
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
    descriptionJa:
      "東京ドーム、プロ野球やコンサートが楽しめるスポーツとエンタメの一大エンターテインメント拠点",
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
    descriptionJa:
      "神楽坂のフランス風、石畳の坂道に料亭が並ぶ「東京の小パリ」と呼ばれるおしゃれな街",
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
    descriptionJa:
      "お堀と釣り場、市ヶ谷の堀で釣りができる珍しい都市のオアシスでリラックス",
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
    descriptionJa:
      "赤坂御所近く、四ツ谷怪談で知られる歴史と現代が融合する上品な住宅エリア",
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
    descriptionJa:
      "明治記念館、静かな文化の街で歴史を感じながら上品な住宅街の雰囲気を満喫",
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
    descriptionJa:
      "国立競技場、オリンピックの舞台となったスポーツの聖地で熱い戦いを観戦できる",
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
    descriptionJa:
      "古着と音楽文化、ライブハウスや古着店が集まるボヘミアンな雰囲気のアンダーグラウンド文化の拠点",
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
    descriptionJa:
      "七夕祭り、阿佐ヶ谷で毎年盛大に開催される七夕まつりで昭和レトロな商店街を満喫",
  },
  {
    id: "ogikubo",
    name: "Ogikubo",
    nameJa: "荻窪",
    center: { lat: 35.7048, lng: 139.6201 }, // Ogikubo Station
    radius: 800,
    prompt:
      "Ramen shop district literary atmosphere, traditional noodle culture, bookish neighborhood vibes, authentic local dining scene, cultural Tokyo suburbia",
    promptMorning:
      "Gentle ramen district awakening, peaceful Ogikubo dawn, soft literary ambiance, quiet noodle shop morning, serene cultural atmosphere",
    promptEvening:
      "Lively ramen shop district energy, Ogikubo evening dining scene, vibrant traditional noodle culture, literary neighborhood nightlife, authentic Tokyo dining night",
    color: "#dda0dd",
    descriptionJa:
      "ラーメン店街、文豪たちが愛した荻窪でラーメン激戦区と文学の香りが交わる街",
  },
  {
    id: "kichijoji",
    name: "Kichijoji",
    nameJa: "吉祥寺",
    center: { lat: 35.7031, lng: 139.5795 }, // Kichijoji Station
    radius: 800,
    prompt:
      "Most livable Tokyo district, Inokashira Park natural beauty, vibrant shopping streets, perfect urban-nature balance, ideal Tokyo living atmosphere",
    promptMorning:
      "Serene park district awakening, peaceful Kichijoji dawn, gentle Inokashira Park ambiance, quiet shopping street morning, tranquil ideal living atmosphere",
    promptEvening:
      "Lively most livable district energy, Kichijoji evening shopping and dining, vibrant park and urban fusion, perfect balance nightlife, ideal Tokyo living night",
    color: "#98fb98",
    descriptionJa:
      "井の頭公園、住みたい街No.1の吉祥寺で自然と都市が調和する理想的なライフスタイルを体験",
  },
  {
    id: "tokyo-tower",
    name: "Tokyo Tower",
    nameJa: "東京タワー",
    center: { lat: 35.6586, lng: 139.7454 }, // Tokyo Tower
    radius: 500,
    prompt:
      "Classic Tokyo landmark atmosphere, romantic evening lights, nostalgic Showa-era charm, iconic red and white tower, panoramic city views, timeless Tokyo symbol",
    promptMorning:
      "Gentle morning light on red tower, peaceful Tokyo Tower dawn, soft ambient pads, quiet landmark awakening, serene classic Tokyo sunrise",
    promptEvening:
      "Romantic tower illumination, Tokyo Tower evening magic, warm nostalgic lights, iconic landmark night glow, timeless Tokyo romance atmosphere",
    color: "#dc143c",
    descriptionJa:
      "東京のシンボル、1958年完成の赤白タワー！展望台から見る夜景は絶景、恋人の聖地としても有名",
  },
  {
    id: "tokyo-skytree",
    name: "Tokyo Skytree",
    nameJa: "東京スカイツリー",
    center: { lat: 35.7101, lng: 139.8107 }, // Tokyo Skytree
    radius: 500,
    prompt:
      "Futuristic tower energy, world's tallest broadcasting tower, modern Tokyo skyline, cutting-edge architecture, 360-degree panoramic views, next-generation landmark vibes",
    promptMorning:
      "Gentle morning light on modern tower, peaceful Skytree dawn, soft futuristic ambient, quiet landmark awakening, serene modern Tokyo sunrise",
    promptEvening:
      "Dynamic LED illumination, Skytree evening spectacle, vibrant modern tower lights, futuristic landmark night energy, electric Tokyo skyline atmosphere",
    color: "#00bfff",
    descriptionJa:
      "世界一高い電波塔、634メートルの高さから見る東京は圧巻！天気が良ければ富士山も見える絶景スポット",
  },
  {
    id: "imperial-palace",
    name: "Imperial Palace",
    nameJa: "皇居",
    center: { lat: 35.6852, lng: 139.7528 }, // Imperial Palace
    radius: 1000,
    prompt:
      "Historic royal residence atmosphere, serene moat and gardens, traditional Japanese architecture, peaceful urban oasis, imperial elegance, timeless Tokyo heritage",
    promptMorning:
      "Serene palace grounds awakening, peaceful Imperial Palace dawn, gentle traditional ambiance, quiet moat reflections, tranquil royal residence morning",
    promptEvening:
      "Elegant palace evening atmosphere, Imperial Palace sunset serenity, gentle traditional district night, peaceful royal grounds, refined Tokyo heritage night",
    color: "#2e8b57",
    descriptionJa:
      "天皇陛下のお住まい、都心の真ん中にある緑豊かなオアシス！二重橋と桜のコラボが美しい",
  },
  {
    id: "ueno-park",
    name: "Ueno Park",
    nameJa: "上野公園",
    center: { lat: 35.7148, lng: 139.7731 }, // Ueno Park
    radius: 1000,
    prompt:
      "Cultural park atmosphere, museums and zoo energy, cherry blossom festival vibes, educational and recreational fusion, vibrant park life, Tokyo's first public park",
    promptMorning:
      "Gentle park awakening, peaceful Ueno Park dawn, soft museum district ambiance, quiet cherry blossom paths, serene cultural park morning",
    promptEvening:
      "Lively park evening energy, Ueno Park cultural nightlife, vibrant museum district atmosphere, cherry blossom lantern ambiance, dynamic park celebration",
    color: "#ff69b4",
    descriptionJa:
      "日本初の公園！西郷隆盛像は有名な待ち合わせスポット。パンダで有名な動物園と博物館が集まる文化の宝庫",
  },
  {
    id: "meiji-shrine",
    name: "Meiji Shrine",
    nameJa: "明治神宮",
    center: { lat: 35.6764, lng: 139.6993 }, // Meiji Shrine
    radius: 800,
    prompt:
      "Sacred forest sanctuary, traditional Shinto shrine atmosphere, peaceful nature escape in the city, spiritual tranquility, massive torii gates, serene temple grounds",
    promptMorning:
      "Serene shrine forest awakening, peaceful Meiji Shrine dawn, gentle traditional prayers, quiet forest meditation, tranquil spiritual morning",
    promptEvening:
      "Peaceful shrine evening atmosphere, Meiji Shrine lantern-lit serenity, gentle traditional night ambiance, serene forest sanctuary, calm spiritual Tokyo night",
    color: "#228b22",
    descriptionJa:
      "都心の森、原宿の喧騒から一歩入れば別世界！日本最大の木造鳥居と伝統的な結婚式が見られる",
  },
  {
    id: "shinjuku-gyoen",
    name: "Shinjuku Gyoen",
    nameJa: "新宿御苑",
    center: { lat: 35.6852, lng: 139.7101 }, // Shinjuku Gyoen
    radius: 800,
    prompt:
      "Tranquil imperial garden atmosphere, diverse garden styles fusion, peaceful urban oasis, traditional Japanese and European garden harmony, serene nature escape",
    promptMorning:
      "Gentle garden awakening, peaceful Shinjuku Gyoen dawn, soft bird songs and rustling leaves, quiet traditional garden meditation, serene imperial garden morning",
    promptEvening:
      "Peaceful garden evening ambiance, Shinjuku Gyoen sunset serenity, gentle garden paths illuminated, tranquil imperial garden night, serene nature escape",
    color: "#90ee90",
    descriptionJa:
      "皇室庭園の一般公開！明治時代に日本初のプラタナス約200本を植えた歴史ある美しい庭園、3つの庭園様式が楽しめる",
  },
  {
    id: "akasaka-palace",
    name: "Akasaka Palace",
    nameJa: "赤坂離宮",
    center: { lat: 35.6781, lng: 139.7264 }, // Akasaka Palace
    radius: 500,
    prompt:
      "Grand neo-baroque palace elegance, royal reception atmosphere, luxurious architectural splendor, refined ceremonial ambiance, stately imperial architecture",
    promptMorning:
      "Serene palace grounds awakening, peaceful Akasaka Palace dawn, gentle neo-baroque architecture glow, quiet royal residence morning, tranquil imperial elegance",
    promptEvening:
      "Sophisticated palace evening atmosphere, Akasaka Palace illuminated grandeur, elegant neo-baroque night beauty, refined royal reception ambiance, stately imperial night",
    color: "#dda0dd",
    descriptionJa:
      "日本唯一のネオバロック宮殿！国宝の迎賓館で正面玄関のフランス製大理石が圧巻、1909年完成の東宮御所が起源",
  },
  {
    id: "okubo-park",
    name: "Okubo Park",
    nameJa: "大久保公園",
    center: { lat: 35.6934, lng: 139.7031 }, // Okubo Park
    radius: 300,
    prompt:
      "Urban oasis in entertainment district, peaceful park atmosphere amidst neon lights, local community gathering space, contrast of nature and city vibrancy",
    promptMorning:
      "Gentle park awakening, peaceful Okubo Park dawn, soft morning light through trees, quiet neighborhood park morning, serene urban oasis",
    promptEvening:
      "Peaceful park evening atmosphere, Okubo Park night serenity, gentle contrast with surrounding neon, tranquil local gathering space, calm urban green escape",
    color: "#98fb98",
    descriptionJa:
      "歌舞伎町の真ん中のオアシス！小泉八雲（ラフカディオ・ハーン）終焉の地でギリシャ風デザインが特徴",
  },
  {
    id: "sumida",
    name: "Sumida",
    nameJa: "墨田区",
    center: { lat: 35.6964, lng: 139.7931 }, // Ryogoku Station
    radius: 1800,
    prompt:
      "Traditional sumo wrestling district energy, Ryogoku Kokugikan arena atmosphere, historic Edo culture vibes, traditional festival sounds, nostalgic shitamachi heritage",
    promptMorning:
      "Gentle sumo district awakening, peaceful Ryogoku dawn, soft traditional ambiance, quiet historic neighborhood morning, serene Edo culture atmosphere",
    promptEvening:
      "Lively sumo district evening, Ryogoku Kokugikan excitement, vibrant traditional festival energy, bustling historic district nightlife, electric sumo culture night",
    color: "#8b4513",
    descriptionJa:
      "相撲の聖地・両国！国技館で大相撲を観戦できる。隅田川花火大会は江戸時代から続く夏の風物詩で約2万発が打ち上がる",
  },
  {
    id: "koto",
    name: "Koto",
    nameJa: "江東区",
    center: { lat: 35.6588, lng: 139.7964 }, // Toyosu Station
    radius: 1800,
    prompt:
      "Modern waterfront district energy, Toyosu Market fresh seafood atmosphere, cutting-edge urban development, waterway and canal vibes, contemporary Tokyo innovation",
    promptMorning:
      "Gentle waterfront awakening, peaceful Toyosu dawn, soft market preparation sounds, quiet modern district morning, serene canal-side atmosphere",
    promptEvening:
      "Lively waterfront evening, Toyosu Market night energy, vibrant modern development atmosphere, bustling canal district nightlife, electric contemporary Tokyo night",
    color: "#00bfff",
    descriptionJa:
      "豊洲市場とお台場、築地から移転した日本最大級の魚市場！お台場は1853年の黒船来航を防ぐために作られた人工島が起源",
  },
  {
    id: "ota",
    name: "Ota",
    nameJa: "大田区",
    center: { lat: 35.5624, lng: 139.716 }, // Kamata Station
    radius: 2000,
    prompt:
      "Airport gateway district energy, Haneda Airport proximity vibes, manufacturing and industry atmosphere, traditional working-class neighborhood, authentic Tokyo suburbia",
    promptMorning:
      "Gentle airport district awakening, peaceful Kamata dawn, soft industrial ambient, quiet working neighborhood morning, serene gateway atmosphere",
    promptEvening:
      "Lively airport district evening, Kamata nightlife energy, vibrant manufacturing district atmosphere, bustling working-class neighborhood, authentic Tokyo suburbia night",
    color: "#708090",
    descriptionJa:
      "羽田空港の玄関口、東京23区で最も面積が広い！町工場が多く「ものづくりの街」として知られ、職人技が光るエリア",
  },
  {
    id: "setagaya",
    name: "Setagaya",
    nameJa: "世田谷区",
    center: { lat: 35.6436, lng: 139.6684 }, // Sangenjaya Station
    radius: 2000,
    prompt:
      "Residential district charm, trendy Sangenjaya cafe culture, youthful neighborhood energy, relaxed suburban atmosphere, comfortable Tokyo living vibes",
    promptMorning:
      "Gentle residential awakening, peaceful Sangenjaya dawn, soft cafe district ambiance, quiet neighborhood morning, serene suburban atmosphere",
    promptEvening:
      "Lively residential evening, Sangenjaya nightlife energy, vibrant cafe and bar scene, bustling trendy neighborhood, comfortable Tokyo living night",
    color: "#90ee90",
    descriptionJa:
      "東京23区で最も人口が多い！三軒茶屋は若者に人気のエリア。駒沢オリンピック公園は1964年東京五輪の会場で今もスポーツの聖地",
  },
  {
    id: "itabashi",
    name: "Itabashi",
    nameJa: "板橋区",
    center: { lat: 35.7515, lng: 139.709 }, // Itabashi Station
    radius: 2000,
    prompt:
      "Quiet residential district atmosphere, traditional neighborhood vibes, peaceful suburban living, local community energy, authentic Tokyo suburbia",
    promptMorning:
      "Serene residential awakening, peaceful Itabashi dawn, gentle neighborhood ambiance, quiet suburban morning, tranquil community atmosphere",
    promptEvening:
      "Peaceful residential evening, Itabashi neighborhood night, gentle local community atmosphere, serene suburban nightlife, calm authentic Tokyo night",
    color: "#9acd32",
    descriptionJa:
      "板橋という名前の橋が区名の由来！江戸時代から続く歴史ある街。東京大仏がある乗蓮寺は高さ13メートルの巨大な仏像で有名",
  },
  {
    id: "nerima",
    name: "Nerima",
    nameJa: "練馬区",
    center: { lat: 35.7356, lng: 139.651 }, // Nerima Station
    radius: 1500,
    prompt:
      "Anime production district energy, green residential area atmosphere, agricultural heritage vibes, creative industry hub, peaceful suburban Tokyo living",
    promptMorning:
      "Gentle anime district awakening, peaceful Nerima dawn, soft creative industry ambiance, quiet green neighborhood morning, serene suburban atmosphere",
    promptEvening:
      "Lively anime district evening, Nerima creative energy, vibrant residential nightlife, bustling green suburbia, peaceful creative Tokyo night",
    color: "#98fb98",
    descriptionJa:
      "アニメ制作会社が多く「アニメの聖地」！農地も多く都市農業が盛ん。としまえん跡地には新しいテーマパークが建設中で注目を集める",
  },
  {
    id: "adachi",
    name: "Adachi",
    nameJa: "足立区",
    center: { lat: 35.7504, lng: 139.8049 }, // Kitasenju Station
    radius: 1800,
    prompt:
      "Major transportation hub energy, Kitasenju station district atmosphere, traditional shitamachi vibes, bustling commuter center, authentic Tokyo working-class district",
    promptMorning:
      "Gentle transportation hub awakening, peaceful Kitasenju dawn, soft commuter station ambiance, quiet traditional district morning, serene hub atmosphere",
    promptEvening:
      "Lively transportation hub evening, Kitasenju nightlife energy, vibrant commuter district atmosphere, bustling traditional neighborhood, electric working-class Tokyo night",
    color: "#ff8c00",
    descriptionJa:
      "北千住は5路線が交わる交通の要所！江戸時代から宿場町として栄えた歴史ある街。毎年7月の足立の花火大会は約1万3000発が打ち上がる夏の風物詩",
  },
  {
    id: "katsushika",
    name: "Katsushika",
    nameJa: "葛飾区",
    center: { lat: 35.7433, lng: 139.8476 }, // Kameari Station
    radius: 1800,
    prompt:
      "Nostalgic movie district energy, Shibamata Taishakuten temple atmosphere, traditional shitamachi culture, film heritage vibes, authentic Tokyo nostalgia",
    promptMorning:
      "Gentle nostalgic district awakening, peaceful Kameari dawn, soft traditional temple ambiance, quiet movie heritage morning, serene shitamachi atmosphere",
    promptEvening:
      "Lively nostalgic district evening, Kameari traditional nightlife, vibrant movie heritage energy, bustling shitamachi culture, authentic Tokyo nostalgia night",
    color: "#ffa500",
    descriptionJa:
      "映画「男はつらいよ」の舞台・柴又！寅さん記念館で映画の世界を体感できる。亀有駅前には「こち亀」の両さんの銅像が立つ",
  },
  {
    id: "edogawa",
    name: "Edogawa",
    nameJa: "江戸川区",
    center: { lat: 35.7064, lng: 139.868 }, // Koiwa Station
    radius: 1500,
    prompt:
      "Riverside residential district atmosphere, Edogawa River natural beauty, family-friendly neighborhood vibes, peaceful suburban living, green Tokyo suburbia",
    promptMorning:
      "Serene riverside awakening, peaceful Koiwa dawn, gentle river ambiance, quiet residential morning, tranquil natural atmosphere",
    promptEvening:
      "Peaceful riverside evening, Koiwa neighborhood night, gentle family-friendly atmosphere, serene residential nightlife, calm green Tokyo suburbia night",
    color: "#87ceeb",
    descriptionJa:
      "江戸川と自然豊かな環境、葛西臨海公園には水族館や観覧車があり家族連れに人気！江戸川花火大会は毎年8月に開催され約1万4000発が打ち上がる",
  },
  {
    id: "minato",
    name: "Minato",
    nameJa: "港区",
    center: { lat: 35.6581, lng: 139.7516 }, // Minato Ward Center (Toranomon area)
    radius: 1500,
    prompt:
      "International business district elegance, embassy district sophistication, high-rise towers and luxury atmosphere, cosmopolitan Tokyo energy, refined metropolitan vibes",
    promptMorning:
      "Serene business district awakening, peaceful Minato dawn, gentle embassy district ambiance, quiet high-rise morning, tranquil international atmosphere",
    promptEvening:
      "Sophisticated international district evening, Minato nightlife elegance, vibrant embassy and business scene, bustling luxury district, refined cosmopolitan Tokyo night",
    color: "#9400d3",
    descriptionJa:
      "国際的なビジネス街、大使館が多く外国人居住者も多い！東京タワーや六本木ヒルズがあり、夜景が美しい高層ビルが立ち並ぶ洗練されたエリア",
  },
];

// Basic district data - lightweight, loaded immediately
// Contains only data needed for distance calculations (~100 bytes each)
export const TOKYO_DISTRICTS_BASIC: DistrictBasic[] = TOKYO_DISTRICTS.map(
  (d) => ({
    id: d.id,
    name: d.name,
    nameJa: d.nameJa,
    center: d.center,
    radius: d.radius,
    color: d.color,
  })
);

// District details - heavyweight, loaded on demand
// Contains prompts and descriptions (~800-1200 bytes each)
// Only loaded when district is nearby (weight > threshold)
export const DISTRICT_DETAILS: Record<string, DistrictDetails> =
  Object.fromEntries(
    TOKYO_DISTRICTS.map((d) => [
      d.id,
      {
        prompt: d.prompt,
        promptMorning: d.promptMorning,
        promptEvening: d.promptEvening,
        descriptionJa: d.descriptionJa,
      },
    ])
  );

export const DEFAULT_DISTRICT_PROMPT =
  "Ambient Tokyo cityscape, gentle urban hum, distant traffic sounds, modern Japanese metropolis atmosphere, calm urban exploration";
export const DEFAULT_DISTRICT_PROMPT_MORNING =
  "Peaceful Tokyo dawn, soft ambient pads, gentle city awakening, tranquil urban morning, serene Japanese cityscape";
export const DEFAULT_DISTRICT_PROMPT_EVENING =
  "Vibrant Tokyo nightlife, energetic urban pulse, lively city sounds, exciting metropolitan evening, dynamic Japanese metropolis";

/**
 * Get the appropriate prompt for a district based on time of day
 * Works with both full District and DistrictDetails
 */
export function getDistrictPrompt(
  district: District | DistrictDetails,
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

// Maximum height for background ambient audio (meters)
export const BACKGROUND_AMBIENT_MAX_HEIGHT = 400;

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
    volume: 1.0,
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
    volume: 1.0,
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
    volume: 1.0,
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
    volume: 1.0,
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
    volume: 1.0,
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
    volume: 0.8,
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
    volume: 1.0,
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
    volume: 1.0,
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
    volume: 0.8,
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
    volume: 0.8,
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
    volume: 0.8,
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
    sunElevation: 60, // 太陽が地平線より下（真の夜）
    sunAzimuth: 240, // 西
    sky: {
      turbidity: 2.0, // 夜間の大気はより濁っている
      rayleigh: 0.5, // レイリー散乱を減らして暗く
      mieCoefficient: 0.0001, // 太陽は見えない
      mieDirectionalG: 0.9999,
    },
    ambient: {
      intensity: 0.1, // 非常に低い環境光（月明かりのみ）
      color: "#1a1a2e", // 深い青紫
    },
    directional: {
      intensity: 2, // 月明かり程度の弱い指向光
      color: "#4a5568", // 冷たい青灰色（月の光）
    },
    hemisphere: {
      skyColor: "#0a0a1a", // 非常に暗い青黒の空
      groundColor: "#000000", // 真っ黒な地面
      intensity: 0.1, // 非常に弱い半球光
    },
    colorMultiplier: {
      r: 0.3, // 大幅に暗く、青みがかった色調
      g: 0.4,
      b: 0.6, // 青を強調
    },
    fog: {
      color: "#1a1a2e", // 深い青紫の霧
      near: 100,
      far: 2000,
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
      r: 1.8, // Very strong orange/red bake
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
