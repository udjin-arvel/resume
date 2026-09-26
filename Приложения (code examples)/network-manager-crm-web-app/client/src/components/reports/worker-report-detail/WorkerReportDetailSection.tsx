type WorkerReportDetailSectionProps = {
  title: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
};

export function WorkerReportDetailSection({
  title,
  badge,
  children,
}: WorkerReportDetailSectionProps) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-[14px] font-semibold text-slate-500">{title}</h2>
        {badge}
      </div>
      <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">{children}</div>
    </section>
  );
}
