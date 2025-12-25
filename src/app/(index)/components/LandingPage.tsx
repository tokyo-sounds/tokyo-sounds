/** LandingPage
 *
 * Landing page for Tokyo Sounds
 * @returns null
 */
import { PASTEL_COLORS } from "../page";
import Nav from "@/components/layout/nav";
import HomeHero from "@/components/layout/HomeHero";
import LanguageSwitcher from "@/components/widget/LanguageSwitcher";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Send } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("LandingPage");
  return (
    <div className="w-full h-full min-h-svh relative flex flex-col items-center justify-center">
      <Nav />
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <HomeHero />
      <div className="flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl md:text-7xl text-white font-bold text-center text-shadow-lg animate-in fade-in slide-in-from-bottom duration-500">
          {t("title")}
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full translate-y-18 p-6"
            >
              <Send className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="flight-dashboard-card shadow-xl slide-in-from-bottom-2">
            <DialogHeader>
              <DialogTitle>{t("dialogTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t("namePlaceholder")}
                maxLength={20}
                className="w-full text-primary-foreground placeholder:text-primary-foreground/60"
                suppressHydrationWarning
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-center items-center gap-3">
                {PASTEL_COLORS.map((color) => {
                  const colorKey = color.name.toLowerCase();
                  const colorName = t(`colors.${colorKey}`);
                  return (
                    <button
                      key={color.hex}
                      onClick={() => setPlaneColor(color.hex)}
                      className={`size-8 rounded-full transition-all hover:scale-105 cursor-pointer ${
                        planeColor === color.hex
                          ? "ring-1 ring-white ring-offset-1 ring-offset-card scale-105"
                          : "hover:ring-1 hover:ring-white/50"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={colorName}
                      aria-label={t("colors.selectColor", { color: colorName })}
                    />
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("audioSettings")}</Label>
              <Label
                htmlFor="lyria"
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="lyria"
                  aria-label="Enable Lyria Generative Audio"
                  checked={generativeEnabled}
                  onChange={(e) => setGenerativeEnabled(e.target.checked)}
                  className="size-4 focus:ring-offset-1"
                />
                <span>{t("enableGenerativeAudio")}</span>
              </Label>
              <Label
                htmlFor="spatial"
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="spatial"
                  aria-label="Enable Spatial Audio"
                  checked={spatialAudioEnabled}
                  onChange={(e) => setSpatialAudioEnabled(e.target.checked)}
                  className="size-4 focus:ring-offset-1"
                />
                <span>{t("enableSpatialAudio")}</span>
              </Label>
            </div>

            <DialogFooter className="flex flex-col gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleStart}
                className="group text-white font-bold bg-transparent hover:bg-primary/40"
              >
                <SendHorizontal className="size-4 group-hover:translate-x-1 transition-all" />
                <span>{t("startButton")}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
