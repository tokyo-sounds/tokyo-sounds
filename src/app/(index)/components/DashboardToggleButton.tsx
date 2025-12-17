import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, EyeClosed } from "lucide-react";

export default function DashboardToggleButton({
  dashboardVisible,
  setDashboardVisible,
}: {
  dashboardVisible: boolean;
  setDashboardVisible: (visible: boolean) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDashboardVisible(!dashboardVisible)}
          className="fixed top-4 right-4 rounded-full text-white/70 text-shadow-sm hover:bg-black/30 hover:border hover:border-border/50 hover:text-white text-xs font-mono pointer-events-auto"
          aria-label={dashboardVisible ? "Hide dashboard" : "Show dashboard"}
        >
          {dashboardVisible ? (
            <Eye className="size-4" />
          ) : (
            <EyeClosed strokeWidth={1.5} className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {dashboardVisible ? "UI 非表示" : "UI 表示"}
      </TooltipContent>
    </Tooltip>
  );
}
