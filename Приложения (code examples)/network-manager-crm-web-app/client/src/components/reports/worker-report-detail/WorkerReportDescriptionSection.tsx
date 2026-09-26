import { WorkerReportDetailSection } from "./WorkerReportDetailSection";

type WorkerReportDescriptionSectionProps = {
  description: string;
};

export function WorkerReportDescriptionSection({
  description,
}: WorkerReportDescriptionSectionProps) {
  if (!description.trim()) return null;

  return (
    <WorkerReportDetailSection title="Описание работ">
      <p className="whitespace-pre-line p-3 text-[14px] md:text-[16px] leading-relaxed text-slate-700">
        {description}
      </p>
    </WorkerReportDetailSection>
  );
}
