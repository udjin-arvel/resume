export function ProjectSectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h2 className="truncate text-[14px] md:text-[16px] font-semibold text-slate-500">{title}</h2>
      {hint ? <span className="shrink-0 min-h-[16px] min-w-[20px] items-center justify-center rounded-full bg-[#90A1B9] px-1 text-[10px] font-semibold text-white text-center">{hint}</span> : null}
    </div>
  );
}
