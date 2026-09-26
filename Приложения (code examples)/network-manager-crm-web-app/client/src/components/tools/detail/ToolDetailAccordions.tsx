import type { ToolDetail } from "@/lib/api/tools";
import { ToolDetailAccordion } from "./ToolDetailAccordion";
import { ToolCalibrationSection } from "./ToolCalibrationSection";
import { ToolGeneralInfoSection } from "./ToolGeneralInfoSection";
import { ToolUsageLimitSection } from "./ToolUsageLimitSection";
import {
  getAccordionDefaultOpen,
  showAccordions,
  showCalibrationSection,
  showGeneralInfo,
  showUsageSection,
} from "./toolDetailDisplay";

type ToolDetailAccordionsProps = {
  tool: ToolDetail;
  calibrationDoc?: { id: string; filename: string; mimeType?: string } | null;
};

export function ToolDetailAccordions({ tool, calibrationDoc }: ToolDetailAccordionsProps) {
  if (!showAccordions(tool)) return null;

  return (
    <div className="space-y-2">
      {showGeneralInfo(tool) ? (
        <ToolDetailAccordion
          title="Общая информация"
          defaultOpen={getAccordionDefaultOpen(tool, "general")}
        >
          <ToolGeneralInfoSection tool={tool} />
        </ToolDetailAccordion>
      ) : null}

      {showCalibrationSection(tool) ? (
        <ToolDetailAccordion
          title="Калибровка"
          defaultOpen={getAccordionDefaultOpen(tool, "calibration")}
        >
          <ToolCalibrationSection tool={tool} calibrationDoc={calibrationDoc} />
        </ToolDetailAccordion>
      ) : null}

      {showUsageSection(tool) ? (
        <ToolDetailAccordion
          title="Лимит использований"
          defaultOpen={getAccordionDefaultOpen(tool, "usage")}
        >
          <ToolUsageLimitSection tool={tool} />
        </ToolDetailAccordion>
      ) : null}
    </div>
  );
}
