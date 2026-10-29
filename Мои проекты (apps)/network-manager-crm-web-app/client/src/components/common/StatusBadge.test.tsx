import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { I18nextProvider } from "react-i18next";
import { initI18n } from "@/i18n";

const i18n = initI18n();

function wrap(ui: React.ReactNode) {
  return <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>;
}

describe("StatusBadge", () => {
  it("renders review status", () => {
    render(wrap(<StatusBadge status="review" />));
    expect(screen.getByText("На проверке")).toBeTruthy();
  });

  it("renders unknown status as-is", () => {
    render(wrap(<StatusBadge status="custom" />));
    expect(screen.getByText("custom")).toBeTruthy();
  });
});
