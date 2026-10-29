import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_worker/worker/projects")({
  component: WorkerProjectsLayout,
});

function WorkerProjectsLayout() {
  return <Outlet />;
}
