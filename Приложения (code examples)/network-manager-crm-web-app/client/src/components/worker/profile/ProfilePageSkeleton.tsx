export function ProfilePageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-28 rounded bg-slate-200" />
      <div className="overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center gap-4 p-4">
          <div className="h-12 w-12 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-3 w-28 rounded bg-slate-200" />
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="h-3 w-full rounded bg-slate-200" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="overflow-hidden rounded-2xl bg-white">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
              <div className="mb-1 h-3 w-20 rounded bg-slate-200" />
              <div className="h-3.5 w-32 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="overflow-hidden rounded-2xl bg-white">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="h-11 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
