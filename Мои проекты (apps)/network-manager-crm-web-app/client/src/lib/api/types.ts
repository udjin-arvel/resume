export type TelegramAuthRequest = {
  initData: string;
  inviteCode?: string;
  language?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: "worker" | "manager";
  inviteCode?: string;
  language?: string;
};

export type UserRole = "manager" | "worker" | "supervisor";
export type UserStatus = "pending" | "active" | "blocked" | "rejected";

export type ApplicationFeedback = {
  action?: "reject" | "return";
  reasons?: string[];
  comment?: string;
  reviewedAt?: string;
};

export type UserResponse = {
  id: string;
  telegramId?: number;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country?: string;
  position?: string;
  specialization?: string;
  hourlyRate?: string;
  language?: string;
  timezone?: string;
  createdAt?: string;
  telegramUsername?: string;
  blockReason?: string;
  blockedAt?: string;
  blockProjectId?: string;
  blockProjectName?: string;
  applicationCorrectionsNeeded?: boolean;
  applicationFeedback?: ApplicationFeedback;
};

export type AuthResponse = {
  token: string;
  refreshToken?: string;
  user: UserResponse;
};

export type ApiErrorResponse = {
  error: string;
  details?: Record<string, string>;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginationQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
};
