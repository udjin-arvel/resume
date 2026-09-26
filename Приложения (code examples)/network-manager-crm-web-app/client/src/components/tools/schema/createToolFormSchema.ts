import { z } from "zod";
import { categories, needsCalibrationFields, needsUsageLimit } from "../constants";

export const controlTypeSchema = z.enum([
  "accounting_only",
  "expiry",
  "calibration",
  "usage_limit",
  "combined",
]);

export const createToolFormSchema = z
  .object({
    name: z.string().min(1, "Обязательное поле"),
    toolType: z.string().optional(),
    model: z.string().min(1, "Обязательное поле"),
    serialNumber: z.string().min(1, "Обязательное поле"),
    comment: z.string().optional(),
    cost: z.string().optional(),
    purchaseDate: z.string().optional(),
    controlType: controlTypeSchema,
    lastCalibratedAt: z.string().optional(),
    validUntil: z.string().optional(),
    calibrationPeriodMonths: z.coerce.number().optional(),
    calibrationNotes: z.string().optional(),
    usageLimit: z.coerce.number().optional(),
    usageUnit: z.string().optional(),
    usageCount: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (needsCalibrationFields(data.controlType)) {
      if (!data.lastCalibratedAt?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Обязательное поле",
          path: ["lastCalibratedAt"],
        });
      }
      if (!data.validUntil?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Обязательное поле",
          path: ["validUntil"],
        });
      }
      if (data.lastCalibratedAt && data.validUntil && data.validUntil < data.lastCalibratedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Дата должна быть позже последней калибровки",
          path: ["validUntil"],
        });
      }
    }
    if (needsUsageLimit(data.controlType)) {
      if (!data.usageLimit || data.usageLimit <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Укажите лимит",
          path: ["usageLimit"],
        });
      }
      const count = data.usageCount ?? 0;
      if (count < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Не может быть отрицательным",
          path: ["usageCount"],
        });
      }
      if (data.usageLimit && count > data.usageLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Не может превышать лимит",
          path: ["usageCount"],
        });
      }
    }
  });

export type CreateToolForm = z.infer<typeof createToolFormSchema>;

export const defaultCreateToolValues: CreateToolForm = {
  name: "",
  toolType: categories[0],
  model: "",
  serialNumber: "",
  comment: "",
  cost: "",
  purchaseDate: "",
  controlType: "calibration",
  lastCalibratedAt: "",
  validUntil: "",
  calibrationPeriodMonths: 12,
  calibrationNotes: "",
  usageLimit: undefined,
  usageUnit: "tests",
  usageCount: 0,
};

export function parseCostCents(cost: string | undefined): number {
  if (!cost?.trim()) return 0;
  const normalized = cost.replace(",", ".").trim();
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function buildCreateToolPayload(data: CreateToolForm) {
  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    serialNumber: data.serialNumber.trim(),
    toolType: data.toolType?.trim() ?? "",
    model: data.model.trim(),
    controlType: data.controlType,
    comment: data.comment?.trim() ?? "",
    costCents: parseCostCents(data.cost),
    purchaseDate: data.purchaseDate?.trim() || undefined,
    usageUnit: data.usageUnit || "tests",
    calibrationPeriodMonths: data.calibrationPeriodMonths || 12,
  };

  if (needsUsageLimit(data.controlType)) {
    payload.usageLimit = data.usageLimit ?? 0;
    payload.usageCount = data.usageCount ?? 0;
  } else {
    payload.usageLimit = 0;
    payload.usageCount = 0;
  }

  if (needsCalibrationFields(data.controlType)) {
    payload.lastCalibratedAt = data.lastCalibratedAt?.trim();
    payload.validUntil = data.validUntil?.trim();
    payload.calibrationNotes = data.calibrationNotes?.trim() ?? "";
  }

  return payload;
}
