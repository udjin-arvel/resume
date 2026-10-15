import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { APP_COLUMN_PADDED_CLASS } from "@/lib/layout";

type FullWidthHeaderProps = {
  children: ReactNode;
  className?: string;
  /** Extend to viewport edges when inside a centered app column */
  bleed?: boolean;
};

export function FullWidthHeader({ children, className, bleed }: FullWidthHeaderProps) {
  return (
    <div
      className={cn(
        "bg-white border-b border-[#E2E8F0] min-h-[62px] flex items-center",
        bleed ? "-mx-[calc((100vw-100%)/2)]" : "w-full",
        className,
      )}
    >
      <div className={APP_COLUMN_PADDED_CLASS}>{children}</div>
    </div>
  );
}
