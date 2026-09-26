import { useState } from "react";
import { cn } from "@/lib/utils";

type ToolDetailAccordionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function ToolDetailAccordion({
  title,
  defaultOpen = false,
  children,
}: ToolDetailAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-1 py-2.5 text-left"
      >
        <img
          src="/icons/arrow.svg"
          alt=""
          className={cn("h-4 w-4 shrink-0 transition-transform", !open && "rotate-180")}
        />
        <span className="text-[14px] font-semibold text-slate-500">{title}</span>
      </button>
      {open ? <div className="pb-1">{children}</div> : null}
    </section>
  );
}
