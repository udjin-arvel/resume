import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "rounded-md hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        icon: "grid size-9 shrink-0 place-items-center rounded-full bg-surface/75 text-ink-soft ring-1 ring-line hover:text-brand",
        filter: "h-8 shrink-0 rounded-full bg-surface/70 px-3.5 text-[13px] text-ink-soft ring-1 ring-line hover:bg-brand-soft hover:text-brand",
        filterActive: "h-8 shrink-0 rounded-full bg-ink px-3.5 text-[13px] text-canvas ring-1 ring-ink",
        nav: "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-ink-faint hover:text-brand",
        action: "flex h-11 items-center justify-center gap-2 rounded-lg bg-surface/80 px-3 text-[13px] text-ink ring-1 ring-line hover:bg-brand-soft hover:text-brand",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} type={type} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  },
);

Button.displayName = "Button";