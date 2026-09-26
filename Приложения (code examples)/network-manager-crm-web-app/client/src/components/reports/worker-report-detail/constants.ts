import {
  Car,
  Hotel,
  MoreHorizontal,
  Package,
  Plane,
  UtensilsCrossed,
} from "lucide-react";

export const expenseMeta: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  flight: { label: "Авиабилет", icon: Plane },
  hotel: { label: "Отель", icon: Hotel },
  car: { label: "Аренда авто", icon: Car },
  taxi: { label: "Такси", icon: Car },
  transport: { label: "Транспорт", icon: Car },
  materials: { label: "Материалы", icon: Package },
  food: { label: "Питание", icon: UtensilsCrossed },
  other: { label: "Другое", icon: MoreHorizontal },
};

export function expenseTypeMeta(type: string) {
  return expenseMeta[type] ?? expenseMeta.other;
}

export const dayDefs = [
  { key: "mon", label: "Понедельник", field: "hoursMon" as const },
  { key: "tue", label: "Вторник", field: "hoursTue" as const },
  { key: "wed", label: "Среда", field: "hoursWed" as const },
  { key: "thu", label: "Четверг", field: "hoursThu" as const },
  { key: "fri", label: "Пятница", field: "hoursFri" as const },
  { key: "sat", label: "Суббота", field: "hoursSat" as const },
  { key: "sun", label: "Воскресенье", field: "hoursSun" as const },
];
