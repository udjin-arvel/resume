import { useEffect, useMemo, useState } from "react";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { SearchInput } from "@/components/common/SearchInput";
import { Checkbox } from "@/components/ui/checkbox";
import { FORM_RADIUS, formLabelClassName } from "@/lib/form-styles";

export type ReportsFilterOption = { id: string; label: string };

type ReportsFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  searchPlaceholder: string;
  options: ReportsFilterOption[];
  selectedIds: string[];
  onApply: (ids: string[]) => void;
};

export function ReportsFilterSheet({
  open,
  onOpenChange,
  title,
  searchPlaceholder,
  options,
  selectedIds,
  onApply,
}: ReportsFilterSheetProps) {
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setDraftIds(selectedIds);
      setSearch("");
    }
  }, [open, selectedIds]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (id: string) => {
    setDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleReset = () => {
    setDraftIds([]);
    setSearch("");
  };

  const handleApply = () => {
    onApply(draftIds);
    onOpenChange(false);
  };

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Выберите значения для фильтрации списка отчётов."
      footer={
        <>
          <FormBottomSheetCancel onClick={handleReset}>Сбросить</FormBottomSheetCancel>
          <FormBottomSheetPrimary onClick={handleApply}>Применить</FormBottomSheetPrimary>
        </>
      }
    >
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={searchPlaceholder}
      />

      <div className="space-y-1.5">
        {filteredOptions.length === 0 ? (
          <p
            className={`${FORM_RADIUS} px-4 py-6 text-center text-xs text-slate-500`}
          >
            Ничего не найдено
          </p>
        ) : (
          <ul className="overflow-y-auto">
            {filteredOptions.map((option) => {
              const checked = draftIds.includes(option.id);
              return (
                <li key={option.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-[10px] py-2 hover:bg-slate-50">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(option.id)}
                    />
                    <span className="min-w-0 flex-1 truncate text-[14px] text-slate-900">
                      {option.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FormBottomSheet>
  );
}
