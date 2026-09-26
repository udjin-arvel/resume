import { Plus, Search } from "lucide-react";

type ToolsListHeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onAdd: () => void;
};

export function ToolsListHeader({ query, onQueryChange, onAdd }: ToolsListHeaderProps) {
  return (
    <div className="space-y-3 pt-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="truncate text-[20px] font-semibold tracking-tight text-slate-900">
          Инструменты
        </h1>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[12px] md:text-[14px] font-medium text-white transition hover:bg-slate-800"
        >
          <Plus className="h-3 w-3" />
          Инструмент
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Название, модель или серийный номер"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
