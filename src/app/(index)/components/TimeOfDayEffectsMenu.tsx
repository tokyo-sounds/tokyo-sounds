"use client";

import { useTimeOfDayStore } from "@/stores/use-time-of-day-store";
import { TimeOfDay } from "@/config/tokyo-config";
import { TIME_OF_DAY_PRESETS } from "@/config/tokyo-config";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sun, Sunrise, Sunset, LucideIcon } from "lucide-react";

const TIME_OF_DAY_ICONS: Record<TimeOfDay, LucideIcon> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
};

export default function TimeOfDayEffectsMenu() {
  const { currentTime, setTimeOfDay } = useTimeOfDayStore();
  const timeOptions: TimeOfDay[] = ["morning", "afternoon", "evening"];
  return (
    <div className="flex flex-col gap-1 pointer-events-auto">
      {timeOptions.map((time) => {
        const Icon = TIME_OF_DAY_ICONS[time];
        return (
          <Tooltip key={time} delayDuration={700}>
            <TooltipTrigger asChild>
              <Button
                key={time}
                variant="ghost"
                size="icon"
                onClick={() => setTimeOfDay(time)}
                className={`rounded-full ${
                  currentTime === time
                    ? "bg-primary/70 text-primary-foreground border hover:text-white"
                    : "flight-dashboard-card text-muted"
                }`}
              >
                <Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="pointer-events-none select-none"
            >
              <p>{TIME_OF_DAY_PRESETS[time].nameJa}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
