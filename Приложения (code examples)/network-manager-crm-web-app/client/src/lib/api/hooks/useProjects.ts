import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignProjectWorker,
  assignProjectWorkersBatch,
  confirmProjectParticipation,
  createProject,
  declineProjectParticipation,
  fetchMyProject,
  fetchMyProjects,
  fetchProject,
  fetchProjectCrew,
  fetchProjectHistory,
  fetchProjectIssues,
  fetchProjectWorkerDocuments,
  fetchProjects,
  fetchSupervisorCandidates,
  inviteToProject,
  sendProjectNotifications,
  setProjectSupervisor,
  updateProject,
  updateProjectIssueStatus,
  uploadProjectDocument,
  type MyProjectListQuery,
  type ProjectListQuery,
} from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/query-keys";

export function useProjects(filters: ProjectListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => fetchProjects(filters),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateProject(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.history(id) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useAssignProjectWorker(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; role?: string }) =>
      assignProjectWorker(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.history(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.available(projectId) });
    },
  });
}

export function useAssignProjectWorkersBatch(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      assignProjectWorkersBatch(projectId, { userIds, role: "worker" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.history(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.available(projectId) });
    },
  });
}

export function useSetProjectSupervisor(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => setProjectSupervisor(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.history(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.supervisorCandidates(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.workers.available(projectId) });
    },
  });
}

export function useSupervisorCandidates(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.supervisorCandidates(projectId),
    queryFn: () => fetchSupervisorCandidates(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useInviteToProject(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => inviteToProject(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

export function useSendProjectNotifications(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      userIds: string[];
      title?: string;
      body: string;
      link?: string;
    }) =>
      sendProjectNotifications(projectId, {
        ...payload,
        link: payload.link ?? `/worker/projects/${projectId}`,
      }),
  });
}

export function useMyProjects(filters: MyProjectListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.projects.mine(filters),
    queryFn: () => fetchMyProjects(filters),
  });
}

export function useMyProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.myDetail(id),
    queryFn: () => fetchMyProject(id),
    enabled: !!id,
  });
}

export function useConfirmProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: confirmProjectParticipation,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}

export function useDeclineProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: declineProjectParticipation,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}

export function useProjectCrew(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.crew(projectId),
    queryFn: () => fetchProjectCrew(projectId),
    enabled: !!projectId && enabled,
  });
}

export function useProjectIssues(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.issues(projectId, { status: "open,in_progress" }),
    queryFn: () => fetchProjectIssues(projectId, { status: "open,in_progress" }),
    enabled: !!projectId && enabled,
  });
}

export function useProjectWorkerDocuments(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.workerDocuments(projectId),
    queryFn: () => fetchProjectWorkerDocuments(projectId),
    enabled: !!projectId,
  });
}

export function useUploadProjectDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => uploadProjectDocument(projectId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.documents.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.workerDocuments(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.history(projectId) });
    },
  });
}

export function useProjectHistory(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.history(projectId),
    queryFn: () => fetchProjectHistory(projectId),
    enabled: !!projectId,
  });
}

export function useUpdateProjectIssueStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: string }) =>
      updateProjectIssueStatus(projectId, issueId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reports.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}
