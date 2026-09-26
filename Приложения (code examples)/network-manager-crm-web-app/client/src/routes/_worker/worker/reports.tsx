import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_worker/worker/reports")({
  component: ReportsLayout,
});

function ReportsLayout() {
  return <Outlet />;
}
