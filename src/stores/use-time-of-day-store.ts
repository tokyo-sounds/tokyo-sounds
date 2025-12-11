import { create } from "zustand";
import {
  TimeOfDay,
  TimeOfDayPreset,
  TIME_OF_DAY_PRESETS,
} from "@/config/tokyo-config";

interface TimeOfDayState {
  currentTime: TimeOfDay;
  preset: TimeOfDayPreset;
  setTimeOfDay: (time: TimeOfDay) => void;
}

export const useTimeOfDayStore = create<TimeOfDayState>((set) => ({
  currentTime: "afternoon",
  preset: TIME_OF_DAY_PRESETS.afternoon,
  setTimeOfDay: (time: TimeOfDay) =>
    set({
      currentTime: time,
      preset: TIME_OF_DAY_PRESETS[time],
    }),
}));
