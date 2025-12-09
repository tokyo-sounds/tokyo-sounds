import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft } from "lucide-react";

export default function BackToHomeButton() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="outline" size="lg" className="group" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="hidden md:block size-4 group-hover:-translate-x-1 transition-all" />
            HOME
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Go to Home</p>
      </TooltipContent>
    </Tooltip>
  );
}
