import { Kbd } from "@/components/ui/kbd";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function OperationManual({
  operationManualOpen,
  setOperationManualOpen,
}: {
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
}) {
  return (
    <AccordionItem value="manual" className="hidden md:block border-none">
      <AccordionTrigger className="py-2 items-center text-muted justify-center hover:no-underline cursor-pointer">
        <Kbd className="text-muted bg-transparent border font-mono">H</Kbd>
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
              TAB
            </Kbd>
            <span className="text-muted">UI 表示/非表示</span>
          </div>
          <div className="flex justify-between">
            <Kbd className="text-muted bg-transparent border font-mono">/</Kbd>
            <span className="text-muted">開発者メニュー</span>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
