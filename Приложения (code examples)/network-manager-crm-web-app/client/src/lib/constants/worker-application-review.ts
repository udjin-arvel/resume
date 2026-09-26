export const REJECT_APPLICATION_REASONS = [
  "incomplete_documents",
  "wrong_specialization",
  "no_positions",
  "other",
] as const;

export const RETURN_APPLICATION_REASONS = [
  "upload_license",
  "clarify_specialization",
  "fix_rate",
  "other",
] as const;

export type RejectApplicationReason = (typeof REJECT_APPLICATION_REASONS)[number];
export type ReturnApplicationReason = (typeof RETURN_APPLICATION_REASONS)[number];

export type ApplicationFeedback = {
  action?: "reject" | "return";
  reasons?: string[];
  comment?: string;
  reviewedAt?: string;
};
