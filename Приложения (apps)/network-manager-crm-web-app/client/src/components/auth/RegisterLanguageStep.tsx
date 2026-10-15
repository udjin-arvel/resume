import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { WORKER_LANGUAGES, type WorkerLocale } from "@/lib/worker-locale";

type RegisterLanguageStepProps = {
  value: WorkerLocale;
  onChange: (locale: WorkerLocale) => void;
  onContinue: () => void;
  continueDisabled?: boolean;
};

export function RegisterLanguageStep({
  value,
  onChange,
  onContinue,
  continueDisabled,
}: RegisterLanguageStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">{t("auth.languageHint")}</p>
      <div className="flex w-full rounded-2xl bg-slate-100 p-1">
        {WORKER_LANGUAGES.map((lang) => {
          const isActive = value === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onChange(lang.code)}
              className={`flex-1 rounded-xl py-2.5 text-center text-sm font-medium transition-all ${
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
      <Button type="button" className="w-full" onClick={onContinue} disabled={continueDisabled}>
        {t("auth.continue")}
      </Button>
    </div>
  );
}
