import { Kbd } from "@/components/ui/kbd";
import { Info, X } from "lucide-react";

export default function OperationManul({
  operationManualOpen,
  setOperationManualOpen,
}: {
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 flight-dashboard-card font-sans rounded-lg transition-all ${
        operationManualOpen ? "p-3" : "p-0"
      }`}
    >
      <button
        onClick={() => setOperationManualOpen(!operationManualOpen)}
        aria-label="Open operation manual"
        className={`focus:outline-none cursor-pointer pointer-events-auto ${
          operationManualOpen ? "p-0" : "p-2"
        }`}
      >
        {operationManualOpen ? (
          <div className="flex items-center justify-between gap-2 text-muted">
            操作ガイド
            <X strokeWidth={1} className="size-4" />
          </div>
        ) : (
          <Info strokeWidth={1} className="size-4" />
        )}
      </button>
      {operationManualOpen && (
        <>
          <div className="flex items-end gap-2">
            <div className="grid grid-cols-4 grid-rows-2 gap-1 *:text-muted *:bg-transparent *:border">
              <Kbd className="col-start-2 row-start-1 font-mono">W</Kbd>
              <Kbd className="col-start-1 row-start-2 font-mono">A</Kbd>
              <Kbd className="col-start-2 row-start-2 font-mono">S</Kbd>
              <Kbd className="col-start-3 row-start-2 font-mono">D</Kbd>
            </div>
            <span className="text-muted">移動</span>
          </div>
          <div className="flex justify-between">
            <Kbd className="text-muted bg-transparent border font-mono">
              SPACE
            </Kbd>
            <span className="text-muted">ブレーキ</span>
          </div>
          <div className="flex justify-between">
            <Kbd className="text-muted bg-transparent border font-mono">
              SHIFT
            </Kbd>
            <span className="text-muted">ターボ</span>
          </div>
          <div className="flex justify-between">
            <Kbd className="text-muted bg-transparent border font-mono">H</Kbd>
            <span className="text-muted">操作ガイド</span>
          </div>
          <div className="flex justify-between">
            <Kbd className="text-muted bg-transparent border font-mono">
              TAB
            </Kbd>
            <span className="text-muted">UI 表示/非表示</span>
          </div>
        </>
      )}
    </div>
  );
}
