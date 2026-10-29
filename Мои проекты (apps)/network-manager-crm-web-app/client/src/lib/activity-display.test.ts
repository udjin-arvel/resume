import { describe, expect, it } from "vitest";
import { mapActivityToListItem } from "./activity-display";

describe("mapActivityToListItem", () => {
  it("shows project name for project_created events", () => {
    const item = mapActivityToListItem({
      id: "1",
      actorName: "Manager",
      action: "project_created",
      entityType: "project",
      entityId: "p1",
      label: "ЖК Север",
      createdAt: "2026-07-07T10:00:00Z",
    });

    expect(item.project).toBe("ЖК Север");
    expect(item.action).toBe("Проект создан");
  });

  it("falls back to dash for legacy project_created without project name", () => {
    const item = mapActivityToListItem({
      id: "2",
      actorName: "Manager",
      action: "project_created",
      entityType: "project",
      entityId: "p1",
      label: "Проект создан",
      createdAt: "2026-07-07T10:00:00Z",
    });

    expect(item.project).toBe("—");
    expect(item.action).toBe("Проект создан");
  });
});
