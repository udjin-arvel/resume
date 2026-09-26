import { Plane, Hotel, Car, Package, UtensilsCrossed, MoreHorizontal, HardHat } from "lucide-react";

export type CategoryKey =
  | "labor"
  | "flight"
  | "hotel"
  | "car"
  | "taxi"
  | "materials"
  | "food"
  | "other";

export const categoryMeta: Record<
  CategoryKey,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  labor: { label: "Оплата работников", icon: HardHat, color: "text-slate-900", bg: "bg-slate-900" },
  flight: { label: "Авиабилеты", icon: Plane, color: "text-blue-600", bg: "bg-blue-500" },
  hotel: { label: "Отели", icon: Hotel, color: "text-violet-600", bg: "bg-violet-500" },
  car: { label: "Аренда авто", icon: Car, color: "text-amber-600", bg: "bg-amber-500" },
  taxi: { label: "Такси", icon: Car, color: "text-orange-600", bg: "bg-orange-500" },
  materials: { label: "Материалы", icon: Package, color: "text-emerald-600", bg: "bg-emerald-500" },
  food: { label: "Питание", icon: UtensilsCrossed, color: "text-pink-600", bg: "bg-pink-500" },
  other: { label: "Прочее", icon: MoreHorizontal, color: "text-slate-600", bg: "bg-slate-400" },
};

export function categoryKey(raw: string): CategoryKey {
  const key = raw.toLowerCase() as CategoryKey;
  return key in categoryMeta ? key : "other";
}
