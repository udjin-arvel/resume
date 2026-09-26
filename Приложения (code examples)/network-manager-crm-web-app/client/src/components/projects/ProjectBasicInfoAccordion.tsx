import { useState } from "react";
import { EditableInfoField } from "@/components/common/EditableInfoField";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useUpdateProject } from "@/lib/api/hooks/useProjects";
import { cn } from "@/lib/utils";
import { projectStatusMeta, projectTypeMeta, siteStatusMeta } from "@/lib/constants/status";
import { formatDate, parseRuDate } from "@/lib/format";
import type { z } from "zod";
import type { projectSchema } from "@/lib/api/schemas";

type Project = z.infer<typeof projectSchema>;

type ProjectBasicInfoAccordionProps = {
  project: Project;
  clientName: string;
  supervisorName?: string;
  defaultOpen?: boolean;
  readOnly?: boolean;
};

function MetaBadge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center rounded-full h-[19px] px-2 text-[10px] md:text-[12px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function saveProjectDate(display: string) {
  if (!display) return null;
  const iso = parseRuDate(display);
  if (!iso) {
    throw new Error("Некорректная дата. Формат: дд.мм.гггг");
  }
  return iso;
}

export function ProjectBasicInfoAccordion({
  project,
  clientName,
  supervisorName,
  defaultOpen = true,
  readOnly = false,
}: ProjectBasicInfoAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const updateProject = useUpdateProject(project.id);
  const pt = projectTypeMeta[project.type] ?? projectTypeMeta.estimate;
  const statusMeta = projectStatusMeta[project.status] ?? projectStatusMeta.active;
  const ss = siteStatusMeta[project.siteStatus] ?? siteStatusMeta.ok;

  const saveField = async (payload: Record<string, unknown>) => {
    await updateProject.mutateAsync(payload);
  };

  return (
    <div className="mt-2 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <img
          src="/icons/arrow.svg"
          alt=""
          className={cn("h-4 w-4 shrink-0 transition-transform", !open && "rotate-180")}
        />
        <SectionHeading className="pb-0">Основная информация</SectionHeading>
      </button>

      {open ? (
        <section className="overflow-hidden">
          <div className="flex gap-3">
            <div className="flex flex-1 gap-2 items-center justify-between flex-wrap rounded-[8px] bg-white p-3">
              <p className="text-[12px] text-gray-500">Статус</p>
              <MetaBadge label={statusMeta.label} cls={statusMeta.cls} />
            </div>
            <div className="flex flex-1 gap-2 items-center justify-between flex-wrap rounded-[8px] bg-white p-3">
              <p className="text-[12px] text-gray-500">Тип проекта</p>
              <MetaBadge label={pt.label} cls={pt.cls} />
            </div>
          </div>

          {project.type === "estimate" && project.status === "active" ? (
            <div className="mt-3 flex gap-2 items-center justify-between rounded-[8px] bg-white p-3">
              <p className="text-[12px] text-gray-500">Статус объекта</p>
              <MetaBadge
                label={
                  project.siteStatus === "downtime" && project.downtimeHours
                    ? `${ss.label} · ${project.downtimeHours} ч`
                    : ss.label
                }
                cls={ss.cls}
              />
            </div>
          ) : supervisorName ? (
            <div className="mt-3 rounded-[8px] bg-white p-3">
              <p className="mb-1 text-[12px] text-gray-500">Супервайзер</p>
              <span className="text-[13px] font-semibold text-[#111827]">{supervisorName}</span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col rounded-[12px] bg-white">
            <EditableInfoField
              label="Клиент"
              value={clientName}
              editable={false}
            />
            <EditableInfoField
              label="Название проекта"
              value={project.name}
              editable={!readOnly}
              onSave={async (nextValue) => saveField({ name: nextValue })}
            />
            <EditableInfoField
              label="Адрес / локация"
              value={project.location}
              displayValue={project.location || "—"}
              editable={!readOnly}
              onSave={async (nextValue) => saveField({ location: nextValue })}
            />
            <EditableInfoField
              label="Дата начала"
              value={project.startDate ?? ""}
              displayValue={formatDate(project.startDate ?? null)}
              editable={!readOnly}
              onSave={async (nextValue) =>
                saveField({ startDate: saveProjectDate(nextValue) })
              }
            />
            <EditableInfoField
              label="Дата окончания"
              value={project.endDate ?? ""}
              displayValue={formatDate(project.endDate ?? null)}
              editable={!readOnly}
              onSave={async (nextValue) =>
                saveField({ endDate: saveProjectDate(nextValue) })
              }
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
