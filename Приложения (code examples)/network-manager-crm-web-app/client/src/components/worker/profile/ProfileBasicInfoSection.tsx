import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EditableInfoField } from "@/components/common/EditableInfoField";
import { useAuth } from "@/hooks/useAuth";
import type { UserResponse } from "@/lib/api/types";
import { formatTelegramDisplay, normalizeTelegramUsername } from "@/lib/telegram";
import { buildProfileFields } from "@/lib/worker-profile";
import { ProfileFieldRow } from "./ProfileFieldRow";
import { ProfileSectionHeading } from "./ProfileSectionHeading";

type ProfileBasicInfoSectionProps = {
  user: UserResponse;
  readOnly?: boolean;
};

export function ProfileBasicInfoSection({
  user,
  readOnly = false,
}: ProfileBasicInfoSectionProps) {
  const { t } = useTranslation();
  const { updateUserProfile } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const fields = buildProfileFields(user, t, { readOnly });

  const telegramDisplay = user.telegramUsername
    ? formatTelegramDisplay(user.telegramUsername)
    : user.telegramId
      ? t("worker.profile.telegramConnected")
      : "—";

  return (
    <section className="mb-4">
      <ProfileSectionHeading
        collapsible
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      >
        {t("worker.profile.basicInfo")}
      </ProfileSectionHeading>

      {expanded ? (
        <div className="overflow-hidden rounded-[12px] bg-white border border-slate-200">
          {fields.map((field) => {
            if (!readOnly && field.key === "phone") {
              return (
                <EditableInfoField
                  key={field.key}
                  label={field.label}
                  value={user.phone ?? ""}
                  displayValue={user.phone || "—"}
                  className="border-slate-100"
                  onSave={async (nextValue) => {
                    await updateUserProfile({ phone: nextValue });
                  }}
                />
              );
            }

            if (!readOnly && field.key === "telegram") {
              return (
                <EditableInfoField
                  key={field.key}
                  label={field.label}
                  value={user.telegramUsername ?? ""}
                  displayValue={telegramDisplay}
                  className="border-slate-100"
                  onSave={async (nextValue) => {
                    await updateUserProfile({
                      telegramUsername: normalizeTelegramUsername(nextValue),
                    });
                  }}
                />
              );
            }

            return <ProfileFieldRow key={field.key} field={field} />;
          })}
        </div>
      ) : null}
    </section>
  );
}
