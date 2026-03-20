import {
  DEFAULT_MODEL_BY_PROVIDER,
  ProjectId,
  ThreadId,
  type DesktopDraftContext,
  type DesktopOpenThreadPayload,
  type WorkspaceFolderEntry,
} from "@t3tools/contracts";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAppSettings } from "~/appSettings";
import { useComposerDraftStore } from "~/composerDraftStore";
import { resolveThreadStatusPill } from "~/components/Sidebar.logic";
import { newCommandId, newProjectId, newThreadId } from "~/lib/utils";
import { readNativeApi } from "~/nativeApi";
import { derivePendingApprovals, derivePendingUserInputs } from "~/session-logic";
import { useStore } from "~/store";
import { onWorkspaceFolders } from "~/vscodeBridge";

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getVisibleProjectsForWorkspaceFolders<
  TProject extends { cwd: string },
  TWorkspaceFolder extends WorkspaceFolderEntry,
>(projects: readonly TProject[], workspaceFolders: readonly TWorkspaceFolder[]): TProject[] {
  const workspaceFolderPaths = new Set(workspaceFolders.map((folder) => folder.path));
  return projects
    .filter((project) => workspaceFolderPaths.has(project.cwd))
    .filter((project, index, allProjects) => {
      return allProjects.findIndex((candidate) => candidate.cwd === project.cwd) === index;
    });
}

export function toDesktopDraftContext(input: {
  projectId: ProjectId;
  draft: {
    createdAt: string;
    branch: string | null;
    worktreePath: string | null;
    envMode: "local" | "worktree";
    runtimeMode: DesktopDraftContext["runtimeMode"];
    interactionMode: DesktopDraftContext["interactionMode"];
  } | null;
}): DesktopDraftContext | null {
  const { draft, projectId } = input;
  if (!draft) {
    return null;
  }

  return {
    projectId,
    createdAt: draft.createdAt,
    branch: draft.branch,
    worktreePath: draft.worktreePath,
    envMode: draft.envMode,
    runtimeMode: draft.runtimeMode,
    interactionMode: draft.interactionMode,
  };
}

export function buildOpenThreadPayload(input: {
  threadId: DesktopOpenThreadPayload["threadId"];
  title: string;
  projectName: string;
  draftContext: DesktopDraftContext | null;
}): DesktopOpenThreadPayload {
  return {
    threadId: input.threadId,
    title: input.title,
    projectName: input.projectName,
    draftContext: input.draftContext,
  };
}

