export const FORM_RADIUS = "rounded-[12px]";
export const formLabelClassName = "text-xs font-medium text-slate-500";
export const formInputClassName =
  "h-10 w-full rounded-[12px] border border-slate-200 bg-white text-[13px] shadow-none outline-none transition-colors placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-0";
export const onboardingInputClassName =
  "h-10 rounded-[12px] border border-slate-200 bg-white text-[13px] shadow-none outline-none transition-colors focus-visible:border-slate-400 focus-visible:ring-0 dark:border-slate-700 dark:bg-slate-900";

export const onboardingSelectTriggerClassName =
  "h-10 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-[13px] shadow-none outline-none transition-colors focus:border-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900";

/** Shared select appearance for manager UI and generic forms */
export const selectTriggerClassName =
  "w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-[14px] shadow-none outline-none transition-colors focus:border-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

/** @deprecated Use selectTriggerClassName */
export const formSelectTriggerClassName = selectTriggerClassName;
