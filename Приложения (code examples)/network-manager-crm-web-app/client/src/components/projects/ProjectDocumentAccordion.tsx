import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentOpenLink } from "@/components/common/DocumentAccess";
import { SectionCountBadge } from "@/components/common/SectionCountBadge";
import { FORM_RADIUS } from "@/lib/form-styles";

export type ProjectDocumentFile = {
  id: string;
  filename: string;
  mimeType?: string;
  /** When set, row links to the CRM estimate page instead of opening a file. */
  estimateId?: string;
};

type ProjectDocumentAccordionProps = {
  title: string;
  items: ProjectDocumentFile[];
  defaultOpen?: boolean;
  emptyLabel?: string;
};

const rowClassName =
  "flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-gray-50";

function DocumentRowContent({ filename }: { filename: string }) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <Paperclip className="h-4 w-4 shrink-0 text-[#8E97AF]" />
        <span className="truncate text-[14px] text-[#1A1C29]">{filename}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#8E97AF]" />
    </>
  );
}

export function ProjectDocumentAccordion({
  title,
  items,
  defaultOpen = true,
  emptyLabel = "Нет документов",
}: ProjectDocumentAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn("overflow-hidden border border-[#E0E4EC] bg-white", FORM_RADIUS)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left",
          open && "border-b border-[#E0E4EC]",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <img
            src="/icons/arrow.svg"
            alt=""
            className={cn("h-4 w-4 shrink-0 transition-transform", !open && "rotate-180")}
          />
          <h2 className="truncate text-[14px] font-semibold text-[#1A1C29]">{title}</h2>
        </span>
        <SectionCountBadge count={items.length} />
      </button>

      {open ? (
        items.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12px] md:text-[14px] text-slate-500">{emptyLabel}</p>
        ) : (
          <ul>
            {items.map((doc) => (
              <li key={doc.id} className="border-b border-[#E0E4EC] last:border-0">
                {doc.estimateId ? (
                  <Link
                    to="/estimates/$estimateId"
                    params={{ estimateId: doc.estimateId }}
                    className={rowClassName}
                  >
                    <DocumentRowContent filename={doc.filename} />
                  </Link>
                ) : (
                  <DocumentOpenLink
                    documentId={doc.id}
                    filename={doc.filename}
                    mimeType={doc.mimeType}
                    className={rowClassName}
                  >
                    <DocumentRowContent filename={doc.filename} />
                  </DocumentOpenLink>
                )}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
