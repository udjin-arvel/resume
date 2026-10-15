import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type SupervisorReportCompletedWorksSectionProps = {
  completedWorks: string;
};

export function SupervisorReportCompletedWorksSection({
  completedWorks,
}: SupervisorReportCompletedWorksSectionProps) {
  if (!completedWorks.trim()) return null;

  return (
    <SupervisorReportDetailSection title="Выполненные работы за день">
      <p className="whitespace-pre-line p-3 text-[14px] md:text-[16px] leading-relaxed text-slate-700">
        {completedWorks}
      </p>
    </SupervisorReportDetailSection>
  );
}
