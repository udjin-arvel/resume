import { useTranslation } from "react-i18next";
import type { UserResponse } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { getProfileInitials, getProfileSubtitle } from "@/lib/worker-profile";

type BlockedProfileBannerProps = {
  user: UserResponse;
};

export function BlockedProfileBanner({ user }: BlockedProfileBannerProps) {
  const { t } = useTranslation();
  const initials = getProfileInitials(user.firstName, user.lastName);
  const subtitle = getProfileSubtitle(user, t);
  const blockedSince = user.blockedAt ? formatDate(user.blockedAt) : "—";

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-red-100 bg-red-50">
      <div className="flex items-center gap-4 border-b border-red-100 px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sm font-medium text-gray-600">
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="truncate text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <p className="text-sm font-semibold text-red-600">{t("worker.profile.blockedTitle")}</p>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500">{t("worker.profile.blockReason")}</p>
            <p className="text-sm text-gray-800">{user.blockReason || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("worker.profile.blockProject")}</p>
            <p className="text-sm text-gray-800">{user.blockProjectName || "—"}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          {t("worker.profile.blockedSince", { date: blockedSince })}
        </p>
      </div>
    </div>
  );
}
