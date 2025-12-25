import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, EyeClosed } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DashboardToggleButton({
  dashboardVisible,
  setDashboardVisible,
}: {
  dashboardVisible: boolean;
  setDashboardVisible: (visible: boolean) => void;
}) {
  const t = useTranslations("DashboardToggleButton");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDashboardVisible(!dashboardVisible)}
          className="rounded-full text-white/70 text-shadow-sm hover:bg-black/30 hover:border hover:border-border/50 hover:text-white text-xs font-mono pointer-events-auto z-40"
          aria-label={
            dashboardVisible ? t("hideDashboard") : t("showDashboard")
          }
        >
          {dashboardVisible ? (
            <Eye className="size-4" />
          ) : (
            <EyeClosed strokeWidth={1.5} className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {dashboardVisible ? t("hideUITooltip") : t("showUITooltip")}
      </TooltipContent>
    </Tooltip>
  );
}
