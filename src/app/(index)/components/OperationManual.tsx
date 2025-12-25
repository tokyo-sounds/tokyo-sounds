import { Kbd } from "@/components/ui/kbd";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function OperationManual({
  operationManualOpen,
  setOperationManualOpen,
}: {
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
}) {
  const t = useTranslations("OperationManual");
  return (
    <AccordionItem value="manual" className="hidden md:block border-none">
      <AccordionTrigger className="w-38 py-2 items-center text-muted justify-between hover:no-underline cursor-pointer">
        <Kbd className="text-muted bg-transparent border font-mono">H</Kbd>
        <span>{t("title")}</span>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-3 flex flex-col gap-2">
        <div className="space-y-2">
          <div className="flex justify-between items-end gap-2">
            <div className="grid grid-cols-3 grid-rows-2 gap-1 *:text-muted *:bg-transparent *:border">
              <Kbd className="col-start-2 row-start-1 font-mono">W</Kbd>
              <Kbd className="col-start-1 row-start-2 font-mono">A</Kbd>
              <Kbd className="col-start-2 row-start-2 font-mono">S</Kbd>
              <Kbd className="col-start-3 row-start-2 font-mono">D</Kbd>
            </div>
            <div className="grid grid-cols-3 grid-rows-2 gap-1 *:text-muted *:bg-transparent *:border">
              <Kbd className="col-start-2 row-start-1 font-mono">
                <ChevronUp strokeWidth={4} className="size-3" />
              </Kbd>
              <Kbd className="col-start-1 row-start-2 font-mono">
                <ChevronLeft strokeWidth={4} className="size-3" />
              </Kbd>
              <Kbd className="col-start-2 row-start-2 font-mono">
                <ChevronDown strokeWidth={4} className="size-3" />
              </Kbd>
              <Kbd className="col-start-3 row-start-2 font-mono">
                <ChevronRight strokeWidth={4} className="size-3" />
              </Kbd>
            </div>
          </div>
            <p className="text-muted text-right">{t("movement")}</p>
        </div>
        <div className="flex justify-between">
          <Kbd className="text-muted bg-transparent border font-mono">
            SPACE
          </Kbd>
          <span className="text-muted">{t("pause")}</span>
        </div>
        <div className="flex justify-between">
          <Kbd className="text-muted bg-transparent border font-mono">
            SHIFT
          </Kbd>
          <span className="text-muted">{t("accelerate")}</span>
        </div>
        <div className="flex justify-between">
          <Kbd className="text-muted bg-transparent border font-mono">TAB</Kbd>
          <span className="text-muted">{t("toggleDisplay")}</span>
        </div>
        <div className="flex justify-between">
          <Kbd className="text-muted bg-transparent border font-mono">ESC</Kbd>
          <span className="text-muted">{t("menu")}</span>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
