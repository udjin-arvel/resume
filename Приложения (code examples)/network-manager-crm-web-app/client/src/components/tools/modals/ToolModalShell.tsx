import { X } from "lucide-react";
import type { ReactNode } from "react";
import { RemoveScroll } from "react-remove-scroll";

type ToolModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function ToolModalShell({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: ToolModalShellProps) {
  if (!open) return null;

  return (
    <RemoveScroll removeScrollBar={false}>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tool-modal-title"
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
            <div className="min-w-0 pr-3">
              <h2 id="tool-modal-title" className="text-base font-semibold text-slate-900">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>

          <div className="grid grid-cols-[1fr_1.4fr] gap-2 border-t border-slate-200 bg-white px-5 py-4">
            {footer}
          </div>
        </div>
      </div>
    </RemoveScroll>
  );
}

export function ToolModalCancelButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      Отмена
    </button>
  );
}

export function ToolModalPrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
