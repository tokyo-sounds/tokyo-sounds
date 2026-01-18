"use client";

/** PlayerForm
 *
 * Player settings form dialog component
 * Extracted from LandingPage to enable SSG
 */
import { PASTEL_COLORS } from "../page";
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
import { SendHorizontal, Send, Plane } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

interface PlayerFormProps {
  playerName: string;
  setPlayerName: (playerName: string) => void;
  planeColor: string;
  setPlaneColor: (planeColor: string) => void;
  generativeEnabled: boolean;
  setGenerativeEnabled: (generativeEnabled: boolean) => void;
  spatialAudioEnabled: boolean;
  setSpatialAudioEnabled: (spatialAudioEnabled: boolean) => void;
  handleStart: () => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function PlayerForm({
  playerName,
  setPlayerName,
  planeColor,
  setPlaneColor,
  generativeEnabled,
  setGenerativeEnabled,
  spatialAudioEnabled,
  setSpatialAudioEnabled,
  handleStart,
  isOpen,
  setIsOpen,
}: PlayerFormProps) {
  const t = useTranslations("LandingPage");

  const dialogProps = setIsOpen 
    ? { open: isOpen, onOpenChange: setIsOpen }
    : {};

  return (
    <Dialog {...dialogProps}>
      <DialogTrigger asChild>
        <motion.button
          className="relative flex items-center gap-2.5 px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 overflow-hidden group cursor-pointer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          
          <div className="absolute inset-0 bg-linear-to-t from-orange-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Plane className="relative z-10 w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
          <span className="relative z-10">{t("startFlying")}</span>
        </motion.button>
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
  );
}

