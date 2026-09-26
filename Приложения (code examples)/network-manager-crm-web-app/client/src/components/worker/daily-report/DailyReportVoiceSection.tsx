import { Mic, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { dailyReportAddPhotoButtonClass } from "./button-styles";
import { DailyReportFormSection } from "./DailyReportFormSection";

type DailyReportVoiceSectionProps = {
  recording: boolean;
  hasVoice: boolean;
  onStart: () => void;
  onStop: () => void;
};

export function DailyReportVoiceSection({
  recording,
  hasVoice,
  onStart,
  onStop,
}: DailyReportVoiceSectionProps) {
  const { t } = useTranslation();

  return (
    <DailyReportFormSection title={t("worker.dailyReport.section.voice")}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {!recording ? (
            <button type="button" onClick={onStart} className={dailyReportAddPhotoButtonClass}>
              <Mic className="h-4 w-4" />
              {t("worker.dailyReport.voiceRecord")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onStop}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-red-200 bg-red-50 py-2.5 text-[14px] text-red-600 transition-colors hover:bg-red-100"
            >
              <Square className="h-4 w-4" />
              {t("worker.dailyReport.voiceStop")}
            </button>
          )}
        </div>
        {hasVoice ? (
          <p className="text-xs text-center text-emerald-600">{t("worker.dailyReport.voiceReady")}</p>
        ) : (
          <p className="text-xs text-center text-gray-400">{t("worker.dailyReport.voiceEmpty")}</p>
        )}
      </div>
    </DailyReportFormSection>
  );
}
