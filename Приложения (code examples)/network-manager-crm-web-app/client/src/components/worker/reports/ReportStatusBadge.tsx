import { useTranslation } from "react-i18next";
import { reportStatusBadgeMeta, supervisorReportStatusBadgeMeta } from "@/lib/worker-reports";

type ReportStatusBadgeProps = {
  status: string;
  variant?: "worker" | "supervisor";
};

export function ReportStatusBadge({ status, variant = "worker" }: ReportStatusBadgeProps) {
  const { t } = useTranslation();
  const meta =
    variant === "supervisor"
      ? supervisorReportStatusBadgeMeta(status)
      : reportStatusBadgeMeta(status);

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${meta.cls}`}>
      {t(meta.labelKey)}
    </span>
  );
}
