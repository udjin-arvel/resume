import { Link } from "@tanstack/react-router";
import { ChevronRight, FolderKanban, Mail, MapPin, Users, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { z } from "zod";
import type { clientSchema } from "@/lib/api/schemas";

type Client = z.infer<typeof clientSchema>;

type ClientCardProps = {
  client: Client;
  activeCount?: number;
  doneCount?: number;
  totalBudget?: string;
  totalSpent?: string;
};

export function ClientCard({
  client: c,
  activeCount = 0,
  doneCount = 0,
  totalBudget = "0",
  totalSpent = "0",
}: ClientCardProps) {
  return (
    <Link
      to="/clients/$clientId"
      params={{ clientId: c.id }}
      className="card-hover block overflow-hidden rounded-[12px] border border-slate-200 bg-white"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-3 pt-3">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold text-slate-900">{c.name}</h3>
          <div className="mt-1 grid gap-1 text-xs text-slate-500">
            <p className="flex items-center gap-1.5 truncate">
              <Users className="h-3 w-3 shrink-0" />
              <span className="truncate">{c.contactPerson || "—"}</span>
            </p>
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {[c.city, c.country].filter(Boolean).join(", ") || "—"}
              </span>
            </p>
            <p className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{c.email || "—"}</span>
            </p>
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-px border-slate-100 bg-slate-100">
        <Stat icon={FolderKanban} label="Активные" value={activeCount} />
        <Stat icon={FolderKanban} label="Завершённые" value={doneCount} />
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-100">
        <Stat icon={Wallet} label="Бюджет" value={formatMoney(totalBudget)} />
        <Stat icon={Wallet} label="Подтверждено" value={formatMoney(totalSpent)} />
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
    <div className="flex flex-col gap-1 bg-white px-3 py-3 border-t">
      <span className="flex items-center gap-1 text-[12px] md:text-[14px] tracking-wide text-slate-400">
        <Icon className="h-3 w-3" />
        <span className="truncate">{label}</span>
      </span>
      <span className="truncate text-[14px] md:text-[18px] font-semibold text-slate-900">{value}</span>
    </div>
  );
}
