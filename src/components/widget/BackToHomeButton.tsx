import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Home } from "lucide-react";

export default function BackToHomeButton() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="outline" size="lg" className="group" asChild>
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft className="hidden md:block size-4 group-hover:-translate-x-1 transition-all" />
            <div className="flex items-center gap-2">
              <Home className="size-4" />
              HOME
            </div>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Go to Home</p>
      </TooltipContent>
    </Tooltip>
  );
}
