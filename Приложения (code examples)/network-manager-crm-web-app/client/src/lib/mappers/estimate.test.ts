import { describe, expect, it } from "vitest";
import {
  estimateResponseToUI,
  estimateTotal,
  estimateUIToPayload,
  type Estimate,
} from "./estimate";

describe("estimate mapper", () => {
  const apiEstimate = {
    id: "est-1",
    name: "Test",
    companyName: "Acme",
    contactPerson: "John",
    phone: "+1",
    email: "j@acme.com",
    country: "DE",
    city: "Berlin",
    status: "draft",
    createdAt: "2026-05-10T00:00:00Z",
    blocks: [
      {
        id: "b1",
        blockType: "service",
        sortOrder: 1,
        title: "Install",
        quantity: "10",
        unit: "шт",
        unitPrice: "100",
      },
      {
        id: "b2",
        blockType: "resource",
        sortOrder: 2,
        role: "Tech",
        quantity: "2",
        hours: "160",
        rate: "40",
      },
      {
        id: "b3",
        blockType: "expense",
        sortOrder: 3,
        title: "hotel",
        amount: "500",
        comment: "Rooms",
      },
    ],
  };

  it("converts API response to UI model", () => {
    const ui = estimateResponseToUI(apiEstimate);
    expect(ui.name).toBe("Test");
    expect(ui.company).toBe("Acme");
    expect(ui.blocks).toHaveLength(3);
    expect(ui.blocks[0].type).toBe("services");
    if (ui.blocks[0].type === "services") {
      expect(ui.blocks[0].items[0].name).toBe("Install");
      expect(ui.blocks[0].items[0].qty).toBe(10);
    }
  });

  it("round-trips UI to API payload", () => {
    const ui = estimateResponseToUI(apiEstimate);
    const payload = estimateUIToPayload(ui);
    const blocks = payload.blocks as { blockType: string; sortOrder: number }[];
    expect(blocks).toHaveLength(3);
    expect(blocks[0].blockType).toBe("service");
    expect(blocks[1].blockType).toBe("resource");
    expect(blocks[2].blockType).toBe("expense");
  });

  it("calculates estimate total", () => {
    const ui = estimateResponseToUI(apiEstimate);
    const total = estimateTotal(ui);
    expect(total).toBe(10 * 100 + 2 * 160 * 40 + 500);
  });

  it("handles empty estimate", () => {
    const empty: Estimate = {
      id: "new",
      name: "",
      company: "",
      contact: "",
      phone: "",
      email: "",
      country: "",
      city: "",
      status: "draft",
      date: "",
      blocks: [],
    };
    const payload = estimateUIToPayload(empty);
    expect(payload.blocks).toEqual([]);
    expect(estimateTotal(empty)).toBe(0);
  });
});
