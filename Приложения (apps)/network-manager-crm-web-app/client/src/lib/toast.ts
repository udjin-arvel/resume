import { toast } from "sonner";
import { parseApiError } from "@/lib/api/client";

export function showSuccess(message: string) {
  toast.success(message);
}

export function showError(error: unknown) {
  toast.error(parseApiError(error));
}
