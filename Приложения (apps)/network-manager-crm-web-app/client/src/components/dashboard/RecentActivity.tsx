import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SectionHeading } from "../common/SectionHeading";
import { ActivityList } from "./ActivityList";
import type { ActivityListItemData } from "@/lib/activity-display";

export type RecentActivityItemData = ActivityListItemData;

type RecentActivityProps = {
  title?: string;
  items: RecentActivityItemData[];
  showAllLink?: string;
};

export function RecentActivity({
  title = "Последняя активность",
  items,
  showAllLink,
}: RecentActivityProps) {
  return (
    <div className="mt-4">
      <SectionHeading className="mb-0">{title}</SectionHeading>
      <section className="rounded-[12px] border border-[#F0F0F0] bg-white">
        <ActivityList items={items} />
        {showAllLink ? (
          <Link
            to={showAllLink}
            className="mt-1 flex w-full items-center justify-center gap-1 border-t border-[#F1F5F9] py-3 text-[14px] font-medium text-black transition hover:text-[#333]"
          >
            Показать всю активность
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </section>
    </div>
  );
}
