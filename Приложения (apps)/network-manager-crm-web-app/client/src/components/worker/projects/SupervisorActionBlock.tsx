import { Link } from "@tanstack/react-router";
import { ClipboardList, Users, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

type SupervisorActionBlockProps = {
  projectId: string;
};

export function SupervisorActionBlock({ projectId }: SupervisorActionBlockProps) {
  const { t } = useTranslation();

  const actionClassName =
    "flex flex-col items-center gap-2 rounded-[8px] bg-[#EFF6FF] px-2 py-4 text-center transition-colors hover:bg-[#DBEAFE]";

  return (
    <section className="rounded-[12px] border border-[#E0E4EC] bg-white p-3">
      <h2 className="text-[14px] font-semibold text-[#1A1C29]">{t("worker.projects.supervisorTitle")}</h2>
      <p className="mt-1 text-[12px] text-[#8E97AF]">{t("worker.projects.supervisorSubtitle")}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link
          to="/worker/reports"
          search={{ type: "daily", projectId }}
          className={actionClassName}
        >
          <ClipboardList className="h-5 w-5 text-[#2563EB]" />
          <span className="text-[11px] font-medium leading-tight text-[#1A1C29]">
            {t("worker.projects.actions.dailyReports")}
          </span>
        </Link>
        <Link
          to="/worker/projects/$projectId/team"
          params={{ projectId }}
          className={actionClassName}
        >
          <Users className="h-5 w-5 text-[#2563EB]" />
          <span className="text-[11px] font-medium leading-tight text-[#1A1C29]">
            {t("worker.projects.actions.team")}
          </span>
        </Link>
        <Link
          to="/worker/projects/$projectId/tools"
          params={{ projectId }}
          className={actionClassName}
        >
          <Wrench className="h-5 w-5 text-[#2563EB]" />
          <span className="text-[11px] font-medium leading-tight text-[#1A1C29]">
            {t("worker.projects.actions.tools")}
          </span>
        </Link>
      </div>
    </section>
  );
}
