import { describe, expect, it } from "vitest";
import {
  filterProjectsByRole,
  getProjectRoleBadge,
  isProjectSupervisor,
  isProjectWorker,
} from "./worker-projects";
import {
  getReportTypeAvailability,
  parseReportTypeTab,
  resolveReportTypeTab,
  shouldOpenReportForm,
} from "./worker-reports";

const workerProject = { id: "p1", role: "worker" };
const supervisorProject = { id: "p2", role: "supervisor" };

describe("project role helpers", () => {
  it("identifies worker and supervisor projects", () => {
    expect(isProjectWorker(workerProject)).toBe(true);
    expect(isProjectSupervisor(workerProject)).toBe(false);
    expect(isProjectWorker(supervisorProject)).toBe(false);
    expect(isProjectSupervisor(supervisorProject)).toBe(true);
  });

  it("filters projects by role", () => {
    const projects = [workerProject, supervisorProject];
    expect(filterProjectsByRole(projects, "worker")).toEqual([workerProject]);
    expect(filterProjectsByRole(projects, "supervisor")).toEqual([supervisorProject]);
  });

  it("returns role badge metadata", () => {
    expect(getProjectRoleBadge("worker").labelKey).toBe("worker.projects.workerRole");
    expect(getProjectRoleBadge("supervisor").labelKey).toBe("worker.projects.supervisor");
  });
});

describe("report type availability", () => {
  it("worker-only user", () => {
    const availability = getReportTypeAvailability([workerProject]);
    expect(availability).toEqual({
      hasWorkerProjects: true,
      hasSupervisorProjects: false,
    });
    expect(parseReportTypeTab(undefined, availability)).toBe("weekly");
    expect(parseReportTypeTab("daily", availability)).toBe("weekly");
  });

  it("supervisor-only user", () => {
    const availability = getReportTypeAvailability([supervisorProject]);
    expect(availability).toEqual({
      hasWorkerProjects: false,
      hasSupervisorProjects: true,
    });
    expect(parseReportTypeTab(undefined, availability)).toBe("daily");
    expect(parseReportTypeTab("weekly", availability)).toBe("daily");
  });

  it("mixed-role user", () => {
    const projects = [workerProject, supervisorProject];
    const availability = getReportTypeAvailability(projects);
    expect(availability).toEqual({
      hasWorkerProjects: true,
      hasSupervisorProjects: true,
    });
    expect(parseReportTypeTab(undefined, availability)).toBe("weekly");
    expect(parseReportTypeTab("daily", availability)).toBe("daily");
    expect(parseReportTypeTab("weekly", availability)).toBe("weekly");
  });
});

describe("shouldOpenReportForm", () => {
  it("allows editing draft, review, returned and attention statuses", () => {
    expect(shouldOpenReportForm("draft")).toBe(true);
    expect(shouldOpenReportForm("review")).toBe(true);
    expect(shouldOpenReportForm("returned")).toBe(true);
    expect(shouldOpenReportForm("attention")).toBe(true);
  });

  it("blocks editing approved and other final statuses", () => {
    expect(shouldOpenReportForm("approved")).toBe(false);
    expect(shouldOpenReportForm("accepted")).toBe(false);
    expect(shouldOpenReportForm("overdue")).toBe(false);
  });
});

describe("resolveReportTypeTab", () => {
  const projects = [workerProject, supervisorProject];

  it("picks daily tab for supervisor project deep link", () => {
    expect(resolveReportTypeTab(projects, undefined, "p2")).toBe("daily");
  });

  it("picks weekly tab for worker project deep link", () => {
    expect(resolveReportTypeTab(projects, undefined, "p1")).toBe("weekly");
  });

  it("prefers project role over search type", () => {
    expect(resolveReportTypeTab(projects, "weekly", "p2")).toBe("daily");
    expect(resolveReportTypeTab(projects, "daily", "p1")).toBe("weekly");
  });
});
