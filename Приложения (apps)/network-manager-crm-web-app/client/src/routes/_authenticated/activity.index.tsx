import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { LoadingSkeleton } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import { useActivityInfinite } from "@/lib/api/hooks/useDashboard";
import { mapActivityToListItem } from "@/lib/activity-display";

export const Route = createFileRoute("/_authenticated/activity/")({
  head: () => ({
    meta: [
      { title: "Активность — Менеджер" },
      { name: "description", content: "Полная лента активности по проектам и работникам." },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const activity = useActivityInfinite();

  const items = useMemo(
    () =>
      (activity.data?.pages ?? []).flatMap((page) =>
        page.items.map(mapActivityToListItem),
      ),
    [activity.data],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry?.isIntersecting &&
          activity.hasNextPage &&
          !activity.isFetchingNextPage
        ) {
          void activity.fetchNextPage();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [activity.hasNextPage, activity.isFetchingNextPage, activity.fetchNextPage]);

  return (
    <AppLayout activeNav="home">
      <PageHeader>
        <div className="py-4">
          <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">Активность</h1>
        </div>
      </PageHeader>

      <main className="space-y-4 px-4 pt-5 pb-8">
        {activity.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : activity.isError ? (
          <PageError onRetry={() => activity.refetch()} />
        ) : !items.length ? (
          <EmptyState title="Нет активности" />
        ) : (
          <section className="rounded-[12px] border border-[#F0F0F0] bg-white p-4">
            <ActivityList items={items} />
            <div ref={sentinelRef} className="h-1" aria-hidden />
            {activity.isFetchingNextPage ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#8E8E93]" />
              </div>
            ) : null}
          </section>
        )}
      </main>
    </AppLayout>
  );
}
