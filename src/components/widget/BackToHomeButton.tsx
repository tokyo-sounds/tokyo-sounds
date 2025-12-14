import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SendHorizontal } from "lucide-react";

export default function BackToHomeButton() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="outline"
          size="lg"
          className="group text-lg py-6 px-12 text-white bg-transparent hover:bg-accent/70"
          asChild
        >
          <Link href="/">
            <SendHorizontal className="size-4 mr-2 group-hover:translate-x-1 transition-all" />
            <span>ホーム</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>ホームに戻る</p>
      </TooltipContent>
    </Tooltip>
  );
}
