import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/toast";

export type EditableInfoFieldProps = {
  label: string;
  value: string;
  displayValue?: string;
  multiline?: boolean;
  className?: string;
} & (
  | {
      editable?: true;
      onSave: (nextValue: string) => Promise<void>;
    }
  | {
      editable: false;
      onSave?: (nextValue: string) => Promise<void>;
    }
);

function getViewText(value: string, displayValue?: string) {
  if (displayValue !== undefined) return displayValue || "—";
  return value || "—";
}

function getEditText(value: string, displayValue?: string) {
  // Empty raw value always edits as empty (e.g. Telegram "Connected" without username).
  if (!value) return "";
  if (displayValue !== undefined && displayValue !== "—") return displayValue;
  return value;
}

export function EditableInfoField({
  label,
  value,
  displayValue,
  editable = true,
  multiline = false,
  onSave,
  className,
}: EditableInfoFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editRef = useRef<HTMLSpanElement>(null);
  const initialEditTextRef = useRef("");

  const viewText = getViewText(value, displayValue);

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const startEditing = () => {
    if (!editable || isSaving) return;
    initialEditTextRef.current = getEditText(value, displayValue);
    setIsEditing(true);
  };

  useEffect(() => {
    if (!isEditing || !editRef.current) return;

    const el = editRef.current;
    el.textContent = initialEditTextRef.current;
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditing]);

  const save = async () => {
    const draft = editRef.current?.textContent?.trim() ?? "";
    if (draft === initialEditTextRef.current.trim()) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      if (!onSave) {
        cancelEditing();
        return;
      }
      await onSave(draft);
      showSuccess("Сохранено");
      cancelEditing();
    } catch (error) {
      showError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActionClick = () => {
    if (isSaving) return;
    if (isEditing) {
      void save();
      return;
    }
    startEditing();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
      return;
    }

    if (event.key === "Enter" && !multiline && !event.shiftKey) {
      event.preventDefault();
      void save();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-gray-100 p-3 last:border-0",
        className,
      )}
    >
      <div className="min-w-0 flex flex-1 flex-col pr-3">
        <span className="text-[12px] text-gray-500">{label}</span>
        {isEditing ? (
          <span
            ref={editRef}
            role="textbox"
            contentEditable={!isSaving}
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            className={cn(
              "block min-w-0 truncate text-[14px] text-[#111827] outline-none focus:rounded-sm focus:ring-1 focus:ring-[#E2E8F0]",
              multiline && "whitespace-pre-wrap",
            )}
          />
        ) : (
          <span className="truncate text-[14px] text-[#111827]">{viewText}</span>
        )}
      </div>

      {editable ? (
        <button
          type="button"
          onClick={handleActionClick}
          disabled={isSaving}
          aria-label={isEditing ? "Сохранить" : "Редактировать"}
          className="shrink-0 cursor-pointer text-gray-300 transition hover:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEditing ? (
            <Check className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </button>
      ) : null}
    </div>
  );
}
