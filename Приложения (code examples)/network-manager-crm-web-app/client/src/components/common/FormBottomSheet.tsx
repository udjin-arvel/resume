import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { RemoveScroll } from "react-remove-scroll";
import { cn } from "@/lib/utils";

const SHEET_EXIT_MS = 180;

type FormBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
  contentClassName?: string;
};

export function FormBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
}: FormBottomSheetProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      return;
    }

    if (!visible) return;

    setClosing(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, SHEET_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [open, visible]);

  if (!visible) return null;

  return (
    <RemoveScroll removeScrollBar={false}>
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-end justify-center bg-slate-900/55 mb-0 sm:items-center",
          closing ? "sheet-backdrop-exit" : "sheet-backdrop-enter",
        )}
        onClick={() => onOpenChange(false)}
        role="presentation"
      >
        <div
          className={cn(
            "flex h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:my-4 sm:max-h-none sm:rounded-2xl",
            closing ? "sheet-panel-exit" : "sheet-panel-enter",
            contentClassName,
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-bottom-sheet-title"
        >
          <div className="shrink-0 px-4 pb-3 pt-4">
            <div className="flex items-start justify-between gap-3">
              <h2 id="form-bottom-sheet-title" className="text-sm font-bold text-slate-900">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Закрыть"
                className="-mr-0.5 shrink-0 p-0.5 text-slate-400 transition-colors hover:text-slate-700"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            {description ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{description}</p>
            ) : null}
          </div>

          <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 pb-3">
            {children}
          </div>

          <div className="grid shrink-0 grid-cols-[1fr_1.4fr] gap-2 bg-white px-4 pb-4 pt-2">
            {footer}
          </div>
        </div>
      </div>
    </RemoveScroll>
  );
}

export function FormBottomSheetCancel({
  onClick,
  disabled,
  children = "Отмена",
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function FormBottomSheetPrimary({
  onClick,
  disabled,
  children,
  variant = "default",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: "default" | "destructive";
}) {
  const variantClass =
    variant === "destructive"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-slate-900 hover:bg-slate-800";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50",
        variantClass,
      )}
    >
      {children}
    </button>
  );
}
