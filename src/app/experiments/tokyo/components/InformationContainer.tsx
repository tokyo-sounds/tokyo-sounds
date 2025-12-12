import { type DistrictDebugInfo } from "@/components/city/DistrictLyriaAudio";
import { Kbd } from "@/components/ui/kbd";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import OperationManual from "./OperationManual";
import DistrictDebugPanel from "./DistrictDebugPanel";

interface InformationContainerProps {
  districts: DistrictDebugInfo[];
  districtDebugCollapsed: boolean;
  setDistrictDebugCollapsed: (collapsed: boolean) => void;
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
  generativeEnabled: boolean;
}

export default function InformationContainer({
  districts,
  districtDebugCollapsed,
  setDistrictDebugCollapsed,
  operationManualOpen,
  setOperationManualOpen,
  generativeEnabled,
}: InformationContainerProps) {
  // Determine which accordion item is open
  const openValue = operationManualOpen
    ? "manual"
    : !districtDebugCollapsed
    ? "districts"
    : "";

  const handleValueChange = (value: string) => {
    if (value === "manual") {
      setOperationManualOpen(true);
      setDistrictDebugCollapsed(true);
    } else if (value === "districts") {
      setOperationManualOpen(false);
      setDistrictDebugCollapsed(false);
    } else {
      // Both collapsed
      setOperationManualOpen(false);
      setDistrictDebugCollapsed(true);
    }
  };

  return (
    <div className="flight-dashboard-card px-2 font-sans rounded-lg pointer-events-auto">
      <Accordion
        type="single"
        collapsible
        value={openValue}
        onValueChange={handleValueChange}
        className="w-full **:text-xs"
      >
        {/* Operation Manual Section */}
        <OperationManual
          operationManualOpen={operationManualOpen}
          setOperationManualOpen={setOperationManualOpen}
        />

        {/* District Debug Panel Section */}
        {generativeEnabled && districts.length > 0 && (
          <DistrictDebugPanel
            districts={districts}
            districtDebugCollapsed={districtDebugCollapsed}
            setDistrictDebugCollapsed={setDistrictDebugCollapsed}
          />
        )}
      </Accordion>
    </div>
  );
}
