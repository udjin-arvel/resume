import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export function PageError({
  message = "Не удалось загрузить данные",
  onRetry,
}: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Повторить
        </Button>
      ) : null}
    </div>
  );
}
