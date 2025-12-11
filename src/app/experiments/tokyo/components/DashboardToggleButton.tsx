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
          className="absolute top-4 right-4 z-50 flight-dashboard-card hover:text-white"
          aria-label={dashboardVisible ? "Hide dashboard" : "Show dashboard"}
        >
          {dashboardVisible ? (
            <Eye strokeWidth={1} className="size-5" />
          ) : (
            <EyeClosed strokeWidth={1} className="size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {dashboardVisible ? "UI 非表示" : "UI 表示"}
      </TooltipContent>
    </Tooltip>
  );
}
