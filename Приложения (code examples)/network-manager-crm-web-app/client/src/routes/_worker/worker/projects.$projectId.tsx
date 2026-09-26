import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_worker/worker/projects/$projectId")({
  component: WorkerProjectLayout,
});

function WorkerProjectLayout() {
  return <Outlet />;
}
