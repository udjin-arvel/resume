import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type SupervisorReportDescriptionSectionProps = {
  description: string;
};

export function SupervisorReportDescriptionSection({
  description,
}: SupervisorReportDescriptionSectionProps) {
  if (!description.trim()) return null;

  return (
    <SupervisorReportDetailSection title="Текстовое описание">
      <p className="whitespace-pre-line p-3 text-[14px] md:text-[16px] leading-relaxed text-slate-700">
        {description}
      </p>
    </SupervisorReportDetailSection>
  );
}
