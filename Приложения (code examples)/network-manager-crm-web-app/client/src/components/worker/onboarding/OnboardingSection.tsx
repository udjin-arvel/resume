import type { ReactNode } from "react";
import { FORM_RADIUS } from "@/lib/form-styles";

type OnboardingSectionProps = {
  title: string;
  children: ReactNode;
};

export function OnboardingSection({ title, children }: OnboardingSectionProps) {
  return (
    <section
      className={`${FORM_RADIUS} border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900`}
    >
      <h2 className="mb-3 text-[13px] font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {children}
    </section>
  );
}
