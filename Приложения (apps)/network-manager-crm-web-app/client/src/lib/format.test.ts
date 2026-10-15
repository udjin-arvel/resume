import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, parseDecimal, parseRuDate } from "./format";

describe("parseDecimal", () => {
  it("parses strings and numbers", () => {
    expect(parseDecimal("1234.56")).toBeCloseTo(1234.56);
    expect(parseDecimal("1.234,56")).toBeCloseTo(1.234);
    expect(parseDecimal(42)).toBe(42);
    expect(parseDecimal(null)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formats euro amounts", () => {
    expect(formatMoney("1500")).toBe("€1.500");
    expect(formatMoney(0)).toBe("€0");
  });
});

describe("formatDate", () => {
  it("formats ISO dates", () => {
    expect(formatDate("2026-05-10")).toBe("10.05.2026");
    expect(formatDate(null)).toBe("—");
  });
});

describe("parseRuDate", () => {
  it("parses valid ru dates to ISO", () => {
    expect(parseRuDate("10.05.2026")).toBe("2026-05-10");
    expect(parseRuDate(" 14.06.2026 ")).toBe("2026-06-14");
  });

  it("rejects invalid dates", () => {
    expect(parseRuDate("")).toBeNull();
    expect(parseRuDate("32.01.2026")).toBeNull();
    expect(parseRuDate("10-05-2026")).toBeNull();
  });
});
