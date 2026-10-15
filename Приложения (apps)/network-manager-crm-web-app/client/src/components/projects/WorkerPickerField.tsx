import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { cn } from "@/lib/utils";

import { FORM_RADIUS } from "@/lib/form-styles";

export type WorkerPickerOption = {
  id: string;
  firstName: string;
  lastName: string;
  subtitle?: string;
};

export type WorkerPickerGroup = {
  title: string;
  options: WorkerPickerOption[];
};

type WorkerPickerFieldProps = {
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: WorkerPickerOption[];
  groups?: WorkerPickerGroup[];
  value: string[];
  onChange: (ids: string[]) => void;
  mode?: "multiple" | "single";
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  disabled?: boolean;
};

function workerDisplayName(w: Pick<WorkerPickerOption, "firstName" | "lastName">) {
  return `${w.firstName} ${w.lastName}`.trim();
}

function shortDisplayName(w: Pick<WorkerPickerOption, "firstName" | "lastName">) {
  const last = w.lastName.trim();
  const initial = w.firstName.trim().charAt(0);
  if (!last) return w.firstName.trim();
  return initial ? `${last} ${initial}.` : last;
}

function flattenOptions(options: WorkerPickerOption[] = [], groups: WorkerPickerGroup[] = []) {
  if (groups.length > 0) {
    return groups.flatMap((g) => g.options);
  }
  return options;
}

function matchesSearch(option: WorkerPickerOption, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = workerDisplayName(option).toLowerCase();
  const subtitle = (option.subtitle ?? "").toLowerCase();
  return name.includes(q) || subtitle.includes(q);
}

export function WorkerPickerField({
  label = "Работник",
  required = false,
  placeholder = "Выберите работников",
  options = [],
  groups = [],
  value,
  onChange,
  mode = "multiple",
  loading = false,
  emptyMessage = "Нет доступных работников",
  noResultsMessage = "Никого не найдено",
  disabled = false,
}: WorkerPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = useMemo(() => flattenOptions(options, groups), [options, groups]);
  const selectedOptions = useMemo(
    () => allOptions.filter((o) => value.includes(o.id)),
    [allOptions, value],
  );

  const filteredOptions = useMemo(
    () => options.filter((o) => matchesSearch(o, search)),
    [options, search],
  );

  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          options: group.options.filter((o) => matchesSearch(o, search)),
        }))
        .filter((group) => group.options.length > 0),
    [groups, search],
  );

  const hasFilteredResults =
    groups.length > 0 ? filteredGroups.length > 0 : filteredOptions.length > 0;

  const triggerLabel = useMemo(() => {
    if (selectedOptions.length === 0) return null;
    if (selectedOptions.length === 1) {
      return shortDisplayName(selectedOptions[0]);
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

  const renderOption = (option: WorkerPickerOption) => {
    const selected = value.includes(option.id);
    const subtitle = option.subtitle;

    return (
      <li key={option.id}>
        <button
          type="button"
          onClick={() => toggleOption(option.id)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-full px-2.5 py-2 text-left transition-colors",
            selected ? "bg-slate-100" : "hover:bg-slate-50",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-slate-800">
              {workerDisplayName(option)}
            </span>
            {/* {subtitle ? (
              <span className="block truncate text-[10px] text-slate-400">{subtitle}</span>
            ) : null} */}
          </span>
          {selected ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-slate-800" strokeWidth={2.5} />
          ) : null}
        </button>
      </li>
    );
  };

  const listContent =
    groups.length > 0 ? (
      <div className="space-y-2 py-0.5">
        {filteredGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <ul>{group.options.map(renderOption)}</ul>
          </div>
        ))}
      </div>
    ) : (
      <ul className="py-0.5">{filteredOptions.map(renderOption)}</ul>
    );

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
              disabled={disabled}
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
            allOptions.length === 0 ? (
              <p className="border-t border-slate-200 px-3 py-3 text-center text-xs text-slate-400">
                {emptyMessage}
              </p>
            ) : !hasFilteredResults ? (
              <p className="border-t border-slate-200 px-3 py-3 text-center text-xs text-slate-400">
                {noResultsMessage}
              </p>
            ) : (
              <div className="scrollbar-thin max-h-44 overflow-y-auto border-t border-slate-200 pr-0.5">
                {listContent}
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

export function toWorkerPickerOption(w: {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  position?: string;
  hourlyRate?: string;
}, formatSubtitle: (w: {
  specialization?: string;
  position?: string;
  hourlyRate?: string;
}) => string): WorkerPickerOption {
  return {
    id: w.id,
    firstName: w.firstName,
    lastName: w.lastName,
    subtitle: formatSubtitle(w),
  };
}

export { shortDisplayName, workerDisplayName };
