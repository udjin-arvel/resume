import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EditableInfoField } from "@/components/common/EditableInfoField";
import { ProfileSectionHeading } from "@/components/worker/profile/ProfileSectionHeading";
import { useUpdateWorker } from "@/lib/api/hooks/useWorkers";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { formatCertificatesList } from "@/lib/constants/worker-certificates";
import { formatWorkerPositionLabel } from "@/lib/constants/worker-specializations";
import { formatDate, formatMoney } from "@/lib/format";
import {
  buildWorkerPayload,
  formatTelegramDisplay,
  normalizeTelegramUsername,
  parseHourlyRateInput,
  type Worker,
} from "../worker-payload";

type WorkerApplicationProfileSectionProps = {
  worker: Worker;
};

export function WorkerApplicationProfileSection({ worker }: WorkerApplicationProfileSectionProps) {
  const { t } = useTranslation();
  const updateWorker = useUpdateWorker(worker.id);
  const [expanded, setExpanded] = useState(true);

  const saveField = async (patch: Parameters<typeof buildWorkerPayload>[1]) => {
    await updateWorker.mutateAsync(buildWorkerPayload(worker, patch));
  };

  const telegramDisplay = formatTelegramDisplay(worker.telegramUsername);
  const countryLabel = worker.country
    ? t(COUNTRY_OPTIONS.find((c) => c.value === worker.country)?.labelKey ?? "countries.OTHER")
    : "—";
  const positionLabel = formatWorkerPositionLabel(worker.position, t) || worker.position || "—";
  const certificatesLabel =
    formatCertificatesList(worker.specialization, t) || worker.specialization || "—";

  return (
    <section>
      <ProfileSectionHeading
        collapsible
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
      >
        {t("workers.application.basicInfo")}
      </ProfileSectionHeading>

      {expanded ? (
        <div className="overflow-hidden rounded-[12px] bg-white border border-slate-200">
          <EditableInfoField
            label={t("auth.firstName")}
            value={worker.firstName}
            onSave={async (nextValue) => saveField({ firstName: nextValue })}
          />
          <EditableInfoField
            label={t("auth.lastName")}
            value={worker.lastName}
            onSave={async (nextValue) => saveField({ lastName: nextValue })}
          />
          <EditableInfoField
            label={t("auth.phone")}
            value={worker.phone ?? ""}
            displayValue={worker.phone || "—"}
            onSave={async (nextValue) => saveField({ phone: nextValue })}
          />
          <EditableInfoField
            label={t("worker.profile.telegram")}
            value={worker.telegramUsername ?? ""}
            displayValue={telegramDisplay}
            onSave={async (nextValue) =>
              saveField({ telegramUsername: normalizeTelegramUsername(nextValue) })
            }
          />
          <EditableInfoField
            label={t("onboarding.position")}
            value={worker.position ?? ""}
            displayValue={positionLabel}
            onSave={async (nextValue) => saveField({ position: nextValue })}
          />
          <EditableInfoField
            label={t("onboarding.selectCertificates")}
            value={worker.specialization ?? ""}
            displayValue={certificatesLabel}
            onSave={async (nextValue) => saveField({ specialization: nextValue })}
          />
          <EditableInfoField
            label={t("worker.profile.hourlyRate")}
            value={worker.hourlyRate ?? ""}
            displayValue={formatMoney(worker.hourlyRate)}
            onSave={async (nextValue) =>
              saveField({ hourlyRate: parseHourlyRateInput(nextValue) })
            }
          />
          <EditableInfoField label={t("worker.profile.currency")} value="EUR" editable={false} />
          <EditableInfoField
            label={t("worker.profile.country")}
            value={worker.country ?? ""}
            displayValue={countryLabel}
            editable={false}
          />
          <EditableInfoField
            label={t("worker.profile.applicationDate")}
            value={worker.createdAt ?? ""}
            displayValue={formatDate(worker.createdAt ?? null)}
            editable={false}
          />
        </div>
      ) : null}
    </section>
  );
}
