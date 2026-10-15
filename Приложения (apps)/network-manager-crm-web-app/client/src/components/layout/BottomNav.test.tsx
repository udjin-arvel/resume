import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/layout/BottomNav";
import { I18nextProvider } from "react-i18next";
import { initI18n } from "@/i18n";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";

const i18n = initI18n();

const rootRoute = createRootRoute({
  component: () => <BottomNav active="projects" />,
});

const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

describe("BottomNav", () => {
  it("renders navigation labels", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>,
    );
    expect(await screen.findByText("Проекты")).toBeTruthy();
    expect(screen.getByText("Главная")).toBeTruthy();
  });
});
