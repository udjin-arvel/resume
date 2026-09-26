import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Send,
  XCircle,
  Briefcase,
  Wrench,
  Users,
  Receipt,
  Layers,
  LayoutTemplate,
  Save,
  Wallet,
} from "lucide-react";
import {
  blockTotal,
  blocksFromTemplate,
  estimateResponseToUI,
  estimateTotal,
  estimateUIToPayload,
  validateEstimateBasics,
  type Estimate,
  type EstimateBasicsField,
  type EstimateBlock,
  type EstimateBlockType,
  type EstimateStatus,
} from "@/lib/mappers/estimate";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { NativeSelect } from "@/components/ui/native-select";
import {
  useCreateEstimate,
  useEstimate,
  useExportEstimateExcel,
  useExportEstimatePdf,
  useUpdateEstimate,
} from "@/lib/api/hooks/useEstimates";
import { updateEstimateStatus } from "@/lib/api/estimates";
import { queryKeys } from "@/lib/api/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateEstimateTemplate,
  useEstimateTemplates,
} from "@/lib/api/hooks/useEstimateTemplates";
import { useCreateProject } from "@/lib/api/hooks/useProjects";
import { estimateStatusMeta } from "@/lib/constants/status";
import { downloadBlob, formatMoney } from "@/lib/format";
import { showError, showSuccess } from "@/lib/toast";
import { SectionHeading } from "@/components/common/SectionHeading";

type SearchParams = { template?: string };

export const Route = createFileRoute("/_authenticated/estimates/$estimateId")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    template: typeof s.template === "string" ? s.template : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      {
        title:
          params.estimateId === "new" ? "Новая смета" : `Смета — ${params.estimateId}`,
      },
      { name: "description", content: "Редактирование сметы." },
    ],
  }),
  component: EstimatePage,
});

const blockMeta: Record<
  EstimateBlockType,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  services: { label: "Услуги", icon: Briefcase, tone: "bg-blue-50 text-blue-700" },
  resources: { label: "Ресурсы", icon: Users, tone: "bg-emerald-50 text-emerald-700" },
  expenses: { label: "Доп. расходы", icon: Receipt, tone: "bg-amber-50 text-amber-700" },
  misc: { label: "Прочее", icon: Layers, tone: "bg-slate-100 text-slate-700" },
};

const expenseCategoryLabel: Record<string, string> = {
  hotel: "Отели",
  flight: "Авиабилеты",
  car: "Аренда авто",
  materials: "Материалы",
  other: "Прочее",
};

const uid = () => Math.random().toString(36).slice(2, 9);

function emptyBlock(type: EstimateBlockType): EstimateBlock {
  const id = uid();
  switch (type) {
    case "services":
      return { id, type, items: [{ id: uid(), name: "", qty: 1, unit: "шт", price: 0 }] };
    case "resources":
      return { id, type, items: [{ id: uid(), role: "", count: 1, hours: 160, rate: 0 }] };
    case "expenses":
      return { id, type, items: [{ id: uid(), category: "hotel", description: "", amount: 0 }] };
    case "misc":
      return { id, type, items: [{ id: uid(), name: "", amount: 0 }] };
  }
}

function emptyEstimate(fromTemplateId?: string): Estimate {
  return {
    id: "new",
    name: "",
    company: "",
    contact: "",
    phone: "",
    email: "",
    country: "",
    city: "",
    comment: "",
    status: "draft",
    date: new Date().toLocaleDateString("ru-RU"),
    blocks: [],
    fromTemplateId,
  };
}

