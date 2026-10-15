import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_worker/worker/")({
  beforeLoad: () => {
    throw redirect({ to: "/worker/projects" });
  },
});
