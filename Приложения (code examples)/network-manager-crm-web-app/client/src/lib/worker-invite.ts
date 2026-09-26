export function getWorkerInviteSecret(): string {
  return import.meta.env.VITE_WORKER_INVITE_SECRET ?? "";
}

export function isWorkerInviteRequired(): boolean {
  return getWorkerInviteSecret().length > 0;
}

export function isValidWorkerInvite(invite: string | undefined): boolean {
  if (!isWorkerInviteRequired()) return true;
  return invite?.trim() === getWorkerInviteSecret();
}

export function buildWorkerInviteUrl(): string {
  const secret = getWorkerInviteSecret();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/auth/register?invite=${encodeURIComponent(secret)}`;
}
