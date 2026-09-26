import { useTranslation } from "react-i18next";
import { normalizeWorkerLocale, WORKER_LANGUAGES } from "@/lib/worker-locale";
import { ProfileSectionHeading } from "./ProfileSectionHeading";

type ProfileLanguageSegmentProps = {
  value: string;
  onChange: (lang: string) => void;
  saving?: boolean;
};

export function ProfileLanguageSegment({ value, onChange, saving }: ProfileLanguageSegmentProps) {
  const { t } = useTranslation();
  const active = normalizeWorkerLocale(value);

  return (
    <section className="pb-4">
      <ProfileSectionHeading>{t("worker.profile.language")}</ProfileSectionHeading>
      <div className="flex w-full rounded-[12px] bg-slate-100 p-1">
        {WORKER_LANGUAGES.map((lang) => {
          const isActive = active === lang.code;

          return (
            <button
              key={lang.code}
              type="button"
              disabled={saving}
              onClick={() => onChange(lang.code)}
              className={`flex-1 rounded-[12px] py-2.5 text-center text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
