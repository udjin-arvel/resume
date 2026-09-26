import { useState, type ReactNode } from "react";
import type { z } from "zod";
import { Clock, TrendingUp, Wallet } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { SectionCountBadge } from "@/components/common/SectionCountBadge";
import { useFinanceProject } from "@/lib/api/hooks/useFinance";
import type { projectFinanceSchema } from "@/lib/api/schemas";
import { categoryKey, categoryMeta } from "@/lib/finance-categories";
import { FORM_RADIUS } from "@/lib/form-styles";
import { formatDate, formatHours, formatMoney, parseDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProjectFinance = z.infer<typeof projectFinanceSchema>;

type ProjectFinanceTabProps = {
  projectId: string;
  projectType?: string;
};

export function ProjectFinanceTab({ projectId, projectType }: ProjectFinanceTabProps) {
  const financeQuery = useFinanceProject(projectId);

  if (financeQuery.isLoading) return <LoadingSkeleton rows={6} />;
  if (financeQuery.isError) {
    return (
      <PageError
        message="Не удалось загрузить финансы проекта"
        onRetry={() => void financeQuery.refetch()}
      />
    );
  }

  const finance = financeQuery.data;
  if (!finance) return null;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="px-1 text-[14px] font-medium text-slate-500">Бюджет проекта</h2>
        <ProjectBudgetOverviewCard finance={finance} />
      </section>

      <ProjectFinanceSection title="По работникам" count={finance.workers.length}>
        {finance.workers.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">Нет данных по работникам</p>
        ) : (
          <ul className="space-y-2 p-3">
            {finance.workers.map((worker) => (
              <ProjectWorkerFinanceCard key={worker.workerId} worker={worker} />
            ))}
          </ul>
        )}
      </ProjectFinanceSection>

      <ProjectFinanceSection title="По категориям" count={finance.categories.length}>
        {finance.categories.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">Нет расходов по категориям</p>
        ) : (
          <ProjectCategoryBreakdown categories={finance.categories} />
        )}
      </ProjectFinanceSection>

      <ProjectFinanceSection title="Потери по проекту" count={finance.losses.length}>
        <ProjectLossesSection
          losses={finance.losses}
          totalLossAmount={finance.totalLossAmount}
          isEstimateProject={projectType === "estimate"}
        />
      </ProjectFinanceSection>
    </div>
  );
}

