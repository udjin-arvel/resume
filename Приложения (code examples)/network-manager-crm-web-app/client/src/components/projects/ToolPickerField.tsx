import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { cn } from "@/lib/utils";
import type { ToolListItem } from "@/components/tools/list/toolCardDisplay";

import { FORM_RADIUS } from "@/lib/form-styles";

export type ToolPickerOption = {
  id: string;
  name: string;
  subtitle?: string;
};

type ToolPickerFieldProps = {
  label?: string;
  required?: boolean;
  placeholder?: string;
  options: ToolPickerOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  mode?: "multiple" | "single";
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  disabled?: boolean;
};

function matchesSearch(option: ToolPickerOption, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = option.name.toLowerCase();
  const subtitle = (option.subtitle ?? "").toLowerCase();
  return name.includes(q) || subtitle.includes(q);
}

export function ToolPickerField({
  label = "Инструмент",
  required = false,
  placeholder = "Выберите инструменты",
  options = [],
  value,
  onChange,
  mode = "multiple",
  loading = false,
  emptyMessage = "Нет доступных инструментов",
  noResultsMessage = "Ничего не найдено",
  disabled = false,
}: ToolPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = useMemo(
    () => options.filter((o) => value.includes(o.id)),
    [options, value],
  );

  const filteredOptions = useMemo(
    () => options.filter((o) => matchesSearch(o, search)),
    [options, search],
  );

  const triggerLabel = useMemo(() => {
    if (selectedOptions.length === 0) return null;
    if (selectedOptions.length === 1) {
      return selectedOptions[0].name;
    }
    return `Выбрано: ${selectedOptions.length}`;
  }, [selectedOptions]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const closePicker = () => {
    setOpen(false);
    setSearch("");
  };

  const toggleOption = (id: string) => {
    if (mode === "single") {
      onChange([id]);
      closePicker();
      return;
    }
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  const renderOption = (option: ToolPickerOption) => {
    const selected = value.includes(option.id);
    const subtitle = option.subtitle;

    return (
      <li key={option.id}>
        <button
          type="button"
          onClick={() => toggleOption(option.id)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
            selected ? "bg-slate-100" : "hover:bg-slate-50",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-slate-800">
              {option.name}
            </span>
            {subtitle ? (
              <span className="block truncate text-[10px] text-slate-400">{subtitle}</span>
            ) : null}
          </span>
          {selected ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-slate-800" strokeWidth={2.5} />
          ) : null}
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>

      {loading ? (
        <LoadingSkeleton rows={2} />
      ) : (
        <div className={cn("overflow-hidden border border-slate-200 bg-white", FORM_RADIUS)}>
          {open ? (
            <div className="cursor-pointer flex h-10 items-center gap-1.5 px-3" onClick={() => setOpen(false)}>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="min-w-0 mr-[50%] flex-1 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
              />
              {search ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Очистить"
                  className="shrink-0 p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closePicker}
                  aria-label="Свернуть список"
                  className="shrink-0 p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                >
                  <ChevronDown className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled || options.length === 0}
              onClick={() => setOpen(true)}
              className={cn(
                "flex h-10 w-full items-center justify-between px-3 text-left text-[13px]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                triggerLabel ? "font-medium text-slate-800" : "text-slate-400",
              )}
            >
              <span className="truncate">{triggerLabel ?? placeholder}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />
            </button>
          )}

          {open ? (
            options.length === 0 ? (
              <p className="border-t border-slate-200 px-3 py-3 text-center text-xs text-slate-400">
                {emptyMessage}
              </p>
            ) : filteredOptions.length === 0 ? (
              <p className="border-t border-slate-200 px-3 py-3 text-center text-xs text-slate-400">
                {noResultsMessage}
              </p>
            ) : (
              <div className="scrollbar-thin max-h-44 overflow-y-auto border-t border-slate-200 pr-0.5">
                <ul className="py-0.5">{filteredOptions.map(renderOption)}</ul>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

export function toToolPickerOption(tool: Pick<ToolListItem, "id" | "name" | "serialNumber" | "model" | "toolType">): ToolPickerOption {
  const parts: string[] = [];
  parts.push(`Арт: ${tool.serialNumber || "—"}`);
  const typeOrModel = tool.model?.trim() || tool.toolType?.trim();
  if (typeOrModel) parts.push(typeOrModel);
  return {
    id: tool.id,
    name: tool.name,
    subtitle: parts.join(" · "),
  };
}
