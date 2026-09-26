import type { ReactNode } from "react";

type ReportFormSectionProps = {
  /** Gray label above the white card */
  title?: string;
  /** Custom header row inside the card (e.g. expenses block) */
  header?: ReactNode;
  children: ReactNode;
};

export function ReportFormSection({ title, header, children }: ReportFormSectionProps) {
  return (
    <section className="mb-4">
      {title ? (
        <h2 className="mb-2 text-sm font-medium text-slate-500">{title}</h2>
      ) : null}
      <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
        {header ? <div className="mb-3">{header}</div> : null}
        {children}
      </div>
    </section>
  );
}
