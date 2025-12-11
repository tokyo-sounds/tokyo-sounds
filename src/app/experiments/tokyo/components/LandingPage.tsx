/** LandingPage
 *
 * Landing page for Tokyo Sounds
 * @returns null
 */
import { PASTEL_COLORS } from "../TokyoClient";

interface LandingPageProps {
  playerName: string;
  setPlayerName: (playerName: string) => void;
  planeColor: string;
  setPlaneColor: (planeColor: string) => void;
  generativeEnabled: boolean;
  setGenerativeEnabled: (generativeEnabled: boolean) => void;
  spatialAudioEnabled: boolean;
  setSpatialAudioEnabled: (spatialAudioEnabled: boolean) => void;
  handleStart: () => void;
}

export default function LandingPage({
  playerName,
  setPlayerName,
  planeColor,
  setPlaneColor,
  generativeEnabled,
  setGenerativeEnabled,
  spatialAudioEnabled,
  setSpatialAudioEnabled,
  handleStart,
}: LandingPageProps) {
  return (
    <div className="flex items-center justify-center w-full h-svh bg-linear-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="text-center space-y-6 max-w-lg px-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight bg-linear-to-r from-cyan-400 via-fuchsia-500 to-amber-400 bg-clip-text text-transparent">
            TOKYO SOUNDS
          </h1>
          <p className="text-slate-400">
            Fly through real Tokyo with AI-generated music
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-2xl space-y-4">

          <div className="border-t border-slate-700/50 pt-4">
            <label className="block text-slate-400 text-sm mb-2">
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name (optional)"
              maxLength={20}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-fuchsia-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-2">
              Plane Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PASTEL_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setPlaneColor(color.hex)}
                  className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                    planeColor === color.hex
                      ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                      : "hover:ring-1 hover:ring-white/50"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Selected:{" "}
              <span className="text-white">
                {PASTEL_COLORS.find((c) => c.hex === planeColor)?.name}
              </span>
            </p>
          </div>

          <div className="border-t border-slate-700/50 pt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="lyria"
              checked={generativeEnabled}
              onChange={(e) => setGenerativeEnabled(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-fuchsia-500"
            />
            <label htmlFor="lyria" className="text-slate-300 text-sm">
              Enable Lyria Generative Audio
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="spatial"
              checked={spatialAudioEnabled}
              onChange={(e) => setSpatialAudioEnabled(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-cyan-500"
            />
            <label htmlFor="spatial" className="text-slate-300 text-sm">
              Enable Spatial Audio (ambient sounds)
            </label>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg text-xs space-y-1">
            <p className="text-cyan-400 font-bold">CONTROLS</p>
            <div className="grid grid-cols-2 gap-x-4 text-slate-400">
              <span>
                <span className="text-white font-mono">W/S</span> Pitch
              </span>
              <span>
                <span className="text-white font-mono">A/D</span> Bank/Turn
              </span>
              <span>
                <span className="text-white font-mono">SHIFT</span> Boost
              </span>
              <span>
                <span className="text-white font-mono">SPACE</span> Freeze
              </span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full px-6 py-3 bg-linear-to-r from-cyan-500 via-fuchsia-500 to-amber-500 text-white font-bold rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            Enter Tokyo
          </button>
        </div>
      </div>
    </div>
  );
}
