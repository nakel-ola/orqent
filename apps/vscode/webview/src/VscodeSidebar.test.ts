import { ProjectId, ThreadId } from "@t3tools/contracts";
import { describe, expect, it } from "vitest";

import {
  buildOpenThreadPayload,
  getVisibleProjectsForWorkspaceFolders,
  toDesktopDraftContext,
} from "./VscodeSidebar";

describe("VscodeSidebar helpers", () => {
  it("filters and de-duplicates projects by open workspace folders", () => {
    const visibleProjects = getVisibleProjectsForWorkspaceFolders(
      [
        { cwd: "/repo/a", id: "project-a" },
        { cwd: "/repo/a", id: "project-a-duplicate" },
        { cwd: "/repo/b", id: "project-b" },
      ],
      [{ path: "/repo/a", name: "repo-a" }],
    );

    expect(visibleProjects).toEqual([{ cwd: "/repo/a", id: "project-a" }]);
  });

  it("builds a panel payload that preserves seeded draft context", () => {
    const projectId = ProjectId.makeUnsafe("project-1");
    const threadId = ThreadId.makeUnsafe("thread-1");
    const draftContext = toDesktopDraftContext({
      projectId,
      draft: {
        createdAt: "2026-03-19T10:00:00.000Z",
        branch: "feature/sidebar",
        worktreePath: "/tmp/worktree",
        envMode: "worktree",
        runtimeMode: "full-access",
        interactionMode: "default",
      },
    });

    expect(
      buildOpenThreadPayload({
        threadId,
        title: "New Thread",
        projectName: "Repo",
        draftContext,
      }),
    ).toEqual({
      threadId,
      title: "New Thread",
      projectName: "Repo",
      draftContext,
    });
  });
});