function EstimatePage() {
  const { estimateId } = Route.useParams();
  const { template } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = estimateId === "new";

  const estimateQuery = useEstimate(isNew ? "" : estimateId);
  const templatesQuery = useEstimateTemplates();
  const createEstimate = useCreateEstimate();
  const updateEstimate = useUpdateEstimate(isNew ? "" : estimateId);
  const exportPdf = useExportEstimatePdf(isNew ? "" : estimateId);
  const exportExcel = useExportEstimateExcel(isNew ? "" : estimateId);
  const createProject = useCreateProject();
  const createTemplate = useCreateEstimateTemplate();

  const [est, setEst] = useState<Estimate>(emptyEstimate(template));
  const [loaded, setLoaded] = useState(isNew);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [projectType, setProjectType] = useState<"estimate" | "outstaff">("estimate");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EstimateBasicsField, string>>>({});

  useEffect(() => {
    if (isNew) {
      if (template && templatesQuery.data) {
        const tpl = templatesQuery.data.find((t) => t.id === template);
        if (tpl?.blocks) {
          setEst((p) => ({
            ...emptyEstimate(template),
            blocks: blocksFromTemplate(tpl.blocks ?? []),
          }));
        }
      }
      setLoaded(true);
      return;
    }
    if (estimateQuery.data) {
      setEst(estimateResponseToUI(estimateQuery.data));
      setLoaded(true);
    }
  }, [isNew, template, templatesQuery.data, estimateQuery.data]);

  const total = useMemo(() => estimateTotal(est), [est]);
  const meta = estimateStatusMeta[est.status] ?? estimateStatusMeta.draft;

  const updateField = <K extends keyof Estimate>(k: K, v: Estimate[K]) => {
    setEst((p) => ({ ...p, [k]: v }));
    if (k in fieldErrors) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[k as EstimateBasicsField];
        return next;
      });
    }
  };

  const ensureBasicsValid = (): boolean => {
    const errors = validateEstimateBasics(est);
    if (errors) {
      setFieldErrors(errors);
      showError("Заполните обязательные поля");
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const addBlock = (type: EstimateBlockType) => {
    setEst((p) => ({ ...p, blocks: [...p.blocks, emptyBlock(type)] }));
    setShowAddBlock(false);
  };

  const removeBlock = (id: string) =>
    setEst((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) }));

  const moveBlock = (id: string, dir: -1 | 1) =>
    setEst((p) => {
      const i = p.blocks.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.blocks.length) return p;
      const next = [...p.blocks];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, blocks: next };
    });

  const patchBlock = (id: string, fn: (b: EstimateBlock) => EstimateBlock) =>
    setEst((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === id ? fn(b) : b)),
    }));

  const persist = async (): Promise<string> => {
    const payload = estimateUIToPayload(est);
    if (isNew) {
      const created = await createEstimate.mutateAsync(payload);
      return created.id;
    }
    await updateEstimate.mutateAsync(payload);
    return estimateId;
  };

  const handleSaveAndClose = async () => {
    if (!ensureBasicsValid()) return;
    try {
      const id = await persist();
      if (saveAsTemplate && tplName.trim()) {
        await createTemplate.mutateAsync({ estimateId: id, name: tplName.trim() });
        showSuccess("Шаблон сохранён");
      }
      showSuccess("Смета сохранена");
      navigate({ to: "/estimates" });
    } catch (e) {
      showError(e);
    }
  };

  const setStatus = async (s: EstimateStatus) => {
    if (!ensureBasicsValid()) return;
    try {
      const id = isNew ? await persist() : estimateId;
      await updateEstimateStatus(id, s);
      setEst((p) => ({ ...p, id, status: s }));
      await queryClient.invalidateQueries({ queryKey: queryKeys.estimates.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.estimates.all });
      if (isNew) {
        navigate({
          to: "/estimates/$estimateId",
          params: { estimateId: id },
          replace: true,
        });
      }
      showSuccess("Статус обновлён");
    } catch (e) {
      showError(e);
    }
  };

  const handleExportPdf = async () => {
    if (isNew) return;
    try {
      const blob = await exportPdf.mutateAsync();
      downloadBlob(blob, `${est.name || "estimate"}.pdf`);
    } catch (e) {
      showError(e);
    }
  };

  const handleExportExcel = async () => {
    if (isNew) return;
    try {
      const blob = await exportExcel.mutateAsync();
      downloadBlob(blob, `${est.name || "estimate"}.xlsx`);
    } catch (e) {
      showError(e);
    }
  };

  const handleCreateProject = async () => {
    if (!ensureBasicsValid()) return;
    try {
      let id = estimateId;
      if (isNew) {
        id = await persist();
      }
      const project = await createProject.mutateAsync({
        estimateId: id,
        name: est.name,
        location: [est.city, est.country].filter(Boolean).join(", "),
      });
      showSuccess("Проект создан");
      navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
    } catch (e) {
      showError(e);
    }
  };

  if (!isNew && estimateQuery.isLoading) {
    return (
      <AppLayout activeNav="estimates" showBack backTo="/estimates">
        <LoadingSkeleton rows={6} />
      </AppLayout>
    );
  }

  if (!isNew && (estimateQuery.isError || (!estimateQuery.data && loaded))) {
    return (
      <AppLayout activeNav="estimates" showBack backTo="/estimates">
        <PageError onRetry={() => estimateQuery.refetch()} />
      </AppLayout>
    );
  }

  if (!loaded && !isNew) {
    return (
      <AppLayout activeNav="estimates" showBack backTo="/estimates">
        <LoadingSkeleton rows={6} />
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="estimates" showBack backTo="/estimates">
      <PageHeader>
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/estimates"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              К сметам
            </Link>
            <span
              className={`inline-flex items-center rounded-full px-2 text-[10px] font-semibold tracking-wide ${meta.cls}`}
            >
              {meta.label}
            </span>
          </div>
          <div>
            <h1 className="truncate text-[20px] font-semibold tracking-tight text-slate-900">
              {est.name || (isNew ? "Новая смета" : "Без названия")}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Итого: <span className="font-semibold text-slate-900">{formatMoney(total)}</span>
            </p>
          </div>
        </div>
      </PageHeader>

      <main className="space-y-4 px-4 pt-5 pb-5">
        {/* Block 1: Basics */}
        <section className="space-y-0">
          <SectionHeading>Основная информация</SectionHeading>
          <Card>
          <Field label="Название сметы" required error={fieldErrors.name}>
            <Input
              value={est.name}
              onChange={(v) => updateField("name", v)}
              placeholder="Hotel Berlin — Fiber"
              error={!!fieldErrors.name}
            />
          </Field>
          <Field label="Тип проекта" required>
            <div className="grid grid-cols-2 gap-2">
              {(["estimate", "outstaff"] as const).map((t) => {
                const active = projectType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProjectType(t)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t === "estimate" ? "Проект по смете" : "Аутстафф"}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              {projectType === "estimate"
                ? "Компания отвечает за выполнение работ. Контролируются простои, проблемы, отчёты супервайзера."
                : "Компания предоставляет работников. Учёт часов, отчётов и финансов."}
            </p>
          </Field>
          <Field label="Компания" required error={fieldErrors.company}>
            <Input
              value={est.company}
              onChange={(v) => updateField("company", v)}
              error={!!fieldErrors.company}
            />
          </Field>
          <Field label="Контактное лицо" required error={fieldErrors.contact}>
            <Input
              value={est.contact}
              onChange={(v) => updateField("contact", v)}
              error={!!fieldErrors.contact}
            />
          </Field>
          <Field label="Телефон" required error={fieldErrors.phone}>
            <Input
              value={est.phone}
              onChange={(v) => updateField("phone", v)}
              error={!!fieldErrors.phone}
            />
          </Field>
          <Field label="Email" required error={fieldErrors.email}>
            <Input
              type="email"
              value={est.email}
              onChange={(v) => updateField("email", v)}
              error={!!fieldErrors.email}
            />
          </Field>
          <Field label="Страна" required error={fieldErrors.country}>
            <Input
              value={est.country}
              onChange={(v) => updateField("country", v)}
              error={!!fieldErrors.country}
            />
          </Field>
          <Field label="Город" required error={fieldErrors.city}>
            <Input
              value={est.city}
              onChange={(v) => updateField("city", v)}
              error={!!fieldErrors.city}
            />
          </Field>
          <Field label="Комментарий">
            <textarea
              value={est.comment ?? ""}
              onChange={(e) => updateField("comment", e.target.value)}
              rows={2}
              className="w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
            />
          </Field>
          </Card>
        </section>

        {/* Block 2: Constructor */}
        <div className="space-y-3">
          {est.blocks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Пока нет блоков. Добавьте первый блок сметы.
            </div>
          )}

          {est.blocks.map((b, idx) => {
            const bm = blockMeta[b.type];
            const Icon = bm.icon;
            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-lg ${bm.tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{bm.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBtn onClick={() => moveBlock(b.id, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      onClick={() => moveBlock(b.id, 1)}
                      disabled={idx === est.blocks.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn onClick={() => removeBlock(b.id)} danger>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>

                <BlockEditor block={b} onChange={(nb) => patchBlock(b.id, () => nb)} />

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs">
                  <span className="text-slate-500">Сумма блока</span>
                  <span className="font-semibold text-slate-900">{formatMoney(blockTotal(b))}</span>
                </div>
              </div>
            );
          })}

          {showAddBlock ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">
                Выберите тип блока
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(blockMeta) as EstimateBlockType[]).map((t) => {
                  const m = blockMeta[t];
                  const Icon = m.icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addBlock(t)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className={`grid h-7 w-7 place-items-center rounded-lg ${m.tone}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-slate-800">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowAddBlock(false)}
                className="mt-2 w-full rounded-lg py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddBlock(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-medium text-slate-600 hover:border-slate-400"
            >
              <Plus className="h-4 w-4" />
              Добавить блок
            </button>
          )}
        </div>

        {/* Totals */}
        <section className="mt-6 space-y-0">
          <SectionHeading>Итог сметы</SectionHeading>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {(["services", "resources", "expenses", "misc"] as EstimateBlockType[]).map(
              (t, i, arr) => {
                const sum = est.blocks
                  .filter((b) => b.type === t)
                  .reduce((a, b) => a + blockTotal(b), 0);
                return (
                  <div
                    key={t}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      i < arr.length - 1 ? "border-b border-slate-100" : ""
                    }`}
                  >
                    <span className="text-slate-500">{blockMeta[t].label}</span>
                    <span className="text-slate-500">{formatMoney(sum)}</span>
                  </div>
                );
              },
            )}
            <div className="flex items-center justify-between bg-[#0F172A] px-4 py-4">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <Wallet className="h-4 w-4" />
                Общий итог
              </span>
              <span className="text-xl font-bold text-white">{formatMoney(total)}</span>
            </div>
          </div>
        </section>

        {/* Save as template */}
        <Card title="Шаблон">
          <label className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <LayoutTemplate className="h-4 w-4 text-slate-400" />
            Сохранить как шаблон
          </label>
          {saveAsTemplate && (
            <>
              <Field label="Название шаблона">
                <Input value={tplName} onChange={setTplName} />
              </Field>
              <Field label="Описание">
                <Input value={tplDesc} onChange={setTplDesc} />
              </Field>
            </>
          )}
        </Card>

        {/* Export & status */}
        {!isNew && (
          <div className="grid grid-cols-2 gap-2">
            <Btn
              onClick={handleExportPdf}
              icon={FileText}
              disabled={exportPdf.isPending}
            >
              Скачать PDF
            </Btn>
            <Btn
              onClick={handleExportExcel}
              icon={FileSpreadsheet}
              disabled={exportExcel.isPending}
            >
              Скачать Excel
            </Btn>
          </div>
        )}

        <div className="space-y-2">
          {est.status === "draft" && (
            <Btn primary onClick={() => setStatus("sent")} icon={Send}>
              Отправить клиенту
            </Btn>
          )}
          {est.status === "sent" && (
            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={() => setStatus("rejected")} icon={XCircle} danger>
                Отклонена
              </Btn>
              <Btn primary onClick={() => setStatus("approved")} icon={CheckCircle2}>
                Согласована
              </Btn>
            </div>
          )}
          {est.status === "approved" && !est.linkedProjectId && (
            <Btn primary onClick={handleCreateProject} icon={Wrench}>
              Создать проект из сметы
            </Btn>
          )}
          {est.linkedProjectId ? (
            <Link
              to="/projects/$projectId"
              params={{ projectId: est.linkedProjectId }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Briefcase className="h-4 w-4" />
              Открыть проект
            </Link>
          ) : null}
          {est.status === "rejected" && (
            <Btn onClick={() => setStatus("draft")} icon={ArrowLeft}>
              Вернуть в черновик
            </Btn>
          )}

          <Btn onClick={handleSaveAndClose} icon={Save}>
            Сохранить и закрыть
          </Btn>
        </div>
      </main>
    </AppLayout>
  );
}

function BlockEditor({
  block,
  onChange,
}: {
  block: EstimateBlock;
  onChange: (b: EstimateBlock) => void;
}) {
  if (block.type === "services") {
    return (
      <div className="divide-y divide-slate-100">
        {block.items.map((it, i) => (
          <div key={it.id} className="space-y-2 px-4 py-3">
            <Input
              value={it.name}
              onChange={(v) => {
                const items = [...block.items];
                items[i] = { ...it, name: v };
                onChange({ ...block, items });
              }}
              placeholder="Название услуги"
            />
            <div className="grid grid-cols-3 gap-2">
              <NumInput
                value={it.qty}
                onChange={(n) => {
                  const items = [...block.items];
                  items[i] = { ...it, qty: n };
                  onChange({ ...block, items });
                }}
                label="Кол-во"
              />
              <Input
                value={it.unit}
                onChange={(v) => {
                  const items = [...block.items];
                  items[i] = { ...it, unit: v };
                  onChange({ ...block, items });
                }}
                placeholder="Ед."
                className="mt-4"
              />
              <NumInput
                value={it.price}
                onChange={(n) => {
                  const items = [...block.items];
                  items[i] = { ...it, price: n };
                  onChange({ ...block, items });
                }}
                label="€/ед."
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Сумма: {formatMoney(it.qty * it.price)}</span>
              <button
                type="button"
                onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== it.id) })}
                className="text-rose-500 hover:text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        <AddRow onClick={() => onChange({ ...block, items: [...block.items, { id: uid(), name: "", qty: 1, unit: "шт", price: 0 }] })} />
      </div>
    );
  }

  if (block.type === "resources") {
    return (
      <div className="divide-y divide-slate-100">
        {block.items.map((it, i) => (
          <div key={it.id} className="space-y-2 px-4 py-3">
            <Input
              value={it.role}
              onChange={(v) => {
                const items = [...block.items];
                items[i] = { ...it, role: v };
                onChange({ ...block, items });
              }}
              placeholder="Роль (например, Electrician L2)"
            />
            <div className="grid grid-cols-3 gap-2">
              <NumInput
                value={it.count}
                onChange={(n) => {
                  const items = [...block.items];
                  items[i] = { ...it, count: n };
                  onChange({ ...block, items });
                }}
                label="Чел."
              />
              <NumInput
                value={it.hours}
                onChange={(n) => {
                  const items = [...block.items];
                  items[i] = { ...it, hours: n };
                  onChange({ ...block, items });
                }}
                label="Часов"
              />
              <NumInput
                value={it.rate}
                onChange={(n) => {
                  const items = [...block.items];
                  items[i] = { ...it, rate: n };
                  onChange({ ...block, items });
                }}
                label="€/час"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Сумма: {formatMoney(it.count * it.hours * it.rate)}
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== it.id) })}
                className="text-rose-500 hover:text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        <AddRow onClick={() => onChange({ ...block, items: [...block.items, { id: uid(), role: "", count: 1, hours: 160, rate: 0 }] })} />
      </div>
    );
  }

  if (block.type === "expenses") {
    return (
      <div className="divide-y divide-slate-100">
        {block.items.map((it, i) => (
          <div key={it.id} className="space-y-2 px-4 py-3">
            <NativeSelect
              value={it.category}
              onChange={(e) => {
                const items = [...block.items];
                items[i] = { ...it, category: e.target.value as typeof it.category };
                onChange({ ...block, items });
              }}
            >
              {Object.entries(expenseCategoryLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
            <Input
              value={it.description}
              onChange={(v) => {
                const items = [...block.items];
                items[i] = { ...it, description: v };
                onChange({ ...block, items });
              }}
              placeholder="Описание"
            />
            <div className="flex items-center justify-between gap-2">
              <NumInput
                value={it.amount}
                onChange={(n) => {
                  const items = [...block.items];
                  items[i] = { ...it, amount: n };
                  onChange({ ...block, items });
                }}
                label="Сумма €"
              />
              <button
                type="button"
                onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== it.id) })}
                className="text-rose-500 hover:text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        <AddRow onClick={() => onChange({ ...block, items: [...block.items, { id: uid(), category: "other", description: "", amount: 0 }] })} />
      </div>
    );
  }

  // misc
  return (
    <div className="divide-y divide-slate-100">
      {block.items.map((it, i) => (
        <div key={it.id} className="space-y-2 px-4 py-3">
          <Input
            value={it.name}
            onChange={(v) => {
              const items = [...block.items];
              items[i] = { ...it, name: v };
              onChange({ ...block, items });
            }}
            placeholder="Описание"
          />
          <div className="flex items-center justify-between gap-2">
            <NumInput
              value={it.amount}
              onChange={(n) => {
                const items = [...block.items];
                items[i] = { ...it, amount: n };
                onChange({ ...block, items });
              }}
              label="Сумма €"
            />
            <button
              type="button"
              onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== it.id) })}
              className="text-rose-500 hover:text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <AddRow onClick={() => onChange({ ...block, items: [...block.items, { id: uid(), name: "", amount: 0 }] })} />
    </div>
  );
}

function AddRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
    >
      <Plus className="h-3.5 w-3.5" />
      Добавить строку
    </button>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {title ? (
        <div className="border-b border-slate-100 px-4 py-3 text-[11px] uppercase tracking-wide text-slate-400">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="border-b border-slate-100 bg-white px-4 py-2.5 last:border-b-0">
      <div className="mb-1 text-[10px] tracking-wide text-slate-400">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </div>
      {children}
      {error ? <p className="mt-1 text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-md border bg-white px-2 py-1 text-sm placeholder:text-slate-400 focus:outline-none ${
        error
          ? "border-rose-300 focus:border-rose-400"
          : "border-slate-200 focus:border-slate-400"
      } ${className}`}
    />
  );
}

function NumInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div>
      {label && <div className="mb-0.5 text-[10px] uppercase tracking-wide text-slate-400">{label}</div>}
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
      />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`grid h-7 w-7 place-items-center rounded-md transition ${
        disabled
          ? "text-slate-300"
          : danger
            ? "text-rose-500 hover:bg-rose-50"
            : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function Btn({
  children,
  onClick,
  icon: Icon,
  primary,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : danger
            ? "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
