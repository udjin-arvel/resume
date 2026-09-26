import type { z } from "zod";
import { useTranslation } from "react-i18next";
import type { workerProjectFinanceSchema } from "@/lib/api/schemas";
import { formatHours, formatRub, parseDecimal } from "@/lib/format";

type ProjectFinance = z.infer<typeof workerProjectFinanceSchema>;

type ProjectFinanceCardProps = {
  project: ProjectFinance;
  variant?: "default" | "workerDetail";
};

const cardClassName = {
  default: "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm",
  workerDetail: "rounded-[12px] border border-[#F0F0F0] bg-white p-4",
} as const;

const rowLabels = {
  default: null as null,
  workerDetail: {
    extraExpenses: "Доп. расходы",
    paid: "Выплачено",
    remaining: "Осталось",
  },
};

export function ProjectFinanceCard({ project, variant = "default" }: ProjectFinanceCardProps) {
  const { t } = useTranslation();
  const remaining = parseDecimal(project.remainingAmount);
  const labels = rowLabels[variant];

  return (
    <article className={cardClassName[variant]}>
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="min-w-0 flex flex-col">
          <p className="truncate font-semibold text-gray-900">{project.projectName}</p>
          <p className="text-sm text-gray-500">
            {formatHours(project.totalHours)}
          </p>
        </div>
        <p className="shrink-0 font-semibold text-gray-900 tabular-nums">
          {formatRub(project.projectAmount)}
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 py-3">
        <span className="text-sm text-gray-500">
          {labels?.extraExpenses ?? t("worker.finance.card.extraExpenses")}
        </span>
        <span className="font-medium text-gray-900 tabular-nums">
          {formatRub(project.extraExpenses)}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 py-3">
        <span className="text-sm text-gray-500">
          {labels?.paid ?? t("worker.finance.card.paid")}
        </span>
        <span className="font-medium text-emerald-500 tabular-nums">
          {formatRub(project.paidAmount)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3">
        <span className="text-sm text-gray-500">
          {labels?.remaining ?? t("worker.finance.card.remaining")}
        </span>
        <span
          className={`font-medium tabular-nums ${
            remaining > 0 ? "text-red-500" : "text-gray-900"
          }`}
        >
          {formatRub(project.remainingAmount)}
        </span>
      </div>
    </article>
  );
}

export function ProjectFinanceCardSkeleton() {
  return <div className="h-44 animate-pulse rounded-2xl bg-gray-100" />;
}
