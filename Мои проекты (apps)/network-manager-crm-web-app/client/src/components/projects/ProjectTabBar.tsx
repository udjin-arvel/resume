type ProjectTabBarProps<T extends string> = {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onChange: (tab: T) => void;
};

export function ProjectTabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
}: ProjectTabBarProps<T>) {
  return (
    <div className="scrollbar-responsive flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
      {tabs.map((t) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
              active
                ? "border-transparent bg-[#111827] text-white"
                : "border-gray-200 bg-white text-[#45556C]"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
