export function SectionCountBadge({ count }: { count: number }) {
  return (
    <span className="flex min-h-[16px] min-w-5 items-center justify-center rounded-full bg-slate-400 px-1 text-[10px] font-semibold text-white">
      {count}
    </span>
  );
}
