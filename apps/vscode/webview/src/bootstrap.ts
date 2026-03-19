import { ProjectId, ThreadId, type T3CodeWebviewConfig } from "@t3tools/contracts";

import { useComposerDraftStore } from "~/composerDraftStore";

export function getInitialPanelPath(config: T3CodeWebviewConfig | null): string | null {
  if (config?.mode !== "panel" || !config.threadId) {
    return null;
  }

  return `/${config.threadId}`;
}

export function seedPanelDraftContext(config: T3CodeWebviewConfig | null): void {
  if (config?.mode !== "panel" || !config.threadId || !config.draftContext) {
    return;
  }

  const draftContext = config.draftContext;
  useComposerDraftStore
    .getState()
    .setProjectDraftThreadId(
      ProjectId.makeUnsafe(draftContext.projectId),
      ThreadId.makeUnsafe(config.threadId),
      {
        createdAt: draftContext.createdAt,
        branch: draftContext.branch,
        worktreePath: draftContext.worktreePath,
        envMode: draftContext.envMode,
        runtimeMode: draftContext.runtimeMode,
        interactionMode: draftContext.interactionMode,
      },
    );
}
