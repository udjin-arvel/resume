import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

/** Shared loading mark used across manager and worker pages. */
export function LoadingState({
  label = "Загрузка",
  className,
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-slate-400",
        compact ? "gap-2 py-8" : "gap-3 py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="loading-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p className={cn("font-medium tracking-wide", compact ? "text-[12px]" : "text-[13px]")}>
        {label}
      </p>
    </div>
  );
}

export function LoadingSpinner({ label }: { label?: string }) {
  return <LoadingState label={label ?? "Загрузка"} />;
}

/** Full-page centered loader for route transitions and initial app load. */
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingState />
    </div>
  );
}

/** @deprecated Prefer LoadingState — kept for call-site compatibility. */
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  void rows;
  return <LoadingState compact />;
}
