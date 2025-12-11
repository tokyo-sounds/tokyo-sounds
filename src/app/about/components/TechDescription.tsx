export default function TechDescription() {
  return (
    <section className="w-full flex flex-col gap-4 py-4">
      <h2 className="text-xl font-bold">1. 3D都市ビジュアライゼーション</h2>
      <ul className="list-disc list-inside">
        <li>Google Tiles統合による地図表示</li>
        <li>手続き型生成による建物配置</li>
        <li>4つのプレート（地区）システム</li>
        <li>音声マッピング対応の建物オブジェクト</li>
      </ul>
      <h2 className="text-xl font-bold">2. リアルタイム生成音声</h2>
      <ul className="list-disc list-inside">
        <li>Gemini Lyria Realtime APIによる音声生成</li>
        <li>重み付けプロンプトシステム</li>
        <li>位置情報に基づく音声ブレンド</li>
        <li>リアルタイムストリーミング再生</li>
      </ul>
    </section>
  );
}
