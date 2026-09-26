import { z } from "zod";

export const dailyReportFormSchema = z.object({
  projectId: z.string().min(1, "Выберите проект"),
  reportDate: z.string().min(1),
  completedWorks: z.string().min(1, "Укажите выполненные работы"),
  crewUserIds: z.array(z.string()),
  hasIssue: z.boolean(),
  hasDowntime: z.boolean(),
  issueCategory: z.string().optional(),
  issueDescription: z.string().optional(),
  downtimeHours: z.string().optional(),
  downtimeReason: z.string().optional(),
  linkedIssueIds: z.array(z.string()),
});

export type DailyReportFormValues = z.infer<typeof dailyReportFormSchema>;

export type DailyReportSubmitPayload = DailyReportFormValues & {
  voiceBlob: Blob | null;
  photos: File[];
  mediaDocuments: File[];
  issuePhotos: File[];
  downtimeFiles: File[];
};

export function deriveSiteStatus(values: DailyReportFormValues): "ok" | "issue" | "downtime" {
  if (values.hasDowntime && (values.downtimeHours?.trim() || values.downtimeReason?.trim())) {
    return "downtime";
  }
  if (values.hasIssue && (values.issueCategory?.trim() || values.issueDescription?.trim())) {
    return "issue";
  }
  return "ok";
}
