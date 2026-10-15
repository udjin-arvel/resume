import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban } from "lucide-react";
import { EditableInfoField } from "@/components/common/EditableInfoField";
import { BlockWorkerDialog } from "@/components/workers/BlockWorkerDialog";
import { useUpdateWorker } from "@/lib/api/hooks/useWorkers";
import { formatCertificatesList } from "@/lib/constants/worker-certificates";
import { formatWorkerPositionLabel } from "@/lib/constants/worker-specializations";
import { formatDate, formatMoney } from "@/lib/format";
import {
  buildWorkerPayload,
  formatTelegramDisplay,
  normalizeTelegramUsername,
  parseHourlyRateInput,
  type Worker,
} from "./worker-payload";

type WorkerProfileTabProps = {
  worker: Worker;
};

export function WorkerProfileTab({ worker }: WorkerProfileTabProps) {
  const { t } = useTranslation();
  const updateWorker = useUpdateWorker(worker.id);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const saveField = async (patch: Parameters<typeof buildWorkerPayload>[1]) => {
    await updateWorker.mutateAsync(buildWorkerPayload(worker, patch));
  };

  const telegramDisplay = formatTelegramDisplay(worker.telegramUsername);
  const positionLabel = formatWorkerPositionLabel(worker.position, t) || worker.position || "—";
  const certificatesLabel =
    formatCertificatesList(worker.specialization, t) || worker.specialization || "—";

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[12px] bg-white border border-slate-200">
        <EditableInfoField
          label="Имя"
          value={worker.firstName}
          onSave={async (nextValue) => saveField({ firstName: nextValue })}
        />
        <EditableInfoField
          label="Фамилия"
          value={worker.lastName}
          onSave={async (nextValue) => saveField({ lastName: nextValue })}
        />
        <EditableInfoField
          label="Телефон"
          value={worker.phone ?? ""}
          displayValue={worker.phone || "—"}
          onSave={async (nextValue) => saveField({ phone: nextValue })}
        />
        <EditableInfoField
          label="Telegram"
          value={worker.telegramUsername ?? ""}
          displayValue={telegramDisplay}
          onSave={async (nextValue) =>
            saveField({ telegramUsername: normalizeTelegramUsername(nextValue) })
          }
        />
        <EditableInfoField
          label="Должность"
          value={worker.position ?? ""}
          displayValue={positionLabel}
          onSave={async (nextValue) => saveField({ position: nextValue })}
        />
        <EditableInfoField
          label="Сертификаты"
          value={worker.specialization ?? ""}
          displayValue={certificatesLabel}
          onSave={async (nextValue) => saveField({ specialization: nextValue })}
        />
        <EditableInfoField
          label="Ставка / час"
          value={worker.hourlyRate ?? ""}
          displayValue={formatMoney(worker.hourlyRate)}
          onSave={async (nextValue) =>
            saveField({ hourlyRate: parseHourlyRateInput(nextValue) })
          }
        />
        <EditableInfoField label="Валюта" value="EUR" editable={false} />
        <EditableInfoField
          label="Регистрация"
          value={worker.createdAt ?? ""}
          displayValue={formatDate(worker.createdAt ?? null)}
          editable={false}
        />
        <EditableInfoField
          label="Внутренний комментарий"
          value={worker.internalComment ?? ""}
          displayValue={worker.internalComment || "—"}
          multiline
          onSave={async (nextValue) => saveField({ internalComment: nextValue })}
        />
      </div>

      {worker.status !== "blocked" ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setBlockDialogOpen(true)}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50"
          >
            <Ban className="h-3 w-3" />
            Заблокировать
          </button>
        </div>
      ) : null}

      <BlockWorkerDialog
        workerId={worker.id}
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
      />
    </div>
  );
}
