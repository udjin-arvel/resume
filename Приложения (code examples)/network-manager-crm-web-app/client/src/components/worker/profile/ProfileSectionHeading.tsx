import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProfileSectionHeadingProps = {
  children: ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
};

export function ProfileSectionHeading({
  children,
  collapsible = false,
  expanded = true,
  onToggle,
  className,
}: ProfileSectionHeadingProps) {
  const content = (
    <>
      {collapsible ? (
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", !expanded && "-rotate-90")}
        />
      ) : null}
      <span>{children}</span>
    </>
  );

  if (collapsible) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "mb-2 flex w-full items-center gap-1.5 text-[14px] font-semibold text-slate-500",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <h3
      className={cn("mb-2 flex items-center gap-1.5 text-[14px] font-semibold text-slate-500", className)}
    >
      {content}
    </h3>
  );
}
