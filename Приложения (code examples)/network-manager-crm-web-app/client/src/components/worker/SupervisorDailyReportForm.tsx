import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z as zod } from "zod";
import { useProjectIssues } from "@/lib/api/hooks/useProjects";
import type { supervisorReportSchema } from "@/lib/api/schemas";
import { ReportFormFooter } from "@/components/worker/reports/ReportFormFooter";
import { DailyReportCrewSection } from "./daily-report/DailyReportCrewSection";
import { DailyReportDowntimeSection } from "./daily-report/DailyReportDowntimeSection";
import { DailyReportIssueSection } from "./daily-report/DailyReportIssueSection";
import { DailyReportLinkedIssuesSection } from "./daily-report/DailyReportLinkedIssuesSection";
import { DailyReportMainSection } from "./daily-report/DailyReportMainSection";
import { DailyReportMediaSection } from "./daily-report/DailyReportMediaSection";
import { DailyReportVoiceSection } from "./daily-report/DailyReportVoiceSection";
import {
  dailyReportFormSchema,
  type DailyReportFormValues,
  type DailyReportSubmitPayload,
} from "./daily-report/types";

export type { DailyReportSubmitPayload as SupervisorDailyReportSubmitPayload };

type SupervisorReport = zod.infer<typeof supervisorReportSchema>;

type ProjectOption = { id: string; name: string };
type CrewOption = { id: string; firstName: string; lastName: string };

type SupervisorDailyReportFormProps = {
  projects: ProjectOption[];
  crewMembers?: CrewOption[];
  defaultProjectId?: string;
  initial?: SupervisorReport;
  onProjectChange?: (projectId: string) => void;
  onSubmit: (payload: DailyReportSubmitPayload) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  isEdit?: boolean;
};

function hasIssueData(report: SupervisorReport) {
  return !!(report.issueCategory?.trim() || report.issueDescription?.trim());
}

function hasDowntimeData(report: SupervisorReport) {
  return !!(report.downtimeHours?.trim() || report.downtimeReason?.trim());
}

function reportToFormValues(report: SupervisorReport): DailyReportFormValues {
  return {
    projectId: report.projectId,
    reportDate: report.reportDate,
    completedWorks: report.completedWorks ?? "",
    crewUserIds: report.crewPresent?.map((member) => member.id) ?? [],
    hasIssue: hasIssueData(report) || report.siteStatus === "issue",
    issueCategory: report.issueCategory ?? "",
    issueDescription: report.issueDescription ?? "",
    hasDowntime: hasDowntimeData(report) || report.siteStatus === "downtime",
    downtimeHours: report.downtimeHours ?? "",
    downtimeReason: report.downtimeReason ?? "",
    linkedIssueIds: report.linkedIssues?.map((i) => i.id) ?? [],
  };
}

export function SupervisorDailyReportForm({
  projects,
  crewMembers = [],
  defaultProjectId,
  initial,
  onProjectChange,
  onSubmit,
  onCancel,
  submitting,
  isEdit: isEditProp,
}: SupervisorDailyReportFormProps) {
  const isEdit = isEditProp ?? !!initial;
  const [photos, setPhotos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [issuePhotos, setIssuePhotos] = useState<File[]>([]);
  const [downtimeFiles, setDowntimeFiles] = useState<File[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [showLinkedSection, setShowLinkedSection] = useState(
    () => (initial?.linkedIssues?.length ?? 0) > 0,
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const form = useForm<DailyReportFormValues>({
    resolver: zodResolver(dailyReportFormSchema),
    defaultValues: initial
      ? reportToFormValues(initial)
      : {
          projectId: defaultProjectId ?? "",
          reportDate: new Date().toISOString().slice(0, 10),
          completedWorks: "",
          crewUserIds: [],
          hasIssue: false,
          issueCategory: "",
          issueDescription: "",
          hasDowntime: false,
          downtimeHours: "",
          downtimeReason: "",
          linkedIssueIds: [],
        },
  });

  const projectId = form.watch("projectId");
  const hasIssue = form.watch("hasIssue");
  const hasDowntime = form.watch("hasDowntime");
  const linkedIssueIds = form.watch("linkedIssueIds") ?? [];
  const crewUserIds = form.watch("crewUserIds") ?? [];

  const { data: projectIssues } = useProjectIssues(projectId, !!projectId);

  const allIssues = [
    ...(projectIssues ?? []),
    ...(initial?.linkedIssues ?? []).filter(
      (li) => !(projectIssues ?? []).some((pi) => pi.id === li.id),
    ),
  ];

  useEffect(() => {
    if (initial) {
      form.reset(reportToFormValues(initial));
      setShowLinkedSection((initial.linkedIssues?.length ?? 0) > 0);
    }
  }, [initial, form]);

  useEffect(() => {
    if (isEdit) return;
    form.setValue("crewUserIds", []);
    form.setValue("linkedIssueIds", []);
    setShowLinkedSection(false);
  }, [projectId, form, isEdit]);

  useEffect(() => {
    if (projectId) onProjectChange?.(projectId);
  }, [projectId, onProjectChange]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        setVoiceBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      /* microphone unavailable */
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSubmit = async (values: DailyReportFormValues) => {
    await onSubmit({
      ...values,
      voiceBlob,
      photos,
      mediaDocuments: documents,
      issuePhotos,
      downtimeFiles,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="px-4 py-4">
      <DailyReportMainSection
        projects={projects}
        register={form.register}
        errors={form.formState.errors}
        isEdit={isEdit}
      />

      <DailyReportCrewSection
        members={crewMembers}
        selectedIds={crewUserIds}
        onChange={(ids) => form.setValue("crewUserIds", ids)}
      />

      <DailyReportMediaSection
        reportId={initial?.id}
        photos={photos}
        onPhotosChange={setPhotos}
        documents={documents}
        onDocumentsChange={setDocuments}
      />

      <DailyReportIssueSection
        visible={hasIssue}
        register={form.register}
        issuePhotos={issuePhotos}
        onIssuePhotosChange={setIssuePhotos}
        onAdd={() => form.setValue("hasIssue", true)}
        onRemove={() => {
          form.setValue("hasIssue", false);
          form.setValue("issueCategory", "");
          form.setValue("issueDescription", "");
          setIssuePhotos([]);
        }}
      />

      <DailyReportDowntimeSection
        visible={hasDowntime}
        register={form.register}
        downtimeFiles={downtimeFiles}
        onDowntimeFilesChange={setDowntimeFiles}
        onAdd={() => form.setValue("hasDowntime", true)}
        onRemove={() => {
          form.setValue("hasDowntime", false);
          form.setValue("downtimeHours", "");
          form.setValue("downtimeReason", "");
          setDowntimeFiles([]);
        }}
      />

      <DailyReportLinkedIssuesSection
        visible={showLinkedSection}
        issues={allIssues}
        selectedIds={linkedIssueIds}
        onChange={(ids) => form.setValue("linkedIssueIds", ids)}
        onAdd={() => setShowLinkedSection(true)}
        onRemove={() => {
          setShowLinkedSection(false);
          form.setValue("linkedIssueIds", []);
        }}
      />

      <DailyReportVoiceSection
        recording={recording}
        hasVoice={!!voiceBlob || !!initial?.voiceDocumentId}
        onStart={startRecording}
        onStop={stopRecording}
      />

      <ReportFormFooter submitting={submitting} onCancel={onCancel} />
    </form>
  );
}
