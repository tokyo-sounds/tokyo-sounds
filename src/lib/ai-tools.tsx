import { Tool } from "ai";
import { z } from "zod";

export const ExampleGetWeatherTool: Tool = {
  name: "getWeather",
  description: "Get the weather in a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  // location below is inferred to be a string:
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
};

export const ProjectBriefTool: Tool = {
  name: "projectBrief",
  description: "Get the brief of Tokyo Sounds",
  inputSchema: z.object({
    project: z.string().describe("Brief description of Tokyo Sounds"),
  }),
  execute: async ({ project }) => ({
    project,
    summary:
      "Tokyo Soundsは、Google Maps 3D Tiles APIとThree.jsを活用し、東京の立體地図を生成し、ユーザーの現在位置に応じて実地の背景音を再生し、さらにAIがリアルタイムでその地域の雰囲気に合った背景音楽を生成するウェブサイトです。" +
      "Next.jsを基盤とし、React Three Fiberで3Dレンダリングを実現しています。Google Maps 3D Tiles APIにより、東京の建物や街並みを立体的に再現し、ユーザーは仮想的に東京の上空を飛行しながら、リアルな都市景観を体験できます。" +
      "音では、Google Places APIでユーザーの周辺のPOI（駅、神社、商業施設など）を取得し、各地点に配置された実地録音の背景音を空間音響として再生します。これにより、新宿エリアでは電車のアナウンスが、浅草エリアでは伝統的な祭りの音が聞こえるなど、地域ごとの音環境を再現します。" +
      "さらに、Google Lyriaのリアルタイム音楽生成機能を統合し、ユーザーの位置に応じて、その地域の雰囲気に合わせた音楽をリアルタイムで生成・再生します。例えば、新宿ではネオンに彩られた夜のエレクトロニックビート、浅草では伝統的な和太鼓や三味線の音色が反映されます。各エリアには独自のプロンプトが設定されており、12の主要エリア（新宿、渋谷、東京駅、池袋、銀座、秋葉原、浅草、六本木、品川、上野、原宿、恵比寿）それぞれに特徴的な音楽が生成されます。" +
      "技術的には、ECEF座標系からENU座標系への変換により、東京を中心としたローカル座標系で3Dタイルを表示し、カメラの位置に基づいて動的にPOIを取得し、距離に応じた空間音響の減衰を実装しています。また、Lyria APIとのWebSocket接続により、低遅延で音楽生成を行い、ユーザーの移動に即座に反応して音楽が変化します。" +
      "このプロジェクトは、視覚的な3D体験と音響体験、そしてAIによる動的な音楽生成を統合し、東京という都市を多層的に体験できる新しい形のデジタルアート作品となっています。ユーザーは、まるで紙飛行機に乗って東京の上空を飛んでいるような感覚で、各エリアの独特な雰囲気を視覚と音響の両面から楽しむことができます。",
  }),
};
