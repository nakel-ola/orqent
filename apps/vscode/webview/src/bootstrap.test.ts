import { ProjectId, ThreadId } from "@t3tools/contracts";
import { beforeEach, describe, expect, it } from "vitest";

import { useComposerDraftStore } from "~/composerDraftStore";
import { getInitialPanelPath, seedPanelDraftContext } from "./bootstrap";

describe("vscode bootstrap", () => {
  beforeEach(() => {
    useComposerDraftStore.setState({
      draftsByThreadId: {},
      draftThreadsByThreadId: {},
      projectDraftThreadIdByProjectId: {},
    });
  });

  it("returns the initial panel path for panel mode", () => {
    expect(
      getInitialPanelPath({
        mode: "panel",
        threadId: ThreadId.makeUnsafe("thread-1"),
        draftContext: null,
        wsUrl: "ws://127.0.0.1:3773",
      }),
    ).toBe("/thread-1");
  });

  it("seeds draft context for panel mode before mount", () => {
    const projectId = ProjectId.makeUnsafe("project-1");
    const threadId = ThreadId.makeUnsafe("thread-1");

    seedPanelDraftContext({
      mode: "panel",
      threadId,
      wsUrl: "ws://127.0.0.1:3773",
      draftContext: {
        projectId,
        createdAt: "2026-03-19T10:00:00.000Z",
        branch: "feature/panel",
        worktreePath: "/tmp/worktree",
        envMode: "worktree",
        runtimeMode: "full-access",
        interactionMode: "plan",
      },
    });

    expect(useComposerDraftStore.getState().getDraftThread(threadId)).toEqual({
      projectId,
      createdAt: "2026-03-19T10:00:00.000Z",
      branch: "feature/panel",
      worktreePath: "/tmp/worktree",
      envMode: "worktree",
      runtimeMode: "full-access",
      interactionMode: "plan",
    });
  });
});
