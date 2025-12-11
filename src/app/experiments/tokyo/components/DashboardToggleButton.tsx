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
          className="absolute top-4 right-4 z-50 flight-dashboard-card hover:bg-black/70 hover:text-white"
          aria-label={dashboardVisible ? "Hide dashboard" : "Show dashboard"}
        >
          {dashboardVisible ? (
            <EyeClosed strokeWidth={1} className="size-5" />
          ) : (
            <Eye strokeWidth={1} className="size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {dashboardVisible ? "Hide dashboard" : "Show dashboard"}
      </TooltipContent>
    </Tooltip>
  );
}
