import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  ChevronRight,
  Globe,
  User,
  Plus,
  Trash2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import {
  useClient,
  useClientDocuments,
  useClientFinance,
  useClientProjects,
  useUpdateClient,
} from "@/lib/api/hooks/useClients";
import {
  useDeleteDocument,
  useUploadDocument,
} from "@/lib/api/hooks/useDocuments";
import { projectStatusMeta } from "@/lib/constants/status";
import { formatDate, formatMoney, parseDecimal } from "@/lib/format";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/clients/$clientId")({
  head: ({ params }) => ({
    meta: [
      { title: `Клиент — ${params.clientId}` },
      { name: "description", content: "Карточка клиента: проекты, контакты, документы, финансы." },
    ],
  }),
  component: ClientPage,
});

type Tab = "overview" | "projects" | "contacts" | "documents" | "finance";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "projects", label: "Проекты" },
  { id: "contacts", label: "Контакты" },
  { id: "documents", label: "Документы" },
  { id: "finance", label: "Финансы" },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function ClientPage() {
  const { clientId } = Route.useParams();
  const clientQuery = useClient(clientId);
  const projectsQuery = useClientProjects(clientId);
  const documentsQuery = useClientDocuments(clientId);
  const financeQuery = useClientFinance(clientId);
  const updateClient = useUpdateClient(clientId);
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const [tab, setTab] = useState<Tab>("overview");

  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");

  const client = clientQuery.data;
  const cProjects = projectsQuery.data ?? [];
  const documents = documentsQuery.data ?? [];

  useEffect(() => {
    if (!client) return;
    setContactPerson(client.contactPerson ?? "");
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setComment(client.comment ?? "");
  }, [client]);

  if (clientQuery.isLoading) {
    return (
      <AppLayout activeNav="projects">
        <LoadingSkeleton rows={5} />
      </AppLayout>
    );
  }

  if (clientQuery.isError || !client) {
    return (
      <AppLayout activeNav="projects">
        <PageError
          message="Клиент не найден"
          onRetry={() => clientQuery.refetch()}
        />
      </AppLayout>
    );
  }

  const finance = financeQuery.data as
    | {
        budget?: string;
        spent?: string;
        remaining?: string;
        laborCost?: string;
        expenseCost?: string;
      }
    | undefined;

  const totalBudget = parseDecimal(finance?.budget);
  const totalPaid = parseDecimal(finance?.spent);
  const remaining = parseDecimal(finance?.remaining ?? String(totalBudget - totalPaid));

  const handleSaveContacts = async () => {
    try {
      await updateClient.mutateAsync({
        name: client.name,
        country: client.country ?? "",
        city: client.city ?? "",
        contactPerson,
        phone,
        email,
        comment,
      });
      showSuccess("Контакты сохранены");
    } catch (e) {
      showError(e);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", "client");
    formData.append("entityId", clientId);
    try {
      await uploadDocument.mutateAsync(formData);
      await documentsQuery.refetch();
      showSuccess("Документ загружен");
    } catch (e) {
      showError(e);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteDocument.mutateAsync(id);
      await documentsQuery.refetch();
      showSuccess("Документ удалён");
    } catch (e) {
      showError(e);
    }
  };

  return (
    <AppLayout activeNav="projects">
      <PageHeader>
        <div className="space-y-3 py-4">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад
          </Link>
          <div>
            <h1 className="truncate text-[20px] font-semibold tracking-tight text-slate-900">
              {client.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {[client.city, client.country].filter(Boolean).join(", ") || "—"}
              </span>
            </p>
          </div>

          <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto px-1">
            {tabs.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[12px] md:text-[14px] font-medium transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-blueGray-600 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </PageHeader>

      <main className="space-y-4 px-4 pt-5 pb-5">
        {tab === "overview" && (
          <div className="space-y-3">
            <Section>
              <Field label="Название" value={client.name} />
              <Field label="Тип" value="Компания" />
              <Field label="Страна" value={client.country ?? "—"} />
              <Field label="Город" value={client.city ?? "—"} />
              {client.email ? (
                <Field
                  label="Email"
                  value={
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <Globe className="h-3 w-3 text-slate-400" />
                      {client.email}
                    </span>
                  }
                />
              ) : null}
              {client.comment ? (
                <Field label="Комментарий" value={client.comment} />
              ) : null}
            </Section>
          </div>
        )}

        {tab === "projects" && (
          <div className="space-y-3">
            {projectsQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : cProjects.length === 0 ? (
              <Empty text="У клиента нет проектов" />
            ) : (
              cProjects.map((p) => (
                <Link
                  key={p.id}
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="card-hover block overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4 pt-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {p.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </p>
                    </div>
                    <StatusChip status={p.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 px-4 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {formatDate(p.startDate ?? null)} — {formatDate(p.endDate ?? null)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100">
                    <MiniStat label="Бюджет" value={formatMoney(p.budget)} />
                    <MiniStat label="Подтверждено" value={formatMoney(p.spent)} />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "contacts" && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="text-[10px] uppercase tracking-wide text-slate-400">
                    Контактное лицо
                  </label>
                  <input
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="mt-0.5 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>
                {contactPerson ? (
                  <Row icon={MessageCircle}>
                    @{contactPerson.toLowerCase().replace(/\s+/g, "")}
                  </Row>
                ) : null}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Примечание"
                className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 focus:border-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveContacts}
                disabled={updateClient.isPending}
                className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </div>
        )}

        {tab === "documents" && (
          <div className="space-y-3">
            {documentsQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : (
              documents.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <DocumentOpenLink
                    documentId={d.id}
                    filename={d.filename}
                    mimeType={d.mimeType}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {d.filename}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-slate-500">
                        {formatFileSize(d.sizeBytes)} · {formatDate(d.createdAt)}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </DocumentOpenLink>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(d.id)}
                    className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
            <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-medium text-slate-600 hover:border-slate-400">
              <Plus className="h-4 w-4" />
              Загрузить документ
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}

        {tab === "finance" && (
          <div className="space-y-3">
            {financeQuery.isLoading ? (
              <LoadingSkeleton rows={4} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <KPI label="Общий бюджет" value={formatMoney(totalBudget)} />
                  <KPI label="Выплачено" value={formatMoney(totalPaid)} />
                  <KPI label="Остаток" value={formatMoney(remaining)} />
                  <KPI
                    label="На проверке"
                    value={formatMoney(
                      cProjects.reduce(
                        (a, p) => a + p.reportsOnReview * 1200,
                        0,
                      ),
                    )}
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-4 py-3 text-[11px] uppercase tracking-wide text-slate-400">
                    Разбивка по проектам
                  </div>
                  {cProjects.map((p) => {
                    const budget = parseDecimal(p.budget);
                    const spent = parseDecimal(p.spent);
                    const pct =
                      budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
                    return (
                      <div
                        key={p.id}
                        className="border-b border-slate-100 px-4 py-3 last:border-b-0"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium text-slate-900">
                            {p.name}
                          </span>
                          <span className="shrink-0 text-xs text-slate-500">
                            {formatMoney(spent)} / {formatMoney(budget)}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-slate-900"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="min-w-0 truncate text-sm text-slate-900">{value}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="truncate">{children}</span>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 truncate text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="truncate text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const meta = projectStatusMeta[status] ?? projectStatusMeta.active;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 text-[10px] font-semibold tracking-wide ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}
