import { FullWidthHeader } from "@/components/layout/FullWidthHeader";

type DashboardHeaderProps = {
  title: string;
  dateLabel: string;
};

export function DashboardHeader({ title, dateLabel }: DashboardHeaderProps) {
  return (
    <FullWidthHeader bleed className="py-4">
      <header className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-black">{title}</h1>
        <p className="text-[12px] md:text-[14px] text-slate-500">{dateLabel}</p>
      </header>
    </FullWidthHeader>
  );
}
