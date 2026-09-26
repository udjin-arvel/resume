import { Users } from "lucide-react";
import { crewMemberLabel } from "@/lib/supervisor-report-documents";
import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type CrewMember = { id: string; firstName: string; lastName: string };

type SupervisorReportCrewSectionProps = {
  crew: CrewMember[];
};

export function SupervisorReportCrewSection({ crew }: SupervisorReportCrewSectionProps) {
  if (crew.length === 0) return null;

  return (
    <SupervisorReportDetailSection
      title={
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          На объекте присутствовало:
        </span>
      }
      badge={
        <span className="text-xs font-medium text-slate-500">{crew.length} человек</span>
      }
    >
      <div className="grid grid-cols-2 gap-2 px-4 py-4">
        {crew.map((member) => (
          <span
            key={member.id}
            className="truncate rounded-full bg-slate-100 px-3 py-1.5 text-center text-xs font-medium text-slate-700"
          >
            {crewMemberLabel(member)}
          </span>
        ))}
      </div>
    </SupervisorReportDetailSection>
  );
}
