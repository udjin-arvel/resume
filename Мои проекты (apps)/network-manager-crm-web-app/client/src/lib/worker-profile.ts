import type { TFunction } from "i18next";
import type { UserResponse } from "@/lib/api/types";
import { formatDate, formatMoney } from "@/lib/format";
import { getSpecializationLabel, formatWorkerPositionLabel } from "@/lib/constants/worker-specializations";
import { formatCertificatesList } from "@/lib/constants/worker-certificates";
import { formatTelegramDisplay } from "@/lib/telegram";
import { WORKER_DOCUMENT_TYPES } from "@/lib/worker-documents";

export type ProfileFieldItem = {
  key: string;
  label: string;
  value: string;
  isEditable: boolean;
};

export function getProfileInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  return `${first}${last}` || "?";
}

function getRoleLabel(role: UserResponse["role"], t: TFunction): string {
  if (role === "supervisor") return t("worker.profile.role.supervisor");
  return t("worker.profile.role.worker");
}

export function getProfileSubtitle(user: UserResponse, t: TFunction): string {
  const roleOrPosition = formatWorkerPositionLabel(user.position, t) || getRoleLabel(user.role, t);
  const rate = user.hourlyRate
    ? t("worker.profile.ratePerHour", { rate: formatMoney(user.hourlyRate) })
    : "—";
  return `${roleOrPosition} · ${rate}`;
}

export function buildProfileFields(
  user: UserResponse,
  t: TFunction,
  options: { readOnly?: boolean } = {},
): ProfileFieldItem[] {
  const readOnly = options.readOnly ?? false;
  const telegramValue = user.telegramUsername
    ? formatTelegramDisplay(user.telegramUsername)
    : user.telegramId
      ? t("worker.profile.telegramConnected")
      : "—";

  const editable = !readOnly;
  const contactEditable = editable;

  return [
    { key: "firstName", label: t("auth.firstName"), value: user.firstName || "—", isEditable: false },
    { key: "lastName", label: t("auth.lastName"), value: user.lastName || "—", isEditable: false },
    { key: "phone", label: t("auth.phone"), value: user.phone || "—", isEditable: contactEditable },
    { key: "telegram", label: t("worker.profile.telegram"), value: telegramValue, isEditable: contactEditable },
    {
      key: "position",
      label: t("onboarding.position"),
      value: getSpecializationLabel(user.position, t) || user.position || "—",
      isEditable: false,
    },
    {
      key: "certificates",
      label: t("onboarding.selectCertificates"),
      value: formatCertificatesList(user.specialization, t) || "—",
      isEditable: false,
    },
    {
      key: "hourlyRate",
      label: t("worker.profile.hourlyRate"),
      value: user.hourlyRate ? formatMoney(user.hourlyRate) : "—",
      isEditable: false,
    },
    {
      key: "currency",
      label: t("worker.profile.currency"),
      value: "EUR",
      isEditable: false,
    },
    {
      key: "applicationDate",
      label: t("worker.profile.applicationDate"),
      value: formatDate(user.createdAt),
      isEditable: false,
    },
  ];
}

export { WORKER_DOCUMENT_TYPES };
