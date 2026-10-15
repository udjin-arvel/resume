type SupervisorReportManagerCommentSectionProps = {
  comment: string;
  savedComment?: string;
  onCommentChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
};

export function SupervisorReportManagerCommentSection({
  comment,
  savedComment,
  onCommentChange,
  onSave,
  saving,
}: SupervisorReportManagerCommentSectionProps) {
  const displayValue = comment || savedComment || "";

  return (
    <section>
      <h2 className="mb-2 text-[14px] font-semibold text-slate-500">Комментарий менеджера</h2>
      <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white p-3">
        <textarea
          value={displayValue}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={3}
          placeholder="Например: запросить дополнительные фотографии, подтвердить простой…"
          className="w-full resize-none rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
        />
        <button
          type="button"
          disabled={!comment.trim() || saving}
          onClick={onSave}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Сохранить комментарий
        </button>
      </div>
    </section>
  );
}
