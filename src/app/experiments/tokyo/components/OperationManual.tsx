import { Kbd } from "@/components/ui/kbd";
import { Info } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function OperationManul({
  operationManualOpen,
  setOperationManualOpen,
}: {
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
}) {
  return (
    <div className="flight-dashboard-card px-2  font-sans rounded-lg pointer-events-auto">
      <Accordion
        type="single"
        collapsible
        value={operationManualOpen ? "manual" : ""}
        onValueChange={(value) => setOperationManualOpen(value === "manual")}
        className="w-full"
      >
        <AccordionItem value="manual" className="border-none">
          <AccordionTrigger className="py-2 items-center text-muted justify-center hover:no-underline cursor-pointer">
            <Info strokeWidth={1} className="size-4" />
            <span>操作ガイド</span>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-3">
            <div className="flex flex-col gap-2">
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
                <Kbd className="text-muted bg-transparent border font-mono">
                  H
                </Kbd>
                <span className="text-muted">操作ガイド</span>
              </div>
              <div className="flex justify-between">
                <Kbd className="text-muted bg-transparent border font-mono">
                  TAB
                </Kbd>
                <span className="text-muted">UI 表示/非表示</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
