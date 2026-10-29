import { Link } from "@tanstack/react-router";
import type { z } from "zod";
import { Building2, Calendar, Camera, ChevronRight, Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { supervisorReportSchema } from "@/lib/api/schemas";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { formatDate, parseDecimal } from "@/lib/format";
import { ReportStatusBadge } from "./ReportStatusBadge";

type SupervisorReport = z.infer<typeof supervisorReportSchema>;

type SupervisorReportCardProps = {
  report: SupervisorReport;
};

function isPhotoDocument(documentType: string) {
  return documentType === "photo" || documentType.includes("image");
}

export function SupervisorReportCard({ report }: SupervisorReportCardProps) {
  const { t } = useTranslation();
  const downtimeHours = parseDecimal(report.downtimeHours);
  const isDowntime = report.siteStatus === "downtime" || downtimeHours > 0;
  const dateLabel = t("worker.reports.dailyReportLabel", { date: formatDate(report.reportDate) });
  const attachments = report.attachmentsPreview ?? [];

  return (
    <Link
      to="/worker/daily-reports/$dailyId"
      params={{ dailyId: report.id }}
      className="card-hover block rounded-[12px] border border-[#E0E4EC] bg-white p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[16px] font-bold text-[#1A1C29]">{report.projectName}</p>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#8E97AF]" aria-hidden="true" />
      </div>

      <div className="mt-3 space-y-2 text-[12px] text-[#8E97AF]">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{dateLabel}</span>
          </span>
          <ReportStatusBadge status={report.status} variant="supervisor" />
        </div>

        {isDowntime ? (
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{report.projectName}</span>
            </span>
            <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-[#FEF2F2] text-[#B91C1C]">
              {t("worker.reports.downtimeShort", { hours: downtimeHours })}
            </span>
          </div>
        ) : null}
      </div>

      {isDowntime && report.downtimeReason ? (
        <div className="mt-3 border-t border-[#E0E4EC] pt-3">
          <p className="text-[12px] text-[#8E97AF]">{t("worker.reports.downtimeReason")}</p>
          <p className="mt-1 text-[12px] text-[#1A1C29]">{report.downtimeReason}</p>
        </div>
      ) : null}

      {report.managerComment ? (
        <div className="mt-3 border-t border-[#E0E4EC] pt-3">
          <p className="text-[12px] text-[#8E97AF]">{t("worker.reports.managerComment")}</p>
          <p className="mt-1 text-[12px] font-medium text-[#B91C1C]">{report.managerComment}</p>
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()} role="presentation">
          {attachments.map((attachment) => {
            const Icon = isPhotoDocument(attachment.documentType) ? Camera : Paperclip;
            return (
              <DocumentOpenLink
                key={attachment.id}
                documentId={attachment.id}
                filename={attachment.filename}
                className="inline-flex items-center gap-1 rounded-full border border-[#E0E4EC] bg-white px-3 py-1 text-[11px] text-[#1A1C29] hover:bg-gray-50"
              >
                <Icon className="h-3 w-3 shrink-0 text-[#8E97AF]" />
                <span className="max-w-[140px] truncate">{attachment.filename}</span>
              </DocumentOpenLink>
            );
          })}
        </div>
      ) : null}
    </Link>
  );
}
