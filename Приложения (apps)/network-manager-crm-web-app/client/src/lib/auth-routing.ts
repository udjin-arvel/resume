import type { UserResponse } from "@/lib/api/types";
import { parseCertificates } from "@/lib/constants/worker-certificates";
import { normalizeSpecializationId } from "@/lib/constants/worker-specializations";

export function needsApplicationCorrections(user: UserResponse): boolean {
  return Boolean(user.applicationCorrectionsNeeded);
}

export function needsOnboarding(user: UserResponse): boolean {
  const positionId =
    normalizeSpecializationId(user.position) ?? normalizeSpecializationId(user.specialization);
  const hasCertificates = parseCertificates(user.specialization).length > 0;
  return (
    (user.role === "worker" || user.role === "supervisor") &&
    (!positionId || !hasCertificates)
  );
}

export function getPostLoginPath(user: UserResponse, redirect?: string): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("/auth")) {
    return redirect;
  }
  if (needsOnboarding(user)) return "/onboarding";
  if (user.status === "pending" && needsApplicationCorrections(user)) return "/onboarding";
  if (user.status === "rejected") return "/application-rejected";
  if (user.status === "pending") return "/pending-approval";
  if (user.status === "blocked") return "/worker/profile";
  if (user.role === "manager") return "/";
  return "/worker/projects";
}
