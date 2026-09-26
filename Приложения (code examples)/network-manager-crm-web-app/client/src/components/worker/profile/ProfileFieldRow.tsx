import type { ProfileFieldItem } from "@/lib/worker-profile";

type ProfileFieldRowProps = {
  field: ProfileFieldItem;
};

export function ProfileFieldRow({ field }: ProfileFieldRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 p-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[12px] md:text-[14px] text-slate-500">{field.label}</span>
        <span className="text-[14px] md:text-[16px] text-[#0F172B]">{field.value}</span>
      </div>
    </div>
  );
}
