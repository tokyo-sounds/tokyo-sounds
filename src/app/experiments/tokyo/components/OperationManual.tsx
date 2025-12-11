import { Kbd } from "@/components/ui/kbd";

export default function OperationManul() {
  return (
    <div className="flex flex-col gap-2 flight-dashboard-card font-sans p-3 rounded-lg">
      <span>
        <Kbd>W</Kbd>
        <Kbd>S</Kbd> pitch
      </span>
      <span>
        <Kbd>A</Kbd>
        <Kbd>D</Kbd> bank
      </span>
      <span>
        <Kbd>SHIFT</Kbd> boost
      </span>
      <span>
        <Kbd>SPACE</Kbd> freeze
      </span>
    </div>
  );
}
