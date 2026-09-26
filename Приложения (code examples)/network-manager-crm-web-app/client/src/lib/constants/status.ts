export type StatusMeta = { label: string; cls: string; dot?: string; chip?: string };

export const projectTypeMeta: Record<string, StatusMeta> = {
  estimate: { label: "По смете", cls: "bg-indigo-50 text-indigo-700" },
  outstaff: { label: "Аутстафф", cls: "bg-teal-50 text-teal-700" },
};

export const projectStatusMeta: Record<string, StatusMeta> = {
  active: { label: "Активный", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  done: { label: "Завершён", cls: "bg-red-50 text-red-700", dot: "bg-red-500" },
  archive: { label: "Архив", cls: "bg-slate-100 text-slate-500", dot: "bg-slate-300" },
};

export const siteStatusMeta: Record<string, StatusMeta> = {
  ok: { label: "По плану", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  issue: { label: "Есть проблемы", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  downtime: { label: "Простой", cls: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export const toolStatusMeta: Record<string, StatusMeta> = {
  available: { label: "Доступен", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  assigned: { label: "На проекте", cls: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  needs_attention: { label: "Требует внимания", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  overdue: { label: "Просрочен", cls: "bg-red-50 text-red-700", dot: "bg-red-500" },
  written_off: { label: "Списан", cls: "bg-slate-100 text-slate-500", dot: "bg-slate-300" },
};

export const workerReportStatusMeta: Record<string, StatusMeta> = {
  draft: { label: "Черновик", cls: "bg-slate-100 text-slate-600", chip: "bg-slate-100 text-slate-600" },
  review: { label: "На проверке", cls: "bg-amber-50 text-amber-700", chip: "bg-amber-50 text-amber-700" },
  approved: { label: "Принят", cls: "bg-emerald-50 text-emerald-700", chip: "bg-emerald-50 text-emerald-700" },
  returned: { label: "Возвращён", cls: "bg-blue-50 text-blue-700", chip: "bg-blue-50 text-blue-700" },
  overdue: { label: "Просрочен", cls: "bg-red-50 text-red-600", chip: "bg-red-50 text-red-600" },
};

export const supervisorReportStatusMeta: Record<string, StatusMeta> = {
  review: { label: "На проверке", cls: "bg-blue-50 text-blue-700", chip: "bg-blue-50 text-blue-700" },
  approved: { label: "Принят", cls: "bg-emerald-50 text-emerald-700", chip: "bg-emerald-50 text-emerald-700" },
  attention: { label: "Требует внимания", cls: "bg-red-50 text-red-600", chip: "bg-red-50 text-red-600" },
};

export const estimateStatusMeta: Record<string, StatusMeta> = {
  draft: { label: "Черновик", cls: "bg-slate-100 text-slate-600" },
  sent: { label: "Отправлена", cls: "bg-blue-50 text-blue-700" },
  approved: { label: "Согласована", cls: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Отклонена", cls: "bg-rose-50 text-rose-700" },
};

export const userStatusMeta: Record<string, StatusMeta> = {
  pending: { label: "Новая заявка", cls: "bg-amber-50 text-amber-700" },
  active: { label: "Активен", cls: "bg-emerald-50 text-emerald-700" },
  blocked: { label: "Заблокирован", cls: "bg-red-50 text-red-700" },
  rejected: { label: "Отклонён", cls: "bg-rose-50 text-rose-700" },
};

export const urgentToneByKey: Record<string, "red" | "amber" | "blue"> = {
  pending_workers: "blue",
  unconfirmed_workers: "amber",
  supervisor_reports_review: "blue",
  worker_reports_review: "blue",
  site_issue: "amber",
  site_downtime: "red",
  overdue_reports: "red",
  tools_attention: "amber",
};
