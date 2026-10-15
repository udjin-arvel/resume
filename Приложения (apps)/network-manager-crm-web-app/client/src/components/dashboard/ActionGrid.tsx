import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ActionGridItemProps = {
  icon?: LucideIcon;
  iconSrc?: string;
  label: string|ReactNode;
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  onClick?: () => void;
};

const itemClassName =
  "card-hover flex cursor-pointer flex-col items-start rounded-[8px] border border-[#E2E8F0] bg-white p-3 text-left";

function ItemContent({
  icon: Icon,
  iconSrc,
  label,
}: Pick<ActionGridItemProps, "icon" | "iconSrc" | "label">) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-black/90 text-white">
        {iconSrc ? (
          <img src={iconSrc} alt="" className="h-5 w-5" />
        ) : Icon ? (
          <Icon className="h-5 w-5" />
        ) : null}
      </span>
      <span className="text-[12px] md:text-[14px] leading-tight text-black">{label}</span>
    </div>
  );
}

export function ActionGridItem({
  icon,
  iconSrc,
  label,
  to,
  params,
  search,
  onClick,
}: ActionGridItemProps) {
  if (to) {
    return (
      <Link to={to} params={params} search={search} className={itemClassName}>
        <ItemContent icon={icon} iconSrc={iconSrc} label={label} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={itemClassName}>
      <ItemContent icon={icon} iconSrc={iconSrc} label={label} />
    </button>
  );
}

export function ActionGrid({ children }: { children: ReactNode }) {
  return <div className="mt-6 grid grid-cols-3 gap-3">{children}</div>;
}
