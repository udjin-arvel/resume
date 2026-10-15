import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../common/SectionHeading";

export type UrgentFilter = "all" | "red" | "amber" | "blue";

export type UrgentFilterCounts = {
  all: number;
  red: number;
  amber: number;
  blue: number;
};

type UrgentFilterTabsProps = {
  activeFilter: UrgentFilter;
  onChange: (filter: UrgentFilter) => void;
  counts: UrgentFilterCounts;
  children?: ReactNode;
};

const URGENT_EXPANDED_STORAGE_KEY = "dashboard:urgent-actions-expanded";

function readUrgentExpanded(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const stored = localStorage.getItem(URGENT_EXPANDED_STORAGE_KEY);
    if (stored === "false") return false;
    if (stored === "true") return true;
  } catch {
    // ignore storage errors
  }

  return true;
}

const tabs: { key: UrgentFilter; label: string; color?: string; secondaryColor?: string }[] = [
  { key: "all", label: "Все" },
  { key: "red", label: "Срочно", color: "#FF3B30", secondaryColor: "#FEF2F2" },
  { key: "amber", label: "Важно", color: "#FF9F0A", secondaryColor: "#FFF3E0" },
  { key: "blue", label: "Инфо", color: "#007AFF", secondaryColor: "#E6F2FF" },
];

export function UrgentFilterTabs({
  activeFilter,
  onChange,
  counts,
  children,
}: UrgentFilterTabsProps) {
  const [expanded, setExpanded] = useState(readUrgentExpanded);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(URGENT_EXPANDED_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <section className="mt-8 mb-2 flex flex-col gap-4">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 text-left"
      >
        <img
          src="/icons/arrow.svg"
          alt=""
          className={cn("h-4 w-4 shrink-0 transition-transform", !expanded && "rotate-180")}
        />
        <SectionHeading className="pb-0">Срочные действия</SectionHeading>
      </button>

      {expanded ? (
        <>
          <div className="scrollbar-responsive flex gap-2 overflow-x-auto pb-1">
            {tabs.map(({ key, label, color, secondaryColor }) => {
              const isActive = activeFilter === key;
              const count = counts[key];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border border-[#E2E8F0] px-3 py-1 text-[12px] font-medium ${
                    isActive
                      ? "border-transparent bg-[#0F172B] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                      isActive
                        ? "bg-white/20"
                        : color
                          ? "text-white"
                          : "bg-[#F5F6FA] text-[#8E8E93]"
                    }`}
                    style={!isActive ? { backgroundColor: secondaryColor, color: color } : undefined}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          {children}
        </>
      ) : null}
    </section>
  );
}
