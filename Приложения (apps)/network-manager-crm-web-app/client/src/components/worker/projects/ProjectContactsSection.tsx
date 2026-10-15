import { Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import type { projectContactSchema } from "@/lib/api/schemas";
import { SectionHeading } from "@/components/common/SectionHeading";

type Contact = z.infer<typeof projectContactSchema>;

type ProjectContactsSectionProps = {
  contacts?: Contact[];
};

function contactLabel(role: string, t: (key: string) => string) {
  if (role === "supervisor") return t("worker.projects.contactSupervisor");
  return t("worker.projects.contactManager");
}

export function ProjectContactsSection({ contacts }: ProjectContactsSectionProps) {
  const { t } = useTranslation();
  const items = contacts?.filter((c) => c.name || c.phone) ?? [];

  return (
    <section>
      <SectionHeading className="pb-0">{t("worker.projects.contacts")}</SectionHeading>

      {items.length === 0 ? (
        <p className="pt-1 text-[12px] text-[#8E97AF]">{t("worker.projects.contactsEmpty")}</p>
      ) : (
        <ul className="divide-y divide-[#E0E4EC] overflow-hidden rounded-[12px] border border-[#E0E4EC] bg-white">
          {items.map((contact) => (
            <li
              key={`${contact.role}-${contact.name}`}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="text-[12px] md:text-[14px] text-slate-500">{contactLabel(contact.role, t)}</p>
                <p className="truncate text-[14px] md:text-[16px] font-semibold text-[#1D293D]">{contact.name || "—"}</p>
              </div>
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex shrink-0 items-center justify-center text-[#2563EB]"
                  aria-label={t("worker.projects.call")}
                >
                  <Phone className="h-4 w-4" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
