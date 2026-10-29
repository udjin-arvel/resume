import { useState } from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { cn } from "@/lib/utils";
import { ProjectEstimateCard, type ProjectEstimateCardData } from "./ProjectEstimateCard";

export type ProjectEstimateItem = ProjectEstimateCardData;

type ProjectEstimatesAccordionProps = {
  estimates: ProjectEstimateItem[];
  defaultOpen?: boolean;
  isLoading?: boolean;
};

export function ProjectEstimatesAccordion({
  estimates,
  defaultOpen = true,
  isLoading,
}: ProjectEstimatesAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-2 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full text-left items-center gap-1.5"
      >
        <span className="flex items-center gap-1.5">
          <img
            src="/icons/arrow.svg"
            alt=""
            className={cn("h-4 w-4 shrink-0 transition-transform", !open && "rotate-180")}
          />
          <SectionHeading className="pb-0">Сметы</SectionHeading>
        </span>
        <span className="inline-flex shrink-0 h-[16px] min-w-[20px] items-center justify-center rounded-full bg-[#90A1B9] text-[10px] font-semibold text-white">
          {estimates.length}
        </span>
      </button>

      {open ? (
        isLoading ? (
          <p className="text-[13px] text-gray-500">Загрузка…</p>
        ) : estimates.length === 0 ? (
          <p className="rounded-[12px] border border-slate-200 bg-white px-4 py-8 text-center text-[12px] md:text-[14px] text-slate-500">Нет смет</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {estimates.map((estimate) => (
              <li key={estimate.id}>
                <ProjectEstimateCard estimate={estimate} />
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
