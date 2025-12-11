import { Kbd } from "@/components/ui/kbd";

export default function OperationManul() {
  return (
    <div className="flex flex-col gap-2 bg-black/[0.1] backdrop-blur-xs rounded-lg p-3 text-background text-xs font-sans">
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
