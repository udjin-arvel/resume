import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { selectTriggerClassName } from "@/lib/form-styles";

export type NativeSelectProps = React.ComponentProps<"select"> & {
  error?: boolean;
};

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, error, children, value, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        value={value}
        className={cn(
          selectTriggerClassName,
          "appearance-none cursor-pointer pr-9 text-slate-500 [&>option]:text-slate-900",
          value && "text-slate-900",
          error && "border-red-500 focus:border-red-500",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