export function VscodeSidebar() {
  const projects = useStore((store) => store.projects);
  const threads = useStore((store) => store.threads);
  const threadsHydrated = useStore((store) => store.threadsHydrated);
  const markThreadUnread = useStore((store) => store.markThreadUnread);
  const { settings: appSettings } = useAppSettings();
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFolderEntry[]>([]);
  const [renamingThreadId, setRenamingThreadId] = useState<ThreadId | null>(null);
  const [renamingTitle, setRenamingTitle] = useState("");
  const renamingInputRef = useRef<HTMLInputElement | null>(null);
  const renamingCommittedRef = useRef(false);

  useEffect(() => onWorkspaceFolders(setWorkspaceFolders), []);

  useEffect(() => {
    if (!threadsHydrated || workspaceFolders.length === 0) {
      return;
    }

    const api = readNativeApi();
    if (!api) {
      return;
    }

    const existingProjectCwds = new Set(projects.map((project) => project.cwd));
    for (const folder of workspaceFolders) {
      if (existingProjectCwds.has(folder.path)) {
        continue;
      }

      void api.orchestration.dispatchCommand({
        type: "project.create",
        commandId: newCommandId(),
        projectId: newProjectId(),
        title: folder.name,
        workspaceRoot: folder.path,
        defaultModel: DEFAULT_MODEL_BY_PROVIDER.codex,
        createdAt: new Date().toISOString(),
      });
    }
  }, [projects, threadsHydrated, workspaceFolders]);

  const visibleProjects = getVisibleProjectsForWorkspaceFolders(projects, workspaceFolders);

  const cancelRename = useCallback(() => {
    setRenamingThreadId(null);
    renamingInputRef.current = null;
  }, []);

  const commitRename = useCallback(
    async (threadId: ThreadId, nextTitle: string, originalTitle: string) => {
      const trimmedTitle = nextTitle.trim();
      if (trimmedTitle.length === 0 || trimmedTitle === originalTitle) {
        cancelRename();
        return;
      }

      const api = readNativeApi();
      if (!api) {
        cancelRename();
        return;
      }

      try {
        await api.orchestration.dispatchCommand({
          type: "thread.meta.update",
          commandId: newCommandId(),
          threadId,
          title: trimmedTitle,
        });
      } catch {
        // Keep current title if the rename fails.
      }

      cancelRename();
    },
    [cancelRename],
  );

  const handleThreadContextMenu = useCallback(
    async (threadId: ThreadId, position: { x: number; y: number }) => {
      const api = readNativeApi();
      if (!api) {
        return;
      }

      const thread = threads.find((candidate) => candidate.id === threadId);
      if (!thread) {
        return;
      }

      const action = await api.contextMenu.show(
        [
          { id: "rename", label: "Rename thread" },
          { id: "mark-unread", label: "Mark unread" },
          { id: "delete", label: "Delete", destructive: true },
        ],
        position,
      );

      if (action === "rename") {
        setRenamingThreadId(threadId);
        setRenamingTitle(thread.title);
        renamingCommittedRef.current = false;
        return;
      }

      if (action === "mark-unread") {
        markThreadUnread(threadId);
        return;
      }

      if (action === "delete") {
        await api.orchestration.dispatchCommand({
          type: "thread.delete",
          commandId: newCommandId(),
          threadId,
        });
      }
    },
    [markThreadUnread, threads],
  );

  const handleThreadClick = useCallback(
    (threadId: ThreadId) => {
      const thread = threads.find((candidate) => candidate.id === threadId);
      const project = projects.find((candidate) => candidate.id === thread?.projectId);

      void window.desktopBridge?.openThread?.(
        buildOpenThreadPayload({
          threadId,
          title: thread?.title ?? "Thread",
          projectName: project?.name ?? "",
          draftContext: null,
        }),
      );
    },
    [projects, threads],
  );

  const handleNewThread = useCallback(
    async (projectId: ProjectId) => {
      const project = projects.find((candidate) => candidate.id === projectId);
      const threadId = newThreadId();

      useComposerDraftStore.getState().setProjectDraftThreadId(projectId, threadId, {
        createdAt: new Date().toISOString(),
        branch: null,
        worktreePath: null,
        envMode: appSettings.defaultThreadEnvMode ?? "local",
      });

      const draft = useComposerDraftStore.getState().getDraftThread(threadId);
      await window.desktopBridge?.openThread?.(
        buildOpenThreadPayload({
          threadId,
          title: "New Thread",
          projectName: project?.name ?? "",
          draftContext: toDesktopDraftContext({
            projectId,
            draft: draft
              ? {
                  createdAt: draft.createdAt,
                  branch: draft.branch,
                  worktreePath: draft.worktreePath,
                  envMode: draft.envMode,
                  runtimeMode: draft.runtimeMode,
                  interactionMode: draft.interactionMode,
                }
              : null,
          }),
        }),
      );
    },
    [appSettings.defaultThreadEnvMode, projects],
  );

  useEffect(() => {
    return window.desktopBridge?.onMenuAction?.((action) => {
      if (action !== "new-thread") {
        return;
      }

      const firstProject = visibleProjects[0];
      if (!firstProject) {
        return;
      }

      void handleNewThread(firstProject.id);
    });
  }, [handleNewThread, visibleProjects]);

  const emptyState =
    workspaceFolders.length === 0 ? (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-center text-sm text-muted-foreground">
          Open a folder in VS Code to get started.
        </p>
      </div>
    ) : visibleProjects.length === 0 ? (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-center text-sm text-muted-foreground/50">Setting up...</p>
      </div>
    ) : null;

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden text-foreground"
      style={{ backgroundColor: "var(--vscode-sideBar-background)" }}
    >
      {emptyState ?? (
        <div className="flex flex-1 flex-col overflow-y-auto py-2">
          {visibleProjects.map((project) => (
            <div key={project.id} className="mb-1">
              <div className="flex flex-col">
                {threads
                  .filter((thread) => thread.projectId === project.id)
                  .map((thread) => {
                    const threadStatus = resolveThreadStatusPill({
                      thread,
                      hasPendingApprovals: derivePendingApprovals(thread.activities).length > 0,
                      hasPendingUserInput: derivePendingUserInputs(thread.activities).length > 0,
                    });

                    return (
                      <div
                        key={thread.id}
                        role="button"
                        tabIndex={0}
                        className="flex cursor-default items-center gap-1.5 px-4 py-1.5 text-left text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                        title={thread.title || "New Thread"}
                        onClick={() => handleThreadClick(thread.id)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          void handleThreadContextMenu(thread.id, {
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleThreadClick(thread.id);
                          }
                        }}
                      >
                        {threadStatus ? (
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 text-[10px] ${threadStatus.colorClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${threadStatus.dotClass} ${threadStatus.pulse ? "animate-pulse" : ""}`}
                            />
                            {threadStatus.label}
                          </span>
                        ) : null}

                        {renamingThreadId === thread.id ? (
                          <input
                            ref={(element) => {
                              if (!element || renamingInputRef.current === element) {
                                return;
                              }

                              renamingInputRef.current = element;
                              element.focus();
                              element.select();
                            }}
                            className="min-w-0 flex-1 truncate rounded border border-ring bg-transparent px-0.5 text-sm outline-none"
                            value={renamingTitle}
                            onBlur={() => {
                              if (!renamingCommittedRef.current) {
                                void commitRename(thread.id, renamingTitle, thread.title);
                              }
                            }}
                            onChange={(event) => setRenamingTitle(event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              event.stopPropagation();
                              if (event.key === "Enter") {
                                event.preventDefault();
                                renamingCommittedRef.current = true;
                                void commitRename(thread.id, renamingTitle, thread.title);
                                return;
                              }

                              if (event.key === "Escape") {
                                event.preventDefault();
                                renamingCommittedRef.current = true;
                                cancelRename();
                              }
                            }}
                          />
                        ) : (
                          <span className="min-w-0 flex-1 truncate">
                            {thread.title || "New Thread"}
                          </span>
                        )}

                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/50">
                          {formatRelativeTime(thread.createdAt)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
