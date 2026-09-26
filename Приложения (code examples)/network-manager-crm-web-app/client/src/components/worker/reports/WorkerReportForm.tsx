import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { z as zod } from "zod";
import { useTranslation } from "react-i18next";
import type { workerReportSchema } from "@/lib/api/schemas";
import { parseDecimal } from "@/lib/format";
import { REPORT_DAY_FIELDS, getCurrentWeekStart } from "@/lib/worker-reports";
import { showError } from "@/lib/toast";
import { FORM_RADIUS } from "@/lib/form-styles";
import { ReportFormFooter } from "./ReportFormFooter";
import { ReportMainInfoSection } from "./ReportMainInfoSection";
import { ReportHoursSection } from "./ReportHoursSection";
import { ReportExpensesSection } from "./ReportExpensesSection";
import { ReportDocumentsSection } from "./ReportDocumentsSection";

const dayFieldKeys = REPORT_DAY_FIELDS.map((d) => d.key);

const formSchema = z
  .object({
    projectId: z.string().min(1),
    weekStart: z.string().min(1),
    weekEnd: z.string().min(1),
    hoursMon: z.string().default("0"),
    hoursTue: z.string().default("0"),
    hoursWed: z.string().default("0"),
    hoursThu: z.string().default("0"),
    hoursFri: z.string().default("0"),
    hoursSat: z.string().default("0"),
    hoursSun: z.string().default("0"),
    description: z.string().optional(),
    expenses: z.array(
      z.object({
        expenseType: z.string(),
        amount: z.string(),
        comment: z.string().optional(),
        documentId: z.string().optional(),
      }),
    ),
  })
  .refine((data) => dayFieldKeys.some((key) => parseDecimal(data[key]) > 0), {
    message: "Укажите хотя бы один час",
    path: ["hoursMon"],
  });

type FormValues = z.infer<typeof formSchema>;
type WorkerReport = zod.infer<typeof workerReportSchema>;

type ProjectOption = { id: string; name: string };

export type WorkerReportSubmitPayload = {
  payload: Record<string, unknown>;
  expenseFiles: Record<number, File[]>;
};

type WorkerReportFormProps = {
  projects: ProjectOption[];
  initial?: WorkerReport;
  defaultProjectId?: string;
  reportId?: string;
  isDraft?: boolean;
  onSubmit: (data: WorkerReportSubmitPayload) => Promise<void>;
  onCancel: () => void;
  onEnsureDraft?: (values: FormValues) => Promise<string>;
  submitting?: boolean;
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function WorkerReportForm({
  projects,
  initial,
  defaultProjectId,
  reportId,
  isDraft,
  onSubmit,
  onCancel,
  onEnsureDraft,
  submitting,
}: WorkerReportFormProps) {
  const { t } = useTranslation();
  const [expenseFiles, setExpenseFiles] = useState<Record<number, File[]>>({});
  const [docUploading, setDocUploading] = useState(false);

  const defaultWeekStart = initial?.weekStart?.slice(0, 10) ?? getCurrentWeekStart();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: initial?.projectId ?? defaultProjectId ?? "",
      weekStart: defaultWeekStart,
      weekEnd: initial?.weekEnd?.slice(0, 10) ?? addDays(defaultWeekStart, 6),
      hoursMon: initial?.hoursMon ?? "0",
      hoursTue: initial?.hoursTue ?? "0",
      hoursWed: initial?.hoursWed ?? "0",
      hoursThu: initial?.hoursThu ?? "0",
      hoursFri: initial?.hoursFri ?? "0",
      hoursSat: initial?.hoursSat ?? "0",
      hoursSun: initial?.hoursSun ?? "0",
      description: initial?.description ?? "",
      expenses:
        initial?.expenses?.map((e) => ({
          expenseType: e.expenseType,
          amount: e.amount,
          comment: e.comment ?? "",
          documentId: e.documentId ?? undefined,
        })) ??
        (initial ? [] : [{ expenseType: "hotel", amount: "", comment: "" }]),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expenses",
  });

  const watched = form.watch();
  const totalHours = useMemo(
    () => REPORT_DAY_FIELDS.reduce((sum, d) => sum + parseDecimal(watched[d.key]), 0),
    [watched],
  );
  const totalExpenses = useMemo(
    () => watched.expenses.reduce((sum, e) => sum + parseDecimal(e.amount), 0),
    [watched.expenses],
  );

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      payload: values,
      expenseFiles,
    });
  };

  const handleEnsureDraft = async () => {
    const values = form.getValues();
    if (!values.projectId || !values.weekStart || !values.weekEnd) {
      showError(t("worker.reports.draftRequiredFields"));
      throw new Error(t("worker.reports.draftRequiredFields"));
    }
    if (!onEnsureDraft) {
      throw new Error("onEnsureDraft is not configured");
    }
    return onEnsureDraft(values);
  };

  const submitLabel = isDraft || !initial
    ? t("worker.reports.submitReport")
    : t("worker.reports.save");

  return (
    <form id="worker-report-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="pt-2">
      <div className="space-y-0 px-4">
        <ReportMainInfoSection projects={projects} register={form.register as never} />

        <ReportHoursSection
          register={form.register as never}
          values={watched}
          totalHours={totalHours}
        />

        <ReportExpensesSection
          fields={fields}
          register={form.register}
          setValue={form.setValue}
          onAppend={() => append({ expenseType: "hotel", amount: "", comment: "" })}
          onRemove={remove}
          onClearAll={() => {
            form.setValue("expenses", []);
            setExpenseFiles({});
          }}
          totalExpenses={totalExpenses}
        />

        <ReportDocumentsSection
          reportId={reportId}
          onEnsureDraft={onEnsureDraft ? handleEnsureDraft : undefined}
          onUploadingChange={setDocUploading}
        />

        {initial?.status === "returned" && initial.managerComment ? (
          <div className={`mb-4 ${FORM_RADIUS} border border-red-100 bg-red-50 p-4`}>
            <p className="text-sm text-gray-500">{t("worker.reports.managerComment")}</p>
            <p className="mt-1 text-sm font-medium text-red-600">{initial.managerComment}</p>
          </div>
        ) : null}
      </div>

      <ReportFormFooter
        submitting={submitting || docUploading}
        onCancel={onCancel}
        submitLabel={submitLabel}
      />
    </form>
  );
}

export function getWorkerReportFormValues(form: ReturnType<typeof useForm<FormValues>>) {
  return form.getValues();
}
