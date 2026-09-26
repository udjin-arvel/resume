import { useRef, useState } from "react";
import { Mic, Play } from "lucide-react";
import { useDocumentAccessUrl } from "@/hooks/useDocumentAccessUrl";
import { WorkerReportDetailSection as SupervisorReportDetailSection } from "../worker-report-detail/WorkerReportDetailSection";

type SupervisorReportVoiceSectionProps = {
  voiceDocumentId?: string;
  voiceFilename?: string;
  transcription?: string;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SupervisorReportVoiceSection({
  voiceDocumentId,
  voiceFilename,
  transcription,
}: SupervisorReportVoiceSectionProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [durationLabel, setDurationLabel] = useState<string | null>(null);
  const [retried, setRetried] = useState(false);
  const { url: audioSrc, refresh } = useDocumentAccessUrl(voiceDocumentId, "inline");

  if (!voiceDocumentId && !transcription?.trim()) return null;

  const handlePlay = () => {
    audioRef.current?.play();
  };

  return (
    <SupervisorReportDetailSection title="Голосовой отчёт">
      {voiceDocumentId ? (
        <>
          <button
            type="button"
            onClick={handlePlay}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <Play className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {voiceFilename ?? "Голосовое сообщение"}
              </p>
              <p className="text-xs text-slate-500">
                {durationLabel ? `${durationLabel} — ` : ""}
                Авто-транскрипция готова
              </p>
            </div>
            <Mic className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
          <audio
            ref={audioRef}
            src={audioSrc ?? undefined}
            preload="metadata"
            onLoadedMetadata={() => {
              const d = audioRef.current?.duration;
              if (d && Number.isFinite(d)) setDurationLabel(formatDuration(d));
            }}
            onError={() => {
              if (retried) return;
              setRetried(true);
              void refresh();
            }}
            className="hidden"
          />
        </>
      ) : null}

      {transcription?.trim() ? (
        <p className="border-t border-slate-100 px-4 py-3 text-sm italic leading-relaxed text-slate-700">
          «{transcription.trim()}»
        </p>
      ) : null}
    </SupervisorReportDetailSection>
  );
}
