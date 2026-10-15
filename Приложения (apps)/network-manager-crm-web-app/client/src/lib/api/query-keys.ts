export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  health: ["health"] as const,
  dashboard: {
    all: ["dashboard"] as const,
    urgent: () => [...queryKeys.dashboard.all, "urgent"] as const,
    problemProjects: () => [...queryKeys.dashboard.all, "problem-projects"] as const,
    activity: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.dashboard.all, "activity", filters] as const,
  },
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    mine: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.projects.all, "mine", filters] as const,
    myDetail: (id: string) => [...queryKeys.projects.all, "mine", id] as const,
    crew: (id: string) => [...queryKeys.projects.all, "crew", id] as const,
    workerDocuments: (id: string) =>
      [...queryKeys.projects.detail(id), "worker-documents"] as const,
    history: (id: string) => [...queryKeys.projects.detail(id), "history"] as const,
    supervisorCandidates: (id: string) =>
      [...queryKeys.projects.detail(id), "supervisor-candidates"] as const,
    issues: (id: string, filters: Record<string, unknown> = {}) =>
      [...queryKeys.projects.detail(id), "issues", filters] as const,
  },
  clients: {
    all: ["clients"] as const,
    lists: () => [...queryKeys.clients.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    projects: (id: string) => [...queryKeys.clients.detail(id), "projects"] as const,
    documents: (id: string) => [...queryKeys.clients.detail(id), "documents"] as const,
    finance: (id: string) => [...queryKeys.clients.detail(id), "finance"] as const,
  },
  estimates: {
    all: ["estimates"] as const,
    lists: () => [...queryKeys.estimates.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.estimates.lists(), filters] as const,
    details: () => [...queryKeys.estimates.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.estimates.details(), id] as const,
    templates: () => [...queryKeys.estimates.all, "templates"] as const,
  },
  workers: {
    all: ["workers"] as const,
    lists: () => [...queryKeys.workers.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.workers.lists(), filters] as const,
    details: () => [...queryKeys.workers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.workers.details(), id] as const,
    resources: () => [...queryKeys.workers.all, "resources"] as const,
    available: (projectId?: string) =>
      [...queryKeys.workers.all, "available", projectId ?? "all"] as const,
    projects: (id: string) => [...queryKeys.workers.detail(id), "projects"] as const,
  },
  reports: {
    all: ["reports"] as const,
    worker: {
      lists: () => [...queryKeys.reports.all, "worker", "list"] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.reports.worker.lists(), filters] as const,
      detail: (id: string) => [...queryKeys.reports.all, "worker", id] as const,
    },
    supervisor: {
      lists: () => [...queryKeys.reports.all, "supervisor", "list"] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.reports.supervisor.lists(), filters] as const,
      detail: (id: string) => [...queryKeys.reports.all, "supervisor", id] as const,
    },
  },
  finance: {
    all: ["finance"] as const,
    overview: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.finance.all, "overview", filters] as const,
    projects: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.finance.all, "projects", filters] as const,
    project: (id: string) => [...queryKeys.finance.all, "project", id] as const,
    workers: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.finance.all, "workers", filters] as const,
    worker: (id: string) => [...queryKeys.finance.all, "worker", id] as const,
    categories: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.finance.all, "categories", filters] as const,
    mine: () => [...queryKeys.finance.all, "mine"] as const,
  },
  tools: {
    all: ["tools"] as const,
    lists: () => [...queryKeys.tools.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.tools.lists(), filters] as const,
    details: () => [...queryKeys.tools.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tools.details(), id] as const,
  },
  documents: {
    all: ["documents"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.documents.all, filters] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: () => [...queryKeys.notifications.all, "list"] as const,
  },
};