function ProjectBudgetOverviewCard({ finance }: { finance: ProjectFinance }) {
  const cells = [
    {
      icon: Wallet,
      label: "Бюджет",
      value: formatMoney(finance.budget),
      valueClass: "text-slate-900",
    },
    {
      icon: TrendingUp,
      label: "Подтверждено",
      value: formatMoney(finance.spent),
      valueClass: "text-slate-900",
    },
    {
      icon: Wallet,
      label: "Остаток",
      value: formatMoney(finance.remaining),
      valueClass: "text-emerald-600",
    },
    {
      icon: Clock,
      label: "На проверке",
      value: formatMoney(finance.pendingReviewAmount),
      valueClass: "text-amber-600",
    },
  ];

  return (
    <div className={`overflow-hidden ${FORM_RADIUS} bg-white`}>
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
        {cells.map((cell) => (
          <div key={cell.label} className="p-3">
            <div className="flex items-center gap-2">
              <cell.icon className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="text-[12px] text-slate-500">{cell.label}</span>
            </div>
            <p className={cn("mt-1.5 text-[15px] font-semibold tabular-nums", cell.valueClass)}>
              {cell.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectFinanceSection({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-1 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <img
            src="/icons/arrow.svg"
            alt=""
            className={cn("h-4 w-4 shrink-0 transition-transform", !open && "rotate-180")}
          />
          <h2 className="truncate text-[14px] font-medium text-slate-500">{title}</h2>
          <SectionCountBadge count={count} />
        </span>
      </button>
      {open ? <div className={`overflow-hidden ${FORM_RADIUS} bg-white`}>{children}</div> : null}
    </section>
  );
}

function ProjectWorkerFinanceCard({
  worker,
}: {
  worker: z.infer<typeof projectFinanceSchema>["workers"][number];
}) {
  const paid = parseDecimal(worker.paidAmount);
  const remaining = parseDecimal(worker.remainingAmount);
  const extras = parseDecimal(worker.extraExpenses);
  const headerTotal = parseDecimal(worker.totalAmount) + extras;

  return (
    <li className={`${FORM_RADIUS} border border-slate-100 bg-slate-50/40 p-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900">{worker.workerName}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{formatHours(worker.totalHours)}</p>
        </div>
        <p className="shrink-0 text-[13px] font-semibold tabular-nums text-slate-900">
          {formatMoney(headerTotal)}
        </p>
      </div>
      <div className="mt-2.5 space-y-1.5 text-[12px]">
        {extras > 0 ? (
          <FinanceRow label="Доп. расходы" value={formatMoney(extras)} />
        ) : null}
        <FinanceRow label="Выплачено" value={formatMoney(paid)} valueClass="text-emerald-600" />
        <FinanceRow
          label="Осталось"
          value={formatMoney(remaining)}
          valueClass={remaining > 0 ? "text-red-600" : "text-slate-900"}
        />
      </div>
    </li>
  );
}

function FinanceRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={cn("font-medium tabular-nums", valueClass ?? "text-slate-900")}>{value}</span>
    </div>
  );
}

function ProjectCategoryBreakdown({
  categories,
}: {
  categories: z.infer<typeof projectFinanceSchema>["categories"];
}) {
  return (
    <ul className="space-y-3 p-4">
      {categories.map((cat) => {
        const key = categoryKey(cat.category);
        const meta = categoryMeta[key];
        const isLabor = key === "labor";
        return (
          <li key={`${cat.category}-${cat.amount}`}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-700">
                <meta.icon className={cn("h-3.5 w-3.5", meta.color)} />
                {meta.label}
              </span>
              <span className="tabular-nums text-slate-500">
                {formatMoney(cat.amount)} · {cat.percentage}%
              </span>
            </div>
            <div className={cn("overflow-hidden rounded-full bg-slate-100", isLabor ? "h-2" : "h-1.5")}>
              <div
                className={cn("h-full", meta.bg)}
                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProjectLossesSection({
  losses,
  totalLossAmount,
  isEstimateProject,
}: {
  losses: z.infer<typeof projectFinanceSchema>["losses"];
  totalLossAmount: string;
  isEstimateProject: boolean;
}) {
  if (!isEstimateProject) {
    return (
      <p className="px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">Нет данных о простоях</p>
    );
  }

  if (losses.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">Потерь не зафиксировано</p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-slate-50">
        {losses.map((loss) => (
          <li key={loss.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-900">{loss.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {formatDate(loss.dateFrom)}
                  {loss.dateTo !== loss.dateFrom ? ` – ${formatDate(loss.dateTo)}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <LossSiteBadge siteStatus={loss.siteStatus} />
                  <LossIssueBadge issueStatus={loss.issueStatus} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[12px] text-slate-500">{formatHours(loss.downtimeHours)}</p>
                <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-red-600">
                  {formatLossMoney(loss.lossAmount)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <span className="text-[13px] font-medium text-slate-700">Итого потеряно</span>
        <span className="text-[13px] font-bold tabular-nums text-red-600">
          {formatLossMoney(totalLossAmount)}
        </span>
      </div>
    </>
  );
}

function LossSiteBadge({ siteStatus }: { siteStatus: string }) {
  if (siteStatus === "downtime") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
        Простой
      </span>
    );
  }
  if (siteStatus === "issue") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        Проблемы
      </span>
    );
  }
  return null;
}

function LossIssueBadge({ issueStatus }: { issueStatus?: string }) {
  if (!issueStatus) return null;
  if (issueStatus === "resolved") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
        Решен
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
      Не решен
    </span>
  );
}

function formatLossMoney(value: string | number) {
  const n = parseDecimal(value);
  const abs = formatMoney(Math.abs(n));
  if (n === 0) return abs;
  return n < 0 ? `− ${abs}` : abs;
}
