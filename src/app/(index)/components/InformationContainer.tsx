import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import OperationManual from "./OperationManual";

interface InformationContainerProps {
  operationManualOpen: boolean;
  setOperationManualOpen: (open: boolean) => void;
}

export default function InformationContainer({
  operationManualOpen,
  setOperationManualOpen,
}: InformationContainerProps) {
  // Determine which accordion item is open
  const openValue = operationManualOpen ? "manual" : "";

  const handleValueChange = (value: string) => {
    if (value === "manual") {
      setOperationManualOpen(true);
    } else {
      // Collapsed
      setOperationManualOpen(false);
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
      </Accordion>
    </div>
  );
}
