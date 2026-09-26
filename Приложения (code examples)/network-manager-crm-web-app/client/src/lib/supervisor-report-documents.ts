type ReportDocument = {
  id: string;
  filename?: string | null;
  documentType?: string | null;
  mimeType?: string | null;
};

export function groupSupervisorReportDocuments(documents: ReportDocument[]) {
  const photos: ReportDocument[] = [];
  const issueAttachments: ReportDocument[] = [];
  const downtimeAttachments: ReportDocument[] = [];
  const voice: ReportDocument[] = [];
  const other: ReportDocument[] = [];

  for (const doc of documents) {
    const type = doc.documentType ?? "";
    if (type === "photo") photos.push(doc);
    else if (type === "issue_attachment") issueAttachments.push(doc);
    else if (type === "downtime_attachment") downtimeAttachments.push(doc);
    else if (type === "voice") voice.push(doc);
    else other.push(doc);
  }

  return { photos, issueAttachments, downtimeAttachments, voice, other };
}

export function supervisorReportReason(report: {
  siteStatus?: string;
  downtimeReason?: string;
  issueDescription?: string;
  description?: string;
}) {
  if (report.downtimeReason?.trim()) return report.downtimeReason.trim();
  if (report.issueDescription?.trim()) return report.issueDescription.trim();
  if (report.siteStatus === "issue" || report.siteStatus === "downtime") {
    return report.description?.trim() ?? "";
  }
  return "";
}

export function formatSupervisorReportDateLabel(reportDate: string) {
  const formatted = reportDate.includes(".")
    ? reportDate
    : new Date(reportDate.includes("T") ? reportDate : `${reportDate}T00:00:00`).toLocaleDateString(
        "ru-RU",
        { day: "2-digit", month: "2-digit", year: "numeric" },
      );
  return `Отчёт за ${formatted}`;
}

export function crewMemberLabel(member: { firstName: string; lastName: string }) {
  return `${member.firstName} ${member.lastName}`.trim();
}

export const projectIssueStatusLabels: Record<string, string> = {
  open: "Открыта",
  in_progress: "В работе",
  resolved: "Решена",
};
