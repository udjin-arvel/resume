import { Link } from "@tanstack/react-router";
import {
  Calendar,
  ChevronRight,
  FileText,
  Mail,
  MapPin,
  User,
  UserCheck2,
  Users,
  Wallet,
} from "lucide-react";
import { projectStatusMeta, projectTypeMeta, siteStatusMeta } from "@/lib/constants/status";
import { formatDate, formatMoney } from "@/lib/format";
import type { z } from "zod";
import type { projectSchema } from "@/lib/api/schemas";

type Project = z.infer<typeof projectSchema>;

type ProjectCardProps = {
  project: Project;
  clientContactPerson?: string;
  clientEmail?: string;
};

export function ProjectCard({ project: p, clientContactPerson, clientEmail }: ProjectCardProps) {
  const typeMeta = projectTypeMeta[p.type] ?? projectTypeMeta.estimate;
  const siteMeta = siteStatusMeta[p.siteStatus] ?? siteStatusMeta.ok;
  const isCompleted = p.status === "done" || p.status === "archive";
  const statusMeta = projectStatusMeta[p.status] ?? projectStatusMeta.done;

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: p.id }}
      className="card-hover block overflow-hidden rounded-[12px] border border-slate-200 bg-white"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-3 pt-3">
        <div className="min-w-0">
          <h3 className="mb-1 truncate text-[16px] font-semibold text-slate-900">{p.name}</h3>
          <div className="mt-1 grid gap-1 text-xs text-slate-500">
            {clientContactPerson ? (
              <p className="flex items-center gap-1.5 truncate">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{clientContactPerson}</span>
              </p>
            ) : null}
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{p.location || "—"}</span>
            </p>
            {clientEmail ? (
              <p className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{clientEmail}</span>
              </p>
            ) : null}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>

      {(p.startDate || p.endDate) && (
        <div className="mt-2 flex items-center gap-2 px-4 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {formatDate(p.startDate ?? null)} — {formatDate(p.endDate ?? null)}
          </span>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 px-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeMeta.cls}`}
        >
          {typeMeta.label}
        </span>
        {isCompleted ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.cls}`}
          >
            {statusMeta.dot ? (
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            ) : null}
            {statusMeta.label}
          </span>
        ) : p.type === "estimate" ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${siteMeta.cls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${siteMeta.dot}`} />
            {siteMeta.label}
            {p.siteStatus === "downtime" && p.downtimeHours ? ` · ${p.downtimeHours}ч` : ""}
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-px bg-slate-100">
        <Stat icon={Users} label="Работники" value={p.workers} />
        <Stat icon={UserCheck2} label="Подтвердили" value={p.confirmed} />
        <Stat icon={FileText} label="Отчёты" value={p.reportsOnReview} />
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-100">
        <Stat icon={Wallet} label="Бюджет" value={formatMoney(p.budget)} />
        <Stat icon={Wallet} label="Подтверждено" value={formatMoney(p.spent)} />
      </div>
    </Link>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-white px-3 py-3 border-t border-slate-100">
      <span className="flex items-center gap-1 text-[11px] md:text-[13px] tracking-wide text-slate-400" title={label}>
        <Icon className="h-3 w-3" />
        <span className="truncate">{label}</span>
      </span>
      <span className="truncate text-[14px] md:text-[16px] font-semibold text-slate-900">{value}</span>
    </div>
  );
}
