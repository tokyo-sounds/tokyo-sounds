"use client";

import { useState } from "react";
import { Kbd } from "@/components/ui/kbd";
import { Info, X } from "lucide-react";

export default function OperationManul() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col gap-2 flight-dashboard-card font-sans p-3 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open operation manual"
        className="flex items-center justify-between gap-2 focus:outline-none cursor-pointer pointer-events-auto"
      >
        <span className="text-muted">操作ガイド</span>
        {isOpen ? (
          <X strokeWidth={1} className="size-4" />
        ) : (
          <Info strokeWidth={1} className="size-4" />
        )}
      </button>
      {isOpen && (
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
              SHIFT
            </Kbd>
            <span className="text-muted">ブレーキ</span>
          </div>
          <div className="flex justify-between">
            <Kbd className="text-muted bg-transparent border font-mono">
              SPACE
            </Kbd>
            <span className="text-muted">ターボ</span>
          </div>
        </>
      )}
    </div>
  );
}
