import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const statusStyles: Record<string, string> = {
  review: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  returned: "bg-amber-50 text-amber-700",
  overdue: "bg-red-50 text-red-700",
  draft: "bg-slate-100 text-slate-600",
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  blocked: "bg-red-50 text-red-700",
  rejected: "bg-red-50 text-red-700",
  attention: "bg-orange-50 text-orange-700",
  assigned: "bg-indigo-50 text-indigo-700",
  available: "bg-emerald-50 text-emerald-700",
};

export function StatusBadge({
  status,
  label,
  className,
  dot,
}: {
  status?: string;
  label?: string;
  className?: string;
  dot?: string;
}) {
  const { t } = useTranslation();
  const resolvedLabel =
    label ?? (status ? t(`status.${status}`, { defaultValue: status }) : "");
  const cls =
    className ?? (status ? statusStyles[status] : undefined) ?? "bg-slate-100 text-slate-600";

  return (
    <Badge variant="outline" className={`border-0 font-medium ${cls}`}>
      {dot ? <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${dot}`} /> : null}
      {resolvedLabel}
    </Badge>
  );
}
