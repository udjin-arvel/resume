import { formatDate, parseDecimal } from "@/lib/format";
import { createId } from "@/lib/create-id";
import { z } from "zod";
import type { estimateBlockSchema, estimateSchema } from "@/lib/api/schemas";

type ApiEstimate = z.infer<typeof estimateSchema>;
type ApiBlock = z.infer<typeof estimateBlockSchema>;

export type EstimateStatus = "draft" | "sent" | "approved" | "rejected";
export type EstimateBlockType = "services" | "resources" | "expenses" | "misc";

export type EstimateService = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
};

export type EstimateResource = {
  id: string;
  role: string;
  count: number;
  hours: number;
  rate: number;
};

export type EstimateExpense = {
  id: string;
  category: "hotel" | "flight" | "car" | "materials" | "other";
  description: string;
  amount: number;
};

export type EstimateMisc = {
  id: string;
  name: string;
  amount: number;
};

export type EstimateBlock =
  | { id: string; type: "services"; items: EstimateService[] }
  | { id: string; type: "resources"; items: EstimateResource[] }
  | { id: string; type: "expenses"; items: EstimateExpense[] }
  | { id: string; type: "misc"; items: EstimateMisc[] };

export type Estimate = {
  id: string;
  name: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  comment?: string;
  status: EstimateStatus;
  date: string;
  blocks: EstimateBlock[];
  fromTemplateId?: string;
  linkedProjectId?: string | null;
};

export type EstimateBasicsField =
  | "name"
  | "company"
  | "contact"
  | "phone"
  | "email"
  | "country"
  | "city";

const estimateBasicsSchema = z.object({
  name: z.string().trim().min(1, "Укажите название сметы"),
  company: z.string().trim().min(1, "Укажите компанию"),
  contact: z.string().trim().min(1, "Укажите контактное лицо"),
  phone: z.string().trim().min(1, "Укажите телефон"),
  email: z.string().trim().min(1, "Укажите email").email("Некорректный email"),
  country: z.string().trim().min(1, "Укажите страну"),
  city: z.string().trim().min(1, "Укажите город"),
});

export function validateEstimateBasics(
  est: Pick<Estimate, EstimateBasicsField>,
): Partial<Record<EstimateBasicsField, string>> | null {
  const result = estimateBasicsSchema.safeParse({
    name: est.name,
    company: est.company,
    contact: est.contact,
    phone: est.phone,
    email: est.email,
    country: est.country,
    city: est.city,
  });
  if (result.success) return null;

  const errors: Partial<Record<EstimateBasicsField, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as EstimateBasicsField;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

const apiTypeToUi = (t: string): EstimateBlockType => {
  switch (t) {
    case "service":
      return "services";
    case "resource":
      return "resources";
    case "expense":
      return "expenses";
    default:
      return "misc";
  }
};

const uiTypeToApi = (t: EstimateBlockType): string => {
  switch (t) {
    case "services":
      return "service";
    case "resources":
      return "resource";
    case "expenses":
    case "misc":
      return "expense";
  }
};

const expenseCategories = ["hotel", "flight", "car", "materials", "other"] as const;

function apiBlockToItem(block: ApiBlock, uiType: EstimateBlockType) {
  switch (uiType) {
    case "services":
      return {
        id: block.id,
        name: block.title ?? "",
        qty: parseDecimal(block.quantity),
        unit: block.unit ?? "шт",
        price: parseDecimal(block.unitPrice),
      } satisfies EstimateService;
    case "resources":
      return {
        id: block.id,
        role: block.role ?? "",
        count: parseDecimal(block.quantity) || 1,
        hours: parseDecimal(block.hours),
        rate: parseDecimal(block.rate),
      } satisfies EstimateResource;
    case "expenses": {
      const cat = expenseCategories.includes(block.title as (typeof expenseCategories)[number])
        ? (block.title as EstimateExpense["category"])
        : "other";
      return {
        id: block.id,
        category: cat,
        description: block.comment ?? block.title ?? "",
        amount: parseDecimal(block.amount),
      } satisfies EstimateExpense;
    }
    case "misc":
      return {
        id: block.id,
        name: block.title ?? "",
        amount: parseDecimal(block.amount),
      } satisfies EstimateMisc;
  }
}

export function estimateResponseToUI(data: ApiEstimate): Estimate {
  const blocks: EstimateBlock[] = [];
  let current: EstimateBlock | null = null;

  for (const b of data.blocks ?? []) {
    const uiType = apiTypeToUi(b.blockType);
    const item = apiBlockToItem(b, uiType);
    if (current && current.type === uiType) {
      (current.items as unknown[]).push(item);
    } else {
      current = { id: createId(), type: uiType, items: [item] } as EstimateBlock;
      blocks.push(current);
    }
  }

  return {
    id: data.id,
    name: data.name,
    company: data.companyName ?? "",
    contact: data.contactPerson ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    country: data.country ?? "",
    city: data.city ?? "",
    comment: data.comment,
    status: (data.status as EstimateStatus) ?? "draft",
    date: formatDate(data.createdAt),
    blocks,
    linkedProjectId: data.linkedProjectId ?? null,
  };
}

export function estimateUIToPayload(est: Estimate): Record<string, unknown> {
  const blocks: Record<string, unknown>[] = [];
  let sortOrder = 0;

  for (const block of est.blocks) {
    for (const item of block.items) {
      const blockType = uiTypeToApi(block.type);
      sortOrder += 1;
      if (block.type === "services") {
        const s = item as EstimateService;
        blocks.push({
          blockType,
          sortOrder,
          title: s.name,
          quantity: String(s.qty),
          unit: s.unit,
          unitPrice: String(s.price),
        });
      } else if (block.type === "resources") {
        const r = item as EstimateResource;
        blocks.push({
          blockType,
          sortOrder,
          role: r.role,
          quantity: String(r.count),
          hours: String(r.hours),
          rate: String(r.rate),
        });
      } else if (block.type === "expenses") {
        const e = item as EstimateExpense;
        blocks.push({
          blockType,
          sortOrder,
          title: e.category,
          amount: String(e.amount),
          comment: e.description,
        });
      } else {
        const m = item as EstimateMisc;
        blocks.push({
          blockType,
          sortOrder,
          title: m.name,
          amount: String(m.amount),
        });
      }
    }
  }

  return {
    name: est.name,
    companyName: est.company,
    contactPerson: est.contact,
    phone: est.phone,
    email: est.email,
    country: est.country,
    city: est.city,
    comment: est.comment ?? "",
    blocks,
  };
}

export function blocksFromTemplate(blocks: ApiBlock[]): EstimateBlock[] {
  return estimateResponseToUI({
    id: "",
    name: "",
    status: "draft",
    blocks,
  }).blocks;
}

export function blockTotal(b: EstimateBlock): number {
  switch (b.type) {
    case "services":
      return b.items.reduce((a, i) => a + i.qty * i.price, 0);
    case "resources":
      return b.items.reduce((a, i) => a + i.count * i.hours * i.rate, 0);
    case "expenses":
      return b.items.reduce((a, i) => a + i.amount, 0);
    case "misc":
      return b.items.reduce((a, i) => a + i.amount, 0);
  }
}

export function estimateTotal(e: Estimate): number {
  return e.blocks.reduce((a, b) => a + blockTotal(b), 0);
}

export function getEstimateDisplayTotal(data: ApiEstimate): number {
  const fromBlocks = estimateTotal(estimateResponseToUI(data));
  if (fromBlocks > 0 || (data.blocks?.length ?? 0) > 0) {
    return fromBlocks;
  }
  return parseDecimal(data.totalAmount);
}
