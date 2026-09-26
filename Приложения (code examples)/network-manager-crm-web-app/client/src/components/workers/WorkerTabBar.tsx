export type WorkerTabItem<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

type WorkerTabBarProps<T extends string> = {
  tabs: WorkerTabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
};

export function WorkerTabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
}: WorkerTabBarProps<T>) {
  return (
    <div className="scrollbar-responsive -mx-1 flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
      {tabs.map((t) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[14px] font-medium transition-colors ${
              active
                ? "border-transparent bg-[#111827] text-white"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <span>{t.label}</span>
            {t.count != null && t.count > 0 ? (
              <span
                className={
                  active
                    ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 text-[10px] text-white"
                    : "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F1F5F9] text-[10px] text-slate-500"
                }
              >
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
