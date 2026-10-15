import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FullWidthHeader } from "./FullWidthHeader";

type PageHeaderProps = {
  children: ReactNode;
  className?: string;
  /** Use inside AppLayout centered column; default true */
  bleed?: boolean;
};

/** Full-viewport white header band; content stays in centered app column */
export function PageHeader({ children, className, bleed = true }: PageHeaderProps) {
  return (
    <FullWidthHeader bleed={bleed} className={cn("border-b border-slate-200", className)}>
      {children}
    </FullWidthHeader>
  );
}
