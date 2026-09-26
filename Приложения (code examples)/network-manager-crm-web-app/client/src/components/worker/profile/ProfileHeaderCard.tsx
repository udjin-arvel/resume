import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserResponse } from "@/lib/api/types";
import { getProfileInitials, getProfileSubtitle } from "@/lib/worker-profile";

type ProfileHeaderCardProps = {
  user: UserResponse;
};

export function ProfileHeaderCard({ user }: ProfileHeaderCardProps) {
  const { t } = useTranslation();
  const initials = getProfileInitials(user.firstName, user.lastName);
  const subtitle = getProfileSubtitle(user, t);

  return (
    <div className="mb-4 overflow-hidden rounded-[12px] bg-white border border-slate-200">
      <div className="flex items-center gap-3 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[16px] font-bold text-slate-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="truncate text-[12px] md:text-[14px] text-[#0F172B] font-semibold">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
        <Lock className="h-3 w-3 shrink-0 text-amber-700" />
        <p className="text-[11px] md:text-[12px] leading-snug text-amber-800">{t("worker.profile.lockedBanner")}</p>
      </div>
    </div>
  );
}
