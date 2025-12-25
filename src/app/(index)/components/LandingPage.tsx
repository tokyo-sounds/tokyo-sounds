/** LandingPage
 *
 * Landing page for Tokyo Sounds
 * Static content component - Dialog form extracted to PlayerForm for better separation
 */
import Nav from "@/components/layout/nav";
import HomeHero from "@/components/layout/HomeHero";
import LanguageSwitcher from "@/components/widget/LanguageSwitcher";
import PlayerForm from "./PlayerForm";

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
    <div className="w-full h-full min-h-svh relative flex flex-col items-center justify-center">
      <Nav />
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <HomeHero />
      <div className="flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl md:text-7xl text-white font-bold text-center text-shadow-lg animate-in fade-in slide-in-from-bottom duration-500">
          東京の音
        </h1>
        <PlayerForm
          playerName={playerName}
          setPlayerName={setPlayerName}
          planeColor={planeColor}
          setPlaneColor={setPlaneColor}
          generativeEnabled={generativeEnabled}
          setGenerativeEnabled={setGenerativeEnabled}
          spatialAudioEnabled={spatialAudioEnabled}
          setSpatialAudioEnabled={setSpatialAudioEnabled}
          handleStart={handleStart}
        />
      </div>
    </div>
  );
}
